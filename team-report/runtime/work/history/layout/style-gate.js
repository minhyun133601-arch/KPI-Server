(function initKpiWorkHistoryStyleGate() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const LOAD_FAILURE_MESSAGE = '작업이력 화면을 불러오지 못했습니다. 새로고침해 주세요.';

    function setHostPending(host, pending) {
        if (!host) return;
        host.hidden = pending;
        if (pending) host.setAttribute('aria-busy', 'true');
        else host.removeAttribute('aria-busy');
    }

    function showLoadFailure(root, host) {
        root.innerHTML = `<p role="alert">${LOAD_FAILURE_MESSAGE}</p>`;
        setHostPending(host, false);
    }

    function bindShadowStylesheetGate(root, host) {
        if (!root || !host) return false;
        setHostPending(host, true);

        const stylesheet = root.querySelector('link[rel="stylesheet"]');
        if (!stylesheet) {
            showLoadFailure(root, host);
            return false;
        }

        const isCurrent = () => root.querySelector('link[rel="stylesheet"]') === stylesheet;
        stylesheet.addEventListener('load', () => {
            if (isCurrent()) setHostPending(host, false);
        }, { once: true });
        stylesheet.addEventListener('error', () => {
            if (isCurrent()) showLoadFailure(root, host);
        }, { once: true });
        return true;
    }

    Object.assign(view, { bindShadowStylesheetGate });
})();
