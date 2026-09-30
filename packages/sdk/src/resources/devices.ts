import type { DeviceDto, RegisterDeviceCommand } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

export const devicesResource = (http: HttpClient) => ({
  list: () => http.request<DeviceDto[]>('/v1/me/devices'),
  register: (body: RegisterDeviceCommand) =>
    http.request<DeviceDto>('/v1/me/devices', { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) =>
    http.request<{ removed: true }>(`/v1/me/devices/${id}`, { method: 'DELETE' }),
});
