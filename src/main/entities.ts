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
    startDate: string
    endDate: string
    duration: string
    details: string
    interactive: 'active' | 'inactive' | 'unknown'
  }[]
  totalDuration: string
  totalActiveDuration?: string
  totalInactiveDuration?: string
}

export interface FinalReportProgramActivity {
  program: string
  executable: string
  projectPeriods: FinalReportProjectActivity[]
  totalDuration: string
  totalActiveDuration?: string
  totalInactiveDuration?: string
}

export interface FinalReport {
  startDate: string
  endDate: string
  totalDuration: string
  totalActiveDuration?: string
  totalInactiveDuration?: string
  activities: FinalReportProgramActivity[]
}

export interface RuleSet {
  classNames: string[]
  os: SupportedOS
  program: string
  getProjectName: (data: ActivityPeriod) => string
  getDetails: (data: ActivityPeriod) => string
}
