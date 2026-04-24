# AGENTS.md
작성일 / Date: `2026-04-03`
개정일 / Revised: `2026-04-24` — patch/비전공자용 아키텍처-first 기록 규칙 추가

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
  - "delivery order or progress board / 실행 순서 또는 진행 현황 보드"
  - "network ACL, firewall, VLAN, DNS, reverse proxy exposure decision / 네트워크 ACL·방화벽·VLAN·DNS·리버스 프록시 노출 결정"
  - "IT-facing wording, request packaging, or handoff message / IT 전달 문구·요청 패키지·핸드오프 메시지"
authority_set:
  - "AGENTS.md"
supporting_docs_only:
  - "patch history (`patch.md`)"
  - "plain-language patch companion (`비전공자용.md`)"
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

### Directive A-10a
- KR: 에이전트는 장기 진행/status 문서를 운영하는 역할이 아니라, 현재 요청의 **실제 코드 변경, 검증, 기록**을 끝까지 처리하는 실작업 역할로 동작한다. 진행 흔적은 별도 진행 문서 대신 `patch.md`에 짧고 사실적으로 남긴다.
- EN: The agent MUST behave as a hands-on delivery worker for the current request, not as a maintainer of long-lived progress or status documents. Progress history MUST be recorded briefly and factually in `patch.md` instead of separate progress docs.

### Directive A-11
- KR: 작업 시작 전에는 이 문서, 저장소의 현재 문서, build/test 설정, CI 설정, 그리고 실제로 손댈 파일을 먼저 읽는다.
- EN: Before editing, the agent MUST read this document, the repo’s current docs, build/test configuration, CI configuration, and the files that will actually be touched.

### Directive A-12
- KR: 여러 모듈, 데이터 모델, 공개 동작을 건드리는 변경은 수정 전에 짧은 계획을 먼저 남긴다.
- EN: Any change that touches multiple modules, data models, or public behavior MUST start with a short plan before editing.

### Directive A-12a
- KR: 현재 세션이 허용하고 관련 도구가 준비돼 있으면, 에이전트는 코드 탐색, 반복 점검, 브라우저 조작, 서버 상태 확인에 **서브에이전트와 MCP 세션을 적극 사용**해야 한다. 단, 현재 세션이 해당 기능을 지원하지 않거나 실패하면 가능한 기본 도구와 수동 절차로 즉시 대체하고, 어떤 대체 경로를 썼는지 최종 보고에 남긴다.
- EN: When the current session permits it and the relevant tools are available, the agent MUST actively use **sub-agents and MCP sessions** for code exploration, repeated inspection, browser interaction, and server-state checks. If those capabilities are unavailable or fail in the current session, the agent MUST immediately fall back to the best available built-in tools or manual procedure and report the fallback path in the final handoff.

### Directive A-13
- KR: 요청을 해결하는 가장 작은 coherent change를 우선한다. 관련 없는 구조 변경, 파일 이동, 이름 변경, 대량 추출은 금지한다.
- EN: Prefer the smallest coherent change that solves the request. Unrelated structural changes, file moves, renames, or bulk extractions are prohibited.

### Directive A-13a
- KR: 다른 로컬 작업공간이나 별도 로컬 사본에서 수정해 가져오는 파일도 예외가 아니다. 에이전트는 그런 반입 파일을 이 저장소의 **경로 구조, 이름 규칙, 레이어 경계, 검증 게이트, 문서 규칙**에 맞게 재편한 뒤 patch 로 적용해야 하며, 외부 작업물의 임시 구조나 개인 규칙을 그대로 들여오지 않는다.
- EN: Files modified in another local workspace or separate local copy are not an exception. The agent MUST reshape imported files to this repository's **path structure, naming rules, layering boundaries, verification gates, and documentation rules** before applying them as a patch, and MUST NOT bring in the external workspace's temporary structure or personal conventions unchanged.

### Directive A-14
- KR: 질문보다 제안을 우선한다. 다만 **소유권, 데이터 의미, 구조, 보안 경계, 노출 범위**가 바뀌는 경우에는 질문해야 한다.
- EN: Prefer concrete proposals over repeated questions. However, the agent MUST ask when **ownership, data meaning, structure, security boundary, or exposure scope** would change.

### Directive A-15
- KR: 작업 종료 보고에는 최소한 `변경 파일`, `검증 결과`, `남은 위험`, `다음 즉시 할 일`을 남긴다.
- EN: Final reporting MUST include at least `files changed`, `verification results`, `remaining risks`, and `the next immediate action`.

