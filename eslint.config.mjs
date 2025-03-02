import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginTS from '@typescript-eslint/eslint-plugin';

export default [
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		languageOptions: {
			parserOptions: {
				ecmaVersion: 'latest',
			},
			// Use Node globals since Electron's main process is Node
			globals: {
				...globals.node,
			},
		},
		env: {
			node: true,
		},
		plugins: {
			'@typescript-eslint': eslintPluginTS,
		},
		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'require-await': 'error',
		},
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
];
