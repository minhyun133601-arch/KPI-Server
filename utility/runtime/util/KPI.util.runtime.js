(function registerUtilRuntime(root) {
    const browser = typeof KpiUtilRuntimeBrowserAdapter !== 'undefined'
        ? KpiUtilRuntimeBrowserAdapter
        : null;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] || Object.create(null);
    const runtime = browser?.getRuntime?.();
    if (!runtime) return;

    function getUtilitySurface(context = {}) {
        return String(context.category?.utilitySurface || '').trim();
    }

    function getDataUtilitySurface(context = {}) {
        if (context.sectionId !== 'data') return '';
        return getUtilitySurface(context);
    }

    function isUtilityEntryExperimentSaveSurface(context = {}) {
        return getDataUtilitySurface(context) === 'entry-experiment';
    }

    function getUtilityEntryExperimentHost(context = {}) {
        return context.container?.querySelector?.('[data-role="utility-entry-experiment"]') || null;
    }

    function getUtilityEntryExperimentPeriodFromElement(element) {
        if (!element || typeof element.closest !== 'function') return '';
        if (element.closest('.utility-entry-experiment-view.is-monthly')) return 'monthly';
        if (element.closest('.utility-entry-experiment-view.is-daily')) return 'daily';
        return '';
    }

    function getUtilityEntryExperimentCheckedPeriod(host) {
        if (!host || typeof host.querySelector !== 'function') return '';
        if (host.querySelector('#utility-entry-experiment-monthly:checked')) return 'monthly';
        if (host.querySelector('#utility-entry-experiment-daily:checked')) return 'daily';
        return '';
    }

    function isUtilityEntryExperimentViewVisible(view) {
        if (!view) return false;
        const viewWindow = view.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
        const style = typeof viewWindow?.getComputedStyle === 'function'
            ? viewWindow.getComputedStyle(view)
            : (typeof getComputedStyle === 'function' ? getComputedStyle(view) : null);
        if (style) {
            return style.display !== 'none' && style.visibility !== 'hidden';
        }
        if (typeof view.getClientRects === 'function') {
            return view.getClientRects().length > 0;
        }
        return false;
    }

    function getUtilityEntryExperimentVisiblePeriod(host) {
        if (!host || typeof host.querySelector !== 'function') return '';
        const monthlyView = host.querySelector('.utility-entry-experiment-view.is-monthly');
        if (isUtilityEntryExperimentViewVisible(monthlyView)) return 'monthly';
        const dailyView = host.querySelector('.utility-entry-experiment-view.is-daily');
        if (isUtilityEntryExperimentViewVisible(dailyView)) return 'daily';
        return '';
    }

    function getUtilityEntryExperimentActivePeriod(host) {
        if (!host) return 'daily';
        const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
        if (activeElement && typeof host.contains === 'function' && host.contains(activeElement)) {
            const activePeriod = getUtilityEntryExperimentPeriodFromElement(activeElement);
            if (activePeriod) return activePeriod;
        }
        const checkedPeriod = getUtilityEntryExperimentCheckedPeriod(host);
        if (checkedPeriod) return checkedPeriod;
        const rememberedPeriod = String(host.dataset?.utilityEntryExperimentActivePeriod || '').trim();
        if (rememberedPeriod === 'monthly' || rememberedPeriod === 'daily') return rememberedPeriod;
        return getUtilityEntryExperimentVisiblePeriod(host) || 'daily';
    }

    runtime.registerSectionInitializer('data', (context = {}) => {
        const surface = getDataUtilitySurface(context);
        void surface;
    });

    runtime.registerSectionInitializer('experiment', (context = {}) => {
        void context;
    });

    runtime.registerSectionInitializer('report', ({ container }) => {
        initUtilSheetReports(container);
        parts.initReportDeckEditor(container);
    });

    runtime.registerBootTask('util-electric-metering-sync', () => {
        bootUtilElectricMeteringSync();
    });

    runtime.registerBootTask('util-gas-metering-sync', () => {
        bootUtilGasMeteringSync();
    });

    runtime.registerBootTask('util-waste-metering-sync', () => {
        bootUtilWasteMeteringSync();
    });

    runtime.registerSaveProvider('util-entry-experiment-save', (context = {}) => {
        if (!isUtilityEntryExperimentSaveSurface(context)) return null;

        const host = getUtilityEntryExperimentHost(context);
        if (!host || typeof browser?.saveUtilityEntryExperiment !== 'function') return null;

        const utilityEntryRuntime = browser?.getUtilityEntryRuntimeConfig?.();
        const canWrite = runtime.canUseServerWrite(utilityEntryRuntime?.writeEnabled === true);
        return {
            priority: 120,
            canSave: canWrite,
            buttonLabel: '저장',
            historyLabel: '유틸리티 기입 저장',
            title: '유틸리티 기입 데이터 저장',
            statusText: canWrite
                ? '현재 유틸리티 기입 데이터를 중앙 서버에 저장합니다.'
                : '서버 기록이 가능한 환경에서만 유틸리티 기입 데이터를 저장할 수 있습니다.',
            perform: () => {
                if (!canWrite) return false;
                return browser.saveUtilityEntryExperiment(host, getUtilityEntryExperimentActivePeriod(host));
            }
        };
    });

    [
        ['util-report-builder-viz', () => typeof closeUtilReportBuilderVizModal === 'function' && closeUtilReportBuilderVizModal()],
        ['util-report-builder', () => typeof closeUtilReportBuilderModal === 'function' && closeUtilReportBuilderModal()],
        ['util-report-graph', () => typeof closeUtilReportGraphModal === 'function' && closeUtilReportGraphModal()],
        ['util-report-composition', () => typeof closeUtilReportCompositionModal === 'function' && closeUtilReportCompositionModal()],
        ['util-report-yoy', () => typeof closeUtilReportYoYModal === 'function' && closeUtilReportYoYModal()],
        ['util-sheet-report', () => typeof closeUtilSheetReportModal === 'function' && closeUtilSheetReportModal()],
        ['util-report', () => typeof closeUtilReportModal === 'function' && closeUtilReportModal()],
        ['util-energy', () => typeof closeUtilEnergyModal === 'function' && closeUtilEnergyModal()],
        ['util-chart', () => typeof closeUtilChartModal === 'function' && closeUtilChartModal()],
        ['util-metric-export', () => typeof closeUtilMetricExportModal === 'function' && closeUtilMetricExportModal()],
        ['util-selective-delete', () => typeof closeUtilSelectiveDeleteModal === 'function' && closeUtilSelectiveDeleteModal()],
        ['util-production-detail', () => typeof closeUtilProductionDetailModal === 'function' && closeUtilProductionDetailModal()],
        ['util-production-archive', () => typeof closeUtilProductionArchiveModal === 'function' && closeUtilProductionArchiveModal()]
    ].forEach(([key, closer]) => {
        runtime.registerShortcutCloser(key, closer);
    });

})(this);