### Directive A-16
- KR: 사용자가 **서버를 띄운 상태에서 확인해야 한다**고 요청했거나, 수정 효과가 **실제 서버 서빙 UI에서만 정확히 검증되는 작업**이라면, 에이전트는 작업 중 현재 서버를 직접 실행하거나 이미 떠 있는 서버를 재사용해야 한다. 작업이 끝나면 사용자 확인용 URL을 명시적으로 다시 안내해야 한다.
- EN: If the user asks to verify the work with the server running, or if the change can only be validated accurately through the live server-served UI, the agent MUST run the current server during the task or reuse an already-running server. After the work is done, the agent MUST explicitly tell the user which URL to check.

### Directive A-16a
- KR: 현재 대화에서 로컬 런타임/검증 포트, DB 포트, 또는 서버 수 제약이 명시되면, 에이전트는 그 제약을 정확히 따라야 한다. 명시되지 않은 임시 포트나 추가 서버를 임의로 만들지 않는다.
- EN: If the current conversation specifies local runtime or verification ports, DB ports, or server-count constraints, the agent MUST honor them exactly and MUST NOT invent extra temporary ports or servers.

### Directive A-16b
- KR: 현재 대화가 포트를 덮어쓰지 않는 한, workflow, `package.json`, verifier, Playwright config 에 선언된 canonical 검증 포트/런타임 계약을 따른다. 저장소가 이미 선언한 검증 포트 세트가 있는데 임의 fallback 포트로 검증하거나 보고하는 행위는 금지한다.
- EN: Unless the current conversation explicitly overrides ports, the agent MUST follow the canonical verification ports and runtime contract declared in the workflow, `package.json`, verifier scripts, and Playwright config. It is prohibited to verify or report against ad hoc fallback ports when the repo already declares a canonical verification port set.

### Directive A-16c
- KR: 현재 KPI 로컬 포트 계약은 `운영 3100`, `DB 5434`, `검증 3192` 세 개로 고정한다. 별도 시험/브라우저 검증이 필요하면 검증 포트는 `3192` 하나만 쓰고, 이미 `3192` 세션이 떠 있으면 재사용한다. 에이전트는 이 세 개 외의 임시 포트나 추가 검증 포트를 임의로 열거나 보고하지 않는다.
- EN: The current KPI local port contract is fixed to three ports: `runtime 3100`, `DB 5434`, and `verification 3192`. If a separate test or browser-verification server is needed, the agent MUST use only verification port `3192`, and MUST reuse it when a `3192` session is already running. The agent MUST NOT open or report any extra ad hoc ports beyond this three-port contract.

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
- KR: repo-owned authority/rules markdown는 `AGENTS.md` 하나만 유지한다. `patch.md`와 `비전공자용.md`는 예외적으로 허용되는 **비권위 supporting 문서**이며, 그 외 checklist, runbook, temporary note, helper prompt `*.md`는 사용자의 명시적 요청 없이는 만들지 않는다.
- EN: Keep repo-owned authority/rules markdown limited to `AGENTS.md`. `patch.md` and `비전공자용.md` are the only standing **non-authoritative supporting docs** allowed by default; do not create other checklist, runbook, temporary-note, or helper-prompt `*.md` files without explicit user request.

### Directive A-23b
- KR: `patch.md`는 repo root 에 두는 patch history 전용 supporting 문서다. authority 문서는 아니며, 코드나 저장소 소유 문서를 수정하는 패치에는 날짜, 요약, 변경 파일, 검증 결과를 같은 패치에서 함께 기록한다.
- EN: `patch.md` is the repo-root supporting document dedicated to patch history. It is not an authority document, and any patch that changes code or repo-owned documentation MUST record the date, summary, changed files, and verification results in the same patch.

### Directive A-23c
- KR: `비전공자용.md`는 `patch.md`를 비전공자도 바로 이해할 수 있도록 쉬운 한국어로 풀어쓴 companion 문서다. authority 문서는 아니며, `patch.md`에 새 patch entry를 추가할 때는 같은 패치에서 같은 내용을 쉬운 말로 옮기고, 피할 수 없는 기술 용어에는 일상어 설명을 함께 붙인다.
- EN: `비전공자용.md` is the plain-Korean companion that rewrites `patch.md` so non-technical readers can understand it directly. It is not an authority document, and every new patch entry added to `patch.md` MUST be mirrored in the same patch using easy language plus everyday explanations for unavoidable technical terms.

