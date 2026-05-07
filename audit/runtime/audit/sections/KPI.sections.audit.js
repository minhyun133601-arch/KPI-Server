(function () {
    KpiSectionFactoryAdapter.registerFactory('audit', function buildAuditSection() {
        const AppData = {};
        AppData.audit = {
            id: 'audit',
            name: '오디트',
            icon: 'fa-file-circle-check',
            color: 'red',
            accent: '#dc2626',
            categories: [
                {
                    title: '조도 (Lux)',
                    icon: 'fa-sun',
                    color: '#f59e0b',
                    viewerMode: 'full-bleed',
                    desc: '조도 점검 및 기록 (분기별)',
                    dataKey: 'audit_lux',
                    fileName: 'Central Server DB / Audit Lux',
                    content: `
                        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <h3 class="text-slate-800 font-semibold text-base">조도 점검 데이터 입력 안내</h3>
                            <p class="mt-2 text-sm text-slate-600">
                                분기별 조도(Lux) 측정 결과를 기준값 대비로 기록하여 점검 이력을 관리합니다.
                            </p>
                            <ul class="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                                <li>측정 연도/분기, 팀, 구역, 측정 유형</li>
                                <li>측정값(Lux) 및 기준값 대비 결과</li>
                                <li>미달 시 개선 조치, 완료 일자 및 확인 결과</li>
                                <li>측정자, 측정 장비, 교정 정보 관리</li>
                            </ul>
                            <div class="mt-3 text-xs text-slate-500">입력 위치: Central Server DB / Audit Lux</div>
                        </div>
                    `
                },
                {
                    title: '법정 설비 관리',
                    icon: 'fa-scale-balanced',
                    color: '#e11d48',
                    viewerMode: 'full-bleed',
                    desc: '법정 점검 대상 설비와 점검 예정일을 한 화면에서 확인합니다.',
                    dataKey: 'audit_legal_facility',
                    fileName: 'Central Server DB / Audit Legal Facility',
                    readOnly: false,
                    content: `
                        <div class="p-4 rounded-xl border border-rose-100 bg-rose-50 text-sm text-rose-900">
                            법정 설비 점검 일정, 담당 기관, 증빙 문서 상태를 한 화면에서 확인합니다.
                        </div>
                    `
                }
            ]
        };
        return AppData.audit;
    });
})();
