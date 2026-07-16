import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const dataSectionSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/sections/KPI.sections.data.js'),
  'utf8'
);
const equipmentHistoryStyleSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.css'),
  'utf8'
);
const EXPECTED_DATA_CATEGORY_TITLES = ['유틸리티', '작업 이력', '설비 이력', '조도'];

function getDataCategories(currentUser = null) {
  let registeredFactory = null;
  const window = {
    __KPI_SERVER_RUNTIME_CONFIG__: currentUser ? { auth: { currentUser } } : {},
    KpiSectionFactoryAdapter: {
      registerFactory(sectionId, factory) {
        if (sectionId === 'data') registeredFactory = factory;
      },
    },
  };
  const parts = new Proxy(Object.create(null), {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      return key === 'buildUtilityEntryExperimentViews' ? () => [] : () => '';
    },
  });
  const context = {
    window,
    KpiSectionFactoryAdapter: window.KpiSectionFactoryAdapter,
    Symbol,
    Object,
    String,
    Array,
  };
  context[Symbol.for('kpi.utilityEntryExperiment.parts')] = parts;
  vm.createContext(context);
  vm.runInContext(dataSectionSource, context, { filename: 'KPI.sections.data.js' });

  assert.equal(typeof registeredFactory, 'function');
  return registeredFactory().categories;
}

test('equipment history is the single authoritative category for every user', () => {
  const userCases = [
    null,
    { username: 'Daniel', displayName: 'Daniel' },
    { username: 'operator', displayName: '일반 사용자' },
  ];

  userCases.forEach((currentUser) => {
    const categories = getDataCategories(currentUser);
    const titles = Array.from(categories, (category) => category.title);
    const equipmentCategories = Array.from(categories).filter((category) => category.title === '설비 이력');
    const workHistoryIndex = titles.indexOf('작업 이력');
    const equipmentHistoryIndex = titles.indexOf('설비 이력');

    assert.deepEqual(titles, EXPECTED_DATA_CATEGORY_TITLES);
    assert.equal(equipmentCategories.length, 1);
    assert.equal(equipmentHistoryIndex, workHistoryIndex + 1);
    assert.equal(equipmentCategories[0].dataKey, 'data_equipment_history_card');
    assert.deepEqual(
      Object.keys(equipmentCategories[0]).filter((key) => /surface/i.test(key)),
      []
    );
  });
});

test('equipment history uses the shared Noto Sans KR typography without changing its density tokens', () => {
  assert.match(
    equipmentHistoryStyleSource,
    /\.equipment-history-skin\s*\{[^}]*font-family:\s*"Noto Sans KR",\s*system-ui,\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*sans-serif;/s
  );
  assert.doesNotMatch(
    equipmentHistoryStyleSource,
    /font-family:\s*Arial,\s*["']Malgun Gothic["'],\s*["']Noto Sans KR["']/
  );
  assert.match(equipmentHistoryStyleSource, /--equipment-history-team-gap:\s*var\(--equipment-history-space-8\);/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-team-4:\s*var\(--kpi-team-4,\s*rgb\(220 38 38\)\);/);
  assert.match(
    equipmentHistoryStyleSource,
    /\[data-equipment-board-team="work_team_calendar_team4"\]\s*\{\s*--equipment-history-team-accent:\s*var\(--equipment-history-team-4\);\s*\}/
  );
  assert.match(equipmentHistoryStyleSource, /--equipment-history-room-gap:\s*var\(--equipment-history-space-4\);/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-toolbar-control:\s*36px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-toolbar-label-size:\s*12px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-toolbar-value-size:\s*14px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-toolbar-control-size:\s*13px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-toolbar-icon-size:\s*13px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-fullscreen-icon-size:\s*17px;/);
  assert.match(equipmentHistoryStyleSource, /--equipment-history-team-control:\s*28px;/);
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-toolbar\s*\{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*\.85fr\)\s*minmax\(500px,\s*1\.15fr\)[\s\S]*min-height:\s*50px/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-toolbar \.data-equipment-index-controls\s*\{[\s\S]*minmax\(92px,\s*\.7fr\)[\s\S]*minmax\(156px,\s*1\.25fr\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-index-summary\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-toolbar \.data-equipment-fullscreen-toggle\s*\{[\s\S]*width:\s*var\(--equipment-history-toolbar-control\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-fullscreen-toggle-icon svg\s*\{[\s\S]*stroke:\s*currentColor[\s\S]*stroke-linejoin:\s*round/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-index-summary article \.data-equipment-index-summary-rate\s*\{[\s\S]*font-size:\s*var\(--equipment-history-toolbar-rate-size\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-index-summary-icon\s*\{[\s\S]*width:\s*var\(--equipment-history-toolbar-icon-size\)[\s\S]*height:\s*var\(--equipment-history-toolbar-icon-size\)[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent[\s\S]*font-size:\s*var\(--equipment-history-toolbar-icon-size\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /article\.is-running div > span[\s\S]*color:\s*var\(--equipment-history-running\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /article\.is-stop div > span[\s\S]*color:\s*var\(--equipment-history-stop\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /article\.is-check div > span[\s\S]*color:\s*var\(--equipment-history-check\)/
  );
  assert.doesNotMatch(equipmentHistoryStyleSource, /data-equipment-index-summary-marker/);
  assert.doesNotMatch(equipmentHistoryStyleSource, /\.data-equipment-index-status(?:\s|\{|,)/);
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-team-collapse-toggle,[\s\S]*\.data-equipment-board-team-edit-toggle\s*\{[\s\S]*width:\s*var\(--equipment-history-team-control\)/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-column\.is-collapsed\s*>\s*header\s*\{\s*margin-bottom:\s*0;/
  );
  assert.match(equipmentHistoryStyleSource, /\.data-equipment-board-team-content\[hidden\]\s*\{\s*display:\s*none;/);
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-column \.data-equipment-board-add-button\s*\{\s*display:\s*none;/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /\.data-equipment-board-column\.is-editing \.data-equipment-board-add-button\s*\{\s*display:\s*inline-flex;/
  );
  assert.match(equipmentHistoryStyleSource, /\.data-equipment-board-team-edit-toggle\[aria-pressed="true"\]/);
});
