"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var jwt_decode_1 = require("jwt-decode");
var ActionManager = function (appConfig, getToken) {
    var that = this;
    that.actionMap = {};
    this.setActions = function (typeName, actions) {
        that.actionMap[typeName] = actions;
    };
    this.base64ToArrayBuffer = function (base64) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };
    setTimeout(function () {
        that.a = document.createElement("a");
        document.body.appendChild(that.a);
        that.a.style = "display: none";
        return function (downloadData) {
            var blob = new Blob([atob(downloadData.content)], { type: downloadData.contentType }), url = window.URL.createObjectURL(blob);
            that.a.href = url;
            that.a.download = downloadData.name;
            that.a.click();
            window.URL.revokeObjectURL(url);
        };
    });
    this.saveByteArray = function (downloadData) {
        var blob = new Blob([atob(downloadData.content)], { type: downloadData.contentType }), url = window.URL.createObjectURL(blob);
        that.a.href = url;
        that.a.download = downloadData.name;
        that.a.click();
        window.URL.revokeObjectURL(url);
    };
    this.getGuestActions = function () {
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: appConfig.apiRoot + "/actions",
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
    this.doAction = function (type, actionName, data) {
        // console.log("invoke action", type, actionName, data);
        var that = this;
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: appConfig.apiRoot + "/action/" + type + "/" + actionName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + getToken()
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
                            that.saveByteArray(data_1);
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
                reject("Failed");
                if (res.response.data.Message) {
                    Notification.error(res.response.data.Message);
                }
                else {
                    Notification.error("I failed to " + window.titleCase(actionName));
                }
            });
        });
    };
    this.addAllActions = function (actions) {
        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            var onType = action["OnType"];
            if (!that.actionMap[onType]) {
                that.actionMap[onType] = {};
            }
            that.actionMap[onType][action["Name"]] = action;
        }
    };
    this.getActions = function (typeName) {
        return that.actionMap[typeName];
    };
    this.getActionModel = function (typeName, actionName) {
        return that.actionMap[typeName][actionName];
    };
    return this;
};
exports.default = ActionManager;
