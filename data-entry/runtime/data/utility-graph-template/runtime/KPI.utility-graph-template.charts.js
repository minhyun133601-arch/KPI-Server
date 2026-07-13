(function registerUtilityGraphTemplateCharts(global) {
  if (!global) return;
  const PARTS_KEY = Symbol.for('kpi.utilityGraphTemplate.parts');
  const parts = global[PARTS_KEY] || (global[PARTS_KEY] = Object.create(null));
  if (!Array.isArray(parts.defaultTableMonths) || !parts.emptyReportData) {
    throw new Error('KpiUtilityGraphTemplate foundation part missing');
  }
  const defaultTableMonths = parts.defaultTableMonths;
  const emptyReportData = parts.emptyReportData;
  const addCircle = (...args) => parts.addCircle(...args);
  const addLine = (...args) => parts.addLine(...args);
  const addPath = (...args) => parts.addPath(...args);
  const addPolygon = (...args) => parts.addPolygon(...args);
  const addRect = (...args) => parts.addRect(...args);
  const addText = (...args) => parts.addText(...args);
  const clampLabelY = (...args) => parts.clampLabelY(...args);
  const clearSvg = (...args) => parts.clearSvg(...args);
  const comma = (...args) => parts.comma(...args);
  const escapeHtml = (...args) => parts.escapeHtml(...args);
  const formatUnitCost = (...args) => parts.formatUnitCost(...args);
  const getPositiveAxisMax = (...args) => parts.getPositiveAxisMax(...args);
  const groupByConsecutiveYear = (...args) => parts.groupByConsecutiveYear(...args);
  const isFiniteNumber = (...args) => parts.isFiniteNumber(...args);
  const normalizeSeries = (...args) => parts.normalizeSeries(...args);
  const round = (...args) => parts.round(...args);
  const setViewBox = (...args) => parts.setViewBox(...args);

  function renderAxisLabel(node, label) {
    if (!node) return;
    node.innerHTML = String(label || '')
      .split('')
      .map(char => `<span>${escapeHtml(char)}</span>`)
      .join('');
  }

  function renderLegend(node, labels) {
    if (!node) return;
    node.innerHTML = `
      <div class="legend-item">
        <span class="legend-bar"></span>
        <span>${escapeHtml(labels.usage || '사용량')}<br>(${escapeHtml(labels.usageUnit || '')})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line legend-line-blue"><i></i></span>
        <span>${escapeHtml(labels.amount || '금액')}<br>(${escapeHtml(labels.amountUnit || '')})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line legend-line-red"><i></i></span>
        <span>${escapeHtml(labels.production || '생산량')}<br>(${escapeHtml(labels.productionUnit || '')})</span>
      </div>
    `;
  }

  function normalizeTopSeries(series) {
    return {
      usage: series.usage ?? series.electricityKwh ?? null,
      amount: series.amount ?? series.amountKrw ?? null,
      production: series.production ?? series.productionKg ?? null
    };
  }

  function buildTopTrendScales(layout, seriesMap) {
    const plotTop = layout.y + 28;
    const plotBottom = layout.y + layout.h - 10;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const bandHeight = Math.max(42, plotHeight * 0.42);
    const centers = {
      production: plotTop + plotHeight * 0.22,
      amount: plotTop + plotHeight * 0.52,
      usage: plotTop + plotHeight * 0.82
    };

    return Object.fromEntries(Object.entries(seriesMap).map(([key, values]) => {
      const band = buildTopTrendBand(centers[key], bandHeight, layout);
      return [key, buildTopTrendScale(values, band)];
    }));
  }

  function buildTopTrendBand(centerY, height, layout) {
    const minTop = layout.y + 8;
    const maxTop = layout.y + layout.h - height;
    const y = Math.max(minTop, Math.min(maxTop, centerY - height / 2));
    return {
      y,
      h: height,
      baseY: y + height
    };
  }

  function buildTopTrendScale(values, band) {
    const domain = getTrendDomain(values);
    const span = domain.max - domain.min;
    return {
      ...band,
      domain,
      yFor(value) {
        const ratio = span > 0 ? (value - domain.min) / span : 0.5;
        return band.y + band.h - Math.max(0, Math.min(1, ratio)) * band.h;
      }
    };
  }

  function getTopTrendLabelBounds(scale, layout) {
    if (!scale) {
      return {
        minY: layout.y + 8,
        maxY: layout.y + layout.h - 8
      };
    }
    return {
      minY: scale.y,
      maxY: scale.baseY
    };
  }

  function getTrendDomain(values) {
    const finiteValues = (Array.isArray(values) ? values : []).filter(isFiniteNumber);
    if (!finiteValues.length) return { min: 0, max: 1 };

    const finiteMin = Math.min(...finiteValues);
    const finiteMax = Math.max(...finiteValues);
    const magnitude = Math.max(Math.abs(finiteMin), Math.abs(finiteMax), 1);
    const finiteRange = Math.max(finiteMax - finiteMin, magnitude * 0.04, 1);
    const min = Math.max(0, finiteMin - finiteRange * 0.28);
    const max = Math.max(min + finiteRange * 0.7, finiteMax + finiteRange * 0.42);

    return { min, max };
  }

  function drawTopChart(svg, months, series, options, labels, title = '') {
    if (!svg) return;
    clearSvg(svg);
    setViewBox(svg, 0, 0, 1098, 320);

    const edgeInset = 1098 / 25 / 2;
    const layout = { x: edgeInset, y: 28, w: 1098 - edgeInset * 2, h: 242, bottom: 270 };
    const usage = normalizeSeries(series.usage, months);
    const amount = normalizeSeries(series.amount, months);
    const production = normalizeSeries(series.production, months);
    const autoScale = options.autoScale === true;
    const trendScales = autoScale
      ? buildTopTrendScales(layout, { usage, amount, production })
      : null;
    const leftMax = autoScale ? null : getPositiveAxisMax(options.leftAxisMax, amount, months, 10000000);
    const usageMax = autoScale ? null : getPositiveAxisMax(options.usageAxisMax || options.rightAxisMax, usage, months, 200000);
    const productionMax = autoScale ? null : getPositiveAxisMax(options.productionAxisMax || options.rightAxisMax, production, months, 200000);
    const xFor = i => layout.x + (months.length <= 1 ? layout.w / 2 : (layout.w / (months.length - 1)) * i);
    const yLeft = trendScales?.amount?.yFor || (value => layout.y + layout.h - (value / leftMax) * layout.h);
    const yUsage = trendScales?.usage?.yFor || (value => layout.y + layout.h - (value / usageMax) * layout.h);
    const yProduction = trendScales?.production?.yFor || (value => layout.y + layout.h - (value / productionMax) * layout.h);
    const labelBounds = {
      usage: getTopTrendLabelBounds(trendScales?.usage, layout),
      amount: getTopTrendLabelBounds(trendScales?.amount, layout),
      production: getTopTrendLabelBounds(trendScales?.production, layout)
    };

    addRect(svg, layout.x, layout.y, layout.w, layout.h, { fill: '#fff', stroke: 'none' });
    if (String(title || '').trim()) {
      addText(svg, 14, 20, String(title || '').trim(), 'utility-graph-title-in-chart', {
        'text-anchor': 'start'
      });
    }
    drawTopChartLegend(svg, layout, labels);

    addLine(svg, layout.x, layout.y + layout.h, layout.x + layout.w, layout.y + layout.h, 'svg-axis-line');

    const barW = 18;
    const usageBaseY = layout.y + layout.h;
    const deferredLabels = [];

    usage.forEach((value, i) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(i);
      const y = yUsage(value);
      addRect(svg, x - barW / 2, Math.min(y, usageBaseY), barW, Math.max(0, usageBaseY - y), {
        fill: 'var(--utility-graph-yellow)',
        stroke: 'none'
      });
      if (options.showDataLabels) {
        const labelText = comma(value);
        const labelY = getRankedSeriesLabelY(value, usage, y, {
          baseOffset: 6,
          spreadOffset: 8,
          minY: labelBounds.usage.minY,
          maxY: labelBounds.usage.maxY
        });
        deferredLabels.push({
          x,
          y: labelY,
          sourceY: y,
          minY: labelBounds.usage.minY,
          maxY: labelBounds.usage.maxY,
          seriesKey: 'usage',
          pointIndex: i,
          fontSize: 10.5,
          text: labelText,
          className: 'svg-data-label-black',
          attrs: {
            'text-anchor': getChartEdgeTextAnchor(i, months.length)
          }
        });
      }
    });

    drawLineSeries(svg, amount, months, xFor, yLeft, {
      stroke: 'var(--utility-graph-blue)',
      strokeWidth: 3.2,
      marker: 'diamond',
      markerFill: 'var(--utility-graph-blue-dark)',
      markerSize: 6,
      labelClass: 'svg-data-label-blue',
      labelFormatter: comma,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 7,
      labelSpreadOffset: 8,
      labelMinY: labelBounds.amount.minY,
      labelMaxY: labelBounds.amount.maxY,
      showLabels: options.showDataLabels,
      edgeTextAnchors: true,
      seriesKey: 'amount',
      labelFontSize: 10.5,
      deferredLabels
    });

    drawLineSeries(svg, production, months, xFor, yProduction, {
      stroke: 'var(--utility-graph-red)',
      strokeWidth: 3.2,
      marker: 'triangle',
      markerFill: 'var(--utility-graph-red)',
      markerSize: 6,
      labelClass: 'svg-data-label-red',
      labelFormatter: comma,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 7,
      labelSpreadOffset: 8,
      labelMinY: labelBounds.production.minY,
      labelMaxY: labelBounds.production.maxY,
      showLabels: options.showDataLabels,
      edgeTextAnchors: true,
      seriesKey: 'production',
      labelFontSize: 10.5,
      deferredLabels
    });

    drawDeferredLabels(svg, resolveDeferredLabelCollisions(deferredLabels));

    months.forEach((month, i) => {
      addText(svg, xFor(i), layout.y + layout.h + 18, month.label || month.key, 'report-auto-chart-month', {
        'text-anchor': getChartEdgeTextAnchor(i, months.length)
      });
    });

    svg.setAttribute('aria-label', `${title ? `${title} ` : ''}${labels.usage || '사용량'}, ${labels.amount || '금액'}, ${labels.production || '생산량'} 복합 차트`);
  }

  function drawTopChartLegend(svg, layout, labels) {
    const items = [
      {
        type: 'bar',
        color: 'var(--utility-graph-yellow)',
        label: `${labels.usage || '사용량'} (${labels.usageUnit || ''})`,
        width: 176
      },
      {
        type: 'line',
        color: 'var(--utility-graph-blue)',
        marker: 'diamond',
        label: `${labels.amount || '금액'} (${labels.amountUnit || ''})`,
        width: 162
      },
      {
        type: 'line',
        color: 'var(--utility-graph-red)',
        marker: 'triangle',
        label: `${labels.production || '생산량'} (${labels.productionUnit || ''})`,
        width: 190
      }
    ];
    const totalWidth = items.reduce((sum, item) => sum + item.width, 0);
    let x = layout.x + Math.max(0, (layout.w - totalWidth) / 2);
    const y = 20;

    items.forEach(item => {
      if (item.type === 'bar') {
        addRect(svg, x, y - 5, 30, 7, { fill: item.color, stroke: 'none' });
      } else {
        addLine(svg, x, y, x + 30, y, '', {
          stroke: item.color,
          'stroke-width': 3,
          'stroke-linecap': 'round'
        });
        drawMarker(svg, x + 15, y, item.marker, item.color, 5);
      }
      addText(svg, x + 38, y + 5, item.label, 'report-auto-chart-legend', {
        'text-anchor': 'start'
      });
      x += item.width;
    });
  }

  function renderUnitCostTable(table, months, labels) {
    if (!table) return;
    table.innerHTML = '';
    const colgroup = document.createElement('colgroup');
    colgroup.innerHTML = months.map(() => '<col />').join('');
    table.appendChild(colgroup);

    const groups = groupByConsecutiveYear(months);
    const thead = document.createElement('thead');
    const yearRow = document.createElement('tr');
    groups.forEach(group => {
      const th = document.createElement('th');
      th.className = 'year-head';
      th.colSpan = group.count;
      th.textContent = `${group.year}년`;
      yearRow.appendChild(th);
    });

    thead.appendChild(yearRow);

    const monthRow = document.createElement('tr');
    months.forEach(month => {
      const th = document.createElement('th');
      th.className = `month-head${month.highlight ? ' highlight' : ''}`;
      th.textContent = month.monthLabel || `${month.month}월`;
      monthRow.appendChild(th);
    });
    thead.appendChild(monthRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const valueRow = document.createElement('tr');
    const rowLabel = document.createElement('th');
    rowLabel.className = 'row-label';
    rowLabel.innerHTML = labels.tableRow || `${escapeHtml(labels.ratio || '원단위')}<br>(${escapeHtml(labels.ratioUnit || '')})`;
    void rowLabel;

    months.forEach(month => {
      const td = document.createElement('td');
      td.className = `data-cell${month.highlight ? ' highlight' : ''}`;
      td.textContent = formatUnitCost(month.value);
      valueRow.appendChild(td);
    });

    tbody.appendChild(valueRow);
    table.appendChild(tbody);
  }

  function drawBottomChart(svg, months, series, options, labels) {
    if (!svg) return;
    clearSvg(svg);
    setViewBox(svg, 0, 0, 1098, 252);

    const layout = { x: 0, y: 18, w: 1098, h: 204 };
    const values = normalizeSeries(series, months);
    const finiteValues = values.filter(isFiniteNumber);
    const finiteMin = finiteValues.length ? Math.min(...finiteValues) : 0;
    const finiteMax = finiteValues.length ? Math.max(...finiteValues) : 0;
    const finiteRange = Math.max(finiteMax - finiteMin, Math.abs(finiteMax) * 0.18, 0.06);
    const yMin = Number.isFinite(options.yMin)
      ? options.yMin
      : Math.max(0, finiteMin - finiteRange * 0.28);
    const yMax = Number.isFinite(options.yMax) && options.yMax > yMin
      ? options.yMax
      : Math.max(yMin + 0.08, finiteMax + finiteRange * 0.42);
    const monthW = months.length ? layout.w / months.length : layout.w;
    const xFor = i => layout.x + (months.length <= 1 ? layout.w / 2 : monthW * (i + 0.5));
    const yFor = value => layout.y + layout.h - ((value - yMin) / (yMax - yMin)) * layout.h;

    addRect(svg, layout.x, layout.y, layout.w, layout.h, { fill: '#fff', stroke: 'none' });
    drawBottomChartInlineLabel(svg, labels, layout);
    addLine(svg, layout.x, layout.y + layout.h, layout.x + layout.w, layout.y + layout.h, 'report-auto-chart-axis');

    const deferredLabels = [];
    drawLineSeries(svg, values, months, xFor, yFor, {
      stroke: '#111827',
      strokeWidth: 3.2,
      marker: 'circle',
      markerFill: '#111827',
      labelClass: 'report-auto-chart-label',
      labelAttrs: { fill: '#111827' },
      labelFormatter: formatUnitCost,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 6,
      labelSpreadOffset: 8,
      labelMinY: layout.y + 12,
      labelMaxY: layout.y + layout.h - 8,
      showLabels: options.showDataLabels,
      markerSize: 4,
      seriesKey: 'ratio',
      labelFontSize: 10.2,
      deferredLabels
    });

    drawComparisonArrows(svg, months, values, xFor, yFor, options.comparisonKeys || []);
    drawDeferredLabels(svg, resolveDeferredLabelCollisions(deferredLabels));

    months.forEach((month, i) => {
      addText(svg, xFor(i), layout.y + layout.h + 10, month.monthLabel || `${month.month}월`, 'report-auto-chart-month report-auto-chart-bottom-month', {
        'text-anchor': i === 0 ? 'start' : (i === months.length - 1 ? 'end' : 'middle')
      });
    });

    svg.setAttribute('aria-label', `${labels.ratio || '원단위'} 추이`);
  }

  function drawBottomChartInlineLabel(svg, labels, layout) {
    const site = String(labels.site || '').trim();
    const ratio = String(labels.ratio || '').trim();
    const unit = String(labels.ratioUnit || '').trim();
    const title = [site, ratio].filter(Boolean).join(' · ');
    if (!title && !unit) return;
    addText(svg, layout.x + 12, layout.y + 16, title, 'report-auto-chart-inline-label is-title', {
      'text-anchor': 'start'
    });
    if (unit) {
      addText(svg, layout.x + 12, layout.y + 30, `(${unit})`, 'report-auto-chart-inline-label is-unit', {
        'text-anchor': 'start'
      });
    }
  }

  function renderBottomChart(root, data) {
    const svg = root.querySelector('[data-role="utility-graph-bottom-chart"]');
    const reportHost = root.querySelector('[data-role="utility-graph-bottom-chart-report"]');
    if (reportHost) {
      reportHost.innerHTML = '';
      reportHost.hidden = true;
      reportHost.toggleAttribute('hidden', true);
    }
    if (svg) {
      svg.hidden = false;
      svg.toggleAttribute('hidden', false);
      svg.setAttribute('aria-hidden', 'false');
    }

    drawBottomChart(
      svg,
      data.bottomMonths || defaultTableMonths,
      data.bottomSeries,
      data.options?.bottom || emptyReportData.options.bottom,
      data.labels
    );
  }

  function drawComparisonArrows(svg, months, values, xFor, yFor, keys) {
    if (!keys.length) return;
    keys.forEach(key => {
      const index = months.findIndex(month => month.key === key);
      if (index < 0 || !isFiniteNumber(values[index])) return;
      const x = xFor(index);
      const targetY = yFor(values[index]);
      addCircle(svg, x, targetY, 6, {
        fill: 'none',
        stroke: 'var(--utility-graph-red)',
        'stroke-width': 2
      });
    });
  }

  function drawLineSeries(svg, values, months, xFor, yFor, config) {
    let d = '';
    let isOpen = false;

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) {
        isOpen = false;
        return;
      }
      const x = xFor(index);
      const y = yFor(value);
      d += `${isOpen ? ' L' : ' M'}${round(x)} ${round(y)}`;
      isOpen = true;
    });

    if (d.trim()) {
      const path = addPath(svg, d, {
        fill: 'none',
        stroke: config.stroke,
        'stroke-width': config.strokeWidth,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
      });
      if (config.dashed) path.setAttribute('stroke-dasharray', '7 5');
    }

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(index);
      const y = yFor(value);
      drawMarker(svg, x, y, config.marker, config.markerFill, config.markerSize);
    });

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(index);
      const y = yFor(value);
      if (config.showLabels) {
        const labelText = config.labelFormatter(value);
        const labelY = config.labelPlacement === 'ranked-above'
          ? getRankedSeriesLabelY(value, values, y, {
              baseOffset: config.labelBaseOffset,
              spreadOffset: config.labelSpreadOffset,
              minY: config.labelMinY,
              maxY: config.labelMaxY
            })
          : placeDistributedLabelY(x, y, labelText, {
              offsets: rotateLabelOffsets(
                Array.isArray(config.labelOffsets) && config.labelOffsets.length
                  ? config.labelOffsets
                  : [config.labelDy || 0],
                index
              ),
              minY: config.labelMinY,
              maxY: config.labelMaxY,
              placedLabels: config.placedLabels,
              fontSize: 11
            });
        const attrs = {
          'text-anchor': config.edgeTextAnchors ? getChartEdgeTextAnchor(index, months.length) : 'middle',
          ...(config.labelAttrs || {})
        };
        if (Array.isArray(config.deferredLabels)) {
          config.deferredLabels.push({
            x,
            y: labelY,
            sourceY: y,
            minY: config.labelMinY,
            maxY: config.labelMaxY,
            seriesKey: config.seriesKey || '',
            pointIndex: index,
            fontSize: config.labelFontSize || 11,
            text: labelText,
            className: config.labelClass,
            attrs
          });
        } else {
          addText(svg, x, labelY, labelText, config.labelClass, attrs);
        }
      }
    });
  }

  function drawDeferredLabels(svg, labels) {
    if (!svg || !Array.isArray(labels)) return;
    labels.forEach(label => {
      addText(svg, label.x, label.y, label.text, label.className, label.attrs || {});
    });
  }

  function resolveDeferredLabelCollisions(labels) {
    if (!Array.isArray(labels) || labels.length <= 1) return labels || [];

    const placed = [];
    return labels.map(label => {
      if (!label || !isFiniteNumber(label.x) || !isFiniteNumber(label.y)) return label;
      const sourceY = isFiniteNumber(label.sourceY) ? label.sourceY : label.y;
      const minY = isFiniteNumber(label.minY) ? label.minY : 0;
      const maxY = isFiniteNumber(label.maxY) ? label.maxY : 9999;
      const fontSize = isFiniteNumber(label.fontSize) ? label.fontSize : 11;
      const candidates = buildLabelCollisionCandidates(label.y, sourceY, minY, maxY);
      const blockers = placed.filter(placedLabel =>
        placedLabel &&
        placedLabel.seriesKey !== label.seriesKey
      );
      const chosenY = chooseNonOverlappingLabelY(label.x, label.text, fontSize, candidates, blockers, sourceY, label.attrs);
      const placedLabel = {
        ...label,
        y: chosenY,
        box: buildLabelBox(label.x, chosenY, label.text, fontSize, label.attrs),
        seriesKey: label.seriesKey,
        pointIndex: label.pointIndex
      };
      placed.push(placedLabel);
      return placedLabel;
    });
  }

  function buildLabelCollisionCandidates(currentY, sourceY, minY, maxY) {
    const offsets = [
      currentY - sourceY,
      -4,
      -10,
      -17,
      -25,
      10,
      18,
      27,
      -34,
      36
    ];
    return Array.from(new Set(offsets
      .map(offset => round(clampLabelY(sourceY + offset, minY, maxY)))
      .concat([round(clampLabelY(currentY, minY, maxY))])));
  }

  function chooseNonOverlappingLabelY(x, text, fontSize, candidates, blockers, sourceY, attrs = {}) {
    let best = null;
    for (const candidateY of candidates) {
      const box = buildLabelBox(x, candidateY, text, fontSize, attrs);
      const overlapScore = getLabelOverlapScore(box, blockers.map(blocker => blocker.box).filter(Boolean));
      const distanceScore = Math.abs(candidateY - sourceY) / 1000;
      const aboveMarkerScore = candidateY <= sourceY ? 0 : 0.08;
      const score = overlapScore + distanceScore + aboveMarkerScore;
      if (overlapScore <= 0) return candidateY;
      if (!best || score < best.score) best = { y: candidateY, score };
    }
    return best?.y ?? candidates[0] ?? sourceY;
  }

  function getChartEdgeTextAnchor(index, total) {
    if (index === 0) return 'start';
    if (index === total - 1) return 'end';
    return 'middle';
  }

  function getRankedSeriesLabelY(value, values, sourceY, options = {}) {
    const rank = getSeriesValueRank(value, values);
    const baseOffset = Number.isFinite(Number(options.baseOffset)) ? Number(options.baseOffset) : 7;
    const spreadOffset = Number.isFinite(Number(options.spreadOffset)) ? Number(options.spreadOffset) : 8;
    return clampLabelY(sourceY - (baseOffset + spreadOffset * rank), options.minY, options.maxY);
  }

  function getSeriesValueRank(value, values) {
    if (!isFiniteNumber(value)) return 0;
    const finiteValues = (Array.isArray(values) ? values : []).filter(isFiniteNumber);
    if (!finiteValues.length) return 0;
    const min = Math.min(...finiteValues);
    const max = Math.max(...finiteValues);
    if (max <= min) return 0.5;
    return (value - min) / (max - min);
  }

  function rotateLabelOffsets(offsets, index) {
    if (!Array.isArray(offsets) || offsets.length <= 1) return offsets || [0];
    const start = index % offsets.length;
    return offsets.slice(start).concat(offsets.slice(0, start));
  }

  function placeDistributedLabelY(x, sourceY, text, options = {}) {
    const placedLabels = Array.isArray(options.placedLabels) ? options.placedLabels : null;
    const offsets = Array.isArray(options.offsets) && options.offsets.length ? options.offsets : [0];
    const fontSize = Number.isFinite(Number(options.fontSize)) ? Number(options.fontSize) : 11;
    const candidates = offsets
      .concat(offsets.map(offset => offset + (offset >= 0 ? 18 : -18)))
      .map(offset => clampLabelY(sourceY + offset, options.minY, options.maxY));
    const uniqueCandidates = Array.from(new Set(candidates.map(value => round(value))));
    const fallbackY = uniqueCandidates[0] ?? clampLabelY(sourceY, options.minY, options.maxY);

    if (!placedLabels) return fallbackY;

    let best = null;
    for (const candidateY of uniqueCandidates) {
      const box = buildLabelBox(x, candidateY, text, fontSize);
      const overlapScore = getLabelOverlapScore(box, placedLabels);
      const score = overlapScore + (Math.abs(candidateY - sourceY) / 1000);
      if (overlapScore <= 0) {
        placedLabels.push(box);
        return candidateY;
      }
      if (!best || score < best.score) best = { y: candidateY, box, score };
    }

    const chosen = best || { y: fallbackY, box: buildLabelBox(x, fallbackY, text, fontSize) };
    placedLabels.push(chosen.box);
    return chosen.y;
  }

  function buildLabelBox(x, y, text, fontSize = 11, attrs = {}) {
    const width = Math.max(24, String(text || '').length * fontSize * 0.62);
    const height = fontSize + 5;
    const anchor = attrs?.['text-anchor'] || 'middle';
    const left = anchor === 'start'
      ? x - 3
      : anchor === 'end'
        ? x - width - 3
        : x - width / 2 - 3;
    const right = anchor === 'start'
      ? x + width + 3
      : anchor === 'end'
        ? x + 3
        : x + width / 2 + 3;
    return {
      left,
      right,
      top: y - height + 2,
      bottom: y + 4
    };
  }

  function getLabelOverlapScore(box, placedLabels) {
    return placedLabels.reduce((score, placed) => {
      const xOverlap = Math.max(0, Math.min(box.right, placed.right) - Math.max(box.left, placed.left));
      const yOverlap = Math.max(0, Math.min(box.bottom, placed.bottom) - Math.max(box.top, placed.top));
      return score + (xOverlap * yOverlap);
    }, 0);
  }

  function drawMarker(svg, x, y, type, fill, size = 5) {
    if (type === 'diamond') {
      addPolygon(svg, `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`, { fill });
      return;
    }
    if (type === 'triangle') {
      addPolygon(svg, `${x},${y - size - 1} ${x + size + 1},${y + size} ${x - size - 1},${y + size}`, { fill });
      return;
    }
    addCircle(svg, x, y, size, { fill });
  }


  Object.assign(parts, {
    renderAxisLabel,
    renderLegend,
    normalizeTopSeries,
    drawTopChart,
    renderUnitCostTable,
    renderBottomChart
  });
})(this);
