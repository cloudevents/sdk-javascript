# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

### Fixed

- Support for mTLS in v1.0 Binary and Structured Emitters: issue [#48](https://github.com/cloudevents/sdk-javascript/issues/48). Note that this fix is only valid for v1.0 and does not address the problem in v0.3 and below.

### Removed

- Removed support for Node.js 6, 7 and 8 - all of which are EOL at this point. Travis CI modified to test on Node.js 10 and 12.

### Added

- Added support for standard-version and conventional-changelog

## [1.0.0]

### Added

- Support for [Spec v1.0](https://github.com/cloudevents/spec/tree/v1.0)
- Typescript types for Spec v1.0: [see an example](./examples/typescript-ex)

### Removed

- Unmarshaller docs from README, moving them to [OLDOCS.md](./OLDOCS.md)

## [0.3.2]

### Fixed

- Fix the special `data` handling: issue
[#33](https://github.com/cloudevents/sdk-javascript/issues/33)

## [0.3.1]

### Fixed

- Axios version to `0.18.1` due the CVE-2019-10742
- Fix the `subject` attribute unmarshal error: issue
[#32](https://github.com/cloudevents/sdk-javascript/issues/32)

[Unreleased]: https://github.com/cloudevents/sdk-javascript/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.2...v1.0.0
[0.3.2]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.0...v0.3.1
