(function () {
function buildAreaMapToolsMarkup(options = {}) {
        const showTableToggle = options.showTableToggle === true;
        const simpleUi = options.simpleUi === true;
        if (simpleUi) {
            return `
                <div class="area-map-actions">
                    <div class="area-map-tools">
                        <div class="area-palette-group">
                            <button class="area-tool primary" data-area-action="toggle-drawing" data-area-drawing-toggle title="PDF 또는 JPG 도면 삽입">
                                <i class="fas fa-file-arrow-up"></i>
                                <span data-area-drawing-label>도면 삽입</span>
                            </button>
                            <select class="area-block-select" data-area-block-select aria-label="추가할 설비 블록 선택">
                                <option value="tank">Tank</option>
                                <option value="pump">Pump</option>
                                <option value="valve">Valve</option>
                                <option value="custom">Custom</option>
                                <option value="motor">Motor</option>
                                <option value="compressor">Comp</option>
                                <option value="boiler">Boiler</option>
                                <option value="mixer">Mixer</option>
                                <option value="agitator">Agitator</option>
                                <option value="chiller">Chiller</option>
                            </select>
                            <button class="area-tool palette-btn" data-area-action="add-block" title="선택한 블록 추가">
                                <i class="fas fa-plus-circle"></i>
                                추가
                            </button>
                        </div>
                        <div class="area-palette-group" data-area-selection-tools hidden>
                            <button class="area-tool danger" data-area-action="delete" title="선택 블록 삭제">
                                <i class="fas fa-trash"></i>
                                블록 삭제
                            </button>
                            <button class="area-tool" data-area-action="resize-down" title="선택 블록 작게">
                                <i class="fas fa-minus"></i>
                                작게
                            </button>
                            <button class="area-tool" data-area-action="resize-up" title="선택 블록 크게">
                                <i class="fas fa-plus"></i>
                                크게
                            </button>
                        </div>
                        <div class="area-palette-group">
                            <button class="area-tool" data-area-action="zoom-in" title="도면 확대">
                                <i class="fas fa-magnifying-glass-plus"></i>
                                확대
                            </button>
                            <button class="area-tool" data-area-action="zoom-out" title="도면 축소">
                                <i class="fas fa-magnifying-glass-minus"></i>
                                축소
                            </button>
                        </div>
                    </div>
                    <div class="area-map-status" data-area-status>도면 미삽입 · 블록 미선택</div>
                    <input type="file" hidden data-area-drawing-input accept=".pdf,.jpg,.jpeg,.png,.svg,image/*,application/pdf">
                    <input type="file" hidden data-area-marker-link-input accept=".pdf,.jpg,.jpeg,.png,.svg,image/*,application/pdf">
                </div>
            `;
        }
        return `
            <div class="area-map-actions">
                <div class="area-map-tools">
                    <button class="area-tool palette-toggle" data-area-action="toggle-palette" aria-expanded="true" title="Tab 키로 설비 추가키 열기/닫기">
                        <i class="fas fa-keyboard"></i>
                        설비키
                    </button>
                    <div class="area-palette-group" data-area-palette>
                        <span class="area-palette-label">블록 추가:</span>
                        <select class="area-block-select" data-area-block-select aria-label="추가할 설비 블록 선택">
                            <option value="tank">Tank</option>
                            <option value="pump">Pump</option>
                            <option value="valve">Valve</option>
                            <option value="custom">Custom</option>
                            <option value="motor">Motor</option>
                            <option value="compressor">Comp</option>
                            <option value="boiler">Boiler</option>
                            <option value="mixer">Mixer</option>
                            <option value="agitator">Agitator</option>
                            <option value="chiller">Chiller</option>
                        </select>
                        <button class="area-tool palette-btn" data-area-action="add-block" title="선택한 블록 추가">
                            <i class="fas fa-plus-circle"></i>
                            추가
                        </button>
                    </div>
                    <div class="area-palette-group">
                        <button class="area-tool" data-area-action="save" title="현재 배치 저장">
                            <i class="fas fa-floppy-disk"></i>
                            저장
                        </button>
                        <button class="area-tool" data-area-action="export-json" title="JSON 저장">
                            <i class="fas fa-file-export"></i>
                            저장
                        </button>
                    </div>
                    <button class="area-tool" data-area-action="zoom-in" title="확대">
                        <i class="fas fa-magnifying-glass-plus"></i>
                        확대
                    </button>
                    <button class="area-tool" data-area-action="zoom-out" title="축소">
                        <i class="fas fa-magnifying-glass-minus"></i>
                        축소
                    </button>
                    <button class="area-tool" data-area-action="restore" title="복구">
                        <i class="fas fa-rotate-left"></i>
                        복구
                    </button>
                    <button class="area-tool danger" data-area-action="delete" title="선택 삭제">
                        <i class="fas fa-trash"></i>
                        삭제
                    </button>
                    <button class="area-tool ghost" data-area-action="delete-mode" aria-pressed="false" title="클릭 삭제 모드">
                        <i class="fas fa-crosshairs"></i>
                        삭제 모드
                    </button>
                </div>
                ${showTableToggle ? `
                    <button class="area-table-toggle" onclick="toggleAreaTable(this)" aria-expanded="false">
                        <i class="fas fa-table"></i>
                        면적표
                    </button>
                ` : ''}
            </div>
        `;
    }

    function buildEquipAreaContent(options = {}) {
        const guideTitle = options.guideTitle || '설비 이력 입력 안내';
        const guideDesc = options.guideDesc || '본 섹션에는 해당 공정/팀 설비의 설치·개조·점검·보수 이력을 공식 기록으로 관리합니다.';
        const guidePath = options.guidePath || '';
        const shellId = options.shellId;
        const templateId = options.templateId;
        const mapTitle = options.mapTitle || '설비 배치도';
        const mapSub = options.mapSub || '설비 블록 추가/이동/삭제를 지원합니다.';
        const mapHint = options.mapHint || '클릭 선택 → 드래그 이동 · 우클릭 카드 연결 · Delete 삭제 · 크게/작게 크기 조절';
        const toolsHtml = buildAreaMapToolsMarkup({ showTableToggle: false, simpleUi: true });
        return `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h3 class="text-slate-800 font-semibold text-base">${guideTitle}</h3>
                <p class="mt-2 text-sm text-slate-600">${guideDesc}</p>
                <ul class="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                    <li>설비명, 위치/라인, 모델·자산번호</li>
                    <li>작업일자, 작업유형(점검/보수/교체/개선), 작업 내용</li>
                    <li>작업 결과, 정지 시간, 비용·부품 사용 내역</li>
                    <li>담당자/검토자, 증빙자료(점검표, 사진, 보고서)</li>
                </ul>
                <div class="mt-3 text-xs text-slate-500">입력 위치: ${guidePath}</div>
            </div>
            <div class="area-map-shell mt-4" id="${shellId}" data-area-ui="simple">
                <div class="area-map-card">
                    <div class="area-map-header">
                        <div>
                            <div class="area-map-kicker">Area Map</div>
                            <div class="area-map-title">${mapTitle}</div>
                            <div class="area-map-sub">${mapSub}</div>
                            <div class="area-map-hint">${mapHint}</div>
                        </div>
                        ${toolsHtml}
                    </div>
                    <div class="area-map-frame">
                        <div class="area-map-canvas" data-area-map-canvas data-area-template="${templateId}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function buildWorkDataEntryContent() {
        return `
            <div class="work-metering-embed-shell">
                <div class="work-metering-embed-host" data-kpi-metering-root>
                    <div class="work-metering-loading">검침 화면을 준비하고 있습니다.</div>
                </div>
            </div>
        `;
    }

    window.KpiSectionBuilders = Object.freeze({
        buildAreaMapToolsMarkup,
        buildEquipAreaContent,
        buildWorkDataEntryContent
    });
})();
