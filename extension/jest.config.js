/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json", diagnostics: false }],
  },
  // The Azure DevOps packages are AMD bundles and Monaco is ESM-only, so none load under Jest.
  moduleNameMapper: {
    "^azure-devops-extension-api$": "<rootDir>/tests/mocks/azureDevOpsApi.ts",
    "^azure-devops-extension-api/WorkItemTracking(/WorkItemTracking)?$": "<rootDir>/tests/mocks/workItemTracking.ts",
    "^azure-devops-extension-api/Core$": "<rootDir>/tests/mocks/core.ts",
    "^azure-devops-extension-api/WebApi$": "<rootDir>/tests/mocks/webApi.ts",
    "^azure-devops-extension-sdk$": "<rootDir>/tests/mocks/sdk.ts",
    "^monaco-editor$": "<rootDir>/tests/mocks/monaco.ts",
  },
  clearMocks: true,
  collectCoverageFrom: [
    "scripts/**/*.{ts,tsx}",
    "!scripts/wiqlEditor/compiler/wiqlTable.ts",
    "!scripts/wiqlPlayground/**",
    "!scripts/queryEditor/queryEditor.ts",
    "!scripts/queryContext/**",
    "!scripts/**/*.d.ts",
  ],
};
