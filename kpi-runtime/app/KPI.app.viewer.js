        function getUtilSidebarReportShortcutTeam(itemKey = '') {
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey || UtilReportState.builderItemKey || 'electric');
            const directSection = document.querySelector(`[data-util-dual="${normalizedItemKey}"] [data-util-dual-section="combined"]`);
            const activeTeam = String(directSection?.dataset?.reportTeam || directSection?.dataset?.activeTeam || '').trim();
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

        function getActiveUtilityTeamSelectorItemKey() {
            if (getNavigationSelectionSectionId() !== 'util') return '';
            const categoryIndex = getNavigationSelectionCategoryIndex('util');
            const category = Array.isArray(AppData?.util?.categories) ? AppData.util.categories[categoryIndex] : null;
            const itemKey = String(category?.reportShortcutKey || '').trim().toLowerCase();
            return ['electric', 'gas', 'waste'].includes(itemKey) ? itemKey : '';
        }

        function getSidebarTeamCategories(sectionEntry, category = null) {
            if (sectionEntry?.id !== 'work' || category?.view !== 'team_calendar') return [];
            if (typeof getWorkTeamCalendarCategoryList === 'function') {
                const teamCategories = getWorkTeamCalendarCategoryList();
                const activeUtilityItemKey = getActiveUtilityTeamSelectorItemKey();
                if (!activeUtilityItemKey) return teamCategories;
                const currentMode = typeof getWorkTeamCalendarMode === 'function'
                    ? getWorkTeamCalendarMode()
                    : 'detail';
                const visibleKeys = typeof getWorkTeamCalendarUtilityVisibleDataKeys === 'function'
                    ? getWorkTeamCalendarUtilityVisibleDataKeys(currentMode, activeUtilityItemKey)
                    : ['work_team_calendar_team1_part1', 'work_team_calendar_team1_part2', 'work_team_calendar_team2', 'work_team_calendar_team3', 'work_team_calendar_overview'];
                return teamCategories
                    .filter((teamCategory) => visibleKeys.includes(String(teamCategory?.dataKey || '').trim()))
                    .map((teamCategory) => {
                        if (String(teamCategory?.dataKey || '').trim() !== 'work_team_calendar_overview') {
                            return teamCategory;
                        }
                        return {
                            ...teamCategory,
                            title: '통합',
                            processLabel: '통합',
                            processTag: '통합'
                        };
                    });
            }
            return Array.isArray(sectionEntry.section?.teamCategories) ? sectionEntry.section.teamCategories : [];
        }

        function getSidebarTeamModeToggleHtml(sectionEntry, category = null, categoryIndex = -1) {
            if (sectionEntry?.id !== 'work' || category?.view !== 'team_calendar') return '';
            if (getActiveUtilityTeamSelectorItemKey() === 'waste') return '';
            const modeMeta = typeof getWorkTeamCalendarModeMeta === 'function'
                ? getWorkTeamCalendarModeMeta()
                : { mode: 'detail', label: '\uD300\uBCC4', nextLabel: '\uACF5\uC815\uBCC4' };
            const buttonClass = modeMeta.mode === 'group'
                ? ' is-group'
                : (modeMeta.mode === 'process' ? ' is-process' : '');
            const label = `${modeMeta.label} \uBAA8\uB4DC, ${modeMeta.nextLabel} \uBCF4\uAE30\uB85C \uC804\uD658`;
            return `
                <div class="sidebar-mode-toggle-row">
                    <button
                        type="button"
                        class="sidebar-mode-toggle-button${buttonClass}"
                        onclick="toggleSidebarWorkTeamMode()"
                        aria-label="${escapeDashboardHtml(label)}"
                        title="${escapeDashboardHtml(label)}"
                        data-mode="${escapeDashboardHtml(modeMeta.mode || 'detail')}"
                        id="cat-btn-${sectionEntry.id}-${categoryIndex}-mode-toggle"
                    >
                        <i class="fas fa-right-left" aria-hidden="true"></i>
                        <span class="sidebar-mode-toggle-text">${escapeDashboardHtml(modeMeta.label || '\uD300\uBCC4')}</span>
                    </button>
                </div>
            `;
        }

        function toggleSidebarWorkTeamMode() {
            if (typeof toggleWorkTeamCalendarDisplayMode !== 'function') return;
            const activeUtilityItemKey = getActiveUtilityTeamSelectorItemKey();
            const targetDataKey = toggleWorkTeamCalendarDisplayMode();
            if (
                activeUtilityItemKey
                && targetDataKey
                && browser?.canApplyUtilSidebarSelection?.() === true
            ) {
                browser?.applyUtilSidebarSelectionToCurrentView?.(activeUtilityItemKey, targetDataKey);
            }
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
            const activeUtilityItemKey = getActiveUtilityTeamSelectorItemKey();
            if (
                sectionId === 'work'
                && activeUtilityItemKey
                && browser?.canApplyUtilSidebarSelection?.() === true
            ) {
                const handled = browser?.applyUtilSidebarSelectionToCurrentView?.(activeUtilityItemKey, teamDataKey);
                if (handled) return;
            }
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
            const activeUtilityItemKey = getActiveUtilityTeamSelectorItemKey();
            const utilitySelectedTeamDataKey = activeUtilityItemKey
                ? String(browser?.getUtilSidebarSelectionWorkDataKey?.(activeUtilityItemKey) || '').trim()
                : '';
            sidebar.innerHTML = `
                <div class="sidebar-tree-shell">
                    <button id="viewer-sidebar-toggle" type="button" class="sidebar-group-toggle sidebar-viewer-toggle" onclick="toggleViewerSidebar()" aria-label="닫기" title="닫기" aria-pressed="false">
                        <span class="sidebar-group-toggle-main">
                            <span class="sidebar-group-icon"><i class="fas fa-angles-left" aria-hidden="true"></i></span>
                        </span>
                    </button>
                    ${sections.map(sectionEntry => {
                        const isUtilityTeamSelectorSection = sectionEntry.id === 'work' && !!activeUtilityItemKey;
                        if (isUtilityTeamSelectorSection) {
                            SidebarTreeState.expandedSections.work = true;
                        }
                        const renderableCategories = getSidebarRenderableCategories(sectionEntry);
                        const shouldKeepDirectLaunchSubmenuVisible = sectionEntry.section?.directLaunch === true && renderableCategories.length > 0;
                        const isExpanded = isUtilityTeamSelectorSection
                            || SidebarTreeState.expandedSections[sectionEntry.id] === true
                            || shouldKeepDirectLaunchSubmenuVisible;
                        const isActiveSection = selectedSectionId === sectionEntry.id;
                        const actionIcon = sectionEntry.section?.directLaunch === true
                            ? 'fa-arrow-up-right-from-square'
                            : 'fa-chevron-right';
                        const sectionAction = sectionEntry.section?.directLaunch === true
                            ? `openSection('${sectionEntry.id}')`
                            : `toggleSidebarSection('${sectionEntry.id}')`;
                        return `
                            <div class="sidebar-group${isExpanded ? ' is-expanded' : ''}" style="--cat-color:${sectionEntry.accent}; --cat-soft:${sectionEntry.softAccent};">
                                <button type="button" class="sidebar-group-toggle${isActiveSection ? ' is-active' : ''}" onclick="${sectionAction}">
                                    <span class="sidebar-group-toggle-main">
                                        <span class="sidebar-group-icon"><i class="fas ${escapeDashboardHtml(sectionEntry.section.icon || 'fa-folder-open')}"></i></span>
                                        <span class="sidebar-group-label">${escapeDashboardHtml(sectionEntry.section.name || sectionEntry.id)}</span>
                                    </span>
                                    <span class="sidebar-group-chevron"><i class="fas ${actionIcon}"></i></span>
                                </button>
                                <div class="sidebar-group-items">
                                    ${renderableCategories.map(({ category, index }) => {
                                        const categoryColor = category.color || sectionEntry.accent;
                                        const isActiveCategory = isActiveSection && getNavigationSelectionCategoryIndex(sectionEntry.id) === index;
                                        const teamCategories = getSidebarTeamCategories(sectionEntry, category);
                                        const activeTeamDataKey = getActiveSidebarTeamDataKey(sectionEntry.id, index);
                                        if (teamCategories.length) {
                                            return `
                                                <div class="sidebar-category-branch">
                                                    ${teamCategories.map((teamCategory, teamIndex) => {
                                                        const teamColor = teamCategory.color || categoryColor;
                                                        const teamDataKey = String(teamCategory.dataKey || '').trim();
                                                        const isActiveTeam = (isActiveCategory && activeTeamDataKey === teamDataKey)
                                                            || (sectionEntry.id === 'work' && utilitySelectedTeamDataKey === teamDataKey);
                                                        return `
                                                            <button type="button" class="sidebar-item sidebar-item-nested sidebar-item-team${isActiveTeam ? ' active' : ''}" style="--cat-color:${teamColor};" onclick="openSidebarTeamCategory('${sectionEntry.id}', ${index}, '${teamCategory.dataKey}')" id="cat-btn-${sectionEntry.id}-${index}-team-${teamIndex}"${isActiveTeam ? ' aria-current="page"' : ''}>
                                                                <span class="sidebar-item-main">
                                                                    <i class="fas ${escapeDashboardHtml(teamCategory.icon || 'fa-layer-group')} w-5 text-center"></i>
                                                                    <span>${escapeDashboardHtml(teamCategory.title || `팀 ${teamIndex + 1}`)}</span>
                                                                </span>
                                                            </button>
                                                        `;
                                                    }).join('')}
                                                    ${getSidebarTeamModeToggleHtml(sectionEntry, category, index)}
                                                </div>
                                            `;
                                        }
                                        return `
                                            <div class="sidebar-category-branch">
                                                <button type="button" class="sidebar-item sidebar-item-nested${isActiveCategory ? ' active' : ''}" style="--cat-color:${categoryColor};" onclick="selectCategory('${sectionEntry.id}', ${index}, { __allowLaunch: true })" id="cat-btn-${sectionEntry.id}-${index}"${isActiveCategory ? ' aria-current="page"' : ''}>
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
                    <div class="sidebar-reset-row">
                        <button
                            type="button"
                            class="sidebar-item sidebar-item-nested sidebar-item-reset"
                            onclick="resetSidebarNavigation()"
                            id="viewer-sidebar-reset"
                            aria-label="목차 초기화"
                            title="목차 초기화"
                        >
                            <span class="sidebar-item-main">
                                <i class="fas fa-rotate-left w-5 text-center" aria-hidden="true"></i>
                                <span>목차 초기화</span>
                            </span>
                        </button>
                    </div>
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
        }

        function toggleViewerSidebar() {
            ViewerLayoutState.sidebarCollapsed = !ViewerLayoutState.sidebarCollapsed;
            syncViewerSidebarUi();
        }

        function resetSidebarNavigation() {
            goHome();
        }

        function setViewerContentMode(mode = 'default') {
            const mainScroll = document.getElementById('main-scroll');
            const contentContainer = document.getElementById('content-container');
            if (!mainScroll || !contentContainer) return;
            const isFullBleed = mode === 'full-bleed';
            mainScroll.classList.toggle('content-area-full-bleed', isFullBleed);
            contentContainer.classList.toggle('content-card-full-bleed', isFullBleed);
        }

        function parseLaunchDimension(value, fallback, minimum = 960, maximum = 2400) {
            const parsed = Number.parseInt(String(value || ''), 10);
            if (!Number.isInteger(parsed)) return fallback;
            return Math.max(minimum, Math.min(maximum, parsed));
        }

        function buildCategoryPopupFeatures(category = null) {
            const {
                availableWidth,
                availableHeight,
                hostLeft,
                hostTop,
                hostWidth,
                hostHeight
            } = browser?.getWindowPlacement?.() || {
                availableWidth: 1600,
                availableHeight: 1000,
                hostLeft: 0,
                hostTop: 0,
                hostWidth: 1600,
                hostHeight: 1000
            };
            const popupWidth = parseLaunchDimension(category?.launchWindowWidth, Math.min(1540, availableWidth), 1040, Math.max(1040, availableWidth));
            const popupHeight = parseLaunchDimension(category?.launchWindowHeight, Math.min(980, availableHeight), 760, Math.max(760, availableHeight));
            const popupLeft = hostLeft + Math.max(24, Math.round((hostWidth - popupWidth) / 2));
            const popupTop = hostTop + Math.max(24, Math.round((hostHeight - popupHeight) / 2));
            return [
                'popup=yes',
                `width=${popupWidth}`,
                `height=${popupHeight}`,
                `left=${popupLeft}`,
                `top=${popupTop}`,
                'resizable=yes',
                'scrollbars=yes'
            ].join(',');
        }

        function openCategoryLaunch(category = null) {
            const launchUrl = String(category?.launchUrl || '').trim();
            if (!launchUrl) return false;
            const launchTarget = String(category?.launchTarget || '').trim().toLowerCase();
            const launchWindowName = String(category?.launchWindowName || '').trim();
            if (launchTarget === 'popup') {
                const popupWindow = browser?.openWindow?.(
                    launchUrl,
                    launchWindowName || 'kpi-owner-ops-console',
                    buildCategoryPopupFeatures(category)
                );
                if (popupWindow) {
                    try {
                        popupWindow.focus();
                    } catch (error) {
                        // Ignore focus failures and keep the popup open.
                    }
                    return true;
                }
            }
            const nextWindow = browser?.openWindow?.(launchUrl, '_blank', 'noopener,noreferrer');
            if (!nextWindow) {
                browser?.assignLocation?.(launchUrl);
                return false;
            }
            return true;
        }

        browser?.exposeOwnerToolWindow?.(function openOwnerToolWindow(launchUrl = '', launchTitle = '', launchWindowName = 'kpi-owner-ops-console') {
            return openCategoryLaunch({
                title: String(launchTitle || '').trim(),
                launchUrl: String(launchUrl || '').trim(),
                launchTarget: 'popup',
                launchWindowName: String(launchWindowName || 'kpi-owner-ops-console').trim(),
                launchWindowWidth: 1540,
                launchWindowHeight: 980
            });
        });

        function selectCategory(dataId, index, options = {}) {
            void browser?.destroyIntegratedMeteringMount?.();
            const data = AppData[dataId];
            if (!data || !Array.isArray(data.categories) || !data.categories[index]) return;
            const category = data.categories[index];
            const utilityItemKey = dataId === 'util'
                ? String(category?.reportShortcutKey || '').trim().toLowerCase()
                : '';
            const requestedNavSectionId = String(options.__navSectionId || dataId || '').trim();
            const navSectionId = getDashboardSections().some((entry) => entry.id === requestedNavSectionId)
                ? requestedNavSectionId
                : '';
            const navCategoryIndex = navSectionId
                ? (Number.isFinite(Number(options.__navCategoryIndex)) ? Number(options.__navCategoryIndex) : index)
                : -1;
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
            if (options.__allowLaunch === true) {
                openCategoryLaunch(category);
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
            if (['electric', 'gas', 'waste'].includes(utilityItemKey)) {
                SidebarTreeState.expandedSections.work = true;
                if (utilityItemKey === 'waste' && typeof applyWorkTeamCalendarMode === 'function') {
                    applyWorkTeamCalendarMode('group');
                }
            }
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
            if (
                ['electric', 'gas', 'waste'].includes(utilityItemKey)
                && browser?.canSyncUtilReportBuilderVizPopup?.() === true
            ) {
                browser?.syncUtilReportBuilderVizPopupFromSelection?.(utilityItemKey);
            }
            mainScroll.scrollTop = 0;
            scheduleGlobalSaveUiRefresh({ forceDefault: true });
        }
