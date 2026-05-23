import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface LiveCheckOptions {
  token?: string;
  timeoutMs?: number;
}

export interface LiveCheckResult {
  ok: boolean;
  detail: string;
}

export class RuntimeManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  ping(): Promise<string> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + "/ping",
        method: "GET"
      }).then(function (response: AxiosResponse) {
        resolve(response.data);
      }, reject);
    });
  }

  getStatistics(): Promise<any> {
    return this.getJson("/statistics");
  }

  getOpenApi(): Promise<string> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + "/openapi.yaml",
        method: "GET",
        headers: that.authHeaders()
      }).then(function (response: AxiosResponse) {
        resolve(response.data);
      }, reject);
    });
  }

  getOpenIdConfiguration(): Promise<any> {
    return this.getJson("/.well-known/openid-configuration");
  }

  checkLive(options: LiveCheckOptions = {}): Promise<LiveCheckResult> {
    const token = options.token || this.tokenGetter.getToken();
    const url = this.websocketUrl("/live", token);
    const timeoutMs = options.timeoutMs || 5000;

    if (typeof WebSocket === "undefined") {
      return Promise.resolve({
        ok: false,
        detail: "WebSocket is not available in this environment"
      });
    }

    return new Promise(function (resolve) {
      let settled = false;
      const socket = new WebSocket(url);
      const finish = function (result: LiveCheckResult) {
        if (settled) {
          return;
        }
        settled = true;
        try {
          socket.close();
        } catch (_) {
        }
        resolve(result);
      };

      const timer = setTimeout(function () {
        finish({ok: false, detail: "Timed out connecting to /live"});
      }, timeoutMs);

      socket.onopen = function () {
        clearTimeout(timer);
        finish({ok: true, detail: "Connected to /live"});
      };
      socket.onerror = function () {
        clearTimeout(timer);
        finish({ok: false, detail: "Failed to connect to /live"});
      };
      socket.onclose = function () {
        clearTimeout(timer);
        if (!settled) {
          finish({ok: false, detail: "Connection to /live closed before opening"});
        }
      };
    });
  }

  private getJson(path: string): Promise<any> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.getEndpoint() + path,
        method: "GET",
        headers: that.authHeaders()
      }).then(function (response: AxiosResponse) {
        resolve(response.data);
      }, reject);
    });
  }

  private authHeaders() {
    const token = this.tokenGetter.getToken();
    return token ? {"Authorization": "Bearer " + token} : {};
  }

  private websocketUrl(path: string, token?: string) {
    const endpoint = this.appConfig.getEndpoint().replace(/\/$/, "");
    const base = endpoint.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const query = token ? "?token=" + encodeURIComponent(token) : "";
    return base + path + query;
  }
}

export default RuntimeManager;
