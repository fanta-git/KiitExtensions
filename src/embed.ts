async function observeCafe() {
    console.log(window);

    watchValue(window.cafe_music, "now_playing", (oldVal, newVal) => {
        if (oldVal.id === newVal.id) return;
        console.log('now_playing:', newVal);
    });

    watchValue(window.cafe_users, "comments", (oldVal, newVal) => {
        const lastId = oldVal.at(-1)?.id ?? -1;
        const newComments = newVal.filter(v => v.id > lastId);
        if (newComments.length === 0) return;
        console.log('newComments:', newComments);
    });

    watchValue(window.cafe_users, "new_fav_user_ids", (oldVal, newVal) => {
        if (oldVal.length === newVal.length || newVal.length === 0) return;
        console.log('newFav:', newVal);
    });

    watchValue(window.cafe_users, "gesture", (_, newVal) => {
        watchValue(newVal, "user_gestures", (oldVal, newVal) => {
            if (oldVal && Object.keys(oldVal).length === Object.keys(newVal).length) return;
            console.log('newRotate:', newVal);
        });
    });
}

function watchValue<T extends Record<string | number | symbol, any>, U extends keyof T>(obj: T, propName: U, func: (oldVal: T[U], newVal: T[U]) => void) {
    let value = obj[propName];
    Object.defineProperty(obj, propName, {
        get: () => value,
        set: newVal => {
            const oldVal = value;
            value = newVal;
            func(oldVal, newVal);
        },
        configurable: true
    });
}

observeCafe();
