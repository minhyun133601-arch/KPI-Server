# AGENTS.md
작성일 / Date: `2026-04-03`

> 이 문서는 KPI 저장소의 **AI 역할, 코드 생성 규약, 보안 기준, 테스트·완료 기준**을 정의하는 단일 기준 문서다.  
> This document is the single source of truth for the KPI repository’s **AI role, code-generation contract, security baseline, and testing/completion gates**.

## Boundary Header / 경계 헤더

```yaml
authority_doc: true
doc_name: "AGENTS.md"
doc_scope: "AI role, code rules, verification rules / AI 역할, 코드 규칙, 검증 규칙"
owns:
  - "AI working behavior / AI 작업 방식"
  - "coding rules and architecture boundaries / 코딩 규칙과 아키텍처 경계"
  - "testing, lint, typecheck, verification, and done gates / 테스트·린트·타입체크·검증·완료 게이트"
  - "repo documentation language policy / 저장소 문서 언어 정책"
  - "maintainability, security, and change hygiene / 유지보수성·보안·변경 위생"
not_own:
  - "serverization roadmap or runtime rollout phase / 서버화 로드맵 또는 런타임 롤아웃 단계"
  - "network ACL, firewall, VLAN, DNS, reverse proxy exposure decision / 네트워크 ACL·방화벽·VLAN·DNS·리버스 프록시 노출 결정"
  - "IT-facing wording, request packaging, or handoff message / IT 전달 문구·요청 패키지·핸드오프 메시지"
authority_set:
  - "AGENTS.md"
supporting_docs_only:
  - "legacy analyses"
  - "old prompts"
  - "archived reference material"
```

## 0. Normative Keywords / 규범 키워드

### Directive A-00
- KR: `MUST / 반드시`는 예외 없이 따라야 하는 하드 룰이다.
- EN: `MUST` means a hard requirement with no silent exception.

### Directive A-00b
- KR: `MUST NOT / 절대 금지`는 예외 없이 금지되는 행위다.
- EN: `MUST NOT` means a prohibited action with no silent exception.

### Directive A-00c
- KR: `SHOULD / 기본값`은 강한 기본값이며, 벗어나려면 이유를 남겨야 한다.
- EN: `SHOULD` is a strong default; deviation requires an explicit reason.

### Directive A-00d
- KR: `MAY / 선택 가능`은 상황이 정당화될 때만 허용되는 선택이다.
- EN: `MAY` is optional only when the context clearly justifies it.

## 1. Authority, Precedence, and Cross-Document Boundary / 권한, 우선순위, 문서 간 경계

### Directive A-01
- KR: 현재 대화의 명시적 사용자 지시는 항상 이 문서보다 우선한다.
- EN: Explicit user instructions in the current conversation always override this document.

### Directive A-02
- KR: 이 문서는 저장소 전체의 AI 작업 방식, 코드 구조 규칙, 테스트/완료 기준을 결정한다.
- EN: This document governs repository-wide AI behavior, code-structure rules, and testing/completion standards.

### Directive A-03
- KR: 이 저장소의 활성 권위 문서는 `AGENTS.md` 하나다. 제거된 병렬 문서나 외부 문서를 현재 기준으로 삼지 않는다.
- EN: `AGENTS.md` is the only active authority document for this repository. Removed parallel or external docs are not authoritative.

### Directive A-04
- KR: 과거 작업환경 메모, 옛 프롬프트, 삭제된 문서명은 참고 흔적으로만 취급한다. 현재 규칙은 이 문서에 흡수한다.
- EN: Historical setup notes, old prompts, and removed document names are reference traces only. Current rules must be absorbed into this document.

### Directive A-05
- KR: 이 문서는 **코드를 어떻게 수정할지**를 결정하지만, **무슨 네트워크를 열지**나 **어떤 문구로 IT에 전달할지**는 결정하지 않는다.
- EN: This document decides **how code should be changed**, but it does not decide **which network path should be opened** or **how the IT handoff should be phrased**.

