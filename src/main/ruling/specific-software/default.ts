import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  return `${info.details.title}|(${info.details.className})`
}

const getProjectName = (): string => {
  return ''
}

const program = 'Unknown Software'
const className = ''

export const defaultRules: RuleSet[] = [
  {
    className,
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    className,
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
