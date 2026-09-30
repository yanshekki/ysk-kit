import type { PresignDto, PresignUploadCommand } from '@ysk-kit/contracts';
import type { IStoragePort } from '@ysk-kit/storage';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';

export type FileMeta = {
  id: string;
  ownerId: string;
  key: string;
  mime: string;
  byteSize: number;
};

export interface IFileRepository {
  create(input: Omit<FileMeta, 'id'>): Promise<FileMeta>;
}

export const createFileService = (
  files: IFileRepository,
  storage: IStoragePort,
  audit: IAuditLogger,
) => ({
  presign: async (ownerId: string, body: PresignUploadCommand): Promise<PresignDto> => {
    const id = crypto.randomUUID();
    const key = `${ownerId}/${id}/${body.filename}`;
    const file = await files.create({
      ownerId,
      key,
      mime: body.mime,
      byteSize: body.byteSize,
    });
    const signed = await storage.presignPut({ key, mime: body.mime, byteSize: body.byteSize });
    await audit.record({
      actorId: ownerId,
      action: 'file.upload',
      resourceType: 'file',
      resourceId: file.id,
    });
    return { fileId: file.id, uploadUrl: signed.url, headers: signed.headers };
  },
});

export type FileService = ReturnType<typeof createFileService>;
