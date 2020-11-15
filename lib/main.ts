import {ActionManager} from "./clients/actionmanager"
import {AppConfig} from './clients/appconfig'
import {StatsManager} from './clients/statsmanager'
import {WorldManager} from './clients/worldmanager'
import {TokenGetter} from "./clients/interface";
import {ConfigManager} from "./clients/configmanager";

const JsonApi = require('devour-client');

class LocalStorageTokenGetter {
  getToken(): string {
    return localStorage.getItem("token")
  }
}

export class DaptinClient {

  public appConfig: AppConfig;
  public jsonApi: any;
  public tokenGetter: TokenGetter;
  public actionManager: ActionManager;
  public worldManager: WorldManager;
  public statsManager: StatsManager;
  public configManager: ConfigManager;

  constructor(endpoint, debug, tokenGetter) {
    const that = this;
    debug = debug || false;
    that.appConfig = new AppConfig(endpoint);

    that.jsonApi = new JsonApi({
      apiUrl: that.appConfig.getEndpoint() + '/api',
      pluralize: false,
      logger: debug
    });

    that.tokenGetter = tokenGetter || new LocalStorageTokenGetter();
    that.actionManager = new ActionManager(that.appConfig, that.tokenGetter);
    that.worldManager = new WorldManager(that.appConfig, that.tokenGetter, that.jsonApi, that.actionManager);
    that.statsManager = new StatsManager(that.appConfig, that.tokenGetter);
    that.configManager = new ConfigManager(that.appConfig, that.tokenGetter);


    that.jsonApi.insertMiddlewareBefore("HEADER", {
      name: "Auth Header middleware",
      req: function (req) {
        let token = that.tokenGetter.getToken();
        if (token) {
          that.jsonApi.headers['Authorization'] = 'Bearer ' + token;
        }
        return req
      }
    });


  }

}