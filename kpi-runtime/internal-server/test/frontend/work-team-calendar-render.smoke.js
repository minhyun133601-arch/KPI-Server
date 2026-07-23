import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

async function findFile(startDir, basename) {
  const entries = await fs.readdir(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(fullPath, basename);
      if (nested) return nested;
      continue;
    }
    if (entry.name === basename) return fullPath;
  }
  return null;
}

const teamCalendarPath = await findFile(repoRoot, 'KPI.work.team-calendar.js');
assert.ok(teamCalendarPath, 'work team calendar source is missing');

const workDir = path.dirname(teamCalendarPath);
const teamCalendarSourcePaths = [
  path.join(workDir, 'KPI.work.browser-adapter.js'),
  path.join(workDir, 'KPI.work.production.js'),
  teamCalendarPath,
  path.join(workDir, 'KPI.work.team-calendar.selection.js'),
  path.join(workDir, 'KPI.work.team-calendar.draft-actions.js'),
  path.join(workDir, 'KPI.work.team-calendar.equipment-summary.js'),
  path.join(workDir, 'KPI.work.team-calendar.render.js'),
];

const teamCalendarSources = await Promise.all(
  teamCalendarSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);

const combinedTeamCalendarSource = teamCalendarSources.map((entry) => entry.source).join('\n');
const teamCalendarSource =
  teamCalendarSources.find((entry) => entry.filename === 'KPI.work.team-calendar.js')?.source || '';
const teamCalendarRenderSource =
  teamCalendarSources.find((entry) => entry.filename === 'KPI.work.team-calendar.render.js')?.source || '';
const teamCalendarDraftActionsSource =
  teamCalendarSources.find((entry) => entry.filename === 'KPI.work.team-calendar.draft-actions.js')?.source || '';
const workCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime', 'app', 'styles', 'work', 'work.css'),
  'utf8'
);

function overrideBinding(context, name, value) {
  const overrideKey = `__override_${name}`;
  context[overrideKey] = value;
  vm.runInContext(`${name} = globalThis.${overrideKey};`, context);
}

