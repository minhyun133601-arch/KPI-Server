# 설비이력카드 법정설비 연동 계획

작성일: 2026-05-12

## 목적

설비이력카드에서 특정 설비를 `법정설비`로 표시하고, 표시된 설비에 한해 법정 검사 일정과 선임자 정보를 확인하거나 추가할 수 있게 한다.

이번 문서는 구현 계획만 정리한다. 실제 코드, 데이터 구조, 화면, API는 수정하지 않는다.

## 현재 구조 확인

- 설비이력카드 본문은 `data_equipment_history_card.equipmentList[]`에 저장된다.
- 설비이력카드 첨부는 `data.equipment_history` owner domain과 `photo|attachment` file category를 사용한다.
- 법정설비 본문은 `audit_legal_facility.facilities[]`에 저장된다.
- 법정설비는 `facility`, `itemType`, `plant`, `manager/responsible`, `inspections[]`를 가지고, 검사 일정은 `inspections[].type`, `lastDate`, `nextDate`, `cycle`, `agency`, 첨부 문서 참조로 관리된다.
- 법정설비 첨부는 `audit.legal_facility` owner domain과 `photo|attachment` file category를 사용한다.
- 두 영역은 같은 `portal_data` 모듈 레코드 계층을 쓰지만 permission key가 다르다.
  - 설비이력카드: `data.equipment_history`
  - 법정설비: `audit.legal_facility`

## 권장 방향

법정 검사 일정과 선임자는 `audit_legal_facility`를 원본으로 유지한다.

설비이력카드에는 법정설비 표시와 연결 정보만 둔다. 검사 일정과 선임자를 설비이력카드에 복사 저장하면 법정설비 화면, 달력, 첨부 문서 상태와 쉽게 어긋난다.

권장 데이터 연결 필드 예시:

```json
{
  "legalFacility": {
    "enabled": true,
    "facilityId": "legal-boiler-1",
    "itemType": "boiler",
    "displayLabel": "보일러",
    "linkedAt": "2026-05-12T00:00:00.000Z"
  }
}
```

법정설비 쪽에는 선택적으로 역참조를 추가할 수 있다.

```json
{
  "equipmentHistoryId": "eq-mixer-01",
  "equipmentHistoryName": "혼합기 A"
}
```

단, 1차 구현에서는 설비이력카드의 `legalFacility.facilityId`만으로도 충분하다. 역참조는 검색 성능이나 법정설비 화면에서 이력카드 바로가기가 필요할 때 추가한다.

## 사용자 화면 흐름

### 1. 설비 보드

- 설비 카드의 상태 버튼 옆에 작은 `법정` 배지를 표시한다.
- 법정설비로 연결된 카드에는 가장 가까운 검사 또는 선임/교육 일정을 `D-30`, `D+5` 같은 형태로 함께 보여준다.
- 보드 상단에는 `법정설비만` 필터를 추가할 수 있다.

### 2. 설비이력카드 작성 화면

- 상단 기본 정보 영역에 `법정설비` 토글 또는 배지를 둔다.
- 토글을 켜면 법정설비 연결 패널을 연다.
- 연결 패널에서 다음 동작을 제공한다.
  - 기존 법정설비 검색 및 연결
  - 현재 설비명/실/공정/관리팀을 바탕으로 신규 법정설비 생성
  - 연결 해제
- 연결된 경우에만 검사 일정과 선임자 입력 영역을 표시한다.

### 3. 검사 일정 및 선임자

- 일정 추가는 법정설비의 `inspections[]`에 저장한다.
- 입력 항목은 기존 법정설비 흐름과 맞춘다.
  - 항목: 정기검사, 사용검사, 선임, 기타
  - 최근 검사일 또는 선임일
  - 주기
  - 다음 검사일 또는 다음 교육일
  - 기관
  - 증빙 첨부
- 선임자는 기존 `manager/responsible`을 우선 사용하되 화면 라벨은 `선임자`로 보여준다.
- 선임자가 검사 항목별로 달라질 가능성이 있으면 `inspections[].responsible`을 추가하는 2차 확장을 고려한다.

## 저장 및 권한 원칙

