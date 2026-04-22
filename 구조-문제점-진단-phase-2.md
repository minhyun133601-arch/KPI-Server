# KPI-Server 구조 문제점 진단 — Phase 2 기준

작성일: `2026-04-17`
최종 재검토: `2026-04-22`
감찰 시점: `최상위 활성 Phase 2 진행 중, Phase 1(품질 게이트)과 Phase 4(CSS low-risk dedupe) 병행 중`
대상 저장소 루트: `C:/Users/user/Desktop/KPI-Server`
기준 문서: [AGENTS.md](/C:/Users/user/Desktop/KPI-Server/AGENTS.md) · [구조-개선-실행-페이즈.md](/C:/Users/user/Desktop/KPI-Server/구조-개선-실행-페이즈.md)
현재 로컬/운영 포트 기준: `DB 5434` · `운영 3100` · `검증 3192`

> 문서명 규칙: 감찰 시점의 **최상위 활성 Phase** 를 파일명에 박는다. 다음 감찰은 Phase 가 넘어간 뒤 `구조-문제점-진단-phase-3.md` 로 새로 작성하고, 과거 Phase 진단서는 별도 파일로 남겨 이력 추적에 쓴다.

## 1. 한 줄 요약

대형 프런트 파일 분할과 `repairWorkHistoryReportAuthority` helper 분할, 구조 게이트 연결, 로컬 Playwright 브라우저 회귀선 추가는 끝났다. 운영 포트 `3100`의 bootstrap/login surface 와 검증 포트 `3192`의 인증 비활성 `open_internal` access mode 까지 로컬 검증이 끝났고, GitHub Actions workflow 파일도 로컬에는 준비돼 있다. `repositories / services / lib / routes` 경계 문구도 이제 supporting 문서 사이에서 같은 표현으로 고정됐다. 다만 workflow 파일이 아직 git-tracked 상태가 아니고 원격 저장소에도 등록되지 않아 hosted run 은 아직 시작조차 못 한 상태다. ESLint baseline 과 Prettier baseline(`CI/config/E2E` 범위)도 반영됐으며, CSS 쪽도 `metering.css` modal hover/label/mobile padding selector 병합 1차까지 반영됐다. 체감 진행률은 `약 75% 완료 / 약 25% 남음`으로 본다. 지금 남은 핵심 문제는 `format gate 범위 제한`, `hosted CI workflow 미반영`, `CSS 중복`, `운영 리허설 미실시` 네 묶음이다.

## 2. 현재 구조 맵

```text
KPI-Server/
├─ 01_★★★_팀별내역서/
│  └─ runtime/work/history/
├─ 02_★★★★_유틸리티/
│  ├─ apps/
│  └─ runtime/util/report/
├─ 04_★★★_오디트/runtime/
├─ 05_★★★_데이터기입/runtime/
├─ 06_★★★_KPI런타임/
│  ├─ app/
│  ├─ core/
│  ├─ internal-server/
│  ├─ sections/
│  └─ styles/
├─ .github/workflows/
├─ .husky/
├─ KPI.html
├─ ※_공용자산/
└─ 작업내역/
```

핵심 해석:
- `01_★★★_팀별내역서/runtime/work/history/`: 팀별 내역 layout/render/print 경계
- `02_★★★★_유틸리티/apps/`: 실사용 앱 entry
- `02_★★★★_유틸리티/runtime/util/report/sheet/`: report sheet 하위 모듈 집합
- `06_★★★_KPI런타임/app/styles/`: shell, work, metering, audit 기준 CSS 소유권
- `06_★★★_KPI런타임/internal-server/`: 현재 live baseline 서버와 테스트 중심

## 3. 현재 기준선

줄 수 규칙:
- 문서 기준 줄 수는 `verifyServerStructure.js` 의 `countLines()` 와 동일하다.
- `Get-Content` 는 trailing LF 때문에 `+1` 차이가 날 수 있으므로 참고값으로만 본다.

### 3.1 구조 게이트와 테스트

