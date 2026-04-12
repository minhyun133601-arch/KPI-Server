/* PURE_LOGIC_START */
  // ============================================================================
  // Pure Logic
  // ============================================================================

  // Shared constants and regression fixtures.
  const SCORE_SCALE = Object.freeze({ S: 1.10, A: 1.00, B: 0.85, C: 0.70, D: 0.55 });
  const INTEGER_UNITS = new Set(["건수", "개", "횟수", "일"]);
  const SECTION_LABELS = ["1분기", "2분기", "3분기", "4분기"];
  const MAX_ROWS = 6;
  const DEFAULT_ROWS = 5;
  const REGRESSION_DATA = [
    { name: "설비 가동률 증대", weight: 20, unitType: "건수", target: 0, floor: 1.25, actual: 2 },
    { name: "자체 정비 비용 절감", weight: 30, unitType: "건수", target: 2, floor: 0, actual: 2 },
    { name: "년간 투자 계획 이행률", weight: 20, unitType: "%", target: 25, floor: 20, actual: 30 },
    { name: "건조 배기 가스비 절감", weight: 20, unitType: "백만원", target: 5.75, floor: 5.5, actual: 0 },
    { name: "선제적 법규 준수", weight: 10, unitType: "점", target: 0, floor: 0, actual: 0 }
  ];
  const REGRESSION_EXPECTED = {
    rows: [
      {
        name: "설비 가동률 증대",
        thresholds: { S: 0, A: 0, B: 0.41666666666666663, C: 0.8333333333333333, D: 1.25 },
        achievement: { ratio: null, status: "zero_target" },
        scoreRate: 0.55,
        weightedScore: 11.0,
        matchedBand: "below"
      },
      {
        name: "자체 정비 비용 절감",
        thresholds: { S: 3, A: 2, B: 1, C: 0, D: 0 },
        achievement: { ratio: 1.0, status: "ok" },
        scoreRate: 1.00,
        weightedScore: 30.0,
        matchedBand: "A-S"
      },
      {
        name: "년간 투자 계획 이행률",
        thresholds: { S: 28, A: 25, B: 23, C: 21, D: 20 },
        achievement: { ratio: 1.2, status: "ok" },
        scoreRate: 1.10,
        weightedScore: 22.0,
        matchedBand: "S"
      },
      {
        name: "건조 배기 가스비 절감",
        thresholds: { S: 6.325, A: 5.75, B: 5.666666666666667, C: 5.583333333333333, D: 5.5 },
        achievement: { ratio: 0.0, status: "ok" },
        scoreRate: 0.55,
        weightedScore: 11.0,
        matchedBand: "below"
      },
      {
        name: "선제적 법규 준수",
        thresholds: { S: 0, A: 0, B: 0, C: 0, D: 0 },
        achievement: { ratio: null, status: "zero_target" },
        scoreRate: 1.10,
        weightedScore: 11.0,
        matchedBand: "S"
      }
    ],
    totalScore: 85.0
  };
  let __uidSeed = 0;

  // Utility helpers.
  function uid() {
    __uidSeed += 1;
    return `metric-${Date.now()}-${__uidSeed}`;
  }
  function trimZeros(value) {
    return String(value).replace(/\.0+$|(\.\d*?)0+$/g, "$1");
  }
  function fmtRaw(value, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return trimZeros(Number(value).toFixed(digits));
  }
  function roundTo(value, digits = 6) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }
  function roundUp(value, digits = 0) {
    const factor = 10 ** digits;
    const scaled = value * factor;
    return (scaled >= 0 ? Math.ceil(scaled) : Math.floor(scaled)) / factor;
  }
  function roundDown(value, digits = 0) {
    const factor = 10 ** digits;
    const scaled = value * factor;
    return (scaled >= 0 ? Math.floor(scaled) : Math.ceil(scaled)) / factor;
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function parseMaybeNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const str = String(value).trim();
    if (!str) return null;
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  }
  function normalizeNumericRaw(rawValue, numericValue = null) {
    if (typeof rawValue === "string") return rawValue.trim();
    if (typeof rawValue === "number") return Number.isFinite(rawValue) ? String(rawValue) : "";
    if (numericValue === null || numericValue === undefined) return "";
    return Number.isFinite(numericValue) ? String(numericValue) : "";
  }
  function isDecimalNumericInput(rawValue) {
    if (!rawValue) return false;
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return false;
    return rawValue.includes(".") || !Number.isInteger(numeric);
  }
  function formatEditableNumber(value, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    return trimZeros(Number(value).toFixed(digits));
  }
  function isIntegerMetric(unitType) {
    return INTEGER_UNITS.has(String(unitType ?? "").trim());
  }
  function normalizeUnitType(input = {}) {
    const rawUnitType = String(input.unitType ?? input.unit ?? "").trim();
    if (rawUnitType) return rawUnitType;
    const rawValueType = String(input.valueType ?? "").trim();
    if (rawValueType === "integer") return "건수";
    if (rawValueType === "decimal") return "%";
    return "";
  }
  function inferDirection(target, floor, fallbackDirection = "up") {
    if (target === null || floor === null) return fallbackDirection;
    if (floor < target) return "up";
    if (floor > target) return "down";
    return fallbackDirection;
  }
  function hydrateMetric(input = {}) {
    const target = parseMaybeNumber(input.target);
    const floor = parseMaybeNumber(input.floor);
    const actual = parseMaybeNumber(input.actual);
    const previousYearActual = parseMaybeNumber(input.previousYearActual);
    const annualTarget = parseMaybeNumber(input.annualTarget);
    const unitType = normalizeUnitType(input);
    const fallbackDirection = input.direction ?? input.dir ?? "up";
    const targetRaw = normalizeNumericRaw(input.targetRaw, target);
    const floorRaw = normalizeNumericRaw(input.floorRaw, floor);
    const actualRaw = normalizeNumericRaw(input.actualRaw, actual);
    const previousYearActualRaw = normalizeNumericRaw(input.previousYearActualRaw, previousYearActual);
    const annualTargetRaw = normalizeNumericRaw(input.annualTargetRaw, annualTarget);
    const numericRawInputs = [targetRaw, floorRaw, actualRaw].filter((value) => value !== "");
    return {
      id: input.id || uid(),
      name: String(input.name ?? ""),
      weight: parseMaybeNumber(input.weight),
      unitType,
      referenceNote: String(input.referenceNote ?? ""),
      integerMetric: numericRawInputs.length
        ? !numericRawInputs.some((value) => isDecimalNumericInput(value))
        : (input.integerMetric === true || isIntegerMetric(unitType)),
      direction: inferDirection(target, floor, fallbackDirection),
      previousYearActual,
      previousYearActualRaw,
      annualTarget,
      annualTargetRaw,
      target,
      targetRaw,
      floor,
      floorRaw,
      actual,
      actualRaw
    };
  }
  function createBlankMetric() {
    return hydrateMetric({});
  }
  function createBlankSection(label, rows = DEFAULT_ROWS) {
    return {
      label,
      metrics: Array.from({ length: rows }, () => createBlankMetric())
    };
  }
  function createDefaultState() {
    return {
      teamName: "",
      activeSection: 0,
      sections: SECTION_LABELS.map((label) => createBlankSection(label)),
      testResults: null
    };
  }

  // KPI calculation pipeline.
  function buildThresholds(metricInput) {
    const metric = hydrateMetric(metricInput);
    if (metric.target === null || metric.floor === null) {
      return { S: null, A: null, B: null, C: null, D: null };
    }
    let S;
    const A = metric.target;
    let B = ((A - metric.floor) / 3) * 2 + metric.floor;
    let C = ((A - metric.floor) / 3) + metric.floor;
    const D = metric.floor;
    if (metric.direction === "down") {
      S = metric.target === 0 ? 0 : metric.target * 0.9;
      if (metric.integerMetric) {
        S = roundDown(S, 0);
        B = roundDown(B, 0);
        C = roundUp(C, 0);
      }
    } else {
      S = metric.target * 1.1;
      if (metric.integerMetric) {
        S = roundUp(S, 0);
        B = roundDown(B, 0);
        C = roundDown(C, 0);
      }
    }
    return { S, A, B, C, D };
  }
  function calcAchievement(metricInput) {
    const metric = hydrateMetric(metricInput);
    if (metric.actual === null) {
      return { ratio: null, status: "no_input" };
    }
    if (metric.target === null) {
      return { ratio: null, status: "no_input" };
    }
    if (metric.target === 0) {
      return { ratio: null, status: "zero_target" };
    }
    if (metric.direction === "down") {
      return {
        ratio: 1 - (metric.actual - metric.target) / metric.target,
        status: "ok"
      };
    }
    return {
      ratio: metric.actual / metric.target,
      status: "ok"
    };
  }
  function lerp(value, start, end, startScore, endScore) {
    if (end === start) return endScore;
    return startScore + ((value - start) / (end - start)) * (endScore - startScore);
  }
  function calcScore(metricInput, thresholdsInput) {
    const metric = hydrateMetric(metricInput);
    const thresholds = thresholdsInput || buildThresholds(metric);
    if (metric.actual === null) {
      return {
        scoreRate: 0,
        matchedBand: null,
        breakdown: "실적 미입력 → 득점율 0"
      };
    }
    const values = [thresholds.S, thresholds.A, thresholds.B, thresholds.C, thresholds.D];
    if (values.some((v) => v === null || Number.isNaN(v))) {
      return {
        scoreRate: 0,
        matchedBand: null,
        breakdown: "목표/하한 미설정 → 득점율 0"
      };
    }
    const actual = metric.actual;
    const { S, A, B, C, D } = thresholds;
    let scoreRate = 0;
    let matchedBand = null;
    let breakdown = "";
    if (metric.direction === "up") {
      if (actual >= S) {
        scoreRate = SCORE_SCALE.S;
        matchedBand = "S";
        breakdown = `S 구간: 실적 ${fmtRaw(actual)} ≥ S ${fmtRaw(S)} → ${fmtRaw(scoreRate)}`;
      } else if (actual >= A && actual < S) {
        scoreRate = clamp(lerp(actual, A, S, SCORE_SCALE.A, SCORE_SCALE.S), 0, SCORE_SCALE.S);
        matchedBand = "A-S";
        breakdown = `A~S 보간: A ${fmtRaw(A)} ~ S ${fmtRaw(S)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual >= B && actual < A) {
        scoreRate = clamp(lerp(actual, B, A, SCORE_SCALE.B, SCORE_SCALE.A), 0, SCORE_SCALE.S);
        matchedBand = "B-A";
        breakdown = `B~A 보간: B ${fmtRaw(B)} ~ A ${fmtRaw(A)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual >= C && actual < B) {
        scoreRate = clamp(lerp(actual, C, B, SCORE_SCALE.C, SCORE_SCALE.B), 0, SCORE_SCALE.S);
        matchedBand = "C-B";
        breakdown = `C~B 보간: C ${fmtRaw(C)} ~ B ${fmtRaw(B)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual >= D && actual < C) {
        scoreRate = clamp(lerp(actual, D, C, SCORE_SCALE.D, SCORE_SCALE.C), 0, SCORE_SCALE.S);
        matchedBand = "D-C";
        breakdown = `D~C 보간: D ${fmtRaw(D)} ~ C ${fmtRaw(C)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else {
        // 업로드된 요구사항의 회귀 예시(R열/Y열)와 동일하게,
        // 상향식 KPI에서 D 미만은 비례감점이 아니라 최저 D 점수(0.55)로 처리한다.
        scoreRate = SCORE_SCALE.D;
        matchedBand = "below";
        breakdown = `D 미만: 실적 ${fmtRaw(actual)} < D ${fmtRaw(D)} → 최저점 ${fmtRaw(scoreRate)}`;
      }
    } else {
      if (actual <= S) {
        scoreRate = SCORE_SCALE.S;
        matchedBand = "S";
        breakdown = `S 구간: 실적 ${fmtRaw(actual)} ≤ S ${fmtRaw(S)} → ${fmtRaw(scoreRate)}`;
      } else if (actual > S && actual <= A) {
        scoreRate = clamp(lerp(actual, S, A, SCORE_SCALE.S, SCORE_SCALE.A), 0, SCORE_SCALE.S);
        matchedBand = "A-S";
        breakdown = `A~S 보간: S ${fmtRaw(S)} ~ A ${fmtRaw(A)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual > A && actual <= B) {
        scoreRate = clamp(lerp(actual, A, B, SCORE_SCALE.A, SCORE_SCALE.B), 0, SCORE_SCALE.S);
        matchedBand = "B-A";
        breakdown = `B~A 보간: A ${fmtRaw(A)} ~ B ${fmtRaw(B)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual > B && actual <= C) {
        scoreRate = clamp(lerp(actual, B, C, SCORE_SCALE.B, SCORE_SCALE.C), 0, SCORE_SCALE.S);
        matchedBand = "C-B";
        breakdown = `C~B 보간: B ${fmtRaw(B)} ~ C ${fmtRaw(C)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else if (actual > C && actual <= D) {
        scoreRate = clamp(lerp(actual, C, D, SCORE_SCALE.C, SCORE_SCALE.D), 0, SCORE_SCALE.S);
        matchedBand = "D-C";
        breakdown = `D~C 보간: C ${fmtRaw(C)} ~ D ${fmtRaw(D)}, 실적 ${fmtRaw(actual)} → ${fmtRaw(scoreRate)}`;
      } else {
        scoreRate = SCORE_SCALE.D;
        matchedBand = "below";
        breakdown = `D 초과: 실적 ${fmtRaw(actual)} > D ${fmtRaw(D)} → 최저점 ${fmtRaw(scoreRate)}`;
      }
    }
    return {
      scoreRate: clamp(Number.isFinite(scoreRate) ? scoreRate : 0, 0, SCORE_SCALE.S),
      matchedBand,
      breakdown
    };
  }
  function calcWeightedScore(scoreRate, weight) {
    const safeWeight = parseMaybeNumber(weight);
    if (safeWeight === null) return 0;
    return scoreRate * safeWeight;
  }
  function sumSection(metrics) {
    const total = metrics.reduce((sum, metricInput) => {
      const metric = hydrateMetric(metricInput);
      const thresholds = buildThresholds(metric);
      const score = calcScore(metric, thresholds);
      return sum + calcWeightedScore(score.scoreRate, metric.weight);
    }, 0);
    return roundTo(total, 1);
  }
  function validateMetric(metricInput) {
    const metric = hydrateMetric(metricInput);
    const errors = [];
    const warnings = [];
    if (metric.weight === null || metric.weight < 0 || metric.weight > 100) {
      errors.push("비중은 0~100 사이여야 합니다.");
    }
    if (metric.target === null && metric.actual !== null) {
      warnings.push("목표 미설정");
    }
    if (metric.floor === null && metric.target !== null) {
      warnings.push("하한 미설정");
    }
    if (metric.target !== null && metric.floor !== null) {
      if (metric.floor === metric.target) {
        warnings.push("목표와 하한이 같음 — 방향 자동 판정 불가");
      }
    }
    if (metric.actual !== null && metric.actual < 0) {
      warnings.push("음수 실적");
    }
    if ((metric.integerMetric || isIntegerMetric(metric.unitType)) && metric.actual !== null && !Number.isInteger(metric.actual)) {
      warnings.push("정수형 KPI에 소수 입력");
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  function validateSection(metrics) {
    const totalWeight = roundTo(
      metrics.reduce((sum, metricInput) => sum + (parseMaybeNumber(metricInput.weight) ?? 0), 0),
      6
    );
    const warnings = [];
    if (Math.abs(totalWeight - 100) > 1e-9) {
      warnings.push(`비중 합계가 100이 아닙니다. 현재 ${fmtRaw(totalWeight)}`);
    }
    return {
      totalWeight,
      warnings
    };
  }
  function deriveMetric(metricInput) {
    const metric = hydrateMetric(metricInput);
    const thresholds = buildThresholds(metric);
    const achievement = calcAchievement(metric);
    const score = calcScore(metric, thresholds);
    const weightedScore = calcWeightedScore(score.scoreRate, metric.weight);
    const validation = validateMetric(metric);
    return {
      metric,
      thresholds,
      achievement,
      score,
      weightedScore,
      validation
    };
  }

  // Regression helpers for Excel parity verification.
  function approxEqual(a, b, tolerance = 1e-6) {
    if (a === null || b === null) return a === b;
    return Math.abs(a - b) <= tolerance;
  }
  function pushAssertion(assertions, { group, label, expected, actual }) {
    const numeric = typeof expected === "number" && typeof actual === "number";
    const pass = numeric ? approxEqual(expected, actual) : expected === actual;
    assertions.push({
      group,
      label,
      expected,
      actual,
      diff: numeric ? Math.abs(expected - actual) : null,
      pass
    });
  }
  function runRegressionSuite(metricsInput = REGRESSION_DATA) {
    const metrics = metricsInput.map((m) => hydrateMetric(m));
    const derivedRows = metrics.map((metric) => deriveMetric(metric));
    const assertions = [];
    REGRESSION_EXPECTED.rows.forEach((expectedRow, index) => {
      const actualRow = derivedRows[index];
      const group = `${index + 1}. ${expectedRow.name}`;
      pushAssertion(assertions, { group, label: "이름", expected: expectedRow.name, actual: actualRow.metric.name });
      ["S", "A", "B", "C", "D"].forEach((key) => {
        pushAssertion(assertions, {
          group,
          label: `${key} 경계값`,
          expected: expectedRow.thresholds[key],
          actual: actualRow.thresholds[key]
        });
      });
      pushAssertion(assertions, {
        group,
        label: "달성률 status",
        expected: expectedRow.achievement.status,
        actual: actualRow.achievement.status
      });
      pushAssertion(assertions, {
        group,
        label: "달성률 ratio",
        expected: expectedRow.achievement.ratio,
        actual: actualRow.achievement.ratio
      });
      pushAssertion(assertions, {
        group,
        label: "득점율",
        expected: expectedRow.scoreRate,
        actual: actualRow.score.scoreRate
      });
      pushAssertion(assertions, {
        group,
        label: "가중점수",
        expected: expectedRow.weightedScore,
        actual: roundTo(actualRow.weightedScore, 6)
      });
      pushAssertion(assertions, {
        group,
        label: "구간 판정",
        expected: expectedRow.matchedBand,
        actual: actualRow.score.matchedBand
      });
    });
    pushAssertion(assertions, {
      group: "총점",
      label: "섹션 총점",
      expected: REGRESSION_EXPECTED.totalScore,
      actual: sumSection(metrics)
    });
    const edge1 = deriveMetric({ name: "EDGE-1", weight: 100, unitType: "건수", target: 0, floor: 0, actual: 0 });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-1 target=0 floor=0 actual=0", expected: 1.1, actual: edge1.score.scoreRate });
    const edge2 = deriveMetric({ name: "EDGE-2", weight: 100, unitType: "%", target: 0, floor: 0, actual: 0 });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-2 target=0 floor=0 actual=0", expected: 1.1, actual: edge2.score.scoreRate });
    const edge3 = deriveMetric({ name: "EDGE-3", weight: 100, unitType: "%", target: 10, floor: 5, actual: null });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-3 actual=null score", expected: 0, actual: edge3.score.scoreRate });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-3 actual=null achievement", expected: "no_input", actual: edge3.achievement.status });
    const edge4 = deriveMetric({ name: "EDGE-4", weight: 100, unitType: "%", target: 10, floor: 10, actual: 10 });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-4 floor=target matched", expected: "A-S", actual: edge4.score.matchedBand });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-4 floor=target score", expected: 1.0, actual: edge4.score.scoreRate });
    const edge5 = validateSection([
      { weight: 40 },
      { weight: 50 }
    ]);
    const edge7 = deriveMetric({ name: "EDGE-7", weight: 100, unitType: "%", target: 25, targetRaw: "25.0", floor: 20, floorRaw: "20.0", actual: 30, actualRaw: "30.0" });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-7 .0 input stays decimal metric", expected: false, actual: edge7.metric.integerMetric });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-5 비중합 경고", expected: true, actual: edge5.warnings.length > 0 });
    const edge6 = validateMetric({ name: "EDGE-6", weight: 100, unitType: "건수", target: 3, floor: 1, actual: 1.5 });
    pushAssertion(assertions, { group: "EDGE", label: "EDGE-6 정수 KPI 소수 경고", expected: true, actual: edge6.warnings.includes("정수형 KPI에 소수 입력") });
    return {
      passed: assertions.every((item) => item.pass),
      total: assertions.length,
      passCount: assertions.filter((item) => item.pass).length,
      failCount: assertions.filter((item) => !item.pass).length,
      assertions
    };
  }
  function bandDisplay(matchedBand, direction) {
    if (!matchedBand) return "—";
    if (matchedBand === "S") return "S";
    if (matchedBand === "A-S") return "A~S";
    if (matchedBand === "B-A") return "B~A";
    if (matchedBand === "C-B") return "C~B";
    if (matchedBand === "D-C") return "D~C";
    if (matchedBand === "below") return direction === "down" ? "D 초과" : "D 미만";
    return matchedBand;
  }
  const KPIApp = {
    SCORE_SCALE,
    INTEGER_UNITS,
    SECTION_LABELS,
    MAX_ROWS,
    DEFAULT_ROWS,
    REGRESSION_DATA,
    REGRESSION_EXPECTED,
    createBlankMetric,
    createBlankSection,
    createDefaultState,
    hydrateMetric,
    buildThresholds,
    calcAchievement,
    calcScore,
    calcWeightedScore,
    sumSection,
    validateMetric,
    validateSection,
    deriveMetric,
    runRegressionSuite,
    bandDisplay,
    fmtRaw,
    roundTo
  };
  if (typeof globalThis !== "undefined") {
    globalThis.KPIApp = KPIApp;
  }
  /* PURE_LOGIC_END */
  if (typeof document !== "undefined") {
    // ==========================================================================
    // UI Runtime
    // ==========================================================================

    const STORAGE_KEY = "kpi-score-studio-v1";
    const NUMERIC_FIELDS = new Set(["weight", "previousYearActual", "annualTarget", "target", "floor", "actual"]);
    const EDITABLE_FIELDS = new Set(["name", "weight", "unitType", "previousYearActual", "annualTarget", "target", "floor", "actual"]);
    const $ = (selector) => document.querySelector(selector);

    // DOM references.
    const elements = {
      teamName: $("#teamName"),
      sectionTabs: $("#sectionTabs"),
      metricsBody: $("#metricsBody"),
      rowCountNote: $("#rowCountNote"),
      addRowBtn: $("#addRowBtn"),
      summaryGrid: $("#summaryGrid"),
      validationList: $("#validationList"),
      runRegressionBtn: $("#runRegressionBtn"),
      resetTemplateBtn: $("#resetTemplateBtn"),
      testCard: $("#testCard"),
      testSummary: $("#testSummary"),
      testResultsBody: $("#testResultsBody"),
      headerHelpPanel: $("#headerHelpPanel"),
      headerHelpTitle: $("#headerHelpTitle"),
      headerHelpEditToggle: $("#headerHelpEditToggle"),
      headerHelpCaption: $("#headerHelpCaption"),
      headerHelpBody: $("#headerHelpBody"),
      headerHelpEditSection: $("#headerHelpEditSection"),
      headerHelpEditInput: $("#headerHelpEditInput")
    };

    // Static help and reference catalogs.
    const HEADER_HELP_CONTENT = {
      achievement: {
        title: "달성률",
        body: "실적이 목표에 비해 어느 정도인지 보여주는 참고 값입니다.\n\n상향식 KPI는 실적 ÷ 목표로 계산합니다.\n하향식 KPI는 목표보다 얼마나 더 낮거나 높은지 반영합니다.\n\n목표가 0이면 계산하지 않고 빈칸으로 둡니다."
      },
      scoreRate: {
        title: "득점율",
        body: "실적이 S, A, B, C, D 어느 구간에 들어가는지 계산한 핵심 점수입니다.\n\n110점은 S, 100점은 A, 85점은 B, 70점은 C, 55점은 D 기준입니다.\n구간 사이에 있으면 사이 점수로 자동 계산됩니다."
      },
      band: {
        title: "구간",
        body: "현재 실적이 어느 등급 구간에 들어갔는지 보여줍니다.\n\n예를 들어 S, A~S, B~A처럼 표시되며, 지금 점수가 어떤 범위에서 나온 건지 빠르게 확인할 때 씁니다."
      },
      weightedScore: {
        title: "가중점수",
        body: "득점율에 비중을 곱한 최종 반영 점수입니다.\n\n예를 들어 득점율이 1.00이고 비중이 30이면 가중점수는 30.0입니다.\n분기 총점은 이 가중점수들을 모두 더해서 계산합니다."
      }
    };
    const KPI_REFERENCE_CONTENT = {
      설비가동률증대: {
        title: "설비 가동률 증대 기준",
        body: "설비가동 중단 건수\n설비중단 40% 감소"
      },
      자체정비비용절감: {
        title: "자체 정비 비용 절감 기준",
        body: "자체 정비 비용 절감\n실적 기준 : 1백만원 이상"
      },
      년간투자계획이행률: {
        title: "년간 투자 계획 이행률 기준",
        body: "(연 투자 실행 건 / 연 투자 계획 건) × 100"
      },
      건조배기가스비절감: {
        title: "건조 배기 가스비 절감 기준",
        body: "가스 유틸리티 비용\n절감 금액 (원/월)"
      },
      선제적법규준수: {
        title: "선제적 법규 준수 기준",
        body: "위반 건수 건당 -1\n법규사항 개선 시 +1"
      }
    };
    let state = loadState();
    let modalState = { mode: "info", rowIndex: null, referenceKey: null };

    // Persistence.
    function getCurrentQuarterIndex(date = new Date()) {
      return clamp(Math.floor(date.getMonth() / 3), 0, SECTION_LABELS.length - 1);
    }
    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefaultState();
        const parsed = JSON.parse(raw);
        const next = createDefaultState();
        const parsedSections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const rowCount = clamp(
          parsedSections.reduce((maxRows, section) => {
            const count = Array.isArray(section?.metrics) ? section.metrics.length : 0;
            return Math.max(maxRows, Math.min(count, MAX_ROWS));
          }, DEFAULT_ROWS),
          1,
          MAX_ROWS
        );
        next.teamName = String(parsed.teamName ?? "");
        next.activeSection = Number.isInteger(parsed.activeSection) ? clamp(parsed.activeSection, 0, SECTION_LABELS.length - 1) : 0;
        next.activeSection = Math.min(next.activeSection, getCurrentQuarterIndex());
        next.sections = SECTION_LABELS.map((label, sectionIndex) => {
          const sourceSection = parsedSections[sectionIndex];
          const metrics = Array.from({ length: rowCount }, (_, rowIndex) => {
            const sourceMetric = Array.isArray(sourceSection?.metrics) ? sourceSection.metrics[rowIndex] : null;
            return sourceMetric ? hydrateMetric(sourceMetric) : createBlankMetric();
          });
          return { label, metrics };
        });
        return next;
      } catch (error) {
        console.warn("Failed to load state", error);
        return createDefaultState();
      }
    }
    function saveState() {
      try {
        const payload = {
          teamName: state.teamName,
          activeSection: state.activeSection,
          sections: state.sections.map((section) => ({
            label: section.label,
            metrics: section.metrics.map((metric) => ({
              id: metric.id,
              name: metric.name,
              weight: metric.weight,
              unitType: metric.unitType,
              referenceNote: metric.referenceNote,
              direction: metric.direction,
              previousYearActual: metric.previousYearActual,
              previousYearActualRaw: metric.previousYearActualRaw,
              annualTarget: metric.annualTarget,
              annualTargetRaw: metric.annualTargetRaw,
              target: metric.target,
              targetRaw: metric.targetRaw,
              floor: metric.floor,
              floorRaw: metric.floorRaw,
              actual: metric.actual,
              actualRaw: metric.actualRaw
            }))
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn("Failed to save state", error);
      }
    }

    // Formatting and display helpers.
    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
    function escapeAttr(value) {
      return escapeHtml(String(value ?? "").replace(/\n/g, " · "));
    }
    function formatNumber(value, minFraction = 0, maxFraction = 3) {
      if (value === null || value === undefined || Number.isNaN(value)) return "—";
      return new Intl.NumberFormat("ko-KR", {
        minimumFractionDigits: minFraction,
        maximumFractionDigits: maxFraction
      }).format(value);
    }
    function formatScore(value) {
      if (value === null || value === undefined || Number.isNaN(value)) return "—";
      return Number(value).toFixed(3);
    }
    function formatWeighted(value) {
      if (value === null || value === undefined || Number.isNaN(value)) return "—";
      return Number(value).toFixed(1);
    }
    function formatAchievement(achievement) {
      if (achievement.status !== "ok" || achievement.ratio === null) return "—";
      return `${(achievement.ratio * 100).toFixed(1)}%`;
    }
    function getAchievementClass(achievement) {
      if (achievement.status === "ok") return "ok";
      if (achievement.status === "zero_target") return "zero";
      return "no-input";
    }
    function getAchievementTooltip(achievement) {
      if (achievement.status === "ok") return `달성률 ${fmtRaw(achievement.ratio)} (${formatAchievement(achievement)})`;
      if (achievement.status === "zero_target") return "목표값이 0이라 달성률을 계산하지 않습니다.";
      return "실적 또는 목표 입력이 없어 달성률을 계산하지 않습니다.";
    }
    function getBandClass(row) {
      if (row.score.matchedBand === "S") return "band-s";
      if (row.score.matchedBand === "below") return "band-low";
      if (row.score.matchedBand) return "band-mid";
      return "";
    }
    function isBandActive(matchedBand, thresholdKey) {
      if (!matchedBand) return false;
      if (matchedBand === "S") return thresholdKey === "S";
      if (matchedBand === "A-S") return thresholdKey === "A" || thresholdKey === "S";
      if (matchedBand === "B-A") return thresholdKey === "B" || thresholdKey === "A";
      if (matchedBand === "C-B") return thresholdKey === "C" || thresholdKey === "B";
      if (matchedBand === "D-C") return thresholdKey === "D" || thresholdKey === "C";
      if (matchedBand === "below") return thresholdKey === "D";
      return false;
    }
    function getFieldErrors(metric) {
      const map = { weight: [] };
      if (metric.weight === null || metric.weight < 0 || metric.weight > 100) {
        map.weight.push("비중은 0~100 사이여야 합니다.");
      }
      return map;
    }
    function buildMessages(derivedRows, sectionValidation) {
      const errors = [];
      const warnings = [];
      derivedRows.forEach((row, index) => {
        row.validation.errors.forEach((message) => {
          errors.push(`${index + 1}행 · ${message}`);
        });
        row.validation.warnings.forEach((message) => {
          warnings.push(`${index + 1}행 · ${message}`);
        });
      });
      sectionValidation.warnings.forEach((message) => warnings.push(`섹션 · ${message}`));
      return { errors, warnings };
    }
    // Reference lookup and keyboard navigation helpers.
    function getSectionData() {
      return state.sections[state.activeSection];
    }
    function normalizeReferenceKey(value) {
      return String(value ?? "").replace(/\s+/g, "").toLowerCase();
    }
    function getKpiReferenceContent(metricName) {
      const normalized = normalizeReferenceKey(metricName);
      if (!normalized) return null;
      const aliasMap = {
        설비가동률증대: "설비가동률증대",
        설비가동중단건수: "설비가동률증대",
        설비중단건수: "설비가동률증대",
        자체정비비용절감: "자체정비비용절감",
        년간투자계획이행률: "년간투자계획이행률",
        연간투자계획이행률: "년간투자계획이행률",
        건조배기가스비절감: "건조배기가스비절감",
        가스유틸리티비용: "건조배기가스비절감",
        선제적법규준수: "선제적법규준수"
      };
      const referenceKey = aliasMap[normalized];
      if (!referenceKey) return null;
      const content = KPI_REFERENCE_CONTENT[referenceKey];
      return content ? { key: referenceKey, ...content } : null;
    }
    function isNumericField(field) {
      return NUMERIC_FIELDS.has(String(field ?? ""));
    }
    function isEditableMetricField(field) {
      return EDITABLE_FIELDS.has(String(field ?? ""));
    }
    function buildFocusDescriptorForField(row, field, options = {}) {
      if (row === null || row === undefined || !field) return null;
      return {
        kind: "metric",
        row: String(row),
        field: String(field),
        start: null,
        end: null,
        selectAll: options.selectAll === true
      };
    }
    function getNextEditableFocusDescriptor(currentTarget, direction = 1) {
      const inputs = Array.from(document.querySelectorAll("#metricsBody input[data-row][data-field]"))
        .filter((input) => !input.disabled && isEditableMetricField(input.getAttribute("data-field")));
      const currentIndex = inputs.indexOf(currentTarget);
      if (currentIndex === -1) return null;
      const nextInput = inputs[currentIndex + direction];
      if (!nextInput) return null;
      return buildFocusDescriptorForField(nextInput.getAttribute("data-row"), nextInput.getAttribute("data-field"), { selectAll: true });
    }
    // Cross-quarter row sync.
    function forEachSectionMetric(rowIndex, callback) {
      state.sections.forEach((section, sectionIndex) => {
        if (!section.metrics[rowIndex]) {
          section.metrics[rowIndex] = createBlankMetric();
        }
        const metric = section.metrics[rowIndex];
        callback(metric, sectionIndex);
        section.metrics[rowIndex] = hydrateMetric(metric);
      });
    }
    function applyAnnualTargetDistribution(rowIndex, rawValue) {
      const trimmed = String(rawValue ?? "").trim();
      const annualTarget = parseMaybeNumber(rawValue);
      forEachSectionMetric(rowIndex, (metric, sectionIndex) => {
        metric.annualTarget = annualTarget;
        metric.annualTargetRaw = trimmed;
        if (annualTarget === null) return;
        const distributedTarget = annualTarget * ((sectionIndex + 1) / SECTION_LABELS.length);
        metric.target = distributedTarget;
        metric.targetRaw = formatEditableNumber(distributedTarget);
      });
    }
    function deriveAnnualTargetFromQuarterTarget(rowIndex, sectionIndex, rawValue) {
      const trimmed = String(rawValue ?? "").trim();
      const targetValue = parseMaybeNumber(rawValue);
      if (targetValue === null) return false;
      const annualTarget = targetValue * (SECTION_LABELS.length / (sectionIndex + 1));
      forEachSectionMetric(rowIndex, (metric, currentIndex) => {
        metric.annualTarget = annualTarget;
        metric.annualTargetRaw = formatEditableNumber(annualTarget);
        const distributedTarget = annualTarget * ((currentIndex + 1) / SECTION_LABELS.length);
        metric.target = distributedTarget;
        metric.targetRaw = formatEditableNumber(distributedTarget);
      });
      state.sections[sectionIndex].metrics[rowIndex].targetRaw = trimmed;
      state.sections[sectionIndex].metrics[rowIndex].target = targetValue;
      state.sections[sectionIndex].metrics[rowIndex] = hydrateMetric(state.sections[sectionIndex].metrics[rowIndex]);
      return true;
    }
    function syncSharedReferenceField(rowIndex, field, rawValue) {
      const trimmed = String(rawValue ?? "").trim();
      const numericValue = parseMaybeNumber(rawValue);
      const rawField = `${field}Raw`;
      forEachSectionMetric(rowIndex, (metric) => {
        metric[field] = numericValue;
        metric[rawField] = trimmed;
      });
    }
    function syncSharedNumericField(rowIndex, field, rawValue) {
      const numericValue = parseMaybeNumber(rawValue);
      forEachSectionMetric(rowIndex, (metric) => {
        metric[field] = numericValue;
      });
    }
    function syncSharedTextField(rowIndex, field, rawValue) {
      const textValue = String(rawValue ?? "");
      forEachSectionMetric(rowIndex, (metric) => {
        metric[field] = textValue;
      });
    }
    function syncSharedReferenceNote(rowIndex, rawValue) {
      const textValue = String(rawValue ?? "");
      forEachSectionMetric(rowIndex, (metric) => {
        metric.referenceNote = textValue;
      });
    }
    // Shared modal logic.
    function clearTests() {
      state.testResults = null;
    }
    function showInfoDialog(title, body, caption = "") {
      modalState = { mode: "info", rowIndex: null, referenceKey: null };
      elements.headerHelpTitle.textContent = title;
      elements.headerHelpEditToggle.hidden = true;
      elements.headerHelpEditToggle.textContent = "수정";
      elements.headerHelpCaption.hidden = !caption;
      elements.headerHelpCaption.textContent = caption;
      elements.headerHelpBody.hidden = false;
      elements.headerHelpBody.textContent = body;
      elements.headerHelpEditSection.hidden = true;
      elements.headerHelpEditInput.value = "";
      elements.headerHelpPanel.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function showHeaderHelp(helpKey) {
      const content = HEADER_HELP_CONTENT[helpKey];
      if (!content) return;
      showInfoDialog(content.title, content.body);
    }

    function buildReferenceDialogBody(referenceBody, rowIndex) {
      if (rowIndex === null) return referenceBody;
      const metric = getSectionData().metrics[rowIndex];
      const note = String(metric?.referenceNote ?? "").trim();
      return note || referenceBody;
    }

    function buildReferenceEditorValue(referenceBody, rowIndex) {
      if (rowIndex === null) return referenceBody;
      const metric = getSectionData().metrics[rowIndex];
      const note = String(metric?.referenceNote ?? "");
      return note.trim() ? note : referenceBody;
    }

    function setReferenceEditMode(isEditing) {
      if (modalState.rowIndex === null) return;
      modalState.mode = isEditing ? "reference-edit" : "reference-view";
      elements.headerHelpEditToggle.hidden = false;
      elements.headerHelpEditToggle.textContent = isEditing ? "보기" : "수정";
      elements.headerHelpBody.hidden = isEditing;
      elements.headerHelpEditSection.hidden = !isEditing;
      if (!isEditing) return;
      requestAnimationFrame(() => {
        try {
          elements.headerHelpEditInput.focus({ preventScroll: true });
        } catch (error) {
          elements.headerHelpEditInput.focus();
        }
      });
    }

    function showKpiReference(referenceKey, rowIndex = null) {
      const content = KPI_REFERENCE_CONTENT[referenceKey];
      if (!content) return;
      modalState = { mode: rowIndex === null ? "info" : "reference-view", rowIndex, referenceKey };
      elements.headerHelpTitle.textContent = "기준";
      elements.headerHelpCaption.hidden = false;
      elements.headerHelpCaption.textContent = content.title;
      elements.headerHelpBody.hidden = false;
      elements.headerHelpBody.textContent = buildReferenceDialogBody(content.body, rowIndex);
      elements.headerHelpEditInput.value = buildReferenceEditorValue(content.body, rowIndex);
      elements.headerHelpPanel.hidden = false;
      document.body.style.overflow = "hidden";
      if (rowIndex === null) {
        elements.headerHelpEditToggle.hidden = true;
        elements.headerHelpEditSection.hidden = true;
        return;
      }
      setReferenceEditMode(false);
    }
    function toggleReferenceEditor() {
      if (modalState.rowIndex === null) return;
      setReferenceEditMode(modalState.mode !== "reference-edit");
    }
    function saveReferenceEditor() {
      if (modalState.rowIndex === null || modalState.referenceKey === null) return;
      const content = KPI_REFERENCE_CONTENT[modalState.referenceKey];
      if (!content) return;
      const rawValue = elements.headerHelpEditInput.value.replace(/\r\n/g, "\n");
      const normalizedValue = rawValue.trim();
      const defaultValue = content.body.replace(/\r\n/g, "\n").trim();
      syncSharedReferenceNote(modalState.rowIndex, normalizedValue === defaultValue ? "" : rawValue);
      clearTests();
      saveState();
      render();
      showKpiReference(modalState.referenceKey, modalState.rowIndex);
    }
    function hideHeaderHelp() {
      modalState = { mode: "info", rowIndex: null, referenceKey: null };
      elements.headerHelpPanel.hidden = true;
      elements.headerHelpTitle.textContent = "";
      elements.headerHelpEditToggle.hidden = true;
      elements.headerHelpEditToggle.textContent = "수정";
      elements.headerHelpCaption.hidden = true;
      elements.headerHelpCaption.textContent = "";
      elements.headerHelpBody.hidden = false;
      elements.headerHelpBody.textContent = "";
      elements.headerHelpEditSection.hidden = true;
      elements.headerHelpEditInput.value = "";
      document.body.style.overflow = "";
    }
    // Focus restoration after rerender.
    function captureFocus(target) {
      if (!target) return null;
      const descriptor = {
        kind: target.id === "teamName" ? "teamName" : "metric",
        row: target.getAttribute?.("data-row") ?? null,
        field: target.getAttribute?.("data-field") ?? null
      };
      try {
        descriptor.start = typeof target.selectionStart === "number" ? target.selectionStart : null;
        descriptor.end = typeof target.selectionEnd === "number" ? target.selectionEnd : null;
      } catch (error) {
        descriptor.start = null;
        descriptor.end = null;
      }
      return descriptor;
    }
    function restoreFocus(descriptor) {
      if (!descriptor) return;
      let target = null;
      if (descriptor.kind === "teamName") {
        target = elements.teamName;
      } else if (descriptor.row !== null && descriptor.field) {
        target = document.querySelector(`[data-row="${descriptor.row}"][data-field="${descriptor.field}"]`);
      }
      if (!target) return;
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
      if (descriptor.selectAll === true && typeof target.select === "function") {
        requestAnimationFrame(() => {
          try {
            target.select();
          } catch (error) {
            // ignore select failures
          }
        });
        return;
      }
      if (typeof descriptor.start === "number" && typeof target.setSelectionRange === "function") {
        try {
          target.setSelectionRange(descriptor.start, descriptor.end ?? descriptor.start);
        } catch (error) {
          // number inputs may not support setSelectionRange
        }
      }
    }
    // State mutations.
    function patchMetric(rowIndex, field, rawValue, focusDescriptor = null) {
      const section = getSectionData();
      const metric = section.metrics[rowIndex];
      if (!metric) return;
      if (field === "annualTarget") {
        applyAnnualTargetDistribution(rowIndex, rawValue);
        clearTests();
        saveState();
        render(focusDescriptor);
        return;
      }
      if (field === "previousYearActual") {
        syncSharedReferenceField(rowIndex, field, rawValue);
        clearTests();
        saveState();
        render(focusDescriptor);
        return;
      }
      if (field === "name" || field === "unitType") {
        syncSharedTextField(rowIndex, field, rawValue);
        clearTests();
        saveState();
        render(focusDescriptor);
        return;
      }
      if (field === "weight") {
        syncSharedNumericField(rowIndex, field, rawValue);
        clearTests();
        saveState();
        render(focusDescriptor);
        return;
      }
      if (field === "target") {
        const sectionIndex = state.activeSection;
        const annualTargetMissing = metric.annualTarget === null && String(metric.annualTargetRaw ?? "").trim() === "";
        if (annualTargetMissing && deriveAnnualTargetFromQuarterTarget(rowIndex, sectionIndex, rawValue)) {
          clearTests();
          saveState();
          render(focusDescriptor);
          return;
        }
      }
      if (field === "name" || field === "unitType") {
        metric[field] = rawValue;
      } else {
        metric[field] = parseMaybeNumber(rawValue);
        if (["target", "floor", "actual", "annualTarget", "previousYearActual"].includes(field)) {
          metric[`${field}Raw`] = String(rawValue).trim();
        }
      }
      section.metrics[rowIndex] = hydrateMetric(metric);
      clearTests();
      saveState();
      render(focusDescriptor);
    }
    function deleteRow(rowIndex) {
      state.sections.forEach((section) => {
        if (section.metrics.length > 1) {
          section.metrics.splice(rowIndex, 1);
        } else {
          section.metrics[0] = createBlankMetric();
        }
      });
      clearTests();
      saveState();
      render();
    }
    function addRow() {
      const section = getSectionData();
      if (section.metrics.length >= MAX_ROWS) return;
      state.sections.forEach((item) => item.metrics.push(createBlankMetric()));
      clearTests();
      saveState();
      render();
    }
    function resetTemplate() {
      state = createDefaultState();
      saveState();
      render();
    }
    function loadRegressionMode() {
      state = createDefaultState();
      state.teamName = "회귀 테스트 팀";
      state.activeSection = 0;
      state.sections[0].metrics = REGRESSION_DATA.map((metric) => hydrateMetric(metric));
      state.testResults = runRegressionSuite(state.sections[0].metrics);
      saveState();
      render();
    }
    // Rendering.
    function renderTabs() {
      const currentQuarterIndex = getCurrentQuarterIndex();
      state.activeSection = Math.min(state.activeSection, currentQuarterIndex);
      elements.sectionTabs.innerHTML = SECTION_LABELS.map((label, index) => {
        const total = sumSection(state.sections[index].metrics);
        const locked = index > currentQuarterIndex;
        return `
          <button type="button" class="tab ${state.activeSection === index ? "active" : ""}" data-section-tab="${index}" ${locked ? "disabled" : ""}>
            <span class="tab-label">${escapeHtml(label)}</span>
            <span class="tab-score">${locked ? "예정" : `총점 ${formatWeighted(total)}`}</span>
          </button>
        `;
      }).join("");
    }
    function renderTable() {
      const section = getSectionData();
      const derivedRows = section.metrics.map((metric) => deriveMetric(metric));
      elements.rowCountNote.textContent = `${section.metrics.length} / ${MAX_ROWS}행`;
      elements.addRowBtn.disabled = section.metrics.length >= MAX_ROWS;
      elements.metricsBody.innerHTML = derivedRows.map((row, index) => {
        const fieldErrors = getFieldErrors(row.metric);
        const warningBadges = row.validation.warnings.map((message, warningIndex) => (
          `<span class="mini-badge warning tooltip-wrap" data-tooltip="${escapeAttr(message)}">경고 ${warningIndex + 1}</span>`
        )).join("");
        const errorBadges = row.validation.errors.map((message, errorIndex) => (
          `<span class="mini-badge error tooltip-wrap" data-tooltip="${escapeAttr(message)}">오류 ${errorIndex + 1}</span>`
        )).join("");
        const metricModeBadge = row.metric.integerMetric
          ? `<span class="mini-badge integer">정수형 KPI</span>`
          : `<span class="mini-badge">실수형 KPI</span>`;
        const kpiReference = getKpiReferenceContent(row.metric.name);
        const referenceBadge = kpiReference
          ? `<button class="mini-badge reference-btn" type="button" data-reference-key="${escapeAttr(kpiReference.key)}" data-reference-row="${index}">기준</button>`
          : "";
        const achievementTooltip = getAchievementTooltip(row.achievement);
        const bandText = bandDisplay(row.score.matchedBand, row.metric.direction);
        const scoreTooltip = `${row.score.breakdown} · 가중 ${row.metric.weight !== null ? `${formatScore(row.score.scoreRate)} × ${formatNumber(row.metric.weight, 0, 3)} = ${formatWeighted(row.weightedScore)}` : "비중 미입력"}`;
        const thresholdHtml = ["S", "A", "B", "C", "D"].map((key) => {
          const activeClass = isBandActive(row.score.matchedBand, key) ? "active-band" : "";
          const sClass = key === "S" ? "s-cell" : "";
          const matchedS = row.score.matchedBand === "S" && key === "S" ? "matched-s" : "";
          return `
            <td class="readonly threshold-col">
              <div class="readonly-box threshold ${activeClass} ${sClass} ${matchedS}">${formatNumber(row.thresholds[key], 0, 3)}</div>
            </td>
          `;
        }).join("");
        return `
          <tr>
            <td class="row-index">${index + 1}</td>
            <td class="input-col">
              <div class="metric-wrap">
                <input class="cell-input" type="text" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeHtml(row.metric.name)}" data-row="${index}" data-field="name" placeholder="KPI명을 입력하세요" />
                <div class="subline">
                  ${metricModeBadge}
                  ${referenceBadge}
                  ${warningBadges}
                  ${errorBadges}
                </div>
              </div>
            </td>
            <td class="input-col">
              <input
                class="cell-input ${fieldErrors.weight.length ? "error" : ""}"
                type="text"
                inputmode="decimal"
                enterkeyhint="next"
                autocomplete="off"
                spellcheck="false"
                value="${row.metric.weight ?? ""}"
                data-row="${index}"
                data-field="weight"
                placeholder="0~100"
                title="${escapeAttr(fieldErrors.weight.join(" · "))}"
              />
            </td>
            <td class="input-col">
              <div class="metric-wrap">
                <input
                  class="cell-input"
                  type="text"
                  enterkeyhint="next"
                  autocomplete="off"
                  spellcheck="false"
                  value="${escapeHtml(row.metric.unitType)}"
                  data-row="${index}"
                  data-field="unitType"
                  placeholder="건수, %, 점 ..."
                />
              </div>
            </td>
            <td class="input-col">
              <input class="cell-input" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeAttr(row.metric.previousYearActualRaw ?? "")}" data-row="${index}" data-field="previousYearActual" placeholder="전년 실적" />
            </td>
            <td class="input-col">
              <input class="cell-input" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeAttr(row.metric.annualTargetRaw ?? "")}" data-row="${index}" data-field="annualTarget" placeholder="연간 목표" />
            </td>
            <td class="input-col">
              <input class="cell-input" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeAttr(row.metric.targetRaw ?? "")}" data-row="${index}" data-field="target" placeholder="목표" />
            </td>
            <td class="input-col">
              <input class="cell-input" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeAttr(row.metric.floorRaw ?? "")}" data-row="${index}" data-field="floor" placeholder="하한" />
            </td>
            <td class="actual-col">
              <input class="cell-input" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" spellcheck="false" value="${escapeAttr(row.metric.actualRaw ?? "")}" data-row="${index}" data-field="actual" placeholder="예상 실적" />
            </td>
            ${thresholdHtml}
            <td class="readonly">
              <div class="status-badge ${getAchievementClass(row.achievement)} tooltip-wrap" data-tooltip="${escapeAttr(achievementTooltip)}">
                ${formatAchievement(row.achievement)}
              </div>
            </td>
            <td class="readonly">
              <div class="readonly-box score tooltip-wrap" data-tooltip="${escapeAttr(scoreTooltip)}">
                ${formatScore(row.score.scoreRate)}
              </div>
            </td>
            <td class="readonly">
              <div class="band-pill ${getBandClass(row)}">${escapeHtml(bandText)}</div>
            </td>
            <td class="readonly">
              <div class="readonly-box weighted tooltip-wrap" data-tooltip="${escapeAttr(scoreTooltip)}">
                ${formatWeighted(row.weightedScore)}
              </div>
            </td>
            <td class="action-cell">
              <button class="action-btn" type="button" title="행 삭제" data-delete-row="${index}">−</button>
            </td>
          </tr>
        `;
      }).join("");
    }
    function renderSummaryAndValidation() {
      const section = getSectionData();
      const derivedRows = section.metrics.map((metric) => deriveMetric(metric));
      const sectionValidation = validateSection(section.metrics);
      const messages = buildMessages(derivedRows, sectionValidation);
      const totalScore = sumSection(section.metrics);
      const totalWeight = sectionValidation.totalWeight;
      const okState = !messages.errors.length && !messages.warnings.length;
      elements.summaryGrid.innerHTML = `
        <div class="summary-card">
          <div class="summary-title">비중 합계</div>
          <div class="summary-value ${Math.abs(totalWeight - 100) <= 1e-9 ? "good" : "warn"}">${formatWeighted(totalWeight)}</div>
          <div class="summary-help">권장값은 100.0입니다.</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">섹션 총점</div>
          <div class="summary-value accent">${formatWeighted(totalScore)}</div>
          <div class="summary-help">가중점수 합계를 소수점 첫째 자리로 반올림합니다.</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">검증 상태</div>
          <div class="summary-status-row">
            <span class="pill ${okState ? "good" : ""}">${okState ? "정상" : "검토 필요"}</span>
            <span class="pill ${messages.errors.length ? "error" : ""}">오류 ${messages.errors.length}</span>
            <span class="pill ${messages.warnings.length ? "warn" : ""}">경고 ${messages.warnings.length}</span>
          </div>
          <div class="summary-help">행별 검증과 섹션 비중 검증을 함께 표시합니다.</div>
        </div>
      `;
      const allMessages = [
        ...messages.errors.map((text) => ({ type: "error", text })),
        ...messages.warnings.map((text) => ({ type: "warn", text }))
      ];
      if (!allMessages.length) {
        elements.validationList.innerHTML = `
          <div class="message-empty">현재 섹션에 오류나 경고가 없습니다.</div>
        `;
      } else {
        elements.validationList.innerHTML = allMessages.map((item, index) => `
          <div class="message-item ${item.type}">
            <div class="message-index">${index + 1}</div>
            <div class="message-text">${escapeHtml(item.text)}</div>
          </div>
        `).join("");
      }
    }
    function renderTests() {
      if (!state.testResults) {
        elements.testCard.hidden = true;
        elements.testSummary.innerHTML = "";
        elements.testResultsBody.innerHTML = "";
        return;
      }
      elements.testCard.hidden = false;
      const testResults = state.testResults;
      elements.testSummary.innerHTML = `
        <div class="test-stat ${testResults.passed ? "pass" : "fail"}">
          ${testResults.passed ? "✅ 엑셀 호환성 검증 통과" : "⚠️ 일부 검증 실패"}
        </div>
        <div class="test-stat">전체 ${testResults.total}건</div>
        <div class="test-stat pass">성공 ${testResults.passCount}건</div>
        <div class="test-stat ${testResults.failCount ? "fail" : ""}">실패 ${testResults.failCount}건</div>
      `;
      elements.testResultsBody.innerHTML = testResults.assertions.map((item) => `
        <tr class="${item.pass ? "pass" : "fail"}">
          <td>${escapeHtml(item.group)}</td>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(typeof item.expected === "number" ? fmtRaw(item.expected) : String(item.expected))}</td>
          <td>${escapeHtml(typeof item.actual === "number" ? fmtRaw(item.actual) : String(item.actual))}</td>
          <td>${item.diff === null ? "—" : fmtRaw(item.diff)}</td>
          <td><span class="result-chip ${item.pass ? "pass" : "fail"}">${item.pass ? "PASS" : "FAIL"}</span></td>
        </tr>
      `).join("");
    }
    function render(focusDescriptor = null) {
      state.activeSection = Math.min(state.activeSection, getCurrentQuarterIndex());
      elements.teamName.value = state.teamName;
      renderTabs();
      renderTable();
      renderSummaryAndValidation();
      renderTests();
      if (focusDescriptor) {
        requestAnimationFrame(() => restoreFocus(focusDescriptor));
      }
    }
    // Event handlers and app bootstrap.
    function handleDocumentClick(event) {
      const helpKey = event.target.closest("[data-help-key]")?.getAttribute("data-help-key");
      const referenceKey = event.target.closest("[data-reference-key]")?.getAttribute("data-reference-key");
      const referenceRow = event.target.closest("[data-reference-row]")?.getAttribute("data-reference-row");
      const editReferenceToggle = event.target.closest("#headerHelpEditToggle");
      const saveReference = event.target.closest("[data-save-reference]");
      const dismissHelp = event.target.closest("[data-dismiss-help]");
      const dismissHelpButton = event.target.closest(".header-help-close");
      const helpDialog = event.target.closest("[data-help-dialog]");
      const tabIndex = event.target.closest("[data-section-tab]")?.getAttribute("data-section-tab");
      const deleteIndex = event.target.closest("[data-delete-row]")?.getAttribute("data-delete-row");
      if (helpKey) {
        showHeaderHelp(helpKey);
        return;
      }
      if (referenceKey) {
        showKpiReference(referenceKey, referenceRow !== undefined && referenceRow !== null ? Number(referenceRow) : null);
        return;
      }
      if (editReferenceToggle) {
        toggleReferenceEditor();
        return;
      }
      if (saveReference) {
        saveReferenceEditor();
        return;
      }
      if (dismissHelpButton || (dismissHelp && !helpDialog)) {
        hideHeaderHelp();
        return;
      }
      if (tabIndex !== undefined && tabIndex !== null) {
        const nextSection = Number(tabIndex);
        if (nextSection > getCurrentQuarterIndex()) {
          return;
        }
        state.activeSection = nextSection;
        saveState();
        render();
        return;
      }
      if (deleteIndex !== undefined && deleteIndex !== null) {
        deleteRow(Number(deleteIndex));
      }
    }
    function handleDocumentKeydown(event) {
      const target = event.target;
      if (event.key === "Enter" && target instanceof HTMLInputElement && !event.isComposing) {
        const field = target.getAttribute("data-field");
        const rowIndex = target.getAttribute("data-row");
        if (rowIndex !== null && isEditableMetricField(field)) {
          event.preventDefault();
          const trimmed = target.value.trim();
          if (isNumericField(field) && ["-", ".", "-."].includes(trimmed)) {
            return;
          }
          const nextFocus = getNextEditableFocusDescriptor(target, event.shiftKey ? -1 : 1) ?? captureFocus(target);
          patchMetric(Number(rowIndex), field, target.value, nextFocus);
          return;
        }
      }
      if (event.key === "Enter" && event.ctrlKey && target === elements.headerHelpEditInput) {
        event.preventDefault();
        saveReferenceEditor();
        return;
      }
      if (event.key === "Escape" && !elements.headerHelpPanel.hidden) {
        hideHeaderHelp();
      }
    }
    function handleDocumentInput(event) {
      const target = event.target;
      if (event.isComposing) {
        return;
      }
      if (target === elements.teamName) {
        state.teamName = target.value;
        clearTests();
        saveState();
        return;
      }
      const rowIndex = target.getAttribute("data-row");
      const field = target.getAttribute("data-field");
      if (rowIndex !== null && field) {
        if (!isNumericField(field)) {
          return;
        }
        if (["-", ".", "-."].includes(target.value.trim())) {
          return;
        }
        patchMetric(Number(rowIndex), field, target.value, captureFocus(target));
      }
    }
    function handleDocumentChange(event) {
      const target = event.target;
      const rowIndex = target.getAttribute("data-row");
      const field = target.getAttribute("data-field");
      if (rowIndex !== null && field) {
        patchMetric(Number(rowIndex), field, target.value, captureFocus(target));
      }
    }
    function bindEvents() {
      document.addEventListener("click", handleDocumentClick);
      document.addEventListener("keydown", handleDocumentKeydown);
      document.addEventListener("input", handleDocumentInput);
      document.addEventListener("change", handleDocumentChange);
      elements.addRowBtn.addEventListener("click", addRow);
      elements.resetTemplateBtn.addEventListener("click", resetTemplate);
      elements.runRegressionBtn.addEventListener("click", loadRegressionMode);
    }
    function boot() {
      bindEvents();
      render();
    }
    boot();
  }
