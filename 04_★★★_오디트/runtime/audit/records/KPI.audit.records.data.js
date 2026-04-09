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

        const AuditServerWriteQueue = {};
        const AUDIT_PORTAL_DATA_ALIAS = Object.freeze({
            audit_legal_facility: 'audit_regulation',
            audit_regulation: 'audit_legal_facility'
        });

        function cloneAuditDataPayload(value) {
            return JSON.parse(JSON.stringify(value || {}));
        }

        function getAuditServerRuntimeConfig(dataKey) {
            const runtime = window.__KPI_SERVER_RUNTIME_CONFIG__?.audit;
            const records = runtime?.records;
            const record = records && typeof records === 'object' ? records[dataKey] : null;
            if (!runtime || runtime.enabled !== true || !record) return null;
            return {
                apiBase: runtime.apiBase || '/api',
                moduleKey: runtime.moduleKey || 'portal_data',
                recordKey: record.recordKey || dataKey,
                permissionKey: record.permissionKey || '',
                readEnabled: record.readEnabled === true,
                writeEnabled: record.writeEnabled === true
            };
        }

        function getAuditPortalPayload(dataKey) {
            if (!window.PortalData) return null;
            if (Object.prototype.hasOwnProperty.call(window.PortalData, dataKey)) {
                return window.PortalData[dataKey];
            }
            const aliasKey = AUDIT_PORTAL_DATA_ALIAS[dataKey];
            if (aliasKey && Object.prototype.hasOwnProperty.call(window.PortalData, aliasKey)) {
                return window.PortalData[aliasKey];
            }
            return null;
        }

        function syncAuditPortalDataCache(dataKey, data) {
            window.PortalData = window.PortalData || {};
            const snapshot = cloneAuditDataPayload(data);
            window.PortalData[dataKey] = snapshot;
            const aliasKey = AUDIT_PORTAL_DATA_ALIAS[dataKey];
            if (aliasKey) {
                window.PortalData[aliasKey] = cloneAuditDataPayload(snapshot);
            }
        }

        function queueAuditServerWrite(dataKey, data) {
            const runtime = getAuditServerRuntimeConfig(dataKey);
            if (!(window.KpiRuntime?.canUseServerWrite?.(runtime?.writeEnabled === true))) return Promise.resolve(false);

            const queueState = AuditServerWriteQueue[dataKey] || (AuditServerWriteQueue[dataKey] = {
                timer: null,
                payload: null,
                flushPromise: Promise.resolve(true),
                writeChain: Promise.resolve(true)
            });
            queueState.payload = cloneAuditDataPayload(data);

            if (queueState.timer) {
                clearTimeout(queueState.timer);
            }

            queueState.flushPromise = new Promise((resolve) => {
                queueState.timer = setTimeout(() => {
                    const payload = cloneAuditDataPayload(queueState.payload);
                    queueState.timer = null;
                    queueState.writeChain = Promise.resolve(queueState.writeChain)
                        .catch(() => false)
                        .then(async () => {
                            try {
                                const response = await fetch(`${runtime.apiBase}/modules/${encodeURIComponent(runtime.moduleKey)}/records/${encodeURIComponent(runtime.recordKey)}`, {
                                    method: 'PUT',
                                    credentials: 'same-origin',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        permissionKey: runtime.permissionKey,
                                        payload
                                    })
                                });

                                if (!response.ok) {
                                    throw new Error(`http_${response.status}`);
                                }

                                const result = await response.json();
                                if (result?.record?.payload) {
                                    syncAuditPortalDataCache(dataKey, result.record.payload);
                                }
                                return true;
                            } catch (error) {
                                console.warn('[kpi] audit server write failed', dataKey, error);
                                return false;
                            }
                        });
                    queueState.writeChain.then(resolve);
                }, 250);
            });

            return queueState.flushPromise;
        }

        function waitForAuditServerWrite(dataKey) {
            const queueState = AuditServerWriteQueue[dataKey];
            if (!queueState) return Promise.resolve(true);
            if (queueState.timer) return queueState.flushPromise || Promise.resolve(true);
            return queueState.writeChain || Promise.resolve(true);
        }

        function getAuditData(dataKey, moduleName) {
            let data = null;
            const serverRuntime = getAuditServerRuntimeConfig(dataKey);
            const serverReadBlocked = !!(serverRuntime && serverRuntime.readEnabled !== true);
            const portalPayload = getAuditPortalPayload(dataKey);
            const hasServerPayload = !!(serverRuntime && serverRuntime.readEnabled === true && portalPayload);

            if (hasServerPayload) {
                data = cloneAuditDataPayload(portalPayload);
            }

            if (!data && !serverReadBlocked) {
                const stored = localStorage.getItem(`auditdata:${dataKey}`);
                if (stored) {
                    try { data = JSON.parse(stored); } catch (e) { data = null; }
                }
            }
            if (!data && !serverReadBlocked && portalPayload) {
                data = cloneAuditDataPayload(portalPayload);
            }
            if (!data) {
                data = {
                    meta: {
                        moduleKey: dataKey,
                        moduleName: moduleName || dataKey,
                        version: 1,
                        updatedAt: new Date().toISOString()
                    },
                    entries: []
                };
            }
            data.entries = Array.isArray(data.entries) ? data.entries : [];
            if (!data.entries.length && Array.isArray(portalPayload?.entries)) {
                data.entries = cloneAuditDataPayload(portalPayload.entries);
            }
            data.standards = Array.isArray(data.standards) ? data.standards : [];
            if (!data.standards.length && Array.isArray(portalPayload?.standards)) {
                data.standards = cloneAuditDataPayload(portalPayload.standards);
            }
            data.evidence = Array.isArray(data.evidence) ? data.evidence : [];
            if (!data.evidence.length && Array.isArray(portalPayload?.evidence)) {
                data.evidence = cloneAuditDataPayload(portalPayload.evidence);
            }
            if (dataKey === 'audit_legal_facility' || dataKey === 'audit_regulation') {
                const hasMeaningfulContent = ['entries', 'standards', 'evidence', 'tabs', 'sections'].some((field) => Array.isArray(data[field]) && data[field].length > 0);
                if (!String(data.meta?.sourceState || '').trim()) {
                    data.meta = data.meta || {};
                    data.meta.sourceState = hasMeaningfulContent ? 'active' : 'placeholder';
                    data.meta.sourceLabel = hasMeaningfulContent ? '원본 반영됨' : '원본 미확보';
                    data.meta.sourceMessage = hasMeaningfulContent
                        ? '현재 데이터는 실제 기록이 반영된 상태입니다.'
                        : '실제 규정 원본이 아직 확보되지 않아 임시 구조만 유지합니다.';
                }
            }
            return data;
        }

        function normalizeAuditZone(text) {
            return (text || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
        }

        function getAuditStandardInfo(standards, team, room, type) {
            const t = (team || '').trim();
            const r = (room || '').trim();
            const k = (type || '').trim();
            const normalizedTeam = normalizeAuditZone(t);
            const normalizedRoom = normalizeAuditZone(r);
            const normalizedType = normalizeAuditZone(k);

            const matchStandard = (item) => {
                const itemTeam = normalizeAuditZone(item.team || '');
                const itemRoom = normalizeAuditZone(item.room || '');
                const itemType = normalizeAuditZone(item.type || '');
                if (normalizedTeam && itemTeam && itemTeam !== normalizedTeam) return false;
                if (normalizedRoom && itemRoom && itemRoom !== normalizedRoom) return false;
                if (normalizedType && itemType && itemType !== normalizedType) return false;
                if (normalizedTeam && !itemTeam && normalizedRoom && !itemRoom && normalizedType && !itemType) return false;
                return true;
            };

            const sorted = (standards || []).slice();
            // Try most specific first: team+room+type, then room+type, then type-only
            const candidates = [
                item => normalizedTeam && normalizedRoom && normalizedType && normalizeAuditZone(item.team || '') === normalizedTeam && normalizeAuditZone(item.room || '') === normalizedRoom && normalizeAuditZone(item.type || '') === normalizedType,
                item => normalizedRoom && normalizedType && normalizeAuditZone(item.room || '') === normalizedRoom && normalizeAuditZone(item.type || '') === normalizedType,
                item => normalizedType && normalizeAuditZone(item.type || '') === normalizedType
            ];
            for (const predicate of candidates) {
                const found = sorted.find(item => (item.team || item.room || item.type) && predicate(item));
                if (found) {
                    const value = parseFloat(found.standard);
                    if (!Number.isNaN(value)) {
                        return { value, label: String(found.standard || value) };
                    }
                }
            }

            for (const item of sorted) {
                if (item.team || item.room || item.type) continue;
                const zone = normalizeAuditZone(item.zone || '');
                if (!zone) continue;
                const candidatesLegacy = new Set([normalizedRoom, normalizedType].filter(Boolean));
                if (candidatesLegacy.has(zone)) {
                    const value = parseFloat(item.standard);
                    if (!Number.isNaN(value)) {
                        return { value, label: String(item.standard || value) };
                    }
                }
            }
            return null;
        }

        function getAuditTypeOptions(standards, team, room) {
            const normalizedTeam = normalizeAuditZone(team || '');
            const normalizedRoom = normalizeAuditZone(room || '');
            if (!normalizedRoom) return [];
            const list = (standards || []).filter(item => {
                const itemTeam = normalizeAuditZone(item.team || '');
                const itemRoom = normalizeAuditZone(item.room || '');
                if (normalizedTeam && itemTeam && itemTeam !== normalizedTeam) return false;
                if (normalizedRoom && itemRoom && itemRoom !== normalizedRoom) return false;
                return true;
            }).map(item => item.type || '').filter(Boolean);
            return Array.from(new Set(list));
        }

        function renderAuditTeamChip(team) {
            const info = getEquipIconInfo(team);
            const color = info.color || '#94a3b8';
            const icon = info.icon || 'fa-folder';
            const safeTeam = escapeHtml(team || '');
            const label = safeTeam || '미지정';
            const chipStyle = `background:${color}14;border-color:${color}55;color:${color};`;
            return `<span class="audit-team-chip" style="${chipStyle}"><i class="fas ${icon}"></i>${label}</span>`;
        }

        function getAuditValueStatus(value, standardInfo) {
            const numeric = parseFloat(value);
            const standardValue = standardInfo?.value;
            const standardLabel = standardInfo?.label || (standardValue ?? '');
            if (standardValue === null || standardValue === undefined || Number.isNaN(standardValue)) {
                return { state: 'none', label: '기준 없음' };
            }
            if (Number.isNaN(numeric)) {
                return { state: 'none', label: `기준 ${standardLabel}` };
            }
            if (numeric < standardValue) {
                return { state: 'fail', label: `미달 (${standardLabel})` };
            }
            return { state: 'pass', label: `충족 (${standardLabel})` };
        }

        function renderAuditStatusBadge(status) {
            if (!status) return '';
            return `
                <span class="audit-status-badge ${status.state}">
                    <span class="audit-status-dot"></span>
                    ${escapeHtml(status.label)}
                </span>
            `;
        }

        function saveAuditData(dataKey, data) {
            const serverRuntime = getAuditServerRuntimeConfig(dataKey);
            if (!(window.KpiRuntime?.canUseServerWrite?.(serverRuntime?.writeEnabled === true))) {
                return false;
            }
            data.meta = data.meta || {};
            if (dataKey === 'audit_legal_facility' || dataKey === 'audit_regulation') {
                const hasMeaningfulContent = ['entries', 'standards', 'evidence', 'tabs', 'sections'].some((field) => Array.isArray(data[field]) && data[field].length > 0);
                if (hasMeaningfulContent) {
                    data.meta.sourceState = 'active';
                    data.meta.sourceLabel = '원본 반영됨';
                    data.meta.sourceMessage = '현재 데이터는 실제 기록이 반영된 상태입니다.';
                } else if (!String(data.meta.sourceState || '').trim()) {
                    data.meta.sourceState = 'placeholder';
                    data.meta.sourceLabel = '원본 미확보';
                    data.meta.sourceMessage = '실제 규정 원본이 아직 확보되지 않아 임시 구조만 유지합니다.';
                }
            }
            data.meta.updatedAt = new Date().toISOString();
            try {
                localStorage.setItem(`auditdata:${dataKey}`, JSON.stringify(data));
            } catch (error) {
                console.warn('[kpi] audit local backup failed', dataKey, error);
            }
            syncAuditPortalDataCache(dataKey, data);
            return queueAuditServerWrite(dataKey, data);
        }

        function getAuditEvidenceList(dataKey) {
            const data = getAuditData(dataKey);
            return Array.isArray(data.evidence) ? data.evidence : [];
        }

        function getAuditEvidenceViewUrl(item) {
            const previewUrl = String(item?.previewUrl || item?.viewUrl || '').trim();
            if (previewUrl) return previewUrl;
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (documentId) return `/api/files/${encodeURIComponent(documentId)}/view`;
            return resolveAuditEvidenceFileUrl(item?.file || item?.path || '');
        }

        function getAuditEvidenceDownloadUrl(item) {
            const downloadUrl = String(item?.downloadUrl || '').trim();
            if (downloadUrl) return downloadUrl;
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (documentId) return `/api/files/${encodeURIComponent(documentId)}/download`;
            return resolveAuditEvidenceFileUrl(item?.file || item?.path || '');
        }

        function getAuditEvidenceFileLabel(item) {
            const explicit = String(item?.fileName || item?.name || item?.originalName || '').trim();
            if (explicit) return explicit;
            const file = String(item?.file || item?.path || '').trim();
            if (!file) return '';
            return file.split('/').pop() || file.split('\\').pop() || file;
        }

        function isAuditEvidencePdf(item) {
            const mimeType = String(item?.mimeType || item?.mime_type || '').trim().toLowerCase();
            if (mimeType === 'application/pdf') return true;
            const fileLabel = getAuditEvidenceFileLabel(item).toLowerCase();
            return fileLabel.endsWith('.pdf');
        }

        function resolveAuditEvidenceFileUrl(file) {
            const rawFile = String(file || '').trim();
            if (!rawFile) return '';
            const normalizedFile = rawFile
                .replace(/^03_★★★_Audit\//, '04_★★★_오디트/')
                .replace(/^03_\*\*\*_Audit\//, '04_★★★_오디트/');
            try {
                return new URL(normalizedFile, window.location.href).toString();
            } catch (err) {
                return encodeURI(normalizedFile);
            }
        }

        function normalizeAuditRotation(angle) {
            const numeric = Number(angle);
            if (!Number.isFinite(numeric)) return 0;
            const normalized = numeric % 360;
            return normalized < 0 ? normalized + 360 : normalized;
        }

        function normalizeAuditLuxStandardHistory(history) {
            return (Array.isArray(history) ? history : [])
                .map((item) => {
                    const effectiveFromYear = Number(item?.effectiveFromYear ?? item?.year);
                    const standard = String(item?.standard || item?.value || '').trim();
                    if (!Number.isFinite(effectiveFromYear) || !standard) return null;
                    return {
                        effectiveFromYear,
                        standard
                    };
                })
                .filter(Boolean)
                .sort((a, b) => a.effectiveFromYear - b.effectiveFromYear);
        }

        function resolveAuditLuxStandardForYear(item, year) {
            let standard = String(item?.standard || '').trim();
            const targetYear = Number(year);
            if (!Number.isFinite(targetYear)) return standard;
            normalizeAuditLuxStandardHistory(item?.standardHistory).forEach((entry) => {
                if (entry.effectiveFromYear <= targetYear) {
                    standard = entry.standard;
                }
            });
            return standard;
        }

        function setAuditLuxStandardForYear(item, year, nextStandard) {
            if (!item || typeof item !== 'object') return;
            const targetYear = Number(year);
            const normalizedStandard = String(nextStandard || '').trim();
            if (!Number.isFinite(targetYear) || !normalizedStandard) return;
            if (targetYear <= AUDIT_LUX_BASE_YEAR) {
                item.standard = normalizedStandard;
                item.standardHistory = normalizeAuditLuxStandardHistory(item?.standardHistory)
                    .filter((entry) => entry.effectiveFromYear > AUDIT_LUX_BASE_YEAR);
                if (!item.standardHistory.length) delete item.standardHistory;
                return;
            }
            const nextHistory = normalizeAuditLuxStandardHistory(item?.standardHistory)
                .filter((entry) => entry.effectiveFromYear !== targetYear);
            nextHistory.push({
                effectiveFromYear: targetYear,
                standard: normalizedStandard
            });
            item.standardHistory = nextHistory.sort((a, b) => a.effectiveFromYear - b.effectiveFromYear);
        }

        function makeAuditLuxEvidenceId(year, team) {
            const safeYear = Number(year);
            const safeTeam = normalizeAuditZone(team || '').replace(/[^a-z0-9]+/g, '-') || 'team';
            return `audit-lux-${safeYear}-${safeTeam}`;
        }

        function getAuditLuxYearEvidenceItem(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return null;
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!normalizedTeam) return null;
            const targetYear = Number(year);
            return getAuditEvidenceList(dataKey).find((item) => (
                normalizeAuditZone(item?.team || '') === normalizedTeam
                && Number(item?.year) === targetYear
            )) || null;
        }

        function makeAuditLuxSheetRowKey(team, room, type) {
            return [
                normalizeAuditZone(team || ''),
                normalizeAuditZone(room || ''),
                normalizeAuditZone(type || '')
            ].join('::');
        }

        function getAuditLuxWorkspaceRows(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return [];
            const normalizedTeam = normalizeAuditZone(team || '');
            const targetYear = Number(year);
            if (!normalizedTeam || !Number.isFinite(targetYear)) return [];
            const data = getAuditData(dataKey, dataKey);
            const entryMap = new Map();
            (Array.isArray(data.entries) ? data.entries : []).forEach((item) => {
                if (Number(item?.year) !== targetYear) return;
                if (normalizeAuditZone(item?.team || '') !== normalizedTeam) return;
                const quarter = Number(item?.quarter);
                if (!Number.isFinite(quarter) || quarter < 1 || quarter > 4) return;
                const rowKey = makeAuditLuxSheetRowKey(item?.team, item?.room, item?.type);
                const bucket = entryMap.get(rowKey) || {};
                bucket[quarter] = String(item?.value ?? '').trim();
                entryMap.set(rowKey, bucket);
            });
            return (Array.isArray(data.standards) ? data.standards : [])
                .filter((item) => normalizeAuditZone(item?.team || '') === normalizedTeam)
                .map((item, index) => {
                    const rowKey = makeAuditLuxSheetRowKey(item?.team, item?.room, item?.type);
                    const savedValues = entryMap.get(rowKey) || {};
                    return {
                        order: index + 1,
                        rowKey,
                        team: String(item?.team || '').trim(),
                        room: String(item?.room || '').trim(),
                        type: String(item?.type || item?.zone || '').trim(),
                        standard: resolveAuditLuxStandardForYear(item, targetYear) || String(item?.standard || '').trim(),
                        baseStandard: String(item?.standard || '').trim(),
                        values: {
                            1: String(savedValues[1] ?? '').trim(),
                            2: String(savedValues[2] ?? '').trim(),
                            3: String(savedValues[3] ?? '').trim(),
                            4: String(savedValues[4] ?? '').trim()
                        }
                    };
                });
        }

        function getAuditLuxYearNote(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return '';
            const targetYear = Number(year);
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !normalizedTeam) return '';
            const data = getAuditData(dataKey, dataKey);
            const explicitNote = (Array.isArray(data.yearNotes) ? data.yearNotes : []).find((item) => (
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === normalizedTeam
            ));
            if (explicitNote) {
                return String(explicitNote.note || '').trim();
            }
            const entryNote = (Array.isArray(data.entries) ? data.entries : []).find((item) => (
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === normalizedTeam
                && String(item?.note || '').trim()
            ));
            return String(entryNote?.note || '').trim();
        }

        function setAuditLuxYearNote(data, year, team, note) {
            if (!data || typeof data !== 'object') return;
            const targetYear = Number(year);
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !normalizedTeam) return;
            const nextNote = String(note || '').trim();
            const nextNotes = (Array.isArray(data.yearNotes) ? data.yearNotes : [])
                .filter((item) => !(
                    Number(item?.year) === targetYear
                    && normalizeAuditZone(item?.team || '') === normalizedTeam
                ));
            if (nextNote) {
                nextNotes.push({
                    year: targetYear,
                    team: String(team || '').trim(),
                    note: nextNote
                });
            }
            if (nextNotes.length) data.yearNotes = nextNotes;
            else delete data.yearNotes;
        }

        function validateAuditLuxEvidenceFile(file) {
            if (!(file instanceof File)) {
                throw new Error('invalid_file');
            }
            const mimeType = String(file.type || '').trim().toLowerCase();
            const fileName = String(file.name || '').trim().toLowerCase();
            const isSupportedImage = mimeType.startsWith('image/');
            const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');
            if (!isSupportedImage && !isPdf) {
                throw new Error('unsupported_type');
            }
            if (Number(file.size || 0) > AUDIT_LUX_EVIDENCE_MAX_BYTES) {
                throw new Error('file_too_large');
            }
        }

        function readAuditLuxEvidenceAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = String(reader.result || '');
                    const commaIndex = result.indexOf(',');
                    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
                };
                reader.onerror = () => reject(reader.error || new Error('audit_lux_evidence_read_failed'));
                reader.readAsDataURL(file);
            });
        }

        function getAuditLuxEvidenceUploadName(file, year, team) {
            const sourceName = String(file?.name || '').trim();
            const sourceMimeType = String(file?.type || '').trim().toLowerCase();
            const nameMatch = sourceName.match(/(\.[A-Za-z0-9]{1,16})$/);
            const ext = nameMatch?.[1]
                || (sourceMimeType === 'application/pdf' ? '.pdf' : '')
                || (sourceMimeType === 'image/png' ? '.png' : '')
                || (sourceMimeType === 'image/webp' ? '.webp' : '')
                || (sourceMimeType === 'image/gif' ? '.gif' : '')
                || (sourceMimeType.startsWith('image/') ? '.jpg' : '');
            return `${Number(year)} ${String(team || '').trim()} 조도${ext}`;
        }

        async function uploadAuditLuxEvidenceToServer(dataKey, year, team, file) {
            const runtime = getAuditServerRuntimeConfig(dataKey);
            if (!(window.KpiRuntime?.canUseServerWrite?.(runtime?.writeEnabled === true)) || typeof fetch !== 'function') {
                throw new Error('server_write_unavailable');
            }
            validateAuditLuxEvidenceFile(file);
            const originalName = getAuditLuxEvidenceUploadName(file, year, team);
            const mimeType = String(file?.type || '').trim() || 'application/octet-stream';
            const base64Data = await readAuditLuxEvidenceAsBase64(file);
            const response = await fetch(`${runtime.apiBase.replace(/\/+$/, '')}/files/base64`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissionKey: runtime.permissionKey,
                    ownerDomain: AUDIT_LUX_EVIDENCE_OWNER_DOMAIN,
                    ownerKey: `${String(dataKey || '').trim()}:${Number(year)}:${String(team || '').trim()}`,
                    fileCategory: 'evidence',
                    originalName,
                    mimeType,
                    base64Data,
                    metadata: {
                        dataKey: String(dataKey || '').trim(),
                        year: Number(year),
                        team: String(team || '').trim(),
                        originalName,
                        storageFolder: AUDIT_LUX_EVIDENCE_STORAGE_FOLDER
                    }
                })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok || !payload?.document?.id) {
                throw new Error(payload?.error || `http_${response.status}`);
            }
            const document = payload.document;
            return {
                id: makeAuditLuxEvidenceId(year, team),
                team: String(team || '').trim(),
                year: Number(year),
                documentId: String(document.id || '').trim(),
                fileName: String(document.original_name || originalName).trim(),
                originalName: String(document.original_name || originalName).trim(),
                mimeType: String(document.mime_type || mimeType).trim(),
                previewUrl: String(document.preview_url || `/api/files/${document.id}/view`).trim(),
                downloadUrl: String(document.download_url || `/api/files/${document.id}/download`).trim(),
                rotate: 0
            };
        }

        async function deleteAuditEvidenceFromServer(item) {
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (!documentId || typeof fetch !== 'function') return true;
            const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (response.status === 404) return true;
            if (!response.ok) {
                throw new Error(`http_${response.status}`);
            }
            return true;
        }

        async function replaceAuditLuxEvidenceForYear(dataKey, year, team, file) {
            if (String(dataKey || '').trim() !== 'audit_lux') {
                throw new Error('invalid_data_key');
            }
            const normalizedTeam = String(team || '').trim();
            const targetYear = Number(year);
            if (!normalizedTeam || !Number.isFinite(targetYear)) {
                throw new Error('invalid_target');
            }
            const data = getAuditData(dataKey, dataKey);
            const currentEvidence = getAuditLuxYearEvidenceItem(dataKey, targetYear, normalizedTeam);
            const uploaded = await uploadAuditLuxEvidenceToServer(dataKey, targetYear, normalizedTeam, file);
            const nextEvidence = (Array.isArray(data.evidence) ? data.evidence : [])
                .filter((item) => !(Number(item?.year) === targetYear && normalizeAuditZone(item?.team || '') === normalizeAuditZone(normalizedTeam)));
            nextEvidence.push(uploaded);
            data.evidence = nextEvidence.sort((a, b) => {
                const yearDiff = Number(b?.year || 0) - Number(a?.year || 0);
                if (yearDiff !== 0) return yearDiff;
                return String(a?.team || '').localeCompare(String(b?.team || ''), 'ko');
            });
            await saveAuditData(dataKey, data);
            if (currentEvidence?.documentId && currentEvidence.documentId !== uploaded.documentId) {
                try {
                    await deleteAuditEvidenceFromServer(currentEvidence);
                } catch (error) {
                    console.warn('[kpi] audit evidence delete failed', dataKey, currentEvidence.documentId, error);
                }
            }
            return uploaded;
        }

        function getAuditLuxEntryPreviewItem(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return null;
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!normalizedTeam) return null;
            const targetYear = Number(year);
            const teamMatches = getAuditEvidenceList(dataKey)
                .filter(item => normalizeAuditZone(item?.team || '') === normalizedTeam)
                .sort((a, b) => Number(b?.year || 0) - Number(a?.year || 0));
            if (!teamMatches.length) return null;
            const exact = teamMatches.find(item => Number(item?.year) === targetYear);
            if (exact) return { ...exact, previewFallback: false };
            return { ...teamMatches[0], previewFallback: true };
        }

        function getAuditLuxEntryPreviewRotation(dataKey, item) {
            const baseRotation = Number.isFinite(parseFloat(item?.rotate)) ? parseFloat(item.rotate) : 0;
            const offset = Number(AuditState?.luxPreviewRotation?.[dataKey]?.[String(item?.id || '').trim()] || 0);
            return normalizeAuditRotation(baseRotation + offset);
        }

        function setAuditLuxEntryPreviewRotationOffset(dataKey, evidenceId, offset) {
            const normalizedDataKey = String(dataKey || '').trim();
            const normalizedId = String(evidenceId || '').trim();
            if (!normalizedDataKey || !normalizedId) return;
            if (!AuditState.luxPreviewRotation[normalizedDataKey]) {
                AuditState.luxPreviewRotation[normalizedDataKey] = {};
            }
            AuditState.luxPreviewRotation[normalizedDataKey][normalizedId] = normalizeAuditRotation(offset);
        }

        function renderAuditLuxEntryPreviewHtml(dataKey, year, team) {
            const previewItem = getAuditLuxEntryPreviewItem(dataKey, year, team);
            if (!String(team || '').trim()) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">팀을 먼저 선택하면 스캔본 미리보기가 표시됩니다.</div>
                    </div>
                `;
            }
            if (!previewItem) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">등록된 스캔본이 없습니다.</div>
                    </div>
                `;
            }
            const title = `${String(previewItem.team || team).trim()} ${String(previewItem.year || year).trim()}년 스캔본`;
            const fileUrl = resolveAuditEvidenceFileUrl(previewItem.file || previewItem.path || '');
            if (!fileUrl) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">스캔본 파일 경로가 없습니다.</div>
                    </div>
                `;
            }
            const rotation = getAuditLuxEntryPreviewRotation(dataKey, previewItem);
            const encodedId = encodeURIComponent(String(previewItem.id || '').trim());
            const sourceText = previewItem.previewFallback
                ? `선택 연도 스캔본이 없어 ${previewItem.year}년 최신 등록본을 표시 중입니다.`
                : `${previewItem.year}년 스캔본을 표시 중입니다.`;
            return `
                <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                    <div class="audit-lux-preview-head">
                        <div class="audit-lux-preview-copy">
                            <div class="audit-lux-preview-title">스캔본 미리보기</div>
                            <div class="audit-lux-preview-meta">${escapeHtml(title)}</div>
                        </div>
                        <div class="audit-filter-actions">
                            <button type="button" class="work-btn" onclick="rotateAuditLuxEntryPreview('${escapeJs(dataKey)}', -90)">왼쪽 회전</button>
                            <button type="button" class="work-btn" onclick="rotateAuditLuxEntryPreview('${escapeJs(dataKey)}', 90)">오른쪽 회전</button>
                            <button type="button" class="work-btn audit-ref-open" onclick="openAuditEvidence('${escapeJs(dataKey)}', '${encodedId}')">원본 열기</button>
                        </div>
                    </div>
                    <div class="audit-lux-preview-stage">
                        <img
                            class="audit-lux-preview-image"
                            data-audit-lux-preview-image
                            src="${fileUrl}"
                            alt="${escapeHtml(title)}"
                            loading="lazy"
                            decoding="async"
                            style="transform: rotate(${rotation}deg);"
                        />
                    </div>
                    <div class="audit-lux-preview-foot">
                        <span class="audit-lux-preview-angle" data-audit-lux-preview-angle>회전 ${rotation}°</span>
                        <span class="audit-lux-preview-origin">${escapeHtml(sourceText)}</span>
                    </div>
                </div>
            `;
        }

        function rotateAuditLuxEntryPreview(dataKey, delta) {
            const entryForm = typeof getAuditEntryFormState === 'function' ? getAuditEntryFormState(dataKey) : null;
            if (!entryForm) return;
            const previewItem = getAuditLuxEntryPreviewItem(dataKey, entryForm.year, entryForm.team);
            if (!previewItem?.id) return;
            const baseRotation = Number.isFinite(parseFloat(previewItem.rotate)) ? parseFloat(previewItem.rotate) : 0;
            const currentRotation = getAuditLuxEntryPreviewRotation(dataKey, previewItem);
            const currentOffset = normalizeAuditRotation(currentRotation - baseRotation);
            setAuditLuxEntryPreviewRotationOffset(dataKey, previewItem.id, currentOffset + Number(delta || 0));
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function initAuditEvidenceState(dataKey, evidenceList) {
            if (!AuditState.evidenceOpen[dataKey]) AuditState.evidenceOpen[dataKey] = {};
            const openState = AuditState.evidenceOpen[dataKey];
            const teams = Array.from(new Set((evidenceList || []).map(item => item.team).filter(Boolean)));
            teams.forEach((team, idx) => {
                if (openState[team] === undefined) openState[team] = idx === 0;
            });
        }

        function toggleAuditEvidenceGroup(dataKey, teamKey, groupId) {
            const team = decodeURIComponent(teamKey || '');
            if (!AuditState.evidenceOpen[dataKey]) AuditState.evidenceOpen[dataKey] = {};
            const current = !!AuditState.evidenceOpen[dataKey][team];
            AuditState.evidenceOpen[dataKey][team] = !current;
            const groupEl = document.getElementById(groupId);
            if (groupEl) groupEl.classList.toggle('is-collapsed', current);
        }

        function filterAuditEvidence(evidenceList, filter) {
            let filtered = (evidenceList || []).slice();
            if (filter?.team) {
                const teamKey = normalizeAuditZone(filter.team);
                filtered = filtered.filter(item => normalizeAuditZone(item.team || '') === teamKey);
            }
            if (filter?.startQuarter && filter?.endQuarter) {
                const range = normalizeQuarterRange(filter.startQuarter, filter.endQuarter);
                const startYear = parseQuarterKey(range.start)?.year;
                const endYear = parseQuarterKey(range.end)?.year;
                if (startYear && endYear) {
                    filtered = filtered.filter(item => {
                        const year = parseInt(item.year, 10);
                        if (Number.isNaN(year)) return false;
                        return year >= startYear && year <= endYear;
                    });
                }
            }
            return filtered;
        }

        function renderAuditEvidencePreviewHtml(dataKey, item) {
            if (!item) {
                return `<div class="audit-ref-empty">좌측에서 항목을 선택하세요.</div>`;
            }
            const titleParts = [];
            if (item.team) titleParts.push(item.team);
            if (item.year) titleParts.push(String(item.year) + '년');
            const title = titleParts.join(' ') || '조도 스캔본';
            const file = item.file || item.path || '';
            if (!file) {
                return `<div class="audit-ref-empty">파일 경로가 없습니다.</div>`;
            }
            const rotate = Number.isFinite(parseFloat(item.rotate)) ? parseFloat(item.rotate) : 0;
            const rotateStyle = rotate ? ` style="transform: rotate(${rotate}deg);"` : '';
            const imagePath = resolveAuditEvidenceFileUrl(file);
            const encodedId = encodeURIComponent(item.id || '');
            return `
                <div class="audit-ref-preview">
                    <img class="audit-ref-image" src="${imagePath}" alt="${escapeHtml(title)}" loading="lazy" decoding="async"${rotateStyle} />
                    <div class="audit-ref-meta">
                        <div>
                            <div class="audit-ref-meta-title">${escapeHtml(title)}</div>
                        </div>
                        <button class="work-btn audit-ref-open" onclick="openAuditEvidence('${dataKey}', '${encodedId}')">원본 열기</button>
                    </div>
                </div>
            `;
        }

        function selectAuditEvidence(dataKey, evidenceKey) {
            const id = decodeURIComponent(evidenceKey || '');
            AuditState.evidenceSelected[dataKey] = id;
            const wrap = document.querySelector(`[data-audit-evidence="${dataKey}"]`);
            if (!wrap) return;
            wrap.querySelectorAll('[data-evidence-item]').forEach(el => {
                el.classList.toggle('is-selected', el.dataset.evidenceId === id);
            });
            const preview = wrap.querySelector('[data-evidence-preview]');
            if (!preview) return;
            const list = getAuditEvidenceList(dataKey);
            const selected = list.find(item => item.id === id);
            preview.innerHTML = renderAuditEvidencePreviewHtml(dataKey, selected);
            preview.classList.toggle('has-image', !!selected?.file || !!selected?.path);
        }

        function openAuditEvidence(dataKey, evidenceKey) {
            const id = decodeURIComponent(evidenceKey || '');
            const list = getAuditEvidenceList(dataKey);
            const item = list.find(entry => entry.id === id);
            if (!item) return;
            const file = item.file || item.path || '';
            if (!file) return;
            let url = '';
            try {
                url = new URL(file, window.location.href).toString();
            } catch (err) {
                url = encodeURI(file);
            }
            window.open(url, '_blank');
        }

        function printAuditEvidence(dataKey) {
            const list = AuditState.evidenceCache?.[dataKey] || [];
            if (!list.length) {
                alert('검색 결과가 없습니다.');
                return;
            }
            const selectedId = AuditState.evidenceSelected?.[dataKey];
            let items = [];
            if (selectedId) {
                const found = list.find(entry => entry.id === selectedId);
                if (found) items = [found];
            }
            if (!items.length) items = list;

            const pages = items.map(item => {
                const file = item.file || item.path || '';
                if (!file) return '';
                const rotate = Number.isFinite(parseFloat(item.rotate)) ? parseFloat(item.rotate) : 0;
                const rotateStyle = rotate ? ` style="transform: rotate(${rotate}deg);"` : '';
                let imagePath = '';
                try {
                    imagePath = new URL(file, window.location.href).toString();
                } catch (err) {
                    imagePath = encodeURI(file);
                }
                const titleParts = [];
                if (item.team) titleParts.push(item.team);
                if (item.year) titleParts.push(String(item.year) + '년');
                const title = titleParts.join(' ') || '조도 스캔본';
                return `
                    <div class="print-page">
                        <div class="print-title">${escapeHtml(title)}</div>
                        <img class="print-image" src="${imagePath}" alt="${escapeHtml(title)}"${rotateStyle} />
                    </div>
                `;
            }).join('');

            const html = `
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8" />
                    <title>조도 스캔본 인쇄</title>
                    <style>
                        @page { margin: 12mm; }
                        body { margin: 0; font-family: 'Noto Sans KR', sans-serif; color: #0f172a; }
                        .print-page { page-break-after: always; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                        .print-title { font-size: 14px; font-weight: 700; }
                        .print-image { max-width: 100%; max-height: 92vh; object-fit: contain; image-orientation: from-image; border: 1px solid #e2e8f0; }
                        .print-page:last-child { page-break-after: auto; }
                    </style>
                </head>
                <body>
                    ${pages}
                </body>
                </html>
            `;
            const win = window.open('', '_blank');
            if (!win) return;
            win.document.open();
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 250);
        }

        function getQuarterInfo(date) {
            const month = date.getMonth(); // 0-11
            const quarter = Math.floor(month / 3) + 1;
            return { year: date.getFullYear(), quarter };
        }

        function makeQuarterKey(year, quarter) {
            return `${year}-Q${quarter}`;
        }

        function parseQuarterKey(key) {
            const match = /^(\d{4})-Q([1-4])$/.exec(key || '');
            if (!match) return null;
            return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
        }

        function quarterIndex(key) {
            const parsed = parseQuarterKey(key);
            if (!parsed) return null;
            return parsed.year * 4 + (parsed.quarter - 1);
        }

        function normalizeQuarterRange(startKey, endKey) {
            const now = getQuarterInfo(new Date());
            const fallback = makeQuarterKey(now.year, now.quarter);
            let start = startKey || fallback;
            let end = endKey || fallback;
            const startIdx = quarterIndex(start);
            const endIdx = quarterIndex(end);
            if (startIdx === null || endIdx === null) {
                start = fallback;
                end = fallback;
            } else if (startIdx > endIdx) {
                const tmp = start;
                start = end;
                end = tmp;
            }
            return { start, end };
        }
