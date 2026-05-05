        function getRuntimeAuthElements() {
            return {
                dashboardBar: document.getElementById('dashboard-auth-bar'),
                dashboardIdentity: document.getElementById('dashboard-auth-identity'),
                dashboardMeta: document.getElementById('dashboard-auth-meta'),
                dashboardRole: document.getElementById('dashboard-auth-role'),
                dashboardId: document.getElementById('dashboard-auth-id'),
                dashboardLogout: document.getElementById('dashboard-auth-logout'),
                viewerBar: document.getElementById('viewer-auth-bar'),
                viewerIdentity: document.getElementById('viewer-auth-identity'),
                viewerMeta: document.getElementById('viewer-auth-meta'),
                viewerRole: document.getElementById('viewer-auth-role'),
                viewerId: document.getElementById('viewer-auth-id'),
                viewerLogout: document.getElementById('viewer-auth-logout')
            };
        }

        function getRuntimeAuthIdentityLabel(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return '';
            const username = String(currentUser.username || '').trim();
            const displayName = String(currentUser.displayName || currentUser.display_name || '').trim();
            return displayName || username;
        }

        function getRuntimeAuthRoleLabel(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return '';
            const listedRoles = Array.isArray(currentUser.roles)
                ? currentUser.roles.map(role => String(role || '').trim()).filter(Boolean)
                : [];
            const baseRoleLabel = hasOwnerRole(currentUser)
                ? '오너 계정'
                : (listedRoles.join(', ') || '사용자 계정');
            return baseRoleLabel;
        }

        function getRuntimeAuthAccountLabel(user = null) {
            const currentUser = user || getRuntimeCurrentUser();
            if (!currentUser) return '';
            const username = String(currentUser.username || '').trim();
            const identityLabel = getRuntimeAuthIdentityLabel(currentUser);
            if (!username || username === identityLabel) return '';
            return `ID ${username}`;
        }

        function renderRuntimeAuthUi() {
            const elements = getRuntimeAuthElements();
            const currentUser = getRuntimeCurrentUser();
            const identityLabel = getRuntimeAuthIdentityLabel(currentUser);
            const roleLabel = getRuntimeAuthRoleLabel(currentUser);
            const accountLabel = getRuntimeAuthAccountLabel(currentUser);
            const isVisible = Boolean(currentUser && identityLabel);
            const logoutLabel = RuntimeAuthState.busy ? '로그아웃 중...' : '로그아웃';

            [
                [elements.dashboardBar, elements.dashboardIdentity, elements.dashboardMeta, elements.dashboardRole, elements.dashboardId, elements.dashboardLogout],
                [elements.viewerBar, elements.viewerIdentity, elements.viewerMeta, elements.viewerRole, elements.viewerId, elements.viewerLogout]
            ].forEach(([bar, identity, meta, role, accountId, logoutButton]) => {
                if (bar) {
                    bar.hidden = !isVisible;
                }
                if (identity) {
                    identity.textContent = identityLabel || '-';
                    identity.setAttribute('title', identityLabel || '');
                }
                if (meta) {
                    meta.hidden = !Boolean(roleLabel || accountLabel);
                }
                if (role) {
                    role.textContent = roleLabel || '';
                    role.setAttribute('title', roleLabel || '');
                    role.hidden = !Boolean(roleLabel);
                }
                if (accountId) {
                    accountId.textContent = accountLabel || '';
                    accountId.setAttribute('title', accountLabel || '');
                    accountId.hidden = !Boolean(accountLabel);
                }
                if (logoutButton) {
                    const logoutLabelElement = logoutButton.querySelector('.runtime-auth-logout-label');
                    logoutButton.disabled = RuntimeAuthState.busy;
                    if (logoutLabelElement) {
                        logoutLabelElement.textContent = logoutLabel;
                    } else {
                        logoutButton.textContent = logoutLabel;
                    }
                    logoutButton.title = logoutLabel;
                    logoutButton.setAttribute('aria-label', logoutLabel);
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
                browser?.replaceLocation?.('/login');
            } catch (error) {
                console.error('Logout failed.', error);
                RuntimeAuthState.busy = false;
                renderRuntimeAuthUi();
                browser?.showAlert?.('로그아웃에 실패했습니다. 다시 시도해 주세요.');
            }
        }

        function bindRuntimeAuthUi() {
            if (browser?.getFlag?.('__runtimeAuthUiBound')) return;
            browser?.setFlag?.('__runtimeAuthUiBound');
            const { dashboardLogout, viewerLogout } = getRuntimeAuthElements();
            [dashboardLogout, viewerLogout].forEach(button => {
                button?.addEventListener('click', () => {
                    void logoutCurrentUser();
                });
            });
        }

        function canShowOwnerWorkspace(user = null) {
            return hasOwnerRole(user) || isLocalDashboardPreviewMode();
        }
