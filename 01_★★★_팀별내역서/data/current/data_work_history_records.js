(function seedWorkHistoryRecords() {
    window.PortalData = window.PortalData || {};
    if (window.PortalData.work_history_records) return;

    window.PortalData.work_history_records = {
        meta: {
            moduleKey: 'work_history_records',
            moduleName: '팀별내역서 - 작업내역',
            version: 1,
            updatedAt: '2026-04-02T00:00:00.000Z'
        },
        teams: {
            team1part1: [
                {
                    team: 'team1part1',
                    startDate: '2026-03-29',
                    endDate: '2026-03-31',
                    plannedEndDate: '2026-04-02',
                    category: 'KPI',
                    assignees: ['김민현', '김철수'],
                    assignee: '김민현, 김철수',
                    workContent: '건조 라인 점검 후 설비 주변 정리와 소모품 교체를 진행했습니다.',
                    remarks: '샘플 작업내역입니다. 확인 후 수정하거나 삭제하면 됩니다.',
                    attachmentSlots: {
                        billing: {
                            originalName: '청구서_예시_1팀1파트.pdf',
                            url: '/attachments/sample-billing-team1part1.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'billing'
                        },
                        report: null
                    },
                    cost: 185000
                }
            ],
            team1part2: [
                {
                    team: 'team1part2',
                    startDate: '2026-03-30',
                    endDate: '2026-03-30',
                    plannedEndDate: '2026-04-01',
                    category: '정기점검',
                    assignees: ['박지윤'],
                    assignee: '박지윤',
                    workContent: '건조 라인 온습도 기록 정리 및 점검표 업데이트.',
                    remarks: '현장 점검표는 보고서 첨부로 대체.',
                    attachmentSlots: {
                        billing: null,
                        report: {
                            originalName: '보고서_예시_1팀2파트.pdf',
                            url: '/attachments/sample-report-team1part2.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'report'
                        }
                    },
                    cost: 42000
                }
            ],
            team2: [
                {
                    team: 'team2',
                    startDate: '2026-03-28',
                    endDate: '2026-03-29',
                    plannedEndDate: '2026-03-31',
                    category: '설비개선',
                    assignees: ['이정호', '김다은'],
                    assignee: '이정호, 김다은',
                    workContent: '스틱·소포장 라인 벨트 교체 및 테스트 생산 진행.',
                    remarks: '교체 부품 비용과 보고서를 함께 첨부.',
                    attachmentSlots: {
                        billing: {
                            originalName: '청구서_예시_2팀.pdf',
                            url: '/attachments/sample-billing-team2.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'billing'
                        },
                        report: {
                            originalName: '보고서_예시_2팀.pdf',
                            url: '/attachments/sample-report-team2.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'report'
                        }
                    },
                    cost: 260000
                }
            ],
            team3: [
                {
                    team: 'team3',
                    startDate: '2026-03-27',
                    endDate: '2026-03-27',
                    plannedEndDate: '2026-03-28',
                    category: '라인관리',
                    assignees: ['최서윤'],
                    assignee: '최서윤',
                    workContent: '액상 혼합 탱크 세척 및 정기 점검.',
                    remarks: '점검 결과 보고서를 첨부.',
                    attachmentSlots: {
                        billing: null,
                        report: {
                            originalName: '보고서_예시_3팀.pdf',
                            url: '/attachments/sample-report-team3.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'report'
                        }
                    },
                    cost: 78000
                }
            ],
            team4: [
                {
                    team: 'team4',
                    startDate: '2026-03-26',
                    endDate: '2026-03-26',
                    plannedEndDate: '2026-03-27',
                    category: '환경점검',
                    assignees: ['윤태호'],
                    assignee: '윤태호',
                    workContent: '폐수 처리 설비 점검 및 시료 채취.',
                    remarks: '외주 비용 청구서를 첨부.',
                    attachmentSlots: {
                        billing: {
                            originalName: '청구서_예시_공무환경팀.pdf',
                            url: '/attachments/sample-billing-team4.pdf',
                            size: 0,
                            mimeType: 'application/pdf',
                            attachmentType: 'billing'
                        },
                        report: null
                    },
                    cost: 155000
                }
            ]
        }
    };
})();
