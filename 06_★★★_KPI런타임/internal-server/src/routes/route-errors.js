const ERROR_STATUS_CODES = new Map([
  ['unauthorized', 401],
  ['forbidden', 403],
  ['invalid_credentials', 401],
  ['owner_already_exists', 409],
  ['body_too_large', 413],
  ['invalid_json', 400],
  ['permission_key_required', 400],
  ['username_and_password_required', 400],
  ['invalid_username_format', 400],
  ['month_value_required', 400],
  ['billing_document_resource_unsupported', 400],
  ['empty_file_payload', 400],
  ['not_found', 404]
]);

export function getRouteErrorStatusCode(error) {
  return ERROR_STATUS_CODES.get(error?.message) ?? 500;
}
