import './scss/options_page.scss'
import chromeStorage from './util/chromeStorage';
import type {} from 'typed-query-selector';
import { Options } from './util/types';
import options from './util/options';

async function main() {
    Object.assign(options, await chromeStorage.get('options'));
    setValue(options);

    document.querySelector('form#options_wrapper')?.addEventListener('submit', event => {
        event.preventDefault();
        saveValue().then(window.close);
    });

    document.querySelector('button#reset_btn')?.addEventListener('click', () => {
        setValue(options);
    });

    document.querySelector('button#clear_btn')?.addEventListener('click', async () => {
        await chromeStorage.clear();
        window.close();
    });
}

function iskey<T extends Record<string | number | symbol, any>>(obj: T, key: string | number | symbol): key is keyof T {
    return obj.hasOwnProperty(key);
}

function setValue(setOptions: Options) {
    for (const optionDom of document.querySelectorAll('.option_item > input')) {
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
    const saveOptions: Record<string, boolean | number> = { ...options };
    for (const optionDom of document.querySelectorAll('.option_item > input')) {
        if (!iskey(saveOptions, optionDom.name)) continue;

        if (optionDom.type === 'checkbox') {
            saveOptions[optionDom.name] = optionDom.checked;
        }

        if (optionDom.type === 'number') {
            saveOptions[optionDom.name] = Number(optionDom.value);
        }
    }

    return chromeStorage.set('options', saveOptions as Options);
}

window.onload = main;

// vscのバグ回避のため
export {};
