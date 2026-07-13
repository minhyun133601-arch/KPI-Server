(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_PHOTO_TARGET_WIDTH = 1600;
    const EQUIPMENT_PHOTO_TARGET_HEIGHT = 500;
    const EQUIPMENT_PHOTO_ATTACHMENT_KEY = api.EQUIPMENT_PHOTO_ATTACHMENT_KEY || 'equipment-photo-main';
    const normalizePhotoCropValue = (...args) => api.normalizePhotoCropValue(...args);
    const queueEquipmentHistoryPhotoDocumentCleanup = (...args) => api.queueEquipmentHistoryPhotoDocumentCleanup(...args);
    const rejectDuplicateEquipmentNames = (...args) => api.rejectDuplicateEquipmentNames(...args);

    function getDraftPhotoSnapshot(draft) {
        return {
            photoDataUrl: draft.photoDataUrl || '',
            photoThumbDataUrl: draft.photoThumbDataUrl || '',
            photoCrop: normalizePhotoCropValue(draft.photoCrop),
            photoDocumentId: draft.photoDocumentId || '',
            photoPreviewUrl: draft.photoPreviewUrl || '',
            photoDownloadUrl: draft.photoDownloadUrl || '',
            photoStorageRelPath: draft.photoStorageRelPath || '',
            photoName: draft.photoName || '',
            photoFile: draft.photoFile,
        };
    }

    function applyDraftPhotoSnapshot(draft, snapshot) {
        draft.photoDataUrl = snapshot.photoDataUrl || '';
        draft.photoThumbDataUrl = snapshot.photoThumbDataUrl || '';
        draft.photoCrop = normalizePhotoCropValue(snapshot.photoCrop);
        draft.photoDocumentId = snapshot.photoDocumentId || '';
        draft.photoPreviewUrl = snapshot.photoPreviewUrl || '';
        draft.photoDownloadUrl = snapshot.photoDownloadUrl || '';
        draft.photoStorageRelPath = snapshot.photoStorageRelPath || '';
        draft.photoName = snapshot.photoName || '';
        if (snapshot.photoFile) draft.photoFile = snapshot.photoFile;
        else delete draft.photoFile;
    }

    function getEquipmentHistoryPhotoAttachmentFailureMessage(error) {
        const code = String(error?.message || error || '').trim();
        if (code === 'file_too_large') return '\uC0AC\uC9C4 \uD30C\uC77C\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4. \uC0AC\uC9C4\uC744 \uC904\uC774\uAC70\uB098 \uB2E4\uB978 \uC0AC\uC9C4\uC73C\uB85C \uB2E4\uC2DC \uCCA8\uBD80\uD574 \uC8FC\uC138\uC694.';
        if (code === 'unsupported_type') return '\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC0AC\uC9C4 \uD615\uC2DD\uC785\uB2C8\uB2E4. JPG, PNG, GIF, WebP \uC774\uBBF8\uC9C0\uB85C \uCCA8\uBD80\uD574 \uC8FC\uC138\uC694.';
        if (code === 'server_write_unavailable') return '\uC11C\uBC84 \uC800\uC7A5 \uAD8C\uD55C\uC774 \uC5C6\uC5B4 \uC0AC\uC9C4\uC744 \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
        return '\uC0AC\uC9C4 \uCCA8\uBD80\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC774\uBBF8\uC9C0 \uD30C\uC77C\uC774\uB098 \uD074\uB9BD\uBCF4\uB4DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.';
    }

    function enqueueEquipmentHistoryPhotoUpload(state, task) {
        const previous = state.photoUploadPromise || Promise.resolve();
        const upload = previous.catch(() => false).then(task);
        const tracked = upload.finally(() => {
            if (state.photoUploadPromise === tracked) state.photoUploadPromise = null;
        });
        state.photoUploadPromise = tracked;
        return tracked;
    }

    function clearDraftPhoto(draft) {
        draft.photoDataUrl = '';
        draft.photoThumbDataUrl = '';
        draft.photoCrop = null;
        draft.photoDocumentId = '';
        draft.photoPreviewUrl = '';
        draft.photoDownloadUrl = '';
        draft.photoStorageRelPath = '';
        draft.photoName = '';
        delete draft.photoFile;
    }

    async function revertPhoto(data, state, redraw) {
        const draft = state.draft || null;
        if (!draft) return false;
        const previousPhoto = getDraftPhotoSnapshot(draft);
        if (!previousPhoto.photoDataUrl && !previousPhoto.photoDocumentId && !previousPhoto.photoFile && !previousPhoto.photoThumbDataUrl) return false;

        clearDraftPhoto(draft);
        queueEquipmentHistoryPhotoDocumentCleanup(state, previousPhoto.photoDocumentId);
        state.message = '사진 첨부를 되돌렸습니다. 저장을 눌러야 반영됩니다.';
        redraw();
        return true;
    }

    async function deleteDraft(data, state) {
        const draft = state.draft || null;
        const recordId = api.normalizeText(draft?.id);
        if (!recordId) {
            browser.alert('저장된 설비 이력카드만 삭제할 수 있습니다.');
            return false;
        }
        if (browser.confirm?.('이 설비 이력카드를 삭제할까요?') === false) return false;

        const previousPayload = JSON.parse(JSON.stringify(data || {}));
        const previousList = Array.isArray(data?.equipmentList) ? data.equipmentList : api.normalizeEquipmentItems(data);
        const nextList = previousList.filter((item) => api.normalizeText(item?.id) !== recordId);
        if (nextList.length === previousList.length) {
            browser.alert('삭제할 설비 이력카드를 찾을 수 없습니다.');
            return false;
        }

        let nextPayload = {
            ...JSON.parse(JSON.stringify(data || {})),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        const canSaveToServer = api.canSaveEquipmentHistoryToServer?.() === true;
        try {
            if (canSaveToServer) {
                const savedPayload = await api.saveEquipmentHistoryPayload?.(nextPayload);
                if (!savedPayload) throw new Error('equipment_history_payload_delete_failed');
                nextPayload = savedPayload;
            }
        } catch (error) {
            browser.writePortalPayload('data_equipment_history_card', previousPayload);
            throw error;
        }

        Object.keys(data || {}).forEach((key) => delete data[key]);
        Object.assign(data, nextPayload);
        browser.writePortalPayload('data_equipment_history_card', nextPayload);

        if (canSaveToServer) {
            try {
                await api.deleteEquipmentHistoryDraftAssets?.(draft);
            } catch (cleanupError) {
                console.warn('[kpi] equipment history deleted card asset cleanup failed', cleanupError);
                browser.alert('카드는 삭제했지만 첨부 파일 삭제는 실패했습니다.');
            }
        }

        const items = api.normalizeEquipmentItems(data);
        state.selectedId = items[0]?.id || '';
        state.draft = null;
        state.view = 'board';
        state.message = '설비 이력카드를 삭제했습니다.';
        return true;
    }

    function loadEquipmentPhotoImage(dataUrl, doc) {
        return new Promise((resolve, reject) => {
            const ImageCtor = doc?.defaultView?.Image || (typeof Image !== 'undefined' ? Image : null);
            if (!ImageCtor) {
                reject(new Error('image_constructor_unavailable'));
                return;
            }
            const image = new ImageCtor();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('image_load_failed'));
            image.src = dataUrl;
        });
    }

    function getNormalizedEquipmentPhotoFileName(file) {
        const rawName = api.normalizeText(file?.name) || 'equipment-photo';
        const baseName = rawName.replace(/\.[^.]+$/, '') || 'equipment-photo';
        return `${baseName}-1600x500.jpg`;
    }

    function canvasToJpegBlob(canvas) {
        if (typeof canvas.toBlob !== 'function') return Promise.resolve(null);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
        });
    }

    async function normalizeEquipmentPhotoAttachment(file, rawDataUrl, doc) {
        try {
            const image = await loadEquipmentPhotoImage(rawDataUrl, doc);
            const canvas = doc.createElement('canvas');
            canvas.width = EQUIPMENT_PHOTO_TARGET_WIDTH;
            canvas.height = EQUIPMENT_PHOTO_TARGET_HEIGHT;
            const context = canvas.getContext('2d');
            if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error('canvas_context_unavailable');

            const scale = Math.min(
                EQUIPMENT_PHOTO_TARGET_WIDTH / image.naturalWidth,
                EQUIPMENT_PHOTO_TARGET_HEIGHT / image.naturalHeight
            );
            const targetWidth = image.naturalWidth * scale;
            const targetHeight = image.naturalHeight * scale;
            const targetX = (EQUIPMENT_PHOTO_TARGET_WIDTH - targetWidth) / 2;
            const targetY = (EQUIPMENT_PHOTO_TARGET_HEIGHT - targetHeight) / 2;

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                image,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
                targetX,
                targetY,
                targetWidth,
                targetHeight,
            );
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const blob = await canvasToJpegBlob(canvas);
            if (!blob) return { dataUrl, file, name: getNormalizedEquipmentPhotoFileName(file) };
            const name = getNormalizedEquipmentPhotoFileName(file);
            const FileCtor = doc?.defaultView?.File || (typeof File !== 'undefined' ? File : null);
            const normalizedFile = FileCtor
                ? new FileCtor([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
                : blob;
            if (!normalizedFile.name) {
                try {
                    Object.defineProperty(normalizedFile, 'name', { value: name });
                } catch (error) {
                    normalizedFile.name = name;
                }
            }
            return { dataUrl, file: normalizedFile, name };
        } catch (error) {
            console.warn('[kpi] equipment history photo normalization failed', error);
            return { dataUrl: rawDataUrl, file, name: file?.name || '' };
        }
    }

    function getClipboardImageExtension(type) {
        const normalized = api.normalizeText(type).toLowerCase();
        if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
        if (normalized === 'image/png') return 'png';
        if (normalized === 'image/webp') return 'webp';
        if (normalized === 'image/gif') return 'gif';
        if (normalized === 'image/bmp') return 'bmp';
        const match = normalized.match(/^image\/([a-z0-9.+-]+)$/);
        return match ? match[1].replace(/[^a-z0-9]+/g, '-') || 'png' : 'png';
    }

    function isClipboardImageType(type) {
        return /^image\//i.test(api.normalizeText(type));
    }

    function createNamedClipboardImageFile(blob, type, doc) {
        if (!blob) return null;
        const mimeType = api.normalizeText(blob.type || type) || 'image/png';
        const name = `clipboard-photo-${Date.now()}.${getClipboardImageExtension(mimeType)}`;
        const FileCtor = doc?.defaultView?.File || (typeof File !== 'undefined' ? File : null);
        if (FileCtor) {
            try {
                return new FileCtor([blob], name, { type: mimeType, lastModified: Date.now() });
            } catch {}
        }
        try {
            Object.defineProperty(blob, 'name', { value: name });
        } catch (error) {
            blob.name = name;
        }
        if (!blob.type) {
            try {
                Object.defineProperty(blob, 'type', { value: mimeType });
            } catch {}
        }
        return blob;
    }

    function ensureClipboardImageFileName(file, type, doc) {
        if (!file) return null;
        if (api.normalizeText(file.name)) return file;
        return createNamedClipboardImageFile(file, type || file.type, doc);
    }

    function getPhotoFileFromClipboardData(clipboardData, doc) {
        const items = Array.from(clipboardData?.items || []);
        for (const item of items) {
            const type = api.normalizeText(item?.type);
            if (!isClipboardImageType(type) || typeof item?.getAsFile !== 'function') continue;
            const file = item.getAsFile();
            if (file) return ensureClipboardImageFileName(file, type, doc);
        }

        const files = Array.from(clipboardData?.files || []);
        for (const file of files) {
            if (isClipboardImageType(file?.type) || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(api.normalizeText(file?.name))) {
                return ensureClipboardImageFileName(file, file?.type, doc);
            }
        }
        return null;
    }

    async function readPhotoFileFromNavigatorClipboard(root) {
        const doc = root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
        const clipboard = doc?.defaultView?.navigator?.clipboard;
        if (!clipboard || typeof clipboard.read !== 'function') return null;
        const items = await clipboard.read();
        for (const item of Array.from(items || [])) {
            const type = Array.from(item?.types || []).find(isClipboardImageType);
            if (!type || typeof item?.getType !== 'function') continue;
            const blob = await item.getType(type);
            return createNamedClipboardImageFile(blob, type, doc);
        }
        return null;
    }

    function readEquipmentPhotoFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('equipment_history_photo_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    async function cleanupPreviousEquipmentPhotoDocument(documentId) {
        const previousDocumentId = api.normalizeText(documentId);
        if (!previousDocumentId || api.canSaveEquipmentHistoryToServer?.() !== true) return;
        try {
            await api.deleteEquipmentHistoryDraftAssets?.({ photoDocumentId: previousDocumentId, documents: [] });
        } catch (cleanupError) {
            console.warn('[kpi] equipment history replaced photo cleanup failed', cleanupError);
            browser.alert('\uC0C8 \uC0AC\uC9C4\uC740 \uC800\uC7A5\uD588\uC9C0\uB9CC \uAE30\uC874 \uCCA8\uBD80 \uC0AC\uC9C4 \uD30C\uC77C \uC815\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
    }

    async function applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, message) {
        if (!file || !state.draft) return false;
        return enqueueEquipmentHistoryPhotoUpload(state, () => applyEquipmentHistoryPhotoFileNow(root, state, data, redraw, file, message));
    }

    async function applyEquipmentHistoryPhotoFileNow(root, state, data, redraw, file, message) {
        const preview = root.querySelector('[data-equipment-history-photo-preview]');
        const placeholder = root.querySelector('[data-equipment-history-photo-placeholder]');
        if (!file || !state.draft) return false;
        const draft = state.draft;
        const previousPhoto = getDraftPhotoSnapshot(draft);
        try {
            const previousDocumentId = draft.photoDocumentId || '';
            const rawDataUrl = await readEquipmentPhotoFileAsDataUrl(file);
            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const normalized = doc
                ? await normalizeEquipmentPhotoAttachment(file, rawDataUrl, doc)
                : { dataUrl: rawDataUrl, file, name: file.name || '' };
            draft.photoDataUrl = normalized.dataUrl;
            draft.photoThumbDataUrl = '';
            draft.photoCrop = null;
            draft.photoDocumentId = '';
            draft.photoPreviewUrl = '';
            draft.photoDownloadUrl = '';
            draft.photoStorageRelPath = '';
            draft.photoFile = normalized.file || file;
            draft.photoName = normalized.name || file.name || '';
            draft.photoAttachmentKey = draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY;
            queueEquipmentHistoryPhotoDocumentCleanup(state, previousDocumentId);
            if (preview) {
                preview.src = draft.photoDataUrl;
                preview.hidden = false;
            }
            if (placeholder) placeholder.hidden = true;
            state.message = message || '\uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.';
            redraw();
            return true;
        } catch (error) {
            applyDraftPhotoSnapshot(draft, previousPhoto);
            redraw();
            console.warn('[kpi] equipment history photo attachment failed', error);
            browser.alert(getEquipmentHistoryPhotoAttachmentFailureMessage(error));
            return false;
        }
    }

    function bindPhotoSelectControls(root) {
        const input = root.querySelector('[data-equipment-history-photo-input]');
        if (!input) return;
        root.querySelectorAll('[data-equipment-history-photo-select]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault?.();
                input.click?.();
            });
        });
    }

    function bindPhotoClipboardPaste(root, state, data, redraw) {
        if (typeof state.disposePhotoPaste === 'function') {
            state.disposePhotoPaste();
            state.disposePhotoPaste = null;
        }

        const pasteRoot = root?.ownerDocument || root;
        if (!pasteRoot || typeof pasteRoot.addEventListener !== 'function') return;

        const handlePaste = async (event) => {
            if (root?.isConnected === false || !root?.querySelector?.('[data-equipment-history-photo-card]')) {
                state.disposePhotoPaste?.();
                return;
            }
            if (state.view !== 'card' || !state.draft) return;

            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const file = getPhotoFileFromClipboardData(event.clipboardData, doc);
            if (!file) return;

            event.preventDefault?.();
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
        };

        pasteRoot.addEventListener('paste', handlePaste);
        state.disposePhotoPaste = () => pasteRoot.removeEventListener?.('paste', handlePaste);
    }

    function bindPhotoPreview(root, state, data, redraw) {
        const input = root.querySelector('[data-equipment-history-photo-input]');
        if (!input) {
            state.disposePhotoPaste?.();
            state.disposePhotoPaste = null;
            return;
        }

        bindPhotoSelectControls(root);
        root.querySelectorAll('[data-equipment-history-photo-paste]').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.preventDefault?.();
                try {
                    const file = await readPhotoFileFromNavigatorClipboard(root);
                    if (!file) {
                        browser.alert('\uC0AC\uC9C4\uC744 \uBCF5\uC0AC\uD55C \uB4A4 \uC124\uBE44 \uC0AC\uC9C4 \uCE74\uB4DC\uC5D0\uC11C Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC5B4 \uC8FC\uC138\uC694.');
                        return;
                    }
                    await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
                } catch (error) {
                    console.warn('[kpi] equipment history clipboard photo read failed', error);
                    browser.alert('\uD074\uB9BD\uBCF4\uB4DC\uC5D0\uC11C \uC0AC\uC9C4\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC9C4\uC744 \uBCF5\uC0AC\uD55C \uB4A4 Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC5B4 \uC8FC\uC138\uC694.');
                }
            });
        });
        bindPhotoClipboardPaste(root, state, data, redraw);

        input.addEventListener('change', async (event) => {
            const [file] = event.target.files || [];
            if (!file || !state.draft) return;
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
            event.target.value = '';
        });
    }


    Object.assign(api, {
        getDraftPhotoSnapshot,
        applyDraftPhotoSnapshot,
        getEquipmentHistoryPhotoAttachmentFailureMessage,
        enqueueEquipmentHistoryPhotoUpload,
        clearDraftPhoto,
        revertPhoto,
        deleteDraft,
        loadEquipmentPhotoImage,
        getNormalizedEquipmentPhotoFileName,
        canvasToJpegBlob,
        normalizeEquipmentPhotoAttachment,
        getClipboardImageExtension,
        isClipboardImageType,
        createNamedClipboardImageFile,
        ensureClipboardImageFileName,
        getPhotoFileFromClipboardData,
        readPhotoFileFromNavigatorClipboard,
        readEquipmentPhotoFileAsDataUrl,
        cleanupPreviousEquipmentPhotoDocument,
        applyEquipmentHistoryPhotoFile,
        applyEquipmentHistoryPhotoFileNow,
        bindPhotoSelectControls,
        bindPhotoClipboardPaste,
        bindPhotoPreview,
    });
})();
