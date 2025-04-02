export type SupportedOS = 'win32' | 'linux'
export const SupportedOSList: SupportedOS[] = ['win32', 'linux']

export interface ActiveWindowInfoOnly {
  title: string
  executable?: string
  className: string
  interactive: 'active' | 'inactive' | 'unknown'
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

export interface FinalReportProjectActivity {
  project: string
  periods: {
    start: number
    end: number
    duration: number
    details: string
    interactive: 'active' | 'inactive' | 'unknown'
  }[]
  totalDuration: number
}

export interface FinalReportProgramActivity {
  program: string
  executable: string
  projectPeriods: FinalReportProjectActivity[]
  totalDuration: number
}

export interface FinalReport {
  start: number
  end: number
  duration: number
  activities: FinalReportProgramActivity[]
}

export interface RuleSet {
  className: string
  os: SupportedOS
  title: string
  getProjectName: (data: ActivityPeriod) => string
  getDetails: (data: ActivityPeriod) => string
}
