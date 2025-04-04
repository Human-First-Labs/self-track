import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  return `${info.details.title}|(${info.details.className})`
}

const getProjectName = (): string => {
  return ''
}

const program = 'Unknown Software'
const classNames = ['']

export const defaultRules: RuleSet[] = [
  {
    classNames,
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    classNames,
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
