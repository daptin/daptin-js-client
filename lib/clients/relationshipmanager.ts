import {AxiosInstance, Method} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface RelationshipResourceIdentifier {
  type: string;
  id: string;
}

export interface RelationshipTargetOptions {
  type?: string;
}

export type RelationshipTarget = RelationshipResourceIdentifier | string | null;

export class RelationshipManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  fetch(entity: string, referenceId: string, relationKey: string, params?: {[key: string]: any}): Promise<any> {
    return this.request("GET", this.relationUrl(entity, referenceId, relationKey), undefined, params);
  }

  set(entity: string, referenceId: string, relationKey: string, target: RelationshipTarget, options: RelationshipTargetOptions = {}): Promise<any> {
    return this.patchRelationship(entity, referenceId, relationKey, this.toResourceIdentifier(target, options));
  }

  setMany(entity: string, referenceId: string, relationKey: string, targets: RelationshipTarget[], options: RelationshipTargetOptions = {}): Promise<any> {
    const relationshipData = targets.map((target) => this.toResourceIdentifier(target, options));
    return this.patchRelationship(entity, referenceId, relationKey, relationshipData);
  }

  clear(entity: string, referenceId: string, relationKey: string): Promise<any> {
    return this.patchRelationship(entity, referenceId, relationKey, null);
  }

  remove(entity: string, referenceId: string, relationKey: string, target: RelationshipTarget, options: RelationshipTargetOptions = {}): Promise<any> {
    const targetResource = this.toResourceIdentifier(target, options);
    if (!targetResource) {
      throw new Error("Relationship target is required for remove");
    }
    return this.request("DELETE", this.relationshipsUrl(entity, referenceId, relationKey), {
      data: [targetResource]
    });
  }

  private patchRelationship(entity: string, referenceId: string, relationKey: string, relationshipData: any): Promise<any> {
    return this.request("PATCH", this.resourceUrl(entity, referenceId), {
      data: {
        type: entity,
        id: referenceId,
        relationships: {
          [relationKey]: {
            data: relationshipData
          }
        }
      }
    });
  }

  private toResourceIdentifier(target: RelationshipTarget, options: RelationshipTargetOptions): RelationshipResourceIdentifier | null {
    if (target === null) {
      return null;
    }
    if (typeof target === "string") {
      if (!options.type) {
        throw new Error("Relationship target type is required when target is a string id");
      }
      return {
        type: options.type,
        id: target
      };
    }
    if (!target.type || !target.id) {
      throw new Error("Relationship target must include type and id");
    }
    return target;
  }

  private resourceUrl(entity: string, referenceId: string) {
    return this.appConfig.endpoint + "/api/" + encodeURIComponent(entity) + "/" + encodeURIComponent(referenceId);
  }

  private relationUrl(entity: string, referenceId: string, relationKey: string) {
    return this.resourceUrl(entity, referenceId) + "/" + encodeURIComponent(relationKey);
  }

  private relationshipsUrl(entity: string, referenceId: string, relationKey: string) {
    return this.resourceUrl(entity, referenceId) + "/relationships/" + encodeURIComponent(relationKey);
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

export default RelationshipManager;
