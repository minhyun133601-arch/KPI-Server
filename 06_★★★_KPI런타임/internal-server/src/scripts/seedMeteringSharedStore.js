console.error(
  [
    '[kpi] seedMeteringSharedStore.js is retired.',
    '[kpi] Metering shared-store authority is DB-only now.',
    '[kpi] Use DB backup/restore or an explicit migration instead of JS preset files.'
  ].join('\n')
);

process.exitCode = 1;
