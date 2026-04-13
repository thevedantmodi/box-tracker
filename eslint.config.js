import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
	{ignores: ['dist', 'node_modules', '**/.expo/**', 'build', 'web-build']},
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'react/react-in-jsx-scope': 'off',
			...reactHooks.configs.recommended.rules,
		},
	}
)
