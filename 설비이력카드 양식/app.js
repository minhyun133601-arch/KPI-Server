const photoOrder = ["front", "side", "rear"];
const photoLabels = {
  front: "정면",
  side: "측면",
  rear: "후면",
};

const photoState = {
  front: null,
  side: null,
  rear: null,
};

let currentPhotoView = "front";
let explodedState = null;
let cautionState = null;
let photoOpen = false;
let explodedOpen = false;
let cautionOpen = false;

const photoInputs = Object.fromEntries(
  Array.from(document.querySelectorAll('input[type="file"][data-view]')).map((input) => [input.dataset.view, input])
);
const photoPicker = document.getElementById("photoPicker");
const photoStage = document.getElementById("photoStage");
const photoViewLabel = document.getElementById("photoViewLabel");
const photoMainPreview = document.getElementById("photoMainPreview");
const photoAttachButton = document.getElementById("photoAttachButton");
const photoPrev = document.getElementById("photoPrev");
const photoNext = document.getElementById("photoNext");
const photoBody = document.getElementById("photoBody");
const togglePhoto = document.getElementById("togglePhoto");
const photoArrow = document.getElementById("photoArrow");

const assetGrid = document.querySelector(".asset-grid");
const explodedInput = document.getElementById("explodedInput");
const explodedViewer = document.getElementById("explodedViewer");
const explodedStatus = document.getElementById("explodedStatus");
const explodedBody = document.getElementById("explodedBody");
const toggleExploded = document.getElementById("toggleExploded");
const explodedArrow = document.getElementById("explodedArrow");

const cautionInput = document.getElementById("cautionInput");
const cautionViewer = document.getElementById("cautionViewer");
const cautionStatus = document.getElementById("cautionStatus");
const cautionBody = document.getElementById("cautionBody");
const toggleCaution = document.getElementById("toggleCaution");
const cautionArrow = document.getElementById("cautionArrow");

const historyBody = document.getElementById("historyBody");
const historyRowTemplate = document.getElementById("historyRowTemplate");

function revokePhotoUrl(view) {
  if (photoState[view]?.url) {
    URL.revokeObjectURL(photoState[view].url);
  }
}

function revokeAttachmentUrl(state) {
  if (state?.url) {
    URL.revokeObjectURL(state.url);
  }
}

function openCurrentPhotoInput() {
  const input = photoInputs[currentPhotoView];
  if (input) {
    input.click();
  }
}

function renderPhotoViewer() {
  const currentState = photoState[currentPhotoView];

  photoViewLabel.textContent = photoLabels[currentPhotoView];
  photoMainPreview.alt = `${photoLabels[currentPhotoView]} 사진`;
  photoStage.classList.toggle("has-image", Boolean(currentState));

  if (currentState) {
    photoMainPreview.src = currentState.url;
    photoMainPreview.hidden = false;
    photoAttachButton.hidden = true;
  } else {
    photoMainPreview.removeAttribute("src");
    photoMainPreview.hidden = true;
    photoAttachButton.hidden = false;
  }

  photoPicker.querySelectorAll("[data-view]").forEach((button) => {
    const { view } = button.dataset;
    button.classList.toggle("active", view === currentPhotoView);
    button.classList.toggle("filled", Boolean(photoState[view]));
  });
}

function setCurrentPhotoView(view) {
  if (!photoLabels[view]) {
    return;
  }

  currentPhotoView = view;
  renderPhotoViewer();
}

function stepPhoto(direction) {
  const currentIndex = photoOrder.indexOf(currentPhotoView);
  const nextIndex = (currentIndex + direction + photoOrder.length) % photoOrder.length;
  setCurrentPhotoView(photoOrder[nextIndex]);
}

function updatePhoto(view, file) {
  if (!file) {
    return;
  }

  revokePhotoUrl(view);
  photoState[view] = {
    name: file.name,
    url: URL.createObjectURL(file),
  };

  currentPhotoView = view;
  renderPhotoViewer();
}

function resetPhotos() {
  Object.keys(photoState).forEach((view) => {
    revokePhotoUrl(view);
    photoState[view] = null;
  });

  Object.values(photoInputs).forEach((input) => {
    input.value = "";
  });

  currentPhotoView = "front";
  renderPhotoViewer();
}

