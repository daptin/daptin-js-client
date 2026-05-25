import type {DaptinReferenceId} from "./jsonapi";

export type DaptinPermissionValue = number | string | Record<string, unknown> | null;

export interface DaptinEntityBase {
  id?: number | string | null;
  reference_id?: DaptinReferenceId | null;
  version?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  permission?: DaptinPermissionValue;
  user_account_id?: DaptinReferenceId | DaptinReferenceId[] | null;
  usergroup_id?: DaptinReferenceId | DaptinReferenceId[] | null;
  type?: string | null;
  __type?: string | null;
}

export type DaptinEntity<TAttributes extends object = Record<string, unknown>> =
  DaptinEntityBase & TAttributes;

export interface DaptinFileValue {
  name?: string;
  path?: string;
  type?: string;
  size?: number;
  content?: string;
  file?: string;
  url?: string;
  [key: string]: unknown;
}

export interface DaptinStoredFile extends DaptinFileValue {
  name: string;
  path: string;
}

export type DaptinFileListValue = DaptinFileValue[];

export interface DaptinRelationMetadata {
  relation_reference_id?: DaptinReferenceId;
  relation_created_at?: string;
  relation_updated_at?: string;
}
