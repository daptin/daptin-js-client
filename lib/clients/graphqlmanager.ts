import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface GraphqlRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export class GraphqlManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  execute(request: GraphqlRequest | string, variables?: Record<string, any>, operationName?: string): Promise<any> {
    const body = typeof request === "string" ? {
      query: request,
      variables: variables,
      operationName: operationName
    } : request;
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + "/graphql",
        method: "POST",
        headers: that.headers(),
        data: body
      }).then(function (response: AxiosResponse) {
        resolve(response.data);
      }, reject);
    });
  }

  private headers() {
    const headers = {
      "Content-Type": "application/json"
    };
    const token = this.tokenGetter.getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }
}

export default GraphqlManager;
