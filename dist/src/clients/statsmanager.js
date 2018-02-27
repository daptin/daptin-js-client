"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var StatsManager = /** @class */ (function () {
    function StatsManager(appConfig, tokenGetter) {
        this.appConfig = appConfig;
        this.tokenGetter = tokenGetter;
    }
    StatsManager.queryToParams = function (statsRequest) {
        var keys = Object.keys(statsRequest);
        var list = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var values = statsRequest[key];
            if (!(values instanceof Array)) {
                values = [values];
            }
            for (var j = 0; j < values.length; j++) {
                list.push(encodeURIComponent(key) + "=" + encodeURIComponent(values));
            }
        }
        return "?" + list.join("&");
    };
    ;
    StatsManager.prototype.getStats = function (tableName, statsRequest) {
        console.log("create stats request", tableName, statsRequest);
        return new Promise(function (resolve, reject) {
            return axios_1.default({
                url: this.appConfig.getEndpoint() + "/stats/" + tableName + StatsManager.queryToParams(statsRequest),
                headers: {
                    "Authorization": "Bearer " + this.tokenGetter.getToken()
                },
            }).then(function (response) {
                resolve(response.data);
            }, function (response) {
                reject(response.data);
            });
        });
    };
    return StatsManager;
}());
exports.StatsManager = StatsManager;
exports.default = StatsManager;
