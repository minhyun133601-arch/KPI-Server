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
            if (key === 'work' && getNavigationSelectionSectionId() !== 'work') {
                let teamDataKey = String((typeof WorkState !== 'undefined' && WorkState)
                    ? (WorkState.teamCalendarHubDataKey || '')
                    : '').trim();
                if (typeof applyWorkTeamCalendarMode === 'function') {
                    const currentMode = typeof getWorkTeamCalendarMode === 'function'
                        ? getWorkTeamCalendarMode()
                        : 'detail';
                    teamDataKey = String(applyWorkTeamCalendarMode(currentMode) || teamDataKey || '').trim();
                }
                if (!teamDataKey) {
                    teamDataKey = String(AppData?.work?.categories?.[0]?.dataKey || 'work_team_calendar_team1_part1').trim();
                }
                SidebarTreeState.expandedSections[key] = true;
                selectCategory('work', 0, { teamDataKey });
                return;
            }
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
                .filter(entry => entry.category?.navHidden !== true)
                .filter(entry => entry.category?.ownerOnly !== true || canShowOwnerWorkspace());
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
                const shouldKeepDirectLaunchSubmenuVisible = entry.section?.directLaunch === true && navCategories.length > 0;
                const actionIcon = entry.section?.directLaunch === true
                    ? 'fa-arrow-up-right-from-square'
                    : 'fa-chevron-right';
                const sectionAction = entry.section?.directLaunch === true
                    ? `openSection('${entry.id}')`
                    : `setDashboardSection('${entry.id}')`;
                return `
                    <div class="dashboard-tree-group${isActive ? ' active' : ''}${shouldKeepDirectLaunchSubmenuVisible ? ' is-expanded' : ''}" style="--section-color:${entry.accent}; --section-soft:${entry.softAccent};">
                        <button type="button" class="dashboard-tree-main${isActive ? ' active' : ''}" onclick="${sectionAction}">
                            <span class="dashboard-tree-main-head">
                                <span class="dashboard-side-button-icon"><i class="fas ${escapeDashboardHtml(entry.section.icon || 'fa-folder-open')}"></i></span>
                                <span class="dashboard-side-button-copy">
                                    <span class="dashboard-side-button-label">${escapeDashboardHtml(entry.section.name || entry.id)}</span>
                                </span>
                            </span>
                            <span class="dashboard-tree-chevron"><i class="fas ${actionIcon}"></i></span>
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

        function getAppHistorySectionId(value = '') {
            const normalized = String(value || '').trim();
            if (!normalized) return '';
            return getDashboardSections().some(entry => entry.id === normalized) ? normalized : '';
        }

        function normalizeAppHistoryIndex(value, fallback = -1) {
            const nextValue = Number(value);
            return Number.isFinite(nextValue) ? Math.trunc(nextValue) : fallback;
        }

        function sanitizeAppHistoryRoute(route = null) {
            const view = String(route?.view || '').trim();
            if (view === 'home' || !route || typeof route !== 'object') {
                return { view: 'home' };
            }

            const sectionId = getAppHistorySectionId(route.sectionId);
            if (!sectionId || !AppData[sectionId]) {
                return { view: 'home' };
            }

            if (view === 'category') {
                const categories = Array.isArray(AppData[sectionId]?.categories) ? AppData[sectionId].categories : [];
                const categoryIndex = normalizeAppHistoryIndex(route.categoryIndex, -1);
                if (categoryIndex >= 0 && categoryIndex < categories.length) {
                    const navSectionId = getAppHistorySectionId(route.navSectionId) || sectionId;
                    const navCategoryIndex = normalizeAppHistoryIndex(route.navCategoryIndex, categoryIndex);
                    return {
                        view: 'category',
                        sectionId,
                        categoryIndex,
                        teamDataKey: String(route.teamDataKey || '').trim(),
                        navSectionId,
                        navCategoryIndex,
                        navTeamDataKey: String(route.navTeamDataKey || route.teamDataKey || '').trim()
                    };
                }
            }

            return { view: 'section', sectionId };
        }

        function getCurrentAppRoute() {
            const sectionId = getAppHistorySectionId(activeSectionId);
            if (!sectionId) {
                return { view: 'home' };
            }
            if (Number(activeCategoryIndex) >= 0) {
                const navSectionId = getNavigationSelectionSectionId();
                const navCategoryIndex = navSectionId
                    ? getNavigationSelectionCategoryIndex(navSectionId)
                    : -1;
                const teamDataKey = String(
                    getNavigationSelectionTeamDataKey(navSectionId, navCategoryIndex)
                    || ((typeof WorkState !== 'undefined' && WorkState) ? WorkState.teamCalendarHubDataKey : '')
                    || activeRenderContext?.category?.dataKey
                    || ''
                ).trim();
                return sanitizeAppHistoryRoute({
                    view: 'category',
                    sectionId,
                    categoryIndex: activeCategoryIndex,
                    teamDataKey,
                    navSectionId: navSectionId || sectionId,
                    navCategoryIndex: navCategoryIndex >= 0 ? navCategoryIndex : activeCategoryIndex,
                    navTeamDataKey: getNavigationSelectionTeamDataKey(navSectionId, navCategoryIndex) || teamDataKey
                });
            }
            return { view: 'section', sectionId };
        }

        function getAppHistoryRouteKey(route = null) {
            const normalized = sanitizeAppHistoryRoute(route);
            if (normalized.view === 'home') return 'home';
            if (normalized.view === 'section') return `section:${normalized.sectionId}`;
            return [
                'category',
                normalized.sectionId,
                normalized.categoryIndex,
                normalized.teamDataKey,
                normalized.navSectionId,
                normalized.navCategoryIndex,
                normalized.navTeamDataKey
            ].join(':');
        }

        function buildAppHistoryUrl(route = null) {
            const normalized = sanitizeAppHistoryRoute(route);
            const params = new URLSearchParams();
            params.set('view', normalized.view);
            if (normalized.sectionId) params.set('section', normalized.sectionId);
            if (normalized.view === 'category') {
                params.set('category', String(normalized.categoryIndex));
                if (normalized.teamDataKey) params.set('team', normalized.teamDataKey);
                if (normalized.navSectionId && normalized.navSectionId !== normalized.sectionId) {
                    params.set('navSection', normalized.navSectionId);
                }
                if (Number(normalized.navCategoryIndex) !== Number(normalized.categoryIndex)) {
                    params.set('navCategory', String(normalized.navCategoryIndex));
                }
                if (normalized.navTeamDataKey && normalized.navTeamDataKey !== normalized.teamDataKey) {
                    params.set('navTeam', normalized.navTeamDataKey);
                }
            }
            const locationMeta = browser?.getLocationMeta?.() || {};
            const basePath = `${locationMeta.pathname || ''}${locationMeta.search || ''}`;
            return `${basePath || ''}#kpi?${params.toString()}`;
        }

        function buildAppHistoryState(route = null) {
            const normalized = sanitizeAppHistoryRoute(route);
            AppHistoryState.sequence += 1;
            return {
                __kpiApp: AppHistoryState.namespace,
                sequence: AppHistoryState.sequence,
                route: normalized
            };
        }

        function isAppHistoryState(state = null) {
            return state && state.__kpiApp === AppHistoryState.namespace && state.route;
        }

        function parseAppHistoryHash(hash = '') {
            const value = String(hash || '').trim();
            if (!value.startsWith('#kpi?')) return null;
            const params = new URLSearchParams(value.slice(5));
            const view = String(params.get('view') || '').trim();
            if (view === 'home') return { view: 'home' };
            const route = {
                view,
                sectionId: params.get('section') || '',
                categoryIndex: params.get('category') || -1,
                teamDataKey: params.get('team') || '',
                navSectionId: params.get('navSection') || '',
                navCategoryIndex: params.get('navCategory') || -1,
                navTeamDataKey: params.get('navTeam') || ''
            };
            return sanitizeAppHistoryRoute(route);
        }

        function commitAppHistoryRoute(route = null, options = {}) {
            if (AppHistoryState.applying && options.force !== true) return;
            const normalized = sanitizeAppHistoryRoute(route || getCurrentAppRoute());
            const routeKey = getAppHistoryRouteKey(normalized);
            if (options.force !== true && routeKey === AppHistoryState.lastRouteKey) return;
            const state = buildAppHistoryState(normalized);
            const url = buildAppHistoryUrl(normalized);
            if (options.replace === true) {
                browser?.replaceHistoryState?.(state, '', url);
            } else {
                browser?.pushHistoryState?.(state, '', url);
            }
            AppHistoryState.lastRouteKey = routeKey;
        }

        function syncAppHistoryAfterNavigation(options = {}) {
            if (options.__skipHistory === true || AppHistoryState.applying) return;
            commitAppHistoryRoute(getCurrentAppRoute(), {
                replace: options.__replaceHistory === true,
                force: options.__forceHistory === true
            });
        }

        function applyAppHistoryRoute(route = null) {
            const normalized = sanitizeAppHistoryRoute(route);
            AppHistoryState.applying = true;
            try {
                if (normalized.view === 'home') {
                    goHome({ __skipHistory: true });
                    return true;
                }
                if (normalized.view === 'category') {
                    selectCategory(normalized.sectionId, normalized.categoryIndex, {
                        teamDataKey: normalized.teamDataKey,
                        __navSectionId: normalized.navSectionId || normalized.sectionId,
                        __navCategoryIndex: normalized.navCategoryIndex,
                        __navTeamDataKey: normalized.navTeamDataKey || normalized.teamDataKey,
                        __skipHistory: true
                    });
                    return true;
                }
                openSection(normalized.sectionId, { __skipHistory: true });
                return true;
            } finally {
                AppHistoryState.applying = false;
                AppHistoryState.lastRouteKey = getAppHistoryRouteKey(normalized);
            }
        }

        function pushCurrentAppHistoryEntry() {
            commitAppHistoryRoute(getCurrentAppRoute(), { force: true });
        }

        function handleAppHistoryPopState(event) {
            if (hasOpenModalLayer()) {
                closeGlobalSectionShortcutLayers({ confirm: true });
                pushCurrentAppHistoryEntry();
                return;
            }
            const state = event?.state || null;
            if (!isAppHistoryState(state)) return;
            applyAppHistoryRoute(state.route);
        }

        function bindAppHistoryNavigation() {
            if (AppHistoryState.bound || browser?.getFlag?.('__appHistoryNavigationListener')) return;
            AppHistoryState.bound = true;
            browser?.setFlag?.('__appHistoryNavigationListener');
            browser?.addWindowEventListener?.('popstate', handleAppHistoryPopState);
        }

        function initializeAppHistoryState() {
            const existingState = browser?.getCurrentHistoryState?.();
            const locationMeta = browser?.getLocationMeta?.() || {};
            const initialRoute = isAppHistoryState(existingState)
                ? sanitizeAppHistoryRoute(existingState.route)
                : (parseAppHistoryHash(locationMeta.hash) || getCurrentAppRoute());
            const currentKey = getAppHistoryRouteKey(getCurrentAppRoute());
            const initialKey = getAppHistoryRouteKey(initialRoute);
            if (initialKey !== currentKey) {
                applyAppHistoryRoute(initialRoute);
            }
            commitAppHistoryRoute(getCurrentAppRoute(), { replace: true, force: true });
        }

        function navigateAppBack() {
            if (hasOpenModalLayer()) {
                return closeGlobalSectionShortcutLayers({ confirm: true }) !== false;
            }
            if (getAppHistoryRouteKey(getCurrentAppRoute()) === 'home') {
                return false;
            }
            if (typeof browser?.goHistoryBack === 'function') {
                browser.goHistoryBack();
                return true;
            }
            goHome();
            return true;
        }

        function setDashboardSection(sectionId) {
            const normalizedSectionId = getDashboardSectionKey(sectionId);
            const section = AppData[normalizedSectionId];
            if (section?.directLaunch === true) {
                openCategoryLaunch(section);
                return;
            }
            DashboardHomeState.sectionId = normalizedSectionId;
            renderDashboardHome();
        }

        function openSectionCategory(sectionId, categoryIndex = 0) {
            const normalizedIndex = Number.isFinite(Number(categoryIndex)) ? Number(categoryIndex) : 0;
            const data = AppData[sectionId];
            if (!data) return;
            SidebarTreeState.expandedSections[sectionId] = true;
            selectCategory(sectionId, normalizedIndex, { __allowLaunch: true });
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

        function openSection(id, options = {}) {
            const data = AppData[id];
            if (!data) return;
            if (data.directLaunch === true) {
                openCategoryLaunch(data);
                return;
            }
            setNavigationSelection(id, -1);
            SidebarTreeState.expandedSections[id] = true;
            renderDashboardSideNav();
            document.getElementById('dashboard')?.classList.add('hidden-view');
            if (data.categories && data.categories.length > 0) {
                const defaultOptions = KpiRuntime?.getDefaultOpenOptions?.(id, { section: data }) || {};
                selectCategory(data.id, 0, {
                    ...defaultOptions,
                    __skipHistory: options.__skipHistory === true
                });
                return;
            }
            activeSectionId = id;
            activeCategoryIndex = -1;
            activeRenderContext = null;
            updateViewerTitle(id, null);
            renderSidebar();
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
            syncAppHistoryAfterNavigation(options);
        }

        function goHome(options = {}) {
            void browser?.destroyIntegratedMeteringMount?.();
            activeSectionId = null;
            activeCategoryIndex = -1;
            setNavigationSelection('', -1, { teamDataKey: '' });
            document.getElementById('dashboard')?.classList.add('hidden-view');
            activeRenderContext = null;
            collapseSidebarSections();
            updateViewerTitle();
            renderSidebar();
            renderViewerHome();
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
            syncAppHistoryAfterNavigation(options);
        }
