<?php

declare(strict_types=1);

namespace Ysk;

final class YskApiError extends \RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}

final class YskClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly ?string $token = null,
        private readonly string $platform = 'web',
    ) {
    }

    public function health(): mixed
    {
        return $this->request('GET', '/health');
    }

    public function login(string $email, string $password): mixed
    {
        return $this->request('POST', '/v1/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);
    }

    public function request(string $method, string $path, mixed $body = null, ?string $token = null): mixed
    {
        $ch = curl_init(rtrim($this->baseUrl, '/') . $path);
        if ($ch === false) {
            throw new \RuntimeException('curl_init failed');
        }
        $headers = [
            'Accept: application/json',
            'x-ysk-platform: ' . $this->platform,
        ];
        $bearer = $token ?? $this->token;
        if (is_string($bearer) && $bearer !== '') {
            $headers[] = 'Authorization: Bearer ' . $bearer;
        }
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
        ];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            $opts[CURLOPT_HTTPHEADER] = $headers;
            $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        curl_close($ch);
        if (!is_string($raw)) {
            throw new \RuntimeException('empty response');
        }
        $json = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($json)) {
            throw new \RuntimeException('invalid json');
        }
        if (($json['ok'] ?? false) === true) {
            return $json['data'] ?? null;
        }
        $error = is_array($json['error'] ?? null) ? $json['error'] : [];
        $code = is_string($error['code'] ?? null) ? $error['code'] : 'INTERNAL';
        $message = is_string($error['message'] ?? null) ? $error['message'] : 'error';
        throw new YskApiError($code, $message);
    }
}
