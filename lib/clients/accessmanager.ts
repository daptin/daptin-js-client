import {AxiosInstance, Method} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";
import type {
  DaptinJsonApiListResponse,
  DaptinJsonApiQueryParams,
  DaptinJsonApiResource,
  DaptinReferenceId
} from "../types/jsonapi";
import type {DaptinEntity} from "../types/entity";

export type DaptinPermissionScope = "guest" | "user" | "group";
export type DaptinPermissionAction = "peek" | "read" | "create" | "update" | "delete" | "execute" | "refer";
export type DaptinPermissionInput = number | string | null | undefined;

export const DaptinPermissionFlags = {
  GuestPeek: 1,
  GuestRead: 2,
  GuestCreate: 4,
  GuestUpdate: 8,
  GuestDelete: 16,
  GuestExecute: 32,
  GuestRefer: 64,
  UserPeek: 128,
  UserRead: 256,
  UserCreate: 512,
  UserUpdate: 1024,
  UserDelete: 2048,
  UserExecute: 4096,
  UserRefer: 8192,
  GroupPeek: 16384,
  GroupRead: 32768,
  GroupCreate: 65536,
  GroupUpdate: 131072,
  GroupDelete: 262144,
  GroupExecute: 524288,
  GroupRefer: 1048576
} as const;

export const DaptinPermissionSets = {
  GuestCrud: 95,
  UserCrud: 12160,
  GroupCrud: 1556480,
  Default: 561441,
  AllowAll: 2097151
} as const;

export const DaptinPermissionByScope: Record<DaptinPermissionScope, Record<DaptinPermissionAction, number>> = {
  guest: {
    peek: DaptinPermissionFlags.GuestPeek,
    read: DaptinPermissionFlags.GuestRead,
    create: DaptinPermissionFlags.GuestCreate,
    update: DaptinPermissionFlags.GuestUpdate,
    delete: DaptinPermissionFlags.GuestDelete,
    execute: DaptinPermissionFlags.GuestExecute,
    refer: DaptinPermissionFlags.GuestRefer
  },
  user: {
    peek: DaptinPermissionFlags.UserPeek,
    read: DaptinPermissionFlags.UserRead,
    create: DaptinPermissionFlags.UserCreate,
    update: DaptinPermissionFlags.UserUpdate,
    delete: DaptinPermissionFlags.UserDelete,
    execute: DaptinPermissionFlags.UserExecute,
    refer: DaptinPermissionFlags.UserRefer
  },
  group: {
    peek: DaptinPermissionFlags.GroupPeek,
    read: DaptinPermissionFlags.GroupRead,
    create: DaptinPermissionFlags.GroupCreate,
    update: DaptinPermissionFlags.GroupUpdate,
    delete: DaptinPermissionFlags.GroupDelete,
    execute: DaptinPermissionFlags.GroupExecute,
    refer: DaptinPermissionFlags.GroupRefer
  }
};

export interface DaptinPermissionGrant {
  scope: DaptinPermissionScope;
  action: DaptinPermissionAction;
  flag: number;
}

export type DaptinPermissionMatrix = Record<DaptinPermissionScope, Record<DaptinPermissionAction, boolean>>;

export type DaptinRelatedUsergroupAttributes<TGroupAttributes extends object = {name?: string}> =
  TGroupAttributes & Record<string, unknown> & {
  permission?: number | string | null;
  reference_id?: DaptinReferenceId;
  relation_reference_id?: DaptinReferenceId;
  relation_created_at?: string;
  relation_updated_at?: string;
};

export interface DaptinObjectUsergroupAccess<TGroupAttributes extends object = {name?: string}> {
  type: string;
  relationReferenceId: DaptinReferenceId;
  groupReferenceId: DaptinReferenceId;
  permission: number | null;
  relationCreatedAt?: string;
  relationUpdatedAt?: string;
  group: DaptinEntity<TGroupAttributes>;
  raw: DaptinJsonApiResource<DaptinRelatedUsergroupAttributes<TGroupAttributes>>;
}

