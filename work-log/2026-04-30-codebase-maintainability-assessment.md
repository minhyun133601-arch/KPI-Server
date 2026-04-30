# 코드베이스 구조/유지보수성 평가 / Codebase Maintainability Assessment

작성일 / Date: `2026-04-30`

## 범위 / Scope

- 현재 저장소의 구조, 파일 크기, 결합 방식, 테스트/검증 체계, 유지보수 위험도를 냉정하게 평가한다.
- This note evaluates the current repository structure, file size distribution, coupling style, verification surface, and maintainability risk.

## 한줄 결론 / Blunt Verdict

- 이 저장소는 `개초보가 만든 장난감` 쪽이 아니다.
- It is not a beginner toy codebase.
- 더 정확히는 `실무형 사내 업무도구가 오래 자라며 프런트 부채가 쌓인 코드베이스`에 가깝다.
- More precisely, it looks like a real internal business tool that grew over time and accumulated frontend debt.

## 전체 판단 / Overall Judgment

- 전체 수준: `6.5 ~ 7 / 10`
- 서버 구조: `8 / 10`
- 테스트/검증 습관: `8 / 10`
- 프런트 유지보수성: `5 ~ 6 / 10`
- 신규 인력 온보딩 난이도: `높음`

## 왜 초보 코드로 보이지 않는가 / Why This Does Not Look Beginner-Made

- 서버 진입점이 얇다. `kpi-runtime/internal-server/src/server.js`는 composition root에 가깝고, 실제 route 분기는 `request-router.js`와 route modules로 넘긴다.
- The Node server entrypoint is relatively thin and delegates cleanly to route modules.
- `routes / services / repositories` 분리가 실제로 존재한다. 단순 명목 분리가 아니라 auth, files, shared-store, util-production 같은 기능이 계층을 따라 나뉘어 있다.
- The repository contains real route/service/repository boundaries rather than one monolithic backend file.
- 운영 요소가 있다. auth, migrations, backup/restore, readiness report, file storage, ops console까지 있다.
- The repo includes real operational concerns: auth, migrations, backup/restore, readiness reporting, file storage, and an ops console.
- 검증 문화가 있다. `verifyServerStructure.js`로 파일 크기/구조 경고를 점검하고, 최근 확인 기준 `467` tests passed 상태였다.
- There is a real verification culture, including structure guards and a large frontend smoke surface.

## 왜 잘 만든 코드라고는 못 하는가 / Why This Is Not a Clean Modern Codebase

- 프런트는 `window`, `globalThis`, 로드 순서, 전역 상태 공유에 크게 의존한다.
- The frontend relies heavily on `window`, `globalThis`, load order, and shared mutable globals.
- `KPI.html`이 단순 shell이 아니라 사실상 대형 부트 그래프 역할을 한다.
- `KPI.html` behaves like a large dependency loader, not just a shell.
- 큰 프런트 파일이 여러 개 남아 있다. 이는 이해 비용과 수정 파급범위를 키운다.
- Several large frontend files remain, increasing local complexity and change blast radius.
- 원저자나 강한 주도 개발자가 있으면 굴러가지만, 여러 사람이 동시에 확장하면 속도가 떨어질 가능성이 높다.
- The codebase is still operable, but team scaling would increase friction quickly.

## 규모 감각 / Scale Snapshot

- `kpi-runtime` 관련 코드성 파일이 가장 많고, 그 다음이 `utility`, 그 다음이 `team-report`다.
- The codebase is materially larger than a small personal app and fits the shape of a medium internal product.
- 프런트 smoke test 파일만 `100+`개 수준이며, 검증 코드 양도 꽤 큰 편이다.
- The frontend smoke-test surface is already large enough to indicate repeated real-world maintenance.

## 위험도 높은 파일 10개 / Top 10 High-Risk Files

1. `utility/runtime/util/report/KPI.util.report.sheet.js`
   - 약 `1147` lines.
   - `globalThis.*` 의존, adapter 주입, report modal/panel/analysis/billing preview 연결이 한 축에 몰려 있다.
2. `utility/apps/metering/app.js`
   - 약 `1061` lines.
   - 설정 상수, 리소스 정의, 도메인 규칙, 렌더, 저장, shared-server write가 한 파일에 겹친다.
3. `KPI.html`
   - 대량의 script load order를 직접 관리한다.
   - 변경 시 의존성 순서 문제를 만들 가능성이 높다.
4. `audit/runtime/audit/records/KPI.audit.records.lux-workspace.js`
   - 약 `1117` lines.
   - 입력 검증, fail 표시, fullscreen, detached preview, attachment 교체, save가 함께 있다.
