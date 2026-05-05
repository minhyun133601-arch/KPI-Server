        const auditLuxFullscreenBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : null;

        if (!auditLuxFullscreenBrowser) {
            throw new Error('KpiAuditRecordsBrowserAdapter must load before KPI.audit.records.lux-fullscreen.js');
        }

        function getAuditLuxFullscreenDocument() {
            return auditLuxFullscreenBrowser.getDocument?.() || null;
        }

        if (auditLuxFullscreenBrowser.claimRootFlag('__auditLuxFullscreenBound')) {
            getAuditLuxFullscreenDocument()?.addEventListener?.('fullscreenchange', syncAuditLuxWorkspaceFullscreenUi);
        }

        function getAuditLuxFullscreenTarget() {
            return getAuditLuxFullscreenDocument()?.getElementById?.('content-container') || null;
        }

        function isAuditLuxWorkspaceFullscreen(target = getAuditLuxFullscreenTarget()) {
            const documentRef = getAuditLuxFullscreenDocument();
            return !!target && documentRef?.fullscreenElement === target;
        }

        function getAuditLuxFullscreenLabel(isActive = isAuditLuxWorkspaceFullscreen()) {
            return isActive ? '\uC804\uCCB4\uD654\uBA74 \uD574\uC81C' : '\uC804\uCCB4\uD654\uBA74';
        }

        function getAuditLuxFullscreenIconClass(isActive = isAuditLuxWorkspaceFullscreen()) {
            return isActive ? 'fa-compress' : 'fa-expand';
        }

        function getAuditLuxWorkspaceFullscreenButtonHtml() {
            const isActive = isAuditLuxWorkspaceFullscreen();
            const label = getAuditLuxFullscreenLabel(isActive);
            return `
                <button
                    type="button"
                    class="work-btn audit-lux-fullscreen-toggle ${isActive ? 'is-active' : ''}"
                    data-action="audit-lux-toggle-fullscreen"
                    aria-pressed="${isActive ? 'true' : 'false'}"
                    aria-label="${label}"
                    title="${label}"
                    onclick="toggleAuditLuxWorkspaceFullscreen()"
                >
                    <span class="audit-lux-fullscreen-toggle-icon" data-audit-lux-fullscreen-icon>
                        <i class="fa-solid ${getAuditLuxFullscreenIconClass(isActive)}"></i>
                    </span>
                </button>
            `;
        }

        function syncAuditLuxWorkspaceFullscreenUi() {
            const host = getAuditLuxFullscreenTarget();
            const isActive = isAuditLuxWorkspaceFullscreen(host);
            if (host) {
                host.classList.toggle('is-audit-lux-browser-fullscreen', isActive);
            }
            const documentRef = getAuditLuxFullscreenDocument();
            Array.from(documentRef?.querySelectorAll?.('[data-action="audit-lux-toggle-fullscreen"]') || []).forEach((button) => {
                const label = getAuditLuxFullscreenLabel(isActive);
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                button.setAttribute('aria-label', label);
                button.setAttribute('title', label);
                const icon = button.querySelector('[data-audit-lux-fullscreen-icon] i');
                if (icon) {
                    icon.className = `fa-solid ${getAuditLuxFullscreenIconClass(isActive)}`;
                }
            });
        }

        async function exitAuditLuxWorkspaceFullscreen() {
            if (!isAuditLuxWorkspaceFullscreen()) return;
            const documentRef = getAuditLuxFullscreenDocument();
            try {
                await documentRef?.exitFullscreen?.();
            } catch (error) {
                console.warn('[KPI audit lux] fullscreen exit failed', error);
            } finally {
                syncAuditLuxWorkspaceFullscreenUi();
            }
        }

        async function toggleAuditLuxWorkspaceFullscreen() {
            const documentRef = getAuditLuxFullscreenDocument();
            const target = getAuditLuxFullscreenTarget();
            if (!documentRef || !target) return;
            if (isAuditLuxWorkspaceFullscreen(target)) {
                await exitAuditLuxWorkspaceFullscreen();
                return;
            }
            if (typeof target.requestFullscreen !== 'function') {
                showToast('\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C\uB294 \uC804\uCCB4\uD654\uBA74 \uAE30\uB2A5\uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.');
                return;
            }
            try {
                if (documentRef.fullscreenElement && documentRef.fullscreenElement !== target) {
                    await documentRef.exitFullscreen?.();
                }
                await target.requestFullscreen();
            } catch (error) {
                console.warn('[KPI audit lux] fullscreen toggle failed', error);
                showToast('\uC804\uCCB4\uD654\uBA74 \uC804\uD658\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
            } finally {
                syncAuditLuxWorkspaceFullscreenUi();
            }
        }
