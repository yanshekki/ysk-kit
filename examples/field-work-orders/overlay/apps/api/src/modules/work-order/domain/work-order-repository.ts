import type {
  CreateWorkOrderCommand,
  PageQuery,
  PaginatedWorkOrder,
  WorkOrderDto,
  WorkOrderStatus,
} from '@ysk-kit/contracts';

export type WorkOrderRecord = {
  id: string;
  title: string;
  address: string;
  status: WorkOrderStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IWorkOrderRepository {
  create(authorId: string, input: CreateWorkOrderCommand): Promise<WorkOrderDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedWorkOrder>;
  getById(id: string): Promise<WorkOrderRecord | null>;
  updateStatus(id: string, status: WorkOrderStatus): Promise<WorkOrderDto>;
}