function createModalElement() {
  return {
    innerHTML: '',
    focusCalls: 0,
    classList: {
      add() {},
      remove() {},
      contains() {
        return true;
      },
      toggle() {},
    },
    querySelector(selector) {
      if (selector === '.work-team-calendar-editor.is-date-detail' && this.innerHTML.includes('is-date-detail')) {
        return {
          focus: () => {
            this.focusCalls += 1;
          },
        };
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    remove() {},
    parentElement: null,
  };
}

function createContext(options = {}) {
  const modal = createModalElement();
  const editorState = { open: false, dateKey: '', manual: false };
  const selectedDateKey = options.selectedDateKey || '2026-04-15';
  const selectedDateKeys = Array.isArray(options.selectedDateKeys) ? options.selectedDateKeys : [selectedDateKey];
  const productionSummaryMap =
    options.productionSummaryMap || new Map([[selectedDateKey, { count: 0, totalAmount: 0, isOffday: false }]]);
  const historySummaryMap = options.historySummaryMap || new Map([[selectedDateKey, { count: 0, kpiCount: 0 }]]);
  const isOverviewCalendar = options.isOverviewCalendar ?? true;
  const productionGroups = Array.isArray(options.productionGroups) ? options.productionGroups : [];
  const productionGroupsHtml = options.productionGroupsHtml || '<div class="groups">detail</div>';
  const overviewProductionGroupsHtml = options.overviewProductionGroupsHtml || '<div class="groups">overview</div>';
  const productionMetricLine = options.productionMetricLine || '';
  const selectedHistoryRecords = Array.isArray(options.selectedHistoryRecords) ? options.selectedHistoryRecords : [];
  const readonlyEntriesHtml = options.readonlyEntriesHtml || '';
  const defaultUtilitySummary = {
    electric: { usageText: '120 kWh', costText: '10000', canSelect: false, mode: 'all' },
    gas: { usageText: '55 Nm3', costText: '20000', canSelect: false, mode: 'all' },
    waste: { usageText: '8 t', costText: '5000' },
    production: { totalAmountText: '320kg', itemCountText: '3 items' },
    workEntryCountText: '2 items',
    workCostText: '30000',
  };
  const utilitySummaryOverrides = options.utilitySummary || {};
  const utilitySummary = {
    ...defaultUtilitySummary,
    ...utilitySummaryOverrides,
    electric: {
      ...defaultUtilitySummary.electric,
      ...(utilitySummaryOverrides.electric || {}),
    },
    gas: {
      ...defaultUtilitySummary.gas,
      ...(utilitySummaryOverrides.gas || {}),
    },
    production: {
      ...defaultUtilitySummary.production,
      ...(utilitySummaryOverrides.production || {}),
    },
  };
  const context = {
    console,
    openedWindows: [],
    timeoutCallbacks: 0,
    Date,
    JSON,
    Math,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    getWorkTeamCalendarMode() {
      return 'detail';
    },
    getWorkTeamCalendarModeMeta(mode = 'detail') {
      const labels = { detail: '팀별', process: '공정별', group: '공장별' };
      return { mode, label: labels[mode] || labels.detail };
    },
    AppData: {
      work: {
        categories: [
          {
            dataKey: 'overview',
            view: 'team_calendar_document',
            title: 'Team report',
          },
        ],
        teamCategories: [
          {
            dataKey: 'overview',
            title: 'Overview',
            processLabel: 'Overview Process',
            icon: 'fa-wrench',
            color: '#2563eb',
            secondaryColor: '#38bdf8',
            tint: '#eff6ff',
            emptyProductionLabel: 'No items',
          },
        ],
      },
    },
    PortalData: {
      data_equipment_history_card: {
        equipmentList: [
          {
            id: 'eq-mixer-1',
            equipmentCode: 'EQ-MIX-001',
            name: 'Mixer 1',
            team: '1팀 1파트',
            teamDataKey: 'work_team_calendar_team1_part1',
            process: 'Mixing',
            status: '운영중',
            rate: 82,
            lastCheck: '2026.04.10',
            nextCheck: '2026.05.10',
            maintenanceHistory: [
              { date: '2026.04.15', type: '정기점검', content: 'Belt check', worker: 'Alpha', note: 'OK' },
              { date: '2026.05.01', type: '수리', content: 'Out of selected month', worker: 'Beta' },
            ],
          },
          {
            id: 'eq-legacy-yusan',
            equipmentCode: 'EQ-WASTE-001',
            name: 'Waste Pump',
            team: '유산',
            process: 'Waste',
            status: '점검중',
            maintenanceHistory: [{ date: '2026.04.18', type: '정비', content: 'Legacy team check', worker: 'Beta' }],
          },
        ],
      },
    },
    WorkState: {
      teamCalendarModal: 'overview',
      teamCalendarUtilityPopup: { overview: '' },
      teamCalendarDate: {},
      teamCalendarSelectedDates: {},
      teamCalendarDatePicked: {},
      workEntryRootConnected: false,
    },
    WORK_TEAM_CALENDAR_RANGE: {
      start: '2026-04',
      end: '2026-04',
    },
    WORK_TEAM_CALENDAR_MEMBERS: ['Alpha', 'Beta'],
    WORK_DAY_LABELS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    window: null,
    document: {
      body: { style: {} },
      querySelectorAll() {
        return [];
      },
    },
    alert() {},
    open(url, target, features) {
      const opened = { url, target, features };
      this.openedWindows.push(opened);
      return opened;
    },
    setTimeout(callback) {
      this.timeoutCallbacks += 1;
      callback();
      return this.timeoutCallbacks;
    },
  };
  context.window = context;
  context.globalThis = context;
  context.KpiWorkHistory = {
    IMPORTANT_FLAG_LABEL: 'KPI',
    IMPORTANT_FLAG_PILL_LABEL: 'KPI',
  };
  vm.createContext(context);
  teamCalendarSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });

  overrideBinding(context, 'ensureWorkTeamCalendarModal', () => modal);
  overrideBinding(context, 'getWorkTeamCalendarActiveMonth', () => '2026-04');
  overrideBinding(context, 'getWorkTeamCalendarMonthOptions', () => ['2026-04']);
  overrideBinding(context, 'parseMonthKey', () => ({ year: 2026, monthIndex: 3 }));
  overrideBinding(context, 'formatDateKey', () => selectedDateKey);
  overrideBinding(context, 'getWorkTeamCalendarSelectedDate', () => selectedDateKey);
  overrideBinding(context, 'getWorkTeamCalendarSelectedDateKeys', () => selectedDateKeys);
  overrideBinding(context, 'getWorkTeamCalendarPrimarySelectedDate', () => selectedDateKey);
  overrideBinding(context, 'isWorkTeamCalendarDateLocked', () => false);
  overrideBinding(context, 'isWorkTeamCalendarOverview', () => isOverviewCalendar);
  overrideBinding(
    context,
    'getWorkTeamCalendarUtilityPopupMetric',
    (dataKey = 'overview') => context.WorkState.teamCalendarUtilityPopup?.[dataKey] || ''
  );
  overrideBinding(context, 'getWorkTeamCalendarEditorState', () => editorState);
  overrideBinding(context, 'getWorkTeamCalendarDraftForDates', () => ({
    title: '',
    note: '',
    remark: '',
    members: [],
    attachments: [],
  }));
  overrideBinding(context, 'getWorkTeamCalendarHistoryRecordsForDates', () => selectedHistoryRecords);
  overrideBinding(context, 'renderWorkTeamCalendarReadonlyEntriesHtml', () => readonlyEntriesHtml);
  overrideBinding(context, 'getWorkTeamCalendarMemberCountLabel', () => '0');
  overrideBinding(context, 'renderWorkTeamCalendarSelectedMembersHtml', () => '');
  overrideBinding(context, 'renderWorkTeamCalendarAttachmentListHtml', () => '');
  overrideBinding(context, 'buildWorkTeamCalendarEntryTitle', () => '');
  overrideBinding(context, 'getWorkTeamCalendarAttachmentPreviewLabel', () => '');
  overrideBinding(context, 'getMonthMatrix', () => [new Date(`${selectedDateKey}T00:00:00Z`)]);
  overrideBinding(context, 'getWorkTeamCalendarProductionSummaryMap', () => productionSummaryMap);
  overrideBinding(context, 'getWorkTeamCalendarHistorySummaryMap', () => historySummaryMap);
  overrideBinding(context, 'getWorkTeamCalendarProductionGroups', () => productionGroups);
  overrideBinding(context, 'renderWorkTeamCalendarProductionTeamGroupsHtml', () => overviewProductionGroupsHtml);
  overrideBinding(context, 'renderWorkTeamCalendarProductionGroupsHtml', () => productionGroupsHtml);
  overrideBinding(
    context,
    'summarizeWorkTeamCalendarProductionMetrics',
    () => options.productionOverallSummary || { totalAmount: 0 }
  );
  overrideBinding(context, 'getWorkTeamCalendarProductionMetricLine', () => productionMetricLine);
  overrideBinding(context, 'getWorkTeamCalendarSelectionLabel', () => options.selectionLabel || '2026.04.15');
  overrideBinding(context, 'getWorkTeamCalendarRangeLabel', () => '26.04 ~ 26.04');
  overrideBinding(context, 'formatUtilNumber', (value, digits = 0) => Number(value || 0).toFixed(digits));
  overrideBinding(context, 'isWorkTeamCalendarInlineMode', () => options.inlineMode === true);
  overrideBinding(context, 'isWorkTeamCalendarFullscreen', () => false);
  overrideBinding(context, 'getWorkTeamCalendarFullscreenLabel', () => 'Fullscreen');
  overrideBinding(context, 'escapeHtml', (value) => String(value ?? ''));
  overrideBinding(context, 'getWorkTeamCalendarFullscreenIconSvg', () => '<svg></svg>');
  overrideBinding(context, 'getWorkTeamCalendarUtilitySummary', () => utilitySummary);
  overrideBinding(context, 'buildWorkTeamCalendarOverviewUtilityBreakdown', () => ({
    monthLabel: '2026.04',
    electric: [],
    gas: [],
  }));
  overrideBinding(context, 'setWorkTeamCalendarSelectedDateKeys', () => {});
  overrideBinding(context, 'setWorkTeamCalendarExplicitDateSelection', () => {});
  overrideBinding(context, 'renderWorkTeamCalendarGroupedHistoryHtml', () => options.groupedHistoryHtml || '');
  overrideBinding(context, 'bindWorkTeamCalendarMemberPicker', () => {});
  overrideBinding(context, 'bindWorkTeamCalendarEditorOverlay', () => {});
  overrideBinding(context, 'refreshWorkTeamCalendarStorageStatus', () => {});
  overrideBinding(context, 'syncWorkTeamCalendarInlineIndex', () => {});
  overrideBinding(context, 'syncWorkTeamCalendarFullscreenUi', () => {});

  return { context, modal };
}

