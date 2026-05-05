function getBillingDirectoryPersistenceBrowserAdapter() {
  return typeof KpiMeteringBrowserAdapter === "object" && KpiMeteringBrowserAdapter
    ? KpiMeteringBrowserAdapter
    : null;
}

function getBillingDirectoryPersistenceGlobal(name) {
  const adapter = getBillingDirectoryPersistenceBrowserAdapter();
  return typeof adapter?.getGlobal === "function" ? adapter.getGlobal(name) : undefined;
}

function hasBillingDirectoryPersistenceGlobal(name) {
  const adapter = getBillingDirectoryPersistenceBrowserAdapter();
  return typeof adapter?.hasGlobal === "function" && adapter.hasGlobal(name);
}

function getBillingDirectoryPersistenceProtocol() {
  const adapter = getBillingDirectoryPersistenceBrowserAdapter();
  return typeof adapter?.getLocationProtocol === "function"
    ? adapter.getLocationProtocol()
    : "";
}

function getBillingDirectoryPicker() {
  const adapter = getBillingDirectoryPersistenceBrowserAdapter();
  const rootPicker = getBillingDirectoryPersistenceGlobal("showDirectoryPicker");
  const picker =
    typeof adapter?.showDirectoryPicker === "function" && typeof rootPicker === "function"
      ? adapter.showDirectoryPicker
      : rootPicker;
  return typeof picker === "function" ? picker : null;
}

function alertBillingDirectoryPersistenceUser(message) {
  const adapter = getBillingDirectoryPersistenceBrowserAdapter();
  if (typeof adapter?.alert === "function") {
    adapter.alert(message);
  }
}

function supportsPersistedLocalFileHandle() {
  return (
    getBillingDirectoryPersistenceProtocol() === "file:" &&
    hasBillingDirectoryPersistenceGlobal("indexedDB")
  );
}

function supportsBillingDocumentDirectoryPersistence() {
  return (
    supportsPersistedLocalFileHandle() &&
    Boolean(getBillingDirectoryPicker())
  );
}

function openLocalFileHandleDatabase() {
  if (!supportsPersistedLocalFileHandle()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    let didSettle = false;

    try {
      const request = getBillingDirectoryPersistenceGlobal("indexedDB").open(
        LOCAL_FILE_HANDLE_DB_NAME,
        1
      );
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(LOCAL_FILE_HANDLE_STORE_NAME)) {
          database.createObjectStore(LOCAL_FILE_HANDLE_STORE_NAME);
        }
      };
      request.onsuccess = () => {
        didSettle = true;
        resolve(request.result);
      };
      request.onerror = () => {
        didSettle = true;
        reject(request.error || new Error("local_file_handle_db_open_failed"));
      };
    } catch (error) {
      didSettle = true;
      reject(error);
    }

    if (didSettle) {
      return;
    }
  });
}

function withLocalFileHandleStore(mode, callback) {
  return openLocalFileHandleDatabase().then((database) => {
    if (!database) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(LOCAL_FILE_HANDLE_STORE_NAME, mode);
      const store = transaction.objectStore(LOCAL_FILE_HANDLE_STORE_NAME);

      transaction.oncomplete = () => {
        database.close();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("local_file_handle_transaction_failed"));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("local_file_handle_transaction_aborted"));
      };

      callback(store, resolve, reject);
    });
  });
}

