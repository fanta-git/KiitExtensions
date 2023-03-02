import { ACTIONS, MessageData, MESSAGE_TYPE } from "./util/postMessage";

async function observeCafe() {
    console.log(window);

    watchValue(window.cafe_music, "now_playing_player", (oldVal, newVal) => {
        if (newVal == null) return;
        watchValue(newVal, "api", (oldVal, newVal) => {
            if (newVal == null) return;
            watchValue(newVal, "_videoInfo", (oldVal, newVal) => {
                if (newVal == null) return;
                if (oldVal != null && oldVal.videoId !== newVal.videoId) return;
                sendMessage(ACTIONS.NOW_PLAYING, newVal);
            });
        });
    });
}

function watchValue<T extends Record<string | number | symbol, any>, U extends keyof T>(obj: T, propName: U, func: (oldVal: T[U] | undefined, newVal: T[U] | undefined) => void) {
    let value = obj[propName];
    Object.defineProperty(obj, propName, {
        get: () => value,
        set: newVal => {
            const oldVal = value;
            value = newVal;
            try {
                func(oldVal, newVal);
            } catch (e) {
                console.error(e);
            }
        },
        configurable: true
    });
    if (value !== undefined) func(undefined, value);
}

function sendMessage <T extends MessageData['action']>(action: T, data: Extract<MessageData, { action: T }>['data']) {
    window.postMessage({
        type: MESSAGE_TYPE,
        action,
        data
    }, window.origin);
}

observeCafe();
