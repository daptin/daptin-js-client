"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var jwt_decode_1 = require("jwt-decode");
var ActionManager = /** @class */ (function () {
    function ActionManager(appConfig, getToken) {
        this.appConfig = appConfig;
        this.tokenGetter = getToken;
    }
    ActionManager.prototype.setActions = function (typeName, actions) {
        this.actionMap[typeName] = actions;
    };
    ;
    ActionManager.base64ToArrayBuffer = function (base64) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };
    ;
    ActionManager.saveByteArray = function (downloadData) {
        var blob = new Blob([atob(downloadData.content)], { type: downloadData.contentType }), url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = downloadData.name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    ;
    ActionManager.prototype.getGuestActions = function () {
        var that = this;
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: that.appConfig.apiRoot + "/actions",
                method: "GET"
            }).then(function (respo) {
                console.log("Guest actions list: ", respo);
                resolve(respo.data);
            }, function (rs) {
                console.log("get actions list fetch failed", arguments);
                reject(rs);
            });
        });
    };
    ;
    ActionManager.prototype.doAction = function (type, actionName, data) {
        // console.log("invoke action", type, actionName, data);
        var that = this;
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: that.appConfig.apiRoot + "/action/" + type + "/" + actionName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
                },
                data: {
                    attributes: data
                }
            }).then(function (res) {
                resolve("completed");
                console.log("action response", res);
                var responses = res.data;
                for (var i = 0; i < responses.length; i++) {
                    var responseType = responses[i].ResponseType;
                    var data_1 = responses[i].Attributes;
                    switch (responseType) {
                        case "client.notify":
                            console.log("notify client", data_1);
                            alert(JSON.stringify(data_1));
                            break;
                        case "client.store.set":
                            console.log("notify client", data_1);
                            window.localStorage.setItem(data_1.key, data_1.value);
                            if (data_1.key === "token") {
                                window.localStorage.setItem('user', JSON.stringify(jwt_decode_1.default(data_1.value)));
                            }
                            break;
                        case "client.file.download":
                            ActionManager.saveByteArray(data_1);
                            break;
                        case "client.redirect":
                            (function (redirectAttrs) {
                                setTimeout(function () {
                                    var target = redirectAttrs["window"];
                                    if (target === "self") {
                                        if (redirectAttrs.location[0] === '/') {
                                            window.location.replace(redirectAttrs.location);
                                            // window.vueApp.$router.push(redirectAttrs.location)
                                        }
                                        else {
                                            window.location.replace(redirectAttrs.location);
                                        }
                                        // window.vueApp.$router.push(redirectAttrs.location);
                                    }
                                    else {
                                        window.open(redirectAttrs.location, "_target");
                                    }
                                }, redirectAttrs.delay);
                            })(data_1);
                            break;
                    }
                }
            }, function (res) {
                console.log("action failed", res);
                reject(res.response.data);
            });
        });
    };
    ;
    ActionManager.prototype.addAllActions = function (actions) {
        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            var onType = action["OnType"];
            if (!this.actionMap[onType]) {
                this.actionMap[onType] = {};
            }
            this.actionMap[onType][action["Name"]] = action;
        }
    };
    ;
    ActionManager.prototype.getActions = function (typeName) {
        return this.actionMap[typeName];
    };
    ;
    ActionManager.prototype.getActionModel = function (typeName, actionName) {
        return this.actionMap[typeName][actionName];
    };
    ;
    return ActionManager;
}());
exports.ActionManager = ActionManager;
;
exports.default = ActionManager;