test('work team calendar overview modal renders after split files are loaded together', () => {
  const { context, modal } = createContext();

  assert.doesNotThrow(() => {
    context.renderWorkTeamCalendarModal();
  });
  assert.match(modal.innerHTML, /work-team-calendar-utility-strip/);
  assert.match(modal.innerHTML, /설비이력/);
  assert.doesNotMatch(modal.innerHTML, /클릭하여 작업내역 보기/);
  assert.doesNotMatch(modal.innerHTML, /클릭하여 설비 목록 보기/);
  assert.doesNotMatch(modal.innerHTML, /클릭하여 팀별 상세 보기|work-team-calendar-utility-hint/);
  assert.match(modal.innerHTML, /work-team-calendar-grid/);
  assert.match(modal.innerHTML, /data-work-save-status="overview"/);
});

test('work team calendar gas selector stays inside the three-row gas card', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    utilitySummary: {
      gas: {
        usageText: 'LNG 55 m³ · LPG 12 kg',
        canSelect: true,
        mode: 'all',
      },
    },
  });

  context.renderWorkTeamCalendarModal();

  assert.match(
    modal.innerHTML,
    /work-team-calendar-utility-chip has-gas-choices[\s\S]*가스 사용량[\s\S]*LNG 55 m³ · LPG 12 kg[\s\S]*비용 20000[\s\S]*work-team-calendar-utility-choices/
  );
  assert.match(modal.innerHTML, /setWorkTeamCalendarGasMode\('all'\)[\s\S]*>전체<\/button>/);
  assert.match(modal.innerHTML, /setWorkTeamCalendarGasMode\('lng'\)[\s\S]*>LNG<\/button>/);
  assert.match(modal.innerHTML, /setWorkTeamCalendarGasMode\('lpg'\)[\s\S]*>LPG<\/button>/);
});

