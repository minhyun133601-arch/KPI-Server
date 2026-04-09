const EquipData = {
  meta: {
    moduleKey: "equip",
    moduleName: "설비이력카드",
    version: 1,
    updatedAt: "2026-01-31T00:00:00.000Z"
  },
  tabs: [
    { id: "overview", label: "개요" }
  ],
  sections: [
    {
      id: "default",
      label: "기본",
      items: []
    }
  ]
};

window.PortalData = window.PortalData || {};
window.PortalData.equip = EquipData;
