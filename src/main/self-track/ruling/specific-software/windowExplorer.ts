import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  return info.details.title
}

const getProjectName = (): string => {
  return ''
}

const program = 'Windows Explorer'

export const windowExplorerRules: RuleSet[] = [
  {
    executableNames: ['explorer.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
