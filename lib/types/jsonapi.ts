import type {DaptinEntity} from "./entity";

export type DaptinReferenceId = string;

export type DaptinJsonPrimitive = string | number | boolean | null;

export type DaptinJsonValue =
  | DaptinJsonPrimitive
  | DaptinJsonValue[]
  | {[key: string]: DaptinJsonValue};

export interface DaptinJsonApiResourceIdentifier {
  type: string;
  id: DaptinReferenceId;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiRelationship {
  data?: DaptinJsonApiResourceIdentifier | DaptinJsonApiResourceIdentifier[] | null;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiResource<
  TAttributes extends object = Record<string, unknown>,
  TRelationships extends Record<string, DaptinJsonApiRelationship> = Record<string, DaptinJsonApiRelationship>
> {
  id?: DaptinReferenceId;
  type?: string;
  attributes?: TAttributes;
  relationships?: TRelationships;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiListResponse<
  TAttributes extends object = Record<string, unknown>,
  TRelationships extends Record<string, DaptinJsonApiRelationship> = Record<string, DaptinJsonApiRelationship>
> {
  data: Array<DaptinJsonApiResource<TAttributes, TRelationships> | DaptinEntity<TAttributes>>;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiSingleResponse<
  TAttributes extends object = Record<string, unknown>,
  TRelationships extends Record<string, DaptinJsonApiRelationship> = Record<string, DaptinJsonApiRelationship>
> {
  data: DaptinJsonApiResource<TAttributes, TRelationships> | DaptinEntity<TAttributes> | null;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinJsonApiErrorResponse {
  errors: DaptinJsonApiError[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export type DaptinQueryOperator =
  | "is"
  | "is not"
  | "eq"
  | "neq"
  | "contains"
  | "like"
  | "ilike"
  | "in"
  | "before"
  | "after"
  | "more than"
  | "less than"
  | "any of"
  | "none of"
  | "is empty"
  | "is true"
  | "is false"
  | "fuzzy"
  | (string & {});

export interface DaptinQueryFilter<TColumn extends string = string> {
  column: TColumn;
  operator: DaptinQueryOperator;
  value?: unknown;
}

export interface DaptinJsonApiQueryParams<TColumn extends string = string> {
  query?: DaptinQueryFilter<TColumn>[] | string;
  include?: string | string[];
  sort?: string;
  page?: {
    number?: number;
    size?: number;
  };
  [key: string]: unknown;
}

export interface DaptinJsonApiClientLike {
  headers?: Record<string, string>;
  axios?: unknown;
  define(typeName: string, model: Record<string, unknown>): unknown;
  findAll<TAttributes extends object = Record<string, unknown>>(
    typeName: string,
    params?: DaptinJsonApiQueryParams
  ): Promise<DaptinJsonApiListResponse<TAttributes>>;
  find<TAttributes extends object = Record<string, unknown>>(
    typeName: string,
    id: DaptinReferenceId,
    params?: DaptinJsonApiQueryParams
  ): Promise<DaptinJsonApiSingleResponse<TAttributes>>;
  create?<TAttributes extends object = Record<string, unknown>>(
    typeName: string,
    payload: TAttributes
  ): Promise<DaptinJsonApiSingleResponse<TAttributes>>;
  update?<TAttributes extends object = Record<string, unknown>>(
    typeName: string,
    id: DaptinReferenceId,
    payload: Partial<TAttributes>
  ): Promise<DaptinJsonApiSingleResponse<TAttributes>>;
  destroy?(typeName: string, id: DaptinReferenceId): Promise<unknown>;
  insertMiddlewareBefore?(target: string, middleware: Record<string, unknown>): unknown;
}
