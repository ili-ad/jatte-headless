module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/libs/**/?(*.)+(test).[tj]s?(x)'],
  moduleNameMapper: {
    '^chat-shim$': '<rootDir>/libs/chat-shim',
    '^chat-shim/(.*)$': '<rootDir>/libs/chat-shim/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};