### Directive A-06
- KR: archive, old prompts, legacy analyses는 supporting material일 뿐 권위 문서가 아니다.
- EN: Archive material, old prompts, and legacy analyses are supporting material only; they are not authority documents.

### Directive A-07
- KR: 충돌이 코드 스타일, 테스트, 레이어 분리, 보안 기본기, 문서 언어 정책에 관한 것이라면 `AGENTS.md`가 이긴다.
- EN: If the conflict is about code style, tests, layering, security fundamentals, or documentation language policy, `AGENTS.md` wins.

### Directive A-07a
- KR: 새 코드, 검증, 런타임, 작업환경 규칙은 병렬 권위 문서로 늘리지 말고 `AGENTS.md`에만 추가한다.
- EN: New code, verification, runtime, and workstation rules must not grow into parallel authority docs; add them to `AGENTS.md` only.

### Directive A-08
- KR: 삭제된 문서를 참조하는 오래된 지시와 현재 `AGENTS.md`가 충돌하면 `AGENTS.md`가 이긴다.
- EN: If an old instruction that references a removed document conflicts with current `AGENTS.md`, `AGENTS.md` wins.

### Directive A-09
- KR: 저장소 안에 남아 있는 handoff, audit, legacy 문서는 supporting material로만 읽고, 기준 판단은 `AGENTS.md`로 한다.
- EN: Treat handoff, audit, and legacy docs left in the repo as supporting material only; base decisions on `AGENTS.md`.

## 2. AI Role and Working Posture / AI 역할과 작업 태도

### Directive A-10
- KR: 에이전트는 영리한 요령보다 **정확성, 보안, 유지보수성, 리뷰 가능성**을 우선하는 시니어 엔지니어처럼 행동해야 한다.
- EN: The agent MUST act like a careful senior engineer who prioritizes **correctness, security, maintainability, and reviewability** over clever shortcuts.

### Directive A-11
- KR: 작업 시작 전에는 이 문서, 저장소의 현재 문서, build/test 설정, CI 설정, 그리고 실제로 손댈 파일을 먼저 읽는다.
- EN: Before editing, the agent MUST read this document, the repo’s current docs, build/test configuration, CI configuration, and the files that will actually be touched.

### Directive A-12
- KR: 여러 모듈, 데이터 모델, 공개 동작을 건드리는 변경은 수정 전에 짧은 계획을 먼저 남긴다.
- EN: Any change that touches multiple modules, data models, or public behavior MUST start with a short plan before editing.

### Directive A-13
- KR: 요청을 해결하는 가장 작은 coherent change를 우선한다. 관련 없는 리팩터링은 금지한다.
- EN: Prefer the smallest coherent change that solves the request. Unrelated refactors are prohibited.

### Directive A-14
- KR: 질문보다 제안을 우선한다. 다만 **소유권, 데이터 의미, 구조, 보안 경계, 노출 범위**가 바뀌는 경우에는 질문해야 한다.
- EN: Prefer concrete proposals over repeated questions. However, the agent MUST ask when **ownership, data meaning, structure, security boundary, or exposure scope** would change.

### Directive A-15
- KR: 작업 종료 보고에는 최소한 `변경 파일`, `검증 결과`, `남은 위험`, `다음 즉시 할 일`을 남긴다.
- EN: Final reporting MUST include at least `files changed`, `verification results`, `remaining risks`, and `the next immediate action`.

### Directive A-16
- KR: 사용자가 **서버를 띄운 상태에서 확인해야 한다**고 요청했거나, 수정 효과가 **실제 서버 서빙 UI에서만 정확히 검증되는 작업**이라면, 에이전트는 가능한 한 작업 중 현재 서버를 직접 실행하거나 이미 떠 있는 서버를 재사용해야 한다. 작업이 끝나면 사용자 확인용으로 앱 주소를 다시 열어 두고, 어떤 주소에서 확인하면 되는지 함께 알려야 한다.
- EN: If the user asks to verify the work with the server running, or if the change can only be validated accurately through the live server-served UI, the agent SHOULD run the current server during the task or reuse an already-running server when available. After the work is done, the agent SHOULD reopen the app URL for user verification and explicitly tell the user which URL to check.

