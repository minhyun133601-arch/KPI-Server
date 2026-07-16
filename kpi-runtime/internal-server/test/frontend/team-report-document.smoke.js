import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/sections/KPI.section.factory-adapter.js'),
  'utf8'
);
const workSectionSource = await fs.readFile(
  path.join(repoRoot, 'team-report/runtime/work/sections/KPI.sections.work.js'),
  'utf8'
);
const sidebarCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/styles/shell/shell-chrome/02-sidebar-home.css'),
  'utf8'
);
const sidebarRuntimeCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/styles/shell/shell-chrome/01-shell-runtime.css'),
  'utf8'
);
const viewerSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/KPI.app.viewer.js'), 'utf8');
const documentCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/styles/work/team-report-document.css'),
  'utf8'
);

function buildWorkSection() {
  const context = {
    window: {},
    Object,
    String,
    Array,
  };
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.section.factory-adapter.js' });
  vm.runInContext(workSectionSource, context, { filename: 'KPI.sections.work.js' });
  return context.window.KpiSectionFactories.work();
}

test('team report document is the canonical work category for every user', () => {
  const section = buildWorkSection();
  const category = section.categories[0];
  const visibleCategories = section.categories.filter((item) => item.navHidden !== true);

  assert.equal(section.openDefaultCategoryOnMain, true);
  assert.equal(section.hideNavigationChevron, true);
  assert.equal(section.categories.length, 2);
  assert.equal(visibleCategories.length, 0);
  assert.equal(category.title, '팀별내역서');
  assert.equal(category.navHidden, true);
  assert.equal(category.view, 'team_calendar_document');
  assert.equal(category.dataKey, 'work_team_calendar_team1_part1');
  assert.equal(category.viewerMode, 'full-bleed');
  assert.equal(section.categories[1].view, 'history_tool');
  assert.equal(section.categories[1].navHidden, true);
  assert.equal(section.teamCategories.length, 6);
  assert.equal(
    section.teamCategories.some((item) => Object.hasOwn(item, 'view')),
    false
  );
  assert.equal(
    section.teamCategories.some((item) => Object.hasOwn(item, 'productVisual')),
    false
  );
  assert.equal(
    section.categories.some((item) => item.view === 'team_calendar'),
    false
  );
  assert.equal(
    section.categories.some((item) => /LAB/.test(item.title)),
    false
  );
  assert.equal(
    section.categories.some((item) => item.view === 'team_calendar_experiment'),
    false
  );
});

test('canonical navigation is global and document styles keep production management visible', () => {
  assert.match(sidebarRuntimeCssSource, /\.sidebar\s*\{[\s\S]*width:\s*248px;[\s\S]*padding:\s*10px 8px;/);
  assert.match(sidebarCssSource, /\.sidebar-group-toggle\s*\{[\s\S]*min-height:\s*42px;[\s\S]*border-radius:\s*6px;/);
  assert.match(
    sidebarCssSource,
    /\.sidebar-item\.sidebar-item-nested\s*\{[\s\S]*min-height:\s*36px;[\s\S]*border-radius:\s*4px;/
  );
  assert.doesNotMatch(sidebarCssSource, /is-team-report-document/);
  assert.doesNotMatch(viewerSource, /isTeamReportDocument|sidebar[^\n]*is-team-report-document/);
  assert.match(documentCssSource, /\.work-team-calendar-dialog\.is-team-report-document/);
  assert.match(documentCssSource, /\.work-team-calendar-document-nav\s*\{/);
  assert.match(documentCssSource, /\.work-team-calendar-document-actions\s*\{/);
  assert.match(documentCssSource, /\.work-team-calendar-mode-segments\s*\{/);
  assert.match(
    documentCssSource,
    /\.work-team-calendar-utility-chip\s*\{[\s\S]*font:\s*inherit;[\s\S]*grid-template-rows:\s*20px\s+repeat\(2,\s*max-content\);[\s\S]*grid-auto-rows:\s*max-content;[\s\S]*align-content:\s*start;/
  );
  assert.match(
    documentCssSource,
    /\.work-team-calendar-utility-chip\.has-gas-choices[\s\S]*>\s*\.work-team-calendar-utility-choices\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*7px;/
  );
  assert.match(documentCssSource, /\.work-team-calendar-production-action-toggle\s*\{[\s\S]*color:\s*#0f172a;/);
  assert.match(documentCssSource, /\.work-production-paste-modal\.is-team-report-document-ui/);
  assert.match(documentCssSource, /#util-selective-delete-modal\.is-team-report-delete-modal/);
  assert.match(documentCssSource, /\.util-selective-delete-controls\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,/);
});

test('canonical work section no longer contains the account experiment contract', () => {
  assert.doesNotMatch(workSectionSource, /teamReportDocumentUi/);
  assert.doesNotMatch(workSectionSource, /team_calendar_experiment/);
  assert.doesNotMatch(workSectionSource, /Daniel|LAB|실험 화면/);
});
