module.exports = {
    testEnvironment: 'node',
    verbose: true,
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
    // Set timeout to 5 minutes (300000 milliseconds)
    testTimeout: 300000,
    testSequencer: './.src/tests/custom-sequencer.js',
}; 