
const { compilerOptions } = require('./electron/tsconfig')

export default {
	testEnvironment: 'node',
	modulePaths: [compilerOptions.baseUrl],
	testMatch: ["<rootDir>/build_electron/test/**/*.test.js"],
	haste: {
		enableSymlinks: false,
		providesModuleNodeModules: []
	}
};
