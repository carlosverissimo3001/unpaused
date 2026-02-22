module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@prisma/prisma\\.service$': '<rootDir>/prisma/prisma.service',
    '^@/(.*)$': '<rootDir>/$1',
    '^@auth/(.*)$': '<rootDir>/auth/$1',
    '^@redis/(.*)$': '<rootDir>/redis/$1',
    '^@transaction/(.*)$': '<rootDir>/transaction/$1',
    '^@playlists/(.*)$': '<rootDir>/playlist/$1',
    '^@game/(.*)$': '<rootDir>/game/$1',
    '^@spotify/(?!web-api-ts-sdk)(.*)$': '<rootDir>/spotify/$1',
    '^@tracks/(.*)$': '<rootDir>/track/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@throttle/(.*)$': '<rootDir>/throttle/$1',
  },
};
