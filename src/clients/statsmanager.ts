import axios from "axios"

const StatsManager = function (appConfig) {
  const that = this;

  that.queryToParams = function (statsRequest) {

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

  that.getStats = function (tableName, statsRequest) {

    console.log("create stats request", tableName, statsRequest)
    return axios({
      url: appConfig.apiRoot + "/stats/" + tableName + that.queryToParams(statsRequest),
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    })

  }
};
export default StatsManager
