# Changelog

## [0.1.2](https://github.com/antontranelis/web-of-trust/compare/relay-v0.1.1...relay-v0.1.2) (2026-03-29)


### Features

* Add blog with markdown articles and React Router ([5619d0b](https://github.com/antontranelis/web-of-trust/commit/5619d0bf504b817a5647fc351bb27b4067808cde))
* Add WebSocket relay server and WebSocketMessagingAdapter ([ff27bf7](https://github.com/antontranelis/web-of-trust/commit/ff27bf7c5ff7e7105b19a0fc3aa8103478f3a281))
* Connect demo app to WebSocket relay for live attestation delivery ([b342dfe](https://github.com/antontranelis/web-of-trust/commit/b342dfeaac7a0682046b5560ae04a10befc50887))
* debug dashboard + relay challenge-response auth ([4894aa3](https://github.com/antontranelis/web-of-trust/commit/4894aa3efd0fca9c8e55a28a9fe735ff4de5e0d7))
* delivery acknowledgment protocol ([1ea9d08](https://github.com/antontranelis/web-of-trust/commit/1ea9d08533c43ceb68e15c05714c06156e5c6ca8))
* messaging outbox for offline reliability + WebSocket heartbeat ([73e564a](https://github.com/antontranelis/web-of-trust/commit/73e564aabd17a8ad715c4fb4b78b79fb98e7bc0f))
* Profile management, recovery UX, relay deployment config ([fd90cbd](https://github.com/antontranelis/web-of-trust/commit/fd90cbdad73d529b9dd54f617f6cfec6576f90f9))
* relay multi-device support ([2c4a1f3](https://github.com/antontranelis/web-of-trust/commit/2c4a1f36ac0d9ddc95c03bb3a91d956c685cc731))
* rename packages from [@web](https://github.com/web).of.trust/* to [@web](https://github.com/web)_of_trust/* ([85a0730](https://github.com/antontranelis/web-of-trust/commit/85a0730a553ba89761f779c894fd870f347d7dbc))
* rename packages from @real-life/* to [@web](https://github.com/web).of.trust/* ([9ddb159](https://github.com/antontranelis/web-of-trust/commit/9ddb159170d743fd0ae3f70993c981118fd8e4f2))
* VaultPushScheduler + relay peer count (Phase 1.5) ([8987cb3](https://github.com/antontranelis/web-of-trust/commit/8987cb3d26595f98015ae163eb413becb9c6780a))


### Bug Fixes

* **ci:** resolve port conflict between wot-relay and wot-profiles tests ([0fae15f](https://github.com/antontranelis/web-of-trust/commit/0fae15ff11bf5fc431dca0f8da5e884592d9d528))
* relay tests for challenge-response auth ([f60c0e7](https://github.com/antontranelis/web-of-trust/commit/f60c0e7e8dd1e307fd48477a410381251ece85b2))
* relay TypeScript strict BufferSource compatibility ([2b45169](https://github.com/antontranelis/web-of-trust/commit/2b45169e578b456b6837b691f98f734ef3825ae9))
* SPA routing under /demo base path + env config ([919c3e7](https://github.com/antontranelis/web-of-trust/commit/919c3e74a938ed1e859b415946fa810e58e0f0a6))
* use 'as any' for crypto.subtle in Docker TS environment ([a867e80](https://github.com/antontranelis/web-of-trust/commit/a867e805a8fb88a91d8a6ff4fbf228718203d642))
* use ArrayBuffer instead of Uint8Array for crypto.subtle calls ([2a9c364](https://github.com/antontranelis/web-of-trust/commit/2a9c364d261885f22bfe41bbe378fc96ad130ed6))

## [0.1.1](https://github.com/antontranelis/web-of-trust/compare/@web_of_trust/relay-v0.1.0...@web_of_trust/relay-v0.1.1) (2026-03-26)


### Features

* Add blog with markdown articles and React Router ([5619d0b](https://github.com/antontranelis/web-of-trust/commit/5619d0bf504b817a5647fc351bb27b4067808cde))
* Add WebSocket relay server and WebSocketMessagingAdapter ([ff27bf7](https://github.com/antontranelis/web-of-trust/commit/ff27bf7c5ff7e7105b19a0fc3aa8103478f3a281))
* Connect demo app to WebSocket relay for live attestation delivery ([b342dfe](https://github.com/antontranelis/web-of-trust/commit/b342dfeaac7a0682046b5560ae04a10befc50887))
* debug dashboard + relay challenge-response auth ([4894aa3](https://github.com/antontranelis/web-of-trust/commit/4894aa3efd0fca9c8e55a28a9fe735ff4de5e0d7))
* delivery acknowledgment protocol ([1ea9d08](https://github.com/antontranelis/web-of-trust/commit/1ea9d08533c43ceb68e15c05714c06156e5c6ca8))
* messaging outbox for offline reliability + WebSocket heartbeat ([73e564a](https://github.com/antontranelis/web-of-trust/commit/73e564aabd17a8ad715c4fb4b78b79fb98e7bc0f))
* Profile management, recovery UX, relay deployment config ([fd90cbd](https://github.com/antontranelis/web-of-trust/commit/fd90cbdad73d529b9dd54f617f6cfec6576f90f9))
* relay multi-device support ([2c4a1f3](https://github.com/antontranelis/web-of-trust/commit/2c4a1f36ac0d9ddc95c03bb3a91d956c685cc731))
* rename packages from @real-life/* to [@web](https://github.com/web).of.trust/* ([9ddb159](https://github.com/antontranelis/web-of-trust/commit/9ddb159170d743fd0ae3f70993c981118fd8e4f2))
* VaultPushScheduler + relay peer count (Phase 1.5) ([8987cb3](https://github.com/antontranelis/web-of-trust/commit/8987cb3d26595f98015ae163eb413becb9c6780a))


### Bug Fixes

* **ci:** resolve port conflict between wot-relay and wot-profiles tests ([0fae15f](https://github.com/antontranelis/web-of-trust/commit/0fae15ff11bf5fc431dca0f8da5e884592d9d528))
* relay tests for challenge-response auth ([f60c0e7](https://github.com/antontranelis/web-of-trust/commit/f60c0e7e8dd1e307fd48477a410381251ece85b2))
* relay TypeScript strict BufferSource compatibility ([2b45169](https://github.com/antontranelis/web-of-trust/commit/2b45169e578b456b6837b691f98f734ef3825ae9))
* SPA routing under /demo base path + env config ([919c3e7](https://github.com/antontranelis/web-of-trust/commit/919c3e74a938ed1e859b415946fa810e58e0f0a6))
* use 'as any' for crypto.subtle in Docker TS environment ([a867e80](https://github.com/antontranelis/web-of-trust/commit/a867e805a8fb88a91d8a6ff4fbf228718203d642))
* use ArrayBuffer instead of Uint8Array for crypto.subtle calls ([2a9c364](https://github.com/antontranelis/web-of-trust/commit/2a9c364d261885f22bfe41bbe378fc96ad130ed6))
