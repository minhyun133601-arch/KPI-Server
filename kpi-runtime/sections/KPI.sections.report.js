(function () {
    const REPORT_HQ_VIEW = 'hq';
    const REPORT_PRODUCTION_TEAM1_VIEW = 'production-team-1';
    const REPORT_PRODUCTION_TEAM2_VIEW = 'production-team-2';
    const REPORT_PRODUCTION_TEAM3_VIEW = 'production-team-3';
    const REPORT_PUBLIC_WORKS_VIEW = 'public-works';
    const REPORT_INITIAL_SLIDE_COUNT = 2;
    const REPORT_SAFETY_SLOTS_PER_PAGE = 8;
    const REPORT_SAFETY_COLUMNS_PER_ROW = 4;
    const REPORT_SAFETY_PAGE_COUNT = 2;
    const REPORT_SAFETY_TEAM_ROWS = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀'];
    const REPORT_SAFETY_HAZARD_OPTIONS = ['미끄럼', '넘어짐', '끼임', '충돌', '낙하/비래', '베임/찔림', '화재', '감전', '누출', '화상'];
    const SLIDE_NAV_ITEMS = [
        { view: REPORT_HQ_VIEW, label: '표지' },
        { view: REPORT_HQ_VIEW, label: '본부 목차' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '표지' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '목차' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '생산실적(생산량)' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM1_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '표지' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '목차' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '생산실적(생산량)' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM2_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '표지' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '목차' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '생산실적(생산량)' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '생산지표' },
        { view: REPORT_PRODUCTION_TEAM3_VIEW, label: '생산지표' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '표지' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '목차' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '가스·전기 분석' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '가스·전기 분석' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '가스 비용 분석' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '폐수 비용 분석' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '폐수 비용 분석' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '공사 및 정비' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '공사 및 정비' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '주요 계획' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '주요 계획' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '자율 안전 신고제' },
        { view: REPORT_PUBLIC_WORKS_VIEW, label: '자율 안전 신고제' }
    ];

    function buildSkeletonCells(count) {
        return Array.from({ length: count }, () => '<td><span class="report-skeleton-line"></span></td>').join('');
    }

    function buildMetricTable(title, rowCount = 5, colCount = 6) {
        const rows = Array.from({ length: rowCount }, (_, index) => (
            `<tr>${index === 0
                ? `<th colspan="${colCount}">${title}</th>`
                : buildSkeletonCells(colCount)
            }</tr>`
        )).join('');
        return `<table class="report-template-table">${rows}</table>`;
    }

    function buildMemoBox() {
        return `
            <div class="report-memo-box">
                <strong>특이사항</strong>
                <span class="report-skeleton-line"></span>
                <span class="report-skeleton-line is-long"></span>
                <span class="report-skeleton-line is-mid"></span>
            </div>
        `;
    }

    function buildChartBox() {
        return `
            <div class="report-chart-box" aria-label="차트 영역">
                <div class="report-chart-grid"></div>
                <div class="report-chart-bars"><i></i><i></i><i></i><i></i><i></i></div>
                <div class="report-chart-line"></div>
            </div>
        `;
    }

    function buildBukjeongAutoMetricTable(kind, resourceLabel, usageLabel, scopeLabel = '북정') {
        const rows = [
            { key: 'production', label: '생산량<br>(kg)' },
            { key: 'usage', label: usageLabel },
            { key: 'unit', label: '&#50896;&#45800;&#50948;' },
            { key: 'cost', label: '사용 금액<br>(원)' }
        ].map(row => `
            <tr${row.key === 'unit' ? ' class="report-auto-unit-row"' : ''}>
                <th class="report-auto-row-label">${row.label}</th>
                <td data-report-auto-value="${kind}.${row.key}.reference"></td>
                <td data-report-auto-value="${kind}.${row.key}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-auto-value="${kind}.${row.key}.yoy"></td>
                <td data-report-auto-value="${kind}.${row.key}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-auto-value="${kind}.${row.key}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-auto-metric-table" data-report-auto-table="${kind}">
                <tbody>
                    <tr>
                        <th class="report-auto-resource-cell" rowspan="5">${resourceLabel}</th>
                        <th class="report-auto-row-label">${scopeLabel}</th>
                        <th data-report-auto-month-label="reference"></th>
                        <th data-report-auto-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-auto-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function buildReportChartHighlightControls(chartKey = '', toggleKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return '';
        const toggle = String(toggleKey || '').trim();
        const toggleAttr = toggle ? ` data-report-chart-highlight-toggle="${toggle}"` : '';
        return `
            <div class="report-chart-highlight-controls" data-report-chart-highlight-controls="${key}">
                <button type="button" class="report-chart-highlight-toggle is-point-mode" data-report-chart-highlight-key="${key}" data-report-chart-highlight-mode="point"${toggleAttr} aria-pressed="false" aria-label="\uB2E8\uC77C \uAC15\uC870">\u25CB</button>
                <button type="button" class="report-chart-highlight-toggle is-range-mode" data-report-chart-highlight-key="${key}" data-report-chart-highlight-mode="range"${toggleAttr} aria-pressed="false" aria-label="\uBC94\uC704 \uAC15\uC870">\u25A1</button>
                <button type="button" class="report-chart-highlight-reset" data-report-chart-highlight-key="${key}" data-report-chart-highlight-reset="${toggle || 'all'}" aria-label="\uAC15\uC870 \uB418\uB3CC\uB9AC\uAE30">\u21B6</button>
            </div>
        `;
    }

    function buildBukjeongAutoChart(kind, title, analysisKey = '') {
        const chartKey = `auto:${analysisKey || 'bukjeong-utility'}:${kind}`;
        return `
            <div class="report-auto-chart" data-report-auto-chart="${kind}">
                <div class="report-auto-chart-title">${title}</div>
                ${buildReportChartHighlightControls(chartKey, kind)}
                <div class="report-auto-chart-plot" data-report-auto-chart-plot="${kind}" aria-label="${title}"></div>
            </div>
        `;
    }

    function buildBukjeongAutoMemo(memoKey = '', options = {}) {
        const key = String(memoKey || '').trim();
        const defaultTeam = String(options.defaultTeam || '').trim();
        const defaultMetric = String(options.defaultMetric || '').trim();
        const memoAttrs = key
            ? ` data-report-memo-key="${key}" data-report-memo-default-team="${defaultTeam}" data-report-memo-default-metric="${defaultMetric}" role="button" tabindex="-1"`
            : '';
        return `
            <div class="report-auto-memo-box"${memoAttrs}>
                <strong>특이사항</strong>
                <div class="report-auto-memo-blank report-auto-memo-content" data-report-memo-content="${key}"></div>
            </div>
        `;
    }

    function buildPhotoPlaceholder() {
        return '<div class="report-photo-placeholder"></div>';
    }

    function buildReportPlanImageSlot(slideKey, slotIndex) {
        const fieldRole = `${slideKey}Image`;
        return `
            <td class="report-plan-image-cell" data-report-plan-slot="${slideKey}.${slotIndex}" data-report-plan-local-slot="${slotIndex}">
                <div class="report-plan-image-frame" data-report-plan-image-frame role="button" tabindex="-1" aria-label="이미지 첨부">
                    <img data-report-plan-image data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" alt="">
                    <span class="report-plan-image-placeholder" data-report-plan-image-placeholder>이미지</span>
                    <div class="report-plan-image-choice" data-report-plan-image-choice>
                        <label class="report-plan-image-choice-button" data-report-plan-image-upload data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">
                            <span>첨부</span>
                            <input type="file" accept="image/*" data-report-plan-image-input data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" disabled>
                        </label>
                        <button type="button" class="report-plan-image-choice-button" data-report-plan-image-paste data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">붙여넣기</button>
                    </div>
                    <button type="button" class="report-plan-image-clear-button" data-report-plan-image-clear data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" aria-label="이미지 삭제" title="이미지 삭제">X</button>
                </div>
            </td>
        `;
    }

    function buildReportPhaseImageSlot(slideKey, slotIndex, phaseKey, extraCellClass = '') {
        const fieldRole = `${slideKey}${phaseKey}Image`;
        const extraClass = extraCellClass ? ` ${extraCellClass}` : '';
        return `
            <td class="report-plan-image-cell${extraClass}" data-report-plan-slot="${slideKey}.${slotIndex}" data-report-plan-local-slot="${slotIndex}">
                <div class="report-plan-image-frame" data-report-plan-image-frame role="button" tabindex="-1" aria-label="이미지 첨부">
                    <img data-report-plan-image data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" alt="">
                    <span class="report-plan-image-placeholder" data-report-plan-image-placeholder>이미지</span>
                    <div class="report-plan-image-choice" data-report-plan-image-choice>
                        <label class="report-plan-image-choice-button" data-report-plan-image-upload data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">
                            <span>첨부</span>
                            <input type="file" accept="image/*" data-report-plan-image-input data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" disabled>
                        </label>
                        <button type="button" class="report-plan-image-choice-button" data-report-plan-image-paste data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">붙여넣기</button>
                    </div>
                    <button type="button" class="report-plan-image-clear-button" data-report-plan-image-clear data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" aria-label="이미지 삭제" title="이미지 삭제">X</button>
                </div>
            </td>
        `;
    }

    function buildReportStatusImageSlot(slotIndex, phaseKey) {
        return buildReportPhaseImageSlot('slide8', slotIndex, phaseKey, 'report-status-image-cell');
    }

    function buildReportSafetyImageFrame(slotIndex, phaseKey) {
        const fieldRole = `slide10${phaseKey}Image`;
        return `
            <div class="report-plan-image-frame report-safety-image-frame" data-report-plan-image-frame role="button" tabindex="-1" aria-label="이미지 첨부">
                <img data-report-plan-image data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" alt="">
                <span class="report-plan-image-placeholder" data-report-plan-image-placeholder>이미지</span>
                <div class="report-plan-image-choice" data-report-plan-image-choice>
                    <label class="report-plan-image-choice-button" data-report-plan-image-upload data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">
                        <span>첨부</span>
                        <input type="file" accept="image/*" data-report-plan-image-input data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" disabled>
                    </label>
                    <button type="button" class="report-plan-image-choice-button" data-report-plan-image-paste data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}">붙여넣기</button>
                </div>
                <button type="button" class="report-plan-image-clear-button" data-report-plan-image-clear data-report-plan-image-role="${fieldRole}" data-report-plan-local-slot="${slotIndex}" aria-label="이미지 삭제" title="이미지 삭제">X</button>
            </div>
        `;
    }

    function buildReportPlanSummarySlot(slideKey, slotIndex) {
        const overviewToken = slideKey === 'slide8' ? ` data-report-slide8-overview="${slotIndex}"` : '';
        return `
            <td class="report-plan-summary-cell" data-report-plan-slot="${slideKey}.${slotIndex}" data-report-plan-local-slot="${slotIndex}"${overviewToken}>
                <div class="report-plan-summary-text" data-report-plan-summary="${slideKey}" data-report-plan-local-slot="${slotIndex}"${overviewToken} contenteditable="false" spellcheck="false"></div>
                <button type="button" class="report-plan-delete-slot" data-report-plan-delete-slot="${slideKey}" data-report-plan-local-slot="${slotIndex}">삭제</button>
            </td>
        `;
    }

    function buildReportSafetyImageCell(slotIndex, phaseKey) {
        return `
            <td class="report-safety-image-cell" data-report-plan-slot="slide10.${slotIndex}" data-report-plan-local-slot="${slotIndex}">
                ${buildReportSafetyImageFrame(slotIndex, phaseKey)}
            </td>
        `;
    }

    function buildReportSafetySummaryCell(slotIndex) {
        return `
            <td class="report-safety-summary-cell" data-report-plan-slot="slide10.${slotIndex}" data-report-plan-local-slot="${slotIndex}">
                <div class="report-safety-summary-text" data-report-plan-summary="slide10" data-report-plan-local-slot="${slotIndex}" contenteditable="false" spellcheck="false"></div>
                <button type="button" class="report-plan-delete-slot report-safety-delete-slot" data-report-plan-delete-slot="slide10" data-report-plan-local-slot="${slotIndex}">삭제</button>
            </td>
        `;
    }

    function buildReportSafetyTable(rowIndex = 0, pageIndex = 0) {
        const firstSlotIndex = rowIndex * REPORT_SAFETY_COLUMNS_PER_ROW + 1;
        const slotIndexes = Array.from({ length: REPORT_SAFETY_COLUMNS_PER_ROW }, (_, index) => firstSlotIndex + index);
        const headerCells = slotIndexes.map((slotIndex, index) => {
            const teamAttrs = index === 0
                ? ` class="report-safety-row-team" data-report-plan-row-team="slide10" data-report-plan-row-index="${rowIndex}"`
                : '';
            const teamContent = index === 0
                ? `<span class="report-safety-row-team-label" data-report-plan-row-team-label></span>`
                : '';
            return `<th${teamAttrs} data-report-plan-slot="slide10.${slotIndex}" data-report-plan-local-slot="${slotIndex}">${teamContent}</th>`;
        }).join('');
        return `
            <table class="report-safety-table" data-report-safety-row="${rowIndex}" aria-label="자율 안전 신고제">
                <colgroup>
                    <col class="report-safety-label-col">
                    ${slotIndexes.map((slotIndex, index) => `<col class="report-safety-slot-col" data-report-plan-slot="slide10.${slotIndex}" data-report-plan-local-slot="${slotIndex}"${index === 0 ? ' data-report-safety-row-anchor="true"' : ''}>`).join('')}
                </colgroup>
                <thead>
                    <tr>
                        <th class="report-safety-label-head" aria-hidden="true"></th>
                        ${headerCells}
                    </tr>
                </thead>
                <tbody>
                    <tr class="report-safety-before-row">
                        <th>전</th>
                        ${slotIndexes.map(slotIndex => buildReportSafetyImageCell(slotIndex, 'Before')).join('')}
                    </tr>
                    <tr class="report-safety-after-row">
                        <th>후</th>
                        ${slotIndexes.map(slotIndex => buildReportSafetyImageCell(slotIndex, 'After')).join('')}
                    </tr>
                    <tr class="report-safety-summary-row">
                        <th>개요</th>
                        ${slotIndexes.map(slotIndex => buildReportSafetySummaryCell(slotIndex)).join('')}
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildReportSafetyAddControl() {
        const teamOptions = REPORT_SAFETY_TEAM_ROWS
            .map((team, index) => `<option value="${index}">${team}</option>`)
            .join('');
        const teamButtons = REPORT_SAFETY_TEAM_ROWS
            .map((team, index) => `<button type="button" data-report-safety-team-option="${index}" data-report-plan-row-source-index="${index}">${team}</button>`)
            .join('');
        return `
            <div class="report-safety-add-control" data-report-safety-add-control data-report-safety-team-picker-open="false">
                <button type="button" class="report-safety-add-toggle" data-report-safety-add-toggle>칸 추가</button>
                <div class="report-safety-team-menu" data-report-safety-team-menu>
                    <span>팀 선택</span>
                    ${teamButtons}
                </div>
                <select data-report-safety-team-select aria-label="자율 안전 신고제 팀 선택" hidden>${teamOptions}</select>
            </div>
        `;
    }

    function buildReportSafetyPage(pageIndex = 0) {
        return `
            <article class="report-slide report-template-slide report-safety-slide" data-report-slide-page="10" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide10" data-report-dynamic-page="${pageIndex}" data-report-optional-page="slide10" data-report-slide-label="자율 안전 신고제"${pageIndex > 0 ? ' hidden' : ''}>
                ${buildSlideHeader('slide10Section', 'slide10Title')}
                ${buildReportSafetyAddControl()}
                <div class="report-safety-layout" data-report-plan-slide="slide10" data-report-plan-page="${pageIndex}">
                    ${Array.from({ length: REPORT_SAFETY_SLOTS_PER_PAGE / REPORT_SAFETY_COLUMNS_PER_ROW }, (_, rowIndex) => buildReportSafetyTable(rowIndex, pageIndex)).join('')}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>10/10</div>
            </article>
        `;
    }

    function buildReportStatusTable(pageIndex = 0) {
        const headerCells = Array.from({ length: 4 }, (_, index) => {
            const slotIndex = index + 1;
            return `<th data-report-plan-slot="slide8.${slotIndex}" data-report-plan-local-slot="${slotIndex}" data-report-plan-header-slot="${slotIndex}">${slotIndex}</th>`;
        }).join('');
        const beforeCells = Array.from({ length: 4 }, (_, index) => buildReportStatusImageSlot(index + 1, 'Before')).join('');
        const afterCells = Array.from({ length: 4 }, (_, index) => buildReportStatusImageSlot(index + 1, 'After')).join('');
        const summaryCells = Array.from({ length: 4 }, (_, index) => buildReportPlanSummarySlot('slide8', index + 1)).join('');
        const slotColumns = Array.from({ length: 4 }, (_, index) => {
            const slotIndex = index + 1;
            return `<col class="report-status-slot-col" data-report-plan-slot="slide8.${slotIndex}" data-report-plan-local-slot="${slotIndex}">`;
        }).join('');
        return `
            <div class="report-plan-layout report-status-layout" data-report-plan-slide="slide8" data-report-plan-page="${pageIndex}">
                <div class="report-plan-count-control">
                    <button type="button" data-report-plan-add-slot="slide8">칸 추가</button>
                </div>
                <table class="report-plan-table report-status-table" aria-label="공사 및 정비 현황">
                    <colgroup>
                        <col class="report-status-label-col">
                        ${slotColumns}
                    </colgroup>
                    <thead>
                        <tr>
                            <th>순 번</th>
                            ${headerCells}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="report-status-before-row">
                            <th>전</th>
                            ${beforeCells}
                        </tr>
                        <tr class="report-status-after-row">
                            <th>후</th>
                            ${afterCells}
                        </tr>
                        <tr class="report-status-summary-row">
                            <th data-report-slide8-overview="next">개 요</th>
                            ${summaryCells}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildReportOverviewDialog() {
        const teamOptions = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀']
            .map(team => `<option value="${team}">${team}</option>`)
            .join('');
        const hazardOptions = REPORT_SAFETY_HAZARD_OPTIONS
            .map(hazard => `<option value="${hazard}">${hazard}</option>`)
            .join('');
        return `
            <div class="report-overview-dialog" data-report-overview-dialog hidden>
                <div class="report-overview-panel" role="dialog" aria-modal="true" aria-labelledby="report-overview-title">
                    <div class="report-overview-head">
                        <strong id="report-overview-title" data-report-overview-dialog-title>개요</strong>
                        <button type="button" data-report-overview-cancel aria-label="닫기">×</button>
                    </div>
                    <div class="report-overview-form">
                        <label data-report-overview-team-row>
                            <span>팀</span>
                            <select data-report-overview-team>${teamOptions}</select>
                        </label>
                        <label data-report-overview-title-row>
                            <span>제목</span>
                            <input type="text" data-report-overview-title>
                        </label>
                        <label data-report-overview-mode="slide8">
                            <span>효과</span>
                            <input type="text" data-report-overview-effect>
                        </label>
                        <label data-report-overview-mode="slide10" data-report-overview-hazard-row>
                            <span>예방</span>
                            <select data-report-overview-hazard>${hazardOptions}</select>
                        </label>
                        <div class="report-overview-toggle-row" data-report-overview-mode="slide9">
                            <span>구분</span>
                            <div class="report-overview-toggle" role="group" aria-label="원인 또는 목적">
                                <button type="button" class="is-active" data-report-overview-kind-option="cause" aria-pressed="true">원인</button>
                                <button type="button" data-report-overview-kind-option="purpose" aria-pressed="false">목적</button>
                                <input type="hidden" data-report-overview-kind value="cause">
                            </div>
                        </div>
                        <label data-report-overview-mode="slide9">
                            <span>원인/목적</span>
                            <input type="text" data-report-overview-detail>
                        </label>
                        <label data-report-overview-date-row>
                            <span data-report-overview-date-label>완료 날짜</span>
                            <input type="date" data-report-overview-date>
                        </label>
                        <label data-report-overview-amount-row>
                            <span data-report-overview-amount-label>금액</span>
                            <span class="report-overview-amount-field">
                                <input type="number" step="any" inputmode="decimal" data-report-overview-amount placeholder="예: 3.4">
                                <em>백만원</em>
                            </span>
                        </label>
                    </div>
                    <div class="report-overview-actions">
                        <button type="button" data-report-overview-cancel>취소</button>
                        <button type="button" data-report-overview-save>저장</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildReportPlanTable(slideKey, pageIndex = 0) {
        const headerCells = Array.from({ length: 4 }, (_, index) => {
            const slotIndex = index + 1;
            return `<th data-report-plan-slot="${slideKey}.${slotIndex}" data-report-plan-local-slot="${slotIndex}" data-report-plan-header-slot="${slotIndex}">${slotIndex}</th>`;
        }).join('');
        const imageCells = Array.from({ length: 4 }, (_, index) => buildReportPlanImageSlot(slideKey, index + 1)).join('');
        const summaryCells = Array.from({ length: 4 }, (_, index) => buildReportPlanSummarySlot(slideKey, index + 1)).join('');
        const slotColumns = Array.from({ length: 4 }, (_, index) => {
            const slotIndex = index + 1;
            return `<col class="report-plan-slot-col" data-report-plan-slot="${slideKey}.${slotIndex}" data-report-plan-local-slot="${slotIndex}">`;
        }).join('');
        return `
            <div class="report-plan-layout" data-report-plan-slide="${slideKey}" data-report-plan-page="${pageIndex}">
                <div class="report-plan-count-control">
                    <button type="button" data-report-plan-add-slot="${slideKey}">칸 추가</button>
                </div>
                <table class="report-plan-table" aria-label="보고서 계획 표">
                    <colgroup>
                        <col class="report-plan-label-col">
                        ${slotColumns}
                    </colgroup>
                    <thead>
                        <tr>
                            <th>순 번</th>
                            ${headerCells}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="report-plan-image-row">
                            <th>상 태</th>
                            ${imageCells}
                        </tr>
                        <tr class="report-plan-summary-row">
                            <th>개 요</th>
                            ${summaryCells}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildSlideHeader(sectionKey, titleKey) {
        return `
            <div class="report-slide-top-brand">
                <div class="report-slide-section" data-report-field="${sectionKey}" contenteditable="false" spellcheck="false"></div>
                <img class="report-slide-logo is-top" src="shared-assets/logo.jpg" alt="HEE CHANG">
            </div>
            <div class="report-template-title" data-report-field="${titleKey}" contenteditable="false" spellcheck="false"></div>
        `;
    }

    function buildAnalysisSlide(index, sectionKey, titleKey, leftTitle, rightTitle) {
        if (Number(index) === 3) {
            return buildBukjeongUtilityAnalysisSlide();
        }
        if (Number(index) === 4) {
            return buildYusanUtilityAnalysisSlide();
        }
        if (Number(index) === 5) {
            return buildYusanLpgCostAnalysisSlide();
        }
        return `
            <article class="report-slide report-template-slide" data-report-slide-page="${index}" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}">
                ${buildSlideHeader(sectionKey, titleKey)}
                <div class="report-two-column-grid">
                    <div class="report-analysis-column">
                        ${buildMetricTable(leftTitle)}
                        ${buildChartBox()}
                        ${buildMemoBox()}
                    </div>
                    <div class="report-analysis-column">
                        ${buildMetricTable(rightTitle)}
                        ${buildChartBox()}
                        ${buildMemoBox()}
                    </div>
                </div>
            </article>
        `;
    }

    function buildYusanLpgCostAnalysisSlide() {
        return `
            <article class="report-slide report-template-slide report-bukjeong-analysis-slide report-yusan-lpg-analysis-slide" data-report-slide-page="5" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-yusan-lpg-analysis>
                ${buildSlideHeader('slide5Section', 'slide5Title')}
                <div class="report-lpg-trend-note">※ (LPG 동향)</div>
                <div class="report-bukjeong-analysis-grid report-yusan-lpg-grid">
                    <div class="report-bukjeong-analysis-column">
                        ${buildYusanLpgMetricTable()}
                        ${buildYusanLpgChart('unit', '1팀 2파트 LPG (kg) / 생산량(kg)')}
                        ${buildYusanLpgMemoBox('slide5LpgMemo', { defaultTeam: 'team_01_02', defaultMetric: 'lpg' })}
                    </div>
                    <div class="report-bukjeong-analysis-column">
                        ${buildYusanLpgCostTable()}
                        ${buildYusanLpgChart('cost', 'LPG 실제 금액 / LNG 환산 금액')}
                        ${buildYusanLpgMemoBox('slide5CostMemo', { defaultTeam: 'team_01_02', defaultMetric: 'lpg' })}
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>5/9</div>
            </article>
        `;
    }

    function buildYusanLpgMetricTable() {
        const rows = [
            { key: 'production', label: '생산량<br>(kg)' },
            { key: 'usage', label: '사용량<br>(kg)' },
            { key: 'unit', label: '&#50896;&#45800;&#50948;' },
            { key: 'amount', label: '사용 금액<br>(원)' }
        ].map(row => `
            <tr${row.key === 'unit' ? ' class="report-auto-unit-row"' : ''}>
                <th class="report-auto-row-label">${row.label}</th>
                <td data-report-yusan-lpg-value="${row.key}.reference"></td>
                <td data-report-yusan-lpg-value="${row.key}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-value="${row.key}.yoy"></td>
                <td data-report-yusan-lpg-value="${row.key}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-value="${row.key}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-auto-metric-table report-yusan-lpg-table" data-report-yusan-lpg-table="left">
                <tbody>
                    <tr>
                        <th class="report-auto-resource-cell" rowspan="5">가스<br><span>(LPG)</span></th>
                        <th class="report-auto-row-label">1팀 2파트</th>
                        <th data-report-yusan-lpg-month-label="reference"></th>
                        <th data-report-yusan-lpg-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-yusan-lpg-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function buildYusanLpgCostTable() {
        const formatRowLabel = (label, index) => index === 2
            ? `${label}<small class="report-yusan-lpg-ratio-formula">LPG실사용/<br>LNG환산</small>`
            : label;
        const rows = ['LPG', 'LNG', '비율'].map((label, index) => `
            <tr>
                <th class="report-auto-row-label">${formatRowLabel(label, index)}</th>
                <td data-report-yusan-lpg-cost-value="${index}.reference"></td>
                <td data-report-yusan-lpg-cost-value="${index}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-cost-value="${index}.yoy"></td>
                <td data-report-yusan-lpg-cost-value="${index}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-cost-value="${index}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-auto-metric-table report-yusan-lpg-table" data-report-yusan-lpg-table="right">
                <tbody>
                    <tr>
                        <th class="report-auto-resource-cell report-yusan-lpg-cost-resource" rowspan="4">비용<br><span>(원)</span><small>LPG ⇒ LNG<br>환산</small></th>
                        <th class="report-auto-row-label">유 산</th>
                        <th data-report-yusan-lpg-cost-month-label="reference"></th>
                        <th data-report-yusan-lpg-cost-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-yusan-lpg-cost-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function buildYusanLpgChart(key, title) {
        const chartKey = `auto:yusan-lpg:${key}`;
        return `
            <div class="report-auto-chart report-lpg-chart" data-report-yusan-lpg-chart="${key}">
                <div class="report-auto-chart-title report-lpg-chart-title">${title}</div>
                ${buildReportChartHighlightControls(chartKey, key)}
                <div class="report-auto-chart-plot report-lpg-chart-plot" data-report-yusan-lpg-chart-plot="${key}" aria-label="${title}"></div>
            </div>
        `;
    }

    function buildYusanLpgMemoBox(memoKey = '', options = {}) {
        const key = String(memoKey || '').trim();
        const defaultTeam = String(options.defaultTeam || '').trim();
        const defaultMetric = String(options.defaultMetric || '').trim();
        const memoAttrs = key
            ? ` data-report-memo-key="${key}" data-report-memo-default-team="${defaultTeam}" data-report-memo-default-metric="${defaultMetric}" role="button" tabindex="-1"`
            : '';
        return `
            <div class="report-auto-memo-box report-yusan-lpg-memo"${memoAttrs}>
                <strong>특이사항</strong>
                <div class="report-auto-memo-blank report-auto-memo-content" data-report-memo-content="${key}"></div>
            </div>
        `;
    }

    function buildBukjeongUtilityAnalysisSlide() {
        return buildUtilityAutoAnalysisSlide({
            pageIndex: 3,
            pageNumber: '3/9',
            analysisKey: 'bukjeong-utility',
            sectionKey: 'slide3Section',
            titleKey: 'slide3Title',
            scopeLabel: '북 정',
            gasChartTitle: '북 정 LNG (m³) / 생산량(kg)',
            electricChartTitle: '북 정 전기 (kWh) / 생산량(kg)'
        });
    }

    function buildYusanUtilityAnalysisSlide() {
        return buildUtilityAutoAnalysisSlide({
            pageIndex: 4,
            pageNumber: '4/9',
            analysisKey: 'yusan-utility',
            sectionKey: 'slide4Section',
            titleKey: 'slide4Title',
            scopeLabel: '유 산',
            gasChartTitle: '유 산 LNG (m³) / 생산량(kg)',
            electricChartTitle: '유 산 전기 (kWh) / 생산량(kg)'
        });
    }

    function buildUtilityAutoAnalysisSlide(config = {}) {
        const defaultTeam = config.analysisKey === 'bukjeong-utility' ? 'team_01_01' : 'team_01_02';
        return `
            <article class="report-slide report-template-slide report-bukjeong-analysis-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-auto-analysis="${config.analysisKey}">
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-bukjeong-analysis-grid">
                    <div class="report-bukjeong-analysis-column">
                        ${buildBukjeongAutoMetricTable('gas', '가스<br><span>(LNG)</span>', '사용량<br>(m³)', config.scopeLabel)}
                        ${buildBukjeongAutoChart('gas', config.gasChartTitle, config.analysisKey)}
                        ${buildBukjeongAutoMemo(`slide${config.pageIndex}GasMemo`, { defaultTeam, defaultMetric: 'lng' })}
                    </div>
                    <div class="report-bukjeong-analysis-column">
                        ${buildBukjeongAutoMetricTable('electric', '전기<br><span>(kWh)</span>', '사용량<br>(kWh)', config.scopeLabel)}
                        ${buildBukjeongAutoChart('electric', config.electricChartTitle, config.analysisKey)}
                        ${buildBukjeongAutoMemo(`slide${config.pageIndex}ElectricMemo`, { defaultTeam, defaultMetric: 'electric' })}
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>${config.pageNumber}</div>
            </article>
        `;
    }

    function buildWasteSlide(index, sectionKey, titleKey, tableTitle) {
        if (Number(index) === 6) {
            return buildWasteAutoAnalysisSlide({
                pageIndex: 6,
                pageNumber: '6/9',
                analysisKey: 'bukjeong-waste',
                sectionKey,
                titleKey,
                scopeLabel: '북정',
                chartTitle: '북정 폐수 (m³) / 톤'
            });
        }
        if (Number(index) === 7) {
            return buildWasteAutoAnalysisSlide({
                pageIndex: 7,
                pageNumber: '7/9',
                analysisKey: 'yusan-waste',
                sectionKey,
                titleKey,
                scopeLabel: '유산',
                chartTitle: '유산 폐수 (m³) / 톤'
            });
        }
        return `
            <article class="report-slide report-template-slide" data-report-slide-page="${index}" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}">
                ${buildSlideHeader(sectionKey, titleKey)}
                <div class="report-waste-grid">
                    <div class="report-waste-table">${buildMetricTable(tableTitle, 10, 6)}</div>
                    ${buildChartBox()}
                    <div class="report-waste-memo">${buildMemoBox()}</div>
                </div>
            </article>
        `;
    }

    function buildWasteAutoMetricTable(scopeLabel = '') {
        const costRows = [
            { key: 'water', label: '1. 상수' },
            { key: 'share', label: '2. 폐수' },
            { key: 'sludge', label: '3. 폐수<br>오니' },
            { key: 'resin', label: '4. 폐합성<br>수지' },
            { key: 'labor', label: '5. 인건비' }
        ].map((row, index) => `
            <tr>
                ${index === 0 ? '<th class="report-waste-auto-group" rowspan="5">처리 비용<br><span>(원)</span></th>' : ''}
                <th class="report-waste-auto-row-label">${row.label}</th>
                <td data-report-waste-auto-value="${row.key}.reference"></td>
                <td data-report-waste-auto-value="${row.key}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="${row.key}.yoy"></td>
                <td data-report-waste-auto-value="${row.key}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="${row.key}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-waste-auto-table" data-report-waste-auto-table>
                <tbody>
                    <tr>
                        <th class="report-waste-auto-group" rowspan="4">폐수</th>
                        <th class="report-waste-auto-row-label">${scopeLabel}</th>
                        <th data-report-waste-auto-month-label="reference"></th>
                        <th data-report-waste-auto-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-waste-auto-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    <tr>
                        <th class="report-waste-auto-row-label">생산량 (kg)</th>
                        <td data-report-waste-auto-value="production.reference"></td>
                        <td data-report-waste-auto-value="production.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="production.yoy"></td>
                        <td data-report-waste-auto-value="production.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="production.mom"></td>
                    </tr>
                    <tr>
                        <th class="report-waste-auto-row-label">방류량 (m³)</th>
                        <td data-report-waste-auto-value="usage.reference"></td>
                        <td data-report-waste-auto-value="usage.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="usage.yoy"></td>
                        <td data-report-waste-auto-value="usage.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="usage.mom"></td>
                    </tr>
                    <tr class="report-waste-auto-unit-row">
                        <th class="report-waste-auto-row-label">&#50896;&#45800;&#50948;</th>
                        <td data-report-waste-auto-value="unit.reference"></td>
                        <td data-report-waste-auto-value="unit.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="unit.yoy"></td>
                        <td data-report-waste-auto-value="unit.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="unit.mom"></td>
                    </tr>
                    ${costRows}
                    <tr>
                        <th class="report-waste-auto-total-label" colspan="2">총 계</th>
                        <td data-report-waste-auto-value="total.reference"></td>
                        <td data-report-waste-auto-value="total.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="total.yoy"></td>
                        <td data-report-waste-auto-value="total.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="total.mom"></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildWasteAutoAnalysisSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-waste-auto-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-auto-analysis="${config.analysisKey}">
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-waste-auto-layout">
                    <div class="report-waste-auto-table-wrap">${buildWasteAutoMetricTable(config.scopeLabel)}</div>
                    <div class="report-auto-chart report-waste-auto-chart" data-report-waste-auto-chart>
                        <div class="report-auto-chart-title">${config.chartTitle}</div>
                        ${buildReportChartHighlightControls(`auto:${config.analysisKey}:waste`, 'waste')}
                        <div class="report-auto-chart-plot" data-report-waste-auto-chart-plot aria-label="${config.chartTitle}"></div>
                    </div>
                    <div class="report-waste-auto-memo" data-report-memo-key="slide${config.pageIndex}WasteMemo" data-report-memo-default-team="${config.analysisKey === 'bukjeong-waste' ? 'team_01_01' : 'team_01_02'}" data-report-memo-default-metric="waste_usage" role="button" tabindex="-1">
                        <strong>특이사항</strong>
                        <div class="report-auto-memo-blank report-auto-memo-content" data-report-memo-content="slide${config.pageIndex}WasteMemo"></div>
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>${config.pageNumber}</div>
            </article>
        `;
    }

    function buildReportMemoDialog() {
        return `
            <div class="report-memo-dialog" data-report-memo-dialog hidden>
                <div class="report-memo-dialog-head">
                    <strong>특이사항 선택</strong>
                    <button type="button" data-report-memo-close>닫기</button>
                </div>
                <div class="report-memo-controls">
                    <label>
                        <span>팀</span>
                        <select data-report-memo-team>
                            <option value="team_01_01">1팀 1파트</option>
                            <option value="team_01_02">1팀 2파트</option>
                            <option value="team_02">2팀</option>
                            <option value="team_03">3팀</option>
                        </select>
                    </label>
                    <label>
                        <span>항목</span>
                        <select data-report-memo-metric>
                            <option value="production">생산량</option>
                            <option value="electric">전력량</option>
                            <option value="lng">LNG</option>
                        </select>
                    </label>
                </div>
                <div class="report-memo-lines" data-report-memo-lines></div>
                <div class="report-memo-manual" data-report-memo-manual>
                    <textarea data-report-memo-manual-input rows="2" placeholder="&#53945;&#51060;&#49324;&#54637; &#51649;&#51217; &#51077;&#47141;"></textarea>
                    <button type="button" data-report-memo-manual-add>&#51649;&#51217; &#52628;&#44032;</button>
                </div>
                <div class="report-memo-candidates" data-report-memo-candidates></div>
                <div class="report-memo-dialog-actions">
                    <button type="button" data-report-memo-clear>내용 비우기</button>
                </div>
            </div>
        `;
    }

    function buildReportMemoOverviewDialog() {
        return `
            <div class="report-memo-overview-dialog" data-report-memo-overview-dialog hidden role="dialog" aria-modal="true" aria-label="특이사항 전체 확인">
                <div class="report-memo-overview-panel">
                    <div class="report-memo-overview-head">
                        <strong>특이사항 전체 확인</strong>
                        <button type="button" data-report-memo-overview-close aria-label="닫기">닫기</button>
                    </div>
                    <div class="report-memo-overview-body" data-report-memo-overview-list>
                        <div class="report-memo-overview-empty">특이사항 항목을 불러오는 중입니다.</div>
                    </div>
                </div>
            </div>
        `;
    }

    function getProductionStartRowKey(label = '') {
        const value = String(label || '').trim().toLowerCase();
        if (value === 'sd') return 'sd';
        if (value === 'msd') return 'msd';
        if (value === 'ica') return 'ica';
        return '';
    }

    function normalizeProductionStartRows(rows = []) {
        return (Array.isArray(rows) && rows.length ? rows : [{ key: '', label: '' }]).map((row, index, list) => {
            if (row && typeof row === 'object') {
                const label = String(row.label || '').trim();
                return {
                    key: String(row.key || (row.isTotal === true || index === list.length - 1 ? 'total' : getProductionStartRowKey(label))).trim(),
                    label,
                    isTotal: row.isTotal === true || index === list.length - 1
                };
            }
            const rowKey = index === list.length - 1
                ? 'total'
                : (getProductionStartRowKey(row) || (index === 1 && String(list[0] || '').trim().toLowerCase() === 'ica' ? 'jidae' : ''));
            return {
                key: rowKey,
                label: String(row || '').trim(),
                isTotal: index === list.length - 1
            };
        });
    }

    function buildProductionStartValueAttr(analysisKey = '', partKey = '', rowKey = '', metricKey = '') {
        return analysisKey && partKey && rowKey && metricKey
            ? ` data-report-production-start-value="${partKey}.${rowKey}.${metricKey}"`
            : '';
    }

    function buildProductionStartCauseAttr(analysisKey = '', partKey = '', rowKey = '', metricKey = '') {
        return analysisKey && partKey && rowKey && metricKey
            ? ` data-report-production-start-cause="${partKey}.${rowKey}.${metricKey}"`
            : '';
    }

    function buildProductionStartSummaryTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const normalizedRows = normalizeProductionStartRows(config.rows || []);
        const bodyRows = normalizedRows.map((row, index) => `
            <tr${row.isTotal ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-start-part" rowspan="${normalizedRows.length}">${partLabel}</th>` : ''}
                <th>${row.label}</th>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'current')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'previous')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'momIndex')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'reference')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'yoyIndex')}></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-start-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적<br>(TON)</th>
                        <th>전월실적<br>(TON)</th>
                        <th>전월대비(%)</th>
                        <th>전년동기<br>(TON)</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionStartCauseTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const normalizedRows = normalizeProductionStartRows(config.rows || []);
        const bodyRows = normalizedRows.map((row, index) => `
            <tr>
                ${index === 0 ? `<th class="report-production-start-part" rowspan="${normalizedRows.length}">${partLabel}</th>` : ''}
                <th>${row.label}</th>
                <td${buildProductionStartCauseAttr(analysisKey, partKey, row.key, 'yoyRate')}></td>
                <td${buildProductionStartCauseAttr(analysisKey, partKey, row.key, 'reason')}></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-start-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-part">
                    <col class="report-production-cause-col-item">
                    <col class="report-production-cause-col-rate">
                    <col class="report-production-cause-col-reason">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>설비별</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionStartChart(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const chartKey = analysisKey && partKey ? `production-start:${analysisKey}:${partKey}` : '';
        return `
            <div class="report-production-start-chart" aria-label="${partLabel} 생산량 현황 그래프">
                <div class="report-production-start-unit">단위: 톤</div>
                ${buildReportChartHighlightControls(chartKey, partKey)}
                <div class="report-production-start-chart-plot"${partKey ? ` data-report-production-start-chart-plot="${partKey}"` : ''} aria-label="${partLabel} ?앹궛???꾪솴">
                    <div class="report-production-start-chart-grid"></div>
                <div class="report-production-start-chart-axis is-y"></div>
                <div class="report-production-start-chart-axis is-x"></div>
                <div class="report-production-start-chart-legend">
                    <span><i class="is-blue"></i>전년</span>
                    <span><i class="is-red"></i>금년</span>
                </div>
                </div>
            </div>
        `;
    }

    function buildProductionStartColumn(config = {}) {
        const captionAttrs = config.analysisKey && config.partKey
            ? ` data-report-production-start-caption="${config.partKey}" data-report-production-start-caption-default="${config.caption || ''}"`
            : '';
        return `
            <div class="report-production-start-column">
                <div class="report-production-start-caption"${captionAttrs}>${config.caption || ''}<span></span></div>
                ${buildProductionStartSummaryTable(config)}
                <div class="report-production-start-subcaption">*전년대비 증감 요인</div>
                ${buildProductionStartCauseTable(config)}
                <div class="report-production-start-chart-title">*${config.partLabel || ''} 생산량 현황</div>
                ${buildProductionStartChart(config)}
            </div>
        `;
    }

    function buildProductionStartSlide(config = {}) {
        const analysisAttr = config.productionStartKey ? ` data-report-production-start-analysis="${config.productionStartKey}"` : '';
        return `
            <article class="report-slide report-template-slide report-production-start-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산실적(생산량)">
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-start-layout"${analysisAttr}>
                    ${buildProductionStartColumn({ analysisKey: config.productionStartKey || '', partKey: 'part1',
                        caption: '1) 1파트 생산량 :',
                        partLabel: '1파트',
                        rows: ['SD', 'MSD', '합계']
                    })}
                    ${buildProductionStartColumn({ analysisKey: config.productionStartKey || '', partKey: 'part2',
                        caption: '2) 2파트 생산량 :',
                        partLabel: '2파트',
                        rows: ['ICA', '지대', '합계']
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>3/6</div>
            </article>
        `;
    }

    function buildProductionLaborSummaryTable(partLabel, unitLabel, rows = []) {
        const normalizedRows = rows.length ? rows : [''];
        const bodyRows = normalizedRows.map((rowLabel, index) => `
            <tr${index === normalizedRows.length - 1 && normalizedRows.length > 1 ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-labor-part" rowspan="${normalizedRows.length}">${partLabel}<br><span>(${unitLabel})</span></th>` : ''}
                <th>${rowLabel}</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-labor-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionLaborCauseTable(rows = []) {
        const normalizedRows = rows.length ? rows : [''];
        const bodyRows = normalizedRows.map(rowLabel => `
            <tr>
                <th>${rowLabel}</th>
                <td></td>
                <td></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-labor-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionLaborChart(partLabel, variant = 'line-bar') {
        return `
            <div class="report-production-labor-chart is-${variant}" aria-label="${partLabel} 노동생산성 및 인원현황 그래프">
                <div class="report-production-labor-unit">단위: kg/M.hr</div>
                <div class="report-production-labor-chart-grid"></div>
                <div class="report-production-labor-chart-axis is-y"></div>
                <div class="report-production-labor-chart-axis is-x"></div>
                <div class="report-production-labor-chart-legend">
                    <span><i class="is-blue"></i>노동생산성</span>
                    <span><i class="is-orange"></i>인원</span>
                </div>
            </div>
        `;
    }

    function buildProductionLaborColumn(config = {}) {
        return `
            <div class="report-production-labor-column">
                <div class="report-production-labor-caption">${config.caption || ''}<span></span></div>
                ${buildProductionLaborSummaryTable(config.partLabel || '', config.unitLabel || 'kg/M.hr', config.summaryRows || [])}
                <div class="report-production-labor-subcaption">*전년대비 증감 요인</div>
                ${buildProductionLaborCauseTable(config.causeRows || config.summaryRows || [])}
                <div class="report-production-labor-chart-title">*${config.partLabel || ''} 노동생산성 및 인원현황</div>
                ${buildProductionLaborChart(config.partLabel || '', config.chartVariant || 'line-bar')}
            </div>
        `;
    }

    function buildProductionLaborSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-production-labor-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-1 노동생산성">
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-labor-layout">
                    ${buildProductionLaborColumn({
                        caption: '1) 1파트 노동생산성(kg/M.hr):',
                        partLabel: '1파트',
                        summaryRows: ['SD', 'MSD', '합계'],
                        causeRows: ['SD', 'MSD'],
                        chartVariant: 'multi-line'
                    })}
                    ${buildProductionLaborColumn({
                        caption: '2) 2파트 노동생산성(kg/M.hr):',
                        partLabel: '2파트',
                        summaryRows: ['SD'],
                        causeRows: ['SD'],
                        chartVariant: 'line-bar'
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>4/6</div>
            </article>
        `;
    }

    function buildProductionDirectLaborSummaryTable(partLabel) {
        return `
            <table class="report-production-labor-summary-table report-production-direct-summary-table">
                <colgroup>
                    <col class="report-production-direct-col-label">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-rate">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>${partLabel}<br><span>(직접노무비/kg)</span></th>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildProductionDirectLaborCauseTable(partLabel) {
        return `
            <table class="report-production-labor-cause-table report-production-direct-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>${partLabel}</th>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildProductionDirectLaborColumn(config = {}) {
        return `
            <div class="report-production-labor-column report-production-direct-column">
                <div class="report-production-labor-caption">${config.caption || ''}<span></span></div>
                ${buildProductionDirectLaborSummaryTable(config.partLabel || '')}
                <div class="report-production-labor-subcaption">* 전년대비 증감 요인</div>
                ${buildProductionDirectLaborCauseTable(config.partLabel || '')}
                <div class="report-production-labor-chart-title">*${config.partLabel || ''} 직접노무비/kg 및 인원현황</div>
                ${buildProductionLaborChart(config.partLabel || '', 'line-bar')}
            </div>
        `;
    }

    function buildProductionDirectLaborSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-production-labor-slide report-production-direct-labor-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-1 노동생산성 직접노무비/kg">
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-labor-layout">
                    ${buildProductionDirectLaborColumn({
                        caption: '3) 1파트 노동생산성(직접노무비/kg) :',
                        partLabel: '1파트'
                    })}
                    ${buildProductionDirectLaborColumn({
                        caption: '4) 2파트 노동생산성 (직접노무비/kg) :',
                        partLabel: '2파트'
                    })}
                </div>
                <div class="report-production-direct-note">※ 직접노무비/kg 상승요인은 추후 연동 데이터 기준으로 산출</div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>5/6</div>
            </article>
        `;
    }

    function buildProductionYieldSummaryTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const normalizedRows = (Array.isArray(config.rows) && config.rows.length ? config.rows : [{ key: 'total', label: '' }])
            .map((row, index, list) => (typeof row === 'string'
                ? { key: index === list.length - 1 && list.length > 1 ? 'total' : `row${index + 1}`, label: row }
                : { key: String(row?.key || `row${index + 1}`).trim(), label: row?.label || '' }));
        const bodyRows = normalizedRows.map((row, index) => {
            const rowKey = row.key || `row${index + 1}`;
            return `
            <tr${rowKey === 'total' || (index === normalizedRows.length - 1 && normalizedRows.length > 1) ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-yield-part" rowspan="${normalizedRows.length}">${partLabel}<br><span>(%)</span></th>` : ''}
                <th>${row.label || ''}</th>
                <td data-report-production-yield-value="${partKey}.${rowKey}.current"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.previous"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.momIndex"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.reference"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.yoyIndex"></td>
            </tr>
        `;
        }).join('');
        return `
            <table class="report-production-yield-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionYieldCauseTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const causeRows = (Array.isArray(config.causeRows) && config.causeRows.length ? config.causeRows : [{ key: 'total', label: partLabel }])
            .map((row, index) => ({ key: String(row?.key || `row${index + 1}`).trim(), label: row?.label || partLabel }));
        const compact = causeRows.length === 1 && causeRows[0].key === 'total';
        const colgroup = compact
            ? `
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
            `
            : `
                    <col class="report-production-cause-col-part">
                    <col class="report-production-cause-col-item">
                    <col class="report-production-cause-col-rate">
                    <col class="report-production-cause-col-reason">
            `;
        const header = compact
            ? '<th>구분</th><th>증감률</th><th>증감요인</th>'
            : '<th>구분</th><th>설비별</th><th>증감률</th><th>증감요인</th>';
        const bodyRows = compact ? causeRows.map(row => `
                    <tr>
                        <th>${partLabel}</th>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.yoyDelta"></td>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.reason"></td>
                    </tr>
        `).join('') : causeRows.map((row, index) => `
                    <tr>
                        ${index === 0 ? `<th class="report-production-yield-part" rowspan="${causeRows.length}">${partLabel}</th>` : ''}
                        <th>${row.label || ''}</th>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.yoyDelta"></td>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.reason"></td>
                    </tr>
        `).join('');
        return `
            <table class="report-production-yield-cause-table">
                <colgroup>
${colgroup}
                </colgroup>
                <thead>
                    <tr>
                        ${header}
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionYieldChart(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const variant = config.chartVariant || 'dual-line';
        const analysisKey = String(config.analysisKey || '').trim();
        const chartKey = analysisKey && partKey ? `production-yield:${analysisKey}:${partKey}` : '';
        return `
            <div class="report-production-yield-chart is-${variant}" aria-label="${partLabel} 수율 현황 그래프">
                ${buildReportChartHighlightControls(chartKey, partKey)}
                <div class="report-production-yield-unit">단위: %</div>
                <div class="report-production-yield-chart-grid"></div>
                <div class="report-production-yield-chart-axis is-y"></div>
                <div class="report-production-yield-chart-axis is-x"></div>
                <div class="report-production-yield-chart-plot" data-report-production-yield-chart-plot="${partKey}" aria-label="${partLabel} 수율 현황"></div>
                <div class="report-production-yield-chart-legend">
                    <span><i class="is-blue"></i>전년</span>
                    <span><i class="is-red"></i>금년</span>
                    <span><i class="is-green"></i>수율</span>
                </div>
            </div>
        `;
    }

    function buildProductionYieldColumn(config = {}) {
        const partKey = String(config.partKey || '').trim();
        return `
            <div class="report-production-yield-column">
                <div class="report-production-yield-caption" data-report-production-yield-caption="${partKey}" data-report-production-yield-caption-default="${config.caption || ''}">${config.caption || ''}</div>
                ${buildProductionYieldSummaryTable(config)}
                <div class="report-production-yield-subcaption">* 전년대비 증감 요인</div>
                ${buildProductionYieldCauseTable(config)}
                <div class="report-production-yield-chart-title">*${config.partLabel || ''} 수율 현황</div>
                ${buildProductionYieldChart(config)}
            </div>
        `;
    }

    function buildProductionYieldSlide(config = {}) {
        const analysisKey = String(config.productionYieldKey || config.productionStartKey || '').trim();
        const analysisAttr = analysisKey ? ` data-report-production-yield-analysis="${analysisKey}"` : '';
        return `
            <article class="report-slide report-template-slide report-production-yield-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-2 수율"${analysisAttr}>
                ${buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-yield-layout">
                    ${buildProductionYieldColumn({
                        caption: '1) 1파트 수율 :',
                        analysisKey,
                        partKey: 'part1',
                        partLabel: '1파트',
                        rows: [
                            { key: 'sd', label: 'SD' },
                            { key: 'msd', label: 'MSD' },
                            { key: 'total', label: '합계' }
                        ],
                        causeRows: [
                            { key: 'sd', label: 'SD' },
                            { key: 'msd', label: 'MSD' }
                        ],
                        chartVariant: 'dual-line'
                    })}
                    ${buildProductionYieldColumn({
                        caption: '2) 2파트 수율 :',
                        analysisKey,
                        partKey: 'part2',
                        partLabel: '2파트',
                        rows: [{ key: 'total', label: '2파트 수율(%)' }],
                        causeRows: [{ key: 'total', label: '2파트' }],
                        chartVariant: 'single-line'
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>6/6</div>
            </article>
        `;
    }

    function buildWorkTable(rowCount, photoCount) {
        const rows = Array.from({ length: rowCount }, (_, rowIndex) => `
            <tr>
                <td class="report-number-cell">${rowIndex + 1}</td>
                <td>${buildPhotoPlaceholder()}</td>
                <td>${buildPhotoPlaceholder()}</td>
                <td>
                    <span class="report-skeleton-line is-long"></span>
                    <span class="report-skeleton-line is-mid"></span>
                    <span class="report-skeleton-line"></span>
                </td>
            </tr>
        `).join('');
        const extras = Array.from({ length: photoCount }, buildPhotoPlaceholder).join('');
        return `
            <div class="report-work-layout">
                <table class="report-work-table">
                    <thead><tr><th>순번</th><th>전</th><th>후</th><th>개요</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="report-floating-photos">${extras}</div>
            </div>
        `;
    }

    function buildCoverSlide(options = {}) {
        const view = options.view || REPORT_HQ_VIEW;
        const pageIndex = Number.isInteger(options.pageIndex) ? options.pageIndex : 0;
        const label = String(options.label || '표지');
        const activeClass = options.active === false ? '' : ' is-active';
        const departmentText = String(options.departmentText || '생산본부');
        const department = options.departmentField === false
            ? `<div class="report-slide-department" contenteditable="false" spellcheck="false">${departmentText}</div>`
            : `<div class="report-slide-department" contenteditable="false" data-report-field="department" spellcheck="false">${departmentText}</div>`;
        return `
            <article class="report-slide${activeClass}" data-report-slide-page="${pageIndex}" data-report-slide-view="${view}" data-report-slide-label="${label}">
                <img class="report-slide-logo is-top" src="shared-assets/logo.jpg" alt="HEE CHANG">
                <div class="report-slide-main">
                    <div class="report-slide-heading" contenteditable="false" data-report-field="title" spellcheck="false">월 실적 보고</div>
                    <div class="report-slide-date-wrap">
                        <div class="report-slide-date" contenteditable="false" data-report-field="reportDate" spellcheck="false">2026.05.15</div>
                        <input class="report-slide-date-input" type="date" data-report-date-input disabled>
                    </div>
                    ${department}
                    <table class="report-approval" aria-label="결재란">
                        <thead>
                            <tr>
                                <th scope="col">작성</th>
                                <th scope="col" colspan="3">검토</th>
                                <th scope="col">승인</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td contenteditable="false" data-report-field="preparedBy" spellcheck="false"></td>
                                <td contenteditable="false" data-report-field="reviewedBy1" spellcheck="false"></td>
                                <td contenteditable="false" data-report-field="reviewedBy2" spellcheck="false"></td>
                                <td contenteditable="false" data-report-field="reviewedBy3" spellcheck="false"></td>
                                <td contenteditable="false" data-report-field="approvedBy" spellcheck="false"></td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr><td></td><td></td><td></td><td></td><td></td></tr>
                        </tfoot>
                    </table>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
            </article>
        `;
    }

    function buildPublicWorksCoverSlide() {
        return buildCoverSlide({
            active: false,
            view: REPORT_PUBLIC_WORKS_VIEW,
            pageIndex: 2,
            label: '표지',
            departmentText: '공무환경팀',
            departmentField: false
        });
    }

    function buildTeamCoverSlide(config = {}) {
        return buildCoverSlide({
            active: false,
            view: config.view,
            pageIndex: 2,
            label: '표지',
            departmentText: config.departmentText || '',
            departmentField: false
        });
    }

    function buildEditableReportText(fieldKey, fallback = '') {
        const key = String(fieldKey || '').trim();
        return key
            ? `<span data-report-field="${key}" contenteditable="false" spellcheck="false">${fallback}</span>`
            : fallback;
    }

    function buildReportTextRef(fieldKey, fallback = '') {
        const key = String(fieldKey || '').trim();
        return key
            ? `<span data-report-field-ref="${key}">${fallback}</span>`
            : fallback;
    }

    function buildContentsTextItem(item, options = {}) {
        if (typeof item === 'string') return item;
        const fallback = String(item?.text || item?.title || '');
        const text = options.ref === true || item?.ref === true
            ? buildReportTextRef(item?.fieldKey, fallback)
            : buildEditableReportText(item?.fieldKey, fallback);
        return item?.nextMonth === true
            ? `<span data-report-next-month-label>5월</span> ${text}`
            : text;
    }

    function buildContentsListItemContent(item, options = {}) {
        const content = typeof item === 'string' ? item : buildContentsTextItem(item, options);
        const lines = item && typeof item === 'object' && Array.isArray(item.lines)
            ? `<span class="report-contents-subitems">${item.lines.map(line => buildContentsTextItem(line, { ref: options.ref === true || item.ref === true })).join('<br>')}</span>`
            : '';
        return `<span class="report-contents-item-text">${content}${lines}</span>`;
    }

    function buildContentsListItems(items = []) {
        return items.map(item => (
            `<li${item?.optionalPage ? ` data-report-optional-content="${item.optionalPage}" hidden` : ''}>${buildContentsListItemContent(item)}</li>`
        )).join('');
    }

    function buildTeamContentsSlide(config = {}) {
        const items = Array.isArray(config.items) ? config.items : [];
        const titleKey = String(config.titleKey || '').trim();
        const titleMarkup = titleKey
            ? `<div class="report-contents-title" data-report-field="${titleKey}" contenteditable="false" spellcheck="false">Contents</div>`
            : '<div class="report-contents-title">Contents</div>';
        return `
            <article class="report-slide report-contents-slide" data-report-slide-page="3" data-report-slide-view="${config.view}" data-report-slide-label="목차">
                <img class="report-slide-logo is-top" src="shared-assets/logo.jpg" alt="HEE CHANG">
                ${titleMarkup}
                <ol class="report-contents-list">
                    ${buildContentsListItems(items)}
                </ol>
            </article>
        `;
    }

    function buildProductionContentsColumn(title, items, options = {}) {
        const pageRangeView = String(options.pageRangeView || options.jumpView || '').trim();
        const pageRange = String(options.pageRange || '').trim();
        const pageRangeMarkup = pageRangeView
            ? `<span class="report-production-contents-pages" data-report-contents-page-range="${pageRangeView}" aria-label="${title} 페이지">${pageRange}</span>`
            : '';
        const content = `
            <h2><span>${title}</span>${pageRangeMarkup}</h2>
            <ol>
                ${items.map(item => (
                    `<li>${buildContentsListItemContent(item, { ref: true })}</li>`
                )).join('')}
            </ol>
        `;
        if (options.jumpTarget !== undefined || options.jumpView) {
            const jumpSlide = options.jumpTarget === undefined ? 0 : options.jumpTarget;
            const jumpView = options.jumpView ? ` data-report-jump-view="${options.jumpView}"` : '';
            return `
                <button type="button" class="report-production-contents-team is-clickable" data-report-jump-slide="${jumpSlide}"${jumpView} aria-label="${title} 보고서로 이동">
                    ${content}
                </button>
            `;
        }
        return `<div class="report-production-contents-team">${content}</div>`;
    }

    function buildProductionContentsSlide() {
        const teams = [
            {
                title: 'Ⅰ. 생산1팀',
                jumpTarget: 0,
                jumpView: REPORT_PRODUCTION_TEAM1_VIEW,
                pageRange: '3-8',
                items: [
                    '표지',
                    '목차',
                    { fieldKey: 'productionTeam1ContentsItem1', text: '생산실적(생산량)', ref: true },
                    {
                        text: '생산지표',
                        ref: true,
                        lines: [
                            { fieldKey: 'productionTeam1ContentsItem2', text: '2-1 노동생산성' },
                            { fieldKey: 'productionTeam1ContentsItem3', text: '2-1 직접노무비/kg' },
                            { fieldKey: 'productionTeam1ContentsItem4', text: '2-2 수율' }
                        ]
                    }
                ]
            },
            {
                title: 'Ⅱ. 생산 2팀',
                jumpTarget: 0,
                jumpView: REPORT_PRODUCTION_TEAM2_VIEW,
                pageRange: '9-14',
                items: [
                    '표지',
                    '목차',
                    { fieldKey: 'productionTeam2ContentsItem1', text: '생산실적(생산량)', ref: true },
                    {
                        text: '생산지표',
                        ref: true,
                        lines: [
                            { fieldKey: 'productionTeam2ContentsItem2', text: '2-1 노동생산성' },
                            { fieldKey: 'productionTeam2ContentsItem3', text: '2-1 직접노무비/kg' },
                            { fieldKey: 'productionTeam2ContentsItem4', text: '2-2 수율' }
                        ]
                    }
                ]
            },
            {
                title: 'Ⅲ. 생산 3팀',
                jumpTarget: 0,
                jumpView: REPORT_PRODUCTION_TEAM3_VIEW,
                pageRange: '15-20',
                items: [
                    '표지',
                    '목차',
                    { fieldKey: 'productionTeam3ContentsItem1', text: '생산실적(생산량)', ref: true },
                    {
                        text: '생산지표',
                        ref: true,
                        lines: [
                            { fieldKey: 'productionTeam3ContentsItem2', text: '2-1 노동생산성' },
                            { fieldKey: 'productionTeam3ContentsItem3', text: '2-1 직접노무비/kg' },
                            { fieldKey: 'productionTeam3ContentsItem4', text: '2-2 수율' }
                        ]
                    }
                ]
            },
            {
                title: 'Ⅳ. 공무환경팀',
                jumpTarget: 0,
                jumpView: REPORT_PUBLIC_WORKS_VIEW,
                pageRange: '21-29',
                items: [
                    '표지',
                    '목차',
                    { fieldKey: 'contentsItem1', text: '에너지 실적', ref: true },
                    { fieldKey: 'contentsItem2', text: '폐수처리장 운영실적', ref: true },
                    { fieldKey: 'contentsItem3', text: '공사 및 정비현황', ref: true },
                    { fieldKey: 'contentsItem4', text: '주요계획', nextMonth: true, ref: true }
                ]
            }
        ];
        return `
            <article class="report-slide report-production-contents-slide" data-report-slide-page="1" data-report-slide-view="${REPORT_HQ_VIEW}" data-report-slide-label="본부 목차">
                <img class="report-slide-logo is-top" src="shared-assets/logo.jpg" alt="HEE CHANG">
                <div class="report-production-contents-title">Contents</div>
                <div class="report-production-contents-grid">
                    ${teams.map(team => buildProductionContentsColumn(team.title, team.items, { jumpTarget: team.jumpTarget, jumpView: team.jumpView, pageRange: team.pageRange })).join('')}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
            </article>
        `;
    }

    function buildContentsSlide() {
        return `
            <article class="report-slide report-contents-slide" data-report-slide-page="2" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-slide-label="목차">
                <img class="report-slide-logo is-top" src="shared-assets/logo.jpg" alt="HEE CHANG">
                <div class="report-contents-title" data-report-field="contentsTitle" contenteditable="false" spellcheck="false"></div>
                <ol class="report-contents-list">
                    ${buildContentsListItems([
                        { fieldKey: 'contentsItem1', text: '에너지 실적' },
                        { fieldKey: 'contentsItem2', text: '폐수처리장 운영실적' },
                        { fieldKey: 'contentsItem3', text: '공사 및 정비현황', optionalPage: 'slide8' },
                        { fieldKey: 'contentsItem4', text: '주요계획', nextMonth: true, optionalPage: 'slide9' },
                        { fieldKey: 'contentsItem5', text: '자율 안전 신고제', optionalPage: 'slide10' }
                    ])}
                </ol>
            </article>
        `;
    }

    function buildDeckSlides() {
        return [
            buildCoverSlide(),
            buildProductionContentsSlide(),
            buildTeamCoverSlide({
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                departmentText: '생산1팀'
            }),
            buildTeamContentsSlide({
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                titleKey: 'productionTeam1ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam1ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam1ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam1ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam1ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            buildProductionStartSlide({
                pageIndex: 10,
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                productionStartKey: 'team_01',
                sectionKey: 'productionTeam1StartSection',
                titleKey: 'productionTeam1StartTitle'
            }),
            buildProductionLaborSlide({
                pageIndex: 13,
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                sectionKey: 'productionTeam1LaborSection',
                titleKey: 'productionTeam1LaborTitle'
            }),
            buildProductionDirectLaborSlide({
                pageIndex: 16,
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                sectionKey: 'productionTeam1DirectLaborSection',
                titleKey: 'productionTeam1DirectLaborTitle'
            }),
            buildProductionYieldSlide({
                pageIndex: 19,
                view: REPORT_PRODUCTION_TEAM1_VIEW,
                productionYieldKey: 'team_01',
                sectionKey: 'productionTeam1YieldSection',
                titleKey: 'productionTeam1YieldTitle'
            }),
            buildTeamCoverSlide({
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                departmentText: '생산2팀'
            }),
            buildTeamContentsSlide({
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                titleKey: 'productionTeam2ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam2ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam2ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam2ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam2ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            buildProductionStartSlide({
                pageIndex: 11,
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2StartSection',
                titleKey: 'productionTeam2StartTitle'
            }),
            buildProductionLaborSlide({
                pageIndex: 14,
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2LaborSection',
                titleKey: 'productionTeam2LaborTitle'
            }),
            buildProductionDirectLaborSlide({
                pageIndex: 17,
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2DirectLaborSection',
                titleKey: 'productionTeam2DirectLaborTitle'
            }),
            buildProductionYieldSlide({
                pageIndex: 20,
                view: REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2YieldSection',
                titleKey: 'productionTeam2YieldTitle'
            }),
            buildTeamCoverSlide({
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                departmentText: '생산3팀'
            }),
            buildTeamContentsSlide({
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                titleKey: 'productionTeam3ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam3ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam3ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam3ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam3ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            buildProductionStartSlide({
                pageIndex: 12,
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3StartSection',
                titleKey: 'productionTeam3StartTitle'
            }),
            buildProductionLaborSlide({
                pageIndex: 15,
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3LaborSection',
                titleKey: 'productionTeam3LaborTitle'
            }),
            buildProductionDirectLaborSlide({
                pageIndex: 18,
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3DirectLaborSection',
                titleKey: 'productionTeam3DirectLaborTitle'
            }),
            buildProductionYieldSlide({
                pageIndex: 21,
                view: REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3YieldSection',
                titleKey: 'productionTeam3YieldTitle'
            }),
            buildPublicWorksCoverSlide(),
            buildContentsSlide(),
            buildAnalysisSlide(3, 'slide3Section', 'slide3Title', '가스 (LNG)', '전기'),
            buildAnalysisSlide(4, 'slide4Section', 'slide4Title', '가스 (LNG)', '전기'),
            buildAnalysisSlide(5, 'slide5Section', 'slide5Title', '가스 (LPG)', '비용'),
            buildWasteSlide(6, 'slide6Section', 'slide6Title', '폐수'),
            buildWasteSlide(7, 'slide7Section', 'slide7Title', '폐수'),
            `
                <article class="report-slide report-template-slide" data-report-slide-page="8" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide8" data-report-dynamic-page="0" data-report-optional-page="slide8" data-report-slide-label="공사 및 정비">
                    ${buildSlideHeader('slide8Section', 'slide8Title')}
                    ${buildReportStatusTable(0)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>8/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="-1" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide8" data-report-dynamic-page="1" data-report-optional-page="slide8" data-report-slide-label="공사 및 정비" hidden>
                    ${buildSlideHeader('slide8Section', 'slide8Title')}
                    ${buildReportStatusTable(1)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="9" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide9" data-report-dynamic-page="0" data-report-optional-page="slide9" data-report-slide-label="주요 계획">
                    ${buildSlideHeader('slide9Section', 'slide9Title')}
                    ${buildReportPlanTable('slide9', 0)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="-1" data-report-slide-view="${REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide9" data-report-dynamic-page="1" data-report-optional-page="slide9" data-report-slide-label="주요 계획" hidden>
                    ${buildSlideHeader('slide9Section', 'slide9Title')}
                    ${buildReportPlanTable('slide9', 1)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            ...Array.from({ length: REPORT_SAFETY_PAGE_COUNT }, (_, pageIndex) => buildReportSafetyPage(pageIndex))
        ].join('');
    }

    function buildSlideNav() {
        const viewCounts = {};
        return SLIDE_NAV_ITEMS.map((item, index) => {
            const view = item.view || REPORT_PUBLIC_WORKS_VIEW;
            const viewIndex = viewCounts[view] || 0;
            viewCounts[view] = viewIndex + 1;
            const hidden = view !== REPORT_HQ_VIEW;
            return `
            <button type="button" class="${view === REPORT_HQ_VIEW && viewIndex === 0 ? 'is-active' : ''}" data-report-slide-target="${viewIndex}" data-report-slide-view="${view}" data-report-nav-label="${item.label}"${hidden ? ' hidden' : ''}>
                <span>${String(viewIndex + 1).padStart(2, '0')}</span>
                <strong>${item.label}</strong>
            </button>
        `;
        }).join('');
    }

    function buildReportDeckCoverContent() {
        return `
            <style>
                .report-deck-editor { height: calc(100vh - 126px); min-height: 620px; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 0; color: #0f172a; background: #111827; }
                body.is-report-popup .report-deck-editor { width: 100vw; height: 100vh; min-height: 0; border-radius: 0; padding: 0; }
                .report-deck-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; padding: 4px 8px; border: 0; border-bottom: 1px solid #dbe4f3; border-radius: 0; background: #ffffff; box-shadow: none; }
                .report-deck-title { display: grid; gap: 2px; min-width: 0; }
                .report-deck-title strong { font-size: 0.96rem; font-weight: 900; color: #0f172a; }
                .report-deck-title span { font-size: 0.72rem; font-weight: 800; color: #64748b; }
                .report-deck-actions { display: inline-flex; align-items: center; gap: 6px; flex-wrap: nowrap; justify-content: flex-end; }
                .report-deck-save-message { min-height: 32px; display: inline-flex; align-items: center; color: #166534; font-size: 0.72rem; font-weight: 900; }
                .report-deck-save-message:empty { display: none; }
                .report-deck-save-message[data-state="loading"], .report-deck-save-message[data-state="saving"], .report-deck-save-message[data-state="dirty"] { color: #1d4ed8; }
                .report-deck-save-message[data-state="error"], .report-deck-save-message[data-state="offline"], .report-deck-save-message[data-state="readonly"] { color: #b91c1c; }
                .report-deck-month-field { min-height: 30px; display: inline-flex; align-items: center; gap: 6px; color: #334155; font-size: 0.72rem; font-weight: 900; }
                .report-deck-month-field select { height: 30px; min-width: 112px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #0f172a; padding: 0 24px 0 9px; font-size: 0.74rem; font-weight: 900; }
                .report-deck-month-field select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
                .report-deck-action-button { min-height: 30px; border: 1px solid #bfdbfe; border-radius: 6px; background: #eff6ff; color: #1d4ed8; padding: 0 11px; font-size: 0.74rem; font-weight: 900; cursor: pointer; }
                .report-deck-action-button:disabled { border-color: #cbd5e1; background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
                .report-deck-action-button.is-active { border-color: #2563eb; background: #2563eb; color: #ffffff; }
                .report-deck-workspace { min-height: 0; display: grid; grid-template-columns: 154px minmax(0, 1fr); gap: 0; align-items: stretch; }
                .report-deck-sidebar { min-height: 0; border: 0; border-right: 1px solid #dbe4f3; border-radius: 0; background: #ffffff; padding: 6px; overflow: auto; }
                .report-deck-sidebar strong { display: block; margin-bottom: 5px; font-size: 0.76rem; font-weight: 900; color: #0f172a; }
                .report-slide-nav { display: grid; gap: 4px; }
                .report-slide-nav button { display: grid; grid-template-columns: 26px 1fr; gap: 5px; align-items: center; min-height: 30px; border: 1px solid #e2e8f0; border-radius: 5px; background: #ffffff; color: #334155; padding: 0 6px; text-align: left; cursor: pointer; }
                .report-slide-nav button[hidden] { display: none !important; }
                .report-slide-nav button.is-active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
                .report-slide-nav span { font-size: 0.68rem; font-weight: 900; color: #64748b; }
                .report-slide-nav strong { margin: 0; font-size: 0.72rem; font-weight: 900; }
                .report-deck-back-button { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 30px; margin-top: 6px; border: 1px solid #bfdbfe; border-radius: 5px; background: #eff6ff; color: #1d4ed8; padding: 0 8px; font-size: 0.74rem; font-weight: 900; cursor: pointer; }
                .report-deck-back-button[hidden] { display: none !important; }
                .report-deck-stage { min-width: 0; min-height: 0; display: grid; place-items: center; border: 0; border-radius: 0; background: #111827; padding: 0; overflow: hidden; }
                .report-slide { position: relative; display: none; width: min(100%, calc(177.777vh - 86px)); max-width: none; aspect-ratio: 16 / 9; overflow: hidden; background: #ffffff; border: 0; box-shadow: none; font-family: Arial, "Malgun Gothic", sans-serif; }
                .report-slide[hidden] { display: none !important; }
                .report-slide.is-active { display: block; }
                .report-slide-logo { position: absolute; object-fit: contain; user-select: none; pointer-events: none; }
                .report-slide-logo.is-top { top: 2.7%; right: 1.4%; width: 6.2%; height: 4%; }
                .report-slide-top-brand { position: absolute; top: 2.55%; right: 1.4%; height: 3.7%; max-width: 38%; display: inline-flex; align-items: center; justify-content: flex-end; gap: 7px; z-index: 2; }
                .report-slide-top-brand .report-slide-logo.is-top { position: static; width: 64px; height: 100%; flex: 0 0 64px; }
                .report-slide-top-brand .report-slide-section { position: static; width: auto; max-width: calc(100% - 71px); height: auto; min-height: 0; flex: 0 1 auto; overflow: visible; color: #020617; font-size: 14px; font-weight: 900; line-height: 1; letter-spacing: 0; text-align: right; white-space: nowrap; }
                .report-slide-main { position: absolute; inset: 0; display: grid; justify-items: center; align-content: center; padding: 10% 7% 12%; text-align: center; }
                .report-slide-heading { min-width: 320px; max-width: 74%; outline: 0; color: #020617; font-size: 54px; font-weight: 900; line-height: 1.1; letter-spacing: 0; }
                .report-slide-date-wrap { margin-top: 13%; display: grid; place-items: center; min-height: 38px; }
                .report-slide-date { outline: 0; color: #020617; font-size: 24px; font-weight: 900; line-height: 1.2; letter-spacing: 0; }
                .report-slide-date-input { display: none; width: 190px; height: 38px; border: 1.5px solid #2563eb; border-radius: 6px; background: #ffffff; color: #020617; padding: 0 10px; font-size: 18px; font-weight: 900; text-align: center; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-slide-date { display: none; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-slide-date-input { display: block; }
                .report-slide-department { margin-top: 7%; outline: 0; color: #020617; font-size: 32px; font-weight: 900; line-height: 1.2; letter-spacing: 0; }
                .report-approval { margin-top: 20px; width: 460px; border: 2px solid #111827; border-collapse: collapse; table-layout: fixed; color: #020617; font-size: 14px; font-weight: 900; }
                .report-approval th, .report-approval td { border: 1px solid #111827; height: 52px; padding: 2px 4px; text-align: center; vertical-align: middle; }
                .report-approval thead th { height: 24px; }
                .report-approval tfoot td { height: 20px; }
                .report-slide [data-report-field] { outline: 0; min-height: 1em; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active [data-report-field] { outline: 2px solid rgba(37, 99, 235, 0.28); outline-offset: 3px; }
                .report-slide-footer { position: absolute; left: 0; right: 0; bottom: 0; height: 5.2%; background: linear-gradient(90deg, #07366c 0%, #07366c 40%, #73a900 100%); }
                .report-slide-logo.is-bottom { left: 2.2%; bottom: 0.16%; width: 22%; height: 4.9%; z-index: 2; filter: none; opacity: 0.98; }
                .report-production-contents-title { position: absolute; left: 7.7%; top: 11%; color: #020617; font-size: 62px; font-weight: 900; line-height: 1; letter-spacing: 0; }
                .report-production-contents-grid { position: absolute; left: 5.9%; right: 5.7%; top: 28.2%; bottom: 18.6%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: start; color: #020617; }
                .report-production-contents-team { position: relative; min-width: 0; box-sizing: border-box; align-self: start; display: block; appearance: none; -webkit-appearance: none; border: 0; border-left: 0; background: transparent; padding: 0 28px 0 24px; color: inherit; text-align: left; font: inherit; }
                .report-production-contents-team + .report-production-contents-team { border-left: 3px solid #5b9bd5; }
                .report-production-contents-team.is-clickable { cursor: pointer; }
                .report-production-contents-team.is-clickable:focus-visible { outline: 3px solid #2563eb; outline-offset: 8px; }
                .report-production-contents-team h2 { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 0 0 24px; color: #020617; font-size: 28px; font-weight: 900; line-height: 1.1; letter-spacing: 0; white-space: nowrap; }
                .report-production-contents-pages { flex: 0 0 auto; color: #2f75b5; font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; }
                .report-production-contents-team ol { display: grid; gap: 15px; margin: 0; padding-left: 0; list-style-position: inside; color: #020617; font-size: 21px; font-weight: 500; line-height: 1.18; letter-spacing: 0; }
                .report-production-contents-team li { margin: 0; padding: 0; }
                .report-production-contents-team .report-contents-item-text { display: inline; padding-left: 0; white-space: normal; word-break: keep-all; overflow-wrap: normal; }
                .report-production-contents-team .report-contents-subitems { display: block; padding-left: 27px; }
                .report-production-contents-team [data-report-next-month-label],
                .report-production-contents-team [data-report-field-ref] { display: inline; padding-left: 0; }
                .report-contents-title { position: absolute; left: 5.3%; top: 5.5%; width: 30%; font-size: 62px; font-weight: 900; color: #0f172a; }
                .report-contents-list { position: absolute; left: 5.3%; top: 29.5%; width: 72%; display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; counter-reset: report-contents; color: #111827; font-size: 30px; font-weight: 900; line-height: 1.35; }
                .report-contents-list li { counter-increment: report-contents; display: grid; grid-template-columns: 44px minmax(0, 1fr); align-items: start; min-width: 0; word-break: keep-all; overflow-wrap: normal; }
                .report-contents-list li::before { content: counter(report-contents) "."; grid-column: 1; color: #111827; font: inherit; }
                .report-contents-item-text { grid-column: 2; min-width: 0; white-space: nowrap; }
                .report-contents-subitems { display: block; margin-top: 2px; white-space: normal; }
                .report-template-title { position: absolute; left: 3.4%; top: 2.55%; min-width: 30%; height: 4.4%; color: #020617; font-size: 22px; font-weight: 900; line-height: 1.05; }
                .report-slide-section { position: absolute; right: 5.8%; top: 0.4%; width: 10%; height: 3.6%; color: #020617; font-size: 18px; font-weight: 900; text-align: right; }
                .report-two-column-grid { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; display: grid; grid-template-columns: 1fr 1fr; gap: 5.2%; }
                .report-analysis-column { display: grid; grid-template-rows: var(--report-analysis-table-row, 28%) var(--report-analysis-chart-row, 62%) var(--report-analysis-memo-row, 6%); gap: 2.6%; min-width: 0; }
                .report-bukjeong-analysis-grid { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; display: grid; grid-template-columns: 1fr 1fr; gap: 5.2%; }
                .report-bukjeong-analysis-column { display: grid; grid-template-rows: var(--report-analysis-table-row, 28%) var(--report-analysis-chart-row, 62%) var(--report-analysis-memo-row, 6%); gap: 2.6%; min-width: 0; }
                .report-auto-metric-table { width: 100%; height: 100%; border: 1.4px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; font-size: 12.5px; font-weight: 900; line-height: 1.04; }
                .report-auto-metric-table th, .report-auto-metric-table td { border: 1px solid #111827; padding: 1px 3px; text-align: center; vertical-align: middle; }
                .report-auto-metric-table th { background: #dbe5f1; }
                .report-auto-resource-cell { width: 14%; font-size: 15px; line-height: 1.4; }
                .report-auto-resource-cell span { display: inline-block; font-size: 14px; }
                .report-auto-row-label { width: 14%; font-size: 12.5px; }
                .report-auto-unit-row .report-auto-row-label { font-size: 12px; }
                .report-auto-note-cell { width: 14%; background: #ffffff; }
                .report-auto-delta-cell { color: #2f75b5; white-space: nowrap; }
                .report-auto-compare-cell { font-size: 11.5px; line-height: 1.05; white-space: normal; }
                .report-auto-compare-cell span { display: block; margin-top: 1px; font-size: 10px; line-height: 1; }
                .report-auto-delta-cell.is-delta-up { color: #c00000; }
                .report-auto-delta-cell.is-delta-flat { color: #111827; }
                .report-auto-chart { position: relative; min-height: 0; border: 1.4px solid #111827; background: #ffffff; overflow: hidden; }
                .report-auto-chart-title { position: absolute; left: 6%; right: 6%; top: 3.2%; z-index: 1; text-align: center; color: #020617; font-size: 18px; font-weight: 900; line-height: 1.1; }
                .report-auto-chart-plot { position: absolute; inset: 0; }
                .report-auto-chart-plot svg { display: block; width: 100%; height: 100%; overflow: visible; }
                .report-auto-chart-axis { stroke: #8b8b8b; stroke-width: 1.1; shape-rendering: crispEdges; }
                .report-auto-chart-tick { stroke: #b7b7b7; stroke-width: 0.8; shape-rendering: crispEdges; }
                .report-auto-chart-month { fill: #020617; font-size: 13px; font-weight: 900; }
                .report-auto-chart-label { font-size: 11px; font-weight: 900; paint-order: stroke; stroke: #ffffff; stroke-width: 3px; stroke-linejoin: round; }
                .report-auto-chart-legend { fill: #020617; font-size: 13px; font-weight: 900; }
                .report-auto-chart-empty { fill: #94a3b8; font-size: 15px; font-weight: 900; }
                .report-chart-highlight-controls { position: absolute; right: 6px; top: 5px; z-index: 4; display: none; align-items: center; gap: 4px; }
                .report-chart-highlight-toggle, .report-chart-highlight-reset { position: absolute; right: 6px; top: 5px; z-index: 4; display: none; align-items: center; justify-content: center; height: 24px; min-width: 44px; border: 1px solid #fecaca; border-radius: 5px; background: rgba(255, 255, 255, 0.95); color: #b91c1c; padding: 0 8px; font-size: 11px; font-weight: 900; line-height: 1; cursor: pointer; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease; }
                .report-chart-highlight-controls .report-chart-highlight-toggle, .report-chart-highlight-controls .report-chart-highlight-reset { position: static; display: inline-flex; min-width: 24px; width: 24px; padding: 0; font-size: 14px; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-chart-highlight-controls,
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active > .report-chart-highlight-toggle { display: inline-flex; }
                .report-chart-highlight-toggle.has-highlight { min-width: 56px; border-color: #ef4444; background: #fff1f2; color: #991b1b; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.18); }
                .report-chart-highlight-toggle.is-active { min-width: 62px; border-color: #dc2626; background: #fee2e2; color: #991b1b; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22); }
                .report-chart-highlight-controls .report-chart-highlight-toggle.has-highlight,
                .report-chart-highlight-controls .report-chart-highlight-toggle.is-active { min-width: 24px; }
                .report-chart-highlight-reset { border-color: #d1d5db; color: #374151; background: rgba(255, 255, 255, 0.95); }
                .report-chart-highlight-reset.has-highlight { border-color: #111827; background: #f9fafb; color: #111827; box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.16); }
                .report-chart-highlight-hit { fill: transparent; stroke: transparent; pointer-events: all; cursor: pointer; }
                .report-chart-highlight-hit.is-highlighted { fill: transparent; stroke: #ff0000; stroke-width: 2.8; pointer-events: all; }
                .report-chart-highlight-hit.is-range-start { fill: transparent; stroke: #111827; stroke-width: 2.4; stroke-dasharray: 4 3; pointer-events: all; }
                .report-chart-highlight-range { fill: none; stroke: #111827; stroke-width: 2.4; pointer-events: none; }
                .report-auto-memo-box { display: grid; grid-template-columns: 13.5% 1fr; min-height: 0; border: 1.4px solid #111827; background: #ffffff; color: #020617; }
                .report-auto-memo-box strong { display: grid; place-items: center; border-right: 1px solid #111827; font-size: 15px; font-weight: 900; }
                .report-auto-memo-blank { min-width: 0; }
                .report-auto-memo-content { display: grid; align-content: start; gap: 4px; padding: 5px 8px; overflow: hidden; color: #020617; font-size: 11.2px; font-weight: 900; line-height: 1.2; text-align: left; word-break: keep-all; }
                .report-auto-memo-content[data-empty="true"]::before { content: ""; }
                .report-auto-memo-line { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px; min-width: 0; white-space: nowrap; }
                .report-auto-memo-line-text { min-width: 0; white-space: nowrap; }
                .report-auto-memo-line.is-up, .report-auto-memo-line.is-down { color: #111827; }
                .report-auto-memo-line.is-flat, .report-auto-memo-line.is-mixed { color: #111827; }
                .report-auto-memo-segment { color: #111827; }
                .report-auto-memo-basis { color: #111827; }
                .report-auto-memo-delta { color: #111827; }
                .report-auto-memo-change.is-up { color: #c00000; }
                .report-auto-memo-change.is-down { color: #2f75b5; }
                .report-auto-memo-change.is-flat { color: #111827; }
                .report-auto-memo-add, .report-auto-memo-delete { display: none; align-items: center; justify-content: center; border: 1px solid #2563eb; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 14px; font-weight: 900; line-height: 1; cursor: pointer; }
                .report-auto-memo-add { width: 26px; height: 26px; margin-top: 1px; }
                .report-auto-memo-delete { width: 22px; height: 22px; border-color: #fecaca; background: #fff5f5; color: #b91c1c; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-auto-memo-add,
                .report-deck-editor[data-report-edit-mode="editing"] .report-auto-memo-delete { display: inline-flex; }
                .report-deck-editor[data-report-edit-mode="editing"] [data-report-memo-key] { cursor: pointer; }
                .report-deck-editor[data-report-edit-mode="editing"] [data-report-memo-key]:focus-visible,
                .report-deck-editor[data-report-edit-mode="editing"] [data-report-memo-key]:hover { outline: 2px solid rgba(37, 99, 235, 0.42); outline-offset: 2px; }
                .report-memo-dialog { position: absolute; right: 18px; top: 54px; z-index: 20; width: min(980px, calc(100vw - 36px)); max-height: calc(100vh - 92px); overflow: auto; border: 1px solid #94a3b8; border-radius: 6px; background: #ffffff; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.24); color: #0f172a; padding: 12px; }
                .report-memo-dialog[hidden] { display: none !important; }
                .report-memo-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
                .report-memo-dialog-head strong { color: #0f172a; font-size: 15px; font-weight: 900; }
                .report-memo-dialog button { min-height: 28px; border: 1px solid #cbd5e1; border-radius: 5px; background: #ffffff; color: #334155; padding: 0 9px; font-size: 12px; font-weight: 900; cursor: pointer; }
                .report-memo-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 9px; }
                .report-memo-controls label { display: grid; gap: 4px; color: #334155; font-size: 12px; font-weight: 900; }
                .report-memo-controls select { height: 30px; border: 1px solid #cbd5e1; border-radius: 5px; background: #ffffff; color: #0f172a; padding: 0 8px; font-size: 13px; font-weight: 900; }
                .report-memo-lines { display: grid; gap: 6px; margin-bottom: 10px; min-height: 180px; max-height: 320px; overflow: auto; }
                .report-memo-line-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 8px; border: 1px solid #e2e8f0; border-radius: 5px; background: #ffffff; padding: 6px 7px; }
                .report-memo-line-text { min-width: 0; color: #111827; font-size: 12px; font-weight: 900; line-height: 1.25; overflow-wrap: anywhere; }
                .report-memo-line-input { width: 100%; min-width: 0; min-height: 38px; max-height: 96px; border: 1px solid #dbe4f3; border-radius: 4px; background: #f8fafc; color: #111827; padding: 6px 7px; font-size: 12px; font-weight: 900; line-height: 1.25; resize: vertical; box-sizing: border-box; }
                .report-memo-line-input:focus { outline: 2px solid rgba(37, 99, 235, 0.28); outline-offset: 1px; border-color: #60a5fa; background: #ffffff; }
                .report-memo-line-actions { display: grid; grid-template-columns: repeat(3, auto); gap: 4px; align-items: start; }
                .report-memo-line-actions button { min-width: 28px; min-height: 26px; padding: 0 7px; color: #475569; }
                .report-memo-line-actions button:disabled { opacity: 0.35; cursor: default; }
                .report-memo-lines-empty { min-height: 30px; display: grid; place-items: center; border: 1px dashed #cbd5e1; border-radius: 5px; color: #64748b; font-size: 12px; font-weight: 900; }
                .report-memo-manual { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; align-items: stretch; margin-bottom: 8px; }
                .report-memo-manual textarea { width: 100%; min-width: 0; min-height: 48px; max-height: 92px; border: 1px solid #cbd5e1; border-radius: 5px; background: #ffffff; color: #0f172a; padding: 7px 8px; font-size: 12px; font-weight: 900; line-height: 1.35; resize: vertical; box-sizing: border-box; }
                .report-memo-manual textarea:focus { outline: 2px solid rgba(37, 99, 235, 0.28); outline-offset: 1px; border-color: #60a5fa; }
                .report-memo-manual button { min-width: 72px; }
                .report-memo-candidates { display: grid; gap: 6px; max-height: 220px; overflow: auto; }
                .report-memo-candidate { width: 100%; min-height: 30px !important; display: grid !important; grid-template-columns: 22px minmax(0, 1fr); align-items: center; justify-content: stretch; gap: 6px; border-color: #dbe4f3 !important; background: #f8fafc !important; padding: 4px 8px !important; text-align: left; white-space: nowrap; font-size: 11.2px; line-height: 1.16; color: #111827 !important; }
                .report-memo-candidate-add { display: grid; place-items: center; width: 22px; height: 22px; border: 1px solid #cbd5e1; border-radius: 50%; background: #ffffff; color: #0f172a; font-size: 15px; font-weight: 900; line-height: 1; }
                .report-memo-candidate-text { min-width: 0; color: #111827; white-space: nowrap; }
                .report-memo-candidate.is-up, .report-memo-candidate.is-down { color: #111827 !important; }
                .report-memo-candidate.is-flat, .report-memo-candidate.is-mixed { color: #111827 !important; }
                .report-memo-empty { min-height: 34px; display: grid; place-items: center; border: 1px dashed #cbd5e1; border-radius: 5px; color: #64748b; font-size: 12px; font-weight: 900; }
                .report-memo-dialog-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
                .report-memo-overview-dialog[hidden] { display: none !important; }
                .report-memo-overview-dialog { position: fixed; inset: 0; z-index: 10001; display: grid; place-items: center; background: rgba(15, 23, 42, 0.44); }
                .report-memo-overview-panel { width: min(920px, calc(100vw - 36px)); max-height: calc(100vh - 48px); display: grid; grid-template-rows: auto minmax(0, 1fr); border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28); color: #0f172a; overflow: hidden; }
                .report-memo-overview-head { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px; border-bottom: 1px solid #e2e8f0; }
                .report-memo-overview-head strong { font-size: 16px; font-weight: 900; }
                .report-memo-overview-head button { min-width: 48px; height: 30px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #334155; font-size: 12px; font-weight: 900; cursor: pointer; }
                .report-memo-overview-body { min-height: 0; padding: 12px 14px 14px; overflow: auto; }
                .report-memo-overview-group + .report-memo-overview-group { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
                .report-memo-overview-group-title { margin: 0 0 7px; color: #0f172a; font-size: 13px; font-weight: 900; }
                .report-memo-overview-rows { display: grid; gap: 5px; }
                .report-memo-overview-row { display: grid; grid-template-columns: 84px minmax(0, 1fr); align-items: start; gap: 8px; min-height: 32px; border: 1px solid #e2e8f0; border-radius: 5px; background: #ffffff; padding: 6px 8px; color: #111827; font-size: 12px; font-weight: 900; line-height: 1.28; }
                .report-memo-overview-row-label { color: #475569; white-space: nowrap; }
                .report-memo-overview-row-text { min-width: 0; overflow-wrap: anywhere; }
                .report-memo-overview-empty { min-height: 86px; display: grid; place-items: center; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 13px; font-weight: 900; text-align: center; }
                .report-lpg-trend-note { position: absolute; left: calc(3.4% + ((100% - 3.4% - 2.9% - 5.2%) / 2) + 5.2% - 2px); right: 2.9%; top: 5.3%; height: 2.3%; display: flex; align-items: flex-end; justify-content: flex-start; color: #ff0000; font-size: 20px; font-weight: 900; text-align: left; line-height: 1; }
                .report-yusan-lpg-grid { top: 8.4%; bottom: 8.8%; }
                .report-yusan-lpg-analysis-slide .report-bukjeong-analysis-column { grid-template-rows: var(--report-analysis-table-row, 28%) var(--report-analysis-chart-row, 62%) var(--report-analysis-memo-row, 6%); gap: 2.6%; min-height: 0; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table, .report-yusan-lpg-analysis-slide .report-lpg-chart, .report-yusan-lpg-analysis-slide .report-yusan-lpg-memo { width: 100%; height: 100%; min-width: 0; min-height: 0; align-self: stretch; justify-self: stretch; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table[data-report-yusan-lpg-table="left"] tbody > tr:first-child { height: 14%; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table[data-report-yusan-lpg-table="left"] tbody > tr:not(:first-child) { height: 21.5%; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table[data-report-yusan-lpg-table="right"] tbody > tr:first-child { height: 15.9%; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table[data-report-yusan-lpg-table="right"] tbody > tr:not(:first-child) { height: 28.033333%; }
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table .report-auto-resource-cell,
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table .report-auto-row-label,
                .report-yusan-lpg-analysis-slide .report-yusan-lpg-table .report-auto-note-cell { width: 14%; }
                .report-yusan-lpg-cost-resource small { display: block; margin-top: 3px; color: #020617; font-size: 10px; font-weight: 900; line-height: 1.12; }
                .report-yusan-lpg-ratio-formula { display: block; margin-top: 3px; color: #334155; font-size: 9.5px; font-weight: 900; line-height: 1.12; white-space: normal; }
                .report-yusan-lpg-memo { grid-template-columns: 13.5% 1fr; }
                .report-slide-page-number { position: absolute; right: 1.6%; bottom: 1.2%; z-index: 2; color: #020617; font-size: 16px; font-weight: 500; line-height: 1; }
                .report-template-table { width: 100%; height: 100%; border: 1.4px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; }
                .report-template-table th, .report-template-table td { border: 1px solid #111827; padding: 3px 5px; text-align: center; vertical-align: middle; }
                .report-template-table th { height: 20%; font-size: 14px; font-weight: 900; background: #f8fafc; }
                .report-skeleton-line { display: inline-block; width: 58%; height: 0.58em; border-radius: 999px; background: #e2e8f0; }
                .report-skeleton-line.is-long { width: 82%; }
                .report-skeleton-line.is-mid { width: 68%; }
                .report-chart-box { position: relative; min-height: 0; border: 1.4px solid #111827; background: #ffffff; overflow: hidden; }
                .report-chart-grid { position: absolute; inset: 9% 8% 14% 10%; background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px); background-size: 100% 25%, 20% 100%; border-left: 1.5px solid #475569; border-bottom: 1.5px solid #475569; }
                .report-chart-bars { position: absolute; left: 17%; right: 16%; bottom: 15%; height: 52%; display: flex; align-items: end; justify-content: space-between; }
                .report-chart-bars i { width: 9%; background: #cbd5e1; border: 1px solid #94a3b8; }
                .report-chart-bars i:nth-child(1) { height: 46%; } .report-chart-bars i:nth-child(2) { height: 70%; } .report-chart-bars i:nth-child(3) { height: 55%; } .report-chart-bars i:nth-child(4) { height: 76%; } .report-chart-bars i:nth-child(5) { height: 60%; }
                .report-chart-line { position: absolute; left: 18%; right: 15%; top: 32%; height: 22%; border-top: 3px solid #334155; transform: skewY(-10deg); opacity: 0.7; }
                .report-memo-box { display: grid; grid-template-columns: 19% 1fr; grid-template-rows: repeat(3, 1fr); align-items: center; gap: 0 12px; border: 1.4px solid #111827; background: #ffffff; padding: 7px 10px; }
                .report-memo-box strong { grid-row: 1 / 4; align-self: stretch; display: grid; place-items: center; border-right: 1px solid #111827; padding-right: 10px; font-size: 13px; font-weight: 900; }
                .report-waste-grid { position: absolute; left: 3.4%; right: 2.8%; top: 8.2%; bottom: 8%; display: grid; grid-template-columns: 47% 47%; grid-template-rows: 73% 19%; gap: 5% 6%; }
                .report-waste-table { min-height: 0; }
                .report-waste-grid .report-chart-box { min-height: 0; }
                .report-waste-memo { grid-column: 1 / 3; }
                .report-waste-auto-layout { position: absolute; left: 3.4%; right: 2.8%; top: 8.2%; bottom: 8.8%; display: grid; grid-template-columns: 47% 47%; grid-template-rows: var(--report-waste-main-row, 83.5%) var(--report-waste-memo-row, 6.5%); gap: 5% 6%; }
                .report-waste-auto-table-wrap { min-height: 0; }
                .report-waste-auto-table { width: 100%; height: 100%; border: 1.4px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; font-size: 12.5px; font-weight: 900; line-height: 1.04; }
                .report-waste-auto-table th, .report-waste-auto-table td { border: 1px solid #111827; padding: 1px 3px; text-align: center; vertical-align: middle; }
                .report-waste-auto-table th { background: #dbe5f1; }
                .report-waste-auto-group { width: 14%; font-size: 15px; line-height: 1.4; }
                .report-waste-auto-group span { display: inline-block; font-size: 14px; }
                .report-waste-auto-row-label { width: 14%; font-size: 12.5px; }
                .report-waste-auto-unit-row .report-waste-auto-row-label { font-size: 12px; }
                .report-waste-auto-total-label { font-size: 13px; }
                .report-waste-auto-chart { min-height: 0; }
                .report-waste-auto-memo { grid-column: 1 / 3; display: grid; grid-template-columns: 13% 1fr; min-height: 0; border: 1.4px solid #111827; background: #ffffff; color: #020617; }
                .report-waste-auto-memo strong { display: grid; place-items: center; border-right: 1px solid #111827; font-size: 22px; font-weight: 900; }
                .report-work-layout { position: absolute; left: 1.2%; right: 1.6%; top: 10.5%; bottom: 10.5%; display: grid; grid-template-columns: 76% 22%; gap: 2%; }
                .report-work-table { width: 100%; height: 100%; border: 1.4px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; }
                .report-work-table th, .report-work-table td { border: 1px solid #111827; padding: 5px; vertical-align: middle; text-align: center; }
                .report-work-table th { height: 8%; font-size: 13px; font-weight: 900; background: #f8fafc; }
                .report-work-table th:nth-child(1), .report-work-table td:nth-child(1) { width: 7%; }
                .report-work-table th:nth-child(2), .report-work-table td:nth-child(2), .report-work-table th:nth-child(3), .report-work-table td:nth-child(3) { width: 26%; }
                .report-number-cell { font-size: 13px; font-weight: 900; }
                .report-photo-placeholder { width: 100%; height: 100%; min-height: 76px; border: 1px solid #94a3b8; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
                .report-floating-photos { display: grid; gap: 3%; min-height: 0; }
                .report-floating-photos .report-photo-placeholder { min-height: 0; }
                .report-plan-layout { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; min-height: 0; --report-plan-table-width: 100%; --report-plan-label-width: 4.6%; --report-plan-slot-width: 23.85%; }
                .report-plan-layout[data-report-plan-slot-count="0"] { --report-plan-table-width: 7.4%; --report-plan-label-width: 100%; --report-plan-slot-width: 0%; }
                .report-plan-layout[data-report-plan-slot-count="1"] { --report-plan-table-width: 28.45%; --report-plan-label-width: 16.17%; --report-plan-slot-width: 83.83%; }
                .report-plan-layout[data-report-plan-slot-count="2"] { --report-plan-table-width: 52.3%; --report-plan-label-width: 8.8%; --report-plan-slot-width: 45.6%; }
                .report-plan-layout[data-report-plan-slot-count="3"] { --report-plan-table-width: 76.15%; --report-plan-label-width: 6.04%; --report-plan-slot-width: 31.32%; }
                .report-plan-layout[data-report-plan-slot-count="4"] { --report-plan-table-width: 100%; --report-plan-label-width: 4.6%; --report-plan-slot-width: 23.85%; }
                .report-slide[data-report-output-prepared="true"] .report-plan-layout[data-report-plan-filled-slot-count="0"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-layout[data-report-plan-filled-slot-count="0"] { --report-plan-table-width: 7.4%; --report-plan-label-width: 100%; --report-plan-slot-width: 0%; }
                .report-slide[data-report-output-prepared="true"] .report-plan-layout[data-report-plan-filled-slot-count="1"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-layout[data-report-plan-filled-slot-count="1"] { --report-plan-table-width: 28.45%; --report-plan-label-width: 16.17%; --report-plan-slot-width: 83.83%; }
                .report-slide[data-report-output-prepared="true"] .report-plan-layout[data-report-plan-filled-slot-count="2"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-layout[data-report-plan-filled-slot-count="2"] { --report-plan-table-width: 52.3%; --report-plan-label-width: 8.8%; --report-plan-slot-width: 45.6%; }
                .report-slide[data-report-output-prepared="true"] .report-plan-layout[data-report-plan-filled-slot-count="3"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-layout[data-report-plan-filled-slot-count="3"] { --report-plan-table-width: 76.15%; --report-plan-label-width: 6.04%; --report-plan-slot-width: 31.32%; }
                .report-slide[data-report-output-prepared="true"] .report-plan-layout[data-report-plan-filled-slot-count="4"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-layout[data-report-plan-filled-slot-count="4"] { --report-plan-table-width: 100%; --report-plan-label-width: 4.6%; --report-plan-slot-width: 23.85%; }
                .report-plan-count-control { position: absolute; top: -38px; right: 0; z-index: 3; display: none; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-plan-count-control { display: block; }
                .report-plan-count-control button { display: inline-flex; align-items: center; justify-content: center; height: 30px; border: 1px solid #2563eb; border-radius: 6px; background: #eff6ff; padding: 0 10px; color: #1d4ed8; font-size: 12px; font-weight: 900; cursor: pointer; }
                .report-plan-count-control button:disabled { border-color: #cbd5e1; background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
                .report-plan-table { width: var(--report-plan-table-width); height: 100%; border: 1.5px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; overflow: hidden; }
                .report-plan-label-col { width: var(--report-plan-label-width); }
                .report-plan-slot-col { width: var(--report-plan-slot-width); }
                .report-plan-table th, .report-plan-table td { border: 1.3px solid #111827; padding: 0; text-align: center; vertical-align: middle; }
                .report-plan-table th { background: #f4b183; color: #020617; font-size: 18px; font-weight: 900; line-height: 1.1; }
                .report-plan-table thead th { height: 9.8%; }
                .report-plan-table tbody th { width: var(--report-plan-label-width); padding: 0 4px; letter-spacing: 0; word-break: keep-all; white-space: pre-line; }
                .report-plan-image-row { height: 72%; }
                .report-plan-summary-row { height: 18.2%; }
                .report-plan-image-cell { position: relative; min-height: 0; padding: 7px !important; overflow: hidden; line-height: 0; }
                .report-plan-image-frame { position: absolute; inset: 7px; width: auto; height: auto; min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; border: 3px solid #111827; background: #ffffff; box-shadow: 2px 2px 3px rgba(15, 23, 42, 0.35); }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-plan-image-frame { cursor: pointer; }
                .report-plan-image-frame img { display: none; width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; object-position: center; }
                .report-plan-image-frame[data-has-image="true"] img { display: block; }
                .report-plan-image-placeholder { width: 100%; height: 100%; display: grid; place-items: center; background: #ffffff; color: #64748b; font-size: 13px; font-weight: 900; line-height: 1.25; text-align: center; white-space: pre-line; }
                .report-plan-image-frame[data-has-image="true"] .report-plan-image-placeholder { display: none; }
                .report-plan-image-choice { position: absolute; inset: 0; z-index: 2; display: none; align-items: center; justify-content: center; gap: 8px; pointer-events: none; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-plan-image-frame[data-has-image="false"] .report-plan-image-choice { display: flex; }
                .report-plan-image-choice-button { display: inline-flex; align-items: center; justify-content: center; min-width: 58px; height: 28px; border: 1px solid #2563eb; border-radius: 5px; background: rgba(255, 255, 255, 0.96); color: #1d4ed8; padding: 0 9px; font-size: 12px; font-weight: 900; line-height: 1; text-align: center; cursor: pointer; pointer-events: auto; }
                .report-plan-image-choice-button[data-report-plan-image-paste] { border-color: #64748b; color: #334155; }
                .report-plan-image-choice-button[aria-disabled="true"], .report-plan-image-choice-button:disabled { opacity: 0.55; cursor: not-allowed; }
                .report-plan-image-choice [data-report-plan-image-input] { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
                .report-plan-image-clear-button { position: absolute; right: 8px; top: 8px; z-index: 3; display: none; align-items: center; justify-content: center; width: 24px; height: 24px; border: 1px solid rgba(185, 28, 28, 0.65); border-radius: 50%; background: rgba(255, 255, 255, 0.94); color: #b91c1c; padding: 0; font-size: 12px; font-weight: 900; line-height: 1; cursor: pointer; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-plan-image-frame[data-has-image="true"] .report-plan-image-clear-button { display: inline-flex; }
                .report-plan-summary-cell { position: relative; padding: 12px 9px 8px !important; text-align: left !important; vertical-align: top !important; }
                .report-plan-summary-text { width: 100%; height: 100%; outline: 0; overflow: hidden; color: #020617; font-size: 15px; font-weight: 900; line-height: 1.55; text-align: left; white-space: pre-wrap; word-break: keep-all; }
                .report-plan-delete-slot { position: absolute; right: 7px; bottom: 6px; display: none; height: 24px; border: 1px solid #fecaca; border-radius: 5px; background: #fff1f2; color: #b91c1c; padding: 0 8px; font-size: 11px; font-weight: 900; cursor: pointer; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-plan-summary-cell[data-report-plan-active="true"] .report-plan-delete-slot { display: inline-flex; align-items: center; justify-content: center; }
                .report-deck-editor[data-report-edit-mode="editing"] [data-report-slide8-overview] { cursor: pointer; }
                .report-plan-table col[data-report-plan-active="false"], .report-plan-table th[data-report-plan-active="false"], .report-plan-table td[data-report-plan-active="false"] { display: none; }
                .report-slide[data-report-output-prepared="true"] .report-plan-table col[data-report-plan-filled="false"],
                .report-slide[data-report-output-prepared="true"] .report-plan-table th[data-report-plan-filled="false"],
                .report-slide[data-report-output-prepared="true"] .report-plan-table td[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-table col[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-table th[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-plan-table td[data-report-plan-filled="false"] { display: none; }
                .report-status-layout { left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; }
                .report-status-table { border-width: 1.5px; }
                .report-status-table .report-status-label-col { width: var(--report-plan-label-width); }
                .report-status-table .report-status-slot-col { width: var(--report-plan-slot-width); }
                .report-status-table th { background: #cfe8f7; color: #020617; font-size: 18px; font-weight: 900; line-height: 1.15; }
                .report-status-table thead th { height: 9.8%; }
                .report-status-table tbody th { width: var(--report-plan-label-width); padding: 0 4px; background: #cfe8f7; font-size: 20px; font-weight: 900; line-height: 1.18; word-break: keep-all; white-space: nowrap; }
                .report-status-before-row, .report-status-after-row { height: 36%; }
                .report-status-summary-row { height: 18.2%; }
                .report-status-table .report-plan-image-cell { padding: 5px !important; }
                .report-status-table .report-plan-image-frame { inset: 5px; border-width: 3px; box-shadow: 2px 2px 3px rgba(15, 23, 42, 0.35); }
                .report-status-table .report-plan-summary-cell { padding: 12px 8px 8px !important; }
                .report-status-table .report-plan-summary-text { font-size: 15px; line-height: 1.5; }
                .report-safety-layout { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; min-height: 0; display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 1.1%; }
                .report-safety-table { width: var(--report-safety-table-width, 100%); height: 100%; border: 1.5px solid #1e3a5f; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; --report-safety-label-width: 4.6%; --report-safety-slot-width: 23.85%; }
                .report-safety-label-col { width: var(--report-safety-label-width); }
                .report-safety-slot-col { width: var(--report-safety-slot-width); }
                .report-safety-table[data-report-plan-row-active-slot-count="1"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table[data-report-plan-row-filled-slot-count="1"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table[data-report-plan-row-filled-slot-count="1"] { --report-safety-table-width: 28.45%; --report-safety-label-width: 16.17%; --report-safety-slot-width: 83.83%; }
                .report-safety-table[data-report-plan-row-active-slot-count="2"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table[data-report-plan-row-filled-slot-count="2"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table[data-report-plan-row-filled-slot-count="2"] { --report-safety-table-width: 52.3%; --report-safety-label-width: 8.8%; --report-safety-slot-width: 45.6%; }
                .report-safety-table[data-report-plan-row-active-slot-count="3"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table[data-report-plan-row-filled-slot-count="3"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table[data-report-plan-row-filled-slot-count="3"] { --report-safety-table-width: 76.15%; --report-safety-label-width: 6.04%; --report-safety-slot-width: 31.32%; }
                .report-safety-table[data-report-plan-row-active-slot-count="4"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table[data-report-plan-row-filled-slot-count="4"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table[data-report-plan-row-filled-slot-count="4"] { --report-safety-table-width: 100%; --report-safety-label-width: 4.6%; --report-safety-slot-width: 23.85%; }
                .report-safety-table th, .report-safety-table td { border: 1px solid #94a3b8; padding: 0; text-align: center; vertical-align: middle; }
                .report-safety-table thead th { height: 11%; background: #5d9bd3; color: #ffffff; font-size: 18px; font-weight: 900; line-height: 1.1; }
                .report-safety-table .report-safety-row-team { padding: 0 8px; overflow: hidden; text-align: left; white-space: nowrap; }
                .report-safety-row-team-label { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
                .report-safety-add-control { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; z-index: 5; display: none; justify-content: flex-end; align-items: center; gap: 8px; min-height: 30px; }
                .report-safety-add-control select[hidden] { display: none !important; }
                .report-safety-add-control button { height: 28px; border: 1px solid #bfdbfe; border-radius: 6px; background: #ffffff; color: #0f172a; padding: 0 9px; font-size: 12px; font-weight: 900; }
                .report-safety-add-toggle { min-width: 68px; background: #eff6ff !important; color: #1d4ed8 !important; cursor: pointer; }
                .report-safety-team-menu { display: none; align-items: center; gap: 5px; height: 30px; padding: 0 6px; border: 1px solid #dbe4f3; border-radius: 6px; background: rgba(255, 255, 255, 0.96); box-shadow: 0 8px 22px rgba(15, 23, 42, 0.14); }
                .report-safety-team-menu span { color: #475569; font-size: 12px; font-weight: 900; white-space: nowrap; }
                .report-safety-team-menu button { min-width: 62px; cursor: pointer; }
                .report-safety-add-control[data-report-safety-team-picker-open="true"] .report-safety-team-menu { display: inline-flex; }
                .report-safety-add-control button:disabled, .report-safety-add-control select:disabled { border-color: #cbd5e1; background: #f8fafc !important; color: #94a3b8 !important; cursor: not-allowed; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-safety-add-control { display: flex; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-safety-layout { top: 12.2%; }
                .report-deck-editor[data-report-print-mode="true"] .report-safety-add-control,
                .report-slide[data-report-output-prepared="true"] .report-safety-add-control { display: none !important; }
                .report-safety-table tbody th { background: #d9e2f1; color: #020617; font-size: 20px; font-weight: 900; line-height: 1; text-align: center; }
                .report-safety-before-row, .report-safety-after-row { height: 36%; }
                .report-safety-summary-row { height: 17%; }
                .report-safety-image-cell { position: relative; min-width: 0; min-height: 0; padding: 4px !important; }
                .report-safety-image-frame { inset: 4px; border-width: 1.4px; box-shadow: none; }
                .report-safety-summary-cell { position: relative; padding: 2px 4px !important; text-align: left !important; vertical-align: middle !important; }
                .report-safety-summary-text { min-width: 0; max-height: 100%; overflow: hidden; display: grid; align-content: center; gap: 3px; color: #020617; font-weight: 900; line-height: 1.05; text-align: center; white-space: normal; word-break: keep-all; }
                .report-safety-summary-title, .report-safety-summary-meta { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .report-safety-summary-title, .report-safety-summary-meta { font-size: 11px; }
                .report-safety-delete-slot { right: 4px; bottom: 3px; height: 22px; }
                .report-deck-editor[data-report-edit-mode="editing"] .report-slide.is-active .report-safety-summary-cell[data-report-plan-active="true"] .report-safety-delete-slot { display: inline-flex; align-items: center; justify-content: center; }
                .report-safety-layout[data-report-plan-active-slot-count="0"] { grid-template-rows: repeat(2, 42px); align-content: start; }
                .report-safety-layout[data-report-plan-active-slot-count="0"] .report-safety-table { height: 42px; }
                .report-safety-table[data-report-plan-row-active-slot-count="0"] tbody { display: none; }
                .report-safety-table col[data-report-plan-active="false"]:not([data-report-safety-row-anchor="true"]),
                .report-safety-table th[data-report-plan-active="false"]:not(.report-safety-row-team),
                .report-safety-table td[data-report-plan-active="false"] { display: none; }
                .report-slide[data-report-output-prepared="true"] .report-safety-table[data-report-plan-row-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table[data-report-plan-row-filled="false"] { display: none; }
                .report-slide[data-report-output-prepared="true"] .report-safety-table col[data-report-plan-filled="false"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table th[data-report-plan-filled="false"],
                .report-slide[data-report-output-prepared="true"] .report-safety-table td[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table col[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table th[data-report-plan-filled="false"],
                .report-deck-editor[data-report-print-mode="true"] .report-safety-table td[data-report-plan-filled="false"] { display: none; }
                .report-deck-editor:not([data-report-edit-mode="editing"]) [data-report-add-page] { display: none; }
                .report-deck-editor[data-report-slide10-enabled="true"] [data-report-add-page="slide10"] { display: none; }
                .report-production-start-layout { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 5.2%; }
                .report-production-start-layout::before, .report-production-labor-layout::before, .report-production-yield-layout::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; z-index: 0; width: 2px; transform: translateX(-50%); background: #f59e0b; pointer-events: none; }
                .report-production-start-column { position: relative; min-width: 0; display: grid; grid-template-rows: 8% 13.2% 9.8% 24.8% 6.2% minmax(0, 1fr); align-items: stretch; min-height: 0; }
                .report-production-start-column { z-index: 1; }
                .report-production-start-column + .report-production-start-column { border-left: 0; padding-left: 0; }
                .report-production-start-caption, .report-production-start-subcaption, .report-production-start-chart-title { color: #020617; font-weight: 900; letter-spacing: 0; line-height: 1.15; }
                .report-production-start-caption { align-self: center; font-size: 14px; }
                .report-production-start-caption span { display: inline-block; min-width: 44%; height: 1em; vertical-align: bottom; }
                .report-production-start-subcaption { align-self: end; padding-bottom: 3px; font-size: 13px; }
                .report-production-start-chart-title { align-self: end; padding-bottom: 4px; font-size: 13px; text-decoration: underline; }
                .report-production-start-summary-table, .report-production-start-cause-table { width: 100%; height: 100%; border: 1.3px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; }
                .report-production-col-part { width: 8.5%; }
                .report-production-col-item { width: 12.5%; }
                .report-production-col-value { width: 16.6%; }
                .report-production-col-rate { width: 14.6%; }
                .report-production-cause-col-part { width: 8.5%; }
                .report-production-cause-col-item { width: 13.5%; }
                .report-production-cause-col-rate { width: 13.5%; }
                .report-production-cause-col-reason { width: 64.5%; }
                .report-production-cause-col-item-wide { width: 18%; }
                .report-production-cause-col-rate-wide { width: 16%; }
                .report-production-cause-col-reason-wide { width: 66%; }
                .report-production-direct-col-label { width: 18%; }
                .report-production-direct-col-value { width: 17%; }
                .report-production-direct-col-rate { width: 15.5%; }
                .report-production-start-summary-table th, .report-production-start-summary-table td, .report-production-start-cause-table th, .report-production-start-cause-table td { border: 1px solid #64748b; padding: 2px 4px; text-align: center; vertical-align: middle; }
                .report-production-start-summary-table th { background: #dbe5f1; font-size: 10.4px; font-weight: 900; line-height: 1.12; }
                .report-production-start-summary-table td { font-size: 11.2px; line-height: 1.12; }
                .report-production-start-summary-table tbody th { background: #f8fafc; font-size: 10.3px; font-weight: 500; line-height: 1.14; }
                .report-production-start-summary-table .is-total th, .report-production-start-summary-table .is-total td { background: #e2f0f2; font-weight: 900; }
                .report-production-start-part { width: 9%; font-weight: 500 !important; word-break: keep-all; white-space: normal; }
                .report-production-start-cause-table thead th { background: #92d050; font-size: 11px; font-weight: 900; line-height: 1.12; }
                .report-production-start-cause-table tbody th { background: #f8fafc; font-size: 10.2px; font-weight: 500; line-height: 1.16; }
                .report-production-start-cause-table tbody td { font-size: 10.4px; line-height: 1.2; }
                .report-production-start-cause-table td:last-child { text-align: left; padding-left: 6px; overflow-wrap: anywhere; word-break: keep-all; }
                .report-production-start-chart { position: relative; min-height: 0; overflow: hidden; background: #ffffff; }
                .report-production-start-unit { position: absolute; right: 0; top: 0; z-index: 2; color: #020617; font-size: 9px; font-weight: 500; line-height: 1; }
                .report-production-start-chart-plot { position: absolute; inset: 0; }
                .report-production-start-chart-plot svg { display: block; width: 100%; height: 100%; overflow: visible; }
                .report-production-start-chart-grid { position: absolute; left: 3.8%; right: 1.8%; top: 7%; bottom: 14%; background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 100% 20%, 8.333% 100%; }
                .report-production-start-chart-axis { position: absolute; background: #94a3b8; }
                .report-production-start-chart-axis.is-y { left: 3.8%; top: 7%; bottom: 14%; width: 1px; }
                .report-production-start-chart-axis.is-x { left: 3.8%; right: 1.8%; bottom: 14%; height: 1px; }
                .report-production-start-chart-legend { position: absolute; left: 0; right: 0; bottom: 1.2%; display: inline-flex; align-items: center; justify-content: center; gap: 12px; color: #020617; font-size: 8px; font-weight: 500; }
                .report-production-start-chart-legend span { display: inline-flex; align-items: center; gap: 3px; }
                .report-production-start-chart-legend i { display: inline-block; width: 14px; height: 2px; }
                .report-production-start-chart-legend .is-blue { background: #4472c4; }
                .report-production-start-chart-legend .is-red { background: #ff0000; }
                .report-production-labor-layout { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 5.2%; }
                .report-production-labor-column { position: relative; min-width: 0; display: grid; grid-template-rows: 6.2% 16.4% 4.2% 20.2% 4.8% minmax(0, 1fr); align-items: stretch; min-height: 0; }
                .report-production-labor-column { z-index: 1; }
                .report-production-labor-column + .report-production-labor-column { border-left: 0; padding-left: 0; }
                .report-production-labor-caption, .report-production-labor-subcaption, .report-production-labor-chart-title { color: #020617; font-weight: 900; letter-spacing: 0; line-height: 1.15; }
                .report-production-labor-caption { align-self: center; font-size: 14px; }
                .report-production-labor-caption span { display: inline-block; min-width: 36%; height: 1em; vertical-align: bottom; }
                .report-production-labor-subcaption { align-self: end; padding-bottom: 3px; font-size: 13px; }
                .report-production-labor-chart-title { align-self: end; padding-bottom: 4px; font-size: 13px; text-decoration: underline; }
                .report-production-labor-summary-table, .report-production-labor-cause-table { width: 100%; height: 100%; border: 1.3px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; }
                .report-production-labor-summary-table th, .report-production-labor-summary-table td, .report-production-labor-cause-table th, .report-production-labor-cause-table td { border: 1px solid #64748b; padding: 2px 4px; text-align: center; vertical-align: middle; }
                .report-production-labor-summary-table th { background: #dbe5f1; font-size: 10.4px; font-weight: 900; line-height: 1.12; }
                .report-production-labor-summary-table td { font-size: 11.2px; line-height: 1.12; }
                .report-production-labor-summary-table tbody th { background: #f8fafc; font-size: 10.3px; font-weight: 500; line-height: 1.14; }
                .report-production-labor-summary-table .is-total th, .report-production-labor-summary-table .is-total td { background: #e2f0f2; font-weight: 900; }
                .report-production-labor-part { width: 12%; font-weight: 500 !important; word-break: keep-all; white-space: normal; }
                .report-production-labor-part span { display: inline-block; margin-top: 1px; font-size: 8px; line-height: 1.05; }
                .report-production-labor-cause-table thead th { background: #92d050; font-size: 11px; font-weight: 900; line-height: 1.12; }
                .report-production-labor-cause-table tbody th { background: #f8fafc; font-size: 10.2px; font-weight: 500; line-height: 1.16; }
                .report-production-labor-cause-table tbody td { font-size: 10.4px; line-height: 1.2; }
                .report-production-labor-cause-table td:last-child { text-align: left; padding-left: 6px; overflow-wrap: anywhere; word-break: keep-all; }
                .report-production-labor-chart { position: relative; min-height: 0; overflow: hidden; background: #ffffff; }
                .report-production-labor-unit { position: absolute; right: 0; top: 0; z-index: 2; color: #020617; font-size: 9px; font-weight: 500; line-height: 1; }
                .report-production-labor-chart-grid { position: absolute; left: 4.4%; right: 2.2%; top: 8.5%; bottom: 17%; background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 100% 20%, 8.333% 100%; }
                .report-production-labor-chart-axis { position: absolute; background: #94a3b8; }
                .report-production-labor-chart-axis.is-y { left: 4.4%; top: 8.5%; bottom: 17%; width: 1px; }
                .report-production-labor-chart-axis.is-x { left: 4.4%; right: 2.2%; bottom: 17%; height: 1px; }
                .report-production-labor-chart-legend { position: absolute; left: 0; right: 0; bottom: 2.4%; display: inline-flex; align-items: center; justify-content: center; gap: 12px; color: #020617; font-size: 8px; font-weight: 500; }
                .report-production-labor-chart-legend span { display: inline-flex; align-items: center; gap: 3px; }
                .report-production-labor-chart-legend i { display: inline-block; width: 14px; height: 2px; }
                .report-production-labor-chart-legend .is-blue { background: #4472c4; }
                .report-production-labor-chart-legend .is-orange { height: 8px; width: 8px; background: #ed7d31; }
                .report-production-direct-labor-slide .report-production-labor-column { grid-template-rows: 6.2% 13.4% 4.2% 22.2% 4.8% minmax(0, 1fr); }
                .report-production-direct-summary-table tbody th { background: #e2f0f2; font-size: 10px; font-weight: 900; line-height: 1.05; }
                .report-production-direct-summary-table tbody th span { display: inline-block; margin-top: 2px; font-size: 8px; line-height: 1.05; }
                .report-production-direct-cause-table tbody tr { height: 100%; }
                .report-production-direct-note { position: absolute; left: 21%; right: 21%; bottom: 5.9%; z-index: 2; color: #ff0000; font-size: 14px; font-weight: 500; text-align: center; letter-spacing: 0; line-height: 1.1; }
                .report-production-yield-layout { position: absolute; left: 3.4%; right: 2.9%; top: 8.4%; bottom: 8.8%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 5.2%; }
                .report-production-yield-column { position: relative; min-width: 0; display: grid; grid-template-rows: 6.2% 16.4% 4.2% 25.6% 4.8% minmax(0, 1fr); align-items: stretch; min-height: 0; }
                .report-production-yield-column { z-index: 1; }
                .report-production-yield-column + .report-production-yield-column { border-left: 0; padding-left: 0; }
                .report-production-yield-caption, .report-production-yield-subcaption, .report-production-yield-chart-title { color: #020617; font-weight: 900; letter-spacing: 0; line-height: 1.15; }
                .report-production-yield-caption { align-self: center; font-size: 14px; }
                .report-production-yield-caption span { display: inline-block; min-width: 44%; height: 1em; vertical-align: bottom; }
                .report-production-yield-subcaption { align-self: end; padding-bottom: 3px; font-size: 13px; }
                .report-production-yield-chart-title { align-self: end; padding-bottom: 4px; font-size: 13px; text-decoration: underline; }
                .report-production-yield-summary-table, .report-production-yield-cause-table { width: 100%; height: 100%; border: 1.3px solid #111827; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #020617; }
                .report-production-yield-summary-table th, .report-production-yield-summary-table td, .report-production-yield-cause-table th, .report-production-yield-cause-table td { border: 1px solid #64748b; padding: 2px 4px; text-align: center; vertical-align: middle; }
                .report-production-yield-summary-table th { background: #dbe5f1; font-size: 10.4px; font-weight: 900; line-height: 1.12; }
                .report-production-yield-summary-table td { font-size: 11.2px; line-height: 1.12; }
                .report-production-yield-summary-table tbody th { background: #f8fafc; font-size: 10.3px; font-weight: 500; line-height: 1.14; }
                .report-production-yield-summary-table .is-total th, .report-production-yield-summary-table .is-total td { background: #e2f0f2; font-weight: 900; }
                .report-production-yield-part { width: 10%; font-weight: 500 !important; word-break: keep-all; white-space: normal; }
                .report-production-yield-part span { display: inline-block; margin-top: 1px; font-size: 8px; line-height: 1.05; }
                .report-production-yield-cause-table thead th { background: #92d050; font-size: 11px; font-weight: 900; line-height: 1.12; }
                .report-production-yield-cause-table tbody tr { height: auto; }
                .report-production-yield-cause-table tbody th { background: #f8fafc; font-size: 10.2px; font-weight: 500; line-height: 1.16; }
                .report-production-yield-cause-table tbody td { font-size: 10.4px; line-height: 1.2; }
                .report-production-yield-cause-table td:last-child { text-align: left; padding-left: 6px; overflow-wrap: anywhere; word-break: keep-all; }
                .report-production-yield-chart { position: relative; min-height: 0; overflow: hidden; background: #ffffff; }
                .report-production-yield-unit { position: absolute; right: 0; top: 0; z-index: 2; color: #020617; font-size: 9px; font-weight: 500; line-height: 1; }
                .report-production-yield-chart-grid { position: absolute; left: 4.4%; right: 2.2%; top: 8.5%; bottom: 17%; background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 100% 20%, 8.333% 100%; }
                .report-production-yield-chart-axis { position: absolute; background: #94a3b8; }
                .report-production-yield-chart-axis.is-y { left: 4.4%; top: 8.5%; bottom: 17%; width: 1px; }
                .report-production-yield-chart-axis.is-x { left: 4.4%; right: 2.2%; bottom: 17%; height: 1px; }
                .report-production-yield-chart-plot { position: absolute; inset: 0; z-index: 1; }
                .report-production-yield-chart-plot svg { display: block; width: 100%; height: 100%; }
                .report-production-yield-chart-legend { position: absolute; left: 0; right: 0; bottom: 2.4%; display: inline-flex; align-items: center; justify-content: center; gap: 12px; color: #020617; font-size: 8px; font-weight: 500; }
                .report-production-yield-chart-legend span { display: inline-flex; align-items: center; gap: 3px; }
                .report-production-yield-chart-legend i { display: inline-block; width: 14px; height: 2px; }
                .report-production-yield-chart-legend .is-blue { background: #4472c4; }
                .report-production-yield-chart-legend .is-red { background: #ff0000; }
                .report-production-yield-chart-legend .is-green { background: #70ad47; }
                .report-deck-editor:fullscreen { width: 100vw; height: 100vh; min-height: 0; grid-template-rows: minmax(0, 1fr); gap: 0; padding: 0; background: #111827; }
                .report-deck-editor:fullscreen .report-deck-toolbar, .report-deck-editor:fullscreen .report-deck-sidebar { display: none; }
                .report-deck-editor:fullscreen .report-deck-workspace { height: 100vh; grid-template-columns: minmax(0, 1fr); gap: 0; }
                .report-deck-editor:fullscreen .report-deck-stage { border: 0; border-radius: 0; padding: 0; background: #111827; }
                .report-deck-editor:fullscreen .report-slide { width: min(100vw, 177.777vh); max-width: none; border: 0; box-shadow: none; }
                @media print {
                    @page { size: 297mm 210mm; margin: 0; }
                    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                    *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
                    html, body { width: 297mm; min-height: 210mm; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .report-deck-editor[data-report-print-mode="true"] { display: block !important; width: 297mm !important; height: auto !important; min-height: 0 !important; background: #ffffff !important; }
                    .report-deck-editor[data-report-print-mode="true"] .report-deck-toolbar,
                    .report-deck-editor[data-report-print-mode="true"] .report-deck-sidebar,
                    .report-deck-editor[data-report-print-mode="true"] .report-overview-dialog,
                    .report-deck-editor[data-report-print-mode="true"] .report-memo-dialog,
                    .report-deck-editor[data-report-print-mode="true"] .report-memo-overview-dialog { display: none !important; }
                    .report-deck-editor[data-report-print-mode="true"] .report-deck-workspace,
                    .report-deck-editor[data-report-print-mode="true"] .report-deck-stage { display: block !important; width: 297mm !important; height: auto !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; background: #ffffff !important; overflow: visible !important; }
                    .report-deck-editor[data-report-print-mode="true"] .report-slide { display: none !important; }
                    .report-deck-editor[data-report-print-mode="true"] .report-slide[data-report-print-visible="true"] { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: 277mm !important; height: 155.8125mm !important; max-width: none !important; aspect-ratio: auto !important; margin: 27.09375mm 10mm !important; border: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; overflow: hidden !important; }
                    .report-deck-editor[data-report-print-mode="true"] .report-slide[data-report-print-last="true"] { break-after: auto; page-break-after: auto; }
                    .report-deck-editor[data-report-print-mode="true"] .report-plan-image-choice,
                    .report-deck-editor[data-report-print-mode="true"] .report-plan-count-control,
                    .report-deck-editor[data-report-print-mode="true"] .report-slide-date-input,
                    .report-deck-editor[data-report-print-mode="true"] .report-chart-highlight-controls,
                    .report-deck-editor[data-report-print-mode="true"] .report-chart-highlight-toggle,
                    .report-deck-editor[data-report-print-mode="true"] .report-chart-highlight-reset,
                    .report-deck-editor[data-report-print-mode="true"] [data-report-plan-image-input],
                    .report-deck-editor[data-report-print-mode="true"] [data-report-plan-image-clear],
                    .report-deck-editor[data-report-print-mode="true"] [data-report-memo-overview-toggle] { display: none !important; }
                    .report-deck-editor[data-report-print-mode="true"] img:not([src]),
                    .report-deck-editor[data-report-print-mode="true"] img[src=""] { visibility: hidden !important; }
                }
                .report-overview-dialog[hidden] { display: none; }
                .report-overview-dialog { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; background: rgba(15, 23, 42, 0.44); }
                .report-overview-panel { width: min(460px, calc(100vw - 32px)); border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28); color: #0f172a; }
                .report-overview-head { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 14px; border-bottom: 1px solid #e2e8f0; }
                .report-overview-head strong { font-size: 16px; font-weight: 900; }
                .report-overview-head button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: #334155; font-size: 20px; font-weight: 900; cursor: pointer; }
                .report-overview-form { display: grid; gap: 10px; padding: 14px; }
                .report-overview-form label { display: grid; grid-template-columns: 82px minmax(0, 1fr); align-items: center; gap: 10px; color: #0f172a; font-size: 13px; font-weight: 900; }
                .report-overview-form [hidden] { display: none !important; }
                .report-overview-dialog[data-report-overview-slide-key="slide10"] [data-report-overview-date-row] { order: 1; }
                .report-overview-dialog[data-report-overview-slide-key="slide10"] [data-report-overview-amount-row] { order: 2; }
                .report-overview-dialog[data-report-overview-slide-key="slide10"] [data-report-overview-hazard-row] { order: 3; }
                .report-overview-form input, .report-overview-form select { width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #0f172a; padding: 0 10px; font-size: 13px; font-weight: 800; }
                .report-overview-toggle-row { display: grid; grid-template-columns: 82px minmax(0, 1fr); align-items: center; gap: 10px; color: #0f172a; font-size: 13px; font-weight: 900; }
                .report-overview-toggle { display: grid; grid-template-columns: 1fr 1fr; width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff; }
                .report-overview-toggle button { border: 0; border-right: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 13px; font-weight: 900; cursor: pointer; }
                .report-overview-toggle button:last-of-type { border-right: 0; }
                .report-overview-toggle button.is-active { background: #2563eb; color: #ffffff; }
                .report-overview-amount-field { display: grid; grid-template-columns: minmax(0, 1fr) 54px; align-items: center; gap: 6px; }
                .report-overview-amount-field em { font-style: normal; color: #475569; font-size: 13px; font-weight: 900; }
                .report-overview-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 0 14px 14px; }
                .report-overview-actions button { min-width: 68px; height: 32px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #334155; font-size: 13px; font-weight: 900; cursor: pointer; }
                .report-overview-actions [data-report-overview-save] { border-color: #2563eb; background: #2563eb; color: #ffffff; }
                @media (max-width: 980px) {
                    .report-deck-editor { height: auto; min-height: calc(100vh - 90px); }
                    .report-deck-workspace { grid-template-columns: minmax(0, 1fr); }
                    .report-deck-sidebar { max-height: 150px; }
                    .report-slide-nav { grid-template-columns: repeat(3, minmax(120px, 1fr)); }
                    .report-deck-toolbar { align-items: flex-start; flex-direction: column; }
                    .report-deck-actions { justify-content: flex-start; }
                    .report-slide { min-width: 620px; }
                    .report-deck-stage { overflow: auto; }
                }
            </style>
            <div class="report-deck-editor" data-report-deck-editor data-report-edit-mode="view" data-report-active-view="${REPORT_HQ_VIEW}" data-report-active-slide="0">
                <div class="report-deck-toolbar">
                    <div class="report-deck-title">
                        <strong>보고서</strong>
                        <span data-report-slide-counter>1 / ${REPORT_INITIAL_SLIDE_COUNT}</span>
                    </div>
                    <div class="report-deck-actions">
                        <span class="report-deck-save-message" data-report-save-status aria-live="polite"></span>
                        <label class="report-deck-month-field">
                            <span>월선택</span>
                            <select data-report-month-select aria-label="보고서 월 선택" disabled>
                                <option value="">월 확인 중</option>
                            </select>
                        </label>
                        <button type="button" class="report-deck-action-button" data-report-memo-overview-toggle>특이사항</button>
                        <button type="button" class="report-deck-action-button" data-report-edit-toggle aria-pressed="false">수정</button>
                        <button type="button" class="report-deck-action-button" data-report-undo-delete disabled>삭제 복구</button>
                        <button type="button" class="report-deck-action-button" data-report-add-page="slide10">페이지 추가</button>
                        <button type="button" class="report-deck-action-button" data-report-print-pdf>PDF인쇄</button>
                        <button type="button" class="report-deck-action-button" data-report-export-html>HTML추출</button>
                        <button type="button" class="report-deck-action-button" data-report-fullscreen>전체화면</button>
                    </div>
                </div>
                <div class="report-deck-workspace">
                    <aside class="report-deck-sidebar" aria-label="보고서 목차">
                        <strong>목차</strong>
                        <div class="report-slide-nav">${buildSlideNav()}</div>
                        <button type="button" class="report-deck-back-button" data-report-jump-slide="1" data-report-jump-view="${REPORT_HQ_VIEW}" data-report-return-hq hidden>이전</button>
                    </aside>
                    <section class="report-deck-stage" data-report-stage aria-label="보고서 슬라이드" tabindex="0">
                        ${buildDeckSlides()}
                    </section>
                </div>
                ${buildReportOverviewDialog()}
                ${buildReportMemoDialog()}
                ${buildReportMemoOverviewDialog()}
            </div>
        `;
    }

    KpiSectionFactoryAdapter.registerFactory('report', function buildReportSection() {
        return {
            id: 'report',
            name: '보고서',
            icon: 'fa-file-lines',
            color: 'blue',
            accent: '#2563eb',
            directLaunch: true,
            hideNavigationChevron: true,
            launchTarget: 'popup',
            launchWindowName: 'kpi-report-editor',
            launchFillScreen: true,
            launchWindowWidth: 1920,
            launchWindowHeight: 1080,
            launchPopupMode: 'report',
            launchRoute: {
                view: 'category',
                sectionId: 'report',
                categoryIndex: 0
            },
            categories: [
                {
                    title: 'PPT 보고서',
                    icon: 'fa-display',
                    color: '#2563eb',
                    desc: 'PPT 형태의 보고서 템플릿',
                    navHidden: true,
                    viewerMode: 'full-bleed',
                    content: buildReportDeckCoverContent()
                }
            ]
        };
    });
})();
