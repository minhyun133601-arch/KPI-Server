# 입력·검증 유사 오류 점검 보고서 / Input Validation Risk Audit

작성일: `2026-04-30`

## 범위

- 저장소 전체에서 `input` 이벤트, 숫자 파싱, `is-invalid` / `is-fail` 표시, `0`을 falsy 로 취급하는 패턴을 전수 검색했다.
- 특히 `audit/`, `data-entry/`, `team-report/`, `utility/` 아래의 실제 사용자 입력 화면을 우선 확인했다.
- 이번 문서는 코드 수정이 아니라 정적 코드 점검 결과 정리다.

## 한줄 결론

- 즉시 수정 우선순위가 높은 하드 리스크는 `1건`이다.
- 입력 중간값에 대해 너무 일찍 실패 표시를 띄우는 UX 동형 리스크는 `2건`이다.
- 저장 시 숫자 입력을 조용히 `0`으로 뭉개는 인접 리스크는 `1건`이다.

## 1. 하드 리스크

### ENERGY-01

- 심각도: `높음`
- 영역: 에너지 환산 패널 / 에너지 차트 패널
- 위치:
  - `utility/runtime/util/energy/KPI.util.energy.dual.js:81-85`
  - `utility/runtime/util/energy/KPI.util.energy.dual.js:276-278`
  - `utility/runtime/util/energy/KPI.util.energy.dual.js:528-540`
  - `utility/runtime/util/energy/KPI.util.energy.dual.js:659-663`
  - `utility/runtime/util/energy/KPI.util.energy.chart.js:12-15`
  - `utility/runtime/util/energy/KPI.util.energy.chart.js:157-170`
  - `audit/runtime/audit/records/KPI.audit.records.render.js:1077-1081`
- 패턴:
  - `parseUtilNumericValue()` 는 공란이면 `null`, 숫자 `0`이면 `0`을 돌려준다.
  - 그런데 `parseUtilInputNumber()` 가 `null`과 `0`을 둘 다 `0`으로 바꾼다.
  - 그 다음 호출부가 `|| 이전값` 또는 `|| 기본값`을 써서 `0`을 비어 있음과 같은 의미로 취급한다.
- 실제 증상:
  - LNG/LPG 계수, 전기 계수, TOE 계수 입력칸에서 사용자가 `0`을 치면 값이 유지되지 않고 이전값이나 기본값으로 되돌아갈 수 있다.
  - 이 패널들은 `input` 때마다 바로 재계산하므로, 저장 버튼을 누르기 전에도 `0`이 중간 입력값으로 살아남지 못한다.
- 판단:
  - 이번에 유틸리티 기입 화면에서 고친 `0/중간 입력값과 즉시 검증 충돌`과 가장 비슷한 부류다.
  - 단순 UX 문제가 아니라 값 의미 자체가 바뀔 수 있어서 우선순위가 가장 높다.
- 수정 방향:
  - `parseUtilInputNumber()` 가 공란/잘못된 입력을 `null`로 유지하게 바꾸고, 호출부는 `||` 대신 `Number.isFinite(...)`로 분기해야 한다.
  - 실시간 재계산은 유지하더라도 `input` 단계에서는 `0`과 공란을 구분해야 한다.

## 2. UX 동형 리스크

### AUDIT-01

- 심각도: `중간`
- 영역: 일반 감사 측정값 입력 배지
- 위치:
  - `audit/runtime/audit/records/KPI.audit.records.render.js:755-758`
  - `audit/runtime/audit/records/KPI.audit.records.render.js:781-795`
  - `audit/runtime/audit/records/KPI.audit.records.data.js:233-246`
- 패턴:
  - 입력칸 `input` 이벤트마다 `updateAuditValueStatus()` 를 바로 호출한다.
  - 상태 계산은 `parseFloat(value)` 와 기준값 비교로 즉시 `pass/fail`을 만든다.
- 실제 증상:
  - 기준값이 양수인 항목에서 사용자가 `0`을 치는 순간 바로 실패 배지가 뜬다.
  - 저장이 막히는 것은 아니지만, 사용자가 아직 입력 중인 상태에서 빨간 실패 상태를 먼저 본다.
- 판단:
  - 현재 유틸리티 기입 화면에서 제거한 “입력 중간값에 대한 너무 빠른 오류/경고 표시”와 같은 UX 계열이다.
  - 다만 여기서는 값이 사라지거나 저장이 막히지는 않는다.
- 수정 방향:
  - blur 또는 저장 시점까지 실패 배지 반영을 미루거나,
  - 유틸리티 기입 화면처럼 활성 필드에 대해 일시적인 검증 억제 상태를 둘 수 있다.

### AUDIT-02

- 심각도: `중간`
- 영역: 조도 일괄 입력 / 조도 워크스페이스 분기
- 위치:
  - `audit/runtime/audit/records/KPI.audit.records.lux-workspace.js:103-122`
  - `audit/runtime/audit/records/KPI.audit.records.lux-workspace.js:374-380`
  - `audit/runtime/audit/records/KPI.audit.records.lux-workspace.js:770`
  - `audit/runtime/audit/records/KPI.audit.records.lux-workspace.js:902`
