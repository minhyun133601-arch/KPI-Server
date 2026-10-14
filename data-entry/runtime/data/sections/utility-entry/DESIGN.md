# 유틸리티 입력 화면 설계

## 1. 분위기

유틸리티 입력 화면은 한 화면에서 많은 검침값을 빠르게 확인하고 입력하는 고밀도 업무 화면이다. 장식보다 선명한 구분선, 짧은 조작 동선, 일관된 상태 표현을 우선한다.

- Design variance: 2/10
- Motion intensity: 1/10
- Visual density: 9/10
- Desktop-first: 1280px 이상

## 2. 색상

기존 화면의 색을 그대로 유지한다. 이번 상단 도구줄 정돈에서는 새 색을 추가하지 않는다.

- Canvas/surface: `#ffffff`, `#fffefe`, `#fafafa`, `#f8fafc`, `#f8fbff`, `#f6fbff`, `#f3f4f6`, `#f1f5f9`, `#fbfaf7`
- Foreground: `#0f172a`, `#111827`, `#1e293b`, `#1f2937`, `#334155`, `#475569`, `#64748b`, `#0f5f78`
- Muted: `#8f9bad`, `#94a3b8`
- Border: `#8fb6d8`, `#9fd5b4`, `#aeb7c2`, `#b6c3d1`, `#b7c0cc`, `#bac6d6`, `#bed7e5`, `#c5ced8`, `#cbd5e1`, `#cfd5dd`, `#d8dee7`, `#dbe5f0`, `#e1e6ee`, `#e2e8f0`
- Primary: `#084dbb`, `#0b57d0`, `#1d4ed8`, `#2563eb`, `#7dd3fc`
- Primary surface: `#dbeafe`, `#edf3ff`, `#eef2f7`, `#eef4ff`, `#eef8fb`, `#eff6ff`
- Success: `#14532d`, `#166534`, `#16a34a`, `#31a66a`, `#86efac`, `#9fd5b4`, `#dcfce7`, `#ecfdf3`, `#f0fdf4`
- Warning: `#c2410c`, `#d97706`, `#fb923c`, `#fdba74`, `#ffedd5`, `#fff7ed`
- Danger: `#991b1b`, `#b91c1c`, `#dc2626`, `#f87171`, `#fecaca`, `#fee2e2`, `#ffe4e6`, `#fff1f2`

## 3. 타이포그래피

- Font stack: `"Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Toolbar: 0.82rem, 800
- Period tab: 0.84rem, 900, line-height 1.2
- 본문과 입력 표의 기존 글자 크기·굵기를 유지한다.

## 4. 간격

- Legacy precision base: 1px
- Preferred rhythm: 4px 단위
- Toolbar gap: 8px × 14px
- Adjacent action gap: 5px
- Toolbar padding: 9px × 12px
- Period switch: border 1px, padding 2px, gap 2px
- Period tab: 최소 64px × 30px, 좌우 padding 10px
- Keyboard focus ring: `#2563eb`, 2px, offset 2px

## 5. 컴포넌트

- 상단은 별도 제목 줄 없이 도구줄부터 시작한다.
- 공통 도구줄 순서는 `저장 상태/저장 → 일간·월간 → 보정기준 → 연도/월 → 빠른 입력(일간은 삭제 포함)`이다.
- 일간 달력은 공통 도구줄 바로 아래의 전체 너비 행에 유지한다.
- 달력 날짜와 선택한 날짜는 서버 조회 전부터 표시한다. 조회 중·실패한 날짜는 미기입으로 단정하지 않고 중립색으로 표시하며, 실패 시 `다시 불러오기`를 제공한다. 조회가 완료되기 전에는 일간 저장·삭제를 막고, 기입 상태 계산은 표시하는 월의 날짜에 한정한다.
- `일간·월간`은 중립 배경과 외곽선으로 하나의 segmented control임을 표시하고, active 탭은 기존 primary 면색을 유지한다.
- 기존 radio/label 전환 계약과 hover 상태를 그대로 사용한다.
- `보정기준`은 기존 문서 아이콘, dialog 연결, 접근성 이름을 유지한다.
- 일간 `삭제`는 빠른 `입력` 버튼 바로 옆에 한 번만 두고 기존 Danger 색상만 사용한다. 월간 화면에는 표시하지 않는다.
- 삭제 확인문은 선택 날짜를 먼저 표시한 뒤 `기입된 유틸리티 값이 삭제됩니다. 정말 삭제하시겠습니까?`라고 간결하게 묻는다. 승인 시 전기·가스의 해당 날짜 일간 엔트리만 제거하며 다른 날짜, 월간 직접 입력값, 설정과 첨부 자료는 유지한다.
- 삭제 후 선택 날짜를 엄격하게 다시 표시해 다른 날짜 값으로 대체하지 않으며, 월간 산출값은 저장된 과거 계산값이 아니라 현재 원본으로 다시 계산한다. 계산에 필요한 원본이 없으면 해당 산출칸을 비운다.
- 저장 상태, 저장 버튼, 달력, 입력 표의 기존 계약과 서버의 버전 충돌 보호를 유지한다.
- 월간 CIP 입력은 `1팀 1파트`, `1팀 2파트`, `2팀`, `3팀`을 한 표에서 이 순서로 표시한다. 화면에서 합치더라도 `team_01_01`을 포함한 기존 팀별 저장 키와 유산·북정 입력 연결은 그대로 유지한다.

## 6. 모션

- 새 모션을 추가하지 않는다.
- 기존 hover/focus 상태만 유지한다.

## 7. 깊이

- Borders-first.
- 기존 1px 경계와 미세한 표면 차이만 사용한다.
- 새 그림자, 그라디언트, 카드 중첩을 추가하지 않는다.
