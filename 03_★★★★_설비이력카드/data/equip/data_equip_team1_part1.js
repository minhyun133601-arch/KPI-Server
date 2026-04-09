const equip_team1_part1 = {
  meta: {
    moduleKey: "equip_team1_part1",
    moduleName: "설비이력카드 - 1팀 1파트",
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
window.PortalData.equip_team1_part1 = equip_team1_part1;
