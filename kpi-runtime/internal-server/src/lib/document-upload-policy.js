import path from 'node:path';

export const DOCUMENT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

const DOCUMENT_POLICY_OWNER_DOMAINS = new Set([
  'audit.lux.evidence',
  'data.equipment_history',
  'metering.billing_document',
  'report.runtime',
  'work.history',
  'work.team_calendar'
]);
const DOCUMENT_IMAGE_ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp'
]);
const DOCUMENT_ATTACHMENT_ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.hwp',
  '.hwpx'
]);
const DOCUMENT_IMAGE_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp'
]);
const DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-hwp',
  'application/haansofthwp',
  'application/x-hwp+zip',
  'application/haansofthwpx'
]);
const DOCUMENT_WORK_HISTORY_OWNER_DOMAINS = new Set([
  'work.history',
  'work.team_calendar'
]);
const DOCUMENT_WORK_HISTORY_MACRO_POWERPOINT_EXTENSION = '.pptm';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeMimeType(value) {
  return normalizeText(value).toLowerCase();
}

export function getBase64ByteLength(base64Data) {
  const normalized = String(base64Data || '').replace(/\s+/g, '');
  const paddingLength = (normalized.match(/=+$/)?.[0] || '').length;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - paddingLength);
}

function isImageUploadCategory(fileCategory) {
  return /^(photo|image|images?)$/i.test(normalizeText(fileCategory));
}

function isAuditLuxEvidenceUpload({ ownerDomain, fileCategory }) {
  return ownerDomain === 'audit.lux.evidence' && /^evidence$/i.test(normalizeText(fileCategory));
}

function isMeteringBillingDocumentUpload({ ownerDomain, fileCategory }) {
  return ownerDomain === 'metering.billing_document' && normalizeText(fileCategory) === 'billing_document';
}

function isEquipmentHistoryUpload({ ownerDomain }) {
  return ownerDomain === 'data.equipment_history';
}

function isWorkHistoryUpload({ ownerDomain }) {
  return DOCUMENT_WORK_HISTORY_OWNER_DOMAINS.has(ownerDomain);
}

function isPdfUploadType({ extension, mimeType }) {
  return extension === '.pdf' && mimeType === 'application/pdf';
}

function isWorkHistoryMacroPowerPointUpload({ ownerDomain, extension }) {
  return isWorkHistoryUpload({ ownerDomain })
    && extension === DOCUMENT_WORK_HISTORY_MACRO_POWERPOINT_EXTENSION;
}

function hasAllowedImageUploadType({ extension, mimeType }) {
  return DOCUMENT_IMAGE_ALLOWED_EXTENSIONS.has(extension) || DOCUMENT_IMAGE_ALLOWED_MIME_TYPES.has(mimeType);
}

function hasAllowedAttachmentUploadType({ extension, mimeType }) {
  return DOCUMENT_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension) || DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES.has(mimeType);
}

function hasAllowedUploadType({ ownerDomain, fileCategory, extension, mimeType }) {
  if (isMeteringBillingDocumentUpload({ ownerDomain, fileCategory })) {
    return isPdfUploadType({ extension, mimeType });
  }
  if (isAuditLuxEvidenceUpload({ ownerDomain, fileCategory })) {
    return hasAllowedImageUploadType({ extension, mimeType })
      || isPdfUploadType({ extension, mimeType });
  }
  if (isImageUploadCategory(fileCategory)) {
    return hasAllowedImageUploadType({ extension, mimeType });
  }
  if (isEquipmentHistoryUpload({ ownerDomain })) {
    return hasAllowedAttachmentUploadType({ extension, mimeType })
      || hasAllowedImageUploadType({ extension, mimeType });
  }
  return hasAllowedAttachmentUploadType({ extension, mimeType })
    || isWorkHistoryMacroPowerPointUpload({ ownerDomain, extension, mimeType });
}

export function validateDocumentUploadPolicy({ ownerDomain, fileCategory, originalName, mimeType, base64Data }) {
  const normalizedOwnerDomain = normalizeText(ownerDomain);
  if (!DOCUMENT_POLICY_OWNER_DOMAINS.has(normalizedOwnerDomain)) {
    return;
  }

  const normalizedExt = path.extname(normalizeText(originalName)).toLowerCase();
  const normalizedMimeType = normalizeMimeType(mimeType);
  if (!hasAllowedUploadType({
    ownerDomain: normalizedOwnerDomain,
    fileCategory,
    extension: normalizedExt,
    mimeType: normalizedMimeType
  })) {
    throw new Error('unsupported_type');
  }

  if (getBase64ByteLength(base64Data) > DOCUMENT_UPLOAD_MAX_BYTES) {
    throw new Error('file_too_large');
  }
}
