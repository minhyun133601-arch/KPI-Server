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
            if (!entryForm.quarter || entryForm.quarter < 1 || entryForm.quarter > 4) {
                entryForm.quarter = now.quarter;
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

        function getAuditLuxAttachmentInputId(dataKey, year, team) {
            const safeKey = String(dataKey || '').trim().replace(/[^A-Za-z0-9_-]+/g, '-');
            const safeTeam = encodeURIComponent(String(team || '').trim()).replace(/%/g, '-');
            return `audit-lux-attachment-input-${safeKey}-${Number(year)}-${safeTeam}`;
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

        function renderAuditLuxAttachmentThumb(dataKey, year, team, attachmentItem) {
            if (!attachmentItem) {
                return `
                    <div class="audit-lux-index-empty-thumb">
                        <i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i>
                    </div>
                `;
            }
            const { viewUrl, fileLabel, isPdf, rotation } = getAuditLuxEvidenceMeta(attachmentItem);
            if (viewUrl && !isPdf) {
                return `<img class="audit-lux-index-thumb-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(`${team} ${year}년 조도본`)}" loading="lazy" decoding="async" style="transform: rotate(${rotation}deg);" />`;
            }
            return `
                <div class="audit-lux-index-file-thumb ${isPdf ? 'is-pdf' : ''}">
                    <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'}" aria-hidden="true"></i>
                    <span>${escapeHtml(isPdf ? 'PDF' : (fileLabel || 'FILE'))}</span>
                </div>
            `;
        }

        function getAuditLuxTeamClass(team) {
            const label = String(team || '').trim();
            if (label.includes('1팀') && label.includes('1파트')) return 'is-team-1-part-1';
            if (label.includes('1팀') && label.includes('2파트')) return 'is-team-1-part-2';
            if (label.startsWith('2팀')) return 'is-team-2';
            if (label.startsWith('3팀')) return 'is-team-3';
            return 'is-team-default';
        }

        function renderAuditLuxAttachmentCard(dataKey, year, team) {
            const attachmentItem = typeof getAuditLuxYearEvidenceItem === 'function'
                ? getAuditLuxYearEvidenceItem(dataKey, year, team)
                : null;
            const hasAttachment = Boolean(attachmentItem);
            const { viewUrl, downloadUrl, fileLabel } = hasAttachment ? getAuditLuxEvidenceMeta(attachmentItem) : {};
            const inputId = getAuditLuxAttachmentInputId(dataKey, year, team);
            const teamClass = getAuditLuxTeamClass(team);
            const openUrl = viewUrl || downloadUrl || '#';
            const downloadHref = downloadUrl || viewUrl || '#';
            const teamLabel = team || '팀 없음';
            const cardLabel = hasAttachment ? teamLabel : `${teamLabel} 미첨부`;
            return `
                <article class="audit-lux-index-card ${teamClass} ${hasAttachment ? 'is-attached' : 'is-empty'}" data-audit-lux-card="${escapeHtml(dataKey)}" data-year="${escapeHtml(year)}" data-team="${escapeHtml(team)}">
                    <div class="audit-lux-index-card-media">
                        ${renderAuditLuxAttachmentThumb(dataKey, year, team, attachmentItem)}
                    </div>
                    <div class="audit-lux-index-card-main">
                        <strong>${escapeHtml(cardLabel)}</strong>
                    </div>
                    <div class="audit-lux-index-card-actions">
                        <button type="button" class="work-btn primary audit-lux-index-replace" onclick="openAuditLuxAttachmentPickerForTarget('${escapeJs(dataKey)}', ${Number(year)}, '${escapeJs(team)}')"><i class="fa-solid fa-arrow-rotate-right" aria-hidden="true"></i><span>교체</span></button>
                        ${hasAttachment
                            ? `<a class="work-btn audit-ref-open" href="${escapeHtml(openUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i><span>원본 열기</span></a>`
                            : '<button type="button" class="work-btn" disabled><i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i><span>원본 열기</span></button>'}
                        ${hasAttachment
                            ? `<a class="work-btn audit-ref-download" href="${escapeHtml(downloadHref)}" download="${escapeHtml(fileLabel || `${year}-${team}-lux`)}"><i class="fa-solid fa-download" aria-hidden="true"></i><span>원본 다운</span></a>`
                            : '<button type="button" class="work-btn" disabled><i class="fa-solid fa-download" aria-hidden="true"></i><span>원본 다운</span></button>'}
                        <input
                            type="file"
                            id="${escapeHtml(inputId)}"
                            class="audit-hidden-input"
                            data-audit-lux-attachment-input="${escapeHtml(dataKey)}"
                            accept="image/*,application/pdf"
                            onchange="handleAuditLuxAttachmentChangeForTarget('${escapeJs(dataKey)}', ${Number(year)}, '${escapeJs(team)}', this)"
                        />
                    </div>
                </article>
            `;
        }

        function renderAuditLuxYearSection(dataKey, year, teams) {
            const safeTeams = Array.isArray(teams) ? teams : [];
            const attachedCount = safeTeams.filter((team) => (
                typeof getAuditLuxYearEvidenceItem === 'function'
                && getAuditLuxYearEvidenceItem(dataKey, year, team)
            )).length;
            return `
                <section class="audit-lux-index-year" data-audit-lux-year="${escapeHtml(year)}">
                    <div class="audit-lux-index-year-head">
                        <div>
                            <h3>${escapeHtml(year)}년</h3>
                            <span>${escapeHtml(attachedCount)} / ${escapeHtml(safeTeams.length)}팀 첨부</span>
                        </div>
                        <span class="audit-lux-index-year-badge">${attachedCount === safeTeams.length && safeTeams.length ? '완료' : '대기'}</span>
                    </div>
                    <div class="audit-lux-index-grid">
                        ${safeTeams.length
                            ? safeTeams.map((team) => renderAuditLuxAttachmentCard(dataKey, year, team)).join('')
                            : '<div class="audit-lux-index-empty">등록된 팀이 없습니다.</div>'}
                    </div>
                </section>
            `;
        }

        function renderAuditLuxIndexSummary(dataKey, years, teams) {
            const totalSlots = years.length * teams.length;
            let attachedCount = 0;
            teams.forEach((team) => {
                years.forEach((year) => {
                    if (typeof getAuditLuxYearEvidenceItem === 'function' && getAuditLuxYearEvidenceItem(dataKey, year, team)) {
                        attachedCount += 1;
                    }
                });
            });
            return `
                <div class="audit-lux-index-summary" aria-label="조도 첨부 요약">
                    <article>
                        <span class="audit-lux-index-summary-icon is-total"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></span>
                        <div>
                            <span>관리 슬롯</span>
                            <strong>${escapeHtml(totalSlots)}<small>건</small></strong>
                        </div>
                    </article>
                    <article>
                        <span class="audit-lux-index-summary-icon is-attached"><i class="fa-solid fa-file-circle-check" aria-hidden="true"></i></span>
                        <div>
                            <span>첨부 완료</span>
                            <strong>${escapeHtml(attachedCount)}<small>건</small></strong>
                        </div>
                    </article>
                    <article>
                        <span class="audit-lux-index-summary-icon is-waiting"><i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i></span>
                        <div>
                            <span>미첨부</span>
                            <strong>${escapeHtml(Math.max(0, totalSlots - attachedCount))}<small>건</small></strong>
                        </div>
                    </article>
                </div>
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
            if (options.render === true) {
                renderAuditLuxWorkspaceCategory(dataKey);
            }
            return true;
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
                                <div class="audit-lux-preview-title">조도본 원본</div>
                                <div class="audit-lux-preview-meta">${escapeHtml(team || '')} ${escapeHtml(String(year || ''))}년</div>
                            </div>
                        </div>
                        <div class="audit-lux-preview-empty">선택한 년도에 등록된 조도본이 없습니다.</div>
                    </div>
                `;
            }
            const { viewUrl, downloadUrl, fileLabel, isPdf, rotation } = getAuditLuxEvidenceMeta(attachmentItem);
            const previewStage = viewUrl
                ? (isPdf
                    ? `<iframe class="audit-lux-preview-frame" src="${escapeHtml(viewUrl)}" title="조도본 미리보기"></iframe>`
                    : `<img class="audit-lux-preview-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(`${team} ${year}년 조도본`)}" loading="lazy" decoding="async" style="transform: rotate(${rotation}deg);" />`)
                : '<div class="audit-lux-preview-empty">첨부 미리보기를 불러올 수 없습니다.</div>';
            return `
                <div class="audit-lux-preview-card">
                    <div class="audit-lux-preview-head">
                        <div class="audit-lux-preview-copy">
                            <div class="audit-lux-preview-title">조도본 원본</div>
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
            const years = getAuditLuxYearRange(yearStart, now.year);
            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="audit-lux-shell is-file-index" data-audit-lux-workspace="${dataKey}">
                    <div class="audit-lux-window">
                        <div class="audit-lux-window-header">
                            <div class="audit-lux-window-copy">
                                <span class="audit-lux-window-kicker">조도 파일</span>
                                <h2 class="audit-lux-window-title">${escapeHtml(category.title || '조도')}</h2>
                                <p class="audit-lux-window-desc">팀별 연도 조도본을 보관합니다. 분기마다 같은 연도 카드에서 파일을 교체합니다.</p>
                            </div>
                            <div class="audit-lux-window-actions">
                                ${getAuditLuxWorkspaceFullscreenButtonHtml()}
                            </div>
                        </div>
                        <div class="audit-lux-workspace is-file-index">
                            <div class="audit-lux-index-panel">
                                ${renderAuditLuxIndexSummary(dataKey, years, teams)}
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
            syncAuditLuxDetachedPreview(dataKey, selectedYear, selectedTeam);
            syncAuditLuxWorkspaceFullscreenUi();
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
            const category = renderAuditLuxWorkspaceCategory(dataKey);
            setLastModified(category?.title || '조도');
            return true;
        }

        function openAuditLuxAttachmentPicker(dataKey) {
            const input = document.getElementById(`audit-lux-attachment-input-${dataKey}`)
                || document.querySelector(`[data-audit-lux-attachment-input="${dataKey}"]`);
            if (input) input.click();
        }

        function openAuditLuxAttachmentPickerForTarget(dataKey, year, team) {
            if (!setAuditLuxWorkspaceTarget(dataKey, year, team, { render: false })) return;
            const inputId = getAuditLuxAttachmentInputId(dataKey, year, team);
            const input = document.getElementById(inputId);
            if (input) input.click();
        }

        function openAuditLuxDetachedPreviewForTarget(dataKey, year, team) {
            if (!setAuditLuxWorkspaceTarget(dataKey, year, team, { render: false })) return;
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
            return handleAuditLuxAttachmentChangeForTarget(dataKey, year, team, input);
        }

        async function handleAuditLuxAttachmentChangeForTarget(dataKey, year, team, input) {
            const file = input?.files?.[0];
            if (!file) return;
            const targetYear = Number(year);
            const targetTeam = String(team || '').trim();
            setAuditLuxWorkspaceTarget(dataKey, targetYear, targetTeam, { render: false });
            try {
                await replaceAuditLuxEvidenceForYear(dataKey, targetYear, targetTeam, file);
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
