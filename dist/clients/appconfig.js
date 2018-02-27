"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppConfig = function (endpoint) {
    endpoint = endpoint || window.location.host;
    var that = this;
    that.location = {
        host: endpoint,
        apiRoot: window.location.protocol + "//" + endpoint
    };
    that.data = {};
    that.localStorage = {
        getItem: function (key) {
            return that.data[key];
        },
        setItem: function (key, item) {
            that.data[key] = item;
        }
    };
    return that;
};
exports.default = AppConfig;
