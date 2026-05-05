((root) => {
  root.KPI_REPOSITORY_MAP_STATIC_TREE = [
    {
      path: 'KPI.html',
      role: 'Static dashboard entry',
    },
    {
      path: 'kpi-runtime/',
      role: 'Dashboard shell, section registry, and optional Node runtime',
      children: [
        { path: 'app/', role: 'Browser shell, boot manifest, navigation, viewer, auth, and owner popup launch' },
        { path: 'sections/', role: 'Dashboard section builders and registry' },
        { path: 'internal-server/', role: 'KPI Runtime API, services, repositories, migrations, and tests' },
        { path: 'demo/', role: 'Synthetic static fixture data' },
      ],
    },
    {
      path: 'commands/ops-console-app/',
      role: 'Local owner console and documentation screens',
      children: [
        { path: 'ops-console/public/index.html', role: 'Owner console tab shell' },
        { path: 'ops-console/public/repository-map.html', role: 'Repository tab: folder structure and daily patch history' },
        { path: 'ops-console/public/repository-map-data.js', role: 'Repository tab static tree and monthly history manifest' },
        { path: 'ops-console/public/repository-map-history/', role: 'Monthly Repository Map patch history files' },
        { path: 'ops-console/public/data-reference-map.html', role: 'Data Path tab: database/storage contracts and developer data flow' },
        { path: 'ops-console/public/data-reference-map.css', role: 'Data Path tab style manifest and split CSS' },
        { path: 'ops-console/public/data-reference-map.content.js', role: 'Data Path tab public content catalog' },
        { path: 'ops-console/public/data-reference-map.js', role: 'Data Path tab rendering and interactions' },
      ],
    },
    {
      path: 'utility/',
      role: 'Utility screens and reusable operations helpers',
      children: [
        { path: 'apps/metering/', role: 'Metering UI, billing document preview, settlement, and shared-store sync' },
        { path: 'apps/production-extractor/', role: 'Synthetic production import/export helper' },
        { path: 'runtime/util/', role: 'Utility dashboard runtime, report, energy, production, and maintenance modules' },
      ],
    },
    {
      path: 'team-report/',
      role: 'Work reporting surfaces',
      children: [
        { path: 'runtime/work/', role: 'Work log, team calendar, production draft/history, print, and report renderers' },
        { path: 'runtime/work/history/', role: 'Work-history storage, layout, render, action, and attachment modules' },
      ],
    },
    {
      path: 'audit/',
      role: 'Audit screens and audit runtime modules',
    },
    {
      path: 'data-entry/',
      role: 'Manual data-entry screens and equipment-history cards',
    },
    {
      path: 'shared-assets/',
      role: 'Public-safe generic assets only',
    },
    {
      path: 'AGENTS.md',
      role: 'Repository execution contract and public-safety boundary',
    },
  ];

  root.KPI_REPOSITORY_MAP_HISTORY_FILES = [
    '/repository-map-history/2026-05.js',
    '/repository-map-history/2026-04.js',
  ];
})(this);
