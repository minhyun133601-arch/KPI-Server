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
