export interface IOtpSender {
  send(phone: string, code: string): Promise<void>;
}
