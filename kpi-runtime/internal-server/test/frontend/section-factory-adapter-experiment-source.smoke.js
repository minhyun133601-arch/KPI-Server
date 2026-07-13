import assert from 'node:assert/strict';
import test from 'node:test';

import { createRegisteredSections } from './support/section-factory-harness.js';

test('section factory adapter preserves experiment source contracts and keeps section globals private', () => {
  const { sectionSources } = createRegisteredSections();
  const experimentSource = sectionSources
    .filter(({ filename }) => filename.startsWith('KPI.sections.experiment'))
    .map(({ source }) => source)
    .join('\n')
    .replace(/\bparts\.(?=[A-Za-z_$][\w$]*\s*\()/g, '');
  assert.match(experimentSource, /showLabels:\s*true/);
  assert.match(experimentSource, /yearOverlap:\s*false/);
  assert.match(experimentSource, /yearOverlapYears:\s*\[\]/);
  assert.match(experimentSource, /buildYearOverlapSeries/);
  assert.match(experimentSource, /const\s+EXPERIMENT_DISTINCT_SERIES_COLORS\s*=\s*Object\.freeze\(\[/);
  assert.match(experimentSource, /function\s+resolveExperimentSeriesColor/);
  assert.match(experimentSource, /color:\s*resolveExperimentSeriesColor\(card,\s*seriesIndex/);
  assert.match(experimentSource, /function\s+buildCardBuilderStepOptionHtml/);
  assert.match(experimentSource, /contextParts\s*=\s*\[\]/);
  assert.match(experimentSource, /\.join\(' \/ '\)/);
  assert.match(experimentSource, /const\s+CARD_BUILDER_CATEGORIES\s*=\s*Object\.freeze\(\[/);
  assert.match(experimentSource, /function\s+getCardBuilderCategoryOptions/);
  assert.match(experimentSource, /function\s+getAutoSelectedCardBuilderDetailKey/);
  assert.match(experimentSource, /return detailOptions\.length === 1 \? detailOptions\[0\]\.key : '';/);
  assert.match(experimentSource, /function\s+syncRatioPartControls/);
  assert.match(experimentSource, /function\s+getRatioPartSelectedCardKey/);
  assert.match(experimentSource, /function\s+syncInlineRatioBuilder/);
  assert.match(experimentSource, /addInlineRatioCard\(trigger\)/);
  assert.match(experimentSource, /getCurrentBuilderCardKey\(shell\)/);
  assert.match(
    experimentSource,
    /Object\.freeze\(\{\s*key:\s*'ratio',\s*label:\s*'ratio',\s*scale:\s*1,\s*decimals:\s*1\s*\}\)/
  );
  assert.match(
    experimentSource,
    /const\s+decimals\s*=\s*1;\s*return Object\.freeze\(\{[\s\S]*?metricKind:\s*'derived-ratio'/
  );
  assert.doesNotMatch(experimentSource, /isDerivedRatioCard\(card\)\s*\?\s*3\s*:\s*0/);
  assert.match(experimentSource, /function\s+getRatioSummarySubjectOptions/);
  assert.match(experimentSource, /function\s+getRatioLineSelectionKeys/);
  assert.match(experimentSource, /function\s+isBasicProductionDetailPickerEnabled/);
  assert.match(experimentSource, /function\s+resolveProductionDetailSelection/);
  assert.match(experimentSource, /function\s+resolveProductionDetailSelectionForShell/);
  assert.match(experimentSource, /function\s+getProductionDetailCardKeyForLineKeys/);
  assert.match(experimentSource, /function\s+ensureGeneratedProductionAnalysisCard/);
  assert.match(
    experimentSource,
    /return buildSummaryLinePickerOptionsHtml\(scopeKey,\s*resolveProductionDetailSelectionForShell\(shell,\s*scopeKey\)\);/
  );
  assert.match(experimentSource, /function\s+setCardDetailPickerOpen/);
  assert.match(experimentSource, /function\s+openCardDetailPickerAfterTargetSelection/);
  assert.match(experimentSource, /function\s+shouldAutoOpenRatioLinePicker/);
  assert.match(experimentSource, /function\s+openRatioLinePickerAfterScopeSelection/);
  assert.match(experimentSource, /function\s+setRatioLinePickerOpen/);
  assert.match(experimentSource, /targetKey === 'production'/);
  assert.match(experimentSource, /selectCardDetailFromPopup\(input\)/);
  assert.match(experimentSource, /openCardDetailPickerAfterTargetSelection\(select\)/);
  assert.match(experimentSource, /openRatioLinePickerAfterScopeSelection\(select\)/);
  assert.match(
    experimentSource,
    /\.\.\.getSummaryLineOptionsForScope\(scope\)[\s\S]*?\.map\(option => getSummarySubjectOption\(option\.subjectKey\)\)/
  );
  assert.match(
    experimentSource,
    /return getRatioSummarySubjectOptions\(scope\)[\s\S]*?getRatioDetailOptions\(role,\s*subject\.key,\s*scope,\s*counterpartKey,\s*normalizedMode\)/
  );
  assert.match(experimentSource, /findCardBuilderSelectionForCard\(requestedCardKey,\s*allowedKeys\)/);
  assert.match(experimentSource, /data-exp-ratio-mode/);
  assert.match(experimentSource, /getRatioModeOptions\(role,\s*counterpartKey\)/);
  assert.match(experimentSource, /getRatioScopeOptions\(role,\s*counterpartKey,\s*modeKey\)/);
  assert.match(experimentSource, /getRatioCategoryOptions\(role,\s*scopeKey,\s*counterpartKey,\s*modeKey\)/);
  assert.match(
    experimentSource,
    /getRatioDetailOptions\(role,\s*categoryKey,\s*scopeKey,\s*counterpartKey,\s*modeKey\)/
  );
  assert.match(experimentSource, /const\s+viewMode\s*=\s*getExperimentChartViewMode\(shell\);/);
  assert.match(experimentSource, /summaryItems:\s*viewMode === 'table'\s*\?\s*\[\]\s*:\s*selectedCards\.map/);
  assert.match(experimentSource, /function\s+getExperimentTableUnitHeaderLabel\(seriesList = \[\]\)/);
  assert.match(experimentSource, /class="experiment-chart-table-number">\$\{escapeHtml\(tableNumber\)\}<\/span>/);
  assert.match(experimentSource, /function\s+buildExperimentChartTableEntries\(seriesList = \[\],\s*cards = \[\]\)/);
  assert.match(
    experimentSource,
    /function\s+buildExperimentChartSingleTableHtml\(entry,\s*shell = null,\s*index = 0\)/
  );
  assert.match(experimentSource, /function\s+buildExperimentChartTableMemo\(entry,\s*shell = null\)/);
  assert.match(experimentSource, /function\s+roundExperimentChartMemoDisplayValue\(value,\s*metric = \{\}\)/);
  assert.match(
    experimentSource,
    /function\s+buildExperimentChartMemoDisplayPair\(referenceValue,\s*currentValue,\s*metric = \{\}\)/
  );
  assert.match(experimentSource, /function\s+buildExperimentChartTableMemoBoardHtml\(entries = \[\],\s*shell = null\)/);
  assert.match(experimentSource, /function\s+getExperimentTableMemoCopyText\(board = null\)/);
  assert.match(experimentSource, /function\s+getExperimentTableMemoLineCopyText\(line = null\)/);
  assert.match(experimentSource, /function\s+copyExperimentChartTableMemo\(trigger\)/);
  assert.match(experimentSource, /const\s+line\s*=\s*trigger\?\.closest\?\.\('\[data-exp-chart-table-memo\]'\);/);
  assert.match(
    experimentSource,
    /const\s+copyText\s*=\s*line\s*\?\s*getExperimentTableMemoLineCopyText\(line\)\s*:\s*getExperimentTableMemoCopyText\(board\);/
  );
  assert.match(experimentSource, /copyTableMemo\(trigger\)\s*\{\s*void copyExperimentChartTableMemo\(trigger\);/);
  assert.match(experimentSource, /data-exp-chart-table-set data-exp-table-count="\$\{tableCount\}"/);
  assert.match(experimentSource, /class="experiment-chart-table-grid"/);
  assert.match(
    experimentSource,
    /class="experiment-chart-table-memo-board" data-exp-chart-table-memo-board aria-label="특이사항"/
  );
  assert.match(experimentSource, /data-exp-chart-table-memo-copy/);
  assert.match(experimentSource, /onclick="KpiExperimentGraphPrototype\.copyTableMemo\(this\)">복사<\/button>/);
  assert.doesNotMatch(experimentSource, /data-exp-chart-table-memo-copy aria-label="특이사항 복사"/);
  assert.match(experimentSource, /data-exp-chart-table-memo-text/);
  assert.match(
    experimentSource,
    /class="experiment-chart-table-memo-segment is-\$\{escapeHtml\(segment\.direction \|\| 'flat'\)\}"/
  );
  assert.match(experimentSource, /buildExperimentChartMemoComparisonSegment\(metric,\s*'전년대비'/);
  assert.match(experimentSource, /buildExperimentChartMemoComparisonSegment\(metric,\s*'전월대비'/);
  assert.doesNotMatch(experimentSource, /experiment-chart-table-row-unit/);
  assert.doesNotMatch(experimentSource, /<th>구분<\/th>/);
  assert.match(
    experimentSource,
    /const\s+SUMMARY_EFFICIENCY_METRIC_KEYS\s*=\s*Object\.freeze\(\[[\s\S]*?'work_time'[\s\S]*?'total_work_time'[\s\S]*?'equipment_capa'[\s\S]*?\]\);/
  );
  assert.match(
    experimentSource,
    /const\s+SUMMARY_DETAIL_METRIC_KEYS\s*=\s*Object\.freeze\(\[[\s\S]*?'production_days'[\s\S]*?'product_count'[\s\S]*?'stick_ea'[\s\S]*?'rework_production'[\s\S]*?\]\);/
  );
  assert.match(experimentSource, /function\s+isSummaryCardBuilderMode/);
  assert.match(experimentSource, /function\s+isSummarySubjectInScope/);
  assert.match(experimentSource, /function\s+getScopedSummaryMetricOptions/);
  assert.match(experimentSource, /getScopedSummaryMetricOptions\(targetKey,\s*shell,\s*normalizedMode,\s*scopeKey\)/);
  assert.match(experimentSource, /getScopedSummaryMetricOptions\(categoryKey,\s*null,\s*normalizedMode,\s*scopeKey\)/);
  const cardBuilderTargetBlock =
    experimentSource.match(/const\s+CARD_BUILDER_TARGETS\s*=\s*Object\.freeze\(\[[\s\S]*?\]\);/)?.[0] || '';
  assert.match(cardBuilderTargetBlock, /key:\s*'bukjeong'/);
  assert.doesNotMatch(cardBuilderTargetBlock, /key:\s*'team-01-01'/);
  assert.doesNotMatch(experimentSource, /function\s+matchesCardBuilderTeamTarget/);
  assert.doesNotMatch(experimentSource, /function\s+syncCardBuilderControlsSimple/);
  assert.match(
    experimentSource,
    /function\s+buildProductionCardBuilderDetails\(targetKey = 'total'\)\s*\{[\s\S]*?const\s+target\s*=\s*normalizeCardBuilderScopeKey\(targetKey\);[\s\S]*?getSummaryLineOptionsForScope\(target\)[\s\S]*?addProductionLineCardBuilderOption\(options,\s*target,\s*lineOption\)/
  );
  assert.match(
    experimentSource,
    /addCardBuilderOption\(options,\s*'electric-usage',\s*'전기 사용량'\);\s*addCardBuilderOption\(options,\s*'lng-usage',\s*'LNG 사용량'\);\s*addCardBuilderOption\(options,\s*'lpg-usage',\s*'LPG 사용량'\);\s*addCardBuilderOption\(options,\s*'waste-discharge',\s*'폐수 방류량'\);/
  );
  assert.match(experimentSource, /addCardBuilderOption\(options,\s*'waste-discharge-bukjeong',\s*'폐수 방류량'\);/);
  assert.match(experimentSource, /addCardBuilderOption\(options,\s*'waste-discharge-yusan',\s*'폐수 방류량'\);/);
  assert.match(experimentSource, /addCardBuilderOption\(options,\s*'waste-cost-bukjeong',\s*'폐수 비용'\);/);
  assert.match(experimentSource, /addCardBuilderOption\(options,\s*'waste-cost-yusan',\s*'폐수 비용'\);/);
  assert.match(
    experimentSource,
    /addCardBuilderOption\(options,\s*'cost-yusan',\s*'전체 비용'\);\s*addCardBuilderOption\(options,\s*'cost-yusan-excluding-waste',\s*'폐수 제외 비용'\);/
  );
  assert.match(
    experimentSource,
    /if \(cardKey === 'lpg-usage'\) return getUtilityValueByDataKey\('work_team_calendar_overview', monthKey, 'lpgUsage'\);/
  );
  assert.match(
    experimentSource,
    /if \(cardKey === 'waste-discharge-bukjeong'\) return getUtilityValueByDataKey\('work_team_calendar_group_bukjeong', monthKey, 'wasteUsage'\);/
  );
  assert.match(
    experimentSource,
    /if \(cardKey === 'waste-cost-yusan'\) return getUtilityValueByDataKey\('work_team_calendar_group_yusan', monthKey, 'wasteCost'\);/
  );
  assert.match(
    experimentSource,
    /if \(cardKey === 'cost-yusan-excluding-waste'\) return getCostYusanExcludingWasteValue\(monthKey\);/
  );
  assert.match(
    experimentSource,
    /const summaryCard = parseSummaryCardKey\(cardKey\);[\s\S]*?return Number\.isFinite\(liveValue\) \? liveValue : NaN;/
  );
  assert.doesNotMatch(experimentSource, /summaryCard[\s\S]{0,220}resolveSeriesValue\(card\?\.values/);
  assert.match(
    experimentSource,
    /function\s+filterExperimentPeriodByAvailableValues\(cards = \[\], period = \{\}, shell = null\)/
  );
  assert.match(
    experimentSource,
    /const valuePeriod = filterExperimentPeriodByAvailableValues\(selectedCards, period, shell\);/
  );
  assert.match(
    experimentSource,
    /const monthKeys = Array\.isArray\(period\?\.monthKeys\)\s*\?\s*period\.monthKeys\s*:\s*buildMonthKeys/
  );
  assert.match(experimentSource, /denominatorValue === 0\) return NaN;/);
  assert.doesNotMatch(
    experimentSource,
    /if \(target === 'total'\) \{[\s\S]*?WASTE_COST_DETAIL_DEFINITIONS\.forEach\(item => addCardBuilderOption\(options, item\.key, item\.title\)\);[\s\S]*?return options;/
  );
  assert.match(
    experimentSource,
    /function\s+addTeamCostCardBuilderDetails\(options,\s*teamKey = '',\s*totalLabel = '전체 비용'\)/
  );
  assert.match(
    experimentSource,
    /addCardBuilderOption\(options,\s*'cost-bukjeong',\s*'북정 전체 비용'\);\s*addCardBuilderOption\(options,\s*'waste-cost-bukjeong',\s*'폐수 비용'\);\s*addTeamCostCardBuilderDetails\(options,\s*'team-01-01',\s*'1팀 1파트 비용'\);/
  );
  assert.match(experimentSource, /function\s+resetCardBuilderSelection/);
  assert.match(experimentSource, /function\s+syncCardBuilderControlsLegacy/);
  assert.match(experimentSource, /const SUMMARY_LINE_SELECTION_MATCHES = Object\.freeze\(\[/);
  assert.match(experimentSource, /subjectKey: 'ica'[\s\S]*lineKeys: Object\.freeze\(\['ica-1', 'ica-2', 'ica-3'\]\)/);
  assert.match(
    experimentSource,
    /function\s+resolveSummaryLineSelectionSubject\(scopeKey = 'total', selectedLineKeys = \[\]\)/
  );
  assert.match(
    experimentSource,
    /if \(normalizedKeys\.length === options\.length\) return getSummarySubjectOption\(normalizeCardBuilderScopeKey\(scopeKey\)\);/
  );
  assert.match(experimentSource, /function\s+ensureGeneratedSummaryAnalysisCard\(subject = null, metricOrKey = ''\)/);
  assert.match(experimentSource, /addGeneratedSummaryCard\(shell, card\);/);
  assert.match(
    experimentSource,
    /resetCardBuilderSelection\(shell\);\s*setInlineRatioBuilderOpen\(shell,\s*false\);\s*syncCardBuilderControlsLegacy\(shell\);/
  );
  assert.match(experimentSource, /selectBuilderStep\(select\)/);
  assert.doesNotMatch(experimentSource, /headerToolsHtml:\s*buildExperimentChartToolsHtml\(period\)/);
  assert.match(experimentSource, /data-exp-card-remove-key/);
  assert.match(experimentSource, /directCardKey\s*=\s*String\(trigger\?\.dataset\?\.expCardRemoveKey/);
  assert.match(experimentSource, /seriesBadge:\s*\{/);
  assert.doesNotMatch(experimentSource, /data-exp-card-group-note/);
  assert.doesNotMatch(experimentSource, /선택 지표 월별 표/);
  assert.match(experimentSource, /if\s*\(\s*points\.length < 2\s*\)\s*return \[\];/);
  assert.match(experimentSource, /function\s+syncYearOverlapYearControls/);
  assert.match(experimentSource, /toggleOverlapYear\(trigger\)/);
  assert.match(experimentSource, /function\s+toggleExperimentFullscreen/);
  assert.doesNotMatch(experimentSource, /launchTarget:\s*'popup'/);
  assert.match(experimentSource, /reportValueOrderLabels:\s*period\?\.yearOverlap === true/);
  assert.match(experimentSource, /if \(period\?\.yearOverlap === true\) \{\s*return '';\s*\}/);
  assert.match(experimentSource, /label:\s*String\(year\)/);
  assert.match(experimentSource, /dedupeLegend:\s*period\?\.yearOverlap === true/);
  assert.match(experimentSource, /hideHeadingText:\s*true/);
  assert.match(experimentSource, /hideTopCenterTitle:\s*true/);
  assert.match(experimentSource, /hidePeriodLabel:\s*true/);
  assert.match(experimentSource, /hideRangeMeta:\s*true/);
  assert.match(experimentSource, /hideLegend:\s*false/);
  assert.match(experimentSource, /showViewToggle:\s*false/);
  assert.match(experimentSource, /selectChartView\(trigger\)/);
  assert.match(experimentSource, /function\s+syncExperimentChartViewToggle/);
  assert.doesNotMatch(experimentSource, /rangeMetaMode:\s*'labeled-min-max'/);
  assert.match(experimentSource, /suppressChartLabelToggle:\s*true/);
  assert.doesNotMatch(experimentSource, /hideLabelToggle:\s*true/);
  assert.doesNotMatch(experimentSource, /선택 지표 통합 그래프/);
  assert.doesNotMatch(experimentSource, /월별 실제값/);
  assert.match(experimentSource, /const\s+COST_CARDS\s*=\s*Object\.freeze\(\[/);
  assert.match(experimentSource, /function\s+getCostYusanValue\(monthKey = ''\)/);
  assert.match(experimentSource, /if \(cardKey === 'cost-total'\) return getCostTotalValue\(monthKey\);/);
  assert.doesNotMatch(experimentSource, /label:\s*formatSeriesLabelWithUnit\(`\$\{year\} \$\{card\.title\}`/);
  assert.match(experimentSource, /const mode = String\(state\.displayModes\?\.\[card\.key\] \|\| ''\)/);
  assert.match(experimentSource, /lineWidth:\s*3\.2/);
  assert.match(experimentSource, /function\s+getCompactAnalysisCardTitle/);
  assert.match(experimentSource, /getCompactAnalysisCardTitle\(card\)/);
  assert.doesNotMatch(
    experimentSource,
    /<div class="util-sheet-analysis-summary-value">\$\{escapeHtml\(card\.valueText\)\}<\/div>/
  );
  const nonAdapterSources = sectionSources
    .filter(({ filename }) => filename !== 'KPI.section.factory-adapter.js')
    .map(({ source }) => source)
    .join('\n');
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionFactories/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionBuilders/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionRegistry/);
});
