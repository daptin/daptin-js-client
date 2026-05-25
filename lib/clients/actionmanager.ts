import {AxiosInstance} from "axios"
import * as jwt_decode from 'jwt-decode';
import {AppConfigProvider, TokenGetter} from "./interface";
import type {DaptinActionDefinition} from "../types/schema";
import type {DaptinActionResponse} from "../types/action";

export interface ActionOptions {
    query?: {[key: string]: any};
    referenceId?: string;
}

export class ActionManager {

    appConfig: AppConfigProvider;
    tokenGetter: TokenGetter;
    actionMap: Record<string, Record<string, DaptinActionDefinition>>;
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

    setActions(typeName: string, actions: Record<string, DaptinActionDefinition>) {
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

    doAction<TAttributes = Record<string, unknown>>(type: string, actionName: string, data: Record<string, unknown>, options?: ActionOptions): Promise<DaptinActionResponse<TAttributes>> {
        // console.log("invoke action", type, actionName, data);
        const that = this;
        const attributes = {
            ...(data || {})
        };
        if (options && options.referenceId) {
            attributes[type + "_id"] = options.referenceId;
        }
        return new Promise<DaptinActionResponse<TAttributes>>(function (resolve, reject) {
            that.axios({
                url: that.appConfig.endpoint + "/action/" + type + "/" + actionName,
                method: "POST",
                headers: that.authHeaders(),
                params: options && options.query ? options.query : undefined,
                data: {
                    attributes: attributes
                }
            }).then(function (res) {
                resolve(res.data as DaptinActionResponse<TAttributes>);
            }, function (res) {
                reject(res);
            })

        })

    };

    private authHeaders() {
        const token = this.tokenGetter.getToken();
        return token ? {"Authorization": "Bearer " + token} : {};
    }

    addAllActions(actions: DaptinActionDefinition[]) {

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const onType = action["OnType"];

            if (!this.actionMap[onType]) {
                this.actionMap[onType] = {};
            }

            this.actionMap[onType][action["Name"]] = action;
        }
    };

    getActions(typeName: string): Record<string, DaptinActionDefinition> | undefined {
        return this.actionMap[typeName];
    };

    getActionModel(typeName: string, actionName: string): DaptinActionDefinition | undefined {
        if (!this.actionMap[typeName]) {
            return undefined;
        }
        return this.actionMap[typeName][actionName];
    };

}

export default ActionManager
