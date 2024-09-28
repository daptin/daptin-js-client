import {AxiosInstance} from "axios"
import {TokenGetter} from "./interface";
import AppConfig from "./appconfig";

export class ConfigManager {
  appConfig: AppConfig;
  getToken: TokenGetter;
  private axios: AxiosInstance;

  constructor(appConfig: AppConfig, getToken: TokenGetter, axiosInstance: AxiosInstance) {
    this.appConfig = appConfig;
    this.getToken = getToken;
    this.axios = axiosInstance;
  }

  getConfig(configName: string, configType: string) {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.endpoint + "/_config/" + configType + "/" + configName,
        headers: {
          "Authorization": "Bearer " + that.getToken.getToken()
        },
        method: "GET"
      }).then(function (respo) {
        resolve(respo.data)
      }, function (rs) {
        console.log("config fetch response", arguments);
        reject(rs)
      })
    });
  }


  getAllConfig() {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.endpoint + "/_config",
        headers: {
          "Authorization": "Bearer " + that.getToken.getToken()
        },
        method: "GET"
      }).then(function (respo) {
        resolve(respo.data)
      }, function (rs) {
        console.log("config fetch response", arguments);
        reject(rs)
      })
    });
  }


  setConfig(configName: string, configType: string, configValue: any) {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.axios({
        url: that.appConfig.endpoint + "/_config/" + configType + "/" + configName,
        headers: {
          "Authorization": "Bearer " + that.getToken.getToken()
        },
        method: "POST",
        data: configValue,
      }).then(function (respo) {
        resolve(respo.data)
      }, function (rs) {
        console.log("config fetch response", arguments);
        reject(rs)
      })
    });
  }
}
