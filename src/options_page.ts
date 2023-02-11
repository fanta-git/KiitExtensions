import './scss/options_page.scss'
import chromeStorage from './util/chromeStorage';

type options = {
    comment_fold: boolean,
    display_all: boolean,
    comment_log: boolean,
    notification_music: boolean,
    notification_comment: boolean,
    timetable_max: number,
    wait_time: number,
    interval_time: number,
    color_threshold: number
};

const defaultOptions: options = {
    comment_fold: false,
    display_all: true,
    comment_log: true,
    notification_music: true,
    notification_comment: true,
    timetable_max: 100,
    wait_time: 3000,
    interval_time: 1000,
    color_threshold: 6,
};

async function main() {
    const options = { ...defaultOptions, ...await chromeStorage.get('options') };
    setValue(options);

    document.querySelector('#options_wrapper')?.addEventListener('submit', event => {
        event.preventDefault();
        saveValue().then(window.close);
    });

    document.querySelector('#reset_btn')?.addEventListener('click', () => {
        setValue(defaultOptions);
    });

    document.querySelector('#clear_btn')?.addEventListener('click', async () => {
        await chromeStorage.clear();
        window.close();
    });
}

function iskey<T extends Record<string | number | symbol, any>>(obj: T, key: string | number | symbol): key is keyof T {
    return obj.hasOwnProperty(key);
}

function setValue(setOptions: options) {
    for (const optionDom of document.querySelectorAll<HTMLInputElement>('.option_item > input')) {
        if (!iskey(setOptions, optionDom.name)) continue;

        if (optionDom.type === 'checkbox') {
            optionDom.checked = Boolean(setOptions[optionDom.name]);
        }

        if (optionDom.type === 'number'){
            optionDom.value = String(setOptions[optionDom.name]);
        }
    }
}

function saveValue() {
    // TODO: もっと良い感じの書き方探す
    const saveOptions: Record<string, boolean | number> = { ...defaultOptions };
    for (const optionDom of document.querySelectorAll<HTMLInputElement>('.option_item > input')) {
        if (!iskey(saveOptions, optionDom.name)) continue;

        if (optionDom.type === 'checkbox') {
            saveOptions[optionDom.name] = optionDom.checked;
        }

        if (optionDom.type === 'number') {
            saveOptions[optionDom.name] = Number(optionDom.value);
        }
    }

    return chromeStorage.set('options', saveOptions as typeof defaultOptions);
}

window.onload = main;

// vscのバグ回避のため
export {};
