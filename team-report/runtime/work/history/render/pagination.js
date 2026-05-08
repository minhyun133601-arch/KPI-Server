(function initKpiWorkHistoryRenderPagination() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        state,
        getElement,
        escapeHtml,
        escapeAttribute
    } = history;

    const RECORD_PAGE_SIZE = 8;

    function getRecordPageStore() {
        if (!state.recordPages || typeof state.recordPages !== 'object') {
            state.recordPages = {};
        }
        return state.recordPages;
    }

    function normalizePagePrefix(prefix) {
        const raw = String(prefix || '').trim();
        return raw === view.OVERVIEW_KEY || TEAM_KEYS.includes(raw) ? raw : view.OVERVIEW_KEY;
    }

    function getPagedRecords(prefix, records) {
        const pagePrefix = normalizePagePrefix(prefix);
        const pageStore = getRecordPageStore();
        const totalCount = records.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / RECORD_PAGE_SIZE));
        const page = Math.max(1, Math.min(Math.floor(Number(pageStore[pagePrefix]) || 1), totalPages));
        pageStore[pagePrefix] = page;
        return {
            page,
            totalPages,
            totalCount,
            records: records.slice((page - 1) * RECORD_PAGE_SIZE, page * RECORD_PAGE_SIZE)
        };
    }

    function getPaginationItems(page, totalPages) {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
        const pages = new Set([1, totalPages, page, page - 1, page + 1]);
        if (page <= 3) [2, 3, 4].forEach(item => pages.add(item));
        if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach(item => pages.add(item));
        const sorted = Array.from(pages).filter(item => item >= 1 && item <= totalPages).sort((left, right) => left - right);
        return sorted.flatMap((item, index) => (
            index > 0 && item - sorted[index - 1] > 1 ? ['ellipsis', item] : [item]
        ));
    }

    function buildRecordPagination(prefix, pageData) {
        const totalPages = Number(pageData?.totalPages || 1);
        if (totalPages <= 1) return '';
        const page = Number(pageData?.page || 1);
        const pagePrefix = normalizePagePrefix(prefix);
        const pageButtons = getPaginationItems(page, totalPages).map(item => (
            item === 'ellipsis'
                ? '<span class="history-pagination-ellipsis" aria-hidden="true">...</span>'
                : `<button class="history-pagination-page${item === page ? ' is-active' : ''}" type="button" data-action="change-page" data-prefix="${escapeAttribute(pagePrefix)}" data-page="${item}"${item === page ? ' aria-current="page"' : ''}>${item}</button>`
        )).join('');
        return `
            <nav class="history-pagination no-print" aria-label="작업내역 페이지">
                <span class="history-pagination-status">${escapeHtml(`${page} / ${totalPages}`)}</span>
                <div class="history-pagination-pages">
                    <button class="history-pagination-step" type="button" data-action="change-page" data-prefix="${escapeAttribute(pagePrefix)}" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>이전</button>
                    ${pageButtons}
                    <button class="history-pagination-step" type="button" data-action="change-page" data-prefix="${escapeAttribute(pagePrefix)}" data-page="${page + 1}"${page >= totalPages ? ' disabled' : ''}>다음</button>
                </div>
            </nav>
        `;
    }

    function resetRecordPage(prefix = '') {
        const pageStore = getRecordPageStore();
        const pagePrefix = String(prefix || '').trim();
        if (pagePrefix) {
            pageStore[normalizePagePrefix(pagePrefix)] = 1;
            return;
        }
        [view.OVERVIEW_KEY, ...TEAM_KEYS].forEach(teamKey => {
            pageStore[teamKey] = 1;
        });
    }

    function setRecordPage(prefix, page) {
        const pagePrefix = normalizePagePrefix(prefix);
        getRecordPageStore()[pagePrefix] = Math.max(1, Math.floor(Number(page) || 1));
        if (pagePrefix === view.OVERVIEW_KEY) {
            view.renderOverview?.();
        } else {
            view.renderTeam?.(pagePrefix);
        }
        view.updateSearchCount?.();
        getElement(pagePrefix === view.OVERVIEW_KEY ? 'overview-records' : `${pagePrefix}-records`)
            ?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    }

    Object.assign(view, {
        getPaginationItems,
        getPagedRecords,
        buildRecordPagination,
        resetRecordPage,
        setRecordPage
    });
})();
