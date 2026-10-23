        const auditLuxPreviewBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : null;

        if (!auditLuxPreviewBrowser) {
            throw new Error('KpiAuditRecordsBrowserAdapter must load before KPI.audit.records.lux-preview-actions.js');
        }

        const auditLuxDetachedPreview = auditLuxPreviewBrowser.getRootValue('KPIAuditLuxDetachedPreview');
        if (!auditLuxDetachedPreview) {
            throw new Error('KPIAuditLuxDetachedPreview must load before KPI.audit.records.lux-preview-actions.js');
        }
        auditLuxDetachedPreview.setRuntimeAdapters({
            escapeHtml: (value) => escapeHtml(value)
        });
        const buildDetachedPreviewHtml = auditLuxDetachedPreview.buildAuditLuxDetachedPreviewHtml;

        function getAuditLuxDetachedPreviewState() {
            return auditLuxPreviewBrowser.getRootState('__auditLuxDetachedPreviewState', () => ({
                    popup: null,
                    dataKey: '',
                    year: null,
                    quarter: null,
                    team: ''
            }));
        }

        function syncAuditLuxDetachedPreview(dataKey, year, team, quarter = null) {
            const state = getAuditLuxDetachedPreviewState();
            const popup = state.popup;
            if (!popup || popup.closed) {
                state.popup = null;
                return;
            }
            if (!isAuditLuxDataKey(dataKey)) return;
            const selectedQuarter = typeof normalizeAuditLuxEvidenceQuarter === 'function'
                ? normalizeAuditLuxEvidenceQuarter(year, quarter)
                : Number(quarter || 1);
            const attachmentItem = typeof getAuditLuxCumulativeEvidenceItem === 'function'
                ? getAuditLuxCumulativeEvidenceItem(dataKey, year, team, selectedQuarter)
                : (typeof getAuditLuxYearEvidenceItem === 'function'
                    ? getAuditLuxYearEvidenceItem(dataKey, year, team, selectedQuarter)
                    : null);
            const viewUrl = typeof getAuditEvidenceViewUrl === 'function'
                ? getAuditEvidenceViewUrl(attachmentItem)
                : '';
            const downloadUrl = typeof getAuditEvidenceDownloadUrl === 'function'
                ? getAuditEvidenceDownloadUrl(attachmentItem)
                : viewUrl;
            const fileLabel = typeof getAuditEvidenceFileLabel === 'function'
                ? getAuditEvidenceFileLabel(attachmentItem)
                : '';
            const isPdf = typeof isAuditEvidencePdf === 'function'
                ? isAuditEvidencePdf(attachmentItem)
                : false;
            const rotation = Number.isFinite(parseFloat(attachmentItem?.rotate))
                ? parseFloat(attachmentItem.rotate)
                : 0;
            const sourceQuarter = attachmentItem && typeof normalizeAuditLuxEvidenceQuarter === 'function'
                ? normalizeAuditLuxEvidenceQuarter(attachmentItem)
                : selectedQuarter;
            const periodLabel = typeof getAuditLuxEvidencePeriodLabel === 'function'
                ? getAuditLuxEvidencePeriodLabel(year, sourceQuarter)
                : `${String(year || '').trim()}년 ${sourceQuarter}분기`;
            const title = `${String(team || '').trim()} ${periodLabel} 조도 스캔본`;
            const html = buildDetachedPreviewHtml({
                title,
                meta: `${String(team || '').trim()} ${periodLabel}`,
                fileLabel,
                viewUrl,
                downloadUrl,
                isPdf,
                rotation
            });
            popup.document.open();
            popup.document.write(html);
            popup.document.close();
            state.dataKey = dataKey;
            state.year = year;
            state.quarter = selectedQuarter;
            state.team = team;
        }

        function openAuditLuxDetachedPreview(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const year = Number(entryForm.year);
            const quarter = Number(entryForm.quarter);
            const team = String(entryForm.team || '').trim();
            const state = getAuditLuxDetachedPreviewState();
            let popup = state.popup;
            if (!popup || popup.closed) {
                popup = auditLuxPreviewBrowser.openWindow('', 'kpi_audit_lux_detached_preview', 'popup=yes,width=1280,height=920,left=120,top=80,resizable=yes,scrollbars=yes');
                if (!popup) {
                    showToast('원본 창을 열지 못했습니다. 팝업 차단을 확인해 주세요.');
                    const attachmentItem = typeof getAuditLuxCumulativeEvidenceItem === 'function'
                        ? getAuditLuxCumulativeEvidenceItem(dataKey, year, team, quarter)
                        : (typeof getAuditLuxYearEvidenceItem === 'function'
                            ? getAuditLuxYearEvidenceItem(dataKey, year, team, quarter)
                            : null);
                    const fallbackUrl = typeof getAuditEvidenceViewUrl === 'function'
                        ? getAuditEvidenceViewUrl(attachmentItem)
                        : '';
                    if (fallbackUrl) {
                        auditLuxPreviewBrowser.openWindow(fallbackUrl, '_blank', 'noopener');
                    }
                    return;
                }
                state.popup = popup;
            }
            syncAuditLuxDetachedPreview(dataKey, year, team, quarter);
            try {
                popup.focus();
            } catch (error) {
                console.warn('[KPI audit lux] detached preview focus failed', error);
            }
        }
