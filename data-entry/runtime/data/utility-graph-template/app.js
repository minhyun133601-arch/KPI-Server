(function registerUtilityGraphTemplate(global) {
  if (!global) return;
  const PARTS_KEY = Symbol.for('kpi.utilityGraphTemplate.parts');
  const parts = global[PARTS_KEY] || (global[PARTS_KEY] = Object.create(null));
  const requiredParts = ['createEmptyData', 'mergeReportData', 'render', 'buildMonths'];
  if (requiredParts.some(name => typeof parts[name] !== 'function')) {
    throw new Error('KpiUtilityGraphTemplate required part missing');
  }
  const createEmptyData = parts.createEmptyData;
  const mergeReportData = parts.mergeReportData;
  const render = parts.render;
  const buildMonths = parts.buildMonths;

  if (!global) return;

  global.KpiUtilityGraphTemplate = {
    createEmptyData,
    mergeData: mergeReportData,
    render,
    buildMonths
  };

  if (global.document) {
    global.document.addEventListener('DOMContentLoaded', () => {
      const standalone = global.document.getElementById('energyReport');
      if (standalone) render(standalone, {});
    });
  }
})(this);
