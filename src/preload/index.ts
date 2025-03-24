import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { MainToRendererChannel, RendererToMainChannel } from '../main/entities'

// Custom APIs for renderer
const api = {
  // From main to render
  getVersion: (listener): void => {
    const event: MainToRendererChannel = 'app-version'
    ipcRenderer.on(event, listener)
  },
  onWindowInfo: (callback): void => {
    const event: MainToRendererChannel = 'window-info'
    ipcRenderer.on(event, callback)
  },
  startTracking: (): void => {
    const event: RendererToMainChannel = 'start-tracking'
    ipcRenderer.invoke(event)
  },
  stopTracking: (): void => {
    const event: RendererToMainChannel = 'stop-tracking'
    ipcRenderer.invoke(event)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
