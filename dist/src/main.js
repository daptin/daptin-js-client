"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actionmanager_1 = require("./clients/actionmanager");
var appconfig_1 = require("./clients/appconfig");
var devour_client_1 = require("devour-client");
var statsmanager_1 = require("./clients/statsmanager");
var worldmanager_1 = require("./clients/worldmanager");
var LocalStorageTokenGetter = /** @class */ (function () {
    function LocalStorageTokenGetter() {
    }
    LocalStorageTokenGetter.prototype.getToken = function () {
        return localStorage.getItem("token");
    };
    return LocalStorageTokenGetter;
}());
function DaptinClient(endpoint, debug) {
    var that = this;
    debug = debug || false;
    var appConfig = new appconfig_1.AppConfig(endpoint);
    var jsonApi = new devour_client_1.JsonApi({
        apiUrl: appConfig.getEndpoint() + '/api',
        pluralize: false,
        logger: debug
    });
    that.getToken = new LocalStorageTokenGetter();
    var actionManager = new actionmanager_1.ActionManager(appConfig, that.getToken);
    var worldManager = new worldmanager_1.WorldManager(appConfig, that.getToken, jsonApi, actionManager);
    var statsManager = new statsmanager_1.StatsManager(appConfig, that.getToken);
    jsonApi.insertMiddlewareBefore("HEADER", {
        name: "Auth Header middleware",
        req: function (req) {
            jsonApi.headers['Authorization'] = 'Bearer ' + that.getToken();
            return req;
        }
    });
    that.actionManager = actionManager;
    that.appConfig = appConfig;
    that.worldManager = worldManager;
    that.statsManager = statsManager;
}