function persistLocalHandleByKey(handleKey, handle) {
  if (!supportsPersistedLocalFileHandle() || !handleKey || !handle) {
    return Promise.resolve(false);
  }

  return withLocalFileHandleStore("readwrite", (store, resolve, reject) => {
    try {
      const request = store.put(handle, handleKey);
      request.onsuccess = () => resolve(true);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_persist_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => false);
}

function clearPersistedLocalHandleByKey(handleKey) {
  if (!supportsPersistedLocalFileHandle() || !handleKey) {
    return Promise.resolve(false);
  }

  return withLocalFileHandleStore("readwrite", (store, resolve, reject) => {
    try {
      const request = store.delete(handleKey);
      request.onsuccess = () => resolve(true);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_delete_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => false);
}

function loadPersistedLocalHandleByKey(handleKey) {
  if (!supportsPersistedLocalFileHandle() || !handleKey) {
    return Promise.resolve(null);
  }

  return withLocalFileHandleStore("readonly", (store, resolve, reject) => {
    try {
      const request = store.get(handleKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_load_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => null);
}

function persistBillingDocumentDirectoryHandle(directoryHandle) {
  if (!supportsBillingDocumentDirectoryPersistence() || !directoryHandle) {
    return Promise.resolve(false);
  }

  return persistLocalHandleByKey(
    LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY,
    directoryHandle
  );
}

function clearPersistedBillingDocumentDirectoryHandle() {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return Promise.resolve(false);
  }

  return clearPersistedLocalHandleByKey(LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY);
}

function loadPersistedBillingDocumentDirectoryHandle() {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return Promise.resolve(null);
  }

  return loadPersistedLocalHandleByKey(LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY);
}

async function resolveBillingDocumentDirectoryHandle(
  candidateHandle,
  resourceType = getCurrentResourceType()
) {
  if (!candidateHandle || typeof candidateHandle.getDirectoryHandle !== "function") {
    return null;
  }

  const acceptedDirectoryNames = getAcceptedBillingDocumentDirectoryNames(resourceType);
  if (acceptedDirectoryNames.includes(candidateHandle.name)) {
    return candidateHandle;
  }

  for (const directoryName of acceptedDirectoryNames) {
    try {
      return await candidateHandle.getDirectoryHandle(directoryName, {
        create: false,
      });
    } catch (error) {
      void error;
    }
  }

  return null;
}

async function restorePersistedBillingDocumentDirectoryHandle(
  resourceType = getCurrentResourceType()
) {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  if (localFilePersistenceState.billingDocumentDirectoryHandle) {
    const resolvedCachedHandle = await resolveBillingDocumentDirectoryHandle(
      localFilePersistenceState.billingDocumentDirectoryHandle,
      resourceType
    );
    if (resolvedCachedHandle) {
      localFilePersistenceState.billingDocumentDirectoryHandle = resolvedCachedHandle;
      return resolvedCachedHandle;
    }

    localFilePersistenceState.billingDocumentDirectoryHandle = null;
    await clearPersistedBillingDocumentDirectoryHandle();
  }

  const persistedHandle = await loadPersistedBillingDocumentDirectoryHandle();
  if (!persistedHandle) {
    return null;
  }

  const billingDirectoryHandle = await resolveBillingDocumentDirectoryHandle(
    persistedHandle,
    resourceType
  );
  if (!billingDirectoryHandle) {
    await clearPersistedBillingDocumentDirectoryHandle();
    return null;
  }

  try {
    const permission = await billingDirectoryHandle.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      return null;
    }

    localFilePersistenceState.billingDocumentDirectoryHandle = billingDirectoryHandle;
    return billingDirectoryHandle;
  } catch (error) {
    await clearPersistedBillingDocumentDirectoryHandle();
    return null;
  }
}

async function promptBillingDocumentDirectoryHandle(
  resourceType = getCurrentResourceType()
) {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  let selectedDirectoryHandle = null;
  try {
    selectedDirectoryHandle = await getBillingDirectoryPicker()();
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    throw error;
  }

  const billingDirectoryHandle = await resolveBillingDocumentDirectoryHandle(
    selectedDirectoryHandle,
    resourceType
  );
  if (!billingDirectoryHandle) {
    alertBillingDirectoryPersistenceUser(
      `${getBillingDocumentDirectoryName(resourceType)} 폴더를 선택해 주세요.`
    );
    return null;
  }

  const permission = await billingDirectoryHandle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return null;
  }

  localFilePersistenceState.billingDocumentDirectoryHandle = billingDirectoryHandle;
  void persistBillingDocumentDirectoryHandle(billingDirectoryHandle);
  return billingDirectoryHandle;
}

async function ensureBillingDocumentDirectoryHandle(
  resourceType = getCurrentResourceType(),
  options = {}
) {
  const { allowPrompt = true } = options;
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  const restoredHandle = await restorePersistedBillingDocumentDirectoryHandle(resourceType);
  if (restoredHandle) {
    return restoredHandle;
  }

  if (!allowPrompt) {
    return null;
  }

  return promptBillingDocumentDirectoryHandle(resourceType);
}

async function writeBillingDocumentToLocalDirectory(
  file,
  monthValue,
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const directoryHandle = await ensureBillingDocumentDirectoryHandle(resourceType, {
    allowPrompt: false,
  });
  if (!directoryHandle) {
    return null;
  }

  const fileName = buildBillingDocumentFileName(
    monthValue,
    file?.name,
    file?.type,
    resourceType,
    scopeKey
  );
  const relativePath = buildBillingDocumentRelativePath(fileName, resourceType);
  const savedAt = new Date().toISOString();

  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return {
      fileName,
      relativePath,
      mimeType: file?.type || "",
      savedAt,
    };
  } catch (error) {
    localFilePersistenceState.billingDocumentDirectoryHandle = null;
    void clearPersistedBillingDocumentDirectoryHandle();
    throw error;
  }
}

async function deleteBillingDocumentFromLocalDirectory(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  if (!supportsBillingDocumentDirectoryPersistence() || !billingDocument) {
    return false;
  }

  const directoryHandle = await restorePersistedBillingDocumentDirectoryHandle(resourceType);
  if (!directoryHandle) {
    return false;
  }

  const candidateFileNames = getBillingDocumentRelativePathCandidates(billingDocument, resourceType)
    .map((relativePath) => normalizeRelativeFilePath(relativePath).split("/").pop() || "")
    .filter((fileName, index, list) => fileName && list.indexOf(fileName) === index);

  for (const fileName of candidateFileNames) {
    try {
      await directoryHandle.removeEntry(fileName);
      return true;
    } catch (error) {
      if (error?.name === "NotFoundError") {
        continue;
      }
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        localFilePersistenceState.billingDocumentDirectoryHandle = null;
        void clearPersistedBillingDocumentDirectoryHandle();
      }
      console.error("Billing document local directory delete failed.", error);
      break;
    }
  }

  return false;
}
