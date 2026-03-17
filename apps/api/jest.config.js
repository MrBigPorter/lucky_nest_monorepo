/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', 'app.controller.spec.ts'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/$1',
    '^@lucky/shared$':
      '<rootDir>/../../../node_modules/@lucky/shared/dist/index.js',
  },
};

module.exports = config;

