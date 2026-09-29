import type { FilePickerPort } from '@ysk/sdk';

export const createNullFilePicker = (): FilePickerPort => ({
  pickImage: async () => null,
});
