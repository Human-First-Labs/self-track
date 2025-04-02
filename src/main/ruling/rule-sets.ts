import { RuleSet } from '../entities'
import { chromeRules } from './specific-software/chrome'
import { defaultRules } from './specific-software/default'
import { mongoDbCompassRules } from './specific-software/mongodb-compass'
import { selfTrackRules } from './specific-software/self-track'
import { vsCodeRules } from './specific-software/vscode'

export const ruleSets: RuleSet[] = [
  ...defaultRules,
  ...selfTrackRules,
  ...chromeRules,
  ...mongoDbCompassRules,
  ...vsCodeRules
]
