/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  // Use ts-jest preset to handle TypeScript files
  preset: 'ts-jest',

  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@models/(.*)\\.js$": "<rootDir>/../models/$1.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|universal-user-agent)/)', // Add other ESM modules here if needed
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  roots: ["<rootDir>/tests"],

  setupFiles: ['<rootDir>/jest.setup.ts'],

};