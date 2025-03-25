export type MainToRendererChannel = 'send-window-info' | 'send-app-version' | 'send-os'

export type RendererToMainChannel =
  | 'start-tracking'
  | 'stop-tracking'
  | 'request-version'
  | 'request-os'

export interface ActiveWindowInfo {
  id: string //MD5 hash of all other fields apart from allData
  title: string
  executable: string
  className: string
  allData?: string
}

export interface ActivityPeriod extends ActiveWindowInfo {
  start: number
  end: number
}

// export interface ActionReport{

// }
