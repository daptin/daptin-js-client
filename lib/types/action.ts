export type DaptinKnownActionResponseType =
  | "action.response"
  | "client.notify"
  | "client.redirect"
  | "client.file.download"
  | "client.store.set"
  | "client.cookie.set"
  | "client.header.set"
  | "oauth.client.redirect"
  | "render";

export type DaptinActionResponseType = DaptinKnownActionResponseType | (string & {});

export interface DaptinNotifyAttributes {
  type?: string;
  message?: string;
  title?: string;
  [key: string]: unknown;
}

export interface DaptinRedirectAttributes {
  location?: string;
  url?: string;
  delay?: number;
  [key: string]: unknown;
}

export interface DaptinFileDownloadAttributes {
  name?: string;
  content?: string;
  contentType?: string;
  type?: string;
  [key: string]: unknown;
}

export interface DaptinStoreSetAttributes {
  key?: string;
  value?: unknown;
  token?: string;
  [key: string]: unknown;
}

export interface DaptinCookieSetAttributes {
  name?: string;
  value?: string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  [key: string]: unknown;
}

export interface DaptinActionResponseItem<
  TAttributes = Record<string, unknown>,
  TResponseType extends DaptinActionResponseType = DaptinActionResponseType
> {
  ResponseType: TResponseType;
  Attributes: TAttributes;
  [key: string]: unknown;
}

export type DaptinActionResponse<TAttributes = Record<string, unknown>> =
  Array<DaptinActionResponseItem<TAttributes>>;

export interface DaptinActionRequest<TAttributes extends Record<string, unknown> = Record<string, unknown>> {
  Type?: string;
  Action?: string;
  Attributes: TAttributes;
  RawBodyBytes?: unknown;
  RawBodyString?: string;
}
