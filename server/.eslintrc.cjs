module.exports = {
    root: true,
    env: {
        node: true,
        es2020: true
    },
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
    ],
    ignorePatterns: ['dist', 'build', 'node_modules', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',
    },
}