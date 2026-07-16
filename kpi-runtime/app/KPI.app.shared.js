        // ----------------------------------------------------------------
        // [앱 로직]
        // ----------------------------------------------------------------

        const browser = typeof KpiAppBrowserAdapter !== 'undefined'
            ? KpiAppBrowserAdapter
            : null;
        const KpiRuntime = browser?.getRuntime?.() || null;
        let activeRenderContext = null;
        let globalSaveRefreshTimer = null;
        const GlobalSaveUiState = {
            busy: false,
            activeAction: null,
            providerKey: '',
            message: '현재 화면은 저장 대상이 없습니다.',
            tone: ''
        };
        const GLOBAL_RECENT_UPDATE_STORAGE_KEY = 'kpi:global-recent-update';
        const DASHBOARD_SECTION_ORDER = ['work', 'data', 'report', 'experiment'];
        const DASHBOARD_SECTION_SOFT = Object.freeze({
            work: '#ecfdf5',
            data: '#f8fafc',
            report: '#eff6ff',
            experiment: '#ecfeff'
        });
        const COMPANY_LOGO_SRC = '/shared-assets/logo.jpg';
        const DashboardHomeState = {
            sectionId: DASHBOARD_SECTION_ORDER[0]
        };
        const SidebarTreeState = {
            expandedSections: {
                work: true,
                data: false,
                report: false,
                experiment: false
            }
        };
        const ViewerLayoutState = {
            sidebarCollapsed: false
        };
        const RuntimeAuthState = {
            busy: false
        };
        const NavigationSelectionState = {
            sectionId: '',
            categoryIndex: -1,
            teamDataKey: ''
        };
        const AppHistoryState = {
            namespace: 'kpi-app',
            applying: false,
            bound: false,
            lastRouteKey: '',
            sequence: 0
        };
        let activeCategoryIndex = -1;
        browser?.markGlobalSaveShell?.();

        function escapeDashboardHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function getDashboardSections() {
            const fallbackAccents = ['#f59e0b', '#16a34a', '#2563eb', '#ef4444', '#64748b'];
            return DASHBOARD_SECTION_ORDER.map((id, index) => {
                const section = AppData[id];
                if (!section) return null;
                if (section.ownerOnly === true && !canShowOwnerWorkspace()) return null;
                const categories = Array.isArray(section.categories) ? section.categories : [];
                return {
                    id,
                    index,
                    section,
                    categories,
                    accent: String(section.accent || fallbackAccents[index] || '#2563eb'),
                    softAccent: DASHBOARD_SECTION_SOFT[id] || '#eff6ff'
                };
            }).filter(Boolean);
        }

        function getDashboardNavigationSections(sections = null) {
            const entries = Array.isArray(sections) ? sections : getDashboardSections();
            return entries.filter(entry => entry?.section?.navigationHidden !== true);
        }

        function getDashboardSectionKey(value, sections = null) {
            const normalized = String(value || '').trim();
            const entries = Array.isArray(sections) ? sections : getDashboardSections();
            if (entries.some(entry => entry.id === normalized)) {
                return normalized;
            }
            return entries[0]?.id || '';
        }

        function getDashboardSelectedEntry(sections = null) {
            const entries = Array.isArray(sections) ? sections : getDashboardSections();
            const sectionId = getDashboardSectionKey(DashboardHomeState.sectionId, entries);
            DashboardHomeState.sectionId = sectionId;
            return entries.find(entry => entry.id === sectionId) || null;
        }

        function getNavigationSelectionSectionId() {
            const normalized = String(NavigationSelectionState.sectionId || '').trim();
            return normalized ? getDashboardSectionKey(normalized) : '';
        }

        function getNavigationSelectionCategoryIndex(sectionId = '') {
            return getNavigationSelectionSectionId() === getDashboardSectionKey(sectionId)
                ? Number(NavigationSelectionState.categoryIndex)
                : -1;
        }

        function getNavigationSelectionTeamDataKey(sectionId = '', categoryIndex = -1) {
            if (getNavigationSelectionSectionId() !== getDashboardSectionKey(sectionId)) return '';
            if (Number(NavigationSelectionState.categoryIndex) !== Number(categoryIndex)) return '';
            return String(NavigationSelectionState.teamDataKey || '').trim();
        }

        function setNavigationSelection(sectionId = '', categoryIndex = -1, options = {}) {
            const rawSectionId = String(sectionId || '').trim();
            const normalizedSectionId = rawSectionId ? getDashboardSectionKey(rawSectionId) : '';
            NavigationSelectionState.sectionId = normalizedSectionId;
            NavigationSelectionState.categoryIndex = Number.isFinite(Number(categoryIndex)) ? Number(categoryIndex) : -1;
            NavigationSelectionState.teamDataKey = String(options.teamDataKey || '').trim();
            if (normalizedSectionId) {
                DashboardHomeState.sectionId = normalizedSectionId;
            }
        }

        function parseDashboardDate(value) {
            const date = value ? new Date(value) : null;
            if (!date || Number.isNaN(date.getTime())) return null;
            return date;
        }

        function formatDashboardDateTime(value) {
            const date = parseDashboardDate(value);
            if (!date) return '-';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}.${month}.${day} ${hours}:${minutes}`;
        }

        function getStoredGlobalRecentUpdateRecord() {
            try {
                const raw = browser?.getStorageItem?.(GLOBAL_RECENT_UPDATE_STORAGE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                const savedAt = String(parsed?.savedAt || '').trim();
                if (!parseDashboardDate(savedAt)) return null;
                return {
                    savedAt,
                    providerKey: String(parsed?.providerKey || '').trim(),
                    sectionId: String(parsed?.sectionId || '').trim(),
                    categoryTitle: String(parsed?.categoryTitle || '').trim(),
                    label: String(parsed?.label || '').trim(),
                    trigger: String(parsed?.trigger || '').trim()
                };
            } catch (error) {
                return null;
            }
        }

        function persistGlobalRecentUpdateRecord(record = null) {
            const savedAt = String(record?.savedAt || '').trim();
            if (!parseDashboardDate(savedAt)) return;
            try {
                browser?.setStorageItem?.(GLOBAL_RECENT_UPDATE_STORAGE_KEY, JSON.stringify({
                    savedAt,
                    providerKey: String(record?.providerKey || '').trim(),
                    sectionId: String(record?.sectionId || '').trim(),
                    categoryTitle: String(record?.categoryTitle || '').trim(),
                    label: String(record?.label || '').trim(),
                    trigger: String(record?.trigger || '').trim()
                }));
            } catch (error) {
                // Keep the recent update state in memory when localStorage is unavailable.
            }
        }

        function getLatestGlobalSaveRecord() {
            const records = KpiRuntime?.getSaveHistory?.();
            const runtimeRecord = Array.isArray(records)
                ? records.find(record => parseDashboardDate(record?.savedAt))
                : null;
            const storedRecord = getStoredGlobalRecentUpdateRecord();
            const runtimeTime = parseDashboardDate(runtimeRecord?.savedAt)?.getTime() || 0;
            const storedTime = parseDashboardDate(storedRecord?.savedAt)?.getTime() || 0;
            if (runtimeTime >= storedTime) {
                return runtimeRecord || storedRecord;
            }
            return storedRecord || runtimeRecord;
        }

        function getLatestRecentUpdateValue() {
            const latestSaveRecord = getLatestGlobalSaveRecord();
            const latestSaveTime = parseDashboardDate(latestSaveRecord?.savedAt)?.getTime() || 0;
            const documentTime = parseDashboardDate(document.lastModified)?.getTime() || 0;
            if (documentTime > latestSaveTime) {
                return document.lastModified;
            }
            return latestSaveRecord?.savedAt || document.lastModified || '';
        }

        function syncDashboardLastModified() {
            const target = document.getElementById('last-modified-text');
            if (!target) return;
            target.textContent = `최종 수정: ${formatDashboardDateTime(getLatestRecentUpdateValue())}`;
        }

        function getRuntimeCurrentUser() {
            const runtimeConfig = KpiRuntime?.getServerRuntimeConfig?.() || null;
            const currentUser = runtimeConfig?.auth?.currentUser;
            return currentUser && typeof currentUser === 'object' ? currentUser : null;
        }

        function isTeamReportDocumentExperimentEnabled() {
            const runtimeConfig = KpiRuntime?.getServerRuntimeConfig?.() || null;
            return runtimeConfig?.experiments?.teamReportDocumentUi === true;
        }

        function isLocalDashboardPreviewMode() {
            const runtimeConfig = KpiRuntime?.getServerRuntimeConfig?.() || null;
            if (
                runtimeConfig
                && runtimeConfig.enabled === true
                && String(runtimeConfig.source || '').trim() === 'internal_server'
            ) {
                return false;
            }
            const locationMeta = browser?.getLocationMeta?.() || {};
            const protocol = String(locationMeta.protocol || '').trim().toLowerCase();
            if (protocol === 'file:') return true;
            if (!/^(http:|https:)$/.test(protocol)) return false;
            const hostname = String(locationMeta.hostname || '').trim().toLowerCase();
            return hostname === 'localhost' || hostname === '127.0.0.1';
        }

        function hasOwnerRole(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return false;
            if (currentUser.isOwner === true) return true;
            return Array.isArray(currentUser.roles) && currentUser.roles.includes('owner');
        }
