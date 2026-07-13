# KPI Server Design Contract

## 1. Atmosphere / Signature

KPI Server UI는 생산·설비·유틸리티·감사 데이터를 빠르게 읽고 기록하는 고밀도 운영 문서 화면이다. 장식보다 정보 계층, 표 정렬, 명확한 상태, 안정적인 입력 피드백을 우선한다. 이번 리팩터링의 시각 방향은 `dense operational ledger`이며 기존 화면을 재디자인하지 않는다.

- `DESIGN_VARIANCE`: 1/10
- `MOTION_INTENSITY`: 0/10. 기존 상태 전환만 보존한다.
- `VISUAL_DENSITY`: 8/10
- 기존 선택자, 값, cascade 순서를 이동하는 경우 값 자체는 legacy compatibility token으로 간주한다.
- 새 색상·간격·반경·그림자 값은 이 문서에 토큰을 먼저 추가한 뒤 사용한다.

## 2. Color

### Core surfaces

| Token | Value | Role |
| --- | --- | --- |
| `--kpi-color-page` | `#f8fafc` | 앱 배경 |
| `--kpi-color-surface` | `#ffffff` | 표·카드·모달 표면 |
| `--kpi-color-surface-muted` | `#f1f5f9` | 비활성·보조 영역 |
| `--kpi-color-foreground` | `#0f172a` | 기본 본문·제목 |
| `--kpi-color-foreground-soft` | `#334155` | 보조 본문 |
| `--kpi-color-muted` | `#64748b` | 설명·메타 |
| `--kpi-color-border` | `#e2e8f0` | 기본 경계 |
| `--kpi-color-border-strong` | `#cbd5e1` | 입력·강조 경계 |
| `--kpi-color-primary` | `#2563eb` | 선택·주요 동작 |
| `--kpi-color-primary-strong` | `#1d4ed8` | 주요 동작 hover |
| `--kpi-color-primary-soft` | `#eff6ff` | 선택 배경 |
| `--kpi-color-ring` | `#60a5fa` | 키보드 focus |

### Semantic states

| Token | Value | Role |
| --- | --- | --- |
| `--kpi-color-success` | `#047857` | 완료·정상 |
| `--kpi-color-success-soft` | `#ecfdf5` | 완료 배경 |
| `--kpi-color-warning` | `#d97706` | 주의·진행 |
| `--kpi-color-warning-soft` | `#fff7ed` | 주의 배경 |
| `--kpi-color-danger` | `#b91c1c` | 오류·삭제 |
| `--kpi-color-danger-soft` | `#fef2f2` | 오류 배경 |
| `--kpi-color-info` | `#0891b2` | 정보·개요 |
| `--kpi-color-info-soft` | `#ecfeff` | 정보 배경 |

### Team accents

| Token | Value | Role |
| --- | --- | --- |
| `--kpi-team-1-1` | `#1d4ed8` | 1팀 1파트 |
| `--kpi-team-1-2` | `#d97706` | 1팀 2파트 |
| `--kpi-team-2` | `#047857` | 2팀 |
| `--kpi-team-3` | `#5b21b6` | 3팀 |
| `--kpi-team-4` | `#b91c1c` | 4팀 |
| `--kpi-team-other` | `#4b5563` | 기타·미지정 |

본문과 표면은 WCAG AA 수준의 대비를 유지한다. 상태색만으로 의미를 전달하지 않고 텍스트, 아이콘, 레이블을 함께 보존한다.

## 3. Typography

기본 글꼴은 프로젝트가 이미 제공하는 `"Noto Sans KR", "Malgun Gothic", "Segoe UI", sans-serif`다. 숫자가 정렬되는 표와 계량기 값은 기존 `font-variant-numeric: tabular-nums`를 유지한다.