### Directive A-23d
- KR: `patch.md` 상단에는 저장소 폴더/문서 아키텍처 개요를 **트리(tree) 형태**로 둔다. 각 날짜 patch entry 는 첫 소제목을 `Architecture Impact / 아키텍처 수정사항`으로 시작하고, 그 패치가 건드린 경로, 레이어, 문서, 기능 영역을 가능하면 **작은 touched-path tree** 로 먼저 보여 준다.
- EN: `patch.md` MUST keep the repo folder/document architecture overview near the top in a **tree-shaped view**. Each dated patch entry MUST start with `Architecture Impact` and, when practical, show the touched paths, layers, repo-owned docs, and feature areas first as a **small touched-path tree**.

### Directive A-23e
- KR: `비전공자용.md` 상단에는 같은 아키텍처 개요를 쉬운 한국어의 **트리 형태**로 둔다. 각 날짜 설명도 첫 소제목을 `이번 패치가 건드린 위치` 같은 쉬운 아키텍처 요약으로 시작하고, 기술 경로를 적을 때는 사람이 이해할 수 있는 설명을 같은 줄 또는 바로 아래에 붙인다.
- EN: `비전공자용.md` MUST mirror the same architecture overview near the top in an easy-Korean **tree-shaped view**. Each dated explanation MUST also start with a plain-language architecture summary such as `이번 패치가 건드린 위치`, and any technical path mentioned there MUST include a human-readable explanation on the same line or immediately below it.

### Directive A-24
- KR: 설명은 쉽게 하되 기준은 낮추지 않는다.
- EN: Explanations should be simple, but the engineering bar MUST remain high.

## 4. Repository and Architecture Rules / 저장소와 아키텍처 규칙

### Directive A-30
- KR: 현재 저장소 구조는 강한 이유가 없는 한 유지한다. 새 영역은 거대한 기술 버킷보다 feature-first 경계를 선호한다.
- EN: Preserve the current repository structure unless there is a strong reason to improve it. Prefer feature-first boundaries over giant technology buckets.

### Directive A-30a
- KR: 경로를 새로 만들거나 조정할 때는 기능 기준 디렉터리와 의도가 드러나는 평이한 이름을 우선한다. 새 경로나 조정된 경로에 정렬용 숫자, 장식용 기호, 의미 없는 접두 규칙을 계속 늘리지 않는다.
- EN: When creating or adjusting paths, prefer feature-based directories and plain intent-revealing names. Do not keep expanding new or adjusted paths with ordering numbers, decorative symbols, or meaningless prefixes.

### Directive A-30b
- KR: 경로나 구조를 바꿀 때는 loader, import, test, 문서를 같은 패치에서 함께 갱신한다. 깨진 참조를 남기는 부분 rename 이나 반쯤 끝난 move 는 금지한다.
- EN: When changing paths or structure, update loaders, imports, tests, and docs in the same patch. Partial renames or half-finished moves that leave broken references are prohibited.

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
- EN: One function MUST do one main job, and one file MUST have one main reason to change.

### Directive A-35
- KR: parsing/validation, business logic, persistence, presentation은 분리한다.
- EN: Parsing/validation, business logic, persistence, and presentation MUST be separated.

### Directive A-36
- KR: 이름은 의도를 드러내야 한다. 새로 추가하거나 이름을 바꾸는 파일, 함수, 모듈, 변수에 `helper`, `manager`, `misc`, `temp`, `thing` 같은 모호한 이름을 사용하지 않는다.
- EN: Names MUST reveal intent. New or renamed files, functions, modules, and variables MUST NOT use vague names such as `helper`, `manager`, `misc`, `temp`, or `thing`.

### Directive A-37
- KR: Boolean 이름은 `is_`, `has_`, `can_`, `should_`처럼 predicate로 읽혀야 한다.
- EN: Boolean names MUST read like predicates such as `is_`, `has_`, `can_`, or `should_`.

## 5. Size, Complexity, and Maintainability Guards / 크기, 복잡도, 유지보수성 가드

### Directive A-40
- KR: 일반 코드의 soft limit는 `파일 300 LOC`, `함수/메서드 40 LOC`, `클래스 200 LOC`, `중첩 깊이 3`을 기본값으로 본다.
- EN: For general code, the soft limits are `300 LOC per file`, `40 LOC per function/method`, `200 LOC per class`, and nesting depth `3`.

### Directive A-41
- KR: hard limit는 `파일 500 LOC`, `함수/메서드 80 LOC`, `클래스 300 LOC`다. 이 한도는 이 문서에 명시된 경로 범위 예외가 없는 한 넘기지 않는다.
- EN: The hard limits are `500 LOC per file`, `80 LOC per function/method`, and `300 LOC per class`. These limits MUST NOT be exceeded unless this document contains an explicit path-scoped exception.

