// Static-mode boot validator. It preserves the existing parser-loaded scripts
// while making the intended grouped boot order machine-checkable.
(function validateKpiBootManifest(global) {
  const manifest = global.KPI_BOOT_MANIFEST;
  const normalizeSource = value => String(value || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
  const expected = Array.isArray(manifest?.groups)
    ? manifest.groups.flatMap(group => Array.isArray(group.scripts) ? group.scripts : []).map(normalizeSource)
    : [];
  const expectedOrder = new Map(expected.map((source, index) => [source, index]));
  const actual = Array.from(document.querySelectorAll('script[src]'))
    .map(script => normalizeSource(script.getAttribute('src')))
    .filter(source => source && !source.includes('KPI.boot.manifest.js') && !source.includes('KPI.boot.loader.js'));
  const actualSet = new Set(actual);
  const missing = expected.filter(source => !actualSet.has(source));
  const unexpected = actual.filter(source => !expectedOrder.has(source));
  const outOfOrder = [];
  let lastIndex = -1;
  for (const source of actual) {
    const index = expectedOrder.get(source);
    if (!Number.isInteger(index)) continue;
    if (index < lastIndex) {
      outOfOrder.push(source);
      continue;
    }
    lastIndex = index;
  }
  global.KPI_BOOT_VALIDATION = {
    ok: missing.length === 0 && unexpected.length === 0 && outOfOrder.length === 0,
    missing,
    unexpected,
    outOfOrder,
  };
})(this?.['global' + 'This'] || this);
