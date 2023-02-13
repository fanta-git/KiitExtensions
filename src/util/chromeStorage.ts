import { CommentDataType, NicoEmbedProp, Options } from "./types";

type StorageType = {
    options: Options,
    flag: boolean,
    command: string | undefined,
    commentData: Record<string, CommentDataType[]>,
    musicData: NicoEmbedProp
}

async function get <T extends keyof StorageType> (key: T): Promise<StorageType[T]> {
    const response = await chrome.storage.local.get(key);
    return response[key];
}

function set <T extends keyof StorageType> (key: T, value: StorageType[T]) {
    return chrome.storage.local.set({ [key]: value })
}

async function remove <T extends keyof StorageType> (key: T) {
    return chrome.storage.local.remove(key);
}

async function clear () {
    return chrome.storage.local.clear();
}

type item = { [K in keyof Partial<StorageType>]: Record<'oldValue' | 'newValue', StorageType[K]> };
async function onChange (callback: (value: item, areaName?: 'sync' | 'local' | 'managed' | 'session') => any) {
    chrome.storage.onChanged.addListener((changes, areaName) =>
        callback(changes, areaName)
    );
}

export default { get, set, remove, clear, onChange };