### Directive A-41a

- KR: `kpi-runtime/internal-server/src/scripts/one-shot/` 하위 일회성 migration/repair 스크립트에는 파일 hard cap `800 LOC`를 적용한다. 스크립트 상단 주석에는 일회성 성격과 실행 후 archive 의도를 남긴다. 함수/메서드 80 LOC 및 클래스 300 LOC는 예외 없이 유지한다.
- EN: Scripts under `kpi-runtime/internal-server/src/scripts/one-shot/` use a file hard cap of `800 LOC`. The header comment MUST state the one-shot nature and the archive-after-run intent. Function/method (80 LOC) and class (300 LOC) limits remain unchanged.

### Directive A-41b

- KR: 현재 A-40/A-41의 **tracked legacy warning path** 는 비어 있어야 한다. split 대기 예외가 필요하면 path-scoped, zero-default 로 `AGENTS.md`, verifier, `patch.md`를 같은 패치에서 함께 갱신해야 한다. 해결된 경로를 계속 warning 으로 남겨 두지 않는다.
- EN: The current A-40/A-41 **tracked legacy warning path** list MUST stay empty. If a pending split exception is needed, add it as a path-scoped, zero-default rule and update `AGENTS.md`, the verifier, and `patch.md` in the same patch. Resolved paths MUST NOT remain downgraded to warnings.

### Directive A-42
- KR: KPI 활성 JS/HTML 로직 파일에는 별도 가드가 있다. soft cap은 `1,200줄`, hard guard는 `1,500줄`이다. 단, data-only JS와 CSS는 예외다.
- EN: Active KPI JS/HTML logic files have a separate guard: soft cap `1,200 lines`, hard guard `1,500 lines`. Data-only JS and CSS are exempt.

### Directive A-42a

- KR: A-42 예외 allowlist 는 기본적으로 비어 있어야 한다. 예외가 필요하면 path-scoped, zero-default 로 추가하고, `AGENTS.md` 와 verifier 설정을 같은 패치에서 함께 갱신한다. supporting 문서나 commit body 에만 의존해 예외를 성립시키지 않는다.
- EN: The A-42 exception allowlist MUST stay empty by default. If an exception is needed, add it as a path-scoped, zero-default rule and update `AGENTS.md` plus the verifier configuration in the same patch. An exception MUST NOT rely only on supporting docs or a commit body.

### Directive A-42b

- KR: 현재 A-42 **tracked legacy warning path** 목록은 비어 있어야 한다. 새 예외 경로가 필요하면 path-scoped, zero-default 로 `AGENTS.md`, verifier, `patch.md`를 같은 패치에서 함께 갱신해야 한다.
- EN: The current A-42 **tracked legacy warning path** list MUST stay empty. If a new exception path is needed, add it as a path-scoped, zero-default rule and update `AGENTS.md`, the verifier, and `patch.md` in the same patch.

### Directive A-43
- KR: 새 활성 로직 파일은 `800줄` 이하로 유지한다. `800줄`을 넘기는 새 활성 파일 추가는 금지하며, 필요한 경우 기존 파일 분리나 책임 재배치를 먼저 수행한다.
- EN: New active logic files MUST stay at `800 lines` or less. Introducing a new active file above `800 lines` is prohibited; split existing responsibilities first when needed.

### Directive A-44
- KR: `KPI.html`은 shell, loader, version, global mount wiring 중심으로 유지한다. shell/loader wiring 이 아닌 새 도메인 로직은 각 도메인 runtime 파일로 내려야 한다.
- EN: `KPI.html` MUST remain focused on shell, loader, versioning, and global mount wiring. New domain logic that is not shell or loader wiring MUST move into domain runtime files.

### Directive A-45
- KR: 현재 Node HTTP entrypoint(현재는 `kpi-runtime/internal-server/src/server.js`)는 composition root 로 유지한다. endpoint, bootstrap, static serve, auth/session, file/document handling 이 누적되는 dump point 가 되어서는 안 된다.
- EN: The current Node HTTP entrypoint (currently `kpi-runtime/internal-server/src/server.js`) MUST remain a composition root. It MUST NOT become a dump point for endpoints, bootstrap logic, static serving, auth or session logic, or file and document handling.

