module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/libs/**/?(*.)+(test).[tj]s?(x)'],
  moduleNameMapper: {
    '^chat-shim$': '<rootDir>/libs/chat-shim',
    '^chat-shim/(.*)$': '<rootDir>/libs/chat-shim/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false,
    },
  },
};
