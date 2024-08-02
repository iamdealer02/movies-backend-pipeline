module.exports = {
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      project: 'tsconfig.json',
    },
    root: true,
    env: {
      node: true,
      jest: true,
    },
    ignorePatterns: ['.eslintrc.js', 'node_modules/', 'dist/', 'logs/'],
    plugins: ['@typescript-eslint'],
    rules:{
      "@typescript-eslint/interface-name-prefix":"off",
      "@typescript-eslint/explicit-function-return-type":"error",
      "@typescript-eslint/explicit-module-boundary-types":"off",
      "@typescript-eslint/no-explicit-any":"warn",
      "@typescript-eslint/no-unused-vars":"error",
      "no-console":"warn",
      "no-restricted-syntax":[
         "error",
         "ForInStatement",
         "LabeledStatement",
         "WithStatement"
      ]
   },
  };