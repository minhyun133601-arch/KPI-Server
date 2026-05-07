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
    confirm: () => true,
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
  assert.match(html, /보일러 설비관리/);
  assert.match(html, /보일러 설비 추가/);
  assert.match(html, /설비명/);
  assert.match(html, /관리자/);
  assert.match(html, /위치/);
  assert.doesNotMatch(html, /관리번호/);
  assert.doesNotMatch(html, /첨부 키/);
  assert.doesNotMatch(html, /data-audit-legal-file="image"/);
  assert.doesNotMatch(html, /data-audit-legal-file="attachment"/);
  assert.match(html, /data-audit-legal-category="boiler"/);
  assert.match(html, /data-audit-legal-category="cooling"/);
  assert.match(html, /data-audit-legal-category="gas"/);
  assert.match(html, /data-audit-legal-category="fire"/);
  assert.match(html, /data-audit-legal-category="electric"/);
  assert.match(html, /data-audit-legal-category="environment"/);
  assert.match(html, /data-audit-legal-category="other"/);
  assert.match(html, /정기검사/);
  assert.match(html, /사용검사/);
  assert.match(html, /선임/);
  assert.match(html, /남은 관리 일정/);
  assert.match(html, /날짜 미등록/);
  assert.match(html, /선임일 -/);
  assert.match(html, /다음 교육일 -/);
  assert.match(html, /주기 6개월/);
  assert.match(html, /검사\/선임 추가/);
  assert.match(html, /삭제/);
  assert.match(html, /data-audit-legal-open-category-inspection="boiler"/);
  assert.match(html, /data-audit-legal-inspection-type="정기검사"/);
  assert.match(html, /data-audit-legal-inspection-type="사용검사"/);
  assert.match(html, /data-audit-legal-inspection-type="선임"/);
  assert.match(html, /data-audit-legal-delete-facility="legal-boiler-1"/);
  assert.match(html, /data-audit-legal-calendar-shift="-1"/);
  assert.match(html, /data-audit-legal-calendar-shift="1"/);
  assert.match(html, /data-audit-legal-calendar-year/);
  assert.match(html, /data-audit-legal-calendar-month/);
  assert.match(html, /audit-legal-calendar-month-watermark/);
  assert.match(html, /aria-label="점검 일정 연도"/);
  assert.match(html, /aria-label="점검 일정 월"/);
  assert.match(html, /최근 2026\.01\.10/);
  assert.match(html, /다음 2026\.07\.10/);
  assert.match(html, /data-audit-legal-inspection-item/);
  assert.doesNotMatch(html, /boiler-01-202607-cert/);
  assert.ok(html.indexOf('점검 일정') < html.indexOf('data-audit-legal-category="boiler"'));
  assert.doesNotMatch(html, /중요 알림/);
  assert.doesNotMatch(html, /프리뷰/);
  assert.doesNotMatch(html, /법정 설비 목록/);
  assert.doesNotMatch(html, /문서 현황/);
});

test('audit legal facility submit waits for record save and cleans uploaded files on failure', () => {
  assert.match(legalAssetsSource, /async function deleteUploadedFilesFromRecord/);
  assert.match(legalAssetsSource, /DELETE/);
  assert.match(legalFormSource, /await Promise\.resolve\(saveAuditData\('audit_legal_facility', nextData\)\)/);
  assert.match(legalFormSource, /deleteUploadedFilesFromRecord/);
  assert.match(legalFormSource, /async function deleteAuditLegalFacility/);
  assert.match(legalFormSource, /data-audit-legal-delete-facility/);
  assert.match(legalFormSource, /정말로 삭제하시겠습니까/);
  assert.match(legalFormSource, /inspectionItems: getAuditLegalDefaultInspectionItems/);
  assert.match(legalFormSource, /data-audit-legal-open-category-inspection/);
  assert.match(legalSource, /AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS = \['정기검사', '사용검사', '선임'\]/);
  assert.match(legalSource, /AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS/);
  assert.match(legalSource, /function calculateAuditLegalNextDate/);
  assert.match(legalSource, /data-audit-legal-inspection-input="cycle"/);
  assert.match(legalSource, /renderAuditLegalCycleOptions/);
  assert.match(legalSource, /data-audit-legal-file="attachment"/);
  assert.match(legalSource, /data-audit-legal-inspection-label="lastDate"/);
  assert.match(legalSource, /data-audit-legal-inspection-label="cycle"/);
  assert.match(legalSource, /남은 관리 일정/);
  assert.match(legalSource, /검사\/선임 추가/);
  assert.match(legalFormSource, /applyAuditLegalInspectionFormLabels/);
  assert.match(legalFormSource, /applyAuditLegalInspectionNextDate/);
  assert.match(legalFormSource, /cycle: getAuditLegalInspectionInputValue/);
  assert.match(legalFormSource, /항목과 다음일을 입력해 주세요/);
  assert.match(legalFormSource, /data-audit-legal-calendar-shift/);
  assert.match(legalFormSource, /setAuditLegalCalendarMonth/);
  assert.match(legalFormSource, /서버 저장이 완료되지 않아 법정설비 등록을 취소했습니다/);
  assert.match(legalSource, /AUDIT_LEGAL_CATEGORY_INSPECTION_FORM_ID/);
  assert.match(legalSource, /data-audit-legal-calendar-year/);
  assert.match(legalSource, /data-audit-legal-calendar-month/);
  assert.doesNotMatch(legalSource, /function bindAuditLegalEntryEvents/);
  assert.doesNotMatch(legalSource, /Server write permission is required/);
  assert.doesNotMatch(legalSource, /File upload failed/);
});
