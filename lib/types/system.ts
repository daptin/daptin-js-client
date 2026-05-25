import type {DaptinEntity, DaptinFileListValue} from "./entity";

export type DaptinSystemEntityName =
  | "document"
  | "calendar"
  | "collection"
  | "credential"
  | "certificate"
  | "feed"
  | "integration"
  | "task"
  | "template"
  | "json_schema"
  | "timeline"
  | "world"
  | "stream"
  | "user_otp_account"
  | "user_account"
  | "usergroup"
  | "action"
  | "smd"
  | "oauth_connect"
  | "oauth_state"
  | "data_exchange"
  | "oauth_token"
  | "oauth_app"
  | "oauth_code"
  | "oauth_access"
  | "oauth_refresh"
  | "oauth_grant"
  | "oauth_key"
  | "cloud_store"
  | "llm_provider"
  | "llm_usage"
  | "api_plan"
  | "api_member"
  | "api_usage"
  | "api_quota"
  | "site"
  | "mail_server"
  | "mail_account"
  | "mail_box"
  | "mail"
  | "outbox";

export type DaptinDocumentEntity = DaptinEntity<{
  document_name?: string;
  document_path?: string;
  document_extension?: string;
  mime_type?: string;
  document_content?: DaptinFileListValue | string;
}>;

export type DaptinCalendarEntity = DaptinEntity<{rpath?: string; content?: DaptinFileListValue | string}>;
export type DaptinCollectionEntity = DaptinEntity<{name?: string; description?: string}>;
export type DaptinCredentialEntity = DaptinEntity<{name?: string; content?: string}>;
export type DaptinCertificateEntity = DaptinEntity<{
  hostname?: string;
  issuer?: string;
  generated_at?: string;
  certificate_pem?: string;
  root_certificate?: string;
  private_key_pem?: string;
  public_key_pem?: string;
}>;

export type DaptinFeedEntity = DaptinEntity<{
  feed_name?: string;
  title?: string;
  description?: string;
  link?: string;
  author_name?: string;
  author_email?: string;
  enable?: boolean;
  enable_atom?: boolean;
  enable_json?: boolean;
  enable_rss?: boolean;
  page_size?: number;
}>;

export type DaptinIntegrationEntity = DaptinEntity<{
  name?: string;
  specification_language?: string;
  specification_format?: string;
  specification?: string;
  authentication_type?: string;
  authentication_specification?: string;
  enable?: boolean;
}>;

export type DaptinTaskEntity = DaptinEntity<{
  name?: string;
  action_name?: string;
  entity_name?: string;
  schedule?: string;
  active?: boolean;
  attributes?: Record<string, unknown> | string;
  job_type?: string;
}>;

export type DaptinTemplateEntity = DaptinEntity<{
  name?: string;
  content?: string;
  action_config?: Record<string, unknown> | string;
  cache_config?: Record<string, unknown> | string;
  mime_type?: string;
  headers?: Record<string, unknown> | string;
  url_pattern?: Record<string, unknown> | string;
}>;

export type DaptinJsonSchemaEntity = DaptinEntity<{schema_name?: string; json_schema?: Record<string, unknown> | string}>;
export type DaptinTimelineEntity = DaptinEntity<{event_type?: string; title?: string; payload?: string}>;

export type DaptinWorldEntity = DaptinEntity<{
  table_name?: string;
  world_schema_json?: Record<string, unknown> | string;
  is_top_level?: boolean;
  is_hidden?: boolean;
  is_join_table?: boolean;
  is_state_tracking_enabled?: boolean;
  default_order?: string;
  icon?: string;
}>;

export type DaptinStreamEntity = DaptinEntity<{
  stream_name?: string;
  enable?: boolean;
  stream_contract?: Record<string, unknown> | string;
}>;

export type DaptinUserOtpAccountEntity = DaptinEntity<{
  mobile_number?: string;
  otp_secret?: string;
  verified?: boolean;
}>;

export type DaptinUserAccountEntity = DaptinEntity<{
  name?: string;
  email?: string;
  password?: string;
  confirmed?: boolean;
  auth_version?: number;
}>;

export type DaptinUsergroupEntity = DaptinEntity<{name?: string}>;

export type DaptinActionEntity = DaptinEntity<{
  action_name?: string;
  label?: string;
  instance_optional?: boolean;
  action_schema?: Record<string, unknown> | string;
}>;

