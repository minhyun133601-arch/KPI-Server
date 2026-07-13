import fs from 'node:fs/promises';

const CSS_IMPORT_PATTERN = /@import\s+url\("([^"]+)"\);/g;
const EXPECTED_STYLE_IMPORTS = [
  './styles/base.css',
  './styles/calendar.css',
  './styles/entry-quick.css',
  './styles/equipment-controls.css',
  './styles/equipment-fields.css',
  './styles/team-settlement.css',
  './styles/team-totals.css',
  './styles/team-boards.css',
  './styles/team-assignment.css',
  './styles/fullscreen-popup.css',
  './styles/responsive.css',
];
const EXPECTED_EMBEDDED_STYLE_IMPORTS = [
  './embedded/base.css',
  './embedded/calendar.css',
  './embedded/entry-quick.css',
  './embedded/equipment-controls.css',
  './embedded/equipment-fields.css',
  './embedded/team-settlement.css',
  './embedded/team-totals.css',
  './embedded/team-boards.css',
  './embedded/team-assignment.css',
  './embedded/fullscreen-popup.css',
  './embedded/responsive.css',
];

function stripCssImportVersion(href) {
  return String(href || '').split('?')[0];
}

function countCssLines(source) {
  return String(source || '')
    .split(/\r?\n/)
    .filter((line, index, lines) => {
      return index < lines.length - 1 || line.length > 0;
    }).length;
}

async function readCssManifestWithImports(fileName, manifestUrl) {
  const manifestSource = await fs.readFile(manifestUrl, 'utf8');
  const importHrefs = [...manifestSource.matchAll(CSS_IMPORT_PATTERN)].map((match) => match[1]);
  const importedSources = await Promise.all(
    importHrefs.map(async (href) => {
      const importUrl = new URL(stripCssImportVersion(href), manifestUrl);
      return {
        fileName: stripCssImportVersion(href),
        source: await fs.readFile(importUrl, 'utf8'),
      };
    })
  );

  return {
    fileName,
    manifestSource,
    importHrefs,
    importedSources,
    combinedSource: [manifestSource, ...importedSources.map((entry) => entry.source)].join('\n'),
  };
}

const meteringStylesBundle = await readCssManifestWithImports(
  'styles.css',
  new URL('../../../../../utility/apps/metering/styles.css', import.meta.url)
);
const meteringEmbeddedStylesBundle = await readCssManifestWithImports(
  'embedded.css',
  new URL('../../../../../utility/apps/metering/embedded.css', import.meta.url)
);
const meteringStylesSource = meteringStylesBundle.combinedSource;
const meteringEmbeddedStylesSource = meteringEmbeddedStylesBundle.combinedSource;

export {
  countCssLines,
  EXPECTED_EMBEDDED_STYLE_IMPORTS,
  EXPECTED_STYLE_IMPORTS,
  meteringEmbeddedStylesBundle,
  meteringEmbeddedStylesSource,
  meteringStylesBundle,
  meteringStylesSource,
  stripCssImportVersion,
};
