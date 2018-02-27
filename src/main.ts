import {ActionManager} from 'clients/actionmanager'
import {AppConfig} from 'clients/appconfig'
import {JsonApi} from 'devour-client'
import {StatsManager} from 'clients/statsmanager'
import {WorldManager} from 'clients/worldmanager'


function DaptinClient(endpoint, debug) {

  const that = this;
  debug = debug || false;
  const appConfig = new AppConfig(endpoint);

  const jsonApi = new JsonApi({
    apiUrl: appConfig.apiRoot + '/api',
    pluralize: false,
    logger: debug
  });

  that.getToken = function () {
    return window.localStorage.getItem("token");
  }

  const actionManager = new ActionManager(appConfig, that.getToken);
  const worldManager = new WorldManager(appConfig, jsonApi, actionManager)
  const statsManager = new StatsManager(appConfig)


  jsonApi.insertMiddlewareBefore("HEADER", {
    name: "Auth Header middleware",
    req: function (req) {
      jsonApi.headers['Authorization'] = 'Bearer ' + that.getToken();
      return req
    }
  });


  that.actionManager = actionManager;
  that.appConfig = appConfig;
  that.worldManager = worldManager;
  that.statsManager = statsManager;


}

module.exports = DaptinClient;