function renderFilePreview(state, viewer, status, inputId, emptyText, imageAlt, pdfTitle) {
  if (!state) {
    viewer.innerHTML = `
      <div class="file-empty">
        <label class="attach-button" for="${inputId}">첨부</label>
      </div>
    `;
    status.textContent = emptyText;
    return;
  }

  if (state.type === "application/pdf") {
    viewer.innerHTML = `<iframe title="${pdfTitle}" src="${state.url}"></iframe>`;
  } else {
    viewer.innerHTML = `<img src="${state.url}" alt="${imageAlt}" />`;
  }

  status.textContent = `첨부 완료: ${state.name}`;
}

function renderExploded() {
  renderFilePreview(
    explodedState,
    explodedViewer,
    explodedStatus,
    "explodedInput",
    "분해도 파일이 아직 첨부되지 않았습니다.",
    "설비 분해도 미리보기",
    "설비 분해도 PDF 미리보기"
  );
}

function renderCaution() {
  renderFilePreview(
    cautionState,
    cautionViewer,
    cautionStatus,
    "cautionInput",
    "주의사항 파일이 아직 첨부되지 않았습니다.",
    "주의사항 미리보기",
    "주의사항 PDF 미리보기"
  );
}

function updateExploded(file) {
  if (!file) {
    return;
  }

  revokeAttachmentUrl(explodedState);
  explodedState = {
    name: file.name,
    type: file.type,
    url: URL.createObjectURL(file),
  };
  explodedOpen = true;
  renderExplodedCollapse();
  renderExploded();
}

function updateCaution(file) {
  if (!file) {
    return;
  }

  revokeAttachmentUrl(cautionState);
  cautionState = {
    name: file.name,
    type: file.type,
    url: URL.createObjectURL(file),
  };
  cautionOpen = true;
  renderCautionCollapse();
  renderCaution();
}

function resetExploded() {
  revokeAttachmentUrl(explodedState);
  explodedState = null;
  explodedInput.value = "";
  renderExploded();
}

function scrollAssetGridIntoView() {
  if (!assetGrid) {
    return;
  }

  const currentTop = window.scrollY;
  const assetTop = currentTop + assetGrid.getBoundingClientRect().top - 24;
  const top = Math.max(0, Math.min(currentTop - 140, assetTop));
  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

function updateCollapseState(body, toggle, arrow, open) {
  body.hidden = !open;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  arrow.innerHTML = open ? "&#9650;" : "&#9660;";
}

function renderPhotoCollapse() {
  updateCollapseState(photoBody, togglePhoto, photoArrow, photoOpen);
}

function renderExplodedCollapse() {
  updateCollapseState(explodedBody, toggleExploded, explodedArrow, explodedOpen);
}

function renderCautionCollapse() {
  updateCollapseState(cautionBody, toggleCaution, cautionArrow, cautionOpen);
}

function handleCollapseAfterToggle() {
  if (!photoOpen && !explodedOpen && !cautionOpen) {
    requestAnimationFrame(() => {
      scrollAssetGridIntoView();
    });
  }
}

function addHistoryRow() {
  historyBody.append(historyRowTemplate.content.cloneNode(true));
}

photoPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) {
    return;
  }

  setCurrentPhotoView(button.dataset.view);
});

photoPrev.addEventListener("click", () => {
  stepPhoto(-1);
});

photoNext.addEventListener("click", () => {
  stepPhoto(1);
});

photoAttachButton.addEventListener("click", (event) => {
  event.stopPropagation();
  openCurrentPhotoInput();
});
photoStage.addEventListener("click", openCurrentPhotoInput);

togglePhoto.addEventListener("click", () => {
  photoOpen = !photoOpen;
  renderPhotoCollapse();
  handleCollapseAfterToggle();
});

Object.values(photoInputs).forEach((input) => {
  input.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    updatePhoto(event.target.dataset.view, file);
  });
});

explodedInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  updateExploded(file);
});

cautionInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  updateCaution(file);
});

toggleExploded.addEventListener("click", () => {
  explodedOpen = !explodedOpen;
  renderExplodedCollapse();
  handleCollapseAfterToggle();
});

toggleCaution.addEventListener("click", () => {
  cautionOpen = !cautionOpen;
  renderCautionCollapse();
  handleCollapseAfterToggle();
});

document.getElementById("resetPhotos").addEventListener("click", resetPhotos);
document.getElementById("resetExploded").addEventListener("click", resetExploded);
document.getElementById("printCard").addEventListener("click", () => window.print());
document.getElementById("addHistoryRow").addEventListener("click", addHistoryRow);

for (let index = 0; index < 4; index += 1) {
  addHistoryRow();
}

renderPhotoViewer();
renderPhotoCollapse();
renderExploded();
renderCaution();
renderExplodedCollapse();
renderCautionCollapse();
