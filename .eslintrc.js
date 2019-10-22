module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
    "no-unused-vars": ["error", {
      args: "none",
    }],
    "no-constant-condition": ["error", {
      checkLoops: false,
    }],
    "dot-notation": "error",
    "eqeqeq": "error",
    "no-alert": "error",
    "no-shadow": "error",
    "no-var": "error",
    "sort-imports": "error",
    "prefer-template": "error",
    "prefer-const": "warn",
    "no-useless-rename": "warn",
    "arrow-spacing": "error",
  },
};
