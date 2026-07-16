        const workRenderersBrowser = typeof KpiWorkBrowserAdapter !== 'undefined'
            ? KpiWorkBrowserAdapter
            : null;

        function renderWorkContent(category, contextOrOptions = {}) {
            const context = contextOrOptions && typeof contextOrOptions === 'object'
                ? contextOrOptions
                : {};
            const options = context.options && typeof context.options === 'object'
                ? context.options
                : contextOrOptions;
            if (category.view === 'team_calendar_document') {
                renderWorkTeamCalendarContent(category, '', options);
                return;
            }
            if (category.view === 'history_tool') {
                workRenderersBrowser?.renderHistory?.(category, context);
            }
        }
