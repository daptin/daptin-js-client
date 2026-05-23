import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export type OpenAIModelsResponse = any;
export type ChatCompletionRequest = any;
export type CompletionRequest = any;
export type EmbeddingRequest = any;

export class LlmManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  listModels(): Promise<OpenAIModelsResponse> {
    return this.request("GET", "/v1/models");
  }

  createChatCompletion(body: ChatCompletionRequest): Promise<any> {
    return this.request("POST", "/v1/chat/completions", body);
  }

  createCompletion(body: CompletionRequest): Promise<any> {
    return this.request("POST", "/v1/completions", body);
  }

  createEmbedding(body: EmbeddingRequest): Promise<any> {
    return this.request("POST", "/v1/embeddings", body);
  }

  private request(method: string, path: string, data?: any): Promise<any> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + path,
        method: method as any,
        headers: that.headers(),
        data: data
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

export default LlmManager;
