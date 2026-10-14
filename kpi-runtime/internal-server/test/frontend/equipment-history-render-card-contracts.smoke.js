import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { dataCssSource, equipmentHistoryStyleSource, formSource, renderSource, repoRoot } from './support/equipment-history-render-harness.js';

const maintenanceStyleSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.maintenance.css'),
  'utf8'
);

test('equipment-history card source preserves explicit save topbar editor and document layout contracts', () => {
  assert.doesNotMatch(renderSource, /설비 운영 정보/);
  assert.doesNotMatch(renderSource, /data-equipment-identity-stack/);
  assert.doesNotMatch(renderSource, /api\.renderFieldGrid\(api\.BASIC_FIELDS/);
  assert.doesNotMatch(renderSource, /data-equipment-status-select/);
  assert.match(
    renderSource,
    /function renderHistoryCard\(category, data, state\) \{[\s\S]+const header = data\.header \|\| \{\}/
  );
  assert.doesNotMatch(renderSource, /data-equipment-photo-info-card/);
  assert.doesNotMatch(renderSource, /api\.renderFieldGrid\(api\.PHOTO_INFO_FIELDS/);
  assert.match(renderSource, /function getTeamRoomOptions\(data, team\)/);
  assert.match(renderSource, /data-equipment-room-options-start/);
  assert.match(renderSource, /data-equipment-room-options-card/);
  assert.doesNotMatch(renderSource, /fieldAttrs: \{ room: `list="\$\{api\.escapeHtml\(CARD_ROOM_DATALIST_ID\)\}"` \}/);
  assert.match(renderSource, /event\.target\.dataset\.equipmentStartField === 'team'[\s\S]+redraw\(\)/);
  assert.match(renderSource, /function createEquipmentHistoryDraftId/);
  assert.match(renderSource, /const draftId = createEquipmentHistoryDraftId\(starter\)/);
  assert.match(renderSource, /id: draftId/);
  assert.match(renderSource, /equipmentCode: draftId\.toUpperCase\(\)/);
  assert.doesNotMatch(
    renderSource,
    /<button type="submit" class="data-equipment-primary-action">[\s\S]*?<i class="fas fa-save"/
  );
  assert.doesNotMatch(renderSource, /작성 후 저장을 누르면 설비 현황 보드에 즉시 반영됩니다/);
  assert.doesNotMatch(renderSource, /data-equipment-save-current/);
  assert.match(renderSource, /data-equipment-history-print/);
  assert.match(renderSource, /A4 \\uCD9C\\uB825/);
  assert.match(renderSource, /function renderTopbarCardActions\(state\)/);
  assert.match(
    renderSource,
    /data-equipment-history-print[\s\S]+data-equipment-cycle-current-status[\s\S]+data-equipment-delete-card[\s\S]+data-equipment-clear-form/
  );
  assert.match(renderSource, /function getEquipmentStatusIconClass/);
  assert.match(renderSource, /const statusIcon = getEquipmentStatusIconClass\(statusTone\)/);
  assert.match(renderSource, /data-equipment-topbar-clear-action/);
  assert.match(renderSource, /async function cycleCurrentCardStatus\(root, data, state, redraw\)/);
  assert.match(renderSource, /state\.draft\.status = getNextEquipmentBoardStatus\(state\.draft\.status\)/);
  assert.doesNotMatch(renderSource, /data-equipment-form-actions/);
  assert.doesNotMatch(renderSource, /hasEditablePhoto/);
  assert.doesNotMatch(renderSource, /data-equipment-topbar-photo-edit/);
  assert.doesNotMatch(dataCssSource, /data-equipment-topbar-photo-edit/);
  assert.match(renderSource, /data-equipment-title-back/);
  assert.match(renderSource, /fa-arrow-left/);
  assert.match(renderSource, /if \(!isAuthoring\) return '';/);
  assert.doesNotMatch(renderSource, /isAuthoring \? '' : `<div class="data-equipment-brand/);
  assert.match(renderSource, /is-authoring-mode/);
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\s*\{[\s\S]*grid-template-columns:\s*44px minmax\(260px,\s*1fr\) minmax\(360px,\s*620px\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard \.data-equipment-brand strong,\s*[\s\S]*data-equipment-topbar-dashboard \.data-equipment-title-block h2\s*\{[\s\S]*font-size:\s*clamp\(1\.32rem,\s*1\.75vw,\s*1\.72rem\)[\s\S]*letter-spacing:\s*0/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard \.data-equipment-brand small,\s*[\s\S]*data-equipment-topbar-dashboard \.data-equipment-title-block p\s*\{[\s\S]*font-size:\s*0\.88rem[\s\S]*font-weight:\s*800/
  );
  assert.match(
    dataCssSource,
    /data-equipment-index-controls select\s*\{[\s\S]*appearance:\s*none[\s\S]*background-image:/
  );
  assert.match(
    dataCssSource,
    /data-equipment-view-actions\s+\.data-equipment-index-controls select\s*\{[\s\S]*min-width:\s*0[\s\S]*font-weight:\s*800/
  );
  assert.match(dataCssSource, /data-equipment-filter-reset\s*\{[\s\S]*font-size:\s*0\.8rem[\s\S]*font-weight:\s*900/);
  assert.match(dataCssSource, /data-equipment-index-controls select:focus/);
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-authoring-mode[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/
  );
  assert.match(
    dataCssSource,
    /data-equipment-view-actions button,\s*[\s\S]*data-equipment-view-actions select\s*\{[\s\S]*font-size:\s*0\.8rem/
  );
  assert.match(dataCssSource, /data-equipment-page\s*\{[\s\S]*width:\s*100%[\s\S]*padding:\s*14px 16px 20px/);
  assert.doesNotMatch(renderSource, /팀별 설비 현황과 상태를 한눈에 확인하고/);
  assert.doesNotMatch(renderSource, /입력 후 작성란이 열립니다/);
  assert.doesNotMatch(renderSource, /data-equipment-select/);
  assert.doesNotMatch(renderSource, /renderEquipmentSelectOptions/);
  assert.doesNotMatch(renderSource, /data-equipment-title-status-toggle/);
  assert.doesNotMatch(renderSource, /data-equipment-status-toggle/);
  assert.doesNotMatch(dataCssSource, /data-equipment-title-status-toggle/);
  assert.match(renderSource, /saveCurrentEquipmentHistoryView\(root, data, state, redraw/);
  assert.match(renderSource, /function bindSaveShortcut/);
  assert.match(renderSource, /root\?\.querySelector\?\.\('\.data-equipment-page'\)/);
  assert.doesNotMatch(renderSource, /state\.view !== 'card' \|\| !isEquipmentHistorySaveShortcut/);
  assert.doesNotMatch(renderSource, /<p>\$\{api\.escapeHtml\(processLabel\)\}<\/p>/);
  assert.doesNotMatch(renderSource, /locationLabel/);
  assert.doesNotMatch(renderSource, /관리 구분 미지정/);
  assert.match(renderSource, /data-equipment-title-input/);
  assert.match(dataCssSource, /data-equipment-title-input/);
  assert.doesNotMatch(dataCssSource, /data-equipment-save-action/);
  assert.doesNotMatch(dataCssSource, /data-equipment-form-actions/);
  assert.match(dataCssSource, /data-equipment-topbar-action/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-running/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-stop/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-check/);
  assert.match(dataCssSource, /data-equipment-topbar-danger-action/);
  assert.match(dataCssSource, /data-equipment-topbar-clear-action/);
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-running[\s\S]+background:\s*#dcfce7/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-stop[\s\S]+background:\s*#fee2e2/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-check[\s\S]+background:\s*#fef3c7/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-topbar-danger-action[\s\S]+background:\s*#dc2626/
  );
  assert.match(
    dataCssSource,
    /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-topbar-clear-action[\s\S]+background:\s*#fff7ed/
  );
  const cardSource = renderSource.match(/function renderHistoryCard\(category, data, state\) \{[\s\S]*?\n {4}function renderFooter/)?.[0] || '';
  const titleSource = renderSource.match(/function renderEquipmentPhotoTitle\(draft\) \{[\s\S]*?\n {4}function renderTopbarBackButton/)?.[0] || '';
  assert.match(cardSource, /data-equipment-top-grid[\s\S]+data-equipment-card-heading[\s\S]+renderEquipmentPhotoTitle\(draft\)[\s\S]+data-equipment-hero-photo[\s\S]+renderPhotoCard\(draft\)/);
  assert.match(cardSource, /<\/form>\s*<div class="data-equipment-card-bottom">[\s\S]+renderFooter\(state\)[\s\S]+renderEquipmentRecentUpdated\(header, data\)/);
  assert.doesNotMatch(cardSource.split('data-equipment-hero-photo')[0], /renderEquipmentRecentUpdated|data-equipment-maintenance-category-field|data-equipment-maintenance-category-help/);
  assert.match(titleSource, /renderTitleTeamSelect\(teamName, teamMeta\)[\s\S]+renderTitleInput\('room'[\s\S]+renderTitleInput\('maintenanceCategory'[\s\S]+renderTitleInput\('name'/);
  assert.match(titleSource, /data-equipment-title-category/);
  assert.match(cardSource, /equipment-maintenance-category-options/);
  assert.match(renderSource, /data-equipment-note-card[\s\S]+renderCompactDocumentEditor\(draft\.documents\)/);
  assert.match(
    renderSource,
    /data-equipment-detail-card[\s\S]+data-equipment-annual-plan-card[\s\S]+data-equipment-history-card/
  );
  assert.match(renderSource, /function renderAnnualMaintenancePlanEditor\(rows, equipmentName = ''\)/);
  assert.match(renderSource, /data-equipment-add-row="annualMaintenancePlan"/);
  assert.match(renderSource, /data-equipment-row-section="annualMaintenancePlan"/);
  assert.match(renderSource, /renderAnnualMaintenancePlanDatalists/);
  assert.match(formSource, /data-equipment-annual-maintenance-cycle-options/);
  assert.match(formSource, /data-equipment-annual-maintenance-month-options/);
  assert.match(formSource, /function normalizeAnnualMaintenanceCycleValue/);
  assert.match(formSource, /function normalizeAnnualMaintenanceExecutionMonthValue/);
  assert.doesNotMatch(renderSource, /data-equipment-retired-doc-card/);
  assert.match(renderSource, /function renderEquipmentRecentUpdated/);
  assert.match(renderSource, /\\uCD5C\\uADFC \\uC5C5\\uB370\\uC774\\uD2B8 :/);
  assert.match(
    dataCssSource,
    /data-equipment-top-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]+gap:\s*12px/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /data-equipment-card-heading\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/
  );
  assert.match(dataCssSource, /data-equipment-hero-photo\s+\.data-equipment-photo-card[\s\S]+aspect-ratio:\s*16 \/ 5/);
  assert.match(
    maintenanceStyleSource,
    /data-equipment-card-bottom\s*\{[^}]*display:\s*flex[\s\S]+data-equipment-card-bottom\s+\.data-equipment-hero-updated\s*\{[^}]*margin:\s*0 0 0 auto/
  );
  assert.match(
    dataCssSource,
    /data-equipment-top-grid\s+\.data-equipment-photo-card[\s\S]+width:\s*min\(100%,\s*1600px\)[\s\S]+aspect-ratio:\s*16 \/ 5/
  );
  assert.match(dataCssSource, /data-equipment-card-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(
    dataCssSource,
    /data-equipment-simple-spec[\s\S]+grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-simple-spec-row[\s\S]+border:\s*1px solid #dce8f5[\s\S]+background:\s*#ffffff/
  );
  assert.match(dataCssSource, /data-equipment-simple-spec-label-input[\s\S]+color:\s*#405270/);
  assert.match(dataCssSource, /data-equipment-simple-spec-value-input[\s\S]+color:\s*#132844/);
  assert.match(dataCssSource, /data-equipment-simple-spec-remove[\s\S]+background:\s*transparent/);
  assert.match(dataCssSource, /data-equipment-maintenance-editor[\s\S]+display:\s*grid[\s\S]+gap:\s*7px/);
  assert.match(dataCssSource, /data-equipment-annual-plan-editor[\s\S]+min-width:\s*940px/);
  assert.match(
    dataCssSource,
    /data-equipment-annual-plan-head,[\s\S]+data-equipment-annual-plan-row[\s\S]+grid-template-columns:[\s\S]+minmax\(230px,\s*2\.55fr\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-maintenance-head,[\s\S]+data-equipment-maintenance-row[\s\S]+grid-template-columns:\s*minmax\(82px,\s*14%\)\s*minmax\(74px,\s*12%\)\s*minmax\(0,\s*44%\)\s*minmax\(74px,\s*12%\)\s*minmax\(84px,\s*18%\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-maintenance-remove[\s\S]+position:\s*absolute[\s\S]+top:\s*5px[\s\S]+right:\s*6px/
  );
  assert.match(dataCssSource, /data-equipment-maintenance-remove[\s\S]+background:\s*transparent[\s\S]+opacity:\s*0/);
  assert.match(
    dataCssSource,
    /data-equipment-maintenance-row:hover\s+\.data-equipment-maintenance-remove,[\s\S]+data-equipment-maintenance-row:focus-within\s+\.data-equipment-maintenance-remove[\s\S]+opacity:\s*1/
  );
  assert.match(
    dataCssSource,
    /data-equipment-detail-card,[\s\S]+data-equipment-history-card,[\s\S]+data-equipment-note-card,[\s\S]+data-equipment-doc-card[\s\S]+padding:\s*14px 16px/
  );
  assert.match(dataCssSource, /data-equipment-note-card[\s\S]+display:\s*grid[\s\S]+align-content:\s*start/);
  assert.match(
    dataCssSource,
    /data-equipment-note-card\s+\.data-equipment-note-field\s+textarea[\s\S]+min-height:\s*88px[\s\S]+background:\s*#f8fbff/
  );
  assert.match(
    dataCssSource,
    /data-equipment-history-card\s+\.data-equipment-edit-table th:nth-child\(1\)[\s\S]+width:\s*14%[\s\S]+data-equipment-history-card\s+\.data-equipment-edit-table th:nth-child\(3\)[\s\S]+width:\s*44%/
  );
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+border:\s*1px solid #d8e5f2/);
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+background:\s*#f8fbff/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-collapse:\s*separate/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-spacing:\s*0 7px/);
  assert.match(
    dataCssSource,
    /data-equipment-doc-list[\s\S]+grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[\s\S]+background:\s*#f8fbff/
  );
  assert.match(
    dataCssSource,
    /data-equipment-doc-list-item[\s\S]+align-content:\s*start[\s\S]+background:\s*#ffffff[\s\S]+padding:\s*8px 8px 9px/
  );
  assert.match(dataCssSource, /data-equipment-document-picker[\s\S]+align-items:\s*center[\s\S]+min-height:\s*24px/);
  assert.match(
    dataCssSource,
    /data-equipment-document-picker[\s\S]+border:\s*1px solid transparent[\s\S]+background:\s*transparent/
  );
  assert.match(
    dataCssSource,
    /data-equipment-doc-list-item input\[data-equipment-field="title"\][\s\S]+border:\s*0[\s\S]+background:\s*transparent/
  );
  assert.doesNotMatch(
    dataCssSource,
    /data-equipment-doc-field-label|data-equipment-doc-title-field|data-equipment-doc-attachment-field/
  );
  assert.match(dataCssSource, /data-equipment-document-file-name:empty[\s\S]+color:\s*transparent/);
  assert.match(dataCssSource, /data-equipment-document-pick[\s\S]+min-width:\s*44px/);
  assert.match(
    dataCssSource,
    /data-equipment-document-picker[\s\S]+grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/
  );
  assert.match(dataCssSource, /data-equipment-document-actions[\s\S]+display:\s*inline-flex[\s\S]+gap:\s*5px/);
  assert.match(
    dataCssSource,
    /data-equipment-document-download,[\s\S]+data-equipment-document-remove[\s\S]+min-height:\s*24px/
  );
  assert.doesNotMatch(dataCssSource, /data-equipment-document-remove[\s\S]{0,160}opacity:\s*0/);
  assert.match(
    dataCssSource,
    /@media \(max-width:\s*1180px\)[\s\S]+data-equipment-doc-list[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    dataCssSource,
    /@media \(max-width:\s*780px\)[\s\S]+data-equipment-doc-list[\s\S]+grid-template-columns:\s*1fr/
  );
});
