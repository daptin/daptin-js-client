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
var DaptinClient = /** @class */ (function () {
    function DaptinClient(endpoint, debug) {
        debug = debug || false;
        this.appConfig = new appconfig_1.AppConfig(endpoint);
        this.jsonApi = new devour_client_1.JsonApi({
            apiUrl: this.appConfig.getEndpoint() + '/api',
            pluralize: false,
            logger: debug
        });
        this.getToken = new LocalStorageTokenGetter();
        this.actionManager = new actionmanager_1.ActionManager(this.appConfig, this.getToken);
        this.worldManager = new worldmanager_1.WorldManager(this.appConfig, this.getToken, this.jsonApi, this.actionManager);
        this.statsManager = new statsmanager_1.StatsManager(this.appConfig, this.getToken);
        this.jsonApi.insertMiddlewareBefore("HEADER", {
            name: "Auth Header middleware",
            req: function (req) {
                this.jsonApi.headers['Authorization'] = 'Bearer ' + this.tokenGetter.getToken();
                return req;
            }
        });
    }
    return DaptinClient;
}());
exports.DaptinClient = DaptinClient;
