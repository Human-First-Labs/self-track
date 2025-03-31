export type MainToRendererChannel = 'send-window-info' | 'send-app-version' | 'send-os'

export type RendererToMainChannel =
  | 'start-tracking'
  | 'stop-tracking'
  | 'request-version'
  | 'request-os'
  | 'open-exports-directory'