## 3. Language and Communication Policy / 언어와 커뮤니케이션 정책

### Directive A-20
- KR: 사용자에게 보여주는 설명, 제안, 경고, 요약은 기본적으로 한국어로 작성한다.
- EN: User-facing explanations, proposals, warnings, and summaries SHOULD default to Korean.

### Directive A-21
- KR: 파일명, 식별자, 코드, 스키마명, 경로, API명은 정확성이 중요할 때 영어를 유지한다.
- EN: File names, identifiers, code, schema names, paths, and API names MAY remain in English when precision matters.

### Directive A-22
- KR: 저장소 소유 `*.md` 규칙/프롬프트/인계 문서는 가능하면 한국어와 영어를 함께 유지한다.
- EN: Repo-owned `*.md` rules, prompts, and handoff documents SHOULD keep both Korean and English whenever practical.

### Directive A-23
- KR: 긴 문서는 줄 단위 완전 번역이 아니어도 되지만, **핵심 운영 규칙, 위험 경계, 금지사항**은 영어에도 반드시 남겨야 한다.
- EN: Long documents do not need line-by-line full translation, but **core operating rules, risk boundaries, and prohibitions** MUST also appear in English.

### Directive A-23a
- KR: 사용자의 명시적 요청이 없는 한 repo-owned authority/rules markdown는 `AGENTS.md` 하나만 유지한다. 추가 checklist, runbook, temporary note, helper prompt `*.md`는 만들지 않는다.
- EN: Unless the user explicitly requests it, keep repo-owned authority/rules markdown limited to `AGENTS.md`. Do not create extra checklist, runbook, temporary-note, or helper-prompt `*.md` files.

### Directive A-24
- KR: 설명은 쉽게 하되 기준은 낮추지 않는다.
- EN: Explanations should be simple, but the engineering bar MUST remain high.

## 4. Repository and Architecture Rules / 저장소와 아키텍처 규칙

### Directive A-30
- KR: 현재 저장소 구조는 강한 이유가 없는 한 유지한다. 새 영역은 거대한 기술 버킷보다 feature-first 경계를 선호한다.
- EN: Preserve the current repository structure unless there is a strong reason to improve it. Prefer feature-first boundaries over giant technology buckets.

### Directive A-31
- KR: transport/UI 계층은 얇아야 한다. 비즈니스 규칙은 controller, view, route, handler 안에 두지 않는다.
- EN: Transport and UI layers MUST remain thin. Business rules MUST NOT live inside controllers, views, routes, or handlers.

### Directive A-32
- KR: persistence, 외부 API, 파일 저장소, queue 같은 인프라 관심사는 domain 규칙과 분리한다.
- EN: Persistence, external APIs, file storage, queues, and other infra concerns MUST stay separated from domain rules.

### Directive A-33
- KR: `shared/`는 2개 이상 feature에서 재사용되는 안정 코드에만 쓴다. dumping ground로 만들지 않는다.
- EN: `shared/` is only for stable code reused by two or more features. It MUST NOT become a dumping ground.

### Directive A-34
- KR: 하나의 함수는 하나의 주된 일을, 하나의 파일은 하나의 주된 변경 이유를 가져야 한다.
- EN: One function SHOULD do one main job, and one file SHOULD have one main reason to change.

### Directive A-35
- KR: parsing/validation, business logic, persistence, presentation은 분리한다.
- EN: Parsing/validation, business logic, persistence, and presentation MUST be separated.

