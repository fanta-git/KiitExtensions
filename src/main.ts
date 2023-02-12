import options from './util/options';
import './scss/main.scss'
import chromeStorage from './util/chromeStorage';
import optimizeDescription from './util/optimizeDescription';
import * as templates from './util/templates';
import type {} from 'typed-query-selector';
import observeCafe from './util/observeCafe';
import notice from './util/notice';
import { NicoEmbedProp } from './util/types';


async function main() {
    setMenuDom();
    Object.assign(options, await chromeStorage.get('options'));

    window.addEventListener('focus', () => notice.noticeClear());
    window.addEventListener('beforeunload', () => notice.noticeClear());

    chromeStorage.onChange(changes => {
        if (changes.musicData !== undefined) {
            setMusicDetail(changes.musicData.newValue);
        }
        if (changes.options !== undefined) {
            location.reload();
        }
    });

    intervalCallFunc(options.interval_time, observeCafe);
}

async function intervalCallFunc(interval: number, func: () => Promise<any> | any) {
    while (true) {
        const res = func();
        await new Promise(r => setTimeout(r, interval));
        await res;
    }
}

function setMenuDom() {
    document.querySelector('#now_playing_info div.source')!.after(templates.extensionMenu);
    document.querySelector('div#reasons')!.after(templates.musicData);
    document.querySelector('#cafe_menu > ul')!.appendChild(templates.timetableLabel);
    document.querySelector('div#cafe')!.appendChild(templates.timetable);

    const qsCafe = document.querySelector('div#cafe')!;
    const qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li');
    const qsRdIcon = document.querySelector('#rd_toggle i.material-icons')!;

    document.querySelector('div#rd_toggle')?.addEventListener('click', () => {
        qsRdIcon.textContent = (qsRdIcon.textContent === 'info')
            ? 'people'
            : 'info';
        qsCafe.classList.toggle('view_music_data');
    });

    for (const element of qsaMenuLi) {
        document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`)?.addEventListener('click', () => {
            qsCafe.classList.remove(...Array.from(qsaMenuLi, v => `view_${v.dataset.val}`));
            qsCafe.classList.add(`view_${element.dataset.val}`);
        });
    }
}

function setMusicDetail(musicInfo: NicoEmbedProp) {
    if (options.notification_music) notice.noticeSend(musicInfo.title, { icon: musicInfo.thumbnailUrl });

    document.querySelector('div#viewCounter')!.textContent = musicInfo.viewCounter.toLocaleString();
    document.querySelector('div#mylistCounter')!.textContent = musicInfo.mylistCounter.toLocaleString();
    document.querySelector('div#commentCounter')!.textContent = musicInfo.thread.commentCounter.toLocaleString();
    document.querySelector('div#music_description')!.innerHTML = optimizeDescription(musicInfo.description);
}

window.addEventListener('load', main);

// vscのバグ回避のため
export {};