- 패턴:
  - `oninput=\"handleAuditLuxQuarterInput(this)\"` 와 `oninput=\"handleAuditLuxStandardInput(this)\"` 로 입력 중간 단계마다 실패 클래스를 갱신한다.
  - `syncAuditLuxQuarterFieldState()` 가 입력값과 기준값을 바로 비교해 `is-fail` 클래스를 붙인다.
- 실제 증상:
  - `0`, `0.` 같은 중간 입력만으로도 행/셀/피드백이 즉시 실패 상태로 물든다.
  - 저장 데이터는 남지만 사용자는 입력 도중 경고를 먼저 본다.
- 판단:
  - AUDIT-01과 같은 UX 계열이다.
  - 워크시트 형식이라 입력 셀이 많아질수록 체감 혼란이 더 커질 수 있다.
- 수정 방향:
  - 활성 입력칸은 blur 전까지 fail 클래스를 보류하거나,
  - 빈값, 단독 소수점, 방금 수정 중인 값에 대한 완화 규칙을 둘 필요가 있다.

## 3. 인접 숫자 정규화 리스크

### DATA-ENTRY-01

- 심각도: `중간 이하`
- 영역: 설비 이력 카드의 가동률(`rate`) 입력
- 위치:
  - `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js:73`
  - `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js:128`
  - `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js:161-163`
  - `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js:264-280`
  - `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js:443-445`
- 패턴:
  - 가동률 입력은 `type=\"text\"` 로 받고 입력 중 별도 숫자 검증이 없다.
  - 저장 시 `Number(normalized.rate) || 0` 으로 정규화해서 공란과 비숫자 값을 모두 `0`으로 뭉갠다.
- 실제 증상:
  - `0` 자체는 오류 없이 저장된다.
  - 대신 공란, 오타, 문자 입력도 조용히 `0%`가 되어 버릴 수 있다.
- 판단:
  - “0이 문제”라기보다 “0과 잘못된 입력의 경계가 흐림” 쪽 리스크다.
  - 지금 사용자 요청의 직접 원인과는 한 단계 떨어져 있지만, 숫자 필드 점검 범위에서는 기록해 둘 가치가 있다.
- 수정 방향:
  - 입력 타입을 숫자형으로 좁히거나,
  - 저장 전에 숫자 여부를 명시 검증하고 공란과 `0`을 분리해야 한다.

## 4. 스캔했지만 현재는 같은 문제로 보지 않은 곳

### SAFE-01

- 영역: 팀별 직접 사용량 / 팀별 직접 금액
- 위치:
  - `utility/apps/metering/team-overview/board-interactions.js:110-145`
  - `utility/apps/metering/team-overview/board-interactions.js:186-221`
  - `utility/apps/metering/save/persistence.js:82-110`
- 이유:
  - 입력 중에는 숫자만 남기고,
  - 실제 커밋은 `change` / `focusout` 에서 일어나며,
  - `\"0\"` 문자열을 truthy 로 유지하므로 `0`이 비어 있음으로 지워지지 않는다.

### SAFE-02

- 영역: 팀 정산 입력
- 위치:
  - `utility/apps/metering/team-settlement/form-actions.js:36-87`
  - `utility/apps/metering/billing/settlement-calculations.js:1-3`
  - `utility/apps/metering/billing/settlement-calculations.js:125-158`
  - `utility/apps/metering/billing/settlement.js:53-147`
- 이유:
  - 정산 쪽은 문자열 기반 정규화라 `\"0\"`이 살아 있고,
  - zero-default 항목을 별도로 채워 주는 코드도 있다.
  - 즉, 현재 보이는 `if (!nextValue)` 패턴은 `0` 숫자형이 아니라 `\"0\"` 문자열을 다루는 흐름이라 같은 버그로 바로 이어지지 않았다.

### SAFE-03

- 영역: 작업이력 비용 입력
- 위치:
  - `team-report/runtime/work/history/KPI.work.history.view.actions.js:242-244`
  - `team-report/runtime/work/history/KPI.work.history.view.layout.js:384-389`
  - `team-report/runtime/work/history/KPI.work.history.core.records.js:30-33`
- 이유:
  - 비용 입력은 `input` 때 콤마만 다시 포맷하고,
  - `0`은 `normalizeCost()` 에서 정상 숫자 `0`으로 남는다.
  - 필수 검사는 저장 시점에만 걸린다.

## 5. 우선순위 제안

1. `ENERGY-01` 먼저 수정
2. `AUDIT-01`, `AUDIT-02`는 같은 완화 패턴으로 묶어서 처리
3. `DATA-ENTRY-01`은 별도 숫자 필드 정리 때 함께 반영

## 6. 이번 점검 메모

- 현재 유틸리티 기입 화면에서 방금 고친 패턴과 가장 유사한 건 에너지 패널 쪽이었다.
- 감사 화면 쪽은 저장 실패보다 “입력 중간에 실패색이 먼저 뜨는” 문제가 중심이다.
- 설비 이력은 반대로 즉시 오류는 없지만, 숫자 정규화가 너무 느슨하다.
