/**
 * Created by artpar on 6/7/17.
 */
import axios, {AxiosResponse} from "axios"
import {AppConfigProvider, TokenGetter} from "./interface";
import ActionManager from "./actionmanager";

class Column {
    ColumnName: string;
    ColumnType: string;
    Name: string;
    DataType: string;
    IsIndexed: boolean;
    IsUnique: boolean;
    IsForeignKey: boolean;
    IsNullable: boolean;
    ForeignKey
}

class Table {
    TableName: string;
    Columns: Array<Column>;
}

export class WorldManager {
    columnKeysCache: any;
    stateMachines: any;
    stateMachineEnabled: any;
    streams: any;
    appConfig: AppConfigProvider;
    jsonApi: any;
    actionManager: ActionManager;
    columnTypes: any;
    worlds: Array<any>;
    systemActions: any;
    modelLoader: (string: string, any: any) => void;
    tokenGetter: TokenGetter;

    constructor(appConfig: AppConfigProvider, tokenGetter: TokenGetter, jsonApi: any, actionManager: ActionManager) {
        this.appConfig = appConfig;
        this.jsonApi = jsonApi;
        this.actionManager = actionManager;
        this.tokenGetter = tokenGetter;
        this.columnKeysCache = {};
        this.stateMachineEnabled = {};
        this.stateMachines = {};
        this.systemActions = {};
        this.worlds = [];
        this.columnTypes = {};
        this.init()
    }

    init() {
        const that = this;

        that.columnTypes = [];

        axios(this.appConfig.getEndpoint() + "/meta?query=column_types", {
            headers: {
                "Authorization": "Bearer " + that.tokenGetter.getToken()
            }
        }).then(function (r: AxiosResponse<string>) {
            if (r.status === 200) {
                that.columnTypes = r.data;
            } else {
                console.log("failed to get column types")
            }
        })

        const logoutHandler = ";";

        that.modelLoader = that.getColumnKeysWithErrorHandleWithThisBuilder(logoutHandler);

        this.jsonApi.define("image.png|jpg|jpeg|gif|tiff", {
            "__type": "value",
            "contents": "value",
            "name": "value",
            "reference_id": "value",
            "src": "value",
            "type": "value"
        });

    }


    getStateMachinesForType(typeName) {
        const that = this;
        return new Promise(function (resolve, reject) {
            resolve(that.stateMachines[typeName]);
        });
    };

    startObjectTrack(objType, objRefId, stateMachineRefId) {
        const that = this;

        return new Promise(function (resolve, reject) {
            axios({
                url: this.appConfig.getEndpoint() + "/track/start/" + stateMachineRefId,
                method: "POST",
                data: {
                    typeName: objType,
                    referenceId: objRefId
                },
                headers: {
                    "Authorization": "Bearer " + this.tokenGetter.getToken()
                }
            }).then(function (response: AxiosResponse) {
                resolve(response.data);
            }, function (response: AxiosResponse) {
                reject(response.data);
            })
        })
    };

