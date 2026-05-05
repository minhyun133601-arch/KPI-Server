# 계산 회귀 테스트 추가 계획

총 진행률(리스크 제외): **100%**
- 완료 범위: A~F fixture 회귀 테스트/계획 문서 반영
- 제외 범위: `npm run verify`, DB/runtime storage/logs/uploads/env/secrets 접근, production 산식 변경

작성일: 2026-05-05
대상 워크스페이스: `KPI-Server`
참조 워크스페이스: `C:\Users\kimminhyun\Desktop\kpi-local\KPI-local-main`
서버 기준 커밋: `bdf2e961174505eb4d5591cccabf4f493a958112`
로컬 참조 기준 커밋: `2e3798b` (Complete split refactor)
원칙: **값 보존**. 화면에 보이던 값/합계/차감/증감률/정산값/월별 사용량 결과가 바뀌면 안 된다.

## 1. 목표

split/refactor 이후 KPI, 전기, 가스, 정산, 보고서 숫자 계산 로직이 흔들리지 않도록
현재 production 코드가 산출하는 입력 -> 기대출력 값을 fixture 회귀 테스트로 고정한다.

산식, 반올림, 합산, 차감, 표시 wrapper는 바꾸지 않는다. 함수 export가 필요한 경우에도
production source를 수정하지 않고 테스트 측 string slice 또는 vm 평가로 현재 동작만 검증한다.

## 2. 계산 도메인 핫스팟 맵

| 도메인 | 파일 | 핵심 계산 | 이번 잠금 |
|---|---|---|---|
| 보고서 MoM/YoY delta/rate | `utility/runtime/util/report/KPI.util.report.deltas.js` | `delta = current - prev`, `rate = prev !== 0 ? (delta / prev) * 100 : null`, YoY 동월 매칭 | A 신규 fixture |
| 보고서 builder viz/pivot | `utility/runtime/util/report/KPI.util.report.builder.data-model.js` | usage/cost/production scale, ratio point, pivot 월별 합산 | B fixture 보강 |
| 가스 월 보정계수 | `utility/apps/metering/equipment/usage-calculation.js` | `totalUsage / sourceUsageTotal` numeric ratio | C fixture 보강 |
| 전기 배부 비용 | `utility/runtime/util/report/sheet/electric/comparison-summary.js` | `Math.round(totalCost * usage / totalUsage)`, production/other/total 행 | D fixture 보강 |
| 정산 signed total | `utility/apps/metering/billing/settlement-calculations.js` | 유효 컴포넌트 없음 -> `null`, 표시 wrapper -> `''` | E fixture 보강 |
| KPI sync numeric normalizer | `utility/runtime/util/KPI.util.data-sync.js`, `utility/runtime/util/KPI.util.data-sync.production.js` | 빈값/null/문자열 숫자/소수/음수/비숫자 정규화 | F fixture 보강 |

## 3. 우선순위

A. 보고서 MoM/YoY delta/rate: report delta 함수의 빈 배열, 단일 row, 정상 MoM, 정상 YoY, 0 분모, 음수 delta, 비숫자 필터, `null` legacy coercion, YoY 짝 없음, non-array guard를 잠근다.

B. report builder viz point 값 + pivot 월별 합산 셀 값: usage `100/10=10`, cost `4000/1000=4`, production `40`, ratio `4/40=0.1`, pivot 중복 `2026-01` 합산 `12.5`를 잠근다.

C. 가스 월 보정계수 numeric ratio: `totalUsage 125 / sourceUsageTotal 100 = 1.25`를 잠근다.

D. 전기 분배비용: `Math.round(17750 * 90 / 100) = 15975`, `Math.round(17750 * 10 / 100) = 1775`, total 행 `17750`을 잠근다.

E. 정산 signed total: 유효한 컴포넌트가 없을 때 raw value helper는 `null`, display wrapper는 빈 문자열 `''`을 유지한다.

F. KPI sync numeric normalizer: `''`, `null`, 문자열 숫자, 소수, 음수, 비숫자, 단위 포함 금액 문자열을 현재 코드 기준으로 잠근다.

## 4. 테스트 추가 단위

신규 파일:
- `kpi-runtime/internal-server/test/frontend/report-deltas-pair-from-series.smoke.js`

수정 파일:
- `kpi-runtime/internal-server/test/frontend/report-builder-data-model.smoke.js`
- `kpi-runtime/internal-server/test/frontend/metering-equipment-usage-calculation.smoke.js`
- `kpi-runtime/internal-server/test/frontend/report-sheet-electric-comparison-summary.smoke.js`
- `kpi-runtime/internal-server/test/frontend/metering-billing-settlement.smoke.js`
- `kpi-runtime/internal-server/test/frontend/kpi-util-data-sync.smoke.js`

방식:
- `buildUtilReportDeltaPairFromSeries`는 `KPI.util.report.deltas.js`에서 함수 정의 문자열만 추출해 vm으로 평가한다.
- 기존 smoke 테스트는 production source 변경 없이 fixture expected만 추가한다.
- KPI-Server 회사 런타임 포트 `3100`은 유지하고, 로컬 참조의 실험 포트 `18080`은 반영하지 않는다.
- 운영 DB, runtime storage, logs, uploads, env, secrets, 인증/토큰 파일은 읽거나 복사하거나 수정하지 않는다.

