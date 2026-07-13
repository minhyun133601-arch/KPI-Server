(function registerKpiUtilityEntryBillingIo(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS } = parts.constants;

    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;

    async function loadUtilityEntryExperimentActualRecords() {
        if (parts.state.actualRecordPromise) return parts.state.actualRecordPromise;
        parts.state.actualRecordPromise = Promise.all(Object.entries(UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS).map(async ([resourceType, recordKey]) => {
            if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
            const response = await fetch(`/api/modules/util_metering/records/${encodeURIComponent(recordKey)}`, {
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (resourceType === 'other' && response.status === 404) {
                return [resourceType, {}];
            }
            if (!response.ok) throw new Error(`record_read_failed:${recordKey}:${response.status}`);
            const payload = await response.json();
            return [resourceType, payload?.record?.payload || {}];
        })).then(entries => Object.fromEntries(entries));
        return parts.state.actualRecordPromise;
    }

    function normalizeUtilityEntryExperimentResourceType(value = '') {
        const resourceType = String(value || '').trim();
        return Object.prototype.hasOwnProperty.call(UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS, resourceType)
            ? resourceType
            : '';
    }

    async function fetchUtilityEntryExperimentSharedStore() {
        if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
        const response = await fetch('/api/shared-store', {
            cache: 'no-store',
            credentials: 'same-origin'
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true) {
            throw new Error(`shared_store_read_failed:${response.status}`);
        }
        return {
            store: parts.isUtilityEntryExperimentPlainObject(payload?.store) ? payload.store : {},
            meta: parts.isUtilityEntryExperimentPlainObject(payload?.meta) ? payload.meta : null
        };
    }

    async function putUtilityEntryExperimentSharedStore(store, meta = null) {
        if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
        const expectedVersion = Number.isInteger(meta?.version) ? meta.version : null;
        const expectedRecordVersions = parts.isUtilityEntryExperimentPlainObject(meta?.recordVersions)
            ? meta.recordVersions
            : null;
        const response = await fetch('/api/shared-store', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                store,
                expectedVersion,
                expectedRecordVersions
            })
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 409 || payload?.error === 'version_conflict') {
            const error = new Error('version_conflict');
            error.currentMeta = payload?.currentMeta || null;
            throw error;
        }
        if (!response.ok || payload?.ok !== true) {
            throw new Error(`shared_store_write_failed:${response.status}`);
        }
        return payload;
    }

    function alertUtilityEntryExperimentUser(message) {
        if (typeof utilityEntryExperimentRoot?.alert === 'function') {
            utilityEntryExperimentRoot.alert(message);
        }
    }

    function showUtilityEntryExperimentSavedPopup(options = {}) {
        if (options.showSavedPopup !== true) return false;
        alertUtilityEntryExperimentUser('저장되었습니다');
        return true;
    }

    function confirmUtilityEntryExperimentUser(message) {
        if (typeof utilityEntryExperimentRoot?.confirm === 'function') {
            return utilityEntryExperimentRoot.confirm(message);
        }
        return false;
    }

    function isUtilityEntryExperimentPdfFile(file) {
        if (!file) return false;
        const name = String(file.name || '').trim();
        const type = String(file.type || '').trim().toLowerCase();
        return /\.pdf$/i.test(name) || type === 'application/pdf';
    }

    function requestUtilityEntryExperimentBillingDocumentFile() {
        return new Promise(resolve => {
            if (typeof document === 'undefined') {
                resolve(null);
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/pdf,.pdf';
            input.tabIndex = -1;
            input.hidden = true;
            input.setAttribute('aria-hidden', 'true');

            let settled = false;
            const finish = file => {
                if (settled) return;
                settled = true;
                utilityEntryExperimentRoot?.removeEventListener?.('focus', handleWindowFocus);
                cleanup();
                if (file && !isUtilityEntryExperimentPdfFile(file)) {
                    alertUtilityEntryExperimentUser('PDF 파일만 첨부할 수 있습니다.');
                    resolve(null);
                    return;
                }
                resolve(file);
            };
            const cleanup = () => input.remove();
            const handleWindowFocus = () => {
                utilityEntryExperimentRoot?.setTimeout?.(() => finish(input.files?.[0] || null), 300);
            };
            input.addEventListener('change', () => finish(input.files?.[0] || null), { once: true });

            document.body.appendChild(input);
            utilityEntryExperimentRoot?.addEventListener?.('focus', handleWindowFocus, { once: true });
            input.click();
        });
    }

    function readUtilityEntryExperimentFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const result = String(reader.result || '');
                const commaIndex = result.indexOf(',');
                if (commaIndex < 0) {
                    reject(new Error('invalid_billing_document_result'));
                    return;
                }
                resolve(result.slice(commaIndex + 1));
            });
            reader.addEventListener('error', () => {
                reject(reader.error || new Error('billing_document_read_failed'));
            });
            reader.readAsDataURL(file);
        });
    }

    async function uploadUtilityEntryExperimentBillingDocument(file, monthValue, resourceType, scopeKey) {
        if (!isUtilityEntryExperimentPdfFile(file)) throw new Error('billing_document_pdf_only');
        const base64Data = await readUtilityEntryExperimentFileAsBase64(file);
        const response = await fetch('/api/billing-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                monthValue,
                resourceType,
                scopeKey,
                fileName: file.name || '',
                mimeType: file.type || 'application/pdf',
                base64Data
            })
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true) {
            throw new Error(payload?.error || `billing_document_upload_failed:${response.status}`);
        }
        return payload.document || {};
    }

    function isUtilityEntryExperimentBillingDocumentLeaf(rawDocument) {
        if (!parts.isUtilityEntryExperimentPlainObject(rawDocument)) return false;
        return Boolean(
            String(rawDocument.fileName || '').trim()
            || String(rawDocument.relativePath || '').trim()
            || String(rawDocument.documentId || '').trim()
            || String(rawDocument.previewUrl || '').trim()
            || String(rawDocument.downloadUrl || '').trim()
            || String(rawDocument.base64Data || '').trim()
        );
    }

    function getUtilityEntryExperimentBillingDocumentScopeMap(monthRecord) {
        if (!parts.isUtilityEntryExperimentPlainObject(monthRecord)) return {};
        if (parts.isUtilityEntryExperimentPlainObject(monthRecord.scopes)) {
            return { ...monthRecord.scopes };
        }

        const scopeMap = {};
        Object.entries(monthRecord).forEach(([key, value]) => {
            if (
                !['monthValue', 'updatedAt'].includes(key)
                && parts.isUtilityEntryExperimentPlainObject(value)
            ) {
                scopeMap[key] = value;
            }
        });
        if (Object.keys(scopeMap).length) return scopeMap;
        return isUtilityEntryExperimentBillingDocumentLeaf(monthRecord)
            ? { yusan: monthRecord }
            : {};
    }

    function normalizeUtilityEntryExperimentBillingDocument(monthValue, rawDocument, resourceType, scopeKey) {
        if (!parts.isUtilityEntryExperimentPlainObject(rawDocument)) return null;
        const fileName = String(rawDocument.fileName || rawDocument.originalName || rawDocument.original_name || '').trim();
        if (!fileName) return null;
        return {
            monthValue,
            resourceType,
            scopeKey,
            documentId: String(rawDocument.documentId || rawDocument.document_id || '').trim(),
            fileName,
            mimeType: String(rawDocument.mimeType || rawDocument.mime_type || '').trim(),
            savedAt: String(rawDocument.savedAt || rawDocument.saved_at || new Date().toISOString()).trim(),
            savedToLocalDirectory: rawDocument.savedToLocalDirectory === true,
            previewUrl: String(rawDocument.previewUrl || rawDocument.preview_url || '').trim(),
            downloadUrl: String(rawDocument.downloadUrl || rawDocument.download_url || '').trim(),
            base64Data: String(rawDocument.base64Data || rawDocument.base64_data || '').trim(),
            relativePath: String(rawDocument.relativePath || rawDocument.relative_path || '').trim()
        };
    }

    function setUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, document, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey || !parts.isUtilityEntryExperimentPlainObject(document)) return;
        if (!parts.isUtilityEntryExperimentPlainObject(dataset.billingDocuments)) {
            dataset.billingDocuments = {};
        }

        const scopeMap = getUtilityEntryExperimentBillingDocumentScopeMap(dataset.billingDocuments[monthValue]);
        scopeMap[scopeKey] = document;
        dataset.billingDocuments[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(
                Object.entries(scopeMap).filter(([, value]) => parts.isUtilityEntryExperimentPlainObject(value))
            ),
            updatedAt
        };
    }

    function deleteUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey || !parts.isUtilityEntryExperimentPlainObject(dataset.billingDocuments)) return;
        const scopeMap = getUtilityEntryExperimentBillingDocumentScopeMap(dataset.billingDocuments[monthValue]);
        delete scopeMap[scopeKey];

        const scopeEntries = Object.entries(scopeMap)
            .filter(([, value]) => parts.isUtilityEntryExperimentPlainObject(value));
        if (!scopeEntries.length) {
            delete dataset.billingDocuments[monthValue];
            return;
        }

        dataset.billingDocuments[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(scopeEntries),
            updatedAt
        };
    }

    function getUtilityEntryExperimentBillingDocumentForScope(records, resourceType, monthValue, scopeKey) {
        const dataset = records?.[resourceType];
        const rawDocument = getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey];
        return normalizeUtilityEntryExperimentBillingDocument(monthValue, rawDocument, resourceType, scopeKey);
    }

    function getUtilityEntryExperimentBillingDocumentPreviewUrl(document) {
        if (!document) return '';
        if (document.previewUrl) return document.previewUrl;
        if (document.documentId) return `/api/files/${encodeURIComponent(document.documentId)}/view`;
        if (document.downloadUrl) return document.downloadUrl;
        if (document.base64Data) {
            return `data:${document.mimeType || 'application/pdf'};base64,${document.base64Data}`;
        }
        return '';
    }

    function renderUtilityEntryExperimentBillingDocumentActions(host, records, monthValue) {
        const containers = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-billing-actions"]') || []);
        containers.forEach(container => {
            const resourceType = normalizeUtilityEntryExperimentResourceType(container.dataset.utilityEntryExperimentResourceType);
            const scopeKey = String(container.dataset.utilityEntryExperimentScopeKey || '').trim();
            const document = getUtilityEntryExperimentBillingDocumentForScope(records, resourceType, monthValue, scopeKey);
            const previewUrl = getUtilityEntryExperimentBillingDocumentPreviewUrl(document);
            const hasDocument = Boolean(document?.fileName && previewUrl);
            const attachButton = container.querySelector('[data-role="utility-entry-experiment-billing-attach"]');
            const viewButton = container.querySelector('[data-role="utility-entry-experiment-billing-view"]');
            const clearButton = container.querySelector('[data-role="utility-entry-experiment-billing-clear"]');
            const fileName = document?.fileName || '';

            container.dataset.utilityEntryExperimentAttachmentState = hasDocument ? 'attached' : 'empty';
            container.dataset.utilityEntryExperimentDocumentId = hasDocument ? document.documentId : '';
            container.dataset.utilityEntryExperimentPreviewUrl = hasDocument ? previewUrl : '';
            container.dataset.utilityEntryExperimentFileName = hasDocument ? fileName : '';
            container.title = hasDocument ? fileName : '';

            if (attachButton) {
                attachButton.hidden = hasDocument;
                attachButton.disabled = false;
                attachButton.setAttribute('aria-busy', 'false');
            }
            if (viewButton) {
                viewButton.hidden = !hasDocument;
                viewButton.disabled = !hasDocument;
                viewButton.dataset.utilityEntryExperimentPreviewUrl = hasDocument ? previewUrl : '';
                viewButton.setAttribute('aria-label', hasDocument ? `${fileName} 보기` : '첨부 보기');
                viewButton.title = hasDocument ? fileName : '첨부 보기';
            }
            if (clearButton) {
                clearButton.hidden = !hasDocument;
                clearButton.disabled = !hasDocument;
                clearButton.setAttribute('aria-label', hasDocument ? `${fileName} 첨부 취소` : '첨부 취소');
                clearButton.title = hasDocument ? `${fileName} 첨부 취소` : '첨부 취소';
            }
        });
    }

    function openUtilityEntryExperimentBillingDocumentView(button) {
        const url = String(button?.dataset?.utilityEntryExperimentPreviewUrl || '').trim();
        if (!url) {
            alertUtilityEntryExperimentUser('볼 수 있는 첨부가 없습니다.');
            return false;
        }

        const popup = typeof utilityEntryExperimentRoot?.open === 'function'
            ? utilityEntryExperimentRoot.open(url, '_blank', 'noopener,noreferrer')
            : null;
        if (popup) return true;

        if (typeof document !== 'undefined') {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.click();
            return true;
        }
        return false;
    }

    async function deleteUtilityEntryExperimentBillingDocumentStorage(document) {
        const documentId = String(document?.documentId || '').trim();
        if (!documentId || typeof fetch !== 'function') return false;

        const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
            method: 'DELETE',
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`billing_document_delete_failed:${response.status}`);
        }
        return true;
    }

    async function handleUtilityEntryExperimentBillingClearClick(host, button) {
        if (!host || !button) return;
        const container = button.closest?.('[data-role="utility-entry-experiment-billing-actions"]');
        const resourceType = normalizeUtilityEntryExperimentResourceType(container?.dataset?.utilityEntryExperimentResourceType);
        const scopeKey = String(container?.dataset?.utilityEntryExperimentScopeKey || '').trim();
        const monthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
        if (!resourceType || !scopeKey || !monthValue) return;

        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        parts.setUtilityEntryExperimentSaveStatus(host, 'saving', '첨부 취소 중');

        try {
            const { store: currentStore, meta } = await fetchUtilityEntryExperimentSharedStore();
            const store = parts.cloneUtilityEntryExperimentJson(currentStore);
            const dataset = parts.getUtilityEntryExperimentStoreDataset(store, resourceType);
            const existingDocument = normalizeUtilityEntryExperimentBillingDocument(
                monthValue,
                getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey],
                resourceType,
                scopeKey
            );

            const updatedAt = new Date().toISOString();
            deleteUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, updatedAt);
            markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt);
            await putUtilityEntryExperimentSharedStore(store, meta);
            if (existingDocument) {
                await deleteUtilityEntryExperimentBillingDocumentStorage(existingDocument);
            }
            parts.state.actualRecordPromise = null;
            await parts.populateUtilityEntryExperimentActualValues(host);
            parts.setUtilityEntryExperimentSaveStatus(host, 'saved', '첨부 취소됨');
        } catch (error) {
            console.error('Utility entry experiment billing document clear failed.', error);
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            parts.setUtilityEntryExperimentSaveStatus(host, 'error', '첨부 취소 실패');
            alertUtilityEntryExperimentUser('첨부 취소 실패');
        } finally {
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
        }
    }

    function markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey) return;
        const currentEntry = parts.getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey);
        if (!parts.isUtilityEntryExperimentPlainObject(currentEntry)) return;
        parts.setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, scopeKey, {
            ...currentEntry,
            completed: false,
            updatedAt
        });
    }

    async function handleUtilityEntryExperimentBillingAttachClick(host, button) {
        if (!host || !button) return;
        const resourceType = normalizeUtilityEntryExperimentResourceType(button.dataset.utilityEntryExperimentResourceType);
        const scopeKey = String(button.dataset.utilityEntryExperimentScopeKey || '').trim();
        const monthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
        if (!resourceType || !scopeKey || !monthValue) return;

        const selectedFile = await requestUtilityEntryExperimentBillingDocumentFile();
        if (!selectedFile) return;

        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        parts.setUtilityEntryExperimentSaveStatus(host, 'saving', '첨부 저장 중');

        try {
            const { store: currentStore, meta } = await fetchUtilityEntryExperimentSharedStore();
            const store = parts.cloneUtilityEntryExperimentJson(currentStore);
            const dataset = parts.getUtilityEntryExperimentStoreDataset(store, resourceType);
            const existingDocument = getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey];
            if (existingDocument?.fileName) {
                const confirmed = confirmUtilityEntryExperimentUser(`"${existingDocument.fileName}" 첨부를 새 파일로 교체할까요?`);
                if (!confirmed) {
                    parts.setUtilityEntryExperimentSaveStatus(host, 'idle', '첨부 취소');
                    return;
                }
            }

            const uploadedDocument = await uploadUtilityEntryExperimentBillingDocument(
                selectedFile,
                monthValue,
                resourceType,
                scopeKey
            );
            const updatedAt = new Date().toISOString();
            const normalizedDocument = normalizeUtilityEntryExperimentBillingDocument(
                monthValue,
                uploadedDocument,
                resourceType,
                scopeKey
            );
            if (!normalizedDocument) throw new Error('billing_document_normalize_failed');

            setUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, normalizedDocument, updatedAt);
            markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt);
            await putUtilityEntryExperimentSharedStore(store, meta);
            parts.state.actualRecordPromise = null;
            await parts.populateUtilityEntryExperimentActualValues(host);
            parts.setUtilityEntryExperimentSaveStatus(host, 'saved', '첨부 저장됨');
        } catch (error) {
            console.error('Utility entry experiment billing document upload failed.', error);
            const message = error?.message === 'billing_document_pdf_only'
                ? 'PDF 파일만 첨부할 수 있습니다.'
                : '첨부 저장 실패';
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            parts.setUtilityEntryExperimentSaveStatus(host, 'error', message);
            alertUtilityEntryExperimentUser(message);
        } finally {
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
        }
    }


    Object.assign(parts, { loadUtilityEntryExperimentActualRecords, normalizeUtilityEntryExperimentResourceType, fetchUtilityEntryExperimentSharedStore, putUtilityEntryExperimentSharedStore, alertUtilityEntryExperimentUser, showUtilityEntryExperimentSavedPopup, confirmUtilityEntryExperimentUser, isUtilityEntryExperimentPdfFile, requestUtilityEntryExperimentBillingDocumentFile, readUtilityEntryExperimentFileAsBase64, uploadUtilityEntryExperimentBillingDocument, isUtilityEntryExperimentBillingDocumentLeaf, getUtilityEntryExperimentBillingDocumentScopeMap, normalizeUtilityEntryExperimentBillingDocument, setUtilityEntryExperimentBillingDocumentForScope, deleteUtilityEntryExperimentBillingDocumentForScope, getUtilityEntryExperimentBillingDocumentForScope, getUtilityEntryExperimentBillingDocumentPreviewUrl, renderUtilityEntryExperimentBillingDocumentActions, openUtilityEntryExperimentBillingDocumentView, deleteUtilityEntryExperimentBillingDocumentStorage, handleUtilityEntryExperimentBillingClearClick, markUtilityEntryExperimentSettlementIncompleteForDocument, handleUtilityEntryExperimentBillingAttachClick });
})(this);
