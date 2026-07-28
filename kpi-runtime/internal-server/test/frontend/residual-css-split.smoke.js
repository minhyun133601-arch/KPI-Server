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
    sha256: 'a35db617d2ccbc1feda05f32fbdfd00c9e277de3053f2942825494a8b2e9252f',
  },
  {
    facade: 'kpi-runtime/app/styles/metering/metering.css',
    directory: 'kpi-runtime/app/styles/metering/metering',
    prefix: './metering/',
    files: [
      '01-metering-core.css',
      '02-report-builder.css',
      '03-monthly-utility-meter-sheet.css',
    ],
    sha256: 'a291c935e0778b78be5f2bdc35db7cbe38c424fab347d9f8c3035838ae4776b5',
  },
  {
    facade: 'data-entry/runtime/data/utility-graph-template/styles.css',
    directory: 'data-entry/runtime/data/utility-graph-template/styles',
    prefix: './styles/',
    files: ['01-template-core.css', '02-memo-controls.css'],
    sha256: 'fa75dc420716588a8fa54fe4612288d87d863fd9ee03b406ba8a1a39d7981f15',
  },
];

for (const contract of contracts) {
  test(`${contract.facade} preserves its bounded cascade chunks`, async () => {
    const facadeSource = await fs.readFile(path.join(repoRoot, contract.facade), 'utf8');
    const imports = Array.from(facadeSource.matchAll(/@import url\("([^"]+)"\);/g), match => match[1]);
    const importPaths = imports.map(importPath => importPath.replace(/\?.*$/, ''));
    assert.deepEqual(importPaths, contract.files.map(file => contract.prefix + file));
    assert.equal(facadeSource.replace(/@import url\("[^"]+"\);/g, '').trim(), '');
    assert.ok(facadeSource.split(/\r?\n/).length <= 100, `${contract.facade} facade exceeds 100 lines`);

    const directoryPath = path.join(repoRoot, contract.directory);
    const entries = (await fs.readdir(directoryPath)).filter(file => file.endsWith('.css')).sort();
    assert.deepEqual(entries, contract.files);
    const chunks = await Promise.all(contract.files.map(file => fs.readFile(path.join(directoryPath, file), 'utf8')));
    chunks.forEach((source, index) => {
      assert.ok(source.split(/\r?\n/).length <= 800, `${contract.files[index]} exceeds 800 lines`);
    });
    const normalizedCascade = chunks.join('').replace(/\r\n?/g, '\n');
    const digest = crypto.createHash('sha256').update(normalizedCascade).digest('hex');
    assert.equal(digest, contract.sha256, `${contract.facade} cascade bytes changed`);
  });
}