## 5. 값 변경 방지 원칙

- production 계산식, 산식, 반올림, 합산, 차감, 표시 방식은 변경하지 않는다.
- expected output은 현재 코드가 내는 값을 기준으로 고정한다.
- 의도적 산식 변경이 생기면 이 테스트가 실패하는 것이 정상이며, 별도 승인된 산식 변경 패치에서 expected와 화면 표시 기준을 함께 갱신한다.
- export 추가를 위해 production source를 수정하지 않는다. 테스트 전용 vm context의 `__testExports`만 사용한다.

## 6. 검증 명령

변경 JS syntax:
```powershell
node --check kpi-runtime/internal-server/test/frontend/report-deltas-pair-from-series.smoke.js
node --check kpi-runtime/internal-server/test/frontend/report-builder-data-model.smoke.js
node --check kpi-runtime/internal-server/test/frontend/metering-equipment-usage-calculation.smoke.js
node --check kpi-runtime/internal-server/test/frontend/report-sheet-electric-comparison-summary.smoke.js
node --check kpi-runtime/internal-server/test/frontend/metering-billing-settlement.smoke.js
node --check kpi-runtime/internal-server/test/frontend/kpi-util-data-sync.smoke.js
```

Targeted fixture tests:
```powershell
node --test kpi-runtime/internal-server/test/frontend/report-deltas-pair-from-series.smoke.js
node --test kpi-runtime/internal-server/test/frontend/report-builder-data-model.smoke.js
node --test kpi-runtime/internal-server/test/frontend/metering-equipment-usage-calculation.smoke.js
node --test kpi-runtime/internal-server/test/frontend/report-sheet-electric-comparison-summary.smoke.js
node --test kpi-runtime/internal-server/test/frontend/metering-billing-settlement.smoke.js
node --test kpi-runtime/internal-server/test/frontend/kpi-util-data-sync.smoke.js
```

패키지 게이트:
```powershell
npm.cmd --prefix kpi-runtime/internal-server run lint
npm.cmd --prefix kpi-runtime/internal-server run format:check
npm.cmd --prefix kpi-runtime/internal-server test
```

제외:
- `npm.cmd --prefix kpi-runtime/internal-server run verify`는 `verify:cleanup-baseline`을 통해 cleanup/report 계열 스크립트를 포함하므로 DB/runtime storage 접근 가능성이 있다. 이번 작업의 리스크 제외 범위에 따라 실행하지 않는다.

이번 실행 결과:
- 변경 JS `node --check`: 6개 파일 pass.
- Targeted fixture `node --test`: 6개 파일, 38 tests pass.
- `npm.cmd --prefix kpi-runtime/internal-server run lint`: pass.
- `npm.cmd --prefix kpi-runtime/internal-server run format:check`: pass.
- `npm.cmd --prefix kpi-runtime/internal-server test`: pass, 677 tests.
- `npm.cmd --prefix kpi-runtime/internal-server run verify`: 리스크 제외 범위라 미실행.

## 7. 리스크

- 리스크 있는 항목 진행 조건:
  - `npm.cmd --prefix kpi-runtime/internal-server run verify` 실행 전 `verify:*` 하위 스크립트가 DB/runtime storage/logs/uploads를 쓰는지 먼저 분해 확인한다.
  - 실행이 필요하면 운영 DB/운영 storage가 아닌 disposable fixture DB 또는 임시 storage root를 명시하고, `--write` 없는 dry-run/read-only 경로만 허용한다.
  - cleanup/report 계열 스크립트는 결과 출력만 허용하고 delete/import/migration/restore/write/backup 생성이 필요한 단계는 별도 승인 전까지 중단한다.
  - env/secrets/auth/token 파일은 복사·수정하지 않는다. 필요 시 테스트 전용 환경변수만 새로 지정한다.
  - production 산식 변경은 본 회귀 테스트 범위에서 분리한다. 의도적 산식 변경은 별도 패치에서 expected fixture와 화면 표시 기준을 함께 갱신한다.
- `buildUtilReportDeltaPairFromSeries`의 함수 위치나 시그니처가 바뀌면 string slicing extraction이 실패할 수 있다. 이 경우 테스트가 sentinel assertion으로 명시적으로 실패한다.
- rate 단위는 현재 코드의 `%` 계산 결과(`* 100`)를 잠근다. 단위 변경은 별도 산식 변경으로 다뤄야 한다.
- `npm run verify`를 제외했기 때문에 cleanup/report 계열까지 포함한 전체 verify 경로는 이번 라운드에서 검증하지 않는다.
- 운영 DB, runtime storage, logs, uploads, env, secrets, 인증/토큰 파일 접근은 이번 범위 밖이다.

## 8. 후속 라운드 후보

리스크 제외 기준 A~F는 완료. 후속 후보는 운영 데이터 없이 작은 fixture로 분리할 때만 진행한다.
- 보고서 table row/summary HTML 텍스트 스냅샷 최소 잠금
- 에너지 chart/trend 비율 계산 fixture 잠금
- 서버 저장 전후 normalizer fixture 잠금
