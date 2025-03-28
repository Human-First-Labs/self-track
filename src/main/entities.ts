export type MainToRendererChannel = 'send-window-info' | 'send-app-version' | 'send-os'

export type RendererToMainChannel =
  | 'start-tracking'
  | 'stop-tracking'
  | 'request-version'
  | 'request-os'

export interface ActiveWindowInfoOnly {
  title: string
  executable?: string
  className: string
  interactive: boolean
}
export interface ActiveWindowInfo extends ActiveWindowInfoOnly {
  hash: string // This is an MD5 has made out of all the other fields in a JSON string format
}

export interface ActivityPeriod {
  id: string
  start: number
  end: number
  details: ActiveWindowInfoOnly
}

// export interface ActionReport{

// }
