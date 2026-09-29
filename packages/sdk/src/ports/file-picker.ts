export interface FilePickerPort {
  pickImage(): Promise<{ uri: string; mime: string } | null>;
}
