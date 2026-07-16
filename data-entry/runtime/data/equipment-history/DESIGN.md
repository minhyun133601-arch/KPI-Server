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
- 목차 상단 한 행의 왼쪽은 `전체 설비`, `가동중`, `비가동중`, `정비중` 요약 셀로, 오른쪽은 팀·상태·검색·초기화·전체화면 제어로 구성한다.
- 각 요약 라벨 앞에는 의미를 바로 구분하는 단색 기능 아이콘을 하나만 둔다. `전체 설비`는 기어, `가동중`은 재생, `비가동중`은 정지, `정비중`은 공구 아이콘을 사용하고 모두 보조기술에서 숨긴다.
- 요약은 현재 팀·상태·검색 조건을 즉시 반영한다. 별도 원형 상태 링은 복원하지 않고, 원형 그래프의 가동·비가동·정비 색상과 백분율 표현을 각 상태 아이콘과 셀에 이식한다.
- 작업 이력과 설비 이력의 전체화면 버튼은 동일한 확장·축소 SVG 형태와 36px 정사각형 크기를 사용한다.
- 상세 편집 화면의 뒤로가기와 설비 제목·작업 버튼은 기존 구조를 유지한다.
- 상단 바, 요약, 팀, 실, 설비 카드, 상세 섹션은 같은 radius와 border 규칙을 따른다.
- 팀 구분은 3px 순색 상단선, 10% 팀색 헤더, 16px 팀명으로 가장 강하게 표시한다.
- 실 구분은 팀 안쪽의 2px 저채도 세로 레일과 중립 헤더로 표시해 팀보다 한 단계 낮게 읽히게 한다.
- 팀색은 팀 헤더와 경계 표식에만 제한하고 설비 카드 배경에는 사용하지 않는다.
- 각 팀 헤더 오른쪽에는 접기·펼치기 버튼과 28px 연필 아이콘의 팀 편집 버튼을 둔다. 팀은 기본적으로 펼쳐지며, 접었을 때도 팀명·대수·두 제어와 팀 경계색은 유지하고 실·설비 목록만 숨긴다.
- 팀과 실의 `추가` 버튼은 평소에는 숨기고, 해당 팀의 편집 모드를 열었을 때만 순서 이동 제어와 함께 표시한다. 다른 팀의 편집 도구는 영향을 받지 않는다.
- 전체 적용은 상단의 단일 진입 버튼으로 열고, 내부에서 팀/실/상태 필터를 선택한다.
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

## 적용 조건

- 실제 데이터 키 `data_equipment_history_card`를 유지한다.
- 별도 더미 데이터, 별도 사용자 제한 목차, 별도 메모리 저장 경로를 사용하지 않는다.
- 서버 저장 API, PortalData, 첨부 파일 저장소는 기존 경로를 유지한다.
