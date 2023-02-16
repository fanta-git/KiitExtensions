import options from './util/options';
import './scss/main.scss'
import chromeStorage from './util/chromeStorage';
import optimizeDescription from './util/optimizeDescription';
import * as templates from './util/templates';
import type {} from 'typed-query-selector';
import observeCafe from './util/observeCafe';
import notice from './util/notice';
import { NicoEmbedProp } from './util/types';
import keybordShortcut from './util/keybordShortcut';


async function main() {
    setMenuDom();
    setEventListener();
    Object.assign(options, await chromeStorage.get('options'));

    window.addEventListener('focus', () => notice.noticeClear());
    window.addEventListener('beforeunload', () => notice.noticeClear());

    chromeStorage.onChange(changes => {
        if (changes.musicData?.newValue !== undefined) {
            setMusicDetail(changes.musicData.newValue);
        }
        if (changes.options?.newValue !== undefined) {
            location.reload();
        }
        if (changes.command?.newValue !== undefined) {
            chromeStorage.remove('command');
            const command = changes.command!.newValue;
            console.log(command);
            if (!iskey(keybordShortcut, command)) return;

            keybordShortcut[command]();
        }
    });

    observeCafe();
}

function setMenuDom() {
    document.querySelector('div#reasons')!.before(templates.extensionMenu);
    document.querySelector('div#reasons')!.after(templates.exWindows);
    document.querySelector('div#cafe')!.appendChild(templates.timetable);
    document.querySelector('#cafe_menu > ul')!.appendChild(templates.timetableLabel);
}

function setEventListener() {
    const qsCafe = document.querySelector('div#cafe')!;
    const qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li');
    const menuItemViewers = Array.from(qsaMenuLi, v => `view_${v.dataset.val}`);

    for(const menuItem of document.querySelectorAll('div.exmenu_item')) {
        qsCafe.dataset.exmenu ??= menuItem.dataset.val!;
        menuItem.addEventListener('click', () => {
            qsCafe.dataset.exmenu = menuItem.dataset.val!;
        });
    }

    for (const element of qsaMenuLi) {
        document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`)?.addEventListener('click', () => {
            qsCafe.classList.remove(...menuItemViewers);
            qsCafe.classList.add(`view_${element.dataset.val}`);
        });
    }
}

function setMusicDetail(musicInfo: NicoEmbedProp) {
    if (options.notification_music) notice.noticeSend(musicInfo.title, { icon: musicInfo.thumbnailUrl });

    document.querySelector('div#viewCounter')!.textContent = musicInfo.viewCounter.toLocaleString();
    document.querySelector('div#mylistCounter')!.textContent = musicInfo.mylistCounter.toLocaleString();
    document.querySelector('div#commentCounter')!.textContent = musicInfo.thread.commentCounter.toLocaleString();
    document.querySelector('#info div.contents')!.innerHTML = optimizeDescription(musicInfo.description);
}

function iskey<T extends Record<string | number | symbol, any>>(obj: T, key: string | number | symbol): key is keyof T {
    return obj.hasOwnProperty(key);
}

window.addEventListener('load', main);

// vscのバグ回避のため
export {};
