# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [10.0.0](https://github.com/cloudevents/sdk-javascript/compare/v9.0.0...v10.0.0) (2025-06-05)


### ⚠ BREAKING CHANGES

* remove Node 18 support ([#616](https://github.com/cloudevents/sdk-javascript/issues/616))

### Features

* add node 24 support ([#614](https://github.com/cloudevents/sdk-javascript/issues/614)) ([beac735](https://github.com/cloudevents/sdk-javascript/commit/beac7356a789944cf4a8d76d2508fa6d7c5bcf7e))
* remove Node 18 support ([#616](https://github.com/cloudevents/sdk-javascript/issues/616)) ([3c8819e](https://github.com/cloudevents/sdk-javascript/commit/3c8819e2bcf97fe7b352b2a004d511965a4cc414))

## [9.0.0](https://github.com/cloudevents/sdk-javascript/compare/v8.0.3...v9.0.0) (2025-04-03)


### ⚠ BREAKING CHANGES

* remove node 16 ([#610](https://github.com/cloudevents/sdk-javascript/issues/610))

### Features

* remove node 16 ([#610](https://github.com/cloudevents/sdk-javascript/issues/610)) ([3ff6fdd](https://github.com/cloudevents/sdk-javascript/commit/3ff6fdd3bf1a9d77be9cd1d1ed589de47a86f7c1))

## [8.0.3](https://github.com/cloudevents/sdk-javascript/compare/v8.0.2...v8.0.3) (2025-04-02)


### Bug Fixes

* add generics to `Binding` type ([#604](https://github.com/cloudevents/sdk-javascript/issues/604)) ([f475cdf](https://github.com/cloudevents/sdk-javascript/commit/f475cdfd7ee7e80a375b997ba2f41b1655a44a03))

## [8.0.2](https://github.com/cloudevents/sdk-javascript/compare/v8.0.1...v8.0.2) (2024-07-22)


### Bug Fixes

* creating an event does not error when the event attribute name is too long ([#593](https://github.com/cloudevents/sdk-javascript/issues/593)) ([6977113](https://github.com/cloudevents/sdk-javascript/commit/6977113d7b49bd2b702632cc09e29cc0c003e2a1))

## [8.0.1](https://github.com/cloudevents/sdk-javascript/compare/v8.0.0...v8.0.1) (2024-06-12)


### Bug Fixes

* allow Node 22 and use it by default ([#587](https://github.com/cloudevents/sdk-javascript/issues/587)) ([e762607](https://github.com/cloudevents/sdk-javascript/commit/e7626077ed22b2bcbfa71b0403a58ac187c57cba))


### Miscellaneous

* Update compatible node version ([#573](https://github.com/cloudevents/sdk-javascript/issues/573)) ([245bae9](https://github.com/cloudevents/sdk-javascript/commit/245bae92d1c84b4a44fe7aae2f82c5a90818f1c5))
* updated check mark symbol to show some green checkboxes ([#582](https://github.com/cloudevents/sdk-javascript/issues/582)) ([c65afe9](https://github.com/cloudevents/sdk-javascript/commit/c65afe94d2320eae9b8b74de9b1e1bd8793baa6a))

## [8.0.0](https://github.com/cloudevents/sdk-javascript/compare/v7.0.2...v8.0.0) (2023-07-24)

### ⚠ BREAKING CHANGES

* use string instead of enum for Version ([#561](https://github.com/cloudevents/sdk-javascript/issues/561)) ([15f6505](https://github.com/cloudevents/sdk-javascript/commit/15f6505a580b2bbf8d6b2e89feea10cbd40ab827))
TypeScript does not consider enum values equivalent, even if the string
representation is the same. So, when a module imports `cloudevents` and
also has a dependency on `cloudevents` this can cause conflicts where
the `CloudEvent.version` attribute is not considered equal when, in
fact, it is.

### Miscellaneous

* add `npm run build:schema` to the doc generation action ([#557](https://github.com/cloudevents/sdk-javascript/issues/557)) ([fa388f7](https://github.com/cloudevents/sdk-javascript/commit/fa388f7dc65c1739864d7a885d6d28111ce07775))
* modify release-please to use Signed-Off-By on commits ([#559](https://github.com/cloudevents/sdk-javascript/issues/559)) ([089520a](https://github.com/cloudevents/sdk-javascript/commit/089520a4cc8304e39ac9bfccf0ed59c76ea8c11a))
* release 8.0.0 ([#563](https://github.com/cloudevents/sdk-javascript/issues/563)) ([1ed43c8](https://github.com/cloudevents/sdk-javascript/commit/1ed43c84868ccfd18531deaf6cc9d4e4fcb21a08))

## [7.0.2](https://github.com/cloudevents/sdk-javascript/compare/v7.0.1...v7.0.2) (2023-07-05)


### Miscellaneous

* add the provenance flag when publishing to npm ([#556](https://github.com/cloudevents/sdk-javascript/issues/556)) ([a0d8682](https://github.com/cloudevents/sdk-javascript/commit/a0d86826138be31072c9a30edf26f4b91da576ed))
* fix the release-please automation script. ([#554](https://github.com/cloudevents/sdk-javascript/issues/554)) ([023171d](https://github.com/cloudevents/sdk-javascript/commit/023171d9a08484c32e24f8228602ef4d5173c749))

## [7.0.1](https://github.com/cloudevents/sdk-javascript/compare/v7.0.0...v7.0.1) (2023-05-30)


### Bug Fixes

* handle big integers in incoming events ([#495](https://github.com/cloudevents/sdk-javascript/issues/495)) ([43c3584](https://github.com/cloudevents/sdk-javascript/commit/43c3584b984aa170b1c1c4dff7218d027cd28d02))


### Miscellaneous

* add publish automation ([#550](https://github.com/cloudevents/sdk-javascript/issues/550)) ([3931b22](https://github.com/cloudevents/sdk-javascript/commit/3931b224cb3140ad3ba759edcf564621a2e34542))
* remove old Node versions from the readme ([#549](https://github.com/cloudevents/sdk-javascript/issues/549)) ([11442d3](https://github.com/cloudevents/sdk-javascript/commit/11442d32d307a0e8416ed573ce34fc825d3b63c4))
* Update compatible node version ([#552](https://github.com/cloudevents/sdk-javascript/issues/552)) ([f3659eb](https://github.com/cloudevents/sdk-javascript/commit/f3659ebfc6251b4c57997f70709688916a061a2d))

## [7.0.0](https://github.com/cloudevents/sdk-javascript/compare/v6.0.4...v7.0.0) (2023-05-03)


### ⚠ BREAKING CHANGES

* remove node 12 and node 14 ([#545](https://github.com/cloudevents/sdk-javascript/issues/545))

### Features

* remove node 12 and node 14 ([#545](https://github.com/cloudevents/sdk-javascript/issues/545)) ([2cb9364](https://github.com/cloudevents/sdk-javascript/commit/2cb9364a25a5e82f2a68504dbe19839a7fbfd9d4))


### Miscellaneous

* add the build script to the pretest script. ([#539](https://github.com/cloudevents/sdk-javascript/issues/539)) ([c06ffc1](https://github.com/cloudevents/sdk-javascript/commit/c06ffc196389fedd7d5141d69fac3f4d95156193))
* fix release-please-action ([#543](https://github.com/cloudevents/sdk-javascript/issues/543)) ([ec83abc](https://github.com/cloudevents/sdk-javascript/commit/ec83abc82799159aa1f64c791c92e035ef6f42b8))
* release 6.0.5 ([#542](https://github.com/cloudevents/sdk-javascript/issues/542)) ([343382e](https://github.com/cloudevents/sdk-javascript/commit/343382ebdedc9a2efbc5b3ba5cd36e4e069fd38f))
* release 7.0.0 ([#546](https://github.com/cloudevents/sdk-javascript/issues/546)) ([0120d22](https://github.com/cloudevents/sdk-javascript/commit/0120d224ab67e804e201625e0a9d59947a5a212d))
* Update CI action to node 18.x ([#533](https://github.com/cloudevents/sdk-javascript/issues/533)) ([7ff64f8](https://github.com/cloudevents/sdk-javascript/commit/7ff64f8b82e1c5a824bbe985df4948d79e919e8c))

### [6.0.3](https://www.github.com/cloudevents/sdk-javascript/compare/v6.0.2...v6.0.3) (2023-02-16)


### Bug Fixes

* improve validation on extension attribute ([#502](https://www.github.com/cloudevents/sdk-javascript/issues/502)) ([ea94a4d](https://www.github.com/cloudevents/sdk-javascript/commit/ea94a4d779d0744ef40abc81d08ab8b7e93e9133))
* Make CloudEvent data field immutable and enumerable using Object.keys() ([#515](https://www.github.com/cloudevents/sdk-javascript/issues/515)) ([#516](https://www.github.com/cloudevents/sdk-javascript/issues/516)) ([2d5fab1](https://www.github.com/cloudevents/sdk-javascript/commit/2d5fab1b7133241493bb9327aa26e7de4117616d))
* This fixes bug [#525](https://www.github.com/cloudevents/sdk-javascript/issues/525) where the browser version was breaking becuase of process not being found. ([#526](https://www.github.com/cloudevents/sdk-javascript/issues/526)) ([e5ee836](https://www.github.com/cloudevents/sdk-javascript/commit/e5ee8369ba5838aa24c2d99efeb81788757b71d1))


### Miscellaneous

* added the engines property to the package.json ([bc3aaca](https://www.github.com/cloudevents/sdk-javascript/commit/bc3aaca2ef250e4acd72b909488b326233237c83))
* bump cucumber to full release version ([#514](https://www.github.com/cloudevents/sdk-javascript/issues/514)) ([c09a9cc](https://www.github.com/cloudevents/sdk-javascript/commit/c09a9cc20a601ddc36c5c1b56fb52dc9c2161e1b))
* bump mocha to 10.1.0 ([#512](https://www.github.com/cloudevents/sdk-javascript/issues/512)) ([4831e6a](https://www.github.com/cloudevents/sdk-javascript/commit/4831e6a1a5003c4c1c7bcbd5a3a2fc5c48e0ba4c))
* bump webpack to 5.74.0 ([#509](https://www.github.com/cloudevents/sdk-javascript/issues/509)) ([760a024](https://www.github.com/cloudevents/sdk-javascript/commit/760a0240674c79ca6be142ae9f9b242080c4d59d))
* release 6.0.3 ([#503](https://www.github.com/cloudevents/sdk-javascript/issues/503)) ([3619ef2](https://www.github.com/cloudevents/sdk-javascript/commit/3619ef2bbd6e2b3e9e6e5bb5ad904689d40f4b79))
* Typos ([953bc2a](https://www.github.com/cloudevents/sdk-javascript/commit/953bc2a143a66d04d850c727305a5a465e843bff))
* **examples:** add mqtt example ([#523](https://www.github.com/cloudevents/sdk-javascript/issues/523)) ([b374d9a](https://www.github.com/cloudevents/sdk-javascript/commit/b374d9ac3313023e4f8a59cb22785751bbb0f686))

### [6.0.3](https://www.github.com/cloudevents/sdk-javascript/compare/v6.0.2...v6.0.3) (2022-11-01)


### Bug Fixes

* improve validation on extension attribute ([#502](https://www.github.com/cloudevents/sdk-javascript/issues/502)) ([ea94a4d](https://www.github.com/cloudevents/sdk-javascript/commit/ea94a4d779d0744ef40abc81d08ab8b7e93e9133))
* Make CloudEvent data field immutable and enumerable using Object.keys() ([#515](https://www.github.com/cloudevents/sdk-javascript/issues/515)) ([#516](https://www.github.com/cloudevents/sdk-javascript/issues/516)) ([2d5fab1](https://www.github.com/cloudevents/sdk-javascript/commit/2d5fab1b7133241493bb9327aa26e7de4117616d))


### Miscellaneous

* bump cucumber to full release version ([#514](https://www.github.com/cloudevents/sdk-javascript/issues/514)) ([c09a9cc](https://www.github.com/cloudevents/sdk-javascript/commit/c09a9cc20a601ddc36c5c1b56fb52dc9c2161e1b))
* bump mocha to 10.1.0 ([#512](https://www.github.com/cloudevents/sdk-javascript/issues/512)) ([4831e6a](https://www.github.com/cloudevents/sdk-javascript/commit/4831e6a1a5003c4c1c7bcbd5a3a2fc5c48e0ba4c))
* bump webpack to 5.74.0 ([#509](https://www.github.com/cloudevents/sdk-javascript/issues/509)) ([760a024](https://www.github.com/cloudevents/sdk-javascript/commit/760a0240674c79ca6be142ae9f9b242080c4d59d))

### [6.0.2](https://www.github.com/cloudevents/sdk-javascript/compare/v6.0.1...v6.0.2) (2022-06-21)


### Bug Fixes

* allow `TypedArray` for binary data ([#494](https://www.github.com/cloudevents/sdk-javascript/issues/494)) ([921e273](https://www.github.com/cloudevents/sdk-javascript/commit/921e273ede100ab9a262fdfa1f3d6561d3fab0f9))
* HTTP headers for extensions with false values ([#493](https://www.github.com/cloudevents/sdk-javascript/issues/493)) ([d6f52ca](https://www.github.com/cloudevents/sdk-javascript/commit/d6f52ca65f893fdb581bf06b2ff97b3d6eeeb744))
* package.json & package-lock.json to reduce vulnerabilities ([ed63f14](https://www.github.com/cloudevents/sdk-javascript/commit/ed63f14339fb7774bff865726370fe72a49abca3))


### Miscellaneous

* bump ajv and remove old dep dependency ([#496](https://www.github.com/cloudevents/sdk-javascript/issues/496)) ([ce02e0a](https://www.github.com/cloudevents/sdk-javascript/commit/ce02e0a1f3b24624bd8ba443c744b4a6c0cfcb44))
* update owners ([#499](https://www.github.com/cloudevents/sdk-javascript/issues/499)) ([a62eb44](https://www.github.com/cloudevents/sdk-javascript/commit/a62eb4466985972cd3112e6f8e3e0b62cb01c1c1))

### [6.0.1](https://www.github.com/cloudevents/sdk-javascript/compare/v6.0.0...v6.0.1) (2022-03-21)


### Miscellaneous

* update dependencies to inlude ajv-formats ([#484](https://www.github.com/cloudevents/sdk-javascript/issues/484)) ([c0b1f77](https://www.github.com/cloudevents/sdk-javascript/commit/c0b1f7705a448dda3e6292d872a5bf435d26fab4)), closes [/github.com/cloudevents/sdk-javascript/pull/471/files#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519R128](https://www.github.com/cloudevents//github.com/cloudevents/sdk-javascript/pull/471/files/issues/diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519R128)

## [6.0.0](https://www.github.com/cloudevents/sdk-javascript/compare/v5.3.2...v6.0.0) (2022-03-21)


### ⚠ BREAKING CHANGES

* add http transport and remove axios (#481)

### Features

* add http transport and remove axios ([#481](https://www.github.com/cloudevents/sdk-javascript/issues/481)) ([0362a4f](https://www.github.com/cloudevents/sdk-javascript/commit/0362a4f11c7bdc74a3a9a05b5bb4a94516b15a44))
* precompile cloudevent schema ([#471](https://www.github.com/cloudevents/sdk-javascript/issues/471)) ([b13bde9](https://www.github.com/cloudevents/sdk-javascript/commit/b13bde9b4967f5c8b02b788a40a89dd4cec5b78a))


### Miscellaneous

* add an npm test:once script ([#480](https://www.github.com/cloudevents/sdk-javascript/issues/480)) ([b4d7aa9](https://www.github.com/cloudevents/sdk-javascript/commit/b4d7aa9adbb92bb5d037c464dd3d4bcd1ba88fe6))
* update package.json format and deps ([#479](https://www.github.com/cloudevents/sdk-javascript/issues/479)) ([6204805](https://www.github.com/cloudevents/sdk-javascript/commit/6204805bfcebf68fd1b94777ecb3df6d7473e10e))
* update the release documentation ([#476](https://www.github.com/cloudevents/sdk-javascript/issues/476)) ([c420da4](https://www.github.com/cloudevents/sdk-javascript/commit/c420da479343bc71a5ba4d5ed41841280f4c989a))


### Documentation

* update readme to include http builtin transport ([#483](https://www.github.com/cloudevents/sdk-javascript/issues/483)) ([4ab6356](https://www.github.com/cloudevents/sdk-javascript/commit/4ab6356bd70434e55938ff89e940952f8b0105a3))

### [5.3.2](https://www.github.com/cloudevents/sdk-javascript/compare/v5.3.1...v5.3.2) (2022-02-11)


### Bug Fixes

* use `isolatedModules: true` in tsconfig.json ([#469](https://www.github.com/cloudevents/sdk-javascript/issues/469)) ([b5c0b56](https://www.github.com/cloudevents/sdk-javascript/commit/b5c0b56f52dd6119949df1a583b76a48c6e3cec7))


### Miscellaneous

* bump typedoc to remove vuln ([#472](https://www.github.com/cloudevents/sdk-javascript/issues/472)) ([c3d9f39](https://www.github.com/cloudevents/sdk-javascript/commit/c3d9f39a53afaf411fa91aeb2323fef2eddb4d32))

### [5.3.1](https://www.github.com/cloudevents/sdk-javascript/compare/v5.3.0...v5.3.1) (2022-02-02)


### Bug Fixes

* improve binary data detection in HTTP transport ([#468](https://www.github.com/cloudevents/sdk-javascript/issues/468)) ([cd4dea9](https://www.github.com/cloudevents/sdk-javascript/commit/cd4dea954b1797eb0e0fe2acd1b32ef75a3b7b65))
* package.json & package-lock.json to reduce vulnerabilities ([#462](https://www.github.com/cloudevents/sdk-javascript/issues/462)) ([ae8fa79](https://www.github.com/cloudevents/sdk-javascript/commit/ae8fa799afea279adfbd1f35103fb168621c8a24))


### Documentation

* add TS examples for CloudEvent usage ([#461](https://www.github.com/cloudevents/sdk-javascript/issues/461)) ([c603831](https://www.github.com/cloudevents/sdk-javascript/commit/c603831e934c68c1f430708b5bff4dad938093dd))
* fix ts example ([#467](https://www.github.com/cloudevents/sdk-javascript/issues/467)) ([349b84c](https://www.github.com/cloudevents/sdk-javascript/commit/349b84c3dad5d282d24780a884a0f94643871247))


### Miscellaneous

* update readme with current Node LTS versions and add Node 16 to the testing matrix([#465](https://www.github.com/cloudevents/sdk-javascript/issues/465)) ([8abbc11](https://www.github.com/cloudevents/sdk-javascript/commit/8abbc114af4b784c5061737f432f0af9ccb6c6f2))

## [5.3.0](https://www.github.com/cloudevents/sdk-javascript/compare/v5.2.0...v5.3.0) (2022-01-14)


### Features

* add MQTT transport messaging ([#459](https://www.github.com/cloudevents/sdk-javascript/issues/459)) ([591d133](https://www.github.com/cloudevents/sdk-javascript/commit/591d133f31d5802e526952d6177dcb0a3383c221))
* add support for kafka transport ([#455](https://www.github.com/cloudevents/sdk-javascript/issues/455)) ([5d1f744](https://www.github.com/cloudevents/sdk-javascript/commit/5d1f744f503dbb56f4cfb3365d66cac635cc03b3))


### Miscellaneous

* **refactor:** prefer interfaces over concrete classes ([#457](https://www.github.com/cloudevents/sdk-javascript/issues/457)) ([2ac731e](https://www.github.com/cloudevents/sdk-javascript/commit/2ac731eb884965e91a19bb3529100a6aee7069dd))
* update cucumber dependency and remove prettier ([#453](https://www.github.com/cloudevents/sdk-javascript/issues/453)) ([320354f](https://www.github.com/cloudevents/sdk-javascript/commit/320354f750420f74ac1258f1e0530962a9c58788))

## [5.2.0](https://www.github.com/cloudevents/sdk-javascript/compare/v5.1.0...v5.2.0) (2021-12-07)


### Features

* add batch mode ([#448](https://www.github.com/cloudevents/sdk-javascript/issues/448)) ([9a46e33](https://www.github.com/cloudevents/sdk-javascript/commit/9a46e335f5fc4b1d01520fc02b5229ce35956709))

## [5.1.0](https://www.github.com/cloudevents/sdk-javascript/compare/v5.0.0...v5.1.0) (2021-12-01)


### Features

* use generic type for CloudEvent data ([#446](https://www.github.com/cloudevents/sdk-javascript/issues/446)) ([d941e2d](https://www.github.com/cloudevents/sdk-javascript/commit/d941e2d4d9e491912860e30acd7fa34e9dda7669))


### Bug Fixes

* do not assume an empty content-type header is JSON ([#444](https://www.github.com/cloudevents/sdk-javascript/issues/444)) ([52ea7de](https://www.github.com/cloudevents/sdk-javascript/commit/52ea7de80dd98c6766531936fa95963990119612))
* package.json & package-lock.json to reduce vulnerabilities ([#439](https://www.github.com/cloudevents/sdk-javascript/issues/439)) ([0f5a4c0](https://www.github.com/cloudevents/sdk-javascript/commit/0f5a4c0de26e0181f4a33be9b9e91687879f38b1))


### Miscellaneous

* add test for text/plain data ([#442](https://www.github.com/cloudevents/sdk-javascript/issues/442)) ([b4266b1](https://www.github.com/cloudevents/sdk-javascript/commit/b4266b1f378d16c796aa4b7c5bbdbda8d9f8c1e8))

## [5.0.0](https://www.github.com/cloudevents/sdk-javascript/compare/v4.0.3...v5.0.0) (2021-10-04)


### ⚠ BREAKING CHANGES

* remove support for 0.3 events (#425)

### Features

* add native logging with headers and body to CloudEvent ([#437](https://www.github.com/cloudevents/sdk-javascript/issues/437)) ([b38a48f](https://www.github.com/cloudevents/sdk-javascript/commit/b38a48fa5986fd3fc6f9a1ec728526742e945f69))


### Bug Fixes

*  update express example with framework features. ([#429](https://www.github.com/cloudevents/sdk-javascript/issues/429)) ([272bcea](https://www.github.com/cloudevents/sdk-javascript/commit/272bcea2d81145e6e62cab46e66d8c5b6d66c264)), closes [#379](https://www.github.com/cloudevents/sdk-javascript/issues/379)
* ensure source property has min length of 1 ([#438](https://www.github.com/cloudevents/sdk-javascript/issues/438)) ([2ff7852](https://www.github.com/cloudevents/sdk-javascript/commit/2ff7852c3689c486261ec4cd45a18315750b0f2e))
* package.json & package-lock.json to reduce vulnerabilities ([#433](https://www.github.com/cloudevents/sdk-javascript/issues/433)) ([cf47248](https://www.github.com/cloudevents/sdk-javascript/commit/cf47248d25c1039a8bf0afe44b86c08837ca4977))
* package.json & package-lock.json to reduce vulnerabilities ([#434](https://www.github.com/cloudevents/sdk-javascript/issues/434)) ([8814919](https://www.github.com/cloudevents/sdk-javascript/commit/8814919923acbffaaac5538d869ccb35ee93a058))
* package.json & package-lock.json to reduce vulnerabilities ([#436](https://www.github.com/cloudevents/sdk-javascript/issues/436)) ([2dc846c](https://www.github.com/cloudevents/sdk-javascript/commit/2dc846c6594d2c19b0564a5e8394235aaa5c2713))


### Miscellaneous

* remove node 10 from ci ([#435](https://www.github.com/cloudevents/sdk-javascript/issues/435)) ([a7db466](https://www.github.com/cloudevents/sdk-javascript/commit/a7db466c6ee85a9d6d86944ee376dc3a2f40b428))
* remove support for 0.3 events ([#425](https://www.github.com/cloudevents/sdk-javascript/issues/425)) ([2bd9a5a](https://www.github.com/cloudevents/sdk-javascript/commit/2bd9a5a1e429bb641f629cfc3f18a894df8c4650))
* update eslint and prettier dependencies ([#424](https://www.github.com/cloudevents/sdk-javascript/issues/424)) ([061c122](https://www.github.com/cloudevents/sdk-javascript/commit/061c122b867cbc116d0389d88c3198b25d7be0c1))
* use git submodules for conformance tests ([#427](https://www.github.com/cloudevents/sdk-javascript/issues/427)) ([2118488](https://www.github.com/cloudevents/sdk-javascript/commit/2118488a148651d94c99df2ecf9e3eda5ae97f33))

### [4.0.3](https://www.github.com/cloudevents/sdk-javascript/compare/v4.0.2...v4.0.3) (2021-07-06)


### Bug Fixes

* do not modify incoming event's specversion ([#419](https://www.github.com/cloudevents/sdk-javascript/issues/419)) ([22e42dd](https://www.github.com/cloudevents/sdk-javascript/commit/22e42ddb80d21058a74219a1c24b409c245f030f))
* do not modify incoming event's specversion ([#419](https://www.github.com/cloudevents/sdk-javascript/issues/419)) ([7c05ade](https://www.github.com/cloudevents/sdk-javascript/commit/7c05adee7b3d5d56ff5602f044a9581534ab8957))
* throw on validation if extensions are improperly named ([#420](https://www.github.com/cloudevents/sdk-javascript/issues/420)) ([7f6b658](https://www.github.com/cloudevents/sdk-javascript/commit/7f6b658858533bfbc33edbec30d79099aeb0d021))


### Miscellaneous

* add copyrights header and lint rules ([#418](https://www.github.com/cloudevents/sdk-javascript/issues/418)) ([80d987c](https://www.github.com/cloudevents/sdk-javascript/commit/80d987c1f6046efb5e0c89b0472d653ccd35ee2c))
* add Lance Ball to maintainers in package.json ([#411](https://www.github.com/cloudevents/sdk-javascript/issues/411)) ([d68b85a](https://www.github.com/cloudevents/sdk-javascript/commit/d68b85a2278e46e0f5dac44b561cfcb1dd8b5404))
* be more forgiving parsing JSON as a string ([#417](https://www.github.com/cloudevents/sdk-javascript/issues/417)) ([db4be6b](https://www.github.com/cloudevents/sdk-javascript/commit/db4be6b1da479f27903efc6694d06f7cc8b054e2))

### [4.0.2](https://www.github.com/cloudevents/sdk-javascript/compare/v4.0.1...v4.0.2) (2021-04-21)


### Bug Fixes

* defaults properly handled for emitterFor() ([#399](https://www.github.com/cloudevents/sdk-javascript/issues/399)) ([0f11b02](https://www.github.com/cloudevents/sdk-javascript/commit/0f11b02a0125aa3a7014819c21124d244f4158c1))
* ensure loose validation for isEvent and toEvent ([#394](https://www.github.com/cloudevents/sdk-javascript/issues/394)) ([efe466a](https://www.github.com/cloudevents/sdk-javascript/commit/efe466ac7daa5c83c3f4e7a44efb854c519ce382))
* examples/typescript-ex/package.json to reduce vulnerabilities ([#395](https://www.github.com/cloudevents/sdk-javascript/issues/395)) ([d359355](https://www.github.com/cloudevents/sdk-javascript/commit/d3593556f15101eb3164a500cc647975bfa6f0e0))


### Documentation

* fix 'npm run generate-docs' ([#398](https://www.github.com/cloudevents/sdk-javascript/issues/398)) ([447252e](https://www.github.com/cloudevents/sdk-javascript/commit/447252e0c7d12fb408f2fae391d6fe3b958f1d0b))


### Miscellaneous

* add markdown linter ([#403](https://www.github.com/cloudevents/sdk-javascript/issues/403)) ([fea5ac2](https://www.github.com/cloudevents/sdk-javascript/commit/fea5ac2d05b6d38021499429c4cf79471a2549a2))
* externalize remark-lint config ([#406](https://www.github.com/cloudevents/sdk-javascript/issues/406)) ([192c6a3](https://www.github.com/cloudevents/sdk-javascript/commit/192c6a3a5c801f5e1d53f26ccd937690a43b2ec4))
* remove @types/axios and add axios in dev ([#408](https://www.github.com/cloudevents/sdk-javascript/issues/408)) ([a0009f6](https://www.github.com/cloudevents/sdk-javascript/commit/a0009f6189daaac67944ff295d495f705528b481))
* remove standard-version ([#402](https://www.github.com/cloudevents/sdk-javascript/issues/402)) ([edd3c7f](https://www.github.com/cloudevents/sdk-javascript/commit/edd3c7fbaced2af95275f0c9690f87833c0c6803))
* tweak PR template ([#407](https://www.github.com/cloudevents/sdk-javascript/issues/407)) ([26ceb90](https://www.github.com/cloudevents/sdk-javascript/commit/26ceb908db13c0fb7ad31131ea28c8c33803e5c7))
* update CI workflow to include Node.js 14.x ([#404](https://www.github.com/cloudevents/sdk-javascript/issues/404)) ([cc43f3b](https://www.github.com/cloudevents/sdk-javascript/commit/cc43f3bd10caffbc47b9ce42df71782177176001))
* update codacy badges ([#409](https://www.github.com/cloudevents/sdk-javascript/issues/409)) ([66f0b42](https://www.github.com/cloudevents/sdk-javascript/commit/66f0b42f0da98d7f41416ce3b8bc5ee8619b6e16))

### [4.0.1](https://www.github.com/cloudevents/sdk-javascript/compare/v4.0.0...v4.0.1) (2021-03-08)


### Bug Fixes

* cloudevents from 3.2.0 to 4.0.0 ([#376](https://www.github.com/cloudevents/sdk-javascript/issues/376)) ([6be3b27](https://www.github.com/cloudevents/sdk-javascript/commit/6be3b2751401e529fce6ccf8a406a057472c10a9))
* Emitter should not extend EventEmitter ([1af3d43](https://www.github.com/cloudevents/sdk-javascript/commit/1af3d4334170432767d672af2fca3b748fe297a1))
* examples/websocket/package.json to reduce vulnerabilities ([#375](https://www.github.com/cloudevents/sdk-javascript/issues/375)) ([2b1e1ec](https://www.github.com/cloudevents/sdk-javascript/commit/2b1e1ec5a2aa670625e992fd060ae7d7fb40f258))
* package.json & package-lock.json to reduce vulnerabilities ([#384](https://www.github.com/cloudevents/sdk-javascript/issues/384)) ([39812f7](https://www.github.com/cloudevents/sdk-javascript/commit/39812f77d086d75dcf562618a3cde46c3ca57d6d))


### Miscellaneous

* **docs:** Fix minor import problems in README ([#374](https://www.github.com/cloudevents/sdk-javascript/issues/374)) ([ed81483](https://www.github.com/cloudevents/sdk-javascript/commit/ed8148326b2c1890845cf97c469c645ec76e3f51))


### Tests

* add a test for extension names with all caps. ([#389](https://www.github.com/cloudevents/sdk-javascript/issues/389)) ([e7d99eb](https://www.github.com/cloudevents/sdk-javascript/commit/e7d99eb8822d8b590bdd7018d8491a803d83ab1e))

## [4.0.0](https://github.com/cloudevents/sdk-javascript/compare/v3.1.0...v4.0.0) (2020-12-10)


### ⚠ BREAKING CHANGES

* Remove All API's that are labeled "Remove in 4.0" (#362)
* **event:** make the event's time property only a string (#330)

### Features

* add a constructor parameter for loose validation ([#328](https://github.com/cloudevents/sdk-javascript/issues/328)) ([1fa3a05](https://github.com/cloudevents/sdk-javascript/commit/1fa3a05aed84bb4bdb225b3e2e11aba60d80efe8))

* add emitterFactory and friends ([#342](https://github.com/cloudevents/sdk-javascript/issues/342)) ([e334b6e](https://github.com/cloudevents/sdk-javascript/commit/e334b6eceb0227196bacea6a843c268489a7b71b))

* add EventEmitter to Emitter and singleton paradigm ([25f9c48](https://github.com/cloudevents/sdk-javascript/commit/25f9c4860169a8ab576fba47791497ada3048d9f))

* allow ensureDelivery to be able to ensure delivery on emit ([43d9e01](https://github.com/cloudevents/sdk-javascript/commit/43d9e019720b7ddcc841117a7bbf97fff96e5e23))

* introduce Message, Serializer, Deserializer and Binding interfaces ([#324](https://github.com/cloudevents/sdk-javascript/issues/324)) ([f3953a9](https://github.com/cloudevents/sdk-javascript/commit/f3953a9a5abf5c0267247f9939cf567a47eccd91))

* Remove All API's that are labeled "Remove in 4.0" ([#362](https://github.com/cloudevents/sdk-javascript/issues/362)) ([875f700](https://github.com/cloudevents/sdk-javascript/commit/875f70017a09d1363c3f7eb2a5ea32eea1973e50))


### Bug Fixes

* do not alter an event's data attribute ([#344](https://github.com/cloudevents/sdk-javascript/issues/344)) ([1446898](https://github.com/cloudevents/sdk-javascript/commit/14468980f7a79da836bd3ee8304a8a5710a206c1))

* extend Node.js IncomingHttpHeaders in our Headers type ([#346](https://github.com/cloudevents/sdk-javascript/issues/346)) ([f6be285](https://github.com/cloudevents/sdk-javascript/commit/f6be285b8319919029d8c11f7bb49cac4bcc5c14))

* improve error messages when validating extensions ([9f86cfd](https://github.com/cloudevents/sdk-javascript/commit/9f86cfdf0efa014ccee385412836206763c65b96))

* package.json & package-lock.json to reduce vulnerabilities ([132f052](https://github.com/cloudevents/sdk-javascript/commit/132f052f1f64563a0dfc9b88056aa36a40f4c43f))

* package.json & package-lock.json to reduce vulnerabilities ([#338](https://github.com/cloudevents/sdk-javascript/issues/338)) ([eca43d9](https://github.com/cloudevents/sdk-javascript/commit/eca43d907468dd07d9f291bb56f95f658f4b3c40))

* upgrade cloudevents from 3.0.1 to 3.1.0 ([#335](https://github.com/cloudevents/sdk-javascript/issues/335)) ([7423acb](https://github.com/cloudevents/sdk-javascript/commit/7423acb7fc4d431cc8d335fd5ccb1ad4a1f28a65))

* upgrade uuid from 8.2.0 to 8.3.0 ([#317](https://github.com/cloudevents/sdk-javascript/issues/317)) ([6e2390e](https://github.com/cloudevents/sdk-javascript/commit/6e2390ed6b3fa80474ce452581e52eeb13ffe995))


### Tests

* implement pending tests leftover from TS rewrite ([#315](https://github.com/cloudevents/sdk-javascript/issues/315)) ([b5cf886](https://github.com/cloudevents/sdk-javascript/commit/b5cf8865b98ae2b91407f4c5d90a7afd977ee96e))


### Documentation

* add Emitter logic example ([bda8581](https://github.com/cloudevents/sdk-javascript/commit/bda85814649a0597909125914de51b3b4ca99aaa))

* add ref to CoC and other things ([#244](https://github.com/cloudevents/sdk-javascript/issues/244)) ([b3624c2](https://github.com/cloudevents/sdk-javascript/commit/b3624c2b1a1df44df9b8094364c4db23242fc00e))

* update README with latest API changes ([#347](https://github.com/cloudevents/sdk-javascript/issues/347)) ([138de37](https://github.com/cloudevents/sdk-javascript/commit/138de3708463101e12428db6f456cfebf41a5093))

* update README with maintainer names ([#337](https://github.com/cloudevents/sdk-javascript/issues/337)) ([0a12146](https://github.com/cloudevents/sdk-javascript/commit/0a121465650ea2fac388a1df9c352a732ead0079))


### Miscellaneous

* add a transition guide.  fixes [#360](https://github.com/cloudevents/sdk-javascript/issues/360) ([#363](https://github.com/cloudevents/sdk-javascript/issues/363)) ([79296a8](https://github.com/cloudevents/sdk-javascript/commit/79296a8e63b43325a51d7e6c9ba29d04066dee17))

* **package:** Upgrade mocha from 7.1.2 to 8.2.0 ([#354](https://github.com/cloudevents/sdk-javascript/issues/354)) ([8205bc9](https://github.com/cloudevents/sdk-javascript/commit/8205bc96ae401099e0207bf387164fd955be7b33))

* add an automated GH action for releases ([#329](https://github.com/cloudevents/sdk-javascript/issues/329)) ([a9114b7](https://github.com/cloudevents/sdk-javascript/commit/a9114b712308efaca11c9e5f485948af5bb9e4bc))

* tag v3.2.0 as release-v3.2.0 for release-please ([#353](https://github.com/cloudevents/sdk-javascript/issues/353)) ([765b81c](https://github.com/cloudevents/sdk-javascript/commit/765b81cdeca4bf425df7f37b49aa8ffed8b77513))

* **ci,releases:** bump release-please-action to 2.5.5 ([#350](https://github.com/cloudevents/sdk-javascript/issues/350)) ([c4afacb](https://github.com/cloudevents/sdk-javascript/commit/c4afacbad3e23cb9a9110984c14fd35859bfcd9c))

* Remove commented version import. ([#319](https://github.com/cloudevents/sdk-javascript/issues/319)) ([0adcc35](https://github.com/cloudevents/sdk-javascript/commit/0adcc3532d8826254d4febfa2dc0b03dd4fe13b7))

* typo ([#313](https://github.com/cloudevents/sdk-javascript/issues/313)) ([81623ac](https://github.com/cloudevents/sdk-javascript/commit/81623ac443b7e68a595061357946a164edf446e6))

* update release please to the latest release(2.4.1) ([#345](https://github.com/cloudevents/sdk-javascript/issues/345)) ([76688c4](https://github.com/cloudevents/sdk-javascript/commit/76688c4c01554cbbad62ac1b719ef00c9328848b))

* **event:** make the event's time property only a string ([#330](https://github.com/cloudevents/sdk-javascript/issues/330)) ([6cd310c](https://github.com/cloudevents/sdk-javascript/commit/6cd310c14168013a4298f87fd8ec3ef51782d7ce))

* **example:** Replaced body parser with express JSON parser ([#334](https://github.com/cloudevents/sdk-javascript/issues/334)) ([4779d89](https://github.com/cloudevents/sdk-javascript/commit/4779d89ad054973cb0af8ec4119e073b78970392))

* add cucumber.js to list of files to lint and /docs to .gitignore ([#327](https://github.com/cloudevents/sdk-javascript/issues/327)) ([17d4bc8](https://github.com/cloudevents/sdk-javascript/commit/17d4bc85dfa9b8ecfcc3383c6154ed9aa2f37496))

* Update README with correct links for the support specification versions ([#321](https://github.com/cloudevents/sdk-javascript/issues/321)) ([73f0bec](https://github.com/cloudevents/sdk-javascript/commit/73f0becc2b8e4f10ae40e23b77e4161d9b5ff611)), closes [#320](https://github.com/cloudevents/sdk-javascript/issues/320)

* Update references of master to main ([#316](https://github.com/cloudevents/sdk-javascript/issues/316)) ([4bf2eb8](https://github.com/cloudevents/sdk-javascript/commit/4bf2eb838a32275433793e0692e32a373685f41e))

* validate cloudevent version agnostic ([#311](https://github.com/cloudevents/sdk-javascript/issues/311)) ([8ac3eb0](https://github.com/cloudevents/sdk-javascript/commit/8ac3eb0c69d980a4475052ce3f102b8b88602fa5))

## [3.1.0](https://github.com/cloudevents/sdk-javascript/compare/v3.0.1...v3.1.0) (2020-08-11)


### Bug Fixes

* Add Correct Headers to emitted Binary Event ([#302](https://github.com/cloudevents/sdk-javascript/issues/302)) ([ad0c434](https://github.com/cloudevents/sdk-javascript/commit/ad0c4340b2b3cf8a6204f7fb9e1df140092e23c9)), closes [#301](https://github.com/cloudevents/sdk-javascript/issues/301)
* ensure that data encoded as base64 is parsed as an object ([#285](https://github.com/cloudevents/sdk-javascript/issues/285)) ([ed9ea95](https://github.com/cloudevents/sdk-javascript/commit/ed9ea956d73491cc890751bf1baf4f0be828a9cb))
* update browser name to cloudevents. ([#292](https://github.com/cloudevents/sdk-javascript/issues/292)) ([48d182b](https://github.com/cloudevents/sdk-javascript/commit/48d182bc5f3c6f7feb6dec9ce5bb68ff5ad14e66)), closes [#286](https://github.com/cloudevents/sdk-javascript/issues/286)


### Miscellaneous

* fix promise tests to break the build when they fail ([#305](https://github.com/cloudevents/sdk-javascript/issues/305)) ([a5249de](https://github.com/cloudevents/sdk-javascript/commit/a5249de487da4a17b082c4bc59d362a62566ccaf)), closes [#303](https://github.com/cloudevents/sdk-javascript/issues/303)
* no import star ([#297](https://github.com/cloudevents/sdk-javascript/issues/297)) ([31c2005](https://github.com/cloudevents/sdk-javascript/commit/31c200592fb819a38d17c661ce6a76b8ed0ff157))
* Update examples to use latest sdk changes ([#282](https://github.com/cloudevents/sdk-javascript/issues/282)) ([763838c](https://github.com/cloudevents/sdk-javascript/commit/763838c89cc704397bf75c9cbde79ae0f5c731c1))
* Update readme with correct Receiver usage ([#287](https://github.com/cloudevents/sdk-javascript/issues/287)) ([e219a30](https://github.com/cloudevents/sdk-javascript/commit/e219a30708f061ef5fdb576d18d2e087f4ba5a25))
* update the release script to signoff the commit ([#307](https://github.com/cloudevents/sdk-javascript/issues/307)) ([f3cc2b4](https://github.com/cloudevents/sdk-javascript/commit/f3cc2b429baa9d055ac480c433efee1438968ccc))


### Documentation

* improve readme receiver example ([#309](https://github.com/cloudevents/sdk-javascript/issues/309)) ([d590e3a](https://github.com/cloudevents/sdk-javascript/commit/d590e3a0079e749a9e108b445911eaf544271ec4))
* Release Guidelines ([#306](https://github.com/cloudevents/sdk-javascript/issues/306)) ([08bf15d](https://github.com/cloudevents/sdk-javascript/commit/08bf15d161d5781b712f6065f78d31d59f8ba549))
* update badge name ([#289](https://github.com/cloudevents/sdk-javascript/issues/289)) ([3fab5f2](https://github.com/cloudevents/sdk-javascript/commit/3fab5f2c92859b22363b33024f8000dc3ceac1c3))

### [3.0.1](https://github.com/cloudevents/sdk-javascript/compare/v3.0.0...v3.0.1) (2020-07-29)


### Bug Fixes

* ensure that event data can be an array, number, boolean or null ([#281](https://github.com/cloudevents/sdk-javascript/issues/281)) ([b99f728](https://github.com/cloudevents/sdk-javascript/commit/b99f7281904b41d9058fec8f51019c5937821dc9))


### Miscellaneous

* move typedoc them to a dev dependency. ([#279](https://github.com/cloudevents/sdk-javascript/issues/279)) ([c76dda6](https://github.com/cloudevents/sdk-javascript/commit/c76dda6d1052964b772533306f58ef46c8c9b642)), closes [#278](https://github.com/cloudevents/sdk-javascript/issues/278)

## [3.0.0](https://github.com/cloudevents/sdk-javascript/compare/v2.0.2...v3.0.0) (2020-07-27)


### ⚠ BREAKING CHANGES

* This validates the value of the cloud event extension based on the spec,
https://github.com/cloudevents/spec/blob/master/spec.md#type-system

* This changes the modules name from cloudevents-sdk to cloudevents

* feat: use npm name cloudevents
* **src:** * Extension names are now validated during object creation.  The values are defined by the specification, and can be lowercase(a-z) or digits(0-9) and must be no longer that 20 characters

* **src:** * This change makes the CloudEvent Read-only and validates the input during object creation.

* To augment an already created CloudEvent object, we have added a `cloneWith` method that takes attributes to add/update.

### Features

* add types to package.json ([#216](https://github.com/cloudevents/sdk-javascript/issues/216)) ([4265281](https://github.com/cloudevents/sdk-javascript/commit/42652819f32df245e4e314d2df3758f6e5ca6926))
* introduce browser support ([#201](https://github.com/cloudevents/sdk-javascript/issues/201)) ([8b2725b](https://github.com/cloudevents/sdk-javascript/commit/8b2725b10a10ba5da842e23d3d2673b27ca450df))
* pass extension into the constructor. ([#214](https://github.com/cloudevents/sdk-javascript/issues/214)) ([0378f4c](https://github.com/cloudevents/sdk-javascript/commit/0378f4cdf9fde647ac3ffe1f9fb6bd3ff0924280)), closes [#209](https://github.com/cloudevents/sdk-javascript/issues/209)
* remove unused plugins ([#262](https://github.com/cloudevents/sdk-javascript/issues/262)) ([4014da2](https://github.com/cloudevents/sdk-javascript/commit/4014da26f5ae00d8846ab804ba0fb847051c44eb))
* simplify validation logic/imports ([#265](https://github.com/cloudevents/sdk-javascript/issues/265)) ([4b54b27](https://github.com/cloudevents/sdk-javascript/commit/4b54b272a5578523c3a03b21720cb89c0d5177db))
* use npm name cloudevents ([#260](https://github.com/cloudevents/sdk-javascript/issues/260)) ([565f867](https://github.com/cloudevents/sdk-javascript/commit/565f8674246b5f60ff78141ea9548b4137e2befc)), closes [#215](https://github.com/cloudevents/sdk-javascript/issues/215)
* **src:**  A CloudEvent should be readonly but provide a way to augment itself. ([#234](https://github.com/cloudevents/sdk-javascript/issues/234)) ([c7a8477](https://github.com/cloudevents/sdk-javascript/commit/c7a84772d59647e2a94991a3051b37b097b0d404))
* **src:** add ext name validation ([#246](https://github.com/cloudevents/sdk-javascript/issues/246)) ([84f1ed9](https://github.com/cloudevents/sdk-javascript/commit/84f1ed9cfe54d60978c525de5b0c49cf38839deb))


### Bug Fixes

* do not require an HTTP body on incoming binary event messages ([a7c326b](https://github.com/cloudevents/sdk-javascript/commit/a7c326b48cf702a077fc4af1eda3f686429ba9df))
* ensure that the HTTP receiver sanitizes headers in accept() ([#239](https://github.com/cloudevents/sdk-javascript/issues/239)) ([51035dc](https://github.com/cloudevents/sdk-javascript/commit/51035dc65b98ce7912d57a78d214612c05c5dc00))
* package.json & package-lock.json to reduce vulnerabilities ([#253](https://github.com/cloudevents/sdk-javascript/issues/253)) ([2ed5f84](https://github.com/cloudevents/sdk-javascript/commit/2ed5f844570efdf3ccc301fd5854fe4100921e04))
* parse method mutating its input ([#231](https://github.com/cloudevents/sdk-javascript/issues/231)) ([060b21b](https://github.com/cloudevents/sdk-javascript/commit/060b21ba36a37afc9002fe2e3d2d3b161633f9ae))
* upgrade uuid from 8.0.0 to 8.1.0 ([#220](https://github.com/cloudevents/sdk-javascript/issues/220)) ([25077a9](https://github.com/cloudevents/sdk-javascript/commit/25077a9b43bc2e54cd52266fb664a9c523d3f65c))
* upgrade uuid from 8.1.0 to 8.2.0 ([#250](https://github.com/cloudevents/sdk-javascript/issues/250)) ([13bcdb4](https://github.com/cloudevents/sdk-javascript/commit/13bcdb4b9817bcf28991269f554f73893b42b458))


### Tests

* inplement the cucumber conformance tests from cloudevents/spec ([#238](https://github.com/cloudevents/sdk-javascript/issues/238)) ([dca2811](https://github.com/cloudevents/sdk-javascript/commit/dca2811627f36427a3b9bc710cc338d76f5d6f8b))


### Documentation

* clean up spec compliance table on README.md ([#252](https://github.com/cloudevents/sdk-javascript/issues/252)) ([c496931](https://github.com/cloudevents/sdk-javascript/commit/c49693189d16655b0de50f1c52baea6ec3e1d9ba))
* **README:** fix wrong order of arguments in the accept example ([#224](https://github.com/cloudevents/sdk-javascript/issues/224)) ([850e893](https://github.com/cloudevents/sdk-javascript/commit/850e893ca7103846e5e85905523a0913ee8a8f4e)), closes [#222](https://github.com/cloudevents/sdk-javascript/issues/222)
* **README:** Update readme to mention that CloudEvents are read-only now ([#248](https://github.com/cloudevents/sdk-javascript/issues/248)) ([de6f0a2](https://github.com/cloudevents/sdk-javascript/commit/de6f0a2945f4fdfb3fdee75c0e20c863a356ff90))
* generate api documentation as a GitHub workflow ([#217](https://github.com/cloudevents/sdk-javascript/issues/217)) ([44b791b](https://github.com/cloudevents/sdk-javascript/commit/44b791bf97fdbcd7e1c4a0a7725e4707892653b7))
* Update references of specific versions to use Latest Supported. ([#211](https://github.com/cloudevents/sdk-javascript/issues/211)) ([ed1d328](https://github.com/cloudevents/sdk-javascript/commit/ed1d3286fa85a0f2eb4c02f4588d9f80dccc5ece)), closes [#160](https://github.com/cloudevents/sdk-javascript/issues/160)


### lib

* validate extension values ([#251](https://github.com/cloudevents/sdk-javascript/issues/251)) ([3c8273f](https://github.com/cloudevents/sdk-javascript/commit/3c8273f1140455ce8346918942c44dda241ead4c))


### Miscellaneous

* add vscode task JSON and GitHub issue/pr templates ([#268](https://github.com/cloudevents/sdk-javascript/issues/268)) ([1613595](https://github.com/cloudevents/sdk-javascript/commit/1613595a38ba1d268dc45da4b09239dfac8afee8))
* adds the return type for the extensions ([#221](https://github.com/cloudevents/sdk-javascript/issues/221)) ([5ab8164](https://github.com/cloudevents/sdk-javascript/commit/5ab81641aeaa7ef2d5dc23265277c65be144a881))
* bump GH stale action to v3 ([#243](https://github.com/cloudevents/sdk-javascript/issues/243)) ([90a9984](https://github.com/cloudevents/sdk-javascript/commit/90a998472c133dfc54c497eb87224fecce2ae031))
* combine v03 and v1 event interfaces, specs and schemas into single files([#270](https://github.com/cloudevents/sdk-javascript/issues/270)) ([129ec48](https://github.com/cloudevents/sdk-javascript/commit/129ec485d96dd38cb1d12f8074c6fcfb4cf6e689))
* consolidate HTTP parsers and header maps into single files ([#267](https://github.com/cloudevents/sdk-javascript/issues/267)) ([45850e3](https://github.com/cloudevents/sdk-javascript/commit/45850e329a636904924d9d719771fdf4ec683a5d))
* simplify ce version parsers ([#274](https://github.com/cloudevents/sdk-javascript/issues/274)) ([3d82fb6](https://github.com/cloudevents/sdk-javascript/commit/3d82fb629182edaee11e571ea895a5f8a7456a0e))
* simplify parser logic and duplicated code ([#269](https://github.com/cloudevents/sdk-javascript/issues/269)) ([a6124cc](https://github.com/cloudevents/sdk-javascript/commit/a6124cc350a106ea41bba2ccd1e0cb42a67f99bf))
* **actions:** don't auto-close stale issues and pull requests ([#235](https://github.com/cloudevents/sdk-javascript/issues/235)) ([d65b013](https://github.com/cloudevents/sdk-javascript/commit/d65b0135e0b5238f7d6e0c4a683401c1dc625b38))
* Update examples to use the latest sdk version(2.0.2) ([#206](https://github.com/cloudevents/sdk-javascript/issues/206)) ([dcb3c4e](https://github.com/cloudevents/sdk-javascript/commit/dcb3c4e98acb5fc4fca518d2121a46797388456f))
* webpack should publish to bundles not _bundles ([#227](https://github.com/cloudevents/sdk-javascript/issues/227)) ([7012433](https://github.com/cloudevents/sdk-javascript/commit/701243307440da7b9890e10faf6d57368912c4a7))

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

## [1.0.0][]

### Added

- Support for [Spec v1.0](https://github.com/cloudevents/spec/tree/v1.0)
- Typescript types for Spec v1.0: [see an example](./examples/typescript-ex)

### Removed

- Unmarshaller docs from README, moving them to [OLDOCS.md](./OLDOCS.md)

## [0.3.2][]

### Fixed

- Fix the special `data` handling: issue
[#33](https://github.com/cloudevents/sdk-javascript/issues/33)

## [0.3.1][]

### Fixed

- Axios version to `0.18.1` due the CVE-2019-10742
- Fix the `subject` attribute unmarshal error: issue
[#32](https://github.com/cloudevents/sdk-javascript/issues/32)

[1.0.0]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.2...v1.0.0
[0.3.2]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/cloudevents/sdk-javascript/compare/v0.3.0...v0.3.1
