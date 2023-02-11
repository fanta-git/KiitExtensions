import type { Options } from "./options";

type commentDataType = {
    user_id: number,
    text: string,
    type: 'user' | 'priority' | 'presenter'
};

type StorageType = {
    options: Options,
    flag: boolean,
    commentData: Record<string, commentDataType[]>,
    musicData: any
}

async function get <T extends keyof StorageType> (key: T): Promise<StorageType[T]> {
    return new Promise<StorageType[T]>((resolve) =>
        chrome.storage.local.get(key, (r) => resolve(r[key]))
    );
}

async function set <T extends keyof StorageType> (key: T, value: StorageType[T]) {
    return new Promise<void>((resolve) =>
        chrome.storage.local.set({ [key]: value }, resolve)
    );
}

async function clear () {
    return new Promise<void>(chrome.storage.local.clear);
}

type item = { [K in keyof Partial<StorageType>]: Record<'oldValue' | 'newValue', StorageType[K]> };
async function onChange (callback: (value: item, areaName?: 'sync' | 'local' | 'managed' | 'session') => any) {
    chrome.storage.onChanged.addListener((changes, areaName) =>
        callback(changes, areaName)
    );
}

export default { get, set, clear, onChange };