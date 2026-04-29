(function () {
    const OPS_CONSOLE_HOST = '127.0.0.1';
    const OPS_CONSOLE_DEFAULT_PORT = 3215;
    const OWNER_POPUP_WINDOW_NAME = 'kpi-owner-ops-console';
    const OWNER_DEMO_CATEGORY_KEY = 'owner_console_demo';
    const OWNER_DEMO_STYLE_HTML = `
        <style>
            .owner-demo-shell {
                --owner-demo-bg: #eef2ee;
                --owner-demo-surface: #ffffff;
                --owner-demo-soft: #f6f8f5;
                --owner-demo-line: #d8dfd8;
                --owner-demo-line-strong: #c6d0c7;
                --owner-demo-text: #1b211d;
                --owner-demo-muted: #5a655d;
                --owner-demo-primary: #176347;
                --owner-demo-ok: #1b7a4d;
                --owner-demo-warn: #a96c11;
                --owner-demo-shadow: 0 18px 36px rgba(31, 39, 35, 0.06);
                min-height: 100%;
                padding: 24px;
                background: var(--owner-demo-bg);
                color: var(--owner-demo-text);
                font-family: "Noto Sans KR", "Segoe UI", sans-serif;
            }
            .owner-demo-page {
                max-width: 1380px;
                margin: 0 auto;
            }
            .owner-demo-hero,
            .owner-demo-card,
            .owner-demo-section {
                background: var(--owner-demo-surface);
                border: 1px solid var(--owner-demo-line);
                border-radius: 8px;
                box-shadow: var(--owner-demo-shadow);
            }
            .owner-demo-hero {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 20px;
                align-items: end;
                padding: 22px 24px;
            }
            .owner-demo-eyebrow {
                margin: 0 0 8px;
                color: var(--owner-demo-primary);
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.04em;
            }
            .owner-demo-title {
                margin: 0;
                font-size: clamp(26px, 3vw, 34px);
                line-height: 1.15;
            }
            .owner-demo-summary {
                margin: 8px 0 0;
                color: var(--owner-demo-muted);
                font-size: 16px;
            }
            .owner-demo-meta,
            .owner-demo-actions,
            .owner-demo-toolbar,
            .owner-demo-tabs,
            .owner-demo-action-list,
            .owner-demo-summary-group {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                align-items: center;
            }
            .owner-demo-meta {
                margin-top: 14px;
            }
            .owner-demo-chip,
            .owner-demo-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                min-height: 32px;
                padding: 6px 10px;
                border-radius: 999px;
                background: var(--owner-demo-soft);
                border: 1px solid var(--owner-demo-line);
                color: var(--owner-demo-muted);
                font-size: 13px;
                white-space: nowrap;
            }
            .owner-demo-chip strong,
            .owner-demo-pill strong {
                color: var(--owner-demo-text);
            }
            .owner-demo-button,
            .owner-demo-tab {
                min-height: 40px;
                border: 1px solid var(--owner-demo-line-strong);
                border-radius: 8px;
                padding: 10px 14px;
                background: #fff;
                color: var(--owner-demo-text);
                font: inherit;
                font-weight: 700;
            }
            .owner-demo-button.is-primary {
                background: var(--owner-demo-primary);
                border-color: var(--owner-demo-primary);
                color: #fff;
            }
            .owner-demo-button:disabled,
            .owner-demo-tab[aria-disabled="true"] {
                cursor: not-allowed;
                opacity: 0.72;
            }
            .owner-demo-main {
                margin-top: 18px;
            }
            .owner-demo-status-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 12px;
            }
            .owner-demo-card {
                display: grid;
                gap: 4px;
                min-height: 124px;
                padding: 13px 14px;
            }
            .owner-demo-card-head {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--owner-demo-muted);
                font-size: 13px;
                font-weight: 700;
            }
            .owner-demo-light {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: var(--owner-demo-ok);
                box-shadow: 0 0 0 4px rgba(27, 122, 77, 0.14);
            }
            .owner-demo-light.is-warn {
                background: var(--owner-demo-warn);
                box-shadow: 0 0 0 4px rgba(169, 108, 17, 0.14);
            }
            .owner-demo-card strong {
                font-size: 18px;
                line-height: 1.2;
            }
            .owner-demo-card small,
            .owner-demo-output,
            .owner-demo-muted {
                color: var(--owner-demo-muted);
            }
            .owner-demo-workbench {
                margin-top: 18px;
                background: var(--owner-demo-surface);
                border: 1px solid var(--owner-demo-line);
                border-radius: 8px;
                box-shadow: var(--owner-demo-shadow);
                overflow: hidden;
            }
            .owner-demo-tabs {
                padding: 12px;
                border-bottom: 1px solid var(--owner-demo-line);
                background: var(--owner-demo-soft);
            }
            .owner-demo-tab-toggle {
                position: absolute;
                inline-size: 1px;
                block-size: 1px;
                opacity: 0;
                pointer-events: none;
            }
            .owner-demo-tab {
                display: inline-flex;
                align-items: center;
                cursor: pointer;
                user-select: none;
            }
            .owner-demo-tab:hover {
                border-color: var(--owner-demo-primary);
                color: var(--owner-demo-primary);
            }
            #owner-demo-tab-server:checked ~ .owner-demo-tabs label[for="owner-demo-tab-server"],
            #owner-demo-tab-accounts:checked ~ .owner-demo-tabs label[for="owner-demo-tab-accounts"],
            #owner-demo-tab-repository:checked ~ .owner-demo-tabs label[for="owner-demo-tab-repository"] {
                color: var(--owner-demo-primary);
                border-color: var(--owner-demo-primary);
                background: #fff;
            }
            .owner-demo-panels {
                padding: 14px;
            }
            .owner-demo-panel {
                display: none;
                grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
                gap: 14px;
            }
            .owner-demo-panel.is-single {
                grid-template-columns: 1fr;
            }
            #owner-demo-tab-server:checked ~ .owner-demo-panels [data-owner-demo-panel="server"],
            #owner-demo-tab-accounts:checked ~ .owner-demo-panels [data-owner-demo-panel="accounts"],
            #owner-demo-tab-repository:checked ~ .owner-demo-panels [data-owner-demo-panel="repository"] {
                display: grid;
            }
            .owner-demo-section {
                padding: 16px;
            }
            .owner-demo-section + .owner-demo-section {
                margin-top: 14px;
            }
            .owner-demo-section-head {
                display: flex;
                justify-content: space-between;
                gap: 14px;
                align-items: flex-start;
                margin-bottom: 14px;
            }
            .owner-demo-section h3 {
                margin: 0;
                font-size: 18px;
            }
            .owner-demo-section p {
                margin: 4px 0 0;
                color: var(--owner-demo-muted);
            }
            .owner-demo-output {
                margin: 0;
                min-height: 168px;
                padding: 14px;
                border-radius: 8px;
                background: #1f2723;
                color: #dbe7df;
                overflow: auto;
                white-space: pre-wrap;
            }
            .owner-demo-map-frame {
                width: 100%;
                min-height: 520px;
                border: 1px solid var(--owner-demo-line);
                border-radius: 8px;
                background: #fff;
            }
            .owner-demo-switch-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
                margin-top: 14px;
            }
            .owner-demo-switch {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                min-height: 48px;
                padding: 10px 12px;
                border: 1px solid var(--owner-demo-line);
                border-radius: 8px;
                background: var(--owner-demo-soft);
                color: var(--owner-demo-text);
                font-weight: 800;
                cursor: pointer;
            }
            .owner-demo-switch input {
                width: 42px;
                height: 22px;
                accent-color: var(--owner-demo-primary);
                cursor: pointer;
            }
            .owner-demo-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            .owner-demo-table th,
            .owner-demo-table td {
                padding: 10px 8px;
                border-bottom: 1px solid var(--owner-demo-line);
                text-align: left;
            }
            .owner-demo-table th {
                color: var(--owner-demo-muted);
                font-size: 12px;
            }
            @media (max-width: 1100px) {
                .owner-demo-hero,
                .owner-demo-panel {
                    grid-template-columns: 1fr;
                }
                .owner-demo-actions {
                    justify-content: flex-start;
                }
                .owner-demo-status-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .owner-demo-switch-grid {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 680px) {
                .owner-demo-shell {
                    padding: 14px;
                }
                .owner-demo-status-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;

    function getOwnerConsoleUrl(port = OPS_CONSOLE_DEFAULT_PORT, tab = 'server') {
        const normalizedPort = Number.parseInt(String(port || ''), 10);
        const selectedPort = Number.isFinite(normalizedPort) ? normalizedPort : OPS_CONSOLE_DEFAULT_PORT;
        const selectedTab = String(tab || 'server').trim().toLowerCase() || 'server';
        return `http://${OPS_CONSOLE_HOST}:${selectedPort}/#${selectedTab}`;
    }

    function buildOwnerDemoStatusCardsHtml() {
        const cards = [
            ['컴퓨터 예약', '자동 시작 대기', '시작 / 종료 예약 상태 예시', ''],
            ['KPI 포트 3100', '정상 시연', '현재 KPI 운영 포트 기준으로 표시', ''],
            ['PostgreSQL 5434', '연결 가능', 'DB 상태를 보여주는 자리', ''],
            ['부팅 자동실행', '등록됨', '현재 사용자 시작프로그램 예시', ''],
            ['최근 결과', '시연용 정적 화면', '실제 명령은 실행하지 않음', 'is-warn']
        ];
        return cards.map(([label, value, meta, tone]) => `
            <article class="owner-demo-card">
                <div class="owner-demo-card-head">
                    <span class="owner-demo-light ${tone}" aria-hidden="true"></span>
                    <i class="fas fa-circle-info" aria-hidden="true"></i>
                    <span>${label}</span>
                </div>
                <strong>${value}</strong>
                <small>${meta}</small>
            </article>
        `).join('');
    }

    function buildOwnerDemoActionButtonsHtml(labels) {
        return labels.map((label, index) => `
            <button class="owner-demo-button${index === 0 ? ' is-primary' : ''}" type="button" disabled>
                ${label}
            </button>
        `).join('');
    }

    function buildOwnerDemoWorkbenchHtml() {
        return `
            <section class="owner-demo-workbench" aria-label="오너 전용 시연 콘솔">
                <input class="owner-demo-tab-toggle" id="owner-demo-tab-server" name="owner-demo-tab" type="radio" checked>
                <input class="owner-demo-tab-toggle" id="owner-demo-tab-accounts" name="owner-demo-tab" type="radio">
                <input class="owner-demo-tab-toggle" id="owner-demo-tab-repository" name="owner-demo-tab" type="radio">
                <nav class="owner-demo-tabs" aria-label="운영 콘솔 분류">
                    <label class="owner-demo-tab" for="owner-demo-tab-server" role="tab">서버 관리</label>
                    <label class="owner-demo-tab" for="owner-demo-tab-accounts" role="tab">계정 관리</label>
                    <label class="owner-demo-tab" for="owner-demo-tab-repository" role="tab">Repository Map</label>
                </nav>
                <div class="owner-demo-panels">
                    <div class="owner-demo-panel" data-owner-demo-panel="server">
                        <div>
                            <section class="owner-demo-section">
                                <div class="owner-demo-section-head">
                                    <div>
                                        <h3>로그 보기</h3>
                                        <p>서버 stdout, stderr, PostgreSQL 로그를 한 화면에서 확인하는 영역입니다.</p>
                                    </div>
                                </div>
                                <div class="owner-demo-toolbar">
                                    ${buildOwnerDemoActionButtonsHtml(['서버 액션', '서버 stdout', '서버 stderr', 'PostgreSQL'])}
                                </div>
                                <pre class="owner-demo-output">[demo] KPI server 3100 ready
[demo] PostgreSQL 5434 reachable
[demo] owner command preview only - no action executed</pre>
                            </section>
                            <section class="owner-demo-section">
                                <div class="owner-demo-section-head">
                                    <div>
                                        <h3>DB / 도구</h3>
                                        <p>백업, 마이그레이션, 복구 보조 작업이 놓이는 영역입니다.</p>
                                    </div>
                                </div>
                                <div class="owner-demo-action-list">
                                    ${buildOwnerDemoActionButtonsHtml(['전체 백업', 'DB 백업', '구조 검증', '브라우저 스모크'])}
                                </div>
                            </section>
                        </div>
                        <div>
                            <section class="owner-demo-section">
                                <div class="owner-demo-section-head">
                                    <div>
                                        <h3>서버 토글</h3>
                                        <p>실제 설정 저장 없이 운영 콘솔의 토글 형태만 보여주는 시연 영역입니다.</p>
                                    </div>
                                </div>
                                <div class="owner-demo-switch-grid">
                                    <label class="owner-demo-switch">자동 시작 <input type="checkbox" checked></label>
                                    <label class="owner-demo-switch">로그 감시 <input type="checkbox" checked></label>
                                    <label class="owner-demo-switch">점검 모드 <input type="checkbox"></label>
                                </div>
                            </section>
                        </div>
                    </div>
                    <div class="owner-demo-panel is-single" data-owner-demo-panel="accounts">
                        <section class="owner-demo-section">
                            <div class="owner-demo-section-head">
                                <div>
                                    <h3>계정 관리</h3>
                                    <p>오너, 관리자, 일반 계정과 최근 접속 상태를 확인하는 예시입니다.</p>
                                </div>
                                <div class="owner-demo-summary-group">
                                    <span class="owner-demo-pill">총 사용자 <strong>4명</strong></span>
                                    <span class="owner-demo-pill">활성 세션 <strong>2개</strong></span>
                                </div>
                            </div>
                            <div class="owner-demo-action-list">
                                ${buildOwnerDemoActionButtonsHtml(['사용자 추가', '비밀번호 초기화', '권한 저장'])}
                            </div>
                            <div class="owner-demo-switch-grid">
                                <label class="owner-demo-switch">오너 권한 <input type="checkbox" checked></label>
                                <label class="owner-demo-switch">관리자 권한 <input type="checkbox" checked></label>
                                <label class="owner-demo-switch">조회 전용 <input type="checkbox"></label>
                            </div>
                            <table class="owner-demo-table">
                                <thead>
                                    <tr><th>아이디</th><th>표시 이름</th><th>역할</th><th>세션</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>owner</td><td>오너</td><td>owner</td><td>활성</td></tr>
                                    <tr><td>admin</td><td>관리자</td><td>admin</td><td>활성</td></tr>
                                    <tr><td>viewer</td><td>조회자</td><td>viewer</td><td>만료</td></tr>
                                </tbody>
                            </table>
                        </section>
                    </div>
                    <div class="owner-demo-panel is-single" data-owner-demo-panel="repository">
                        <section class="owner-demo-section">
                            <div class="owner-demo-section-head">
                                <div>
                                    <h3>Repository Map</h3>
                                    <p>저장소 구조와 주요 런타임 파일을 빠르게 훑어보는 영역입니다.</p>
                                </div>
                            </div>
                            <iframe
                                class="owner-demo-map-frame"
                                src="/owner/repository-map?maxDepth=50&demo=1"
                                title="Owner repository map demo"
                                loading="eager"
                            ></iframe>
                        </section>
                    </div>
                </div>
            </section>
        `;
    }

    function buildOwnerDemoContent() {
        return `
            ${OWNER_DEMO_STYLE_HTML}
            <div class="owner-demo-shell" data-owner-demo-root>
                <div class="owner-demo-page">
                    <header class="owner-demo-hero">
                        <div>
                            <p class="owner-demo-eyebrow">KPI OPERATIONS COMMANDS</p>
                            <h2 class="owner-demo-title">KPI 운영 콘솔 시연</h2>
                            <p class="owner-demo-summary">오너 PC 전용 콘솔이 열리지 않는 자리에서도 기능 구성을 설명할 수 있는 정적 미리보기입니다.</p>
                            <div class="owner-demo-meta">
                                <span class="owner-demo-chip">KPI 운영 <strong>3100</strong></span>
                                <span class="owner-demo-chip">DB <strong>5434</strong></span>
                                <span class="owner-demo-chip">검증 <strong>3192</strong></span>
                                <span class="owner-demo-chip"><strong>시연 전용</strong> 실제 명령 미실행</span>
                            </div>
                        </div>
                        <div class="owner-demo-actions">
                            <button class="owner-demo-button" type="button" disabled>한국어</button>
                            <button class="owner-demo-button" type="button" disabled>상태 새로고침</button>
                            <button class="owner-demo-button is-primary" type="button" disabled>KPI 로그인 열기</button>
                        </div>
                    </header>
                    <main class="owner-demo-main">
                        <section class="owner-demo-status-grid" aria-label="오너 콘솔 상태 요약">
                            ${buildOwnerDemoStatusCardsHtml()}
                        </section>
                        ${buildOwnerDemoWorkbenchHtml()}
                    </main>
                </div>
            </div>
        `;
    }

    function buildOwnerDemoCategory() {
        return {
            title: '오너 전용 (시연)',
            desc: '실제 오너 콘솔을 열 수 없는 자리에서 기능 구성을 보여주는 정적 시연 화면입니다.',
            icon: 'fa-shield-halved',
            color: '#7c3aed',
            dataKey: OWNER_DEMO_CATEGORY_KEY,
            view: OWNER_DEMO_CATEGORY_KEY,
            viewerMode: 'full-bleed',
            content: buildOwnerDemoContent()
        };
    }

    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.owner = function buildOwnerSection() {
        const consoleUrl = getOwnerConsoleUrl();
        return {
            id: 'owner',
            name: '\uC624\uB108 \uC804\uC6A9',
            icon: 'fa-shield-halved',
            color: 'violet',
            accent: '#7c3aed',
            ownerOnly: true,
            directLaunch: true,
            launchUrl: consoleUrl,
            launchTarget: 'popup',
            launchWindowName: OWNER_POPUP_WINDOW_NAME,
            launchWindowWidth: 1540,
            launchWindowHeight: 980,
            desc: '\uC624\uB108 \uC804\uC6A9 \uC6B4\uC601 \uCF58\uC194\uC744 \uC0C8 \uCC3D\uC73C\uB85C \uC5FD\uB2C8\uB2E4.',
            categories: [
                buildOwnerDemoCategory()
            ]
        };
    };

    window.KpiOwnerConsoleBridge = {
        getUrl: getOwnerConsoleUrl,
        open(tab = 'server') {
            return window.KpiOpenOwnerToolWindow?.(
                getOwnerConsoleUrl(OPS_CONSOLE_DEFAULT_PORT, tab),
                'KPI operations console',
                OWNER_POPUP_WINDOW_NAME
            );
        }
    };
})();