### Directive A-46
- KR: 역사적으로 큰 top-level orchestrator 파일은 새 책임을 계속 쌓는 장소가 되어서는 안 된다. 이런 파일을 수정할 때는 가능하면 책임을 줄이거나 추출을 동반하고, 관련 없는 capability를 끼워 넣지 않는다.
- EN: Historically large top-level orchestrator files MUST NOT become places where new responsibilities keep piling up. When touching such files, prefer responsibility reduction or extraction, and do not insert unrelated capabilities.

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

### Directive A-55a

- KR: 사내망 단일-박스 운용 맥락에서 A-55의 rollback 메모는 다음 두 형태 중 하나로 충족한다. **형태 1**: 별도 `NNN_name.down.sql` 파일과 up/down 쌍 관리. **형태 2**: migration SQL 상단의 inline rollback 메모 + 직전 backup snapshot으로 복구하는 절차 참조. 다음 세 경우에는 형태 1이 필수다. ① 대규모 데이터 재구성(`ALTER TABLE ... DROP/TYPE change` 등), ② 되돌리기 어려운 destructive change(`DROP TABLE/COLUMN`, 돌이킬 수 없는 데이터 변환), ③ production 사용 중인 테이블의 non-nullable column 추가. 근거: 단일 박스에 정기 backup이 있는 환경에서는 backup-기반 복구가 대부분의 destructive 실수에 대해 가장 빠르고 안전한 경로다. rollback SQL 쌍은 위험한 변경에 한해 강제한다.
- EN: In the internal single-box intranet context, A-55's rollback note MAY be satisfied by either **Form 1**: a dedicated `NNN_name.down.sql` file paired with the up-migration, or **Form 2**: an inline rollback memo at the top of the migration SQL plus a reference to restoring from the most recent backup snapshot. Form 1 is MANDATORY for: (a) large-scale data reshaping (`ALTER TABLE ... DROP`, type changes), (b) irreversible destructive changes (`DROP TABLE/COLUMN`, one-way data transforms), or (c) adding non-nullable columns to production-active tables. Rationale: on a single-box setup with routine backups, backup-based recovery is usually the fastest and safest path for destructive mistakes. Paired rollback SQL is enforced only where that path is insufficient.

### Directive A-55b

- KR: 운영 DB 또는 운영에 준하는 로컬 DB에 대해 schema migration, 대량 import/replace, destructive repair, 권한/사용자/문서 저장소 변경을 실행하기 전에는 `npm run backup:postgres-dump` 또는 `scripts/windows/backup-postgres-dump.ps1`로 PostgreSQL 전체 custom-format dump를 먼저 남겨야 한다. 앱 JSON runtime snapshot만으로는 전체 DB 재해복구 기준을 충족한 것으로 보지 않는다.
- EN: Before running a schema migration, bulk import/replace, destructive repair, or auth/user/document-storage change against production or production-like local DBs, create a full PostgreSQL custom-format dump with `npm run backup:postgres-dump` or `scripts/windows/backup-postgres-dump.ps1`. The app JSON runtime snapshot alone is not sufficient for full DB disaster recovery.

### Directive A-55c

- KR: DB 백업 파일은 `KPI_STORAGE_ROOT/backups/postgres-dumps/` 아래에 보관하고 저장소에 commit 하지 않는다. 전체 운영 백업은 `npm run backup:all`로 PostgreSQL dump, runtime snapshot, file-storage backup을 함께 생성하는 것을 기본값으로 한다. 활성 DB에 dump를 복원하는 작업은 사용자 명시 승인과 별도 복구 계획 없이 수행하지 않는다.
- EN: DB dump files MUST be stored under `KPI_STORAGE_ROOT/backups/postgres-dumps/` and MUST NOT be committed to the repository. The default full operational backup is `npm run backup:all`, which creates a PostgreSQL dump, runtime snapshot, and file-storage backup together. Restoring a dump into an active DB MUST NOT be performed without explicit user approval and a separate recovery plan.

### Directive A-56
- KR: 환경변수는 한 곳에서 읽어 typed config 객체로 매핑한다. raw env lookup을 코드베이스 전체에 흩뿌리지 않는다.
- EN: Environment variables MUST be read in one place and mapped into typed config objects. Raw env lookups MUST NOT be scattered across the codebase.

### Directive A-57
- KR: 비밀정보, API 키, DB 비밀번호, 환경별 endpoint는 하드코딩하지 않는다.
- EN: Secrets, API keys, DB passwords, and environment-specific endpoints MUST NOT be hard-coded.

### Directive A-58
- KR: 예외를 조용히 삼키지 않는다. low-level error는 boundary에서 domain/application error로 번역한다.
- EN: Exceptions MUST NOT be swallowed silently. Low-level errors MUST be translated into domain or application errors at boundaries.

