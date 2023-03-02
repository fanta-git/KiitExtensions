import chromeStorage from "./chromeStorage";
import { ApiVideoInfo, CommentDataType } from "./types";
import type {} from 'typed-query-selector';
import { ACTIONS, MessageData, MESSAGE_TYPE } from "./postMessage";
import options from "./options";
import notice from "./notice";
import optimizeDescription from "./optimizeDescription";

const commentLog: Record<string, CommentDataType[]> = {};
async function observeCafe() {
    Object.assign(commentLog, await chromeStorage.get('commentData') ?? {});

    const head = document.head;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/embed.js');
    head.appendChild(script);

    window.addEventListener('message', (event: MessageEvent<MessageData>) => {
        if (event.source != window) return;
        console.log(event);
        const { data } = event;
        if (data.type !== MESSAGE_TYPE) return;

        if (data.action === ACTIONS.NOW_PLAYING) {
            setMusicDetail(data.data);
        }
        console.log(event);
    }, false);
}

function setMusicDetail(musicInfo: ApiVideoInfo) {
    if (options.notification_music) notice.noticeSend(musicInfo.title, { icon: musicInfo.thumbnailUrl });

    document.querySelector('div#viewCounter')!.textContent = musicInfo.viewCount.toLocaleString();
    document.querySelector('div#mylistCounter')!.textContent = musicInfo.mylistCount.toLocaleString();
    document.querySelector('div#commentCounter')!.textContent = musicInfo.commentCount.toLocaleString();
    document.querySelector('div#music_description')!.innerHTML = optimizeDescription(musicInfo.description);
}

export default observeCafe;
