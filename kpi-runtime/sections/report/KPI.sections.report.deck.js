(function (root) {
    const parts = root[Symbol.for('kpi.reportDeck.section.parts')] ||= Object.create(null);
    function buildWorkTable(rowCount, photoCount) {
        const rows = Array.from({ length: rowCount }, (_, rowIndex) => `
            <tr>
                <td class="report-number-cell">${rowIndex + 1}</td>
                <td>${parts.buildPhotoPlaceholder()}</td>
                <td>${parts.buildPhotoPlaceholder()}</td>
                <td>
                    <span class="report-skeleton-line is-long"></span>
                    <span class="report-skeleton-line is-mid"></span>
                    <span class="report-skeleton-line"></span>
                </td>
            </tr>
        `).join('');
        const extras = Array.from({ length: photoCount }, parts.buildPhotoPlaceholder).join('');
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
        const view = options.view || parts.REPORT_HQ_VIEW;
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
            view: parts.REPORT_PUBLIC_WORKS_VIEW,
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

    function buildContentsListItems(items = [], options = {}) {
        return items.map(item => (
            `<li${item?.optionalPage ? ` data-report-optional-content="${item.optionalPage}" hidden` : ''}>${buildContentsListItemContent(item, options)}</li>`
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
                ${buildContentsListItems(items, { ref: true })}
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
                jumpView: parts.REPORT_PRODUCTION_TEAM1_VIEW,
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
                jumpView: parts.REPORT_PRODUCTION_TEAM2_VIEW,
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
                jumpView: parts.REPORT_PRODUCTION_TEAM3_VIEW,
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
                jumpView: parts.REPORT_PUBLIC_WORKS_VIEW,
                pageRange: '21-29',
                items: [
                    '표지',
                    '목차',
                    { fieldKey: 'contentsItem1', text: '에너지 실적', ref: true },
                    { fieldKey: 'contentsItem2', text: '폐수처리장 운영실적', ref: true },
                    { fieldKey: 'contentsItem3', text: '공사 및 정비현황', optionalPage: 'slide8', ref: true },
                    { fieldKey: 'contentsItem4', text: '주요계획', nextMonth: true, optionalPage: 'slide9', ref: true }
                ]
            }
        ];
        return `
            <article class="report-slide report-production-contents-slide" data-report-slide-page="1" data-report-slide-view="${parts.REPORT_HQ_VIEW}" data-report-slide-label="본부 목차">
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
            <article class="report-slide report-contents-slide" data-report-slide-page="2" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-slide-label="목차">
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
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                departmentText: '생산1팀'
            }),
            buildTeamContentsSlide({
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                titleKey: 'productionTeam1ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam1ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam1ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam1ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam1ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            parts.buildProductionStartSlide({
                pageIndex: 10,
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                productionStartKey: 'team_01',
                sectionKey: 'productionTeam1StartSection',
                titleKey: 'productionTeam1StartTitle'
            }),
            parts.buildProductionLaborSlide({
                pageIndex: 13,
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                sectionKey: 'productionTeam1LaborSection',
                titleKey: 'productionTeam1LaborTitle'
            }),
            parts.buildProductionDirectLaborSlide({
                pageIndex: 16,
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                sectionKey: 'productionTeam1DirectLaborSection',
                titleKey: 'productionTeam1DirectLaborTitle'
            }),
            parts.buildProductionYieldSlide({
                pageIndex: 19,
                view: parts.REPORT_PRODUCTION_TEAM1_VIEW,
                productionYieldKey: 'team_01',
                sectionKey: 'productionTeam1YieldSection',
                titleKey: 'productionTeam1YieldTitle'
            }),
            buildTeamCoverSlide({
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                departmentText: '생산2팀'
            }),
            buildTeamContentsSlide({
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                titleKey: 'productionTeam2ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam2ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam2ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam2ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam2ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            parts.buildProductionStartSlide({
                pageIndex: 11,
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2StartSection',
                titleKey: 'productionTeam2StartTitle'
            }),
            parts.buildProductionLaborSlide({
                pageIndex: 14,
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2LaborSection',
                titleKey: 'productionTeam2LaborTitle'
            }),
            parts.buildProductionDirectLaborSlide({
                pageIndex: 17,
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2DirectLaborSection',
                titleKey: 'productionTeam2DirectLaborTitle'
            }),
            parts.buildProductionYieldSlide({
                pageIndex: 20,
                view: parts.REPORT_PRODUCTION_TEAM2_VIEW,
                sectionKey: 'productionTeam2YieldSection',
                titleKey: 'productionTeam2YieldTitle'
            }),
            buildTeamCoverSlide({
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                departmentText: '생산3팀'
            }),
            buildTeamContentsSlide({
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                titleKey: 'productionTeam3ContentsTitle',
                items: [
                    { fieldKey: 'productionTeam3ContentsItem1', text: '생산실적(생산량)' },
                    { fieldKey: 'productionTeam3ContentsItem2', text: '생산지표 2-1 노동생산성' },
                    { fieldKey: 'productionTeam3ContentsItem3', text: '생산지표 2-1 노동생산성 (직접노무비/kg)' },
                    { fieldKey: 'productionTeam3ContentsItem4', text: '생산지표 2-2 수율' }
                ]
            }),
            parts.buildProductionStartSlide({
                pageIndex: 12,
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3StartSection',
                titleKey: 'productionTeam3StartTitle'
            }),
            parts.buildProductionLaborSlide({
                pageIndex: 15,
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3LaborSection',
                titleKey: 'productionTeam3LaborTitle'
            }),
            parts.buildProductionDirectLaborSlide({
                pageIndex: 18,
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3DirectLaborSection',
                titleKey: 'productionTeam3DirectLaborTitle'
            }),
            parts.buildProductionYieldSlide({
                pageIndex: 21,
                view: parts.REPORT_PRODUCTION_TEAM3_VIEW,
                sectionKey: 'productionTeam3YieldSection',
                titleKey: 'productionTeam3YieldTitle'
            }),
            buildPublicWorksCoverSlide(),
            buildContentsSlide(),
            parts.buildAnalysisSlide(3, 'slide3Section', 'slide3Title', '가스 (LNG)', '전기'),
            parts.buildAnalysisSlide(4, 'slide4Section', 'slide4Title', '가스 (LNG)', '전기'),
            parts.buildAnalysisSlide(5, 'slide5Section', 'slide5Title', '가스 (LPG)', '비용'),
            parts.buildWasteSlide(6, 'slide6Section', 'slide6Title', '폐수'),
            parts.buildWasteSlide(7, 'slide7Section', 'slide7Title', '폐수'),
            `
                <article class="report-slide report-template-slide" data-report-slide-page="8" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide8" data-report-dynamic-page="0" data-report-optional-page="slide8" data-report-slide-label="공사 및 정비">
                    ${parts.buildSlideHeader('slide8Section', 'slide8Title')}
                    ${parts.buildReportStatusTable(0)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>8/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="-1" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide8" data-report-dynamic-page="1" data-report-optional-page="slide8" data-report-slide-label="공사 및 정비" hidden>
                    ${parts.buildSlideHeader('slide8Section', 'slide8Title')}
                    ${parts.buildReportStatusTable(1)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="9" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide9" data-report-dynamic-page="0" data-report-optional-page="slide9" data-report-slide-label="주요 계획">
                    ${parts.buildSlideHeader('slide9Section', 'slide9Title')}
                    ${parts.buildReportPlanTable('slide9', 0)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            `
                <article class="report-slide report-template-slide" data-report-slide-page="-1" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-dynamic-slide="slide9" data-report-dynamic-page="1" data-report-optional-page="slide9" data-report-slide-label="주요 계획" hidden>
                    ${parts.buildSlideHeader('slide9Section', 'slide9Title')}
                    ${parts.buildReportPlanTable('slide9', 1)}
                    <div class="report-slide-footer"></div>
                    <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                    <div class="report-slide-page-number" data-report-page-number>9/9</div>
                </article>
            `,
            ...Array.from({ length: parts.REPORT_SAFETY_PAGE_COUNT }, (_, pageIndex) => parts.buildReportSafetyPage(pageIndex))
        ].join('');
    }

    function buildSlideNav() {
        const viewCounts = {};
        return parts.SLIDE_NAV_ITEMS.map((item, index) => {
            const view = item.view || parts.REPORT_PUBLIC_WORKS_VIEW;
            const viewIndex = viewCounts[view] || 0;
            viewCounts[view] = viewIndex + 1;
            const hidden = view !== parts.REPORT_HQ_VIEW;
            return `
            <button type="button" class="${view === parts.REPORT_HQ_VIEW && viewIndex === 0 ? 'is-active' : ''}" data-report-slide-target="${viewIndex}" data-report-slide-view="${view}" data-report-nav-label="${item.label}"${hidden ? ' hidden' : ''}>
                <span>${String(viewIndex + 1).padStart(2, '0')}</span>
                <strong>${item.label}</strong>
            </button>
        `;
        }).join('');
    }
    Object.assign(parts, {
        buildWorkTable,
        buildCoverSlide,
        buildPublicWorksCoverSlide,
        buildTeamCoverSlide,
        buildEditableReportText,
        buildReportTextRef,
        buildContentsTextItem,
        buildContentsListItemContent,
        buildContentsListItems,
        buildTeamContentsSlide,
        buildProductionContentsColumn,
        buildProductionContentsSlide,
        buildContentsSlide,
        buildDeckSlides,
        buildSlideNav,
    });
})(this);