5. `audit/runtime/audit/records/KPI.audit.records.render.js`
   - 약 `1140` lines.
   - audit main render, lux batch flow, placeholder, save/status logic가 크게 뭉쳐 있다.
6. `utility/runtime/util/energy/KPI.util.energy.modal.chart.js`
   - 약 `926` lines.
   - chart modal, popup, detached window, energy modal wiring이 섞여 있다.
7. `utility/runtime/util/energy/KPI.util.energy.renderers.js`
   - 약 `1027` lines.
   - 순수 renderer라기보다 chart UI runtime까지 같이 안고 있다.
8. `team-report/runtime/work/KPI.work.production.js`
   - 약 `428` lines.
   - 이름보다 책임 범위가 크고, team calendar/utility summary/production summary가 엮여 있다.
9. `team-report/runtime/work/history/KPI.work.history.view.layout.js`
   - 약 `412` lines.
   - layout 외에 shadow mount, shell render, title state, viewport sync까지 소유한다.
10. `team-report/runtime/work/history/KPI.work.history.core.js`
    - 약 `308` lines.
    - state, payload authority, attachment rules, local backup, portal cache sync를 함께 안고 있다.

## 지금 손대면 효과 큰 구조개선 5개 / Five Highest-Leverage Improvements

1. `KPI.html` 부트 분리
   - `metering`, `work`, `audit`, `report`를 표면별 부트로 나누고 script load order 의존을 줄인다.
2. 전역 상태 접근 차단
   - `window.__LOCAL_APP_STORE__`, `window.PortalData`, `globalThis.*` 접근을 직접 하지 말고 surface별 adapter로 모은다.
3. 거대 파일을 책임별로 분리
   - `constants/config`, `selectors`, `actions`, `persistence`, `render`를 같은 파일에 계속 쌓지 않는다.
4. 렌더와 저장/업로드/브라우저 제어 분리
   - 특히 `audit lux`, `energy modal`, `work history layout`에서 렌더와 행동 로직을 떼어낸다.
5. 구조 경고 파일의 추가 비대화 금지
   - 이미 구조 verifier가 있으므로, 경고 대상 파일은 우선 `더 커지지 않게` 막고 작은 추출부터 시작한다.

## 유지보수 가능 여부 / Maintainability Call

- `유지보수 불가능`은 아니다.
- It is not unmaintainable.
- 하지만 `사람이 늘어날수록 비싸지는 구조`는 맞다.
- It is maintainable today, but team-scale maintenance cost will rise faster than ideal.
- 서버는 비교적 건강하고, 프런트가 부채 중심이다.
- The backend is relatively healthy; the frontend carries most of the maintenance debt.

## 에이전트 코드 규칙 맵 / Agent Code Rule Map

다음 규칙들은 이미 `AGENTS.md`에 있다.  
The following rules already exist in `AGENTS.md`.

- 구조/계층
  - `A-31`: transport/UI는 얇게 유지
  - `A-32`: persistence와 domain rule 분리
  - `A-35`: parsing/validation, business logic, persistence, presentation 분리
  - `A-45`: `server.js`는 composition root 유지
  - `A-46`: 큰 orchestrator 파일에 새 책임 계속 적재 금지
- 크기/복잡도
  - `A-40`: 일반 soft limit `300 LOC / file`
  - `A-41`: 일반 hard limit `500 LOC / file`
  - `A-42`: KPI active JS/HTML soft `1200`, hard `1500`
  - `A-43`: 새 active logic file은 `800` lines 이하
  - `A-44`: `KPI.html`은 shell/loader wiring 중심 유지
- 코드 계약
  - `A-50`: 외부 입력은 boundary에서 검증
  - `A-54`: service는 DB 직접 접근 금지, repository/persistence adapter 경유
  - `A-56`: env는 한 곳에서 typed config로 매핑
  - `A-57`: secret 하드코딩 금지
  - `A-60`: SQL/shell/path 조합은 안전 API 사용
- 검증/완료
  - `A-110`: 관련 코드 변경 시 관련 테스트 추가/갱신
  - `A-113`: format/lint/typecheck/test/build가 통과돼야 완료
  - `A-113a`: `internal-server` 변경은 최소 `format:check`, `lint`, `verify`
  - `A-113e`: served UI나 click flow 변경은 실제 서버 세션에서 검증

## 실무적 의미 / Practical Meaning

- 이 저장소는 `엉망이라 버려야 하는 수준`은 아니다.
- This is not a throwaway mess.
- 다만 `원저자 중심으로는 잘 굴러가지만, 구조적 부채가 명확한 실무형 레거시`로 보는 편이 정확하다.
- A fair description is: a real production-shaped internal tool with meaningful technical debt, especially in the frontend runtime surface.
