import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVersion: (listener: (event: Electron.IpcRendererEvent, version: string) => void) => void
      onWindowInfo: (
        callback: (event: Electron.IpcRendererEvent, windowInfo: ActiveWindowInfo) => void
      ) => void
      startTracking: () => void
      stopTracking: () => void
    }
  }
}
