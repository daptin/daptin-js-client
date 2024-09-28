import {AxiosInstance} from "axios"
import * as jwt_decode from 'jwt-decode';
import {AppConfigProvider, TokenGetter} from "./interface";

export class ActionManager {

    appConfig: AppConfigProvider;
    tokenGetter: TokenGetter;
    actionMap: any;
    private axios: AxiosInstance;

    constructor(appConfig, getToken, axiosInstance) {
        this.appConfig = appConfig;
        this.tokenGetter = getToken;
        this.actionMap = {};
        this.axios = axiosInstance;
    }

    private static base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
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

    setActions(typeName, actions) {
        this.actionMap[typeName] = actions;
    };

    getGuestActions() {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.axios({
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
            that.axios({
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
            }, function (res) {
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

}

export default ActionManager
