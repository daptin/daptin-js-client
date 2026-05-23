import {AxiosInstance, AxiosResponse} from "axios";
import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export type FeedFormat = "rss" | "atom" | "json";

export interface FeedPreview {
  contentType: string;
  body: any;
}

export class FeedManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
    this.axios = axiosInstance;
  }

  getRss(feedName: string): Promise<string> {
    return this.request(feedName, "rss").then(function (preview) {
      return preview.body;
    });
  }

  getAtom(feedName: string): Promise<string> {
    return this.request(feedName, "atom").then(function (preview) {
      return preview.body;
    });
  }

  getJson(feedName: string): Promise<unknown> {
    return this.request(feedName, "json").then(function (preview) {
      return preview.body;
    });
  }

  preview(feedName: string, format: FeedFormat): Promise<FeedPreview> {
    return this.request(feedName, format);
  }

  private request(feedName: string, format: FeedFormat): Promise<FeedPreview> {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.feedUrl(feedName, format),
        method: "GET",
        headers: that.authHeaders()
      }).then(function (response: AxiosResponse) {
        resolve({
          contentType: response.headers ? response.headers["content-type"] : "",
          body: response.data
        });
      }, reject);
    });
  }

  private feedUrl(feedName: string, format: FeedFormat) {
    return this.appConfig.getEndpoint() + "/feed/" + encodeURIComponent(feedName) + "." + format;
  }

  private authHeaders() {
    const token = this.tokenGetter.getToken();
    return token ? {"Authorization": "Bearer " + token} : {};
  }
}

export default FeedManager;
