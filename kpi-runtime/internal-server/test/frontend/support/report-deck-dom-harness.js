import assert from 'node:assert/strict';

import { createReportDeckControls } from './report-deck-controls-harness.js';
import { createReportDeckPlanFixture, makeClassList } from './report-deck-plan-harness.js';

export function createReportDeckContainer(options = {}) {
  const controls = createReportDeckControls(options);
  const {
    listeners,
    status,
    counter,
    monthSelect,
    editButton,
    undoDeleteButton,
    fullscreenButton,
    editFullscreenButton,
    contentsToggleButton,
    saveMenu,
    saveMenuPanel,
    saveMenuToggleButton,
    exportButton,
    printButton,
    productionContentsJumpButton,
    reportReturnButton,
    overviewDialogFields,
    overviewTeamRow,
    overviewCustomTeamRow,
    overviewDialog,
    overviewKindButtons,
    overviewSaveButton,
    overviewCancelButton,
    memoTeamSelect,
    memoMetricSelect,
    memoLines,
    memoCandidates,
    memoManualInput,
    memoManualAddButton,
    memoNotepad,
    memoNotepadFontSizeButton,
    memoNotepadFontSizeInput,
    memoNotepadColorButton,
    memoNotepadColorClearButton,
    memoDialog,
    memoPreview,
    memoOverviewWindowListeners,
    reportOwnerDocument,
    memoOverviewDialog,
    memoOverviewDragHandle,
    memoDialogDragHandle,
    memoTargets,
    memoContents,
    analysisColumns,
    wasteLayouts,
    memoLineInput,
    memoManualLineInput,
    memoLineMoveButton,
    memoLineFontSizeButton,
    memoManualLineFontSizeButton,
    memoLineColorButton,
    memoLineColorClearButton,
  } = controls;
  const stage = {
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
  let slides = [];
  const plan = createReportDeckPlanFixture({ getSlide: (index) => slides[index] || null });
  const {
    dateInput,
    planCountSelects,
    planAddSlotButtons,
    addPageButton,
    planSlotCells,
    planDeleteButtons,
    planRowTables,
    safetyTeamSelect,
    safetyAddControl,
    safetyTeamMenu,
    safetyAddButton,
    safetyTeamOptionButtons,
    planRowLabels,
    safetyTableMoveButtons,
    planImages,
    planImagePlaceholders,
    planImageSourceLabels,
    planImagePasteButtons,
    planSlides,
    optionalContentItems,
    planImageFrames,
    planImageInputs,
    planImageUploadButtons,
    planImageClearButtons,
    autoChartPlots,
  } = plan;
  const chartHighlightButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightToggle: 'gas',
    },
    textContent: '',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-toggle]' ? this : null;
    },
  };
  const chartHighlightRangeButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightToggle: 'gas',
      reportChartHighlightMode: 'range',
    },
    textContent: '',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-toggle]' ? this : null;
    },
  };
  const chartHighlightResetButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightReset: 'gas',
    },
    textContent: '\u21B6',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-reset]' ? this : null;
    },
  };
  const chartHighlightPoint = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightMonth: '2025-12',
    },
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-point]' ? this : null;
    },
  };
  const chartHighlightSecondPoint = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightMonth: '2026-01',
    },
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-point]' ? this : null;
    },
  };
  const fields = [
    'title',
    'reportDate',
    'department',
    'preparedBy',
    'reviewedBy1',
    'reviewedBy2',
    'reviewedBy3',
    'approvedBy',
    'contentsItem4',
    'contentsItem5',
    'slide3Title',
    'slide4Title',
    'slide5Title',
    'slide6Title',
    'slide7Title',
    'productionTeam1ContentsTitle',
    'productionTeam1ContentsItem1',
    'productionTeam1ContentsItem2',
    'productionTeam1ContentsItem3',
    'productionTeam1ContentsItem4',
    'slide8Section',
    'slide8Title',
    'slide9Section',
    'slide9Title',
    'slide10Section',
    'slide10Title',
    'slide8Item1Text',
    'slide8Item2Text',
    'slide8Item3Text',
    'slide8Item4Text',
  ].map((key) => ({
    dataset: {
      reportField: key,
      ...(key.match(/^slide8Item([1-4])Text$/)
        ? { reportSlide8Overview: key.match(/^slide8Item([1-4])Text$/)[1] }
        : {}),
    },
    textContent: '',
    contentEditable: 'false',
    setAttribute(name, value) {
      this[name] = value;
    },
    blurCount: 0,
    blur() {
      this.blurCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-slide8-overview]' && this.dataset.reportSlide8Overview) return this;
      if (selector === `[data-report-field="${key}"]`) return this;
      return selector === '[data-report-field]' ? this : null;
    },
  }));
  const fieldRefs = ['contentsItem4', 'productionTeam1ContentsItem1'].map((key) => ({
    dataset: { reportFieldRef: key },
    textContent: '',
  }));
  const root = {
    dataset: {},
    fullscreenRequestCount: 0,
    ownerDocument: reportOwnerDocument,
    requestFullscreen() {
      this.fullscreenRequestCount += 1;
      this.ownerDocument.fullscreenElement = this;
    },
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    querySelector(selector) {
      if (selector === '[data-report-save-status]') return status;
      if (selector === '[data-report-month-select]') return monthSelect;
      if (selector === '[data-report-overview-dialog]') return overviewDialog;
      if (selector === '[data-report-memo-dialog]') return memoDialog;
      if (selector === '[data-report-memo-overview-dialog]') return memoOverviewDialog;
      if (selector === '[data-report-memo-key="slide3GasMemo"]') return memoTargets[0];
      if (selector === '[data-report-slide-counter]') return counter;
      if (selector === '[data-report-stage]') return stage;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      if (selector === '[data-report-safety-team-select]') return safetyTeamSelect;
      if (selector === '[data-report-save-menu]') return saveMenu;
      if (selector === '[data-report-save-menu-toggle]') return saveMenuToggleButton;
      if (selector === '[data-report-save-menu-panel]') return saveMenuPanel;
      const frameMatch = selector.match(/^\[data-report-plan-image-frame="([^"]+)"\]$/);
      if (frameMatch) return planImageFrames[frameMatch[1]] || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-report-field]') return fields;
      if (selector === '[data-report-field-ref]') return fieldRefs;
      if (selector === '[data-report-date-input]') return [dateInput];
      if (selector === '[data-report-plan-count-select]') return planCountSelects;
      if (selector === '[data-report-plan-slide]') return planSlides;
      if (selector === '[data-report-plan-image]') return planImages;
      if (selector === '[data-report-plan-image-frame]') return Object.values(planImageFrames);
      if (selector === '[data-report-plan-add-slot], [data-report-plan-image-input], [data-report-plan-image-upload]')
        return [...planAddSlotButtons, ...planImageInputs, ...planImageUploadButtons];
      if (selector === '[data-report-plan-add-slot]') return planAddSlotButtons;
      if (selector === '[data-report-safety-add-control]') return [safetyAddControl];
      if (selector === '[data-report-safety-team-select]') return [safetyTeamSelect];
      if (selector === '[data-report-safety-add-toggle]') return [safetyAddButton];
      if (selector === '[data-report-safety-team-option]') return safetyTeamOptionButtons;
      if (selector === '[data-report-safety-table-move]') return safetyTableMoveButtons;
      if (selector === '[data-report-add-page]') return [addPageButton];
      if (selector === '[data-report-memo-key]') return memoTargets;
      if (selector === '[data-report-memo-content]') return memoContents;
      if (selector === '.report-bukjeong-analysis-column, .report-analysis-column') return analysisColumns;
      if (selector === '.report-waste-auto-layout') return wasteLayouts;
      if (selector === '[data-report-edit-toggle]') return [editButton];
      if (selector === '[data-report-chart-highlight-toggle]') return [chartHighlightButton, chartHighlightRangeButton];
      if (selector === '[data-report-chart-highlight-reset]') return [chartHighlightResetButton];
      if (selector === '[data-report-chart-highlight-point]') return [chartHighlightPoint, chartHighlightSecondPoint];
      if (selector === '[data-report-slide-page]') return slides;
      if (selector === '[data-report-slide-target]') return navButtons;
      if (selector === '[data-report-return-hq]') return [reportReturnButton];
      if (selector === '[data-report-undo-delete]') return [undoDeleteButton];
      if (selector === '[data-report-edit-fullscreen-toggle]') return [];
      if (selector === '[data-report-contents-toggle]') return [];
      if (selector === '[data-report-optional-content]') return optionalContentItems;
      const autoChartMatch = selector.match(/^\[data-report-auto-chart-plot="([^"]+)"\]$/);
      if (autoChartMatch) return autoChartPlots[autoChartMatch[1]] ? [autoChartPlots[autoChartMatch[1]]] : [];
      if (selector === '[data-report-waste-auto-chart-plot]') return [autoChartPlots.waste];
      return [];
    },
  };
  slides = Array.from({ length: 11 }, (_, index) => {
    const pageNumber = { textContent: '' };
    return {
      dataset: {
        reportSlidePage: String(index),
        reportSlideView: index < 2 ? 'hq' : 'public-works',
        ...(index === 8 ? { reportOptionalPage: 'slide8', reportDynamicPage: '0' } : {}),
        ...(index === 9 ? { reportOptionalPage: 'slide9', reportDynamicPage: '0' } : {}),
        ...(index === 10 ? { reportOptionalPage: 'slide10', reportDynamicPage: '0' } : {}),
      },
      hidden: false,
      pageNumber,
      classList: makeClassList(),
      setAttribute(name, value) {
        this[name] = value;
      },
      querySelector(selector) {
        return selector === '[data-report-page-number]' && index >= 2 ? pageNumber : null;
      },
    };
  });
  const navButtons = Array.from({ length: 11 }, (_, index) => ({
    dataset: { reportSlideTarget: String(index) },
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-slide-target]' ? this : null;
    },
  }));
  return {
    root,
    status,
    counter,
    monthSelect,
    stage,
    editButton,
    undoDeleteButton,
    fullscreenButton,
    editFullscreenButton,
    contentsToggleButton,
    saveMenu,
    saveMenuPanel,
    saveMenuToggleButton,
    exportButton,
    printButton,
    chartHighlightButton,
    chartHighlightRangeButton,
    chartHighlightResetButton,
    chartHighlightPoint,
    chartHighlightSecondPoint,
    productionContentsJumpButton,
    reportReturnButton,
    overviewDialog,
    overviewTeamRow,
    overviewCustomTeamRow,
    overviewDialogFields,
    overviewKindButtons,
    overviewSaveButton,
    overviewCancelButton,
    memoTeamSelect,
    memoMetricSelect,
    memoLines,
    memoCandidates,
    memoManualInput,
    memoManualAddButton,
    memoNotepad,
    memoNotepadFontSizeButton,
    memoNotepadFontSizeInput,
    memoNotepadColorButton,
    memoNotepadColorClearButton,
    memoPreview,
    memoDialog,
    memoDialogDragHandle,
    memoOverviewDialog,
    memoOverviewDragHandle,
    memoOverviewWindowListeners,
    memoTargets,
    memoContents,
    analysisColumns,
    wasteLayouts,
    memoLineInput,
    memoManualLineInput,
    memoLineMoveButton,
    memoLineFontSizeButton,
    memoManualLineFontSizeButton,
    memoLineColorButton,
    memoLineColorClearButton,
    dateInput,
    planCountSelects,
    planAddSlotButtons,
    planSlides,
    addPageButton,
    planSlotCells,
    planDeleteButtons,
    planRowTables,
    planRowLabels,
    safetyTeamSelect,
    safetyAddControl,
    safetyTeamMenu,
    safetyAddButton,
    safetyTeamOptionButtons,
    safetyTableMoveButtons,
    planImages,
    planImagePlaceholders,
    planImageSourceLabels,
    planImagePasteButtons,
    planImageFrames,
    planImageInputs,
    planImageUploadButtons,
    planImageClearButtons,
    autoChartPlots,
    slides,
    navButtons,
    optionalContentItems,
    fields,
    fieldRefs,
    listeners,
    container: {
      querySelector(selector) {
        return selector === '[data-report-deck-editor]' ? root : null;
      },
    },
  };
}

export function getOptionalContentItems(deckDom, optionalPage) {
  return deckDom.optionalContentItems.filter((item) => item.dataset.reportOptionalContent === optionalPage);
}

export function assertOptionalContentHidden(deckDom, optionalPage, hidden) {
  const items = getOptionalContentItems(deckDom, optionalPage);
  assert.ok(items.length > 0, `${optionalPage} optional contents should exist`);
  items.forEach((item) => {
    assert.equal(item.hidden, hidden);
  });
}
