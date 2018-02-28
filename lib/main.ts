import {ActionManager} from "./clients/actionmanager"
import {AppConfig} from './clients/appconfig'
import {StatsManager} from './clients/statsmanager'
import {WorldManager} from './clients/worldmanager'
import {TokenGetter} from "./clients/interface";

const JsonApi = require('devour-client')

class LocalStorageTokenGetter {
  getToken(): string {
    return localStorage.getItem("token")
  }
}

export class DaptinClient {

  appConfig: AppConfig;
  jsonApi: any;
  getToken: TokenGetter;
  actionManager: ActionManager;
  worldManager: WorldManager;
  statsManager: StatsManager;

  constructor(endpoint, debug) {
    debug = debug || false;
    this.appConfig = new AppConfig(endpoint);

    this.jsonApi = new JsonApi({
      apiUrl: this.appConfig.getEndpoint() + '/api',
      pluralize: false,
      logger: debug
    });

    this.getToken = new LocalStorageTokenGetter();
    this.actionManager = new ActionManager(this.appConfig, this.getToken);
    this.worldManager = new WorldManager(this.appConfig, this.getToken, this.jsonApi, this.actionManager)
    this.statsManager = new StatsManager(this.appConfig, this.getToken)


    this.jsonApi.insertMiddlewareBefore("HEADER", {
      name: "Auth Header middleware",
      req: function (req) {
        this.jsonApi.headers['Authorization'] = 'Bearer ' + this.tokenGetter.getToken();
        return req
      }
    });


  }

}