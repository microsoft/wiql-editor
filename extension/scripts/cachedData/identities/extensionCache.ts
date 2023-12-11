import { CachedValue } from "../CachedValue";
import * as VSS from "azure-devops-extension-sdk";
import { IExtensionDataService, CommonServiceIds } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

const collection = "extension-cache";
const service = new CachedValue<IExtensionDataService>(() => VSS.getService(CommonServiceIds.ExtensionDataService));

interface IExtensionCacheEntry<T> {
    id: string;
    value: T;
    formatVersion: number;
    expiration: string;
    __etag: -1;
}
const formatVersion = 2;

export async function store<T>(key: string, value: T, expiration?: Date): Promise<void> {
    const entry: IExtensionCacheEntry<T> = {
        id: key,
        value,
        formatVersion,
        expiration: expiration ? expiration.toJSON() : "",
        __etag: -1,
    };

    const dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    const extensionDataManager = await dataService.getExtensionDataManager(SDK.getExtensionContext().id, CommonServiceIds.ExtensionDataService);
    await extensionDataManager.setDocument(collection, entry);
}

export async function get<T>(key: string): Promise<T | null> {
    const dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    const extensionDataManager = await dataService.getExtensionDataManager(SDK.getExtensionContext().id, CommonServiceIds.ExtensionDataService);
    return extensionDataManager.getDocument(collection, key).then((doc: IExtensionCacheEntry<T>) => {
        if (doc.formatVersion !== formatVersion) {
            return null;
        }
        if (doc.expiration && new Date(doc.expiration) < new Date()) {
            return null;
        }
        return doc.value;
    }, (error: any): T | null => {
        const status = Number(error.status);
        // If collection has not been created yet;
        if (status === 404 ||
            // User does not have permissions
            status === 401) {
            return null;
        }
        throw error;
    });
}
