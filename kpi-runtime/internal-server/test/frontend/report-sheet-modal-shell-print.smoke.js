import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModalShellContext,
  createTarget,
} from './support/report-sheet-modal-shell.harness.js';

test('report sheet modal shell extraction renders electric meter output statically', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  const comparisonCalls = [];
  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilElectricMeterViewKey(viewKey) {
      const normalized = String(viewKey || '').trim();
      return normalized === 'allocation' || normalized === 'team' ? normalized : 'meter';
    },
    buildUtilElectricMeterComparisonModel(monthKey, compareKey, teamKey) {
      return { ready: true, monthKey, compareKey, teamKey };
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return { option: { key: teamKey, label: 'COMBINED_TEAM' }, latestRow: { monthKey } };
    },
    buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult, viewKey) {
      comparisonCalls.push({ model, teamDatasetResult, viewKey });
      return `
        <section class="util-sheet-section" data-rendered-electric-view="${viewKey}">
          <div class="util-sheet-section-head">
            <div class="util-sheet-segment" data-role="util-sheet-meter-electric-view-toggle">
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="meter">METER_VIEW</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="allocation">ALLOCATION_VIEW</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="team">TEAM_VIEW</button>
            </div>
          </div>
          <div class="util-sheet-meter-table-stack">ELECTRIC_${viewKey.toUpperCase()}_VIEW</div>
        </section>
      `;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-02';
  modal.dataset.compareKey = 'year';
  modal.dataset.electricMeterTeamKey = 'combined';
  modal.dataset.electricMeterViewKey = 'team';

  const body = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.util-sheet-section.is-hero') {
        return { outerHTML: '<section class="util-sheet-section is-hero">ELECTRIC_HERO</section>' };
      }
      if (selector === '.util-sheet-memo-section') {
        return { outerHTML: '<section class="util-sheet-section util-sheet-memo-section">ELECTRIC_MEMO</section>' };
      }
      return null;
    },
  };
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      body.innerHTML = '<section class="util-sheet-section is-hero">OLD_HERO</section><section>OLD_VIEW</section>';
      let removedReportHead = false;
      let removedSectionHead = false;
      return {
        querySelector(selector) {
          return selector === '[data-role="util-sheet-report-body"]' ? body : null;
        },
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          const removals = [];
          if (selector.includes('.util-sheet-report-head')) {
            removals.push({
              remove() {
                removedReportHead = true;
              },
            });
          }
          if (selector.includes('.util-sheet-section-head')) {
            removals.push({
              remove() {
                removedSectionHead = true;
              },
            });
          }
          return removals;
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              ${removedReportHead ? '' : '<div class="util-sheet-report-head">ELECTRIC_HEADER</div>'}
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">
                ${removedSectionHead ? body.innerHTML.replace(/<div class="util-sheet-section-head">[\s\S]*?<\/div>/, '') : body.innerHTML}
              </div>
              <button data-role="util-sheet-report-print">EXTRACT</button>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'ELECTRIC_METER_REPORT' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  const extractButton = createTarget({
    '[data-role="util-sheet-report-print"]': true,
  });
  modal.listeners.click({ target: extractButton });

  assert.deepEqual(harness.clickedDownloads, []);
  assert.equal(harness.popupOpenCount, 2);
  assert.equal(harness.popupCloseCount, 2);
  assert.equal(harness.popupPrintCount, 1);
  assert.deepEqual(harness.timeoutCalls, [900]);
  assert.deepEqual(comparisonCalls, [{
    model: { ready: true, monthKey: '2026-02', compareKey: 'year', teamKey: 'combined' },
    teamDatasetResult: { option: { key: 'combined', label: 'COMBINED_TEAM' }, latestRow: { monthKey: '2026-02' } },
    viewKey: 'meter',
  }]);

  const html = harness.openedHtml;
  assert.match(html, /<body class="is-electric-meter-print">/);
  assert.match(html, /util-sheet-meter-extract-page is-electric-meter-print/);
  assert.match(html, /@page \{ size: A4; margin: 0; \}/);
  assert.match(html, /\.util-sheet-meter-extract-page\.is-electric-meter-print/);
  assert.match(html, /width:\s*100vw;/);
  assert.match(html, /data-electric-print-fit-root="true"/);
  assert.match(html, /data-electric-print-fit-body="true"/);
  assert.match(html, /utilSheetElectricMeterPrintFit/);
  assert.match(html, /landscapeWidth:\s*297/);
  assert.match(html, /landscapeHeight:\s*210/);
  assert.match(html, /portraitWidth:\s*210/);
  assert.match(html, /portraitHeight:\s*297/);
  assert.match(html, /--util-electric-print-row-pad-y/);
  assert.match(html, /--util-electric-print-number-font-size:\s*4\.35pt/);
  assert.match(html, /--util-electric-print-number-pad-x:\s*0\.34mm/);
  assert.match(html, /numberFontMin:\s*3\.2/);
  assert.match(html, /function fitNumberFont/);
  assert.match(html, /gap:\s*var\(--util-electric-print-card-gap,\s*2mm\) !important/);
  assert.match(html, /font-size:\s*5\.2pt !important/);
  assert.match(html, /font-size:\s*var\(--util-electric-print-number-font-size,\s*4\.35pt\) !important/);
  assert.match(html, /text-align:\s*center !important/);
  assert.match(html, /justify-content:\s*center !important/);
  assert.match(html, /white-space:\s*nowrap !important/);
  assert.match(html, /font-variant-numeric:\s*tabular-nums !important/);
  assert.match(html, /util-sheet-meter-row-label-unit/);
  assert.doesNotMatch(html, /height:\s*202mm/);
  assert.doesNotMatch(html, /scale\(/);
  assert.doesNotMatch(html, /ELECTRIC_METER_REPORT/);
  assert.doesNotMatch(html, /ELECTRIC_HEADER/);
  assert.doesNotMatch(html, /<[^>]+class="util-sheet-section-head"/);
  assert.doesNotMatch(html, /utilSheetElectricMeterExtractRuntime/);
  assert.doesNotMatch(html, /data-role="util-sheet-electric-extract-views"/);
  assert.match(html, /data-rendered-electric-view="meter"/);
  assert.doesNotMatch(html, /OLD_HERO/);
  assert.doesNotMatch(html, /OLD_VIEW/);
  assert.match(html, /ELECTRIC_METER_VIEW/);
  assert.doesNotMatch(html, /ELECTRIC_ALLOCATION_VIEW/);
  assert.doesNotMatch(html, /ELECTRIC_TEAM_VIEW/);
  assert.doesNotMatch(html, /data-role="util-sheet-report-template-section"/);
  assert.doesNotMatch(html, /util-sheet-blank-template-table/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell preopens electric pdf popup before async data preparation', async () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  let resolvePrepare;
  let prepareCount = 0;
  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    hasUtilElectricMeteringStore() {
      return false;
    },
    ensureUtilElectricMeteringStore() {
      prepareCount += 1;
      return new Promise(resolve => {
        resolvePrepare = resolve;
      });
    },
    buildUtilElectricMeterComparisonModel(monthKey, compareKey, teamKey) {
      return { ready: true, monthKey, compareKey, teamKey };
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return { option: { key: teamKey, label: 'COMBINED_TEAM' }, latestRow: { monthKey } };
    },
    buildUtilElectricMeterComparisonSectionHtml() {
      return `
        <section class="util-sheet-section" data-rendered-electric-view="meter">
          <div class="util-sheet-meter-table-stack">ELECTRIC_READY_VIEW</div>
        </section>
      `;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-05';
  modal.dataset.compareKey = 'month';
  modal.dataset.electricMeterTeamKey = 'combined';

  const body = { innerHTML: '' };
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      return {
        querySelector(selector) {
          return selector === '[data-role="util-sheet-report-body"]' ? body : null;
        },
        querySelectorAll() {
          return [];
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">${body.innerHTML}</div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'ELECTRIC_METER_REPORT' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.equal(prepareCount, 1);
  assert.equal(harness.openWindowCalls.length, 1);
  assert.equal(harness.popupOpenCount, 1);
  assert.equal(harness.popupCloseCount, 1);
  assert.equal(harness.popupPrintCount, 0);
  assert.match(harness.openedHtml, /PDF/);

  resolvePrepare(true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(harness.openWindowCalls.length, 1);
  assert.equal(harness.popupOpenCount, 2);
  assert.equal(harness.popupCloseCount, 2);
  assert.equal(harness.popupPrintCount, 1);
  assert.deepEqual(harness.timeoutCalls, [900]);
  assert.match(harness.openedHtml, /ELECTRIC_READY_VIEW/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell print exposes meter extraction for stale analysis state', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'analysis';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-05';

  const panel = {
    hidden: true,
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const meterCheckbox = {
    checked: false,
    dataset: { extractSheetType: 'meter' },
  };

  modal.querySelector = (selector) => ({
    '[data-role="util-sheet-extract-options"]': panel,
  }[selector] || null);
  modal.querySelectorAll = (selector) => (
    selector === '[data-role="util-sheet-extract-option"]'
      ? [meterCheckbox]
      : []
  );

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.equal(panel.hidden, false);
  assert.equal(meterCheckbox.checked, true);
  assert.deepEqual(harness.clickedDownloads, []);
  assert.deepEqual(harness.alertMessages, []);
});
