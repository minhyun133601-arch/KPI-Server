(function () {
    function buildUtilityDataEntryContent() {
        return `
            <div class="work-metering-embed-shell">
                <div class="work-metering-embed-host" data-kpi-metering-root>
                    <div class="work-metering-loading">검침 화면을 준비하고 있습니다.</div>
                </div>
            </div>
        `;
    }

    function buildUtilityAnalysisContent() {
        return `
            <div class="util-sheet-stack">
                <div class="util-sheet-panel is-overview" data-role="util-report-panel">
                    <div class="util-sheet-header">
                        <div class="util-sheet-title-block">
                            <div class="util-sheet-title-row">
                                <span class="util-sheet-title-icon is-overview" aria-hidden="true"><i class="fa-solid fa-chart-pie"></i></span>
                                <div class="util-report-title">총괄 비율</div>
                            </div>
                        </div>
                        <div class="util-sheet-actions">
                            <button type="button" class="work-btn primary" data-role="util-report-open-modal"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>이동</span></button>
                        </div>
                    </div>
                </div>
                <div class="util-sheet-panel is-meter is-combined" data-role="util-sheet-panel" data-sheet-type="meter" data-dataset-key="gas">
                    <div class="util-sheet-header">
                        <div class="util-sheet-title-block">
                            <div class="util-sheet-kicker">가스 통합 리포트</div>
                            <div class="util-sheet-title-row">
                                <span class="util-sheet-title-icon is-meter" data-role="util-sheet-panel-icon" aria-hidden="true"><i class="fa-solid fa-file-lines"></i></span>
                                <div class="util-report-title" data-role="util-sheet-panel-title">가스 검침표</div>
                            </div>
                            <div class="util-report-desc" data-role="util-sheet-panel-desc">가스 검침표와 분석표를 같은 모달 안에서 전환합니다.</div>
                        </div>
                        <div class="util-sheet-actions">
                            <div class="util-sheet-toggle" data-role="util-sheet-type-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-type-select" data-sheet-type="meter" aria-label="리포트 유형 전환">
                                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                                    <span>검침표</span>
                                </button>
                            </div>
                            <div class="util-sheet-toggle" data-role="util-sheet-dataset-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-select" data-dataset-key="gas" aria-label="리포트 항목 전환">
                                    <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
                                    <span>가스비</span>
                                </button>
                            </div>
                            <div class="util-sheet-month-field">
                                <select class="util-sheet-month-select" data-role="util-sheet-month" aria-label="리포트 기준월"></select>
                            </div>
                            <button type="button" class="work-btn primary" data-role="util-sheet-open"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>이동</span></button>
                        </div>
                    </div>
                    <div class="util-report-kpi-grid" data-role="util-sheet-preview" hidden></div>
                    <div class="util-report-preview-note" data-role="util-sheet-note" hidden></div>
                </div>
                <div class="util-sheet-panel is-meter is-combined" data-role="util-sheet-panel" data-sheet-type="meter" data-dataset-key="electric">
                    <div class="util-sheet-header">
                        <div class="util-sheet-title-block">
                            <div class="util-sheet-kicker">전기 통합 리포트</div>
                            <div class="util-sheet-title-row">
                                <span class="util-sheet-title-icon is-meter" data-role="util-sheet-panel-icon" aria-hidden="true"><i class="fa-solid fa-file-lines"></i></span>
                                <div class="util-report-title" data-role="util-sheet-panel-title">전기 검침표</div>
                            </div>
                            <div class="util-report-desc" data-role="util-sheet-panel-desc">전기 검침표와 분석표를 같은 모달 안에서 전환합니다.</div>
                        </div>
                        <div class="util-sheet-actions">
                            <div class="util-sheet-toggle" data-role="util-sheet-type-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-type-select" data-sheet-type="meter" aria-label="리포트 유형 전환">
                                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                                    <span>검침표</span>
                                </button>
                            </div>
                            <div class="util-sheet-toggle" data-role="util-sheet-dataset-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-select" data-dataset-key="electric" aria-label="리포트 항목 전환">
                                    <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                                    <span>전기비</span>
                                </button>
                            </div>
                            <div class="util-sheet-month-field">
                                <select class="util-sheet-month-select" data-role="util-sheet-month" aria-label="리포트 기준월"></select>
                            </div>
                            <button type="button" class="work-btn primary" data-role="util-sheet-open"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>이동</span></button>
                        </div>
                    </div>
                    <div class="util-report-kpi-grid" data-role="util-sheet-preview" hidden></div>
                    <div class="util-report-preview-note" data-role="util-sheet-note" hidden></div>
                </div>
                <div class="util-sheet-panel is-meter is-combined" data-role="util-sheet-panel" data-sheet-type="meter" data-dataset-key="waste">
                    <div class="util-sheet-header">
                        <div class="util-sheet-title-block">
                            <div class="util-sheet-kicker">폐수 통합 리포트</div>
                            <div class="util-sheet-title-row">
                                <span class="util-sheet-title-icon is-meter" data-role="util-sheet-panel-icon" aria-hidden="true"><i class="fa-solid fa-file-lines"></i></span>
                                <div class="util-report-title" data-role="util-sheet-panel-title">폐수 검침표</div>
                            </div>
                            <div class="util-report-desc" data-role="util-sheet-panel-desc">폐수 검침표와 분석표를 같은 모달 안에서 전환합니다.</div>
                        </div>
                        <div class="util-sheet-actions">
                            <div class="util-sheet-toggle" data-role="util-sheet-type-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-type-select" data-sheet-type="meter" aria-label="리포트 유형 전환">
                                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                                    <span>검침표</span>
                                </button>
                            </div>
                            <div class="util-sheet-toggle" data-role="util-sheet-dataset-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-select" data-dataset-key="waste" aria-label="리포트 항목 전환">
                                    <i class="fa-solid fa-water" aria-hidden="true"></i>
                                    <span>폐수</span>
                                </button>
                            </div>
                            <div class="util-sheet-month-field">
                                <select class="util-sheet-month-select" data-role="util-sheet-month" aria-label="리포트 기준월"></select>
                            </div>
                            <button type="button" class="work-btn primary" data-role="util-sheet-open"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>이동</span></button>
                        </div>
                    </div>
                    <div class="util-report-kpi-grid" data-role="util-sheet-preview" hidden></div>
                    <div class="util-report-preview-note" data-role="util-sheet-note" hidden></div>
                </div>
            </div>
        `;
    }

    KpiSectionFactoryAdapter.registerBuilder('buildUtilityDataEntryContent', buildUtilityDataEntryContent);
    KpiSectionFactoryAdapter.registerBuilder('buildUtilityAnalysisContent', buildUtilityAnalysisContent);
})();
