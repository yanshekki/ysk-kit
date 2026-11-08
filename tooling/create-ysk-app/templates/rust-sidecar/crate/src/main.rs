//! Process-local AES-256-GCM sidecar implementing the same blob as `@ysk-kit/crypto` `ICryptoPort`.
//! Not a public API. Do not bind a port, copy `application/`, or reimplement tenancy or billing.

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};

const VERSION: u8 = 1;
const IV_LEN: usize = 12;
const TAG_LEN: usize = 16;
const KEY_LEN: usize = 32;

#[derive(Deserialize)]
struct Request {
    id: String,
    op: String,
    blob: String,
}

#[derive(Serialize)]
struct Response {
    id: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    blob: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn op_failed() -> String {
    "op failed".to_string()
}

fn parse_key() -> Result<[u8; KEY_LEN], String> {
    let hex = std::env::var("CRYPTO_MASTER_KEY").map_err(|_| op_failed())?;
    if hex.len() != KEY_LEN * 2 {
        return Err(op_failed());
    }
    let mut key = [0u8; KEY_LEN];
    for (i, slot) in key.iter_mut().enumerate() {
        *slot = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16).map_err(|_| op_failed())?;
    }
    Ok(key)
}

fn encrypt(key: &[u8; KEY_LEN], plain: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| op_failed())?;
    let mut iv = [0u8; IV_LEN];
    getrandom::getrandom(&mut iv).map_err(|_| op_failed())?;
    let nonce = Nonce::from_slice(&iv);
    let out = cipher.encrypt(nonce, plain).map_err(|_| op_failed())?;
    if out.len() < TAG_LEN {
        return Err(op_failed());
    }
    let split = out.len() - TAG_LEN;
    let mut blob = Vec::with_capacity(1 + IV_LEN + out.len());
    blob.push(VERSION);
    blob.extend_from_slice(&iv);
    blob.extend_from_slice(&out[..split]);
    blob.extend_from_slice(&out[split..]);
    Ok(blob)
}

fn decrypt(key: &[u8; KEY_LEN], blob: &[u8]) -> Result<Vec<u8>, String> {
    if blob.len() < 1 + IV_LEN + TAG_LEN {
        return Err(op_failed());
    }
    if blob[0] != VERSION {
        return Err(op_failed());
    }
    let iv = &blob[1..1 + IV_LEN];
    let tag = &blob[blob.len() - TAG_LEN..];
    let ciphertext = &blob[1 + IV_LEN..blob.len() - TAG_LEN];
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| op_failed())?;
    let nonce = Nonce::from_slice(iv);
    let mut packed = Vec::with_capacity(ciphertext.len() + tag.len());
    packed.extend_from_slice(ciphertext);
    packed.extend_from_slice(tag);
    cipher.decrypt(nonce, packed.as_ref()).map_err(|_| op_failed())
}

fn handle(req: Request) -> Response {
    let fail = Response {
        id: req.id.clone(),
        ok: false,
        blob: None,
        error: Some(op_failed()),
    };
    let key = match parse_key() {
        Ok(key) => key,
        Err(_) => return fail,
    };
    let input = match STANDARD.decode(req.blob.as_bytes()) {
        Ok(bytes) => bytes,
        Err(_) => return fail,
    };
    let out = match req.op.as_str() {
        "encrypt" => encrypt(&key, &input),
        "decrypt" => decrypt(&key, &input),
        _ => return fail,
    };
    match out {
        Ok(bytes) => Response {
            id: req.id,
            ok: true,
            blob: Some(STANDARD.encode(bytes)),
            error: None,
        },
        Err(_) => fail,
    }
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    for line in stdin.lock().lines() {
        let Ok(line) = line else {
            break;
        };
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let req = match serde_json::from_str::<Request>(trimmed) {
            Ok(req) => req,
            Err(_) => continue,
        };
        let response = handle(req);
        let Ok(encoded) = serde_json::to_string(&response) else {
            continue;
        };
        if writeln!(stdout, "{encoded}").is_err() {
            break;
        }
        if stdout.flush().is_err() {
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEV_KEY: &str = "cde885415f57e9275d4dd0028074cbe3090de10d93283b344831579e076aa133";
    const GOLDEN_V1: &str =
        "01000102030405060708090a0b31c53e1b0acbd72da5887b498c6766d29eee5fb00cc4448fd3";

    fn key_from_hex(hex: &str) -> [u8; KEY_LEN] {
        let mut key = [0u8; KEY_LEN];
        for (i, slot) in key.iter_mut().enumerate() {
            *slot = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16).unwrap();
        }
        key
    }

    fn hex_decode(hex: &str) -> Vec<u8> {
        (0..hex.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
            .collect()
    }

    #[test]
    fn decrypts_node_golden_v1_blob() {
        let key = key_from_hex(DEV_KEY);
        let blob = hex_decode(GOLDEN_V1);
        let plain = decrypt(&key, &blob).expect("decrypt");
        assert_eq!(plain, b"hello ysk");
    }

    #[test]
    fn roundtrip() {
        let key = key_from_hex(DEV_KEY);
        let blob = encrypt(&key, b"hello ysk").expect("encrypt");
        assert_eq!(blob[0], VERSION);
        let plain = decrypt(&key, &blob).expect("decrypt");
        assert_eq!(plain, b"hello ysk");
    }
}
