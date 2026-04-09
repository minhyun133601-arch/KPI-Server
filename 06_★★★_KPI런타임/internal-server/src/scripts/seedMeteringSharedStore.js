import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { config } from '../config.js';

const baseUrl = process.env.KPI_SERVER_BASE_URL || `http://${config.host}:${config.port}`;
const presetPath = path.join(
  config.repoRoot,
  '02_★★★★_유틸리티',
  'apps',
  'metering',
  'preset-entry-data.js'
);

function buildSummary(store) {
  return {
    equipmentItemCount: Array.isArray(store?.equipmentItems) ? store.equipmentItems.length : 0,
    electricMonthCount:
      store?.electricEntries && typeof store.electricEntries === 'object'
        ? Object.keys(store.electricEntries).length
        : 0,
    gasMonthCount:
      store?.gasEntries && typeof store.gasEntries === 'object'
        ? Object.keys(store.gasEntries).length
        : 0,
    billingDocumentCount:
      store?.billingDocuments && typeof store.billingDocuments === 'object'
        ? Object.keys(store.billingDocuments).length
        : 0
  };
}

async function loadPresetStore() {
  const source = await fs.readFile(presetPath, 'utf8');
  const sandbox = {
    window: {},
    console
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: presetPath,
    timeout: 5000
  });

  const store = sandbox.window.__LOCAL_APP_STORE__;
  if (!store || typeof store !== 'object') {
    throw new Error('preset_store_not_found');
  }

  return store;
}

async function putSharedStore(store) {
  const response = await fetch(`${baseUrl}/api/shared-store`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      store
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`shared_store_put_failed:${response.status}:${payload?.error || 'unknown'}`);
  }

  return payload;
}

async function getSharedStore() {
  const response = await fetch(`${baseUrl}/api/shared-store`, {
    method: 'GET'
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`shared_store_get_failed:${response.status}:${payload?.error || 'unknown'}`);
  }

  return payload;
}

async function main() {
  const store = await loadPresetStore();
  const writePayload = await putSharedStore(store);
  const readPayload = await getSharedStore();

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        presetPath,
        summary: buildSummary(readPayload.store),
        writeMeta: writePayload.meta,
        readMeta: readPayload.meta
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
