export function makeClassList() {
  const classes = new Set();
  return {
    active: false,
    add(name) {
      classes.add(name);
      if (name === 'is-active') this.active = true;
    },
    remove(name) {
      classes.delete(name);
      if (name === 'is-active') this.active = false;
    },
    toggle(name, active) {
      const nextActive = active === undefined ? !classes.has(name) : !!active;
      if (nextActive) {
        classes.add(name);
      } else {
        classes.delete(name);
      }
      if (name === 'is-active') this.active = nextActive;
    },
    contains(name) {
      return classes.has(name);
    },
  };
}

export function createReportDeckPlanFixture({ getSlide = () => null } = {}) {
  const dateInput = {
    value: '',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-date-input]' ? this : null;
    },
  };
  const planCountSelects = ['slide8SlotCount', 'slide9SlotCount', 'slide10SlotCount'].map((key) => ({
    dataset: { reportPlanCountSelect: key },
    value: '',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-plan-count-select]' ? this : null;
    },
  }));
  const planAddSlotButtons = ['slide8', 'slide9'].map((slideKey) => ({
    dataset: { reportPlanAddSlot: slideKey },
    disabled: true,
    closest(selector) {
      return selector === '[data-report-plan-add-slot]' ? this : null;
    },
  }));
  const addPageButton = {
    dataset: { reportAddPage: 'slide10' },
    disabled: true,
    closest(selector) {
      return selector === '[data-report-add-page]' ? this : null;
    },
  };
  const planSlotCells = [
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide8.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide9.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
    ...Array.from({ length: 16 }, (_, index) => index + 1).map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide10.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
  ];
  const planDeleteButtons = [
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide8', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide8.${slotIndex}`) || null;
        }
        return null;
      },
    })),
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide9', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide9.${slotIndex}`) || null;
        }
        return null;
      },
    })),
    ...Array.from({ length: 16 }, (_, index) => index + 1).map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide10', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide10.${slotIndex}`) || null;
        }
        return null;
      },
    })),
  ];
  let slide10PlanSlide = null;
  const planRowTables = Array.from({ length: 7 }, (_, rowIndex) => ({
    dataset: { reportSafetyRow: String(rowIndex) },
    closest(selector) {
      if (selector === '.report-safety-table') return this;
      if (selector === '[data-report-plan-slide="slide10"]') return slide10PlanSlide;
      if (selector === '[data-report-slide-page]') return getSlide(10) || null;
      return null;
    },
  }));
  const planRowLabelTexts = Array.from({ length: 7 }, () => ({ textContent: '' }));
  const safetyTeamSelect = {
    value: '0',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-safety-team-select]' ? this : null;
    },
  };
  const safetyAddControl = {
    dataset: { reportSafetyTeamPickerOpen: 'false' },
    querySelector(selector) {
      if (selector === '[data-report-safety-team-select]') return safetyTeamSelect;
      if (selector === '[data-report-safety-team-menu]') return safetyTeamMenu;
      if (selector === '[data-report-safety-team-option]') return safetyTeamOptionButtons[0] || null;
      return null;
    },
  };
  const safetyTeamMenu = { hidden: true };
  const safetyAddButton = {
    dataset: { reportSafetyAddToggle: '' },
    disabled: true,
    closest(selector) {
      if (selector === '[data-report-safety-add-toggle]') return this;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      return null;
    },
  };
  const safetyTeamLabels = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀', '물류센터', '기타'];
  const safetyTeamOptionButtons = safetyTeamLabels.map((team, rowIndex) => ({
    dataset: {
      reportSafetyTeamOption: String(rowIndex),
      reportPlanRowSourceIndex: String(rowIndex),
    },
    textContent: team,
    disabled: true,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-safety-team-option]') return this;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      return null;
    },
  }));
  const planRowLabels = safetyTeamLabels.map((_, rowIndex) => ({
    dataset: { reportPlanRowTeam: 'slide10', reportPlanRowIndex: String(rowIndex) },
    get textContent() {
      return planRowLabelTexts[rowIndex].textContent;
    },
    set textContent(value) {
      planRowLabelTexts[rowIndex].textContent = value;
    },
    querySelector(selector) {
      if (selector === '[data-report-plan-row-team-label]') return planRowLabelTexts[rowIndex] || null;
      return null;
    },
    closest(selector) {
      return selector === '.report-safety-table' ? planRowTables[rowIndex] || null : null;
    },
  }));
  const safetyTableMoveButtons = Array.from({ length: 16 }, (_, index) => index + 1).flatMap((slotIndex) => {
    const rowIndex = Math.floor((slotIndex - 1) / 4);
    const table = planRowTables[rowIndex] || planRowTables[0];
    return ['left', 'right', 'up', 'down'].map((direction) => ({
      rowIndex,
      slotIndex,
      direction,
      dataset: { reportSafetyTableMove: direction },
      disabled: true,
      closest(selector) {
        if (selector === '[data-report-safety-table-move]') return this;
        if (selector === '.report-safety-table') return table;
        if (selector === '[data-report-plan-slide="slide10"]') return slide10PlanSlide;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide10.${slotIndex}`) || null;
        }
        return null;
      },
    }));
  });
  const planImages = [
    'slide8BeforeImage1',
    'slide8BeforeImage2',
    'slide8BeforeImage3',
    'slide8BeforeImage4',
    'slide8AfterImage1',
    'slide8AfterImage2',
    'slide8AfterImage3',
    'slide8AfterImage4',
    'slide9Image1',
    'slide9Image2',
    'slide9Image3',
    'slide9Image4',
    ...Array.from({ length: 16 }, (_, index) => `slide10BeforeImage${index + 1}`),
    ...Array.from({ length: 16 }, (_, index) => `slide10AfterImage${index + 1}`),
  ].map((key) => ({
    dataset: { reportPlanImage: key },
    src: '',
    hidden: false,
    setAttribute(name, value) {
      this[name] = value;
    },
    removeAttribute(name) {
      delete this[name];
    },
  }));
  const planImagePlaceholders = Object.fromEntries(
    planImages.map((image) => [image.dataset.reportPlanImage, { textContent: '' }])
  );
  const planImageSourceLabels = Object.fromEntries(
    planImages.map((image) => [image.dataset.reportPlanImage, { textContent: '', hidden: true }])
  );
  const planImagePasteButtons = planImages.map((image) => ({
    dataset: { reportPlanImagePaste: image.dataset.reportPlanImage },
    textContent: '',
    disabled: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      if (selector === '[data-report-plan-image-paste]') return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planSlides = ['slide8', 'slide9', 'slide10'].map((slideKey) => {
    const planSlide = {
      dataset: { reportPlanSlide: slideKey, reportPlanPage: '0' },
      querySelectorAll(selector) {
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.filter((cell) => cell.dataset.reportPlanSlot.startsWith(`${slideKey}.`));
        }
        if (selector === '[data-report-plan-delete-slot]') {
          return planDeleteButtons.filter((button) => button.dataset.reportPlanDeleteSlot === slideKey);
        }
        if (selector === '[data-report-plan-add-slot]') {
          return slideKey === 'slide10'
            ? []
            : planAddSlotButtons.filter((button) => button.dataset.reportPlanAddSlot === slideKey);
        }
        if (selector === '[data-report-plan-row-team]') {
          return slideKey === 'slide10' ? planRowLabels : [];
        }
        if (selector === '[data-report-safety-team-select]') {
          return slideKey === 'slide10' ? [safetyTeamSelect] : [];
        }
        if (selector === '[data-report-safety-add-toggle]') {
          return slideKey === 'slide10' ? [safetyAddButton] : [];
        }
        if (selector === '[data-report-safety-team-option]') {
          return slideKey === 'slide10' ? safetyTeamOptionButtons : [];
        }
        if (selector === '[data-report-safety-table-move]') {
          return slideKey === 'slide10' ? safetyTableMoveButtons : [];
        }
        return [];
      },
      closest(selector) {
        if (selector !== '[data-report-slide-page]') return null;
        if (slideKey === 'slide10') return getSlide(10) || null;
        return null;
      },
    };
    if (slideKey === 'slide10') slide10PlanSlide = planSlide;
    return planSlide;
  });
  const optionalContentItems = ['slide8', 'slide9', 'slide10', 'slide8', 'slide9'].map((optionalPage) => ({
    dataset: { reportOptionalContent: optionalPage },
    hidden: true,
  }));
  const planImageFrames = Object.fromEntries(
    planImages.map((image) => [
      image.dataset.reportPlanImage,
      {
        dataset: {},
        querySelector(selector) {
          if (selector === '[data-report-plan-image-input]') {
            return (
              planImageInputs.find((input) => input.dataset.reportPlanImageKey === image.dataset.reportPlanImage) ||
              planImageInputs[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image-upload]') {
            return (
              planImageUploadButtons.find(
                (button) => button.dataset.reportPlanImageUpload === image.dataset.reportPlanImage
              ) ||
              planImageUploadButtons[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image-clear]') {
            return (
              planImageClearButtons.find(
                (button) => button.dataset.reportPlanImageClear === image.dataset.reportPlanImage
              ) ||
              planImageClearButtons[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image]') {
            return image;
          }
          if (selector === '[data-report-plan-image-placeholder]') {
            return planImagePlaceholders[image.dataset.reportPlanImage] || null;
          }
          if (selector === '[data-report-plan-image-source-label]') return null;
          if (selector === '[data-report-plan-image-paste]') {
            return (
              planImagePasteButtons.find(
                (button) => button.dataset.reportPlanImagePaste === image.dataset.reportPlanImage
              ) ||
              planImagePasteButtons[planImages.indexOf(image)] ||
              null
            );
          }
          return null;
        },
        closest(selector) {
          return selector === '[data-report-plan-image-frame]' ? this : null;
        },
        focusCount: 0,
        focus() {
          this.focusCount += 1;
        },
        setAttribute(name, value) {
          if (String(name).startsWith('data-')) {
            this.dataset[name.replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
            return;
          }
          this[name] = value;
        },
      },
    ])
  );
  const planImageInputs = planImages.map((image) => ({
    dataset: { reportPlanImageKey: image.dataset.reportPlanImage },
    disabled: true,
    files: [],
    value: '',
    clickCount: 0,
    click() {
      this.clickCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-plan-image-input]') return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planImageUploadButtons = planImages.map((image) => ({
    dataset: { reportPlanImageUpload: image.dataset.reportPlanImage },
    disabled: true,
    closest(selector) {
      if (selector === '[data-report-plan-image-upload]') return this;
      if (String(selector).includes('[data-report-plan-image-choice]')) return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planImageClearButtons = planImages.map((image) => ({
    dataset: { reportPlanImageClear: image.dataset.reportPlanImage },
    closest(selector) {
      return selector === '[data-report-plan-image-clear]' ? this : null;
    },
  }));
  planImages.forEach((image) => {
    image.closest = (selector) =>
      selector === '[data-report-plan-image-frame]' ? planImageFrames[image.dataset.reportPlanImage] || null : null;
  });
  const autoChartPlots = {
    gas: { innerHTML: '' },
    electric: { innerHTML: '' },
    waste: { innerHTML: '' },
  };

  return {
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
  };
}