test('canonical team report document renders compact controls on its inline surface', () => {
  const documentView = createContext({ inlineMode: true });
  documentView.context.renderWorkTeamCalendarModal();
  assert.match(documentView.modal.innerHTML, /is-team-report-document/);
  assert.match(documentView.modal.innerHTML, /work-team-calendar-document-nav/);
  assert.match(
    documentView.modal.innerHTML,
    /work-team-calendar-document-actions[\s\S]*onclick="toggleWorkTeamCalendarFullscreen\(\)"[\s\S]*data-action="work-team-calendar-toggle-fullscreen"/
  );
  assert.doesNotMatch(
    documentView.modal.innerHTML,
    /work-team-calendar-head|work-team-calendar-brand-title|work-team-calendar-brand-sub/
  );
  assert.match(documentView.modal.innerHTML, /work-team-calendar-mode-segments/);
  assert.match(documentView.modal.innerHTML, /data-work-team-mode="detail"/);
  assert.match(documentView.modal.innerHTML, /data-work-team-switch="overview"/);
  assert.match(documentView.modal.innerHTML, /class="fas fa-wrench"/);
  assert.match(documentView.modal.innerHTML, /aria-pressed="true"/);
  assert.match(documentView.modal.innerHTML, />팀별<\/button>/);
  assert.match(documentView.modal.innerHTML, />공정별<\/button>/);
  assert.match(documentView.modal.innerHTML, />공장별<\/button>/);
  assert.match(documentView.modal.innerHTML, /aria-label="생산량 관리"/);
  assert.match(
    documentView.modal.innerHTML,
    /has-production-actions[\s\S]*work-team-calendar-utility-head[\s\S]*work-team-calendar-utility-label">총 생산량<\/span>[\s\S]*work-team-calendar-utility-action-slot[\s\S]*work-team-calendar-utility-value[\s\S]*work-team-calendar-utility-meta/
  );
  assert.doesNotMatch(documentView.modal.innerHTML, /work-team-calendar-utility-label">총생산량<\/span>/);
  assert.doesNotMatch(
    documentView.modal.innerHTML,
    /work-team-calendar-utility-meta[^<]*<\/span>\s*<span class="work-team-calendar-utility-action-slot"/
  );
  assert.match(documentView.modal.innerHTML, /data-work-production-action="paste" data-work-production-kind="normal"/);
  assert.match(documentView.modal.innerHTML, /data-work-production-action="paste" data-work-production-kind="rework"/);
  assert.match(documentView.modal.innerHTML, /data-work-production-action="delete"/);
  assert.doesNotMatch(documentView.modal.innerHTML, /실험 화면|LAB/);
  assert.doesNotMatch(teamCalendarRenderSource, /teamReportDocumentMode|team_calendar(?:'|"|\s)/);
});

test('work team calendar total production chip opens monthly table popup', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    selectedDateKeys: [],
    productionGroups: [
      {
        dateKey: '2026-04-15',
        items: [
          {
            dateKey: '2026-04-15',
            teamName: '1팀 1파트',
            lineName: '라인A',
            productCode: 'A-001',
            productName: '테스트 품목',
            amount: 1234,
          },
        ],
      },
    ],
  });

  assert.equal(context.openWorkTeamCalendarUtilityPopup('production', { render: false }), true);
  context.renderWorkTeamCalendarModal();

  assert.match(
    modal.innerHTML,
    /role="button"[\s\S]*work-team-calendar-utility-chip is-button is-active[\s\S]*총 생산량/
  );
  assert.match(modal.innerHTML, /총 생산량[\s\S]*work-team-calendar-production-action-menu/);
  assert.doesNotMatch(modal.innerHTML, /클릭하여 표 보기/);
  assert.doesNotMatch(modal.innerHTML, /work-team-calendar-utility-chip-action/);
  assert.doesNotMatch(modal.innerHTML, /is-composite/);
  assert.match(modal.innerHTML, /work-team-calendar-production-table/);
  assert.match(modal.innerHTML, /날짜/);
  assert.match(modal.innerHTML, /품목이름/);
  assert.match(modal.innerHTML, /생산량/);
  assert.match(modal.innerHTML, /2026\.04\.15/);
  assert.match(modal.innerHTML, /테스트 품목/);
  assert.match(modal.innerHTML, /1234 kg/);
  assert.doesNotMatch(modal.innerHTML, /work-team-calendar-overlay-layer is-date-detail/);
});