### Directive A-36
- KR: 이름은 의도를 드러내야 한다. `helper`, `manager`, `misc`, `temp`, `thing` 같은 모호한 이름은 피한다.
- EN: Names MUST reveal intent. Vague names such as `helper`, `manager`, `misc`, `temp`, or `thing` SHOULD be avoided.

### Directive A-37
- KR: Boolean 이름은 `is_`, `has_`, `can_`, `should_`처럼 predicate로 읽혀야 한다.
- EN: Boolean names SHOULD read like predicates such as `is_`, `has_`, `can_`, or `should_`.

## 5. Size, Complexity, and Maintainability Guards / 크기, 복잡도, 유지보수성 가드

### Directive A-40
- KR: 일반 코드의 soft limit는 `파일 300 LOC`, `함수/메서드 40 LOC`, `클래스 200 LOC`, `중첩 깊이 3`을 기본값으로 본다.
- EN: For general code, the soft limits are `300 LOC per file`, `40 LOC per function/method`, `200 LOC per class`, and nesting depth `3`.

### Directive A-41
- KR: hard limit는 `파일 500 LOC`, `함수/메서드 80 LOC`, `클래스 300 LOC`다. 넘으면 분할하거나 이유를 문서화한다.
- EN: The hard limits are `500 LOC per file`, `80 LOC per function/method`, and `300 LOC per class`. If exceeded, split the unit or document the reason.

### Directive A-42
- KR: KPI 활성 JS/HTML 로직 파일에는 별도 가드가 있다. soft cap은 `1,200줄`, hard guard는 `1,500줄`이다. 단, data-only JS와 CSS는 예외다.
- EN: Active KPI JS/HTML logic files have a separate guard: soft cap `1,200 lines`, hard guard `1,500 lines`. Data-only JS and CSS are exempt.

### Directive A-43
- KR: 새 활성 로직 파일은 가능하면 `800줄` 안쪽을 목표로 한다.
- EN: New active logic files SHOULD target `800 lines` or less whenever practical.

### Directive A-44
- KR: `KPI.html`은 shell, loader, version, global mount wiring 중심으로 유지한다. 새 도메인 로직은 가능하면 각 도메인 runtime 파일로 내린다.
- EN: `KPI.html` MUST remain focused on shell, loader, versioning, and global mount wiring. New domain logic SHOULD move into domain runtime files.

### Directive A-45
- KR: `06_★★★_KPI런타임/internal-server/src/server.js`는 endpoint, bootstrap, static serve, file/document handling이 한 파일에 무한 축적되지 않도록 책임별로 분리한다.
- EN: `06_★★★_KPI런타임/internal-server/src/server.js` MUST NOT become an infinite accumulation point for endpoints, bootstrap logic, static serving, and file/document handling; split by responsibility.

### Directive A-46
- KR: `02_★★★★_유틸리티/apps/metering/app.js`는 대형 예외 파일이지만, 분할은 항상 `구조 분석 -> 분할 계획 -> 사용자 확인 -> 단계 실행` 순서를 따른다.
- EN: `02_★★★★_유틸리티/apps/metering/app.js` is a large-file exception, but any split MUST follow `structure analysis -> split plan -> user confirmation -> staged execution`.

## 6. Universal Code Contract / 공통 코드 계약

### Directive A-50
- KR: 모든 외부 입력은 boundary에서 검증한다. invalid state를 표현하기 어렵게 만든다.
- EN: All external input MUST be validated at the boundary. Invalid states SHOULD be hard to represent.

### Directive A-51
- KR: 입력 모델과 출력 모델은 분리한다.
- EN: Input models and output models MUST remain separate.

### Directive A-52
- KR: controller, route, handler, page-level event glue는 business rule을 직접 들고 있지 않아야 한다.
- EN: Controllers, routes, handlers, and page-level event glue MUST NOT own business rules directly.

