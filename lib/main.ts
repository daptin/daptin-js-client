import axios from "axios"
import {ActionManager} from "./clients/actionmanager"
import {AppConfig} from './clients/appconfig'
import {StatsManager} from './clients/statsmanager'
import {WorldManager} from './clients/worldmanager'
import {TokenGetter} from "./clients/interface";
import {ConfigManager} from "./clients/configmanager";
import AggregationClient from "./clients/aggregate_client";
import {AssetManager} from "./clients/assetmanager";
import {AuthManager} from "./clients/authmanager";
import {IntegrationManager} from "./clients/integrationmanager";
import {RuntimeManager} from "./clients/runtime_manager";
import {LlmManager} from "./clients/llmmanager";
import {GraphqlManager} from "./clients/graphqlmanager";
import {YjsManager} from "./clients/yjsmanager";
import {StateMachineManager} from "./clients/statemachinemanager";
import {FeedManager} from "./clients/feedmanager";
import {LiveManager} from "./clients/livemanager";
import {RelationshipManager} from "./clients/relationshipmanager";

const JsonApi =  require("devour-client");

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
  public aggregateClient: AggregationClient;
  public assetManager: AssetManager;
  public authManager: AuthManager;
  public integrationManager: IntegrationManager;
  public runtimeManager: RuntimeManager;
  public llmManager: LlmManager;
  public graphqlManager: GraphqlManager;
  public yjsManager: YjsManager;
  public stateMachineManager: StateMachineManager;
  public feedManager: FeedManager;
  public liveManager: LiveManager;
  public relationshipManager: RelationshipManager;

  constructor(endpoint, debug, tokenGetter, axiosConfig  : any) {
    const that = this;
    debug = debug || false;
    axiosConfig = axiosConfig || {}
    let axiosInstance = axios.create(axiosConfig)
    that.appConfig = new AppConfig(endpoint);

    that.jsonApi = new JsonApi({
      apiUrl: that.appConfig.getEndpoint() + '/api',
      pluralize: false,
      logger: debug,
      ...axiosConfig
    });
    that.jsonApi.axios = axiosInstance;

    that.tokenGetter = tokenGetter || new LocalStorageTokenGetter();
    that.actionManager = new ActionManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.worldManager = new WorldManager(that.appConfig, that.tokenGetter, that.jsonApi, that.actionManager, axiosInstance);
    that.statsManager = new StatsManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.configManager = new ConfigManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.aggregateClient = new AggregationClient(that.appConfig, that.tokenGetter, axiosInstance);
    that.assetManager = new AssetManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.authManager = new AuthManager(that.actionManager, that.tokenGetter);
    that.integrationManager = new IntegrationManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.runtimeManager = new RuntimeManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.llmManager = new LlmManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.graphqlManager = new GraphqlManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.yjsManager = new YjsManager(that.appConfig, that.tokenGetter);
    that.stateMachineManager = new StateMachineManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.feedManager = new FeedManager(that.appConfig, that.tokenGetter, axiosInstance);
    that.liveManager = new LiveManager(that.appConfig, that.tokenGetter);
    that.relationshipManager = new RelationshipManager(that.appConfig, that.tokenGetter, axiosInstance);

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

    that.installJsonApiModelFallback();


  }

  private installJsonApiModelFallback() {
    const that = this;
    const originalFindAll = that.jsonApi.findAll.bind(that.jsonApi);
    that.jsonApi.findAll = function (entityName, params) {
      try {
        return Promise.resolve(originalFindAll(entityName, params)).catch(function (error) {
          if (!that.isModelRegistryMiss(error)) {
            throw error;
          }
          return that.worldManager.loadModel(entityName, false).then(function () {
            return originalFindAll(entityName, params);
          }, function () {
            throw error;
          });
        });
      } catch (error) {
        if (!that.isModelRegistryMiss(error)) {
          throw error;
        }
        return that.worldManager.loadModel(entityName, false).then(function () {
          return originalFindAll(entityName, params);
        }, function () {
          throw error;
        });
      }
    };
  }

  private isModelRegistryMiss(error): boolean {
    const message = error && (error.message || error.toString && error.toString());
    return typeof message === "string" && message.indexOf("API resource definition for model") > -1;
  }

}
