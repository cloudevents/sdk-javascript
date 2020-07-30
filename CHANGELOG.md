# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.3](https://github.com/cloudevents/sdk-javascript/compare/v2.0.2...v2.0.3) (2020-07-30)


### Miscellaneous

* **release:** add postinstall script to warn users of name change ([#293](https://github.com/cloudevents/sdk-javascript/issues/293)) ([c74ee6c](https://github.com/cloudevents/sdk-javascript/commit/c74ee6c7209a01d750afb79f44d500512d222a28))

### [2.0.2](https://github.com/cloudevents/sdk-javascript/compare/v2.0.1...v2.0.2) (2020-06-08)


### Bug Fixes

* add correct types to improve TypeScript behavior ([#202](https://github.com/cloudevents/sdk-javascript/issues/202)) ([da365e0](https://github.com/cloudevents/sdk-javascript/commit/da365e09ebcb493f63e6962800230899f1b978ad))
* fix references to constants - remove .js extension ([#200](https://github.com/cloudevents/sdk-javascript/issues/200)) ([c757a2b](https://github.com/cloudevents/sdk-javascript/commit/c757a2bce1e5432c420db7a4ae4755058964cff7))
* use /lib in gitignore so src/lib is not ignored ([#199](https://github.com/cloudevents/sdk-javascript/issues/199)) ([fba3294](https://github.com/cloudevents/sdk-javascript/commit/fba3294ce04a30be0e5ab551a1fa01727dc8d1f8))


### Documentation

* **README:** fix example typo ([#208](https://github.com/cloudevents/sdk-javascript/issues/208)) ([9857eda](https://github.com/cloudevents/sdk-javascript/commit/9857eda5ef85e64898f7c742e1ffabb714236d6a)), closes [#173](https://github.com/cloudevents/sdk-javascript/issues/173)


### Miscellaneous

* ts formatter ([#210](https://github.com/cloudevents/sdk-javascript/issues/210)) ([90782a9](https://github.com/cloudevents/sdk-javascript/commit/90782a9e17dbd293d379f0ec134cf7fb06d0f36f))

### [2.0.1](https://github.com/cloudevents/sdk-javascript/compare/v2.0.0...v2.0.1) (2020-06-01)


### Bug Fixes

* initialize CloudEvent's extensions property ([#192](https://github.com/cloudevents/sdk-javascript/issues/192)) ([0710166](https://github.com/cloudevents/sdk-javascript/commit/0710166ce9397f402b835fae745923d11357d15e))
* introduce CloudEventV1 and CloudEventV03 interfaces ([#194](https://github.com/cloudevents/sdk-javascript/issues/194)) ([a5befbe](https://github.com/cloudevents/sdk-javascript/commit/a5befbe0cf11a53e39f3ea33990b037e2f165611))


### Miscellaneous

* CI workflow to only upload report if CODACY_PROJECT_TOKEN is set ([#193](https://github.com/cloudevents/sdk-javascript/issues/193)) ([aa320e7](https://github.com/cloudevents/sdk-javascript/commit/aa320e7fe4ce59284378cdd9420c0191d6a54b39))
* minor typos in guidance docs ([#196](https://github.com/cloudevents/sdk-javascript/issues/196)) ([15cd763](https://github.com/cloudevents/sdk-javascript/commit/15cd7638da2906c7be7b550cc07ce551c2f7d1f8))

## [2.0.0](https://github.com/cloudevents/sdk-javascript/compare/v1.0.0...v2.0.0) (2020-05-27)


### ⚠ BREAKING CHANGES

* change CloudEvent to use direct object notation and get/set properties (#172)
* refactor HTTP bindings and specifications (#165)
* expose a version agnostic event emitter (#141)
* **unmarshaller:** remove asynchronous 0.3 unmarshaller API (#126)

### Features

* add ValidationError type extending TypeError ([#151](https://github.com/cloudevents/sdk-javascript/issues/151)) ([09b0c76](https://github.com/cloudevents/sdk-javascript/commit/09b0c76826657222f6dc93fa377349a62e9b628f))
* expose a mode and version agnostic event receiver ([#120](https://github.com/cloudevents/sdk-javascript/issues/120)) ([54f242b](https://github.com/cloudevents/sdk-javascript/commit/54f242b79e03dbba382f5016a1279ddf392c354f))
* expose a version agnostic event emitter ([#141](https://github.com/cloudevents/sdk-javascript/issues/141)) ([250a0a1](https://github.com/cloudevents/sdk-javascript/commit/250a0a144c5fbeac237e04dcd3f54e05dc30fc70))
* **unmarshaller:** remove asynchronous 0.3 unmarshaller API ([#126](https://github.com/cloudevents/sdk-javascript/issues/126)) ([63ae1ad](https://github.com/cloudevents/sdk-javascript/commit/63ae1ad527f0b9652222cbc7e51f7a895410a4b4))
* formatter.js es6 ([#87](https://github.com/cloudevents/sdk-javascript/issues/87)) ([c36f194](https://github.com/cloudevents/sdk-javascript/commit/c36f1949d0176574ace24fee87ce850f01f1e2f5))
* use CloudEvents not cloudevents everywhere ([#101](https://github.com/cloudevents/sdk-javascript/issues/101)) ([05ecbde](https://github.com/cloudevents/sdk-javascript/commit/05ecbdea4f594a6012ba7717f3311d0c20c2985f))


### Bug Fixes

* ensure binary events can handle no content-type header ([#134](https://github.com/cloudevents/sdk-javascript/issues/134)) ([72a87df](https://github.com/cloudevents/sdk-javascript/commit/72a87dfb2d05411f9f58b417bbc7db4233dcbbbf))
* Fix Express example installation ([#77](https://github.com/cloudevents/sdk-javascript/issues/77)) ([bb8e0f9](https://github.com/cloudevents/sdk-javascript/commit/bb8e0f9e0ca7aef00103d03f6071a648a9fab76d))
* make application/json the default content type in binary mode ([#118](https://github.com/cloudevents/sdk-javascript/issues/118)) ([d9e9ae6](https://github.com/cloudevents/sdk-javascript/commit/d9e9ae6bdcbaf80dc35d486765c9189a176be650))
* misspelled word ([#113](https://github.com/cloudevents/sdk-javascript/issues/113)) ([cd6a3ee](https://github.com/cloudevents/sdk-javascript/commit/cd6a3eec7dca4bac1e2ba9fbba9949799e6c97d8))
* misspelled word ([#115](https://github.com/cloudevents/sdk-javascript/issues/115)) ([53524ac](https://github.com/cloudevents/sdk-javascript/commit/53524acb0e18598b1376fa4485cdd2a117e892fd))
* protects the consts from being changed in other parts of the code. ([fbcbcec](https://github.com/cloudevents/sdk-javascript/commit/fbcbcec4e885618367c5cb25a8e030549dd829df))
* remove d.ts types. Fixes [#83](https://github.com/cloudevents/sdk-javascript/issues/83) ([#84](https://github.com/cloudevents/sdk-javascript/issues/84)) ([6c223e2](https://github.com/cloudevents/sdk-javascript/commit/6c223e2c34769fc0b2f2dbc58a398eb85442af92))
* support mTLS in 1.0 Binary and Structured emitters ([3a063d7](https://github.com/cloudevents/sdk-javascript/commit/3a063d72451d1156df8fe9c3499ef1e81e905060))
* throw "no cloud event detected" if one can't be read ([#139](https://github.com/cloudevents/sdk-javascript/issues/139)) ([ef7550d](https://github.com/cloudevents/sdk-javascript/commit/ef7550d60d248e1720172c0a18ae5dc21e8da5a1))


### Tests

* remove uuid require in spec_03_tests.js ([#145](https://github.com/cloudevents/sdk-javascript/issues/145)) ([c56c203](https://github.com/cloudevents/sdk-javascript/commit/c56c203d6af7b9bc1be09a82d33fdbe7aea7f331))
* use constants in spec_03_tests.js ([#144](https://github.com/cloudevents/sdk-javascript/issues/144)) ([2882aff](https://github.com/cloudevents/sdk-javascript/commit/2882affb382366654b3c7749ed274b9b74f84723))
* use header constants in receiver tests ([#131](https://github.com/cloudevents/sdk-javascript/issues/131)) ([60bf05c](https://github.com/cloudevents/sdk-javascript/commit/60bf05c8f2d4275b5432ce544982077d22b4b8ff))
* use header constants in unmarshaller tests ([#60](https://github.com/cloudevents/sdk-javascript/issues/60)) ([e087805](https://github.com/cloudevents/sdk-javascript/commit/e0878055a207154eaf040d00f778ad3854a5d7d2))


### lib

* change CloudEvent to use direct object notation and get/set properties ([#172](https://github.com/cloudevents/sdk-javascript/issues/172)) ([abc114b](https://github.com/cloudevents/sdk-javascript/commit/abc114b24e448a33d2a4f583cdc7ae191940bdca))
* refactor HTTP bindings and specifications ([#165](https://github.com/cloudevents/sdk-javascript/issues/165)) ([6f0b5ea](https://github.com/cloudevents/sdk-javascript/commit/6f0b5ea5f11ae8a451df2c46208bbd1e08ff7227))


### Documentation

* add instructions and details to contributors guide ([#105](https://github.com/cloudevents/sdk-javascript/issues/105)) ([fd99cb1](https://github.com/cloudevents/sdk-javascript/commit/fd99cb1e598bc27f0ec41755745942b0487f6905))
* add JSDocs for top level API objects ([#140](https://github.com/cloudevents/sdk-javascript/issues/140)) ([b283583](https://github.com/cloudevents/sdk-javascript/commit/b283583c0c07e6da40fac26a2b8c7dac894468dc))
* add maintainer guidelines for landing PRs ([#177](https://github.com/cloudevents/sdk-javascript/issues/177)) ([fdc79ae](https://github.com/cloudevents/sdk-javascript/commit/fdc79ae12083f989f80ec548669fc2070c69bb83))
* organize README badges and remove TS example ([#112](https://github.com/cloudevents/sdk-javascript/issues/112)) ([07323e0](https://github.com/cloudevents/sdk-javascript/commit/07323e078fdd60814ed61a65d6756e23cf523400))
* remove 0.1, 0.2 spec support from README ([56036b0](https://github.com/cloudevents/sdk-javascript/commit/56036b09ddfeb00d19678e118ea5f742b88cdfc7))
* remove repo structure docs ([#111](https://github.com/cloudevents/sdk-javascript/issues/111)) ([223a7c6](https://github.com/cloudevents/sdk-javascript/commit/223a7c6f03732fa4dc91c0af78adfcc4c026e7c8))
* update README and examples with new API ([#138](https://github.com/cloudevents/sdk-javascript/issues/138)) ([b866edd](https://github.com/cloudevents/sdk-javascript/commit/b866edddd9593b5456981f1f5613225b8335ec05))


### Miscellaneous

* add action to detect and close stale issues ([5a6cde5](https://github.com/cloudevents/sdk-javascript/commit/5a6cde5695049403c7f614c42067511908b54ffc))
* add coverage GitHub action ([#185](https://github.com/cloudevents/sdk-javascript/issues/185)) ([349fe8e](https://github.com/cloudevents/sdk-javascript/commit/349fe8e9bd3da711ab5c8221932d1bc5f551a1da))
* add eslint configuration and npm script ([3f238a0](https://github.com/cloudevents/sdk-javascript/commit/3f238a01248aba54b0208aaaa54b66cf2f54a749))
* add GitHub action for CI on master and prs ([#181](https://github.com/cloudevents/sdk-javascript/issues/181)) ([0fe57d1](https://github.com/cloudevents/sdk-javascript/commit/0fe57d123ac01458a6fa50752caf0071ed2571f6))
* add npm fix command ([#74](https://github.com/cloudevents/sdk-javascript/issues/74)) ([005d532](https://github.com/cloudevents/sdk-javascript/commit/005d5327e49cd271fe84382d18df7019dc3f73ad))
* add standard-version and release script ([f47bca4](https://github.com/cloudevents/sdk-javascript/commit/f47bca4ff0ca93dc83a927bb9ee4818e317a5e75))
* adds files section in package.json ([#147](https://github.com/cloudevents/sdk-javascript/issues/147)) ([f8a62b2](https://github.com/cloudevents/sdk-javascript/commit/f8a62b2843b12fe894201670770a00c034ab701d))
* es6 base64 parser ([#75](https://github.com/cloudevents/sdk-javascript/issues/75)) ([d042ef1](https://github.com/cloudevents/sdk-javascript/commit/d042ef1dbb555e2500036716d4170661dc48fe3e))
* es6 parser ([#98](https://github.com/cloudevents/sdk-javascript/issues/98)) ([cd6decd](https://github.com/cloudevents/sdk-javascript/commit/cd6decd74904888557bfc53045c87efe630fb88c))
* es6 unmarshaller ([#108](https://github.com/cloudevents/sdk-javascript/issues/108)) ([79ec3ef](https://github.com/cloudevents/sdk-javascript/commit/79ec3ef126a46afbd3217dfdb969b00f20e38f56))
* fix CI code coverage publishing ([#78](https://github.com/cloudevents/sdk-javascript/issues/78)) ([8fb0ddf](https://github.com/cloudevents/sdk-javascript/commit/8fb0ddf6eb0dd05b0728444f404e1014a9348599))
* Modify CI to also build backport branch(es) ([#122](https://github.com/cloudevents/sdk-javascript/issues/122)) ([c1fda94](https://github.com/cloudevents/sdk-javascript/commit/c1fda94d25f84db097e75177b166c3f18f707dda))
* remove note with bad link and non SDK docs ([#109](https://github.com/cloudevents/sdk-javascript/issues/109)) ([f30c814](https://github.com/cloudevents/sdk-javascript/commit/f30c814a09896d31f821ebe5eb5ba95cd264d699))
* update eslint rules to disallow var usage ([e83db29](https://github.com/cloudevents/sdk-javascript/commit/e83db297ae5761248d0c34a9d440e6a4285a645d))
* Update uuid dependency ([42246ce](https://github.com/cloudevents/sdk-javascript/commit/42246ce36b9898eea1d5daa5f43ddb13ee6b12d0))
* use es6 for cloudevents.js ([#73](https://github.com/cloudevents/sdk-javascript/issues/73)) ([12ac181](https://github.com/cloudevents/sdk-javascript/commit/12ac1813005d1c88e86c6fc9de675516dd3e290c))

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
