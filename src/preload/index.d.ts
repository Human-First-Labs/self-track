import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI,
    api: {
      getVersion: (listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void,
      onWindowInfo: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void)
    }
  }
}
