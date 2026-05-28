# 유틸리티 정산 그래프 템플릿

정산 그래프 화면에서 재사용하는 순수 HTML/CSS/JavaScript 템플릿입니다.
기존 `정산 그래프` 폴더를 특정 공장/항목에 묶이지 않는 템플릿 모듈로 옮긴 것입니다.

## 파일 구성

- `index.html`: 독립 미리보기용 페이지
- `styles.css`: A4형 그래프 양식 스타일
- `app.js`: SVG 차트/표 렌더링 및 데이터 바인딩 함수

## 런타임 API

`app.js`는 `window.KpiUtilityGraphTemplate`를 노출합니다.

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

값이 없는 항목은 `null` 또는 생략하면 빈칸으로 유지됩니다.

## 키 규칙

월별 키는 `YYYY-MM` 형식입니다.
예: `2024-04`, `2025-12`, `2026-04`
