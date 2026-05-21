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

test('ops console omits repository map and data reference surfaces', async () => {
  const [
    indexHtml,
    appSource,
    appConfigSource,
    repositoryMapHtml,
    repositoryMapDataSource,
    opsPathsSource,
    opsRuntimeSource,
    commandRegistrySource,
  ] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'index.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.config.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-data.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'paths.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'ops-service.runtime.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'command-registry.mjs'),
  ]);

  const repositoryMapDataContext = {};
  repositoryMapDataContext.window = repositoryMapDataContext;
  vm.createContext(repositoryMapDataContext);
  vm.runInContext(repositoryMapDataSource, repositoryMapDataContext, {
    filename: 'repository-map-data.js',
  });

  assert.doesNotMatch(indexHtml, /data-tab="preview"/);
  assert.doesNotMatch(indexHtml, /data-tab="reference"/);
  assert.doesNotMatch(indexHtml, /Repository Map/);
  assert.doesNotMatch(indexHtml, /dataReferenceTab/);
  assert.doesNotMatch(indexHtml, /데이터 참조 경로/);
  assert.doesNotMatch(indexHtml, /repositoryMapFrame/);
  assert.doesNotMatch(indexHtml, /dataReferenceFrame/);
  assert.doesNotMatch(indexHtml, /src="\/repository-map\.html"/);
  assert.doesNotMatch(indexHtml, /src="\/data-reference-map\.html"/);

  assert.match(appSource, /from '\.\/app\.config\.js'/);
  assert.doesNotMatch(appSource, /syncRepositoryMapLanguage/);
  assert.doesNotMatch(appSource, /repositoryMapFrame/);
  assert.doesNotMatch(appSource, /dataReferenceFrame/);
  assert.doesNotMatch(appSource, /data-reference-map\.html/);

  assert.doesNotMatch(appConfigSource, /dataReferenceTab/);
  assert.doesNotMatch(appConfigSource, /previewSummary/);
  assert.doesNotMatch(appConfigSource, /dataReferenceTitle/);
  assert.doesNotMatch(appConfigSource, /dataReferenceSummary/);
  assert.match(appConfigSource, /KPI 서버 3100/);
  assert.match(appConfigSource, /DB 5434/);
  assert.match(appConfigSource, /PostgreSQL 5434/);
  assert.doesNotMatch(appConfigSource, /KPI 서버 18080/);
  assert.doesNotMatch(appConfigSource, /(?:DB|PostgreSQL) 55432/);

  assert.match(repositoryMapHtml, /repository-map-data\.js/);
  assert.match(repositoryMapHtml, /Folder Structure/);
  assert.match(repositoryMapHtml, /id="expandAllButton"/);
  assert.match(repositoryMapHtml, /id="collapseAllButton"/);
  assert.doesNotMatch(repositoryMapHtml, /Patch History/);
  assert.doesNotMatch(repositoryMapHtml, /data-reference-map\.html/);
  assert.doesNotMatch(repositoryMapHtml, /Data Path/);
  assert.doesNotMatch(repositoryMapHtml, /DB\/Storage/);
  assert.doesNotMatch(repositoryMapHtml, /\/owner\/repository-map-history\//);

  assert.match(repositoryMapDataSource, /KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.doesNotMatch(repositoryMapDataSource, /KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.doesNotMatch(repositoryMapDataSource, /repository-map-history/);
  assert.doesNotMatch(repositoryMapDataSource, /Data Path tab/);
  assert.doesNotMatch(repositoryMapDataSource, /data-reference-map/);

  assert.match(opsPathsSource, /\.env\.production\.local/);
  assert.match(opsPathsSource, /central-runtime/);
  assert.doesNotMatch(opsPathsSource, /\.env\.local-experiment/);
  assert.match(opsRuntimeSource, /KPI_RUNTIME_ENV: "production"/);
  assert.match(opsRuntimeSource, /\? parsed : 3100/);
  assert.match(opsRuntimeSource, /\? parsed : 5434/);
  assert.doesNotMatch(opsRuntimeSource, /KPI_RUNTIME_ENV: "local-experiment"/);
  assert.doesNotMatch(opsRuntimeSource, /\? parsed : 18080/);
  assert.doesNotMatch(opsRuntimeSource, /\? parsed : 55432/);
  assert.match(commandRegistrySource, /\.env\.production\.local/);
  assert.doesNotMatch(commandRegistrySource, /\.env\.local-experiment/);

  const consoleChildren =
    repositoryMapDataContext.window.KPI_REPOSITORY_MAP_STATIC_TREE.find(
      (entry) => entry.path === 'commands/ops-console-app/'
    )?.children || [];
  assert.equal(
    consoleChildren.some((entry) => String(entry.path || '').includes('data-reference-map')),
    false
  );
  assert.equal(repositoryMapDataContext.window.KPI_REPOSITORY_MAP_HISTORY_FILES, undefined);
  assert.equal(repositoryMapDataContext.window.KPI_REPOSITORY_MAP_DAILY_HISTORY, undefined);
});
