import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const equipmentRoot = path.join(repoRoot, 'data-entry/runtime/data/equipment-history');
const moduleFiles = [
  'render/KPI.data.equipment-history.render.board.js',
  'render/KPI.data.equipment-history.render.card.js',
  'render/KPI.data.equipment-history.render.persistence.js',
  'render/KPI.data.equipment-history.render.print.js',
  'render/KPI.data.equipment-history.render.photo.js',
  'render/KPI.data.equipment-history.render.events.js',
];
const [html, manifest, hostSource, ...moduleSources] = await Promise.all([
  fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8'),
  fs.readFile(path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'), 'utf8'),
  fs.readFile(path.join(equipmentRoot, 'KPI.data.equipment-history.render.js'), 'utf8'),
  ...moduleFiles.map((file) => fs.readFile(path.join(equipmentRoot, file), 'utf8')),
]);

test('equipment-history renderer split keeps coherent modules and a thin host', () => {
  moduleSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${moduleFiles[index]} exceeds 1200 lines`);
    assert.match(source, /Object\.assign\(api, \{/, `${moduleFiles[index]} must register through the shared api`);
  });
  assert.ok(hostSource.split(/\r?\n/).length <= 500, 'equipment-history render host exceeds 500 lines');
  assert.match(moduleSources[0], /function renderBoard\(/);
  assert.match(moduleSources[1], /function renderHistoryCard\(/);
  assert.match(moduleSources[2], /async function persistEquipmentHistoryPayload\(/);
  assert.match(moduleSources[3], /function buildEquipmentHistoryPrintDocument\(/);
  assert.match(moduleSources[4], /async function applyEquipmentHistoryPhotoFile\(/);
  assert.match(moduleSources[5], /function bindEvents\(/);
  assert.doesNotMatch(hostSource, /function (?:renderBoard|renderHistoryCard|bindEvents)\(/);
});

test('equipment-history renderer parts load identically in html and boot manifest', () => {
  let htmlIndex = html.indexOf('KPI.data.equipment-history.storage.js');
  let manifestIndex = manifest.indexOf('KPI.data.equipment-history.storage.js');
  moduleFiles.forEach((file) => {
    const nextHtmlIndex = html.indexOf(file);
    const nextManifestIndex = manifest.indexOf(file);
    assert.ok(nextHtmlIndex > htmlIndex, `${file} is out of order in KPI.html`);
    assert.ok(nextManifestIndex > manifestIndex, `${file} is out of order in the boot manifest`);
    htmlIndex = nextHtmlIndex;
    manifestIndex = nextManifestIndex;
  });
  assert.ok(html.indexOf('KPI.data.equipment-history.render.js') > htmlIndex);
  assert.ok(manifest.indexOf('KPI.data.equipment-history.render.js') > manifestIndex);
});
