import type { FilePickerPort } from '@ysk-kit/sdk';

export const createNullFilePicker = (): FilePickerPort => ({
  pickImage: async () => null,
});
