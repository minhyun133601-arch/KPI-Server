import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEquipmentHistoryRuntime,
  dataCssSource,
  formSource,
  modelSource,
  renderSource,
  storageSource,
} from './support/equipment-history-render-harness.js';

test('equipment-history photo and attachment source preserves managed draft and normalization contracts', () => {
  const footerSource =
    renderSource.match(/function renderFooter\([\s\S]*?\n {4}function renderEquipmentRecentUpdated/)?.[0] || '';
  assert.match(renderSource, /renderFooter\(state\)/);
  assert.doesNotMatch(footerSource, /ownerLabel|header\.owner|draft\?\.owner|담당 업체/);
  assert.match(renderSource, /function renderEquipmentPhotoTitle/);
  assert.match(renderSource, /renderEquipmentPhotoTitle\(draft\)/);
  assert.match(renderSource, /function renderTitleTeamSelect/);
  assert.match(renderSource, /function getEquipmentTeamIconSvg/);
  assert.doesNotMatch(renderSource, /function getEquipmentTeamIconClass/);
  assert.match(renderSource, /data-equipment-title-field/);
  assert.match(renderSource, /data-equipment-title-value/);
  assert.doesNotMatch(renderSource, /data-equipment-title-label/);
  assert.doesNotMatch(renderSource, /\\uD300 :/);
  assert.doesNotMatch(renderSource, /\\uC2E4 :/);
  assert.doesNotMatch(renderSource, /\\uC124\\uBE44\\uBA85 :/);
  assert.match(renderSource, /data-equipment-title-team-icon/);
  assert.match(renderSource, /getBoardTeamStyle\(teamMeta\)/);
  assert.match(renderSource, /function renderTopbarBackButton/);
  assert.match(dataCssSource, /data-equipment-title-back[\s\S]+width:\s*38px[\s\S]+height:\s*38px/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-title-back/);
  assert.match(renderSource, /\\uC124\\uBE44 \\uC2A4\\uD399/);
  assert.match(renderSource, /renderSimpleSpecEditor\(draft\)/);
  assert.match(renderSource, /function renderMaintenanceEditor\(rows\)/);
  assert.match(renderSource, /renderMaintenanceEditor\(draft\.maintenanceHistory\)/);
  assert.match(renderSource, /function renderAnnualMaintenancePlanEditor\(rows, equipmentName = ''\)/);
  assert.match(renderSource, /renderAnnualMaintenancePlanEditor\(draft\.annualMaintenancePlan, draft\.name\)/);
  assert.match(
    renderSource,
    /class="data-equipment-card data-equipment-note-card"[\s\S]+<h3 class="data-equipment-section-title">비고<\/h3>[\s\S]+data-equipment-field="note"/
  );
  assert.match(formSource, /DEFAULT_DOCUMENT_ROW_COUNT\s*=\s*1/);
  assert.match(
    formSource,
    /documents:\s*normalizeRows\(source\.documents,\s*createBlankDocumentRow,\s*DEFAULT_DOCUMENT_ROW_COUNT\)/
  );
  const simpleSpecSource = renderSource.match(/function renderSimpleSpecEditor\(draft\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(simpleSpecSource, /data-equipment-simple-spec-label-input/);
  assert.match(simpleSpecSource, /data-equipment-simple-spec-value-input/);
  assert.match(simpleSpecSource, /data-equipment-simple-spec-remove/);
  assert.doesNotMatch(simpleSpecSource, /fa-trash-alt/);
  const maintenanceSource =
    renderSource.match(/function renderMaintenanceEditor\(rows\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(maintenanceSource, /data-equipment-maintenance-editor/);
  assert.match(maintenanceSource, /data-equipment-maintenance-row/);
  assert.match(maintenanceSource, /data-equipment-maintenance-remove/);
  assert.match(maintenanceSource, /data-equipment-remove-row="maintenanceHistory"/);
  assert.match(maintenanceSource, /data-equipment-maintenance-input/);
  assert.doesNotMatch(maintenanceSource, /fa-trash-alt/);
  assert.match(renderSource, /renderCompactDocumentEditor\(draft\.documents\)/);
  const compactDocumentSource =
    renderSource.match(/function renderCompactDocumentEditor\(rows\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(compactDocumentSource, /data-equipment-document-title-input/);
  assert.match(compactDocumentSource, /placeholder: '\\uC81C\\uBAA9'/);
  assert.doesNotMatch(
    compactDocumentSource,
    /data-equipment-doc-field-label|data-equipment-doc-title-field|data-equipment-doc-attachment-field|첨부 없음/
  );
  assert.match(compactDocumentSource, /data-equipment-document-file-name/);
  assert.match(compactDocumentSource, />\s*문서\s*<\/button>/);
  assert.match(compactDocumentSource, /data-equipment-document-remove/);
  assert.match(compactDocumentSource, /data-equipment-document-download/);
  assert.match(compactDocumentSource, /isDocumentTitleDuplicate\(title, label\)/);
  assert.match(compactDocumentSource, /\/api\/files\/\$\{encodeURIComponent\(documentId\)\}\/download/);
  assert.doesNotMatch(compactDocumentSource, /fa-file-pdf|fa-plus|fa-trash-alt/);
  const cardSource =
    renderSource.match(
      /function renderHistoryCard\(category, data, state\) \{[\s\S]*?\n {4}function renderFooter/
    )?.[0] || '';
  assert.match(cardSource, /ensureDraftDocumentEditorSlot\(draft\)/);
  assert.match(cardSource, /\\uBB38\\uC11C \\uCCA8\\uBD80/);
  assert.match(cardSource, /data-equipment-add-row="documents"[\s\S]+<i class="fas fa-plus"><\/i><span>추가<\/span>/);
  assert.doesNotMatch(cardSource, /renderEditableTable\(api\.MAINTENANCE_FIELDS/);
  assert.doesNotMatch(cardSource, /관련 문서|愿\?\?臾몄꽌/);
  assert.match(renderSource, /function ensureDraftDocumentEditorSlot/);
  assert.match(renderSource, /ensureDraftDocumentEditorSlot\(state\.draft\)/);
  assert.match(renderSource, /row\.pendingFile = file;[\s\S]+row\.fileName = file\.name \|\| '';[\s\S]+redraw\(\);/);
  assert.doesNotMatch(
    renderSource,
    /row\.fileName = file\.name \|\| '';[\s\S]{0,120}ensureDraftDocumentEditorSlot\(state\.draft\);/
  );
  assert.match(formSource, /data-equipment-add-block="\$\{api\.escapeHtml\(groupKey\)\}"/);
  assert.match(formSource, /data-equipment-add-row-to-block/);
  assert.match(renderSource, /data-equipment-spec-block-toggle/);
  assert.match(renderSource, /setEquipmentSpecBlockOpen\(state, blockKey, true\)/);
  assert.match(renderSource, /data-equipment-move-row/);
  assert.doesNotMatch(renderSource, /handleDetailCellKeydown/);
  assert.doesNotMatch(renderSource, /equipmentDetailCell/);
  assert.doesNotMatch(renderSource, /focusPendingDetailCell/);
  assert.doesNotMatch(renderSource, /data-equipment-detail-cell/);
  assert.match(renderSource, /data-equipment-delete-card/);
  assert.match(renderSource, /async function deleteDraft/);
  assert.doesNotMatch(renderSource, /data-equipment-board-rate/);
  assert.doesNotMatch(renderSource, /data-equipment-board-progress/);
  assert.doesNotMatch(renderSource, /정비 이력 · 상세 정보 · 첨부 문서/);
  assert.match(renderSource, /syncStarterFromForm\(root, state\)/);
  assert.match(renderSource, /data-equipment-card-start-submit/);
  assert.match(renderSource, /if \(hasPhoto\) \{[\s\S]+data-equipment-photo-card is-locked/);
  assert.match(renderSource, /data-equipment-photo-revert/);
  assert.match(renderSource, /data-equipment-history-photo-select/);
  assert.match(renderSource, /data-equipment-photo-attach-key/);
  const photoCardSource = renderSource.slice(
    renderSource.indexOf('function renderPhotoCard'),
    renderSource.indexOf('function getStartDraft')
  );
  const hasPhotoBranch = photoCardSource.match(/if \(hasPhoto\) \{[\s\S]*?\r?\n\s*\}\r?\n\s*return `/)?.[0] || '';
  assert.doesNotMatch(hasPhotoBranch, /data-equipment-photo-attach-key/);
  assert.match(photoCardSource.slice(hasPhotoBranch.length), /data-equipment-photo-attach-key/);
  assert.doesNotMatch(renderSource, /card\.addEventListener\('click'[\s\S]+input\.click/);
  assert.doesNotMatch(renderSource, /card\.addEventListener\('keydown'[\s\S]+input\.click/);
  assert.match(renderSource, /data-equipment-history-photo-paste/);
  assert.match(renderSource, /data-equipment-history-photo-attachment-key/);
  assert.match(renderSource, /getPhotoFileFromClipboardData/);
  assert.match(renderSource, /clipboardData/);
  assert.match(renderSource, /navigator\?\.clipboard/);
  assert.doesNotMatch(renderSource, /isEventTargetInsideRoot/);
  assert.match(renderSource, /applyEquipmentHistoryPhotoFile/);
  assert.match(renderSource, /function enqueueEquipmentHistoryPhotoUpload/);
  assert.match(renderSource, /state\.photoUploadPromise/);
  assert.match(renderSource, /applyEquipmentHistoryPhotoFileNow/);
  assert.match(renderSource, /const previousPhoto = getDraftPhotoSnapshot\(draft\)/);
  assert.match(renderSource, /applyDraftPhotoSnapshot\(draft, previousPhoto\)/);
  assert.match(renderSource, /getEquipmentHistoryPhotoAttachmentFailureMessage\(error\)/);
  assert.match(renderSource, /file_too_large/);
  assert.match(renderSource, /unsupported_type/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-edit-toggle/);
  assert.doesNotMatch(renderSource, /setPhotoCropEditorMode/);
  assert.doesNotMatch(renderSource, /photoCropEditing/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-thumb-capture/);
  assert.match(renderSource, /<span>되돌리기<\/span>/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-crop-reset/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_WIDTH\s*=\s*1600/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_HEIGHT\s*=\s*500/);
  assert.match(renderSource, /1600 x 500/);
  assert.match(renderSource, /1600x500\.jpg/);
  assert.match(renderSource, /async function normalizeEquipmentPhotoAttachment/);
  assert.match(renderSource, /getNormalizedEquipmentPhotoFileName/);
  assert.doesNotMatch(renderSource, /function captureMainPhotoThumb/);
  assert.match(renderSource, /photoThumbDataUrl/);
  const boardPhotoSource = renderSource.match(/function getBoardPhotoSrc\(item\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.doesNotMatch(boardPhotoSource, /photoThumbDataUrl/);
  assert.match(boardPhotoSource, /photoPreviewUrl/);
  assert.match(
    renderSource,
    /const scale = Math\.min\([\s\S]+EQUIPMENT_PHOTO_TARGET_WIDTH \/ image\.naturalWidth[\s\S]+EQUIPMENT_PHOTO_TARGET_HEIGHT \/ image\.naturalHeight/
  );
  assert.match(renderSource, /context\.drawImage\([\s\S]+targetX[\s\S]+targetY[\s\S]+targetWidth[\s\S]+targetHeight/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-frame/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-crop-box/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-thumb-status/);
  assert.match(dataCssSource, /data-equipment-photo-placeholder-actions/);
  assert.match(dataCssSource, /data-equipment-photo-paste/);
  assert.match(
    dataCssSource,
    /data-equipment-photo-attach-key[\s\S]+position:\s*absolute[\s\S]+left:\s*10px[\s\S]+top:\s*10px/
  );
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-card\.is-photo-editing/);
  assert.match(formSource, /photoThumbDataUrl:\s*api\.normalizeText\(source\.photoThumbDataUrl\)/);
  assert.match(formSource, /EQUIPMENT_PHOTO_ATTACHMENT_KEY/);
  assert.match(
    formSource,
    /photoAttachmentKey:\s*api\.normalizeText\(source\.photoAttachmentKey \|\| source\.photoAttachmentId\)/
  );
  assert.match(modelSource, /photoThumbDataUrl:\s*normalizeText\(item\?\.photoThumbDataUrl\)/);
  assert.match(
    modelSource,
    /photoAttachmentKey:\s*normalizeText\(item\?\.photoAttachmentKey \|\| item\?\.photoAttachmentId\)/
  );
  assert.match(storageSource, /rowId:\s*photoAttachmentKey/);
  assert.match(storageSource, /attachmentKey:\s*photoAttachmentKey/);
  assert.doesNotMatch(renderSource, /async function autoSaveDraft/);
  assert.match(renderSource, /cleanupQueuedEquipmentHistoryPhotoDocuments/);
  assert.match(renderSource, /async function revertPhoto/);
  assert.match(renderSource, /detailRows\.length <= 1/);
  assert.match(renderSource, /async function cycleBoardCardStatus/);
  assert.match(renderSource, /data-equipment-cycle-status-card/);
  assert.match(
    renderSource,
    /persistEquipmentHistoryPayload\(data, nextPayload, 'equipment_history_payload_status_failed'\)/
  );
  assert.match(renderSource, /bindPhotoPreview\(root, state, data, redraw\)/);
});

test('equipment-history attachment UI hides repeated file labels and exposes saved downloads beside delete', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const savedHtml = api.renderCompactDocumentEditor([
    { title: 'same-file.pdf', fileName: 'same-file.pdf', documentId: 'doc id/1' },
  ]);
  const pendingHtml = api.renderCompactDocumentEditor([
    { title: '새 문서', pendingFile: { name: 'pending.pdf' }, fileName: 'pending.pdf' },
  ]);

  assert.match(savedHtml, /value="same-file\.pdf"/);
  assert.match(savedHtml, /class="data-equipment-document-file-name"><\/span>/);
  assert.match(savedHtml, /href="\/api\/files\/doc%20id%2F1\/download"/);
  assert.match(savedHtml, /class="data-equipment-document-download"[\s\S]+class="data-equipment-document-remove"/);
  assert.doesNotMatch(pendingHtml, /data-equipment-document-download/);
  assert.match(pendingHtml, /class="data-equipment-document-file-name">pending\.pdf<\/span>/);
});
