module.exports = {
    verbose: true,
    setupFiles: ["./.src/tests/env-setup.js"],
    setupFilesAfterEnv: ['./.src/tests/test-setup.js'],
    reporters: [
        'default',
        [
            'jest-html-reporters',
            {
                publicPath: './.src/tests/report',
                filename: 'report.html',
                openReport: true,
            },
        ],
    ],
    maxWorkers: 4,
    testTimeout: 300000,
};