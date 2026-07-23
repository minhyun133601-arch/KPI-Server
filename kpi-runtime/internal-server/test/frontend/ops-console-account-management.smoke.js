import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

function readRepoFile(...segments) {
  return readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('ops console can manage existing non-owner accounts without bulk promotion', async () => {
  const [
    commandRegistrySource,
    opsActionsSource,
    appSource,
    appConfigSource,
    indexHtml,
    userAccountManagementSource,
    manageUserScriptSource,
  ] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'command-registry.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'lib', 'ops-service.actions.mjs'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'app.config.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'index.html'),
    readRepoFile('kpi-runtime', 'internal-server', 'src', 'services', 'user-account-management.js'),
    readRepoFile('kpi-runtime', 'internal-server', 'src', 'scripts', 'manageUserAccount.js'),
  ]);

  assert.match(commandRegistrySource, /key: ["']account\.manageUser["']/);
  assert.match(commandRegistrySource, /optionsSource: ["']managedUsers["']/);
  assert.match(commandRegistrySource, /value: ["']viewer["'][\s\S]*value: ["']admin["'][\s\S]*value: ["']delete["']/);
  assert.doesNotMatch(commandRegistrySource, /key: ["']account\.deleteUser["']/);
  assert.doesNotMatch(commandRegistrySource, /account\.promoteViewersToAdmin/);
  assert.doesNotMatch(commandRegistrySource, /뷰어 전체 어드민 승격/);
  assert.doesNotMatch(commandRegistrySource, /name: ["']displayName["']/);

  assert.match(opsActionsSource, /function actionManageUser/);
  assert.match(opsActionsSource, /manageUserAccount\.js/);
  assert.match(opsActionsSource, /["']account\.manageUser["']: actionManageUser/);
  assert.doesNotMatch(opsActionsSource, /["']account\.deleteUser["']: actionDeleteUser/);
  assert.doesNotMatch(opsActionsSource, /actionPromoteViewersToAdmin|promoteViewerUsersToAdmin/);
  assert.equal([...opsActionsSource.matchAll(/--displayName=\$\{payload\.username \|\| ["']{2}\}/g)].length, 2);

  assert.match(appSource, /command\.kind === 'action' \? buildActionItem\(command\) : buildFormItem\(command\)/);
  assert.match(appSource, /function getManagedUserOptions/);
  assert.match(appSource, /!roles\.includes\('owner'\)/);
  assert.match(appSource, /optionsSource === 'managedUsers'/);
  assert.match(appSource, /overviewCache\.users = payload\.users \|\| \[\]/);
  assert.doesNotMatch(appSource, /user\.display_name/);
  assert.match(appSource, /colspan="4"/);
  assert.match(appConfigSource, /["']account\.manageUser["']: ["']적용["']/);
  assert.match(appConfigSource, /noManageableUsers/);
  assert.doesNotMatch(appConfigSource, /account\.promoteViewersToAdmin|Viewer accounts were promoted to admin/);
  assert.match(indexHtml, /\/app\.js\?v=20260520a/);
  assert.doesNotMatch(indexHtml, /displayNameHeader|표시 이름/);
  assert.match(indexHtml, /colspan="4"/);

  assert.match(userAccountManagementSource, /export async function manageUserAccount/);
  assert.match(userAccountManagementSource, /owner_manage_forbidden/);
  assert.match(userAccountManagementSource, /replaceUserRoles\(user\.id, roles\)/);
  assert.match(userAccountManagementSource, /deleteUserById\(user\.id\)/);
  assert.match(manageUserScriptSource, /services\/user-account-management\.js/);
  assert.match(manageUserScriptSource, /readArg\('operation'\)/);
});
