        const UTIL_REPORT_BUILDER_VIZ_USAGE_UNIT_OPTIONS = {
            electric: [
                { key: 'kwh', label: 'kWh', scale: 1 },
                { key: 'mwh', label: 'MWh', scale: 1000 }
            ],
            gas: [
                { key: 'm3', label: 'm³', scale: 1 },
                { key: 'km3', label: '천m³', scale: 1000 }
            ],
            waste: [
                { key: 'wm3', label: '㎥', scale: 1 },
                { key: 'kwm3', label: '천㎥', scale: 1000 }
            ]
        };
        const UtilReportBuilderVizState = {
            from: '',
            to: '',
            team: '전체',
            itemKey: 'electric',
            usageUnitKey: 'kwh',
            costUnitKey: 'krw',
            productionUnitKey: 'kg',
            usageDecimals: 1,
            costDecimals: 1,
            productionDecimals: 1,
            ratioDecimals: 1,
            decimals: 1,
            showLabels: false,
            usageChartType: 'bar',
            costChartType: 'line',
            productionChartType: 'line',
            ratioChartType: 'line',
            ratioActualChartType: '',
            ratioAppliedChartType: '',
            appliedModeEnabled: false,
            focusSeriesKey: '',
            isolatedSeriesKey: '',
            detailFocusSeriesKey: '',
            focusMonthKey: '',
            chartViewKey: 'main',
            chartFullscreen: false,
            pendingDetailScroll: false,
            hasGenerated: false,
            isDirty: true
        };
        const UtilReportBuilderVizDetachedTableState = {
            win: null,
            detached: false
        };
        const UtilReportBuilderVizPopupState = {
            win: null
        };

        const UTIL_REPORT_METRIC_OPTIONS = [
            { key: 'total_cost', label: '총합', type: 'cost' },
            { key: 'electric_cost', label: '전기', type: 'cost' },
            { key: 'gas_cost', label: '가스', type: 'cost' },
            { key: 'waste_cost', label: '폐수', type: 'cost' },
            { key: 'electric_usage', label: '전기 사용량', type: 'usage' },
            { key: 'gas_usage', label: '가스 사용량', type: 'usage' },
            { key: 'waste_usage', label: '폐수 사용량', type: 'usage' },
            { key: 'production', label: '생산량', type: 'production' }
        ];

        const UTIL_REPORT_SCOPE_OPTIONS = [
            { key: 'total', label: '총합', metricKey: 'total_cost' },
            { key: 'electric', label: '전기', metricKey: 'electric_cost' },
            { key: 'gas', label: '가스', metricKey: 'gas_cost' },
            { key: 'waste', label: '폐수', metricKey: 'waste_cost' }
        ];

        const UTIL_REPORT_CATEGORY_OPTIONS = [
            { key: 'cost', label: '비용' },
            { key: 'production', label: '생산량' }
        ];

        const UTIL_REPORT_PRODUCTION_UNIT_OPTIONS = [
            { key: 'kg', label: 'kg', scale: 1 },
            { key: '10kg', label: '10kg', scale: 10 },
            { key: '100kg', label: '100kg', scale: 100 },
            { key: 'ton', label: '톤', scale: 1000 }
        ];

        const UTIL_REPORT_PRODUCTION_TEAM_OPTIONS = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '유산'];
        const UTIL_REPORT_PRODUCTION_TEAM_BASE = ['1팀 1파트', '1팀 2파트', '2팀', '3팀'];
        const UTIL_REPORT_BUILDER_TEAM_OPTIONS = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '유산', '전체'];
        const UTIL_REPORT_BUILDER_ITEM_OPTIONS = [
            { key: 'electric', label: '전기', enabled: true },
            { key: 'gas', label: '가스', enabled: true },
            { key: 'waste', label: '폐수', enabled: true }
        ];

        const UTIL_REPORT_BUILDER_VALUE_OPTIONS = {
            electric: [
                { key: 'electric_usage', label: '사용량 (kWh)' },
                { key: 'electric_cost', label: '비용 (원)' },
                { key: 'production', label: '생산량 (kg)' }
            ],
            gas: [
                { key: 'gas_usage', label: '사용량 (m³)' },
                { key: 'gas_cost', label: '비용 (원)' },
                { key: 'production', label: '생산량 (kg)' }
            ],
            waste: [
                { key: 'waste_usage', label: '사용량 (톤)' },
                { key: 'waste_cost', label: '비용 (원)' },
                { key: 'production', label: '생산량 (kg)' }
            ]
        };

        const UTIL_REPORT_DONUT_COLORS = {
            electric_cost: '#2563EB',
            gas_cost: '#DC2626',
            waste_cost: '#0EA5A3',
            electric_production: '#2563EB',
            gas_production: '#DC2626',
            waste_production: '#0EA5A3'
        };

        const UTIL_REPORT_COMPOSITION_KEYSETS = {
            cost: {
                total: 'total_cost',
                electric: 'electric_cost',
                gas: 'gas_cost',
                waste: 'waste_cost'
            },
            production: {
                total: 'total_production',
                electric: 'electric_production',
                gas: 'gas_production',
                waste: 'waste_production'
            }
        };

        const UTIL_REPORT_SITE_COLORS = {
            yusan: '#2563eb',
            bukjeong: '#f97316'
        };

        const UTIL_REPORT_WASTE_DETAIL_LABELS = {
            total: '총 폐수비용 (원)',
            water: '용수비 (원)',
            share: '폐수 부담금 (원)',
            sludge: '폐수 슬러지 처리비용 (원)',
            resin: '유합수지 처리비용 (원)',
            outsourcing: '위탁 관리비 (원)',
            labor: '인건비 (원)'
        };

        const UTIL_ENERGY_REPORT_SCOPE_OPTIONS = [
            { key: 'total', label: '총열량', metricKey: 'total_energy' },
            { key: 'electric', label: '전기', metricKey: 'electric_energy' },
            { key: 'gas', label: '가스', metricKey: 'gas_energy' }
        ];

        const UTIL_ENERGY_REPORT_DONUT_COLORS = {
            electric_energy: '#2563eb',
            gas_energy: '#dc2626'
        };
