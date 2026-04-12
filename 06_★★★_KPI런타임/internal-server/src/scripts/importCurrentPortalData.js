console.error(
  [
    '[kpi] importCurrentPortalData.js is retired.',
    '[kpi] Portal data authority is DB-only now.',
    '[kpi] Use DB backup/restore or migrations instead of importing JS data files.'
  ].join('\n')
);

process.exitCode = 1;
