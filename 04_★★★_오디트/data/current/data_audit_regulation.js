const auditRegulation = {
  meta: {
    moduleKey: "audit_regulation",
    moduleName: "Audit - 법정 설비",
    version: 1,
    updatedAt: "2026-04-01T00:00:00.000Z",
    sourceState: "placeholder",
    sourceLabel: "원본 미확보",
    sourceMessage: "실제 규정 원본이 아직 확보되지 않아 임시 구조만 유지합니다.",
    editable: false,
    locale: "ko-KR"
  },
  entries: [],
  standards: [],
  evidence: [],
  tabs: [
    { id: "overview", label: "안내" }
  ],
  sections: [
    { id: "overview", label: "안내", items: [] }
  ]
};

window.PortalData = window.PortalData || {};
window.PortalData.audit_regulation = auditRegulation;
window.PortalData.audit_legal_facility = auditRegulation;
