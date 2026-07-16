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
const appSharedSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/KPI.app.shared.js'), 'utf8');
const sidebarCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/styles/shell/shell-chrome/02-sidebar-home.css'),
  'utf8'
);
const experimentCssSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/styles/work/team-report-document-experiment.css'),
  'utf8'
);

function buildWorkSection(experimentEnabled) {
  const context = {
    window: {
      __KPI_SERVER_RUNTIME_CONFIG__: {
        experiments: {
          teamReportDocumentUi: experimentEnabled,
        },
      },
    },
    Object,
    String,
    Array,
  };
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.section.factory-adapter.js' });
  vm.runInContext(workSectionSource, context, { filename: 'KPI.sections.work.js' });
  return context.window.KpiSectionFactories.work();
}

function readAppExperimentGate(runtimeConfig) {
  const context = {
    KpiAppBrowserAdapter: {
      getRuntime() {
        return {
          getServerRuntimeConfig() {
            return runtimeConfig;
          },
        };
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(appSharedSource, context, { filename: 'KPI.app.shared.js' });
  return context.isTeamReportDocumentExperimentEnabled();
}

test('Daniel experiment adds a separate LAB category without changing the original team report', () => {
  const originalSection = buildWorkSection(false);
  const experimentSection = buildWorkSection(true);
  const originalCategory = originalSection.categories[0];
  const labCategory = experimentSection.categories.find((category) => category.view === 'team_calendar_experiment');

  assert.deepEqual(
    JSON.parse(JSON.stringify(experimentSection.categories[0])),
    JSON.parse(JSON.stringify(originalCategory))
  );
  assert.equal(
    originalSection.categories.some((category) => category.view === 'team_calendar_experiment'),
    false
  );
  assert.ok(labCategory);
  assert.equal(labCategory.title, '팀별내역서 LAB');
  assert.equal(labCategory.dataKey, originalCategory.dataKey);
  assert.equal(labCategory.viewerMode, 'full-bleed');
});

test('app experiment gate follows only the server-provided flag', () => {
  assert.equal(readAppExperimentGate({ experiments: { teamReportDocumentUi: true } }), true);
  assert.equal(readAppExperimentGate({ experiments: { teamReportDocumentUi: false } }), false);
  assert.equal(readAppExperimentGate({ auth: { currentUser: { username: 'Daniel' } } }), false);
  assert.equal(readAppExperimentGate(null), false);
});

test('team report experiment styles stay scoped to experiment roots', () => {
  assert.match(sidebarCssSource, /\.sidebar\.is-team-report-experiment\s*\{/);
  assert.match(sidebarCssSource, /\.sidebar-tree-shell\.is-team-report-experiment/);
  assert.match(experimentCssSource, /\.work-team-calendar-dialog\.is-team-report-experiment/);
  assert.match(experimentCssSource, /\.work-team-calendar-experiment-nav\s*\{/);
  assert.match(experimentCssSource, /\.work-team-calendar-mode-segments\s*\{/);
});
