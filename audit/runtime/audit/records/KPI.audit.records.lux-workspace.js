        function getAuditLuxWorkspaceTeams(dataKey) {
            const preferredTeams = ['1팀 1파트', '1팀 2파트', '2팀', '3팀'];
            const availableTeams = getAuditFilterTeams(dataKey);
            return Array.from(new Set(preferredTeams.concat(availableTeams)));
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
            const maxQuarter = getAuditLuxAttachmentMaxQuarterForYear(entryForm.year);
            if (!entryForm.quarter || entryForm.quarter < 1 || entryForm.quarter > maxQuarter) {
                entryForm.quarter = normalizeAuditLuxAttachmentQuarter(entryForm.year, maxQuarter || now.quarter);
            }
            const teams = getAuditLuxWorkspaceTeams(dataKey);
            if (!teams.includes(entryForm.team)) {
                entryForm.team = teams[0] || '';
            }
            return { entryForm, now, teams, yearStart };
        }

        function getAuditLuxWorkspaceCategory(dataKey) {
            const normalizedDataKey = String(dataKey || '').trim();
            if (!normalizedDataKey || typeof AppData === 'undefined' || !AppData) return null;
            return Object.values(AppData)
                .flatMap(section => Array.isArray(section?.categories) ? section.categories : [])
                .find(category => String(category?.dataKey || '').trim() === normalizedDataKey)
                || null;
        }

        function renderAuditLuxWorkspaceCategory(dataKey) {
            const category = getAuditLuxWorkspaceCategory(dataKey);
            if (category && typeof renderAuditContent === 'function') {
                renderAuditContent(category);
            }
            return category;
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
            renderAuditLuxWorkspaceCategory(dataKey);
        }

        function setAuditLuxWorkspaceYear(dataKey, value) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const { entryForm, yearStart, now } = getAuditLuxWorkspaceState(dataKey);
            const nextYear = Number.parseInt(value, 10);
            if (!Number.isFinite(nextYear)) return;
            entryForm.year = Math.min(Math.max(nextYear, yearStart), now.year);
            entryForm.quarter = normalizeAuditLuxAttachmentQuarter(entryForm.year, entryForm.quarter);
            renderAuditLuxWorkspaceCategory(dataKey);
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

        function getAuditLuxYearRange(yearStart, endYear) {
            const start = Number(yearStart);
            const end = Number(endYear);
            if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
            const years = [];
            for (let year = end; year >= start; year -= 1) years.push(year);
            return years;
        }

        function getAuditLuxEvidenceMeta(attachmentItem) {
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
            return { viewUrl, downloadUrl, fileLabel, isPdf, rotation };
        }

        function renderAuditLuxAttachmentThumb(dataKey, year, team, quarter, attachmentItem) {
            if (!attachmentItem) {
                return `
                    <div class="audit-lux-index-empty-thumb">
                        <span>${escapeHtml('\uBBF8\uB4F1\uB85D')}</span>
                    </div>
                `;
            }
            const { viewUrl, fileLabel, isPdf, rotation } = getAuditLuxEvidenceMeta(attachmentItem);
            const periodLabel = typeof getAuditLuxEvidencePeriodLabel === 'function'
                ? getAuditLuxEvidencePeriodLabel(year, quarter)
                : `${year}년`;
            if (viewUrl && !isPdf) {
                return `<img class="audit-lux-index-thumb-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(`${team} ${periodLabel} 조도본`)}" loading="lazy" decoding="async" style="transform: rotate(${rotation}deg);" />`;
            }
            if (viewUrl && isPdf) {
                return `
                    <div class="audit-lux-index-file-thumb is-pdf" data-audit-lux-pdf-thumb="${escapeHtml(dataKey)}" data-audit-lux-pdf-url="${escapeHtml(viewUrl)}" data-audit-lux-pdf-alt="${escapeHtml(`${team} ${periodLabel} 조도본`)}">
                        <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                        <span>PDF</span>
                    </div>
                `;
            }
            return `
                <div class="audit-lux-index-file-thumb ${isPdf ? 'is-pdf' : ''}">
                    <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'}" aria-hidden="true"></i>
                    <span>${escapeHtml(isPdf ? 'PDF' : (fileLabel || 'FILE'))}</span>
                </div>
            `;
        }

        function renderAuditLuxAttachmentMedia(dataKey, year, team, quarter, attachmentItem, openUrl) {
            const thumbHtml = renderAuditLuxAttachmentThumb(dataKey, year, team, quarter, attachmentItem);
            if (!attachmentItem || !openUrl || openUrl === '#') {
                return `<div class="audit-lux-index-card-media">${thumbHtml}</div>`;
            }
            const mediaLabel = `${team || ''} ${year} ${quarter}${'\uBD84\uAE30'} ${'\uC6D0\uBCF8 \uC5F4\uAE30'}`.trim();
            return `
                <a class="audit-lux-index-card-media audit-lux-index-card-media-link" href="${escapeHtml(openUrl)}" target="_blank" rel="noopener" aria-label="${escapeHtml(mediaLabel)}">
                    ${thumbHtml}
                </a>
            `;
        }

        function getAuditLuxTeamKey(team) {
            const label = String(team || '').trim();
            const compactLabel = label.replace(/\s+/g, '');
            const numberTokens = label.match(/\d+/g) || [];
            if (compactLabel.includes('\uC720\uC0B0')) return 'team4';
            if (compactLabel.includes('\uBD81\uC815')) return 'team1part1';
            if (numberTokens[0] === '1' && numberTokens[1] === '1') return 'team1part1';
            if (numberTokens[0] === '1' && numberTokens[1] === '2') return 'team1part2';
            if (numberTokens[0] === '2') return 'team2';
            if (numberTokens[0] === '3') return 'team3';
            if (numberTokens[0] === '4' || compactLabel.includes('\uACF5\uBB34\uD658\uACBD')) return 'team4';
            return 'other';
        }

        function getAuditLuxTeamClassName(team) {
            return `is-${getAuditLuxTeamKey(team)}`;
        }

        function getAuditLuxTeamIconSvg(team) {
            const icons = {
                team1part1: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
                team1part2: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
                team2: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 9.2L12 12.8L19 9.2M5 9.2L8.2 5.5L12 7.4L15.8 5.5L19 9.2V16.8L12 20.5L5 16.8V9.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12.8V20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
                team3: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 3.5H14M10.6 3.5V6.4L8.8 8.4V19C8.8 20.1 9.7 21 10.8 21H13.2C14.3 21 15.2 20.1 15.2 19V8.4L13.4 6.4V3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13.3C10.8 12.2 12.7 14.5 15 13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
                team4: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 18L14.8 9.2M13.5 6.2L17.8 10.5M16.2 4.5L19.5 7.8L17.8 10.5L13.5 6.2L16.2 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.2 6.2L7.5 8.5M7.5 8.5L5.7 10.3L4 8.6L5.8 6.8L7.5 8.5ZM7.5 8.5L18 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                other: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V10M12 19V5M19 19V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 19.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
            };
            return icons[getAuditLuxTeamKey(team)] || icons.other;
        }

        function renderAuditLuxAttachmentCard(dataKey, year, team) {
            const selectedQuarter = getAuditLuxSelectedAttachmentQuarter(dataKey, year, team);
            const attachmentItem = typeof getAuditLuxYearEvidenceItem === 'function'
                ? getAuditLuxYearEvidenceItem(dataKey, year, team, selectedQuarter)
                : null;
            const hasAttachment = Boolean(attachmentItem);
            const { viewUrl, downloadUrl, fileLabel } = hasAttachment ? getAuditLuxEvidenceMeta(attachmentItem) : {};
            const inputId = getAuditLuxAttachmentInputId(dataKey, year, team, selectedQuarter);
            const openUrl = viewUrl || downloadUrl || '#';
            const downloadHref = downloadUrl || viewUrl || '#';
            const teamLabel = team || '팀 없음';
            const progressStatus = typeof getAuditLuxProgressStatus === 'function'
                ? getAuditLuxProgressStatus(dataKey, year, team)
                : '';
            const progressStatusClass = progressStatus === 'complete'
                ? 'is-complete'
                : (progressStatus ? 'is-progress' : 'is-incomplete');
            const teamClassName = getAuditLuxTeamClassName(team);
            return `
                <article class="audit-lux-index-card ${escapeHtml(teamClassName)} ${hasAttachment ? 'is-attached' : 'is-empty'}" data-audit-lux-card="${escapeHtml(dataKey)}" data-year="${escapeHtml(year)}" data-quarter="${escapeHtml(selectedQuarter)}" data-team="${escapeHtml(team)}">
                    <div class="audit-lux-index-team-cell">
                        <strong class="audit-lux-index-team-label ${escapeHtml(teamClassName)} kpi-team-display">
                            <span class="audit-lux-index-team-icon kpi-team-display-icon" aria-hidden="true">${getAuditLuxTeamIconSvg(team)}</span>
                            <span class="kpi-team-display-name">${escapeHtml(teamLabel)}</span>
                        </strong>
                        <div class="audit-lux-index-team-tools" onclick="event.stopPropagation()">
                            <select class="audit-select audit-lux-progress-select ${progressStatusClass}" aria-label="${escapeHtml(`${teamLabel} 진행 상태`)}" onchange="this.classList.toggle('is-complete', this.value === 'complete'); this.classList.toggle('is-progress', this.value !== '' && this.value !== 'complete'); this.classList.toggle('is-incomplete', this.value === ''); setAuditLuxProgressStatusForTarget('${escapeJs(dataKey)}', ${Number(year)}, '${escapeJs(team)}', this.value)" onclick="event.stopPropagation()">
                                ${typeof getAuditLuxProgressStatusOptions === 'function' ? getAuditLuxProgressStatusOptions(progressStatus, year) : ''}
                            </select>
                            ${hasAttachment
                                ? `<a class="audit-lux-icon-action audit-ref-download" href="${escapeHtml(downloadHref)}" download="${escapeHtml(fileLabel || `${year}-${team}-lux`)}" aria-label="${escapeHtml(`${teamLabel} 다운로드`)}" title="다운로드" onclick="event.stopPropagation()"><i class="fa-solid fa-download" aria-hidden="true"></i></a>`
                                : `<button type="button" class="audit-lux-icon-action" aria-label="${escapeHtml(`${teamLabel} 다운로드`)}" title="다운로드" disabled><i class="fa-solid fa-download" aria-hidden="true"></i></button>`}
                            <button type="button" class="audit-lux-icon-action audit-lux-index-replace" aria-label="${escapeHtml(`${teamLabel} 교체`)}" title="교체" onclick="event.preventDefault(); event.stopPropagation(); openAuditLuxAttachmentPickerForTarget('${escapeJs(dataKey)}', ${Number(year)}, '${escapeJs(team)}', ${Number(selectedQuarter)})"><i class="fa-solid fa-arrow-rotate-right" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    <div class="audit-lux-index-preview-cell">
                        ${renderAuditLuxAttachmentMedia(dataKey, year, team, selectedQuarter, attachmentItem, openUrl)}
                        <input
                            type="file"
                            id="${escapeHtml(inputId)}"
                            class="audit-hidden-input"
                            data-audit-lux-attachment-input="${escapeHtml(dataKey)}"
                            data-quarter="${escapeHtml(selectedQuarter)}"
                            accept="image/*,application/pdf"
                            onchange="handleAuditLuxAttachmentChangeForTarget('${escapeJs(dataKey)}', ${Number(year)}, '${escapeJs(team)}', ${Number(selectedQuarter)}, this)"
                        />
                    </div>
                </article>
            `;
        }

        function renderAuditLuxYearSection(dataKey, year, teams) {
            const safeTeams = Array.isArray(teams) ? teams : [];
            return `
                <section class="audit-lux-index-year" data-audit-lux-year="${escapeHtml(year)}">
                    <div class="audit-lux-index-year-head">
                        <h3>${escapeHtml(year)}년</h3>
                    </div>
                    <div class="audit-lux-index-grid">
                        ${safeTeams.length
                            ? safeTeams.map((team) => renderAuditLuxAttachmentCard(dataKey, year, team)).join('')
                            : '<div class="audit-lux-index-empty">등록된 팀이 없습니다.</div>'}
                    </div>
                </section>
            `;
        }

        function setAuditLuxWorkspaceTarget(dataKey, year, team, options = {}) {
            if (!isAuditLuxDataKey(dataKey)) return false;
            const { entryForm, yearStart, now, teams } = getAuditLuxWorkspaceState(dataKey);
            const targetYear = Number(year);
            const targetTeam = String(team || '').trim();
            if (!Number.isFinite(targetYear) || !targetTeam) return false;
            entryForm.year = Math.min(Math.max(targetYear, yearStart), now.year);
            entryForm.team = teams.includes(targetTeam) ? targetTeam : (teams[0] || targetTeam);
            entryForm.quarter = normalizeAuditLuxAttachmentQuarter(entryForm.year, options.quarter ?? entryForm.quarter);
            if (options.render === true) {
                renderAuditLuxWorkspaceCategory(dataKey);
            }
            return true;
        }

        function renderAuditLuxWorkspacePreview(dataKey, year, team, quarter = null) {
            const selectedQuarter = normalizeAuditLuxAttachmentQuarter(year, quarter);
            const periodLabel = typeof getAuditLuxEvidencePeriodLabel === 'function'
                ? getAuditLuxEvidencePeriodLabel(year, selectedQuarter)
                : `${year}년 ${selectedQuarter}분기`;
            const attachmentItem = typeof getAuditLuxYearEvidenceItem === 'function'
                ? getAuditLuxYearEvidenceItem(dataKey, year, team, selectedQuarter)
                : null;
            if (!attachmentItem) {
                return `
                    <div class="audit-lux-preview-card">
                        <div class="audit-lux-preview-head">
                            <div class="audit-lux-preview-copy">
                                <div class="audit-lux-preview-title">조도본 원본</div>
                                <div class="audit-lux-preview-meta">${escapeHtml(team || '')} ${escapeHtml(periodLabel)}</div>
                            </div>
                        </div>
                        <div class="audit-lux-preview-empty">선택한 분기에 등록된 조도본이 없습니다.</div>
                    </div>
                `;
            }
            const { viewUrl, downloadUrl, fileLabel, isPdf, rotation } = getAuditLuxEvidenceMeta(attachmentItem);
            const previewStage = viewUrl
                ? (isPdf
                    ? `<iframe class="audit-lux-preview-frame" src="${escapeHtml(viewUrl)}" title="조도본 미리보기"></iframe>`
                    : `<img class="audit-lux-preview-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(`${team} ${periodLabel} 조도본`)}" loading="lazy" decoding="async" style="transform: rotate(${rotation}deg);" />`)
                : '<div class="audit-lux-preview-empty">첨부 미리보기를 불러올 수 없습니다.</div>';
            return `
                <div class="audit-lux-preview-card">
                    <div class="audit-lux-preview-head">
                        <div class="audit-lux-preview-copy">
                            <div class="audit-lux-preview-title">조도본 원본</div>
                            <div class="audit-lux-preview-meta">${escapeHtml(team || '')} ${escapeHtml(periodLabel)}</div>
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
            const selectedQuarter = Number(entryForm.quarter);
            const selectedTeam = String(entryForm.team || '').trim();
            const years = getAuditLuxYearRange(yearStart, now.year);
            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="audit-lux-shell is-file-index" data-audit-lux-workspace="${dataKey}">
                    <div class="audit-lux-window">
                        <div class="audit-lux-window-header">
                            <div class="audit-lux-window-brand" aria-hidden="true">
                                <span class="audit-lux-window-icon"><i class="fa-solid fa-lightbulb"></i></span>
                            </div>
                            <div class="audit-lux-window-copy">
                                <h2 class="audit-lux-window-title">조도</h2>
                            </div>
                        </div>
                        <div class="audit-lux-workspace is-file-index">
                            <div class="audit-lux-index-panel">
                                <div class="audit-lux-index-year-list">
                                    ${years.length
                                        ? years.map((year) => renderAuditLuxYearSection(dataKey, year, teams)).join('')
                                        : '<div class="audit-lux-index-empty">표시할 년도가 없습니다.</div>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            syncAuditLuxDetachedPreview(dataKey, selectedYear, selectedTeam, selectedQuarter);
            if (typeof initAuditLuxPdfThumbnails === 'function') {
                initAuditLuxPdfThumbnails(dataKey);
            }
            syncAuditLuxWorkspaceFullscreenUi();
        }

        async function saveAuditLuxWorkspace(dataKey, options = {}) {
            if (!isAuditLuxDataKey(dataKey)) return false;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const year = Number(entryForm.year);
            const team = String(entryForm.team || '').trim();
            if (!Number.isFinite(year) || !team) return false;
            const standardInputs = Array.from(document.querySelectorAll(`[data-audit-lux-standard-input="${dataKey}"]`));
            if (!standardInputs.length) {
                const data = getAuditData(dataKey, dataKey);
                const saved = await Promise.resolve(saveAuditData(dataKey, data));
                if (saved === false) {
                    if (options?.silent !== true) {
                        alert('조도 데이터는 서버 저장이 가능한 환경에서만 저장할 수 있습니다.');
                    }
                    return false;
                }
                const category = getAuditLuxWorkspaceCategory(dataKey);
                setLastModified(category?.title || '조도');
                return true;
            }
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
            const category = renderAuditLuxWorkspaceCategory(dataKey);
            setLastModified(category?.title || '조도');
            return true;
        }

        function openAuditLuxAttachmentPicker(dataKey) {
            const input = document.getElementById(`audit-lux-attachment-input-${dataKey}`)
                || document.querySelector(`[data-audit-lux-attachment-input="${dataKey}"]`);
            if (input) input.click();
        }

        function openAuditLuxAttachmentPickerForTarget(dataKey, year, team, quarter = null) {
            const targetQuarter = normalizeAuditLuxAttachmentQuarter(year, quarter ?? getAuditLuxSelectedAttachmentQuarter(dataKey, year, team));
            if (!setAuditLuxWorkspaceTarget(dataKey, year, team, { quarter: targetQuarter, render: false })) return;
            const state = getAuditLuxAttachmentQuarterState(dataKey);
            state[getAuditLuxAttachmentQuarterStateKey(year, team)] = targetQuarter;
            const inputId = getAuditLuxAttachmentInputId(dataKey, year, team, targetQuarter);
            const input = document.getElementById(inputId);
            if (input) {
                input.dataset.quarter = String(targetQuarter);
                input.click();
            }
        }

        function openAuditLuxDetachedPreviewForTarget(dataKey, year, team, quarter = null) {
            const targetQuarter = normalizeAuditLuxAttachmentQuarter(year, quarter ?? getAuditLuxSelectedAttachmentQuarter(dataKey, year, team));
            if (!setAuditLuxWorkspaceTarget(dataKey, year, team, { quarter: targetQuarter, render: false })) return;
            if (typeof openAuditLuxDetachedPreview === 'function') {
                openAuditLuxDetachedPreview(dataKey);
            }
        }

        async function handleAuditLuxAttachmentChange(dataKey, input) {
            const file = input?.files?.[0];
            if (!file) return;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const year = Number(entryForm.year);
            const team = String(entryForm.team || '').trim();
            const quarter = Number(entryForm.quarter);
            return handleAuditLuxAttachmentChangeForTarget(dataKey, year, team, quarter, input);
        }

        async function handleAuditLuxAttachmentChangeForTarget(dataKey, year, team, quarterOrInput, maybeInput) {
            const input = maybeInput || quarterOrInput;
            const file = input?.files?.[0];
            if (!file) return;
            const targetYear = Number(year);
            const targetTeam = String(team || '').trim();
            const targetQuarter = normalizeAuditLuxAttachmentQuarter(targetYear, maybeInput ? quarterOrInput : input?.dataset?.quarter);
            setAuditLuxWorkspaceTarget(dataKey, targetYear, targetTeam, { quarter: targetQuarter, render: false });
            try {
                await replaceAuditLuxEvidenceForYear(dataKey, targetYear, targetTeam, targetQuarter, file);
                const category = renderAuditLuxWorkspaceCategory(dataKey);
                setLastModified(category?.title || '조도');
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
