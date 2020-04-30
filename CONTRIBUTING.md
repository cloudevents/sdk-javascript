# Contributing to CloudEvents' JavaScript SDK

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

We welcome contributions from the community! Please take some time to become
acquainted with the process before submitting a pull request.

## Pull Requests

When creating a pull request, first fork this repository and clone it to your
local development environment. Then add this repository as the upstream.

```console
git clone https://github.com/mygithuborg/sdk-javascript.git
cd sdk-javascript
git remote add upstream https://github.com/cloudevents/sdk-javascript.git
```

Typically a pull request should relate to an existing issue. If you have
found a bug, want to add an improvement, or suggest an API change, please
create an issue before proceeding with a pull request. For very minor changes
such as typos in the documentation this isn't really necessary.

Create a branch for your work. If you are submitting a pull request that
fixes or relates to an existing GitHub issue, you can use this in your
branch name to keep things organized. For example, if you were to create
a pull request to fix
[this error with `httpAgent`](https://github.com/cloudevents/sdk-javascript/issues/48)
you might create a branch named `48-fix-http-agent-error`.

```console
git fetch upstream
git reset --hard upstream/master
git checkout -b 48-fix-http-agent-error
```

As you are working on your branch, changes may happen on `master`. Before
submitting your pull request, be sure that your branch has been updated
with the latest commits on `master`.

```console
git rebase upstream/master
```

This may cause conflicts if the files you are changing on your branch are
also changed on master. Follow the `git` error messages to resolve these.
If you've already pushed some changes to your `origin` fork, you'll
need to force push these changes.

```console
git push -f origin 48-fix-http-agent-error
```

Once you have submitted your pull request, `master` may continue to evolve
before your pull request has landed. If there are any commits on `master`
that conflict with your changes, you may need to update your branch with
these changes before the pull request can land.

```console
git fetch upstream
git rebase upstream/master
# fix any potential conflicts
git push -f origin 48-fix-http-agent-error
```

This will cause the pull request to be updated with your changes, and
CI will rerun.

### Updating Your Pull Request

A maintainer may ask you to make changes to your pull request. Sometimes these
changes are minor and shouldn't appear in the commit log. For example, you may
have a typo in one of your code comments that should be fixed before merge.
You can prevent this from adding noise to the commit log with an interactive
rebase. See the [git documentation](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
for details.

```console
git commit -m "fixup: fix typo"
git rebase -i upstream/master # follow git instructions
```

Once you have rebased your commits, you can force push to your fork as before.
In most cases, there should only be a single commit in a pull request.

**NB: Be sure you have run all tests before submitting your pull request.**

### Commit Messages

Please follow the
[Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#summary).
The first line of your commit should be prefixed with a type, be a single
sentence with no period, and succinctly indicate what this commit changes.

All commit message lines should be kept to fewer than 80 characters if possible.

An example of a good commit message.

```log
docs: remove 0.1, 0.2 spec support from README
```

### Sign your work

Each PR must be signed. TLDR; use the `--signoff` flag for your commits.

```console
git commit --signoff
```

The sign-off is a signature line at the end of your commit message. Your
signature certifies that you wrote the patch or otherwise have the right to pass
it on as open-source code. The rules are pretty simple: if you can certify
the below (from [developercertificate.org](http://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

Then you just add a line to every git commit message:

    Signed-off-by: Joe Smith <joe.smith@email.com>

Use your real name (sorry, no pseudonyms or anonymous contributions.)

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.

Note: If your git config information is set properly then viewing the `git log`
information for your commit will look something like this:

```
Author: Joe Smith <joe.smith@email.com>
Date:   Thu Feb 2 11:41:15 2018 -0800

    Update README

    Signed-off-by: Joe Smith <joe.smith@email.com>
```

Notice the `Author` and `Signed-off-by` lines match. If they don't your PR will
be rejected by the automated DCO check.


## Style Guide

Code style for this module is maintained using [`eslint`](https://www.npmjs.com/package/eslint).
When you run tests with `npm test` linting is performed first. If you want to
check your code style for linting errors without running tests, you can just
run `npm run lint`. If there are errors, you can usually fix them automatically
by running `npm run fix`.

Linting rules are declared in [.eslintrc](https://github.com/cloudevents/sdk-javascript/blob/master/.eslintrc).

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

## Maintainer's Guide

Here are a few tips for repository maintainers.

* Stay on top of your pull requests. PRs that languish for too long can become difficult to merge.
* Work from your own fork. As you are making contributions to the project, you should be working from your own fork just as outside contributors do. This keeps the branches in github to a minimum and reduces unnecessary CI runs.
* Try to proactively label issues with backport labels if it's obvious that a change should be backported to previous releases.
* When landing pull requests, if there is more than one commit, try to squash into a single commit. Usually this can just be done with the GitHub UI when merging the PR. Use "Squash and merge".
* Triage issues once in a while in order to keep the repository alive. During the triage:
  * If some issues are stale for too long because they are no longer valid/relevant or because the discussion reached no significant action items to perform, close them and invite the users to reopen if they need it.
  * If some PRs are no longer valid but still needed, ask the user to rebase them
  * If some issues and PRs are still relevant, use labels to help organize tasks
  * If you find an issue that you want to create a fix for and submit a pull request, be sure to assign it to yourself so that others maintainers don't start working on it at the same time.

### Branch Management

The `master` branch is is the bleeding edge. New major versions of the module
are cut from this branch and tagged. If you intend to submit a pull request
you should use `master HEAD` as your starting point.

Each major release will result in a new branch and tag. For example, the
release of version 1.0.0 of the module will result in a `v1.0.0` tag on the
release commit, and a new branch `v1.x.y` for subsequent minor and patch
level releases of that major version. However, development will continue
apace on `master` for the next major version - e.g. 2.0.0. Version branches
are only created for each major version. Minor and patch level releases
are simply tagged.

