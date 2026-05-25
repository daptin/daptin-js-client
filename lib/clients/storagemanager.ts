import {ActionManager} from "./actionmanager";
import type {DaptinActionResponse, DaptinNotifyAttributes} from "../types/action";

export interface DaptinActionFileInput {
    name: string;
    file?: string;
    contents?: string;
    type?: string;
    [key: string]: unknown;
}

export interface CloudStoreCreateFolderOptions {
    path?: string;
    name: string;
}

export interface CloudStoreUploadFileOptions {
    path?: string;
    file: DaptinActionFileInput | DaptinActionFileInput[];
}

export interface CloudStoreDeletePathOptions {
    path: string;
}

export interface CloudStoreMovePathOptions {
    source: string;
    destination: string;
}

export interface CloudStoreCreateSiteOptions {
    hostname: string;
    path: string;
    siteType: string;
}

export interface SitePathOptions {
    path: string;
}

export interface SiteSyncStorageOptions {
    path?: string;
}

export interface DaptinSiteFileListAttributes {
    list?: unknown[];
    [key: string]: unknown;
}

export interface DaptinSiteFileGetAttributes {
    data?: string;
    [key: string]: unknown;
}

export class CloudStoreActionManager {
    private actionManager: ActionManager;

    constructor(actionManager: ActionManager) {
        this.actionManager = actionManager;
    }

    createFolder(referenceId: string, options: CloudStoreCreateFolderOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("cloud_store", "create_folder", {
            path: options.path ?? "",
            name: options.name
        }, {
            referenceId
        });
    }

    uploadFile(referenceId: string, options: CloudStoreUploadFileOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("cloud_store", "upload_file", {
            path: options.path ?? "",
            file: Array.isArray(options.file) ? options.file : [options.file]
        }, {
            referenceId
        });
    }

    deletePath(referenceId: string, options: CloudStoreDeletePathOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("cloud_store", "delete_path", {
            path: options.path
        }, {
            referenceId
        });
    }

    movePath(referenceId: string, options: CloudStoreMovePathOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("cloud_store", "move_path", {
            source: options.source,
            destination: options.destination
        }, {
            referenceId
        });
    }

    createSite(referenceId: string, options: CloudStoreCreateSiteOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("cloud_store", "create_site", {
            hostname: options.hostname,
            path: options.path,
            site_type: options.siteType
        }, {
            referenceId
        });
    }
}

export class SiteFileActionManager {
    private actionManager: ActionManager;

    constructor(actionManager: ActionManager) {
        this.actionManager = actionManager;
    }

    listFiles(referenceId: string, options: SitePathOptions): Promise<DaptinActionResponse<DaptinSiteFileListAttributes>> {
        return this.actionManager.doAction<DaptinSiteFileListAttributes>("site", "list_files", {
            path: options.path
        }, {
            referenceId
        });
    }

    getFile(referenceId: string, options: SitePathOptions): Promise<DaptinActionResponse<DaptinSiteFileGetAttributes>> {
        return this.actionManager.doAction<DaptinSiteFileGetAttributes>("site", "get_file", {
            path: options.path
        }, {
            referenceId
        });
    }

    deleteFile(referenceId: string, options: SitePathOptions): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("site", "delete_file", {
            path: options.path
        }, {
            referenceId
        });
    }

    syncStorage(referenceId: string, options: SiteSyncStorageOptions = {}): Promise<DaptinActionResponse<DaptinNotifyAttributes>> {
        return this.actionManager.doAction<DaptinNotifyAttributes>("site", "sync_site_storage", {
            path: options.path ?? ""
        }, {
            referenceId
        });
    }
}

export class StorageManager {
    public cloudStore: CloudStoreActionManager;
    public site: SiteFileActionManager;

    constructor(actionManager: ActionManager) {
        this.cloudStore = new CloudStoreActionManager(actionManager);
        this.site = new SiteFileActionManager(actionManager);
    }
}
