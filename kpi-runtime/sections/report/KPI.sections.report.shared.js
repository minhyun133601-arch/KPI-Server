(function (root) {
    const parts = root[Symbol.for('kpi.reportDeck.section.parts')] ||= Object.create(null);
    const REPORT_HQ_VIEW = 'hq';
    const REPORT_PRODUCTION_TEAM1_VIEW = 'production-team-1';
    const REPORT_PRODUCTION_TEAM2_VIEW = 'production-team-2';
    const REPORT_PRODUCTION_TEAM3_VIEW = 'production-team-3';
    const REPORT_PUBLIC_WORKS_VIEW = 'public-works';
    const REPORT_INITIAL_SLIDE_COUNT = 2;
    const REPORT_SAFETY_SLOTS_PER_PAGE = 8;
    const REPORT_SAFETY_COLUMNS_PER_ROW = 4;
    const REPORT_SAFETY_PAGE_COUNT = 1;
    const REPORT_SAFETY_TEAM_ROWS = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀', '물류센터', '기타'];
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

    function buildReportSafetyTableMoveControls() {
        return `
            <div class="report-safety-table-controls" data-report-safety-table-controls>
                <button type="button" class="report-safety-table-move" data-report-safety-table-move="left" title="왼쪽" aria-label="왼쪽">&larr;</button>
                <button type="button" class="report-safety-table-move" data-report-safety-table-move="right" title="오른쪽" aria-label="오른쪽">&rarr;</button>
                <button type="button" class="report-safety-table-move" data-report-safety-table-move="up" title="위로" aria-label="위로">&uarr;</button>
                <button type="button" class="report-safety-table-move" data-report-safety-table-move="down" title="아래로" aria-label="아래로">&darr;</button>
            </div>
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
            return `<th${teamAttrs} data-report-plan-slot="slide10.${slotIndex}" data-report-plan-local-slot="${slotIndex}">${teamContent}${buildReportSafetyTableMoveControls()}</th>`;
        }).join('');
        return `
            <table class="report-safety-table" data-report-safety-row="${rowIndex}" data-report-safety-table-index="${rowIndex}" aria-label="자율 안전 신고제">
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
        const teamOptions = REPORT_SAFETY_TEAM_ROWS
            .map(team => `<option value="${team}">${team}</option>`)
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
                        <label data-report-overview-custom-team-row hidden>
                            <span>팀명</span>
                            <input type="text" data-report-overview-custom-team placeholder="예: 협력업체">
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
                            <input type="text" data-report-overview-hazard placeholder="예: 낙하, 넘어짐">
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
                            <span class="report-overview-amount-line">
                                <span class="report-overview-amount-field">
                                    <input type="number" step="any" inputmode="decimal" data-report-overview-amount placeholder="예: 3.4">
                                    <em>백만원</em>
                                </span>
                                <input type="text" data-report-overview-mode="slide10" data-report-overview-amount-text placeholder="직접 입력">
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
    Object.assign(parts, {
        REPORT_HQ_VIEW,
        REPORT_PRODUCTION_TEAM1_VIEW,
        REPORT_PRODUCTION_TEAM2_VIEW,
        REPORT_PRODUCTION_TEAM3_VIEW,
        REPORT_PUBLIC_WORKS_VIEW,
        REPORT_INITIAL_SLIDE_COUNT,
        REPORT_SAFETY_SLOTS_PER_PAGE,
        REPORT_SAFETY_COLUMNS_PER_ROW,
        REPORT_SAFETY_PAGE_COUNT,
        REPORT_SAFETY_TEAM_ROWS,
        SLIDE_NAV_ITEMS,
        buildSkeletonCells,
        buildMetricTable,
        buildMemoBox,
        buildChartBox,
        buildBukjeongAutoMetricTable,
        buildReportChartHighlightControls,
        buildBukjeongAutoChart,
        buildBukjeongAutoMemo,
        buildPhotoPlaceholder,
        buildReportPlanImageSlot,
        buildReportPhaseImageSlot,
        buildReportStatusImageSlot,
        buildReportSafetyImageFrame,
        buildReportPlanSummarySlot,
        buildReportSafetyImageCell,
        buildReportSafetySummaryCell,
        buildReportSafetyTableMoveControls,
        buildReportSafetyTable,
        buildReportSafetyAddControl,
        buildReportSafetyPage,
        buildReportStatusTable,
        buildReportOverviewDialog,
        buildReportPlanTable,
        buildSlideHeader,
    });
})(this);
