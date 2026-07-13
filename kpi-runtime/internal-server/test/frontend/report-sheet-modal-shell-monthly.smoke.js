import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModalShellContext,
  createTarget,
} from './support/report-sheet-modal-shell.harness.js';

test('report sheet modal shell monthly report opens first and extracts selected meter datasets', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;
  const config = context.KPIUtilReportSheetConfig;

  const monthOptions = [
    { value: '2026-03', label: '2026.03' },
    { value: '2026-04', label: '2026.04' },
    { value: '2026-05', label: '2026.05' },
  ];
  const makeAnalysisModel = (datasetKey, range) => ({
    hasData: true,
    datasetKey,
    categoryOption: { key: 'yusan', label: 'yusan', selectLabel: 'yusan' },
    teamOption: { key: 'combined', label: 'combined', selectLabel: 'combined' },
    siteOption: { key: 'all', label: 'all', selectLabel: 'all' },
    range,
    rangeLabel: `${range.from} ~ ${range.to}`,
    monthOptions,
    summaryItems: [],
    charts: [],
    combinedChart: { key: 'combined', title: 'Combined', controlItems: [], series: [] },
    ratioCombinedChart: { key: 'ratio-combined', title: 'Ratio', controlItems: [], series: [] },
  });
  const renderCalls = [];
  const datasetResultCalls = [];

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const normalizedDatasetKey = String(datasetKey || '').trim();
      return normalizedDatasetKey === 'electric' || normalizedDatasetKey === 'waste'
        ? normalizedDatasetKey
        : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetDatasetResult(datasetKey, monthKey, sheetType) {
      datasetResultCalls.push({ datasetKey, monthKey, sheetType });
      assert.equal(sheetType, 'meter');
      return { monthOptions };
    },
    renderUtilSheetReportModal(modal) {
      const sheetType = modal.dataset.sheetType;
      const datasetKey = modal.dataset.datasetKey;
      const state = config.UtilSheetAnalysisState[datasetKey] || {};
      renderCalls.push({
        sheetType,
        datasetKey,
        monthKey: modal.dataset.monthKey,
        from: state.from,
        to: state.to,
      });
      config.UtilSheetReportState[sheetType] = datasetKey;
      config.UtilSheetReportMonthState[sheetType] = modal.dataset.monthKey;
      config.UtilSheetCompareState[sheetType] = modal.dataset.compareKey;
      modal._utilSheetAnalysisModel = sheetType === 'analysis'
        ? makeAnalysisModel(datasetKey, { from: state.from, to: state.to })
        : null;
    },
    syncUtilSheetPanelSelection(sheetType, datasetKey) {
      renderCalls.push({ sheetType, datasetKey, panelSync: true });
    },
    buildUtilGasAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.gas;
      return makeAnalysisModel('gas', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilElectricAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.electric;
      return makeAnalysisModel('electric', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilWasteAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.waste;
      return makeAnalysisModel('waste', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilGasAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
    buildUtilElectricAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
    buildUtilWasteAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  const panel = {
    hidden: true,
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const fromSelect = { innerHTML: '', value: '', disabled: false };
  const toSelect = { innerHTML: '', value: '', disabled: false };
  const monthlyCheckboxes = ['gas', 'electric', 'waste'].map(datasetKey => ({
    dataset: { extractDatasetKey: datasetKey },
    checked: true,
  }));
  const monthlySheetTypeCheckboxes = [];

  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          return [];
        },
        querySelector() {
          return null;
        },
        get outerHTML() {
          const sheetType = modal.dataset.sheetType;
          const datasetKey = modal.dataset.datasetKey;
          const range = modal._utilSheetAnalysisModel?.range || {};
          return `
            <section class="util-sheet-report-card" data-card-sheet-type="${sheetType}" data-card-dataset-key="${datasetKey}">
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">
                ${sheetType === 'analysis'
                  ? `<div>ANALYSIS_CARD_${datasetKey}_${range.from}_${range.to}</div>`
                  : `<div>METER_CARD_${datasetKey}_${modal.dataset.monthKey}</div>`}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = {
    get textContent() {
      return `${modal.dataset.datasetKey}_${modal.dataset.sheetType}`;
    },
  };

  modal.querySelector = (selector) => ({
    '[data-role="util-sheet-monthly-extract-options"]': panel,
    '[data-role="util-sheet-monthly-extract-from"]': fromSelect,
    '[data-role="util-sheet-monthly-extract-to"]': toSelect,
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);
  modal.querySelectorAll = (selector) => (
    selector === '[data-role="util-sheet-monthly-extract-dataset"]'
      ? monthlyCheckboxes
      : selector === '[data-role="util-sheet-monthly-extract-sheet-type"]'
        ? monthlySheetTypeCheckboxes
      : []
  );

  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'waste';
  modal.dataset.monthKey = '2026-05';
  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.equal(modal.dataset.monthlyExtractDatasetKey, 'waste');
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);
  assert.deepEqual(monthlySheetTypeCheckboxes.map(checkbox => checkbox.checked), []);
  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');
  panel.hidden = true;
  modal.dataset.monthlyExtractOptionsOpen = 'false';

  assert.equal(modalShell.openUtilSheetMonthlyReportExtractOptions(), true);
  assert.equal(panel.hidden, true);
  assert.equal(modal.dataset.monthlyReportMode, 'true');
  assert.equal(modal.dataset.monthlyExtractStandalone, 'false');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-05');
  assert.equal(fromSelect.value, '2026-04');
  assert.equal(toSelect.value, '2026-05');
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);
  assert.deepEqual(monthlySheetTypeCheckboxes.map(checkbox => checkbox.checked), []);
  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.ok(datasetResultCalls.length > 0);
  assert.ok(datasetResultCalls.every(call => call.sheetType === 'meter'));

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-run"]': true,
    }),
  });
  assert.deepEqual(harness.clickedDownloads.map(item => item.download), [
    '\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D-2026-04-2026-05.html',
  ]);
  assert.deepEqual(harness.alertMessages, []);
  harness.clickedDownloads = [];
  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-cancel"]': true,
    }),
  });
  assert.equal(panel.hidden, true);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);

  monthlyCheckboxes[0].checked = false;
  monthlyCheckboxes[1].checked = true;
  monthlyCheckboxes[2].checked = false;
  modal.listeners.change({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-dataset"]': true,
    }, { extractDatasetKey: 'electric' }),
  });
  assert.equal(modal.dataset.monthlyExtractDatasets, 'electric');

  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');

  fromSelect.value = '2026-03';
  toSelect.value = '2026-05';
  modal.listeners.change({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-from"], [data-role="util-sheet-monthly-extract-to"]': true,
    }),
  });
  assert.equal(modal.dataset.monthlyExtractFrom, '2026-03');
  assert.equal(modal.dataset.monthlyExtractTo, '2026-05');

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-run"]': true,
    }),
  });

  assert.deepEqual(harness.clickedDownloads.map(item => item.download), [
    '\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D-2026-03-2026-05.html',
  ]);
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.equal(modal.dataset.monthlyExtractStandalone, 'false');
  const html = String(harness.blobParts[0] || '');
  assert.match(html, /<title>\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D<\/title>/);
  assert.match(html, /<div class="util-sheet-monthly-title">\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D<\/div>/);
  assert.match(html, /util-sheet-monthly-dataset-tab/);
  assert.match(html, /METER_CARD_electric_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_CARD_electric_2026-03_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_electric_2026-03_2026-05/);
  assert.doesNotMatch(html, /METER_CARD_gas_2026-05/);
  assert.doesNotMatch(html, /METER_CARD_waste_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_gas_2026-03_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_waste_2026-03_2026-05/);
  assert.deepEqual(harness.alertMessages, []);
});
