const meteringStoreSyncBrowser =
  typeof KpiMeteringBrowserAdapter !== "undefined"
    ? KpiMeteringBrowserAdapter
    : {
        getGlobal: () => undefined,
        setGlobal: (name, value) => {
          return value;
        },
        fetch: (...args) => fetch(...args),
        getStoreUpdateTargets: () => [],
      };

function getManualSaveContextLabel() {
  if (getCurrentMode() === MODES.TEAM) {
    const monthValue = normalizeMonthValue(state.currentMonth);
    return monthValue ? `${getCurrentResourceLabel()} ${monthValue} 팀별` : `${getCurrentResourceLabel()} 팀별`;
  }

  if (state.selectedDate) {
    return `${getCurrentResourceLabel()} ${state.selectedDate} 설비별`;
  }

  return `${getCurrentResourceLabel()} 설비별`;
}

function appendManualSaveHistoryRecord(record) {
  state.store.manualSaveHistory = normalizeManualSaveHistory([
    record,
    ...(Array.isArray(state.store.manualSaveHistory) ? state.store.manualSaveHistory : []),
  ]);
}

function showManualSaveSuccessPopup(options = {}) {
  if (options.showSavedPopup === false) {
    return false;
  }
  if (typeof meteringStoreSyncBrowser.alert !== "function") {
    return false;
  }
  meteringStoreSyncBrowser.alert("저장되었습니다");
  return true;
}

async function waitForQueuedPersistence() {
  await Promise.allSettled([sharedServerPersistenceState.writeChain]);
}

async function writeStoreToSharedServer() {
  syncActiveResourceDatasetToStore(state.store);
  return writeStorePayloadToSharedServer(state.store).then((writeResult) => {
    const localStore = meteringStoreSyncBrowser.setGlobal(
      "__LOCAL_APP_STORE__",
      JSON.parse(JSON.stringify(state.store))
    );
    meteringStoreSyncBrowser.setGlobal(
      "__PRESET_ELECTRIC_ENTRIES__",
      getElectricPresetEntriesForStore(localStore)
    );
    sharedServerPersistenceState.lastErrorMessage = "";
    return writeResult;
  });
}