| 항목 | 현재 상태 |
|---|---|
| `npm run format:check` | `pass` |
| `npm run lint` | `pass` |
| `verify:server-structure` | `warningCount 0` |
| `npm test` | `389 pass` |
| frontend smoke | `97건` |
| 포트 기준 | `DB 5434` / `운영 3100` / `검증 3192` |
| `smoke:kpi-root` | `checked 95`, `failures []` (`http://127.0.0.1:3192`, `open_internal`, DB `5434` 공유) |
| Playwright browser smoke | `http://127.0.0.1:3192` 에서 `open_internal` `headless 1 pass`, `headed 1 pass` (`sidebar toggle/reset`, `work mode toggle`, `analysis toggle`, `shortcut mount`, `consoleErrors/pageErrors/responseFailures 0`) |
| 운영 surface reachability | `http://127.0.0.1:3100` 에서 `/api/bootstrap/status 200`, `/login 200` |
| pre-commit | `.husky/pre-commit` 연결 완료 |
| CI | `.github/workflows/kpi-internal-server-ci.yml` 이 로컬에는 `Windows 3100 검증 + Ubuntu 3192 open-mode browser smoke(headless -> headed 순차) + DB 5434` 기준으로 준비돼 있지만 현재 `git status` 상 untracked 이고, `gh api repos/minhyun133601-arch/KPI-Server/actions/workflows` 결과도 `0개`라 hosted run 시작 전 단계 |

### 3.2 핵심 파일 실측

| 파일 | 구조 게이트 기준 LOC | 상태 |
|---|---:|---|
| `KPI.html` | 220 | shell / loader 전용 |
| `02_★★★★_유틸리티/apps/metering/app.js` | 1,125 | A-42 soft/hard 복귀 완료 |
| `02_★★★★_유틸리티/runtime/util/report/KPI.util.report.sheet.js` | 1,186 | 26차 split 완료 |
| `02_★★★★_유틸리티/apps/production-extractor/app.js` | 1,175 | A-42 soft/hard 복귀 완료 |
| `01_★★★_팀별내역서/runtime/work/history/KPI.work.history.view.layout.js` | 296 | A-40/A-41 복귀 완료 |
| `01_★★★_팀별내역서/runtime/work/history/KPI.work.history.view.render.js` | 291 | A-40/A-41 복귀 완료 |
| `06_★★★_KPI런타임/app/styles/shell/dashboard.css` | 1,393 | shell dashboard styles |
| `06_★★★_KPI런타임/app/styles/shell/shell-chrome.css` | 1,490 | shell chrome styles |
| `06_★★★_KPI런타임/app/styles/work/work.css` | 510 | work styles |
| `06_★★★_KPI런타임/app/styles/metering/metering.css` | 841 | metering styles |
| `06_★★★_KPI런타임/app/styles/audit/audit.css` | 473 | audit styles |

## 4. 해결 완료된 문제

### 4.1 대형 프런트 파일

- `metering/app.js`, `production-extractor/app.js`, `KPI.util.report.sheet.js`, `work/history/*` 는 모두 hard-cap 위기 상태에서 복귀했다.
- `KPI.html` 은 shell / loader 전용 파일로 축소됐다.
- `report/sheet/` 는 `electric`, `gas`, `analysis`, `panel`, `summary`, `modal`, `windows` 하위 계층으로 분리됐다.

### 4.2 CSS 구조화

- inline `<style>` 는 제거됐다.
- shell CSS 는 `app/styles/shell`, `app/styles/work`, `app/styles/metering`, `app/styles/audit` 로 재배치됐다.
- `KPI.app.shell.css` 는 compatibility manifest 만 남는다.

### 4.3 자동 차단 장치

- `.husky/pre-commit` 로 로컬 구조 검증이 걸려 있다.
- GitHub Actions workflow 파일에는 Windows `format:check -> lint -> verify:server-structure -> npm test` 와 Ubuntu `KPI_SERVER_PORT=3192`, DB `5434`, open-mode `smoke:kpi-root -> smoke:kpi-browser -> smoke:kpi-browser:headed` 순차 경로가 작성돼 있다.
- 다만 해당 workflow 파일은 현재 git-tracked 상태가 아니고 원격 저장소 Actions workflow 목록도 `0개`다.
- Playwright 기반 browser smoke 가 `login_required` / `open_internal` 모두 `headless` / `headed` 로컬 회귀선으로 추가됐고, sidebar toggle/reset, work mode toggle, analysis toggle, shortcut mount 까지 확인한다.
- ESLint baseline 과 Prettier baseline(`CI/config/E2E` 범위) 이 `internal-server` 기준으로 추가됐다.
- 구조 게이트 경고는 현재 `0건`이다.