export type DaptinSmdEntity = DaptinEntity<{
  name?: string;
  label?: string;
  initial_state?: string;
  events?: Record<string, unknown> | string;
}>;

export type DaptinOauthConnectEntity = DaptinEntity<{
  name?: string;
  client_id?: string;
  client_secret?: string;
  scope?: string;
  response_type?: string;
  redirect_uri?: string;
  auth_url?: string;
  token_url?: string;
  profile_url?: string;
  profile_email_path?: string;
  allow_login?: boolean;
  access_type_offline?: boolean;
  pkce_enabled?: boolean;
  pkce_challenge_method?: string;
}>;

export type DaptinOauthStateEntity = DaptinEntity<{
  state_hash?: string;
  code_verifier?: string;
  expires_at?: number;
  used_at?: number | null;
}>;

export type DaptinDataExchangeEntity = DaptinEntity<{
  name?: string;
  source_attributes?: Record<string, unknown> | string;
  source_type?: string;
  target_attributes?: Record<string, unknown> | string;
  attributes?: Record<string, unknown> | string;
  target_type?: string;
  options?: Record<string, unknown> | string;
}>;

export type DaptinOauthTokenEntity = DaptinEntity<{
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
}>;

export type DaptinOauthAppEntity = DaptinEntity<{
  name?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uris?: string;
  scopes?: string;
  grants?: string;
  is_confidential?: boolean;
  is_enabled?: boolean;
}>;

export type DaptinOauthCodeEntity = DaptinEntity<{
  code_hash?: string;
  redirect_uri?: string;
  scope?: string;
  expires_at?: number;
  used_at?: number | null;
  code_challenge?: string | null;
  code_challenge_method?: string | null;
  nonce?: string | null;
}>;

export type DaptinOauthAccessEntity = DaptinEntity<{
  token_hash?: string;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  revoked_at?: number | null;
}>;

export type DaptinOauthRefreshEntity = DaptinEntity<{
  token_hash?: string;
  scope?: string;
  expires_at?: number;
  revoked_at?: number | null;
}>;

export type DaptinOauthGrantEntity = DaptinEntity<{scope?: string; granted_at?: number; revoked_at?: number | null}>;
export type DaptinOauthKeyEntity = DaptinEntity<{
  key_id?: string;
  algorithm?: string;
  public_key?: string | null;
  private_key?: string | null;
  is_active?: boolean;
}>;

export type DaptinCloudStoreEntity = DaptinEntity<{
  name?: string;
  store_type?: string;
  store_provider?: string;
  root_path?: string;
  credential_name?: string;
  store_parameters?: Record<string, unknown> | string;
  credential_id?: string | null;
}>;

export type DaptinLlmProviderEntity = DaptinEntity<{
  name?: string;
  provider_type?: string;
  base_url?: string;
  models?: string;
  credential_name?: string;
  provider_parameters?: Record<string, unknown> | string;
  model_pricing?: Record<string, unknown> | string;
  enable?: boolean;
  credential_id?: string | null;
}>;

export type DaptinLlmUsageEntity = DaptinEntity<{
  provider_name?: string;
  model?: string;
  request_type?: string;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  reasoning_tokens?: number;
  total_tokens?: number;
  cost_micros?: number;
  duration_ms?: number;
  finish_reason?: string;
}>;

export type DaptinApiPlanEntity = DaptinEntity<{
  name?: string;
  requests_per_period?: number;
  compute_units_per_period?: number;
  rate_limit_per_minute?: number;
  price_monthly_cents?: number | null;
  overage_price_micros?: number | null;
  meter_type?: string;
  quota_enforce_mode?: string;
  metadata?: Record<string, unknown> | string | null;
}>;

export type DaptinApiMemberEntity = DaptinEntity<{
  status?: string;
  period_start?: string;
  period_end?: string | null;
  metadata?: Record<string, unknown> | string | null;
}>;

export type DaptinApiUsageEntity = DaptinEntity<{
  api_key_id?: string | null;
  endpoint?: string;
  method?: string;
  entity_type?: string | null;
  action_name?: string | null;
  request_type?: string | null;
  status_code?: number;
  latency_ms?: number;
  request_bytes?: number;
  response_bytes?: number;
  cost_units?: number;
  cost_micros?: number;
  meter_type?: string;
  metadata?: Record<string, unknown> | string | null;
  error_message?: string | null;
}>;

