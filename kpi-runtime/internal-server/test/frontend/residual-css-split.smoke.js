import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const contracts = [
  {
    facade: 'kpi-runtime/app/styles/shell/shell-chrome.css',
    directory: 'kpi-runtime/app/styles/shell/shell-chrome',
    prefix: './shell-chrome/',
    files: ['01-shell-runtime.css', '02-sidebar-home.css', '03-home-area-responsive.css'],
    sha256: 'b4ed3cbb522b2c16cdb3d56f49b4c4270ef93031d14725ec38847fff0c58e5f8',
  },
  {
    facade: 'kpi-runtime/app/styles/metering/metering.css',
    directory: 'kpi-runtime/app/styles/metering/metering',
    prefix: './metering/',
    files: ['01-metering-core.css', '02-report-builder.css'],
    sha256: '241f8ae5d358ed1d3a444e448b8e406e7ed8abdafd453b2e870529bd6fa5b117',
  },
  {
    facade: 'data-entry/runtime/data/utility-graph-template/styles.css',
    directory: 'data-entry/runtime/data/utility-graph-template/styles',
    prefix: './styles/',
    files: ['01-template-core.css', '02-memo-controls.css'],
    sha256: 'bde0690d15be4ed71b8627ba52ee408ee3f571de192f4190362cfeedcb4cd383',
  },
];

for (const contract of contracts) {
  test(`${contract.facade} preserves its bounded cascade chunks`, async () => {
    const facadeSource = await fs.readFile(path.join(repoRoot, contract.facade), 'utf8');
    const imports = Array.from(facadeSource.matchAll(/@import url\("([^"]+)"\);/g), match => match[1]);
    assert.deepEqual(imports, contract.files.map(file => contract.prefix + file));
    assert.equal(facadeSource.replace(/@import url\("[^"]+"\);/g, '').trim(), '');
    assert.ok(facadeSource.split(/\r?\n/).length <= 100, `${contract.facade} facade exceeds 100 lines`);

    const directoryPath = path.join(repoRoot, contract.directory);
    const entries = (await fs.readdir(directoryPath)).filter(file => file.endsWith('.css')).sort();
    assert.deepEqual(entries, contract.files);
    const chunks = await Promise.all(contract.files.map(file => fs.readFile(path.join(directoryPath, file), 'utf8')));
    chunks.forEach((source, index) => {
      assert.ok(source.split(/\r?\n/).length <= 800, `${contract.files[index]} exceeds 800 lines`);
    });
    const digest = crypto.createHash('sha256').update(chunks.join('')).digest('hex');
    assert.equal(digest, contract.sha256, `${contract.facade} cascade bytes changed`);
  });
}
