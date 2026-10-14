(function () {
    const api = KpiDataEquipmentHistoryBrowserAdapter.getApi();
    const PREVENTIVE_MAINTENANCE_MONTHS = Object.freeze(
        Array.from({ length: 12 }, (_, index) => `${index + 1}월`)
    );

    function getPreventiveMaintenanceMonths(value) {
        const normalized = api.normalizeAnnualMaintenanceExecutionMonthValue(value);
        if (normalized === '매월') return PREVENTIVE_MAINTENANCE_MONTHS.map((_, index) => index + 1);
        if (!/^\d{1,2}월(?:, \d{1,2}월)*$/.test(normalized)) return [];
        return normalized.split(', ').map((month) => Number(month.replace('월', '')));
    }

    function getPreventiveMaintenancePlan(teamKey, data) {
        const normalizedKey = api.resolveEquipmentHistoryTeamDataKey?.(teamKey) || api.normalizeText(teamKey);
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(normalizedKey) || {};
        const equipment = api.normalizeEquipmentItems(data).filter((item) => (
            (api.resolveEquipmentHistoryTeamDataKey(item.teamDataKey || item.team) || item.teamDataKey) === normalizedKey
        ));
        const items = equipment.flatMap((item) => api.asList(item.annualMaintenancePlan)
            .map((row) => api.normalizeAnnualMaintenancePlanRow(row, item.name))
            .filter((row) => api.ANNUAL_MAINTENANCE_PLAN_FIELDS.some((field) => (
                field.key !== 'equipmentName' && api.normalizeText(row[field.key])
            )))
            .map((row) => ({
                ...row,
                equipmentId: item.id,
                group: api.normalizeText(item.maintenanceCategory) || '설비 카테고리 미지정',
                equipment: item.displayName || item.name,
                task: row.maintenanceItem,
                note: row.inspectionNotes,
                months: getPreventiveMaintenanceMonths(row.executionMonth),
            })));
        return {
            teamKey: normalizedKey,
            year: new Date().getFullYear(),
            title: `${teamMeta.title || '해당 팀'} 설비별 예방 정비와 정비 이력`,
            equipment,
            categoryOptions: api.getEquipmentMaintenanceCategoryOptions(data, normalizedKey),
            items,
        };
    }

    function getPreventiveMaintenanceSummary(plan) {
        const items = api.asList(plan?.items);
        const monthlyCounts = PREVENTIVE_MAINTENANCE_MONTHS.map((_, index) => (
            items.filter((item) => api.asList(item?.months).includes(index + 1)).length
        ));
        const peakCount = Math.max(...monthlyCounts, 0);
        return {
            equipmentCount: api.asList(plan?.equipment).length,
            itemCount: items.length,
            scheduleCount: monthlyCounts.reduce((total, count) => total + count, 0),
            unassignedCount: items.filter((item) => !api.asList(item?.months).length).length,
            monthlyCounts,
            peakCount,
            peakMonth: peakCount ? monthlyCounts.indexOf(peakCount) + 1 : 0,
        };
    }

    function getPreventiveMaintenanceState(state) {
        if (!state.preventiveMaintenance || typeof state.preventiveMaintenance !== 'object') {
            state.preventiveMaintenance = { teamKey: '', month: 'all', equipmentId: '' };
        }
        return state.preventiveMaintenance;
    }

    function normalizePreventiveMaintenanceMonth(value) {
        const raw = api.normalizeText(value);
        if (!raw || raw === 'all') return 'all';
        if (raw === 'unassigned') return raw;
        const month = Number(raw);
        return Number.isInteger(month) && month >= 1 && month <= 12 ? String(month) : 'all';
    }

    function openPreventiveMaintenance(state, teamKey) {
        const viewState = getPreventiveMaintenanceState(state);
        viewState.teamKey = api.resolveEquipmentHistoryTeamDataKey?.(teamKey) || api.normalizeText(teamKey);
        viewState.month = 'all';
        viewState.equipmentId = '';
        return viewState.teamKey;
    }

    function closePreventiveMaintenance(state) {
        const viewState = getPreventiveMaintenanceState(state);
        viewState.teamKey = '';
        viewState.month = 'all';
        viewState.equipmentId = '';
    }

    function setPreventiveMaintenanceMonth(state, month) {
        getPreventiveMaintenanceState(state).month = normalizePreventiveMaintenanceMonth(month);
    }

    function renderPreventiveMaintenanceButton(teamKey, teamName, items = []) {
        const normalizedKey = api.resolveEquipmentHistoryTeamDataKey(teamKey) || api.normalizeText(teamKey);
        const itemCount = api.asList(items).filter((item) => (
            api.resolveEquipmentHistoryTeamDataKey(item.teamDataKey || item.team) === normalizedKey
        )).length;
        const label = `${teamName || api.getEquipmentHistoryTeamMeta?.(teamKey)?.title || '팀'} 예방 정비 열기`;
        return `
            <button type="button" class="data-equipment-preventive-open" data-equipment-preventive-maintenance-team="${api.escapeHtml(teamKey)}" aria-label="${api.escapeHtml(label)}" title="${api.escapeHtml(label)}">
                <i class="fas fa-calendar-check" aria-hidden="true"></i>
                <span>예방 정비</span>
                <small>${api.escapeHtml(itemCount)}</small>
            </button>
        `;
    }

    function renderPreventiveMaintenanceMetrics(summary) {
        return `
            <div class="data-equipment-preventive-metrics" aria-label="예방 정비 계획 요약">
                <article><span>팀 설비</span><strong>${api.escapeHtml(summary.equipmentCount)}<small>대</small></strong></article>
                <article><span>정비 계획</span><strong>${api.escapeHtml(summary.itemCount)}<small>건</small></strong></article>
                <article><span>월별 예정 작업</span><strong>${api.escapeHtml(summary.scheduleCount)}<small>회</small></strong></article>
                <article class="${summary.unassignedCount ? 'has-warning' : ''}"><span>실시월 미정·필요 시</span><strong>${api.escapeHtml(summary.unassignedCount)}<small>건</small></strong></article>
            </div>
        `;
    }

    function renderPreventiveMaintenanceMonthChart(summary, selectedMonth, year) {
        const maxCount = Math.max(...summary.monthlyCounts, 1);
        const now = new Date();
        const currentMonth = now.getFullYear() === Number(year) ? now.getMonth() + 1 : 0;
        return `
            <section class="data-equipment-preventive-chart" aria-labelledby="equipment-preventive-chart-title">
                <div class="data-equipment-preventive-section-heading">
                    <div>
                        <span>월을 선택하면 계획 내용만 표시됩니다.</span>
                        <h3 id="equipment-preventive-chart-title">월별 예방정비 계획</h3>
                    </div>
                    <div class="data-equipment-preventive-chart-actions">
                        <button type="button" data-equipment-preventive-month="all" aria-pressed="${selectedMonth === 'all'}" class="${selectedMonth === 'all' ? 'is-active' : ''}">전체 실시월</button>
                        ${summary.unassignedCount ? `<button type="button" data-equipment-preventive-month="unassigned" aria-pressed="${selectedMonth === 'unassigned'}" class="${selectedMonth === 'unassigned' ? 'is-active' : ''}">미정·필요 시 ${api.escapeHtml(summary.unassignedCount)}</button>` : ''}
                    </div>
                </div>
                <div class="data-equipment-preventive-month-chart">
                    ${PREVENTIVE_MAINTENANCE_MONTHS.map((label, index) => {
                        const month = index + 1;
                        const count = summary.monthlyCounts[index];
                        const isSelected = selectedMonth === String(month);
                        const level = Math.max(8, Math.round((count / maxCount) * 100));
                        return `
                            <button type="button" class="${isSelected ? 'is-active ' : ''}${month === currentMonth ? 'is-current' : ''}" data-equipment-preventive-month="${month}" aria-pressed="${isSelected}" aria-label="${api.escapeHtml(`${label} 계획 ${count}건${month === currentMonth ? ', 현재 월' : ''}`)}" style="--preventive-month-level:${level}%">
                                <strong>${api.escapeHtml(count)}</strong>
                                <span class="data-equipment-preventive-month-bar" aria-hidden="true"><i></i></span>
                                <small>${api.escapeHtml(label)}</small>
                            </button>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    function getFilteredPreventiveMaintenanceItems(plan, selectedMonth) {
        const items = api.asList(plan?.items);
        if (selectedMonth === 'all') return items;
        if (selectedMonth === 'unassigned') return items.filter((item) => !api.asList(item?.months).length);
        return items.filter((item) => api.asList(item?.months).includes(Number(selectedMonth)));
    }

    function groupPreventiveMaintenanceItems(items) {
        const groups = [];
        api.asList(items).forEach((item) => {
            const category = api.getEquipmentMaintenanceCategory(item);
            const title = category.label || '설비 카테고리 미지정';
            let group = groups.find((candidate) => candidate.key === category.key);
            if (!group) {
                group = { key: category.key, title, items: [] };
                groups.push(group);
            }
            group.items.push(item);
        });
        return groups;
    }

    function renderPreventiveMaintenanceRecords(rows, fields, emptyMessage, label) {
        if (!rows.length) return `<p class="data-equipment-preventive-record-empty">${api.escapeHtml(emptyMessage)}</p>`;
        return `
            <div class="data-equipment-preventive-table-scroll">
                <table class="data-equipment-preventive-record-table" aria-label="${api.escapeHtml(label)}">
                    <thead><tr>${fields.map((field) => `<th scope="col">${api.escapeHtml(field.label)}</th>`).join('')}</tr></thead>
                    <tbody>${rows.map((row) => `<tr>${fields.map((field) => `<td>${api.escapeHtml(row[field.key] || '-')}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    }

    function renderPreventiveMaintenanceTable(plan, selectedMonth, state = {}) {
        const plans = getFilteredPreventiveMaintenanceItems(plan, selectedMonth);
        const equipment = api.asList(plan.equipment);
        const groups = groupPreventiveMaintenanceItems(equipment);
        const categories = plan.categoryOptions || api.getEquipmentMaintenanceCategoryOptions({ equipmentList: equipment }, plan.teamKey);
        const categoryDrafts = state.preventiveCategoryDrafts || {};
        const selectedLabel = selectedMonth === 'all' ? '전체 실시월' : selectedMonth === 'unassigned' ? '실시월 미정·필요 시' : `${selectedMonth}월`;
        return `
            <section class="data-equipment-preventive-list" aria-labelledby="equipment-preventive-list-title">
                <div class="data-equipment-preventive-section-heading">
                    <div><span>${api.escapeHtml(`팀 전체 ${equipment.length}대 · ${selectedLabel} 계획`)}</span><h3 id="equipment-preventive-list-title">설비 목록</h3></div>
                    <button type="button" class="data-equipment-preventive-action" data-equipment-maintenance-batch-team="${api.escapeHtml(plan.teamKey)}" aria-label="같은 카테고리 설비에 정비 이력 일괄 작성"><i class="fas fa-plus" aria-hidden="true"></i> 일괄 작성</button>
                </div>
                <p class="data-equipment-preventive-message">카테고리를 입력하거나 선택한 뒤 저장하세요.</p>
                <datalist id="equipment-preventive-list-category-options">${categories.map((label) => `<option value="${api.escapeHtml(label)}"></option>`).join('')}</datalist>
                ${state.preventiveCategoryMessage ? `<p class="data-equipment-preventive-message" role="status">${api.escapeHtml(state.preventiveCategoryMessage)}</p>` : ''}
                ${groups.length ? groups.map((group) => `
                    <section class="data-equipment-preventive-equipment-group">
                        <h4>${api.escapeHtml(group.title)}<small>${api.escapeHtml(group.items.length)}대</small></h4>
                        ${group.items.map((item) => {
                            const itemPlans = plans.filter((row) => row.equipmentId === item.id);
                            const history = api.asList(item.maintenanceHistory).filter((row) => api.MAINTENANCE_FIELDS.some((field) => api.normalizeText(row?.[field.key])));
                            const name = item.displayName || item.name;
                            const location = [item.room, item.process || item.group].filter(Boolean).join(' · ');
                            const categoryValue = Object.hasOwn(categoryDrafts, item.id) ? categoryDrafts[item.id] : item.maintenanceCategory || '';
                            const hasPlans = api.asList(plan.items).some((row) => row.equipmentId === item.id);
                            const emptyPlanMessage = !hasPlans || selectedMonth === 'all' ? '등록된 예방정비 계획이 없습니다.' : `${selectedLabel} 예방정비 계획이 없습니다.`;
                            return `
                                <article class="data-equipment-preventive-equipment" data-equipment-preventive-equipment="${api.escapeHtml(item.id)}">
                                    <header>
                                        <div><h5>${api.escapeHtml(name)}</h5>${item.equipmentCode || location ? `<p>${api.escapeHtml([item.equipmentCode, location].filter(Boolean).join(' · '))}</p>` : ''}</div>
                                        <div class="data-equipment-preventive-inline-category">
                                            <div class="data-equipment-preventive-category-field"><label for="preventive-category-${api.escapeHtml(encodeURIComponent(item.id))}">설비 카테고리</label>${api.renderEquipmentCategoryCombobox(categoryValue, {
                                                id: `preventive-category-${encodeURIComponent(item.id)}`, label: `${name} 설비 카테고리`,
                                                listId: 'equipment-preventive-list-category-options', disabled: state.equipmentMaintenanceSaving,
                                                attrs: `data-equipment-preventive-category="${api.escapeHtml(item.id)}"`,
                                            })}</div>
                                            <button type="button" class="data-equipment-preventive-action" data-equipment-preventive-category-save="${api.escapeHtml(item.id)}" aria-label="${api.escapeHtml(`${name} 카테고리 저장`)}"${state.equipmentMaintenanceSaving ? ' disabled' : ''}>저장</button>
                                            <button type="button" class="data-equipment-preventive-action" data-equipment-preventive-edit="${api.escapeHtml(item.id)}" aria-label="${api.escapeHtml(`${name} 계획·이력 작성`)}">계획·이력 작성</button>
                                        </div>
                                    </header>
                                    <details class="data-equipment-preventive-record-details" data-equipment-preventive-record-details="${api.escapeHtml(item.id)}"${state.preventiveRecordDetails?.[item.id] === true ? ' open' : ''}>
                                        <summary>기록 보기 <span>예방정비 ${api.escapeHtml(itemPlans.length)}건 · 정비 이력 ${api.escapeHtml(history.length)}건</span></summary>
                                        <div class="data-equipment-preventive-records">
                                        <section><h6>예방정비 계획 <span>${api.escapeHtml(itemPlans.length)}건</span></h6>${renderPreventiveMaintenanceRecords(itemPlans, api.ANNUAL_MAINTENANCE_PLAN_FIELDS.slice(1), emptyPlanMessage, `${name} 예방정비 계획`)}</section>
                                        <section><h6>정비 이력 <span>${api.escapeHtml(history.length)}건</span></h6>${renderPreventiveMaintenanceRecords(history, api.MAINTENANCE_FIELDS, '등록된 정비 이력이 없습니다.', `${name} 정비 이력`)}</section>
                                        </div>
                                    </details>
                                </article>
                            `;
                        }).join('')}
                    </section>
                `).join('') : '<p class="data-equipment-preventive-record-empty">등록된 설비가 없습니다.</p>'}
            </section>
        `;
    }

    function renderPreventiveMaintenanceEmpty(teamName) {
        return `
            <section class="data-equipment-preventive-empty">
                <span class="data-equipment-preventive-empty-icon" aria-hidden="true"><i class="fas fa-gears"></i></span>
                <strong>${api.escapeHtml(teamName)}에 등록된 설비가 없습니다.</strong>
                <p>팀 설비 목록에 설비를 추가하면 예방 정비와 정비 이력을 작성할 수 있습니다.</p>
            </section>
        `;
    }

    function renderPreventiveMaintenanceEditor(state, item, data) {
        const draft = state.draft?.id === item.id ? state.draft : api.createDraft(item);
        const categories = api.getEquipmentMaintenanceCategoryOptions(data, item.teamDataKey);
        return `
            <form class="data-equipment-preventive-editor" data-equipment-form aria-label="${api.escapeHtml(`${item.displayName || item.name} 예방 정비와 정비 이력 작성`)}">
                <div class="data-equipment-preventive-editor-heading">
                    <div><h3>${api.escapeHtml(item.displayName || item.name)}</h3><p>작성한 내용은 팀 목록과 설비 카드에 함께 반영됩니다.</p></div>
                    <button type="button" class="data-equipment-preventive-action" data-equipment-save${state.equipmentMaintenanceSaving ? ' disabled' : ''}>${state.equipmentMaintenanceSaving ? '저장 중…' : '저장'}</button>
                </div>
                <div class="data-equipment-preventive-category-field"><label for="preventive-editor-category">설비 카테고리</label>${api.renderEquipmentCategoryCombobox(draft.maintenanceCategory, {
                    id: 'preventive-editor-category', listId: 'equipment-preventive-category-options',
                    attrs: 'data-equipment-field="maintenanceCategory"', disabled: state.equipmentMaintenanceSaving,
                })}<small>원하는 카테고리 이름을 직접 입력하거나 기존 이름을 선택하세요.</small></div>
                <datalist id="equipment-preventive-category-options">${categories.map((label) => `<option value="${api.escapeHtml(label)}"></option>`).join('')}</datalist>
                <article class="data-equipment-card data-equipment-annual-plan-card">
                    <h3 class="data-equipment-section-title">예방정비 계획
                        <span class="data-equipment-preventive-editor-actions">
                            <button type="button" class="data-equipment-add-row" data-equipment-add-row="annualMaintenancePlan"><i class="fas fa-plus" aria-hidden="true"></i><span>추가</span></button>
                            <button type="button" class="data-equipment-add-row" data-equipment-maintenance-batch="annualMaintenancePlan" aria-label="같은 카테고리 설비에 예방정비 계획 일괄 작성">일괄 작성</button>
                        </span>
                    </h3>
                    <div class="data-equipment-table-scroll">${api.renderAnnualMaintenancePlanEditor(draft.annualMaintenancePlan, draft.name)}</div>
                </article>
                <article class="data-equipment-card data-equipment-history-card">
                    <h3 class="data-equipment-section-title">정비 이력
                        <span class="data-equipment-preventive-editor-actions">
                            <button type="button" class="data-equipment-add-row" data-equipment-add-row="maintenanceHistory"><i class="fas fa-plus" aria-hidden="true"></i><span>추가</span></button>
                            <button type="button" class="data-equipment-add-row" data-equipment-maintenance-batch="maintenanceHistory" aria-label="같은 카테고리 설비에 정비 이력 일괄 작성">일괄 작성</button>
                        </span>
                    </h3>
                    <div class="data-equipment-table-scroll">${api.renderMaintenanceEditor(draft.maintenanceHistory)}</div>
                </article>
                ${state.message ? `<p class="data-equipment-preventive-message" role="status">${api.escapeHtml(state.message)}</p>` : ''}
            </form>
        `;
    }

    function renderPreventiveMaintenanceDialog(state, data) {
        const viewState = getPreventiveMaintenanceState(state);
        if (!viewState.teamKey) return '';
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(viewState.teamKey) || {};
        const teamName = teamMeta.title || viewState.teamKey;
        const plan = getPreventiveMaintenancePlan(viewState.teamKey, data);
        const summary = getPreventiveMaintenanceSummary(plan);
        const selectedMonth = normalizePreventiveMaintenanceMonth(viewState.month);
        const selectedEquipment = plan.equipment.find((item) => item.id === viewState.equipmentId);
        const boardTeamStyle = typeof api.getBoardTeamStyle === 'function' ? api.getBoardTeamStyle(teamMeta) : '';
        const teamAccent = api.getSafeBoardTeamColor?.(teamMeta.color, '#4b5563') || '#4b5563';
        const teamStyle = `${boardTeamStyle}--equipment-history-team-accent:${api.escapeHtml(teamAccent)};`;
        return `
            <div class="data-equipment-preventive-dialog" data-equipment-preventive-dialog role="dialog" aria-modal="true" aria-labelledby="equipment-preventive-dialog-title" tabindex="-1" style="${teamStyle}">
                <button type="button" class="data-equipment-preventive-backdrop" data-equipment-preventive-close aria-label="예방 정비 화면 닫기" tabindex="-1"></button>
                <section class="data-equipment-preventive-panel">
                    <header>
                        <div class="data-equipment-preventive-title">
                            <span class="data-equipment-preventive-title-icon" aria-hidden="true"><i class="fas fa-calendar-check"></i></span>
                            <div><span>${api.escapeHtml(teamName)}</span><h2 id="equipment-preventive-dialog-title">팀 전체 예방정비</h2><p>${api.escapeHtml(plan.title)}</p></div>
                        </div>
                        <div class="data-equipment-preventive-header-meta">
                            ${selectedEquipment ? '<button type="button" class="data-equipment-preventive-list-back" data-equipment-preventive-list>설비 목록</button>' : ''}
                            <button type="button" data-equipment-preventive-close aria-label="${api.escapeHtml(`${teamName} 예방 정비 닫기`)}" title="닫기"><i class="fas fa-xmark" aria-hidden="true"></i></button>
                        </div>
                    </header>
                    <div class="data-equipment-preventive-content">
                        ${selectedEquipment ? renderPreventiveMaintenanceEditor(state, selectedEquipment, data) : summary.equipmentCount ? `
                            ${renderPreventiveMaintenanceTable(plan, selectedMonth, state)}
                            ${renderPreventiveMaintenanceMetrics(summary)}
                            ${renderPreventiveMaintenanceMonthChart(summary, selectedMonth, plan.year)}
                        ` : renderPreventiveMaintenanceEmpty(teamName)}
                    </div>
                </section>
            </div>
        `;
    }

    Object.assign(api, {
        getPreventiveMaintenanceMonths,
        getPreventiveMaintenancePlan,
        getPreventiveMaintenanceSummary,
        getPreventiveMaintenanceState,
        normalizePreventiveMaintenanceMonth,
        openPreventiveMaintenance,
        closePreventiveMaintenance,
        setPreventiveMaintenanceMonth,
        renderPreventiveMaintenanceButton,
        renderPreventiveMaintenanceMetrics,
        renderPreventiveMaintenanceMonthChart,
        getFilteredPreventiveMaintenanceItems,
        groupPreventiveMaintenanceItems,
        renderPreventiveMaintenanceTable,
        renderPreventiveMaintenanceEmpty,
        renderPreventiveMaintenanceEditor,
        renderPreventiveMaintenanceDialog,
    });
})();
