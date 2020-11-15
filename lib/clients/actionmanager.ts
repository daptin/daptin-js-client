import axios from "axios"
import * as jwt_decode from 'jwt-decode';
import {AppConfigProvider, TokenGetter} from "./interface";

export class ActionManager {

    appConfig: AppConfigProvider;
    tokenGetter: TokenGetter;
    actionMap: any;

    constructor(appConfig, getToken) {
        this.appConfig = appConfig;
        this.tokenGetter = getToken;
        this.actionMap = {};
    }

    setActions(typeName, actions) {
        this.actionMap[typeName] = actions;
    };


    private static base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    private static saveByteArray(downloadData) {
        const blob = new Blob([atob(downloadData.content)], {type: downloadData.contentType}),
            url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadData.name;
        a.click();
        window.URL.revokeObjectURL(url);
    };


    getGuestActions() {
        const that = this;
        return new Promise(function (resolve, reject) {
            axios({
                url: that.appConfig.endpoint + "/actions",
                method: "GET"
            }).then(function (respo) {
                resolve(respo.data)
            }, function (rs) {
                console.log("get actions list fetch failed", arguments);
                reject(rs)
            })
        });
    };

    doAction(type, actionName, data) {
        // console.log("invoke action", type, actionName, data);
        const that = this;
        return new Promise(function (resolve, reject) {
            axios({
                url: that.appConfig.endpoint + "/action/" + type + "/" + actionName,
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + that.tokenGetter.getToken()
                },
                data: {
                    attributes: data
                }
            }).then(function (res) {
                resolve(res.data);
                console.log("action response", res);
                const responses = res.data;
                for (let i = 0; i < responses.length; i++) {
                    const responseType = responses[i].ResponseType;

                    const data = responses[i].Attributes;
                    switch (responseType) {
                        case "client.notify":
                            console.log("notify client", data);
                            break;
                        case "client.store.set":
                            console.log("notify client", data);
                            if (window && window.localStorage) {
                                window.localStorage.setItem(data.key, data.value);
                                if (data.key === "token") {
                                    window.localStorage.setItem('user', JSON.stringify(jwt_decode(data.value)));
                                }
                            }
                            break;
                        case "client.file.download":
                            ActionManager.saveByteArray(data);
                            break;
                        case "client.redirect":
                            break;

                        case "client.cookie.set":
                            if (document) {
                                document.cookie = data.key + "=" + data.value + ";"
                            }
                            break;

                    }
                }
            }, function (res) {
                console.log("action failed", res);
                reject(res);
            })

        })

    };

    addAllActions(actions) {

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const onType = action["OnType"];

            if (!this.actionMap[onType]) {
                this.actionMap[onType] = {};
            }

            this.actionMap[onType][action["Name"]] = action;
        }
    };

    getActions(typeName) {
        return this.actionMap[typeName];
    };

    getActionModel(typeName, actionName) {
        return this.actionMap[typeName][actionName];
    };

};

export default ActionManager