    trackObjectEvent(typeName, stateMachineRefId, eventName) {
        const that = this;
        return new Promise(function (resolve, reject) {
            axios({
                url: this.appConfig.getEndpoint() + "/track/event/" + typeName + "/" + stateMachineRefId + "/" + eventName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + this.tokenGetter.getToken()
                }
            }).then(function (response: AxiosResponse) {
                resolve(response.data);
            }, function (response: AxiosResponse) {
                reject(response.data);
            })
        })
    };

    getColumnKeys(typeName, callback) {
        const that = this;
        // console.log("get column keys for ", typeName);
        if (that.columnKeysCache[typeName]) {
            callback(that.columnKeysCache[typeName]);
            return
        }

        axios(this.appConfig.getEndpoint() + '/jsmodel/' + typeName + ".js", {
            headers: {
                "Authorization": "Bearer " + this.tokenGetter.getToken()
            },
        }).then(function (response: AxiosResponse) {
            if (response.status === 200) {
                const data = response.data;
                if (data.Actions.length > 0) {
                    console.log("Register actions", typeName, data.Actions,)
                    that.actionManager.addAllActions(data.Actions);
                }
                that.stateMachines[typeName] = data.StateMachines;
                that.stateMachineEnabled[typeName] = data.IsStateMachineEnabled;
                that.columnKeysCache[typeName] = data;
                callback(data);
            } else {
                callback({}, response.data)
            }
        }, function (e) {
            callback(e)
        })

    };

    getColumnFieldTypes() {
        const that = this;
        console.log("Get column field types", that.columnTypes)
        return that.columnTypes;
    }

    isStateMachineEnabled(typeName) {
        const that = this;
        return that.stateMachineEnabled[typeName] === true;
    };

    getColumnKeysWithErrorHandleWithThisBuilder(logoutHandler: any): (string: string, any: any) => void {
        const that = this;
        return function (typeName: string, callback: any) {
            // console.log("load model", typeName);
            return that.getColumnKeys(typeName, function (a, e, s) {
                // console.log("get column kets respone: ", arguments)
                if (e === "error" && s === "Unauthorized") {
                    logoutHandler();
                } else {
                    callback(a, e, s)
                }
            })
        }
    };


    GetJsonApiModel(columnModel) {
        const that = this;
        console.log('get json api model for ', columnModel);
        const model = {};
        if (!columnModel) {
            console.log("Column model is empty", columnModel);
            return model;
        }

        const keys = Object.keys(columnModel);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            const data = columnModel[key];

            if (data["jsonApi"]) {
                model[key] = data;
            } else {
                model[key] = data.ColumnType;
            }
        }

        // console.log("returning model", model)
        return model;

    };

    getWorlds() {
        const that = this;
        console.log("GET WORLDS", that.worlds)
        return that.worlds;
    };

    getWorldByName(name) {
        const that = this;
        return that.worlds[name]
    };


    getSystemActions() {
        const that = this;
        return that.systemActions;
    }


    loadModel(modelName) {
        if (!(modelName instanceof Array)) {
            modelName = [modelName];
        }
        const that = this;
        return Promise.all(modelName.map(function (mName) {
            return new Promise(function (resolve, reject) {
                that.modelLoader(mName, function (columnKeys) {
                    that.jsonApi.define(mName, that.GetJsonApiModel(columnKeys.ColumnModel));
                    resolve();
                });
            })
        }))
    }

    loadStreams() {
        const that = this;
        that.modelLoader("stream", function (streamKeys) {
            that.jsonApi.define("stream", that.GetJsonApiModel(streamKeys.ColumnModel));
            that.jsonApi.findAll('stream', {
                page: {number: 1, size: 500},
            }).then(function (res) {
                res = res.data;
                that.streams = res;
                console.log("Get all streams result", res);
                const total = res.length;
                for (let t = 0; t < total; t++) {
                    (function (typename) {
                        that.modelLoader(typename, function (model) {
                            console.log("Loaded stream model", typename, model);
                            that.jsonApi.define(typename, that.GetJsonApiModel(model.ColumnModel));
                        });
                    })(res[t].stream_name)
                }
            });
        });

    }

    loadModels() {
        const that = this;
        let promise = new Promise(function (resolve, reject) {

            // do a thing, possibly async, then…
            that.modelLoader("user_account", function (columnKeys) {
                that.jsonApi.define("user_account", that.GetJsonApiModel(columnKeys.ColumnModel));
                that.modelLoader("usergroup", function (columnKeys) {
                    that.jsonApi.define("usergroup", that.GetJsonApiModel(columnKeys.ColumnModel));

                    that.modelLoader("world", function (columnKeys) {

                        that.jsonApi.define("world", that.GetJsonApiModel(columnKeys.ColumnModel));
                        // console.log("world column keys", columnKeys, that.GetJsonApiModel(columnKeys.ColumnModel))
                        that.systemActions = columnKeys.Actions;

                        that.jsonApi.findAll('world', {
                            page: {number: 1, size: 500}
                        }).then(function (res) {
                            res = res.data;
                            that.worlds = res;
                            // resolve("Stuff worked!");
                            let total = res.length;
                            if (total == 0) {
                                resolve();
                            }

                            for (let t = 0; t < res.length; t++) {
                                (function (typeName) {
                                    if (typeName.indexOf("_has_") > -1) {
                                        total -= 1;
                                        if (total < 1 && promise !== null) {
                                            resolve();
                                            promise = null;
                                        }
                                        return
                                    }
                                    that.modelLoader(typeName, function (model) {
                                        // console.log("Loaded model", typeName, model);

                                        total -= 1;

                                        if (total < 1 && promise !== null) {
                                            resolve();
                                            promise = null;
                                        }

                                        that.jsonApi.define(typeName, that.GetJsonApiModel(model.ColumnModel));
                                    })
                                })(res[t].table_name)

                            }
                        });
                    })
                });
            });
        });
        return promise;
    }
}

export default WorldManager;