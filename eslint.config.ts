import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Files and directories to ignore entirely
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/generated/**',
      'coverage/**',
      'cypress/**',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // React flat/recommended (ESLint 10 compatible)
  // @ts-expect-error — flat config types not fully typed in this plugin version
  reactPlugin.configs.flat.recommended,
  // @ts-expect-error — flat config types not fully typed in this plugin version
  reactPlugin.configs.flat['jsx-runtime'],

  // TypeScript + React-specific rules
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Hooks
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript covers prop validation — disable the React-only version
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // React Compiler rules — demote from error to warn until violations are
      // fixed and the compiler is actually enabled.
      // See docs/product/decisions/react-compiler.md in the-brain repo.
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',

      // TypeScript — warn rather than error for a realistic first-run baseline
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Disable all rules that conflict with Prettier formatting
  prettierConfig,
)
