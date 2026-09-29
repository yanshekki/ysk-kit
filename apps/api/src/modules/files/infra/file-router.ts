import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type PresignUploadCommand } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { FileService } from '../application/file-service';

export const fileHandlers = (files: FileService): Record<string, HttpHandler> => ({
  presign: {
    auth: 'required',
    permission: 'file.upload',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 201,
        body: { ok: true, data: await files.presign(auth.sub, body as PresignUploadCommand) },
      };
    },
  },
});

export const registerFileRoutes = (app: Express, files: FileService): void => {
  mountContract(app, appContract.files, fileHandlers(files));
};
