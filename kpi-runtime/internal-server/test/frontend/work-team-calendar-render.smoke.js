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
const teamCalendarSource = teamCalendarSources.find(
  (entry) => entry.filename === 'KPI.work.team-calendar.js'
)?.source || '';
const teamCalendarRenderSource = teamCalendarSources.find(
  (entry) => entry.filename === 'KPI.work.team-calendar.render.js'
)?.source || '';
const teamCalendarDraftActionsSource = teamCalendarSources.find(
  (entry) => entry.filename === 'KPI.work.team-calendar.draft-actions.js'
)?.source || '';

function overrideBinding(context, name, value) {
  const overrideKey = `__override_${name}`;
  context[overrideKey] = value;
  vm.runInContext(`${name} = globalThis.${overrideKey};`, context);
}

function createModalElement() {
  return {
    innerHTML: '',
    classList: {
      add() {},
      remove() {},
      contains() {
        return true;
      },
      toggle() {},
    },
    querySelector() {
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
  const productionSummaryMap =
    options.productionSummaryMap
    || new Map([[selectedDateKey, { count: 0, totalAmount: 0, isOffday: false }]]);
  const historySummaryMap =
    options.historySummaryMap
    || new Map([[selectedDateKey, { count: 0, kpiCount: 0 }]]);
  const utilitySummary = {
    electric: { usageText: '120 kWh', costText: '10000', canSelect: false, mode: 'all' },
    gas: { usageText: '55 Nm3', costText: '20000', canSelect: false, mode: 'all' },
    waste: { usageText: '8 t', costText: '5000' },
    production: { totalAmountText: '320kg', itemCountText: '3 items' },
    workEntryCountText: '2 items',
    workCostText: '30000',
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
    AppData: {
      work: {
        categories: [
          {
            dataKey: 'overview',
            view: 'team_calendar',
            title: 'Overview',
            processLabel: 'Overview Process',
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
            maintenanceHistory: [
              { date: '2026.04.18', type: '정비', content: 'Legacy team check', worker: 'Beta' },
            ],
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
      monthFilters: {},
      activeMonth: {},
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
  overrideBinding(context, 'getWorkTeamCalendarSelectedDateKeys', () => [selectedDateKey]);
  overrideBinding(context, 'getWorkTeamCalendarPrimarySelectedDate', () => selectedDateKey);
  overrideBinding(context, 'isWorkTeamCalendarDateLocked', () => false);
  overrideBinding(context, 'isWorkTeamCalendarOverview', () => true);
  overrideBinding(context, 'getWorkTeamCalendarUtilityPopupMetric', (dataKey = 'overview') => (
    context.WorkState.teamCalendarUtilityPopup?.[dataKey] || ''
  ));
  overrideBinding(context, 'getWorkTeamCalendarEditorState', () => editorState);
  overrideBinding(context, 'getWorkTeamCalendarDraftForDates', () => ({
    title: '',
    note: '',
    remark: '',
    members: [],
    attachments: [],
  }));
  overrideBinding(context, 'getWorkTeamCalendarHistoryRecordsForDates', () => []);
  overrideBinding(context, 'renderWorkTeamCalendarReadonlyEntriesHtml', () => '');
  overrideBinding(context, 'getWorkTeamCalendarMemberCountLabel', () => '0');
  overrideBinding(context, 'renderWorkTeamCalendarSelectedMembersHtml', () => '');
  overrideBinding(context, 'renderWorkTeamCalendarAttachmentListHtml', () => '');
  overrideBinding(context, 'buildWorkTeamCalendarEntryTitle', () => '');
  overrideBinding(context, 'getWorkTeamCalendarAttachmentPreviewLabel', () => '');
  overrideBinding(context, 'getMonthMatrix', () => [new Date(`${selectedDateKey}T00:00:00Z`)]);
  overrideBinding(context, 'getWorkTeamCalendarProductionSummaryMap', () => productionSummaryMap);
  overrideBinding(context, 'getWorkTeamCalendarHistorySummaryMap', () => historySummaryMap);
  overrideBinding(context, 'getWorkTeamCalendarProductionGroups', () => []);
  overrideBinding(
    context,
    'renderWorkTeamCalendarProductionTeamGroupsHtml',
    () => '<div class="groups">overview</div>'
  );
  overrideBinding(context, 'renderWorkTeamCalendarProductionGroupsHtml', () => '<div class="groups">detail</div>');
  overrideBinding(context, 'summarizeWorkTeamCalendarProductionMetrics', () => ({ totalAmount: 0 }));
  overrideBinding(context, 'getWorkTeamCalendarProductionMetricLine', () => '');
  overrideBinding(context, 'getWorkTeamCalendarSelectionLabel', () => '2026.04.15');
  overrideBinding(context, 'getWorkTeamCalendarRangeLabel', () => '26.04 ~ 26.04');
  overrideBinding(context, 'formatUtilNumber', (value, digits = 0) => Number(value || 0).toFixed(digits));
  overrideBinding(context, 'isWorkTeamCalendarInlineMode', () => false);
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
  overrideBinding(context, 'renderWorkTeamCalendarGroupedHistoryHtml', () => '');
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
  assert.match(modal.innerHTML, /work-team-calendar-grid/);
  assert.match(modal.innerHTML, /data-work-save-status="overview"/);
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
});

test('work team calendar offday cells keep production and history cues in the flag slot', () => {
  const { context, modal } = createContext({
    productionSummaryMap: new Map([['2026-04-15', { count: 2, totalAmount: 18, isOffday: true }]]),
    historySummaryMap: new Map([['2026-04-15', { count: 3, kpiCount: 2 }]]),
  });

  context.renderWorkTeamCalendarModal();

  assert.match(modal.innerHTML, /휴무/);
  assert.match(modal.innerHTML, /오늘/);
  assert.match(modal.innerHTML, /KPI 2/);
  assert.match(modal.innerHTML, /18kg/);
  assert.match(modal.innerHTML, /3건/);
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
  assert.equal(adapter.setWindowTimeout(() => {}, 30000), 1);
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
  assert.match(combinedTeamCalendarSource, /confirmWorkTeamCalendarSave\(dataKey, data, 'work_team_calendar_attachment_save_failed'\)/);
  assert.match(combinedTeamCalendarSource, /cleanupWorkTeamCalendarUploadedAttachments\(uploadedAttachments, folderHandle, dataKey\)/);
  assert.match(combinedTeamCalendarSource, /confirmWorkTeamCalendarSave\(dataKey, data, 'work_team_calendar_delete_save_failed'\)/);
  assert.match(combinedTeamCalendarSource, /첨부 기록에서는 제거했지만 파일 삭제는 실패했습니다/);
});
