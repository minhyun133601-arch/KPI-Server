# 작업 이력 화면 설계

## 1. 분위기

작업 이력은 많은 기록을 한 화면에서 빠르게 훑고 필터링하는 고밀도 운영 화면이다. 장식적인 페이지 제목보다 현재 범위의 핵심 수치와 조작 도구를 먼저 보여준다.

- Design variance: 2/10
- Motion intensity: 1/10
- Visual density: 9/10
- Desktop-first: 1280px, 1440px, 1920px

## 2. 색상

기존 작업 이력의 중립 토큰만 사용하고 상단 통합 도구줄에는 새 색을 추가하지 않는다.

- Surface: `var(--white)` / `#ffffff`
- Canvas: `var(--gray-100)` / `#f3f4f6`
- Muted surface: `var(--gray-50)` / `#f9fafb`
- Border: `var(--gray-300)` / `#d1d5db`
- Strong border: `var(--gray-400)` / `#9ca3af`
- Text: `var(--gray-900)` / `#111827`
- Body: `var(--gray-700)` / `#374151`
- Muted text: `var(--gray-600)` / `#4b5563`

팀 구분색은 기존 작업 이력과 조도의 공용 팀 마커 토큰을 유지한다.

- 1팀 1파트: `var(--kpi-team-1-1)` / `#1d4ed8`
- 1팀 2파트: `var(--kpi-team-1-2)` / `#d97706`
- 2팀: `var(--kpi-team-2)` / `#047857`
- 3팀: `var(--kpi-team-3)` / `#5b21b6`
- 공무환경팀: `var(--kpi-team-4)` / `#dc2626`
- 미분류 팀: `var(--kpi-team-other)` / `#4b5563`

상태 마커는 팀 색과 섞지 않고 기존 완료·미완료 토큰을 유지한다.

- 완료: 배경 `#f0fdf4`, 경계 `#86efac`, 글자 `#166534`
- 미완료: 배경 `#fef2f2`, 경계 `#fca5a5`, 글자 `#b91c1c`

## 3. 타이포그래피

- Font stack: `"Noto Sans KR", -apple-system, sans-serif`
- Toolbar label: 12px, 800, line-height 1.2
- Toolbar value: 14px, 900, line-height 1.2
- Control: 13px, 800, line-height 1.2
- Toolbar metric icon: 13px square, existing inline SVG set plus won symbol, one icon per metric
- Fullscreen icon: 17px square, 2px stroke
- 기록 표와 팀 헤더의 기존 크기·굵기는 유지한다.

## 4. 간격

- Legacy precision base: 1px
- Preferred rhythm: 4px 단위
- Toolbar outer gap: 8px
- Toolbar padding: 8px 10px
- Metric cell padding: 4px 10px
- Metric label icon gap: 4px
- Unified toolbar control height: 36px
- Fullscreen button: 36px square
- Radius: 4px

## 5. 컴포넌트

- 별도 페이지 대표 아이콘과 `작업 이력` 페이지 제목은 표시하지 않는다.
- 상단 한 행의 왼쪽은 `전체 작업`, `총금액`, `최근 작업일` 요약 셀로 구성한다.
- 각 요약 라벨 앞에는 의미를 바로 구분하는 단색 기능 아이콘을 하나만 둔다. `전체 작업`은 목록, `총금액`은 원화, `최근 작업일`은 달력 아이콘을 사용하고 모두 보조기술에서 숨긴다.
- 같은 행의 오른쪽은 `전체 팀`, `전체 구분`, 텍스트 검색, 필터 초기화, 전체화면 순서로 구성한다.
- 요약은 현재 선택한 팀·구분·검색 조건을 즉시 반영한다.
- 기록 목록 안에 있던 중복 요약 카드는 제거하고 팀별 고밀도 표는 그대로 유지한다.
- 필터의 기존 data-role, 전체화면 action, 추가·수정·저장 기능은 변경하지 않는다.

## 6. 모션

- 새 모션을 추가하지 않는다.
- 기존 hover/focus 전환과 `prefers-reduced-motion` 계약을 유지한다.

## 7. 깊이

- Borders-first.
- 1px 경계와 중립 표면 차이만 사용한다.
- 새 그림자, 그라디언트, 장식용 아이콘, 카드 중첩을 추가하지 않는다.