async function writeStorePayloadToSharedServer(store) {
  if (!supportsSharedServerPersistence()) {
    return false;
  }

  const currentMeta = sharedServerPersistenceState.meta || getPresetSharedStoreMeta();
  if (!sharedServerPersistenceState.meta && currentMeta) {
    sharedServerPersistenceState.meta = currentMeta;
  }

  const expectedVersion = Number.isInteger(currentMeta?.version)
    ? currentMeta.version
    : null;
  const expectedRecordVersions = isPlainObject(currentMeta?.recordVersions)
    ? currentMeta.recordVersions
    : null;

  const response = await meteringStoreSyncBrowser.fetch(getSharedStoreEndpoint(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({
      store,
      expectedVersion,
      expectedRecordVersions,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 409 || payload?.error === "version_conflict") {
    sharedServerPersistenceState.conflictMeta = rememberSharedStoreMeta(payload?.currentMeta);
    throw new Error("shared_store_version_conflict");
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(`shared_store_write_failed:${response.status}`);
  }

  sharedServerPersistenceState.conflictMeta = null;
  rememberSharedStoreMeta(payload?.meta);
  return true;
}

function queueSharedStoreWrite() {
  if (!supportsSharedServerPersistence()) {
    return;
  }

  sharedServerPersistenceState.writeChain = sharedServerPersistenceState.writeChain
    .then(() => writeStoreToSharedServer())
    .catch((error) => {
      const message = error?.message === "shared_store_version_conflict"
        ? "중앙 서버 버전 충돌로 저장이 보류되었습니다. 새로고침 후 최신 내용을 확인해 주세요."
        : "중앙 서버 저장에 실패했습니다.";
      sharedServerPersistenceState.lastErrorMessage = message;
      console.error(message, error);
    });
}

async function performManualSave(options = {}) {
  const trigger = normalizeText(options.trigger) || "manual";
  const currentMode = getCurrentMode();

  sharedServerPersistenceState.lastErrorMessage = "";
  if (currentMode === MODES.TEAM) {
    syncPendingMeteringDraftInputs();
    completeCurrentBillingSettlementEntryForManualSave();
    syncActiveResourceDatasetToStore(state.store);
    const completedSettlementCount =
      typeof completeStoreBillingSettlementEntriesWithStoredValues === "function"
        ? completeStoreBillingSettlementEntriesWithStoredValues(state.store)
        : 0;
    if (completedSettlementCount > 0) {
      state.cleanStatusText = `${completedSettlementCount}개 정산 입력을 저장 완료 처리했습니다.`;
      renderTeamMode();
      if (typeof renderSettlementReadinessPanel === "function") {
        renderSettlementReadinessPanel();
      }
    }
  }

  let didSave = false;

  if (currentMode === MODES.EQUIPMENT) {
    if (state.selectedDate) {
      completeCurrentEquipmentEntryForManualSave({
        trigger,
        completeCurrentEntry: options.completeCurrentEntry === true,
      });
      didSave = saveCurrentEquipmentEntry({ allowValidationIssues: true });
      if (!didSave) {
        updateDirtyState();
        updateActionState();
        return false;
      }
    } else if (isDirty()) {
      persistStore();
      didSave = true;
    }
  } else {
    persistStore();
    didSave = true;
  }

  if (!didSave) {
    return false;
  }

  if (!supportsSharedServerPersistence()) {
    const message = "이 환경에서는 서버 저장을 지원하지 않습니다.";
    sharedServerPersistenceState.lastErrorMessage = message;
    if (elements.saveStatus) {
      elements.saveStatus.textContent = message;
      elements.saveStatus.classList.add("is-dirty", "is-error");
    }
    updateDirtyState();
    updateActionState();
    return false;
  }

  await waitForQueuedPersistence();

  if (sharedServerPersistenceState.lastErrorMessage) {
    updateDirtyState();
    updateActionState();
    return false;
  }

  const savedAt = new Date().toISOString();
  appendManualSaveHistoryRecord({
    savedAt,
    trigger,
    resourceType: getCurrentResourceType(),
    mode: currentMode,
    contextLabel: getManualSaveContextLabel(),
  });
  persistStore();
  await waitForQueuedPersistence();
  state.loadedSnapshot = createFormSnapshot();
  state.cleanStatusText = "서버 저장을 완료했습니다.";
  updateDirtyState();
  updateActionState();
  showManualSaveSuccessPopup(options);
  return true;
}

function persistStore(options = {}) {
  const { skipSharedServerWrite = false } = options;
  syncActiveResourceDatasetToStore(state.store);
  clearEquipmentReadingTimelineCaches();
  const localStore = meteringStoreSyncBrowser.setGlobal(
    "__LOCAL_APP_STORE__",
    JSON.parse(JSON.stringify(state.store))
  );
  meteringStoreSyncBrowser.setGlobal(
    "__PRESET_ELECTRIC_ENTRIES__",
    getElectricPresetEntriesForStore(localStore)
  );
  notifyKpiMeteringStoreUpdated();
  if (!skipSharedServerWrite && ENABLE_SHARED_SERVER_WRITE) {
    queueSharedStoreWrite();
  }
}

function dispatchKpiMeteringStoreUpdatedEvent(targetWindow) {
  if (!targetWindow || typeof targetWindow.dispatchEvent !== "function") {
    return;
  }

  const EventConstructor =
    typeof targetWindow.CustomEvent === "function" ? targetWindow.CustomEvent : CustomEvent;
  targetWindow.dispatchEvent(
    new EventConstructor("kpi:metering-store-updated", {
      detail: {
        resourceType: getCurrentResourceType(),
      },
    })
  );
}

function notifyKpiMeteringStoreUpdated() {
  try {
    meteringStoreSyncBrowser.getStoreUpdateTargets().forEach((targetWindow) => {
      dispatchKpiMeteringStoreUpdatedEvent(targetWindow);
    });
  } catch (error) {
    console.error("Failed to notify KPI metering store update.", error);
  }
}