export type DaptinApiQuotaEntity = DaptinEntity<{
  period_start?: string;
  period_end?: string | null;
  request_count?: number;
  compute_units?: number;
  bytes_used?: number;
}>;

export type DaptinSiteEntity = DaptinEntity<{
  name?: string;
  hostname?: string;
  path?: string;
  enable?: boolean;
  ftp_enabled?: boolean;
  site_type?: string;
  cloud_store_id?: string | null;
}>;

export type DaptinMailServerEntity = DaptinEntity<{
  hostname?: string;
  is_enabled?: boolean;
  listen_interface?: string;
  max_size?: number;
  max_clients?: number;
  xclient_on?: boolean;
  always_on_tls?: boolean;
  authentication_required?: boolean;
}>;

export type DaptinMailAccountEntity = DaptinEntity<{username?: string; password?: string; password_md5?: string}>;

export type DaptinMailBoxEntity = DaptinEntity<{
  name?: string;
  subscribed?: boolean;
  uidvalidity?: number;
  nextuid?: number;
  attributes?: string;
  flags?: string;
  permanent_flags?: string;
}>;

export type DaptinMailEntity = DaptinEntity<{
  message_id?: string;
  mail_id?: string;
  from_address?: string;
  internal_date?: string;
  to_address?: string;
  reply_to_address?: string;
  sender_address?: string;
  subject?: string;
  body?: string;
  mail?: string;
  spam_score?: number;
  hash?: string;
  content_type?: string;
  recipient?: string;
  has_attachment?: boolean;
  ip_addr?: string;
  return_path?: string;
  is_tls?: boolean;
  seen?: boolean;
  recent?: boolean;
  deleted?: boolean;
  spam?: boolean;
  size?: number;
  flags?: string;
}>;

export type DaptinOutboxEntity = DaptinEntity<{
  from_address?: string;
  to_address?: string;
  to_host?: string;
  mail?: string;
  sent?: boolean;
  retry_count?: number;
  last_error?: string;
  next_retry_at?: string;
}>;

export interface DaptinSystemEntityMap {
  document: DaptinDocumentEntity;
  calendar: DaptinCalendarEntity;
  collection: DaptinCollectionEntity;
  credential: DaptinCredentialEntity;
  certificate: DaptinCertificateEntity;
  feed: DaptinFeedEntity;
  integration: DaptinIntegrationEntity;
  task: DaptinTaskEntity;
  template: DaptinTemplateEntity;
  json_schema: DaptinJsonSchemaEntity;
  timeline: DaptinTimelineEntity;
  world: DaptinWorldEntity;
  stream: DaptinStreamEntity;
  user_otp_account: DaptinUserOtpAccountEntity;
  user_account: DaptinUserAccountEntity;
  usergroup: DaptinUsergroupEntity;
  action: DaptinActionEntity;
  smd: DaptinSmdEntity;
  oauth_connect: DaptinOauthConnectEntity;
  oauth_state: DaptinOauthStateEntity;
  data_exchange: DaptinDataExchangeEntity;
  oauth_token: DaptinOauthTokenEntity;
  oauth_app: DaptinOauthAppEntity;
  oauth_code: DaptinOauthCodeEntity;
  oauth_access: DaptinOauthAccessEntity;
  oauth_refresh: DaptinOauthRefreshEntity;
  oauth_grant: DaptinOauthGrantEntity;
  oauth_key: DaptinOauthKeyEntity;
  cloud_store: DaptinCloudStoreEntity;
  llm_provider: DaptinLlmProviderEntity;
  llm_usage: DaptinLlmUsageEntity;
  api_plan: DaptinApiPlanEntity;
  api_member: DaptinApiMemberEntity;
  api_usage: DaptinApiUsageEntity;
  api_quota: DaptinApiQuotaEntity;
  site: DaptinSiteEntity;
  mail_server: DaptinMailServerEntity;
  mail_account: DaptinMailAccountEntity;
  mail_box: DaptinMailBoxEntity;
  mail: DaptinMailEntity;
  outbox: DaptinOutboxEntity;
}

export type DaptinSystemEntity<TName extends DaptinSystemEntityName> = DaptinSystemEntityMap[TName];
