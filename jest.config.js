module.exports = {
  projects: [
    {
      displayName: 'frontend',
      rootDir: './frontend',
      testMatch: ['<rootDir>/**/*.spec.ts', '<rootDir>/**/*.spec.tsx'],
    },
    {
      displayName: 'backend',
      rootDir: './backend',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
  ],
};
