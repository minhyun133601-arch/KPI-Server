(function registerWorkRuntime() {
    const browser = typeof KpiWorkBrowserAdapter !== 'undefined' ? KpiWorkBrowserAdapter : null;
    const runtime = browser?.getRuntime?.();
    if (!runtime) return;

    function buildWorkHistorySaveProvider(context = {}) {
        const isSupportedSection = context.sectionId === 'work';
        if (!isSupportedSection) return null;
        if (context.category?.view !== 'history_tool') return null;

        const serverWritable = browser?.canUseHistoryServerWrite?.() === true;
        const saveTitle = '작업이력 저장';
        const statusText = !serverWritable
            ? '서버 기록이 가능한 환경에서만 작업이력을 저장할 수 있습니다.'
            : (browser?.isHistoryRecordModalOpen?.()
                ? '현재 입력 중인 작업이력을 포함해 서버에 저장합니다.'
                : '현재 작업이력 전체를 서버에 저장합니다.');

        return {
            priority: 120,
            canSave: serverWritable && browser?.canPerformHistoryPrimarySave?.() === true,
            buttonLabel: '저장',
            historyLabel: saveTitle,
            title: saveTitle,
            statusText,
            perform: async () => {
                if (!serverWritable) return false;
                const result = await browser?.performHistoryPrimarySave?.();
                if (result !== false && typeof setLastModified === 'function') {
                    setLastModified(
                        context.category?.title
                        || AppData?.work?.name
                        || '작업이력 문서'
                    );
                }
                return result !== false;
            }
        };
    }

    runtime.registerSectionRenderer('work', (category, context = {}) => {
        renderWorkContent(category, context);
    });

    runtime.registerBootTask('work-last-modified', () => {
        renderLastModified();
    });

    runtime.registerSaveProvider('work-history-save', (context = {}) => buildWorkHistorySaveProvider(context));

    runtime.registerShortcutCloser('work-team-calendar', () => {
        if (typeof closeWorkTeamCalendarModal === 'function') {
            closeWorkTeamCalendarModal();
        }
    });

    runtime.registerShortcutCloser('work-history', (options = {}) => {
        return browser?.closeHistoryOverlays?.(options);
    });
})();
