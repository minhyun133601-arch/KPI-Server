(function registerUtilRuntime() {
    const browser = typeof KpiUtilRuntimeBrowserAdapter !== 'undefined'
        ? KpiUtilRuntimeBrowserAdapter
        : null;
    const runtime = browser?.getRuntime?.();
    if (!runtime) return;

    function initializeUtilityEntrySurface({ container } = {}) {
        void browser?.initIntegratedMetering?.(container);
    }

    function initializeUtilityAnalysisSurface({ container } = {}) {
        initUtilReportPanel(container);
        initUtilSheetReports(container);
    }

    function getDataUtilitySurface(context = {}) {
        if (context.sectionId !== 'data') return '';
        return String(context.category?.utilitySurface || '').trim();
    }

    function isUtilitySaveSurface(context = {}) {
        return getDataUtilitySurface(context) === 'entry';
    }

    runtime.registerSectionInitializer('data', (context = {}) => {
        const surface = getDataUtilitySurface(context);
        if (surface === 'entry') {
            initializeUtilityEntrySurface(context);
            return;
        }
        if (surface === 'analysis') {
            initializeUtilityAnalysisSurface(context);
        }
    });

    runtime.registerSectionInitializer('report', ({ container }) => {
        initUtilSheetReports(container);
        initReportDeckEditor(container);
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

    runtime.registerSaveProvider('util-shared-save', (context = {}) => {
        if (!isUtilitySaveSurface(context)) return null;

        const meteringHost = context.container?.querySelector?.('[data-kpi-metering-root]');
        const meteringMounted = !!(meteringHost && meteringHost.shadowRoot);
        if (meteringMounted && browser?.canManualSaveMetering?.() === true) {
            const meteringRuntime = browser?.getMeteringRuntimeConfig?.();
            const canWrite = runtime.canUseServerWrite(meteringRuntime?.writeEnabled === true);
            return {
                priority: 120,
                canSave: canWrite,
                buttonLabel: '저장',
                historyLabel: '검침 저장',
                title: '검침 데이터 저장',
                statusText: canWrite
                    ? '검침 데이터를 중앙 서버에 저장합니다.'
                    : '서버 기록이 가능한 환경에서만 검침 데이터를 저장할 수 있습니다.',
                perform: ({ trigger } = {}) => {
                    if (!canWrite) return false;
                    return browser?.performMeteringManualSave?.({ trigger });
                }
            };
        }

        if (typeof persistUtilProductionDailyState === 'function') {
            const productionRuntime = typeof getUtilProductionServerRuntimeConfig === 'function'
                ? getUtilProductionServerRuntimeConfig()
                : null;
            const canWrite = runtime.canUseServerWrite(productionRuntime?.writeEnabled === true);
            return {
                priority: 40,
                canSave: canWrite,
                buttonLabel: '저장',
                historyLabel: '유틸리티 저장',
                title: '유틸리티 상태 저장',
                statusText: canWrite
                    ? '현재 유틸리티 상태를 중앙 서버에 저장합니다.'
                    : '서버 기록이 가능한 환경에서만 유틸리티 데이터를 저장할 수 있습니다.',
                perform: () => {
                    if (!canWrite) return false;
                    return persistUtilProductionDailyState();
                }
            };
        }

        return null;
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

    const REPORT_DECK_DEFAULT_VIEW = 'hq';

    const REPORT_DECK_DEFAULT = Object.freeze({
        title: '월 실적 보고',
        reportDate: '2026.05.15',
        department: '생산본부',
        preparedBy: '',
        reviewedBy1: '',
        reviewedBy2: '',
        reviewedBy3: '',
        approvedBy: '',
        contentsTitle: 'Contents',
        contentsItem1: '에너지 실적',
        contentsItem2: '폐수처리장 운영실적',
        contentsItem3: '공사 및 정비현황',
        contentsItem4: '주요계획',
        productionTeam1ContentsTitle: 'Contents',
        productionTeam1ContentsItem1: '생산실적(생산량)',
        productionTeam1ContentsItem2: '생산지표 2-1 노동생산성',
        productionTeam1ContentsItem3: '생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam1ContentsItem4: '생산지표 2-2 수율',
        productionTeam2ContentsTitle: 'Contents',
        productionTeam2ContentsItem1: '생산실적(생산량)',
        productionTeam2ContentsItem2: '생산지표 2-1 노동생산성',
        productionTeam2ContentsItem3: '생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam2ContentsItem4: '생산지표 2-2 수율',
        productionTeam3ContentsTitle: 'Contents',
        productionTeam3ContentsItem1: '생산실적(생산량)',
        productionTeam3ContentsItem2: '생산지표 2-1 노동생산성',
        productionTeam3ContentsItem3: '생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam3ContentsItem4: '생산지표 2-2 수율',
        productionTeam1StartSection: 'Ⅰ. 생산1팀',
        productionTeam1StartTitle: '1. 생산실적(생산량)',
        productionTeam1LaborSection: 'Ⅰ. 생산1팀',
        productionTeam1LaborTitle: '2. 생산지표 2-1 노동생산성 (kg/M.hr):',
        productionTeam1DirectLaborSection: 'Ⅰ. 생산1팀',
        productionTeam1DirectLaborTitle: '2. 생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam1YieldSection: 'Ⅰ. 생산1팀',
        productionTeam1YieldTitle: '2. 생산지표 2-2 수율',
        productionTeam2StartSection: 'Ⅰ. 생산 2팀',
        productionTeam2StartTitle: '1. 생산실적(생산량)',
        productionTeam2LaborSection: 'Ⅰ. 생산 2팀',
        productionTeam2LaborTitle: '2. 생산지표 2-1 노동생산성 (kg/M.hr):',
        productionTeam2DirectLaborSection: 'Ⅰ. 생산 2팀',
        productionTeam2DirectLaborTitle: '2. 생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam2YieldSection: 'Ⅰ. 생산 2팀',
        productionTeam2YieldTitle: '2. 생산지표 2-2 수율',
        productionTeam3StartSection: 'Ⅰ. 생산 3팀',
        productionTeam3StartTitle: '1. 생산실적(생산량)',
        productionTeam3LaborSection: 'Ⅰ. 생산 3팀',
        productionTeam3LaborTitle: '2. 생산지표 2-1 노동생산성 (kg/M.hr):',
        productionTeam3DirectLaborSection: 'Ⅰ. 생산 3팀',
        productionTeam3DirectLaborTitle: '2. 생산지표 2-1 노동생산성 (직접노무비/kg)',
        productionTeam3YieldSection: 'Ⅰ. 생산 3팀',
        productionTeam3YieldTitle: '2. 생산지표 2-2 수율',
        slide3Section: 'Ⅰ. 공무환경팀',
        slide3Title: '1. 북 정 (가스, 전기 비용) 분석',
        slide4Section: 'Ⅰ. 공무환경팀',
        slide4Title: '1. 유 산 (가스, 전기 비용) 분석',
        slide5Section: 'Ⅰ. 공무환경팀',
        slide5Title: '1. 유산 (가스 비용) 분석',
        slide6Section: 'Ⅱ. 공무환경팀',
        slide6Title: '2. 북정 (폐수 비용) 분석',
        slide7Section: 'Ⅱ. 공무환경팀',
        slide7Title: '2. 유산 (폐수 비용) 분석',
        slide3GasMemo: '',
        slide3ElectricMemo: '',
        slide4GasMemo: '',
        slide4ElectricMemo: '',
        slide5LpgMemo: '',
        slide5CostMemo: '',
        slide6WasteMemo: '',
        slide7WasteMemo: '',
        chartHighlights: '',
        chartHighlightRanges: '',
        slide8Section: 'Ⅲ. 공무환경팀',
        slide8Title: '3. 공사 및 정비 현황 1/1',
        slide9Section: 'Ⅳ. 공무환경팀',
        slide9Title: '4. 주요 계획 1/1',
        slide8SlotCount: '0',
        slide8Item1Text: '',
        slide8Item1Team: '',
        slide8Item1Title: '',
        slide8Item1Effect: '',
        slide8Item1Date: '',
        slide8Item1Amount: '',
        slide8Item2Text: '',
        slide8Item2Team: '',
        slide8Item2Title: '',
        slide8Item2Effect: '',
        slide8Item2Date: '',
        slide8Item2Amount: '',
        slide8Item3Text: '',
        slide8Item3Team: '',
        slide8Item3Title: '',
        slide8Item3Effect: '',
        slide8Item3Date: '',
        slide8Item3Amount: '',
        slide8Item4Text: '',
        slide8Item4Team: '',
        slide8Item4Title: '',
        slide8Item4Effect: '',
        slide8Item4Date: '',
        slide8Item4Amount: '',
        slide8Item5Text: '',
        slide8Item5Team: '',
        slide8Item5Title: '',
        slide8Item5Effect: '',
        slide8Item5Date: '',
        slide8Item5Amount: '',
        slide8Item6Text: '',
        slide8Item6Team: '',
        slide8Item6Title: '',
        slide8Item6Effect: '',
        slide8Item6Date: '',
        slide8Item6Amount: '',
        slide8Item7Text: '',
        slide8Item7Team: '',
        slide8Item7Title: '',
        slide8Item7Effect: '',
        slide8Item7Date: '',
        slide8Item7Amount: '',
        slide8Item8Text: '',
        slide8Item8Team: '',
        slide8Item8Title: '',
        slide8Item8Effect: '',
        slide8Item8Date: '',
        slide8Item8Amount: '',
        slide8BeforeImage1: '',
        slide8BeforeImage2: '',
        slide8BeforeImage3: '',
        slide8BeforeImage4: '',
        slide8BeforeImage5: '',
        slide8BeforeImage6: '',
        slide8BeforeImage7: '',
        slide8BeforeImage8: '',
        slide8AfterImage1: '',
        slide8AfterImage2: '',
        slide8AfterImage3: '',
        slide8AfterImage4: '',
        slide8AfterImage5: '',
        slide8AfterImage6: '',
        slide8AfterImage7: '',
        slide8AfterImage8: '',
        slide8Image1: '',
        slide8Image2: '',
        slide8Image3: '',
        slide8Image4: '',
        slide8Image5: '',
        slide8Image6: '',
        slide8Image7: '',
        slide8Image8: '',
        slide9SlotCount: '0',
        slide9Item1Text: '',
        slide9Item1Team: '',
        slide9Item1Title: '',
        slide9Item1Kind: 'cause',
        slide9Item1Detail: '',
        slide9Item1Date: '',
        slide9Item1Amount: '',
        slide9Item2Text: '',
        slide9Item2Team: '',
        slide9Item2Title: '',
        slide9Item2Kind: 'cause',
        slide9Item2Detail: '',
        slide9Item2Date: '',
        slide9Item2Amount: '',
        slide9Item3Text: '',
        slide9Item3Team: '',
        slide9Item3Title: '',
        slide9Item3Kind: 'cause',
        slide9Item3Detail: '',
        slide9Item3Date: '',
        slide9Item3Amount: '',
        slide9Item4Text: '',
        slide9Item4Team: '',
        slide9Item4Title: '',
        slide9Item4Kind: 'cause',
        slide9Item4Detail: '',
        slide9Item4Date: '',
        slide9Item4Amount: '',
        slide9Item5Text: '',
        slide9Item5Team: '',
        slide9Item5Title: '',
        slide9Item5Kind: 'cause',
        slide9Item5Detail: '',
        slide9Item5Date: '',
        slide9Item5Amount: '',
        slide9Item6Text: '',
        slide9Item6Team: '',
        slide9Item6Title: '',
        slide9Item6Kind: 'cause',
        slide9Item6Detail: '',
        slide9Item6Date: '',
        slide9Item6Amount: '',
        slide9Item7Text: '',
        slide9Item7Team: '',
        slide9Item7Title: '',
        slide9Item7Kind: 'cause',
        slide9Item7Detail: '',
        slide9Item7Date: '',
        slide9Item7Amount: '',
        slide9Item8Text: '',
        slide9Item8Team: '',
        slide9Item8Title: '',
        slide9Item8Kind: 'cause',
        slide9Item8Detail: '',
        slide9Item8Date: '',
        slide9Item8Amount: '',
        slide9Image1: '',
        slide9Image2: '',
        slide9Image3: '',
        slide9Image4: '',
        slide9Image5: '',
        slide9Image6: '',
        slide9Image7: '',
        slide9Image8: ''
    });

    const REPORT_DECK_FALLBACK_CONFIG = Object.freeze({
        moduleKey: 'report_runtime',
        recordKey: 'cover',
        permissionKey: 'util.metering.app'
    });
    const REPORT_DECK_COMPLETE_EDIT_EVENT = 'kpi:report-deck-complete-edit';
    const REPORT_DECK_MONTH_RECORD_PREFIX = 'report_';
    const REPORT_DECK_OPEN_MONTH_START = '2024-01';
    const REPORT_DECK_SETTLEMENT_SCOPE_REQUIREMENTS = Object.freeze({
        electric: Object.freeze(['yusan', 'bukjeong']),
        gas: Object.freeze(['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
        waste: Object.freeze(['waste_bukjeong', 'waste_yusan'])
    });
    const REPORT_DECK_SLIDE8_OVERVIEW_TEAMS = Object.freeze(['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀']);
    const REPORT_DECK_PLAN_MAX_ITEMS = 8;
    const REPORT_DECK_SELF_HANDLED_AMOUNT_LABEL = '자체 처리';
    const REPORT_DECK_MEMO_TEAM_OPTIONS = Object.freeze([
        Object.freeze({ key: 'team_01_01', label: '1팀 1파트' }),
        Object.freeze({ key: 'team_01_02', label: '1팀 2파트' }),
        Object.freeze({ key: 'team_02', label: '2팀' }),
        Object.freeze({ key: 'team_03', label: '3팀' })
    ]);
    const REPORT_DECK_MEMO_METRIC_OPTIONS = Object.freeze([
        Object.freeze({ key: 'production', label: '생산량' }),
        Object.freeze({ key: 'yusan_production_share', label: '유산 생산량 비율' }),
        Object.freeze({ key: 'electric', label: '전력량' }),
        Object.freeze({ key: 'electric_unit', label: '생산량 대비 전력량' }),
        Object.freeze({ key: 'lng', label: 'LNG' }),
        Object.freeze({ key: 'lng_unit', label: '생산량 대비 LNG' }),
        Object.freeze({ key: 'lpg', label: 'LPG' }),
        Object.freeze({ key: 'lpg_unit', label: '생산량 대비 LPG' }),
        Object.freeze({ key: 'yield_rate', label: '수율' }),
        Object.freeze({ key: 'operation_rate', label: '가동률' }),
        Object.freeze({ key: 'work_time', label: '조업시간' }),
        Object.freeze({ key: 'operation_time', label: '가동시간' }),
        Object.freeze({ key: 'production_days', label: '생산일수' }),
        Object.freeze({ key: 'off_days', label: '휴무일수' }),
        Object.freeze({ key: 'product_count', label: '고유 품목수' }),
        Object.freeze({ key: 'waste_usage', label: '폐수량' }),
        Object.freeze({ key: 'waste_cost_total', label: '폐수 비용 총계' }),
        Object.freeze({ key: 'waste_cost_water', label: '상수 비용' }),
        Object.freeze({ key: 'waste_cost_share', label: '폐수 비용' }),
        Object.freeze({ key: 'waste_cost_sludge', label: '폐수오니 비용' }),
        Object.freeze({ key: 'waste_cost_resin', label: '폐합성수지 비용' }),
        Object.freeze({ key: 'waste_cost_labor', label: '인건비' })
    ]);
    const REPORT_DECK_MEMO_LINE_METRIC_PREFIX = 'production_line::';
    const REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY = 'yusan_production_share';
    const REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS = Object.freeze([
        'yield_rate',
        'operation_rate',
        'work_time',
        'operation_time',
        'production_days',
        'off_days',
        'product_count'
    ]);
    const REPORT_DECK_MEMO_WASTE_METRIC_KEYS = Object.freeze([
        'waste_usage',
        'waste_cost_total',
        'waste_cost_water',
        'waste_cost_share',
        'waste_cost_sludge',
        'waste_cost_resin',
        'waste_cost_labor'
    ]);
    const REPORT_DECK_MEMO_ANALYSIS_MEMO_KEYS = Object.freeze([
        'slide3GasMemo',
        'slide3ElectricMemo',
        'slide4GasMemo',
        'slide4ElectricMemo',
        'slide5LpgMemo',
        'slide5CostMemo'
    ]);
    const REPORT_DECK_MEMO_WASTE_MEMO_KEYS = Object.freeze(['slide6WasteMemo', 'slide7WasteMemo']);
    const REPORT_DECK_MEMO_PRODUCTION_LINES = Object.freeze({
        team_01_01: Object.freeze(['SD', 'MSD']),
        team_01_02: Object.freeze(['지대', 'ICA']),
        team_02: Object.freeze(['로터리·버티컬', '스틱']),
        team_03: Object.freeze(['Bottle', '기타'])
    });
    const REPORT_DECK_MEMO_TEAM_METRIC_KEYS = Object.freeze({
        team_01_01: Object.freeze(['production', 'electric', 'electric_unit', 'lng', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_01_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', 'lng', 'lng_unit', 'lpg', 'lpg_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_03: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', 'lng', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS])
    });

    function normalizeReportDeckDate(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
        if (!match) return '';
        const year = match[1];
        const month = String(Number.parseInt(match[2], 10)).padStart(2, '0');
        const day = String(Number.parseInt(match[3], 10)).padStart(2, '0');
        const date = new Date(`${year}-${month}-${day}T00:00:00`);
        if (
            date.getFullYear() !== Number.parseInt(year, 10)
            || date.getMonth() + 1 !== Number.parseInt(month, 10)
            || date.getDate() !== Number.parseInt(day, 10)
        ) {
            return '';
        }
        return `${year}.${month}.${day}`;
    }

    function toReportDeckDateInputValue(value) {
        const normalized = normalizeReportDeckDate(value);
        return normalized ? normalized.replace(/\./g, '-') : '';
    }

    function normalizeReportDeckOverviewDate(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const match = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
        if (!match) return raw;
        const normalized = normalizeReportDeckDate(`${match[1]}.${match[2]}.${match[3]}`);
        return normalized ? normalized.replace(/\./g, '-') : raw;
    }

    function formatReportDeckOverviewDate(value) {
        const normalized = normalizeReportDeckOverviewDate(value);
        const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[2]}.${match[3]} 完` : normalized;
    }

    function formatReportDeckPlanExpectedDate(value) {
        const normalized = normalizeReportDeckOverviewDate(value);
        const match = normalized.match(/^(\d{4})-(\d{2})-\d{2}$/);
        return match ? `${match[1].slice(2)}.${match[2]}월 중` : normalized;
    }

    function formatReportDeckOverviewAmount(value) {
        const amount = normalizeReportDeckOverviewAmount(value);
        if (!amount) return '';
        return `${amount} 백만원`;
    }

    function normalizeReportDeckOverviewAmount(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const numberText = raw.replace(/,/g, '').replace(/\s*백만원\s*$/i, '').trim();
        if (!/^-?(?:\d+|\d*\.\d+)$/.test(numberText)) return '';
        const number = Number(numberText);
        if (!Number.isFinite(number)) return '';
        return String(number);
    }

    function normalizeReportDeckMonth(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})$/) || raw.match(/^(\d{4})(\d{2})$/);
        if (!match) return '';
        const year = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
            return '';
        }
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function getReportDeckCurrentMonth() {
        const now = new Date();
        return normalizeReportDeckMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }

    function buildReportDeckMonthRange(startMonthValue, endMonthValue) {
        const startMonth = normalizeReportDeckMonth(startMonthValue);
        const endMonth = normalizeReportDeckMonth(endMonthValue);
        if (!startMonth || !endMonth || startMonth.localeCompare(endMonth) > 0) return [];
        const startYear = Number.parseInt(startMonth.slice(0, 4), 10);
        const startMonthNumber = Number.parseInt(startMonth.slice(5, 7), 10);
        const endYear = Number.parseInt(endMonth.slice(0, 4), 10);
        const endMonthNumber = Number.parseInt(endMonth.slice(5, 7), 10);
        const months = [];
        for (let year = startYear; year <= endYear; year += 1) {
            const from = year === startYear ? startMonthNumber : 1;
            const to = year === endYear ? endMonthNumber : 12;
            for (let month = from; month <= to; month += 1) {
                months.push(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`);
            }
        }
        return months;
    }

    function normalizeReportDeckDepartment(value) {
        const department = String(value || '').trim();
        return !department || department === '생산본부 공무환경팀'
            ? REPORT_DECK_DEFAULT.department
            : department;
    }

    function buildReportDeckMonthRecordKey(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return '';
        return `${REPORT_DECK_MONTH_RECORD_PREFIX}${normalized.replace('-', '_')}`;
    }

    function formatReportDeckMonthLabel(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        return normalized ? normalized.replace('-', '.') : '';
    }

    function buildReportDeckTitleForMonth(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return REPORT_DECK_DEFAULT.title;
        const month = Number.parseInt(normalized.slice(5, 7), 10);
        return Number.isInteger(month) ? `${month}월 실적 보고` : REPORT_DECK_DEFAULT.title;
    }

    function getReportDeckMonthParts(monthValue, offset = 0) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return null;
        const year = Number.parseInt(normalized.slice(0, 4), 10);
        const month = Number.parseInt(normalized.slice(5, 7), 10);
        if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
        const date = new Date(year, month - 1 + offset, 1);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1
        };
    }

    function getReportDeckMonthNumber(monthValue, offset = 0) {
        const parts = getReportDeckMonthParts(monthValue, offset);
        return parts ? parts.month : null;
    }

    function buildReportDeckSlide8TitleForMonth(monthValue) {
        const month = getReportDeckMonthNumber(monthValue, 0);
        return Number.isInteger(month)
            ? `3. ${month}월 공사 및 정비 현황 1/1`
            : REPORT_DECK_DEFAULT.slide8Title;
    }

    function buildReportDeckSlide9TitleForMonth(monthValue) {
        const month = getReportDeckMonthNumber(monthValue, 1);
        return Number.isInteger(month)
            ? `4. ${month}월 주요 계획 1/1`
            : REPORT_DECK_DEFAULT.slide9Title;
    }

    function buildReportDeckDateForMonth(monthValue, preferredDateValue = '') {
        const dateParts = getReportDeckMonthParts(monthValue, 1);
        const defaultDate = normalizeReportDeckDate(REPORT_DECK_DEFAULT.reportDate);
        const preferredDate = normalizeReportDeckDate(preferredDateValue);
        if (!dateParts || !defaultDate) return preferredDate || defaultDate || '';
        const preferredDay = Number.parseInt((preferredDate || defaultDate).slice(8, 10), 10);
        const lastDay = new Date(dateParts.year, dateParts.month, 0).getDate();
        const day = Math.max(1, Math.min(lastDay, Number.isInteger(preferredDay) ? preferredDay : 1));
        return `${String(dateParts.year).padStart(4, '0')}.${String(dateParts.month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
    }

    function createReportDeckStateForMonth(monthValue) {
        const state = normalizeReportDeckState();
        const reportDate = buildReportDeckDateForMonth(monthValue);
        if (reportDate) state.reportDate = reportDate;
        state.title = buildReportDeckTitleForMonth(monthValue);
        state.department = normalizeReportDeckDepartment(state.department);
        state.slide8Title = buildReportDeckSlide8TitleForMonth(monthValue);
        state.slide9Title = buildReportDeckSlide9TitleForMonth(monthValue);
        return state;
    }

    function applyReportDeckDerivedFields(state, meta = {}) {
        if (!state || typeof state !== 'object') return state;
        state.title = buildReportDeckTitleForMonth(meta.selectedMonth);
        state.reportDate = buildReportDeckDateForMonth(meta.selectedMonth, state.reportDate);
        state.department = normalizeReportDeckDepartment(state.department);
        state.slide8Title = buildReportDeckSlide8TitleForMonth(meta.selectedMonth);
        state.slide9Title = buildReportDeckSlide9TitleForMonth(meta.selectedMonth);
        normalizeReportDeckSlide8OverviewOrder(state);
        normalizeReportDeckSlide9OverviewOrder(state);
        return state;
    }

    function isReportDeckLockedFieldKey(key) {
        return key === 'title' || key === 'reportDate' || key === 'slide8Title' || key === 'slide9Title';
    }

    function normalizeReportDeckOverviewTeam(value) {
        const team = String(value || '').trim();
        return REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.includes(team) ? team : '';
    }

    function normalizeReportDeckSlide9Kind(value) {
        return String(value || '').trim() === 'purpose' ? 'purpose' : 'cause';
    }

    function getReportDeckSlide9KindLabel(value) {
        return normalizeReportDeckSlide9Kind(value) === 'purpose' ? '목적' : '원인';
    }

    function getReportDeckOverviewTeamOrder(team) {
        const index = REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.indexOf(normalizeReportDeckOverviewTeam(team));
        return index >= 0 ? index : REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.length + 1;
    }

    function isReportDeckSlide8OverviewKey(key = '') {
        return /^slide8Item[1-8]Text$/.test(String(key || '').trim());
    }

    function isReportDeckSlide9OverviewKey(key = '') {
        return /^slide9Item[1-8]Text$/.test(String(key || '').trim());
    }

    function getReportDeckSlide8OverviewEntry(state, slotIndex) {
        const index = Math.max(1, Math.min(REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        return {
            team: normalizeReportDeckOverviewTeam(state[`slide8Item${index}Team`]),
            title: String(state[`slide8Item${index}Title`] || '').trim(),
            effect: String(state[`slide8Item${index}Effect`] || '').trim(),
            date: normalizeReportDeckOverviewDate(state[`slide8Item${index}Date`]),
            amount: normalizeReportDeckOverviewAmount(state[`slide8Item${index}Amount`]),
            text: String(state[`slide8Item${index}Text`] || ''),
            beforeImage: String(state[`slide8BeforeImage${index}`] || ''),
            afterImage: String(state[`slide8AfterImage${index}`] || ''),
            originalIndex: index
        };
    }

    function formatReportDeckSlide8OverviewText(entry = {}) {
        const lines = [];
        if (entry.team) lines.push(entry.team);
        if (entry.title) lines.push(entry.title);
        if (entry.effect) lines.push(`▶ 효과 : ${entry.effect}`);
        if (entry.date) lines.push(`▶ 완료 날짜 : ${formatReportDeckOverviewDate(entry.date)}`);
        if (entry.amount || (entry.team && entry.title && entry.effect && entry.date)) {
            lines.push(`▶ 금액 : ${formatReportDeckOverviewAmount(entry.amount) || REPORT_DECK_SELF_HANDLED_AMOUNT_LABEL}`);
        }
        return lines.length ? lines.join('\n') : String(entry.text || '');
    }

    function hasReportDeckSlide8OverviewData(entry = {}) {
        return Boolean(
            entry.team
            || entry.title
            || entry.effect
            || entry.date
            || entry.amount
            || String(entry.text || '').trim()
            || entry.beforeImage
            || entry.afterImage
        );
    }

    function setReportDeckSlide8OverviewEntry(state, slotIndex, entry = {}) {
        const index = Math.max(1, Math.min(REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        const normalizedEntry = {
            team: normalizeReportDeckOverviewTeam(entry.team),
            title: String(entry.title || '').trim(),
            effect: String(entry.effect || '').trim(),
            date: normalizeReportDeckOverviewDate(entry.date),
            amount: normalizeReportDeckOverviewAmount(entry.amount),
            text: String(entry.text || ''),
            beforeImage: String(entry.beforeImage || ''),
            afterImage: String(entry.afterImage || '')
        };
        state[`slide8Item${index}Team`] = normalizedEntry.team;
        state[`slide8Item${index}Title`] = normalizedEntry.title;
        state[`slide8Item${index}Effect`] = normalizedEntry.effect;
        state[`slide8Item${index}Date`] = normalizedEntry.date;
        state[`slide8Item${index}Amount`] = normalizedEntry.amount;
        state[`slide8Item${index}Text`] = formatReportDeckSlide8OverviewText(normalizedEntry);
        state[`slide8BeforeImage${index}`] = normalizedEntry.beforeImage;
        state[`slide8AfterImage${index}`] = normalizedEntry.afterImage;
    }

    function normalizeReportDeckSlide8OverviewOrder(state) {
        if (!state || typeof state !== 'object' || state.__slide8OverviewSorting === true) return;
        state.__slide8OverviewSorting = true;
        try {
            const entries = Array.from({ length: REPORT_DECK_PLAN_MAX_ITEMS }, (_, index) => getReportDeckSlide8OverviewEntry(state, index + 1));
            const orderedEntries = entries
                .filter(hasReportDeckSlide8OverviewData)
                .sort((left, right) => {
                    const orderDelta = getReportDeckOverviewTeamOrder(left.team) - getReportDeckOverviewTeamOrder(right.team);
                    return orderDelta || left.originalIndex - right.originalIndex;
                });
            const blankEntries = Array.from({ length: REPORT_DECK_PLAN_MAX_ITEMS - orderedEntries.length }, (_, index) => ({
                originalIndex: orderedEntries.length + index + 1
            }));
            [...orderedEntries, ...blankEntries].forEach((entry, index) => {
                setReportDeckSlide8OverviewEntry(state, index + 1, entry);
            });
            const nonEmptyCount = orderedEntries.length;
            if (nonEmptyCount > 0) {
                state.slide8SlotCount = String(Math.max(normalizeReportDeckPlanItemCount(state.slide8SlotCount), Math.min(REPORT_DECK_PLAN_MAX_ITEMS, nonEmptyCount)));
            }
        } finally {
            delete state.__slide8OverviewSorting;
        }
    }

    function getReportDeckSlide9OverviewEntry(state, slotIndex) {
        const index = Math.max(1, Math.min(REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        return {
            team: normalizeReportDeckOverviewTeam(state[`slide9Item${index}Team`]),
            title: String(state[`slide9Item${index}Title`] || '').trim(),
            kind: normalizeReportDeckSlide9Kind(state[`slide9Item${index}Kind`]),
            detail: String(state[`slide9Item${index}Detail`] || '').trim(),
            date: normalizeReportDeckOverviewDate(state[`slide9Item${index}Date`]),
            amount: normalizeReportDeckOverviewAmount(state[`slide9Item${index}Amount`]),
            text: String(state[`slide9Item${index}Text`] || ''),
            image: String(state[`slide9Image${index}`] || ''),
            originalIndex: index
        };
    }

    function formatReportDeckSlide9OverviewText(entry = {}) {
        const lines = [];
        if (entry.team) lines.push(entry.team);
        if (entry.title) lines.push(entry.title);
        if (entry.detail) lines.push(`▶ ${getReportDeckSlide9KindLabel(entry.kind)} : ${entry.detail}`);
        if (entry.date) lines.push(`▶ 예상 날짜 : ${formatReportDeckPlanExpectedDate(entry.date)}`);
        if (entry.amount || (entry.team && entry.title && entry.detail && entry.date)) {
            lines.push(`▶ 예상 금액 : ${formatReportDeckOverviewAmount(entry.amount) || REPORT_DECK_SELF_HANDLED_AMOUNT_LABEL}`);
        }
        return lines.length ? lines.join('\n') : String(entry.text || '');
    }

    function hasReportDeckSlide9OverviewData(entry = {}) {
        return Boolean(
            entry.team
            || entry.title
            || entry.detail
            || entry.date
            || entry.amount
            || String(entry.text || '').trim()
            || entry.image
        );
    }

    function setReportDeckSlide9OverviewEntry(state, slotIndex, entry = {}) {
        const index = Math.max(1, Math.min(REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        const normalizedEntry = {
            team: normalizeReportDeckOverviewTeam(entry.team),
            title: String(entry.title || '').trim(),
            kind: normalizeReportDeckSlide9Kind(entry.kind),
            detail: String(entry.detail || '').trim(),
            date: normalizeReportDeckOverviewDate(entry.date),
            amount: normalizeReportDeckOverviewAmount(entry.amount),
            text: String(entry.text || ''),
            image: String(entry.image || '')
        };
        state[`slide9Item${index}Team`] = normalizedEntry.team;
        state[`slide9Item${index}Title`] = normalizedEntry.title;
        state[`slide9Item${index}Kind`] = normalizedEntry.kind;
        state[`slide9Item${index}Detail`] = normalizedEntry.detail;
        state[`slide9Item${index}Date`] = normalizedEntry.date;
        state[`slide9Item${index}Amount`] = normalizedEntry.amount;
        state[`slide9Item${index}Text`] = formatReportDeckSlide9OverviewText(normalizedEntry);
        state[`slide9Image${index}`] = normalizedEntry.image;
    }

    function normalizeReportDeckSlide9OverviewOrder(state) {
        if (!state || typeof state !== 'object' || state.__slide9OverviewSorting === true) return;
        state.__slide9OverviewSorting = true;
        try {
            const entries = Array.from({ length: REPORT_DECK_PLAN_MAX_ITEMS }, (_, index) => getReportDeckSlide9OverviewEntry(state, index + 1));
            const orderedEntries = entries
                .filter(hasReportDeckSlide9OverviewData)
                .sort((left, right) => {
                    const orderDelta = getReportDeckOverviewTeamOrder(left.team) - getReportDeckOverviewTeamOrder(right.team);
                    return orderDelta || left.originalIndex - right.originalIndex;
                });
            const blankEntries = Array.from({ length: REPORT_DECK_PLAN_MAX_ITEMS - orderedEntries.length }, (_, index) => ({
                originalIndex: orderedEntries.length + index + 1
            }));
            [...orderedEntries, ...blankEntries].forEach((entry, index) => {
                setReportDeckSlide9OverviewEntry(state, index + 1, entry);
            });
            const nonEmptyCount = orderedEntries.length;
            if (nonEmptyCount > 0) {
                state.slide9SlotCount = String(Math.max(normalizeReportDeckPlanItemCount(state.slide9SlotCount), Math.min(REPORT_DECK_PLAN_MAX_ITEMS, nonEmptyCount)));
            }
        } finally {
            delete state.__slide9OverviewSorting;
        }
    }

    function isReportDeckPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function getReportDeckResourceDataset(store, resourceKey) {
        const resourceDatasets = isReportDeckPlainObject(store?.resourceDatasets)
            ? store.resourceDatasets
            : {};
        const dataset = resourceDatasets[String(resourceKey || '').trim()];
        return isReportDeckPlainObject(dataset) ? dataset : {};
    }

    function getReportDeckBillingSettlementEntries(store, resourceKey) {
        const dataset = getReportDeckResourceDataset(store, resourceKey);
        return isReportDeckPlainObject(dataset.billingSettlementEntries)
            ? dataset.billingSettlementEntries
            : {};
    }

    function isReportDeckSettlementLeafComplete(entry) {
        if (!isReportDeckPlainObject(entry) || entry.completed !== true) return false;
        const fields = isReportDeckPlainObject(entry.fields) ? entry.fields : entry;
        return Object.keys(fields).some(key => key !== 'completed' && key !== 'updatedAt' && key !== 'monthValue');
    }

    function getReportDeckSettlementScopeMap(entry) {
        if (!isReportDeckPlainObject(entry)) return {};
        const source = isReportDeckPlainObject(entry.scopes) ? entry.scopes : entry;
        return Object.entries(source).reduce((scopeMap, [scopeKey, scopeEntry]) => {
            if (isReportDeckPlainObject(scopeEntry)) {
                scopeMap[String(scopeKey || '').trim()] = scopeEntry;
            }
            return scopeMap;
        }, {});
    }

    function isReportDeckResourceMonthSettled(entries, monthValue, requiredScopes = []) {
        const entry = entries?.[monthValue];
        if (!isReportDeckPlainObject(entry)) return false;
        const scopeMap = getReportDeckSettlementScopeMap(entry);
        const normalizedRequiredScopes = (Array.isArray(requiredScopes) ? requiredScopes : [])
            .map(scopeKey => String(scopeKey || '').trim())
            .filter(Boolean);
        if (normalizedRequiredScopes.length) {
            return normalizedRequiredScopes.every(scopeKey => isReportDeckSettlementLeafComplete(scopeMap[scopeKey]));
        }
        return isReportDeckSettlementLeafComplete(entry);
    }

    function buildReportDeckSettledMonthsFromStore(store) {
        if (!isReportDeckPlainObject(store)) return [];
        const resourceEntries = Object.entries(REPORT_DECK_SETTLEMENT_SCOPE_REQUIREMENTS).map(([resourceKey, requiredScopes]) => ({
            resourceKey,
            requiredScopes,
            entries: getReportDeckBillingSettlementEntries(store, resourceKey)
        }));
        if (resourceEntries.some(item => !Object.keys(item.entries).length)) return [];
        const candidateMonths = new Set();
        resourceEntries.forEach(item => {
            Object.keys(item.entries).forEach(monthValue => {
                const month = normalizeReportDeckMonth(monthValue);
                if (month) candidateMonths.add(month);
            });
        });
        return Array.from(candidateMonths)
            .filter(monthValue => resourceEntries.every(item => (
                isReportDeckResourceMonthSettled(item.entries, monthValue, item.requiredScopes)
            )))
            .sort((left, right) => right.localeCompare(left));
    }

    function buildReportDeckOpenMonthsUntilCurrent() {
        const currentMonth = getReportDeckCurrentMonth();
        const startMonth = REPORT_DECK_OPEN_MONTH_START.localeCompare(currentMonth) <= 0
            ? REPORT_DECK_OPEN_MONTH_START
            : currentMonth;
        return buildReportDeckMonthRange(startMonth, currentMonth).reverse();
    }

    function normalizeReportDeckState(input = {}) {
        const source = input && typeof input === 'object' ? input : {};
        const normalizedState = Object.keys(REPORT_DECK_DEFAULT).reduce((state, key) => {
            const rawValue = Object.prototype.hasOwnProperty.call(source, key)
                ? source[key]
                : REPORT_DECK_DEFAULT[key];
            if (key === 'reportDate') {
                state[key] = normalizeReportDeckDate(rawValue) || REPORT_DECK_DEFAULT.reportDate;
            } else if (key === 'department') {
                state[key] = normalizeReportDeckDepartment(rawValue);
            } else {
                state[key] = String(rawValue);
            }
            return state;
        }, {});
        Object.keys(source).forEach(key => {
            if (isReportDeckPlanImageSourceKey(key)) {
                normalizedState[key] = normalizeReportDeckPlanImageSource(source[key]);
            }
        });
        return normalizedState;
    }

    function getReportDeckRuntimeConfig() {
        return browser?.getReportRuntimeConfig?.() || REPORT_DECK_FALLBACK_CONFIG;
    }

    function getReportDeckRecordMeta(record) {
        const version = Number.parseInt(String(record?.version ?? ''), 10);
        return {
            version: Number.isInteger(version) && version >= 0 ? version : null,
            updatedAt: record?.updatedAt || record?.updated_at || ''
        };
    }

    function setReportDeckStatus(root, statusKey, text) {
        const status = root?.querySelector?.('[data-report-save-status]');
        if (status) {
            status.dataset.state = String(statusKey || 'idle');
            status.textContent = text || '';
            status.hidden = !text;
        }
    }

    function syncReportDeckMonthSelect(root, meta = {}) {
        const select = root?.querySelector?.('[data-report-month-select]');
        if (!select) return;
        const selectedMonth = normalizeReportDeckMonth(meta.selectedMonth);
        const months = Array.isArray(meta.months)
            ? meta.months.map(normalizeReportDeckMonth).filter(Boolean)
            : [];
        meta.months = months;
        meta.selectedMonth = months.includes(selectedMonth) ? selectedMonth : months[0] || '';
        meta.recordKey = buildReportDeckMonthRecordKey(meta.selectedMonth);
        select.innerHTML = months.length > 0
            ? months.map(month => `<option value="${month}">${formatReportDeckMonthLabel(month)}</option>`).join('')
            : `<option value="">${meta.monthPlaceholder || '선택 가능 월 없음'}</option>`;
        select.disabled = months.length === 0;
        select.value = meta.selectedMonth || '';
        root.dataset.reportMonth = meta.selectedMonth || '';
        root.dataset.reportRecordKey = meta.recordKey || '';
    }

    function syncReportDeckJson(root, state, meta = {}) {
        const json = root?.querySelector?.('[data-report-json]');
        if (!json) return;
        const config = getReportDeckRuntimeConfig();
        applyReportDeckDerivedFields(state, meta);
        json.textContent = JSON.stringify({
            table: 'app_module_records',
            moduleKey: config.moduleKey || REPORT_DECK_FALLBACK_CONFIG.moduleKey,
            recordKey: meta.recordKey || config.recordKey || REPORT_DECK_FALLBACK_CONFIG.recordKey,
            month: meta.selectedMonth || '',
            permissionKey: config.permissionKey || REPORT_DECK_FALLBACK_CONFIG.permissionKey,
            version: meta.version ?? null,
            updatedAt: meta.updatedAt || '',
            payload: normalizeReportDeckState(state)
        }, null, 2);
    }

    function syncReportDeckFieldRefs(root, state, targetKey = '') {
        const normalizedTargetKey = String(targetKey || '').trim();
        Array.from(root?.querySelectorAll?.('[data-report-field-ref]') || []).forEach(field => {
            const key = String(field.dataset.reportFieldRef || '').trim();
            if (!key) return;
            if (normalizedTargetKey && key !== normalizedTargetKey) return;
            field.textContent = state[key] || '';
        });
    }

    function syncReportDeckFields(root, state, meta = {}) {
        applyReportDeckDerivedFields(state, meta);
        Array.from(root?.querySelectorAll?.('[data-report-field]') || []).forEach(field => {
            const key = String(field.dataset.reportField || '').trim();
            if (!key) return;
            field.textContent = state[key] || '';
        });
        syncReportDeckFieldRefs(root, state);
        const nextMonth = getReportDeckMonthNumber(meta.selectedMonth, 1);
        Array.from(root?.querySelectorAll?.('[data-report-next-month-label]') || []).forEach(field => {
            field.textContent = Number.isInteger(nextMonth) ? `${nextMonth}월` : '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-date-input]') || []).forEach(input => {
            input.value = toReportDeckDateInputValue(state.reportDate);
        });
    }

    function escapeReportDeckHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getReportDeckMemoLineClass(lineText = '') {
        const text = String(lineText || '');
        const hasUp = text.includes('↑') || text.includes('▲');
        const hasDown = text.includes('↓') || text.includes('▼');
        if (hasUp && hasDown) return 'is-mixed';
        if (hasUp) return 'is-up';
        if (hasDown) return 'is-down';
        return 'is-flat';
    }

    function getReportDeckMemoSegmentClass(segmentText = '') {
        const text = String(segmentText || '');
        if (text.includes('↑') || text.includes('▲')) return 'is-up';
        if (text.includes('↓') || text.includes('▼')) return 'is-down';
        return 'is-flat';
    }

    function findReportDeckMemoBasisIndex(text = '', startIndex = 0) {
        return ['전월대비', '전년대비'].reduce((best, basisLabel) => {
            const index = text.indexOf(basisLabel, startIndex);
            if (index < 0) return best;
            return best < 0 || index < best ? index : best;
        }, -1);
    }

    function renderReportDeckMemoLineHtml(lineText = '') {
        const text = String(lineText || '');
        let cursor = 0;
        let basisIndex = findReportDeckMemoBasisIndex(text, 0);
        if (basisIndex < 0) return escapeReportDeckHtml(text);

        const parts = [];
        while (basisIndex >= 0) {
            if (basisIndex > cursor) {
                parts.push(escapeReportDeckHtml(text.slice(cursor, basisIndex)));
            }
            const nextBasisIndex = findReportDeckMemoBasisIndex(text, basisIndex + 1);
            const rawSegmentEnd = nextBasisIndex >= 0 ? nextBasisIndex : text.length;
            let segmentText = text.slice(basisIndex, rawSegmentEnd);
            const separatorMatch = segmentText.match(/,\s*$/);
            const separatorText = separatorMatch ? separatorMatch[0] : '';
            if (separatorText) {
                segmentText = segmentText.slice(0, -separatorText.length);
            }
            const basisMatch = segmentText.match(/^(전월대비|전년대비)(\s*)([\s\S]*)$/);
            if (basisMatch) {
                parts.push(`<span class="report-auto-memo-basis">${escapeReportDeckHtml(basisMatch[1])}</span>`);
                const valueText = `${basisMatch[2] || ''}${basisMatch[3] || ''}`;
                if (valueText) {
                    const segmentClass = getReportDeckMemoSegmentClass(valueText);
                    parts.push(`<span class="report-auto-memo-delta ${segmentClass}">${escapeReportDeckHtml(valueText)}</span>`);
                }
            } else {
                const segmentClass = getReportDeckMemoSegmentClass(segmentText);
                parts.push(`<span class="report-auto-memo-segment ${segmentClass}">${escapeReportDeckHtml(segmentText)}</span>`);
            }
            if (separatorText) {
                parts.push(escapeReportDeckHtml(separatorText));
            }
            cursor = rawSegmentEnd;
            basisIndex = nextBasisIndex;
        }
        if (cursor < text.length) {
            parts.push(escapeReportDeckHtml(text.slice(cursor)));
        }
        return parts.join('');
    }

    function renderReportDeckMemoAddButtonHtml(key = '') {
        const normalizedKey = String(key || '').trim();
        return normalizedKey
            ? `<button type="button" class="report-auto-memo-add" data-report-memo-add-key="${escapeReportDeckHtml(normalizedKey)}" title="특이사항 추가">+</button>`
            : '';
    }

    function renderReportDeckMemoContent(container, text = '', key = '') {
        const rawText = String(text || '').trim();
        if (!container) return;
        container.dataset.empty = rawText ? 'false' : 'true';
        const addButtonHtml = renderReportDeckMemoAddButtonHtml(key);
        if (!rawText) {
            container.innerHTML = addButtonHtml;
            return;
        }
        const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        container.innerHTML = lines.map((line, index) => (
            `<span class="report-auto-memo-line ${getReportDeckMemoLineClass(line)}">`
                + `<span class="report-auto-memo-line-text">${renderReportDeckMemoLineHtml(line)}</span>`
                + `<button type="button" class="report-auto-memo-delete" data-report-memo-delete-key="${escapeReportDeckHtml(key)}" data-report-memo-delete-line="${index}" title="특이사항 삭제">-</button>`
            + '</span>'
        )).join('') + addButtonHtml;
    }

    function countReportDeckMemoLayoutLines(value = '') {
        return String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).length;
    }

    function getReportDeckMemoGroupLayoutLineCount(state = {}, keys = []) {
        return keys.reduce((max, key) => Math.max(max, countReportDeckMemoLayoutLines(state?.[key])), 0);
    }

    function formatReportDeckLayoutPercent(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '0%';
        return `${Number(number.toFixed(1))}%`;
    }

    function setReportDeckLayoutPercentVariable(element, name, value) {
        if (!element?.style || typeof element.style.setProperty !== 'function') return;
        element.style.setProperty(name, formatReportDeckLayoutPercent(value));
    }

    function getReportDeckAnalysisLayoutRows(lineCount = 0) {
        const count = Math.max(0, Math.min(Number(lineCount) || 0, 6));
        const memo = count <= 0 ? 6 : Math.min(14.5, 6.5 + (count * 1.25));
        const table = Math.max(24.5, 28 - (count * 0.3));
        return {
            table,
            memo,
            chart: Math.max(0, 96 - table - memo)
        };
    }

    function getReportDeckWasteLayoutRows(lineCount = 0) {
        const count = Math.max(0, Math.min(Number(lineCount) || 0, 6));
        const memo = count <= 0 ? 6.5 : Math.min(16, 6.5 + (count * 1.4));
        return {
            main: Math.max(0, 90 - memo),
            memo
        };
    }

    function applyReportDeckMemoResponsiveLayout(root, state = {}) {
        const analysisRows = getReportDeckAnalysisLayoutRows(
            getReportDeckMemoGroupLayoutLineCount(state, REPORT_DECK_MEMO_ANALYSIS_MEMO_KEYS)
        );
        Array.from(root?.querySelectorAll?.('.report-bukjeong-analysis-column, .report-analysis-column') || []).forEach(column => {
            setReportDeckLayoutPercentVariable(column, '--report-analysis-table-row', analysisRows.table);
            setReportDeckLayoutPercentVariable(column, '--report-analysis-chart-row', analysisRows.chart);
            setReportDeckLayoutPercentVariable(column, '--report-analysis-memo-row', analysisRows.memo);
        });

        const wasteRows = getReportDeckWasteLayoutRows(
            getReportDeckMemoGroupLayoutLineCount(state, REPORT_DECK_MEMO_WASTE_MEMO_KEYS)
        );
        Array.from(root?.querySelectorAll?.('.report-waste-auto-layout') || []).forEach(layout => {
            setReportDeckLayoutPercentVariable(layout, '--report-waste-main-row', wasteRows.main);
            setReportDeckLayoutPercentVariable(layout, '--report-waste-memo-row', wasteRows.memo);
        });
    }

    function syncReportDeckMemoControls(root, state) {
        Array.from(root?.querySelectorAll?.('[data-report-memo-content]') || []).forEach(container => {
            const key = String(container?.dataset?.reportMemoContent || '').trim();
            renderReportDeckMemoContent(container, key && Object.prototype.hasOwnProperty.call(state, key) ? state[key] : '', key);
        });
        applyReportDeckMemoResponsiveLayout(root, state);
    }

    function normalizeReportDeckMemoTeamKey(value = '') {
        const key = String(value || '').trim();
        return REPORT_DECK_MEMO_TEAM_OPTIONS.some(option => option.key === key)
            ? key
            : REPORT_DECK_MEMO_TEAM_OPTIONS[0].key;
    }

    function normalizeReportDeckMemoMetricKey(value = '') {
        const key = String(value || '').trim();
        return REPORT_DECK_MEMO_METRIC_OPTIONS.some(option => option.key === key)
            || getReportDeckMemoLineNameFromMetricKey(key)
            ? key
            : REPORT_DECK_MEMO_METRIC_OPTIONS[0].key;
    }

    function buildReportDeckMemoLineMetricKey(lineName = '') {
        const normalizedLineName = String(lineName || '').trim();
        return normalizedLineName ? `${REPORT_DECK_MEMO_LINE_METRIC_PREFIX}${normalizedLineName}` : '';
    }

    function getReportDeckMemoLineNameFromMetricKey(metricKey = '') {
        const key = String(metricKey || '').trim();
        return key.startsWith(REPORT_DECK_MEMO_LINE_METRIC_PREFIX)
            ? key.slice(REPORT_DECK_MEMO_LINE_METRIC_PREFIX.length).trim()
            : '';
    }

    function getReportDeckMemoLineNamesForTeam(teamKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        return Array.from(REPORT_DECK_MEMO_PRODUCTION_LINES[normalizedTeamKey] || []);
    }

    function isReportDeckMemoWasteMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        return REPORT_DECK_MEMO_WASTE_MEMO_KEYS.includes(normalizedMemoKey);
    }

    function getReportDeckMemoMetricOption(metricKey = '') {
        const key = normalizeReportDeckMemoMetricKey(metricKey);
        const baseOption = REPORT_DECK_MEMO_METRIC_OPTIONS.find(option => option.key === key);
        if (baseOption) return baseOption;
        const lineName = getReportDeckMemoLineNameFromMetricKey(key);
        return lineName ? { key, label: `${lineName} 생산량` } : null;
    }

    function getReportDeckMemoMetricOptionsForTeam(teamKey = '', memoKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        const metricKeys = REPORT_DECK_MEMO_TEAM_METRIC_KEYS[normalizedTeamKey] || REPORT_DECK_MEMO_TEAM_METRIC_KEYS.team_01_01;
        return Array.from(metricKeys)
            .concat(getReportDeckMemoLineNamesForTeam(normalizedTeamKey).map(buildReportDeckMemoLineMetricKey).filter(Boolean))
            .concat(isReportDeckMemoWasteMemoKey(memoKey) ? Array.from(REPORT_DECK_MEMO_WASTE_METRIC_KEYS) : [])
            .map(getReportDeckMemoMetricOption)
            .filter(Boolean);
    }

    function normalizeReportDeckMemoMetricKeyForTeam(metricKey = '', teamKey = '', memoKey = '') {
        const options = getReportDeckMemoMetricOptionsForTeam(teamKey, memoKey);
        const normalizedMetricKey = normalizeReportDeckMemoMetricKey(metricKey);
        return options.some(option => option.key === normalizedMetricKey)
            ? normalizedMetricKey
            : options[0]?.key || REPORT_DECK_MEMO_METRIC_OPTIONS[0].key;
    }

    function syncReportDeckMemoMetricOptions(dialog, preferredMetricKey = '') {
        const teamSelect = dialog?.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog?.querySelector?.('[data-report-memo-metric]');
        const teamKey = normalizeReportDeckMemoTeamKey(teamSelect?.value);
        const memoKey = String(dialog?.dataset?.reportMemoTarget || '').trim();
        const metricKey = normalizeReportDeckMemoMetricKeyForTeam(preferredMetricKey || metricSelect?.value, teamKey, memoKey);
        if (teamSelect) teamSelect.value = teamKey;
        if (metricSelect) {
            const options = getReportDeckMemoMetricOptionsForTeam(teamKey, memoKey);
            metricSelect.innerHTML = options.map(option => (
                `<option value="${escapeReportDeckHtml(option.key)}">${escapeReportDeckHtml(option.label)}</option>`
            )).join('');
            metricSelect.value = metricKey;
        }
        return metricKey;
    }

    function getReportDeckMemoDialog(root) {
        return root?.querySelector?.('[data-report-memo-dialog]') || null;
    }

    function closeReportDeckMemoDialog(root) {
        const dialog = getReportDeckMemoDialog(root);
        if (!dialog) return;
        dialog.hidden = true;
        delete dialog.dataset.reportMemoTarget;
        dialog.__reportMemoCandidates = [];
    }

    function getReportDeckMemoOverviewDialog(root) {
        return root?.querySelector?.('[data-report-memo-overview-dialog]') || null;
    }

    function waitReportDeckUiFrame() {
        return new Promise(resolve => {
            const schedule = typeof requestAnimationFrame === 'function'
                ? requestAnimationFrame
                : callback => setTimeout(callback, 0);
            schedule(() => resolve());
        });
    }

    function getReportDeckMemoCandidateCache(meta = {}) {
        if (!(meta.memoCandidateCache instanceof Map)) {
            meta.memoCandidateCache = new Map();
        }
        return meta.memoCandidateCache;
    }

    function getReportDeckMemoOverviewCache(meta = {}) {
        if (!(meta.memoOverviewCache instanceof Map)) {
            meta.memoOverviewCache = new Map();
        }
        return meta.memoOverviewCache;
    }

    function buildReportDeckMemoCandidateCacheKey(monthKey = '', teamKey = '', metricKey = '', memoKey = '') {
        return [
            normalizeReportDeckMonth(monthKey),
            normalizeReportDeckMemoTeamKey(teamKey),
            normalizeReportDeckMemoMetricKey(metricKey),
            String(memoKey || '').trim()
        ].join('|');
    }

    function clearReportDeckMemoCaches(meta = {}) {
        if (!meta) return;
        meta.memoCandidateCache = new Map();
        meta.memoOverviewCache = new Map();
    }

    function closeReportDeckMemoOverviewDialog(root) {
        const dialog = getReportDeckMemoOverviewDialog(root);
        if (!dialog) return;
        dialog.hidden = true;
        delete dialog.dataset.reportMemoOverviewSequence;
    }

    function setReportDeckMemoOverviewMessage(dialog, message) {
        const list = dialog?.querySelector?.('[data-report-memo-overview-list]');
        if (!list) return;
        list.innerHTML = `<div class="report-memo-overview-empty">${escapeReportDeckHtml(message)}</div>`;
    }

    function renderReportDeckMemoOverviewDialog(dialog, groups = []) {
        const list = dialog?.querySelector?.('[data-report-memo-overview-list]');
        if (!list) return;
        const normalizedGroups = (Array.isArray(groups) ? groups : [])
            .map(group => ({
                ...group,
                candidates: Array.isArray(group?.candidates) ? group.candidates : []
            }))
            .filter(group => group.candidates.length);
        if (!normalizedGroups.length) {
            setReportDeckMemoOverviewMessage(dialog, '해당 월에 확인 가능한 특이사항 항목이 없습니다.');
            return;
        }
        list.innerHTML = normalizedGroups.map(group => (
            `<section class="report-memo-overview-group" data-report-memo-overview-group="${escapeReportDeckHtml(group.key || '')}">`
                + `<h3 class="report-memo-overview-group-title">${escapeReportDeckHtml(group.label || '')}</h3>`
                + '<div class="report-memo-overview-rows">'
                + group.candidates.map(candidate => {
                    const direction = String(candidate?.direction || 'flat').trim() || 'flat';
                    const metricLabel = String(candidate?.metricLabel || '').trim();
                    return `<div class="report-memo-overview-row is-${escapeReportDeckHtml(direction)}">`
                        + `<span class="report-memo-overview-row-label">${escapeReportDeckHtml(metricLabel)}</span>`
                        + `<span class="report-memo-overview-row-text">${renderReportDeckMemoLineHtml(candidate?.text || '')}</span>`
                    + '</div>';
                }).join('')
                + '</div>'
            + '</section>'
        )).join('');
    }

    async function openReportDeckMemoOverviewDialog(root, meta) {
        const dialog = getReportDeckMemoOverviewDialog(root);
        if (!dialog) return false;
        dialog.hidden = false;
        dialog.dataset.reportMemoOverviewSequence = String((Number(dialog.dataset.reportMemoOverviewSequence || '0') || 0) + 1);
        const sequence = dialog.dataset.reportMemoOverviewSequence;
        setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러오는 중입니다.');
        if (!meta?.selectedMonth || typeof browser?.buildReportDeckMemoOverview !== 'function') {
            setReportDeckMemoOverviewMessage(dialog, '보고서 월 데이터가 준비되지 않았습니다.');
            return true;
        }
        const cacheKey = normalizeReportDeckMonth(meta.selectedMonth);
        const overviewCache = getReportDeckMemoOverviewCache(meta);
        if (cacheKey && overviewCache.has(cacheKey)) {
            renderReportDeckMemoOverviewDialog(dialog, overviewCache.get(cacheKey)?.groups || []);
            return true;
        }
        await waitReportDeckUiFrame();
        if (dialog.dataset.reportMemoOverviewSequence !== sequence) return true;
        try {
            const result = await browser.buildReportDeckMemoOverview(meta.selectedMonth, {
                store: meta.sharedStore
            });
            if (dialog.dataset.reportMemoOverviewSequence !== sequence) return true;
            if (result?.ok !== true) {
                setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러올 수 없습니다.');
                return true;
            }
            if (cacheKey) {
                overviewCache.set(cacheKey, {
                    groups: Array.isArray(result.groups) ? result.groups : []
                });
            }
            renderReportDeckMemoOverviewDialog(dialog, result.groups || []);
        } catch (error) {
            void error;
            if (dialog.dataset.reportMemoOverviewSequence === sequence) {
                setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러오지 못했습니다.');
            }
        }
        return true;
    }

    function getReportDeckMemoLines(text = '') {
        return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    }

    function getReportDeckMemoDialogTargetKey(dialog) {
        return String(dialog?.dataset?.reportMemoTarget || '').trim();
    }

    function clearReportDeckMemoManualInput(dialog) {
        const input = dialog?.querySelector?.('[data-report-memo-manual-input]');
        if (input) input.value = '';
    }

    function setReportDeckMemoLines(root, state, meta, dialog, key, lines = [], options = {}) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        state[normalizedKey] = (Array.isArray(lines) ? lines : [])
            .map(line => String(line || '').trim())
            .filter(Boolean)
            .join('\n');
        syncReportDeckMemoControls(root, state);
        if (options.syncDialog !== false) {
            syncReportDeckMemoDialogLines(dialog, state);
        }
        markReportDeckDirty(root, state, meta);
        return true;
    }

    function appendReportDeckMemoLines(root, state, meta, dialog, key, addedLines = []) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        const nextLines = lines.concat(
            (Array.isArray(addedLines) ? addedLines : [])
                .map(line => String(line || '').trim())
                .filter(Boolean)
        );
        return setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, nextLines);
    }

    function syncReportDeckMemoDialogLines(dialog, state) {
        const list = dialog?.querySelector?.('[data-report-memo-lines]');
        if (!list) return;
        const key = getReportDeckMemoDialogTargetKey(dialog);
        const lines = key && Object.prototype.hasOwnProperty.call(state, key)
            ? getReportDeckMemoLines(state[key])
            : [];
        list.dataset.empty = lines.length ? 'false' : 'true';
        if (!lines.length) {
            list.innerHTML = '<div class="report-memo-lines-empty">기입된 특이사항이 없습니다.</div>';
            return;
        }
        list.innerHTML = lines.map((line, index) => (
            `<div class="report-memo-line-row" data-report-memo-line-row="${index}">`
                + `<textarea class="report-memo-line-input ${getReportDeckMemoLineClass(line)}" data-report-memo-line-input="${index}" rows="2" aria-label="&#53945;&#51060;&#49324;&#54637; ${index + 1}">${escapeReportDeckHtml(line)}</textarea>`
                + `<button type="button" data-report-memo-delete-line="${index}">삭제</button>`
            + '</div>'
        )).join('');
    }

    function setReportDeckMemoCandidateMessage(dialog, message) {
        const list = dialog?.querySelector?.('[data-report-memo-candidates]');
        if (!list) return;
        list.innerHTML = `<div class="report-memo-empty">${escapeReportDeckHtml(message)}</div>`;
    }

    function renderReportDeckMemoCandidateList(dialog, candidates = []) {
        const list = dialog?.querySelector?.('[data-report-memo-candidates]');
        if (!list) return;
        const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
        dialog.__reportMemoCandidates = normalizedCandidates;
        if (!normalizedCandidates.length) {
            setReportDeckMemoCandidateMessage(dialog, '선택한 팀/항목에 기입할 수 있는 값이 없습니다.');
            return;
        }
        list.innerHTML = normalizedCandidates.map((candidate, index) => {
            const direction = String(candidate?.direction || 'flat').trim() || 'flat';
            return `<button type="button" class="report-memo-candidate is-${escapeReportDeckHtml(direction)}" data-report-memo-candidate="${index}"><span class="report-memo-candidate-add">+</span><span class="report-memo-candidate-text">${renderReportDeckMemoLineHtml(candidate?.text || '')}</span></button>`;
        }).join('');
    }

    async function refreshReportDeckMemoDialog(root, state, meta) {
        const dialog = getReportDeckMemoDialog(root);
        if (!dialog || dialog.hidden) return;
        const teamSelect = dialog.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog.querySelector?.('[data-report-memo-metric]');
        const teamKey = normalizeReportDeckMemoTeamKey(teamSelect?.value);
        const metricKey = syncReportDeckMemoMetricOptions(dialog, metricSelect?.value);
        if (teamSelect) teamSelect.value = teamKey;
        if (metricSelect) metricSelect.value = metricKey;
        dialog.dataset.reportMemoSequence = String((Number(dialog.dataset.reportMemoSequence || '0') || 0) + 1);
        const sequence = dialog.dataset.reportMemoSequence;
        dialog.__reportMemoCandidates = [];
        const memoKey = String(dialog?.dataset?.reportMemoTarget || '').trim();
        const cacheKey = buildReportDeckMemoCandidateCacheKey(meta?.selectedMonth, teamKey, metricKey, memoKey);
        const candidateCache = getReportDeckMemoCandidateCache(meta);
        if (cacheKey && candidateCache.has(cacheKey)) {
            renderReportDeckMemoCandidateList(dialog, candidateCache.get(cacheKey)?.candidates || []);
            return;
        }
        setReportDeckMemoCandidateMessage(dialog, '특이사항 후보를 불러오는 중입니다.');
        if (!meta?.selectedMonth || typeof browser?.buildReportDeckMemoCandidates !== 'function') {
            setReportDeckMemoCandidateMessage(dialog, '보고서 월 데이터가 준비되지 않았습니다.');
            return;
        }
        await waitReportDeckUiFrame();
        if (dialog.dataset.reportMemoSequence !== sequence || dialog.hidden) return;
        try {
            const result = await browser.buildReportDeckMemoCandidates(meta.selectedMonth, {
                teamKey,
                metricKey,
                memoKey,
                store: meta.sharedStore
            });
            if (dialog.dataset.reportMemoSequence !== sequence) return;
            if (result?.ok !== true) {
                setReportDeckMemoCandidateMessage(dialog, '선택한 조건의 데이터를 불러올 수 없습니다.');
                return;
            }
            if (cacheKey) {
                candidateCache.set(cacheKey, {
                    candidates: Array.isArray(result.candidates) ? result.candidates : []
                });
            }
            renderReportDeckMemoCandidateList(dialog, result.candidates || []);
        } catch (error) {
            void error;
            if (dialog.dataset.reportMemoSequence === sequence) {
                setReportDeckMemoCandidateMessage(dialog, '특이사항 후보를 불러오지 못했습니다.');
            }
        }
    }

    function openReportDeckMemoDialog(root, state, meta, memoTarget) {
        const dialog = getReportDeckMemoDialog(root);
        const key = String(memoTarget?.dataset?.reportMemoKey || '').trim();
        if (!dialog || !key || !Object.prototype.hasOwnProperty.call(state, key)) return false;
        const teamSelect = dialog.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog.querySelector?.('[data-report-memo-metric]');
        if (teamSelect) {
            teamSelect.value = normalizeReportDeckMemoTeamKey(memoTarget.dataset.reportMemoDefaultTeam || teamSelect.value);
        }
        dialog.dataset.reportMemoTarget = key;
        syncReportDeckMemoMetricOptions(dialog, memoTarget.dataset.reportMemoDefaultMetric || metricSelect?.value);
        syncReportDeckMemoDialogLines(dialog, state);
        clearReportDeckMemoManualInput(dialog);
        dialog.hidden = false;
        void refreshReportDeckMemoDialog(root, state, meta);
        teamSelect?.focus?.();
        return true;
    }

    function normalizeReportDeckPlanSlotCount(value) {
        const count = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(count)) return 4;
        return Math.max(1, Math.min(4, count));
    }

    function normalizeReportDeckPlanItemCount(value) {
        const count = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(count)) return 0;
        return Math.max(0, Math.min(REPORT_DECK_PLAN_MAX_ITEMS, count));
    }

    function isReportDeckPlanImageSourceKey(key) {
        return /^slide(?:8(?:Before|After)?Image|9Image)\d+Source$/.test(String(key || '').trim());
    }

    function getReportDeckPlanImageSourceKey(key) {
        const imageKey = String(key || '').trim();
        return imageKey ? `${imageKey}Source` : '';
    }

    function normalizeReportDeckPlanImageSource(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'paste' || normalized === 'upload' ? normalized : '';
    }

    function getReportDeckPlanImagePlaceholderText(root) {
        if (root?.dataset?.reportEditMode !== 'editing') return '';
        return '이미지 첨부 또는 붙여넣기';
    }

    function canUseReportDeckPlanImageAttachment(root, frame) {
        return Boolean(
            root?.dataset?.reportEditMode === 'editing'
            && frame?.dataset?.hasImage !== 'true'
            && getReportDeckPlanImageKeyFromFrame(frame)
        );
    }

    function canUseReportDeckPlanImagePaste(root, frame) {
        return Boolean(
            root?.dataset?.reportEditMode === 'editing'
            && frame?.dataset?.hasImage !== 'true'
            && getReportDeckPlanImageKeyFromFrame(frame)
        );
    }

    function syncReportDeckPlanImageAttachmentState(root) {
        Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []).forEach(frame => {
            const hasEditableImageKey = Boolean(
                root?.dataset?.reportEditMode === 'editing'
                && getReportDeckPlanImageKeyFromFrame(frame)
            );
            const canReceiveNewImage = hasEditableImageKey && frame?.dataset?.hasImage !== 'true';
            const canAttach = canUseReportDeckPlanImageAttachment(root, frame);
            frame.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            frame.setAttribute?.('tabindex', canReceiveNewImage ? '0' : '-1');
            const input = getReportDeckPlanImageInputFromFrame(frame);
            if (input) input.disabled = !canAttach;
            const uploadButton = frame?.querySelector?.('[data-report-plan-image-upload]');
            if (uploadButton) {
                uploadButton.disabled = !canReceiveNewImage;
                uploadButton.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            }
            const pasteButton = frame?.querySelector?.('[data-report-plan-image-paste]');
            if (pasteButton) {
                pasteButton.disabled = !canReceiveNewImage;
                pasteButton.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            }
        });
    }

    function syncReportDeckPlanImageModeHints(root) {
        Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []).forEach(frame => {
            const placeholder = frame?.querySelector?.('[data-report-plan-image-placeholder]');
            if (placeholder) placeholder.textContent = getReportDeckPlanImagePlaceholderText(root);
        });
        syncReportDeckPlanImageAttachmentState(root);
    }

    function buildReportDeckPlanPageCounts(totalCount) {
        const total = normalizeReportDeckPlanItemCount(totalCount);
        if (total <= 0) return [0];
        if (total <= 4) return [total];
        if (total <= 6) return [3, total - 3];
        return [4, total - 4];
    }

    function getReportDeckPlanPageStart(pageCounts = [], pageIndex = 0) {
        return pageCounts.slice(0, Math.max(0, pageIndex)).reduce((sum, count) => sum + count, 0) + 1;
    }

    function getReportDeckPlanSourceIndex(state = {}, slideKey = '', pageIndex = 0, localSlotIndex = 1) {
        const pageCounts = buildReportDeckPlanPageCounts(state[`${slideKey}SlotCount`]);
        return getReportDeckPlanPageStart(pageCounts, pageIndex) + Math.max(1, localSlotIndex) - 1;
    }

    function syncReportDeckPlanControls(root, state) {
        Array.from(root?.querySelectorAll?.('[data-report-plan-slide]') || []).forEach(slide => {
            const slideKey = String(slide.dataset.reportPlanSlide || '').trim();
            const pageIndex = Math.max(0, Number.parseInt(String(slide.dataset.reportPlanPage || '0'), 10) || 0);
            const totalCount = normalizeReportDeckPlanItemCount(state[`${slideKey}SlotCount`]);
            state[`${slideKey}SlotCount`] = String(totalCount);
            const pageCounts = buildReportDeckPlanPageCounts(totalCount);
            const pageCount = pageCounts[pageIndex] || 0;
            const pageStart = getReportDeckPlanPageStart(pageCounts, pageIndex);
            const slidePage = slide.closest?.('[data-report-slide-page]');
            if (slidePage) {
                slidePage.hidden = pageIndex > 0 && pageCount <= 0;
            }
            slide.dataset.reportPlanSlotCount = String(pageCount);
            Array.from(slide.querySelectorAll?.('[data-report-plan-slot]') || []).forEach(cell => {
                const localSlotIndex = Number.parseInt(String(cell.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = pageStart + localSlotIndex - 1;
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= pageCount;
                cell.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                cell.dataset.reportPlanActive = active ? 'true' : 'false';
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-header-slot]') || []).forEach(header => {
                const localSlotIndex = Number.parseInt(String(header.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = pageStart + localSlotIndex - 1;
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= pageCount;
                header.textContent = active ? String(sourceIndex) : '';
                header.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-summary]') || []).forEach(summary => {
                const localSlotIndex = Number.parseInt(String(summary.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = pageStart + localSlotIndex - 1;
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= pageCount;
                summary.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                summary.textContent = active ? String(state[`${slideKey}Item${sourceIndex}Text`] || '') : '';
                if (summary.dataset.reportSlide8Overview !== undefined) {
                    summary.dataset.reportSlide8Overview = active ? String(sourceIndex) : '';
                }
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-delete-slot]') || []).forEach(button => {
                const localSlotIndex = Number.parseInt(String(button.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = pageStart + localSlotIndex - 1;
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= pageCount;
                button.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                button.disabled = !active;
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-add-slot]') || []).forEach(button => {
                button.disabled = totalCount >= REPORT_DECK_PLAN_MAX_ITEMS;
            });
        });

        Array.from(root?.querySelectorAll?.('[data-report-plan-image]') || []).forEach(image => {
            const role = String(image.dataset.reportPlanImageRole || '').trim();
            const sourceIndex = Number.parseInt(String(image.dataset.reportPlanSourceSlot || image.closest?.('[data-report-plan-slot]')?.dataset.reportPlanSourceSlot || '').trim(), 10);
            const key = role && Number.isInteger(sourceIndex) && sourceIndex >= 1
                ? `${role}${sourceIndex}`
                : String(image.dataset.reportPlanImage || '').trim();
            const value = key ? String(state[key] || '') : '';
            image.dataset.reportPlanImage = key;
            const frame = image.closest?.('[data-report-plan-image-frame]');
            const input = frame?.querySelector?.('[data-report-plan-image-input]');
            const uploadButton = frame?.querySelector?.('[data-report-plan-image-upload]');
            const pasteButton = frame?.querySelector?.('[data-report-plan-image-paste]');
            const clearButton = frame?.querySelector?.('[data-report-plan-image-clear]');
            const placeholder = frame?.querySelector?.('[data-report-plan-image-placeholder]');
            const source = normalizeReportDeckPlanImageSource(state[getReportDeckPlanImageSourceKey(key)]);
            if (input) input.dataset.reportPlanImageKey = key;
            if (uploadButton) uploadButton.dataset.reportPlanImageUpload = key;
            if (pasteButton) pasteButton.dataset.reportPlanImagePaste = key;
            if (clearButton) clearButton.dataset.reportPlanImageClear = key;
            if (placeholder) placeholder.textContent = getReportDeckPlanImagePlaceholderText(root);
            if (frame?.dataset) {
                frame.dataset.reportPlanImageKey = key;
                frame.dataset.reportPlanImageSource = source;
            }
            if (value) {
                image.src = value;
                image.removeAttribute?.('hidden');
                frame?.setAttribute?.('data-has-image', 'true');
            } else {
                image.removeAttribute?.('src');
                image.setAttribute?.('hidden', 'hidden');
                frame?.setAttribute?.('data-has-image', 'false');
            }
        });
        syncReportDeckPlanImageModeHints(root);
        syncReportDeckDynamicSlides(root);
    }

    function getReportDeckPlanImageFrameFromTarget(target) {
        return target?.closest?.('[data-report-plan-image-frame]') || null;
    }

    function getReportDeckPlanImageInputFromFrame(frame) {
        return frame?.querySelector?.('[data-report-plan-image-input]') || null;
    }

    function getReportDeckPlanImageKeyFromFrame(frame) {
        const frameKey = String(frame?.dataset?.reportPlanImageKey || '').trim();
        if (frameKey) return frameKey;
        const inputKey = String(getReportDeckPlanImageInputFromFrame(frame)?.dataset?.reportPlanImageKey || '').trim();
        if (inputKey) return inputKey;
        return String(frame?.querySelector?.('[data-report-plan-image]')?.dataset?.reportPlanImage || '').trim();
    }

    function getReportDeckPlanImageFrames(root) {
        return Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []);
    }

    function setReportDeckActivePlanImageFrame(root, frame) {
        root.__reportDeckActivePlanImageFrame = frame || null;
        getReportDeckPlanImageFrames(root).forEach(item => {
            if (item?.dataset) item.dataset.reportPlanPasteTarget = item === frame ? 'true' : 'false';
        });
    }

    function isReportDeckUsablePlanImageFrame(frame, state) {
        const key = getReportDeckPlanImageKeyFromFrame(frame);
        return Boolean(key && Object.prototype.hasOwnProperty.call(state, key));
    }

    function hasReportDeckPlanImageValue(state, key) {
        return Boolean(String(state?.[key] || '').trim());
    }

    function getReportDeckPasteCandidateFrames(root) {
        const frames = getReportDeckPlanImageFrames(root);
        const activeSlide = root?.querySelector?.('.report-slide.is-active');
        if (!activeSlide || typeof activeSlide.contains !== 'function') return frames;
        const activeFrames = frames.filter(frame => activeSlide.contains(frame));
        return activeFrames.length ? activeFrames : frames;
    }

    function resolveReportDeckPasteImageFrame(root, state, target) {
        const targetFrame = getReportDeckPlanImageFrameFromTarget(target);
        if (isReportDeckUsablePlanImageFrame(targetFrame, state)) {
            return canUseReportDeckPlanImagePaste(root, targetFrame) ? targetFrame : null;
        }
        if (isReportDeckUsablePlanImageFrame(root.__reportDeckActivePlanImageFrame, state)) {
            return canUseReportDeckPlanImagePaste(root, root.__reportDeckActivePlanImageFrame)
                ? root.__reportDeckActivePlanImageFrame
                : null;
        }
        const frames = getReportDeckPasteCandidateFrames(root);
        return frames.find(frame => isReportDeckUsablePlanImageFrame(frame, state) && canUseReportDeckPlanImagePaste(root, frame) && frame?.dataset?.hasImage !== 'true')
            || null;
    }

    function isReportDeckImageFile(file) {
        const type = String(file?.type || '').toLowerCase();
        if (type.startsWith('image/')) return true;
        return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(String(file?.name || ''));
    }

    function getReportDeckClipboardImageFile(event) {
        const items = Array.from(event?.clipboardData?.items || []);
        for (const item of items) {
            if (!String(item?.type || '').toLowerCase().startsWith('image/')) continue;
            const file = item.getAsFile?.();
            if (file) return file;
        }
        return Array.from(event?.clipboardData?.files || []).find(isReportDeckImageFile) || null;
    }

    function getReportDeckOverviewDialog(root) {
        return root?.querySelector?.('[data-report-overview-dialog]') || null;
    }

    function getReportDeckOverviewDialogField(dialog, fieldKey) {
        return dialog?.querySelector?.(`[data-report-overview-${fieldKey}]`) || null;
    }

    function getReportDeckOverviewSlot(root, slotToken, state = {}, slideKey = 'slide8') {
        const directSlot = Number.parseInt(String(slotToken || ''), 10);
        if (Number.isInteger(directSlot) && directSlot >= 1 && directSlot <= REPORT_DECK_PLAN_MAX_ITEMS) return directSlot;
        const normalizedSlideKey = slideKey === 'slide9' ? 'slide9' : 'slide8';
        const activeCount = normalizeReportDeckPlanItemCount(state[`${normalizedSlideKey}SlotCount`]);
        const hasData = normalizedSlideKey === 'slide9'
            ? index => hasReportDeckSlide9OverviewData(getReportDeckSlide9OverviewEntry(state, index))
            : index => hasReportDeckSlide8OverviewData(getReportDeckSlide8OverviewEntry(state, index));
        const emptySlot = Array.from({ length: REPORT_DECK_PLAN_MAX_ITEMS }, (_, index) => index + 1).find(index => (
            index <= activeCount && !hasData(index)
        ));
        return emptySlot || 1;
    }

    function setReportDeckOverviewKindControls(dialog, kindValue) {
        const normalizedKind = normalizeReportDeckSlide9Kind(kindValue);
        const kindField = getReportDeckOverviewDialogField(dialog, 'kind');
        if (kindField) kindField.value = normalizedKind;
        Array.from(dialog?.querySelectorAll?.('[data-report-overview-kind-option]') || []).forEach(button => {
            const active = normalizeReportDeckSlide9Kind(button.dataset.reportOverviewKindOption) === normalizedKind;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
        });
    }

    function syncReportDeckOverviewDialogMode(dialog, slideKey) {
        const normalizedSlideKey = slideKey === 'slide9' ? 'slide9' : 'slide8';
        dialog.dataset.reportOverviewSlideKey = normalizedSlideKey;
        const title = dialog.querySelector?.('[data-report-overview-dialog-title]');
        if (title) title.textContent = normalizedSlideKey === 'slide9' ? '주요 계획 개요' : '공사 및 정비 개요';
        Array.from(dialog.querySelectorAll?.('[data-report-overview-mode]') || []).forEach(row => {
            row.hidden = String(row.dataset.reportOverviewMode || '') !== normalizedSlideKey;
        });
        const dateLabel = dialog.querySelector?.('[data-report-overview-date-label]');
        if (dateLabel) dateLabel.textContent = normalizedSlideKey === 'slide9' ? '예상 날짜' : '완료 날짜';
        const amountLabel = dialog.querySelector?.('[data-report-overview-amount-label]');
        if (amountLabel) amountLabel.textContent = normalizedSlideKey === 'slide9' ? '예상 금액' : '금액';
    }

    function openReportDeckOverviewDialog(root, state, slotToken, slideKey = 'slide8') {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog) return false;
        const normalizedSlideKey = slideKey === 'slide9' ? 'slide9' : 'slide8';
        const slotIndex = getReportDeckOverviewSlot(root, slotToken, state, normalizedSlideKey);
        const entry = normalizedSlideKey === 'slide9'
            ? getReportDeckSlide9OverviewEntry(state, slotIndex)
            : getReportDeckSlide8OverviewEntry(state, slotIndex);
        syncReportDeckOverviewDialogMode(dialog, normalizedSlideKey);
        dialog.dataset.reportOverviewSlot = String(slotIndex);
        const teamField = getReportDeckOverviewDialogField(dialog, 'team');
        const titleField = getReportDeckOverviewDialogField(dialog, 'title');
        const effectField = getReportDeckOverviewDialogField(dialog, 'effect');
        const detailField = getReportDeckOverviewDialogField(dialog, 'detail');
        const dateField = getReportDeckOverviewDialogField(dialog, 'date');
        const amountField = getReportDeckOverviewDialogField(dialog, 'amount');
        if (teamField) teamField.value = entry.team || REPORT_DECK_SLIDE8_OVERVIEW_TEAMS[0];
        if (titleField) titleField.value = entry.title || '';
        if (effectField) effectField.value = entry.effect || '';
        if (detailField) detailField.value = entry.detail || '';
        if (dateField) dateField.value = entry.date || '';
        if (amountField) amountField.value = entry.amount || '';
        setReportDeckOverviewKindControls(dialog, entry.kind || 'cause');
        dialog.hidden = false;
        titleField?.focus?.();
        return true;
    }

    function closeReportDeckOverviewDialog(root) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog) return false;
        dialog.hidden = true;
        dialog.dataset.reportOverviewSlot = '';
        dialog.dataset.reportOverviewSlideKey = '';
        return true;
    }

    function saveReportDeckOverviewDialog(root, state, meta) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog || dialog.hidden) return false;
        const slideKey = dialog.dataset.reportOverviewSlideKey === 'slide9' ? 'slide9' : 'slide8';
        const slotIndex = getReportDeckOverviewSlot(root, dialog.dataset.reportOverviewSlot, state, slideKey);
        const current = slideKey === 'slide9'
            ? getReportDeckSlide9OverviewEntry(state, slotIndex)
            : getReportDeckSlide8OverviewEntry(state, slotIndex);
        const amountField = getReportDeckOverviewDialogField(dialog, 'amount');
        const rawAmount = String(amountField?.value || '').trim();
        const normalizedAmount = normalizeReportDeckOverviewAmount(rawAmount);
        if (rawAmount && !normalizedAmount) {
            amountField?.setCustomValidity?.('백만원 단위 숫자만 입력해 주세요.');
            amountField?.reportValidity?.();
            amountField?.focus?.();
            setReportDeckStatus(root, 'error', '금액은 숫자만 입력해 주세요');
            return false;
        }
        amountField?.setCustomValidity?.('');
        const entry = {
            ...current,
            team: getReportDeckOverviewDialogField(dialog, 'team')?.value || '',
            title: getReportDeckOverviewDialogField(dialog, 'title')?.value || '',
            effect: getReportDeckOverviewDialogField(dialog, 'effect')?.value || '',
            kind: getReportDeckOverviewDialogField(dialog, 'kind')?.value || 'cause',
            detail: getReportDeckOverviewDialogField(dialog, 'detail')?.value || '',
            date: getReportDeckOverviewDialogField(dialog, 'date')?.value || '',
            amount: normalizedAmount
        };
        if (slideKey === 'slide9') {
            setReportDeckSlide9OverviewEntry(state, slotIndex, entry);
            normalizeReportDeckSlide9OverviewOrder(state);
        } else {
            setReportDeckSlide8OverviewEntry(state, slotIndex, entry);
            normalizeReportDeckSlide8OverviewOrder(state);
        }
        syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        markReportDeckDirty(root, state, meta);
        closeReportDeckOverviewDialog(root);
        return true;
    }

    function isReportDeckSlide8OverviewComplete(state, slotIndex) {
        const entry = getReportDeckSlide8OverviewEntry(state, slotIndex);
        return Boolean(entry.team && entry.title && entry.effect && entry.date);
    }

    function isReportDeckSlide9OverviewComplete(state, slotIndex) {
        const entry = getReportDeckSlide9OverviewEntry(state, slotIndex);
        return Boolean(entry.team && entry.title && entry.detail && entry.date);
    }

    function isReportDeckPlanSlotComplete(state, slideKey, slotIndex) {
        if (slideKey === 'slide8') return isReportDeckSlide8OverviewComplete(state, slotIndex);
        if (slideKey === 'slide9') return isReportDeckSlide9OverviewComplete(state, slotIndex);
        return Boolean(String(state[`${slideKey}Item${slotIndex}Text`] || '').trim());
    }

    function clearReportDeckPlanSlot(state, slideKey, slotIndex) {
        const normalizedSlideKey = String(slideKey || '').trim();
        if (normalizedSlideKey !== 'slide8' && normalizedSlideKey !== 'slide9') return false;
        const countKey = `${normalizedSlideKey}SlotCount`;
        const currentCount = normalizeReportDeckPlanItemCount(state[countKey]);
        const targetIndex = Math.max(1, Math.min(currentCount, Number.parseInt(String(slotIndex || ''), 10) || 1));
        const getter = normalizedSlideKey === 'slide9'
            ? getReportDeckSlide9OverviewEntry
            : getReportDeckSlide8OverviewEntry;
        const setter = normalizedSlideKey === 'slide9'
            ? setReportDeckSlide9OverviewEntry
            : setReportDeckSlide8OverviewEntry;
        if (currentCount <= 1) {
            setter(state, 1, {});
            state[countKey] = '0';
            return true;
        }
        for (let index = targetIndex; index < currentCount; index += 1) {
            setter(state, index, getter(state, index + 1));
        }
        setter(state, currentCount, {});
        state[countKey] = String(Math.max(1, currentCount - 1));
        return true;
    }

    function deleteReportDeckPlanSlot(root, state, meta, slideKey = '', slotIndex = '') {
        const normalizedSlideKey = String(slideKey || '').trim();
        if (normalizedSlideKey !== 'slide8' && normalizedSlideKey !== 'slide9') return false;
        const deleted = clearReportDeckPlanSlot(state, normalizedSlideKey, slotIndex);
        if (!deleted) return false;
        closeReportDeckOverviewDialog(root);
        syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        markReportDeckDirty(root, state, meta);
        return true;
    }

    function addReportDeckPlanSlot(root, state, meta, slideKey = '') {
        const normalizedSlideKey = String(slideKey || '').trim();
        if (normalizedSlideKey !== 'slide8' && normalizedSlideKey !== 'slide9') return false;
        const countKey = `${normalizedSlideKey}SlotCount`;
        const currentCount = normalizeReportDeckPlanItemCount(state[countKey]);
        if (currentCount >= REPORT_DECK_PLAN_MAX_ITEMS) {
            setReportDeckStatus(root, 'error', '최대 8칸까지 추가할 수 있습니다');
            return false;
        }
        if (currentCount > 0 && !isReportDeckPlanSlotComplete(state, normalizedSlideKey, currentCount)) {
            setReportDeckStatus(root, 'error', '앞 칸 개요를 먼저 입력해 주세요');
            return false;
        }
        if (currentCount > 0 && meta?.dirty === true) {
            setReportDeckStatus(root, 'error', '저장 완료 후 칸을 추가해 주세요');
            return false;
        }
        const nextCount = currentCount + 1;
        state[countKey] = String(nextCount);
        syncReportDeckPlanControls(root, state);
        markReportDeckDirty(root, state, meta);
        if (normalizedSlideKey === 'slide8' || normalizedSlideKey === 'slide9') {
            openReportDeckOverviewDialog(root, state, String(nextCount), normalizedSlideKey);
        }
        return true;
    }

    function toReportDeckFiniteNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function isReportDeckImageFieldKey(key = '') {
        return /^slide[89].*Image\d+$/.test(String(key || '').trim());
    }

    function isReportDeckInlineImageValue(value = '') {
        return /^data:image\/[^;,]+;base64,/i.test(String(value || '').trim());
    }

    function getReportDeckSaveErrorText(error) {
        const message = String(error?.message || '');
        if (message.includes(':413') || message.includes('body_too_large') || message.includes('file_too_large')) {
            return '저장 실패: 이미지 용량이 너무 큽니다';
        }
        if (message.includes(':401') || message.includes(':403')) {
            return '저장 실패: 권한을 확인해 주세요';
        }
        return '저장 실패';
    }

    function getReportDeckImageErrorText(error) {
        const message = String(error?.message || '');
        if (message.includes(':413') || message.includes('file_too_large')) {
            return '이미지 용량이 너무 큽니다';
        }
        if (message.includes('unsupported_type')) {
            return '지원하지 않는 이미지 형식입니다';
        }
        return '이미지 삽입 실패';
    }

    async function externalizeReportDeckInlineImages(root, state, meta) {
        if (typeof browser?.uploadReportDeckImageDataUrl !== 'function') return false;
        let changed = false;
        for (const key of Object.keys(state || {})) {
            const value = String(state[key] || '');
            if (!isReportDeckImageFieldKey(key) || !isReportDeckInlineImageValue(value)) continue;
            setReportDeckStatus(root, 'saving', '이미지 저장 중');
            state[key] = await browser.uploadReportDeckImageDataUrl(value, {
                recordKey: meta.recordKey,
                fieldKey: key,
                originalName: `${key}.png`,
                mimeType: 'image/png'
            });
            changed = true;
        }
        if (changed) {
            syncReportDeckPlanControls(root, state);
            syncReportDeckJson(root, state, meta);
        }
        return changed;
    }

    function formatReportDeckAutoNumber(value, decimals = 0) {
        const number = toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    function getReportDeckAutoDeltaClass(value) {
        const number = toReportDeckFiniteNumber(value);
        if (number === null || number === 0) return 'is-delta-flat';
        return number > 0 ? 'is-delta-up' : 'is-delta-down';
    }

    function formatReportDeckAutoSignedNumber(value, decimals = 0) {
        const number = toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        if (number === 0) return formatReportDeckAutoNumber(0, decimals);
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(Math.abs(number), decimals)}`;
    }

    function formatReportDeckAutoSignedRate(value) {
        const number = toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        const percentage = Math.abs(number) * 100;
        if (number === 0) return '0.0%';
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(percentage, 1)}%`;
    }

    function formatReportDeckAutoNumberOrBlank(value, decimals = 0) {
        const number = toReportDeckFiniteNumber(value);
        return number === null ? '' : formatReportDeckAutoNumber(number, decimals);
    }

    function formatReportDeckAutoPercentOrBlank(value) {
        const number = toReportDeckFiniteNumber(value);
        return number === null ? '' : `${formatReportDeckAutoNumber(number * 100, 1)}%`;
    }

    function formatReportDeckAutoSignedNumberOrBlank(value, decimals = 0) {
        return toReportDeckFiniteNumber(value) === null ? '' : formatReportDeckAutoSignedNumber(value, decimals);
    }

    function formatReportDeckAutoSignedPercentOrBlank(value) {
        const number = toReportDeckFiniteNumber(value);
        if (number === null) return '';
        if (number === 0) return '0.0%';
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(Math.abs(number) * 100, 1)}%`;
    }

    function parseReportDeckChartHighlights(value = '') {
        if (!value) return {};
        try {
            const parsed = JSON.parse(String(value || '{}'));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return Object.entries(parsed).reduce((map, [chartKey, monthKeys]) => {
                const key = String(chartKey || '').trim();
                if (!key || !Array.isArray(monthKeys)) return map;
                const normalizedMonths = Array.from(new Set(monthKeys
                    .map(monthKey => normalizeReportDeckMonth(monthKey))
                    .filter(Boolean)));
                if (normalizedMonths.length) {
                    map[key] = normalizedMonths;
                }
                return map;
            }, {});
        } catch (error) {
            return {};
        }
    }

    function serializeReportDeckChartHighlights(map = {}) {
        const normalized = Object.entries(map && typeof map === 'object' ? map : {}).reduce((result, [chartKey, monthKeys]) => {
            const key = String(chartKey || '').trim();
            if (!key || !Array.isArray(monthKeys)) return result;
            const normalizedMonths = Array.from(new Set(monthKeys.map(normalizeReportDeckMonth).filter(Boolean))).sort();
            if (normalizedMonths.length) result[key] = normalizedMonths;
            return result;
        }, {});
        return Object.keys(normalized).length ? JSON.stringify(normalized) : '';
    }

    function getReportDeckChartHighlightMonthKeys(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return [];
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        return Array.isArray(highlights[key]) ? highlights[key] : [];
    }

    function normalizeReportDeckChartHighlightMode(value = '') {
        return String(value || '').trim() === 'range' ? 'range' : 'point';
    }

    function parseReportDeckChartHighlightRanges(value = '') {
        if (!value) return {};
        try {
            const parsed = JSON.parse(String(value || '{}'));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return Object.entries(parsed).reduce((map, [chartKey, ranges]) => {
                const key = String(chartKey || '').trim();
                if (!key || !Array.isArray(ranges)) return map;
                const normalizedRanges = ranges
                    .map(range => Array.isArray(range)
                        ? [normalizeReportDeckMonth(range[0]), normalizeReportDeckMonth(range[1])]
                        : [normalizeReportDeckMonth(range?.start), normalizeReportDeckMonth(range?.end)])
                    .filter(range => range[0] && range[1])
                    .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
                if (normalizedRanges.length) {
                    map[key] = Array.from(new Map(normalizedRanges.map(range => [`${range[0]}..${range[1]}`, range])).values());
                }
                return map;
            }, {});
        } catch (error) {
            return {};
        }
    }

    function serializeReportDeckChartHighlightRanges(map = {}) {
        const normalized = Object.entries(map && typeof map === 'object' ? map : {}).reduce((result, [chartKey, ranges]) => {
            const key = String(chartKey || '').trim();
            if (!key || !Array.isArray(ranges)) return result;
            const normalizedRanges = ranges
                .map(range => Array.isArray(range)
                    ? [normalizeReportDeckMonth(range[0]), normalizeReportDeckMonth(range[1])]
                    : [normalizeReportDeckMonth(range?.start), normalizeReportDeckMonth(range?.end)])
                .filter(range => range[0] && range[1])
                .map(range => range[0] <= range[1] ? range : [range[1], range[0]])
                .sort((left, right) => `${left[0]}..${left[1]}`.localeCompare(`${right[0]}..${right[1]}`));
            const deduped = Array.from(new Map(normalizedRanges.map(range => [`${range[0]}..${range[1]}`, range])).values());
            if (deduped.length) result[key] = deduped;
            return result;
        }, {});
        return Object.keys(normalized).length ? JSON.stringify(normalized) : '';
    }

    function getReportDeckChartHighlightRanges(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return [];
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        return Array.isArray(ranges[key]) ? ranges[key] : [];
    }

    function toggleReportDeckChartHighlightRange(state = {}, chartKey = '', startMonth = '', endMonth = '') {
        const key = String(chartKey || '').trim();
        const start = normalizeReportDeckMonth(startMonth);
        const end = normalizeReportDeckMonth(endMonth);
        if (!key || !start || !end) return false;
        const normalizedRange = start <= end ? [start, end] : [end, start];
        const rangeKey = `${normalizedRange[0]}..${normalizedRange[1]}`;
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        const existing = Array.isArray(ranges[key]) ? ranges[key] : [];
        const nextRanges = existing.filter(range => `${range[0]}..${range[1]}` !== rangeKey);
        if (nextRanges.length === existing.length) {
            nextRanges.push(normalizedRange);
        }
        ranges[key] = nextRanges;
        if (!ranges[key].length) delete ranges[key];
        state.chartHighlightRanges = serializeReportDeckChartHighlightRanges(ranges);
        return true;
    }

    function clearReportDeckChartHighlights(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return false;
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        const changed = (Array.isArray(highlights[key]) && highlights[key].length > 0)
            || (Array.isArray(ranges[key]) && ranges[key].length > 0);
        delete highlights[key];
        delete ranges[key];
        state.chartHighlights = serializeReportDeckChartHighlights(highlights);
        state.chartHighlightRanges = serializeReportDeckChartHighlightRanges(ranges);
        return changed;
    }

    function toggleReportDeckChartHighlightMonth(state = {}, chartKey = '', monthKey = '') {
        const key = String(chartKey || '').trim();
        const normalizedMonth = normalizeReportDeckMonth(monthKey);
        if (!key || !normalizedMonth) return false;
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const monthSet = new Set(Array.isArray(highlights[key]) ? highlights[key] : []);
        if (monthSet.has(normalizedMonth)) {
            monthSet.delete(normalizedMonth);
        } else {
            monthSet.add(normalizedMonth);
        }
        highlights[key] = Array.from(monthSet).sort();
        if (!highlights[key].length) delete highlights[key];
        state.chartHighlights = serializeReportDeckChartHighlights(highlights);
        return true;
    }

    function syncReportDeckChartHighlightControls(root, state = {}, meta = {}) {
        const activeKey = String(meta.highlightChartKey || '').trim();
        const activeMode = normalizeReportDeckChartHighlightMode(meta.highlightChartMode);
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-toggle]') || []).forEach(button => {
            const key = String(button.dataset.reportChartHighlightKey || '').trim();
            const mode = normalizeReportDeckChartHighlightMode(button.dataset.reportChartHighlightMode);
            const hasExplicitMode = !!String(button.dataset.reportChartHighlightMode || '').trim();
            const active = !!key && key === activeKey && (!hasExplicitMode || mode === activeMode);
            const pointCount = key && Array.isArray(highlights[key]) ? highlights[key].length : 0;
            const rangeCount = key && Array.isArray(ranges[key]) ? ranges[key].length : 0;
            const count = mode === 'range' ? rangeCount : pointCount;
            button.classList?.toggle?.('is-active', active);
            button.classList?.toggle?.('has-highlight', count > 0);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
            button.setAttribute?.('aria-label', count > 0 ? `\uAC15\uC870 ${count}\uAC1C \uC801\uC6A9\uB428` : (mode === 'range' ? '\uBC94\uC704 \uAC15\uC870' : '\uB2E8\uC77C \uAC15\uC870'));
            if ('textContent' in button) {
                if (hasExplicitMode) {
                    button.textContent = mode === 'range' ? '\u25A1' : '\u25CB';
                } else {
                    button.textContent = active
                        ? (count > 0 ? `\uAC15\uC870\uC911 ${count}` : '\uAC15\uC870\uC911')
                        : (count > 0 ? `\uAC15\uC870 ${count}` : '\uAC15\uC870');
                }
            }
        });
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-reset]') || []).forEach(button => {
            const key = String(button.dataset.reportChartHighlightKey || '').trim();
            const pointCount = key && Array.isArray(highlights[key]) ? highlights[key].length : 0;
            const rangeCount = key && Array.isArray(ranges[key]) ? ranges[key].length : 0;
            const count = pointCount + rangeCount;
            button.classList?.toggle?.('has-highlight', count > 0);
            button.setAttribute?.('aria-label', count > 0 ? `\uAC15\uC870 ${count}\uAC1C \uB418\uB3CC\uB9AC\uAE30` : '\uAC15\uC870 \uB418\uB3CC\uB9AC\uAE30');
        });
    }

    function syncReportDeckChartHighlightPointStates(root, state = {}, meta = {}) {
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-point]') || []).forEach(point => {
            const chartKey = String(point.dataset.reportChartHighlightKey || '').trim();
            const monthKey = normalizeReportDeckMonth(point.dataset.reportChartHighlightMonth);
            const selected = !!chartKey && !!monthKey && Array.isArray(highlights[chartKey]) && highlights[chartKey].includes(monthKey);
            const rangeStart = !!chartKey
                && !!monthKey
                && chartKey === String(meta.highlightRangeChartKey || '').trim()
                && monthKey === normalizeReportDeckMonth(meta.highlightRangeStartMonth);
            point.classList?.toggle?.('is-highlighted', selected);
            point.classList?.toggle?.('is-range-start', rangeStart);
            point.setAttribute?.('data-report-chart-highlight-selected', selected ? 'true' : 'false');
        });
    }

    function setReportDeckAutoCellText(root, selector, text, deltaValue = null) {
        Array.from(root?.querySelectorAll?.(selector) || []).forEach(cell => {
            cell.textContent = text || '';
            if (cell.classList) {
                cell.classList.remove('is-delta-up', 'is-delta-down', 'is-delta-flat');
                if (deltaValue !== null) {
                    cell.classList.add(getReportDeckAutoDeltaClass(deltaValue));
                }
            }
        });
    }

    function setReportDeckAutoCellHtml(root, selector, html, deltaValue = null) {
        Array.from(root?.querySelectorAll?.(selector) || []).forEach(cell => {
            cell.innerHTML = html || '';
            if (cell.classList) {
                cell.classList.remove('is-delta-up', 'is-delta-down', 'is-delta-flat');
                if (deltaValue !== null) {
                    cell.classList.add(getReportDeckAutoDeltaClass(deltaValue));
                }
            }
        });
    }

    function formatReportDeckAutoComparisonHtml(deltaValue, rateValue, formatDelta = formatReportDeckAutoSignedNumber, formatRate = formatReportDeckAutoSignedRate) {
        const normalizedDelta = toReportDeckFiniteNumber(deltaValue);
        if (normalizedDelta === 0) return escapeReportDeckHtml('\uB3D9\uC77C');
        const deltaText = formatDelta(deltaValue);
        const rateText = formatRate(rateValue);
        return `${escapeReportDeckHtml(deltaText)}<span>${escapeReportDeckHtml(rateText)}</span>`;
    }

    function renderReportDeckAutoComparisonCell(root, selector, row, deltaKey = 'delta', rateKey = 'rate', options = {}) {
        const source = row || {};
        const formatDelta = typeof options.formatDelta === 'function' ? options.formatDelta : formatReportDeckAutoSignedNumber;
        const formatRate = typeof options.formatRate === 'function' ? options.formatRate : formatReportDeckAutoSignedRate;
        const deltaValue = source[deltaKey];
        setReportDeckAutoCellHtml(
            root,
            selector,
            formatReportDeckAutoComparisonHtml(deltaValue, source[rateKey], formatDelta, formatRate),
            deltaValue
        );
    }

    function clearReportDeckBukjeongAnalysis(root) {
        Array.from(root?.querySelectorAll?.('[data-report-auto-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-auto-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="unit"]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-cost-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-cost-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="cost"]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-caption]') || []).forEach(caption => {
            caption.textContent = caption.dataset.reportProductionStartCaptionDefault || '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-value], [data-report-production-start-cause]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-caption]') || []).forEach(caption => {
            caption.textContent = caption.dataset.reportProductionYieldCaptionDefault || '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-value], [data-report-production-yield-cause]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
    }

    function getReportDeckAutoMetricRowDecimals(rowKey) {
        return String(rowKey || '').trim() === 'unit' ? 3 : 0;
    }

    function getReportDeckAutoMetricRowComparisonOptions(rowKey) {
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        return decimals > 0
            ? { formatDelta: value => formatReportDeckAutoSignedNumber(value, decimals) }
            : {};
    }

    function renderReportDeckAutoMetricRow(root, resourceKey, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckWasteMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-waste-auto-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-waste-auto-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckYusanLpgMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckYusanLpgCostMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const isRatioRow = String(rowKey) === '2';
        const isConversionRow = String(rowKey) === '1';
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.reference"]`,
            isRatioRow
                ? formatReportDeckAutoPercentOrBlank(row.reference)
                : (isConversionRow ? formatReportDeckAutoNumberOrBlank(row.reference) : formatReportDeckAutoNumber(row.reference))
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.current"]`,
            isRatioRow
                ? formatReportDeckAutoPercentOrBlank(row.current)
                : (isConversionRow ? formatReportDeckAutoNumberOrBlank(row.current) : formatReportDeckAutoNumber(row.current))
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            {
                formatDelta: value => (isRatioRow
                    ? formatReportDeckAutoSignedPercentOrBlank(value)
                    : (isConversionRow ? formatReportDeckAutoSignedNumberOrBlank(value) : formatReportDeckAutoSignedNumber(value))),
                formatRate: value => ((isRatioRow || isConversionRow) && toReportDeckFiniteNumber(value) === null
                    ? ''
                    : formatReportDeckAutoSignedRate(value))
            }
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.previous"]`,
            isRatioRow
                ? formatReportDeckAutoPercentOrBlank(row.previous)
                : (isConversionRow ? formatReportDeckAutoNumberOrBlank(row.previous) : formatReportDeckAutoNumber(row.previous))
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            {
                formatDelta: value => (isRatioRow
                    ? formatReportDeckAutoSignedPercentOrBlank(value)
                    : (isConversionRow ? formatReportDeckAutoSignedNumberOrBlank(value) : formatReportDeckAutoSignedNumber(value))),
                formatRate: value => ((isRatioRow || isConversionRow) && toReportDeckFiniteNumber(value) === null
                    ? ''
                    : formatReportDeckAutoSignedRate(value))
            }
        );
    }

    function formatReportDeckProductionTableNumber(value, decimals = 0) {
        const number = toReportDeckFiniteNumber(value);
        return number === null ? '' : formatReportDeckAutoNumber(number, decimals);
    }

    function renderReportDeckProductionStartRow(root, partKey = '', row = {}) {
        const rowKey = String(row?.key || '').trim();
        if (!partKey || !rowKey) return;
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.current"]`,
            formatReportDeckProductionTableNumber(row.current)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.previous"]`,
            formatReportDeckProductionTableNumber(row.previous)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.momIndex"]`,
            formatReportDeckProductionTableNumber(row.momIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.reference"]`,
            formatReportDeckProductionTableNumber(row.reference)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.yoyIndex"]`,
            formatReportDeckProductionTableNumber(row.yoyIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-cause="${partKey}.${rowKey}.yoyRate"]`,
            formatReportDeckProductionTableNumber(toReportDeckFiniteNumber(row.yoyRate) === null ? null : row.yoyRate * 100, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-cause="${partKey}.${rowKey}.reason"]`,
            ''
        );
    }

    function renderReportDeckProductionStartAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        (Array.isArray(model.parts) ? model.parts : []).forEach(part => {
            setReportDeckAutoCellText(
                root,
                `[data-report-production-start-caption="${part.key}"]`,
                part.caption || ''
            );
            (Array.isArray(part.rows) ? part.rows : []).forEach(row => {
                renderReportDeckProductionStartRow(root, part.key, row);
            });
            const chartKey = `production-start:${model.teamKey}:${part.key}`;
            Array.from(root?.querySelectorAll?.(`[data-report-production-start-chart-plot="${part.key}"]`) || []).forEach(plot => {
                plot.innerHTML = buildReportDeckProductionStartChartSvg(part.chart || {}, {
                    chartKey,
                    highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                    highlightRanges: getReportDeckChartHighlightRanges(state, chartKey)
                });
            });
        });
    }

    function renderReportDeckProductionYieldRow(root, partKey = '', row = {}) {
        const rowKey = String(row?.key || '').trim();
        if (!partKey || !rowKey) return;
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.current"]`,
            formatReportDeckProductionTableNumber(row.current, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.previous"]`,
            formatReportDeckProductionTableNumber(row.previous, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.momIndex"]`,
            formatReportDeckProductionTableNumber(row.momIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.reference"]`,
            formatReportDeckProductionTableNumber(row.reference, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.yoyIndex"]`,
            formatReportDeckProductionTableNumber(row.yoyIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-cause="${partKey}.${rowKey}.yoyDelta"]`,
            formatReportDeckProductionTableNumber(row.yoyDelta, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-cause="${partKey}.${rowKey}.reason"]`,
            ''
        );
    }

    function renderReportDeckProductionYieldAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        (Array.isArray(model.parts) ? model.parts : []).forEach(part => {
            setReportDeckAutoCellText(
                root,
                `[data-report-production-yield-caption="${part.key}"]`,
                part.caption || ''
            );
            (Array.isArray(part.rows) ? part.rows : []).forEach(row => {
                renderReportDeckProductionYieldRow(root, part.key, row);
            });
            const chartKey = `production-yield:${model.teamKey}:${part.key}`;
            Array.from(root?.querySelectorAll?.(`[data-report-production-yield-chart-plot="${part.key}"]`) || []).forEach(plot => {
                plot.innerHTML = buildReportDeckProductionStartChartSvg(part.chart || {}, {
                    chartKey,
                    highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                    highlightRanges: getReportDeckChartHighlightRanges(state, chartKey),
                    valueDecimals: 1
                });
            });
        });
    }

    function escapeReportDeckSvgText(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatReportDeckChartValue(value) {
        const number = toReportDeckFiniteNumber(value);
        return number === null ? '' : number.toFixed(3);
    }

    function buildReportDeckChartMarkerSvg(x, y, color, marker) {
        const safeColor = escapeReportDeckSvgText(color || '#64748b');
        if (marker === 'triangle') {
            return `<polygon points="${x},${y - 6} ${x - 6},${y + 6} ${x + 6},${y + 6}" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></polygon>`;
        }
        if (marker === 'square') {
            return `<rect x="${x - 5.5}" y="${y - 5.5}" width="11" height="11" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></rect>`;
        }
        if (marker === 'diamond') {
            return `<polygon points="${x},${y - 7} ${x - 7},${y} ${x},${y + 7} ${x + 7},${y}" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></polygon>`;
        }
        return `<circle cx="${x}" cy="${y}" r="5" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></circle>`;
    }

    function buildReportDeckChartHighlightHitSvg(x, y, chartKey = '', monthKey = '', highlighted = false) {
        const safeChartKey = escapeReportDeckSvgText(chartKey);
        const safeMonthKey = escapeReportDeckSvgText(monthKey);
        if (!safeChartKey || !safeMonthKey) return '';
        const selectedClass = highlighted ? ' is-highlighted' : '';
        const selectedValue = highlighted ? 'true' : 'false';
        return `<circle class="report-chart-highlight-hit${selectedClass}" data-report-chart-highlight-point="true" data-report-chart-highlight-key="${safeChartKey}" data-report-chart-highlight-month="${safeMonthKey}" data-report-chart-highlight-selected="${selectedValue}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="13"></circle>`;
    }

    function buildReportDeckChartPath(points, xScale, yScale) {
        let open = false;
        return (Array.isArray(points) ? points : []).reduce((path, point) => {
            const value = toReportDeckFiniteNumber(point?.value);
            const month = Number(point?.month);
            if (value === null || !Number.isFinite(month)) {
                open = false;
                return path;
            }
            const command = open ? 'L' : 'M';
            open = true;
            return `${path}${command}${xScale(month).toFixed(2)},${yScale(value).toFixed(2)} `;
        }, '').trim();
    }

    function estimateReportDeckChartLabelBounds(label) {
        const text = String(label?.text || '');
        const width = Math.max(24, text.length * 7.1);
        const y = Number(label?.labelY) || 0;
        const x = Number(label?.x) || 0;
        return {
            left: x - (width / 2),
            right: x + (width / 2),
            top: y - 11,
            bottom: y + 4
        };
    }

    function doReportDeckChartLabelsOverlap(left, right) {
        const leftBounds = estimateReportDeckChartLabelBounds(left);
        const rightBounds = estimateReportDeckChartLabelBounds(right);
        return leftBounds.left < rightBounds.right
            && leftBounds.right > rightBounds.left
            && leftBounds.top < rightBounds.bottom
            && leftBounds.bottom > rightBounds.top;
    }

    function countReportDeckChartLabelCollisions(candidate, placed) {
        return placed.reduce((count, existing) => {
            if (existing.text === candidate.text) return count;
            return doReportDeckChartLabelsOverlap(existing, candidate) ? count + 1 : count;
        }, 0);
    }

    function getReportDeckChartLabelPlacementValue(label) {
        const value = toReportDeckFiniteNumber(label?.value);
        if (value !== null) return value;
        const parsedText = toReportDeckFiniteNumber(String(label?.text || '').replace(/,/g, ''));
        if (parsedText !== null) return parsedText;
        const y = toReportDeckFiniteNumber(label?.y);
        return y === null ? Number.NEGATIVE_INFINITY : -y;
    }

    function sortReportDeckChartLabelsByValue(labelItems) {
        return (Array.isArray(labelItems) ? labelItems : [])
            .map((item, index) => ({ item, index, value: getReportDeckChartLabelPlacementValue(item) }))
            .sort((left, right) => {
                if (right.value !== left.value) return right.value - left.value;
                const leftY = toReportDeckFiniteNumber(left.item?.y) ?? Number.POSITIVE_INFINITY;
                const rightY = toReportDeckFiniteNumber(right.item?.y) ?? Number.POSITIVE_INFINITY;
                if (leftY !== rightY) return leftY - rightY;
                const leftX = toReportDeckFiniteNumber(left.item?.x) ?? Number.POSITIVE_INFINITY;
                const rightX = toReportDeckFiniteNumber(right.item?.x) ?? Number.POSITIVE_INFINITY;
                if (leftX !== rightX) return leftX - rightX;
                return left.index - right.index;
            });
    }

    function placeReportDeckChartValueLabels(labelItems, plotTop, plotBottomY) {
        const placed = [];
        const placedByInputOrder = new Map();
        const offsets = [0, 16, -16, 26, -26, 36, -36, 46, -46];
        const minY = plotTop + 12;
        const maxY = plotBottomY - 8;
        sortReportDeckChartLabelsByValue(labelItems).forEach(({ item, index }) => {
            const baseY = Number(item?.baseLabelY) || 0;
            const candidates = offsets.reduce((list, offset) => {
                const labelY = Math.max(minY, Math.min(maxY, baseY + offset));
                if (!list.some(candidate => Math.abs(candidate.labelY - labelY) < 0.5)) {
                    list.push({ ...item, labelY });
                }
                return list;
            }, []);
            let best = null;
            for (const candidate of candidates) {
                const collisionCount = countReportDeckChartLabelCollisions(candidate, placed);
                if (collisionCount === 0) {
                    best = candidate;
                    break;
                }
                if (!best
                    || collisionCount < best.collisionCount
                    || (collisionCount === best.collisionCount
                        && Math.abs(candidate.labelY - baseY) < Math.abs(best.labelY - baseY))) {
                    best = { ...candidate, collisionCount };
                }
            }
            const chosen = best || { ...item, labelY: Math.max(minY, Math.min(maxY, baseY)) };
            delete chosen.collisionCount;
            placed.push(chosen);
            placedByInputOrder.set(index, chosen);
        });
        return Array.from({ length: Array.isArray(labelItems) ? labelItems.length : 0 }, (_, index) => placedByInputOrder.get(index))
            .filter(Boolean);
    }

    function getReportDeckChartSameValueLabelKey(label) {
        const x = Number(label?.x) || 0;
        const text = String(label?.text || '');
        return `${x.toFixed(2)}::${text}`;
    }

    function alignReportDeckSameValueLabels(placedLabels) {
        const groups = new Map();
        (Array.isArray(placedLabels) ? placedLabels : []).forEach(label => {
            const key = getReportDeckChartSameValueLabelKey(label);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(label);
        });
        groups.forEach(group => {
            if (group.length < 2) return;
            const labelY = group.reduce((sum, label) => sum + (Number(label?.labelY) || 0), 0) / group.length;
            group.forEach(label => {
                label.labelY = labelY;
            });
        });
        return placedLabels;
    }

    function getReportDeckChartLabelColors(labels) {
        return (Array.isArray(labels) ? labels : []).reduce((colors, label) => {
            const color = String(label?.color || '').trim();
            if (color && !colors.includes(color)) colors.push(color);
            return colors;
        }, []);
    }

    function renderReportDeckChartSingleValueLabel(label) {
        return `
            <text class="report-auto-chart-label" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="${escapeReportDeckSvgText(label.color)}">${escapeReportDeckSvgText(label.text)}</text>
        `;
    }

    function renderReportDeckChartDualColorValueLabel(label, colors) {
        const strokeColor = colors[0] || label.color;
        const fillColor = colors[1] || label.color;
        return `
            <text class="report-auto-chart-label report-auto-chart-label-dual-outline" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="none" stroke="${escapeReportDeckSvgText(strokeColor)}" stroke-width="2.6" stroke-linejoin="round">${escapeReportDeckSvgText(label.text)}</text>
            <text class="report-auto-chart-label report-auto-chart-label-dual-fill" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="${escapeReportDeckSvgText(fillColor)}">${escapeReportDeckSvgText(label.text)}</text>
        `;
    }

    function renderReportDeckChartValueLabels(placedLabels) {
        const groups = new Map();
        const order = [];
        alignReportDeckSameValueLabels(Array.isArray(placedLabels) ? placedLabels : []).forEach(label => {
            const key = getReportDeckChartSameValueLabelKey(label);
            if (!groups.has(key)) {
                groups.set(key, []);
                order.push(key);
            }
            groups.get(key).push(label);
        });
        return order.map(key => {
            const group = groups.get(key) || [];
            const label = group[0];
            if (!label) return '';
            const colors = getReportDeckChartLabelColors(group);
            return colors.length > 1
                ? renderReportDeckChartDualColorValueLabel(label, colors)
                : renderReportDeckChartSingleValueLabel(label);
        }).join('');
    }

    function buildReportDeckAutoChartSvg(chart, options = {}) {
        const width = 640;
        const height = 330;
        const plotLeft = 52;
        const plotRight = 24;
        const plotTop = 76;
        const plotBottom = 38;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const chartKey = String(options.chartKey || '').trim();
        const valueDecimals = Number.isFinite(Number(options.valueDecimals)) ? Math.max(0, Number(options.valueDecimals)) : 0;
        const highlightMonthSet = new Set((Array.isArray(options.highlightMonthKeys) ? options.highlightMonthKeys : [])
            .map(normalizeReportDeckMonth)
            .filter(Boolean));
        const highlightRanges = (Array.isArray(options.highlightRanges) ? options.highlightRanges : [])
            .map(range => Array.isArray(range)
                ? [normalizeReportDeckMonth(range[0]), normalizeReportDeckMonth(range[1])]
                : [normalizeReportDeckMonth(range?.start), normalizeReportDeckMonth(range?.end)])
            .filter(range => range[0] && range[1])
            .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 0.001);
        const minValue = minRaw === maxRaw ? minRaw - pad : minRaw - pad;
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = month => plotLeft + ((Math.max(1, Math.min(12, Number(month) || 1)) - 1) / 11) * plotWidth;
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const monthTicks = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const x = xScale(month);
            return `
                <line class="report-auto-chart-tick" x1="${x.toFixed(2)}" y1="${(plotTop + plotHeight).toFixed(2)}" x2="${x.toFixed(2)}" y2="${(plotTop + plotHeight + 5).toFixed(2)}"></line>
                <text class="report-auto-chart-month" x="${x.toFixed(2)}" y="${height - 10}" text-anchor="middle">${month}월</text>
            `;
        }).join('');
        const legendStart = (width - (series.length * 72)) / 2;
        const legend = series.map((item, index) => {
            const x = legendStart + (index * 72);
            const y = 50;
            return `
                <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3"></line>
                ${buildReportDeckChartMarkerSvg(x + 15, y, item.color, item.marker)}
                <text class="report-auto-chart-legend" x="${x + 38}" y="${y + 5}">${escapeReportDeckSvgText(item.label)}</text>
            `;
        }).join('');
        const rangeRects = highlightRanges.map(range => {
            const startMonth = Number(String(range[0] || '').slice(5, 7));
            const endMonth = Number(String(range[1] || '').slice(5, 7));
            if (!Number.isFinite(startMonth) || !Number.isFinite(endMonth)) return '';
            const fromMonth = Math.min(startMonth, endMonth);
            const toMonth = Math.max(startMonth, endMonth);
            const gap = plotWidth / 11;
            const x = Math.max(plotLeft, xScale(fromMonth) - (gap * 0.45));
            const right = Math.min(plotLeft + plotWidth, xScale(toMonth) + (gap * 0.45));
            return `<rect class="report-chart-highlight-range" x="${x.toFixed(2)}" y="${plotTop.toFixed(2)}" width="${Math.max(1, right - x).toFixed(2)}" height="${plotHeight.toFixed(2)}"></rect>`;
        }).join('');
        const lines = series.map(item => {
            const path = buildReportDeckChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const hitTargets = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = toReportDeckFiniteNumber(point?.value);
                const month = Number(point?.month);
                if (value === null || !Number.isFinite(month)) return '';
                const x = xScale(month);
                const y = yScale(value);
                const monthKey = normalizeReportDeckMonth(point?.monthKey);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 11,
                    text: formatReportDeckChartValue(value),
                    color: item.color,
                    monthKey,
                    highlighted: monthKey ? highlightMonthSet.has(monthKey) : false
                });
                if (chartKey && monthKey) {
                    hitTargets.push(buildReportDeckChartHighlightHitSvg(x, y, chartKey, monthKey, highlightMonthSet.has(monthKey)));
                }
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const placedLabels = placeReportDeckChartValueLabels(labelItems, plotTop, plotTop + plotHeight);
        const labels = renderReportDeckChartValueLabels(placedLabels);
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">데이터 없음</text>`;
        return `
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${legend}
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}"></line>
                ${monthTicks}
                ${rangeRects}
                ${lines}
                ${markers}
                ${labels}
                ${hitTargets.join('')}
                ${emptyText}
            </svg>
        `;
    }

    function formatReportDeckProductionChartValue(value, decimals = 0) {
        const number = toReportDeckFiniteNumber(value);
        return number === null ? '' : formatReportDeckAutoNumber(number, decimals);
    }

    function buildReportDeckProductionChartPath(points, xScale, yScale) {
        let open = false;
        return (Array.isArray(points) ? points : []).reduce((path, point) => {
            const value = toReportDeckFiniteNumber(point?.value);
            const index = Number(point?.index);
            if (value === null || !Number.isFinite(index)) {
                open = false;
                return path;
            }
            const command = open ? 'L' : 'M';
            open = true;
            return `${path}${command}${xScale(index).toFixed(2)},${yScale(value).toFixed(2)} `;
        }, '').trim();
    }

    function buildReportDeckProductionStartChartSvg(chart, options = {}) {
        const width = 640;
        const height = 320;
        const plotLeft = 34;
        const plotRight = 12;
        const plotTop = 24;
        const plotBottom = 52;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const chartKey = String(options.chartKey || '').trim();
        const valueDecimals = Number.isFinite(Number(options.valueDecimals)) ? Math.max(0, Number(options.valueDecimals)) : 0;
        const highlightMonthSet = new Set((Array.isArray(options.highlightMonthKeys) ? options.highlightMonthKeys : [])
            .map(normalizeReportDeckMonth)
            .filter(Boolean));
        const highlightRanges = (Array.isArray(options.highlightRanges) ? options.highlightRanges : [])
            .map(range => Array.isArray(range)
                ? [normalizeReportDeckMonth(range[0]), normalizeReportDeckMonth(range[1])]
                : [normalizeReportDeckMonth(range?.start), normalizeReportDeckMonth(range?.end)])
            .filter(range => range[0] && range[1])
            .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
        const monthKeys = (Array.isArray(chart?.monthKeys) ? chart.monthKeys : [])
            .map(normalizeReportDeckMonth)
            .filter(Boolean);
        const pointCount = Math.max(1, monthKeys.length || 1);
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 1);
        const minValue = Math.max(0, minRaw === maxRaw ? minRaw - pad : minRaw - pad);
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = index => plotLeft + (pointCount === 1 ? 0 : (Math.max(0, Math.min(pointCount - 1, Number(index) || 0)) / (pointCount - 1)) * plotWidth);
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const yTicks = Array.from({ length: 5 }, (_, index) => {
            const ratio = index / 4;
            const value = maxValue - ((maxValue - minValue) * ratio);
            const y = plotTop + (plotHeight * ratio);
            return `
                <line class="report-auto-chart-tick" x1="${plotLeft}" y1="${y.toFixed(2)}" x2="${plotLeft + plotWidth}" y2="${y.toFixed(2)}"></line>
                <text class="report-auto-chart-month" x="${plotLeft - 7}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeReportDeckSvgText(formatReportDeckProductionChartValue(value, valueDecimals))}</text>
            `;
        }).join('');
        const monthTicks = monthKeys.map((monthKey, index) => {
            const x = xScale(index);
            const month = Number(monthKey.slice(5, 7));
            return `
                <line class="report-auto-chart-tick" x1="${x.toFixed(2)}" y1="${(plotTop + plotHeight).toFixed(2)}" x2="${x.toFixed(2)}" y2="${(plotTop + plotHeight + 4).toFixed(2)}"></line>
                <text class="report-auto-chart-month report-production-chart-month" x="${x.toFixed(2)}" y="${height - 36}" text-anchor="middle">${Number.isFinite(month) ? month : ''}</text>
            `;
        }).join('');
        const years = [];
        monthKeys.forEach((monthKey, index) => {
            const year = monthKey.slice(0, 4);
            const existing = years.find(item => item.year === year);
            if (existing) {
                existing.last = index;
            } else {
                years.push({ year, first: index, last: index });
            }
        });
        const yearLabels = years.map(item => {
            const x = (xScale(item.first) + xScale(item.last)) / 2;
            return `<text class="report-auto-chart-month" x="${x.toFixed(2)}" y="${height - 22}" text-anchor="middle">${escapeReportDeckSvgText(item.year)}</text>`;
        }).join('');
        const rangeRects = highlightRanges.map(range => {
            const startIndex = monthKeys.indexOf(range[0]);
            const endIndex = monthKeys.indexOf(range[1]);
            if (startIndex < 0 || endIndex < 0) return '';
            const fromIndex = Math.min(startIndex, endIndex);
            const toIndex = Math.max(startIndex, endIndex);
            const gap = pointCount > 1 ? plotWidth / (pointCount - 1) : plotWidth;
            const x = Math.max(plotLeft, xScale(fromIndex) - (gap * 0.45));
            const right = Math.min(plotLeft + plotWidth, xScale(toIndex) + (gap * 0.45));
            return `<rect class="report-chart-highlight-range" x="${x.toFixed(2)}" y="${plotTop.toFixed(2)}" width="${Math.max(1, right - x).toFixed(2)}" height="${plotHeight.toFixed(2)}"></rect>`;
        }).join('');
        const legendWidth = series.length * 78;
        const legendStart = (width - legendWidth) / 2;
        const legend = series.map((item, index) => {
            const x = legendStart + (index * 78);
            const y = height - 8;
            return `
                <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3"></line>
                ${buildReportDeckChartMarkerSvg(x + 15, y, item.color, item.marker)}
                <text class="report-auto-chart-legend" x="${x + 38}" y="${y + 4}">${escapeReportDeckSvgText(item.label)}</text>
            `;
        }).join('');
        const lines = series.map(item => {
            const path = buildReportDeckProductionChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const hitTargets = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = toReportDeckFiniteNumber(point?.value);
                const index = Number(point?.index);
                if (value === null || !Number.isFinite(index)) return '';
                const x = xScale(index);
                const y = yScale(value);
                const monthKey = normalizeReportDeckMonth(point?.monthKey || monthKeys[index]);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 10,
                    text: formatReportDeckProductionChartValue(value, valueDecimals),
                    color: item.color,
                    monthKey,
                    highlighted: monthKey ? highlightMonthSet.has(monthKey) : false
                });
                if (chartKey && monthKey) {
                    hitTargets.push(buildReportDeckChartHighlightHitSvg(x, y, chartKey, monthKey, highlightMonthSet.has(monthKey)));
                }
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const placedLabels = placeReportDeckChartValueLabels(labelItems, plotTop, plotTop + plotHeight);
        const labels = renderReportDeckChartValueLabels(placedLabels);
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">데이터 없음</text>`;
        return `
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${yTicks}
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}"></line>
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}"></line>
                ${monthTicks}
                ${yearLabels}
                ${rangeRects}
                ${lines}
                ${markers}
                ${labels}
                ${legend}
                ${hitTargets.join('')}
                ${emptyText}
            </svg>
        `;
    }

    function buildReportDeckLpgChartSvg(chart) {
        const width = 640;
        const height = 250;
        const plotLeft = 22;
        const plotRight = 22;
        const plotTop = 54;
        const plotBottom = 16;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 0.001);
        const minValue = minRaw === maxRaw ? minRaw - pad : minRaw - pad;
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = month => plotLeft + ((Math.max(1, Math.min(12, Number(month) || 1)) - 1) / 11) * plotWidth;
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const lines = series.map(item => {
            const path = buildReportDeckChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = toReportDeckFiniteNumber(point?.value);
                const month = Number(point?.month);
                if (value === null || !Number.isFinite(month)) return '';
                const x = xScale(month);
                const y = yScale(value);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 11,
                    text: formatReportDeckChartValue(value),
                    color: item.color
                });
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const labels = renderReportDeckChartValueLabels(placeReportDeckChartValueLabels(labelItems, plotTop, plotTop + plotHeight));
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">?곗씠???놁쓬</text>`;
        return `
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${lines}
                ${markers}
                ${labels}
                ${emptyText}
            </svg>
        `;
    }

    function getReportDeckAutoAnalysisSlides(root) {
        const slides = Array.from(root?.querySelectorAll?.('[data-report-auto-analysis]') || []);
        return slides.length ? slides : [root].filter(Boolean);
    }

    function getReportDeckAutoAnalysisScopeKey(slideRoot = null) {
        const analysisKey = String(slideRoot?.dataset?.reportAutoAnalysis || '').trim();
        return analysisKey === 'yusan-utility' || analysisKey === 'yusan-waste' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckAutoAnalysisType(slideRoot = null) {
        const analysisKey = String(slideRoot?.dataset?.reportAutoAnalysis || '').trim();
        return analysisKey.endsWith('-waste') ? 'waste' : 'utility';
    }

    function renderReportDeckUtilityAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        setReportDeckAutoCellText(root, '[data-report-auto-month-label="reference"]', model.monthLabels?.reference || '');
        setReportDeckAutoCellText(root, '[data-report-auto-month-label="current"]', model.monthLabels?.current || '');
        setReportDeckAutoCellText(root, '[data-report-auto-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'cost'].forEach(rowKey => {
            renderReportDeckAutoMetricRow(root, 'gas', rowKey, model.gas?.rows?.[rowKey]);
            renderReportDeckAutoMetricRow(root, 'electric', rowKey, model.electric?.rows?.[rowKey]);
        });
        [
            ['gas', model.gas?.chart],
            ['electric', model.electric?.chart]
        ].forEach(([chartKey, chart]) => {
            const persistedChartKey = `auto:${String(root?.dataset?.reportAutoAnalysis || model.scopeKey || 'bukjeong-utility').trim() || 'bukjeong-utility'}:${chartKey}`;
            Array.from(root?.querySelectorAll?.(`[data-report-auto-chart-plot="${chartKey}"]`) || []).forEach(plot => {
                plot.innerHTML = buildReportDeckAutoChartSvg(chart || {}, {
                    chartKey: persistedChartKey,
                    highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, persistedChartKey),
                    highlightRanges: getReportDeckChartHighlightRanges(state, persistedChartKey)
                });
            });
        });
    }

    function renderReportDeckBukjeongAnalysis(root, model = {}, state = {}) {
        renderReportDeckUtilityAnalysis(root, model, state);
    }

    function renderReportDeckWasteAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="current"]', model.monthLabels?.current || '');
        setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="reference"]', model.monthLabels?.reference || '');
        setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'water', 'share', 'sludge', 'resin', 'labor', 'total'].forEach(rowKey => {
            renderReportDeckWasteMetricRow(root, rowKey, model.rows?.[rowKey]);
        });
        const persistedChartKey = `auto:${String(root?.dataset?.reportAutoAnalysis || model.scopeKey || 'bukjeong-waste').trim() || 'bukjeong-waste'}:waste`;
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = buildReportDeckAutoChartSvg(model.chart || {}, {
                chartKey: persistedChartKey,
                highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, persistedChartKey),
                highlightRanges: getReportDeckChartHighlightRanges(state, persistedChartKey)
            });
        });
    }

    function renderReportDeckYusanLpgAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="reference"]', model.monthLabels?.reference || '');
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="current"]', model.monthLabels?.current || '');
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="previous"]', model.monthLabels?.previous || '');
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="reference"]', model.monthLabels?.reference || '');
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="current"]', model.monthLabels?.current || '');
        setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'amount'].forEach(rowKey => {
            renderReportDeckYusanLpgMetricRow(root, rowKey, model.rows?.[rowKey]);
        });
        ['0', '1', '2'].forEach(rowKey => {
            renderReportDeckYusanLpgCostMetricRow(root, rowKey, model.costRows?.[rowKey]);
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="unit"]') || []).forEach(plot => {
            const chartKey = 'auto:yusan-lpg:unit';
            plot.innerHTML = buildReportDeckAutoChartSvg(model.chart || {}, {
                chartKey,
                highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                highlightRanges: getReportDeckChartHighlightRanges(state, chartKey)
            });
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="cost"]') || []).forEach(plot => {
            const chartKey = 'auto:yusan-lpg:cost';
            plot.innerHTML = buildReportDeckAutoChartSvg(model.costChart || {}, {
                chartKey,
                highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                highlightRanges: getReportDeckChartHighlightRanges(state, chartKey)
            });
        });
    }

    async function renderReportDeckAutoSlides(root, meta = {}, state = {}) {
        const monthValue = normalizeReportDeckMonth(meta.selectedMonth);
        const autoSlides = getReportDeckAutoAnalysisSlides(root);
        const canBuildUtilityAnalysis = typeof browser?.buildReportDeckUtilityAnalysis === 'function';
        const canBuildBukjeongAnalysis = typeof browser?.buildReportDeckBukjeongAnalysis === 'function';
        const canBuildWasteAnalysis = typeof browser?.buildReportDeckWasteAnalysis === 'function';
        const lpgSlides = Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-analysis]') || []);
        const canBuildYusanLpgAnalysis = typeof browser?.buildReportDeckYusanLpgAnalysis === 'function';
        const productionStartSlides = Array.from(root?.querySelectorAll?.('[data-report-production-start-analysis]') || []);
        const canBuildProductionStartAnalysis = typeof browser?.buildReportDeckProductionStartAnalysis === 'function';
        const productionYieldSlides = Array.from(root?.querySelectorAll?.('[data-report-production-yield-analysis]') || []);
        const canBuildProductionYieldAnalysis = typeof browser?.buildReportDeckProductionYieldAnalysis === 'function';
        if (!monthValue || (!canBuildUtilityAnalysis && !canBuildBukjeongAnalysis && !canBuildWasteAnalysis && !canBuildYusanLpgAnalysis && !canBuildProductionStartAnalysis && !canBuildProductionYieldAnalysis)) {
            clearReportDeckBukjeongAnalysis(root);
            return false;
        }
        meta.autoRenderSequence = (Number(meta.autoRenderSequence) || 0) + 1;
        const renderSequence = meta.autoRenderSequence;
        root.dataset.reportAutoStatus = 'loading';
        try {
            const results = [];
            for (const slideRoot of productionStartSlides) {
                const teamKey = String(slideRoot?.dataset?.reportProductionStartAnalysis || 'team_01').trim() || 'team_01';
                const model = canBuildProductionStartAnalysis
                    ? await browser.buildReportDeckProductionStartAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || [],
                        teamKey
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    renderReportDeckProductionStartAnalysis(slideRoot, model, state);
                }
            }
            for (const slideRoot of productionYieldSlides) {
                const teamKey = String(slideRoot?.dataset?.reportProductionYieldAnalysis || 'team_01').trim() || 'team_01';
                const model = canBuildProductionYieldAnalysis
                    ? await browser.buildReportDeckProductionYieldAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || [],
                        teamKey
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    renderReportDeckProductionYieldAnalysis(slideRoot, model, state);
                }
            }
            for (const slideRoot of autoSlides) {
                const analysisType = getReportDeckAutoAnalysisType(slideRoot);
                const scopeKey = getReportDeckAutoAnalysisScopeKey(slideRoot);
                const model = analysisType === 'waste'
                    ? (canBuildWasteAnalysis
                        ? await browser.buildReportDeckWasteAnalysis(monthValue, {
                            store: meta.sharedStore || null,
                            availableMonths: meta.months || [],
                            scopeKey
                        })
                        : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue })
                    : (canBuildUtilityAnalysis
                        ? await browser.buildReportDeckUtilityAnalysis(monthValue, {
                            store: meta.sharedStore || null,
                            availableMonths: meta.months || [],
                            scopeKey
                        })
                        : (scopeKey === 'bukjeong'
                            ? await browser.buildReportDeckBukjeongAnalysis(monthValue, {
                                store: meta.sharedStore || null,
                                availableMonths: meta.months || []
                            })
                            : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue }));
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    if (analysisType === 'waste') {
                        renderReportDeckWasteAnalysis(slideRoot, model, state);
                    } else {
                        renderReportDeckUtilityAnalysis(slideRoot, model, state);
                    }
                }
            }
            for (const slideRoot of lpgSlides) {
                const model = canBuildYusanLpgAnalysis
                    ? await browser.buildReportDeckYusanLpgAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || []
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    renderReportDeckYusanLpgAnalysis(slideRoot, model, state);
                }
            }
            if (renderSequence !== meta.autoRenderSequence) return false;
            const hasReadyModel = results.some(model => model?.ok);
            root.dataset.reportAutoStatus = hasReadyModel ? 'ready' : 'empty';
            syncReportDeckChartHighlightPointStates(root, state, meta);
            return hasReadyModel;
        } catch (error) {
            if (renderSequence === meta.autoRenderSequence) {
                clearReportDeckBukjeongAnalysis(root);
                root.dataset.reportAutoStatus = 'error';
            }
            return false;
        }
    }

    function setReportDeckEditMode(root, enabled) {
        const isEditing = enabled === true;
        root.dataset.reportEditMode = isEditing ? 'editing' : 'view';
        Array.from(root?.querySelectorAll?.('[data-report-field]') || []).forEach(field => {
            const key = String(field.dataset.reportField || '');
            const editable = isEditing
                && !isReportDeckLockedFieldKey(key)
                && !isReportDeckSlide8OverviewKey(key)
                && !isReportDeckSlide9OverviewKey(key);
            field.setAttribute?.('contenteditable', editable ? 'true' : 'false');
            field.contentEditable = editable ? 'true' : 'false';
            if (!editable) {
                field.blur?.();
            }
        });
        Array.from(root?.querySelectorAll?.('[data-report-plan-summary]') || []).forEach(field => {
            const editable = false;
            field.setAttribute?.('contenteditable', editable ? 'true' : 'false');
            field.contentEditable = editable ? 'true' : 'false';
            if (!editable) {
                field.blur?.();
            }
        });
        if (!isEditing) {
            closeReportDeckOverviewDialog(root);
            closeReportDeckMemoDialog(root);
        }
        Array.from(root?.querySelectorAll?.('[data-report-memo-key]') || []).forEach(box => {
            box.setAttribute?.('aria-disabled', isEditing ? 'false' : 'true');
            box.setAttribute?.('tabindex', isEditing ? '0' : '-1');
        });
        Array.from(root?.querySelectorAll?.('[data-report-date-input]') || []).forEach(input => {
            input.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-plan-add-slot]') || []).forEach(input => {
            input.disabled = !isEditing;
        });
        syncReportDeckPlanImageModeHints(root);
        if (!isEditing) {
            setReportDeckActivePlanImageFrame(root, null);
        }
        Array.from(root?.querySelectorAll?.('[data-report-edit-toggle]') || []).forEach(button => {
            button.classList?.toggle?.('is-active', isEditing);
            button.setAttribute?.('aria-pressed', isEditing ? 'true' : 'false');
            button.textContent = isEditing ? '완료' : '수정';
        });
    }

    function isReportDeckSaveShortcut(event) {
        const key = String(event?.key || '').toLowerCase();
        const code = String(event?.code || '');
        return (key === 's' || code === 'KeyS')
            && (event?.ctrlKey || event?.metaKey)
            && !event?.altKey
            && !event?.shiftKey;
    }

    function getReportDeckSlideView(slide) {
        return String(slide?.dataset?.reportSlideView || '').trim();
    }

    function hasReportDeckViewMetadata(root) {
        return Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .some(slide => !!getReportDeckSlideView(slide));
    }

    function normalizeReportDeckView(root, view) {
        const candidate = String(view || '').trim() || REPORT_DECK_DEFAULT_VIEW;
        if (!hasReportDeckViewMetadata(root)) return candidate;
        const hasCandidate = Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .some(slide => slide.hidden !== true && getReportDeckSlideView(slide) === candidate);
        return hasCandidate ? candidate : REPORT_DECK_DEFAULT_VIEW;
    }

    function getReportDeckActiveView(root) {
        return normalizeReportDeckView(root, root?.dataset?.reportActiveView);
    }

    function isReportDeckSlideInView(root, slide, view = getReportDeckActiveView(root)) {
        if (!hasReportDeckViewMetadata(root)) return true;
        return getReportDeckSlideView(slide) === view;
    }

    function getReportDeckVisibleSlides(root, view = getReportDeckActiveView(root)) {
        return Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .filter(slide => slide.hidden !== true && String(slide.dataset.reportSlidePage || '') !== '-1')
            .filter(slide => isReportDeckSlideInView(root, slide, view));
    }

    function getReportDeckSlideCount(root) {
        return getReportDeckVisibleSlides(root).length;
    }

    function getReportDeckSlideLabel(slide, visibleIndex, button = null) {
        const label = String(slide?.dataset?.reportSlideLabel || '').trim();
        if (label) return label;
        const titleField = slide?.querySelector?.('[data-report-field$="Title"]');
        const titleLabel = String(titleField?.textContent || '').trim();
        if (titleLabel) return titleLabel;
        const navLabel = String(button?.dataset?.reportNavLabel || '').trim();
        if (navLabel) return navLabel;
        return `${visibleIndex + 1}`;
    }

    function formatReportDeckPageRange(startPage, endPage) {
        if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) return '';
        return startPage === endPage ? String(startPage) : `${startPage}-${endPage}`;
    }

    function syncReportDeckContentsPageRanges(root, visibleSlides = []) {
        const ranges = new Map();
        visibleSlides.forEach((slide, index) => {
            const view = getReportDeckSlideView(slide);
            if (!view || view === REPORT_DECK_DEFAULT_VIEW) return;
            const page = index + 1;
            const range = ranges.get(view) || { start: page, end: page };
            range.end = page;
            ranges.set(view, range);
        });

        Array.from(root?.querySelectorAll?.('[data-report-contents-page-range]') || []).forEach(element => {
            const view = String(element?.dataset?.reportContentsPageRange || '').trim();
            const range = ranges.get(view);
            const label = range ? formatReportDeckPageRange(range.start, range.end) : '';
            element.textContent = label;
        });
    }

    function syncReportDeckReturnControls(root, activeView) {
        Array.from(root?.querySelectorAll?.('[data-report-return-hq]') || []).forEach(button => {
            button.hidden = !activeView || activeView === REPORT_DECK_DEFAULT_VIEW;
        });
    }

    function syncReportDeckDynamicSlides(root) {
        const slides = Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []);
        const visibleSlides = slides.filter(slide => slide.hidden !== true);
        visibleSlides.forEach((slide, index) => {
            slide.dataset.reportSlidePage = String(index);
        });
        slides.filter(slide => slide.hidden === true).forEach(slide => {
            slide.dataset.reportSlidePage = '-1';
            slide.dataset.reportSlideViewPage = '-1';
            slide.classList?.toggle?.('is-active', false);
            slide.setAttribute?.('aria-hidden', 'true');
        });
        syncReportDeckContentsPageRanges(root, visibleSlides);

        const hasViewMetadata = hasReportDeckViewMetadata(root);
        if (hasViewMetadata) {
            Array.from(new Set(visibleSlides.map(getReportDeckSlideView).filter(Boolean))).forEach(view => {
                const viewSlides = visibleSlides.filter(slide => getReportDeckSlideView(slide) === view);
                viewSlides.forEach((slide, index) => {
                    slide.dataset.reportSlideViewPage = String(index);
                    const pageNumber = slide.querySelector?.('[data-report-page-number]');
                    if (pageNumber) {
                        pageNumber.textContent = `${index + 1}/${viewSlides.length}`;
                    }
                });
            });
        } else {
            visibleSlides.forEach((slide, index) => {
                slide.dataset.reportSlideViewPage = String(index);
                const pageNumber = slide.querySelector?.('[data-report-page-number]');
                if (pageNumber) {
                    pageNumber.textContent = `${index + 1}/${visibleSlides.length}`;
                }
            });
        }

        const buttons = Array.from(root?.querySelectorAll?.('[data-report-slide-target]') || []);
        const activeView = getReportDeckActiveView(root);
        root.dataset.reportActiveView = activeView;
        syncReportDeckReturnControls(root, activeView);
        const activeSlides = getReportDeckVisibleSlides(root, activeView);
        buttons.forEach((button, index) => {
            const slide = activeSlides[index] || null;
            button.hidden = !slide;
            button.dataset.reportSlideTarget = slide ? String(index) : '-1';
            button.dataset.reportSlideView = activeView;
            if (!slide) {
                button.classList?.toggle?.('is-active', false);
                button.setAttribute?.('aria-current', 'false');
                return;
            }
            const number = button.querySelector?.('span');
            const label = button.querySelector?.('strong');
            if (number) number.textContent = String(index + 1).padStart(2, '0');
            if (label) label.textContent = getReportDeckSlideLabel(slide, index, button);
        });

        const current = Number.parseInt(String(root?.dataset?.reportActiveSlide || '0'), 10) || 0;
        setReportDeckSlide(root, Math.min(current, Math.max(0, activeSlides.length - 1)));
    }

    function setReportDeckSlide(root, slideIndex) {
        const slideCount = getReportDeckSlideCount(root);
        if (!slideCount) return;
        const nextIndex = Math.max(0, Math.min(slideCount - 1, Number.parseInt(String(slideIndex), 10) || 0));
        const activeView = getReportDeckActiveView(root);
        root.dataset.reportActiveView = activeView;
        root.dataset.reportActiveSlide = String(nextIndex);

        Array.from(root.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            const slidePage = Number.parseInt(String(slide.dataset.reportSlideViewPage || slide.dataset.reportSlidePage || '0'), 10);
            const active = slide.hidden !== true
                && isReportDeckSlideInView(root, slide, activeView)
                && slidePage === nextIndex;
            slide.classList?.toggle?.('is-active', active);
            slide.setAttribute?.('aria-hidden', active ? 'false' : 'true');
        });

        Array.from(root.querySelectorAll?.('[data-report-slide-target]') || []).forEach(button => {
            const buttonView = String(button.dataset.reportSlideView || activeView).trim() || activeView;
            const active = button.hidden !== true
                && buttonView === activeView
                && Number.parseInt(String(button.dataset.reportSlideTarget || '0'), 10) === nextIndex;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-current', active ? 'page' : 'false');
        });

        const counter = root.querySelector?.('[data-report-slide-counter]');
        if (counter) {
            counter.textContent = `${nextIndex + 1} / ${slideCount}`;
        }
    }

    function setReportDeckView(root, view, slideIndex = 0) {
        root.dataset.reportActiveView = normalizeReportDeckView(root, view);
        root.dataset.reportActiveSlide = String(Number.parseInt(String(slideIndex), 10) || 0);
        syncReportDeckDynamicSlides(root);
        setReportDeckSlide(root, slideIndex);
    }

    function moveReportDeckSlide(root, direction) {
        const slideCount = getReportDeckSlideCount(root);
        if (!slideCount) return;
        const current = Number.parseInt(String(root.dataset.reportActiveSlide || '0'), 10) || 0;
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        if (fullscreenElement && direction > 0 && current >= slideCount - 1) {
            setReportDeckSlide(root, 0);
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            return;
        }
        const next = (current + direction + slideCount) % slideCount;
        setReportDeckSlide(root, next);
    }

    function toggleReportDeckFullscreen(root) {
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        if (fullscreenElement) {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            return;
        }
        const request = root?.requestFullscreen || root?.webkitRequestFullscreen;
        const result = request?.call?.(root);
        result?.catch?.(() => {});
        const stage = root?.querySelector?.('[data-report-stage]');
        stage?.focus?.();
    }

    function prepareReportDeckPdfPrint(root) {
        syncReportDeckDynamicSlides(root);
        const activeView = getReportDeckActiveView(root);
        const printSlides = activeView === REPORT_DECK_DEFAULT_VIEW
            ? Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
                .filter(slide => slide.hidden !== true && String(slide.dataset.reportSlidePage || '') !== '-1')
            : getReportDeckVisibleSlides(root, activeView);
        const printSlideSet = new Set(printSlides);
        const lastPrintSlide = printSlides[printSlides.length - 1] || null;
        root.dataset.reportPrintMode = 'true';
        root.dataset.reportPrintView = activeView === REPORT_DECK_DEFAULT_VIEW ? 'all' : activeView;
        Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            const printable = printSlideSet.has(slide);
            slide.dataset.reportPrintVisible = printable ? 'true' : 'false';
            if (printable && slide === lastPrintSlide) {
                slide.dataset.reportPrintLast = 'true';
            } else {
                delete slide.dataset.reportPrintLast;
            }
        });
        return printSlides.length;
    }

    function printReportDeckPdf(root) {
        if (typeof browser?.printReportDeckPdf !== 'function') {
            setReportDeckStatus(root, 'error', 'PDF 인쇄 불가');
            return false;
        }
        const printCount = prepareReportDeckPdfPrint(root);
        if (printCount <= 0) {
            setReportDeckStatus(root, 'error', '인쇄할 슬라이드 없음');
            return false;
        }
        try {
            browser.printReportDeckPdf(root);
            setReportDeckStatus(root, 'idle', '');
            return true;
        } catch (error) {
            void error;
            setReportDeckStatus(root, 'error', 'PDF 인쇄 실패');
            return false;
        }
    }

    function buildReportDeckExportDateToken(state = {}, meta = {}) {
        const normalizedDate = normalizeReportDeckDate(state.reportDate);
        if (normalizedDate) return normalizedDate.replace(/\./g, '');
        const selectedMonth = normalizeReportDeckMonth(meta.selectedMonth);
        if (selectedMonth) return selectedMonth.replace('-', '');
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }

    function buildReportDeckExportFileName(state = {}, meta = {}) {
        return `공무환경팀 실적보고서 ${buildReportDeckExportDateToken(state, meta)}.html`;
    }

    async function exportReportDeckSingleHtml(root, state, meta) {
        if (typeof browser?.exportReportDeckSingleHtml !== 'function') {
            setReportDeckStatus(root, 'error', 'HTML 추출 불가');
            return false;
        }
        setReportDeckStatus(root, 'saving', 'HTML 추출 중');
        try {
            await browser.exportReportDeckSingleHtml(root, {
                filename: buildReportDeckExportFileName(state, meta),
                title: '공무환경팀 실적보고서'
            });
            setReportDeckStatus(root, 'saved', 'HTML 추출 완료');
            return true;
        } catch (error) {
            void error;
            setReportDeckStatus(root, 'error', 'HTML 추출 실패');
            return false;
        }
    }

    function applyReportDeckState(root, state, meta) {
        applyReportDeckDerivedFields(state, meta);
        syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        syncReportDeckMemoControls(root, state);
        syncReportDeckChartHighlightControls(root, state, meta);
        syncReportDeckChartHighlightPointStates(root, state, meta);
        syncReportDeckJson(root, state, meta);
    }

    function resetReportDeckStateForMonth(root, state, meta) {
        const nextState = createReportDeckStateForMonth(meta.selectedMonth);
        Object.keys(nextState).forEach(key => {
            state[key] = nextState[key];
        });
        Object.assign(meta, { version: null, updatedAt: '', dirty: false, highlightChartKey: '', highlightChartMode: 'point', highlightRangeChartKey: '', highlightRangeStartMonth: '' });
        clearReportDeckMemoCaches(meta);
        applyReportDeckState(root, state, meta);
    }

    async function loadReportDeckStateFromServer(root, state, meta) {
        const config = getReportDeckRuntimeConfig();
        if (!meta.recordKey) {
            setReportDeckStatus(root, 'offline', '월을 선택해 주세요');
            return false;
        }
        if (config.enabled === false || config.readEnabled === false || typeof browser?.fetchReportDeckCover !== 'function') {
            setReportDeckStatus(root, 'offline', '서버 연결 없음');
            return false;
        }

        meta.loadSequence += 1;
        const loadSequence = meta.loadSequence;
        setReportDeckStatus(root, 'loading', '불러오는 중');
        try {
            const result = await browser.fetchReportDeckCover({ recordKey: meta.recordKey });
            if (loadSequence !== meta.loadSequence) return false;
            const record = result?.record || null;
            if (record?.payload) {
                Object.assign(state, normalizeReportDeckState({
                    ...createReportDeckStateForMonth(meta.selectedMonth),
                    ...record.payload
                }));
                Object.assign(meta, getReportDeckRecordMeta(record));
                meta.dirty = false;
                applyReportDeckState(root, state, meta);
                setReportDeckStatus(root, 'idle', '');
                return true;
            }
            Object.assign(meta, { version: null, updatedAt: '' });
            meta.dirty = false;
            resetReportDeckStateForMonth(root, state, meta);
            setReportDeckStatus(root, 'idle', '');
            return true;
        } catch (error) {
            if (loadSequence === meta.loadSequence) {
                setReportDeckStatus(root, 'error', '불러오기 실패');
            }
            return false;
        }
    }

    async function saveReportDeckStateToServer(root, state, meta, saveSequence, options = {}) {
        const config = getReportDeckRuntimeConfig();
        if (!meta.recordKey) {
            setReportDeckStatus(root, 'offline', '월을 선택해 주세요');
            return false;
        }
        if (config.enabled === false || config.writeEnabled === false || typeof browser?.saveReportDeckCover !== 'function') {
            setReportDeckStatus(root, 'readonly', '서버 쓰기 권한 없음');
            return false;
        }

        setReportDeckStatus(root, 'saving', '저장 중');
        try {
            await externalizeReportDeckInlineImages(root, state, meta);
            applyReportDeckDerivedFields(state, meta);
            const result = await browser.saveReportDeckCover(normalizeReportDeckState(state), { recordKey: meta.recordKey });
            if (saveSequence !== meta.saveSequence) return false;
            if (result?.record) {
                Object.assign(meta, getReportDeckRecordMeta(result.record));
            }
            meta.dirty = false;
            syncReportDeckJson(root, state, meta);
            setReportDeckStatus(root, 'saved', options.showSavedMessage === false ? '' : '저장 완료');
            return true;
        } catch (error) {
            if (saveSequence === meta.saveSequence) {
                setReportDeckStatus(root, 'error', getReportDeckSaveErrorText(error));
            }
            return false;
        }
    }

    function markReportDeckDirty(root, state, meta) {
        meta.dirty = true;
        syncReportDeckJson(root, state, meta);
        setReportDeckStatus(root, 'dirty', '저장 필요');
    }

    function readReportDeckImageFile(file, meta = {}, fieldKey = '') {
        if (typeof browser?.uploadReportDeckImage === 'function') {
            return browser.uploadReportDeckImage(file, {
                recordKey: meta.recordKey,
                fieldKey,
                originalName: file?.name || `${fieldKey || 'image'}.png`,
                mimeType: file?.type || ''
            });
        }
        return new Promise((resolve, reject) => {
            if (!file || typeof FileReader !== 'function') {
                reject(new Error('report_deck_image_reader_unavailable'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('report_deck_image_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    async function updateReportDeckPlanImageFile(root, state, meta, key, file, input = null, options = {}) {
        if (
            !key
            || !Object.prototype.hasOwnProperty.call(state, key)
            || hasReportDeckPlanImageValue(state, key)
            || !isReportDeckImageFile(file)
        ) {
            if (input) input.value = '';
            if (key && hasReportDeckPlanImageValue(state, key)) {
                setReportDeckStatus(root, 'dirty', '이미지는 삭제 후 다시 등록하세요');
            }
            return false;
        }
        try {
            const imageData = await readReportDeckImageFile(file, meta, key);
            if (!imageData) return false;
            state[key] = imageData;
            const sourceKey = getReportDeckPlanImageSourceKey(key);
            const sourceValue = normalizeReportDeckPlanImageSource(options.source);
            if (sourceKey && sourceValue) {
                state[sourceKey] = sourceValue;
            }
            syncReportDeckPlanControls(root, state);
            markReportDeckDirty(root, state, meta);
            if (input) input.value = '';
            if (options.saveImmediately === true) {
                meta.saveSequence += 1;
                await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
                    showSavedMessage: true
                });
            }
            return true;
        } catch (error) {
            setReportDeckStatus(root, 'error', getReportDeckImageErrorText(error));
            return false;
        }
    }

    async function updateReportDeckPlanImage(root, state, meta, input) {
        const key = String(input?.dataset?.reportPlanImageKey || '').trim();
        const file = input?.files?.[0] || null;
        const frame = getReportDeckPlanImageFrameFromTarget(input);
        const isEditing = root?.dataset?.reportEditMode === 'editing';
        const canAttach = canUseReportDeckPlanImageAttachment(root, frame);
        if (!canAttach) return false;
        return updateReportDeckPlanImageFile(root, state, meta, key, file, input, {
            source: 'upload',
            saveImmediately: !isEditing
        });
    }

    async function pasteReportDeckPlanImage(root, state, meta, event) {
        const file = getReportDeckClipboardImageFile(event);
        if (!file) return false;
        const targetFrame = getReportDeckPlanImageFrameFromTarget(event?.target);
        const targetKey = getReportDeckPlanImageKeyFromFrame(targetFrame);
        const activeKey = getReportDeckPlanImageKeyFromFrame(root.__reportDeckActivePlanImageFrame);
        if (
            (isReportDeckUsablePlanImageFrame(targetFrame, state) && hasReportDeckPlanImageValue(state, targetKey))
            || (!targetFrame && isReportDeckUsablePlanImageFrame(root.__reportDeckActivePlanImageFrame, state) && hasReportDeckPlanImageValue(state, activeKey))
        ) {
            event?.preventDefault?.();
            setReportDeckStatus(root, 'dirty', '이미지는 삭제 후 다시 등록하세요');
            return false;
        }
        const frame = resolveReportDeckPasteImageFrame(root, state, event?.target);
        const key = getReportDeckPlanImageKeyFromFrame(frame);
        if (!key) return false;
        event?.preventDefault?.();
        setReportDeckActivePlanImageFrame(root, frame);
        frame?.focus?.();
        return updateReportDeckPlanImageFile(root, state, meta, key, file, null, {
            source: 'paste'
        });
    }

    async function completeReportDeckEdit(root, state, meta) {
        if (root?.dataset?.reportEditMode !== 'editing') return false;
        if (meta.dirty !== true) {
            meta.dirty = false;
            syncReportDeckJson(root, state, meta);
            setReportDeckStatus(root, 'saved', '저장 완료');
            meta.highlightChartKey = '';
            meta.highlightChartMode = 'point';
            meta.highlightRangeChartKey = '';
            meta.highlightRangeStartMonth = '';
            syncReportDeckChartHighlightControls(root, state, meta);
            setReportDeckEditMode(root, false);
            return true;
        }
        meta.saveSequence += 1;
        const saved = await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
            showSavedMessage: true
        });
        if (saved) {
            meta.highlightChartKey = '';
            meta.highlightChartMode = 'point';
            meta.highlightRangeChartKey = '';
            meta.highlightRangeStartMonth = '';
            syncReportDeckChartHighlightControls(root, state, meta);
            setReportDeckEditMode(root, false);
        }
        return saved;
    }

    async function selectReportDeckMonth(root, state, meta, monthValue) {
        const nextMonth = normalizeReportDeckMonth(monthValue);
        if (!nextMonth || nextMonth === meta.selectedMonth) {
            syncReportDeckMonthSelect(root, meta);
            return;
        }
        if (!Array.isArray(meta.months) || !meta.months.includes(nextMonth)) {
            syncReportDeckMonthSelect(root, meta);
            return;
        }
        if (meta.dirty === true) {
            meta.saveSequence += 1;
            const saved = await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
                showSavedMessage: false
            });
            if (!saved) {
                syncReportDeckMonthSelect(root, meta);
                return;
            }
        }
        meta.selectedMonth = nextMonth;
        meta.recordKey = buildReportDeckMonthRecordKey(nextMonth);
        syncReportDeckMonthSelect(root, meta);
        setReportDeckEditMode(root, false);
        resetReportDeckStateForMonth(root, state, meta);
        await loadReportDeckStateFromServer(root, state, meta);
        void renderReportDeckAutoSlides(root, meta, state);
    }

    async function loadReportDeckMonthOptions(root, state, meta) {
        meta.monthPlaceholder = '월 확인 중';
        syncReportDeckMonthSelect(root, meta);
        if (typeof browser?.fetchMeteringSharedStore !== 'function') {
            meta.monthPlaceholder = '선택 가능 월 없음';
            syncReportDeckMonthSelect(root, meta);
            setReportDeckStatus(root, 'offline', '정산 월 확인 불가');
            return false;
        }
        setReportDeckStatus(root, 'loading', '월 확인 중');
        try {
            const result = await browser.fetchMeteringSharedStore();
            meta.sharedStore = result?.store || null;
            const months = buildReportDeckOpenMonthsUntilCurrent();
            const settledMonths = buildReportDeckSettledMonthsFromStore(result?.store || {});
            meta.months = months;
            meta.monthPlaceholder = months.length ? '' : '선택 가능 월 없음';
            meta.selectedMonth = months.includes(meta.selectedMonth)
                ? meta.selectedMonth
                : (settledMonths.find(month => months.includes(month)) || months[0] || '');
            meta.recordKey = meta.selectedMonth ? buildReportDeckMonthRecordKey(meta.selectedMonth) : '';
            syncReportDeckMonthSelect(root, meta);
            if (!meta.selectedMonth) {
                clearReportDeckBukjeongAnalysis(root);
                setReportDeckStatus(root, 'idle', '');
                return false;
            }
            resetReportDeckStateForMonth(root, state, meta);
            const loaded = await loadReportDeckStateFromServer(root, state, meta);
            void renderReportDeckAutoSlides(root, meta, state);
            return loaded;
        } catch (error) {
            meta.months = [];
            meta.selectedMonth = '';
            meta.recordKey = '';
            meta.sharedStore = null;
            meta.monthPlaceholder = '월 목록 불러오기 실패';
            syncReportDeckMonthSelect(root, meta);
            setReportDeckStatus(root, 'error', '월 목록 불러오기 실패');
            return false;
        }
    }

    function initReportDeckEditor(container) {
        const root = container?.querySelector?.('[data-report-deck-editor]');
        if (!root || root.dataset.bound === 'true') return;
        root.dataset.bound = 'true';
        const state = normalizeReportDeckState();
        const meta = {
            version: null,
            updatedAt: '',
            saveSequence: 0,
            loadSequence: 0,
            dirty: false,
            selectedMonth: '',
            recordKey: '',
            months: [],
            sharedStore: null,
            autoRenderSequence: 0,
            highlightChartKey: '',
            highlightChartMode: 'point',
            highlightRangeChartKey: '',
            highlightRangeStartMonth: '',
            memoCandidateCache: new Map(),
            memoOverviewCache: new Map(),
            monthPlaceholder: '월 확인 중'
        };
        syncReportDeckMonthSelect(root, meta);
        applyReportDeckState(root, state, meta);
        setReportDeckStatus(root, 'loading', '불러오는 중');
        setReportDeckEditMode(root, false);
        setReportDeckSlide(root, 0);
        void loadReportDeckMonthOptions(root, state, meta);

        root.addEventListener?.('click', event => {
            const editButton = event.target?.closest?.('[data-report-edit-toggle]');
            if (editButton) {
                event.preventDefault();
                if (root.dataset.reportEditMode === 'editing') {
                    void completeReportDeckEdit(root, state, meta);
                } else {
                    setReportDeckEditMode(root, true);
                    setReportDeckStatus(root, meta.dirty ? 'dirty' : 'idle', meta.dirty ? '저장 필요' : '');
                }
                return;
            }

            const chartHighlightButton = event.target?.closest?.('[data-report-chart-highlight-toggle]');
            if (chartHighlightButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightButton.dataset.reportChartHighlightKey || '').trim();
                const mode = normalizeReportDeckChartHighlightMode(chartHighlightButton.dataset.reportChartHighlightMode);
                const isSameTarget = meta.highlightChartKey === chartKey && normalizeReportDeckChartHighlightMode(meta.highlightChartMode) === mode;
                meta.highlightChartKey = isSameTarget ? '' : chartKey;
                meta.highlightChartMode = isSameTarget ? 'point' : mode;
                meta.highlightRangeChartKey = '';
                meta.highlightRangeStartMonth = '';
                syncReportDeckChartHighlightControls(root, state, meta);
                syncReportDeckChartHighlightPointStates(root, state, meta);
                return;
            }

            const chartHighlightResetButton = event.target?.closest?.('[data-report-chart-highlight-reset]');
            if (chartHighlightResetButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightResetButton.dataset.reportChartHighlightKey || '').trim();
                if (chartKey) {
                    const changed = clearReportDeckChartHighlights(state, chartKey);
                    meta.highlightChartKey = '';
                    meta.highlightChartMode = 'point';
                    meta.highlightRangeChartKey = '';
                    meta.highlightRangeStartMonth = '';
                    if (changed) {
                        markReportDeckDirty(root, state, meta);
                    }
                    syncReportDeckChartHighlightControls(root, state, meta);
                    syncReportDeckChartHighlightPointStates(root, state, meta);
                    void renderReportDeckAutoSlides(root, meta, state);
                }
                return;
            }

            const chartHighlightPoint = event.target?.closest?.('[data-report-chart-highlight-point]');
            if (chartHighlightPoint && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightPoint.dataset.reportChartHighlightKey || '').trim();
                const monthKey = normalizeReportDeckMonth(chartHighlightPoint.dataset.reportChartHighlightMonth);
                if (chartKey && monthKey && chartKey === String(meta.highlightChartKey || '').trim()) {
                    if (normalizeReportDeckChartHighlightMode(meta.highlightChartMode) === 'range') {
                        const startMonth = normalizeReportDeckMonth(meta.highlightRangeStartMonth);
                        if (!startMonth || String(meta.highlightRangeChartKey || '').trim() !== chartKey) {
                            meta.highlightRangeChartKey = chartKey;
                            meta.highlightRangeStartMonth = monthKey;
                            syncReportDeckChartHighlightPointStates(root, state, meta);
                        } else {
                            toggleReportDeckChartHighlightRange(state, chartKey, startMonth, monthKey);
                            meta.highlightRangeChartKey = '';
                            meta.highlightRangeStartMonth = '';
                            markReportDeckDirty(root, state, meta);
                            syncReportDeckChartHighlightControls(root, state, meta);
                            syncReportDeckChartHighlightPointStates(root, state, meta);
                            void renderReportDeckAutoSlides(root, meta, state);
                        }
                    } else {
                        toggleReportDeckChartHighlightMonth(state, chartKey, monthKey);
                        markReportDeckDirty(root, state, meta);
                        syncReportDeckChartHighlightControls(root, state, meta);
                        syncReportDeckChartHighlightPointStates(root, state, meta);
                        void renderReportDeckAutoSlides(root, meta, state);
                    }
                }
                return;
            }

            const memoOverviewButton = event.target?.closest?.('[data-report-memo-overview-toggle]');
            if (memoOverviewButton) {
                event.preventDefault();
                void openReportDeckMemoOverviewDialog(root, meta);
                return;
            }

            const memoOverviewCloseButton = event.target?.closest?.('[data-report-memo-overview-close]');
            if (memoOverviewCloseButton) {
                event.preventDefault();
                closeReportDeckMemoOverviewDialog(root);
                return;
            }

            const memoOverviewBackdrop = event.target?.closest?.('[data-report-memo-overview-dialog]');
            if (memoOverviewBackdrop && event.target === memoOverviewBackdrop) {
                event.preventDefault();
                closeReportDeckMemoOverviewDialog(root);
                return;
            }

            const memoCloseButton = event.target?.closest?.('[data-report-memo-close]');
            if (memoCloseButton) {
                event.preventDefault();
                closeReportDeckMemoDialog(root);
                return;
            }

            const memoClearButton = event.target?.closest?.('[data-report-memo-clear]');
            if (memoClearButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = getReportDeckMemoDialog(root);
                const key = getReportDeckMemoDialogTargetKey(dialog);
                if (key && Object.prototype.hasOwnProperty.call(state, key)) {
                    setReportDeckMemoLines(root, state, meta, dialog, key, []);
                }
                return;
            }

            const memoLineDeleteButton = event.target?.closest?.('[data-report-memo-delete-line]');
            if (memoLineDeleteButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = getReportDeckMemoDialog(root);
                const key = String(memoLineDeleteButton.dataset.reportMemoDeleteKey || dialog?.dataset?.reportMemoTarget || '').trim();
                const index = Number.parseInt(String(memoLineDeleteButton.dataset.reportMemoDeleteLine || ''), 10);
                if (key && Number.isInteger(index) && Object.prototype.hasOwnProperty.call(state, key)) {
                    const lines = getReportDeckMemoLines(state[key]);
                    if (index >= 0 && index < lines.length) {
                        lines.splice(index, 1);
                        setReportDeckMemoLines(root, state, meta, dialog, key, lines);
                    }
                }
                return;
            }

            const memoAddButton = event.target?.closest?.('[data-report-memo-add-key]');
            if (memoAddButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const key = String(memoAddButton.dataset.reportMemoAddKey || '').trim();
                const memoTarget = key
                    ? root.querySelector?.(`[data-report-memo-key="${key}"]`)
                    : memoAddButton.closest?.('[data-report-memo-key]');
                if (memoTarget) {
                    openReportDeckMemoDialog(root, state, meta, memoTarget);
                }
                return;
            }

            const memoManualAddButton = event.target?.closest?.('[data-report-memo-manual-add]');
            if (memoManualAddButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = getReportDeckMemoDialog(root);
                const key = getReportDeckMemoDialogTargetKey(dialog);
                const input = dialog?.querySelector?.('[data-report-memo-manual-input]');
                const addedLines = getReportDeckMemoLines(input?.value || '');
                if (key && addedLines.length && appendReportDeckMemoLines(root, state, meta, dialog, key, addedLines)) {
                    clearReportDeckMemoManualInput(dialog);
                }
                return;
            }

            const memoCandidateButton = event.target?.closest?.('[data-report-memo-candidate]');
            if (memoCandidateButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = getReportDeckMemoDialog(root);
                const key = getReportDeckMemoDialogTargetKey(dialog);
                const index = Number.parseInt(String(memoCandidateButton.dataset.reportMemoCandidate || ''), 10);
                const candidate = Array.isArray(dialog?.__reportMemoCandidates) ? dialog.__reportMemoCandidates[index] : null;
                if (key && candidate?.text && Object.prototype.hasOwnProperty.call(state, key)) {
                    appendReportDeckMemoLines(root, state, meta, dialog, key, [candidate.text]);
                }
                return;
            }

            const memoTarget = event.target?.closest?.('[data-report-memo-key]');
            if (memoTarget && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                openReportDeckMemoDialog(root, state, meta, memoTarget);
                return;
            }

            const overviewSaveButton = event.target?.closest?.('[data-report-overview-save]');
            if (overviewSaveButton) {
                event.preventDefault();
                saveReportDeckOverviewDialog(root, state, meta);
                return;
            }

            const overviewCancelButton = event.target?.closest?.('[data-report-overview-cancel]');
            if (overviewCancelButton) {
                event.preventDefault();
                closeReportDeckOverviewDialog(root);
                return;
            }

            const overviewKindButton = event.target?.closest?.('[data-report-overview-kind-option]');
            if (overviewKindButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = getReportDeckOverviewDialog(root);
                if (dialog) {
                    setReportDeckOverviewKindControls(dialog, overviewKindButton.dataset.reportOverviewKindOption);
                }
                return;
            }

            const addSlotButton = event.target?.closest?.('[data-report-plan-add-slot]');
            if (addSlotButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                addReportDeckPlanSlot(root, state, meta, addSlotButton.dataset.reportPlanAddSlot);
                return;
            }

            const deleteSlotButton = event.target?.closest?.('[data-report-plan-delete-slot]');
            if (deleteSlotButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const sourceSlot = deleteSlotButton.dataset.reportPlanSourceSlot
                    || deleteSlotButton.closest?.('[data-report-plan-slot]')?.dataset.reportPlanSourceSlot
                    || deleteSlotButton.dataset.reportPlanLocalSlot;
                deleteReportDeckPlanSlot(root, state, meta, deleteSlotButton.dataset.reportPlanDeleteSlot, sourceSlot);
                return;
            }

            const overviewTarget = event.target?.closest?.('[data-report-slide8-overview]');
            if (overviewTarget && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                openReportDeckOverviewDialog(root, state, overviewTarget.dataset.reportSlide8Overview);
                return;
            }

            const planSummaryTarget = event.target?.closest?.('[data-report-plan-summary]');
            if (planSummaryTarget && root.dataset.reportEditMode === 'editing') {
                const slideKey = String(planSummaryTarget.dataset.reportPlanSummary || '').trim();
                if (slideKey === 'slide9') {
                    event.preventDefault();
                    openReportDeckOverviewDialog(root, state, planSummaryTarget.dataset.reportPlanSourceSlot, 'slide9');
                    return;
                }
            }

            const imageClearButton = event.target?.closest?.('[data-report-plan-image-clear]');
            if (imageClearButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const key = String(imageClearButton.dataset.reportPlanImageClear || '').trim();
                if (key && Object.prototype.hasOwnProperty.call(state, key)) {
                    state[key] = '';
                    syncReportDeckPlanControls(root, state);
                    markReportDeckDirty(root, state, meta);
                }
                return;
            }

            const imagePasteButton = event.target?.closest?.('[data-report-plan-image-paste]');
            if (imagePasteButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                if (imagePasteButton.disabled) return;
                const imageFrame = getReportDeckPlanImageFrameFromTarget(imagePasteButton);
                if (imageFrame && canUseReportDeckPlanImagePaste(root, imageFrame)) {
                    setReportDeckActivePlanImageFrame(root, imageFrame);
                    imageFrame.focus?.();
                    setReportDeckStatus(root, 'dirty', '붙여넣을 이미지 칸 선택됨');
                }
                return;
            }

            const imageFrame = getReportDeckPlanImageFrameFromTarget(event.target);
            const imageFrameAction = event.target?.closest?.('[data-report-plan-image-choice], [data-report-plan-image-clear]');
            if (imageFrame && !imageFrameAction && root.dataset.reportEditMode === 'editing' && getReportDeckPlanImageKeyFromFrame(imageFrame)) {
                event.preventDefault();
                if (canUseReportDeckPlanImagePaste(root, imageFrame)) {
                    setReportDeckActivePlanImageFrame(root, imageFrame);
                    imageFrame.focus?.();
                }
                return;
            }

            const fullscreenButton = event.target?.closest?.('[data-report-fullscreen]');
            if (fullscreenButton) {
                event.preventDefault();
                toggleReportDeckFullscreen(root);
                return;
            }

            const exportButton = event.target?.closest?.('[data-report-export-html]');
            if (exportButton) {
                event.preventDefault();
                void exportReportDeckSingleHtml(root, state, meta);
                return;
            }

            const printButton = event.target?.closest?.('[data-report-print-pdf]');
            if (printButton) {
                event.preventDefault();
                printReportDeckPdf(root);
                return;
            }

            const jumpButton = event.target?.closest?.('[data-report-jump-slide]');
            if (jumpButton) {
                event.preventDefault();
                const jumpView = String(jumpButton.dataset.reportJumpView || '').trim();
                if (jumpView) {
                    setReportDeckView(root, jumpView, jumpButton.dataset.reportJumpSlide);
                } else {
                    setReportDeckSlide(root, jumpButton.dataset.reportJumpSlide);
                }
                root.querySelector?.('[data-report-stage]')?.focus?.();
                return;
            }

            const slideButton = event.target?.closest?.('[data-report-slide-target]');
            if (!slideButton) return;
            event.preventDefault();
            setReportDeckSlide(root, slideButton.dataset.reportSlideTarget);
        });

        function handleReportDeckInput(event) {
            const monthSelect = event.target?.closest?.('[data-report-month-select]');
            if (monthSelect) {
                void selectReportDeckMonth(root, state, meta, monthSelect.value);
                return;
            }
            const memoSelector = event.target?.closest?.('[data-report-memo-team], [data-report-memo-metric]');
            if (memoSelector) {
                if (root.dataset.reportEditMode === 'editing') {
                    void refreshReportDeckMemoDialog(root, state, meta);
                }
                return;
            }
            const memoLineInput = event.target?.closest?.('[data-report-memo-line-input]');
            if (memoLineInput) {
                if (root.dataset.reportEditMode === 'editing') {
                    const dialog = getReportDeckMemoDialog(root);
                    const key = getReportDeckMemoDialogTargetKey(dialog);
                    const index = Number.parseInt(String(memoLineInput.dataset.reportMemoLineInput || ''), 10);
                    if (key && Number.isInteger(index) && Object.prototype.hasOwnProperty.call(state, key)) {
                        const lines = getReportDeckMemoLines(state[key]);
                        if (index >= 0) {
                            lines[index] = String(memoLineInput.value || '');
                            setReportDeckMemoLines(root, state, meta, dialog, key, lines, { syncDialog: false });
                        }
                    }
                }
                return;
            }
            const overviewField = event.target?.closest?.('[data-report-slide8-overview]');
            if (overviewField) {
                syncReportDeckFields(root, state, meta);
                return;
            }
            const fieldTarget = event.target?.closest?.('[data-report-field]');
            const fieldTargetKey = String(fieldTarget?.dataset?.reportField || '').trim();
            if (isReportDeckLockedFieldKey(fieldTargetKey)) {
                syncReportDeckFields(root, state, meta);
                return;
            }
            const planImageInput = event.target?.closest?.('[data-report-plan-image-input]');
            if (planImageInput) {
                void updateReportDeckPlanImage(root, state, meta, planImageInput);
                return;
            }
            if (root.dataset.reportEditMode !== 'editing') return;
            const dateInput = event.target?.closest?.('[data-report-date-input]');
            if (dateInput) {
                state.reportDate = normalizeReportDeckDate(dateInput.value) || REPORT_DECK_DEFAULT.reportDate;
                syncReportDeckFields(root, state, meta);
                markReportDeckDirty(root, state, meta);
                return;
            }
            const planCountSelect = event.target?.closest?.('[data-report-plan-count-select]');
            if (planCountSelect) {
                const key = String(planCountSelect.dataset.reportPlanCountSelect || '').trim();
                if (key && Object.prototype.hasOwnProperty.call(state, key)) {
                    state[key] = String(normalizeReportDeckPlanSlotCount(planCountSelect.value));
                    syncReportDeckPlanControls(root, state);
                    markReportDeckDirty(root, state, meta);
                }
                return;
            }
            const planSummary = event.target?.closest?.('[data-report-plan-summary]');
            if (planSummary) {
                syncReportDeckPlanControls(root, state);
                return;
            }
            const field = fieldTarget || event.target?.closest?.('[data-report-field]');
            const key = String(field?.dataset?.reportField || '').trim();
            if (
                !key
                || isReportDeckLockedFieldKey(key)
                || isReportDeckSlide8OverviewKey(key)
                || isReportDeckSlide9OverviewKey(key)
                || !Object.prototype.hasOwnProperty.call(state, key)
            ) return;
            state[key] = String(field.textContent || '');
            syncReportDeckFieldRefs(root, state, key);
            markReportDeckDirty(root, state, meta);
        }

        root.addEventListener?.('input', handleReportDeckInput);
        root.addEventListener?.('change', handleReportDeckInput);
        root.addEventListener?.('paste', event => {
            if (event?.defaultPrevented || root.dataset.reportEditMode !== 'editing') return;
            void pasteReportDeckPlanImage(root, state, meta, event);
        });
        root.addEventListener?.(REPORT_DECK_COMPLETE_EDIT_EVENT, event => {
            if (root.dataset.reportEditMode === 'editing') {
                event.preventDefault?.();
                void completeReportDeckEdit(root, state, meta);
            }
        });

        root.addEventListener?.('keydown', event => {
            if (isReportDeckSaveShortcut(event) && root.dataset.reportEditMode === 'editing') {
                event.preventDefault?.();
                event.stopPropagation?.();
                void completeReportDeckEdit(root, state, meta);
                return;
            }
            if (root.dataset.reportEditMode === 'editing') return;
            const key = String(event.key || '');
            if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') {
                event.preventDefault?.();
                moveReportDeckSlide(root, 1);
            } else if (key === 'ArrowLeft' || key === 'PageUp') {
                event.preventDefault?.();
                moveReportDeckSlide(root, -1);
            }
        });
    }
})();
