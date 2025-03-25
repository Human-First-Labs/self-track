import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ActiveWindowInfo, MainToRendererChannel, RendererToMainChannel } from '../main/entities'

export type CustomAPI = {
  //Renderer to Main
  startTracking: () => void
  stopTracking: () => void
  requestVersion: () => void
  requestOs: () => void
  //Main To Renderer
  sendWindowInfo: (
    callback: (event: Electron.IpcRendererEvent, windowInfo: ActiveWindowInfo) => void
  ) => void
  sendVersion: (callback: (event: Electron.IpcRendererEvent, version: string) => void) => void
  sendOS: (callback: (event: Electron.IpcRendererEvent, os: string) => void) => void
}

// Custom APIs for renderer
const api: CustomAPI = {
  // From renderer to main
  startTracking: (): void => {
    const event: RendererToMainChannel = 'start-tracking'
    ipcRenderer.invoke(event)
  },
  stopTracking: (): void => {
    const event: RendererToMainChannel = 'stop-tracking'
    ipcRenderer.invoke(event)
  },
  requestVersion: (): void => {
    const event: RendererToMainChannel = 'request-version'
    ipcRenderer.invoke(event)
  },
  requestOs: (): void => {
    const event: RendererToMainChannel = 'request-os'
    ipcRenderer.invoke(event)
  },
  // From main to render
  sendWindowInfo: (callback): void => {
    const event: MainToRendererChannel = 'send-window-info'
    ipcRenderer.on(event, callback)
  },
  sendOS: (callback): void => {
    const event: MainToRendererChannel = 'send-os'
    ipcRenderer.on(event, callback)
  },
  sendVersion: (callback): void => {
    const event: MainToRendererChannel = 'send-app-version'
    ipcRenderer.on(event, callback)
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
