import { RuleSet } from '../../entities'

const getDetails = (): string => {
  return ''
}

const getProjectName = (): string => {
  return ''
}

const program = 'Self Track (Me :D!)'

export const selfTrackRules: RuleSet[] = [
  {
    executableNames: ['self-track'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    executableNames: ['self-track.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
