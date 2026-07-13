import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runtimeSource,
  reportSectionSource,
  assertSourceTokenOrder,
  createContext,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report public works tables place prior-year month before current month', () => {
  [
    [
      'data-report-auto-month-label="reference"',
      'data-report-auto-month-label="current"',
      'data-report-auto-month-label="previous"',
    ],
    [
      'data-report-yusan-lpg-month-label="reference"',
      'data-report-yusan-lpg-month-label="current"',
      'data-report-yusan-lpg-month-label="previous"',
    ],
    [
      'data-report-yusan-lpg-cost-month-label="reference"',
      'data-report-yusan-lpg-cost-month-label="current"',
      'data-report-yusan-lpg-cost-month-label="previous"',
    ],
    [
      'data-report-waste-auto-month-label="reference"',
      'data-report-waste-auto-month-label="current"',
      'data-report-waste-auto-month-label="previous"',
    ],
  ].forEach(([referenceLabel, currentLabel, previousLabel]) => {
    assertSourceTokenOrder(reportSectionSource, [
      referenceLabel,
      currentLabel,
      '>전년대비<',
      previousLabel,
      '>전월대비<',
    ]);
  });

  [
    [
      'data-report-auto-value="${kind}.${row.key}.reference"',
      'data-report-auto-value="${kind}.${row.key}.current"',
      'data-report-auto-value="${kind}.${row.key}.yoy"',
      'data-report-auto-value="${kind}.${row.key}.previous"',
      'data-report-auto-value="${kind}.${row.key}.mom"',
    ],
    [
      'data-report-yusan-lpg-value="${row.key}.reference"',
      'data-report-yusan-lpg-value="${row.key}.current"',
      'data-report-yusan-lpg-value="${row.key}.yoy"',
      'data-report-yusan-lpg-value="${row.key}.previous"',
      'data-report-yusan-lpg-value="${row.key}.mom"',
    ],
    [
      'data-report-yusan-lpg-cost-value="${index}.reference"',
      'data-report-yusan-lpg-cost-value="${index}.current"',
      'data-report-yusan-lpg-cost-value="${index}.yoy"',
      'data-report-yusan-lpg-cost-value="${index}.previous"',
      'data-report-yusan-lpg-cost-value="${index}.mom"',
    ],
    [
      'data-report-waste-auto-value="${row.key}.reference"',
      'data-report-waste-auto-value="${row.key}.current"',
      'data-report-waste-auto-value="${row.key}.yoy"',
      'data-report-waste-auto-value="${row.key}.previous"',
      'data-report-waste-auto-value="${row.key}.mom"',
    ],
    [
      'data-report-waste-auto-value="production.reference"',
      'data-report-waste-auto-value="production.current"',
      'data-report-waste-auto-value="production.yoy"',
      'data-report-waste-auto-value="production.previous"',
      'data-report-waste-auto-value="production.mom"',
    ],
    [
      'data-report-waste-auto-value="total.reference"',
      'data-report-waste-auto-value="total.current"',
      'data-report-waste-auto-value="total.yoy"',
      'data-report-waste-auto-value="total.previous"',
      'data-report-waste-auto-value="total.mom"',
    ],
  ].forEach((tokens) => assertSourceTokenOrder(reportSectionSource, tokens));
});

