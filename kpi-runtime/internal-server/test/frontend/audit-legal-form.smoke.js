import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const legalAssetsPath = path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.legal.assets.js');
const legalPath = path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.legal.js');
const legalFormPath = path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.legal.form.js');
const legalAssetsSource = await fs.readFile(legalAssetsPath, 'utf8');
const legalFormSource = await fs.readFile(legalFormPath, 'utf8');
const legalSource = await fs.readFile(legalPath, 'utf8');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildLegalRenderer() {
  const contentContainer = {
    innerHTML: '',
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const document = {
    getElementById(id) {
      return id === 'content-container' ? contentContainer : null;
    },
  };
  const portalData = {};
  const alertUser = () => {};
  const window = {
    alert: alertUser,
    PortalData: portalData,
  };
  const legalAssetsApi = {};
  const adapter = {
    ensureLegalAssetsApi() {
      return legalAssetsApi;
    },
    getLegalAssetsApi() {
      return legalAssetsApi;
    },
    getAuditRuntimeConfig() {
      return {
        enabled: true,
        apiBase: '/api',
        records: {
          audit_legal_facility: {
            permissionKey: 'audit:legal',
            writeEnabled: true,
          },
        },
        assets: {
          legalFacility: {
            writeEnabled: true,
          },
        },
      };
    },
    canUseServerWrite(writeEnabled) {
      return writeEnabled === true;
    },
    hasFetch() {
      return true;
    },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    writePortalPayload(dataKey, data) {
      portalData[dataKey] = JSON.parse(JSON.stringify(data || {}));
      return portalData[dataKey];
    },
    alert: alertUser,
  };
  const factory = new Function(
    'escapeHtml',
    'document',
    'window',
    'KpiAuditRecordsBrowserAdapter',
    `${legalAssetsSource}\n${legalFormSource}\n${legalSource}\nreturn { renderAuditLegalFacilityPreview };`
  );
  const renderer = factory(escapeHtml, document, window, adapter);
  return { ...renderer, contentContainer };
}

test('audit legal facility preview renders registration form and extended columns', () => {
  const { renderAuditLegalFacilityPreview, contentContainer } = buildLegalRenderer();

  renderAuditLegalFacilityPreview(
    {
      title: '법정 설비 관리',
      desc: '법정 설비 점검 항목을 관리합니다.',
      color: '#e11d48',
    },
    {
      facilities: [
        {
          id: 'legal-boiler-1',
          itemType: 'gasboiler',
          facility: '보일러 1호기',
          managementNo: 'BLR-01',
          plant: '보일러실',
          statutoryItem: '보일러 안전검사',
          cycle: '6개월',
          lastDate: '2026-01-10',
          nextDate: '2026-07-10',
          responsible: '시설팀',
          agency: '검사기관명',
          attachmentKey: 'boiler-01-202607-cert',
          previewTitle: '보일러 검사 필증',
          note: '특이사항 없음',
        },
      ],
    }
  );

  const html = contentContainer.innerHTML;
  assert.match(html, /data-audit-legal-form/);
  assert.match(html, /data-audit-legal-file="image"/);
  assert.match(html, /data-audit-legal-file="attachment"/);
  assert.match(html, /법정설비 등록/);
  assert.match(html, /관리번호/);
  assert.match(html, /첨부 키/);
  assert.match(html, /data-audit-legal-category="boiler"/);
  assert.match(html, /boiler-01-202607-cert/);
  assert.match(html, /<th>위치<\/th>/);
});

test('audit legal facility submit waits for record save and cleans uploaded files on failure', () => {
  assert.match(legalAssetsSource, /async function deleteUploadedFilesFromRecord/);
  assert.match(legalAssetsSource, /DELETE/);
  assert.match(legalFormSource, /await Promise\.resolve\(saveAuditData\('audit_legal_facility', nextData\)\)/);
  assert.match(legalFormSource, /deleteUploadedFilesFromRecord/);
  assert.match(legalFormSource, /서버 저장이 완료되지 않아 법정설비 등록을 취소했습니다/);
  assert.doesNotMatch(legalSource, /function bindAuditLegalEntryEvents/);
  assert.doesNotMatch(legalSource, /Server write permission is required/);
  assert.doesNotMatch(legalSource, /File upload failed/);
});
