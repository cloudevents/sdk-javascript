# Module Release Guidelines

## `release-please`

This project uses [`release-please-action`](https://github.com/google-github-actions/release-please-action)
to manage CHANGELOG.md and automate our releases. It does so by parsing the git history, looking for
[Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) messages, and creating release PRs.

For example: https://github.com/cloudevents/sdk-javascript/pull/475

Each time a commit lands on `main`, the workflow updates the pull request to include the commit message
in CHANGELOG.md, and bump the version in package.json. When you are ready to create a new release, simply
land the pull request. This will result in a release commit, updating CHANGELOG.md and package.json, a version
tag is created on that commit SHA, and a release is drafted in github.com.

### Publish to npm

Once the new version has been created, we need to push it to npm.  Assuming you have all the rights to do so, just run:

```
npm publish
```