test('work team calendar offday without work is not selectable', () => {
  const { context, modal } = createContext({
    selectedDateKeys: [],
    productionSummaryMap: new Map([['2026-04-15', { count: 0, totalAmount: 0, isOffday: true }]]),
    historySummaryMap: new Map([['2026-04-15', { count: 0, kpiCount: 0 }]]),
  });

  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /work-team-calendar-day[^"]*is-offday[^"]*"[^>]*disabled/);
  assert.doesNotMatch(modal.innerHTML, /data-work-team-date="2026-04-15"[^>]*onclick="workTeamCalendarSelectDate/);
});

test('work team calendar offday with work shows only work history in the date detail sheet', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    productionSummaryMap: new Map([['2026-04-15', { count: 0, totalAmount: 0, isOffday: true }]]),
    historySummaryMap: new Map([['2026-04-15', { count: 1, kpiCount: 0 }]]),
    selectedHistoryRecords: [{ title: '휴무일 점검', startDate: '2026-04-15' }],
    readonlyEntriesHtml: '<div class="work-team-calendar-history-simple">휴무일 점검</div>',
  });

  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /휴무일 점검/);
  assert.match(modal.innerHTML, /work-team-calendar-editor is-floating is-date-detail has-selection-clear/);
  assert.match(
    modal.innerHTML,
    /class="work-team-calendar-detail-close"[^>]*>닫기<\/button>/
  );
  assert.doesNotMatch(modal.innerHTML, /<div class="groups">detail<\/div>/);
  assert.doesNotMatch(modal.innerHTML, /work-team-calendar-production-empty is-offday/);
});

