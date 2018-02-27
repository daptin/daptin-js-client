"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interface_1 = require("./interface");
var AppConfig = /** @class */ (function () {
    function AppConfig(endpoint) {
        this.endpoint = window.location.protocol + "//" + endpoint;
        this.localStorage = new interface_1.InMemoryLocalStorage();
    }
    AppConfig.prototype.getEndpoint = function () {
        return this.endpoint;
    };
    return AppConfig;
}());
exports.AppConfig = AppConfig;
exports.default = AppConfig;
