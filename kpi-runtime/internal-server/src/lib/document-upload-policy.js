import path from 'node:path';

export const DOCUMENT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

const DOCUMENT_POLICY_OWNER_DOMAINS = new Set([
  'audit.legal_facility',
  'audit.lux.evidence',
  'data.equipment_history',
  'metering.billing_document',
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

function isPdfUploadType({ extension, mimeType }) {
  return extension === '.pdf' && mimeType === 'application/pdf';
}

function hasAllowedUploadType({ ownerDomain, fileCategory, extension, mimeType }) {
  if (isMeteringBillingDocumentUpload({ ownerDomain, fileCategory })) {
    return isPdfUploadType({ extension, mimeType });
  }
  if (isAuditLuxEvidenceUpload({ ownerDomain, fileCategory })) {
    return DOCUMENT_IMAGE_ALLOWED_EXTENSIONS.has(extension)
      || DOCUMENT_IMAGE_ALLOWED_MIME_TYPES.has(mimeType)
      || isPdfUploadType({ extension, mimeType });
  }
  if (isImageUploadCategory(fileCategory)) {
    return DOCUMENT_IMAGE_ALLOWED_EXTENSIONS.has(extension) || DOCUMENT_IMAGE_ALLOWED_MIME_TYPES.has(mimeType);
  }
  return DOCUMENT_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension) || DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES.has(mimeType);
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
