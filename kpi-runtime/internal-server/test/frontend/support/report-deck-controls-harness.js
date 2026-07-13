import { makeClassList } from './report-deck-plan-harness.js';

export function createReportDeckControls(options = {}) {
  const withMemoOverviewWindow = options.withMemoOverviewWindow === true;
  const listeners = {};
  const status = { dataset: {}, textContent: '', hidden: false };
  const counter = { textContent: '' };
  const monthSelect = {
    value: '',
    disabled: true,
    innerHTML: '',
    closest(selector) {
      return selector === '[data-report-month-select]' ? this : null;
    },
  };
  const editButton = {
    dataset: {},
    textContent: '',
    classList: {
      active: false,
      toggle(name, active) {
        if (name === 'is-active') this.active = active;
      },
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-edit-toggle]' ? this : null;
    },
  };
  const undoDeleteButton = {
    dataset: {},
    disabled: true,
    title: '',
    closest(selector) {
      return selector === '[data-report-undo-delete]' ? this : null;
    },
  };
  const fullscreenButton = {
    closest(selector) {
      return selector === '[data-report-fullscreen]' ? this : null;
    },
  };
  const editFullscreenButton = {
    dataset: {},
    title: '',
    hidden: false,
    classList: {
      active: false,
      toggle(name, active) {
        if (name === 'is-active') this.active = active;
      },
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-edit-fullscreen-toggle]' ? this : null;
    },
  };
  const contentsToggleButton = {
    dataset: {},
    title: '',
    hidden: true,
    classList: {
      active: false,
      toggle(name, active) {
        if (name === 'is-active') this.active = active;
      },
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-contents-toggle]' ? this : null;
    },
  };
  const saveMenu = {
    dataset: {},
    closest(selector) {
      return selector === '[data-report-save-menu]' ? this : null;
    },
  };
  const saveMenuPanel = {
    hidden: true,
  };
  const saveMenuToggleButton = {
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      if (selector === '[data-report-save-menu-toggle]') return this;
      if (selector === '[data-report-save-menu]') return saveMenu;
      return null;
    },
  };
  const exportButton = {
    closest(selector) {
      return selector === '[data-report-export-html]' ? this : null;
    },
  };
  const printButton = {
    closest(selector) {
      return selector === '[data-report-print-pdf]' ? this : null;
    },
  };
  const productionContentsJumpButton = {
    dataset: { reportJumpSlide: '0', reportJumpView: 'public-works' },
    closest(selector) {
      return selector === '[data-report-jump-slide]' ? this : null;
    },
  };
  const reportReturnButton = {
    hidden: true,
    dataset: { reportJumpSlide: '1', reportJumpView: 'hq' },
    closest(selector) {
      return selector === '[data-report-jump-slide]' || selector === '[data-report-return-hq]' ? this : null;
    },
  };
  const overviewDialogFields = {
    team: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
      closest(selector) {
        return selector === '[data-report-overview-team]' ? this : null;
      },
    },
    customTeam: {
      value: '',
      disabled: false,
      customValidity: '',
      reportValidityCount: 0,
      focusCount: 0,
      setCustomValidity(message) {
        this.customValidity = message;
      },
      reportValidity() {
        this.reportValidityCount += 1;
        return !this.customValidity;
      },
      focus() {
        this.focusCount += 1;
      },
      closest(selector) {
        return selector === '[data-report-overview-custom-team]' ? this : null;
      },
    },
    title: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    effect: { value: '' },
    hazard: {
      value: '미끄럼',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    kind: { value: 'cause' },
    detail: { value: '' },
    date: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    amount: {
      value: '',
      disabled: false,
      customValidity: '',
      reportValidityCount: 0,
      focusCount: 0,
      setCustomValidity(message) {
        this.customValidity = message;
      },
      reportValidity() {
        this.reportValidityCount += 1;
        return !this.customValidity;
      },
      focus() {
        this.focusCount += 1;
      },
      closest(selector) {
        return selector
          .split(',')
          .map((value) => value.trim())
          .includes('[data-report-overview-amount]')
          ? this
          : null;
      },
    },
    amountText: {
      value: '',
      disabled: false,
      closest(selector) {
        return selector
          .split(',')
          .map((value) => value.trim())
          .includes('[data-report-overview-amount-text]')
          ? this
          : null;
      },
    },
  };
  const overviewTeamRow = { hidden: false };
  const overviewCustomTeamRow = { hidden: true };
  const overviewDialog = {
    hidden: true,
    dataset: {},
    querySelector(selector) {
      if (selector === '[data-report-overview-custom-team-row]') return overviewCustomTeamRow;
      const match = selector.match(/^\[data-report-overview-([a-z-]+)\]$/);
      if (!match) return null;
      const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return overviewDialogFields[key] || null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-report-overview-team-row]') return [overviewTeamRow];
      if (selector === '[data-report-overview-kind-option]') return overviewKindButtons;
      return [];
    },
  };
  const overviewKindButtons = ['cause', 'purpose'].map((kind) => ({
    dataset: { reportOverviewKindOption: kind },
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-overview-kind-option]' ? this : null;
    },
  }));
  const overviewSaveButton = {
    closest(selector) {
      return selector === '[data-report-overview-save]' ? this : null;
    },
  };
  const overviewCancelButton = {
    closest(selector) {
      return selector === '[data-report-overview-cancel]' ? this : null;
    },
  };
  const memoTeamSelect = {
    value: 'team_01_01',
    closest(selector) {
      return selector === '[data-report-memo-team]' ? this : null;
    },
  };
  const memoMetricSelect = {
    value: 'production',
    innerHTML: '',
    closest(selector) {
      return selector === '[data-report-memo-metric]' ? this : null;
    },
  };
  const memoLines = { dataset: {}, innerHTML: '' };
  const memoCandidates = { innerHTML: '' };
  const memoManualInput = {
    value: '',
    closest(selector) {
      return selector === '[data-report-memo-manual-input]' ? this : null;
    },
  };
  const memoManualAddButton = {
    closest(selector) {
      return selector === '[data-report-memo-manual-add]' ? this : null;
    },
  };
  const memoNotepad = {
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-notepad]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoNotepadFontSizeButton = {
    dataset: { reportMemoNotepadFontSizeDelta: '1' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-font-size-delta]' ? this : null;
    },
  };
  const memoNotepadFontSizeInput = {
    value: '10.4',
    disabled: false,
    closest(selector) {
      return selector === '[data-report-memo-notepad-font-size-input]' ? this : null;
    },
  };
  const memoNotepadColorButton = {
    dataset: { reportMemoNotepadColor: 'red' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-color]' ? this : null;
    },
  };
  const memoNotepadColorClearButton = {
    dataset: { reportMemoNotepadColor: 'clear' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-color]' ? this : null;
    },
  };
  const memoDialog = {
    hidden: true,
    dataset: {},
    __reportMemoCandidates: [],
    style: {},
    classList: makeClassList(),
    offsetWidth: 360,
    offsetHeight: 220,
    getBoundingClientRect() {
      return {
        left: Number.parseFloat(this.style.left || '620') || 620,
        top: Number.parseFloat(this.style.top || '54') || 54,
        width: 360,
        height: 220,
      };
    },
    querySelector(selector) {
      if (selector === '[data-report-memo-team]') return memoTeamSelect;
      if (selector === '[data-report-memo-metric]') return memoMetricSelect;
      if (selector === '[data-report-memo-lines]') return memoLines;
      if (selector === '[data-report-memo-candidates]') return memoCandidates;
      if (selector === '[data-report-memo-manual-input]') return memoManualInput;
      if (selector === '[data-report-memo-notepad]') return memoNotepad;
      if (selector === '[data-report-memo-notepad-font-size-input]') return memoNotepadFontSizeInput;
      if (selector === '[data-report-memo-preview]') return memoPreview;
      return null;
    },
  };
  const memoPreview = { dataset: {}, innerHTML: '' };
  const memoOverviewWindowListeners = {};
  const memoOverviewWindow = {
    innerWidth: 1000,
    innerHeight: 700,
    addEventListener(type, listener) {
      memoOverviewWindowListeners[type] = listener;
    },
    removeEventListener(type, listener) {
      if (memoOverviewWindowListeners[type] === listener) {
        delete memoOverviewWindowListeners[type];
      }
    },
  };
  const reportOwnerDocument = {
    fullscreenElement: null,
    exitCount: 0,
    documentElement: {
      clientWidth: 1000,
      clientHeight: 700,
    },
    exitFullscreen() {
      this.exitCount += 1;
      this.fullscreenElement = null;
    },
  };
  if (withMemoOverviewWindow) {
    reportOwnerDocument.defaultView = memoOverviewWindow;
  }
  memoDialog.ownerDocument = reportOwnerDocument;
  const memoOverviewList = { innerHTML: '' };
  const memoOverviewDialog = {
    hidden: true,
    dataset: {},
    style: {},
    classList: makeClassList(),
    ownerDocument: reportOwnerDocument,
    offsetWidth: 320,
    offsetHeight: 200,
    getBoundingClientRect() {
      return {
        left: Number.parseFloat(this.style.left || '24') || 24,
        top: Number.parseFloat(this.style.top || '64') || 64,
        width: 320,
        height: 200,
      };
    },
    querySelector(selector) {
      if (selector === '[data-report-memo-overview-list]') return memoOverviewList;
      return null;
    },
  };
  const memoOverviewDragHandle = {
    pointerCaptures: [],
    releasedPointerCaptures: [],
    closest(selector) {
      if (selector === '[data-report-memo-overview-drag-handle]') return this;
      return null;
    },
    setPointerCapture(pointerId) {
      this.pointerCaptures.push(pointerId);
    },
    releasePointerCapture(pointerId) {
      this.releasedPointerCaptures.push(pointerId);
    },
  };
  const memoDialogDragHandle = {
    pointerCaptures: [],
    releasedPointerCaptures: [],
    closest(selector) {
      if (selector === '[data-report-memo-drag-handle]') return this;
      return null;
    },
    setPointerCapture(pointerId) {
      this.pointerCaptures.push(pointerId);
    },
    releasePointerCapture(pointerId) {
      this.releasedPointerCaptures.push(pointerId);
    },
  };
  const memoTargets = [
    {
      dataset: {
        reportMemoKey: 'slide3GasMemo',
        reportMemoDefaultTeam: 'team_01_01',
        reportMemoDefaultMetric: 'production',
      },
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
        this[name] = value;
      },
      closest(selector) {
        return selector === '[data-report-memo-key]' ? this : null;
      },
    },
  ];
  const memoContents = [
    {
      dataset: { reportMemoContent: 'slide3GasMemo' },
      innerHTML: '',
    },
  ];
  const createStyleCapture = () => ({
    values: {},
    setProperty(name, value) {
      this.values[name] = value;
    },
    getPropertyValue(name) {
      return this.values[name] || '';
    },
  });
  const analysisColumns = Array.from({ length: 6 }, () => ({ style: createStyleCapture() }));
  const wasteLayouts = Array.from({ length: 2 }, () => ({ style: createStyleCapture() }));
  const memoLineInput = {
    dataset: { reportMemoLineInput: '0' },
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-line-input]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoManualLineInput = {
    dataset: { reportMemoLineInput: '1' },
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-line-input]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoManualLineRow = {
    querySelector(selector) {
      return selector === '[data-report-memo-line-input]' ? memoManualLineInput : null;
    },
  };
  const memoLineMoveButton = {
    dataset: { reportMemoMoveLine: '0', reportMemoMoveDirection: 'up' },
    closest(selector) {
      return selector === '[data-report-memo-move-line]' ? this : null;
    },
  };
  const memoLineFontSizeButton = {
    dataset: { reportMemoLineFontSize: '0', reportMemoLineFontSizeDelta: '1' },
    closest(selector) {
      return selector === '[data-report-memo-line-font-size]' ? this : null;
    },
  };
  const memoManualLineFontSizeButton = {
    dataset: { reportMemoLineFontSize: '1', reportMemoLineFontSizeDelta: '1' },
    closest(selector) {
      if (selector === '[data-report-memo-line-font-size]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };
  const memoLineColorButton = {
    dataset: { reportMemoLineColor: '1', reportMemoLineColorValue: 'red' },
    closest(selector) {
      if (selector === '[data-report-memo-line-color]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };
  const memoLineColorClearButton = {
    dataset: { reportMemoLineColor: '1', reportMemoLineColorValue: 'clear' },
    closest(selector) {
      if (selector === '[data-report-memo-line-color]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };

  return {
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
  };
}