### Directive A-59
- KR: 로그는 문제를 재현하고 추적할 수 있을 만큼 actionable context를 남겨야 한다. secret, token, credential, personal data는 redaction 없이는 남기지 않는다.
- EN: Logs MUST include enough actionable context to reproduce and trace a problem, but secrets, tokens, credentials, and personal data MUST NOT be logged unless explicitly redacted.

### Directive A-60
- KR: SQL, shell, file path, serialization은 안전한 API를 사용한다. 사용자 입력으로 위험한 명령문을 조합하지 않는다.
- EN: SQL, shell, file-path, and serialization work MUST use safe APIs. Dangerous commands MUST NOT be assembled from unsanitized input.

### Directive A-61
- KR: comments는 왜, 제약, tradeoff를 설명해야 한다. obvious code를 풀어쓰는 주석은 피한다.
- EN: Comments SHOULD explain why, constraints, or tradeoffs. Avoid comments that merely restate obvious code.

### Directive A-62
- KR: dead code는 주석 처리로 남기지 말고 삭제한다.
- EN: Dead code MUST be deleted rather than left commented out.

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
- KR: route handler는 validation과 delegation까지만 책임진다. persistence와 business rule은 route 밖에 둔다.
- EN: Route handlers MUST only validate and delegate. Persistence and business rules MUST live outside the route layer.

### Directive A-76
- KR: touched Node server code에서 DB가 필요하면, SQL/ORM 호출은 repository, storage module, query module 같은 persistence 경계에 모은다.
- EN: If touched Node server code needs DB access, SQL or ORM calls MUST be concentrated in a persistence boundary such as a repository, storage module, or query module.

### Directive A-77
- KR: static file serve, portal bootstrap, auth/session, document/file handling은 helper 또는 module 경계를 통해 분리한다.
- EN: Static serving, portal bootstrap, auth or session logic, and document or file handling MUST be split through helper or module boundaries.

### Directive A-77a
- KR: 현재 internal-server에서 `src/lib/**` 는 `http.js`, `kpi-static.js`, `portal-bootstrap/**`, `document-storage.js`, `permission-registry.js` 같은 **공용 adapter / serializer / path resolver / static helper** 소유권을 가진다. `lib` 는 route body parsing, response write, durable write workflow, audit write 를 직접 소유하지 않는다.
- EN: In the current internal-server, `src/lib/**` owns **shared adapters, serializers, path resolvers, and static helpers** such as `http.js`, `kpi-static.js`, `portal-bootstrap/**`, `document-storage.js`, and `permission-registry.js`. `lib` MUST NOT directly own route-body parsing, response writing, durable write workflows, or audit writes.

### Directive A-77b
- KR: 현재 internal-server에서 `src/services/**` 는 `auth.js`, `files.js`, `metering-authority.js`, `util-production-daily.js` 같은 **use-case orchestration** 소유권을 가진다. `services` 는 repository 와 `lib` 를 조합해 상태 변경, 파일 처리, audit 기록을 수행할 수 있지만, route matching, HTTP status 작성, HTML/script serialization 은 소유하지 않는다.
- EN: In the current internal-server, `src/services/**` owns **use-case orchestration** modules such as `auth.js`, `files.js`, `metering-authority.js`, and `util-production-daily.js`. `services` MAY combine repositories and `lib` helpers to perform state changes, file handling, and audit writes, but MUST NOT own route matching, HTTP status writing, or HTML/script serialization.

### Directive A-78
- KR: 기존 구조와 호환되는 한 작은 reversible patch를 우선한다.
- EN: Prefer small, reversible patches as long as they remain compatible with the current structure.

### Directive A-78a
- KR: live KPI 프런트 자산을 이동하거나 이름을 바꿀 때는 `KPI.html`, metering bridge, bundle draft smoke, 관련 frontend smoke를 같은 단계에서 함께 맞춘다.
- EN: When moving or renaming live KPI frontend assets, update `KPI.html`, the metering bridge, the bundle-draft smoke, and the relevant frontend smoke checks in the same step.

