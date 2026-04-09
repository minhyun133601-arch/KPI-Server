        // ----------------------------------------------------------------
        // [앱 로직]
        // ----------------------------------------------------------------

        const KpiRuntime = window.KpiRuntime;
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
        const DASHBOARD_SECTION_ORDER = ['work', 'util', 'equip', 'audit', 'data'];
        const DASHBOARD_SECTION_SOFT = Object.freeze({
            util: '#fff7ed',
            work: '#ecfdf5',
            equip: '#eff6ff',
            audit: '#fef2f2',
            data: '#f8fafc'
        });
        const COMPANY_LOGO_SRC = '※_공용자산/로고.jpg';
        const DashboardHomeState = {
            sectionId: DASHBOARD_SECTION_ORDER[0]
        };
        const SidebarTreeState = {
            expandedSections: {
                work: true,
                util: false,
                equip: false,
                audit: false,
                data: false
            }
        };
        const ViewerLayoutState = {
            sidebarCollapsed: false
        };
        const NavigationSelectionState = {
            sectionId: DashboardHomeState.sectionId,
            categoryIndex: -1,
            teamDataKey: ''
        };
        let activeCategoryIndex = -1;
        window.__KPI_GLOBAL_SAVE_SHELL__ = true;

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
            return getDashboardSectionKey(NavigationSelectionState.sectionId || DashboardHomeState.sectionId);
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
            const normalizedSectionId = getDashboardSectionKey(sectionId);
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
                const raw = window.localStorage?.getItem?.(GLOBAL_RECENT_UPDATE_STORAGE_KEY);
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
                window.localStorage?.setItem?.(GLOBAL_RECENT_UPDATE_STORAGE_KEY, JSON.stringify({
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

        function ensureSidebarTreeState(sections = null) {
            const entries = Array.isArray(sections) ? sections : getDashboardSections();
            entries.forEach((entry, index) => {
                if (typeof SidebarTreeState.expandedSections[entry.id] !== 'boolean') {
                    SidebarTreeState.expandedSections[entry.id] = index === 0;
                }
            });
            return entries;
        }

        function updateViewerTitle(sectionId = '', category = null) {
            const titleEl = document.getElementById('section-title');
            const dividerEl = document.getElementById('viewer-header-section-divider');
            if (!titleEl) return;
            if (!sectionId || !AppData[sectionId]) {
                titleEl.innerHTML = '';
                titleEl.classList.add('is-hidden');
                dividerEl?.classList.add('is-hidden');
                return;
            }
            titleEl.classList.remove('is-hidden');
            dividerEl?.classList.remove('is-hidden');
            const section = AppData[sectionId];
            const moduleColor = section.accent || '#2563eb';
            const sectionName = escapeDashboardHtml(section.name || sectionId);
            const categoryTitle = category?.title ? ` <span class="text-slate-300">/</span> <span>${escapeDashboardHtml(category.title)}</span>` : '';
            titleEl.innerHTML = `<i class="fas ${escapeDashboardHtml(section.icon || 'fa-folder-open')}" style="color:${moduleColor};"></i> ${sectionName}${categoryTitle}`;
        }

        function renderViewerHome() {
            const contentContainer = document.getElementById('content-container');
            const mainScroll = document.getElementById('main-scroll');
            if (!contentContainer || !mainScroll) return;
            const companyLogoSrc = encodeURI(COMPANY_LOGO_SRC);
            setViewerContentMode('full-bleed');
            contentContainer.innerHTML = `
                <div class="viewer-home-shell" style="--viewer-home-logo:url('${companyLogoSrc}');">
                    <div class="viewer-home-hero">
                        <div class="viewer-home-brand-panel">
                            <div class="viewer-home-brand-frame">
                                <img class="viewer-home-brand-logo" src="${companyLogoSrc}" alt="회사 로고" />
                            </div>
                        </div>
                        <div class="viewer-home-copy-panel">
                            <h1 class="viewer-home-policy-title">2026년 경영방침</h1>
                            <div class="viewer-home-policy-rule"></div>
                            <div class="viewer-home-policy-points">
                                <p class="viewer-home-policy-line">
                                    <span class="viewer-home-policy-line-icon" aria-hidden="true"><i class="fas fa-arrow-trend-up"></i></span>
                                    <span>새로운 기준으로 지속 성장의 기반을 구축한다</span>
                                </p>
                                <p class="viewer-home-policy-line viewer-home-policy-line-strong">
                                    <span class="viewer-home-policy-line-icon" aria-hidden="true"><i class="fas fa-brain"></i></span>
                                    <span>AI 역량을 확보하여 업무효율을 극대화한다.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <section class="viewer-home-guideline-section" aria-label="행동 강령">
                        <div class="viewer-home-guideline-header">
                            <h2 class="viewer-home-guideline-title">신소가 행동강령</h2>
                        </div>
                        <div class="viewer-home-guideline-grid">
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-trust">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-handshake"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">신뢰(信賴)</div>
                                    <div class="viewer-home-guideline-quote">“의지하고, 이해하고, 믿고, 열어라”</div>
                                    <div class="viewer-home-guideline-tag">“의리신열”</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>차이나 부족함을 인정하고 스스로를 낮추는 겸손한 자세</li>
                                        <li>상대를 배려, 존중하고 이해하려는 태도</li>
                                        <li>존중, 성실, 책임 있는 행동을 취하는 자세</li>
                                        <li>개방적이고 열린 마음으로 받아들이려는 자세</li>
                                    </ul>
                                </div>
                            </article>
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-communication">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-comments"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">소통(疏通)</div>
                                    <div class="viewer-home-guideline-quote">“찾아가고, 다가가고, 듣고, 말하라”</div>
                                    <div class="viewer-home-guideline-tag">“방다청설”</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>적극적인 문제해결과 도전하려는 자세</li>
                                        <li>자발적이며 친절하게 협업하고 협력하는 모습</li>
                                        <li>경청하고 수용하는 태도</li>
                                        <li>진정성과 공감대 형성을 위한 적극적인 자세</li>
                                    </ul>
                                </div>
                            </article>
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-value">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-lightbulb"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">가치창조(價値創造)</div>
                                    <div class="viewer-home-guideline-quote">“경험하고, 나누고, 배우고, 쓸모있게 하라”</div>
                                    <div class="viewer-home-guideline-tag">“경나학쓸”</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>도전을 통해 노하우를 쌓고 다양한 기능과 지식을 획득하는 자세</li>
                                        <li>생각과 정보를 나누고 공유하는 자세</li>
                                        <li>새로운 기술과 환경에서 아이디어를 찾고 학습하려는 자세</li>
                                        <li>창의적인 마인드와 가치지향적인 태도</li>
                                    </ul>
                                </div>
                            </article>
                        </div>
                    </section>
                </div>
            `;
            mainScroll.scrollTop = 0;
        }

        function collapseSidebarSections() {
            const sections = getDashboardSections();
            sections.forEach(sectionEntry => {
                SidebarTreeState.expandedSections[sectionEntry.id] = false;
            });
        }

        function toggleSidebarSection(sectionId = '') {
            const key = getDashboardSectionKey(sectionId);
            if (!key) return;
            SidebarTreeState.expandedSections[key] = SidebarTreeState.expandedSections[key] !== true;
            renderSidebar();
        }

        function buildDashboardSectionPanelHtml(entry) {
            if (!entry) {
                return `
                    <div class="dashboard-panel">
                        <div class="dashboard-panel-surface">
                            <div class="dashboard-empty-state">표시할 모듈이 없습니다.</div>
                        </div>
                    </div>
                `;
            }

            const { id, section, categories, accent, softAccent } = entry;
            const visibleCategoryCount = getSectionNavigationCategories(section).length;
            return `
                <div class="dashboard-panel">
                    <div class="dashboard-panel-surface">
                        <div class="dashboard-workspace-panel" style="--section-color:${accent}; --section-soft:${softAccent};">
                            <span class="dashboard-workspace-icon"><i class="fas ${escapeDashboardHtml(section.icon || 'fa-folder-open')}"></i></span>
                            <div class="dashboard-workspace-title">${escapeDashboardHtml(section.name || id)}</div>
                            <div class="dashboard-workspace-copy">왼쪽에서 하위 메뉴를 눌러 바로 열 수 있습니다.</div>
                            <div class="dashboard-workspace-meta">${visibleCategoryCount}개 항목</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function getSectionNavigationCategories(section = null) {
            const categories = Array.isArray(section?.categories) ? section.categories : [];
            return categories
                .map((category, index) => ({ category, index }))
                .filter(entry => entry.category?.navHidden !== true);
        }

        function renderDashboardSideNav(sections = null, selectedEntry = null) {
            const sideNav = document.getElementById('dashboard-side-nav');
            if (!sideNav) return;
            const entries = Array.isArray(sections) ? sections : getDashboardSections();
            const activeEntry = selectedEntry || getDashboardSelectedEntry(entries);
            const selectedSectionId = getNavigationSelectionSectionId();
            sideNav.innerHTML = entries.map(entry => {
                const isActive = entry.id === activeEntry?.id;
                const navCategories = getSectionNavigationCategories(entry.section);
                return `
                    <div class="dashboard-tree-group${isActive ? ' active' : ''}" style="--section-color:${entry.accent}; --section-soft:${entry.softAccent};">
                        <button type="button" class="dashboard-tree-main${isActive ? ' active' : ''}" onclick="setDashboardSection('${entry.id}')">
                            <span class="dashboard-tree-main-head">
                                <span class="dashboard-side-button-icon"><i class="fas ${escapeDashboardHtml(entry.section.icon || 'fa-folder-open')}"></i></span>
                                <span class="dashboard-side-button-copy">
                                    <span class="dashboard-side-button-label">${escapeDashboardHtml(entry.section.name || entry.id)}</span>
                                </span>
                            </span>
                            <span class="dashboard-tree-chevron"><i class="fas fa-chevron-right"></i></span>
                        </button>
                        <div class="dashboard-tree-submenu">
                            ${navCategories.map(({ category, index }) => {
                                const isActiveCategory = selectedSectionId === entry.id && getNavigationSelectionCategoryIndex(entry.id) === index;
                                return `
                                <button type="button" class="dashboard-tree-subitem${isActiveCategory ? ' active' : ''}" onclick="openSectionCategory('${entry.id}', ${index})"${isActiveCategory ? ' aria-current="page"' : ''}>
                                    <span class="dashboard-tree-subitem-title">${escapeDashboardHtml(category.title || `항목 ${index + 1}`)}</span>
                                </button>
                            `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderDashboardHome() {
            const sideNav = document.getElementById('dashboard-side-nav');
            const stageTitle = document.getElementById('dashboard-stage-title');
            const stageCount = document.getElementById('dashboard-stage-count');
            const subtabBar = document.getElementById('dashboard-subtabs');
            const panelContainer = document.getElementById('dashboard-home-panels');
            if (!sideNav || !stageTitle || !stageCount || !subtabBar || !panelContainer) return;
            const sections = getDashboardSections();
            const selectedEntry = getDashboardSelectedEntry(sections);
            const selectedCategories = getSectionNavigationCategories(selectedEntry?.section);
            renderDashboardSideNav(sections, selectedEntry);

            stageTitle.textContent = selectedEntry?.section?.name || '대시보드';
            stageCount.textContent = `${selectedCategories.length}개`;
            subtabBar.innerHTML = '';

            panelContainer.innerHTML = buildDashboardSectionPanelHtml(selectedEntry);

            syncDashboardLastModified();
        }

        function setDashboardSection(sectionId) {
            DashboardHomeState.sectionId = getDashboardSectionKey(sectionId);
            renderDashboardHome();
        }

        function openSectionCategory(sectionId, categoryIndex = 0) {
            const normalizedIndex = Number.isFinite(Number(categoryIndex)) ? Number(categoryIndex) : 0;
            const data = AppData[sectionId];
            if (!data) return;
            SidebarTreeState.expandedSections[sectionId] = true;
            selectCategory(sectionId, normalizedIndex);
        }

        function resolveSectionCategoryIndex(sectionId = '', matcher = {}) {
            const data = AppData[sectionId];
            const categories = Array.isArray(data?.categories) ? data.categories : [];
            if (!categories.length) return -1;
            const preferredIndex = Number.isFinite(Number(matcher.index)) ? Number(matcher.index) : -1;
            if (preferredIndex >= 0 && preferredIndex < categories.length) {
                return preferredIndex;
            }
            const dataKey = String(matcher.dataKey || '').trim();
            if (dataKey) {
                const byDataKey = categories.findIndex(category => String(category?.dataKey || '').trim() === dataKey);
                if (byDataKey >= 0) return byDataKey;
            }
            const title = String(matcher.title || '').trim();
            if (title) {
                const byTitle = categories.findIndex(category => String(category?.title || '').trim() === title);
                if (byTitle >= 0) return byTitle;
            }
            const view = String(matcher.view || '').trim();
            if (view) {
                const byView = categories.findIndex(category => String(category?.view || '').trim() === view);
                if (byView >= 0) return byView;
            }
            return -1;
        }

        function resolveCategoryShortcut(category = null) {
            const target = category?.shortcutTarget;
            if (!target || typeof target !== 'object') return null;
            const sectionId = String(target.sectionId || '').trim();
            if (!sectionId) return null;
            const categoryIndex = resolveSectionCategoryIndex(sectionId, target);
            if (categoryIndex < 0) return null;
            return {
                sectionId,
                categoryIndex,
                options: target.options && typeof target.options === 'object'
                    ? { ...target.options }
                    : {}
            };
        }

        function openSection(id) {
            const data = AppData[id];
            if (!data) return;
            setNavigationSelection(id, -1);
            SidebarTreeState.expandedSections[id] = true;
            renderDashboardSideNav();
            document.getElementById('dashboard')?.classList.add('hidden-view');
            if (data.categories && data.categories.length > 0) {
                const defaultOptions = KpiRuntime?.getDefaultOpenOptions?.(id, { section: data }) || {};
                selectCategory(data.id, 0, defaultOptions);
                return;
            }
            activeSectionId = id;
            activeCategoryIndex = -1;
            activeRenderContext = null;
            updateViewerTitle(id, null);
            renderSidebar();
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
        }

        function goHome() {
            void window.KpiMeteringBridge?.destroyIntegratedMeteringMount?.();
            activeSectionId = null;
            activeCategoryIndex = -1;
            NavigationSelectionState.categoryIndex = -1;
            NavigationSelectionState.teamDataKey = '';
            document.getElementById('dashboard')?.classList.add('hidden-view');
            activeRenderContext = null;
            collapseSidebarSections();
            updateViewerTitle();
            renderSidebar();
            renderViewerHome();
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
        }

        function getDeepActiveElement(root = document) {
            let active = root?.activeElement || null;
            while (active?.shadowRoot?.activeElement) {
                active = active.shadowRoot.activeElement;
            }
            return active;
        }

        function isEditableTarget(target) {
            const candidate = target || getDeepActiveElement(document);
            if (!candidate) return false;
            const tag = (candidate.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
            if (candidate.isContentEditable) return true;
            if (typeof candidate.closest === 'function' && candidate.closest('[contenteditable=\"true\"]')) return true;
            const deepActive = getDeepActiveElement(document);
            if (deepActive && deepActive !== candidate) {
                return isEditableTarget(deepActive);
            }
            return false;
        }

        function getGlobalSaveElements() {
            const dock = document.getElementById('global-save-dock');
            const button = document.getElementById('global-save-button');
            return {
                dock,
                status: dock?.querySelector?.('#global-save-status') || null,
                recentChip: dock?.querySelector?.('#global-save-recent-chip') || null,
                recentValue: dock?.querySelector?.('#global-save-recent-value') || null,
                dateChip: dock?.querySelector?.('#global-save-date-chip') || null,
                dateValue: dock?.querySelector?.('#global-save-date-value') || null,
                button,
                buttonLabel: button?.querySelector?.('#global-save-button-label') || dock?.querySelector?.('#global-save-button-label') || null
            };
        }

        function formatViewerHeaderDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const date = String(today.getDate()).padStart(2, '0');
            return `${year}.${month}.${date}`;
        }

        function shouldShowGlobalSaveDateChip() {
            return true;
        }

        function getDashboardHiddenState() {
            return document.getElementById('dashboard')?.classList.contains('hidden-view') === true;
        }

        function getDefaultGlobalSaveStatus(action) {
            if (!getDashboardHiddenState()) {
                return '대시보드에서는 저장 작업이 없습니다.';
            }
            if (!action) {
                return '현재 화면은 저장 대상이 없습니다.';
            }
            return action.statusText || '현재 화면 데이터를 중앙 서버에 저장합니다.';
        }

        function getDefaultGlobalSaveButtonLabel(action) {
            return action?.buttonLabel || '저장';
        }

        function resolveGlobalSaveAction() {
            if (!getDashboardHiddenState()) return null;
            return KpiRuntime?.resolveSaveAction?.(activeRenderContext || {}) || null;
        }

        function renderGlobalSaveUi(options = {}) {
            const { dock, status, button, buttonLabel, recentValue, dateChip, dateValue } = getGlobalSaveElements();
            if (!dock || !status || !button || !buttonLabel) return;
            const action = resolveGlobalSaveAction();
            const providerChanged = String(action?.providerKey || '') !== String(GlobalSaveUiState.providerKey || '');
            GlobalSaveUiState.activeAction = action;
            if (options.forceDefault === true || providerChanged) {
                GlobalSaveUiState.providerKey = String(action?.providerKey || '');
                GlobalSaveUiState.message = getDefaultGlobalSaveStatus(action);
                GlobalSaveUiState.tone = '';
            }

            const canSave = !!(action && action.canSave !== false && typeof action.perform === 'function');
            button.disabled = GlobalSaveUiState.busy || !canSave;
            button.classList.toggle('is-saving', GlobalSaveUiState.busy);
            button.classList.toggle('is-success', !GlobalSaveUiState.busy && GlobalSaveUiState.tone === 'success');
            button.classList.toggle('is-error', !GlobalSaveUiState.busy && GlobalSaveUiState.tone === 'error');
            button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
            buttonLabel.textContent = GlobalSaveUiState.busy
                ? '저장 중...'
                : getDefaultGlobalSaveButtonLabel(action);
            button.title = action?.title || GlobalSaveUiState.message || '저장';
            status.textContent = GlobalSaveUiState.message;
            status.classList.toggle('is-success', GlobalSaveUiState.tone === 'success');
            status.classList.toggle('is-error', GlobalSaveUiState.tone === 'error');
            if (recentValue) {
                recentValue.textContent = formatDashboardDateTime(getLatestRecentUpdateValue());
            }
            if (dateChip && dateValue) {
                const shouldShowDateChip = shouldShowGlobalSaveDateChip();
                dateChip.classList.toggle('is-hidden', !shouldShowDateChip);
                if (shouldShowDateChip) {
                    dateValue.textContent = formatViewerHeaderDate();
                }
            }
        }

        function resetGlobalSaveUiToDefault() {
            const action = resolveGlobalSaveAction();
            GlobalSaveUiState.activeAction = action;
            GlobalSaveUiState.providerKey = String(action?.providerKey || '');
            GlobalSaveUiState.message = getDefaultGlobalSaveStatus(action);
            GlobalSaveUiState.tone = '';
            renderGlobalSaveUi();
        }

        function scheduleGlobalSaveUiRefresh(options = {}) {
            if (globalSaveRefreshTimer) {
                clearTimeout(globalSaveRefreshTimer);
            }
            globalSaveRefreshTimer = setTimeout(() => {
                globalSaveRefreshTimer = null;
                renderGlobalSaveUi(options);
            }, 0);
        }

        async function triggerGlobalSave(options = {}) {
            const action = resolveGlobalSaveAction();
            if (!action || action.canSave === false || typeof action.perform !== 'function') {
                GlobalSaveUiState.activeAction = null;
                GlobalSaveUiState.providerKey = '';
                GlobalSaveUiState.message = getDefaultGlobalSaveStatus(null);
                GlobalSaveUiState.tone = 'error';
                renderGlobalSaveUi();
                return false;
            }

            GlobalSaveUiState.busy = true;
            GlobalSaveUiState.activeAction = action;
            GlobalSaveUiState.providerKey = String(action.providerKey || '');
            GlobalSaveUiState.message = '중앙 서버에 저장 중입니다...';
            GlobalSaveUiState.tone = '';
            renderGlobalSaveUi();

            let successAlertMessage = '';
            try {
                const result = await action.perform({
                    trigger: options.trigger || 'manual',
                    context: activeRenderContext || {},
                    action
                });
                if (result === false) {
                    throw new Error('save_rejected');
                }
                const savedRecord = KpiRuntime?.recordSaveHistory?.({
                    providerKey: action.providerKey,
                    sectionId: activeSectionId,
                    categoryTitle: activeRenderContext?.category?.title || '',
                    label: action.historyLabel || action.buttonLabel || action.label || '저장',
                    trigger: options.trigger || 'manual'
                });
                persistGlobalRecentUpdateRecord(savedRecord);
                const savedTime = savedRecord?.savedAt
                    ? new Date(savedRecord.savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                    : '';
                GlobalSaveUiState.message = savedTime
                    ? `저장이 완료되었습니다. ${savedTime}`
                    : '저장이 완료되었습니다.';
                GlobalSaveUiState.tone = '';
                successAlertMessage = '저장되었습니다.';
                return true;
            } catch (error) {
                console.error('KPI global save failed.', error);
                GlobalSaveUiState.message = action.errorMessage || '저장에 실패했습니다.';
                GlobalSaveUiState.tone = 'error';
                return false;
            } finally {
                GlobalSaveUiState.busy = false;
                if (successAlertMessage) {
                    resetGlobalSaveUiToDefault();
                    if (typeof window.alert === 'function') {
                        window.alert(successAlertMessage);
                    }
                } else {
                    renderGlobalSaveUi();
                }
            }
        }

        function bindGlobalSaveButton() {
            if (window.__globalSaveButtonListener) return;
            window.__globalSaveButtonListener = true;
            const { button } = getGlobalSaveElements();
            button?.addEventListener('click', () => {
                void triggerGlobalSave({ trigger: 'button' });
            });
        }

        function bindGlobalSaveHotkey() {
            if (window.__globalSaveHotkeyListener) return;
            window.__globalSaveHotkeyListener = true;
            window.addEventListener('keydown', evt => {
                if (evt.defaultPrevented) return;
                if (evt.altKey || evt.shiftKey) return;
                if (!(evt.ctrlKey || evt.metaKey)) return;
                if (String(evt.key || '').toLowerCase() !== 's') return;
                evt.preventDefault();
                evt.stopPropagation();
                void triggerGlobalSave({ trigger: 'shortcut' });
            }, true);
        }

        function bindGlobalSaveRefreshHooks() {
            if (window.__globalSaveRefreshHooks) return;
            window.__globalSaveRefreshHooks = true;
            const schedule = () => scheduleGlobalSaveUiRefresh();
            document.addEventListener('click', schedule, true);
            document.addEventListener('input', schedule, true);
            document.addEventListener('change', schedule, true);
            document.addEventListener('focusin', schedule, true);
            window.addEventListener('kpi:metering-store-updated', schedule);
            window.addEventListener('util-production-data-updated', schedule);
            window.addEventListener('storage', event => {
                if (String(event?.key || '') !== GLOBAL_RECENT_UPDATE_STORAGE_KEY) return;
                schedule();
            });
        }

        function bindBackspaceGoHomeHotkey() {
            if (window.__backspaceGoHomeListener) return;
            window.__backspaceGoHomeListener = true;
            document.addEventListener('keydown', evt => {
                if (evt.key !== 'Backspace') return;
                if (evt.defaultPrevented) return;
                if (isEditableTarget(evt.target)) return;
                const dashboard = document.getElementById('dashboard');
                if (!dashboard || !dashboard.classList.contains('hidden-view')) return;
                if (hasOpenModalLayer()) {
                    closeGlobalSectionShortcutLayers();
                    evt.preventDefault();
                    return;
                }
                goHome();
                evt.preventDefault();
            });
        }

        function closeGlobalSectionShortcutLayers() {
            KpiRuntime?.closeShortcutLayers?.();
            document.querySelectorAll('[id$="-modal"].is-open').forEach(modal => {
                modal.classList.remove('is-open');
                modal.classList.remove('is-chart-fullscreen');
            });
            document.body.style.overflow = '';
        }

        function hasOpenModalLayer() {
            return Boolean(document.querySelector('[id$="-modal"].is-open'));
        }

        function getUtilSidebarReportShortcutTeam(itemKey = '') {
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey || UtilReportState.builderItemKey || 'electric');
            const directSection = document.querySelector(`[data-util-dual="${normalizedItemKey}"] [data-util-dual-section="combined"]`);
            const activeTeam = String(directSection?.dataset?.activeTeam || '').trim();
            if (activeTeam) return activeTeam;
            if (normalizedItemKey === 'electric') return UtilReportState.electricTeam === 'all' ? '전체' : (UtilReportState.electricTeam || '전체');
            if (normalizedItemKey === 'gas') return UtilReportState.gasTeam === 'all' ? '전체' : (UtilReportState.gasTeam || '전체');
            if (normalizedItemKey === 'waste') return UtilReportState.wasteTeam === 'all' ? '전체' : (UtilReportState.wasteTeam || '전체');
            return UtilReportBuilderVizState.team || '전체';
        }

        function openUtilSidebarReportShortcut(itemKey = '') {
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey || 'electric');
            const directSection = getUtilDualCombinedSection(normalizedItemKey);
            if (directSection) {
                syncUtilReportBuilderVizStateFromDualSection(directSection, normalizedItemKey);
            }
            openUtilReportBuilderModal(normalizedItemKey, getUtilSidebarReportShortcutTeam(normalizedItemKey));
        }

        function getSidebarTeamCategories(sectionEntry, category = null) {
            if (sectionEntry?.id !== 'work' || category?.view !== 'team_calendar') return [];
            return Array.isArray(sectionEntry.section?.teamCategories) ? sectionEntry.section.teamCategories : [];
        }

        function getActiveSidebarTeamDataKey(sectionId = '', categoryIndex = -1) {
            const section = AppData?.[sectionId];
            const category = Array.isArray(section?.categories) ? section.categories[categoryIndex] : null;
            if (!category || category.view !== 'team_calendar') return '';
            if (getNavigationSelectionSectionId() !== getDashboardSectionKey(sectionId)) return '';
            if (getNavigationSelectionCategoryIndex(sectionId) !== Number(categoryIndex)) return '';
            const selectedTeamDataKey = getNavigationSelectionTeamDataKey(sectionId, categoryIndex);
            if (selectedTeamDataKey) return selectedTeamDataKey;
            const fallbackKey = String(category.dataKey || '').trim();
            if (typeof WorkState === 'undefined' || !WorkState) return fallbackKey;
            return String(WorkState.teamCalendarHubDataKey || fallbackKey).trim();
        }

        function openSidebarTeamCategory(sectionId, categoryIndex = 0, teamDataKey = '') {
            selectCategory(sectionId, categoryIndex, {
                teamDataKey: String(teamDataKey || '').trim()
            });
        }

        function getSidebarRenderableCategories(sectionEntry = null) {
            return getSectionNavigationCategories(sectionEntry?.section);
        }

        function renderSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar) return;
            const sections = ensureSidebarTreeState(getDashboardSections());
            const selectedSectionId = getNavigationSelectionSectionId();
            sidebar.innerHTML = `
                <div class="sidebar-tree-shell">
                    <button id="viewer-sidebar-toggle" type="button" class="sidebar-group-toggle sidebar-viewer-toggle" onclick="toggleViewerSidebar()" aria-label="닫기" title="닫기" aria-pressed="false">
                        <span class="sidebar-group-toggle-main">
                            <span class="sidebar-group-icon"><i class="fas fa-angles-left" aria-hidden="true"></i></span>
                            <span id="viewer-sidebar-toggle-label" class="sidebar-group-label">닫기</span>
                        </span>
                    </button>
                    ${sections.map(sectionEntry => {
                        const isExpanded = SidebarTreeState.expandedSections[sectionEntry.id] === true;
                        const isActiveSection = selectedSectionId === sectionEntry.id;
                        return `
                            <div class="sidebar-group${isExpanded ? ' is-expanded' : ''}" style="--cat-color:${sectionEntry.accent}; --cat-soft:${sectionEntry.softAccent};">
                                <button type="button" class="sidebar-group-toggle${isActiveSection ? ' is-active' : ''}" onclick="toggleSidebarSection('${sectionEntry.id}')">
                                    <span class="sidebar-group-toggle-main">
                                        <span class="sidebar-group-icon"><i class="fas ${escapeDashboardHtml(sectionEntry.section.icon || 'fa-folder-open')}"></i></span>
                                        <span class="sidebar-group-label">${escapeDashboardHtml(sectionEntry.section.name || sectionEntry.id)}</span>
                                    </span>
                                    <span class="sidebar-group-chevron"><i class="fas fa-chevron-right"></i></span>
                                </button>
                                <div class="sidebar-group-items">
                                    ${getSidebarRenderableCategories(sectionEntry).map(({ category, index }) => {
                                        const categoryColor = category.color || sectionEntry.accent;
                                        const isActiveCategory = isActiveSection && getNavigationSelectionCategoryIndex(sectionEntry.id) === index;
                                        const teamCategories = getSidebarTeamCategories(sectionEntry, category);
                                        const activeTeamDataKey = getActiveSidebarTeamDataKey(sectionEntry.id, index);
                                        if (teamCategories.length) {
                                            return `
                                                <div class="sidebar-category-branch">
                                                    ${teamCategories.map((teamCategory, teamIndex) => {
                                                        const teamColor = teamCategory.color || categoryColor;
                                                        const isActiveTeam = isActiveCategory && activeTeamDataKey === String(teamCategory.dataKey || '').trim();
                                                        return `
                                                            <button type="button" class="sidebar-item sidebar-item-nested sidebar-item-team${isActiveTeam ? ' active' : ''}" style="--cat-color:${teamColor};" onclick="openSidebarTeamCategory('${sectionEntry.id}', ${index}, '${teamCategory.dataKey}')" id="cat-btn-${sectionEntry.id}-${index}-team-${teamIndex}"${isActiveTeam ? ' aria-current="page"' : ''}>
                                                                <span class="sidebar-item-main">
                                                                    <i class="fas ${escapeDashboardHtml(teamCategory.icon || 'fa-layer-group')} w-5 text-center"></i>
                                                                    <span>${escapeDashboardHtml(teamCategory.title || `팀 ${teamIndex + 1}`)}</span>
                                                                </span>
                                                            </button>
                                                        `;
                                                    }).join('')}
                                                </div>
                                            `;
                                        }
                                        return `
                                            <div class="sidebar-category-branch">
                                                <button type="button" class="sidebar-item sidebar-item-nested${isActiveCategory ? ' active' : ''}" style="--cat-color:${categoryColor};" onclick="selectCategory('${sectionEntry.id}', ${index})" id="cat-btn-${sectionEntry.id}-${index}"${isActiveCategory ? ' aria-current="page"' : ''}>
                                                    <span class="sidebar-item-main">
                                                        <i class="fas ${escapeDashboardHtml(category.icon || 'fa-folder')} w-5 text-center"></i>
                                                        <span>${escapeDashboardHtml(category.title || `항목 ${index + 1}`)}</span>
                                                    </span>
                                                </button>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            syncViewerSidebarUi();
        }

        function getViewerSidebarToggleMeta(isCollapsed = ViewerLayoutState.sidebarCollapsed === true) {
            return isCollapsed
                ? {
                    label: '열기',
                    icon: 'fa-angles-right'
                }
                : {
                    label: '닫기',
                    icon: 'fa-angles-left'
                };
        }

        function syncViewerSidebarUi() {
            const viewerBody = document.getElementById('viewer-body');
            const sidebar = document.getElementById('sidebar');
            const isCollapsed = ViewerLayoutState.sidebarCollapsed === true;
            viewerBody?.classList.toggle('is-sidebar-collapsed', isCollapsed);
            sidebar?.classList.toggle('is-collapsed', isCollapsed);
            const meta = getViewerSidebarToggleMeta(isCollapsed);
            const button = document.getElementById('viewer-sidebar-toggle');
            if (!button) return;
            button.setAttribute('aria-pressed', isCollapsed ? 'true' : 'false');
            button.setAttribute('aria-label', meta.label);
            button.setAttribute('title', meta.label);
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = `fas ${meta.icon}`;
            }
            const label = document.getElementById('viewer-sidebar-toggle-label');
            if (label) {
                label.textContent = meta.label;
            }
        }

        function toggleViewerSidebar() {
            ViewerLayoutState.sidebarCollapsed = !ViewerLayoutState.sidebarCollapsed;
            syncViewerSidebarUi();
        }

        function setViewerContentMode(mode = 'default') {
            const mainScroll = document.getElementById('main-scroll');
            const contentContainer = document.getElementById('content-container');
            if (!mainScroll || !contentContainer) return;
            const isFullBleed = mode === 'full-bleed';
            mainScroll.classList.toggle('content-area-full-bleed', isFullBleed);
            contentContainer.classList.toggle('content-card-full-bleed', isFullBleed);
        }

        function selectCategory(dataId, index, options = {}) {
            void window.KpiMeteringBridge?.destroyIntegratedMeteringMount?.();
            const data = AppData[dataId];
            if (!data || !Array.isArray(data.categories) || !data.categories[index]) return;
            const category = data.categories[index];
            const navSectionId = getDashboardSectionKey(options.__navSectionId || dataId);
            const navCategoryIndex = Number.isFinite(Number(options.__navCategoryIndex)) ? Number(options.__navCategoryIndex) : index;
            const navTeamDataKey = String(options.__navTeamDataKey || options.teamDataKey || '').trim();
            const shortcut = options.__skipShortcut === true ? null : resolveCategoryShortcut(category);
            if (shortcut) {
                selectCategory(shortcut.sectionId, shortcut.categoryIndex, {
                    ...shortcut.options,
                    __navSectionId: navSectionId,
                    __navCategoryIndex: navCategoryIndex,
                    __navTeamDataKey: navTeamDataKey,
                    __skipShortcut: true
                });
                return;
            }
            const accent = category.color || data.accent || '#2563eb';
            const contentContainer = document.getElementById('content-container');
            const mainScroll = document.getElementById('main-scroll');
            const isFullBleed = category.viewerMode === 'full-bleed';
            if (options.teamDataKey && typeof WorkState !== 'undefined' && WorkState) {
                WorkState.teamCalendarHubDataKey = String(options.teamDataKey || '').trim();
            }
            const renderContext = {
                appData: AppData,
                section: data,
                sectionId: dataId,
                category,
                categoryIndex: index,
                options,
                container: contentContainer,
                mainScroll
            };
            setNavigationSelection(navSectionId, navCategoryIndex, { teamDataKey: navTeamDataKey });
            activeSectionId = dataId;
            activeCategoryIndex = index;
            SidebarTreeState.expandedSections[dataId] = options.keepSidebarCollapsed === true ? false : true;
            activeRenderContext = renderContext;
            renderDashboardSideNav();
            const activeTeamDataKey = options.teamDataKey
                || ((typeof WorkState !== 'undefined' && WorkState) ? WorkState.teamCalendarHubDataKey : '')
                || category.dataKey;
            const viewerCategory = category.view === 'team_calendar' && typeof getWorkCategoryByDataKey === 'function'
                ? (getWorkCategoryByDataKey(activeTeamDataKey) || category)
                : category;
            updateViewerTitle(dataId, viewerCategory);
            renderSidebar();
            setViewerContentMode(isFullBleed ? 'full-bleed' : 'default');
            const headerHtml = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${accent};"></span>
                        ${category.title}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${category.desc || ''}</p>
                </div>
            `;
            const sectionRenderer = KpiRuntime?.getSectionRenderer?.(dataId);
            if (category.dataKey && typeof sectionRenderer === 'function') {
                sectionRenderer(category, renderContext);
            } else {
                const defaultContentDecorator = KpiRuntime?.getDefaultContentDecorator?.(dataId);
                const decoratorHtml = typeof defaultContentDecorator === 'function'
                    ? (defaultContentDecorator(category, renderContext) || '')
                    : '';
                if (isFullBleed) {
                    contentContainer.innerHTML = `${category.content}`;
                } else {
                    contentContainer.innerHTML = `
                    ${headerHtml}
                    ${decoratorHtml}
                    <div class="prose max-w-none text-slate-700">
                        ${category.content}
                    </div>
                    `;
                }
            }
            // Util/equip follow-up initialization is owned by the domain runtime files.
            KpiRuntime?.runSectionInitializers?.(dataId, renderContext);
            KpiRuntime?.runViewChangeHandlers?.(renderContext);
            mainScroll.scrollTop = 0;
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
        }

        bindBackspaceGoHomeHotkey();
        bindGlobalSaveButton();
        bindGlobalSaveHotkey();
        bindGlobalSaveRefreshHooks();
        renderGlobalSaveUi({ forceDefault: true });
        KpiRuntime?.runBootTasks?.();
        goHome();
