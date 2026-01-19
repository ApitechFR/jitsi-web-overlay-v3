module.exports = {
  branches: ["main", { name: "release", prerelease: "rc" }],
  repositoryUrl: "git@github.com:ApitechFR/jitsi-web-overlay-v3.git",
  tagFormat: "v${version}",
  plugins: [

    [
      "@semantic-release/commit-analyzer",
      null
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
        },
        writerOpts: {
          headerPartial: "# Changelog\n\n",
          commitGroupsSort: "title",
          commitPartial: "* {{subject}}",
          groupBy: "type",
          commitGroupsSort: (a, b) => {
            const order = ["Features", "Bug Fixes", "BREAKING CHANGES", "Other"];
            return order.indexOf(a.title) - order.indexOf(b.title);
          },
          transform: (commit, context) => {
            let type = commit.type;
            if (type === "feat") {
              commit.groupTitle = "✨ Features";
            } else if (type === "fix") {
              commit.groupTitle = "🐛 Bug Fixes";
            } else if (commit.notes && commit.notes.length > 0) {
              commit.groupTitle = "💥 BREAKING CHANGES";
            } else {
              commit.groupTitle = "Other";
            }
            return commit;
          },
        },
      },
    ],

    // CHANGELOG.md
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],

    // artefact à uploader 
    ["@semantic-release/exec", {
      // prepareCmd: "npm run build && tar -czf jitsi-web-overlay-v3.tar.gz jitsi-web-overlay-backend/dist jitsi-web-overlay-frontend/dist"
      prepareCmd: "tar -czf jitsi-web-overlay-v3.tar.gz ."
    }],

    // Commit des fichiers générés (CHANGELOG)
    ["@semantic-release/git", {
      assets: ["CHANGELOG.md"],
      message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],

    // Release GitHub + upload de l’asset
    ["@semantic-release/github", {
      assets: ["jitsi-web-overlay-v3.tar.gz"],
      successComment: false,
      failTitle: false
    }]
  ]
};
