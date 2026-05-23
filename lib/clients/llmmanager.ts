import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export type OpenAIModelsResponse = any;
export type ChatCompletionRequest = any;
export type CompletionRequest = any;
export type EmbeddingRequest = any;

export interface LlmResponse<T = any> {
  status: number;
  data: T;
  headers: any;
}

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
    return this.requestData("GET", "/v1/models");
  }

  listModelsResponse(): Promise<LlmResponse<OpenAIModelsResponse>> {
    return this.request("GET", "/v1/models");
  }

  createChatCompletion(body: ChatCompletionRequest): Promise<any> {
    return this.requestData("POST", "/v1/chat/completions", body);
  }

  createChatCompletionResponse(body: ChatCompletionRequest): Promise<LlmResponse> {
    return this.request("POST", "/v1/chat/completions", body);
  }

  createCompletion(body: CompletionRequest): Promise<any> {
    return this.requestData("POST", "/v1/completions", body);
  }

  createCompletionResponse(body: CompletionRequest): Promise<LlmResponse> {
    return this.request("POST", "/v1/completions", body);
  }

  createEmbedding(body: EmbeddingRequest): Promise<any> {
    return this.requestData("POST", "/v1/embeddings", body);
  }

  createEmbeddingResponse(body: EmbeddingRequest): Promise<LlmResponse> {
    return this.request("POST", "/v1/embeddings", body);
  }

  private requestData(method: string, path: string, data?: any): Promise<any> {
    return this.request(method, path, data).then(function (response) {
      return response.data;
    });
  }

  private request(method: string, path: string, data?: any): Promise<LlmResponse> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + path,
        method: method as any,
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

  private toResponse(response: AxiosResponse): LlmResponse {
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

export default LlmManager;
