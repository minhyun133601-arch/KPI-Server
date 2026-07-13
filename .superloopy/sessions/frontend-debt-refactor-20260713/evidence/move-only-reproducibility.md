# Move-only reproducibility audit

Date: `2026-07-13`
Scope: static-audit findings `F-E01` through `F-E05`
Mutation boundary: evidence only; this audit does not write product/test files, Git state, processes, databases, or external services

## Decision

**PASS.** All five findings are closed with reproducible comparisons against immutable Git revisions. The only source transformations excluded from equality are the documented private-registry composition layer, mapped dead declarations, local binding renames required to avoid registry shadowing, and indentation immediately following a newline inside generated HTML template tokens. No endpoint, selector, visible string, payload key, calculation literal, or live function body is silently excluded.

| Finding | Reproducible result | Result |
| --- | --- | --- |
| `F-E01` equipment renderer | 167 original functions accounted for: 166 byte-exact bodies and one registry-delegated `render` body. Normalized aggregate SHA-256 is `7a16ef6558f4beb8b044fa517a1daa26b680222ca7756a4e8c083ccbc0b36db9` on both sides. | PASS |
| `F-E02` report browser adapter | 1,989 literal/template-quasi entries from original lines 4-4180 are present with identical multiplicity. Normalized multiset SHA-256 is `e1ee1841d2c8e5d9e476f2c54a67eac5855f45120f13ae470e68ccb5e34f8694` on both sides. | PASS |
| `F-E03` report runtime | After excluding the mapped shadowed first `syncReportDeckMemoDialogLines`, 5,201 literal/template-quasi entries from original lines 145-9160 are identical. Normalized multiset SHA-256 is `317afc2dddf3209360feabc312ce1f6f368342678ede0feafc1c75f029e4bd24` on both sides. | PASS |
| `F-E04` utility entry | All 372 named functions are present; 225 are byte-exact and 147 differ only by documented registry/state/local binding notation. Function aggregate SHA-256 is `b7c91a3ff0fd8b54d15d64fb7cc62de9acaf9c812632d579bf5e349d7be60c02` on both sides. A second 3,841-entry literal/template audit hashes to `6e1f48e6a035d3c85a21be71ffdb31eeb272ba0a455c39331e1e6b65a229d876` on both sides. | PASS |
| `F-E05` report-sheet shell | 218 retained declarations hash to `4176d5fc5909b127f8d38b964fe60a01a303f78224188f06600c870bcb645249` on both sides. A deterministic generated-analysis sample contains 14,289 normalized JavaScript tokens and hashes to `f4e9a0c62a4b07b49122393b20ac58ed7a364b973e4930f157d89c541debd144` on both sides. | PASS |

## Source anchors and normalization boundaries

- Equipment uses the actual pre-split parent revision `7202c741d9beee1e575f8baa6824bc1f0ce0dbb1`; its source blob SHA-256 is `e15a10948ebfed376c57753559151b170e902e51000381e51ff393cd9ed73bfb`. The requested checkpoint already contains this split, so comparing it to itself would not prove movement.
- Adapter, report runtime, utility entry, and report-sheet shell use checkpoint `2f192060acb989ff791158e7c8447e1e8089f93c`. Their source blob SHA-256 values are respectively `b2d9572be103079ec6ce8b6a0cb8a6adab43ed6d66830b40213ff3383ffef1ca`, `b3a8ffcfda76a3f3a3bf85e12960ef50b628b6ba1d6591e02a348ade711b31da`, `279f9f25e0c06dc8925b069f7b18af147ccc4210a82dc39dc652c3aac5f419e9`, and `920e42a55c1f1a1a704fe3313932a96985d8f18a479c75dd7fff2e015cef2941`.
- Private `Symbol.for(...)` keys, `Object.create(null)` values, and the repeated per-part `browser` dependency capture added solely for classic-script composition are excluded from literal audits.
- Utility-entry registry prefixes, `parts.state` storage names, and two local `monthParts` renames are normalized back to their pre-split bindings. The already documented graph stylesheet query change `v=28` to `v=29` is normalized to `v={VERSION}`. The extraction-map snapshot hash was taken from an uncommitted working-tree representation and is not itself a Git object; the immutable checkpoint blob above is therefore the reproducible source anchor.
- Report runtime excludes only the first, shadowed `syncReportDeckMemoDialogLines` declaration at original lines 4409-4440.
- Report-sheet comparison excludes the eight dead declarations explicitly listed in the extraction map and the five new fragment/composition helpers. The rewritten coordinator is verified separately by executing original and current builders on the same payload and comparing their generated JavaScript token streams after removing the three mapped dead generated-runtime declarations.
- Template normalization removes indentation immediately following a newline. It does not remove or rewrite tag text, attributes, selectors, inline copy, literal values, or non-leading whitespace.

