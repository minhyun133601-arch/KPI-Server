(function (root) {
    const parts = root[Symbol.for('kpi.energy.kpi.parts')] ||= Object.create(null);
    const PANEL_KEYS = ['monthly', 'composition', 'teams', 'conversion'];
    const SCROLL_SELECTOR = '[data-energy-kpi-drawer-scroll], .energy-kpi-monthly-scroll, .energy-kpi-table-scroll';
    const FOCUS_ATTRIBUTES = ['data-energy-kpi-panel-tab', 'data-energy-kpi-team', 'data-energy-kpi-panel-close'];

    function getEnergyKpiStyleText() {
        const visited = new Set();
        function find(sheet) {
            if (!sheet || visited.has(sheet)) return null;
            visited.add(sheet);
            try {
                const rules = Array.from(sheet.cssRules || []);
                if (sheet.href && new URL(sheet.href, root.document.baseURI).pathname.endsWith('/06-energy-kpi.css')) {
                    return rules.length ? rules.map(rule => rule.cssText).join('\n') : null;
                }
                for (const rule of rules) {
                    const text = find(rule.styleSheet);
                    if (text !== null) return text;
                }
            } catch { /* Inaccessible vendor stylesheets are unrelated to KPI details. */ }
            return null;
        }
        for (const sheet of Array.from(root.document.styleSheets || [])) {
            const text = find(sheet);
            if (text !== null) return text;
        }
        return null;
    }

    function createEnergyKpiPopout({ onPanelChange, onTeamSelect, onClosed } = {}) {
        let popup = null;
        let popupDocument = null;
        let shell = null;

        function getDocument() {
            try {
                return popup && !popup.closed && popup.document === popupDocument ? popupDocument : null;
            } catch {
                return null;
            }
        }

        function ended(window) {
            if (popup !== window) return;
            popup = null;
            popupDocument = null;
            shell = null;
            onClosed?.();
        }

        function closeFromChild() {
            const window = popup;
            if (!window) return;
            try { window.close(); } catch { /* A navigated window may no longer be accessible. */ }
            ended(window);
        }

        function selectPanel(key) {
            const selected = PANEL_KEYS.includes(key) ? key : 'monthly';
            shell.querySelectorAll('[data-energy-kpi-panel-tab]').forEach(tab => {
                const active = tab.getAttribute('data-energy-kpi-panel-tab') === selected;
                tab.setAttribute('aria-selected', String(active));
                tab.tabIndex = active ? 0 : -1;
            });
            shell.querySelectorAll('[data-energy-kpi-panel-content]').forEach(panel => {
                panel.hidden = panel.getAttribute('data-energy-kpi-panel-content') !== selected;
            });
        }

        function handleClick(event) {
            const control = event.target?.closest?.('button');
            if (!control || !shell?.contains(control)) return;
            if (control.hasAttribute('data-energy-kpi-panel-close')) closeFromChild();
            else if (control.hasAttribute('data-energy-kpi-panel-tab')) {
                const key = control.getAttribute('data-energy-kpi-panel-tab');
                selectPanel(key);
                onPanelChange?.(key);
            } else if (control.hasAttribute('data-energy-kpi-team')) {
                onTeamSelect?.(control.getAttribute('data-energy-kpi-team'));
            }
        }

        function handleKeydown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeFromChild();
                return;
            }
            const tab = event.target?.closest?.('[data-energy-kpi-panel-tab]');
            if (!tab || !shell?.contains(tab)) return;
            const index = PANEL_KEYS.indexOf(tab.getAttribute('data-energy-kpi-panel-tab'));
            const nextIndex = { ArrowRight: (index + 1) % PANEL_KEYS.length, ArrowLeft: (index + PANEL_KEYS.length - 1) % PANEL_KEYS.length, Home: 0, End: PANEL_KEYS.length - 1 }[event.key];
            if (nextIndex === undefined) return;
            event.preventDefault();
            const key = PANEL_KEYS[nextIndex];
            selectPanel(key);
            onPanelChange?.(key);
            shell?.querySelector(`[data-energy-kpi-panel-tab="${key}"]`)?.focus();
        }

        function createErrorDrawer(document, message) {
            const drawer = document.createElement('aside');
            drawer.className = 'energy-kpi-drawer';
            drawer.setAttribute('data-energy-kpi-drawer', '');
            const header = document.createElement('header');
            header.className = 'energy-kpi-drawer-header';
            const title = document.createElement('h3');
            title.textContent = 'KPI 상세 자료';
            const actions = document.createElement('div');
            actions.className = 'energy-kpi-drawer-actions';
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-energy-kpi-panel-close', '');
            button.textContent = '닫기 ×';
            actions.appendChild(button);
            header.appendChild(title);
            header.appendChild(actions);
            const body = document.createElement('div');
            body.className = 'energy-kpi-drawer-body';
            const error = document.createElement('p');
            error.className = 'energy-kpi-error';
            error.setAttribute('role', 'alert');
            error.textContent = String(message || '상세 자료를 표시할 수 없습니다. KPI 화면에서 기간을 확인해 주세요.');
            body.appendChild(error);
            drawer.appendChild(header);
            drawer.appendChild(body);
            return drawer;
        }

        function update({ html = '', key = 'monthly', error = '' } = {}) {
            const document = getDocument();
            if (!document || !shell) return false;
            const active = document.activeElement;
            const focused = shell.contains(active) ? FOCUS_ATTRIBUTES.find(attribute => active.hasAttribute(attribute)) : null;
            const focusValue = focused ? active.getAttribute(focused) : '';
            const retainFocus = focused && document.hasFocus();
            const scroll = Array.from(shell.querySelectorAll(SCROLL_SELECTOR), element => ({ left: element.scrollLeft, top: element.scrollTop }));
            const template = document.createElement('template');
            if (!error) template.innerHTML = html;
            const drawer = !error && template.content.querySelector('[data-energy-kpi-drawer]') || createErrorDrawer(document, error);
            drawer.querySelectorAll('script, link, style, iframe, object, embed').forEach(element => element.remove());
            [drawer, ...drawer.querySelectorAll('*')].forEach(element => {
                Array.from(element.attributes).forEach(attribute => {
                    if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
                });
            });
            drawer.hidden = false;
            drawer.querySelector('[data-energy-kpi-drag-handle]')?.removeAttribute('title');
            drawer.querySelector('[data-energy-kpi-drag-handle]')?.removeAttribute('data-energy-kpi-drag-handle');
            const moveTitle = drawer.querySelector('[data-energy-kpi-drag-keyboard]');
            if (moveTitle) {
                ['tabindex', 'role', 'aria-label', 'aria-describedby', 'data-energy-kpi-drag-keyboard'].forEach(attribute => moveTitle.removeAttribute(attribute));
            }
            const hint = drawer.querySelector('#energy-kpi-move-hint');
            if (hint) hint.textContent = '창 제목 표시줄을 끌어 다른 모니터로 이동할 수 있습니다.';
            drawer.querySelectorAll('[data-energy-kpi-popout]').forEach(button => button.remove());
            shell.replaceChildren(drawer);
            selectPanel(key);
            shell.querySelectorAll(SCROLL_SELECTOR).forEach((element, index) => {
                if (!scroll[index]) return;
                element.scrollLeft = scroll[index].left;
                element.scrollTop = scroll[index].top;
            });
            if (retainFocus) Array.from(shell.querySelectorAll(`[${focused}]`)).find(element => element.getAttribute(focused) === focusValue)?.focus();
            return true;
        }

        function open(options = {}) {
            if (!getDocument()) {
                let window;
                try { window = root.open('', '_blank', 'popup=yes,width=820,height=820,resizable=yes,scrollbars=yes'); } catch { return false; }
                if (!window) return false;
                try {
                    const document = window.document;
                    popup = window;
                    popupDocument = document;
                    document.documentElement.lang = 'ko';
                    document.documentElement.classList.add('energy-kpi-popout-document');
                    const meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = 'width=device-width, initial-scale=1';
                    const styleText = getEnergyKpiStyleText();
                    const style = document.createElement(styleText === null ? 'link' : 'style');
                    if (styleText === null) {
                        style.rel = 'stylesheet';
                        style.href = new URL('kpi-runtime/app/styles/shell/dashboard/06-energy-kpi.css?v=6', root.document.baseURI).href;
                    } else style.textContent = styleText;
                    document.head.replaceChildren(meta, style);
                    document.title = 'KPI 상세 자료';
                    shell = document.createElement('main');
                    shell.className = 'energy-kpi-shell energy-kpi-popout-shell';
                    document.body.replaceChildren(shell);
                    document.addEventListener('click', handleClick);
                    document.addEventListener('keydown', handleKeydown);
                    window.addEventListener('pagehide', () => ended(window), { once: true });
                } catch {
                    if (popup === window) { popup = null; popupDocument = null; shell = null; }
                    try { window.close(); } catch { /* No accessible window to initialize. */ }
                    return false;
                }
            }
            const updated = update(options);
            if (updated) {
                try { popup.focus(); } catch { /* Content remains available if the browser declines focus. */ }
            }
            return updated;
        }

        function close() {
            const window = popup;
            popup = null;
            popupDocument = null;
            shell = null;
            try { window?.close(); } catch { /* Already closed or navigated away. */ }
        }

        return Object.freeze({ open, update, isOpen: () => Boolean(getDocument()), close });
    }

    Object.assign(parts, { createEnergyKpiPopout });
})(this);
