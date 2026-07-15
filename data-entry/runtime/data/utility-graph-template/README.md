# 유틸리티 정산 그래프 템플릿

정산 그래프 화면에서 재사용하는 HTML/CSS/JavaScript 템플릿입니다. 특정 공장이나 항목에 종속되지 않으며 KPI 메인 런타임이 구성 요소를 순서대로 불러옵니다.

## 파일 구성

- `runtime/KPI.utility-graph-template.foundation.js`: 데이터 기본값과 공통 계산
- `runtime/KPI.utility-graph-template.charts.js`: SVG 차트와 표 렌더링
- `runtime/KPI.utility-graph-template.memo.js`: 메모 상태와 편집 동작
- `runtime/KPI.utility-graph-template.shell.js`: 템플릿 조립과 공개 렌더 함수
- `app.js`: 위 구성 요소를 `window.KpiUtilityGraphTemplate`로 노출하는 호환 facade
- `styles/01-template-core.css`, `styles/02-memo-controls.css`: 실제 스타일 구현
- `styles.css`: 스타일 파일을 순서대로 불러오는 import facade
- `index.html`: 로컬 미리보기용 최소 마크업 셸

런타임 구성 요소는 `foundation → charts → memo → shell → app.js` 순서로 로드해야 합니다. 실제 애플리케이션 로드 순서는 `KPI.html`과 `kpi-runtime/app/boot/KPI.boot.manifest.js`가 소유합니다.

## 런타임 API

```js
window.KpiUtilityGraphTemplate.render(container, {
  title: '유산 전기 원가 Data',
  rangeText: '( 2025년 5월~2026년 5월 )',
  labels: {
    usage: '전력량',
    usageUnit: 'kWh',
    amount: '금액',
    amountUnit: '원',
    production: '생산량',
    productionUnit: 'Kg',
    site: '북정',
    ratio: '생산량 대비 전력량',
    ratioUnit: 'kWh/Kg',
    tableRow: '생산량 대비 전력량<br>(kWh/Kg)',
    bottomCaption: '생산량 대비 전력량(kWh/Kg)'
  },
  topSeries: {
    usage: { '2026-05': 100000 },
    amount: { '2026-05': 20000000 },
    production: { '2026-05': 300000 }
  },
  bottomSeries: { '2026-05': 0.333 }
});
```

값이 없는 항목은 `null` 또는 생략하면 빈칸으로 유지됩니다. 월별 키는 `YYYY-MM` 형식입니다.