test('work team calendar detail keeps the text close control above work and production sections', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    productionSummaryMap: new Map([['2026-04-15', { count: 1, totalAmount: 1200, isOffday: false }]]),
    historySummaryMap: new Map([['2026-04-15', { count: 1, kpiCount: 0 }]]),
    selectedHistoryRecords: [{ title: 'History item', startDate: '2026-04-15' }],
    readonlyEntriesHtml: '<div class="work-history-order-marker">history</div>',
    productionGroupsHtml: '<div class="work-production-order-marker">production</div>',
    productionGroups: [{ dateKey: '2026-04-15', items: [{ productName: 'Test', amount: 1200 }] }],
    productionOverallSummary: { totalAmount: 1200 },
  });

  context.renderWorkTeamCalendarModal();

  const closeButtonIndex = modal.innerHTML.indexOf('work-team-calendar-detail-close');
  const historyIndex = modal.innerHTML.indexOf('work-history-order-marker');
  const productionIndex = modal.innerHTML.indexOf('work-production-order-marker');

  assert.ok(closeButtonIndex > -1);
  assert.ok(historyIndex > closeButtonIndex);
  assert.ok(productionIndex > historyIndex);
  assert.match(
    modal.innerHTML,
    /role="dialog" aria-modal="true" aria-labelledby="work-team-calendar-detail-title" tabindex="-1"/
  );
  assert.match(modal.innerHTML, /<h2 id="work-team-calendar-detail-title"[^>]*>04\.15 \(수\)<\/h2>/);
  assert.match(modal.innerHTML, /작업 1건/);
  assert.match(modal.innerHTML, /생산 1200kg/);
  assert.match(modal.innerHTML, /작업내역[\s\S]*생산내역/);
  assert.equal(modal.focusCalls, 1);
});

test('work team calendar empty date detail uses one unified empty state', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    productionSummaryMap: new Map([['2026-04-15', { count: 0, totalAmount: 0, isOffday: false }]]),
    historySummaryMap: new Map([['2026-04-15', { count: 0, kpiCount: 0 }]]),
  });

  context.renderWorkTeamCalendarModal();

  const emptyMessage = '등록된 작업·생산 자료가 없습니다.';
  assert.equal(modal.innerHTML.split(emptyMessage).length - 1, 1);
  assert.match(modal.innerHTML, /work-team-calendar-overlay-layer is-date-detail/);
  assert.match(modal.innerHTML, /work-team-calendar-detail-empty/);
  assert.doesNotMatch(modal.innerHTML, /work-team-calendar-detail-section/);
  assert.equal(modal.focusCalls, 1);
});

test('work team calendar batch detail keeps the compact anchor date and selected-day total', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    selectedDateKeys: ['2026-04-15', '2026-04-16'],
  });

  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /04\.15 \(수\) 외 1일/);
  assert.match(modal.innerHTML, /선택한 2일 합계/);
  assert.equal(modal.innerHTML.split('등록된 작업·생산 자료가 없습니다.').length - 1, 1);
});

test('work team calendar overview date detail renders grouped work history before production', () => {
  const { context, modal } = createContext({
    isOverviewCalendar: true,
    selectedHistoryRecords: [{ title: 'Overview history', startDate: '2026-04-15', _team: 'team1part1' }],
    groupedHistoryHtml: '<div class="overview-history-marker">overview history</div>',
    productionGroups: [{ dateKey: '2026-04-15', items: [{ productName: 'Overview product', amount: 500 }] }],
    productionGroupsHtml: '<div class="overview-production-marker">overview production</div>',
    overviewProductionGroupsHtml: '<div class="overview-production-marker">overview production</div>',
    productionOverallSummary: { totalAmount: 500 },
  });

  context.renderWorkTeamCalendarModal();

  const historyIndex = modal.innerHTML.indexOf('overview-history-marker');
  const productionIndex = modal.innerHTML.indexOf('overview-production-marker');
  assert.ok(historyIndex > -1);
  assert.ok(productionIndex > historyIndex);
  assert.doesNotMatch(modal.innerHTML, /등록된 작업·생산 자료가 없습니다/);
});