| Token | Size / Weight / Line height | Role |
| --- | --- | --- |
| `--kpi-type-title` | `24px / 900 / 1.2` | 화면 제목 |
| `--kpi-type-section` | `18px / 900 / 1.3` | 영역 제목 |
| `--kpi-type-body` | `14px / 500 / 1.5` | 기본 본문 |
| `--kpi-type-label` | `12px / 800 / 1.35` | 표 머리글·필드 레이블 |
| `--kpi-type-caption` | `11px / 700 / 1.35` | 메타·보조 설명 |
| `--kpi-type-number` | `14px / 800 / 1.35` | 계량·금액·수량 |

## 4. Spacing

기본 단위는 4px이다. 새 margin, padding, gap은 아래 배수만 사용한다.

| Token | Value |
| --- | --- |
| `--kpi-space-0` | `0` |
| `--kpi-space-1` | `4px` |
| `--kpi-space-2` | `8px` |
| `--kpi-space-3` | `12px` |
| `--kpi-space-4` | `16px` |
| `--kpi-space-5` | `20px` |
| `--kpi-space-6` | `24px` |
| `--kpi-space-8` | `32px` |
| `--kpi-space-10` | `40px` |
| `--kpi-space-12` | `48px` |

기존 CSS를 이동만 하는 배치에서는 원래 값을 바꾸거나 재정렬하지 않는다. 의미 정리와 토큰 치환은 별도 시각 변경 배치에서만 수행한다.

## 5. Components

- 입력: 흰 표면, `--kpi-color-border-strong`, 4~8px 반경, 높이 28~36px 범위를 유지한다.
- 버튼: 기본은 흰 표면과 경계, primary만 파란색을 사용한다. hover, active, focus-visible, disabled 상태를 모두 유지한다.
- 표: 선 기반 구분을 우선하고 숫자는 우측 정렬한다. 행 hover가 있으면 정보 대비를 해치지 않는 muted surface만 사용한다.
- 카드: 기능상 그룹이 필요한 경우에만 사용한다. 중첩 카드와 장식용 그림자는 추가하지 않는다.
- 모달: viewer보다 높은 z-index, 명확한 제목·닫기 동작, backdrop·Escape·focus 상태를 유지한다.
- 상태: 완료·진행·미완료는 semantic token과 텍스트 레이블을 함께 사용한다.
- 빈 상태·오류·권한 부족·저장 실패 상태를 숨기거나 성공 상태로 대체하지 않는다.

## 6. Motion

- 새 레이아웃 애니메이션을 추가하지 않는다.
- 기존 전환은 160~250ms 범위와 `ease` 또는 `ease-out`을 유지한다.
- 애니메이션이 필요한 경우 `transform`, `opacity`, `filter`만 사용한다.
- `prefers-reduced-motion: reduce`에서는 비필수 전환을 제거한다.

## 7. Depth

기본 깊이 전략은 border-first다. 화면 계층은 배경 톤과 1px 경계로 표현하고, 그림자는 팝업·모달·부유 컨트롤에만 유지한다.

| Token | Value | Role |
| --- | --- | --- |
| `--kpi-radius-sm` | `4px` | 표·작은 입력 |
| `--kpi-radius-md` | `8px` | 필드·버튼·작은 카드 |
| `--kpi-radius-lg` | `12px` | 모달·큰 그룹 |
| `--kpi-shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | 작은 부유 요소 |
| `--kpi-shadow-md` | `0 10px 28px rgba(15, 23, 42, 0.12)` | 팝업 |
| `--kpi-shadow-lg` | `0 18px 56px rgba(15, 23, 42, 0.22)` | 모달 |

## Refactor Invariants

- 이번 작업은 구조 리팩터링이다. 사용자에게 보이는 문구, 값, 정렬, 색상, 크기, 반응형 동작을 의도적으로 바꾸지 않는다.
- 기존 CSS를 chunk로 옮길 때 byte order에 해당하는 cascade 순서를 유지한다.
- 기존 CSS URL은 import-only 호환 facade로 유지한다.
- 공개 global API, `data-*` 속성, endpoint, 저장 payload, 파일 다운로드·인쇄 결과를 보존한다.
- 새 시각값과 새 UI 패턴은 이 리팩터링 범위에 포함하지 않는다.