### Directive A-53
- KR: 서비스 계층은 use-case orchestration과 transaction boundary를 담당한다. persistence는 repository/infra 계층이 담당한다.
- EN: The service layer owns use-case orchestration and transaction boundaries. Persistence belongs to repository/infra layers.

### Directive A-54
- KR: **DB 접근은 service에서 직접 하지 말고 repository 또는 명시된 persistence adapter를 거친다.**
- EN: **Services MUST NOT access the DB directly; they MUST go through a repository or an explicitly defined persistence adapter.**

### Directive A-55
- KR: schema를 바꾸면 migration과 rollback/recovery 메모를 같이 남긴다.
- EN: Any schema change MUST ship with a migration and a rollback/recovery note.

### Directive A-56
- KR: 환경변수는 한 곳에서 읽어 typed config 객체로 매핑한다. raw env lookup을 코드베이스 전체에 흩뿌리지 않는다.
- EN: Environment variables MUST be read in one place and mapped into typed config objects. Raw env lookups MUST NOT be scattered across the codebase.

### Directive A-57
- KR: 비밀정보, API 키, DB 비밀번호, 환경별 endpoint는 하드코딩하지 않는다.
- EN: Secrets, API keys, DB passwords, and environment-specific endpoints MUST NOT be hard-coded.

### Directive A-58
- KR: 예외를 조용히 삼키지 않는다. low-level error는 boundary에서 domain/application error로 번역한다.
- EN: Exceptions MUST NOT be swallowed silently. Low-level errors SHOULD be translated into domain/application errors at boundaries.

### Directive A-59
- KR: 로그에는 actionable context를 남기되, secret, token, credential, personal data는 redaction 없이는 남기지 않는다.
- EN: Logs SHOULD include actionable context, but secrets, tokens, credentials, and personal data MUST NOT be logged unless explicitly redacted.

### Directive A-60
- KR: SQL, shell, file path, serialization은 안전한 API를 사용한다. 사용자 입력으로 위험한 명령문을 조합하지 않는다.
- EN: SQL, shell, file-path, and serialization work MUST use safe APIs. Dangerous commands MUST NOT be assembled from unsanitized input.

### Directive A-61
- KR: comments는 왜, 제약, tradeoff를 설명해야 한다. obvious code를 풀어쓰는 주석은 피한다.
- EN: Comments SHOULD explain why, constraints, or tradeoffs. Avoid comments that merely restate obvious code.

### Directive A-62
- KR: dead code는 주석 처리보다 삭제를 우선한다.
- EN: Dead code SHOULD be deleted rather than commented out.

## 7. Current KPI Runtime and Node.js Rules / 현재 KPI 런타임과 Node.js 규칙

### Directive A-70
- KR: 현재 live KPI internal-server baseline은 `Node.js + PostgreSQL 17 + server-managed file storage`다.
- EN: The current live KPI internal-server baseline is `Node.js + PostgreSQL 17 + server-managed file storage`.

### Directive A-71
- KR: 명시적 승인 없이 현재 live Node baseline을 FastAPI/NestJS/React/새 UI로 몰래 재작성하지 않는다.
- EN: The current live Node baseline MUST NOT be silently rewritten into FastAPI, NestJS, React, or a new UI without explicit approval.

### Directive A-72
- KR: 서버화 1차 제품 표면은 `KPI.html` 직접 서빙이다. wrapper UI나 preview UI를 기본값으로 만들지 않는다.
- EN: The first serverized product surface is direct serving of `KPI.html`. Wrapper or preview UIs MUST NOT be introduced by default.

### Directive A-73
- KR: 상단 저장 버튼과 `Ctrl+S`는 같은 authority write path를 타야 한다.
- EN: The top save button and `Ctrl+S` MUST use the same authority write path.

### Directive A-74
- KR: `KPI.html`의 사용자 가시 동작이 바뀌면 visible body-version을 증가시킨다.
- EN: If user-visible behavior in `KPI.html` changes, the visible body-version MUST be incremented.

