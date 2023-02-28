import chromeStorage from "./chromeStorage";
import { CommentDataType } from "./types";
import type {} from 'typed-query-selector';

const commentLog: Record<string, CommentDataType[]> = {};
async function observeCafe() {
    Object.assign(commentLog, await chromeStorage.get('commentData') ?? {});

    const head = document.head;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/embed.js');
    head.appendChild(script);
}

export default observeCafe;
