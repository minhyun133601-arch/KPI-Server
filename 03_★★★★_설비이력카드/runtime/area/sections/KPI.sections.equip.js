(function () {
    const { buildEquipAreaContent } = window.KpiSectionBuilders || {};
    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.equip = function buildEquipSection() {
        const AppData = {};
AppData['equip'] = {
            id: 'equip', name: '설비 이력 카드', icon: 'fa-clipboard-list', color: 'blue', accent: '#2563eb',
            categories: [
                {
                    title: '1팀 1파트',
                    icon: 'fa-wind',
                    color: '#f97316',
                    desc: '건조 공정 설비 이력 (1팀 1파트)',
                    rooms: [],
                    content: buildEquipAreaContent({
                        guidePath: '03_★★★★_설비이력카드/data/equip/data_equip_team1_part1.js',
                        shellId: 'area-map-team1-part1',
                        templateId: 'team1_part1',
                        mapTitle: '생산 1팀 1파트 설비 배치도',
                        mapSub: '건조 공정 기준 설비 위치를 관리합니다.'
                    })
                },
                {
                    title: '1팀 2파트',
                    icon: 'fa-wind',
                    color: '#f59e0b',
                    desc: '건조 공정 설비 이력 (1팀 2파트)',
                    rooms: [],
                    content: buildEquipAreaContent({
                        guidePath: '03_★★★★_설비이력카드/data/equip/data_equip_team1_part2.js',
                        shellId: 'area-map-team1-part2',
                        templateId: 'team1_part2',
                        mapTitle: '생산 1팀 2파트 설비 배치도',
                        mapSub: '건조 공정 보조 라인의 설비 위치를 관리합니다.'
                    })
                },
                {
                    title: '2팀',
                    icon: 'fa-boxes-stacked',
                    color: '#22c55e',
                    desc: '스틱/소포장 설비 이력 (2팀)',
                    rooms: [
                        '1층 내포장실',
                        '1층 외포장실',
                        '2층 내포장실',
                        '2층 외포장실',
                        '시프트실',
                        '3층 배합실',
                        '3층 원부자재 보관실',
                        '3층 알레르기 원료 보관실'
                    ],
                    content: buildEquipAreaContent({
                        guidePath: '03_★★★★_설비이력카드/data/equip/data_equip_team2.js',
                        shellId: 'area-map-team2',
                        templateId: 'team2',
                        mapTitle: '생산 2팀 설비 배치도',
                        mapSub: '스틱/소포장 공정 기준 설비 위치를 관리합니다.'
                    })
                },
                {
                    title: '3팀',
                    icon: 'fa-bottle-water',
                    color: '#0ea5e9',
                    desc: '액상 공정 설비 이력 (3팀)',
                    rooms: [
                        '위생전실',
                        '계량실',
                        '배합실',
                        '품질검사실',
                        '충진실',
                        '외포장실'
                    ],
                    content: buildEquipAreaContent({
                        guidePath: '03_★★★★_설비이력카드/data/equip/data_equip_team3.js',
                        shellId: 'area-map-team3',
                        templateId: 'team3',
                        mapTitle: '생산 3팀 설비 배치도',
                        mapSub: '액상 공정 기준 설비 위치를 관리합니다.',
                        guideDesc: '본 섹션에는 액상 공정 설비의 설치·개조·점검·보수 이력을 공식 기록으로 관리합니다.'
                    })
                }
            ]
        };
        return AppData['equip'];
    };
})();
