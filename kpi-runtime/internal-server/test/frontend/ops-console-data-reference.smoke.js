import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

function readRepoFile(...segments) {
  return readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('ops console keeps demo-style Repository Map and Data Reference Map surfaces', async () => {
  const [
    indexHtml,
    appSource,
    appConfigSource,
    dataReferenceHtml,
    dataReferenceCssManifestSource,
    dataReferenceCoreCssSource,
    dataReferenceVisualCssSource,
    dataReferenceContentSource,
    dataReferenceSource,
    repositoryMapHtml,
    repositoryMapDataSource,
    repositoryMapHistoryMaySource,
    repositoryMapHistoryAprilSource,
  ] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'index.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.config.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.css'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.core.css'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.visual.css'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.content.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'data-reference-map.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-data.js'),
    readRepoFile(
      'commands',
      'ops-console-app',
      'ops-console',
      'public',
      'repository-map-history',
      '2026-05.js'
    ),
    readRepoFile(
      'commands',
      'ops-console-app',
      'ops-console',
      'public',
      'repository-map-history',
      '2026-04.js'
    ),
  ]);

  const repositoryMapDataContext = {};
  repositoryMapDataContext.window = repositoryMapDataContext;
  vm.createContext(repositoryMapDataContext);
  vm.runInContext(repositoryMapDataSource, repositoryMapDataContext, {
    filename: 'repository-map-data.js',
  });
  vm.runInContext(repositoryMapHistoryMaySource, repositoryMapDataContext, {
    filename: 'repository-map-history/2026-05.js',
  });
  vm.runInContext(repositoryMapHistoryAprilSource, repositoryMapDataContext, {
    filename: 'repository-map-history/2026-04.js',
  });

  const dataReferenceCssSource = [
    dataReferenceCssManifestSource,
    dataReferenceCoreCssSource,
    dataReferenceVisualCssSource,
  ].join('\n');

  assert.match(indexHtml, /data-tab="preview"[\s\S]*Repository Map/);
  assert.match(indexHtml, /data-tab="reference"/);
  assert.match(indexHtml, /data-i18n-key="dataReferenceTab"/);
  assert.match(indexHtml, /id="dataReferenceFrame"/);
  assert.match(indexHtml, /src="\/data-reference-map\.html"/);

  assert.match(appSource, /from '\.\/app\.config\.js'/);
  assert.match(appSource, /dataReferenceFrame/);
  assert.match(appConfigSource, /dataReferenceTitle/);
  assert.match(appConfigSource, /dataReferenceSummary/);

  assert.match(dataReferenceHtml, /class="language-toggle"/);
  assert.match(dataReferenceHtml, /data-language="ko"/);
  assert.match(dataReferenceHtml, /data-language="en"/);
  assert.match(dataReferenceHtml, /id="dataFlowSearch"/);
  assert.match(dataReferenceHtml, /id="architectureWeb"/);
  assert.match(dataReferenceHtml, /id="flowSelectorPanel"/);
  assert.match(dataReferenceHtml, /id="flowDetail"/);
  assert.match(dataReferenceHtml, /id="moduleRecordLayer"/);
  assert.match(dataReferenceHtml, /id="moduleRecordToggle"/);
  assert.match(dataReferenceHtml, /developer architecture/);
  assert.match(dataReferenceHtml, /<link rel="stylesheet" href="\/data-reference-map\.css">/);
  assert.match(dataReferenceHtml, /<script src="\/data-reference-map\.content\.js" defer><\/script>/);
  assert.match(dataReferenceHtml, /<script src="\/data-reference-map\.js" defer><\/script>/);
  assert.ok(
    dataReferenceHtml.indexOf('/data-reference-map.content.js') < dataReferenceHtml.indexOf('/data-reference-map.js')
  );
  assert.doesNotMatch(dataReferenceHtml, /data-reference-map\.data\.js/);
  assert.doesNotMatch(dataReferenceHtml, /ops-map\.browser-adapter\.js/);

  assert.match(dataReferenceCssManifestSource, /data-reference-map\.core\.css/);
  assert.match(dataReferenceCssManifestSource, /data-reference-map\.visual\.css/);
  assert.match(dataReferenceCssSource, /\.database-cylinder/);
  assert.match(dataReferenceCssSource, /\.chain-arrow/);
  assert.match(dataReferenceCssSource, /\.architecture-arrow/);
  assert.doesNotMatch(dataReferenceCssManifestSource, /data-reference-map\.base\.css/);
  assert.doesNotMatch(dataReferenceCssManifestSource, /data-reference-map\.diagram\.css/);
  assert.doesNotMatch(dataReferenceCssManifestSource, /data-reference-map\.web\.css/);

  assert.match(dataReferenceContentSource, /const messages = \{/);
  assert.match(dataReferenceContentSource, /ko: \{/);
  assert.match(dataReferenceContentSource, /en: \{/);
  assert.match(dataReferenceContentSource, /const dataFlows = \[/);
  assert.match(dataReferenceContentSource, /const sharedStorageGroups = \[/);
  assert.match(dataReferenceContentSource, /const appModuleRecordGroups = \[/);
  assert.match(dataReferenceContentSource, /app_module_records/);
  assert.match(dataReferenceContentSource, /app_documents/);
  assert.match(dataReferenceContentSource, /portal_data/);
  assert.match(dataReferenceContentSource, /record_key=audit_lux/);
  assert.match(dataReferenceContentSource, /record_key=data_equipment_history_card/);
  assert.match(dataReferenceContentSource, /record_key=work_history_records/);
  assert.match(dataReferenceContentSource, /module_key=util_metering/);
  assert.match(dataReferenceContentSource, /ownerDomain=audit\.legal_facility/);
  assert.match(dataReferenceContentSource, /ownerDomain=data\.equipment_history/);
  assert.match(dataReferenceContentSource, /ownerDomain=metering\.billing_document/);

  assert.match(dataReferenceSource, /function renderArchitectureWeb\(flows\)/);
  assert.match(dataReferenceSource, /function getStorageTargets\(flow\)/);
  assert.match(dataReferenceSource, /function renderFlowHub\(flows, selectedId\)/);
  assert.match(dataReferenceSource, /function renderSharedGroups\(\)/);
  assert.match(dataReferenceSource, /function renderModuleRecordLayer\(\)/);
  assert.match(dataReferenceSource, /showModuleRecords: false/);
  assert.match(dataReferenceSource, /chooseLanguage\(language\)/);
  assert.match(dataReferenceSource, /dataReferenceBrowser\.getLocationOrigin\(\)/);
  assert.doesNotMatch(dataReferenceSource, /window\.location/);
  assert.doesNotMatch(dataReferenceSource, /window\.addEventListener/);
  assert.doesNotMatch(dataReferenceSource, /const messages = \{/);
  assert.doesNotMatch(dataReferenceSource, /const dataFlows = \[/);

  assert.match(repositoryMapHtml, /repository-map-data\.js/);
  assert.match(repositoryMapHtml, /Folder Structure/);
  assert.match(repositoryMapHtml, /id="expandAllButton"/);
  assert.match(repositoryMapHtml, /id="collapseAllButton"/);
  assert.match(repositoryMapHtml, /class="tree-label"/);
  assert.match(repositoryMapHtml, /class="tree-toggle"/);
  assert.match(repositoryMapHtml, /\$\{row\}[\s\S]*<button class="tree-toggle"/);
  assert.match(repositoryMapHtml, /aria-expanded="\$\{isOpen \? 'true' : 'false'\}"/);
  assert.match(repositoryMapHtml, /function toggleTreeBranch\(toggle\)/);
  assert.match(repositoryMapHtml, /function setTreeOpenState\(isOpen\)/);
  assert.match(repositoryMapHtml, /function shouldShowNodeRole\(node, depth\)/);
  assert.match(repositoryMapHtml, /depth <= 1/);
  assert.match(repositoryMapHtml, /Patch History/);
  assert.match(repositoryMapHtml, /data-reference-map\.html/);
  assert.match(repositoryMapHtml, /\/api\/owner\/repository-map/);
  assert.match(repositoryMapHtml, /loadHistoryScripts/);
  assert.match(repositoryMapHtml, /\/owner\/repository-map-history\//);

  assert.match(repositoryMapDataSource, /KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.match(repositoryMapDataSource, /KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.match(repositoryMapDataSource, /repository-map-history\/2026-05\.js/);
  assert.match(repositoryMapDataSource, /repository-map-history\/2026-04\.js/);
  assert.match(repositoryMapDataSource, /Repository tab: folder structure and daily patch history/);
  assert.match(repositoryMapDataSource, /Data Path tab: database\/storage contracts and developer data flow/);
  assert.match(repositoryMapDataSource, /Data Path tab style manifest and split CSS/);
  assert.match(repositoryMapDataSource, /Data Path tab public content catalog/);
  assert.doesNotMatch(repositoryMapDataSource, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
  assert.doesNotMatch(repositoryMapDataSource, /KPI_REPOSITORY_MAP_I18N/);
  assert.match(repositoryMapHistoryMaySource, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
  assert.match(repositoryMapHistoryMaySource, /frontend\/import/);
  assert.match(repositoryMapHistoryMaySource, /refactor\/split/);
  assert.match(repositoryMapHistoryAprilSource, /privacy gate/);

  assert.equal(
    repositoryMapDataContext.window.KPI_REPOSITORY_MAP_STATIC_TREE[2].path,
    'commands/ops-console-app/'
  );
  assert.equal(
    repositoryMapDataContext.window.KPI_REPOSITORY_MAP_HISTORY_FILES[0],
    '/repository-map-history/2026-05.js'
  );
  assert.equal(
    repositoryMapDataContext.window.KPI_REPOSITORY_MAP_DAILY_HISTORY[0].tag,
    'frontend/import'
  );

  for (const date of ['2026-05-07', '2026-05-05', '2026-05-04', '2026-05-02', '2026-05-01']) {
    assert.equal(
      repositoryMapDataContext.window.KPI_REPOSITORY_MAP_DAILY_HISTORY.filter((entry) => entry.date === date).length,
      1
    );
  }
});