export interface DaptinObjectUsergroupAccessResponse<TGroupAttributes extends object = {name?: string}> {
  data: Array<DaptinObjectUsergroupAccess<TGroupAttributes>>;
  raw: DaptinJsonApiListResponse<DaptinRelatedUsergroupAttributes<TGroupAttributes>>;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface DaptinObjectUsergroupUpdateOptions {
  params?: DaptinJsonApiQueryParams | {[key: string]: unknown};
}

const permissionScopes: DaptinPermissionScope[] = ["guest", "user", "group"];
const permissionActions: DaptinPermissionAction[] = ["peek", "read", "create", "update", "delete", "execute", "refer"];

export function permissionValue(value: DaptinPermissionInput): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function hasPermission(value: DaptinPermissionInput, flag: number): boolean {
  return (permissionValue(value) & flag) === flag;
}

export function addPermission(value: DaptinPermissionInput, flag: number): number {
  return permissionValue(value) | flag;
}

export function removePermission(value: DaptinPermissionInput, flag: number): number {
  return permissionValue(value) & ~flag;
}

export function decodePermission(value: DaptinPermissionInput): DaptinPermissionMatrix {
  return permissionScopes.reduce(function (matrix, scope) {
    matrix[scope] = permissionActions.reduce(function (actions, action) {
      actions[action] = hasPermission(value, DaptinPermissionByScope[scope][action]);
      return actions;
    }, {} as Record<DaptinPermissionAction, boolean>);
    return matrix;
  }, {} as DaptinPermissionMatrix);
}

export function summarizePermission(value: DaptinPermissionInput): DaptinPermissionGrant[] {
  const grants: DaptinPermissionGrant[] = [];
  permissionScopes.forEach(function (scope) {
    permissionActions.forEach(function (action) {
      const flag = DaptinPermissionByScope[scope][action];
      if (hasPermission(value, flag)) {
        grants.push({scope: scope, action: action, flag: flag});
      }
    });
  });
  return grants;
}

function objectUsergroupJoinEntityName(entity: string): string {
  return entity + "_" + entity + "_id_has_usergroup_usergroup_id";
}

export class AccessManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  hasPermission(value: DaptinPermissionInput, flag: number): boolean {
    return hasPermission(value, flag);
  }

  addPermission(value: DaptinPermissionInput, flag: number): number {
    return addPermission(value, flag);
  }

  removePermission(value: DaptinPermissionInput, flag: number): number {
    return removePermission(value, flag);
  }

  decodePermission(value: DaptinPermissionInput): DaptinPermissionMatrix {
    return decodePermission(value);
  }

  summarizePermission(value: DaptinPermissionInput): DaptinPermissionGrant[] {
    return summarizePermission(value);
  }

  fetchObjectUsergroups<TGroupAttributes extends object = {name?: string}>(
    entity: string,
    objectReferenceId: DaptinReferenceId,
    params?: DaptinJsonApiQueryParams | {[key: string]: unknown}
  ): Promise<DaptinObjectUsergroupAccessResponse<TGroupAttributes>> {
    return this.listObjectUsergroups<TGroupAttributes>(entity, objectReferenceId, params);
  }

  listObjectUsergroups<TGroupAttributes extends object = {name?: string}>(
    entity: string,
    objectReferenceId: DaptinReferenceId,
    params?: DaptinJsonApiQueryParams | {[key: string]: unknown}
  ): Promise<DaptinObjectUsergroupAccessResponse<TGroupAttributes>> {
    const that = this;
    return this.request("GET", this.objectUsergroupsUrl(entity, objectReferenceId), undefined, params).then(function (response) {
      return that.normalizeObjectUsergroupResponse<TGroupAttributes>(response);
    });
  }

  addObjectUsergroup(entity: string, objectReferenceId: DaptinReferenceId, groupReferenceId: DaptinReferenceId): Promise<any> {
    return this.patchObjectUsergroups(entity, objectReferenceId, [{type: "usergroup", id: groupReferenceId}]);
  }

  removeObjectUsergroup(entity: string, objectReferenceId: DaptinReferenceId, groupReferenceId: DaptinReferenceId): Promise<any> {
    return this.request("DELETE", this.objectUsergroupRelationshipsUrl(entity, objectReferenceId), {
      data: [{type: "usergroup", id: groupReferenceId}]
    });
  }

  updateObjectUsergroupPermission(
    entity: string,
    objectReferenceId: DaptinReferenceId,
    groupReferenceId: DaptinReferenceId,
    permission: number,
    options: DaptinObjectUsergroupUpdateOptions = {}
  ): Promise<any> {
    const params = options.params || {"page[size]": 1000};
    const that = this;
    return this.listObjectUsergroups(entity, objectReferenceId, params).then(function (response) {
      const relation = response.data.find(function (row) {
        return row.groupReferenceId === groupReferenceId;
      });
      if (!relation) {
        throw new Error("Usergroup relation not found for group [" + groupReferenceId + "] on [" + entity + "][" + objectReferenceId + "]");
      }
      return that.updateObjectUsergroupRelationPermission(entity, relation.relationReferenceId, permission);
    });
  }