### Directive A-78b
- KR: `KPI_AUTH_ENABLED=false` 또는 `KPI_LOGIN_ENABLED=false` 로 여는 open-mode 는 test 또는 verification 세션에서만 사용한다. production-like runtime 에서 이 bypass 를 기본값으로 남기지 않는다.
- EN: Open mode with `KPI_AUTH_ENABLED=false` or `KPI_LOGIN_ENABLED=false` MAY be used only for test or verification sessions. These bypasses MUST NOT remain the default in a production-like runtime.

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
- KR: `postMessage`는 same-origin 또는 명시된 allowlist origin만 허용한다. privileged payload 에 `*` targetOrigin 을 사용하지 않는다.
- EN: `postMessage` MUST be restricted to same-origin or an explicit allowlist origin. Privileged payloads MUST NOT use `*` as the target origin.

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

### Directive A-113a
- KR: `kpi-runtime/internal-server/` 를 건드린 변경은 완료 전 최소 `npm run format:check`, `npm run lint`, `npm run verify` 를 통과해야 한다. 현재 `npm run verify` 는 `smoke:kpi-root -> verify:server-structure -> npm test` aggregate gate 다.
- EN: Changes that touch `kpi-runtime/internal-server/` MUST pass at least `npm run format:check`, `npm run lint`, and `npm run verify` before completion. The current `npm run verify` command is the aggregate gate `smoke:kpi-root -> verify:server-structure -> npm test`.

### Directive A-113b
- KR: `KPI.html`, served asset, auth/access-mode, 또는 browser-visible flow 를 건드린 변경은 `npm run smoke:kpi-browser` 또는 동등한 browser smoke 를 추가로 통과해야 한다. 사용자가 실제 브라우저 확인을 요구하면 headed run 을 사용한다.
- EN: Changes that touch `KPI.html`, a served asset, auth or access mode, or any browser-visible flow MUST also pass `npm run smoke:kpi-browser` or an equivalent browser smoke. If the user asks for real-browser verification, a headed run MUST be used.

### Directive A-113c
- KR: `.husky/pre-commit` 통과만으로 완료라고 보고하지 않는다. pre-commit 은 일부 gate 일 뿐 전체 done gate 를 대체하지 않는다.
- EN: Passing `.husky/pre-commit` MUST NOT be reported as sufficient completion. Pre-commit is only a partial gate and does not replace the full done gate.

### Directive A-113d
- KR: shared server/DB/file storage 를 건드리는 browser smoke 는 순차 실행을 기본값으로 한다. 같은 mutable runtime 을 향한 `headless` 와 `headed` run 을 병렬로 섞지 않는다. Playwright config, workflow, package script 가 이 전제를 공유하도록 `workers=1`, `fullyParallel=false` drift 를 만들지 않는다.
- EN: Browser smoke that touches shared server, DB, or file storage MUST run sequentially by default. Do not mix `headless` and `headed` runs in parallel against the same mutable runtime. Playwright config, workflow, and package scripts MUST stay aligned with this assumption and MUST NOT drift away from `workers=1` and `fullyParallel=false`.

### Directive A-113e
- KR: served UI, 브라우저에서 여는 툴, 또는 사용자 클릭 흐름을 수정한 뒤에는 **실제 서버에 붙은 세션으로 가동 확인**해야 한다. 가능하면 Playwright 또는 MCP 브라우저 세션을 우선 사용하고, 수정 범위와 직접 연결된 버튼, 토글, 탭, 모달, 저장/닫기 흐름은 **전부 실제로 클릭/토글**해 본다.
- EN: After changing a served UI, a browser-opened tool, or a user click flow, the agent MUST verify it against a **real running server session**. Playwright or an MCP browser session SHOULD be used first when available, and every button, toggle, tab, modal, and save/close flow directly tied to the touched scope MUST be actually clicked or toggled.

### Directive A-113f
- KR: Playwright 또는 MCP 세션이 실패하거나 사용할 수 없으면, 에이전트는 **실제 서버를 유지한 채** 다른 실행 가능한 방법(기존 smoke 스크립트, 브라우저 수동 조작, HTTP/DOM 점검 등)으로 검증을 끝까지 이어가야 한다. 이때도 콘솔 오류, page error, same-origin `4xx/5xx` 응답 실패를 확인하고, 무엇을 눌렀는지와 무엇을 끝까지 검증하지 못했는지를 최종 보고에 남긴다.
- EN: If Playwright or an MCP session fails or is unavailable, the agent MUST continue verification **against the real running server** with another executable method such as existing smoke scripts, manual browser interaction, or HTTP/DOM checks. Even then, the agent MUST check console errors, page errors, and same-origin `4xx/5xx` response failures, and record both the exercised interactions and any unverified gap in the final report.

### Directive A-114
- KR: 저장소에 표준 명령이 있으면 그 명령을 따른다. README, Makefile, package.json, pyproject, CI를 먼저 확인한다.
- EN: If the repo already has standard commands, use them. Inspect the README, Makefile, package.json, pyproject, and CI first.

