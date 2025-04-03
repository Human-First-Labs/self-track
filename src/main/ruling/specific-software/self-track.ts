import { RuleSet } from '../../entities'

const getDetails = (): string => {
  return ''
}

const getProjectName = (): string => {
  return ''
}

const program = 'Self Track (Me :D!)'
const className = 'self-track'

export const selfTrackRules: RuleSet[] = [
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
