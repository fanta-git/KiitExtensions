import options from './util/options';
import './scss/main.scss'
import chromeStorage from './util/chromeStorage';
import optimizeDescription from './util/optimizeDescription';
import * as templates from './util/templates';
import type {} from 'typed-query-selector';
import observeCafe from './util/observeCafe';


async function main() {
    setMenuDom();
    Object.assign(options, await chromeStorage.get('options'));

    window.addEventListener('focus', () => notification.close());
    window.addEventListener('beforeunload', () => notification.close());

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

const notification = new class {
    #ntcList: Notification[] = [];

    async send(text: string, opt = {}) {
        if (await chromeStorage.get('flag') && !document.hasFocus()) {
            const ntcItem = new Notification(text, opt);
            this.#ntcList.push(ntcItem);
        }
    }

    close() {
        for (const item of this.#ntcList) item.close();
    }

    async set(e: Element) {
        e.querySelector('i.material-icons')!.textContent = await chromeStorage.get('flag')
            ? 'notifications_active'
            : 'notifications_off';
    }

    async toggle(e: Event) {
        const ct = e.currentTarget as Element | null;
        if (ct === null) return;
        const nowFlag = await chromeStorage.get('flag');
        if (nowFlag || await Notification.requestPermission() === 'granted') {
            chromeStorage.set('flag', !nowFlag);
            ct.querySelector('i.material-icons')!.textContent = !nowFlag
                ? 'notifications_active'
                : 'notifications_off';
        }
    }
}

function setMenuDom() {
    document.querySelector('#now_playing_info div.source')!.after(templates.extensionMenu);
    notification.set(document.querySelector('div#ntc_toggle')!);
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

    if (options.notification_music || options.notification_comment) {
        document.querySelector('div#ntc_toggle')?.addEventListener('click', e => notification.toggle(e));
    } else {
        document.querySelector('div#ntc_toggle')!.remove();
    }

    for (const element of qsaMenuLi) {
        document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`)?.addEventListener('click', () => {
            qsCafe.classList.remove(...Array.from(qsaMenuLi, v => `view_${v.dataset.val}`));
            qsCafe.classList.add(`view_${element.dataset.val}`);
        });
    }
}

function setMusicDetail(musicInfo: any) {
    if (options.notification_music) notification.send(musicInfo.title, { icon: musicInfo.thumbnailUrl });

    document.querySelector('div#viewCounter')!.textContent = parseInt(musicInfo.viewCounter).toLocaleString();
    document.querySelector('div#mylistCounter')!.textContent = parseInt(musicInfo.mylistCounter).toLocaleString();
    document.querySelector('div#commentCounter')!.textContent = parseInt(musicInfo.thread.commentCounter).toLocaleString();
    document.querySelector('div#music_description')!.innerHTML = optimizeDescription(musicInfo.description);
}

window.addEventListener('load', main);

// vscのバグ回避のため
export {};
