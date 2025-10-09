module.exports = {
  branches: ["main", { name: "release", prerelease: "rc" }],
  repositoryUrl: "git@github.com:ApitechFR/jitsi-web-overlay-v3.git",
  tagFormat: "v${version}",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",

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
