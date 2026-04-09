const equip_team3 = {
  meta: {
    moduleKey: "equip_team3",
    moduleName: "설비이력카드 - 3팀",
    version: 1,
    updatedAt: "2026-01-31T00:00:00.000Z"
  },
  tabs: [
    { id: "startup", label: "가동" },
    { id: "process", label: "운전" },
    { id: "shutdown", label: "종료" },
    { id: "maintenance", label: "유지보수" }
  ],
  sections: [
    { id: "startup", label: "가동", items: [] },
    { id: "process", label: "운전", items: [] },
    { id: "shutdown", label: "종료", items: [] },
    { id: "maintenance", label: "유지보수", items: [] }
  ]
};

window.PortalData = window.PortalData || {};
window.PortalData.equip_team3 = equip_team3;