  updateObjectUsergroupRelationPermission(
    entity: string,
    relationReferenceId: DaptinReferenceId,
    permission: number
  ): Promise<any> {
    const joinEntity = objectUsergroupJoinEntityName(entity);
    return this.request("PATCH", this.resourceUrl(joinEntity, relationReferenceId), {
      data: {
        type: joinEntity,
        id: relationReferenceId,
        attributes: {
          permission: permission
        }
      }
    });
  }

  private patchObjectUsergroups(entity: string, objectReferenceId: DaptinReferenceId, data: Array<{type: string; id: string}>): Promise<any> {
    return this.request("PATCH", this.resourceUrl(entity, objectReferenceId), {
      data: {
        type: entity,
        id: objectReferenceId,
        relationships: {
          usergroup_id: {
            data: data
          }
        }
      }
    });
  }

  private normalizeObjectUsergroupResponse<TGroupAttributes extends object>(
    raw: DaptinJsonApiListResponse<DaptinRelatedUsergroupAttributes<TGroupAttributes>>
  ): DaptinObjectUsergroupAccessResponse<TGroupAttributes> {
    const rows = Array.isArray(raw && raw.data) ? raw.data : [];
    return {
      data: rows.map((row) => this.normalizeObjectUsergroup<TGroupAttributes>(row as DaptinJsonApiResource<DaptinRelatedUsergroupAttributes<TGroupAttributes>>)),
      raw: raw,
      links: raw && raw.links,
      meta: raw && raw.meta
    };
  }

  private normalizeObjectUsergroup<TGroupAttributes extends object>(
    row: DaptinJsonApiResource<DaptinRelatedUsergroupAttributes<TGroupAttributes>>
  ): DaptinObjectUsergroupAccess<TGroupAttributes> {
    const attributes = row.attributes || {} as DaptinRelatedUsergroupAttributes<TGroupAttributes>;
    const relationReferenceId = (row.id || attributes.reference_id || "") as DaptinReferenceId;
    const groupReferenceId = (attributes.relation_reference_id || "") as DaptinReferenceId;
    const groupAttributes = {...attributes} as Record<string, unknown>;
    delete groupAttributes.permission;
    delete groupAttributes.relation_reference_id;
    delete groupAttributes.relation_created_at;
    delete groupAttributes.relation_updated_at;
    groupAttributes.reference_id = groupReferenceId;

    return {
      type: row.type || "usergroup",
      relationReferenceId: relationReferenceId,
      groupReferenceId: groupReferenceId,
      permission: attributes.permission === undefined || attributes.permission === null ? null : permissionValue(attributes.permission),
      relationCreatedAt: attributes.relation_created_at,
      relationUpdatedAt: attributes.relation_updated_at,
      group: {
        ...(groupAttributes as TGroupAttributes),
        id: groupReferenceId,
        reference_id: groupReferenceId,
        type: row.type || "usergroup"
      } as DaptinEntity<TGroupAttributes>,
      raw: row
    };
  }

  private resourceUrl(entity: string, referenceId: DaptinReferenceId) {
    return this.appConfig.endpoint + "/api/" + encodeURIComponent(entity) + "/" + encodeURIComponent(referenceId);
  }

  private objectUsergroupsUrl(entity: string, objectReferenceId: DaptinReferenceId) {
    return this.resourceUrl(entity, objectReferenceId) + "/usergroup_id";
  }

  private objectUsergroupRelationshipsUrl(entity: string, objectReferenceId: DaptinReferenceId) {
    return this.resourceUrl(entity, objectReferenceId) + "/relationships/usergroup_id";
  }

  private request(method: Method, url: string, data?: any, params?: {[key: string]: any}): Promise<any> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: url,
        method: method,
        headers: that.authHeaders(),
        params: params,
        data: data
      }).then(function (response) {
        resolve(response.data);
      }, function (error) {
        reject(error);
      });
    });
  }

  private authHeaders() {
    const token = this.tokenGetter.getToken();
    return token ? {"Authorization": "Bearer " + token} : {};
  }
}

export default AccessManager;
