# 설비 이력 화면 설계

## 방향

설비 이력 화면은 실제 설비 데이터의 목차, 사진, 상세 편집, 저장 흐름을 제공하는 단일 권위 UI다. 고밀도 화면을 유지하면서 팀과 실의 구조를 정갈하게 구분한다.

- Design variance: 2/10
- Motion intensity: 1/10
- Visual density: 9/10
- Desktop-first: 1280px, 1440px, 1920px
- Depth: borders-only

## 색상

- Canvas: `rgb(243 244 246)`
- Surface: `rgb(255 255 255)`
- Muted surface: `rgb(248 250 252)`
- Group surface: `rgb(229 231 235)`
- Border: `rgb(209 213 219)`
- Strong border: `rgb(156 163 175)`
- Text: `rgb(17 24 39)`
- Body: `rgb(55 65 81)`
- Muted text: `rgb(107 114 128)`
- Focus: `rgb(29 78 216)`
- Running: `rgb(22 101 52)`, bg `rgb(240 253 244)`, border `rgb(187 247 208)`
- Stop: `rgb(153 27 27)`, bg `rgb(254 242 242)`, border `rgb(254 202 202)`
- Check: `rgb(146 64 14)`, bg `rgb(255 251 235)`, border `rgb(253 230 138)`
- Danger: `rgb(185 28 28)`

팀 색상은 작업 이력/조도와 동일한 팀 마커 색을 사용한다.

- 1팀 1파트: `rgb(29 78 216)`
- 1팀 2파트: `rgb(217 119 6)`
- 2팀: `rgb(4 120 87)`
- 3팀: `rgb(91 33 182)`
- 공무환경팀: `rgb(220 38 38)`

## 타이포그래피

