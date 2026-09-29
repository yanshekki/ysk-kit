import type { FilePickerPort } from '@ysk/sdk';
import { describe, expect, it } from 'vitest';
import { createNullFilePicker } from './file-picker';

describe('file picker', () => {
  it('null adapter returns null', async () => {
    await expect(createNullFilePicker().pickImage()).resolves.toBeNull();
  });

  it('accepts a mock that returns an image', async () => {
    const picker: FilePickerPort = {
      pickImage: async () => ({ uri: 'file://x.jpg', mime: 'image/jpeg' }),
    };
    await expect(picker.pickImage()).resolves.toEqual({ uri: 'file://x.jpg', mime: 'image/jpeg' });
  });
});
