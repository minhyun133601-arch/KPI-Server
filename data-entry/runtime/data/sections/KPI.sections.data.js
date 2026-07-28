(function registerKpiUtilityEntryFacade(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const required = ["escapeUtilityEntryExperimentHtml","buildUtilityEntryExperimentPanel","buildUtilityEntryExperimentViews","sanitizeUtilityEntryExperimentNumberText","normalizeUtilityEntryExperimentNumberText","formatUtilityEntryExperimentNumberText","getUtilityEntryExperimentDailyEntryStatus","getUtilityEntryExperimentDailyEntryStatuses","getUtilityEntryExperimentMonthlyMeterLinkStates","openUtilityEntryExperimentMonthlyMeterSheet","getUtilityEntryExperimentSelectedMonth","openUtilityEntryExperimentGraphTemplateByKey","renderUtilityEntryExperimentGraphTemplateByKey","captureUtilityEntryExperimentGraphPdf","toggleUtilityEntryExperimentGraphMemoOverview","isUtilityEntryExperimentGraphFullscreen","syncUtilityEntryExperimentGraphFullscreenState","toggleUtilityEntryExperimentGraphFullscreen","exitUtilityEntryExperimentGraphFullscreen","initializeUtilityEntryExperiment","initializeUtilityEntryExperimentShells","populateUtilityEntryExperimentActualValues","saveUtilityEntryExperiment","setupUtilityEntryExperimentAutoInitialize"];
    for (const name of required) {
        if (typeof parts[name] !== 'function') throw new Error(`Missing utility-entry part: ${name}`);
    }
    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;

    function buildUtilityEntryExperimentSwitch(views) {
        return `
            <div class="utility-entry-experiment-switch">
                ${views.map((view, index) => `
                    <input
                        class="utility-entry-experiment-radio"
                        type="radio"
                        name="utility-entry-experiment-view"
                        id="utility-entry-experiment-${parts.escapeUtilityEntryExperimentHtml(view.key)}"
                        ${index === 0 ? 'checked' : ''}
                    />
                `).join('')}
                <div class="utility-entry-experiment-view-stack">
                    ${views.map(view => `
                        <div class="utility-entry-experiment-view is-${parts.escapeUtilityEntryExperimentHtml(view.key)}">
                            ${parts.buildUtilityEntryExperimentPanel({
                                period: view.period,
                                year: view.year,
                                month: view.month,
                                date: view.date,
                                body: view.body
                            })}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function buildUtilityEntryExperimentContent() {
        const views = parts.buildUtilityEntryExperimentViews();
        return `
            <div class="utility-entry-experiment" data-role="utility-entry-experiment">
                ${buildUtilityEntryExperimentSwitch(views)}
            </div>
        `;
    }

    KpiSectionFactoryAdapter.registerFactory('data', function buildDataSection() {
        const AppData = {};
        AppData.data = {
            id: 'data',
            name: '데이터 관리',
            icon: 'fa-database',
            color: 'slate',
            accent: '#64748b',
            categories: [
                {
                    title: '유틸리티',
                    icon: 'fa-table-cells-large',
                    color: '#2563eb',
                    desc: '전기, 가스, 폐수 검침 데이터와 비용을 기입합니다.',
                    viewerMode: 'full-bleed',
                    utilitySurface: 'entry-experiment',
                    content: buildUtilityEntryExperimentContent()
                },
                {
                    title: '작업 이력',
                    icon: 'fa-clipboard-list',
                    color: '#0f766e',
                    desc: '',
                    shortcutTarget: {
                        sectionId: 'work',
                        dataKey: 'work_history_records',
                        options: { keepSidebarCollapsed: true }
                    }
                },
                {
                    title: '설비 이력',
                    icon: 'fa-table-list',
                    color: '#475569',
                    viewerMode: 'full-bleed',
                    desc: '',
                    dataKey: 'data_equipment_history_card',
                    fileName: 'Central Server DB / Equipment History Card',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600">
                            설비 이력 화면을 불러오는 중입니다.
                        </div>
                    `
                },
                {
                    title: '조도',
                    icon: 'fa-sun',
                    color: '#f59e0b',
                    viewerMode: 'full-bleed',
                    desc: '분기별 조도 측정값, 기준값, 개선 조치, 첨부 스캔본을 관리합니다.',
                    dataKey: 'audit_lux',
                    fileName: 'Central Server DB / Lux Data',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
                            조도 화면을 불러오는 중입니다.
                        </div>
                    `
                }
            ]
        };
        return AppData.data;
    });

    if (utilityEntryExperimentRoot) {
        utilityEntryExperimentRoot.KpiUtilityEntryExperiment = {
            sanitizeNumberText: parts.sanitizeUtilityEntryExperimentNumberText,
            normalizeNumberText: parts.normalizeUtilityEntryExperimentNumberText,
            formatNumberText: parts.formatUtilityEntryExperimentNumberText,
            getDailyEntryStatus: parts.getUtilityEntryExperimentDailyEntryStatus,
            getDailyEntryStatuses: parts.getUtilityEntryExperimentDailyEntryStatuses,
            getMonthlyMeterLinkStates: parts.getUtilityEntryExperimentMonthlyMeterLinkStates,
            openMonthlyMeterSheet(datasetKey = '', linkKey = '') {
                const host = typeof document !== 'undefined'
                    ? document.querySelector('[data-role="utility-entry-experiment"]')
                    : null;
                return parts.openUtilityEntryExperimentMonthlyMeterSheet(host, datasetKey, linkKey);
            },
            openGraphTemplate(graphKey = '', monthValue = '') {
                const host = typeof document !== 'undefined'
                    ? document.querySelector('[data-role="utility-entry-experiment"]')
                    : null;
                const selectedMonth = monthValue || parts.getUtilityEntryExperimentSelectedMonth(host);
                return parts.openUtilityEntryExperimentGraphTemplateByKey(graphKey, selectedMonth);
            },
            renderGraphTemplate(target = null, graphKey = '', monthValue = '') {
                const host = typeof document !== 'undefined'
                    ? document.querySelector('[data-role="utility-entry-experiment"]')
                    : null;
                const selectedMonth = monthValue || parts.getUtilityEntryExperimentSelectedMonth(host);
                return parts.renderUtilityEntryExperimentGraphTemplateByKey(target, graphKey, selectedMonth);
            },
            captureGraphPdf(modal = null) {
                return parts.captureUtilityEntryExperimentGraphPdf(modal);
            },
            toggleGraphMemoOverview(modal = null) {
                return parts.toggleUtilityEntryExperimentGraphMemoOverview(modal);
            },
            isGraphFullscreen(modal = null) {
                return parts.isUtilityEntryExperimentGraphFullscreen(modal);
            },
            syncGraphFullscreenState(modal = null) {
                return parts.syncUtilityEntryExperimentGraphFullscreenState(modal);
            },
            toggleGraphFullscreen(modal = null) {
                return parts.toggleUtilityEntryExperimentGraphFullscreen(modal);
            },
            exitGraphFullscreen(modal = null) {
                return parts.exitUtilityEntryExperimentGraphFullscreen(modal);
            },
            initialize: parts.initializeUtilityEntryExperiment,
            initializeAll: parts.initializeUtilityEntryExperimentShells,
            populateActualValues: parts.populateUtilityEntryExperimentActualValues,
            save: parts.saveUtilityEntryExperiment
        };
    }
    parts.setupUtilityEntryExperimentAutoInitialize();
})(this);
