import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adapterSource,
  dataCssSource,
  equipmentHistoryStyleSource,
  modelSource,
  renderSource,
} from './support/equipment-history-render-harness.js';

test('equipment-history board source preserves dense responsive ordering filtering and history contracts', () => {
  assert.match(renderSource, /data-equipment-board-toolbar/);
  assert.match(
    renderSource,
    /data-equipment-board-toolbar[\s\S]+renderBoardSummary\(activeSummary, state\)[\s\S]+renderBoardControls\(boardGroups, state\)/
  );
  assert.doesNotMatch(renderSource, /function renderBoardStatusOverview/);
  assert.match(dataCssSource, /data-equipment-board-team-title/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+display:\s*grid/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+gap:\s*10px/);
  assert.match(
    dataCssSource,
    /data-equipment-board-section[\s\S]+padding:\s*0 0 12px 10px[\s\S]+border-left:\s*3px solid color-mix\(in srgb,\s*var\(--equipment-team-color\) 24%,\s*#d7e2ef\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-section \+ \.data-equipment-board-section[\s\S]+margin-top:\s*10px[\s\S]+padding-top:\s*12px[\s\S]+border-top:\s*1px solid #e6edf5/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-section h3[\s\S]+margin:\s*8px 0 0[\s\S]+padding:\s*6px 8px[\s\S]+background:\s*color-mix\(in srgb,\s*var\(--equipment-team-color\) 5%,\s*#ffffff\)[\s\S]+font-size:\s*0\.98rem/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-card-row[\s\S]+grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(240px,\s*1fr\)\)/
  );
  assert.match(dataCssSource, /data-equipment-board-room-icon[\s\S]+width:\s*30px[\s\S]+height:\s*30px/);
  assert.match(dataCssSource, /data-equipment-board-room-count[\s\S]+min-height:\s*22px[\s\S]+font-weight:\s*900/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-room-badge/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+margin-top:\s*0/);
  assert.match(dataCssSource, /data-equipment-detail-groups[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(
    dataCssSource,
    /data-equipment-detail-items-grid[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-detail-items-grid\.is-categorized[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/
  );
  assert.match(dataCssSource, /data-equipment-detail-category-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-spec-block-items[\s\S]+grid-auto-flow:\s*column/);
  assert.match(
    dataCssSource,
    /data-equipment-spec-block-items[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-spec-block-items[\s\S]+grid-template-rows:\s*repeat\(4,\s*minmax\(0,\s*auto\)\)/
  );
  assert.match(dataCssSource, /data-equipment-spec-block[\s\S]+border:\s*1px solid #d8e5f2/);
  assert.match(dataCssSource, /data-equipment-spec-block-actions[\s\S]+display:\s*none/);
  assert.match(
    dataCssSource,
    /data-equipment-spec-block\.is-managing\s+\.data-equipment-spec-block-actions[\s\S]+display:\s*inline-flex/
  );
  assert.match(dataCssSource, /data-equipment-spec-row-actions[\s\S]+display:\s*none/);
  assert.match(
    dataCssSource,
    /data-equipment-spec-block\.is-managing\s+\.data-equipment-spec-row-actions[\s\S]+display:\s*inline-flex/
  );
  assert.match(dataCssSource, /data-equipment-field-label-input[\s\S]+background:\s*#f3f7fc/);
  assert.match(
    dataCssSource,
    /@media \(max-width:\s*780px\)[\s\S]+data-equipment-detail-items-grid[\s\S]+grid-template-columns:\s*1fr/
  );
  assert.match(
    dataCssSource,
    /@media \(max-width:\s*780px\)[\s\S]+data-equipment-detail-category-grid[\s\S]+grid-template-columns:\s*1fr/
  );
  assert.match(
    dataCssSource,
    /@media \(max-width:\s*780px\)[\s\S]+data-equipment-spec-block-row[\s\S]+grid-template-columns:\s*1fr/
  );
  assert.doesNotMatch(dataCssSource, /data-equipment-bottom-grid,\s*[\r\n\s]*\.data-equipment-detail-groups/);
  assert.doesNotMatch(dataCssSource, /data-equipment-detail-table th:first-child/);
  assert.match(dataCssSource, /data-equipment-top-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-top-grid\s+\.data-equipment-photo-card[\s\S]+aspect-ratio:\s*16 \/ 5/);
  const titleColumns = equipmentHistoryStyleSource.match(/data-equipment-photo-title-row\s*\{[^}]*grid-template-columns:\s*([^;]+)/)?.[1] || '';
  assert.equal((titleColumns.match(/minmax\(/g) || []).length, 4);
  assert.match(equipmentHistoryStyleSource, /@media \(max-width:\s*1180px\)[\s\S]+data-equipment-photo-title-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(equipmentHistoryStyleSource, /@media \(max-width:\s*780px\)[\s\S]+data-equipment-photo-title-row\s*\{[^}]*grid-template-columns:\s*(?:minmax\(0,\s*1fr\)|1fr)/);
  assert.match(
    dataCssSource,
    /data-equipment-photo-title-row[\s\S]+border:\s*0[\s\S]+background:\s*transparent[\s\S]+padding:\s*0/
  );
  assert.match(dataCssSource, /data-equipment-title-field[\s\S]+--equipment-title-value-left:\s*12px/);
  assert.match(dataCssSource, /data-equipment-title-team-field[\s\S]+position:\s*relative/);
  assert.match(dataCssSource, /data-equipment-title-team-icon[\s\S]+position:\s*absolute[\s\S]+left:\s*12px/);
  assert.match(dataCssSource, /data-equipment-title-team-icon[\s\S]+color:\s*var\(--equipment-team-color\)/);
  assert.match(dataCssSource, /data-equipment-title-team-icon svg[\s\S]+width:\s*18px[\s\S]+height:\s*18px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-title-label/);
  assert.match(dataCssSource, /data-equipment-title-team-field[\s\S]+--equipment-title-value-left:\s*50px/);
  assert.match(
    dataCssSource,
    /data-equipment-photo-title-row\s+\.data-equipment-title-input[\s\S]+font-size:\s*1\.13rem/
  );
  assert.match(
    dataCssSource,
    /data-equipment-photo-title-row\s+\.data-equipment-title-field\s+\.data-equipment-title-input[\s\S]+padding-left:\s*var\(--equipment-title-value-left\)/
  );
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-info-card/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-info-grid/);
  assert.match(dataCssSource, /data-equipment-photo-preview[\s\S]+object-fit:\s*contain/);
  assert.match(dataCssSource, /data-equipment-photo-revert/);
  assert.match(dataCssSource, /data-equipment-photo-card:hover\s+\.data-equipment-photo-revert/);
  assert.match(dataCssSource, /opacity:\s*0/);
  assert.match(dataCssSource, /--equipment-team-color/);
  assert.match(dataCssSource, /data-equipment-board-team-icon/);
  assert.match(dataCssSource, /data-equipment-board-team-icon svg[\s\S]+width:\s*18px[\s\S]+height:\s*18px/);
  assert.match(renderSource, /data-equipment-board-team-icon/);
  assert.match(renderSource, /function getEquipmentTeamIconSvg/);
  assert.match(renderSource, /M5 9\.2L12 12\.8L19 9\.2/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+background:\s*#ffffff/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+--equipment-card-separator:\s*#e6edf5/);
  assert.match(
    dataCssSource,
    /data-equipment-board-card[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]+grid-template-rows:\s*auto auto auto[\s\S]+min-height:\s*178px/
  );
  assert.match(
    equipmentHistoryStyleSource,
    /data-equipment-index-summary[\s\S]+repeat\(4,\s*minmax\(0,\s*1fr\)\) auto/
  );
  assert.match(equipmentHistoryStyleSource, /data-equipment-board-global-actions[\s\S]+grid-column:\s*auto/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-status-actions/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-status-cycle/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-status-set/);
  assert.match(dataCssSource, /data-equipment-board-team-title[\s\S]+flex-wrap:\s*wrap/);
  assert.match(
    dataCssSource,
    /data-equipment-board-room-title-main[\s\S]+column-gap:\s*9px[\s\S]+row-gap:\s*6px[\s\S]+flex:\s*1 1 auto[\s\S]+flex-wrap:\s*wrap/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-room-name[\s\S]+min-width:\s*0[\s\S]+text-overflow:\s*ellipsis[\s\S]+white-space:\s*nowrap/
  );
  assert.match(dataCssSource, /data-equipment-board-room-add-button[\s\S]+flex:\s*0 0 auto/);
  assert.match(
    dataCssSource,
    /data-equipment-board-card-media[\s\S]+width:\s*100%[\s\S]+aspect-ratio:\s*3\.3 \/ 1[\s\S]+border-bottom:\s*1px solid var\(--equipment-card-separator\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-card-media img[\s\S]+width:\s*100%[\s\S]+height:\s*100%[\s\S]+object-fit:\s*contain[\s\S]+object-position:\s*center 56%[\s\S]+transform:\s*translateY\(3px\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-card-main[\s\S]+min-height:\s*48px[\s\S]+border-bottom:\s*1px solid var\(--equipment-card-separator\)/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-card-main strong[\s\S]+font-size:\s*1\.14rem[\s\S]+text-align:\s*center/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-card-actions[\s\S]+padding:\s*10px 0 0[\s\S]+background:\s*linear-gradient/
  );
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+cursor:\s*pointer/);
  assert.match(dataCssSource, /data-equipment-board-card:hover,\s*[\r\n\s]*\.data-equipment-board-card:focus-visible/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-running[\s\S]+--equipment-card-status-color:\s*#16a34a/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-stop[\s\S]+--equipment-card-status-color:\s*#dc2626/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-check[\s\S]+--equipment-card-status-color:\s*#64748b/);
  assert.match(dataCssSource, /data-equipment-board-status-button/);
  assert.match(
    dataCssSource,
    /data-equipment-board-status-button[\s\S]+width:\s*100%[\s\S]+min-height:\s*42px[\s\S]+border-radius:\s*7px/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-chip\.is-running[\s\S]+background:\s*#dcfce7[\s\S]+color:\s*#166534/
  );
  assert.match(dataCssSource, /data-equipment-board-chip\.is-stop[\s\S]+background:\s*#fee2e2[\s\S]+color:\s*#991b1b/);
  assert.match(dataCssSource, /data-equipment-board-chip\.is-check[\s\S]+background:\s*#fef3c7[\s\S]+color:\s*#92400e/);
  assert.match(dataCssSource, /data-equipment-board-team-count/);
  assert.match(dataCssSource, /data-equipment-board-add-button[\s\S]+min-width:\s*42px[\s\S]+height:\s*28px/);
  assert.match(dataCssSource, /data-equipment-board-empty-add[\s\S]+min-height:\s*40px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-add-card/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle[\s\S]+#eff6ff/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-team-focus/);
  assert.match(dataCssSource, /data-equipment-board-card-tools/);
  assert.match(dataCssSource, /data-equipment-board-card-tools[\s\S]+display:\s*none/);
  assert.match(
    dataCssSource,
    /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-card-tools[\s\S]+display:\s*grid/
  );
  assert.match(dataCssSource, /data-equipment-board-room-tools[\s\S]+display:\s*none/);
  assert.match(
    dataCssSource,
    /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-room-tools[\s\S]+display:\s*inline-grid/
  );
  assert.match(
    dataCssSource,
    /data-equipment-board-column\.is-ordering[\s\S]+\.data-equipment-board-card-actions[\s\S]+display:\s*none/
  );
  assert.doesNotMatch(
    dataCssSource,
    /data-equipment-board-column\.is-ordering[\s\S]+\.data-equipment-board-status-actions/
  );
  assert.match(dataCssSource, /data-equipment-board-order-button/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-open-button/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-card button\s*\{/);
  assert.match(renderSource, /EQUIPMENT_BOARD_STATUS_CYCLE/);
  assert.match(renderSource, /function getBoardBulkStatusState/);
  assert.match(renderSource, /function renderBoardBulkStatusPanel/);
  assert.match(renderSource, /function renderBoardGlobalStatusActions/);
  assert.match(
    renderSource,
    /function renderBoardSummary\(summary, state = null\)[\s\S]+renderBoardGlobalStatusActions\(state\)/
  );
  assert.match(renderSource, /data-equipment-bulk-actions/);
  assert.match(renderSource, /data-equipment-bulk-status-toggle/);
  assert.match(renderSource, /data-equipment-bulk-status-team/);
  assert.match(renderSource, /data-equipment-bulk-status-room/);
  assert.match(renderSource, /data-equipment-bulk-status-value/);
  assert.match(renderSource, /data-equipment-bulk-status-apply/);
  assert.match(renderSource, /<span>전체 적용<\/span>/);
  assert.match(renderSource, /async function applyBoardStatus/);
  assert.doesNotMatch(renderSource, /function renderBoardStatusActionGroup/);
  assert.doesNotMatch(renderSource, /function getBoardStatusCycleTargetStatus/);
  assert.doesNotMatch(renderSource, /async function cycleBoardStatus/);
  assert.doesNotMatch(renderSource, /data-equipment-cycle-board-status/);
  assert.doesNotMatch(renderSource, /data-equipment-status-scope/);
  assert.doesNotMatch(renderSource, /data-equipment-board-status-actions/);
  assert.doesNotMatch(renderSource, /data-equipment-board-status-cycle/);
  assert.doesNotMatch(renderSource, /data-equipment-set-board-status/);
  assert.match(renderSource, /state\.pendingAddRoom = button\.dataset\.equipmentAddRoom/);
  assert.match(renderSource, /data-equipment-order-toggle-team/);
  assert.match(renderSource, /data-equipment-board-team-edit-toggle/);
  assert.match(renderSource, /data-equipment-edit-toggle-team/);
  assert.match(renderSource, /aria-pressed="\$\{isEditing \? 'true' : 'false'\}"/);
  assert.match(renderSource, /fas fa-pen/);
  assert.match(renderSource, /collapsedTeams:\s*\{\}/);
  assert.match(renderSource, /function getBoardCollapsedTeams/);
  assert.match(renderSource, /function isBoardTeamCollapsed/);
  assert.match(renderSource, /function setBoardTeamCollapsed/);
  assert.match(renderSource, /data-equipment-team-collapse-toggle/);
  assert.match(renderSource, /data-equipment-team-content/);
  assert.match(renderSource, /aria-controls="\$\{teamContentId\}"/);
  assert.match(renderSource, /function syncBoardTeamCollapseUi/);
  assert.match(renderSource, /content\.hidden = isCollapsed/);
  assert.match(
    renderSource,
    /setBoardTeamCollapsed\(state, button\.dataset\.equipmentTeamCollapseToggle, isCollapsed\)/
  );
  assert.match(renderSource, /data-equipment-move-room/);
  assert.match(renderSource, /async function moveBoardRoom/);
  assert.doesNotMatch(renderSource, /data-equipment-order-toggle-card/);
  assert.doesNotMatch(renderSource, /data-equipment-focus-team/);
  assert.doesNotMatch(renderSource, /equipmentFocusTeam/);
  assert.match(renderSource, /\[data-equipment-board-card\]\[data-equipment-open-card\]/);
  assert.match(renderSource, /isEquipmentBoardCardInteractiveTarget\(event\.target\)/);
  assert.match(renderSource, /openEquipmentBoardCard\(data, state, card\.dataset\.equipmentOpenCard, redraw\)/);
  assert.match(renderSource, /function resetEquipmentHistoryBoardState/);
  assert.match(renderSource, /state\.filters = \{ team: '', status: '', search: '' \}/);
  assert.match(renderSource, /function renderEquipmentHistoryFullscreenButton/);
  assert.match(renderSource, /data-equipment-fullscreen-toggle/);
  assert.match(
    renderSource,
    /addEventListener\('input'[\s\S]*applyBoardSearchFilter\(root, state, redraw, event\.target\)/
  );
  assert.match(renderSource, /function highlightBoardSearchText/);
  assert.match(renderSource, /<strong>\$\{highlightBoardSearchText\(displayName, state\)\}<\/strong>/);
  assert.match(renderSource, /function toggleEquipmentHistoryFullscreen/);
  assert.match(renderSource, /requestFullscreen/);
  assert.match(renderSource, /fullscreenchange/);
  assert.match(renderSource, /is-data-equipment-browser-fullscreen/);
  assert.match(dataCssSource, /data-equipment-filter-actions/);
  assert.match(dataCssSource, /data-equipment-fullscreen-toggle/);
  assert.match(dataCssSource, /data-equipment-board-card-main mark\s*\{[\s\S]*background:\s*#fef08a/);
  assert.match(dataCssSource, /#content-container\.is-data-equipment-browser-fullscreen/);
  assert.match(renderSource, /function pushEquipmentHistoryCardHistory/);
  assert.match(renderSource, /browser\.pushHistoryState/);
  assert.match(renderSource, /browser\.replaceHistoryState/);
  assert.match(renderSource, /browser\.addPopStateListener/);
  assert.match(renderSource, /applyEquipmentHistoryBrowserState\(workingData, state, event\?\.state, redraw\)/);
  assert.match(adapterSource, /function pushHistoryState/);
  assert.match(adapterSource, /function replaceHistoryState/);
  assert.match(adapterSource, /function addPopStateListener/);
  assert.doesNotMatch(renderSource, /data-equipment-board-open-button/);
  assert.match(renderSource, /aria-hidden="true"/);
  assert.match(renderSource, /function syncBoardTeamEditUi/);
  assert.match(renderSource, /column\.classList\.toggle\('is-ordering', isEditing\)/);
  assert.match(renderSource, /column\.classList\.toggle\('is-editing', isEditing\)/);
  assert.match(renderSource, /async function cycleBoardCardStatus/);
  assert.match(renderSource, /async function moveBoardCard/);
  assert.match(renderSource, /buildEquipmentListWithRecord/);
  assert.match(modelSource, /sourceIndex:\s*index/);
  assert.doesNotMatch(modelSource, /getEquipmentStatusSortIndex/);
  assert.doesNotMatch(modelSource, /equipment:\s*equipment\.slice\(\)\.sort\(compareEquipmentHistoryItems\)/);
  assert.match(renderSource, /data-equipment-title-pair/);
  assert.match(renderSource, /data-equipment-title-team/);
  assert.match(renderSource, /data-equipment-title-room/);
  assert.match(renderSource, /data-equipment-title-name/);
  const footerSource =
    renderSource.match(/function renderFooter\([\s\S]*?\n {4}function renderEquipmentRecentUpdated/)?.[0] || '';
  assert.doesNotMatch(footerSource, /마지막 업데이트/);
  assert.doesNotMatch(footerSource, /updatedAt|data\.meta/);
});