### Directive A-75
- KR: route handler는 validation과 delegation까지가 기본 책임이다. persistence와 business rule은 route 밖으로 뺀다.
- EN: Route handlers SHOULD mainly validate and delegate. Persistence and business rules SHOULD live outside the route layer.

### Directive A-76
- KR: touched Node server code에서 DB가 필요하면, SQL/ORM 호출은 repository, storage module, query module 같은 persistence 경계에 모은다.
- EN: If touched Node server code needs DB access, SQL/ORM calls SHOULD be concentrated in a persistence boundary such as a repository, storage module, or query module.

### Directive A-77
- KR: static file serve, portal bootstrap, auth/session, document/file handling은 가능한 한 helper 또는 module 경계를 통해 분리한다.
- EN: Static serving, portal bootstrap, auth/session, and document/file handling SHOULD be split through helper or module boundaries whenever practical.

### Directive A-78
- KR: 기존 구조와 호환되는 한 작은 reversible patch를 우선한다.
- EN: Prefer small, reversible patches as long as they remain compatible with the current structure.

## 8. Python Service Hard Rules (Only When Explicitly Approved) / Python 서비스 하드 룰 (명시적으로 승인된 경우에만)

### Directive A-80
- KR: 아래 규칙은 **신규 isolated Python 서비스**를 명시적으로 만들기로 승인된 경우에만 적용한다. 현재 Node baseline을 자동 교체하는 규칙이 아니다.
- EN: The rules below apply **only when a new isolated Python service** has been explicitly approved. They are not a silent replacement for the current Node baseline.

### Directive A-81
- KR: 모든 HTTP endpoint는 `async`로 작성한다.
- EN: All HTTP endpoints MUST be implemented as `async`.

### Directive A-82
- KR: HTTP layer는 `FastAPI`를 기본값으로 하고, 요청/응답 스키마는 `Pydantic v2` 모델로 명시한다.
- EN: The default HTTP layer SHOULD be `FastAPI`, and request/response schemas MUST be expressed with `Pydantic v2` models.

### Directive A-83
- KR: ORM/DB 계층은 `SQLAlchemy 2.x asyncio`와 `async_sessionmaker`를 기본값으로 한다.
- EN: The ORM/DB layer SHOULD default to `SQLAlchemy 2.x asyncio` with `async_sessionmaker`.

### Directive A-84
- KR: 서비스는 DB session에 직접 쿼리를 날리는 장소가 아니다. DB 읽기/쓰기는 repository가 담당한다.
- EN: Services MUST NOT become a place for ad hoc DB session queries. Reads and writes belong to repositories.

### Directive A-85
- KR: transaction boundary는 service/use-case에서 명시한다.
- EN: Transaction boundaries MUST be explicit in the service/use-case layer.

### Directive A-86
- KR: schema 변경은 `Alembic` migration 없이는 완료로 보지 않는다.
- EN: A schema change is NOT considered complete without an `Alembic` migration.

### Directive A-87
- KR: 외부 HTTP 호출은 `HTTPX`를 사용하고 timeout을 명시한다. 무한 대기 기본값에 기대지 않는다.
- EN: External HTTP calls SHOULD use `HTTPX` with explicit timeouts. Do not rely on implicit infinite waits.

### Directive A-88
- KR: 각 버그 수정에는 가능하면 regression test를 붙인다. 완료 전에는 `pytest`로 검증한다.
- EN: Each bug fix SHOULD include a regression test when practical. Work MUST be verified with `pytest` before completion.

### Directive A-89
- KR: 포맷/품질 게이트는 기본적으로 `ruff check`, `ruff format --check`를 사용한다. typecheck 도구가 설정돼 있으면 함께 통과해야 한다.
- EN: The default formatting/quality gate SHOULD use `ruff check` and `ruff format --check`. If a typechecker is configured, it MUST also pass.