test('report safety summary keeps compact team title and meta lines', () => {
  assert.match(reportSectionSource, /\.report-safety-summary-cell \{[^}]*padding: 2px 4px !important;/);
  assert.match(reportSectionSource, /\.report-safety-summary-text \{[^}]*gap: 2px;[^}]*line-height: 1\.05;/);
  assert.match(
    reportSectionSource,
    /\.report-safety-summary-team, \.report-safety-summary-title, \.report-safety-summary-meta \{[^}]*white-space: nowrap;/
  );
  assert.match(reportSectionSource, /\.report-safety-summary-team \{ color: #1d4ed8; font-size: 10px; \}/);
  assert.match(
    reportSectionSource,
    /\.report-safety-summary-title, \.report-safety-summary-meta \{ font-size: 11px; \}/
  );
  assert.doesNotMatch(reportSectionSource, /\.report-safety-summary-meta \{ font-size: 9px; \}/);
});

test('report deck auto chart labels render above markers and avoid only different-value overlaps', () => {
  assert.match(runtimeSource, /function countReportDeckChartLabelCollisions/);
  assert.match(runtimeSource, /existing\.text === candidate\.text/);
  assert.match(runtimeSource, /baseLabelY: y - 11/);
  assert.match(runtimeSource, /function alignReportDeckSameValueLabels/);
  assert.match(runtimeSource, /function sortReportDeckChartLabelsByValue/);
  assert.match(runtimeSource, /: \[0, 16, 26, 36, 46\];/);
  assert.match(runtimeSource, /options\.offsets/);
  assert.match(runtimeSource, /sortReportDeckChartLabelsByValue\(labelItems\)\.forEach/);
  assert.match(runtimeSource, /placedByInputOrder\.set\(index, chosen\);/);
  assert.match(runtimeSource, /value,\s*baseLabelY: y - 11/);
  assert.match(runtimeSource, /function renderReportDeckChartDualColorValueLabel/);
  assert.match(runtimeSource, /report-auto-chart-label-dual-outline/);
  assert.match(runtimeSource, /stroke-width="2\.6"/);
  assert.match(runtimeSource, /const labels = renderReportDeckChartValueLabels\(placedLabels\);/);
  assert.match(runtimeSource, /\$\{markers\}\s+\$\{labels\}\s+\$\{hitTargets\.join\(''\)\}/);
  assert.doesNotMatch(runtimeSource, /function buildReportDeckChartHighlightMarkerSvg/);
  assert.doesNotMatch(runtimeSource, /function buildReportDeckChartHighlightRingSvg/);
  assert.match(runtimeSource, /data-report-chart-highlight-point="true"/);
  assert.match(runtimeSource, /data-report-chart-highlight-selected="\$\{selectedValue\}"/);
  assert.match(runtimeSource, /function syncReportDeckChartHighlightPointStates/);
  assert.match(runtimeSource, /button\.textContent = active/);
  assert.match(runtimeSource, /function toggleReportDeckChartHighlightRange/);
  assert.match(runtimeSource, /function clearReportDeckChartHighlights/);
  assert.match(runtimeSource, /report-chart-highlight-range/);
  assert.match(runtimeSource, /is-range-start/);
  assert.match(
    runtimeSource,
    /if \(normalizedDelta === 0\) return (?:parts\.)?escapeReportDeckHtml\('\\uB3D9\\uC77C'\);/
  );
  assert.match(runtimeSource, /if \(total <= 6\) return \[3, total - 3\];\s*return \[4, total - 4\];/);
  assert.match(runtimeSource, /buildReportDeckProductionYieldAnalysis/);
  assert.match(runtimeSource, /const plotLeft = 34;/);
  assert.match(runtimeSource, /const plotBottom = 52;/);
});

test('report deck chart highlight click immediately marks the active point and button', () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext();

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.chartHighlightButton,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightButton.classList.contains('is-active'), true);
  assert.equal(deckDom.chartHighlightButton.textContent, '\uAC15\uC870\uC911');

  deckDom.listeners.click({
    target: deckDom.chartHighlightPoint,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-highlighted'), true);
  assert.equal(deckDom.chartHighlightPoint.attributes['data-report-chart-highlight-selected'], 'true');
  assert.equal(deckDom.chartHighlightButton.classList.contains('has-highlight'), true);
  assert.equal(deckDom.chartHighlightButton.textContent, '\uAC15\uC870\uC911 1');
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), true);

  deckDom.listeners.click({
    target: deckDom.chartHighlightResetButton,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-highlighted'), false);
  assert.equal(deckDom.chartHighlightPoint.attributes['data-report-chart-highlight-selected'], 'false');
  assert.equal(deckDom.chartHighlightButton.classList.contains('has-highlight'), false);
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), false);
});

test('report deck chart range highlight selects a start point and stores a range', () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext();

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.chartHighlightRangeButton,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightRangeButton.classList.contains('is-active'), true);
  assert.equal(deckDom.chartHighlightRangeButton.textContent, '\u25A1');

  deckDom.listeners.click({
    target: deckDom.chartHighlightPoint,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-range-start'), true);

  deckDom.listeners.click({
    target: deckDom.chartHighlightSecondPoint,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-range-start'), false);
  assert.equal(deckDom.chartHighlightRangeButton.classList.contains('has-highlight'), true);
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), true);
});
