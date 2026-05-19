import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const maintenanceDeleteSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.delete.js', import.meta.url),
  'utf8'
);
const maintenanceExportSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.export.js', import.meta.url),
  'utf8'
);

test('production maintenance delete is pinned to production while export keeps all metric toggles', () => {
  assert.doesNotMatch(
    maintenanceDeleteSource,
    /buildUtilMetricToggleButtonsHtml\(\['all'\], 'delete-item-toggle'\)/
  );
  assert.match(maintenanceDeleteSource, /class="util-production-toggle-btn is-active" aria-pressed="true" disabled>/);
  assert.match(maintenanceDeleteSource, /const selectedItemKeys = \['production'\];/);
  assert.match(maintenanceDeleteSource, /const metricKeys = \['production'\];/);
  assert.match(maintenanceDeleteSource, /function listUtilProductionYearMonths/);
  assert.match(maintenanceDeleteSource, /const datasetMonthOptions = listUtilProductionYearMonths\(\);/);
  assert.match(
    maintenanceExportSource,
    /buildUtilMetricToggleButtonsHtml\(\['all'\], 'export-item-toggle'\)/
  );
  assert.match(maintenanceExportSource, /isProductionOnlyExport/);
  assert.match(maintenanceExportSource, /listUtilProductionYearMonths\(\)/);
});
