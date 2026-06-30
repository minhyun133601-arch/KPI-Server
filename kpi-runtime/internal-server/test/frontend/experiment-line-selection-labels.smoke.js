import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const experimentSourcePath = path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.experiment.js');
const experimentSource = await fs.readFile(experimentSourcePath, 'utf8');

function loadExperimentLabelTestApi() {
  const marker = '    root.KpiExperimentGraphPrototype = Object.freeze({';
  assert.ok(experimentSource.includes(marker), 'experiment prototype marker is missing');
  const instrumentedSource = experimentSource.replace(
    marker,
    [
      '    root.__experimentLineSelectionLabelTestApi = Object.freeze({',
      '        buildSummaryLineSelectionDisplayLabel',
      '    });',
      marker,
    ].join('\n')
  );
  const context = {
    window: {},
    KpiSectionFactoryAdapter: {
      registerFactory() {},
    },
  };
  vm.createContext(context);
  vm.runInContext(instrumentedSource, context, { filename: experimentSourcePath });
  return context.window.__experimentLineSelectionLabelTestApi;
}

test('experiment line selection labels group multi-line selections by team', () => {
  const api = loadExperimentLabelTestApi();
  assert.equal(typeof api?.buildSummaryLineSelectionDisplayLabel, 'function');

  const label = api.buildSummaryLineSelectionDisplayLabel;
  assert.equal(
    label([
      { key: 'ica-1', label: 'ica -1', teamKey: 'team-01-02' },
      { key: 'ica-2', label: 'ica -2', teamKey: 'team-01-02' },
      { key: 'ica-3', label: 'ica -3', teamKey: 'team-01-02' },
    ]),
    '1팀 2파트 (이카)'
  );
  assert.equal(
    label([
      { key: 'stick-1', label: '스틱1호기', teamKey: 'team-02' },
      { key: 'stick-2', label: '스틱2호기', teamKey: 'team-02' },
      { key: 'stick-3', label: '스틱3호기', teamKey: 'team-02' },
      { key: 'stick-4', label: '스틱4호기', teamKey: 'team-02' },
    ]),
    '2팀 (스틱1~4호기)'
  );
  assert.equal(
    label([
      { key: 'stick-1', label: '스틱1호기', teamKey: 'team-02' },
      { key: 'stick-8', label: '스틱8호기', teamKey: 'team-02' },
    ]),
    '2팀 (스틱1,8호기)'
  );
  assert.equal(
    label([
      { key: 'stick-1', label: '스틱1호기', teamKey: 'team-02' },
      { key: 'stick-2', label: '스틱2호기', teamKey: 'team-02' },
      { key: 'stick-3', label: '스틱3호기', teamKey: 'team-02' },
      { key: 'stick-5', label: '스틱5호기', teamKey: 'team-02' },
      { key: 'stick-6', label: '스틱6호기', teamKey: 'team-02' },
      { key: 'stick-7', label: '스틱7호기', teamKey: 'team-02' },
      { key: 'stick-8', label: '스틱8호기', teamKey: 'team-02' },
    ]),
    '2팀 (스틱1~3,5~8호기)'
  );
  assert.equal(
    label([
      { key: 'stick-1', label: '스틱1호기', teamKey: 'team-02' },
      { key: 'stick-2', label: '스틱2호기', teamKey: 'team-02' },
      { key: 'stick-3', label: '스틱3호기', teamKey: 'team-02' },
      { key: 'stick-4', label: '스틱4호기', teamKey: 'team-02' },
      { key: 'stick-5', label: '스틱5호기', teamKey: 'team-02' },
      { key: 'stick-6', label: '스틱6호기', teamKey: 'team-02' },
      { key: 'stick-7', label: '스틱7호기', teamKey: 'team-02' },
      { key: 'stick-8', label: '스틱8호기', teamKey: 'team-02' },
    ]),
    '2팀 (스틱)'
  );
  assert.equal(
    label([
      { key: 'rotary-1', label: '로타리 1호기', teamKey: 'team-02' },
      { key: 'rotary-2', label: '로타리 2호기', teamKey: 'team-02' },
      { key: 'vertical-2', label: '버티컬 2호기', teamKey: 'team-02' },
    ]),
    '2팀 (로타리 + 버티컬 2호기)'
  );
  assert.equal(
    label([
      { key: 'bottle-28', label: 'Bottle 28', teamKey: 'team-03' },
      { key: 'bottle-38-manual', label: 'Bottle 38(수동)', teamKey: 'team-03' },
      { key: 'bottle-38-auto', label: 'Bottle 38(자동)', teamKey: 'team-03' },
    ]),
    '3팀 (Bottle 28 + Bottle 38)'
  );
  assert.equal(
    label([
      { key: 'jidae', label: '지대', teamKey: 'team-01-02' },
      { key: 'pouch', label: 'Pouch', teamKey: 'team-03' },
    ]),
    '1팀 2파트 (지대) / 3팀 (Pouch)'
  );
  assert.equal(label([{ key: 'jidae', label: '지대', teamKey: 'team-01-02' }]), '지대');
});

test('experiment chart tools do not render the removed range key control', () => {
  assert.doesNotMatch(experimentSource, /function\s+buildExperimentRangeKeyOptionsHtml\(\)/);
  assert.doesNotMatch(experimentSource, /data-exp-range-key/);
  assert.doesNotMatch(experimentSource, /experiment-range-key/);
  assert.doesNotMatch(experimentSource, /<span>범위키<\/span>/);
  assert.match(experimentSource, /data-exp-period-end[\s\S]*data-exp-year-overlap/);
});
