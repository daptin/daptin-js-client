import type {DaptinPermissionValue} from "./entity";
import type {DaptinReferenceId} from "./jsonapi";

export type DaptinColumnType =
  | "id"
  | "alias"
  | "enum"
  | "date"
  | "time"
  | "day"
  | "month"
  | "year"
  | "minute"
  | "hour"
  | "datetime"
  | "email"
  | "namespace"
  | "name"
  | "encrypted"
  | "json"
  | "password"
  | "md5"
  | "bcrypt"
  | "md5-bcrypt"
  | "value"
  | "truefalse"
  | "timestamp"
  | "location"
  | "location.latitude"
  | "location.longitude"
  | "location.altitude"
  | "color"
  | "rating"
  | "measurement"
  | "float"
  | "label"
  | "hidden"
  | "content"
  | "html"
  | "markdown"
  | "file"
  | `file.${string}`
  | "image"
  | "gzip"
  | "video"
  | "url"
  | (string & {});

export interface DaptinForeignKeyData {
  DataSource?: string;
  Namespace?: string;
  KeyName?: string;
  TableName?: string;
  ColumnName?: string;
  [key: string]: unknown;
}

export interface DaptinColumnTag {
  ColumnName?: string;
  Name?: string;
  Type?: string;
  Value?: string;
  Tags?: string[];
  [key: string]: unknown;
}

export interface DaptinColumnDefinition {
  Name?: string;
  ColumnName: string;
  ColumnType?: DaptinColumnType;
  DataType?: string;
  ColumnDescription?: string;
  DefaultValue?: unknown;
  IsIndexed?: boolean;
  IsUnique?: boolean;
  IsForeignKey?: boolean;
  IsNullable?: boolean;
  IsHidden?: boolean;
  ExcludeFromApi?: boolean;
  ForeignKeyData?: DaptinForeignKeyData;
  ForeignKey?: unknown;
  Permission?: DaptinPermissionValue;
  Validations?: DaptinColumnTag[];
  Conformations?: DaptinColumnTag[];
  [key: string]: unknown;
}

export type DaptinRelationType =
  | "belongs_to"
  | "has_one"
  | "has_many"
  | "has_many_and_belongs_to_many"
  | (string & {});

export interface DaptinTableRelation {
  Subject?: string;
  Object?: string;
  Relation?: DaptinRelationType;
  SubjectName?: string;
  ObjectName?: string;
  OnDelete?: string;
  [key: string]: unknown;
}

export interface DaptinDefaultGroupBinding {
  Name: string;
  Permission?: DaptinPermissionValue;
}

export type DaptinDefaultGroup = string | DaptinDefaultGroupBinding;

export interface DaptinMeteringConfig {
  enabled?: boolean;
  cost_expr?: string;
  meter_type?: string;
  post_metering_action?: string;
  enforce_mode?: string;
  on_actions?: Record<string, DaptinMeteringConfig>;
  Enabled?: boolean;
  CostExpr?: string;
  MeterType?: string;
  PostMeteringAction?: string;
  EnforceMode?: string;
  OnActions?: Record<string, DaptinMeteringConfig>;
}

export interface DaptinStateMachineDefinition {
  Name?: string;
  Label?: string;
  InitialState?: string;
  States?: unknown[];
  Events?: unknown[];
  [key: string]: unknown;
}

export interface DaptinOutcome {
  Type?: string;
  Method?: "GET" | "PUT" | "POST" | "DELETE" | "UPDATE" | "PATCH" | "EXECUTE" | "INTEGRATION" | (string & {});
  Reference?: string;
  LogToConsole?: boolean;
  SkipInResponse?: boolean;
  Condition?: string;
  Attributes?: Record<string, unknown>;
  ContinueOnError?: boolean;
  [key: string]: unknown;
}

export interface DaptinActionDefinition {
  Name: string;
  Label?: string;
  OnType?: string;
  InstanceOptional?: boolean;
  RequestSubjectRelations?: string[];
  ReferenceId?: DaptinReferenceId;
  Permission?: DaptinPermissionValue;
  InFields?: DaptinColumnDefinition[];
  OutFields?: DaptinOutcome[];
  Validations?: DaptinColumnTag[];
  Conformations?: DaptinColumnTag[];
  [key: string]: unknown;
}

export interface DaptinTableInfo {
  TableName: string;
  TableId?: number;
  TableDescription?: string;
  DefaultPermission?: DaptinPermissionValue;
  Columns?: DaptinColumnDefinition[];
  StateMachines?: DaptinStateMachineDefinition[];
  Relations?: DaptinTableRelation[];
  IsTopLevel?: boolean;
  Permission?: DaptinPermissionValue;
  UserId?: number;
  IsHidden?: boolean;
  IsJoinTable?: boolean;
  IsStateTrackingEnabled?: boolean;
  IsAuditEnabled?: boolean;
  TranslationsEnabled?: boolean;
  DefaultGroups?: DaptinDefaultGroup[];
  DefaultRelations?: Record<string, string[]>;
  Validations?: DaptinColumnTag[];
  Conformations?: DaptinColumnTag[];
  DefaultOrder?: string;
  Icon?: string;
  CompositeKeys?: string[][];
  Metering?: DaptinMeteringConfig;
  [key: string]: unknown;
}

export interface DaptinWorldSchema {
  Tables?: DaptinTableInfo[];
  Relations?: DaptinTableRelation[];
  Actions?: DaptinActionDefinition[];
  [key: string]: unknown;
}

export interface DaptinWorld {
  TableName?: string;
  table_name?: string;
  TableDescription?: string;
  table_description?: string;
  Tables?: DaptinTableInfo[];
  Relations?: DaptinTableRelation[];
  Actions?: DaptinActionDefinition[];
  [key: string]: unknown;
}

export interface DaptinColumnModelEntry extends DaptinColumnDefinition {
  jsonApi?: unknown;
}

export interface DaptinModelDefinition {
  TableName?: string;
  ColumnModel: Record<string, DaptinColumnModelEntry>;
  Columns?: DaptinColumnDefinition[];
  Relations?: DaptinTableRelation[];
  Actions: DaptinActionDefinition[];
  StateMachines: DaptinStateMachineDefinition[];
  IsStateMachineEnabled: boolean;
  [key: string]: unknown;
}

export interface DaptinColumnTypeDefinition {
  Name?: DaptinColumnType;
  Label?: string;
  Description?: string;
  DataType?: string;
  [key: string]: unknown;
}
