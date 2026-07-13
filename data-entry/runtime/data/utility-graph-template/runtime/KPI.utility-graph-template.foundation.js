(function registerUtilityGraphTemplateFoundation(global) {
  if (!global) return;
  const PARTS_KEY = Symbol.for('kpi.utilityGraphTemplate.parts');
  const parts = global[PARTS_KEY] || (global[PARTS_KEY] = Object.create(null));

  const NS = 'http://www.w3.org/2000/svg';
  const memoTeamOptions = [
    { key: 'team_01_01', label: '1팀 1파트' },
    { key: 'team_01_02', label: '1팀 2파트' },
    { key: 'team_02', label: '2팀' },
    { key: 'team_03', label: '3팀' },
    { key: 'site_yusan', label: '유산' },
    { key: 'site_total', label: '전체' },
    { key: 'other', label: '기타' }
  ];
  const memoMetricOptions = [
    { key: 'production', label: '생산량' },
    { key: 'yusan_production_share', label: '유산 생산량 비율' },
    { key: 'electric', label: '전력량' },
    { key: 'electric_unit', label: '생산량 대비 전력량' },
    { key: 'lng', label: 'LNG' },
    { key: 'lng_unit', label: '생산량 대비 LNG' },
    { key: 'lpg', label: 'LPG' },
    { key: 'gas_cost', label: '가스 비용' },
    { key: 'lpg_unit', label: '생산량 대비 LPG' },
    { key: 'waste_usage', label: '폐수 방류량' },
    { key: 'waste_cost_total', label: '폐수 처리비용' },
    { key: 'cip_count', label: 'CIP 횟수' },
    { key: 'cip_time', label: 'CIP 시간' },
    { key: 'monthly_average_temperature', label: '월간 평균온도' }
  ];

  const defaultTopMonths = buildMonths('2025-04', '2026-04');
  const defaultTableMonths = buildMonths('2024-04', '2026-04');
  const defaultLabels = {
    leftAxis: '금액',
    rightAxis: '사용량',
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
    bottomCaption: ''
  };

  const emptyReportData = {
    title: '북정공장 전기 원가 Data',
    rangeText: '',
    labels: defaultLabels,
    topMonths: defaultTopMonths,
    tableMonths: defaultTableMonths.map(month => ({
      ...month,
      value: null,
      highlight: month.key === '2025-04' || month.key === '2026-04'
    })),
    bottomMonths: defaultTableMonths,
    topSeries: {
      usage: null,
      amount: null,
      production: null
    },
    bottomSeries: null,
    remark: '',
    options: {
      top: {
        leftAxisMax: 70000000,
        rightAxisMax: 1600000,
        amountAxisStep: 10000000,
        usageAxisStep: 200000,
        showDataLabels: true
      },
      bottom: {
        yMin: null,
        yMax: null,
        yStep: 0.05,
        showDataLabels: true,
        comparisonKeys: ['2025-04', '2026-04']
      }
    }
  };

  function normalizeSeries(series, months) {
    if (!series) return months.map(() => null);
    if (Array.isArray(series)) {
      if (series.length && typeof series[0] === 'object' && series[0] !== null) {
        const map = Object.fromEntries(series.map(row => [row.key, row.value]));
        return months.map((month, index) => valueOrNull(map[month.key] ?? rowValue(series[index])));
      }
      return months.map((_, index) => valueOrNull(series[index]));
    }
    if (typeof series === 'object') {
      return months.map(month => valueOrNull(series[month.key]));
    }
    return months.map(() => null);
  }

  function rowValue(row) {
    if (!row || typeof row !== 'object') return null;
    return row.value;
  }

  function buildMonths(startKey, endKey) {
    const [startYear, startMonth] = startKey.split('-').map(Number);
    const [endYear, endMonth] = endKey.split('-').map(Number);
    const result = [];
    let year = startYear;
    let month = startMonth;
    while (year < endYear || (year === endYear && month <= endMonth)) {
      result.push({
        key: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        monthLabel: `${month}월`,
        label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
      });
      month += 1;
      if (month > 12) {
        year += 1;
        month = 1;
      }
    }
    return result;
  }

  function groupByConsecutiveYear(months) {
    const groups = [];
    months.forEach(month => {
      const last = groups[groups.length - 1];
      if (last && last.year === month.year) {
        last.count += 1;
      } else {
        groups.push({ year: month.year, count: 1 });
      }
    });
    return groups;
  }

  function getPositiveAxisMax(configuredMax, series, months, fallbackStep) {
    if (Number.isFinite(configuredMax) && configuredMax > 0) return configuredMax;
    const values = normalizeSeries(series, months).filter(isFiniteNumber);
    const maxValue = Math.max(...values, 0);
    if (maxValue <= 0) return fallbackStep;
    return getNiceAxisMax(maxValue);
  }

  function getNiceAxisMax(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    return getNiceNumber(numeric * 1.15);
  }

  function getNiceNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    const exponent = Math.floor(Math.log10(numeric));
    const base = 10 ** exponent;
    const fraction = numeric / base;
    let niceFraction = 10;
    if (fraction <= 1) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 2.5) {
      niceFraction = 2.5;
    } else if (fraction <= 5) {
      niceFraction = 5;
    }
    return niceFraction * base;
  }

  function formatUnitCost(value) {
    return isFiniteNumber(value) ? Number(value).toFixed(3) : '';
  }

  function formatAxisDecimal(value) {
    if (!isFiniteNumber(value) || Math.abs(value) < 1e-10) return '-';
    return Number(value).toFixed(3).replace(/^0/, '');
  }

  function clampLabelY(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    const minValue = Number.isFinite(Number(min)) ? Number(min) + 8 : numeric;
    const maxValue = Number.isFinite(Number(max)) ? Number(max) - 8 : numeric;
    return Math.max(minValue, Math.min(maxValue, numeric));
  }

  function comma(value) {
    return isFiniteNumber(value) ? Math.round(value).toLocaleString('en-US') : '';
  }

  function valueOrNull(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function mergeReportData(base, next) {
    const merged = clone(base);
    Object.assign(merged, next);
    merged.labels = { ...base.labels, ...(next.labels || {}) };
    merged.options = {
      top: { ...base.options.top, ...(next.options?.top || {}) },
      bottom: { ...base.options.bottom, ...(next.options?.bottom || {}) }
    };
    merged.topSeries = { ...base.topSeries, ...(next.topSeries || {}) };

    if (Array.isArray(next.tableMonths)) {
      const baseMonths = next.replaceTableMonths === true ? [] : base.tableMonths;
      const overrideMap = new Map(next.tableMonths.map(month => [month.key, month]));
      merged.tableMonths = baseMonths.length
        ? baseMonths.map(month => ({ ...month, ...(overrideMap.get(month.key) || {}) }))
        : next.tableMonths;
    }
    if (Array.isArray(next.topMonths)) merged.topMonths = next.topMonths;
    if (Array.isArray(next.bottomMonths)) merged.bottomMonths = next.bottomMonths;

    return merged;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function setViewBox(svg, x, y, width, height) {
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  }

  function createSvgElement(tagName) {
    return global.document.createElementNS(NS, tagName);
  }

  function addLine(svg, x1, y1, x2, y2, className = '', attrs = {}) {
    const el = createSvgElement('line');
    Object.entries({ x1, y1, x2, y2, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    if (className) el.setAttribute('class', className);
    svg.appendChild(el);
    return el;
  }

  function addRect(svg, x, y, width, height, attrs = {}) {
    const el = createSvgElement('rect');
    Object.entries({ x, y, width, height, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addCircle(svg, cx, cy, r, attrs = {}) {
    const el = createSvgElement('circle');
    Object.entries({ cx, cy, r, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addPolygon(svg, points, attrs = {}) {
    const el = createSvgElement('polygon');
    Object.entries({ points, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addPath(svg, d, attrs = {}) {
    const el = createSvgElement('path');
    Object.entries({ d, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addText(svg, x, y, text, className = '', attrs = {}) {
    const el = createSvgElement('text');
    Object.entries({ x, y, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    if (className) el.setAttribute('class', className);
    el.textContent = text;
    svg.appendChild(el);
    return el;
  }

  function escapeHtml(value = '') {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }


  Object.assign(parts, {
    memoTeamOptions,
    memoMetricOptions,
    defaultTopMonths,
    defaultTableMonths,
    emptyReportData,
    normalizeSeries,
    buildMonths,
    groupByConsecutiveYear,
    getPositiveAxisMax,
    formatUnitCost,
    clampLabelY,
    comma,
    isFiniteNumber,
    round,
    mergeReportData,
    clearSvg,
    setViewBox,
    addLine,
    addRect,
    addCircle,
    addPolygon,
    addPath,
    addText,
    escapeHtml
  });
})(this);
