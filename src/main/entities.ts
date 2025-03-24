export type MainToRendererChannel = 'window-info' | 'app-version'

export type RendererToMainChannel = 'start-tracking' | 'stop-tracking'

export interface ActiveWindowInfo {
  id: string //MD5 hash of all other fields apart from allData
  title: string
  executable: string
  className: string
  allData: string
}

export interface ActivityPeriod extends ActiveWindowInfo {
  start: number
  end: number
}

// export interface ActionReport{

// }
