        function getAuditLuxWorkspaceTeams(dataKey) {
            const preferredTeams = ['2팀', '3팀'];
            const availableTeams = getAuditFilterTeams(dataKey);
            const filtered = preferredTeams.filter(team => availableTeams.includes(team));
            return filtered.length ? filtered : availableTeams;
        }

        function getAuditLuxWorkspaceState(dataKey) {
            const entryForm = getAuditEntryFormState(dataKey);
            const now = typeof getAuditCurrentQuarterInfo === 'function'
                ? getAuditCurrentQuarterInfo()
                : getQuarterInfo(new Date());
            const yearStart = typeof AUDIT_LUX_BASE_YEAR === 'number' ? AUDIT_LUX_BASE_YEAR : 2023;
            if (!entryForm.year || entryForm.year < yearStart || entryForm.year > now.year) {
                entryForm.year = now.year;
            }
            if (!entryForm.quarter || entryForm.quarter < 1 || entryForm.quarter > 4) {
                entryForm.quarter = now.quarter;
            }
            const teams = getAuditLuxWorkspaceTeams(dataKey);
            if (!teams.includes(entryForm.team)) {
                entryForm.team = teams[0] || '';
            }
            return { entryForm, now, teams, yearStart };
        }

        function cycleAuditLuxWorkspaceTeam(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const { entryForm, teams } = getAuditLuxWorkspaceState(dataKey);
            if (!teams.length) return;
            const currentIndex = teams.indexOf(String(entryForm.team || '').trim());
            const nextIndex = currentIndex >= 0
                ? (currentIndex + 1) % teams.length
                : 0;
            entryForm.team = teams[nextIndex];
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function setAuditLuxWorkspaceYear(dataKey, value) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const { entryForm, yearStart, now } = getAuditLuxWorkspaceState(dataKey);
            const nextYear = Number.parseInt(value, 10);
            if (!Number.isFinite(nextYear)) return;
            entryForm.year = Math.min(Math.max(nextYear, yearStart), now.year);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function normalizeAuditLuxNumericValue(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return '';
            const cleaned = raw.replace(/[^0-9.]/g, '');
            if (!cleaned) return '';
            const firstDotIndex = cleaned.indexOf('.');
            if (firstDotIndex < 0) {
                return cleaned;
            }
            const integerPart = cleaned.slice(0, firstDotIndex);
            const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
            return `${integerPart}.${decimalPart}`;
        }

        function getAuditLuxNumericDisplayValue(value) {
            return normalizeAuditLuxNumericValue(value);
        }

        function inspectAuditLuxWorkspaceRow(row) {
            const standardValue = parseAuditComparableNumber(normalizeAuditLuxNumericValue(row?.standard || row?.baseStandard || ''));
            let measuredCount = 0;
            const failedQuarters = [];
            [1, 2, 3, 4].forEach((quarter) => {
                const numericText = normalizeAuditLuxNumericValue(row?.values?.[quarter] || '');
                const numericValue = parseAuditComparableNumber(numericText);
                if (numericText === '' || !Number.isFinite(numericValue)) return;
                measuredCount += 1;
                if (Number.isFinite(standardValue) && numericValue < standardValue) {
                    failedQuarters.push(quarter);
                }
            });
            return { measuredCount, failedQuarters };
        }

        function hasAuditLuxWorkspaceRowFailure(row) {
            return inspectAuditLuxWorkspaceRow(row).failedQuarters.length > 0;
        }

        function getAuditLuxWorkspaceFailRowKeys(rows) {
            return (Array.isArray(rows) ? rows : [])
                .filter(hasAuditLuxWorkspaceRowFailure)
                .map((row) => String(row?.rowKey || '').trim())
                .filter(Boolean);
        }

        function getAuditLuxStandardInputByRow(dataKey, rowKey) {
            return Array.from(document.querySelectorAll(`[data-audit-lux-standard-input="${dataKey}"]`)).find((input) => (
                String(input.dataset.rowKey || '').trim() === String(rowKey || '').trim()
            )) || null;
        }

        function shouldDeferAuditLuxInputFailure(input, options = {}) {
            if (options.force) return false;
            if (!(input instanceof HTMLElement)) return false;
            if (document.activeElement !== input) return false;
            if (typeof isAuditValueStatusPendingInput !== 'function') return false;
            return isAuditValueStatusPendingInput(input.value);
        }

        function syncAuditLuxQuarterFieldState(input, options = {}) {
            if (!(input instanceof HTMLElement)) return;
            const dataKey = String(input.dataset.auditLuxQuarterInput || '').trim();
            const rowKey = String(input.dataset.rowKey || '').trim();
            const standardInput = getAuditLuxStandardInputByRow(dataKey, rowKey);
            const standardValue = parseAuditComparableNumber(normalizeAuditLuxNumericValue(standardInput?.value || standardInput?.dataset.originalStandard || ''));
            const numericText = normalizeAuditLuxNumericValue(input.value);
            const numericValue = parseAuditComparableNumber(numericText);
            const isBelowStandard = !shouldDeferAuditLuxInputFailure(input, options)
                && numericText !== ''
                && Number.isFinite(standardValue)
                && Number.isFinite(numericValue)
                && numericValue < standardValue;
            const field = input.closest('.audit-lux-quarter-field');
            const cell = input.closest('.audit-lux-sheet-quarter');
            const feedback = field?.querySelector('.audit-lux-sheet-feedback');
            input.classList.toggle('is-fail', isBelowStandard);
            field?.classList.toggle('is-fail', isBelowStandard);
            cell?.classList.toggle('is-fail', isBelowStandard);
            if (feedback && !input.disabled) {
                feedback.classList.toggle('is-fail', isBelowStandard);
                feedback.classList.remove('is-muted');
                feedback.innerHTML = isBelowStandard ? '\uAE30\uC900 \uBBF8\uB2EC' : '&nbsp;';
            }
        }

        function syncAuditLuxQuarterStatesForRow(dataKey, rowKey, options = {}) {
            Array.from(document.querySelectorAll(`[data-audit-lux-quarter-input="${dataKey}"]`)).forEach((input) => {
                if (String(input.dataset.rowKey || '').trim() !== String(rowKey || '').trim()) return;
                syncAuditLuxQuarterFieldState(input, options);
            });
        }

        function handleAuditLuxStandardInput(input, options = {}) {
            if (!(input instanceof HTMLInputElement)) return;
            input.value = normalizeAuditLuxNumericValue(input.value);
            const dataKey = String(input.dataset.auditLuxStandardInput || '').trim();
            const rowKey = String(input.dataset.rowKey || '').trim();
            syncAuditLuxQuarterStatesForRow(dataKey, rowKey, options);
            syncAuditLuxWorkspaceAlert(dataKey, options);
        }

        function handleAuditLuxQuarterInput(input, options = {}) {
            if (!(input instanceof HTMLInputElement)) return;
            input.value = normalizeAuditLuxNumericValue(input.value);
            syncAuditLuxQuarterFieldState(input, options);
            const dataKey = String(input.dataset.auditLuxQuarterInput || '').trim();
            syncAuditLuxWorkspaceAlert(dataKey, options);
        }

        function focusAuditLuxNextInputDown(currentInput) {
            if (!(currentInput instanceof HTMLElement)) return;
            const dataKey = String(
                currentInput.dataset.auditLuxQuarterInput
                || currentInput.dataset.auditLuxStandardInput
                || ''
            ).trim();
            if (!dataKey) return;
            let selector = '';
            if (currentInput.dataset.auditLuxQuarterInput) {
                const quarter = String(currentInput.dataset.quarter || '').trim();
                selector = `[data-audit-lux-quarter-input="${dataKey}"][data-quarter="${quarter}"]:not([disabled])`;
            } else if (currentInput.dataset.auditLuxStandardInput) {
                selector = `[data-audit-lux-standard-input="${dataKey}"]`;
            }
            if (!selector) return;
            const inputs = Array.from(document.querySelectorAll(selector));
            const currentIndex = inputs.indexOf(currentInput);
            if (currentIndex < 0) return;
            const nextInput = inputs[currentIndex + 1];
            if (!(nextInput instanceof HTMLInputElement)) return;
            nextInput.focus();
            nextInput.select?.();
            nextInput.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }

        function handleAuditLuxInputKeydown(event, input) {
            if (!event || event.key !== 'Enter') return;
            event.preventDefault();
            focusAuditLuxNextInputDown(input);
        }

        function isAuditLuxQuarterEditable(year, quarter) {
            const targetYear = Number(year);
            const targetQuarter = Number(quarter);
            if (!Number.isFinite(targetYear) || !Number.isFinite(targetQuarter)) return false;
            const now = typeof getAuditCurrentQuarterInfo === 'function'
                ? getAuditCurrentQuarterInfo()
                : getQuarterInfo(new Date());
            if (targetYear < now.year) return true;
            if (targetYear > now.year) return false;
            return targetQuarter <= now.quarter;
        }

        function buildAuditLuxQuarterCell(row, year, quarter, dataKey) {
            const value = getAuditLuxNumericDisplayValue(row?.values?.[quarter]);
            const standardValue = parseAuditComparableNumber(row?.standard);
            const numericValue = parseAuditComparableNumber(value);
            const editable = isAuditLuxQuarterEditable(year, quarter);
            const isBelowStandard = value !== ''
                && Number.isFinite(standardValue)
                && Number.isFinite(numericValue)
                && numericValue < standardValue;
            const feedback = !editable
                ? '<span class="audit-lux-sheet-feedback is-muted">입력 대기</span>'
                : (isBelowStandard ? '<span class="audit-lux-sheet-feedback is-fail">기준 미달</span>' : '<span class="audit-lux-sheet-feedback">&nbsp;</span>');
            return `
                <td class="audit-lux-sheet-quarter ${editable ? '' : 'is-locked'} ${isBelowStandard ? 'is-fail' : ''}">
                    <div class="audit-lux-quarter-field ${editable ? '' : 'is-locked'} ${isBelowStandard ? 'is-fail' : ''}">
                        <span class="audit-lux-cell-caption audit-lux-quarter-caption">\uCE21\uC815\uAC12</span>
                        <input
                            type="text"
                            inputmode="decimal"
                        class="audit-input audit-lux-quarter-input ${isBelowStandard ? 'is-fail' : ''}"
                        data-audit-lux-quarter-input="${dataKey}"
                        data-row-key="${escapeHtml(row.rowKey)}"
                        data-quarter="${quarter}"
                        value="${escapeHtml(value)}"
                        oninput="handleAuditLuxQuarterInput(this)"
                        onblur="handleAuditLuxQuarterInput(this, { force: true })"
                        onkeydown="handleAuditLuxInputKeydown(event, this)"
                        ${editable ? '' : 'disabled'}
                    />
                        ${feedback}
                    </div>
                </td>
            `;
        }

        function getAuditLuxWorkspaceRoomGroups(rows) {
            const groups = [];
            (Array.isArray(rows) ? rows : []).forEach((row) => {
                const room = String(row?.room || '').trim();
                const lastGroup = groups[groups.length - 1];
                if (!lastGroup || lastGroup.room !== room) {
                    groups.push({ room, rows: [row] });
                    return;
                }
                lastGroup.rows.push(row);
            });
            return groups;
        }

        function renderAuditLuxWorkspacePreview(dataKey, year, team) {
            const attachmentItem = typeof getAuditLuxYearEvidenceItem === 'function'
                ? getAuditLuxYearEvidenceItem(dataKey, year, team)
                : null;
            if (!attachmentItem) {
                return `
                    <div class="audit-lux-preview-card">
                        <div class="audit-lux-preview-head">
                            <div class="audit-lux-preview-copy">
                                <div class="audit-lux-preview-title">스캔본 원본</div>
                                <div class="audit-lux-preview-meta">${escapeHtml(team || '')} ${escapeHtml(String(year || ''))}년</div>
                            </div>
                        </div>
                        <div class="audit-lux-preview-empty">선택한 년도에 등록된 조도 스캔본이 없습니다.</div>
                    </div>
                `;
            }
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
            const previewStage = viewUrl
                ? (isPdf
                    ? `<iframe class="audit-lux-preview-frame" src="${escapeHtml(viewUrl)}" title="조도 스캔본 미리보기"></iframe>`
                    : `<img class="audit-lux-preview-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(`${team} ${year}년 조도 스캔본`)}" loading="lazy" decoding="async" style="transform: rotate(${rotation}deg);" />`)
                : '<div class="audit-lux-preview-empty">첨부 미리보기를 불러올 수 없습니다.</div>';
            return `
                <div class="audit-lux-preview-card">
                    <div class="audit-lux-preview-head">
                        <div class="audit-lux-preview-copy">
                            <div class="audit-lux-preview-title">스캔본 원본</div>
                            <div class="audit-lux-preview-meta">${escapeHtml(team || '')} ${escapeHtml(String(year || ''))}년</div>
                        </div>
                        <div class="audit-filter-actions">
                            <button type="button" class="work-btn" onclick="openAuditLuxDetachedPreview('${escapeJs(dataKey)}')">분리 보기</button>
                            <a class="work-btn audit-ref-open" href="${escapeHtml(viewUrl || downloadUrl || '#')}" target="_blank" rel="noopener">원본 열기</a>
                        </div>
                    </div>
                    <div class="audit-lux-preview-stage ${isPdf ? 'is-pdf' : ''}">
                        ${previewStage}
                    </div>
                    <div class="audit-lux-preview-foot">
                        <span class="audit-lux-preview-origin">${escapeHtml(fileLabel || '첨부 파일')}</span>
                    </div>
                </div>
            `;
        }

        function renderAuditLuxWorkspace(category, data) {
            const dataKey = category.dataKey;
            const { entryForm, now, teams, yearStart } = getAuditLuxWorkspaceState(dataKey);
            const selectedYear = Number(entryForm.year);
            const selectedTeam = String(entryForm.team || '').trim();
            const yearOptions = getYearOptionsDesc(yearStart, now.year, selectedYear, '년도');
            const rows = typeof getAuditLuxWorkspaceRows === 'function'
                ? getAuditLuxWorkspaceRows(dataKey, selectedYear, selectedTeam)
                : [];
            const alertSummary = getAuditLuxWorkspaceAlertSummary(dataKey, { useLiveRows: false });
            const alertGuide = getAuditLuxWorkspaceAlertGuide(alertSummary);
            const alertTitle = getAuditLuxWorkspaceAlertTitle(alertSummary);
            const noteValue = typeof getAuditLuxYearNote === 'function'
                ? getAuditLuxYearNote(dataKey, selectedYear, selectedTeam)
                : '';
            const attachmentItem = typeof getAuditLuxYearEvidenceItem === 'function'
                ? getAuditLuxYearEvidenceItem(dataKey, selectedYear, selectedTeam)
                : null;
            const yearGuide = selectedYear < now.year
                ? `${selectedYear}년은 1~4분기 모두 입력할 수 있습니다.`
                : `${now.year}년은 현재 ${now.quarter}분기까지 입력할 수 있습니다.`;
            const roomGroups = getAuditLuxWorkspaceRoomGroups(rows);
            const failRowKeys = getAuditLuxWorkspaceFailRowKeys(rows);
            const hasFailShortcut = failRowKeys.length > 0;
            const failShortcutTitle = Number.isFinite(selectedYear) && selectedTeam
                ? `${selectedYear}년 ${selectedTeam} 기준 미달 항목으로 이동`
                : '기준 미달 항목으로 이동';
            const rowsHtml = roomGroups.length
                ? roomGroups.map((group) => (
                    group.rows.map((row, rowIndex) => {
                        const hasRowFailure = hasAuditLuxWorkspaceRowFailure(row);
                        return `
                        <tr class="audit-lux-sheet-row ${hasRowFailure ? 'is-fail' : ''}" data-audit-lux-row="${escapeHtml(dataKey)}" data-row-key="${escapeHtml(row.rowKey)}">
                            ${rowIndex === 0 ? `<th scope="rowgroup" rowspan="${group.rows.length}" class="audit-lux-sheet-room"><div class="audit-lux-room-box">${escapeHtml(group.room || '')}</div></th>` : ''}
                            <td class="audit-lux-sheet-type"><div class="audit-lux-type-box">${escapeHtml(row.type || '')}</div></td>
                            <td class="audit-lux-sheet-standard-cell">
                                <div class="audit-lux-standard-field">
                                    <span class="audit-lux-cell-caption audit-lux-standard-caption">\uAE30\uC900 \uC870\uB3C4</span>
                                    <div class="audit-lux-standard-input-wrap">
                                        <input
                                            type="text"
                                            inputmode="decimal"
                                            class="audit-input audit-lux-standard-input"
                                            data-audit-lux-standard-input="${dataKey}"
                                            data-row-key="${escapeHtml(row.rowKey)}"
                                            data-room="${escapeHtml(row.room || '')}"
                                            data-type="${escapeHtml(row.type || '')}"
                                            data-original-standard="${escapeHtml(getAuditLuxNumericDisplayValue(row.baseStandard || row.standard || ''))}"
                                            value="${escapeHtml(getAuditLuxNumericDisplayValue(row.standard || ''))}"
                                            oninput="handleAuditLuxStandardInput(this)"
                                            onblur="handleAuditLuxStandardInput(this, { force: true })"
                                            onkeydown="handleAuditLuxInputKeydown(event, this)"
                                        />
                                        <span class="audit-lux-standard-suffix">\uC774\uC0C1</span>
                                    </div>
                                </div>
                            </td>
                            ${[1, 2, 3, 4].map((quarter) => buildAuditLuxQuarterCell(row, selectedYear, quarter, dataKey)).join('')}
                        </tr>
                    `;
                    }).join('')
                )).join('')
                : '<tr><td colspan="7" class="audit-lux-sheet-empty">선택한 팀의 조도 기준이 아직 등록되지 않았습니다.</td></tr>';
            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="audit-lux-shell" data-audit-lux-workspace="${dataKey}">
                    <div class="audit-lux-window">
                        <div class="audit-lux-window-header">
                            <div class="audit-lux-window-copy">
                                <span class="audit-lux-window-kicker">조도 입력</span>
                                <h2 class="audit-lux-window-title">${escapeHtml(category.title || '조도 (Lux)')}</h2>
                                <p class="audit-lux-window-desc">좌측 스캔본을 그대로 보면서 우측 양식에 연도별 조도값을 입력합니다. 기준 수정은 선택한 연도부터 이후 연도에 적용됩니다.</p>
                            </div>
                            <div class="audit-lux-window-actions">
                                <div class="audit-team-toggle-group" role="group" aria-label="조도 팀 전환">
                                    <button
                                        type="button"
                                        class="audit-team-toggle ${teams.length ? 'is-active' : ''}"
                                        onclick="cycleAuditLuxWorkspaceTeam('${dataKey}')"
                                        ${teams.length > 1 ? '' : 'disabled'}
                                        title="${teams.length > 1 ? '클릭할 때마다 2팀과 3팀이 전환됩니다.' : ''}"
                                    >${escapeHtml(selectedTeam || '팀 없음')}</button>
                                </div>
                                <select class="audit-select audit-lux-year-select" onchange="setAuditLuxWorkspaceYear('${dataKey}', this.value)">${yearOptions}</select>
                                ${getAuditLuxWorkspaceFullscreenButtonHtml()}
                                <button type="button" class="work-btn" onclick="openAuditLuxAttachmentPicker('${dataKey}')">${attachmentItem ? '첨부 교체' : '첨부'}</button>
                                <input type="file" id="audit-lux-attachment-input-${dataKey}" class="audit-hidden-input" accept="image/*,application/pdf" onchange="handleAuditLuxAttachmentChange('${dataKey}', this)" />
                                <button
                                    type="button"
                                    class="audit-help-toggle"
                                    id="audit-notice-toggle-${dataKey}"
                                    aria-expanded="false"
                                    aria-controls="audit-notice-modal-${dataKey}"
                                    onclick="toggleAuditNotice('${dataKey}')"
                                    title="주의사항 보기"
                                >?</button>
                            </div>
                        </div>
                        <div class="audit-lux-workspace">
                            <div class="audit-lux-preview-pane">
                                ${renderAuditLuxWorkspacePreview(dataKey, selectedYear, selectedTeam)}
                            </div>
                            <div class="audit-lux-sheet-pane">
                                <div class="audit-lux-sheet-head audit-lux-sheet-head-document">
                                    <div class="audit-lux-sheet-docmeta">
                                        <span>팀 ${escapeHtml(selectedTeam || '')}</span>
                                        <span>${selectedYear}년</span>
                                        <button
                                            type="button"
                                            class="audit-lux-sheet-jump"
                                            data-audit-lux-jump="${escapeHtml(dataKey)}"
                                            onclick="jumpToAuditLuxWorkspaceFailRow('${escapeJs(dataKey)}')"
                                            title="${escapeHtml(failShortcutTitle)}"
                                            ${hasFailShortcut ? '' : 'hidden disabled'}
                                        ><i class="fa-solid fa-arrow-turn-down"></i><span>미달 바로 가기</span></button>
                                        <span>${escapeHtml(yearGuide)}</span>
                                    </div>
                                    <div class="audit-lux-sheet-doctitle">조도 측정 기록표</div>
                                    <div class="audit-lux-sheet-docsub">기준 수정은 선택한 연도부터 이후 연도에만 반영됩니다.</div>
                                    <div class="audit-lux-sheet-alert ${alertSummary.failCount > 0 ? '' : 'is-safe'}" data-audit-lux-alert="${dataKey}" title="${escapeHtml(alertTitle)}">
                                        <span class="audit-lux-sheet-alert-chip ${alertSummary.failCount > 0 ? '' : 'is-safe'}" data-audit-lux-alert-chip="${dataKey}" title="${escapeHtml(alertTitle)}">
                                            <i class="fa-solid fa-bell"></i>
                                            <span data-audit-lux-alert-count="${dataKey}" title="${escapeHtml(alertTitle)}">${escapeHtml(getAuditLuxWorkspaceAlertCountLabel(alertSummary))}</span>
                                        </span>
                                        <span class="audit-lux-sheet-alert-text" data-audit-lux-alert-guide="${dataKey}" title="${escapeHtml(alertTitle)}">${escapeHtml(alertGuide)}</span>
                                    </div>
                                </div>
                                <div class="audit-lux-sheet-table-wrap">
                                    <table class="audit-lux-sheet-table">
                                        <thead>
                                            <tr>
                                                <th class="audit-lux-col-room">실 / 구역</th>
                                                <th class="audit-lux-col-type">측정 위치 / 설비</th>
                                                <th class="audit-lux-col-standard">기준 조도 (Lux)</th>
                                                <th class="audit-lux-col-quarter">1분기</th>
                                                <th class="audit-lux-col-quarter">2분기</th>
                                                <th class="audit-lux-col-quarter">3분기</th>
                                                <th class="audit-lux-col-quarter">4분기</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rowsHtml}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="audit-lux-window-footer">
                            <label class="audit-lux-note-field" for="audit-lux-note-${dataKey}">
                                <span class="audit-lux-note-label">특이사항</span>
                                <textarea class="audit-input audit-note-area audit-lux-note-area" id="audit-lux-note-${dataKey}" placeholder="해당 연도 조도 측정의 특이사항을 입력하세요.">${escapeHtml(noteValue || '')}</textarea>
                            </label>
                            <div class="audit-filter-actions">
                                <button type="button" class="work-btn primary" onclick="saveAuditLuxWorkspace('${dataKey}')">저장</button>
                            </div>
                        </div>
                    </div>
                    <div class="audit-notice-modal" id="audit-notice-modal-${dataKey}" aria-hidden="true">
                        <button type="button" class="audit-notice-modal-backdrop" onclick="toggleAuditNotice('${dataKey}')" aria-label="주의사항 닫기"></button>
                        <div class="audit-notice-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="audit-notice-title-${dataKey}">
                            <div class="audit-notice-modal-head">
                                <div class="audit-notice-header">
                                    <span class="audit-notice-icon"><i class="fa-solid fa-circle-dot"></i></span>
                                    <div>
                                        <div class="audit-notice-title" id="audit-notice-title-${dataKey}">조도 측정 주의사항</div>
                                        <div class="audit-notice-sub">측정 기준을 동일하게 유지하세요.</div>
                                    </div>
                                </div>
                                <button type="button" class="audit-help-close" onclick="toggleAuditNotice('${dataKey}')">닫기</button>
                            </div>
                            <div class="audit-notice-list">
                                <div class="audit-notice-item">
                                    <span class="audit-notice-chip"><i class="fa-solid fa-bullseye"></i></span>
                                    <div>
                                        <div class="audit-notice-label">조도계 사용</div>
                                        <div class="audit-notice-desc">측정 시 조도계 센서를 정확히 고정합니다.</div>
                                    </div>
                                </div>
                                <div class="audit-notice-item">
                                    <span class="audit-notice-chip" style="background:#fef3c7;color:#b45309;"><i class="fa-solid fa-ruler-vertical"></i></span>
                                    <div>
                                        <div class="audit-notice-label">측정 높이 기준</div>
                                        <div class="audit-notice-desc">바닥으로부터 0.6 ~ 1.0 m 범위에서 측정합니다.</div>
                                    </div>
                                </div>
                                <div class="audit-notice-item">
                                    <span class="audit-notice-chip" style="background:#dcfce7;color:#166534;"><i class="fa-solid fa-calendar-check"></i></span>
                                    <div>
                                        <div class="audit-notice-label">정기 검교정</div>
                                        <div class="audit-notice-desc">조도계 연 1회 검교정을 실시합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            syncAuditLuxDetachedPreview(dataKey, selectedYear, selectedTeam);
            syncAuditLuxWorkspaceFullscreenUi();
            syncAuditLuxWorkspaceAlert(dataKey);
            const teamMetaEl = contentContainer.querySelector('.audit-lux-sheet-docmeta span:first-child');
            if (teamMetaEl) {
                teamMetaEl.textContent = selectedTeam || '';
            }
        }

        async function saveAuditLuxWorkspace(dataKey, options = {}) {
            if (!isAuditLuxDataKey(dataKey)) return false;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const year = Number(entryForm.year);
            const team = String(entryForm.team || '').trim();
            if (!Number.isFinite(year) || !team) return false;
            const standardInputs = Array.from(document.querySelectorAll(`[data-audit-lux-standard-input="${dataKey}"]`));
            if (!standardInputs.length) return false;
            const quarterInputs = Array.from(document.querySelectorAll(`[data-audit-lux-quarter-input="${dataKey}"]`));
            const invalidInput = standardInputs.concat(quarterInputs).find((input) => {
                const value = normalizeAuditLuxNumericValue(input.value);
                return value && parseAuditComparableNumber(value) === null;
            });
            if (invalidInput) {
                alert('\uC870\uB3C4 \uAC12\uC740 \uC22B\uC790\uB85C \uC644\uC131\uD574\uC11C \uC785\uB825\uD574 \uC8FC\uC138\uC694.');
                invalidInput.focus?.();
                return false;
            }
            const rowMap = new Map();
            standardInputs.forEach((input) => {
                const rowKey = String(input.dataset.rowKey || '').trim();
                if (!rowKey) return;
                rowMap.set(rowKey, {
                    rowKey,
                    room: String(input.dataset.room || '').trim(),
                    type: String(input.dataset.type || '').trim(),
                    standard: normalizeAuditLuxNumericValue(input.value) || normalizeAuditLuxNumericValue(input.dataset.originalStandard || ''),
                    originalStandard: normalizeAuditLuxNumericValue(input.dataset.originalStandard || ''),
                    values: { 1: '', 2: '', 3: '', 4: '' }
                });
            });
            quarterInputs.forEach((input) => {
                const rowKey = String(input.dataset.rowKey || '').trim();
                const quarter = Number(input.dataset.quarter);
                const row = rowMap.get(rowKey);
                if (!row || !Number.isFinite(quarter)) return;
                row.values[quarter] = normalizeAuditLuxNumericValue(input.value);
            });
            const noteEl = document.getElementById(`audit-lux-note-${dataKey}`);
            const note = String(noteEl?.value || '').trim();
            const data = getAuditData(dataKey, dataKey);
            const targetRowKeys = new Set(rowMap.keys());
            const normalizedTeam = normalizeAuditZone(team);
            const preservedEntries = (Array.isArray(data.entries) ? data.entries : []).filter((entry) => {
                if (Number(entry?.year) !== year) return true;
                if (normalizeAuditZone(entry?.team || '') !== normalizedTeam) return true;
                return !targetRowKeys.has(makeAuditLuxSheetRowKey(entry?.team, entry?.room, entry?.type));
            });
            const nextEntries = [];
            rowMap.forEach((row) => {
                const rowKey = makeAuditLuxSheetRowKey(team, row.room, row.type);
                const standardItem = (Array.isArray(data.standards) ? data.standards : []).find((item) => (
                    makeAuditLuxSheetRowKey(item?.team, item?.room, item?.type) === rowKey
                ));
                const resolvedStandard = row.standard || row.originalStandard;
                const currentStandard = standardItem
                    ? normalizeAuditLuxNumericValue(resolveAuditLuxStandardForYear(standardItem, year) || String(standardItem?.standard || '').trim())
                    : '';
                if (standardItem && resolvedStandard && resolvedStandard !== currentStandard) {
                    setAuditLuxStandardForYear(standardItem, year, resolvedStandard);
                }
                [1, 2, 3, 4].forEach((quarter) => {
                    const value = String(row.values[quarter] || '').trim();
                    if (!value) return;
                    nextEntries.push({
                        year,
                        quarter,
                        team,
                        room: row.room,
                        type: row.type,
                        value,
                        note
                    });
                });
            });
            data.entries = preservedEntries.concat(nextEntries);
            if (typeof setAuditLuxYearNote === 'function') {
                setAuditLuxYearNote(data, year, team, note);
            }
            const saved = await Promise.resolve(saveAuditData(dataKey, data));
            if (saved === false) {
                if (options?.silent !== true) {
                    alert('조도 데이터는 서버 저장이 가능한 환경에서만 저장할 수 있습니다.');
                }
                return false;
            }
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
            return true;
        }

        function openAuditLuxAttachmentPicker(dataKey) {
            const input = document.getElementById(`audit-lux-attachment-input-${dataKey}`);
            if (input) input.click();
        }

        async function handleAuditLuxAttachmentChange(dataKey, input) {
            const file = input?.files?.[0];
            if (!file) return;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const year = Number(entryForm.year);
            const team = String(entryForm.team || '').trim();
            try {
                await replaceAuditLuxEvidenceForYear(dataKey, year, team, file);
                const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
                setLastModified(category?.title || 'Audit');
                if (category) renderAuditContent(category);
            } catch (error) {
                console.error('[kpi] audit lux attachment replace failed', error);
                const errorKey = String(error?.message || '').trim();
                let message = '조도 첨부를 저장하지 못했습니다.';
                if (errorKey === 'unsupported_type') message = '이미지 또는 PDF 파일만 첨부할 수 있습니다.';
                else if (errorKey === 'file_too_large') message = '첨부 파일은 25MB 이하만 업로드할 수 있습니다.';
                else if (errorKey === 'server_write_unavailable') message = '현재는 서버 저장이 가능한 환경에서만 첨부를 교체할 수 있습니다.';
                else if (errorKey === 'audit_lux_evidence_record_save_failed') message = '첨부 파일은 올라갔지만 조도 기록 저장이 실패해 교체를 취소했습니다.';
                alert(message);
            } finally {
                if (input) input.value = '';
            }
        }