- 설비이력카드 저장 권한만 있는 사용자는 법정설비 배지와 연결 상태를 볼 수 있어도 법정 검사 일정은 수정할 수 없어야 한다.
- 검사 일정, 선임자, 법정설비 첨부 수정은 `audit.legal_facility` write 권한이 있을 때만 허용한다.
- UI에서 버튼을 숨기는 것만으로는 권한 처리가 아니므로 서버 저장 요청에도 permission key를 분리해서 전달한다.
- 설비이력카드에서 법정설비를 새로 만들거나 검사 일정을 추가할 때는 저장 직전 최신 `audit_legal_facility` payload를 다시 읽고 대상 시설만 병합해야 한다. 두 화면이 같은 JSON 레코드를 통째로 저장하므로 오래된 payload로 덮어쓰는 위험을 줄여야 한다.

## 구현 단계

### 1단계: 표시와 연결만 추가

- 설비 record에 `legalFacility.enabled`와 `legalFacility.facilityId`를 저장한다.
- 설비 보드와 카드 상단에 법정설비 배지를 표시한다.
- 연결된 법정설비의 다음 일정을 읽어서 요약 표시한다.
- 아직 설비이력카드에서 법정 일정 생성은 열지 않는다.

### 2단계: 설비이력카드 안에서 법정설비 연결 관리

- 기존 법정설비 검색/선택 UI를 추가한다.
- 연결이 없을 때 현재 설비 정보로 신규 법정설비 초안을 만들 수 있게 한다.
- 신규 생성은 `audit_legal_facility.facilities[]`에 저장하고, 성공 후 설비 record의 `legalFacility.facilityId`를 저장한다.
- 어느 한쪽 저장이 실패하면 다른 쪽도 원상 복구하거나 사용자에게 부분 실패를 명확히 알려야 한다.

### 3단계: 검사 일정과 선임자 추가

- 연결된 설비에서만 검사 일정 추가 폼을 연다.
- 저장 대상은 `audit_legal_facility.facilities[].inspections[]`로 고정한다.
- 다음 검사일 자동 계산은 기존 법정설비의 cycle 계산 로직을 재사용한다.
- 일정 추가 후 설비 보드의 다음 검사 요약을 즉시 갱신한다.

### 4단계: 출력과 조회 보강

- 설비이력카드 A4 출력에 법정설비 배지와 다음 검사/선임 일정을 포함한다.
- 법정설비 화면에는 연결된 설비이력카드 바로가기를 제공한다.
- 필요하면 `법정설비 미연결`, `검사 임박`, `선임자 미입력` 필터를 추가한다.

## 예상 수정 파일

- `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js`
- `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js`
- `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js`
- `data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js`
- `audit/runtime/audit/records/KPI.audit.records.legal.model.js`
- `audit/runtime/audit/records/KPI.audit.records.legal.form.js`
- `audit/runtime/audit/records/KPI.audit.records.legal.js`
- `kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js`
- `kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js`
- `kpi-runtime/internal-server/test/frontend/audit-legal-form.smoke.js`

## 검증 계획

- `node --check`로 변경 JS 파일 문법 확인
- `node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js`
- `node --test kpi-runtime/internal-server/test/frontend/audit-legal-form.smoke.js`
- 신규 연동 smoke test 추가
  - 법정설비 배지 렌더링
  - 연결된 법정설비의 다음 검사 일정 요약
  - 권한 없을 때 일정 추가 버튼 비활성
  - 일정 추가가 `audit_legal_facility`에만 저장되는지 확인
- 체크포인트에서 `npm run format:check`, `npm run lint`, `npm run verify:server-structure`
- 화면 변경 후 `npm run smoke:kpi-browser`

## 결정이 필요한 점

- `선임자`를 설비별 1명으로 둘지, 검사/교육 항목별로 둘지 결정해야 한다.
- 설비이력카드에서 법정설비 신규 생성까지 허용할지, 기존 법정설비 연결만 허용할지 결정해야 한다.
- 설비의 `nextCheck`를 법정 검사 일정에서 자동 파생할지, 현재 설비이력카드의 일반 점검 필드로 분리 유지할지 결정해야 한다.
- 법정설비 연결 기준은 `id`를 원칙으로 하되, 기존 데이터 연결용 이름 매칭 규칙을 얼마나 자동화할지 결정해야 한다.

## 결론

1차 구현은 `설비이력카드에 법정설비 배지와 링크를 추가하고, 법정 일정은 읽기 요약만 보여주는 방식`이 가장 안전하다.

그 다음 단계에서 `audit_legal_facility` 원본에 검사 일정과 선임자 정보를 저장하도록 확장하면, 법정설비 화면의 달력과 첨부 관리 흐름을 깨지 않고 설비이력카드에서도 필요한 입력을 할 수 있다.
