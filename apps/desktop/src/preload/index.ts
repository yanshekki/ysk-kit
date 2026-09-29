import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('yskDesktop', {
  token: {
    get: () => ipcRenderer.invoke('ysk:token:get') as Promise<string | null>,
    set: (token: string) => ipcRenderer.invoke('ysk:token:set', token) as Promise<void>,
    getRefresh: () => ipcRenderer.invoke('ysk:token:getRefresh') as Promise<string | null>,
    setPair: (access: string, refresh: string) =>
      ipcRenderer.invoke('ysk:token:setPair', access, refresh) as Promise<void>,
    clear: () => ipcRenderer.invoke('ysk:token:clear') as Promise<void>,
  },
});
