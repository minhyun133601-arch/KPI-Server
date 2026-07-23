import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const loginAccessPath = path.join(repoRoot, 'commands', 'ops-console-app', 'ops-console', 'lib', 'login-access.mjs');

async function readRepoFile(...segments) {
  const target = path.join(repoRoot, ...segments);
  const { readFile } = await import('node:fs/promises');
  return readFile(target, 'utf8');
}

async function loadLoginAccessModule() {
  const module = await import(`${pathToFileURL(loginAccessPath).href}?t=${Date.now()}`);
  return module;
}

function normalizeLoginAccessState(state) {
  if (typeof state === 'string') {
    const normalized = state.trim().toLowerCase();
    assert.ok(
      ['enabled', 'disabled', 'inconsistent'].includes(normalized),
      `Unexpected login-access state string "${state}"`
    );
    return normalized;
  }

  assert.equal(typeof state === 'object' && state !== null, true, 'login access state must be a string or object');
  if (typeof state.state === 'string') {
    const normalized = state.state.trim().toLowerCase();
    assert.ok(
      ['enabled', 'disabled', 'inconsistent'].includes(normalized),
      `Unexpected login-access state "${state.state}"`
    );
    return normalized;
  }

  if (typeof state.kpiAuthEnabled === 'boolean' && typeof state.kpiLoginEnabled === 'boolean') {
    const authEnabled = state.kpiAuthEnabled;
    const loginEnabled = state.kpiLoginEnabled;
    if (authEnabled && loginEnabled) {
      return 'enabled';
    }
    if (!authEnabled && !loginEnabled) {
      return 'disabled';
    }
    return 'inconsistent';
  }

  if (typeof state.kpiAuthEnabled === 'string' && typeof state.kpiLoginEnabled === 'string') {
    const authEnabled = state.kpiAuthEnabled === 'true';
    const loginEnabled = state.kpiLoginEnabled === 'true';
    if (authEnabled && loginEnabled) {
      return 'enabled';
    }
    if (!authEnabled && !loginEnabled) {
      return 'disabled';
    }
    return 'inconsistent';
  }

  if (typeof state.enabled === 'boolean') {
    return state.enabled ? 'enabled' : 'disabled';
  }

  if (state.loginAccess === 'enabled' || state.loginAccess === 'disabled' || state.loginAccess === 'inconsistent') {
    return state.loginAccess;
  }

  assert.fail('login access state object shape is not recognized');
}

const [commandRegistrySource, opsActionsSource, opsOverviewSource, appSource, appConfigSource, authRoutesSource] =
  await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'command-registry.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'ops-service.actions.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'ops-service.overview.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.config.js'),
    readRepoFile('kpi-runtime', 'internal-server', 'src', 'routes', 'auth-routes.js'),
  ]);