- Font stack: `"Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Label: 11px, 700, line-height 1.3
- Control: 12px, 700, line-height 1.35
- Unified toolbar label: 12px, 800, line-height 1.2
- Unified toolbar value: 14px, 900, line-height 1.2
- Unified toolbar control: 13px, 700, line-height 1.35
- Unified toolbar status rate: 12px, 800, line-height 1.2
- Unified toolbar metric icon: 13px square, Font Awesome solid, one icon per metric
- Fullscreen icon: 17px square, 2px stroke
- Card/body: 14px, 700, line-height 1.4
- Section: 16px, 800, line-height 1.3
- Page title: 20px, 800, line-height 1.2
- Letter spacing: 0

## 간격과 형태

- Legacy precision base: 1px
- Base spacing: 4px
- Spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px
- Team group gap: 32px
- Room group gap: 16px
- Radius small: 2px
- Radius: 4px
- Control height: 32px
- Unified toolbar control height: 36px
- Fullscreen button: 36px square
- Team marker width: 3px
- Room marker width: 2px
- Team header tint: 10%
- Team boundary mix: pure team color on top, 42% team color on the header divider
- Room boundary mix: 36% team color mixed with the neutral border
- Team disclosure control: 28px square, same border/radius rules as the team order control
- Equipment card min width: 220px
- Photo ratio: wide, `object-fit: contain`

## 컴포넌트

- 페이지는 중립 회색 캔버스와 1px 라인 중심으로 구성한다.
- 목차 화면에서는 별도 페이지 대표 아이콘과 `설비 이력` 페이지 제목을 표시하지 않는다.
- 목차 상단 한 행의 왼쪽은 `전체 설비`, `가동중`, `비가동중`, `정비중` 요약 셀과 `전체 적용` 제어로, 오른쪽은 팀·상태·검색·초기화·전체화면 제어로 구성한다.
- 각 요약 라벨 앞에는 의미를 바로 구분하는 단색 기능 아이콘을 하나만 둔다. `전체 설비`는 기어, `가동중`은 재생, `비가동중`은 정지, `정비중`은 공구 아이콘을 사용하고 모두 보조기술에서 숨긴다.
- 요약은 현재 팀·상태·검색 조건을 즉시 반영한다. 별도 원형 상태 링은 복원하지 않고, 원형 그래프의 가동·비가동·정비 색상과 백분율 표현을 각 상태 아이콘과 셀에 이식한다.
- 작업 이력과 설비 이력의 전체화면 버튼은 동일한 확장·축소 SVG 형태와 36px 정사각형 크기를 사용한다.
- 상세 편집 화면의 뒤로가기와 설비 제목·작업 버튼은 기존 구조를 유지한다.
- 개별 이력카드의 제목 입력행은 팀 → 실 → 설비 카테고리 → 설비명 순서로 배치하며 카테고리에도 같은 입력 양식과 기존 카테고리 선택 목록을 사용한다. 최근 업데이트는 문서 첨부 아래, 카드 맨 끝 오른쪽에 표시한다.
- 상단 바, 요약, 팀, 실, 설비 카드, 상세 섹션은 같은 radius와 border 규칙을 따른다.
- 팀 구분은 3px 순색 상단선, 10% 팀색 헤더, 16px 팀명으로 가장 강하게 표시한다.
- 실 구분은 팀 안쪽의 2px 저채도 세로 레일과 중립 헤더로 표시해 팀보다 한 단계 낮게 읽히게 한다.
- 팀색은 팀 헤더와 경계 표식에만 제한하고 설비 카드 배경에는 사용하지 않는다.
- 각 팀 헤더 오른쪽에는 접기·펼치기 버튼과 28px 연필 아이콘의 팀 편집 버튼을 둔다. 팀은 기본적으로 펼쳐지며, 접었을 때도 팀명·대수·두 제어와 팀 경계색은 유지하고 실·설비 목록만 숨긴다.
- 각 팀명 바로 옆에는 항상 보이는 `예방 정비` 버튼을 두고 해당 팀의 실제 설비 수를 표시한다.
- 팀 전체 예방정비 화면은 팀 설비목록을 `설비 카테고리`별로 보여주며 각 설비의 예방정비칸과 동일한 `annualMaintenancePlan`, `maintenanceHistory`를 조회·편집한다. 어느 화면에서 저장해도 다른 화면에 같은 기록이 표시된다. 계획을 완료 이력으로 자동 변환하지 않는다.
- 팀명 옆의 버튼을 열면 모든 설비명과 카테고리 입력·저장, 계획·이력 작성 버튼을 먼저 표시한다. 카테고리 이름·대수를 구분선으로 묶고 설비마다 반복되는 카드 테두리는 사용하지 않는다. 기록 본문은 설비별 `기록 보기`로 펼치고 월별 집계는 목록 아래에 둔다. 긴 설비목록도 높이를 줄여 자르지 않고 마지막 설비까지 창 안에서 스크롤할 수 있게 한다.
- 월별 일정 분포는 설비에 저장된 예방정비 계획의 실시월을 기준으로 집계한다. 월을 선택해도 모든 팀 설비를 유지하고 표시되는 계획 행만 변경한다. 계획이 없는 설비도 항상 표시하며 설비가 없는 팀은 빈 상태를 제공한다.
- `설비 카테고리`는 사용자가 별도로 지정하는 `maintenanceCategory`다. 팀 전체 목록에서 각 설비 옆에 원하는 이름을 직접 입력하거나 기존 이름을 선택하고 저장할 수 있다. 같은 팀에서 같은 카테고리로 지정한 설비들을 선택해 예방정비 계획 또는 정비 이력을 한 번에 추가할 수 있다. 미지정 설비는 일괄 입력 대상에서 제외한다.
- 팀 목록의 카테고리 입력, 카테고리 저장, 계획·이력 작성은 같은 높이의 한 행에 배치한다. 카테고리는 직접 입력과 펼침 목록 선택을 모두 지원하며, 저장한 이름은 `maintenanceCategoriesByTeam`에 팀별로 기억한다. 기존 설비의 카테고리를 바꿔도 그 이름은 다시 선택할 수 있고, 다른 팀의 목록에는 나타나지 않는다. 목록에서 이름을 선택하는 동작은 입력값만 바꾸며 실제 저장은 저장 버튼 또는 저장 단축키로 수행한다.
- 팀과 실의 `추가` 버튼은 평소에는 숨기고, 해당 팀의 편집 모드를 열었을 때만 순서 이동 제어와 함께 표시한다. 다른 팀의 편집 도구는 영향을 받지 않는다.
- 전체 적용은 `정비중` 요약 셀 바로 옆의 단일 진입 버튼으로 열고, 내부에서 팀/실/상태 필터를 선택한다.
- 구형 팀/실별 상태 전환 버튼은 사용하지 않고, 상단 전체 적용과 개별 카드 상태 변경을 유지한다.
- 설비 목차의 전체 설비 사진 노출은 유지한다.

## 동작

- 전환은 120ms ease-out만 사용한다.
- hover lift나 큰 그림자, 그라디언트 강조는 사용하지 않는다.
- `prefers-reduced-motion: reduce`에서는 전환을 제거한다.
- 팀 접힘 상태는 설비 데이터와 분리된 현재 화면의 메모리 상태다. 검색·필터로 목차가 다시 그려져도 유지하되 새로 화면을 마운트하면 기본 펼침으로 시작한다.
- 팀 접기 버튼은 `aria-expanded`와 `aria-controls`를 제공하고, 접힌 실·설비 영역은 `hidden`으로 키보드 탐색에서도 제외한다.
- 팀 편집 버튼은 `aria-pressed`와 `aria-expanded`로 현재 모드를 알리고 라벨을 `편집 모드 열기/닫기`로 갱신한다.
- 접힌 팀에서 편집 모드를 열면 해당 팀을 자동으로 펼치고, 편집 중인 팀을 접으면 편집 모드도 함께 종료한다.
- 예방 정비의 설비 편집은 공용 저장 버튼과 Ctrl+S를 지원한다. 팀 목록에서는 각 카테고리의 저장 버튼 또는 해당 입력칸의 Enter/Ctrl+S로 카테고리만 저장한다. 저장하지 않은 설비 편집을 닫을 때는 폐기 여부를 확인한다.
- 개별 카드와 팀 예방정비 편집에서 계획·정비 이력을 추가 또는 수정한 뒤 저장하면 `다른 카테고리에도 적용하시겠습니까?`를 묻는다. 같은 팀의 설비를 카테고리별로 선택하거나 펼쳐서 개별 선택한다. 같은 카테고리만 기본 선택하고 다른 카테고리·미지정 설비는 직접 선택한다. 미지정 원본은 기본 선택이 없다. 작성 내용은 접힌 요약으로 제공한다. 현재 설비만 저장, 선택 설비에도 등록, 계속 작성 중 하나를 고르며 선택 전에는 서버에 기록하지 않는다. 원본과 선택한 설비를 한 요청으로 저장하고, 선택 설비에 이미 있는 동일 내용은 중복 추가하지 않는다. 선택 대상의 팀·카테고리가 확인 중 바뀌면 재확인을 요청한다. 단순 재저장·행 삭제·순서 변경·카테고리만 변경한 경우에는 질문을 반복하지 않는다.
- 설비 편집에서 일괄 입력을 열면 현재 설비의 변경사항을 먼저 저장한다. 작성 중인 정비 기록에 공유할 대상이 있으면 공유 확인을 먼저 표시하며, 저장을 마친 뒤 일괄 입력을 다시 열 수 있다. 일괄 입력은 선택한 설비에 새 행만 추가하고 기존 기록을 유지하며 한 번의 기존 서버 저장 요청으로 처리한다. 저장 중에는 중복 제출을 막고 실패하면 입력 내용을 유지한다.

## 적용 조건

- 실제 데이터 키 `data_equipment_history_card`를 유지한다.
- 별도 더미 데이터, 별도 사용자 제한 목차, 별도 메모리 저장 경로를 사용하지 않는다.
- 서버 저장 API, PortalData, 첨부 파일 저장소는 기존 경로를 유지한다.
