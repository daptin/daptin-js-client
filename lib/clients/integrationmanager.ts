import {AxiosInstance, Method} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface IntegrationOperation {
  [key: string]: any;
}

export interface IntegrationOperationDetail {
  [key: string]: any;
}

export interface IntegrationExecuteBody {
  input?: Record<string, unknown>;
  oauth_token_id?: string;
  credential_id?: string;
}

export class IntegrationManager {
  appConfig: AppConfig;
  getToken: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, getToken: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.getToken = getToken;
    this.axios = axiosInstance;
  }

  listOperations(providerName: string): Promise<IntegrationOperation[]> {
    return this.request("GET", this.integrationUrl(providerName, "operations"));
  }

  describeOperation(providerName: string, operationId: string): Promise<IntegrationOperationDetail> {
    return this.request("GET", this.integrationUrl(providerName, "operations/" + encodeURIComponent(operationId)));
  }

  getOpenApi(providerName: string): Promise<string> {
    return this.request("GET", this.integrationUrl(providerName, "openapi.yaml"));
  }

  execute(providerName: string, operationId: string, body: IntegrationExecuteBody = {}): Promise<unknown> {
    return this.request("POST", this.integrationUrl(providerName, encodeURIComponent(operationId)), body);
  }

  private integrationUrl(providerName: string, path: string) {
    return this.appConfig.endpoint + "/integration/" + encodeURIComponent(providerName) + "/" + path;
  }

  private request(method: Method, url: string, data?: any): Promise<any> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: url,
        method: method,
        headers: {
          "Authorization": "Bearer " + that.getToken.getToken()
        },
        data: data
      }).then(function (respo) {
        resolve(respo.data)
      }, function (rs) {
        reject(rs)
      })
    });
  }
}

export default IntegrationManager;
