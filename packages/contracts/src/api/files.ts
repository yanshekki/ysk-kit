import { initContract } from '@ts-rest/core';
import { PresignDtoSchema, PresignUploadCommandSchema } from '../dto/file';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const filesContract = c.router({
  presign: {
    method: 'POST',
    path: '/v1/files/presign',
    body: PresignUploadCommandSchema,
    responses: {
      201: OkSchema(PresignDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Presign an upload',
  },
});