### Directive A-90
- KR: background job, scheduler, retry는 idempotency와 duplicate-safe 설계 없이는 넣지 않는다.
- EN: Background jobs, schedulers, and retries MUST NOT be introduced without idempotent and duplicate-safe design.

## 9. Security Rules / 보안 규칙

### Directive A-100
- KR: “버튼을 숨겼다”는 권한 통제가 아니다. 모든 write와 민감 read는 서버 측 인증/권한/객체 단위 접근 검사를 통과해야 한다.
- EN: “The button is hidden” is not authorization. Every write and sensitive read MUST pass server-side auth, permission, and object-level access checks.

### Directive A-101
- KR: IDOR, SQLi, XSS, CSRF, 잘못된 세션 처리, secret 노출을 기본 위협 모델로 본다.
- EN: Treat IDOR, SQL injection, XSS, CSRF, broken session handling, and secret exposure as baseline threats.

### Directive A-102
- KR: `postMessage`는 가능한 한 same-origin 또는 명시된 allowlist origin만 허용한다.
- EN: `postMessage` SHOULD be restricted to same-origin or an explicit allowlist origin whenever practical.

### Directive A-103
- KR: 파일 업로드는 확장자 allowlist, 크기 제한, 서버 재생성 파일명, 안전 저장 경로를 사용한다.
- EN: File uploads MUST use an extension allowlist, size limits, server-generated file names, and safe storage paths.

### Directive A-104
- KR: least privilege를 기본값으로 한다. 애플리케이션 변경 작업에서 공인 노출, 포트 오픈, 방화벽 완화는 명시 승인 없이는 건드리지 않는다.
- EN: Least privilege is the default. Public exposure, port opening, or firewall relaxation MUST NOT be changed during app work without explicit approval.

### Directive A-105
- KR: 관리자 기능, 권한 변경, 승인 처리, 대량 삭제/수정 같은 고위험 동작은 일반 기능보다 더 엄격하게 검토한다.
- EN: Admin features, permission changes, approval actions, and bulk destructive operations MUST receive stricter review than ordinary features.

## 10. Testing, Verification, and Done Gates / 테스트, 검증, 완료 게이트

### Directive A-110
- KR: 관련 코드가 바뀌면 관련 테스트를 추가하거나 갱신한다. 가능하면 버그 수정에는 regression test를 붙인다.
- EN: When relevant code changes, relevant tests MUST be added or updated. Bug fixes SHOULD include regression tests when practical.

### Directive A-111
- KR: 단위 로직은 unit test, 경계 동작은 integration test, 중요한 사용자 흐름은 e2e 또는 동등한 시나리오 검증을 우선한다.
- EN: Prefer unit tests for core logic, integration tests for boundary behavior, and e2e or equivalent scenario checks for critical user flows.

### Directive A-112
- KR: mock은 진짜 외부 경계에서만 쓴다.
- EN: Mock only true external boundaries.

### Directive A-113
- KR: work is not done until relevant formatting, lint, typecheck, test, and build checks for the touched area pass.
- EN: Work is not done until the relevant formatting, lint, typecheck, test, and build checks for the touched area pass.

### Directive A-114
- KR: 저장소에 표준 명령이 있으면 그 명령을 따른다. README, Makefile, package.json, pyproject, CI를 먼저 확인한다.
- EN: If the repo already has standard commands, use them. Inspect the README, Makefile, package.json, pyproject, and CI first.

### Directive A-115
- KR: 테스트가 없거나 실행할 수 없는 경우, 그 공백과 이유를 숨기지 말고 최종 보고에 적는다.
- EN: If tests do not exist or cannot be run, do not hide the gap; report it explicitly in the final handoff.

## 11. Forbidden Patterns / 금지 패턴

### Directive A-120
- KR: 거대한 catch-all `utils`, `helpers`, `misc`, `common` 모듈을 새로 만들지 않는다.
- EN: Do not create giant catch-all `utils`, `helpers`, `misc`, or `common` modules.

