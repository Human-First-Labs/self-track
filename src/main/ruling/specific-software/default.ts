import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  return info.details.title
}

const getProjectName = (): string => {
  return ''
}

const program = 'Unknown Software'

export const defaultRules: RuleSet[] = [
  {
    executableNames: [],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    executableNames: [],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
