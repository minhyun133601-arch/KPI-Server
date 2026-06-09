(function initKpiWorkHistoryViewActionDocument() {
    const browser = KpiWorkHistoryBrowserAdapter;
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        DATA_KEY,
        state,
        getElement,
        getPayload,
        isProductionReportWorkspace,
        saveNow,
        getRecordRuntimeConfig,
        buildExportScript
    } = history;

    function isProductionWorkspace() {
        return typeof isProductionReportWorkspace === 'function' && isProductionReportWorkspace();
    }

    async function exportAllData() {
        const runtimeConfig = getRecordRuntimeConfig();
        const serverWritable = browser.canUseServerWrite(runtimeConfig?.writeEnabled === true);

        if (!serverWritable) {
            showToast(isProductionWorkspace()
                ? '서버 기록이 가능한 환경에서만 실적 보고서를 저장할 수 있습니다.'
                : '서버 기록이 가능한 환경에서만 저장할 수 있습니다.');
            return false;
        }

        const saved = await saveNow();
        if (saved) {
            if (typeof setLastModified === 'function') {
                setLastModified(state.activeCategory?.title || (isProductionWorkspace() ? '생산 본부 실적보고' : '팀별내역서'));
            }
            showToast(isProductionWorkspace() ? '전체 실적 보고서가 저장되었습니다.' : '전체 작업내역이 저장되었습니다.');
            return true;
        }
        showToast(isProductionWorkspace()
            ? '실적 보고서 서버 저장에 실패했습니다. 잠시 뒤 다시 시도해 주세요.'
            : '서버 저장에 실패했습니다. 잠시 뒤 다시 시도해 주세요.');
        return false;
    }

    async function performPrimarySave() {
        if (view.isRecordModalOpen?.()) {
            return view.saveRecord?.();
        }
        return exportAllData();
    }

    function downloadBackupSnapshot() {
        const fileName = `data_${DATA_KEY}_${view.buildTimestampLabel()}.js`;
        const content = buildExportScript(getPayload());
        const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        return true;
    }

    function showToast(message) {
        const toast = getElement('saveToast');
        if (!toast) return;
        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) messageEl.textContent = message;
        toast.classList.add('show');
        if (state.toastTimer) {
            clearTimeout(state.toastTimer);
        }
        state.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            state.toastTimer = null;
        }, 2400);
    }

    function closeOverlays(options = {}) {
        const recordCloseResult = view.closeRecordModal?.({ confirm: options.confirm === true });
        if (recordCloseResult === false) return false;
        view.closeDeleteModal?.();
        return true;
    }

    Object.assign(view, {
        exportAllData,
        performPrimarySave,
        downloadBackupSnapshot,
        showToast,
        closeOverlays
    });
})();
