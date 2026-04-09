create index if not exists idx_app_sessions_user_id
  on app_sessions(user_id);

create index if not exists idx_app_sessions_expires_at
  on app_sessions(expires_at);

create index if not exists idx_app_sessions_last_seen_at
  on app_sessions(last_seen_at);

create index if not exists idx_app_audit_log_actor_user_id
  on app_audit_log(actor_user_id);

create index if not exists idx_app_audit_log_created_at
  on app_audit_log(created_at desc);

create index if not exists idx_app_user_sheet_permissions_expires_at
  on app_user_sheet_permissions(expires_at);

create index if not exists idx_app_documents_uploaded_by_user_id
  on app_documents(uploaded_by_user_id);
