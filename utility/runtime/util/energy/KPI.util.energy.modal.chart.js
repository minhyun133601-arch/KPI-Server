        const utilEnergyModalChartBrowser = typeof KpiUtilEnergyBrowserAdapter !== 'undefined'
            ? KpiUtilEnergyBrowserAdapter
            : null;

        function addUtilEnergyModalChartEventListener(type, listener, options) {
            utilEnergyModalChartBrowser?.addEventListener?.(type, listener, options);
        }

        function openUtilEnergyModalChartPopup(url, target, features) {
            return utilEnergyModalChartBrowser?.openPopup?.(url, target, features) || null;
        }

        function printUtilEnergyModalChartPage() {
            utilEnergyModalChartBrowser?.printPage?.();
        }

        function useUtilEnergyModalChartRootFlag(flagName) {
            return utilEnergyModalChartBrowser?.useRootFlag?.(flagName) === true;
        }

        const UtilChartDetachedState = {
            win: null,
            detached: false
        };

        function downloadUtilChartImage() {
            const modal = document.getElementById('util-chart-modal');
            if (!modal) return;
            const chartSvgs = Array.from(modal.querySelectorAll('[data-role="chart"] svg'));
            if (!chartSvgs.length) return;
            const styleText = `
                .util-analytics-chart-grid{stroke:#e5e7eb;stroke-dasharray:0;}
                .util-analytics-chart-axis{stroke:#9ca3af;stroke-width:1.2;}
                .util-analytics-chart-line{stroke:#111827;stroke-width:2.6;fill:none;}
                .util-analytics-chart-area{fill:rgba(17,24,39,0.08);}
                .util-analytics-chart-band{fill:transparent;}
                .util-analytics-chart-point{fill:#111827;stroke:#ffffff;stroke-width:1.2;}
                .util-analytics-chart-label{fill:#6b7280;font-size:12px;font-weight:600;font-family:Segoe UI, Arial, sans-serif;}
                .util-analytics-chart-year{fill:#111827;font-size:12px;font-weight:800;font-family:Segoe UI, Arial, sans-serif;}
                .util-analytics-chart-year-sep{stroke:#9ca3af;stroke-width:1.2;}
                .util-analytics-chart-value{fill:#111827;font-size:11px;font-weight:700;font-family:Segoe UI, Arial, sans-serif;}
            `;
            const svgPayloads = chartSvgs.map(svgEl => {
                const svgClone = svgEl.cloneNode(true);
                const viewBox = svgClone.getAttribute('viewBox');
                let width = 0;
                let height = 0;
                if (viewBox) {
                    const parts = viewBox.split(' ').map(Number);
                    if (parts.length === 4) {
                        width = parts[2];
                        height = parts[3];
                        svgClone.setAttribute('width', width);
                        svgClone.setAttribute('height', height);
                    }
                }
                const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                styleEl.textContent = styleText;
                svgClone.insertBefore(styleEl, svgClone.firstChild);
                const serializer = new XMLSerializer();
                const svgText = serializer.serializeToString(svgClone);
                const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                return { url, width, height };
            });
            Promise.all(svgPayloads.map(payload => new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ img, width: payload.width || img.width, height: payload.height || img.height, url: payload.url });
                img.src = payload.url;
            }))).then(images => {
                const gap = 24;
                const totalWidth = Math.max(...images.map(item => item.width));
                const totalHeight = images.reduce((acc, item) => acc + item.height, 0) + gap * (images.length - 1);
                const canvas = document.createElement('canvas');
                canvas.width = totalWidth;
                canvas.height = totalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                let offsetY = 0;
                images.forEach(item => {
                    ctx.drawImage(item.img, 0, offsetY, item.width, item.height);
                    offsetY += item.height + gap;
                    URL.revokeObjectURL(item.url);
                });
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                const nameBase = modal._chartData?.datasetLabel || 'util';
                link.download = `${nameBase}.png`;
                link.href = pngUrl;
                link.click();
            });
        }

        function normalizeUtilChartDataList(chartData) {
            const list = Array.isArray(chartData) ? chartData : [chartData];
            return list.filter(Boolean);
        }

        function buildUtilChartMetaHtml(dataList) {
            if (dataList.length > 1) {
                return `<span>겹침 그래프: ${dataList.length}개</span>`;
            }
            const single = dataList[0] || {};
            return `
                <span>${escapeHtml(single.datasetLabel || '')}</span>
                <span>${escapeHtml(single.teamLabel || '')}</span>
                <span>${escapeHtml(single.metricLabel || '')}</span>
                <span>${escapeHtml(single.from || '')} ~ ${escapeHtml(single.to || '')}</span>
            `;
        }

        function getUtilChartDetachedWindow() {
            const popup = UtilChartDetachedState.win;
            if (popup && !popup.closed) return popup;
            UtilChartDetachedState.win = null;
            return null;
        }

        function closeUtilChartLinkedDetachedTables() {
            if (typeof closeUtilEnergyDetachedTableWindow === 'function') {
                closeUtilEnergyDetachedTableWindow();
            }
            if (typeof closeUtilReportDetachedTableWindow === 'function') {
                closeUtilReportDetachedTableWindow();
            }
        }

        function syncUtilChartDetachButtonState(root = document) {
            const buttons = Array.from(root?.querySelectorAll?.('[data-chart-action="detach"]') || []);
            buttons.forEach(button => {
                button.textContent = UtilChartDetachedState.detached ? '그래프 복귀' : '그래프 팝업';
                button.setAttribute('aria-pressed', UtilChartDetachedState.detached ? 'true' : 'false');
                button.setAttribute('title', UtilChartDetachedState.detached ? '그래프 팝업 닫기' : '그래프 팝업 열기');
            });
        }

        function getUtilChartDetachedHeadAssetsHtml() {
            return Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(node => node.outerHTML)
                .join('');
        }

        function buildUtilChartDetachedShellHtml() {
            return `
                <!doctype html>
                <html lang="ko">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>유틸리티 그래프</title>
                    ${getUtilChartDetachedHeadAssetsHtml()}
                    <style>
                        body { margin: 0; background: #dbe4f3; color: #0f172a; }
                        .util-chart-detached-shell { min-height: 100vh; background: #dbe4f3; }
                        .util-chart-detached-shell .util-chart-modal { position: static; inset: auto; display: block; padding: 0; background: none; }
                        .util-chart-detached-shell .util-chart-modal-card { width: 100%; min-height: 100vh; border-radius: 0; box-shadow: none; }
                        .util-chart-detached-shell .util-chart-modal-header { position: sticky; top: 0; z-index: 5; cursor: grab; user-select: none; }
                        .util-chart-detached-shell .util-chart-modal-header.is-window-dragging { cursor: grabbing; }
                        .util-chart-detached-shell .util-chart-modal-body { min-height: calc(100vh - 70px); }
                        .util-chart-detached-shell .util-chart-modal-scroll { min-height: calc(100vh - 128px); }
                    </style>
                </head>
                <body>
                    <div class="util-chart-detached-shell" data-role="util-chart-detached-root"></div>
                </body>
                </html>
            `;
        }

        function bindUtilChartDetachedWindowDrag(popup) {
            if (!popup || popup.__utilChartDetachedDragBound) return;
            popup.__utilChartDetachedDragBound = true;

            let activePointerId = null;
            let startScreenX = 0;
            let startScreenY = 0;
            let headEl = null;

            const isInteractiveTarget = target => !!target?.closest?.('button, input, select, textarea, label, a, summary, details, [contenteditable]');
            const finishDrag = () => {
                if (headEl) headEl.classList.remove('is-window-dragging');
                activePointerId = null;
                headEl = null;
            };

            popup.document.addEventListener('pointerdown', event => {
                const nextHead = event.target?.closest?.('.util-chart-modal-header');
                if (!nextHead) return;
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (isInteractiveTarget(event.target)) return;
                activePointerId = event.pointerId;
                startScreenX = event.screenX;
                startScreenY = event.screenY;
                headEl = nextHead;
                headEl.classList.add('is-window-dragging');
                if (typeof headEl.setPointerCapture === 'function') {
                    try { headEl.setPointerCapture(activePointerId); } catch (error) {}
                }
                event.preventDefault();
            });

            popup.document.addEventListener('pointermove', event => {
                if (activePointerId === null || event.pointerId !== activePointerId) return;
                const diffX = event.screenX - startScreenX;
                const diffY = event.screenY - startScreenY;
                startScreenX = event.screenX;
                startScreenY = event.screenY;
                if (!diffX && !diffY) return;
                try {
                    popup.moveBy(diffX, diffY);
                } catch (error) {}
                event.preventDefault();
            });

            popup.document.addEventListener('pointerup', event => {
                if (event.pointerId !== activePointerId) return;
                finishDrag();
            });
            popup.document.addEventListener('pointercancel', event => {
                if (event.pointerId !== activePointerId) return;
                finishDrag();
            });
            popup.document.addEventListener('lostpointercapture', finishDrag, true);
            popup.addEventListener('blur', finishDrag);
        }

        function buildUtilChartDetachedCardHtml(dataList, showLabels) {
            const list = normalizeUtilChartDataList(dataList);
            const chartHtml = !list.length
                ? `
                    <div class="util-analytics-chart util-analytics-chart-empty is-modal">
                        <div class="util-analytics-chart-empty-text">표시할 그래프 데이터가 없습니다.</div>
                    </div>
                `
                : (list.length === 1
                    ? renderUtilTrendChart(list[0].points || [], list[0].metricLabel, {
                        mode: 'modal',
                        decimals: list[0].decimals,
                        chartType: list[0].chartType || 'line',
                        showTypeSelect: false,
                        showLabelToggle: true,
                        showLabels
                    })
                    : (() => {
                        const combined = buildUtilCombinedSeries(list);
                        return renderUtilMultiSeriesChart(combined.series, {
                            mode: 'modal',
                            decimals: combined.decimals,
                            showLabelToggle: true,
                            showLabels
                        });
                    })());
            return `
                <div class="util-chart-modal is-open" data-role="util-chart-detached-modal">
                    <div class="util-chart-modal-card" role="dialog" aria-modal="true" aria-label="유틸리티 그래프">
                        <div class="util-chart-modal-header">
                            <div class="util-chart-modal-title">유틸리티 그래프</div>
                            <div class="util-chart-modal-actions">
                                <button type="button" class="util-chart-modal-close" data-role="util-chart-detached-close">닫기</button>
                            </div>
                        </div>
                        <div class="util-chart-modal-body">
                            <div class="util-chart-modal-meta">${buildUtilChartMetaHtml(list)}</div>
                            <div class="util-chart-modal-scroll">
                                <div data-role="util-chart-detached-chart">${chartHtml}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function syncUtilChartDetachedWindow() {
            const popup = getUtilChartDetachedWindow();
            if (!popup) return;
            const modal = ensureUtilChartModal();
            const list = normalizeUtilChartDataList(modal._chartDataList || modal._chartData || []);
            const showLabels = modal.dataset.showLabels !== 'false';
            const root = popup.document.querySelector('[data-role="util-chart-detached-root"]');
            if (!root) return;
            root.innerHTML = buildUtilChartDetachedCardHtml(list, showLabels);
            const closeBtn = popup.document.querySelector('[data-role="util-chart-detached-close"]');
            if (closeBtn) {
                closeBtn.onclick = () => closeUtilChartDetachedWindow();
            }
            const labelToggle = popup.document.querySelector('[data-chart-label-toggle]');
            if (labelToggle) {
                labelToggle.checked = showLabels;
                labelToggle.onchange = () => {
                    modal.dataset.showLabels = labelToggle.checked ? 'true' : 'false';
                    renderUtilChartModal();
                };
            }
        }

        function closeUtilChartDetachedWindow(options = {}) {
            const popup = getUtilChartDetachedWindow();
            UtilChartDetachedState.win = null;
            const wasDetached = UtilChartDetachedState.detached === true;
            UtilChartDetachedState.detached = false;
            if (popup && !popup.closed) {
                popup.close();
            }
            syncUtilChartDetachButtonState(document);
            if (wasDetached && options.closeLinkedTables !== false) {
                closeUtilChartLinkedDetachedTables();
            }
        }

        function openUtilChartDetachedWindow(chartData = null) {
            const modal = ensureUtilChartModal();
            const dataList = normalizeUtilChartDataList(chartData || modal._chartDataList || modal._chartData || []);
            if (!dataList.length) return false;
            modal._chartDataList = dataList;
            modal._chartData = dataList[0] || null;
            if (!modal.dataset.showLabels) {
                modal.dataset.showLabels = 'true';
            }
            let popup = getUtilChartDetachedWindow();
            if (!popup) {
                popup = openUtilEnergyModalChartPopup('', 'util-chart-detached-window', 'popup=yes,width=1480,height=920,resizable=yes,scrollbars=yes');
                if (!popup) {
                    UtilChartDetachedState.detached = false;
                    syncUtilChartDetachButtonState(document);
                    return false;
                }
                popup.document.open();
                popup.document.write(buildUtilChartDetachedShellHtml());
                popup.document.close();
                bindUtilChartDetachedWindowDrag(popup);
                UtilChartDetachedState.win = popup;
                popup.addEventListener('beforeunload', () => {
                    if (UtilChartDetachedState.win !== popup) return;
                    UtilChartDetachedState.win = null;
                    if (UtilChartDetachedState.detached) {
                        UtilChartDetachedState.detached = false;
                        syncUtilChartDetachButtonState(document);
                        closeUtilChartLinkedDetachedTables();
                    }
                });
            }
            UtilChartDetachedState.detached = true;
            syncUtilChartDetachButtonState(document);
            syncUtilChartDetachedWindow();
            if (popup.focus) popup.focus();
            return true;
        }

        function openUtilChartModal(chartData) {
            const modal = ensureUtilChartModal();
            const metaEl = modal.querySelector('[data-role="meta"]');
            if (!metaEl) return;
            const dataList = normalizeUtilChartDataList(chartData);
            if (!dataList.length) return;
            metaEl.innerHTML = buildUtilChartMetaHtml(dataList);
            modal._chartDataList = dataList;
            modal._chartData = dataList[0] || null;
            if (!modal.dataset.showLabels) {
                modal.dataset.showLabels = 'true';
            }
            renderUtilChartModal();
            syncUtilChartDetachButtonState(modal);
            if (UtilChartDetachedState.detached) {
                syncUtilChartDetachedWindow();
                return;
            }
            modal.classList.add('is-open');
        }

        function closeUtilChartModal(options = {}) {
            const modal = document.getElementById('util-chart-modal');
            if (!modal) return;
            modal.classList.remove('is-open');
            syncUtilChartDetachButtonState(modal);
            if (options.keepDetachedWindow !== true && UtilChartDetachedState.detached) {
                closeUtilChartDetachedWindow({ closeLinkedTables: options.closeLinkedTables !== false });
            }
            const energyOpen = document.getElementById('util-energy-modal')?.classList.contains('is-open');
            const reportOpen = document.getElementById('util-report-modal')?.classList.contains('is-open');
            const reportGraphOpen = document.getElementById('util-report-graph-modal')?.classList.contains('is-open');
            const reportYoYOpen = document.getElementById('util-report-yoy-modal')?.classList.contains('is-open');
            if (!energyOpen && !reportOpen && !reportGraphOpen && !reportYoYOpen) {
                document.body.style.overflow = '';
            }
        }

        function ensureUtilEnergyModal() {
            let modal = document.getElementById('util-energy-modal');
            if (modal) return modal;

            modal = document.createElement('div');
            modal.id = 'util-energy-modal';
            modal.className = 'util-energy-modal';
            modal.innerHTML = `
                <div class="util-energy-modal-card" role="dialog" aria-modal="true" aria-label="환산열량 분석">
                    <div class="util-energy-modal-head">
                        <div class="util-energy-modal-header">
                            <div>
                                <div class="util-energy-modal-title">환산열량 분석</div>
                                <div class="util-energy-modal-sub" data-role="util-energy-modal-sub">기간: -</div>
                            </div>
                            <div class="util-energy-modal-actions">
                                <button type="button" class="util-report-modal-btn" data-role="util-energy-modal-print">인쇄</button>
                                <button type="button" class="util-report-modal-close" data-role="util-energy-modal-close">닫기</button>
                            </div>
                        </div>
                    </div>
                    <div class="util-energy-modal-body">
                        <div class="util-tabs-wrap util-energy-wrap util-energy-dashboard util-energy-modal-shell" data-util-tabs="energy-converter">
                            <div class="util-energy-topbar">
                                <div class="util-energy-topbar-title"><i class="fa-solid fa-calculator"></i><span>전기·가스 열량 환산</span></div>
                                <div class="util-energy-topbar-sub">자동 연동/수동 입력 계산과 월별 추세를 탭으로 확인합니다.</div>
                            </div>
                            <div class="util-tabs util-energy-main-tabs">
                                <button type="button" class="util-tab-btn" data-tab="energy-converter"><i class="fa-solid fa-sliders"></i> 환산 계산</button>
                            </div>
                            <div class="util-tab-panels">
                                <div class="util-tab-panel" data-panel="energy-converter">
                                    <div class="util-analytics util-energy-converter-shell" data-util-energy data-util-tabs="energy">
                                        <div class="util-analytics-header">
                                            <div class="util-analytics-header-title"><i class="fa-solid fa-fire-flame-curved"></i><span>환산 계산</span></div>
                                        </div>
                                        <div class="util-analytics-desc">자동 연동 또는 수동 입력으로 MJ/GJ/TOE와 원단위를 계산합니다.</div>
                                        <div class="util-analytics-form" data-role="energy-link-form">
                                            <div class="util-analytics-field"><span class="util-analytics-label">데이터 연동</span><label class="util-dual-control"><input type="checkbox" data-role="energy-link-toggle" checked> 전기/가스 데이터 자동 합산</label></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">전기 팀</span><select class="util-analytics-select" data-role="energy-link-electric-team"></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">가스 팀</span><select class="util-analytics-select" data-role="energy-link-gas-team"></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">가스 합산 방식</span><select class="util-analytics-select" data-role="energy-link-gas-mode"><option value="mj">열량(MJ) 합산</option><option value="raw">원단위 합산</option></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">기간</span><div class="util-analytics-range"><select class="util-analytics-select" data-role="energy-link-from"></select><span class="util-analytics-divider">~</span><select class="util-analytics-select" data-role="energy-link-to"></select></div></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">소수 표시</span><select class="util-analytics-select" data-role="energy-display-decimals"><option value="0">0자리</option><option value="1">1자리</option><option value="2">2자리</option><option value="3">3자리</option><option value="4">4자리</option></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">LNG 계수 (MJ/m³)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="energy-link-lng-factor" data-format-decimals="3"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">LPG 계수 (MJ/kg)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="energy-link-lpg-factor" data-format-decimals="3"></div>
                                            <div class="util-analytics-field"><div class="util-energy-note" data-role="energy-link-warning" style="display:none;"></div></div>
                                        </div>
                                        <div class="util-analytics-form">
                                            <div class="util-analytics-field"><span class="util-analytics-label">전기 사용량 (kWh)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="electric-kwh" data-format-decimals="0" placeholder="0"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">전기 기준</span><select class="util-analytics-select" data-role="electric-basis"><option value="3.6">최종에너지 (3.6 MJ/kWh)</option><option value="9.59">1차에너지 (9.59 MJ/kWh)</option><option value="custom">직접 입력</option></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">전기 환산계수 (MJ/kWh)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="electric-factor" data-format-decimals="2" value="3.6"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label" data-role="gas-amount-label">가스 사용량 (LNG m³)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="gas-amount" data-format-decimals="0" placeholder="0"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">가스 단위</span><select class="util-analytics-select" data-role="gas-unit"><option value="lng">LNG m³</option><option value="lpg">LPG kg</option><option value="mj">고지서 MJ</option></select></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label" data-role="gas-factor-label">가스 열량계수 (MJ/m³)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="gas-factor" data-format-decimals="3" value="42.705"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">전기요금 (원)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="electric-cost" data-format-decimals="0" placeholder="0"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">가스요금 (원)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="gas-cost" data-format-decimals="0" placeholder="0"></div>
                                            <div class="util-analytics-field"><span class="util-analytics-label">TOE 기준 (MJ)</span><input type="text" inputmode="decimal" class="util-analytics-select" data-role="toe-factor" data-format-decimals="0" value="41868"></div>
                                        </div>
                                        <div class="util-tabs">
                                            <button type="button" class="util-tab-btn" data-tab="energy"><i class="fa-solid fa-fire-flame-curved"></i> 열량</button>
                                            <button type="button" class="util-tab-btn" data-tab="toe"><i class="fa-solid fa-oil-can"></i> TOE</button>
                                        </div>
                                        <div class="util-tab-panels">
                                            <div class="util-tab-panel" data-panel="energy">
                                                <div class="util-analytics-result">
                                                    <div class="util-analytics-summary">
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-bolt"></i>전기 MJ</span><span class="util-analytics-value" data-role="energy-electric-mj">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-fire-flame-curved"></i>가스 MJ</span><span class="util-analytics-value" data-role="energy-gas-mj">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-layer-group"></i>합계 MJ</span><span class="util-analytics-value" data-role="energy-total-mj">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-chart-pie"></i>합계 GJ</span><span class="util-analytics-value" data-role="energy-total-gj">-</span>
                                                    </div>
                                                    <div class="util-analytics-summary">
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-won-sign"></i>전기 원/MJ</span><span class="util-analytics-value" data-role="cost-electric">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-won-sign"></i>가스 원/MJ</span><span class="util-analytics-value" data-role="cost-gas">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-won-sign"></i>통합 원/MJ</span><span class="util-analytics-value" data-role="cost-total">-</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="util-tab-panel" data-panel="toe">
                                                <div class="util-analytics-result">
                                                    <div class="util-analytics-summary">
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-bolt"></i>전기 toe</span><span class="util-analytics-value" data-role="toe-electric">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-fire-flame-curved"></i>가스 toe</span><span class="util-analytics-value" data-role="toe-gas">-</span>
                                                        <span class="util-analytics-tag"><i class="fa-solid fa-oil-can"></i>합계 toe</span><span class="util-analytics-value" data-role="toe-total">-</span>
                                                        <span class="util-analytics-tag">기준(MJ)</span><span class="util-analytics-value" data-role="toe-factor-display">41,868</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="util-energy-note"><strong>메모:</strong> 가스 열량계수는 고지서 MJ/단위를 우선 사용하세요.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            initUtilTabs(modal);
            initUtilEnergyConverter(modal);

            modal.addEventListener('click', event => {
                if (event.target === modal) {
                    closeUtilEnergyModal();
                    return;
                }
                const closeBtn = event.target.closest('[data-role="util-energy-modal-close"]');
                if (closeBtn) {
                    closeUtilEnergyModal();
                    return;
                }
                const printBtn = event.target.closest('[data-role="util-energy-modal-print"]');
                if (printBtn) {
                    printUtilEnergyModalChartPage();
                }
            });

            if (useUtilEnergyModalChartRootFlag('__utilEnergyModalEscapeBound')) {
                addUtilEnergyModalChartEventListener('keydown', event => {
                    if (event.key !== 'Escape') return;
                    const opened = document.getElementById('util-energy-modal');
                    if (!opened || !opened.classList.contains('is-open')) return;
                    closeUtilEnergyModal();
                });
            }

            return modal;
        }
