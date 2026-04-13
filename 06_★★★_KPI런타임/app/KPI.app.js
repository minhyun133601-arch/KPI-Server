        // ----------------------------------------------------------------
        // [\uC571 \uB85C\uC9C1]
        // ----------------------------------------------------------------

        const KpiRuntime = window.KpiRuntime;
        let activeRenderContext = null;
        let globalSaveRefreshTimer = null;
        const GlobalSaveUiState = {
            busy: false,
            activeAction: null,
            providerKey: '',
            message: '\uD604\uC7AC \uD654\uBA74\uC740 \uC800\uC7A5 \uB300\uC0C1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
            tone: ''
        };
        const OWNER_RECORDS_TAB_KEYS = Object.freeze({
            LOGIN: 'login',
            USERS: 'users'
        });
        const OwnerRecordsState = {
            isOwner: false,
            panelOpen: false,
            loading: false,
            loaded: false,
            activeTab: OWNER_RECORDS_TAB_KEYS.LOGIN,
            loginHistory: [],
            users: [],
            errorMessage: ''
        };
        const RuntimeAuthState = {
            busy: false
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
        const COMPANY_LOGO_SRC = '\u203B_\uACF5\uC6A9\uC790\uC0B0/\uB85C\uACE0.jpg';
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
            target.textContent = `理쒖쥌 ?섏젙: ${formatDashboardDateTime(getLatestRecentUpdateValue())}`;
        }

        function getRuntimeCurrentUser() {
            const runtimeConfig = KpiRuntime?.getServerRuntimeConfig?.() || null;
            const currentUser = runtimeConfig?.auth?.currentUser;
            return currentUser && typeof currentUser === 'object' ? currentUser : null;
        }

        function hasOwnerRole(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return false;
            if (currentUser.isOwner === true) return true;
            return Array.isArray(currentUser.roles) && currentUser.roles.includes('owner');
        }

        function getRuntimeAuthElements() {
            return {
                dashboardBar: document.getElementById('dashboard-auth-bar'),
                dashboardIdentity: document.getElementById('dashboard-auth-identity'),
                dashboardRole: document.getElementById('dashboard-auth-role'),
                dashboardLogout: document.getElementById('dashboard-auth-logout'),
                viewerBar: document.getElementById('viewer-auth-bar'),
                viewerIdentity: document.getElementById('viewer-auth-identity'),
                viewerRole: document.getElementById('viewer-auth-role'),
                viewerLogout: document.getElementById('viewer-auth-logout')
            };
        }

        function getRuntimeAuthIdentityLabel(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return '';
            const username = normalizeOwnerRecordsText(currentUser.username, '');
            const displayName = normalizeOwnerRecordsText(
                currentUser.displayName || currentUser.display_name,
                ''
            );
            if (displayName && username && displayName !== username) {
                return `${displayName} (${username})`;
            }
            return displayName || username;
        }

        function getRuntimeAuthRoleLabel(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return '';
            if (hasOwnerRole(currentUser)) {
                return 'owner';
            }
            const roles = Array.isArray(currentUser.roles)
                ? currentUser.roles.map(role => String(role || '').trim()).filter(Boolean)
                : [];
            if (!roles.length) {
                return 'user';
            }
            return roles.join(', ');
        }

        function renderRuntimeAuthUi() {
            const elements = getRuntimeAuthElements();
            const currentUser = getRuntimeCurrentUser();
            const identityLabel = getRuntimeAuthIdentityLabel(currentUser);
            const roleLabel = getRuntimeAuthRoleLabel(currentUser);
            const isVisible = Boolean(currentUser && identityLabel);
            const logoutLabel = RuntimeAuthState.busy ? 'Signing out...' : 'Logout';

            [
                [elements.dashboardBar, elements.dashboardIdentity, elements.dashboardRole, elements.dashboardLogout],
                [elements.viewerBar, elements.viewerIdentity, elements.viewerRole, elements.viewerLogout]
            ].forEach(([bar, identity, role, logoutButton]) => {
                if (bar) {
                    bar.hidden = !isVisible;
                }
                if (identity) {
                    identity.textContent = identityLabel || '-';
                }
                if (role) {
                    role.textContent = roleLabel || '';
                }
                if (logoutButton) {
                    logoutButton.disabled = RuntimeAuthState.busy;
                    logoutButton.textContent = logoutLabel;
                }
            });
        }

        async function logoutCurrentUser() {
            if (RuntimeAuthState.busy) return;
            RuntimeAuthState.busy = true;
            renderRuntimeAuthUi();

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || payload?.ok !== true) {
                    throw new Error(payload?.error || 'logout_failed');
                }
                window.location.replace('/login');
            } catch (error) {
                console.error('Logout failed.', error);
                RuntimeAuthState.busy = false;
                renderRuntimeAuthUi();
                if (typeof window.alert === 'function') {
                    window.alert('Logout failed. Please try again.');
                }
            }
        }

        function bindRuntimeAuthUi() {
            if (window.__runtimeAuthUiBound) return;
            window.__runtimeAuthUiBound = true;
            const { dashboardLogout, viewerLogout } = getRuntimeAuthElements();
            [dashboardLogout, viewerLogout].forEach(button => {
                button?.addEventListener('click', () => {
                    void logoutCurrentUser();
                });
            });
        }

        function getOwnerRecordsElements() {
            return {
                toggle: document.getElementById('owner-records-toggle'),
                panel: document.getElementById('owner-records-panel'),
                closeButton: document.getElementById('owner-records-close'),
                feedback: document.getElementById('owner-records-feedback'),
                loginTab: document.getElementById('owner-records-tab-login'),
                usersTab: document.getElementById('owner-records-tab-users'),
                loginCount: document.getElementById('owner-records-login-count'),
                usersCount: document.getElementById('owner-records-users-count'),
                loginPane: document.getElementById('owner-records-pane-login'),
                usersPane: document.getElementById('owner-records-pane-users')
            };
        }

        function normalizeOwnerRecordsText(value, fallback = '-') {
            const normalized = String(value || '').trim();
            return normalized || fallback;
        }

        function renderOwnerRoleChips(roles = []) {
            const items = Array.isArray(roles)
                ? roles.map(role => String(role || '').trim()).filter(Boolean)
                : [];
            if (!items.length) {
                return '<span class="owner-records-chip is-neutral">-</span>';
            }
            return `<div class="owner-records-inline-list">${items.map(role => `<span class="owner-records-chip is-neutral">${escapeDashboardHtml(role)}</span>`).join('')}</div>`;
        }

        function renderOwnerStatusChip(label, tone = 'neutral') {
            const toneClass = tone === 'positive' ? ' is-positive' : ' is-neutral';
            return `<span class="owner-records-chip${toneClass}">${escapeDashboardHtml(label)}</span>`;
        }

        function renderOwnerSessionDot(isActive) {
            const statusLabel = isActive
                ? '\uC811\uC18D\uC911'
                : '\uBBF8\uC811\uC18D';
            const toneClass = isActive ? ' is-active' : ' is-inactive';
            return `<span class="owner-records-session-dot${toneClass}" title="${statusLabel}" aria-label="${statusLabel}"></span>`;
        }

        function renderOwnerRecentChanges(entries = []) {
            if (!Array.isArray(entries) || !entries.length) {
                return '<div class="owner-records-primary"><span class="owner-records-sub">\uAE30\uB85D \uC5C6\uC74C</span></div>';
            }
            return entries.map(entry => {
                const changedAt = escapeDashboardHtml(formatDashboardDateTime(entry?.changedAt));
                const changeType = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.changeType));
                const itemLabel = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.itemLabel));
                return `
                    <div class="owner-records-primary owner-records-activity-item">
                        <strong>${changedAt} ${changeType}</strong>
                        <span class="owner-records-sub">${itemLabel}</span>
                    </div>
                `;
            }).join('');
        }

        function buildOwnerLoginHistoryHtml(entries = []) {
            if (!Array.isArray(entries) || !entries.length) {
                return '<div class="owner-records-empty">\uC544\uC9C1 \uAE30\uB85D\uB41C \uB85C\uADF8\uC778 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
            }
            const rows = entries.map(entry => {
                const username = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.username));
                const displayName = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.displayName));
                const ipAddress = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.ipAddress));
                const userAgent = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.userAgent, '\uBE0C\uB77C\uC6B0\uC800 \uC815\uBCF4 \uC5C6\uC74C'));
                const lastSeenAt = formatDashboardDateTime(entry?.lastSeenAt);
                const expiresAt = formatDashboardDateTime(entry?.expiresAt);
                const sessionChip = entry?.sessionActive
                    ? renderOwnerStatusChip('\uC811\uC18D\uC911', 'positive')
                    : renderOwnerStatusChip('\uC885\uB8CC');
                const userChip = entry?.isActive
                    ? renderOwnerStatusChip('\uACC4\uC815 \uD65C\uC131', 'positive')
                    : renderOwnerStatusChip('\uACC4\uC815 \uBE44\uD65C\uC131');
                return `
                    <tr>
                        <td>
                            <div class="owner-records-primary">
                                <strong>${username}</strong>
                                <span class="owner-records-sub">${displayName}</span>
                            </div>
                        </td>
                        <td>${formatDashboardDateTime(entry?.loggedInAt)}</td>
                        <td>${renderOwnerRoleChips(entry?.roles)}</td>
                        <td>
                            <div class="owner-records-primary">
                                <strong>${ipAddress}</strong>
                                <span class="owner-records-sub">${userAgent}</span>
                            </div>
                        </td>
                        <td>
                            <div class="owner-records-inline-list">
                                ${sessionChip}
                                ${userChip}
                            </div>
                            <div class="owner-records-sub">\uB9C8\uC9C0\uB9C9 \uD65C\uB3D9 ${escapeDashboardHtml(lastSeenAt)} / \uB9CC\uB8CC ${escapeDashboardHtml(expiresAt)}</div>
                        </td>
                    </tr>
                `;
            }).join('');
            return `
                <table class="owner-records-table">
                    <thead>
                        <tr>
                            <th>\uC544\uC774\uB514</th>
                            <th>\uB85C\uADF8\uC778 \uC2DC\uAC04</th>
                            <th>\uC5ED\uD560</th>
                            <th>\uC811\uC18D \uC815\uBCF4</th>
                            <th>\uC0C1\uD0DC</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        function buildOwnerUsersHtml(entries = []) {
            if (!Array.isArray(entries) || !entries.length) {
                return '<div class="owner-records-empty">\uB4F1\uB85D\uB41C \uACC4\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
            }
            const rows = entries.map(entry => {
                const username = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.username));
                const displayName = escapeDashboardHtml(normalizeOwnerRecordsText(entry?.displayName));
                const lastAccessAt = escapeDashboardHtml(formatDashboardDateTime(entry?.lastAccessAt));
                const statusChip = entry?.isActive
                    ? renderOwnerStatusChip('\uD65C\uC131', 'positive')
                    : renderOwnerStatusChip('\uBE44\uD65C\uC131');
                return `
                    <tr>
                        <td>
                            <div class="owner-records-primary">
                                <span class="owner-records-account-line">
                                    <strong>${username}</strong>
                                    ${renderOwnerSessionDot(entry?.sessionActive)}
                                </span>
                                <span class="owner-records-sub">${displayName}</span>
                                <span class="owner-records-sub">\uCD5C\uC885 \uC811\uC18D ${lastAccessAt}</span>
                            </div>
                        </td>
                        <td>${renderOwnerRoleChips(entry?.roles)}</td>
                        <td>${statusChip}</td>
                        <td>${renderOwnerRecentChanges(entry?.recentChanges)}</td>
                    </tr>
                `;
            }).join('');
            return `
                <table class="owner-records-table">
                    <thead>
                        <tr>
                            <th>\uC544\uC774\uB514</th>
                            <th>\uC5ED\uD560</th>
                            <th>\uC0C1\uD0DC</th>
                            <th>\uC0DD\uC131/\uC218\uC815</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        function renderOwnerRecordsPanel() {
            const elements = getOwnerRecordsElements();
            const isOwner = hasOwnerRole();
            OwnerRecordsState.isOwner = isOwner;

            if (elements.loginTab?.firstElementChild) {
                elements.loginTab.firstElementChild.textContent = '\uAE30\uB85D';
            }
            if (elements.usersTab?.firstElementChild) {
                elements.usersTab.firstElementChild.textContent = '\uB4F1\uB85D \uACC4\uC815';
            }

            if (elements.toggle) {
                elements.toggle.hidden = !isOwner;
                elements.toggle.classList.toggle('is-active', isOwner && OwnerRecordsState.panelOpen);
                elements.toggle.setAttribute('aria-expanded', isOwner && OwnerRecordsState.panelOpen ? 'true' : 'false');
            }

            if (!isOwner) {
                OwnerRecordsState.panelOpen = false;
                if (elements.panel) {
                    elements.panel.hidden = true;
                }
                return;
            }

            const activeTab = OwnerRecordsState.activeTab === OWNER_RECORDS_TAB_KEYS.USERS
                ? OWNER_RECORDS_TAB_KEYS.USERS
                : OWNER_RECORDS_TAB_KEYS.LOGIN;
            OwnerRecordsState.activeTab = activeTab;

            if (elements.panel) {
                elements.panel.hidden = !OwnerRecordsState.panelOpen;
            }
            if (elements.loginCount) {
                elements.loginCount.textContent = String(OwnerRecordsState.loginHistory.length);
            }
            if (elements.usersCount) {
                elements.usersCount.textContent = String(OwnerRecordsState.users.length);
            }
            if (elements.loginTab) {
                const active = activeTab === OWNER_RECORDS_TAB_KEYS.LOGIN;
                elements.loginTab.classList.toggle('is-active', active);
                elements.loginTab.setAttribute('aria-selected', active ? 'true' : 'false');
            }
            if (elements.usersTab) {
                const active = activeTab === OWNER_RECORDS_TAB_KEYS.USERS;
                elements.usersTab.classList.toggle('is-active', active);
                elements.usersTab.setAttribute('aria-selected', active ? 'true' : 'false');
            }
            if (elements.feedback) {
                const feedbackMessage = OwnerRecordsState.loading
                    ? '\uAE30\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.'
                    : OwnerRecordsState.errorMessage;
                elements.feedback.textContent = feedbackMessage;
                elements.feedback.hidden = !feedbackMessage;
                elements.feedback.classList.toggle('is-error', Boolean(OwnerRecordsState.errorMessage) && !OwnerRecordsState.loading);
            }
            if (elements.loginPane) {
                elements.loginPane.hidden = activeTab !== OWNER_RECORDS_TAB_KEYS.LOGIN;
                elements.loginPane.innerHTML = buildOwnerLoginHistoryHtml(OwnerRecordsState.loginHistory);
            }
            if (elements.usersPane) {
                elements.usersPane.hidden = activeTab !== OWNER_RECORDS_TAB_KEYS.USERS;
                elements.usersPane.innerHTML = buildOwnerUsersHtml(OwnerRecordsState.users);
            }
        }

        async function loadOwnerRecordsOverview(options = {}) {
            if (!OwnerRecordsState.isOwner) return;
            if (OwnerRecordsState.loading) return;
            const shouldForce = options.force === true;
            if (OwnerRecordsState.loaded && !shouldForce) {
                renderOwnerRecordsPanel();
                return;
            }

            OwnerRecordsState.loading = true;
            OwnerRecordsState.errorMessage = '';
            renderOwnerRecordsPanel();

            try {
                const response = await fetch('/api/owner/access-overview?limit=100', {
                    credentials: 'same-origin'
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || payload?.ok !== true) {
                    throw new Error(payload?.error || 'owner_records_load_failed');
                }
                OwnerRecordsState.loginHistory = Array.isArray(payload.loginHistory) ? payload.loginHistory : [];
                OwnerRecordsState.users = Array.isArray(payload.users) ? payload.users : [];
                OwnerRecordsState.loaded = true;
            } catch (error) {
                console.error('Owner records load failed.', error);
                OwnerRecordsState.errorMessage = '\uAE30\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';
            } finally {
                OwnerRecordsState.loading = false;
                renderOwnerRecordsPanel();
            }
        }

        function setOwnerRecordsTab(tabKey) {
            OwnerRecordsState.activeTab = tabKey === OWNER_RECORDS_TAB_KEYS.USERS
                ? OWNER_RECORDS_TAB_KEYS.USERS
                : OWNER_RECORDS_TAB_KEYS.LOGIN;
            renderOwnerRecordsPanel();
        }

        function setOwnerRecordsPanelOpen(nextOpen) {
            if (!OwnerRecordsState.isOwner) return;
            OwnerRecordsState.panelOpen = nextOpen === true;
            renderOwnerRecordsPanel();
            if (OwnerRecordsState.panelOpen) {
                void loadOwnerRecordsOverview({ force: true });
            }
        }

        function bindOwnerRecordsUi() {
            if (window.__ownerRecordsUiBound) return;
            window.__ownerRecordsUiBound = true;
            const { toggle, closeButton, loginTab, usersTab } = getOwnerRecordsElements();
            toggle?.addEventListener('click', () => {
                setOwnerRecordsPanelOpen(!OwnerRecordsState.panelOpen);
            });
            closeButton?.addEventListener('click', () => {
                setOwnerRecordsPanelOpen(false);
            });
            loginTab?.addEventListener('click', () => {
                setOwnerRecordsTab(OWNER_RECORDS_TAB_KEYS.LOGIN);
            });
            usersTab?.addEventListener('click', () => {
                setOwnerRecordsTab(OWNER_RECORDS_TAB_KEYS.USERS);
            });
            document.addEventListener('keydown', evt => {
                if (evt.key !== 'Escape') return;
                if (!OwnerRecordsState.panelOpen) return;
                setOwnerRecordsPanelOpen(false);
            });
            document.addEventListener('click', evt => {
                if (!OwnerRecordsState.panelOpen) return;
                const target = evt.target;
                if (!(target instanceof Element)) return;
                const { toggle: currentToggle, panel } = getOwnerRecordsElements();
                if (panel?.contains(target) || currentToggle?.contains(target)) {
                    return;
                }
                setOwnerRecordsPanelOpen(false);
            }, true);
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
                                <img class="viewer-home-brand-logo" src="${companyLogoSrc}" alt="\uD68C\uC0AC \uB85C\uACE0" />
                            </div>
                        </div>
                        <div class="viewer-home-copy-panel">
                            <h1 class="viewer-home-policy-title">2026\uB144 \uACBD\uC601\uBC29\uCE68</h1>
                            <div class="viewer-home-policy-rule"></div>
                            <div class="viewer-home-policy-points">
                                <p class="viewer-home-policy-line">
                                    <span class="viewer-home-policy-line-icon" aria-hidden="true"><i class="fas fa-arrow-trend-up"></i></span>
                                    <span>\uC0C8\uB85C\uC6B4 \uAE30\uC220\uB825\uC73C\uB85C \uC9C0\uC18D \uC131\uC7A5\uC758 \uAE30\uBC18\uC744 \uAD6C\uCD95\uD569\uC2DC\uB2E4</span>
                                </p>
                                <p class="viewer-home-policy-line viewer-home-policy-line-strong">
                                    <span class="viewer-home-policy-line-icon" aria-hidden="true"><i class="fas fa-brain"></i></span>
                                    <span>AI \uBC0F \uB514\uC9C0\uD138 \uC815\uBCF4\uD654\uB97C \uD1B5\uD574 \uC5C5\uBB34 \uD6A8\uC728\uC744 \uADF9\uB300\uD654\uD569\uC2DC\uB2E4</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <section class="viewer-home-guideline-section" aria-label="\uD589\uB3D9 \uAC15\uB839">
                        <div class="viewer-home-guideline-header">
                            <h2 class="viewer-home-guideline-title">\uC2E0\uC18C\uAC00 \uD589\uB3D9\uAC15\uB839</h2>
                        </div>
                        <div class="viewer-home-guideline-grid">
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-trust">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-handshake"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">\uC2E0\uB8B0(\u4FE1\u983C)</div>
                                    <div class="viewer-home-guideline-quote">\uC131\uC758\uC788\uACE0, \uC774\uD574\uD558\uACE0, \uBBFF\uACE0, \uC758\uC9C0\uD558\uC790</div>
                                    <div class="viewer-home-guideline-tag">\uC131\uC758\uB85C \uB9FA\uC740 \uAD00\uACC4</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>\uCC28\uC774\uC640 \uBD80\uC871\uD568\uC744 \uC778\uC815\uD558\uACE0 \uC2A4\uC2A4\uB85C\uB97C \uB4DC\uB7EC\uB0B4\uB294 \uACB8\uC190\uD55C \uC790\uC138</li>
                                        <li>\uC0C1\uB300\uB97C \uBC30\uB824\uD558\uACE0 \uC874\uC911\uD558\uBA70 \uC774\uD574\uD558\uB824\uB294 \uD0DC\uB3C4</li>
                                        <li>\uC874\uC911, \uC0C1\uB2F4, \uCC45\uC784 \uC788\uB294 \uD589\uB3D9\uC744 \uCDE8\uD558\uB294 \uC790\uC138</li>
                                        <li>\uAC1C\uBC29\uC801\uC774\uACE0 \uB530\uB73B\uD55C \uB9C8\uC74C\uC73C\uB85C \uBC1B\uC544\uB4E4\uC774\uB294 \uC790\uC138</li>
                                    </ul>
                                </div>
                            </article>
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-communication">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-comments"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">\uC18C\uD1B5(\u758F\u901A)</div>
                                    <div class="viewer-home-guideline-quote">\uC0AC\uB78C\uACFC \uB9C8\uC74C\uC744 \uC5F4\uACE0, \uC6C3\uACE0, \uB9D0\uD558\uC790</div>
                                    <div class="viewer-home-guideline-tag">\uC9C4\uC2EC \uC788\uB294 \uB300\uD654</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>\uAD6C\uCCB4\uC801\uC778 \uBB38\uC81C \uD574\uACB0\uACFC \uC2E4\uCC9C\uC73C\uB85C \uC774\uC5B4\uAC00\uB294 \uC790\uC138</li>
                                        <li>\uC790\uBC1C\uC801\uC774\uBA70 \uCE5C\uC808\uD558\uAC8C \uC791\uC5C5\uD558\uACE0 \uD611\uB825\uD558\uB294 \uBAA8\uC2B5</li>
                                        <li>\uACBD\uCCAD\uD558\uACE0 \uC218\uC6A9\uD558\uB294 \uD0DC\uB3C4</li>
                                        <li>\uC9C4\uC815\uC131\uACFC \uACF5\uAC10\uC744 \uBC14\uD0D5\uC73C\uB85C \uD55C \uC8FC\uCCB4\uC801 \uC790\uC138</li>
                                    </ul>
                                </div>
                            </article>
                            <article class="viewer-home-guideline-card viewer-home-guideline-card-value">
                                <div class="viewer-home-guideline-icon"><i class="fas fa-lightbulb"></i></div>
                                <div class="viewer-home-guideline-copy">
                                    <div class="viewer-home-guideline-name">\uAC00\uCE58\uCC3D\uC870(\u50F9\u5024\u5275\u9020)</div>
                                    <div class="viewer-home-guideline-quote">\uC0DD\uAC01\uD558\uACE0 \uB098\uB204\uACE0 \uBC30\uC6B0\uACE0 \uC5F0\uAD6C\uD558\uBA70 \uC2E4\uD589\uD558\uC790</div>
                                    <div class="viewer-home-guideline-tag">\uCC3D\uC758\uC801 \uC131\uC7A5</div>
                                    <ul class="viewer-home-guideline-list">
                                        <li>\uC548\uC804\uC744 \uD1B5\uD574 \uD559\uD558\uACE0 \uC775\uD788\uACE0 \uB2E4\uC591\uD55C \uAE30\uB2A5\uACFC \uC9C0\uC2DD\uC744 \uD68D\uB4DD\uD558\uB294 \uC790\uC138</li>
                                        <li>\uC0DD\uAC01\uACFC \uC815\uBCF4\uB97C \uB098\uB204\uACE0 \uACF5\uC720\uD558\uB294 \uC790\uC138</li>
                                        <li>\uC0C8\uB85C\uC6B4 \uAE30\uC220\uACFC \uD658\uACBD\uC5D0\uC11C \uC544\uC774\uB514\uC5B4\uB97C \uCC3E\uACE0 \uC2E4\uD589\uD558\uB824\uB294 \uC790\uC138</li>
                                        <li>\uCC3D\uC758\uC801\uC778 \uB9C8\uC778\uB4DC\uB85C \uAC00\uCE58\uB97C \uCD94\uAD6C\uD558\uB294 \uD0DC\uB3C4</li>
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
                            <div class="dashboard-empty-state">\uD45C\uC2DC\uD560 \uBAA8\uB4C8\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>
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
                            <div class="dashboard-workspace-copy">\uC67C\uCABD\uC5D0\uC11C \uD558\uC704 \uBA54\uB274\uB97C \uB20C\uB7EC \uBC14\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
                            <div class="dashboard-workspace-meta">${visibleCategoryCount}\uAC1C \uD56D\uBAA9</div>
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
                                    <span class="dashboard-tree-subitem-title">${escapeDashboardHtml(category.title || `\uD56D\uBAA9 ${index + 1}`)}</span>
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

            stageTitle.textContent = selectedEntry?.section?.name || '\uB300\uC2DC\uBCF4\uB4DC';
            stageCount.textContent = `${selectedCategories.length}\uAC1C`;
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
                return '\uB300\uC2DC\uBCF4\uB4DC\uC5D0\uC11C\uB294 \uC800\uC7A5 \uC791\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';
            }
            if (!action) {
                return '\uD604\uC7AC \uD654\uBA74\uC740 \uC800\uC7A5 \uB300\uC0C1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';
            }
            return action.statusText || '\uD604\uC7AC \uD654\uBA74 \uB370\uC774\uD130\uB97C \uC911\uC559 \uC11C\uBC84\uC5D0 \uC800\uC7A5\uD569\uB2C8\uB2E4.';
        }

        function getDefaultGlobalSaveButtonLabel(action) {
            return action?.buttonLabel || '\uC800\uC7A5';
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
                ? '\uC800\uC7A5 \uC911...'
                : getDefaultGlobalSaveButtonLabel(action);
            button.title = action?.title || GlobalSaveUiState.message || '\uC800\uC7A5';
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
            GlobalSaveUiState.message = '\uC911\uC559 \uC11C\uBC84\uC5D0 \uC800\uC7A5 \uC911\uC785\uB2C8\uB2E4...';
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
                    label: action.historyLabel || action.buttonLabel || action.label || '\uC800\uC7A5',
                    trigger: options.trigger || 'manual'
                });
                persistGlobalRecentUpdateRecord(savedRecord);
                const savedTime = savedRecord?.savedAt
                    ? new Date(savedRecord.savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                    : '';
                GlobalSaveUiState.message = savedTime
                    ? `\uC800\uC7A5\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. ${savedTime}`
                    : '\uC800\uC7A5\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                GlobalSaveUiState.tone = '';
                successAlertMessage = '\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.';
                return true;
            } catch (error) {
                console.error('KPI global save failed.', error);
                GlobalSaveUiState.message = action.errorMessage || '\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
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
            if (normalizedItemKey === 'electric') return UtilReportState.electricTeam === 'all' ? '\uC804\uCCB4' : (UtilReportState.electricTeam || '\uC804\uCCB4');
            if (normalizedItemKey === 'gas') return UtilReportState.gasTeam === 'all' ? '\uC804\uCCB4' : (UtilReportState.gasTeam || '\uC804\uCCB4');
            if (normalizedItemKey === 'waste') return UtilReportState.wasteTeam === 'all' ? '\uC804\uCCB4' : (UtilReportState.wasteTeam || '\uC804\uCCB4');
            return UtilReportBuilderVizState.team || '\uC804\uCCB4';
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
                    <button id="viewer-sidebar-toggle" type="button" class="sidebar-group-toggle sidebar-viewer-toggle" onclick="toggleViewerSidebar()" aria-label="\uB2EB\uAE30" title="\uB2EB\uAE30" aria-pressed="false">
                        <span class="sidebar-group-toggle-main">
                            <span class="sidebar-group-icon"><i class="fas fa-angles-left" aria-hidden="true"></i></span>
                            <span id="viewer-sidebar-toggle-label" class="sidebar-group-label">\uB2EB\uAE30</span>
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
                                                                    <span>${escapeDashboardHtml(teamCategory.title || `\uD300 ${teamIndex + 1}`)}</span>
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
                                                        <span>${escapeDashboardHtml(category.title || `\uD56D\uBAA9 ${index + 1}`)}</span>
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
                    label: '\uC5F4\uAE30',
                    icon: 'fa-angles-right'
                }
                : {
                    label: '\uB2EB\uAE30',
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
        bindRuntimeAuthUi();
        bindOwnerRecordsUi();
        renderRuntimeAuthUi();
        renderGlobalSaveUi({ forceDefault: true });
        renderOwnerRecordsPanel();
        KpiRuntime?.runBootTasks?.();
        goHome();

