import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime, renderSource } from './support/equipment-history-render-harness.js';

test('equipment-history print document preserves the A4 card form through maintenance docs and note', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const draft = api.createDraft({
    name: 'Mixer A',
    team: '2\uD300',
    room: 'A\uC2E4',
    process: '\uD63C\uD569',
    rate: '88',
    modelName: 'MX-100',
    manufacturer: 'Sample Maker',
    manufacturedAt: '2020-03',
    owner: 'Sample Service\n010-1234-5678',
    photoPreviewUrl: '/api/files/photo-1/view',
    detailGroups: {
      equipmentSpecs: [
        { label: '\uC6A9\uB7C9', value: '100 kg' },
        { label: '\uC804\uC555', value: '220 V' },
      ],
    },
    documents: [{ title: '\uC810\uAC80 \uBCF4\uACE0\uC11C', fileName: 'mixer-a-report.pdf' }],
    maintenanceHistory: [
      {
        date: '2026.05.11',
        type: '\uC810\uAC80',
        content: '\uBCA8\uD2B8 \uC7A5\uB825 \uD655\uC778',
        worker: '\uD64D\uAE38\uB3D9',
        note: '\uC815\uC0C1',
      },
    ],
    note: '\uBE44\uACE0 \uB0B4\uC6A9',
  });
  const html = api.buildEquipmentHistoryPrintDocument(draft, { updatedAt: '2026-06-08 10:30' });
  const emptyHtml = api.buildEquipmentHistoryPrintDocument(api.createDraft({ name: 'Empty Card' }));

  assert.equal(typeof api.buildEquipmentHistoryPrintDocument, 'function');
  assert.match(html, /@page \{ size: A4 portrait; margin: 6mm; \}/);
  assert.match(html, /class="equipment-print-page"/);
  assert.match(html, /class="data-equipment-layout data-equipment-edit-form equipment-print-form"/);
  assert.match(html, /class="data-equipment-top-grid equipment-print-top-grid"/);
  assert.match(html, /class="data-equipment-card-heading equipment-print-card-heading"/);
  assert.match(html, /class="data-equipment-hero-photo"/);
  assert.doesNotMatch(html, /class="data-equipment-hero-side"/);
  assert.match(html, /\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8 :/);
  assert.match(html, /2026-06-08 10:30/);
  assert.match(html, /class="data-equipment-photo-title-row equipment-print-photo-title-row"/);
  assert.match(html, /class="equipment-print-section-stack"/);
  assert.match(html, /class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"/);
  assert.doesNotMatch(html, /equipment-print-status-pill|equipment-print-status-toggle/);
  assert.match(html, /<h3 class="data-equipment-section-title">설비 스펙<\/h3>/);
  assert.match(html, /class="data-equipment-card data-equipment-history-card equipment-print-maintenance"/);
  assert.match(html, /class="data-equipment-card data-equipment-note-card equipment-print-note-card"/);
  assert.match(html, /class="data-equipment-card data-equipment-doc-card equipment-print-documents"/);
  assert.doesNotMatch(
    html,
    /class="data-equipment-topbar data-equipment-topbar-dashboard is-card-mode equipment-print-card-topbar"/
  );
  assert.doesNotMatch(html, /class="data-equipment-hero-grid equipment-print-hero-grid"/);
  assert.doesNotMatch(html, /class="data-equipment-card-grid"/);
  assert.match(html, /\uBB38\uC11C \uCCA8\uBD80/);
  assert.match(html, /\uC815\uBE44 \uC774\uB825/);
  assert.match(html, /\uBE44\uACE0/);
  assert.match(html, /grid-template-rows: none/);
  assert.match(html, /height: auto/);
  assert.match(
    html,
    /data-equipment-top-grid,[\s\S]+equipment-print-top-grid[\s\S]+grid-template-columns: minmax\(0, 1fr\)/
  );
  assert.match(
    html,
    /data-equipment-card-heading,[\s\S]+equipment-print-card-heading[\s\S]+grid-template-columns: minmax\(34mm, 0\.32fr\) minmax\(0, 1fr\)/
  );
  assert.match(html, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(html, /equipment-print-doc-grid[\s\S]+grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /equipment-print-doc-cell[\s\S]+background: #ffffff/);
  assert.match(html, /equipment-print-doc-empty \{ grid-column: 1 \/ -1; \}/);
  assert.match(html, /equipment-print-maintenance-table td:nth-child\(1\) \{ width: 14%; \}/);
  assert.match(html, /equipment-print-maintenance-table td:nth-child\(3\) \{ width: 44%; \}/);
  assert.match(html, /equipment-print-note-card\.is-empty \.equipment-print-empty/);
  assert.match(html, /aspect-ratio: 16 \/ 5/);
  assert.ok(
    html.indexOf('class="data-equipment-top-grid equipment-print-top-grid"') <
      html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card-heading equipment-print-card-heading"') <
      html.indexOf('class="data-equipment-photo-card"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-photo-card"') <
      html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"') <
      html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"') <
      html.indexOf('class="data-equipment-card data-equipment-note-card equipment-print-note-card"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-note-card equipment-print-note-card"') <
      html.indexOf('class="data-equipment-card data-equipment-doc-card equipment-print-documents"')
  );
  assert.match(html, /mixer-a-report\.pdf/);
  assert.match(html, /100 kg/);
  assert.match(html, /\uBE44\uACE0 \uB0B4\uC6A9/);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uC124\uBE44 \uC2A4\uD399\uC774 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uC815\uBE44 \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uBE44\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uAD00\uB828 \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /class="equipment-print-empty equipment-print-doc-empty"/);
  assert.doesNotMatch(html, /data-equipment-save-current|data-equipment-save-action/);
  assert.match(renderSource, /printHtmlDocument/);
  assert.doesNotMatch(renderSource, /noopener,noreferrer/);
  assert.doesNotMatch(
    html,
    /data-equipment-field|data-equipment-add-row|data-equipment-form-actions|data-equipment-spec-block-toggle/
  );
});