test('work team calendar equipment summary uses selected month maintenance rows', () => {
  const { context, modal } = createContext();

  const summary = context.getWorkTeamCalendarEquipmentSummary('overview', '2026-04');
  assert.equal(summary.equipmentCount, 2);
  assert.equal(summary.maintenanceCount, 2);
  assert.ok(summary.maintenanceItems.some((item) => item.equipmentName === 'Mixer 1'));
  const legacySummary = context.getWorkTeamCalendarEquipmentSummary('work_team_calendar_team4', '2026-04');
  assert.equal(legacySummary.equipmentCount, 1);
  assert.equal(legacySummary.equipmentItems[0].teamLabel, '공무환경팀');

  assert.equal(context.openWorkTeamCalendarUtilityPopup('equipment', { render: false }), true);
  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /Overview 설비이력/);
  assert.match(modal.innerHTML, /2026\.04 정비 2건/);
  assert.match(modal.innerHTML, /Mixer 1/);
  assert.match(modal.innerHTML, /Belt check/);
  assert.match(modal.innerHTML, /Waste Pump/);
  assert.match(modal.innerHTML, /Legacy team check/);
  assert.doesNotMatch(modal.innerHTML, /클릭하여 설비 목록 보기/);
});

test('work team calendar equipment summary renders duplicate equipment names with numbered labels', () => {
  const { context, modal } = createContext();
  context.PortalData.data_equipment_history_card.equipmentList.push({
    id: 'eq-mixer-2',
    equipmentCode: 'EQ-MIX-002',
    name: 'Mixer 1',
    teamDataKey: 'work_team_calendar_team1_part1',
    process: 'Mixing',
    status: '가동중',
    maintenanceHistory: [{ date: '2026.04.20', type: '정기점검', content: 'Duplicate name check', worker: 'Gamma' }],
  });

  const summary = context.getWorkTeamCalendarEquipmentSummary('overview', '2026-04');
  assert.equal(summary.equipmentCount, 3);
  assert.ok(summary.equipmentItems.some((item) => item.displayName === 'Mixer 1 #1'));
  assert.ok(summary.equipmentItems.some((item) => item.displayName === 'Mixer 1 #2'));
  assert.ok(summary.maintenanceItems.some((item) => item.equipmentName === 'Mixer 1 #1'));
  assert.ok(summary.maintenanceItems.some((item) => item.equipmentName === 'Mixer 1 #2'));

  assert.equal(context.openWorkTeamCalendarUtilityPopup('equipment', { render: false }), true);
  context.renderWorkTeamCalendarModal();
  assert.match(modal.innerHTML, /Mixer 1 #1/);
  assert.match(modal.innerHTML, /Mixer 1 #2/);
  assert.match(modal.innerHTML, /Duplicate name check/);
});

test('work team calendar single-date production popup renders the metric line once', () => {
  const metricLine = '수율 98.5% · CAPA 72,000 · 가동률 98.6% · 조업시간 48.0시간 · 가동시간 46.3시간';
  const { context, modal } = createContext({
    isOverviewCalendar: false,
    productionMetricLine: metricLine,
    productionGroups: [
      {
        dateKey: '2026-04-15',
        items: [{ productName: 'IN-CO SOPYO CREAMER', amount: 49000 }],
      },
    ],
    productionGroupsHtml: `<div class="work-team-calendar-production-summary">${metricLine}</div>`,
  });

  context.renderWorkTeamCalendarModal();

  const metricOccurrences = modal.innerHTML.split(metricLine).length - 1;
  assert.equal(metricOccurrences, 1);
  assert.doesNotMatch(modal.innerHTML, /data-work-team-member-count/);
  assert.doesNotMatch(modal.innerHTML, /<span class="work-team-calendar-field-label">생산량<\/span>/);
  assert.match(modal.innerHTML, /work-team-calendar-production-action-menu/);
  assert.match(modal.innerHTML, /data-work-production-action="paste"/);
  assert.doesNotMatch(modal.innerHTML, /data-work-production-action="entry"/);
  assert.match(modal.innerHTML, /data-work-production-action="delete"/);
  assert.doesNotMatch(modal.innerHTML, /data-work-production-action="export"/);
});

test('work team calendar offday cells keep production and history cues in the flag slot', () => {
  const { context, modal } = createContext({
    productionSummaryMap: new Map([['2026-04-15', { count: 2, totalAmount: 18, isOffday: true }]]),
    historySummaryMap: new Map([
      [
        '2026-04-15',
        {
          count: 3,
          kpiCount: 2,
          starCount: 3,
          items: [{ star: '★', subcategory: '자체 정비', title: 'Belt check' }],
          remainingCount: 2,
        },
      ],
    ]),
  });

  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /휴무/);
  assert.match(modal.innerHTML, /오늘/);
  assert.doesNotMatch(modal.innerHTML, /KPI 3/);
  assert.match(modal.innerHTML, /work-team-calendar-day[^"]*has-history[^"]*is-offday/);
  assert.match(modal.innerHTML, /work-team-calendar-day-history-item/);
  assert.match(modal.innerHTML, /자체 정비/);
  assert.doesNotMatch(modal.innerHTML, /Belt check/);
  assert.match(modal.innerHTML, /\+2건/);
  assert.match(modal.innerHTML, /18kg/);
  assert.match(workCssSource, /\.work-team-calendar-day\.is-offday\.has-history\s*\{/);
  assert.match(workCssSource, /\.work-team-calendar-day-history-item\s*\{[^}]*#eff6ff/s);
  assert.match(workCssSource, /\.work-team-calendar-day-history-category\s*\{[^}]*#1e3a8a/s);
});

test('work team calendar source does not keep stray equipUtilityChipHtml references', () => {
  assert.doesNotMatch(combinedTeamCalendarSource, /\bequipUtilityChipHtml\b/);
});

test('work team calendar render reads history globals through the browser adapter', () => {
  assert.doesNotMatch(teamCalendarRenderSource, /window\.KpiWorkHistory/);
});

test('work team calendar draft actions route popup and portal globals through the browser adapter', () => {
  const { context } = createContext();
  const adapter = context.KpiWorkBrowserAdapter;

  assert.doesNotMatch(teamCalendarDraftActionsSource, /window\./);
  assert.deepEqual(adapter.writePortalData('work_team_calendar_team1_part1', { ok: true }), { ok: true });
  assert.deepEqual(context.PortalData.work_team_calendar_team1_part1, { ok: true });
  assert.deepEqual(adapter.openWindow('/preview', '_blank', 'noopener'), {
    url: '/preview',
    target: '_blank',
    features: 'noopener',
  });
  assert.equal(
    adapter.setWindowTimeout(() => {}, 30000),
    1
  );
});

test('work team calendar modal bind flags route through the browser adapter', () => {
  const { context } = createContext();
  const adapter = context.KpiWorkBrowserAdapter;

  assert.doesNotMatch(teamCalendarSource, /window\./);
  assert.equal(adapter.setRootFlag('__workTeamCalendarEscBound', true), true);
  assert.equal(adapter.getRootFlag('__workTeamCalendarEscBound'), true);
});

test('work team calendar attachment actions confirm server save before destructive file cleanup', () => {
  assert.match(combinedTeamCalendarSource, /async function updateWorkTeamCalendarAttachments/);
  assert.match(
    combinedTeamCalendarSource,
    /confirmWorkTeamCalendarSave\(dataKey, data, 'work_team_calendar_attachment_save_failed'\)/
  );
  assert.match(
    combinedTeamCalendarSource,
    /cleanupWorkTeamCalendarUploadedAttachments\(uploadedAttachments, folderHandle, dataKey\)/
  );
  assert.match(
    combinedTeamCalendarSource,
    /confirmWorkTeamCalendarSave\(dataKey, data, 'work_team_calendar_delete_save_failed'\)/
  );
  assert.match(combinedTeamCalendarSource, /첨부 기록에서는 제거했지만 파일 삭제는 실패했습니다/);
});
