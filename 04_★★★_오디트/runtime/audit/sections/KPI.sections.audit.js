(function () {
    window.KpiSectionFactories = window.KpiSectionFactories || {};

    function buildAuditReportCategory() {
        return {
            title: '보고서 관리',
            icon: 'fa-file-lines',
            color: '#0ea5e9',
            desc: '월간 실적 보고서 관리 및 정리',
            dataKey: 'audit_monthly_report',
            navHidden: true,
            fileName: '월간 실적 보고서/*.pptx',
            content: `
                <div class="grid gap-6">
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <h3 class="text-slate-800 font-semibold text-base">보고서 보관 가이드</h3>
                        <ul class="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                            <li>정기 감사, 외부 점검, 내부 보고서를 유형별로 분류해 주세요.</li>
                            <li>파일명에 날짜(YYYY-MM-DD)와 담당 팀명을 포함하면 찾기 쉽습니다.</li>
                            <li>중요 보고서는 요약본을 함께 기록해 두세요.</li>
                        </ul>
                    </div>
                    <div class="p-4 rounded-xl border border-dashed border-slate-200 bg-white text-slate-500 text-sm">
                        여기에 보고서 링크, 요약, 첨부 파일 위치 등을 정리하세요.
                    </div>
                </div>
            `
        };
    }

    window.KpiSectionFactories.audit = function buildAuditSection() {
        const AppData = {};
        AppData['audit'] = {
            id: 'audit', name: '오디트', icon: 'fa-file-circle-check', color: 'red', accent: '#dc2626',
            categories: [
                {
                    title: '조도 (Lux)',
                    icon: 'fa-sun',
                    color: '#f59e0b',
                    viewerMode: 'full-bleed',
                    desc: '조도 점검 및 기록 (분기별)',
                    dataKey: 'audit_lux',
                    fileName: '04_★★★_오디트/data/current/data_audit_lux.js',
                    content: `
                        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <h3 class="text-slate-800 font-semibold text-base">조도 점검 데이터 입력 안내</h3>
                            <p class="mt-2 text-sm text-slate-600">
                                분기별 조도(Lux) 측정 결과를 기준값 대비로 기록하여 점검 이력을 체계적으로 관리합니다.
                            </p>
                            <ul class="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                                <li>측정 연도/분기, 팀, 구역·설비(장비명)</li>
                                <li>실측값(Lux) 및 기준값 대비 결과</li>
                                <li>미달 시 개선 조치, 완료 일자 및 확인 결과</li>
                                <li>측정자, 측정 장비/교정 정보(가능 시)</li>
                            </ul>
                            <div class="mt-3 text-xs text-slate-500">입력 위치: 04_★★★_오디트/data/current/data_audit_lux.js</div>
                        </div>
                    `
                },
                {
                    title: '법정 설비',
                    icon: 'fa-scale-balanced',
                    color: '#e11d48',
                    desc: '법정 설비 교육/검사 일정 및 법규 관리',
                    dataKey: 'audit_legal_facility',
                    fileName: '04_★★★_오디트/data/current/data_audit_regulation.js',
                    content: `
                        <div class="grid gap-6">
                            <div class="p-4 rounded-xl border border-slate-200 bg-white">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 class="text-slate-800 font-semibold text-base">유산/북정공장 환경기술인 법정교육 현황</h3>
                                        <p class="text-xs text-slate-500 mt-1">기준일: 2026.01.13.</p>
                                    </div>
                                    <span class="badge badge-blue">교육 일정</span>
                                </div>
                                <div class="mt-4 overflow-x-auto">
                                    <table class="table-custom text-sm" style="min-width: 980px;">
                                        <thead>
                                            <tr>
                                                <th rowspan="2" style="min-width: 120px;">구분</th>
                                                <th colspan="4">에이치씨글로벌</th>
                                                <th colspan="3">희창유업 1공장</th>
                                                <th colspan="2">희창유업 2공장</th>
                                            </tr>
                                            <tr>
                                                <th>대기</th>
                                                <th>수질</th>
                                                <th>폐기물</th>
                                                <th>건축물관리자</th>
                                                <th>대기</th>
                                                <th>수질</th>
                                                <th>폐기물</th>
                                                <th>대기</th>
                                                <th>수질</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <th>종별</th>
                                                <td>2종</td>
                                                <td>4종</td>
                                                <td>-</td>
                                                <td>-</td>
                                                <td>1종</td>
                                                <td>5종</td>
                                                <td>-</td>
                                                <td>4종</td>
                                                <td>4종</td>
                                            </tr>
                                            <tr>
                                                <th>선임자</th>
                                                <td>이균원</td>
                                                <td>신정래</td>
                                                <td>신정래</td>
                                                <td>신정래</td>
                                                <td>정영배</td>
                                                <td>이효석</td>
                                                <td>이효석</td>
                                                <td>신정래</td>
                                                <td>신정래</td>
                                            </tr>
                                            <tr>
                                                <th>교육명 / 수료일</th>
                                                <td>전문대기<br>환경기술인<br>2024.07.03</td>
                                                <td>일반수질<br>환경기술인<br>2024.12.17</td>
                                                <td>폐기물<br>배출자<br>2024.12.10</td>
                                                <td>건축물<br>관리자<br>2024.10.02</td>
                                                <td>전문대기<br>환경기술인<br>2023.11.15</td>
                                                <td>일반수질<br>환경기술인<br>2025.04.01</td>
                                                <td>폐기물<br>배출자<br>2023.10.23</td>
                                                <td>일반대기<br>환경기술인<br>2024.03.27</td>
                                                <td>일반수질<br>(위탁·면제)<br>환경기술인<br>2024.03.27</td>
                                            </tr>
                                            <tr>
                                                <th>보수 교육기간</th>
                                                <td>2027.07.02<br>이내</td>
                                                <td>2027.12.16<br>이내</td>
                                                <td>2027.12.09<br>이내</td>
                                                <td>2027.10.01<br>이내</td>
                                                <td>2026.11.15<br>이내</td>
                                                <td>2028.03.31<br>이내</td>
                                                <td>2026.10.22<br>이내</td>
                                                <td>2027.03.26<br>이내</td>
                                                <td>2027.03.26<br>이내</td>
                                            </tr>
                                            <tr>
                                                <th>비고</th>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                                <td>수강완료</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <h3 class="text-slate-800 font-semibold text-base">법규·감사 지적사항 입력 안내</h3>
                                <p class="mt-2 text-sm text-slate-600">
                                    설비 관련 법규/규격 요구사항과 감사 지적사항의 이행 현황을 공식 기록으로 관리합니다.
                                </p>
                                <ul class="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                                    <li>법규/규격명, 조항, 적용 범위</li>
                                    <li>준수 여부 및 증빙(점검 기록, 인증, 시험성적서)</li>
                                    <li>지적사항, 개선 계획, 완료일 및 재점검 결과</li>
                                    <li>책임 부서/담당자, 검토/승인 정보</li>
                                </ul>
                                <div class="mt-3 text-xs text-slate-500">입력 위치: 04_★★★_오디트/data/current/data_audit_regulation.js</div>
                            </div>
                        </div>
                    `
                },
                buildAuditReportCategory()
            ]
        };
        return AppData['audit'];
    };
})();
