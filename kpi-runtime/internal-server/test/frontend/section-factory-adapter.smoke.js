import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const sectionSourcePaths = [
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.factory-adapter.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.builders.js'),
  path.join(repoRoot, 'team-report', 'runtime', 'work', 'sections', 'KPI.sections.work.js'),
  path.join(repoRoot, 'utility', 'runtime', 'util', 'sections', 'KPI.sections.util.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'KPI.sections.data.js'),
  path.join(repoRoot, 'audit', 'runtime', 'audit', 'sections', 'KPI.sections.audit.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.owner.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.registry.js'),
];

const sectionSources = await Promise.all(
  sectionSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createContext() {
  const context = {
    window: {},
    Object,
    String,
    Array,
  };
  vm.createContext(context);
  sectionSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });
  return context;
}

test('section factory adapter registers dashboard sections without direct section globals', () => {
  const context = createContext();
  const factories = context.window.KpiSectionFactories;
  const registry = context.window.KpiSectionRegistry;

  assert.equal(typeof context.window.KpiSectionFactoryAdapter.registerFactory, 'function');
  assert.equal(typeof factories.work, 'function');
  assert.equal(typeof factories.util, 'function');
  assert.equal(typeof factories.audit, 'function');
  assert.equal(typeof factories.data, 'function');
  assert.equal(typeof factories.owner, 'function');
  assert.equal(typeof registry.registerSections, 'function');

  const appData = registry.registerSections({});
  assert.deepEqual(Object.keys(appData), ['work', 'util', 'audit', 'data', 'owner']);
  assert.equal(appData.work.name, '팀별내역서');
  assert.equal(appData.util.name, '유틸리티');
  assert.equal(appData.audit.name, '오디트');
  assert.equal(
    JSON.stringify(appData.audit.categories.map((category) => category.dataKey)),
    JSON.stringify(['audit_lux', 'audit_legal_facility'])
  );
  assert.equal(appData.data.name, '데이터 관리');
  assert.equal(appData.owner.ownerOnly, true);

  const nonAdapterSources = sectionSources
    .filter(({ filename }) => filename !== 'KPI.section.factory-adapter.js')
    .map(({ source }) => source)
    .join('\n');
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionFactories/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionBuilders/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionRegistry/);
});

test('kpi html loads section factory adapter before all section factories', () => {
  const adapterIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.factory-adapter.js?v=1');
  const buildersIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.builders.js?v=215');
  const workIndex = kpiHtml.indexOf('team-report/runtime/work/sections/KPI.sections.work.js?v=231');
  const utilIndex = kpiHtml.indexOf('utility/runtime/util/sections/KPI.sections.util.js?v=242');
  const dataIndex = kpiHtml.indexOf('data-entry/runtime/data/sections/KPI.sections.data.js?v=6');
  const auditIndex = kpiHtml.indexOf('audit/runtime/audit/sections/KPI.sections.audit.js?v=4');
  const ownerIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.owner.js?v=5');
  const registryIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.registry.js?v=2');

  assert.ok(adapterIndex >= 0, 'section factory adapter loader is missing');
  assert.ok(buildersIndex > adapterIndex, 'section builders must load after adapter');
  assert.ok(workIndex > buildersIndex, 'work section must load after builders');
  assert.ok(utilIndex > workIndex, 'util section must load after work section');
  assert.ok(dataIndex > utilIndex, 'data section must load after util section');
  assert.ok(auditIndex > dataIndex, 'audit section must load after data section');
  assert.equal(kpiHtml.indexOf('KPI.sections.production-report.js'), -1, 'production report section loader must stay removed');
  assert.ok(ownerIndex > auditIndex, 'owner section must load after audit section');
  assert.ok(registryIndex > ownerIndex, 'section registry must load after section factories');
});
