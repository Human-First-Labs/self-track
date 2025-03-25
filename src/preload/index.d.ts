import { ElectronAPI } from '@electron-toolkit/preload'
import {CustomAPI} from './'

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
