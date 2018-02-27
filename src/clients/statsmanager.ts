import axios, {AxiosResponse} from "axios"
import {TokenGetter} from './interface'
import AppConfig from "./appconfig";

export class StatsManager {
  tokenGetter: TokenGetter;
  appConfig: AppConfig;

  constructor(appConfig, tokenGetter: TokenGetter) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
  }

  private static queryToParams(statsRequest) {

    const keys = Object.keys(statsRequest);
    const list = [];

    for (let i = 0; i < keys.length; i++) {

      const key = keys[i];
      let values = statsRequest[key];

      if (!(values instanceof Array)) {
        values = [values]
      }

      for (let j = 0; j < values.length; j++) {
        list.push(encodeURIComponent(key) + "=" + encodeURIComponent(values));
      }

    }

    return "?" + list.join("&");


  };

  getStats(tableName, statsRequest) {

    console.log("create stats request", tableName, statsRequest)
    return new Promise(function (resolve, reject) {
      return axios({
        url: this.appConfig.getEndpoint() + "/stats/" + tableName + StatsManager.queryToParams(statsRequest),
        headers: {
          "Authorization": "Bearer " + this.tokenGetter.getToken()
        },
      }).then(function (response: AxiosResponse) {
        resolve(response.data);
      }, function (response: AxiosResponse) {
        reject(response.data);
      });
    })
  }
}


export default StatsManager;