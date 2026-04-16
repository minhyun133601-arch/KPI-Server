        // ----------------------------------------------------------------
        // [Audit Lux]
        // ----------------------------------------------------------------
        const AuditState = { filters: {}, printCache: {}, entryForm: {}, standardForm: {}, standardsOpen: {}, evidenceOpen: {}, evidenceSelected: {}, evidenceApplied: {}, evidenceCache: {}, luxPreviewRotation: {}, reportFilter: {}, legalFilter: {} };
        const AUDIT_LUX_BASE_YEAR = 2023;
        const AUDIT_LUX_EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;
        const AUDIT_LUX_EVIDENCE_OWNER_DOMAIN = 'audit.lux.evidence';
        const AUDIT_LUX_EVIDENCE_STORAGE_FOLDER = ['Audit', '조도 스캔본'];
        const AUDIT_MONTHLY_REPORT_FOLDER = '04_★★★_오디트/보고서/월간 실적 보고서/';

        const AUDIT_MONTHLY_REPORT_FALLBACK = [
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250414.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250514.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250613.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250723.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250821.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20250917.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20251029.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20251119.pptx',
            '04_★★★_오디트/보고서/월간 실적 보고서/공무환경팀 실적보고서 20260120.pptx'
        ];

        const AUDIT_LEGAL_FACILITY_ALERT_DAYS = 90;
        const AUDIT_LEGAL_FACILITY_FALLBACK = [
            { area: '유산', name: '류원대', item: '전기안전관리자', certificate: '전기산업기사', lastDate: '2022.09.01', cycleYears: 3, nextDate: '2025.08.31', organization: '한국전기기술인협회' },
            { area: '유산', name: '류원대', item: '소방안전관리자', certificate: '-', lastDate: '2024.06.17', cycleYears: 2, nextDate: '2026.06.16', organization: '한국소방안전원' },
            { area: '유산', name: '신태섭', item: '검사대상기기관리자(보일러)', certificate: '에너지관리기능사', lastDate: '2024.11.25', cycleYears: 3, nextDate: '2027.11.24', organization: '한국에너지기술인협회' },
            { area: '유산', name: '신태섭', item: '가스시설관리자', certificate: '양성교육이수증', lastDate: '2025.01.13', cycleYears: 3, nextDate: '2028.01.12', organization: '한국가스안전공사' },
            { area: '유산', name: '김민현', item: '검사대상기기관리자(보일러)', certificate: '에너지관리기사', lastDate: '2025.06.04', cycleYears: 3, nextDate: '2028.06.03', organization: '한국에너지기술인협회' },
            { area: '유산', name: '김민현', item: '냉동기기 관리자', certificate: '공조냉동기계기사', lastDate: '2025.09.01', cycleYears: 3, nextDate: '2028.08.31', organization: '한국가스안전공사' },
            { area: '유산', name: '김민현', item: '승강기안전관리자', certificate: '양성교육이수증', lastDate: '2025.02.28', cycleYears: 3, nextDate: '2028.02.27', organization: '승강기교육센터' },
            { area: '유산', name: '신정래', item: 'HC 수질환경기술인', certificate: '수질환경기사', lastDate: '2024.03.27', cycleYears: 3, nextDate: '2027.03.26', organization: '한국환경보전협회' },
            { area: '유산', name: '신정래', item: 'HC 대기환경기술인 (부)', certificate: '-', lastDate: '2025.07.15', cycleYears: 3, nextDate: '2028.07.14', organization: '-' },
            { area: '유산', name: '신정래', item: '제2공장 수질환경기술인', certificate: '-', lastDate: '2024.12.17', cycleYears: 3, nextDate: '2027.12.16', organization: '-' },
            { area: '유산', name: '신정래', item: '제2공장 대기환경기술인', certificate: '-', lastDate: '2024.03.27', cycleYears: 3, nextDate: '2027.03.26', organization: '-' },
            { area: '유산', name: '이균원', item: '에이치씨글로벌 대기환경기술인 (정)', certificate: '대기환경기사', lastDate: '2024.07.03', cycleYears: 3, nextDate: '2027.07.02', organization: '-' },
            { area: '북정', name: '김민규', item: '전기안전관리자', certificate: '전기기사', lastDate: '2023.09.13', cycleYears: 3, nextDate: '2026.09.12', organization: '한국전기기술인협회' },
            { area: '북정', name: '김민규', item: '검사대상기기관리자(보일러)', certificate: '에너지관리기능사', lastDate: '2025.05.02', cycleYears: 3, nextDate: '2028.05.01', organization: '한국에너지기술인협회' },
            { area: '북정', name: '김민규', item: '가스시설관리자', certificate: '양성교육이수증', lastDate: '2025.03.17', cycleYears: 3, nextDate: '2028.03.16', organization: '한국가스안전공사' },
            { area: '북정', name: '김민규', item: '소방안전관리자', certificate: '소방설비기계기사', lastDate: '2024.09.11', cycleYears: 2, nextDate: '2026.09.10', organization: '한국소방안전원' },
            { area: '북정', name: '이효석', item: '제1공장 수질환경기술인', certificate: '수질환경산업기사', lastDate: '2025.04.01', cycleYears: 3, nextDate: '2028.03.31', organization: '한국환경보전협회' },
            { area: '북정', name: '이효석', item: '제1공장 대기환경기술인 (부)', certificate: '-', lastDate: '2025.05.20', cycleYears: 3, nextDate: '2028.05.19', organization: '-' },
            { area: '북정', name: '정영배', item: '제1공장 대기환경기술인 (정)', certificate: '대기환경기사', lastDate: '2023.11.15', cycleYears: 3, nextDate: '2026.11.14', organization: '-' },
            { area: '물류센터', name: '안준수', item: '검사대상기기관리자(보일러)', certificate: '에너지관리기능사', lastDate: '2025.06.20', cycleYears: 3, nextDate: '2028.06.19', organization: '한국에너지기술인협회' },
            { area: '물류센터', name: '안준수', item: '가스시설관리자', certificate: '양성교육이수증', lastDate: '2023.12.01', cycleYears: 3, nextDate: '2026.11.30', organization: '한국가스안전공사' },
            { area: '물류센터', name: '안준수', item: '승강기안전관리자', certificate: '-', lastDate: '-', cycleYears: 3, nextDate: '2026.11.30', organization: '승강기교육센터' }
        ];
        const AUDIT_LEGAL_ORGANIZATION_LINKS = {
            '한국전기기술인협회': 'https://www.koema.or.kr',
            '한국소방안전원': 'https://www.kfsi.or.kr',
            '한국에너지기술인협회': 'https://www.keea.or.kr',
            '한국가스안전공사': 'https://www.kgs.or.kr',
            '승강기교육센터': 'https://edu.koelsa.or.kr',
            '한국환경보전협회': 'https://www.epa.or.kr'
        };
        const AUDIT_LEGAL_CATEGORY_ORDER = ['environment', 'electric', 'gasboiler', 'cooling', 'fire', 'other'];
        const AUDIT_LEGAL_CATEGORY_META = {
            environment: { key: 'environment', label: '환경', icon: 'fa-leaf', tone: 'environment' },
            electric: { key: 'electric', label: '전기', icon: 'fa-bolt', tone: 'electric' },
            gasboiler: { key: 'gasboiler', label: '가스 (보일러)', icon: 'fa-fire-flame-curved', tone: 'gasboiler' },
            cooling: { key: 'cooling', label: '냉동기', icon: 'fa-snowflake', tone: 'cooling' },
            fire: { key: 'fire', label: '소방', icon: 'fa-fire-extinguisher', tone: 'fire' },
            other: { key: 'other', label: '승강기', icon: 'fa-up-down', tone: 'other' }
        };

        function parseAuditReportDate(text) {
            const str = String(text || '');
            const match = str.match(/(\d{4})(\d{2})(\d{2})/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            if (month < 1 || month > 12 || day < 1 || day > 31) return null;
            const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { key, label: key };
        }

        function getAuditReportGroupLabel(raw, file) {
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                const explicit = raw.group || raw.folder || raw.category || raw.reportType || raw.type || raw.section;
                if (explicit) {
                    const label = String(explicit).trim();
                    if (label) return label;
                }
            }
            const path = String(file || '').replace(/\\/g, '/');
            const segments = path.split('/').map(part => String(part || '').trim()).filter(Boolean);
            const reportRoot = segments.findIndex(part => part === '보고서');
            if (reportRoot >= 0 && segments[reportRoot + 1]) return segments[reportRoot + 1];
            if (segments.length >= 2) return segments[segments.length - 2];
            return '월간 실적보고서';
        }

        function normalizeAuditMonthlyReportItem(raw, index) {
            const isObject = raw && typeof raw === 'object' && !Array.isArray(raw);
            const file = isObject
                ? String(raw.file || raw.path || '')
                : String(raw || '');
            const explicitPreviewFile = isObject
                ? String(raw.previewFile || raw.preview || raw.pdf || raw.pdfFile || '')
                : '';
            const previewFile = explicitPreviewFile || (/\.pdf$/i.test(file) ? file : '');
            const name = isObject
                ? String(raw.name || raw.fileName || file.split('/').pop() || `보고서 ${index + 1}`)
                : String(file.split('/').pop() || `보고서 ${index + 1}`);
            const parsed = parseAuditReportDate(isObject ? (raw.updatedAt || raw.title || name) : name);
            const dateKey = parsed?.key || '';
            const dateLabel = parsed?.label || '-';
            const title = isObject && raw.title ? String(raw.title) : (dateKey || name);
            const groupLabel = getAuditReportGroupLabel(raw, file);
            return {
                id: String(isObject && raw.id ? raw.id : `audit-monthly-report-${index + 1}`),
                file,
                previewFile,
                name,
                title,
                groupLabel,
                dateKey,
                dateLabel
            };
        }

        function getAuditMonthlyReportItems() {
            const fromPortalMonthly = Array.isArray(window.PortalData?.audit_monthly_report?.entries)
                ? window.PortalData.audit_monthly_report.entries
                : [];
            const fromPortalAll = Array.isArray(window.PortalData?.audit_reports?.entries)
                ? window.PortalData.audit_reports.entries
                : [];
            const source = fromPortalAll.length
                ? fromPortalAll
                : (fromPortalMonthly.length ? fromPortalMonthly : AUDIT_MONTHLY_REPORT_FALLBACK);
            const normalized = source
                .map((item, index) => normalizeAuditMonthlyReportItem(item, index))
                .filter(item => item.file);
            const deduped = [];
            const seen = new Set();
            normalized.forEach(item => {
                const key = String(item.file || '').toLowerCase();
                if (!key || seen.has(key)) return;
                seen.add(key);
                deduped.push(item);
            });
            return deduped.sort((a, b) => {
                    if (a.dateKey && b.dateKey && a.dateKey !== b.dateKey) {
                        return b.dateKey.localeCompare(a.dateKey);
                    }
                    if (a.dateKey && !b.dateKey) return -1;
                    if (!a.dateKey && b.dateKey) return 1;
                    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
                });
        }

        function getAuditReportFilterState(dataKey) {
            if (!AuditState.reportFilter[dataKey]) {
                AuditState.reportFilter[dataKey] = { year: '', month: '' };
            }
            return AuditState.reportFilter[dataKey];
        }

        function setAuditReportFilter(dataKey, field, value) {
            const filter = getAuditReportFilterState(dataKey);
            filter[field] = String(value || '').trim();
        }

        function applyAuditReportFilter(dataKey) {
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function clearAuditReportFilter(dataKey) {
            AuditState.reportFilter[dataKey] = { year: '', month: '' };
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function normalizeAuditDateText(value) {
            const text = String(value || '').trim();
            if (!text || text === '-') return '-';
            const match = text.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
            if (!match) return text;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return text;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        function parseAuditDateText(value) {
            const normalized = normalizeAuditDateText(value);
            if (!normalized || normalized === '-') return null;
            const parts = normalized.split('-').map(Number);
            if (parts.length !== 3) return null;
            const [year, month, day] = parts;
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
            return date;
        }

        function normalizeAuditLegalFacilityEntry(raw, index) {
            const item = raw && typeof raw === 'object' ? raw : {};
            const cycleRaw = item.cycleYears ?? item.cycle ?? item.trainingCycle ?? item.periodYears ?? '-';
            const cycleNum = Number(String(cycleRaw).replace(/[^\d.-]/g, ''));
            return {
                id: String(item.id || `audit-legal-facility-${index + 1}`),
                area: String(item.area || item.group || item.section || '-'),
                name: String(item.name || item.person || item.owner || '-'),
                item: String(item.item || item.role || item.subject || '-'),
                certificate: String(item.certificate || item.license || item.certification || '-'),
                lastDate: normalizeAuditDateText(item.lastDate || item.lastTrainingDate || item.recentDate || '-'),
                cycleYears: Number.isFinite(cycleNum) && cycleNum > 0 ? cycleNum : String(cycleRaw || '-'),
                nextDate: normalizeAuditDateText(item.nextDate || item.nextTrainingDate || item.dueDate || '-'),
                organization: String(item.organization || item.institute || item.agency || '-'),
                organizationUrl: String(item.organizationUrl || item.orgUrl || item.url || item.site || item.homepage || '').trim(),
                category: String(item.category || item.classification || item.groupType || item.type || '').trim()
            };
        }

        function normalizeExternalUrl(url) {
            const text = String(url || '').trim();
            if (!text || text === '-') return '';
            if (/^https?:\/\//i.test(text)) return text;
            if (/^www\./i.test(text)) return `https://${text}`;
            if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return `https://${text}`;
            return '';
        }

        function resolveAuditLegalOrganizationUrl(name, explicitUrl) {
            const explicit = normalizeExternalUrl(explicitUrl);
            if (explicit) return explicit;
            const orgName = String(name || '').trim();
            if (!orgName || orgName === '-') return '';
            if (AUDIT_LEGAL_ORGANIZATION_LINKS[orgName]) return AUDIT_LEGAL_ORGANIZATION_LINKS[orgName];
            if (orgName.includes('전기기술인협회')) return AUDIT_LEGAL_ORGANIZATION_LINKS['한국전기기술인협회'];
            if (orgName.includes('소방안전원')) return AUDIT_LEGAL_ORGANIZATION_LINKS['한국소방안전원'];
            if (orgName.includes('에너지기술인협회')) return AUDIT_LEGAL_ORGANIZATION_LINKS['한국에너지기술인협회'];
            if (orgName.includes('가스안전공사')) return AUDIT_LEGAL_ORGANIZATION_LINKS['한국가스안전공사'];
            if (orgName.includes('승강기교육센터')) return AUDIT_LEGAL_ORGANIZATION_LINKS['승강기교육센터'];
            if (orgName.includes('환경보전협회')) return AUDIT_LEGAL_ORGANIZATION_LINKS['한국환경보전협회'];
            return '';
        }

        function normalizeAuditLegalCategoryKey(value) {
            const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
            if (!text || text === '-') return '';
            if (text.includes('환경')) return 'environment';
            if (text.includes('전기')) return 'electric';
            if (text.includes('가스') || text.includes('보일러')) return 'gasboiler';
            if (text.includes('냉동')) return 'cooling';
            if (text.includes('소방')) return 'fire';
            if (text.includes('승강기') || text.includes('엘리베이터')) return 'other';
            if (text.includes('그외') || text.includes('기타') || text.includes('other')) return 'other';
            return '';
        }

        function inferAuditLegalCategoryKeyFromItem(itemName) {
            const text = String(itemName || '').trim();
            if (!text || text === '-') return 'other';
            if (text.includes('수질') || text.includes('대기') || text.includes('환경')) return 'environment';
            if (text.includes('전기')) return 'electric';
            if (text.includes('가스') || text.includes('보일러') || text.includes('검사대상기기')) return 'gasboiler';
            if (text.includes('냉동')) return 'cooling';
            if (text.includes('소방')) return 'fire';
            if (text.includes('승강기') || text.includes('엘리베이터')) return 'other';
            return 'other';
        }

        function getAuditLegalCategoryMeta(itemName, explicitCategory) {
            const explicitKey = normalizeAuditLegalCategoryKey(explicitCategory);
            const inferredKey = inferAuditLegalCategoryKeyFromItem(itemName);
            const key = explicitKey || inferredKey || 'other';
            return AUDIT_LEGAL_CATEGORY_META[key] || AUDIT_LEGAL_CATEGORY_META.other;
        }

        function renderAuditLegalCategoryCell(categoryMeta) {
            const meta = categoryMeta || AUDIT_LEGAL_CATEGORY_META.other;
            return `<span class="audit-legal-item-badge ${meta.tone}"><i class="fa-solid ${meta.icon}"></i>${escapeHtml(meta.label)}</span>`;
        }

        function renderAuditLegalItemCell(itemName, categoryMeta) {
            const meta = categoryMeta || getAuditLegalCategoryMeta(itemName, '');
            const label = escapeHtml(itemName || '-');
            return `<span class="audit-legal-item-badge ${meta.tone}"><i class="fa-solid ${meta.icon}"></i>${label}</span>`;
        }

        function summarizeAuditLegalAlertRows(rows, thresholdDays = AUDIT_LEGAL_FACILITY_ALERT_DAYS) {
            let nearCount = 0;
            let overdueCount = 0;
            rows.forEach(entry => {
                const daysLeft = entry.daysLeft;
                if (!Number.isFinite(daysLeft)) return;
                if (daysLeft < 0) overdueCount += 1;
                else if (daysLeft <= thresholdDays) nearCount += 1;
            });
            return {
                nearCount,
                overdueCount,
                alertCount: nearCount + overdueCount
            };
        }

        function getAuditLegalFacilityEntries() {
            const source = Array.isArray(window.PortalData?.audit_legal_facility?.entries)
                ? window.PortalData.audit_legal_facility.entries
                : AUDIT_LEGAL_FACILITY_FALLBACK;
            return source.map((entry, index) => normalizeAuditLegalFacilityEntry(entry, index));
        }

        function summarizeAuditLegalFacilityAlerts(entries, thresholdDays = AUDIT_LEGAL_FACILITY_ALERT_DAYS) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let nearCount = 0;
            let overdueCount = 0;
            const enriched = entries.map(entry => {
                const nextDateObj = parseAuditDateText(entry.nextDate);
                if (!nextDateObj) return { ...entry, daysLeft: null };
                const daysLeft = Math.floor((nextDateObj.getTime() - today.getTime()) / 86400000);
                if (daysLeft < 0) overdueCount += 1;
                else if (daysLeft <= thresholdDays) nearCount += 1;
                return { ...entry, daysLeft };
            });
            return {
                rows: enriched,
                nearCount,
                overdueCount,
                alertCount: nearCount + overdueCount
            };
        }

        function getAuditLegalFilterState(dataKey) {
            if (!AuditState.legalFilter[dataKey]) {
                AuditState.legalFilter[dataKey] = {
                    category: '',
                    area: '',
                    keyword: '',
                    onlyNear: false,
                    onlyOverdue: false
                };
            }
            if (!Object.prototype.hasOwnProperty.call(AuditState.legalFilter[dataKey], 'category')) {
                AuditState.legalFilter[dataKey].category = '';
            }
            if (!Object.prototype.hasOwnProperty.call(AuditState.legalFilter[dataKey], 'area')) {
                AuditState.legalFilter[dataKey].area = '';
            }
            if (!Object.prototype.hasOwnProperty.call(AuditState.legalFilter[dataKey], 'keyword')) {
                AuditState.legalFilter[dataKey].keyword = '';
            }
            if (!Object.prototype.hasOwnProperty.call(AuditState.legalFilter[dataKey], 'onlyNear')) {
                AuditState.legalFilter[dataKey].onlyNear = false;
            }
            if (!Object.prototype.hasOwnProperty.call(AuditState.legalFilter[dataKey], 'onlyOverdue')) {
                AuditState.legalFilter[dataKey].onlyOverdue = false;
            }
            AuditState.legalFilter[dataKey].onlyNear = AuditState.legalFilter[dataKey].onlyNear === true || String(AuditState.legalFilter[dataKey].onlyNear).toLowerCase() === 'true';
            AuditState.legalFilter[dataKey].onlyOverdue = AuditState.legalFilter[dataKey].onlyOverdue === true || String(AuditState.legalFilter[dataKey].onlyOverdue).toLowerCase() === 'true';
            return AuditState.legalFilter[dataKey];
        }

        function setAuditLegalFilter(dataKey, field, value) {
            const filter = getAuditLegalFilterState(dataKey);
            if (field === 'onlyNear' || field === 'onlyOverdue') {
                filter[field] = value === true || String(value || '').toLowerCase() === 'true';
                return;
            }
            filter[field] = String(value || '').trim();
        }

        function applyAuditLegalFilter(dataKey) {
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function clearAuditLegalFilter(dataKey) {
            AuditState.legalFilter[dataKey] = { category: '', area: '', keyword: '', onlyNear: false, onlyOverdue: false };
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function resolveAuditFileUrl(filePath) {
            const path = String(filePath || '').trim();
            if (!path) return '';
            try {
                return new URL(path, window.location.href).toString();
            } catch (err) {
                return encodeURI(path);
            }
        }

        function openAuditMonthlyReport(encodedPath) {
            const file = decodeURIComponent(encodedPath || '');
            if (!file) return;
            const url = resolveAuditFileUrl(file);
            if (!url) return;
            window.open(url, '_blank');
        }

        function openAuditMonthlyReportPreview(encodedPath) {
            const file = decodeURIComponent(encodedPath || '');
            if (!file) {
                alert('등록된 PDF 미리보기 파일이 없습니다. 원본 다운로드를 사용해 주세요.');
                return;
            }
            const url = resolveAuditFileUrl(file);
            if (!url) return;
            window.open(url, '_blank');
        }

        function downloadAuditMonthlyReport(encodedPath, encodedName) {
            const file = decodeURIComponent(encodedPath || '');
            if (!file) return;
            const fallbackName = String(file.split('/').pop() || 'report');
            const fileName = decodeURIComponent(encodedName || fallbackName) || fallbackName;
            const url = resolveAuditFileUrl(file);
            if (!url) return;
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = fileName;
            anchor.target = '_blank';
            anchor.rel = 'noopener';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        }