### Directive A-114a
- KR: 검증 명령, format scope, 또는 CI gate 구성이 바뀌면 `package.json`, CI, `patch.md`를 같은 패치에서 함께 갱신한다.
- EN: If verification commands, format scope, or CI gate composition changes, update `package.json`, CI, and `patch.md` in the same patch.

### Directive A-114b
- KR: hosted CI/bootstrap 변경은 workflow 안에 필요한 런타임 계약(`KPI_SERVER_PORT`, `KPI_BASE_URL`, `KPI_DATABASE_URL`, `KPI_AUTH_ENABLED`, `KPI_LOGIN_ENABLED` 또는 동등한 값)을 명시해야 한다. 개발자 머신의 로컬 기본값, 이미 떠 있는 서버, 숨은 env 상태에 기대는 workflow 는 금지한다.
- EN: Hosted CI or bootstrap changes MUST declare the required runtime contract inside the workflow (`KPI_SERVER_PORT`, `KPI_BASE_URL`, `KPI_DATABASE_URL`, `KPI_AUTH_ENABLED`, `KPI_LOGIN_ENABLED`, or equivalent values). Workflows MUST NOT depend on developer-machine defaults, an already-running local server, or hidden environment state.

### Directive A-114c
- KR: 로컬 scratch/runtime/log 산출물(`.codex-run/`, `var/`, Playwright artifact, 임시 `*.log`)은 추적/커밋 금지다. 새 scratch 경로나 산출물 파일이 생기면, 같은 패치에서 ignore 규칙도 함께 갱신한다.
- EN: Local scratch, runtime, and log artifacts (`.codex-run/`, `var/`, Playwright artifacts, temporary `*.log`) MUST NOT be tracked or committed. If a new scratch path or artifact file appears, update the ignore rules in the same patch.

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
- EN: Do not grow parallel authority documents. New rules MUST be absorbed into `AGENTS.md`.

### Directive A-125
- KR: live runtime을 다루는 작업에서 승인 없이 스택 전환, 공개 주소 전환, 저장 권위본 전환을 하지 않는다.
- EN: When touching the live runtime, do not change the stack, exposure address, or storage authority without approval.

## 12. Human Review and Operability Boundaries / 사람 검토와 운영 가능성 경계

### Directive A-126
- KR: `AGENTS.md`는 hard rule 과 done gate 를, `patch.md`는 patch history 와 아키텍처 영향 요약을, `비전공자용.md`는 그 patch history 와 아키텍처의 쉬운 설명판을 소유한다. `patch.md`와 `비전공자용.md`를 장기 진행 문서나 status board 로 키우지 않는다.
- EN: `AGENTS.md` owns hard rules and done gates, `patch.md` owns patch history plus architecture-impact summaries, and `비전공자용.md` owns the plain-language companion view of that history and architecture. Do not turn `patch.md` or `비전공자용.md` into long-lived progress documents or status boards.

### Directive A-127
- KR: 사람 검토가 반드시 필요한 영역은 최소한 `인증`, `권한`, `승인 흐름`, `저장 권위본`, `외부 노출`, `마이그레이션`, `백업/복구`, `보안 사고 대응`이다.
- EN: Human review is mandatory at least for `authentication`, `authorization`, `approval flows`, `storage authority`, `external exposure`, `migrations`, `backup/restore`, and `security-incident response`.

### Directive A-128
- KR: `개발 환경에서 된다`와 `운영 가능하다`를 구분한다. 로그, 감사, 백업, 복구, 운영 체크리스트 없이 서버형 시스템을 완료로 처리하지 않는다.
- EN: Distinguish `works in development` from `operable in production`. Do not mark a server-backed system complete without logs, auditability, backup, restore, and an operating checklist.

### Directive A-128a
- KR: 활성 runtime 에서 backup/restore 리허설을 할 때는 **비파괴 절차**를 기본값으로 한다. 먼저 fresh runtime snapshot 과 file-storage backup 을 만들고, 그 snapshot 을 기준으로 DB restore 는 `--dry-run`, file restore 는 preview 로 검증한 뒤에만 `--force` 또는 `-Force` 복구를 검토한다.
- EN: When rehearsing backup or restore against an active runtime, the default MUST be a **non-destructive drill**. First create a fresh runtime snapshot and a file-storage backup, then validate DB restore with `--dry-run` and file restore with preview output before considering any `--force` or `-Force` recovery.

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