## Exact rerun command

Run from `kpi-runtime/internal-server`:

```powershell
$artifact = '..\..\.superloopy\sessions\frontend-debt-refactor-20260713\evidence\move-only-reproducibility.md'
$markdown = Get-Content -Raw -Encoding UTF8 $artifact
$pattern = '(?s)<!-- audit-script:start -->\s*```javascript\s*(.*?)\s*```\s*<!-- audit-script:end -->'
$match = [regex]::Match($markdown, $pattern)
if (-not $match.Success) { throw 'embedded audit script not found' }
$match.Groups[1].Value | node -
```

Expected final fields: every nested `pass` and top-level `pass` are `true`.

<!-- audit-script:start -->
```javascript
const fs = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const espree = require('espree');
const vm = require('vm');
const path = require('path');

const repo = path.resolve(process.cwd(), '..', '..');
const checkpoint = '2f192060acb989ff791158e7c8447e1e8089f93c';
const equipmentParent = '7202c741d9beee1e575f8baa6824bc1f0ce0dbb1';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const gitBlob = (revision, relativePath) => cp.execFileSync(
    'git',
    ['show', `${revision}:${relativePath}`],
    { cwd: repo, maxBuffer: 32 * 1024 * 1024 }
);
const parse = (source, options = {}) => espree.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    range: true,
    loc: options.loc === true
});

function visit(node, callback) {
    if (!node || typeof node !== 'object') return;
    if (callback(node) === false) return;
    for (const [key, value] of Object.entries(node)) {
        if (['range', 'loc', 'start', 'end', 'tokens', 'comments'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(item => visit(item, callback));
        else if (value && typeof value === 'object' && value.type) visit(value, callback);
    }
}

function collectFunctionMap(source) {
    const result = new Map();
    visit(parse(source), node => {
        if (node.type === 'FunctionDeclaration' && node.id?.name) {
            result.set(node.id.name, source.slice(node.range[0], node.range[1]));
        }
    });
    return result;
}

function collectFunctionList(source) {
    const result = [];
    visit(parse(source), node => {
        if (node.type === 'FunctionDeclaration' && node.id?.name) {
            result.push({ name: node.id.name, body: source.slice(node.range[0], node.range[1]) });
        }
    });
    return result;
}

function tokenValues(source) {
    return espree.tokenize(source, { ecmaVersion: 'latest' })
        .map(token => ({ type: token.type, value: token.value }));
}

function aggregateNamedFunctions(names, sourceMap, fingerprint) {
    return sha(names.map(name => `${name}\0${sha(fingerprint(sourceMap.get(name)))}`).join('\n'));
}

function equipmentAudit() {
    const relativePath = 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js';
    const originalBytes = gitBlob(equipmentParent, relativePath);
    const original = collectFunctionMap(originalBytes.toString('utf8'));
    const current = new Map();
    const partDir = path.join(repo, 'data-entry/runtime/data/equipment-history/render');
    for (const file of fs.readdirSync(partDir).filter(file => file.endsWith('.js')).sort()) {
        for (const [name, body] of collectFunctionMap(fs.readFileSync(path.join(partDir, file), 'utf8'))) {
            current.set(name, body);
        }
    }
    for (const [name, body] of collectFunctionMap(fs.readFileSync(path.join(repo, relativePath), 'utf8'))) {
        current.set(name, body);
    }
    const delegated = new Set([
        'ensureEquipmentHistoryFullscreenListener',
        'renderShell',
        'bindEvents',
        'replaceEquipmentHistoryBoardHistory',
        'applyEquipmentHistoryBrowserState',
        'saveCurrentEquipmentHistoryView'
    ]);
    const fingerprint = (source, currentMode = false) => {
        let tokens = tokenValues(source).map(token => `${token.type}:${token.value}`);
        if (!currentMode) return tokens.join('\n');
        const output = [];
        let setterDepth = 0;
        let skipSetterClose = false;
        for (let index = 0; index < tokens.length;) {
            if (skipSetterClose && tokens[index] === 'Punctuator:)') {
                skipSetterClose = false;
                index += 1;
                continue;
            }
            if (
                tokens[index] === 'Identifier:api'
                && tokens[index + 1] === 'Punctuator:.'
                && tokens[index + 2] === 'Identifier:setEquipmentHistoryActiveSaveController'
                && tokens[index + 3] === 'Punctuator:('
            ) {
                output.push('Identifier:activeSaveController', 'Punctuator:=');
                setterDepth = -1;
                index += 4;
                continue;
            }
            if (
                tokens[index] === 'Identifier:api'
                && tokens[index + 1] === 'Punctuator:.'
                && delegated.has(tokens[index + 2]?.slice('Identifier:'.length))
            ) {
                index += 2;
                continue;
            }
            if (setterDepth !== 0) {
                if (tokens[index] === 'Punctuator:{') setterDepth = setterDepth < 0 ? 1 : setterDepth + 1;
                else if (tokens[index] === 'Punctuator:}') {
                    setterDepth -= 1;
                    if (setterDepth === 0) skipSetterClose = true;
                }
            }
            output.push(tokens[index]);
            index += 1;
        }
        return output.join('\n');
    };
    const names = [...original.keys()].sort();
    const exact = names.filter(name => original.get(name).replace(/\r\n/g, '\n') === current.get(name)?.replace(/\r\n/g, '\n'));
    const normalized = names.filter(name => !exact.includes(name) && current.has(name) && fingerprint(original.get(name)) === fingerprint(current.get(name), true));
    const originalAggregate = aggregateNamedFunctions(names, original, source => fingerprint(source));
    const currentAggregate = aggregateNamedFunctions(names, current, source => fingerprint(source, true));
    const mismatch = names.filter(name => !exact.includes(name) && !normalized.includes(name));
    return {
        revision: equipmentParent,
        sourceSha256: sha(originalBytes),
        originalFunctions: original.size,
        currentFunctions: current.size,
        exactBodyCount: exact.length,
        normalizedDelegationCount: normalized.length,
        normalizedFunctions: normalized,
        currentCompositionOnlyFunctions: [...current.keys()].filter(name => !original.has(name)),
        originalOnly: names.filter(name => !current.has(name)),
        mismatch,
        originalAggregateSha256: originalAggregate,
        currentAggregateSha256: currentAggregate,
        pass: mismatch.length === 0 && originalAggregate === currentAggregate
    };
}

function literalQuasis(source, options = {}) {
    const ast = parse(source, { loc: options.loc === true });
    const output = [];
    let shadowedMemoDeclarationSeen = 0;
    function walk(node, parent = null) {
        if (!node || typeof node !== 'object') return;
        if (options.skipFacadeRequired && node.type === 'VariableDeclaration' && node.declarations?.some(item => item.id?.name === 'required')) return;
        if (options.skipFacadeRequired && node.type === 'ForOfStatement' && node.left?.declarations?.some(item => item.id?.name === 'name')) return;
        if (options.skipUtilityRoot && node.type === 'VariableDeclaration' && node.declarations?.some(item => item.id?.name === 'utilityEntryExperimentRoot')) return;
        if (options.skipRuntimeBrowserBinding && node.type === 'VariableDeclaration' && node.declarations?.some(item => item.id?.name === 'browser')) return;
        if (options.skipFirstShadowedMemo && node.type === 'FunctionDeclaration' && node.id?.name === 'syncReportDeckMemoDialogLines') {
            shadowedMemoDeclarationSeen += 1;
            if (shadowedMemoDeclarationSeen === 1) return;
        }
        const inRange = !options.lineRange || (node.loc?.start.line >= options.lineRange[0] && node.loc?.start.line <= options.lineRange[1]);
        if (inRange && node.type === 'Literal') {
            if (options.registryKeys?.has(node.value)) return;
            if (
                node.value === null
                && parent?.type === 'CallExpression'
                && parent.callee?.type === 'MemberExpression'
                && parent.callee.object?.name === 'Object'
                && parent.callee.property?.name === 'create'
            ) return;
            let value = node.value;
            if (options.normalizeGraphVersion && (
                value === 'data-entry/runtime/data/utility-graph-template/styles.css?v=28'
                || value === 'data-entry/runtime/data/utility-graph-template/styles.css?v=29'
            )) value = 'data-entry/runtime/data/utility-graph-template/styles.css?v={VERSION}';
            output.push(`L\0${typeof value}\0${String(value)}`);
        }
        if (inRange && node.type === 'TemplateElement') output.push(`T\0${node.value.raw}`);
        for (const [key, value] of Object.entries(node)) {
            if (['range', 'loc', 'start', 'end', 'tokens', 'comments'].includes(key)) continue;
            if (Array.isArray(value)) value.forEach(item => walk(item, node));
            else if (value && typeof value === 'object' && value.type) walk(value, node);
        }
    }
    walk(ast);
    return output;
}

function multisetAudit(originalValues, currentValues) {
    const count = values => {
        const result = new Map();
        values.forEach(value => result.set(value, (result.get(value) || 0) + 1));
        return result;
    };
    const original = count(originalValues);
    const current = count(currentValues);
    let missing = 0;
    let extra = 0;
    for (const [value, amount] of original) missing += Math.max(0, amount - (current.get(value) || 0));
    for (const [value, amount] of current) extra += Math.max(0, amount - (original.get(value) || 0));
    const originalHash = sha([...originalValues].sort().join('\n'));
    const currentHash = sha([...currentValues].sort().join('\n'));
    return {
        originalCount: originalValues.length,
        currentCount: currentValues.length,
        originalSha256: originalHash,
        currentSha256: currentHash,
        missingCount: missing,
        extraCount: extra,
        pass: originalValues.length === currentValues.length && missing === 0 && extra === 0 && originalHash === currentHash
    };
}

function adapterAudit() {
    const relativePath = 'utility/runtime/util/KPI.util.runtime.browser-adapter.js';
    const originalBytes = gitBlob(checkpoint, relativePath);
    const originalSource = originalBytes.toString('utf8').replace(/\r\n/g, '\n');
    const original = originalSource.split('\n').slice(3, 4180).join('\n');
    const order = [
        'KPI.util.report-deck.adapter.api.js',
        'KPI.util.report-deck.adapter.export-dom.js',
        'KPI.util.report-deck.adapter.export-html.js',
        'KPI.util.report-deck.adapter.memo-domain.js',
        'KPI.util.report-deck.adapter.memo-candidates.js',
        'KPI.util.report-deck.adapter.analysis.js',
        'KPI.util.report-deck.adapter.utility-analysis.js'
    ];
    const directory = path.join(repo, 'utility/runtime/util/report-deck/browser-adapter');
    const current = order.map(file => fs.readFileSync(path.join(directory, file), 'utf8')).join('\n');
    return {
        revision: checkpoint,
        sourceSha256: sha(originalBytes),
        ...multisetAudit(
            literalQuasis(original, { registryKeys: new Set(['kpi.reportDeck.browserAdapter.parts']) }),
            literalQuasis(current, { registryKeys: new Set(['kpi.reportDeck.browserAdapter.parts']) })
        )
    };
}

function reportRuntimeAudit() {
    const relativePath = 'utility/runtime/util/KPI.util.runtime.js';
    const originalBytes = gitBlob(checkpoint, relativePath);
    const original = originalBytes.toString('utf8').replace(/\r\n/g, '\n');
    const order = [
        'KPI.util.report-deck.config.js',
        'KPI.util.report-deck.state.js',
        'KPI.util.report-deck.plan-state.js',
        'KPI.util.report-deck.chrome.js',
        'KPI.util.report-deck.memo-format.js',
        'KPI.util.report-deck.memo-overview.js',
        'KPI.util.report-deck.memo-editor.js',
        'KPI.util.report-deck.plan-editor.js',
        'KPI.util.report-deck.auto-render.js',
        'KPI.util.report-deck.charts.js',
        'KPI.util.report-deck.navigation-output.js',
        'KPI.util.report-deck.persistence-editor.js'
    ];
    const directory = path.join(repo, 'utility/runtime/util/report-deck/runtime');
    const current = order.map(file => fs.readFileSync(path.join(directory, file), 'utf8')).join('\n');
    return {
        revision: checkpoint,
        sourceSha256: sha(originalBytes),
        excludedOriginal: 'first syncReportDeckMemoDialogLines declaration at original lines 4409-4440',
        ...multisetAudit(
            literalQuasis(original, {
                loc: true,
                lineRange: [145, 9160],
                skipFirstShadowedMemo: true,
                registryKeys: new Set(['kpi.reportDeck.runtime.parts'])
            }),
            literalQuasis(current, {
                skipRuntimeBrowserBinding: true,
                registryKeys: new Set(['kpi.reportDeck.runtime.parts'])
            })
        )
    };
}

function utilityEntryAudit() {
    const relativePath = 'data-entry/runtime/data/sections/KPI.sections.data.js';
    const originalBytes = gitBlob(checkpoint, relativePath);
    const originalSource = originalBytes.toString('utf8');
    const order = [
        'KPI.utility-entry.config.js',
        'KPI.utility-entry.readings.js',
        'KPI.utility-entry.corrections.math.js',
        'KPI.utility-entry.completion-status.js',
        'KPI.utility-entry.corrections.ui.js',
        'KPI.utility-entry.daily-meter.js',
        'KPI.utility-entry.graph.js',
        'KPI.utility-entry.monthly-settlement.js',
        'KPI.utility-entry.billing-io.js',
        'KPI.utility-entry.store-save.js',
        'KPI.utility-entry.quick-controller.js',
        'KPI.utility-entry.templates.js'
    ];
    const directory = path.join(repo, 'data-entry/runtime/data/sections/utility-entry');
    const currentSources = order.map(file => fs.readFileSync(path.join(directory, file), 'utf8'));
    const facadeSource = fs.readFileSync(path.join(repo, relativePath), 'utf8');
    const originalFunctions = collectFunctionMap(originalSource);
    const currentFunctions = new Map();
    [...currentSources, facadeSource].forEach(source => {
        for (const [name, body] of collectFunctionMap(source)) currentFunctions.set(name, body);
    });
    const fingerprint = (source, currentMode = false) => {
        let tokens = tokenValues(source).map(token => `${token.type}:${token.value}`);
        if (!currentMode) return tokens.join('\n');
        const output = [];
        for (let index = 0; index < tokens.length;) {
            if (
                tokens[index] === 'Identifier:parts'
                && tokens[index + 1] === 'Punctuator:.'
                && tokens[index + 2] === 'Identifier:state'
                && tokens[index + 3] === 'Punctuator:.'
                && tokens[index + 4] === 'Identifier:actualRecordPromise'
            ) {
                output.push('Identifier:utilityEntryExperimentActualRecordPromise');
                index += 5;
                continue;
            }
            if (
                tokens[index] === 'Identifier:parts'
                && tokens[index + 1] === 'Punctuator:.'
                && tokens[index + 2] === 'Identifier:state'
                && tokens[index + 3] === 'Punctuator:.'
                && tokens[index + 4] === 'Identifier:populateSequence'
            ) {
                output.push('Identifier:utilityEntryExperimentPopulateSequence');
                index += 5;
                continue;
            }
            if (
                tokens[index] === 'Identifier:parts'
                && tokens[index + 1] === 'Punctuator:.'
                && tokens[index + 2] === 'Identifier:constants'
                && tokens[index + 3] === 'Punctuator:.'
            ) {
                index += 4;
                continue;
            }
            if (tokens[index] === 'Identifier:parts' && tokens[index + 1] === 'Punctuator:.') {
                index += 2;
                continue;
            }
            output.push(tokens[index] === 'Identifier:monthParts' ? 'Identifier:parts' : tokens[index]);
            index += 1;
        }
        return output.join('\n');
    };
    const names = [...originalFunctions.keys()].sort();
    const exact = names.filter(name => originalFunctions.get(name).replace(/\r\n/g, '\n') === currentFunctions.get(name)?.replace(/\r\n/g, '\n'));
    const originalAggregate = aggregateNamedFunctions(names, originalFunctions, source => fingerprint(source));
    const currentAggregate = aggregateNamedFunctions(names, currentFunctions, source => fingerprint(source, true));
    const currentLiteralValues = [];
    currentSources.forEach(source => currentLiteralValues.push(...literalQuasis(source, {
        skipUtilityRoot: true,
        normalizeGraphVersion: true,
        registryKeys: new Set(['kpi.utilityEntryExperiment.parts'])
    })));
    currentLiteralValues.push(...literalQuasis(facadeSource, {
        skipFacadeRequired: true,
        normalizeGraphVersion: true,
        registryKeys: new Set(['kpi.utilityEntryExperiment.parts'])
    }));
    const literalAudit = multisetAudit(
        literalQuasis(originalSource, {
            normalizeGraphVersion: true,
            registryKeys: new Set(['kpi.utilityEntryExperiment.parts'])
        }),
        currentLiteralValues
    );
    return {
        revision: checkpoint,
        sourceSha256: sha(originalBytes),
        originalFunctions: originalFunctions.size,
        currentFunctions: currentFunctions.size,
        exactBodyCount: exact.length,
        normalizedBodyCount: names.length - exact.length,
        originalOnly: names.filter(name => !currentFunctions.has(name)),
        currentOnly: [...currentFunctions.keys()].filter(name => !originalFunctions.has(name)),
        originalAggregateSha256: originalAggregate,
        currentAggregateSha256: currentAggregate,
        literalAudit,
        pass: names.length === currentFunctions.size && originalAggregate === currentAggregate && literalAudit.pass
    };
}

function findFunction(source, name) {
    let body = null;
    visit(parse(source), node => {
        if (!body && node.type === 'FunctionDeclaration' && node.id?.name === name) {
            body = source.slice(node.range[0], node.range[1]);
        }
    });
    if (!body) throw new Error(`function not found: ${name}`);
    return body;
}

function reportSheetAudit() {
    const relativePath = 'utility/runtime/util/report/sheet/modal/shell.js';
    const originalBytes = gitBlob(checkpoint, relativePath);
    const originalSource = originalBytes.toString('utf8');
    const order = [
        'core.js',
        'extract-core.js',
        'analysis-runtime-foundation.js',
        'analysis-runtime-charts.js',
        'analysis-runtime-tables.js',
        'analysis-runtime-interactions.js',
        'monthly-state.js',
        'print-assets.js',
        'document-builders.js',
        'monthly-runner.js',
        'modal-dom.js'
    ];
    const directory = path.join(repo, 'utility/runtime/util/report/sheet/modal/shell');
    const currentSources = order.map(file => ({ file, source: fs.readFileSync(path.join(directory, file), 'utf8') }));
    const facadeSource = fs.readFileSync(path.join(repo, relativePath), 'utf8');
    const dead = new Set([
        'getAlternateSheetType',
        'buildReportTemplateSectionHtml',
        'applyAnalysisHeaderControlsOverride',
        'isGasMeterModal',
        'formatReportMemoMonth',
        'getReportMemoRangeLabel',
        'formatMemoPercent',
        'runUtilSheetGasMeterPrint'
    ]);
    const composition = new Set([
        'analysisRuntimeFoundationFragment',
        'analysisRuntimeChartsFragment',
        'analysisRuntimeTablesFragment',
        'analysisRuntimeInteractionsFragment',
        'unwrapFunctionBody'
    ]);
    const originalFunctions = collectFunctionList(originalSource)
        .filter(item => !dead.has(item.name) && item.name !== 'buildAnalysisExtractRuntimeScript');
    const currentFunctions = currentSources.flatMap(item => collectFunctionList(item.source))
        .concat(collectFunctionList(facadeSource))
        .filter(item => !composition.has(item.name) && item.name !== 'buildAnalysisExtractRuntimeScript');
    const fingerprint = (item, currentMode = false) => {
        let tokens = tokenValues(item.body);
        if (currentMode && item.name !== 'buildCombinedExtractDocument') {
            const output = [];
            for (let index = 0; index < tokens.length;) {
                if (tokens[index].type === 'Identifier' && tokens[index].value === 'parts' && tokens[index + 1]?.value === '.') {
                    index += 2;
                    continue;
                }
                output.push(tokens[index]);
                index += 1;
            }
            tokens = output;
        }
        return tokens.map(token => `${token.type}:${token.type === 'Template'
            ? token.value.replace(/\r\n/g, '\n').replace(/\n[ \t]+/g, '\n')
            : token.value}`).join('\n');
    };
    const rows = (items, currentMode) => items
        .map(item => `${item.name}\0${sha(fingerprint(item, currentMode))}`)
        .sort();
    const originalRows = rows(originalFunctions, false);
    const currentRows = rows(currentFunctions, true);
    const originalAggregate = sha(originalRows.join('\n'));
    const currentAggregate = sha(currentRows.join('\n'));

    const originalBuilder = new Function(
        `${findFunction(originalSource, 'stringifyExtractJson')}\n${findFunction(originalSource, 'buildAnalysisExtractRuntimeScript')}\nreturn { buildAnalysisExtractRuntimeScript };`
    )();
    const currentExtractSource = currentSources.find(item => item.file === 'extract-core.js').source;
    const currentStringify = new Function(`${findFunction(currentExtractSource, 'stringifyExtractJson')}\nreturn stringifyExtractJson;`)();
    const registryKey = Symbol.for('kpi.utilReport.sheet.modalShell.parts');
    const context = {};
    context[registryKey] = { stringifyExtractJson: currentStringify };
    vm.createContext(context);
    for (const file of [
        'analysis-runtime-foundation.js',
        'analysis-runtime-charts.js',
        'analysis-runtime-tables.js',
        'analysis-runtime-interactions.js'
    ]) {
        vm.runInContext(currentSources.find(item => item.file === file).source, context, { filename: file });
    }
    const payload = {
        datasetKey: 'gas',
        activeRange: { from: '2025-01', to: '2026-12' },
        manualMemoText: '<memo>&\u2028\u2029',
        scopeOptions: [{ key: 'all', label: '전체' }],
        model: { range: { from: '2025-01', to: '2026-12' } }
    };
    const extractRuntimeJavaScript = html => {
        const match = html.match(/<script>\s*([\s\S]*?)<\/script>/);
        if (!match) throw new Error('generated analysis runtime script not found');
        return match[1];
    };
    const removeGeneratedDead = source => {
        const ranges = [];
        const generatedDead = new Set(['formatReportMemoMonth', 'getReportMemoRangeLabel', 'formatMemoPercent']);
        visit(parse(source), node => {
            if (node.type === 'FunctionDeclaration' && generatedDead.has(node.id?.name)) {
                ranges.push(node.range);
                return false;
            }
        });
        for (const [start, end] of ranges.sort((left, right) => right[0] - left[0])) {
            source = source.slice(0, start) + source.slice(end);
        }
        return source;
    };
    const runtimeFingerprint = source => tokenValues(source)
        .map(token => `${token.type}:${token.type === 'Template'
            ? token.value.replace(/\r\n/g, '\n').replace(/\n[ \t]+/g, '\n')
            : token.value}`).join('\n');
    const originalRuntime = runtimeFingerprint(removeGeneratedDead(extractRuntimeJavaScript(originalBuilder.buildAnalysisExtractRuntimeScript(payload))));
    const currentRuntime = runtimeFingerprint(extractRuntimeJavaScript(context[registryKey].buildAnalysisExtractRuntimeScript(payload)));
    return {
        revision: checkpoint,
        sourceSha256: sha(originalBytes),
        originalDeclarations: originalFunctions.length,
        currentDeclarations: currentFunctions.length,
        excludedOriginalDead: [...dead],
        excludedCurrentCompositionHelpers: [...composition],
        originalAggregateSha256: originalAggregate,
        currentAggregateSha256: currentAggregate,
        generatedRuntime: {
            payloadSha256: sha(JSON.stringify(payload)),
            originalTokenCount: originalRuntime.split('\n').length,
            currentTokenCount: currentRuntime.split('\n').length,
            originalSha256: sha(originalRuntime),
            currentSha256: sha(currentRuntime),
            pass: originalRuntime === currentRuntime
        },
        pass: originalFunctions.length === currentFunctions.length
            && originalAggregate === currentAggregate
            && originalRuntime === currentRuntime
    };
}

const result = {
    equipment: equipmentAudit(),
    reportAdapter: adapterAudit(),
    reportRuntime: reportRuntimeAudit(),
    utilityEntry: utilityEntryAudit(),
    reportSheet: reportSheetAudit()
};
result.pass = Object.values(result).every(value => value === true || value?.pass === true);
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
```
<!-- audit-script:end -->

## Remaining gap

None for `F-E01` through `F-E05`. This artifact proves static source/literal/generated-runtime equivalence within the explicit move-only normalization boundary. It does not replace the separate real-browser visual/interaction gate, which remains outside these five static evidence findings.

SUPERLOOPY_EVIDENCE: .superloopy/sessions/frontend-debt-refactor-20260713/evidence/move-only-reproducibility.md