### Directive A-121
- KR: validation, I/O, business rule, formatting을 한 함수에 섞지 않는다.
- EN: Do not mix validation, I/O, business rules, and formatting in one function.

### Directive A-122
- KR: broad exception catch 후 context 없이 무시하지 않는다.
- EN: Do not catch broad exceptions and ignore them without adding context.

### Directive A-123
- KR: “나중의 유연성”만을 이유로 speculative framework나 추상화를 도입하지 않는다.
- EN: Do not introduce speculative frameworks or abstractions merely for “future flexibility.”

### Directive A-124
- KR: 권위 문서를 병렬로 늘리지 않는다. 새 기준은 `AGENTS.md` 안에 흡수한다.
- EN: Do not grow parallel authority documents. New rules SHOULD be absorbed into `AGENTS.md`.

### Directive A-125
- KR: live runtime을 다루는 작업에서 승인 없이 스택 전환, 공개 주소 전환, 저장 권위본 전환을 하지 않는다.
- EN: When touching the live runtime, do not change the stack, exposure address, or storage authority without approval.

## 12. Build-System Delivery and Human Review Boundaries / 시스템 구축 산출물과 사람 검토 경계

### Directive A-126
- KR: 새 업무 시스템이나 서버형 제품 작업은 가능하면 `문서화 -> auth/permission 골격 -> core CRUD/use-case -> deploy/ops 산출물 -> tests/hardening` 순서로 진행한다.
- EN: For new business systems or server-backed products, prefer the order `documentation -> auth/permission skeleton -> core CRUD/use-cases -> deploy/ops artifacts -> tests/hardening`.

### Directive A-127
- KR: 사람 검토가 반드시 필요한 영역은 최소한 `인증`, `권한`, `승인 흐름`, `저장 권위본`, `외부 노출`, `마이그레이션`, `백업/복구`, `보안 사고 대응`이다.
- EN: Human review is mandatory at least for `authentication`, `authorization`, `approval flows`, `storage authority`, `external exposure`, `migrations`, `backup/restore`, and `security-incident response`.

### Directive A-128
- KR: `개발 환경에서 된다`와 `운영 가능하다`를 구분한다. 로그, 감사, 백업, 복구, 운영 체크리스트 없이 서버형 시스템을 완료로 처리하지 않는다.
- EN: Distinguish `works in development` from `operable in production`. Do not mark a server-backed system complete without logs, auditability, backup, restore, and an operating checklist.

### Directive A-129
- KR: 중간 이상 규모 시스템 작업의 산출물은 가능하면 `설계 산출물`, `코드 산출물`, `운영 산출물`, `검증 산출물`로 나눠 보고한다. 빠진 항목이 있으면 빠졌다고 적는다.
- EN: For medium-or-larger system work, report outputs as `design artifacts`, `code artifacts`, `operations artifacts`, and `verification artifacts` when practical. If a category is missing, say so explicitly.

## 13. Final Report Contract / 최종 보고 계약

### Directive A-130
- KR: 최종 보고는 최소한 아래 형식을 따른다.
- EN: Final reporting MUST at least follow the structure below.

```text
1) 목표 / Goal
2) 변경 파일 / Changed files
3) 적용한 핵심 규칙 / Key rules applied
4) 검증 결과 / Verification results
5) 남은 위험 또는 미완료 / Remaining risks or gaps
6) 다음 즉시 할 일 / Next immediate action
```

## 14. Easy English Companion / 쉬운 영어 요약

- This file controls how the AI works, how code should be structured, how tests/security should be enforced, and when work is truly done.
- It does **not** control the server rollout plan or the IT handoff wording.
- Keep the current live Node-based KPI server stable unless the user explicitly approves a different path.
- For new Python services, use async endpoints, Pydantic v2, repository-based persistence, migrations, and pytest verification.
- Human review remains mandatory for auth, approval, migration, backup/restore, and exposure-boundary decisions.
