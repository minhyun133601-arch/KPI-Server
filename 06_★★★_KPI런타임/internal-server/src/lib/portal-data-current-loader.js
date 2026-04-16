import fs from 'node:fs/promises';
import vm from 'node:vm';

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function loadCurrentPortalDataWindow(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  const context = {
    console,
    window: { PortalData: {} }
  };
  context.globalThis = context;
  context.self = context.window;

  vm.createContext(context);
  vm.runInContext(source, context, { filename: filePath });

  return context.window;
}

export function extractCurrentPortalDataPayload(loadedWindow, record) {
  const sourceRoot = String(record?.sourceRoot || 'PortalData');
  const sourceBag = loadedWindow?.[sourceRoot];
  if (!sourceBag || typeof sourceBag !== 'object') {
    throw new Error(`source_root_missing:${record?.recordKey || 'unknown'}`);
  }

  if (Array.isArray(record?.sourceKeys) && record.sourceKeys.length) {
    const payload = {};
    for (const key of record.sourceKeys) {
      if (sourceBag[key] === undefined) {
        throw new Error(`source_key_missing:${record?.recordKey || 'unknown'}:${key}`);
      }
      payload[key] = cloneJson(sourceBag[key]);
    }
    return payload;
  }

  const sourceKey = String(record?.sourceKey || record?.recordKey || '').trim();
  if (!sourceKey) {
    throw new Error(`source_key_missing:${record?.recordKey || 'unknown'}`);
  }
  if (sourceBag[sourceKey] === undefined) {
    throw new Error(`source_key_missing:${record?.recordKey || 'unknown'}:${sourceKey}`);
  }

  return cloneJson(sourceBag[sourceKey]);
}

export async function loadCurrentPortalDataRecord(record) {
  if (!record?.filePath) {
    throw new Error(`file_path_missing:${record?.recordKey || 'unknown'}`);
  }
  const loadedWindow = await loadCurrentPortalDataWindow(record.filePath);
  return extractCurrentPortalDataPayload(loadedWindow, record);
}
