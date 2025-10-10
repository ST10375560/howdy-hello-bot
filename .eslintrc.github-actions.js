module.exports = {
  extends: [
    '@eslint/js/recommended',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  rules: {
    // Disable fast refresh warnings for GitHub Actions
    'react-refresh/only-export-components': 'off',
    
    // Allow any types in test files
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Allow missing dependencies in useEffect for now
    'react-hooks/exhaustive-deps': 'warn',
    
    // Disable some strict rules for demo purposes
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    
    // Disable interface rules
    '@typescript-eslint/no-empty-interface': 'off',
    
    // Allow any type usage
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    
    // Disable script URL warnings
    'no-script-url': 'off',
    
    // Disable unnecessary escape warnings
    'no-useless-escape': 'off',
    
    // Allow any types everywhere
    '@typescript-eslint/no-explicit-any': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
