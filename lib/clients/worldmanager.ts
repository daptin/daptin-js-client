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
    worlds: Object;
    systemActions: any;

    modelLoader(typeName: string, force: boolean): Promise<any> {
        const that = this;
        return new Promise(function (resolve, reject) {
            return that.getColumnKeys(typeName, force).then(resolve).catch(reject)
        });
    };

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
        this.worlds = {};
        this.columnTypes = {};
        this.init()
    }

    init() {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.columnTypes = [];

            axios(that.appConfig.getEndpoint() + "/meta?query=column_types", {
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
                }
            }).then(function (r: AxiosResponse<string>) {
                if (r.status === 200) {
                    that.columnTypes = r.data;
                    resolve(r.data);
                } else {
                    reject(r.data)
                }
            }, reject);

            that.jsonApi.define("image.png|jpg|jpeg|gif|tiff", {
                "__type": "value",
                "contents": "value",
                "name": "value",
                "reference_id": "value",
                "src": "value",
                "type": "value"
            });
        })
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
                url: that.appConfig.getEndpoint() + "/track/start/" + stateMachineRefId,
                method: "POST",
                data: {
                    typeName: objType,
                    referenceId: objRefId
                },
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
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
                url: that.appConfig.getEndpoint() + "/track/event/" + typeName + "/" + stateMachineRefId + "/" + eventName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
                }
            }).then(function (response: AxiosResponse) {
                resolve(response.data);
            }, function (response: AxiosResponse) {
                reject(response.data);
            })
        })
    };

    getColumnKeys(typeName: string, force: boolean): Promise<any> {
        const that = this;
        return new Promise(function (resolve, reject) {

            if (that.columnKeysCache[typeName] && !force) {
                resolve(that.columnKeysCache[typeName]);
                return
            }

            axios(that.appConfig.getEndpoint() + '/jsmodel/' + typeName + ".js", {
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
                },
            }).then(function (response: AxiosResponse) {
                if (response.status === 200) {
                    const data = response.data;
                    if (data.Actions.length > 0) {
                        console.log("Register actions", typeName, data.Actions,);
                        that.actionManager.addAllActions(data.Actions);
                    }
                    that.stateMachines[typeName] = data.StateMachines;
                    that.stateMachineEnabled[typeName] = data.IsStateMachineEnabled;
                    that.columnKeysCache[typeName] = data;
                    resolve(data);
                } else {
                    reject({error: response.data})
                }
            }, function (e) {
                reject({error: e})
            })

        });

    };

    getColumnFieldTypes() {
        const that = this;
        return that.columnTypes;
    }

    isStateMachineEnabled(typeName) {
        const that = this;
        return that.stateMachineEnabled[typeName] === true;
    };


    GetJsonApiModel(columnModel) {
        const that = this;
        const model = {};
        if (!columnModel) {
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

        return model;
    };

    getWorlds() {
        const that = this;
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


    loadModel(modelName, force:boolean) {
        if (!(modelName instanceof Array)) {
            modelName = [modelName];
        }
        const that = this;
        return Promise.all(modelName.map(function (mName) {
            return new Promise(function (resolve, reject) {
                that.modelLoader(mName, force).then(function (columnKeys) {
                    that.jsonApi.define(mName, that.GetJsonApiModel(columnKeys.ColumnModel));
                    resolve(that.GetJsonApiModel(columnKeys.ColumnModel));
                }).catch(reject);
            })
        }))
    }

    loadStreams(force: boolean) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.modelLoader("stream", force).then(function (streamKeys) {
                that.jsonApi.define("stream", that.GetJsonApiModel(streamKeys.ColumnModel));
                that.jsonApi.findAll('stream', {
                    page: {number: 1, size: 500},
                }).then(function (res) {
                    res = res.data;
                    that.streams = res;
                    console.log("Get all streams result", res);
                    Promise.all(that.streams.map(function (stream) {
                        return new Promise(function (resolve, reject) {
                            that.modelLoader(stream.stream_name, force).then(function (model) {
                                console.log("Loaded stream model", stream.stream_name, model);
                                that.jsonApi.define(stream.stream_name, that.GetJsonApiModel(model.ColumnModel));
                                resolve(that.GetJsonApiModel(model.ColumnModel))
                            }).catch(reject)
                        })
                    })).then(function () {
                        resolve(res);
                    }).catch(reject);

                });
            });
        });
    }

    refreshWorld(worldName: string, force: boolean): Promise<any> {

        const that = this;
        return new Promise(function (resolve, reject) {

            if (worldName.indexOf("_has_") > -1) {
                resolve();
                return
            }

            var promises = [];
            if (!that.worlds[worldName]) {
                promises.push(that.jsonApi.findAll('world', {
                    page: {number: 1, size: 500},
                    query: [{"column": "table_name", "operator": "is", "value": worldName}],
                }).then(function (res) {
                    res = res.data;
                    let total = res.length;
                    if (total == 0) {
                        reject({error: "no results from server"});
                    }
                    that.worlds[res[0].table_name] = res[0];
                    resolve(res[0])
                }))
            }
            promises.push(that.modelLoader(worldName,force).then(function (model) {
                let jsonApiModel = that.GetJsonApiModel(model.ColumnModel);
                that.jsonApi.define(worldName, jsonApiModel);
                resolve(jsonApiModel)
            }).catch(reject));

            return Promise.all(promises)

        })
    }

    refreshWorlds(force: boolean): Promise<any> {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.jsonApi.findAll('world', {
                page: {number: 1, size: 500}
            }).then(function (res) {
                res = res.data;
                let total = res.length;
                if (total == 0) {
                    reject({error: "no tables found"});
                }
                Promise.all(res.map(function (world) {
                    that.worlds[world.table_name] = world;
                    return that.refreshWorld(world.table_name, force);
                })).then(function () {
                    resolve(res);
                }).catch(reject);
            })

        })

    }

    loadModels(force: boolean) {
        const that = this;
        return new Promise(async function (resolve, reject) {
            const userAccountDef = await that.modelLoader("user_account", force);
            that.jsonApi.define("user_account", that.GetJsonApiModel(userAccountDef.ColumnModel));

            const userGroupDef = await that.modelLoader("usergroup", force);
            that.jsonApi.define("usergroup", that.GetJsonApiModel(userGroupDef.ColumnModel));

            const worldDef = await that.modelLoader("world", force);
            that.systemActions = worldDef.Actions;
            that.jsonApi.define("world", that.GetJsonApiModel(worldDef.ColumnModel));
            that.refreshWorlds(force).then(function () {
                resolve(that.worlds);
            }).catch(reject);
        });
    }
}

export default WorldManager;