        function renderAuditPlaceholderContent(category) {
            const contentContainer = document.getElementById('content-container');
            if (!contentContainer) return;
            const placeholderHtml = String(category?.content || '').trim() || `
                <div class="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
                    추후 추가예정입니다.
                </div>
            `;
            contentContainer.innerHTML = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${category.color || '#94a3b8'};"></span>
                        ${escapeHtml(category.title || '오디트')}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${escapeHtml(category.desc || '추후 추가예정')}</p>
                </div>
                <div class="audit-panel">
                    ${placeholderHtml}
                </div>
            `;
        }

        function removeAuditEntry(dataKey, index) {
            const data = getAuditData(dataKey);
            if (index < 0 || index >= data.entries.length) return;
            data.entries.splice(index, 1);
            saveAuditData(dataKey, data);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
        }

        function addAuditTypeStandard(dataKey) {
            const data = getAuditData(dataKey);
            const teamEl = document.getElementById('audit-standard-team');
            const roomEl = document.getElementById('audit-standard-room');
            const typeEl = document.getElementById('audit-standard-type');
            const valueEl = document.getElementById('audit-standard-value');
            const team = teamEl?.value?.trim() || '';
            const room = roomEl?.value?.trim() || '';
            const type = typeEl?.value?.trim() || '';
            const standard = valueEl?.value?.trim() || '';
            if (!team || !room || !type || !standard) return;
            const standardForm = getAuditStandardFormState(dataKey);
            const payload = { team, room, type, standard };
            if (standardForm.editIndex !== null && standardForm.editIndex >= 0 && standardForm.editIndex < data.standards.length) {
                data.standards[standardForm.editIndex] = payload;
                standardForm.editIndex = null;
            } else {
                data.standards.push(payload);
            }
            saveAuditData(dataKey, data);
            standardForm.team = team;
            standardForm.room = room;
            standardForm.type = '';
            standardForm.standard = '';
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
        }

        function editAuditStandard(dataKey, index) {
            const data = getAuditData(dataKey);
            if (!data.standards || index < 0 || index >= data.standards.length) return;
            const item = data.standards[index];
            const standardForm = getAuditStandardFormState(dataKey);
            standardForm.team = item.team || '';
            standardForm.room = item.room || '';
            standardForm.type = item.type || '';
            standardForm.standard = item.standard || '';
            standardForm.editIndex = index;
            AuditState.standardsOpen[dataKey] = true;
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function removeAuditStandard(dataKey, index) {
            const data = getAuditData(dataKey);
            if (!Array.isArray(data.standards) || index < 0 || index >= data.standards.length) return;
            data.standards.splice(index, 1);
            saveAuditData(dataKey, data);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
        }

        function updateAuditValueStatus(dataKey, options = {}) {
            const data = getAuditData(dataKey);
            const teamEl = document.getElementById('audit-team');
            const roomEl = document.getElementById('audit-room');
            const valueEl = document.getElementById('audit-value');
            const statusEl = document.getElementById('audit-value-status');
            if (!statusEl) return;
            const typeEl = document.getElementById('audit-type');
            const standardInfo = getAuditStandardInfo(data.standards || [], teamEl?.value, roomEl?.value, typeEl?.value);
            const status = getAuditValueStatus(valueEl?.value, standardInfo, {
                deferPendingInput: !options.force && document.activeElement === valueEl
            });
            statusEl.innerHTML = renderAuditStatusBadge(status);
        }
