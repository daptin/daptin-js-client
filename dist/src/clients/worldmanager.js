"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by artpar on 6/7/17.
 */
var axios_1 = require("axios");
var WorldManager = /** @class */ (function () {
    function WorldManager(appConfig, tokenGetter, jsonApi, actionManager) {
        this.appConfig = appConfig;
        this.jsonApi = jsonApi;
        this.actionManager = actionManager;
        this.tokenGetter = tokenGetter;
        this.init();
    }
    WorldManager.prototype.init = function () {
        var that = this;
        that.columnTypes = [];
        axios_1.default(this.appConfig.getEndpoint() + "/meta?query=column_types", {
            headers: {
                "Authorization": "Bearer " + that.tokenGetter.getToken()
            }
        }).then(function (r) {
            if (r.status === 200) {
                that.columnTypes = r.data;
            }
            else {
                console.log("failed to get column types");
            }
        });
        var logoutHandler = ";";
        that.modelLoader = that.getColumnKeysWithErrorHandleWithThisBuilder(logoutHandler);
        var worlds = [];
        var systemActions = [];
        this.jsonApi.define("image.png|jpg|jpeg|gif|tiff", {
            "__type": "value",
            "contents": "value",
            "name": "value",
            "reference_id": "value",
            "src": "value",
            "type": "value"
        });
    };
    WorldManager.prototype.getStateMachinesForType = function (typeName) {
        var that = this;
        return new Promise(function (resolve, reject) {
            resolve(that.stateMachines[typeName]);
        });
    };
    ;
    WorldManager.prototype.startObjectTrack = function (objType, objRefId, stateMachineRefId) {
        var that = this;
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: this.appConfig.getEndpoint() + "/track/start/" + stateMachineRefId,
                method: "POST",
                data: {
                    typeName: objType,
                    referenceId: objRefId
                },
                headers: {
                    "Authorization": "Bearer " + this.tokenGetter.getToken()
                }
            }).then(function (response) {
                resolve(response.data);
            }, function (response) {
                reject(response.data);
            });
        });
    };
    ;
    WorldManager.prototype.trackObjectEvent = function (typeName, stateMachineRefId, eventName) {
        var that = this;
        console.log("change object track", this.tokenGetter.getToken());
        return new Promise(function (resolve, reject) {
            axios_1.default({
                url: this.appConfig.getEndpoint() + "/track/event/" + typeName + "/" + stateMachineRefId + "/" + eventName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + this.tokenGetter.getToken()
                }
            }).then(function (response) {
                resolve(response.data);
            }, function (response) {
                reject(response.data);
            });
        });
    };
    ;
    WorldManager.prototype.getColumnKeys = function (typeName, callback) {
        var that = this;
        // console.log("get column keys for ", typeName);
        if (that.columnKeysCache[typeName]) {
            callback(that.columnKeysCache[typeName]);
            return;
        }
        axios_1.default(this.appConfig.getEndpoint() + '/jsmodel/' + typeName + ".js", {
            headers: {
                "Authorization": "Bearer " + this.tokenGetter.getToken()
            },
        }).then(function (response) {
            if (response.status === 200) {
                var data = response.data;
                console.log("Loaded Model inside :", typeName);
                if (data.Actions.length > 0) {
                    console.log("Register actions", typeName, data.Actions);
                    that.actionManager.addAllActions(data.Actions);
                }
                that.stateMachines[typeName] = data.StateMachines;
                that.stateMachineEnabled[typeName] = data.IsStateMachineEnabled;
                that.columnKeysCache[typeName] = data;
                callback(data);
            }
            else {
                callback({}, response.data);
            }
        }, function (e) {
            callback(e);
        });
    };
    ;
    WorldManager.prototype.getColumnFieldTypes = function () {
        var that = this;
        console.log("Get column field types", that.columnTypes);
        return that.columnTypes;
    };
    WorldManager.prototype.isStateMachineEnabled = function (typeName) {
        var that = this;
        return that.stateMachineEnabled[typeName] === true;
    };
    ;
    WorldManager.prototype.getColumnKeysWithErrorHandleWithThisBuilder = function (logoutHandler) {
        var that = this;
        return function (typeName, callback) {
            // console.log("load model", typeName);
            return that.getColumnKeys(typeName, function (a, e, s) {
                // console.log("get column kets respone: ", arguments)
                if (e === "error" && s === "Unauthorized") {
                    logoutHandler();
                }
                else {
                    callback(a, e, s);
                }
            });
        };
    };
    ;
    WorldManager.prototype.GetJsonApiModel = function (columnModel) {
        var that = this;
        console.log('get json api model for ', columnModel);
        var model = {};
        if (!columnModel) {
            console.log("Column model is empty", columnModel);
            return model;
        }
        var keys = Object.keys(columnModel);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var data = columnModel[key];
            if (data["jsonApi"]) {
                model[key] = data;
            }
            else {
                model[key] = data.ColumnType;
            }
        }
        // console.log("returning model", model)
        return model;
    };
    ;
    WorldManager.prototype.getWorlds = function () {
        var that = this;
        console.log("GET WORLDS", that.worlds);
        return that.worlds;
    };
    ;
    WorldManager.prototype.getWorldByName = function (name) {
        var that = this;
        return that.worlds.filter(function (e) {
            return e.table_name === name;
        })[0];
        // console.log("GET WORLDS", that.worlds)
        // return that.worlds;
    };
    ;
    WorldManager.prototype.getSystemActions = function () {
        var that = this;
        return that.systemActions;
    };
    WorldManager.prototype.loadModel = function (modelName) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.modelLoader(modelName, function (columnKeys) {
                that.jsonApi.define(modelName, that.GetJsonApiModel(columnKeys.ColumnModel));
                resolve();
            });
        });
    };
    WorldManager.prototype.loadModels = function () {
        var that = this;
        var promise = new Promise(function (resolve, reject) {
            // do a thing, possibly async, then…
            that.modelLoader("user", function (columnKeys) {
                that.jsonApi.define("user", that.GetJsonApiModel(columnKeys.ColumnModel));
                that.modelLoader("usergroup", function (columnKeys) {
                    that.jsonApi.define("usergroup", that.GetJsonApiModel(columnKeys.ColumnModel));
                    that.modelLoader("world", function (columnKeys) {
                        that.modelLoader("stream", function (streamKeys) {
                            that.jsonApi.define("world", that.GetJsonApiModel(columnKeys.ColumnModel));
                            that.jsonApi.define("stream", that.GetJsonApiModel(streamKeys.ColumnModel));
                            // console.log("world column keys", columnKeys, that.GetJsonApiModel(columnKeys.ColumnModel))
                            console.log("Defined world", columnKeys.ColumnModel);
                            that.systemActions = columnKeys.Actions;
                            that.jsonApi.findAll('world', {
                                page: { number: 1, size: 500 },
                                include: ['world_column']
                            }).then(function (res) {
                                res = res.data;
                                that.worlds = res;
                                console.log("Get all worlds result", res);
                                // resolve("Stuff worked!");
                                var total = res.length;
                                for (var t = 0; t < res.length; t++) {
                                    (function (typeName) {
                                        that.modelLoader(typeName, function (model) {
                                            // console.log("Loaded model", typeName, model);
                                            total -= 1;
                                            if (total < 1 && promise !== null) {
                                                resolve("Stuff worked!");
                                                promise = null;
                                            }
                                            that.jsonApi.define(typeName, that.GetJsonApiModel(model.ColumnModel));
                                        });
                                    })(res[t].table_name);
                                }
                            });
                            that.jsonApi.findAll('stream', {
                                page: { number: 1, size: 500 },
                            }).then(function (res) {
                                res = res.data;
                                that.streams = res;
                                console.log("Get all streams result", res);
                                var total = res.length;
                                for (var t = 0; t < total; t++) {
                                    (function (typename) {
                                        that.modelLoader(typename, function (model) {
                                            console.log("Loaded stream model", typename, model);
                                            that.jsonApi.define(typename, that.GetJsonApiModel(model.ColumnModel));
                                        });
                                    })(res[t].stream_name);
                                }
                            });
                        });
                    });
                });
            });
        });
        return promise;
    };
    return WorldManager;
}());
exports.WorldManager = WorldManager;
exports.default = WorldManager;
