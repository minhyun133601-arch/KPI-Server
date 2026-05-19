        function renderUtilReportPreview(panel) {
            if (!panel) return;
            const kpiGridEl = panel.querySelector('.util-report-kpi-grid');
            if (kpiGridEl) {
                kpiGridEl.innerHTML = '';
                kpiGridEl.hidden = true;
            }
            const noteEl = panel.querySelector('[data-role="util-report-note"]');
            if (noteEl) {
                noteEl.textContent = '';
                noteEl.hidden = true;
            }
        }
