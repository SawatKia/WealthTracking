const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
    /**
     * Select tests for shard requested via --shard=shardIndex/shardCount
     * Sharding is applied before sorting
     */
    shard(tests, { shardIndex, shardCount }) {
        const shardSize = Math.ceil(tests.length / shardCount);
        const shardStart = shardSize * (shardIndex - 1);
        const shardEnd = shardSize * shardIndex;

        return [...tests].slice(shardStart, shardEnd);
    }

    /**
     * Sort test to determine order of execution
     * Sorting is applied after sharding
     */
    sort(tests) {
        // Define test priority based on test file names
        const testPriority = {
            'users': 1,
            'bankAcc': 2,
            'debts': 3,
            'slip-verify': 4,
            'authentication': 5,
            'transaction': 6,
            'timeout': 7,
            'PgClient': 8
        };

        return [...tests].sort((testA, testB) => {
            const priorityA = Object.keys(testPriority).find(key =>
                testA.path.includes(key)
            );
            const priorityB = Object.keys(testPriority).find(key =>
                testB.path.includes(key)
            );

            return testPriority[priorityA] - testPriority[priorityB];
        });
    }
}

module.exports = CustomSequencer;
