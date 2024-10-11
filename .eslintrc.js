// @ts-check
const {defineConfig} = require('eslint-define-config');
const path = require('path');

/// <reference types="@eslint-types/typescript-eslint" />

module.exports = defineConfig({
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    project: [path.resolve(__dirname, 'tsconfig.json')],
  },
  ignorePatterns: ['.*.js', 'build/', 'lib/', 'node_modules/'],
  overrides: [{files: ['*.js?(x)', '*.ts?(x)']}],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
});
