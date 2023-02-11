import options from './util/options';
import './scss/main.scss'
import type { ReasonPriorityWithComment, ReturnCafeSong, User } from './util/apiTypes';
import fetchCafeAPI from './util/fetchCafeAPI';
import chromeStorage from './util/chromeStorage';
import optimizeDescription from './util/optimizeDescription';
import * as templates from './util/templates';

type CommentDataType = {
    user_id: number,
    text: string,
    type: 'user' | 'priority' | 'presenter'
};

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

const userIcons = new class {
    #userData: Record<number, User> = {};
    #pool: number[] = [];
    #emptyData = {
        avatar_url: "https://kiite.jp/img/icon-user.jpg",
        id: null,
        nickname: "CafeUser",
        user_id: 0,
        user_name: ""
    };

    save(...user_ids: number[]) {
        for (const user_id of user_ids) {
            if (this.#userData[user_id] === undefined && !this.#pool.includes(user_id)) this.#pool.push(user_id);
        }
    }

    async load() {
        if (!this.#pool.length) return null;
        const res = await fetchCafeAPI('/api/kiite_users', { user_ids: this.#pool });
        this.add(...res);
        this.#pool.length = 0;
    }

    add(...items: User[]) {
        for (const item of items) {
            this.#userData[item.user_id] ??= item;
        }
    }

    get(user_id: number) {
        return this.#userData?.[user_id] ?? this.#emptyData;
        return this.#emptyData;//撮影用
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
        e.querySelector('.material-icons')!.textContent = await chromeStorage.get('flag')
            ? 'notifications_active'
            : 'notifications_off';
    }

    async toggle(e: Event) {
        const ct = e.currentTarget;
        if (!(ct instanceof Element) || ct === null) return;
        const nowFlag = await chromeStorage.get('flag');
        if (nowFlag || await Notification.requestPermission() === 'granted') {
            chromeStorage.set('flag', !nowFlag);
            ct.querySelector('.material-icons')!.textContent = (!nowFlag ? 'notifications_active' : 'notifications_off');
        }
    }
}

function setMenuDom() {
    document.querySelector('#now_playing_info .source')!.after(templates.extensionMenu);
    notification.set(document.querySelector('#ntc_toggle')!);
    document.querySelector('#reasons')!.after(templates.musicData);
    document.querySelector('#cafe_menu > ul')!.appendChild(templates.timetableLabel);
    document.querySelector('#cafe')!.appendChild(templates.timetable);

    const qsCafe = document.querySelector('#cafe')!;
    const qsaMenuLi = document.querySelectorAll<HTMLLIElement>('#cafe_menu > ul > li');
    const qsRdIcon = document.querySelector('#rd_toggle .material-icons')!;

    document.querySelector('#rd_toggle')?.addEventListener('click', () => {
        qsRdIcon.textContent = (qsRdIcon.textContent === 'info' ? 'people' : 'info');
        qsCafe.classList.toggle('view_music_data');
    });

    if (options.notification_music || options.notification_comment) {
        document.querySelector('#ntc_toggle')?.addEventListener('click', e => notification.toggle(e));
    } else {
        document.querySelector('#ntc_toggle')!.remove();
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

    document.querySelector('#viewCounter')!.textContent = parseInt(musicInfo.viewCounter).toLocaleString();
    document.querySelector('#mylistCounter')!.textContent = parseInt(musicInfo.mylistCounter).toLocaleString();
    document.querySelector('#commentCounter')!.textContent = parseInt(musicInfo.thread.commentCounter).toLocaleString();
    document.querySelector('#music_description')!.innerHTML = optimizeDescription(musicInfo.description);
}

function createTimetableItem(musicData: ReturnCafeSong, rotateData: number[], commentData: CommentDataType[]) {
    const reason = musicData.reasons[0];
    const newNode = document.createDocumentFragment();

    newNode.appendChild(templates.timetableItem.cloneNode(true));

    switch (reason.type) {
        case 'favorite':
            newNode.querySelector('.reason .text')!.appendChild(templates.reasonFav.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason')!.classList.add('invisible');
            break;
        case 'add_playlist':
            newNode.querySelector('.reason .text')!.appendChild(templates.reasonPlaylist.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason')!.classList.add('invisible');
            break;
        case 'priority_playlist':
            if (musicData.presenter_user_ids?.includes(reason.user_id)) {
                newNode.querySelector('.reason .text')!.appendChild(templates.reasonSpecial.cloneNode(true));
            } else {
                newNode.querySelector('.reason .text')!.appendChild(templates.reasonPriority.cloneNode(true));
                newNode.querySelector<HTMLLinkElement>('.reason .priority_list')!.href = `https://kiite.jp/playlist/${reason.list_id}`;
            }

            const reasonCommentUsers = musicData.reasons.filter(v => v.hasOwnProperty('playlist_comment')) as ReasonPriorityWithComment[];
            if (reasonCommentUsers.length) {
                const reasonCommentData: CommentDataType[] = [];
                for (const priorityList of reasonCommentUsers) {
                    userIcons.add(priorityList.user);
                    reasonCommentData.push({
                        user_id: priorityList.user_id,
                        text: priorityList.playlist_comment,
                        type: 'priority'
                    });
                }
                newNode.querySelector('.comment_list')!.append(timetableCommentCreate(reasonCommentData));
                newNode.querySelector('.comment_list')!.classList.remove('empty');
            }
            break;
    }

    const userIconData = userIcons.get(reason.user_id)
    newNode.querySelector<HTMLDivElement>('.reason div.icon')!.style.backgroundImage = `url("${userIconData.avatar_url}")`;
    newNode.querySelector<HTMLLinkElement>('.reason a.user_name')!.textContent = userIconData.nickname;
    newNode.querySelector<HTMLLinkElement>('.reason a.user_name')!.href = `https://kiite.jp/user/${userIconData.user_name}`;

    newNode.querySelector<HTMLDivElement>('div.timetable_item')!.dataset.timestamp = new Date(musicData.start_time).getTime().toString();
    newNode.querySelector<HTMLDivElement>('div.timetable_item')!.dataset.id = musicData.id.toString();
    newNode.querySelector<HTMLDivElement>('div.thumbnail')!.style.backgroundImage = `url("${musicData.thumbnail.replace('http://', 'https://')}")`;

    newNode.querySelector<HTMLDivElement>('div.title')!.textContent = musicData.title;
    newNode.querySelector<HTMLDivElement>('div.artist')!.dataset.artist_id = musicData.artist_id?.toString() ?? "";
    newNode.querySelector<HTMLSpanElement>('.artist span')!.textContent = musicData.artist_name;
    newNode.querySelector<HTMLLinkElement>('.source > a')!.href = `https://kiite.jp/search/song?keyword=${musicData.baseinfo.video_id}`;

    if (options.comment_log && commentData?.length) {
        const commentList = newNode.querySelector<HTMLDivElement>('div.comment_list')!;
        commentList.append(timetableCommentCreate(commentData));
        commentList.classList.remove('empty');
    }

    newNode.querySelector<HTMLSpanElement>('.music_info .artist span')?.addEventListener('click', async e => {
        // TODO: 配置時にaタグとしてつけておくように
        const artist = await fetchCafeAPI('/api/artist/id', { artist_id: (e as any).currentTarget!.parentNode.dataset.artist_id });
        window.open(`https://kiite.jp/creator/${artist?.creator_id}`, '_blank');
    });

    if (options.comment_fold) {
        newNode.querySelector<HTMLDivElement>('div.comment_tail')?.addEventListener('click', e => {
            // TODO: 適切な型付けを
            const timetableItem = (e.target as any).closest('.timetable_item');
            if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
                const elementFolded = timetableItem.querySelector('.comment_list').classList.contains('folded');
                if (elementFolded) {
                    document.querySelectorAll('#timetable_list .comment_list:not(.empty)').forEach(e => {
                        e.classList.remove('folded');
                    });
                } else {
                    document.querySelectorAll('#timetable_list .comment_list:not(.empty)').forEach(e => {
                        e.classList.add('folded');
                    });
                }
            } else {
                timetableItem.querySelector('.comment_list').classList.toggle('folded');
            }
        });
    } else {
        newNode.querySelector<HTMLDivElement>('div.comment_list')!.classList.remove('folded');
        newNode.querySelector<HTMLDivElement>('div.comment_tail')!.remove();
    }

    if (musicData.new_fav_user_ids?.length) {
        newNode.querySelector<HTMLDivElement>('div.new_fav')!.classList.remove('invisible');
        newNode.querySelector<HTMLSpanElement>('.new_fav > span.count')!.textContent = musicData.new_fav_user_ids.length.toString();
    }

    if (rotateData?.length) {
        newNode.querySelector<HTMLDivElement>('div.rotate')!.classList.remove('invisible');
        newNode.querySelector<HTMLSpanElement>('.rotate > span.count')!.textContent = rotateData.length.toString();
    }
    return newNode;
}

function timetableCommentCreate(dataArr: CommentDataType[]) {
    const commentList = document.createDocumentFragment();
    for (const itemData of dataArr) {
        const newNode = templates.commentItem.cloneNode(true);
        if (!(newNode instanceof Element)) continue;
        newNode.querySelector<HTMLDivElement>('div.comment_icon')!.style.backgroundImage = `url("${userIcons.get(itemData.user_id).avatar_url}")`;
        newNode.querySelector<HTMLDivElement>('div.comment_text')!.textContent = itemData.text;
        switch (itemData.type) {
            case 'presenter':
                newNode.querySelector('.comment_text')!.classList.add('presenter');
                break;
            case 'priority':
                newNode.querySelector('.comment_text')!.classList.add('reason_comment_text');
                break;
        }
        commentList.append(newNode);
    }
    return commentList;
}

function updateTimecounter(timetable: DocumentFragment | Element) {
    const nowtime = Date.now();
    timetable.querySelectorAll<HTMLDivElement>('div.timetable_item').forEach((element, index) => {
        if (index) {
            element.classList.remove('onair_now');
        } else {
            element.classList.add('onair_now')
        }
        const timestamp = element.querySelector('.timestamp');
        if (timestamp) {
            const time = Number(element.dataset.timestamp ?? 0);
            timestamp.textContent = getTimestampStr((nowtime - time) / 1000);
        }
    });
}

function getTimestampStr(lag: number) {
    if (lag >= 86400) return `${lag / 86400 | 0}日前`;
    if (lag >= 3600) return `${lag / 3600 | 0}時間前`;
    if (lag >= 60) return `${lag / 60 | 0}分前`;
    return `${lag | 0}秒前`;
}

const observeCafeStc = {
    endtime: null as null | number,
    commentData: {} as Record<string, CommentDataType[]>,
    obsComment: {} as Record<number, string>
};
async function observeCafe() {
    if (observeCafeStc.endtime === null) {
        const timetableData = await fetchCafeAPI('/api/cafe/timetable', { limit: options.timetable_max });
        const rotateHistory = await fetchCafeAPI('/api/cafe/rotate_users', { ids: timetableData.map(e => e.id) });
        observeCafeStc.commentData = await chromeStorage.get('commentData') ?? {};
        observeCafeStc.commentData[timetableData[0].id] ??= [];

        const timetable = document.createDocumentFragment();
        observeCafeStc.endtime = new Date(timetableData[0].start_time).getTime() + timetableData[0].msec_duration;

        for (const musicData of timetableData) {
            userIcons.save(musicData.reasons[0].user_id);
            userIcons.save(...musicData.reasons.filter(e => e.hasOwnProperty('playlist_comment')).map(e => e.user_id));
            if (observeCafeStc.commentData[musicData.id] !== undefined) userIcons.save(...observeCafeStc.commentData[musicData.id].map(e => e.user_id));
        }

        await userIcons.load();

        for (const musicData of timetableData) {
            timetable.append(createTimetableItem(musicData, rotateHistory[musicData.id], observeCafeStc.commentData[musicData.id]));
        }
        updateTimecounter(timetable);

        document.querySelector<HTMLDivElement>('div#timetable_list')!.replaceChildren(timetable);
    } else if (observeCafeStc.endtime + options.wait_time < Date.now()) {
        const newItem = (await fetchCafeAPI('/api/cafe/timetable', { limit: 1 }))[0];
        const lastId = document.querySelector<HTMLDivElement>(`#timetable_list div.timetable_item:nth-child(${options.timetable_max})`)!.dataset.id!;
        observeCafeStc.endtime = new Date(newItem.start_time).getTime() + newItem.msec_duration;
        observeCafeStc.commentData[newItem.id] ??= [];
        for (const commentMusicId of Object.keys(observeCafeStc.commentData)) {
            if (commentMusicId < lastId) delete observeCafeStc.commentData[commentMusicId];
        }
        userIcons.save(newItem.reasons[0].user_id);
        userIcons.save(...newItem.reasons.filter(e => e.hasOwnProperty('playlist_comment')).map(e => e.user_id));
        await userIcons.load();
        document.querySelectorAll<HTMLDivElement>(`#timetable_list div.timetable_item:nth-child(n + ${options.timetable_max})`).forEach(e => e.remove());
        document.querySelector<HTMLDivElement>('div#timetable_list')!.prepend(createTimetableItem(newItem, [], []));
        updateTimecounter(document.querySelector('#timetable_list')!);
    }

    const qsTimetableFirst = document.querySelector<HTMLDivElement>('#timetable_list div.timetable_item:first-child');
    if (qsTimetableFirst === null) return null;
    const qsRotate = qsTimetableFirst.querySelector('.rotate')!;
    const qsNewFav = qsTimetableFirst.querySelector('.new_fav')!;
    const newFavUserIds = [];
    const gestureRotateUserIds = [];

    for (const element of document.querySelectorAll<HTMLDivElement>('#cafe_space div.user')) {
        if (element.classList.contains('new_fav')) newFavUserIds.push(element.dataset.user_id);
        if (element.classList.contains('gesture_rotate')) gestureRotateUserIds.push(element.dataset.user_id);
    }

    if (Number(qsNewFav.querySelector<HTMLSpanElement>('span.count')!.textContent) < newFavUserIds.length) {
        qsNewFav.classList.remove('invisible');
        qsNewFav.querySelector<HTMLSpanElement>('span.count')!.textContent = newFavUserIds.length.toString();
    }

    if (Number(qsRotate.querySelector('.count')!.textContent) < gestureRotateUserIds.length) {
        qsRotate.classList.remove('invisible');
        qsRotate.querySelector('.count')!.textContent = gestureRotateUserIds.length.toString();
    }

    const newComments: CommentDataType[] = [];
    for (const element of document.querySelectorAll<HTMLDivElement>('#cafe_space div.user')) {
        const commentUserId = Number(element.dataset.user_id);
        const commentText = element.querySelector('.comment')!.textContent ?? "";
        if (observeCafeStc.obsComment[commentUserId] === undefined) {
            observeCafeStc.obsComment[commentUserId] = commentText;
        } else if (observeCafeStc.obsComment[commentUserId] !== commentText) {
            if (commentText) {
                newComments.push({
                    user_id: commentUserId,
                    text: commentText,
                    type: 'user'
                });

                userIcons.save(commentUserId);
            }
            observeCafeStc.obsComment[commentUserId] = commentText;
        }
    }

    if (newComments.length) {
        await userIcons.load();

        if (options.notification_comment) {
            for (const comment of newComments) {
                const commentUser = userIcons.get(comment.user_id);
                notification.send(comment.text, { body: commentUser.nickname, icon: commentUser.avatar_url });
            }
        }

        observeCafeStc.commentData[qsTimetableFirst.dataset.id!].push(...newComments);

        chromeStorage.set('commentData', observeCafeStc.commentData);

        if (options.comment_log) {
            qsTimetableFirst.querySelector('.comment_list')!.append(timetableCommentCreate(newComments));
            qsTimetableFirst.querySelector('.comment_list')!.classList.remove('empty');
        }
    }
}

window.addEventListener('load', main);

// vscのバグ回避のため
export {};
