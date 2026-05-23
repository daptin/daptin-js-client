import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface StateMachineStartRequest {
  typeName: string;
  referenceId: string;
}

export interface StateMachineResponse {
  status: number;
  data: any;
  headers: any;
}

export class StateMachineManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  start(stateMachineId: string, request: StateMachineStartRequest): Promise<StateMachineResponse> {
    return this.request("/track/start/" + encodeURIComponent(stateMachineId), request);
  }

  event(typeName: string, objectStateId: string, eventName: string, attributes?: any): Promise<StateMachineResponse> {
    return this.request(
      "/track/event/" + encodeURIComponent(typeName) + "/" + encodeURIComponent(objectStateId) + "/" + encodeURIComponent(eventName),
      attributes || {}
    );
  }

  private request(path: string, data: any): Promise<StateMachineResponse> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + path,
        method: "POST",
        headers: that.headers(),
        data: data
      }).then(function (response: AxiosResponse) {
        resolve(that.toResponse(response));
      }, function (error) {
        if (error && error.response) {
          reject(that.toResponse(error.response));
          return;
        }
        reject(error);
      });
    });
  }

  private toResponse(response: AxiosResponse): StateMachineResponse {
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
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

export default StateMachineManager;
