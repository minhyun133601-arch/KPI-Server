import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

const readSource = (relativePath) => fs.readFile(path.join(repoRoot, relativePath), 'utf8');

const [
  graphSource,
  dataSectionSource,
  dailyMeterSource,
  quickControllerSource,
  modalCoreSource,
  modalDomSource,
  modalRenderSource,
  graphCssSource,
  monthlyMeterCssSource,
] = await Promise.all([
  readSource('data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.graph.js'),
  readSource('data-entry/runtime/data/sections/KPI.sections.data.js'),
  readSource('data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.daily-meter.js'),
  readSource('data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.quick-controller.js'),
  readSource('utility/runtime/util/report/sheet/modal/shell/core.js'),
  readSource('utility/runtime/util/report/sheet/modal/shell/modal-dom.js'),
  readSource('utility/runtime/util/report/sheet/modal/render.js'),
  readSource('kpi-runtime/app/styles/data/data/04-utility-entry-graph-responsive.css'),
  readSource('kpi-runtime/app/styles/metering/metering/03-monthly-utility-meter-sheet.css'),
]);

test('monthly utility meter graph renders into the existing report modal and can return to the meter sheet', () => {
  assert.match(graphSource, /function renderUtilityEntryExperimentGraphTemplateByKey\(/);
  assert.match(dataSectionSource, /renderGraphTemplate\(target = null, graphKey = '', monthValue = ''\)/);
  assert.match(modalCoreSource, /api\.renderGraphTemplate\(/);
  assert.match(modalCoreSource, /modal\.dataset\.utilityEntryExperimentView = 'graph'/);
  assert.match(modalCoreSource, /function restoreUtilityEntryMeterView\(/);
  assert.match(modalCoreSource, /isUtilityEntryEmbeddedGraphMeterLink\(modal\)/);
  assert.match(modalCoreSource, /syncUtilityEntryGraphSupplementaryWindows\(modal\)/);
  assert.match(modalCoreSource, /toggleUtilityEntryGraphFullscreenFromMeterModal/);
  assert.match(modalCoreSource, /exitUtilityEntryGraphFullscreenFromMeterModal/);
  assert.match(modalCoreSource, /api\?\.syncGraphFullscreenState\?\.\(modal\)/);
  assert.doesNotMatch(modalCoreSource, /api\.openGraphTemplate\(/);
  assert.match(modalDomSource, /data-role="util-sheet-meter-view-select"/);
  assert.match(modalDomSource, /data-role="util-sheet-graph-view-select"/);
  assert.doesNotMatch(modalDomSource, /data-role="util-sheet-modal-type-select" data-util-sheet-gas-view-toggle/);
  assert.match(modalDomSource, /data-role="util-sheet-graph-memo-overview"/);
  assert.match(modalDomSource, /captureUtilityEntryGraphPdfFromMeterModal/);
  assert.match(
    modalDomSource,
    /data-role="util-sheet-report-expand"[\s\S]*toggleUtilityEntryGraphFullscreenFromMeterModal\(modal\)/
  );
  assert.match(modalDomSource, /await Promise\.resolve\(fullscreenExit\)/);
  assert.match(monthlyMeterCssSource, /\.is-utility-entry-graph-view \.util-sheet-report-card/);
  assert.match(monthlyMeterCssSource, /\.util-sheet-embedded-graph/);
  assert.match(monthlyMeterCssSource, /\.is-utility-entry-graph-view:is\(:fullscreen, \.is-browser-fullscreen\)/);
  assert.match(monthlyMeterCssSource, /width: 100vw;[\s\S]*height: 100dvh;/);
  assert.match(graphSource, /function exitUtilityEntryExperimentGraphFullscreen\(/);
  assert.match(graphSource, /target\.requestFullscreen \|\| target\.webkitRequestFullscreen/);
  assert.match(graphSource, /modal\.addEventListener\('keydown', event => \{/);
  assert.match(graphSource, /event\?\.key !== 'Escape' \|\| event\.defaultPrevented/);
  assert.match(modalDomSource, /event\?\.key !== 'Escape' \|\| event\.defaultPrevented/);
  assert.match(dataSectionSource, /syncGraphFullscreenState\(modal = null\)/);
  assert.match(dailyMeterSource, /UTILITY_ENTRY_EXPERIMENT_EMBEDDED_GRAPH_METER_LINK_KEYS/);
  assert.match(modalRenderSource, /\['electric_yusan', 'gas_yusan_lng', 'gas_yusan_lpg'\]\.includes\(utilityEntryMeterLinkKey\)/);
});

test('Bukjeong direct graph keeps its direct route but uses the same flat 28px control scale', () => {
  assert.match(
    quickControllerSource,
    /titleGraphKey[\s\S]*openUtilityEntryExperimentGraphTemplateByKey\(\s*titleGraphKey/
  );
  assert.match(dailyMeterSource, /if \(!UTILITY_ENTRY_EXPERIMENT_EMBEDDED_GRAPH_METER_LINK_KEYS\.includes\(normalizedKey\)\) \{\s*return \[\];/);
  assert.match(graphSource, /class="work-btn utility-entry-experiment-graph-modal-pdf is-label"/);
  assert.match(graphSource, /class="util-sheet-report-icon-btn utility-entry-experiment-graph-modal-fullscreen"/);
  assert.match(graphSource, /class="util-sheet-report-icon-btn is-close"/);
  assert.match(
    graphCssSource,
    /\.utility-entry-experiment-graph-modal-head button \{[\s\S]*width: 28px;[\s\S]*height: 28px;/
  );
  assert.match(graphCssSource, /button\.is-label \{[\s\S]*padding: 0 8px;/);
});
