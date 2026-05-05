        function getUtilReportDetachedRuntimeAdapter() {
            return typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
                ? KPIUtilReportRuntimeAdapter
                : null;
        }

        function getUtilReportDetachedRootFlag(name) {
            const adapter = getUtilReportDetachedRuntimeAdapter();
            return typeof adapter?.getRootFlag === 'function' && adapter.getRootFlag(name);
        }

        function setUtilReportDetachedRootFlag(name, value = true) {
            const adapter = getUtilReportDetachedRuntimeAdapter();
            return typeof adapter?.setRootFlag === 'function'
                ? adapter.setRootFlag(name, value)
                : null;
        }

        function addUtilReportDetachedGlobalListener(type, listener, options) {
            const adapter = getUtilReportDetachedRuntimeAdapter();
            return typeof adapter?.addEventListener === 'function'
                ? adapter.addEventListener(type, listener, options)
                : false;
        }

        function openUtilReportDetachedBrowserWindow(url, target, features) {
            const adapter = getUtilReportDetachedRuntimeAdapter();
            return typeof adapter?.openWindow === 'function'
                ? adapter.openWindow(url, target, features)
                : null;
        }

        function showUtilReportDetachedAlert(message) {
            const adapter = getUtilReportDetachedRuntimeAdapter();
            return typeof adapter?.alert === 'function'
                ? adapter.alert(message)
                : false;
        }

        function buildUtilReportDetachedTableShellHtml() {
            return `
                <!doctype html>
                <html lang="ko">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>유틸리티 통합 보고서 상세표</title>
                    <style>${getUtilReportDetachedTableStyles()}</style>
                </head>
                <body>
                    <div class="util-report-detached-shell">
                        <div class="util-report-detached-head">
                            <div class="util-report-detached-meta">
                                <div class="util-report-detached-title" data-role="util-report-detached-title">유틸리티 통합 보고서 상세표</div>
                                <div class="util-report-detached-sub" data-role="util-report-detached-sub">기간: -</div>
                                <div class="util-report-detached-status" data-role="util-report-detached-status">지표: -</div>
                            </div>
                            <button type="button" class="util-report-detached-close" data-role="util-report-detached-close">닫기</button>
                        </div>
                        <div class="util-report-detached-body" data-role="util-report-detached-body">
                            <div class="util-report-detached-empty">표를 준비 중입니다.</div>
                        </div>
                    </div>
                    <script>
                        document.addEventListener('click', function(event) {
                            if (event.target && event.target.closest('[data-role="util-report-detached-close"]')) {
                                self.close();
                            }
                        });
                    <\/script>
                </body>
                </html>
            `;
        }

        function renderUtilReportDetachedPlaceholder(result) {
            const metricKey = resolveUtilReportDetailMetricKey();
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const rangeLabel = result?.rangeLabel ? `기간: ${result.rangeLabel}` : '기간: 데이터 없음';
            return `
                <div class="util-report-detached-placeholder">
                    <div class="util-report-detached-placeholder-title">상세표가 별도 창으로 분리되어 있습니다.</div>
                    <div class="util-report-detached-placeholder-sub">${escapeHtml(rangeLabel)} / 지표: ${escapeHtml(metricLabel)}</div>
                    <div class="util-report-detached-placeholder-note">그래프 클릭 포커스와 기준 변경은 분리창 표에만 반영됩니다. 하단 복귀는 상단의 표 복귀 버튼을 사용하면 됩니다.</div>
                </div>
            `;
        }

        function renderUtilReportInlineDetailContent(result) {
            if (UtilReportDetachedTableState.detached) {
                return renderUtilReportDetachedPlaceholder(result);
            }
            return `
                <div class="util-report-inline-table-wrap">
                    ${renderUtilReportYoYTable(result, resolveUtilReportDetailMetricKey(), UtilReportState.compareYear)}
                </div>
            `;
        }

        function buildUtilEnergyDetachedTableShellHtml() {
            return `
                <!doctype html>
                <html lang="ko">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>유틸리티 열량 보고서 상세표</title>
                    <style>${getUtilReportDetachedTableStyles()}</style>
                </head>
                <body>
                    <div class="util-report-detached-shell">
                        <div class="util-report-detached-head">
                            <div class="util-report-detached-meta">
                                <div class="util-report-detached-title" data-role="util-report-detached-title">유틸리티 열량 보고서 상세표</div>
                                <div class="util-report-detached-sub" data-role="util-report-detached-sub">기간: -</div>
                                <div class="util-report-detached-status" data-role="util-report-detached-status">지표: -</div>
                            </div>
                            <button type="button" class="util-report-detached-close" data-role="util-report-detached-close">닫기</button>
                        </div>
                        <div class="util-report-detached-body" data-role="util-report-detached-body">
                            <div class="util-report-detached-empty">표를 준비 중입니다.</div>
                        </div>
                    </div>
                    <script>
                        document.addEventListener('click', function(event) {
                            if (event.target && event.target.closest('[data-role="util-report-detached-close"]')) {
                                self.close();
                            }
                        });
                    <\/script>
                </body>
                </html>
            `;
        }

        function renderUtilEnergyDetachedPlaceholder(result, descriptor) {
            const rangeLabel = result?.rangeLabel ? `기간: ${result.rangeLabel}` : '기간: 데이터 없음';
            const compareLabel = UtilEnergyReportState.compareYear
                ? `${UtilEnergyReportState.compareYear} 기준 비교표`
                : '기간 순 상세표';
            return `
                <div class="util-report-detached-placeholder">
                    <div class="util-report-detached-placeholder-title">상세표가 별도 창으로 분리되어 있습니다.</div>
                    <div class="util-report-detached-placeholder-sub">${escapeHtml(rangeLabel)} / 보기: ${escapeHtml(compareLabel)} / 선택: ${escapeHtml(descriptor?.label || '전체 열량')}</div>
                    <div class="util-report-detached-placeholder-note">그래프 클릭 포커스와 기준 변경은 분리창 표에만 반영됩니다. 상단 버튼으로 표를 복귀할 수 있습니다.</div>
                </div>
            `;
        }

        function getUtilReportBuilderVizDetachedTableWindow() {
            const popup = UtilReportBuilderVizDetachedTableState.win;
            if (!popup) return null;
            try {
                if (popup.closed) {
                    UtilReportBuilderVizDetachedTableState.win = null;
                    return null;
                }
            } catch (error) {
                UtilReportBuilderVizDetachedTableState.win = null;
                return null;
            }
            return popup;
        }

        function buildUtilReportBuilderVizDetachedTableShellHtml() {
            return `
                <!doctype html>
                <html lang="ko">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>유틸리티 개별 보고서 상세표</title>
                    <style>${getUtilReportDetachedTableStyles()}</style>
                </head>
                <body>
                    <div class="util-report-detached-shell">
                        <div class="util-report-detached-head">
                            <div class="util-report-detached-meta">
                                <div class="util-report-detached-title" data-role="util-report-detached-title">유틸리티 개별 보고서 상세표</div>
                                <div class="util-report-detached-sub" data-role="util-report-detached-sub">기간: -</div>
                                <div class="util-report-detached-status" data-role="util-report-detached-status">보기: -</div>
                            </div>
                            <button type="button" class="util-report-detached-close" data-role="util-report-detached-close">닫기</button>
                        </div>
                        <div class="util-report-detached-body" data-role="util-report-detached-body">
                            <div class="util-report-detached-empty">표를 준비 중입니다.</div>
                        </div>
                    </div>
                    <script>
                        document.addEventListener('click', function(event) {
                            if (event.target && event.target.closest('[data-role="util-report-detached-close"]')) {
                                self.close();
                            }
                        });
                    <\/script>
                </body>
                </html>
            `;
        }

        function getUtilReportBuilderVizCurrentDetailDescriptor(data = null) {
            const panelKey = normalizeUtilReportBuilderVizChartView(UtilReportBuilderVizState.chartViewKey);
            const itemKey = normalizeUtilReportBuilderItemKey(data?.itemKey || UtilReportBuilderVizState.itemKey);
            const itemLabel = String(data?.itemLabel || getUtilReportBuilderVizItemLabel(itemKey) || '개별 보고서');
            const teamLabel = normalizeUtilReportBuilderTeam(data?.team || UtilReportBuilderVizState.team, itemKey);
            const ratioConfig = resolveUtilReportBuilderVizRatioConfig(itemKey);
            const ratioNumeratorMetric = String(data?.ratioNumeratorMetric || ratioConfig.numeratorMetric || '').trim();
            const ratioDenominatorMetric = String(data?.ratioDenominatorMetric || ratioConfig.denominatorMetric || '').trim();
            const ratioUseDenominator = typeof data?.ratioUseDenominator === 'boolean'
                ? data.ratioUseDenominator
                : ratioConfig.useDenominator;
            const range = normalizeMonthRange(
                data?.range?.start || UtilReportBuilderVizState.from,
                data?.range?.end || UtilReportBuilderVizState.to
            );
            const rangeLabel = data?.result?.rangeLabel
                ? `기간: ${data.result.rangeLabel}`
                : `기간: ${range.start} ~ ${range.end}`;
            const ratioTitle = String(
                data?.ratioTitle
                || getUtilReportBuilderVizRatioTitle(itemKey, ratioNumeratorMetric, ratioDenominatorMetric, ratioUseDenominator)
                || '비율'
            );
            const panelLabel = panelKey === 'ratio'
                ? (data?.appliedModeEnabled === true ? `${ratioTitle} 적용 분석` : ratioTitle)
                : '사용량 · 비용 · 생산량';
            return {
                panelKey,
                itemKey,
                itemLabel,
                teamLabel,
                rangeLabel,
                panelLabel
            };
        }

        function renderUtilReportBuilderVizDetachedPlaceholder(data = null) {
            const descriptor = getUtilReportBuilderVizCurrentDetailDescriptor(data);
            return `
                <div class="util-report-detached-placeholder">
                    <div class="util-report-detached-placeholder-title">상세표가 별도 창으로 분리되어 있습니다.</div>
                    <div class="util-report-detached-placeholder-sub">${escapeHtml(descriptor.rangeLabel)} / 항목: ${escapeHtml(descriptor.itemLabel)} / 팀: ${escapeHtml(descriptor.teamLabel)} / 보기: ${escapeHtml(descriptor.panelLabel)}</div>
                    <div class="util-report-detached-placeholder-note">그래프 클릭 포커스와 기준 변경은 분리창 표에만 반영됩니다. 상단 버튼으로 표를 복귀할 수 있습니다.</div>
                </div>
            `;
        }

        function renderUtilReportBuilderVizCurrentDetailContent(data = null) {
            if (!data) {
                return '<div class="util-report-builder-viz-detail-empty">표시할 데이터가 없습니다.</div>';
            }
            const panelKey = normalizeUtilReportBuilderVizChartView(UtilReportBuilderVizState.chartViewKey);
            const focusMonthKey = normalizeUtilReportMonthKey(UtilReportBuilderVizState.focusMonthKey);
            if (panelKey === 'ratio') {
                return data?.appliedModeEnabled === true
                    ? (renderUtilReportBuilderVizAppliedComparisonDetailNext(data, focusMonthKey)
                        || '<div class="util-report-detached-empty">원단위 기준과 적용 대상을 선택하면 적용 분석 상세표가 표시됩니다.</div>')
                    : renderUtilReportBuilderVizRatioDetailTable(data, focusMonthKey);
            }
            const focusSeriesKey = normalizeUtilReportBuilderVizSeriesKey(
                UtilReportBuilderVizState.detailFocusSeriesKey
                || UtilReportBuilderVizState.isolatedSeriesKey
                || UtilReportBuilderVizState.focusSeriesKey
            );
            return renderUtilReportBuilderVizSeriesDetailTable(data, focusSeriesKey, focusMonthKey);
        }

        function syncUtilReportBuilderVizActionState(modal, data = null) {
            if (!modal) return;
            const descriptor = getUtilReportBuilderVizCurrentDetailDescriptor(data);
            modal.classList.toggle('is-chart-fullscreen', UtilReportBuilderVizState.chartFullscreen === true);
            const detachButtons = Array.from(modal.querySelectorAll('[data-role="util-report-builder-viz-inline-detach"]'));
            detachButtons.forEach(button => {
                button.textContent = UtilReportBuilderVizDetachedTableState.detached ? '표 복귀' : '표 분리';
                button.setAttribute('aria-label', `${descriptor.panelLabel} ${UtilReportBuilderVizDetachedTableState.detached ? '표 복귀' : '표 분리'}`);
                button.setAttribute('title', `${descriptor.panelLabel} ${UtilReportBuilderVizDetachedTableState.detached ? '표 복귀' : '표 분리'}`);
            });
            const fullscreenButtons = Array.from(modal.querySelectorAll('[data-role="util-report-builder-viz-chart-fullscreen-toggle"]'));
            fullscreenButtons.forEach(button => {
                const actionLabel = UtilReportBuilderVizState.chartFullscreen === true ? '차트 복원' : '차트 확대';
                syncUtilReportChartFullscreenToggleButton(button, UtilReportBuilderVizState.chartFullscreen === true);
                button.setAttribute('aria-label', `${descriptor.panelLabel} ${actionLabel}`);
                button.setAttribute('title', `${descriptor.panelLabel} ${actionLabel}`);
            });
        }

        function refreshUtilReportBuilderVizModalAfterDetach() {
            const modal = document.getElementById('util-report-builder-viz-modal');
            if (modal && modal.classList.contains('is-open')) {
                renderUtilReportBuilderVizHost(modal);
            }
            renderUtilReportBuilderVizPopupWindow();
        }

        function syncUtilReportBuilderVizDetachedTableWindow(data = null) {
            const popup = getUtilReportBuilderVizDetachedTableWindow();
            if (!popup) return;
            try {
                const descriptor = getUtilReportBuilderVizCurrentDetailDescriptor(data);
                const doc = popup.document;
                const titleEl = doc.querySelector('[data-role="util-report-detached-title"]');
                const subEl = doc.querySelector('[data-role="util-report-detached-sub"]');
                const statusEl = doc.querySelector('[data-role="util-report-detached-status"]');
                const bodyEl = doc.querySelector('[data-role="util-report-detached-body"]');
                if (titleEl) titleEl.textContent = `${descriptor.itemLabel} 보고서 상세표`;
                if (subEl) subEl.textContent = descriptor.rangeLabel;
                if (statusEl) statusEl.textContent = `팀: ${descriptor.teamLabel} / 보기: ${descriptor.panelLabel}`;
                if (bodyEl) {
                    bodyEl.innerHTML = data
                        ? `<div class="util-report-detached-table-wrap">${renderUtilReportBuilderVizCurrentDetailContent(data)}</div>`
                        : '<div class="util-report-detached-empty">표시할 데이터가 없습니다.</div>';
                    scrollUtilReportFocusedElementIntoView(bodyEl, { behavior: 'auto' });
                }
                doc.title = `${descriptor.itemLabel} 상세표 - ${descriptor.panelLabel}`;
            } catch (error) {
                closeUtilReportBuilderVizDetachedTableWindow();
            }
        }

        function closeUtilReportBuilderVizDetachedTableWindow() {
            const popup = getUtilReportBuilderVizDetachedTableWindow();
            UtilReportBuilderVizDetachedTableState.win = null;
            UtilReportBuilderVizDetachedTableState.detached = false;
            if (popup) {
                try { popup.close(); } catch (error) {}
            }
            refreshUtilReportBuilderVizModalAfterDetach();
        }

        function openUtilReportBuilderVizDetachedTableWindow(data = null) {
            if (!getUtilReportDetachedRootFlag('__utilReportBuilderVizDetachedUnloadBound')) {
                setUtilReportDetachedRootFlag('__utilReportBuilderVizDetachedUnloadBound', true);
                addUtilReportDetachedGlobalListener('beforeunload', () => {
                    closeUtilReportBuilderVizDetachedTableWindow();
                });
                addUtilReportDetachedGlobalListener('pagehide', () => {
                    closeUtilReportBuilderVizDetachedTableWindow();
                });
            }

            let popup = getUtilReportBuilderVizDetachedTableWindow();
            const wasDetached = UtilReportBuilderVizDetachedTableState.detached === true;
            if (!popup) {
                popup = openUtilReportDetachedBrowserWindow('', 'util-report-builder-viz-detached-table', 'popup=yes,width=1180,height=780,left=96,top=96,resizable=yes,scrollbars=yes');
                if (!popup) {
                    showUtilReportDetachedAlert('표 분리창을 열 수 없습니다. 브라우저 팝업 차단을 확인해 주세요.');
                    return null;
                }
                UtilReportBuilderVizDetachedTableState.win = popup;
                popup.document.open();
                popup.document.write(buildUtilReportBuilderVizDetachedTableShellHtml());
                popup.document.close();
                popup.onbeforeunload = () => {
                    if (UtilReportBuilderVizDetachedTableState.win === popup) {
                        UtilReportBuilderVizDetachedTableState.win = null;
                        if (UtilReportBuilderVizDetachedTableState.detached) {
                            UtilReportBuilderVizDetachedTableState.detached = false;
                            refreshUtilReportBuilderVizModalAfterDetach();
                        }
                    }
                };
            }

            UtilReportBuilderVizDetachedTableState.detached = true;
            syncUtilReportBuilderVizDetachedTableWindow(data);
            if (!wasDetached) {
                refreshUtilReportBuilderVizModalAfterDetach();
            }
            try {
                popup.focus();
            } catch (error) {}
            return popup;
        }
        function syncUtilReportInlineInsightState(modal) {
            if (modal) {
                modal.classList.toggle('is-inline-table-detached', UtilReportDetachedTableState.detached === true);
            }
            const inlineInsightEl = modal?.querySelector?.('[data-role="util-report-inline-insight"]');
            const noteEl = inlineInsightEl?.querySelector?.('.util-report-inline-insight-note');
            const detachButtons = Array.from(modal?.querySelectorAll?.('[data-role="util-report-inline-detach"]') || []);
            if (!inlineInsightEl) return;
            inlineInsightEl.classList.toggle('is-detached', UtilReportDetachedTableState.detached === true);
            detachButtons.forEach(button => {
                button.textContent = UtilReportDetachedTableState.detached ? '표 복귀' : '표 분리';
            });
            if (noteEl) {
                noteEl.textContent = UtilReportDetachedTableState.detached
                    ? '상세표는 별도 창에서 보고 있습니다. 그래프 클릭 포커스도 분리창으로만 이동합니다.'
                    : '차트/원형그래프를 눌러 기준을 바꾸고, 상단 표 분리 버튼으로 별도 창을 켜고 끕니다.';
            }
        }

        function refreshUtilReportModalAfterDetach(result = null) {
            const modal = document.getElementById('util-report-modal');
            if (!modal || !modal.classList.contains('is-open')) return;
            const nextResult = result || UtilReportState.lastResult || runUtilReportFromState({ renderModal: false });
            renderUtilReportModal(nextResult);
        }

        function syncUtilReportDetachedTableWindow(result) {
            const popup = getUtilReportDetachedTableWindow();
            if (!popup) return;
            try {
                const doc = popup.document;
                const titleEl = doc.querySelector('[data-role="util-report-detached-title"]');
                const subEl = doc.querySelector('[data-role="util-report-detached-sub"]');
                const statusEl = doc.querySelector('[data-role="util-report-detached-status"]');
                const bodyEl = doc.querySelector('[data-role="util-report-detached-body"]');
                const metricKey = resolveUtilReportDetailMetricKey();
                const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
                const rangeLabel = result?.rangeLabel ? `기간: ${result.rangeLabel}` : '기간: 데이터 없음';
                const compareLabel = UtilReportState.compareYear
                    ? `${UtilReportState.compareYear} 기준 비교표`
                    : '기간 순 상세표';
                if (titleEl) titleEl.textContent = '유틸리티 통합 보고서 상세표';
                if (subEl) subEl.textContent = rangeLabel;
                if (statusEl) statusEl.textContent = `지표: ${metricLabel} / 보기: ${compareLabel}`;
                if (bodyEl) {
                    if (result && Array.isArray(result.rows) && result.rows.length) {
                        bodyEl.innerHTML = `
                            <div class="util-report-detached-table-wrap">
                                ${renderUtilReportYoYTable(result, metricKey, UtilReportState.compareYear)}
                            </div>
                        `;
                    } else {
                        bodyEl.innerHTML = '<div class="util-report-detached-empty">표시할 데이터가 없습니다.</div>';
                    }
                }
                doc.title = `유틸리티 상세표 - ${metricLabel}`;
                if (UtilReportDetachedTableState.focusMonthKey || UtilReportDetachedTableState.focusMonthToken) {
                    focusUtilReportDetachedTableByMonth({
                        monthToken: UtilReportDetachedTableState.focusMonthToken,
                        monthKey: UtilReportDetachedTableState.focusMonthKey,
                        seriesKey: UtilReportDetachedTableState.focusSeriesKey
                    }, { scroll: false });
                }
            } catch (error) {
                closeUtilReportDetachedTableWindow();
            }
        }

        function closeUtilReportDetachedTableWindow() {
            const popup = getUtilReportDetachedTableWindow();
            UtilReportDetachedTableState.win = null;
            UtilReportDetachedTableState.detached = false;
            if (!popup) {
                refreshUtilReportModalAfterDetach();
                return;
            }
            try {
                popup.close();
            } catch (error) {}
            refreshUtilReportModalAfterDetach();
        }

        function openUtilReportDetachedTableWindow() {
            if (!getUtilReportDetachedRootFlag('__utilReportDetachedTableUnloadBound')) {
                setUtilReportDetachedRootFlag('__utilReportDetachedTableUnloadBound', true);
                addUtilReportDetachedGlobalListener('beforeunload', () => {
                    closeUtilReportDetachedTableWindow();
                });
                addUtilReportDetachedGlobalListener('pagehide', () => {
                    closeUtilReportDetachedTableWindow();
                });
            }

            let popup = getUtilReportDetachedTableWindow();
            const wasDetached = UtilReportDetachedTableState.detached === true;
            if (!popup) {
                popup = openUtilReportDetachedBrowserWindow('', 'util-report-detached-table', 'popup=yes,width=1100,height=760,left=80,top=80,resizable=yes,scrollbars=yes');
                if (!popup) {
                    showUtilReportDetachedAlert('표 분리창을 열 수 없습니다. 브라우저 팝업 차단을 확인해 주세요.');
                    return null;
                }
                UtilReportDetachedTableState.win = popup;
                popup.document.open();
                popup.document.write(buildUtilReportDetachedTableShellHtml());
                popup.document.close();
                popup.onbeforeunload = () => {
                    if (UtilReportDetachedTableState.win === popup) {
                        UtilReportDetachedTableState.win = null;
                        if (UtilReportDetachedTableState.detached) {
                            UtilReportDetachedTableState.detached = false;
                            refreshUtilReportModalAfterDetach();
                        }
                    }
                };
            }

            UtilReportDetachedTableState.detached = true;
            syncUtilReportDetachedTableWindow(UtilReportState.lastResult || runUtilReportFromState({ renderModal: false }));
            if (!wasDetached) {
                refreshUtilReportModalAfterDetach();
            }
            try {
                popup.focus();
            } catch (error) {}
            return popup;
        }

        function syncUtilEnergyInlineInsightState(modal) {
            const inlineInsightEl = modal?.querySelector?.('[data-role="util-energy-report-inline-insight"]');
            const noteEl = modal?.querySelector?.('[data-role="util-energy-report-detail-note"]');
            const detachButtons = Array.from(modal?.querySelectorAll?.('[data-role="util-energy-report-inline-detach"]') || []);
            if (!inlineInsightEl) return;
            inlineInsightEl.classList.toggle('is-detached', UtilEnergyDetachedTableState.detached === true);
            detachButtons.forEach(button => {
                button.textContent = UtilEnergyDetachedTableState.detached ? '표 복귀' : '표 분리';
            });
            const baseNote = String(noteEl?.dataset?.baseNote || '').trim();
            if (noteEl) {
                noteEl.textContent = UtilEnergyDetachedTableState.detached
                    ? '상세표는 별도 창에서 보고 있습니다. 그래프 클릭 포커스도 분리창으로만 이동합니다.'
                    : (baseNote || '차트/원형그래프를 눌러 기준을 바꾸고, 상단 표 분리 버튼으로 별도 창을 켜고 끕니다.');
            }
        }

        function refreshUtilEnergyModalAfterDetach(result = null) {
            const modal = document.getElementById('util-energy-modal');
            if (!modal || !modal.classList.contains('is-open')) return;
            const nextResult = result || UtilEnergyReportState.lastResult || buildUtilEnergyReportResult(UtilEnergyReportState);
            renderUtilEnergyModal(nextResult);
        }

        function syncUtilEnergyDetachedTableWindow(result, descriptor) {
            const popup = getUtilEnergyDetachedTableWindow();
            if (!popup) return;
            try {
                const doc = popup.document;
                const titleEl = doc.querySelector('[data-role="util-report-detached-title"]');
                const subEl = doc.querySelector('[data-role="util-report-detached-sub"]');
                const statusEl = doc.querySelector('[data-role="util-report-detached-status"]');
                const bodyEl = doc.querySelector('[data-role="util-report-detached-body"]');
                const rangeLabel = result?.rangeLabel ? `기간: ${result.rangeLabel}` : '기간: 데이터 없음';
                const compareLabel = UtilEnergyReportState.compareYear
                    ? `${UtilEnergyReportState.compareYear} 기준 비교표`
                    : '기간 순 상세표';
                if (titleEl) titleEl.textContent = '유틸리티 열량 보고서 상세표';
                if (subEl) subEl.textContent = rangeLabel;
                if (statusEl) statusEl.textContent = `선택: ${descriptor?.label || '전체 열량'} / 보기: ${compareLabel}`;
                if (bodyEl) {
                    if (result && Array.isArray(result.rows) && result.rows.length) {
                        bodyEl.innerHTML = `
                            <div class="util-report-detached-table-wrap">
                                ${renderUtilEnergyReportDetailTable(result, descriptor)}
                            </div>
                        `;
                    } else {
                        bodyEl.innerHTML = '<div class="util-report-detached-empty">표시할 데이터가 없습니다.</div>';
                    }
                }
                doc.title = `열량 상세표 - ${descriptor?.label || '전체 열량'}`;
                if (UtilEnergyDetachedTableState.focusMonthKey || UtilEnergyDetachedTableState.focusMonthToken) {
                    focusUtilEnergyDetachedTableByMonth({
                        monthToken: UtilEnergyDetachedTableState.focusMonthToken,
                        monthKey: UtilEnergyDetachedTableState.focusMonthKey,
                        seriesKey: UtilEnergyDetachedTableState.focusSeriesKey
                    }, { scroll: false });
                }
            } catch (error) {
                closeUtilEnergyDetachedTableWindow();
            }
        }

        function closeUtilEnergyDetachedTableWindow() {
            const popup = getUtilEnergyDetachedTableWindow();
            UtilEnergyDetachedTableState.win = null;
            UtilEnergyDetachedTableState.detached = false;
            if (popup) {
                try { popup.close(); } catch (error) {}
            }
            refreshUtilEnergyModalAfterDetach();
        }

        function openUtilEnergyDetachedTableWindow(result, descriptor) {
            if (!getUtilReportDetachedRootFlag('__utilEnergyDetachedTableUnloadBound')) {
                setUtilReportDetachedRootFlag('__utilEnergyDetachedTableUnloadBound', true);
                addUtilReportDetachedGlobalListener('beforeunload', () => {
                    closeUtilEnergyDetachedTableWindow();
                });
                addUtilReportDetachedGlobalListener('pagehide', () => {
                    closeUtilEnergyDetachedTableWindow();
                });
            }

            let popup = getUtilEnergyDetachedTableWindow();
            const wasDetached = UtilEnergyDetachedTableState.detached === true;
            if (!popup) {
                popup = openUtilReportDetachedBrowserWindow('', 'util-energy-detached-table', 'popup=yes,width=1180,height=780,left=100,top=100,resizable=yes,scrollbars=yes');
                if (!popup) {
                    showUtilReportDetachedAlert('표 분리창을 열 수 없습니다. 브라우저 팝업 차단을 확인해 주세요.');
                    return null;
                }
                UtilEnergyDetachedTableState.win = popup;
                popup.document.open();
                popup.document.write(buildUtilEnergyDetachedTableShellHtml());
                popup.document.close();
                popup.onbeforeunload = () => {
                    if (UtilEnergyDetachedTableState.win === popup) {
                        UtilEnergyDetachedTableState.win = null;
                        if (UtilEnergyDetachedTableState.detached) {
                            UtilEnergyDetachedTableState.detached = false;
                            refreshUtilEnergyModalAfterDetach();
                        }
                    }
                };
            }

            UtilEnergyDetachedTableState.detached = true;
            syncUtilEnergyDetachedTableWindow(result || UtilEnergyReportState.lastResult || buildUtilEnergyReportResult(UtilEnergyReportState), descriptor || resolveUtilEnergyReportSelectionDescriptor(UtilEnergyReportState.lastResult || buildUtilEnergyReportResult(UtilEnergyReportState)));
            if (!wasDetached) {
                refreshUtilEnergyModalAfterDetach(result);
            }
            try {
                popup.focus();
            } catch (error) {}
            return popup;
        }

        function bindUtilEnergyInlineInsightControls(modal) {
            if (!modal) return;
            const detachButtons = modal.querySelectorAll('[data-role="util-energy-report-inline-detach"]');
            detachButtons.forEach(detachBtn => {
                if (detachBtn.dataset.bound === 'true') return;
                detachBtn.dataset.bound = 'true';
                detachBtn.addEventListener('click', () => {
                    if (UtilEnergyDetachedTableState.detached) {
                        closeUtilEnergyDetachedTableWindow();
                    } else {
                        openUtilEnergyDetachedTableWindow(UtilEnergyReportState.lastResult, resolveUtilEnergyReportSelectionDescriptor(UtilEnergyReportState.lastResult || buildUtilEnergyReportResult(UtilEnergyReportState)));
                    }
                });
            });
        }

        function bindUtilReportInlineInsightControls(modal) {
            if (!modal) return;
            const detachButtons = modal.querySelectorAll('[data-role="util-report-inline-detach"]');
            detachButtons.forEach(detachBtn => {
                if (detachBtn.dataset.bound === 'true') return;
                detachBtn.dataset.bound = 'true';
                detachBtn.addEventListener('click', () => {
                    if (UtilReportDetachedTableState.detached) {
                        closeUtilReportDetachedTableWindow();
                    } else {
                        openUtilReportDetachedTableWindow();
                    }
                });
            });
        }
