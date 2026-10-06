import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const WorkOrderStatus = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  DONE: 'DONE',
} as const;

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];
export const WORK_ORDER_STATUS_VALUES = Object.values(WorkOrderStatus) as [
  WorkOrderStatus,
  ...WorkOrderStatus[],
];
export const WorkOrderStatusSchema = z.enum(WORK_ORDER_STATUS_VALUES);

export const WorkOrderDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  address: z.string().min(1).max(200),
  status: WorkOrderStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type WorkOrderDto = z.infer<typeof WorkOrderDtoSchema>;

export const PaginatedWorkOrderSchema = PaginatedSchema(WorkOrderDtoSchema);
export type PaginatedWorkOrder = z.infer<typeof PaginatedWorkOrderSchema>;

export const CreateWorkOrderCommandSchema = z.object({
  title: z.string().min(1).max(80),
  address: z.string().min(1).max(200),
});
export type CreateWorkOrderCommand = z.infer<typeof CreateWorkOrderCommandSchema>;