test('ops console login control module enforces dual-flag state and preserves env content', async () => {
  const { readLoginAccessState, writeLoginAccessState } = await loadLoginAccessModule();

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ops-login-access-'));

  const mixedEnvPath = path.join(workDir, 'mixed.env');
  await fs.writeFile(
    mixedEnvPath,
    [
      '# ops console login control fixture',
      'KPI_AUTH_ENABLED=true',
      'KPI_OTHER=keep',
      'KPI_LOGIN_ENABLED=false',
      '# end',
      '',
    ].join('\n'),
    'utf8'
  );

  const mixedEnable = await readLoginAccessState(mixedEnvPath);
  assert.equal(normalizeLoginAccessState(mixedEnable), 'inconsistent');

  await writeLoginAccessState(mixedEnvPath, true);
  const mixedAfterEnable = await fs.readFile(mixedEnvPath, 'utf8');
  assert.match(mixedAfterEnable, /KPI_AUTH_ENABLED=true/);
  assert.match(mixedAfterEnable, /KPI_LOGIN_ENABLED=true/);
  assert.match(mixedAfterEnable, /KPI_OTHER=keep/);
  assert.match(mixedAfterEnable, /# ops console login control fixture/);
  assert.match(mixedAfterEnable, /# end/);
  assert.equal(normalizeLoginAccessState(await readLoginAccessState(mixedEnvPath)), 'enabled');

  await writeLoginAccessState(mixedEnvPath, false);
  const mixedAfterDisable = await fs.readFile(mixedEnvPath, 'utf8');
  assert.match(mixedAfterDisable, /KPI_AUTH_ENABLED=false/);
  assert.match(mixedAfterDisable, /KPI_LOGIN_ENABLED=false/);
  assert.match(mixedAfterDisable, /KPI_OTHER=keep/);
  assert.equal(normalizeLoginAccessState(await readLoginAccessState(mixedEnvPath)), 'disabled');

  const emptyEnvPath = path.join(workDir, 'empty.env');
  await fs.writeFile(
    emptyEnvPath,
    ['# no login flags yet', 'KPI_OTHER=kept', 'APP_PORT=3100', '# tail comment', ''].join('\n'),
    'utf8'
  );
  await writeLoginAccessState(emptyEnvPath, true);
  const emptyAfterWrite = await fs.readFile(emptyEnvPath, 'utf8');
  assert.match(emptyAfterWrite, /KPI_AUTH_ENABLED=true/);
  assert.match(emptyAfterWrite, /KPI_LOGIN_ENABLED=true/);
  assert.match(emptyAfterWrite, /KPI_OTHER=kept/);
  assert.match(emptyAfterWrite, /APP_PORT=3100/);
  assert.match(emptyAfterWrite, /# no login flags yet/);
  assert.match(emptyAfterWrite, /# tail comment/);
});

test('ops console login control command registry, action, overview, and app config contracts', () => {
  assert.match(commandRegistrySource, /"account\.enableLogin"/);
  assert.match(commandRegistrySource, /"account\.disableLogin"/);
  assert.match(commandRegistrySource, /category:\s*["']account["']/);
  assert.match(commandRegistrySource, /kind:\s*["']action["']/);

  assert.match(opsActionsSource, /"account\.enableLogin"/);
  assert.match(opsActionsSource, /"account\.disableLogin"/);
  assert.match(opsActionsSource, /runAction|actionHandlers/);
  assert.match(opsActionsSource, /readLoginAccessState|writeLoginAccessState/);
  assert.match(opsActionsSource, /owner/i);
  assert.match(opsActionsSource, /rollback|rollbacked|restore|restore.*flag|rollback.*state/i);
  assert.match(opsActionsSource, /exclusiveServerControlActive/);
  assert.match(opsActionsSource, /OPEN_WITHOUT_LOGIN/);
  assert.match(opsActionsSource, /disable_login_confirmation_required/);
  assert.match(opsActionsSource, /owner_check_requires_running_database/);
  assert.match(opsActionsSource, /rootResponse/);
  assert.match(opsActionsSource, /adminUsersResponse/);
  assert.match(opsActionsSource, /loginEndpointResponse/);

  assert.match(opsOverviewSource, /loginAccess/);
  assert.match(appSource, /loginAccess/);
  assert.match(appSource, /account\.enableLogin|account\.disableLogin/);
  assert.match(appSource, /OPEN_WITHOUT_LOGIN/);
  assert.match(appSource, /portOpen/);
  assert.match(appSource, /portInconsistent/);
  assert.match(appSource, /renderCommands/);

  assert.match(appConfigSource, /account\.enableLogin/);
  assert.match(appConfigSource, /account\.disableLogin/);
  assert.match(appConfigSource, /without authentication/i);
  assert.match(appConfigSource, /login protection off/i);
  assert.match(appConfigSource, /login settings inconsistent/i);
  assert.match(appConfigSource, /description|confirmMessages/);

  assert.match(authRoutesSource, /return config\.authEnabled && config\.loginEnabled/);
  assert.match(authRoutesSource, /error:\s*["']login_disabled["']/);
  assert.match(authRoutesSource, /sendJson\(res,\s*403/);
});
