import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countCssLines,
  EXPECTED_EMBEDDED_STYLE_IMPORTS,
  EXPECTED_STYLE_IMPORTS,
  meteringEmbeddedStylesBundle,
  meteringEmbeddedStylesSource,
  meteringStylesBundle,
  meteringStylesSource,
  stripCssImportVersion,
} from './support/metering-css-manifest-harness.js';

test('quick-entry popup CSS uses a dense fullscreen grid instead of large row cards', () => {
  [meteringStylesSource, meteringEmbeddedStylesSource].forEach((source) => {
    assert.match(source, /\.quick-entry-popup-panel\s*\{[\s\S]*width:\s*min\(1720px,\s*100%\)/);
    assert.match(
      source,
      /\.quick-entry-popup-panel\s*\{[\s\S]*min-height:\s*calc\(100vh - clamp\(16px,\s*2\.8vw,\s*32px\)\)/
    );
    assert.match(source, /\.quick-entry-popup-body\s*\{[\s\S]*overflow:\s*hidden/);
    assert.match(
      source,
      /\.quick-entry-popup-row-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(172px,\s*1fr\)\)/
    );
    assert.match(
      source,
      /\.quick-entry-popup-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(74px,\s*94px\)/
    );
    assert.match(source, /\.quick-entry-popup-row-title\s*\{[\s\S]*white-space:\s*nowrap/);
    assert.doesNotMatch(source, /\.quick-entry-popup-row-meta\.has-previous-value/);
    assert.doesNotMatch(source, /\.field-card-previous\s*\{/);
  });
});

test('metering popup CSS manifests keep split chunks below the work-log threshold', () => {
  [
    { bundle: meteringStylesBundle, expectedImports: EXPECTED_STYLE_IMPORTS },
    { bundle: meteringEmbeddedStylesBundle, expectedImports: EXPECTED_EMBEDDED_STYLE_IMPORTS },
  ].forEach(({ bundle, expectedImports }) => {
    assert.deepEqual(bundle.importHrefs.map(stripCssImportVersion), expectedImports);
    assert.ok(countCssLines(bundle.manifestSource) < 800, `${bundle.fileName} manifest is too large`);
    bundle.importedSources.forEach(({ fileName, source }) => {
      assert.ok(countCssLines(source) < 800, `${fileName} has ${countCssLines(source)} lines`);
    });
  });
});
