(function (root) {
    const parts = root[Symbol.for('kpi.energy.kpi.parts')] ||= Object.create(null);
    const SCOPES = Object.freeze([
        { key: 'total', label: '전체' },
        { key: 'bukjeong', label: '북정' },
        { key: 'yusan', label: '유산' },
        { key: 'team-01-01', label: '1팀 1파트' },
        { key: 'team-01-02', label: '1팀 2파트' },
        { key: 'team-02', label: '2팀' },
        { key: 'team-03', label: '3팀' }
    ]);
    const now = new Date();
    const state = {
        scopeKey: 'total',
        startMonth: `${now.getFullYear()}-01`,
        endMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
    let syncingSources = false;
    let refreshQueued = false;
    const viewHistory = [];
    const PANEL_KEYS = ['monthly', 'composition', 'teams', 'conversion'];
    const panelState = { key: '', opener: '', position: null };
    let panelDrag = null;
    let popout = null;
    let reportHtml = '';

    function findShell() {
        return root.document?.querySelectorAll?.('[data-energy-kpi-shell]')[0];
    }

    function leaveKpi() {
        finishPanelDrag();
        popout?.close();
        panelState.key = '';
        panelState.opener = '';
    }

    function getPopout() {
        if (popout || typeof parts.createEnergyKpiPopout !== 'function') return popout;
        popout = parts.createEnergyKpiPopout({
            onPanelChange(key) {
                if (!PANEL_KEYS.includes(key)) return;
                panelState.key = key;
                const shell = findShell();
                if (shell) updatePanel(shell);
                else leaveKpi();
            },
            onTeamSelect(scopeKey) {
                if (!SCOPES.some(scope => scope.key === scopeKey)) return;
                const shell = findShell();
                if (shell) {
                    shell.querySelector('[data-energy-kpi-scope]').value = scopeKey;
                    render(shell, true);
                } else leaveKpi();
            },
            onClosed() {
                panelState.key = '';
                const shell = findShell();
                if (shell) updatePanel(shell);
            }
        });
        return popout;
    }

    async function refreshSources() {
        if (!findShell()) return;
        if (syncingSources) {
            refreshQueued = true;
            return;
        }
        syncingSources = true;
        try {
            await Promise.allSettled(['syncUtilElectricDataFromMetering', 'syncUtilGasDataFromMetering']
                .filter(key => typeof root[key] === 'function')
                .map(key => Promise.resolve().then(() => root[key]())));
        } finally {
            syncingSources = false;
            root.document?.querySelectorAll?.('[data-energy-kpi-shell]').forEach(shell => render(shell));
            if (!findShell()) leaveKpi();
            if (refreshQueued) {
                refreshQueued = false;
                void refreshSources();
            }
        }
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function monthIndex(value) {
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(value || ''));
        return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : NaN;
    }

    function getPeriod(startMonth, endMonth) {
        const start = monthIndex(startMonth);
        const end = monthIndex(endMonth);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return { error: '시작월과 종료월을 선택하세요.' };
        if (start > end) return { error: '시작월은 종료월보다 늦을 수 없습니다.' };
        if (end - start >= 60) return { error: '조회 기간은 최대 60개월까지 선택할 수 있습니다.' };
        const monthKeys = Array.from({ length: end - start + 1 }, (_, index) => {
            const month = start + index;
            return `${String(Math.floor(month / 12)).padStart(4, '0')}-${String(month % 12 + 1).padStart(2, '0')}`;
        });
        return { monthKeys, error: '' };
    }

    function updateNavigation(shell) {
        shell.querySelectorAll('[data-energy-kpi-previous]').forEach(button => {
            button.disabled = viewHistory.length === 0;
            const previous = viewHistory[viewHistory.length - 1];
            const scope = SCOPES.find(item => item.key === previous?.scopeKey);
            button.title = previous ? `${scope.label} · ${previous.startMonth} ~ ${previous.endMonth}` : '이전 보기가 없습니다.';
        });
    }

    function capturePanel(shell) {
        const drawer = shell.querySelector('[data-energy-kpi-drawer]');
        if (!drawer || drawer.hidden) return null;
        const active = root.document?.activeElement;
        const dataset = drawer.contains?.(active) ? active?.dataset : null;
        let focusSelector = '';
        if (PANEL_KEYS.includes(dataset?.energyKpiPanelTab)) focusSelector = `[data-energy-kpi-panel-tab="${dataset.energyKpiPanelTab}"]`;
        else if (dataset && 'energyKpiPanelClose' in dataset) focusSelector = '[data-energy-kpi-panel-close]';
        else if (dataset && 'energyKpiPopout' in dataset) focusSelector = '[data-energy-kpi-popout]';
        else if (dataset && 'energyKpiDragKeyboard' in dataset) focusSelector = '[data-energy-kpi-drag-keyboard]';
        else if (SCOPES.some(scope => scope.key === dataset?.energyKpiTeam)) focusSelector = `[data-energy-kpi-team="${dataset.energyKpiTeam}"]`;
        const scrolls = Array.from(drawer.querySelectorAll('[data-energy-kpi-drawer-scroll], .energy-kpi-monthly-scroll, .energy-kpi-table-scroll'))
            .map(element => ({ top: element.scrollTop, left: element.scrollLeft }));
        return { focusSelector, scrolls };
    }

    function positionPanel(drawer) {
        if (!panelState.position || !drawer || drawer.hidden) return;
        const position = panelState.position;
        const width = root.innerWidth;
        const height = root.innerHeight;
        const bounds = drawer.getBoundingClientRect();
        const panelHeight = Math.min(position.height, Math.max(0, height - 16));
        position.left = Math.max(8, Math.min(position.left, width - bounds.width - 8));
        position.top = Math.max(8, Math.min(position.top, height - panelHeight - 8));
        drawer.classList.add('is-positioned');
        Object.assign(drawer.style, { left: `${position.left}px`, top: `${position.top}px`, height: `${panelHeight}px` });
    }

    function finishPanelDrag() {
        if (!panelDrag) return;
        const { drawer, handle, pointerId } = panelDrag;
        panelDrag = null;
        drawer.classList.remove('is-dragging');
        if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
    }

    function startPanelDrag(event) {
        if (event.button !== 0 || event.isPrimary === false) return;
        const handle = event.target?.closest?.('[data-energy-kpi-drag-handle]');
        if (!handle || event.target.closest('button, a, input, select, textarea')) return;
        const drawer = handle.closest('[data-energy-kpi-drawer]');
        if (!drawer || drawer.hidden) return;
        const bounds = drawer.getBoundingClientRect();
        finishPanelDrag();
        panelState.position = { left: bounds.left, top: bounds.top, height: bounds.height };
        panelDrag = { drawer, handle, pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
        positionPanel(drawer);
        drawer.classList.add('is-dragging');
        handle.setPointerCapture?.(event.pointerId);
        handle.querySelector('[data-energy-kpi-drag-keyboard]')?.focus?.({ preventScroll: true });
        event.preventDefault();
    }

    function movePanelDrag(event) {
        if (!panelDrag || panelDrag.pointerId !== event.pointerId) return;
        panelState.position.left = panelDrag.left + event.clientX - panelDrag.x;
        panelState.position.top = panelDrag.top + event.clientY - panelDrag.y;
        positionPanel(panelDrag.drawer);
        event.preventDefault();
    }

    function updatePanel(shell, { focus = false, restore = null } = {}) {
        const drawer = shell.querySelector('[data-energy-kpi-drawer]');
        if (!drawer) return;
        const detached = popout?.isOpen() === true;
        drawer.hidden = !panelState.key || detached;
        if (detached) popout.update({ html: reportHtml, key: panelState.key });
        positionPanel(drawer);
        shell.querySelectorAll('[data-energy-kpi-panel-open]').forEach(button => {
            button.setAttribute('aria-expanded', button.dataset.energyKpiPanelOpen === panelState.key ? 'true' : 'false');
        });
        drawer.querySelectorAll('[data-energy-kpi-panel-tab]').forEach(button => {
            const selected = button.dataset.energyKpiPanelTab === panelState.key;
            button.setAttribute('aria-selected', selected ? 'true' : 'false');
            button.tabIndex = selected ? 0 : -1;
        });
        drawer.querySelectorAll('[data-energy-kpi-panel-content]').forEach(content => {
            content.hidden = content.dataset.energyKpiPanelContent !== panelState.key;
        });
        if (restore) {
            drawer.querySelectorAll('[data-energy-kpi-drawer-scroll], .energy-kpi-monthly-scroll, .energy-kpi-table-scroll').forEach((element, index) => {
                element.scrollTop = restore.scrolls[index]?.top || 0;
                element.scrollLeft = restore.scrolls[index]?.left || 0;
            });
            if (restore.focusSelector) drawer.querySelector(restore.focusSelector)?.focus?.({ preventScroll: true });
        } else if (focus && panelState.key) {
            drawer.querySelector(`[data-energy-kpi-panel-tab="${panelState.key}"]`)?.focus?.({ preventScroll: true });
        }
    }

    function closePanel(shell) {
        if (!shell) return;
        finishPanelDrag();
        popout?.close();
        const opener = panelState.opener;
        panelState.key = '';
        updatePanel(shell);
        if (PANEL_KEYS.includes(opener)) shell.querySelector(`[data-energy-kpi-panel-open="${opener}"]`)?.focus?.({ preventScroll: true });
    }

    function openNativePanel(shell) {
        if (!shell || !PANEL_KEYS.includes(panelState.key) || !reportHtml) return;
        finishPanelDrag();
        const opened = getPopout()?.open({ html: reportHtml, key: panelState.key });
        updatePanel(shell, { focus: !opened });
        const status = shell.querySelector('[data-energy-kpi-popup-status]');
        if (status) {
            status.hidden = !!opened;
            status.textContent = opened ? '' : '새 창이 차단되었습니다. 주소창의 팝업 차단을 허용한 뒤 새 창으로 버튼을 눌러주세요.';
        }
    }

    function render(shell, rememberSelection = false) {
        if (!shell) return;
        const scopeSelect = shell.querySelector('[data-energy-kpi-scope]');
        const startInput = shell.querySelector('[data-energy-kpi-start]');
        const endInput = shell.querySelector('[data-energy-kpi-end]');
        const body = shell.querySelector('[data-energy-kpi-body]');
        const status = shell.querySelector('[data-energy-kpi-status]');
        if (!body || !scopeSelect || !startInput || !endInput) return;
        const period = getPeriod(startInput.value, endInput.value);
        if (status) {
            status.textContent = period.error;
            status.hidden = !period.error;
        }
        if (period.error) {
            finishPanelDrag();
            reportHtml = '';
            popout?.update({ html: '', key: panelState.key, error: period.error });
            body.innerHTML = '';
            return;
        }
        const nextScope = SCOPES.some(scope => scope.key === scopeSelect.value) ? scopeSelect.value : 'total';
        if (rememberSelection && (state.scopeKey !== nextScope || state.startMonth !== startInput.value || state.endMonth !== endInput.value)) {
            viewHistory.push({ ...state });
            if (viewHistory.length > 40) viewHistory.shift();
        }
        finishPanelDrag();
        const panelSnapshot = capturePanel(shell);
        state.scopeKey = nextScope;
        state.startMonth = startInput.value;
        state.endMonth = endInput.value;
        const report = parts.buildEnergyKpiReport({ scopeKey: state.scopeKey, monthKeys: period.monthKeys });
        reportHtml = parts.buildEnergyKpiReportHtml(report);
        body.innerHTML = reportHtml;
        const chartHost = body.querySelector?.('[data-energy-kpi-chart]');
        if (chartHost && typeof parts.mountEnergyKpiChart === 'function') parts.mountEnergyKpiChart(chartHost, report);
        shell.querySelectorAll('[data-energy-kpi-team]').forEach(button => {
            button.setAttribute('aria-pressed', button.dataset.energyKpiTeam === state.scopeKey ? 'true' : 'false');
        });
        shell.querySelector('[data-energy-kpi-back]').hidden = state.scopeKey === 'total';
        updateNavigation(shell);
        updatePanel(shell, { restore: panelSnapshot });
    }

    function mount(shell) {
        if (!shell || shell.dataset.energyKpiMounted === 'true') return;
        shell.dataset.energyKpiMounted = 'true';
        if (!popout?.isOpen()) {
            panelState.key = '';
            panelState.opener = '';
        }
        shell.querySelector('[data-energy-kpi-scope]').value = state.scopeKey;
        shell.querySelector('[data-energy-kpi-start]').value = state.startMonth;
        shell.querySelector('[data-energy-kpi-end]').value = state.endMonth;
        render(shell);
        void refreshSources();
    }

    function scan() {
        const shells = root.document?.querySelectorAll?.('[data-energy-kpi-shell]');
        if (!shells?.length) leaveKpi();
        else shells.forEach(mount);
    }

    function observe() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        scan();
        if (typeof root.MutationObserver !== 'function' || !documentRef.body) return;
        new root.MutationObserver(scan).observe(documentRef.body, { childList: true, subtree: true });
    }

    root.KpiEnergyDashboard = Object.freeze({
        change(trigger) {
            render(trigger?.closest?.('[data-energy-kpi-shell]'), true);
        },
        refresh(trigger) {
            render(trigger?.closest?.('[data-energy-kpi-shell]'));
        },
        selectTeam(trigger) {
            const shell = trigger?.closest?.('[data-energy-kpi-shell]');
            const scopeKey = String(trigger?.dataset?.energyKpiTeam || '');
            if (!shell || !SCOPES.some(scope => scope.key === scopeKey)) return;
            shell.querySelector('[data-energy-kpi-scope]').value = scopeKey;
            render(shell, true);
        },
        previous(trigger) {
            const shell = trigger?.closest?.('[data-energy-kpi-shell]');
            if (!shell || !viewHistory.length) return;
            const previous = viewHistory.pop();
            shell.querySelector('[data-energy-kpi-scope]').value = previous.scopeKey;
            shell.querySelector('[data-energy-kpi-start]').value = previous.startMonth;
            shell.querySelector('[data-energy-kpi-end]').value = previous.endMonth;
            render(shell);
        },
        openPanel(trigger) {
            const shell = trigger?.closest?.('[data-energy-kpi-shell]');
            const key = trigger?.dataset?.energyKpiPanelOpen;
            if (!shell || !PANEL_KEYS.includes(key)) return;
            panelState.key = key;
            panelState.opener = key;
            openNativePanel(shell);
        },
        detachPanel(trigger) {
            openNativePanel(trigger?.closest?.('[data-energy-kpi-shell]'));
        },
        closePanel(trigger) {
            closePanel(trigger?.closest?.('[data-energy-kpi-shell]'));
        },
        selectPanel(trigger) {
            const shell = trigger?.closest?.('[data-energy-kpi-shell]');
            const key = trigger?.dataset?.energyKpiPanelTab;
            if (!shell || !PANEL_KEYS.includes(key)) return;
            panelState.key = key;
            updatePanel(shell, { focus: true });
        }
    });

    function buildContent() {
        return `
            <section class="energy-kpi-shell" data-energy-kpi-shell aria-label="에너지 KPI">
                <header class="energy-kpi-header">
                    <div class="energy-kpi-heading"><h2>통합 에너지 원단위</h2><p>KPI 01 · 열량과 생산량을 같은 범위로 비교합니다.</p></div>
                    <div class="energy-kpi-controls">
                        <label>범위<select data-energy-kpi-scope onchange="KpiEnergyDashboard.change(this)">${SCOPES.map(scope => `<option value="${escapeHtml(scope.key)}">${escapeHtml(scope.label)}</option>`).join('')}</select></label>
                        <label>시작월<input type="month" aria-label="KPI 시작월" data-energy-kpi-start onchange="KpiEnergyDashboard.change(this)"></label>
                        <label>종료월<input type="month" aria-label="KPI 종료월" data-energy-kpi-end onchange="KpiEnergyDashboard.change(this)"></label>
                        <button type="button" class="energy-kpi-refresh" onclick="KpiEnergyDashboard.refresh(this)">새로고침</button>
                    </div>
                </header>
                <nav class="energy-kpi-team-nav" aria-label="KPI 팀별 보기">
                    <button type="button" class="energy-kpi-previous-icon" data-energy-kpi-previous aria-label="이전 보기" disabled onclick="KpiEnergyDashboard.previous(this)"><span aria-hidden="true">←</span></button>
                    ${SCOPES.filter(scope => scope.key === 'total' || scope.key.startsWith('team-')).map(scope => `<button type="button" data-energy-kpi-team="${escapeHtml(scope.key)}" aria-pressed="${scope.key === 'total'}" onclick="KpiEnergyDashboard.selectTeam(this)">${escapeHtml(scope.label)}</button>`).join('')}
                    <button type="button" data-energy-kpi-team="total" data-energy-kpi-back hidden onclick="KpiEnergyDashboard.selectTeam(this)">전체로 돌아가기</button>
                </nav>
                <p class="energy-kpi-status" data-energy-kpi-status role="alert" hidden></p>
                <div data-energy-kpi-body aria-live="polite"></div>
            </section>
        `;
    }

    KpiSectionFactoryAdapter.registerFactory('kpi', function buildKpiSection() {
        return {
            id: 'kpi', name: 'KPI', icon: 'fa-bullseye', color: 'teal', accent: '#0f766e',
            openDefaultCategoryOnMain: true, hideNavigationChevron: true,
            categories: [{ title: '통합 에너지 원단위', icon: 'fa-gauge-high', navHidden: true, viewerMode: 'full-bleed', content: buildContent() }]
        };
    });
    root.addEventListener?.('kpi:metering-store-updated', refreshSources);
    root.addEventListener?.('util-production-data-updated', refreshSources);
    root.addEventListener?.('pagehide', leaveKpi);
    root.addEventListener?.('resize', () => {
        finishPanelDrag();
        root.document?.querySelectorAll?.('[data-energy-kpi-drawer]').forEach(positionPanel);
    });
    root.addEventListener?.('blur', finishPanelDrag);
    root.document?.addEventListener?.('pointerdown', startPanelDrag);
    root.document?.addEventListener?.('pointermove', movePanelDrag, { passive: false });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
        root.document?.addEventListener?.(type, event => {
            if (panelDrag?.pointerId === event.pointerId) finishPanelDrag();
        });
    });
    root.document?.addEventListener?.('keydown', event => {
        const shell = event.target?.closest?.('[data-energy-kpi-shell]') || root.document.querySelector?.('[data-energy-kpi-shell]');
        const drawer = shell?.querySelector('[data-energy-kpi-drawer]');
        if (!drawer || drawer.hidden) return;
        if (event.key === 'Escape') {
            if (shell.querySelector('.is-energy-kpi-chart-fullscreen')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            closePanel(shell);
            return;
        }
        const moveHandle = event.target?.closest?.('[data-energy-kpi-drag-keyboard]');
        if (moveHandle && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
            const bounds = drawer.getBoundingClientRect();
            const distance = event.shiftKey ? 30 : 10;
            panelState.position = {
                left: bounds.left + (event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0),
                top: bounds.top + (event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0),
                height: bounds.height
            };
            positionPanel(drawer);
            return;
        }
        const tab = event.target?.closest?.('[data-energy-kpi-panel-tab]');
        if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = PANEL_KEYS.indexOf(panelState.key);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? PANEL_KEYS.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : PANEL_KEYS.length - 1)) % PANEL_KEYS.length;
        panelState.key = PANEL_KEYS[next];
        updatePanel(shell, { focus: true });
    }, { capture: true });
    if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
})(this);
