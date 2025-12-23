module.exports = {
    branches: ['dev', 'main', 'master'],
    tagFormat: 'outlook-plugin-v${version}',
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'angular',
                releaseRules: [
                    { type: 'feat', scope: 'plugin', release: 'minor' },
                    { type: 'fix', scope: 'plugin', release: 'patch' },
                    { type: 'BREAKING CHANGE', scope: 'plugin', release: 'major' },
                ],
                parserOpts: {
                    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
                },
            },
        ],
        [
            '@semantic-release/release-notes-generator',
            {
                preset: 'angular',
                parserOpts: {
                    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
                },
                writerOpts: {
                    headerPartial: '# Changelog\n\n',
                    commitGroupsSort: 'title',
                    commitPartial: '* {{subject}}',
                    groupBy: 'type',
                    commitGroupsSort: (a, b) => {
                        const order = ['Features', 'Bug Fixes', 'BREAKING CHANGES', 'Other'];
                        return order.indexOf(a.title) - order.indexOf(b.title);
                    },
                    transform: (commit, context) => {
                        let type = commit.type;
                        if (type === 'feat') {
                            commit.groupTitle = '✨ Features';
                        } else if (type === 'fix') {
                            commit.groupTitle = '🐛 Bug Fixes';
                        } else if (commit.notes && commit.notes.length > 0) {
                            commit.groupTitle = '💥 BREAKING CHANGES';
                        } else {
                            commit.groupTitle = 'Other';
                        }
                        return commit;
                    },
                },
            },
        ],
        '@semantic-release/changelog',
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
            },
        ],
        '@semantic-release/git',
        '@semantic-release/github',
    ],
};