### 4.4 서버 경계 기준 문구 고정

- `routes/` 와 `request-router.js` 는 요청 파싱, 인증/권한 게이트, 응답 위임까지만 맡고 business rule 과 DB 접근을 들고 있지 않는다고 문서 기준을 고정했다.
- `repositories/` 는 SQL, row shape, advisory lock, transaction-bound persistence 를 담당하고 HTTP parsing, UI 문구, 화면 응답을 맡지 않는다고 고정했다.
- `services/` 는 use-case orchestration, 권한 판단, repository 조합, write path orchestration 을 맡고 raw SQL 을 직접 들지 않는다고 고정했다.
- `lib/` 는 `http`, `crypto`, `document-storage`, `portal-bootstrap`, `kpi-static` 같은 공용 helper/adapter 경계로 고정했다.

## 5. 남은 문제

핵심 남은 문제는 아래 `4묶음`이고, 이 네 묶음이 닫힌 뒤에는 후행 close-out 인 `Phase 6`이 별도로 남아 있다.

각 항목은 [구조-개선-실행-페이즈.md](/C:/Users/user/Desktop/KPI-Server/구조-개선-실행-페이즈.md) 의 Phase 와 1:1 로 매핑된다.

| 항목                                | 대응 Phase | 우선순위 |
| ----------------------------------- | ---------- | -------- |
| A. format gate 범위 제한            | Phase 1    | P0       |
| B. 브라우저 E2E hosted CI workflow 미반영 | Phase 2    | P0       |
| C. CSS 중복과 소유권 잔재           | Phase 4    | P1       |
| D. 운영 리허설 부재                 | Phase 5    | P2       |

### [Phase 1 / P0] A. format gate 범위 제한

현재 상태:
- ESLint baseline 있음
- Prettier baseline 있음 (`e2e`, `config`, `package.json`, CI workflow)
- `format:check` / `format:write` 스크립트 있음
- `src/test` 전체에는 아직 적용하지 않음

왜 문제인가:
- `src/test` 전체에 Prettier 를 바로 걸면 이번 기준으로 `166개 파일` warning 이 한 번에 발생해서 review surface 가 과도하게 커진다.
- 그래서 현재 baseline 은 `CI/config/E2E` 면으로 제한됐고, source-wide format gate 는 별도 확장 판단이 남아 있다.

### [Phase 2 / P0] B. 브라우저 E2E hosted CI workflow 미반영

현재 상태:
- Playwright browser smoke 1건이 검증 포트 `3192`에서 로컬 `headless` / `headed` 로 통과했고, sidebar toggle/reset, work mode toggle, analysis toggle, utility/work shortcut mount 까지 커버한다.
- 인증 비활성 `open_internal` access mode 경로는 같은 회귀선으로 통과했다.
- `console/pageerror/same-origin badResponse 0건` 기준도 자동 테스트로 고정했다.
- 운영 포트 `3100`은 `/api/bootstrap/status` 와 `/login` reachability 를 재확인했다.
- CI workflow 파일에는 `smoke:kpi-root -> smoke:kpi-browser -> smoke:kpi-browser:headed` open-mode 순차 경로와 `KPI_SERVER_PORT=3192`, DB `5434` 기준을 반영했다.
- 최종 브라우저 검증은 `smoke:kpi-root -> smoke:kpi-browser -> smoke:kpi-browser:headed` 순차 재실행으로 다시 확인했다. `Playwright MCP` 는 계속 `Transport closed` 이고, 현재 fallback 은 로컬 Playwright 러너다.
- 하지만 `.github/workflows/kpi-internal-server-ci.yml` 이 아직 git-tracked 상태가 아니고, 원격 저장소 Actions workflow 목록도 `0개`라 GitHub hosted runner 에서 첫 통과를 확인할 단계까지 아직 못 갔다.
- 이 단계는 workflow 파일만 단독으로 올리면 끝나는 게 아니다. 최소 안전 세트는 `workflow + package.json + package-lock.json + eslint/prettier 설정(.prettierignore 포함) + Playwright 설정 + browser smoke/verifier 스크립트` 묶음이다.

