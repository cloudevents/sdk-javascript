# Module Release Guidelines

## Create a Proposal Issue

To prepare for a new release, create a [new issue](https://github.com/cloudevents/sdk-javascript/issues/new?assignees=&labels=&template=feature-request.md&title=) where the title of the issue cleary reflects the version to be released.

For example: "Proposal for 3.2.0 release", or something similar.  If you are not sure which version is the next version to be released, you can run `npm run release -- --dry-run` to find out what the next version will be.

The body of the issue should be the commits that will be part of the release.  This can be easily accomplished by running a git log command with a defined **range**.  This range should start at the most recent version tag and end at the latest commit in the master branch.

For example:

```
git log v3.0.1..upstream/master --oneline
```

This will output all the commits from the 3.0.1 tag to the latest commits in the remote upstream/master branch.

This output should be pasted into the issue as normal text.  This will allow Github to magically turn all commit hashes and PR/Issues numbers to links.

### Get Consensus

Before a release can be finalized, other maintainers should give a +1 or a thumbs up or some other identifying mark that they are good with the changes.

## Create and Publish the release

Once consensus has been reached on the proposal it is time to create the release and publish it to npm.

### Create the Release

Creating the release is as simple as running the release script:

```
npm run release
```

This will update the CHANGELOG.md and create a new tag based on the version.  This can then be pushed upstream by doing:

```
git push upstream master --follow-tags
```

### Create the release on GitHub

Once the release tag has been created and pushed up to Github, we should draft a new release using the Github UI, which is [located here](https://github.com/cloudevents/sdk-javascript/releases/new)

* Tag Version should be the tag that was just created
* The release title should be something like "VERSION Release"
* And the Changelog entries for the current release should be copied/pasted into the comments


### Publish to npm

Once the new version has been created, we need to push it to npm.  Assuming you have all the rights to do so, just run:

```
npm publish
```

## Close the Issue

Once the release has been completed, the issue can be closed.
