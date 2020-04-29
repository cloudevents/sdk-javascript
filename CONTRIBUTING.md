# Contributing to CloudEvents' JavaScript SDK

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

Following you will see some guidelines about how to contribute with
JavaScript SDK.

## Branch Management

We use Gitflow to manage our branches and that's ok when `develop` branch is
ahead of `master`.

- [Gitflow](https://nvie.com/posts/a-successful-git-branching-model/) by @nvie

## Changelog

The [CHANGELOG.md](./CHANGELOG.md) will be updated with your commits if you format
your commit messages following the
[Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#summary).
If you are unsure what prefix to use for a commit, you can consult the
[package.json](https://github.com/cloudevents/sdk-javascript/blob/master/package.json) file
in this repository. In the `standard-version.types` section, you can see all of the commit
types that will be committed to the changelog based on the prefix in the first line of
your commit message. For example, the commit message:

```log
fix: removed a bug that was causing the rotation of the earth to change
```

will show up in the "Bug Fixes" section of the changelog for a given release.

## Pull Requests

Guidelines about how to perform pull requests.

- before submit the PR, open an issue and link them

### Commit Messages

Please follow the Conventional Commits specification noted above. the first line of
your commit should be prefixed with a type, be a single sentence with no period, and
succinctly indicate what this commit changes.

All commit message lines should be kept to fewer than 80 characters if possible.

### PR to `develop`

- fixes in the documentation (readme, contributors)
- propose new files for the documentation
- implementation of new features

### PR to `master`

- hot fixes

## Style Guide

_TODO_

### JavaScript Style Guide

_TODO_
