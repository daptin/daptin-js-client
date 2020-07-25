import axios from "axios"
import {TokenGetter} from "./interface";
import AppConfig from "./appconfig";

export class ConfigManager {
  appConfig: AppConfig;
  getToken: TokenGetter;

  constructor(appConfig: AppConfig, getToken: TokenGetter) {
    this.appConfig = appConfig;
    this.getToken = getToken;
  }

  getConfig(configName: string, configType: string) {
    const that = this;
    return new Promise(function (resolve, reject) {
      axios({
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

  setConfig(configName: string, configType: string, configValue: any) {
    const that = this;
    return new Promise(function (resolve, reject) {
      axios({
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