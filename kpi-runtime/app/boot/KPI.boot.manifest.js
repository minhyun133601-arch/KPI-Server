// Generated from KPI.html static script order. Keep this manifest in sync when adding or moving boot scripts.
(function registerKpiBootManifest(global) {
  global.KPI_BOOT_MANIFEST = {
  "version": 1,
  "groups": [
    {
      "key": "vendor",
      "label": "Vendor libraries",
      "scripts": [
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
      ]
    },
    {
      "key": "demoData",
      "label": "Demo/bootstrap data",
      "scripts": [
        "kpi-runtime/demo/KPI.demo-data.browser-adapter.js",
        "kpi-runtime/demo/KPI.demo-data.js"
      ]
    },
    {
      "key": "meteringIntegration",
      "label": "Metering integration bridge",
      "scripts": [
        "utility/runtime/util/integration/KPI.util.metering.bridge.js"
      ]
    },
    {
      "key": "sections",
      "label": "Dashboard section registry",
      "scripts": [
        "kpi-runtime/sections/KPI.section.factory-adapter.js",
        "kpi-runtime/sections/KPI.section.builders.js",
        "team-report/runtime/work/sections/KPI.sections.work.js",
        "utility/runtime/util/sections/KPI.sections.util.js",
        "data-entry/runtime/data/sections/KPI.sections.data.js",
        "audit/runtime/audit/sections/KPI.sections.audit.js",
        "kpi-runtime/sections/KPI.sections.production-report.js",
        "kpi-runtime/sections/KPI.sections.owner.js",
        "kpi-runtime/sections/KPI.section.registry.js"
      ]
    },
    {
      "key": "core",
      "label": "Core runtime",
      "scripts": [
        "kpi-runtime/core/KPI.core.browser-adapter.js",
        "kpi-runtime/core/KPI.core.js"
      ]
    },
    {
      "key": "dataEntry",
      "label": "Data-entry runtime",
      "scripts": [
        "data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js",
        "data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js",
        "data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js",
        "data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js",
        "data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js",
        "data-entry/runtime/data/KPI.data.runtime.js"
      ]
    },
    {
      "key": "utilityBase",
      "label": "Utility base runtime",
      "scripts": [
        "utility/runtime/util/KPI.util.data-sync.browser-adapter.js",
        "utility/runtime/util/KPI.util.data-sync.js",
        "utility/runtime/util/KPI.util.data-sync.production.js",
        "utility/runtime/util/KPI.util.production-import.js",
        "utility/runtime/util/production/KPI.util.production.extractor.js",
        "utility/runtime/util/production/KPI.util.production.dataset-tools.js",
        "utility/runtime/util/KPI.util.production-management.js",
        "utility/runtime/util/KPI.util.maintenance.browser-adapter.js",
        "utility/runtime/util/KPI.util.maintenance.js",
        "utility/runtime/util/KPI.util.maintenance.delete.js",
        "utility/runtime/util/KPI.util.maintenance.config.js",
        "utility/runtime/util/KPI.util.maintenance.export.js"
      ]
    },
    {
      "key": "workPlanning",
      "label": "Work planning runtime",
      "scripts": [
        "team-report/runtime/work/KPI.work.shared.js",
        "team-report/runtime/work/KPI.work.shared.team-calendar.categories.js",
        "team-report/runtime/work/KPI.work.shared.team-calendar.state.js",
        "team-report/runtime/work/KPI.work.shared.team-calendar.summary.js",
        "team-report/runtime/work/KPI.work.production.js",
        "team-report/runtime/work/KPI.work.browser-adapter.js",
        "team-report/runtime/work/KPI.work.production.history.js",
        "team-report/runtime/work/KPI.work.production.overview.js",
        "team-report/runtime/work/KPI.work.production.draft.js",
        "team-report/runtime/work/KPI.work.team-calendar.js",
        "team-report/runtime/work/KPI.work.team-calendar.selection.js",
        "team-report/runtime/work/KPI.work.team-calendar.draft-actions.js",
        "team-report/runtime/work/KPI.work.team-calendar.equipment-summary.js",
        "team-report/runtime/work/KPI.work.team-calendar.render.js"
      ]
    },
    {
      "key": "workHistory",
      "label": "Work history runtime",
      "scripts": [
        "team-report/runtime/work/history/KPI.work.history.browser-adapter.js",
        "team-report/runtime/work/history/KPI.work.history.core.config.js",
        "team-report/runtime/work/history/KPI.work.history.core.js",
        "team-report/runtime/work/history/KPI.work.history.core.records.js",
        "team-report/runtime/work/history/KPI.work.history.core.storage.js",
        "team-report/runtime/work/history/KPI.work.history.view.layout.js",
        "team-report/runtime/work/history/layout/workspace-state.js",
        "team-report/runtime/work/history/layout/templates.js",
        "team-report/runtime/work/history/KPI.work.history.view.render.js",
        "team-report/runtime/work/history/render/card-parts.js",
        "team-report/runtime/work/history/render/print.js",
        "team-report/runtime/work/history/KPI.work.history.view.actions.js",
        "team-report/runtime/work/history/KPI.work.history.view.actions.search.js",
        "team-report/runtime/work/history/KPI.work.history.view.actions.record.js",
        "team-report/runtime/work/history/KPI.work.history.view.actions.document.js",
        "team-report/runtime/work/history/KPI.work.history.view.js"
      ]
    },
    {
      "key": "auditRecords",
      "label": "Audit records runtime",
      "scripts": [
        "audit/runtime/audit/records/KPI.audit.records.browser-adapter.js",
        "audit/runtime/audit/records/KPI.audit.records.data.js",
        "audit/runtime/audit/records/KPI.audit.records.quarter.js",
        "audit/runtime/audit/records/KPI.audit.records.options.js",
        "audit/runtime/audit/records/KPI.audit.records.ui-actions.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-data.js",
        "audit/runtime/audit/records/KPI.audit.records.evidence.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-preview-actions.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-alerts.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-fullscreen.js",
        "audit/runtime/audit/records/KPI.audit.records.lux-workspace.js",
        "audit/runtime/audit/records/KPI.audit.records.legal.assets.js",
        "audit/runtime/audit/records/KPI.audit.records.legal.form.js",
        "audit/runtime/audit/records/KPI.audit.records.legal.js",
        "audit/runtime/audit/records/KPI.audit.records.batch-actions.js",
        "audit/runtime/audit/records/KPI.audit.records.standard-actions.js",
        "audit/runtime/audit/records/KPI.audit.records.util-format.js",
        "audit/runtime/audit/records/KPI.audit.records.render.js"
      ]
    },
    {
      "key": "energyRuntime",
      "label": "Utility energy runtime",
      "scripts": [
        "utility/runtime/util/energy/KPI.util.energy.browser-adapter.js",
        "utility/runtime/util/energy/KPI.util.energy.dual.js",
        "utility/runtime/util/energy/KPI.util.energy.chart.js",
        "utility/runtime/util/energy/KPI.util.energy.tabs.js",
        "utility/runtime/util/energy/KPI.util.energy.trend-chart.js",
        "utility/runtime/util/energy/KPI.util.energy.segmented-chart.js",
        "utility/runtime/util/energy/KPI.util.energy.multi-series-chart.js",
        "utility/runtime/util/energy/KPI.util.energy.renderers.js",
        "utility/runtime/util/energy/KPI.util.energy.report-composition.js",
        "utility/runtime/util/energy/KPI.util.energy.modal.chart.js"
      ]
    },
    {
      "key": "reportRuntime",
      "label": "Utility report runtime",
      "scripts": [
        "utility/runtime/util/report/KPI.util.report.runtime-adapter.js",
        "utility/runtime/util/report/KPI.util.report.state.options.js",
        "utility/runtime/util/report/KPI.util.report.state.js",
        "utility/runtime/util/report/KPI.util.report.builder.sync.js",
        "utility/runtime/util/report/KPI.util.report.composition-state.js",
        "utility/runtime/util/report/KPI.util.report.formatters.js",
        "utility/runtime/util/report/KPI.util.report.filters.js",
        "utility/runtime/util/report/KPI.util.report.deltas.js",
        "utility/runtime/util/report/KPI.util.report.production.js",
        "utility/runtime/util/report/KPI.util.report.production-preview.js",
        "utility/runtime/util/report/KPI.util.report.runner.js",
        "utility/runtime/util/report/KPI.util.report.tables.js",
        "utility/runtime/util/report/KPI.util.report.table-interactions.js",
        "utility/runtime/util/report/KPI.util.report.detached.styles.js",
        "utility/runtime/util/report/KPI.util.report.detached.js",
        "utility/runtime/util/report/KPI.util.report.builder-viz-popup.js",
        "utility/runtime/util/report/KPI.util.report.modal.base.js",
        "utility/runtime/util/report/KPI.util.report.builder.electric-combined-chart.js",
        "utility/runtime/util/report/KPI.util.report.builder.charts.js",
        "utility/runtime/util/report/KPI.util.report.builder.state.js",
        "utility/runtime/util/report/KPI.util.report.builder.data-model.js",
        "utility/runtime/util/report/KPI.util.report.builder.tables.js",
        "utility/runtime/util/report/KPI.util.report.builder.comparison-tables.js",
        "utility/runtime/util/report/KPI.util.report.builder.modal.js",
        "utility/runtime/util/report/KPI.util.report.graph-modal.js",
        "utility/runtime/util/report/KPI.util.report.secondary-modals.js",
        "utility/runtime/util/report/KPI.util.report.modal.chart-section.js",
        "utility/runtime/util/report/KPI.util.report.modal.composition-overview.js",
        "utility/runtime/util/report/KPI.util.report.modal.render.js",
        "utility/runtime/util/report/KPI.util.report.panel.js"
      ]
    },
    {
      "key": "reportSheet",
      "label": "Utility report sheet runtime",
      "scripts": [
        "utility/runtime/util/report/sheet/config.js",
        "utility/runtime/util/report/sheet/options.js",
        "utility/runtime/util/report/sheet/controls.js",
        "utility/runtime/util/report/sheet/billing.js",
        "utility/runtime/util/report/sheet/electric/table-render.js",
        "utility/runtime/util/report/sheet/electric/runtime-sync.js",
        "utility/runtime/util/report/sheet/electric/meter-model.js",
        "utility/runtime/util/report/sheet/electric/comparison-summary.js",
        "utility/runtime/util/report/sheet/gas/meter-model.js",
        "utility/runtime/util/report/sheet/gas/comparison-summary.js",
        "utility/runtime/util/report/sheet/gas/scoped-metrics.js",
        "utility/runtime/util/report/sheet/gas/runtime-sync.js",
        "utility/runtime/util/report/sheet/panel/runtime.js",
        "utility/runtime/util/report/sheet/panel/preview.js",
        "utility/runtime/util/report/sheet/windows/detached-interactions.js",
        "utility/runtime/util/report/sheet/windows/shells.js",
        "utility/runtime/util/report/sheet/windows.js",
        "utility/runtime/util/report/sheet/modal/actions.js",
        "utility/runtime/util/report/sheet/modal/shell.js",
        "utility/runtime/util/report/sheet/modal/render.js",
        "utility/runtime/util/report/sheet/analysis/state.js",
        "utility/runtime/util/report/sheet/analysis/compare-select.js",
        "utility/runtime/util/report/sheet/analysis/chart-controls.js",
        "utility/runtime/util/report/sheet/analysis/range-ratio.js",
        "utility/runtime/util/report/sheet/analysis/electric/chart-model.js",
        "utility/runtime/util/report/sheet/analysis/electric/model.js",
        "utility/runtime/util/report/sheet/analysis/gas/model.js",
        "utility/runtime/util/report/sheet/analysis/render.js",
        "utility/runtime/util/report/sheet/analysis/popup-tables.js",
        "utility/runtime/util/report/sheet/summary/render.js"
      ]
    },
    {
      "key": "reportSheetTail",
      "label": "Utility report sheet host tail",
      "scripts": [
        "utility/runtime/util/report/KPI.util.report.sheet.helpers.js",
        "utility/runtime/util/report/KPI.util.report.sheet.js"
      ]
    },
    {
      "key": "energyOverride",
      "label": "Utility energy override tail",
      "scripts": [
        "utility/runtime/util/energy/KPI.util.energy.tabs.override.js"
      ]
    },
    {
      "key": "utilityAnalytics",
      "label": "Utility analytics tail",
      "scripts": [
        "utility/runtime/util/analytics/KPI.util.analytics.js"
      ]
    },
    {
      "key": "workRenderers",
      "label": "Work renderer tail",
      "scripts": [
        "team-report/runtime/work/KPI.work.renderers.weekly-actions.js",
        "team-report/runtime/work/KPI.work.renderers.print.js",
        "team-report/runtime/work/KPI.work.renderers.monthly-plan.js",
        "team-report/runtime/work/KPI.work.renderers.js"
      ]
    },
    {
      "key": "appBootstrap",
      "label": "Final app bootstrap",
      "scripts": [
        "utility/runtime/util/KPI.util.runtime.browser-adapter.js",
        "utility/runtime/util/KPI.util.runtime.js",
        "audit/runtime/audit/KPI.audit.runtime.js",
        "team-report/runtime/work/KPI.work.runtime.js",
        "kpi-runtime/app/KPI.app.browser-adapter.js",
        "kpi-runtime/app/KPI.app.shared.js",
        "kpi-runtime/app/KPI.app.auth-owner.js",
        "kpi-runtime/app/KPI.app.navigation.js",
        "kpi-runtime/app/KPI.app.global-save.js",
        "kpi-runtime/app/KPI.app.viewer.js",
        "kpi-runtime/app/KPI.app.js"
      ]
    }
  ]
};
})(this?.['global' + 'This'] || this);
