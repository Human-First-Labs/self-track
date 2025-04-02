import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  return `${info.details.title}|(${info.details.className})`
}

const getProjectName = (): string => {
  return ''
}

const title = 'Unknown Software'
const className = ''

export const defaultRules: RuleSet[] = [
  {
    className,
    os: 'linux',
    getDetails,
    getProjectName,
    title
  },
  {
    className,
    os: 'win32',
    getDetails,
    getProjectName,
    title
  }
]