왜 문제인가:
- workflow 파일이 원격에 올라가 있지 않으면 hosted runner 자체가 시작되지 않는다.
- 따라서 지금 병목은 `첫 run 대기`가 아니라 `workflow 파일을 git에 포함하고 원격에 반영해야 hosted run 을 시작할 수 있음`이다.

### [Phase 4 / P1] C. CSS 중복과 소유권 잔재

현재 상태:
- feature 폴더로 재배치는 끝났고 `shell-chrome.css`, `dashboard.css`, `metering.css`, `audit.css`, `work.css` low-risk dedupe 를 이어 가고 있다. 이번 턴에는 `metering.css`에서 modal close hover 4종, modal field label 4종, mobile modal padding 2묶음을 selector grouping 으로 병합했다.
- `dashboard.css`, `shell-chrome.css` 가 특히 길다.

왜 문제인가:
- 분리만 하고 정리를 안 하면 다음 변경 때 다시 겹치는 selector 가 늘어난다.

### [Phase 5 / P2] D. 운영 리허설 부재

현재 상태:
- 단일 박스 운용 전제는 문서에 반영돼 있다.
- 하지만 백업/복구 리허설 결과는 아직 문서로 고정되지 않았다.

왜 문제인가:
- 실제 장애 시 복구 문서가 추상적일 수 있다.

## 6. 권장 Phase 순서

| Phase | 우선순위 | 해야 할 일 | 끝나는 조건 |
|---|---|---|---|
| Phase 1 | P0 | source-wide format gate 확대 여부와 포맷 전용 커밋 전략 확정 | format baseline 범위와 source 적용 전략이 합의되고 검증된다 |
| Phase 2 | P0 | workflow 파일을 git에 포함하고 원격에 반영한 뒤 GitHub Actions 첫 hosted run 에서 `lint` 와 `smoke:kpi-root -> smoke:kpi-browser -> smoke:kpi-browser:headed` 순차 통과 확인 | 브라우저 회귀선과 lint 가 로컬+CI 둘 다에서 실증된다 |
| Phase 4 | P1 | `app/styles/**/*` dedupe | CSS ownership 와 selector 중복이 줄어든다 |
| Phase 5 | P2 | 백업/복구 리허설과 운영 체크리스트 | 실제 복구 절차가 문서만으로 재현 가능하다 |
| Phase 6 | P3 | legacy 경로명 정리와 supporting status close-out | 장식 경로 rename 범위와 문서 drift 정리가 고정된다 |

## 7. 지금 추가 금지

- 구조 게이트가 0건이라고 해서 대형 orchestrator 를 다시 키우는 일
- `window.*` 전역 확장
- lint 없이 임의 스타일 규칙을 계속 늘리는 일
- workflow 파일이 원격에 없는 상태에서 browser smoke CI 구성이 끝났다고 간주하는 일
- 운영 리허설 없이 배포/복구 문서를 완료로 보는 일

## 8. 결론

구조 분할 작업과 로컬 Playwright 브라우저 회귀선 추가는 1차 목표를 달성했다. 운영 포트 `3100`의 bootstrap/login surface 와 검증 포트 `3192`의 실제 브라우저 회귀선이 재확인됐고, `repositories / services / lib / routes` 기준 문구도 문서 사이에서 고정됐다. CI workflow 파일도 로컬 기준 `DB 5434 / 운영 3100 / 검증 3192` 와 맞춰 준비돼 있다. 하지만 원격 저장소에 Actions workflow 가 아직 `0개`이므로, 지금부터의 핵심은 `파일 쪼개기`가 아니라 `workflow 파일 반영 -> hosted CI 실증 -> 운영 기준 고정` 순서로 자동 검증 체계를 실제 GitHub 쪽까지 끌어올리는 일이다. 따라서 다음 문서와 실제 작업의 기준 우선순위는 아래 순서로 본다.

1. workflow 단독이 아니라 최소 안전 세트를 git에 포함하고 원격에 반영
2. Playwright browser smoke / format / lint hosted run 확인
3. format gate scope 확대 여부 확정
4. CSS dedupe
5. 운영 리허설
6. legacy 경로명 정리와 supporting status close-out

상세 실행 순서는 [구조-개선-실행-페이즈.md](/C:/Users/user/Desktop/KPI-Server/구조-개선-실행-페이즈.md) 를 따른다.
