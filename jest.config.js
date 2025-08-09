/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [`ts-jest`, { tsconfig: 'tsconfig.web.json' }]
  },
  moduleNameMapper: {
    desktopIdle:
      '<rootDir>/node_modules/node-desktop-idle-v2/prebuilds/linux-x64/node.napi.node-v127.node'
  }
}
