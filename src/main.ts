import options from './util/options';
import './scss/main.scss'
import type { ReasonPriorityWithComment, ReturnCafeSong, User } from './util/apiTypes';
import fetchCafeAPI from './util/fetchCafeAPI';
import chromeStorage from './util/chromeStorage';

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
        const ct = e.currentTarget as Element;
        if (ct === null) return;
        const nowFlag = await chromeStorage.get('flag');
        if (nowFlag || await Notification.requestPermission() === 'granted') {
            chromeStorage.set('flag', !nowFlag);
            ct.querySelector('.material-icons')!.textContent = (!nowFlag ? 'notifications_active' : 'notifications_off');
        }
    }
}

function setMenuDom() {
    document.querySelector('#now_playing_info .source')!.insertAdjacentHTML('afterend', `
        <div class="rd_toggle" id="rd_toggle">
            <i class="material-icons">info</i>
        </div>
        <div class="ntc_toggle" id="ntc_toggle">
            <i class="material-icons"></i>
        </div>
    `);

    notification.set(document.querySelector('#ntc_toggle')!);

    document.querySelector('#reasons')!.insertAdjacentHTML('afterend', `
        <div id="music_data">
            <div class="inner">
                <div id="music_detail">
                    <div class="music_detail_items">
                        <i class="material-icons">play_arrow</i>
                        <div id="viewCounter">39,392</div>
                    </div>
                    <div class="music_detail_items">
                        <i class="material-icons">textsms</i>
                        <div id="commentCounter">410</div>
                    </div>
                    <div class="music_detail_items">
                        <i class="material-icons">folder</i>
                        <div id="mylistCounter">804</div>
                    </div>
                </div>
                <div id="music_description">
                    動画を再生すると説明文や再生数などがここに表示されます<br>
                    再生しても表示されない時は再読み込みしてください
                </div>
            </div>
        </div>
    `);

    document.querySelector('#cafe_menu > ul')!.insertAdjacentHTML('beforeend', `
        <li data-val="timetable" class="timetable">選曲履歴</li>
    `);

    document.querySelector('#cafe')!.insertAdjacentHTML('beforeend', `
        <div id="timetable">
            <div class="logo_mini">
                <div class="logo_inner">
                    <img src="/assets/logo.png">
                    <div class="logo_cafe">Cafe</div>
                </div>
            </div>
            <div class="inner">
                <h2>選曲履歴100</h2>
                <div class="exp">
                    Kiite Cafe にログインしているユーザの、プレイリストやお気に入り、イチ推しリストから自動的に選曲されます<br>
                    コメント履歴はあなたがKiite Cafeにログインしている間しか記録されません
                </div>
                <div id="error_message"></div>
                <div id="timetable_list"></div>
            </div>
        </div>
    `);

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
    document.querySelector('#music_description')!.innerHTML = (
        musicInfo.description
            .replace(/<\/?a.*?>/g, '')
            .replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
            .replace(/(?<![\/\w@＠])(mylist\/|user\/|series\/|sm|nm|so|ar|nc|co)\d+/g, nicoURL)
            .replace(/(?<![\/\w])[@＠](\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
            .replace(/(?<=color:)[^;"]+/g, changeColor)
            .replace(/<font(.*?)>/g, fontToSpan)
            .replace(/<\/font>/g, '</span>')
    );
}

function createTimetableItem(musicData: ReturnCafeSong, rotateData: number[], commentData: CommentDataType[]) {
    const stc = (createTimetableItem as any).staticVariable ??= {
        reasonTextPriorityTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<a class="priority_list" href="" target="_blank">イチ推しリスト</a>の曲です`),
        reasonTextFavTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="fav">お気に入り</b>の曲です`),
        reasonTextPlaylistTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="playlist">プレイリスト</b>の曲です`),
        reasonTextSpecialTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="special_list">特別メニュー</b>の曲です`),
        timetableItemTemplate: new Range().createContextualFragment(`
            <div class="timetable_item" data-timestamp="">
                <div class="bg_black"></div>
                <div class="thumbnail" style=""></div>
                <div class="music_info">
                    <div class="onair">ON AIR</div>
                    <div class="timestamp">**分前</div>
                    <div class="reason">
                        <div class="icon" style=""></div>
                        <div class="text"></div>
                    </div>
                    <div class="title"></div>
                    <div class="artist"><span></span></div>
                    <div class="rotate invisible">
                        <b>回</b>
                        <span class="count"></span>
                    </div>
                    <div class="new_fav invisible">
                        <span class="new_fav_icon">
                            <i class="material-icons in">favorite</i>
                            <i class="material-icons out">favorite</i>
                        </span>
                        <span class="count"></span>
                    </div>
                    <div class="source">
                        <a href="" target="_brank"><i class="material-icons">open_in_new</i></a>
                    </div>
                </div>
                <div class="comment_list empty folded"></div>
                <div class="comment_tail">
                    <i class="material-icons">expand_more</i>
                </div>
            </div>
        `)
    };
    const reason = musicData.reasons[0];
    const newNode = document.createDocumentFragment();

    newNode.append(stc.timetableItemTemplate.cloneNode(true));

    switch (reason.type) {
        case 'favorite':
            newNode.querySelector('.reason .text')!.append(stc.reasonTextFavTemplate.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason')!.classList.add('invisible');
            break;
        case 'add_playlist':
            newNode.querySelector('.reason .text')!.append(stc.reasonTextPlaylistTemplate.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason')!.classList.add('invisible');
            break;
        case 'priority_playlist':
            if (musicData.presenter_user_ids?.includes(reason.user_id)) {
                newNode.querySelector('.reason .text')!.append(stc.reasonTextSpecialTemplate.cloneNode(true));
            } else {
                newNode.querySelector('.reason .text')!.append(stc.reasonTextPriorityTemplate.cloneNode(true));
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

const timetableCommentTemplate = new Range().createContextualFragment(`<div class="comment"><div class="comment_icon" style=""></div><div class="comment_text"></div></div>`);
function timetableCommentCreate(dataArr: CommentDataType[]) {
    const commentList = document.createDocumentFragment();
    for (const itemData of dataArr) {
        const newNode = timetableCommentTemplate.cloneNode(true) as Element;
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

function changeColor(color: string) {
    if (!options.color_threshold) return color;
    let [r, g, b] = extractRGB(color.trim());

    if (r === g && g === b) {
        [r, g, b] = [255 - r, 255 - g, 255 - b];
    } else if (blightRatio(r, g, b) < options.color_threshold) {
        [r, g, b] = [r || 1, g || 1, b || 1];
        let top = 255 / Math.min(r, g, b), bottom = 1, mag = (top + bottom) / 2;

        for (let i = 0; i < 8; i++) {
            if (blightRatio(r * mag, g * mag, b * mag) < options.color_threshold) {
                bottom = mag;
            } else {
                top = mag;
            }
            mag = (top + bottom) / 2;
        }
        [r, g, b] = [Math.min(Math.round(r * mag), 255), Math.min(Math.round(g * mag), 255), Math.min(Math.round(b * mag), 255)]
    }

    return `rgb(${r}, ${g}, ${b})`;
}

function extractRGB(color: string) {
    if (color.startsWith('rgba')) {
        const calc = (rgb: number, a: number) => rgb + (255 - rgb) * (1 - a);
        const [r, g, b, a] = color.match(/(?<=\().*?(?=\))/)![0].split(',').map(Number);
        return [calc(r, a), calc(g, a), calc(b, a)];
    }

    if (color.startsWith('rgb')) {
        return color.match(/(?<=\().*?(?=\))/)![0].split(',').map(Number);
    }

    if (color.startsWith('#')) {
        return color.match(/[\da-fA-F]{2}/g)!.map(d => parseInt(d, 16));
    }

    const canvas = document.createElement('canvas').getContext('2d')!;
    canvas.fillStyle = color;
    if (!canvas.fillStyle.startsWith('#')) return [255, 255, 255];
    return canvas.fillStyle.match(/[\da-fA-F]{2}/g)!.map(d => parseInt(d, 16));
}

function blightRatio(r: number, g: number, b: number) {
    [r, g, b] = [Math.min(r / 255, 1), Math.min(g / 255, 1), Math.min(b / 255, 1)];

    return (
        (r <= .3298 ? r / 12.92 : ((r + .055) / 1.055) ** 2.4) * .2126 +
        (g <= .3298 ? g / 12.92 : ((g + .055) / 1.055) ** 2.4) * .7512 +
        (b <= .3298 ? b / 12.92 : ((b + .055) / 1.055) ** 2.4) * .0722 +
        .05
    ) / .05
}

function fontToSpan(match: string, attributes: string) {
    let tag = '<span';
    if (attributes.trim().length) {
        tag += ' style="';
        for (const attr of attributes.trim().split(/(?<=") +/)) {
            const [propaty, value] = attr.replace(/"/g, '').split('=');
            switch (propaty) {
                case 'color':
                    tag += `color: ${changeColor(value)};`;
                    break;
                case 'size':
                    let sizeVal = 0;
                    const sizeToPx = [8, 13, 16, 18, 24, 32, 48];
                    if (value.startsWith('+')) {
                        sizeVal = 3 + Number(value.slice(1));
                    } else if (value.startsWith('-')) {
                        sizeVal = 3 - Number(value.slice(1));
                    } else {
                        sizeVal = Number(value);
                    }
                    if (sizeVal < 1) {
                        sizeVal = 1;
                    } else if (7 < sizeVal) {
                        sizeVal = 7;
                    }
                    tag += `font-size: ${sizeToPx[sizeVal - 1]}px;`;
                    break;
                case 'face':
                    const fonts = value.split(/ *, */);
                    tag += `font-family ${fonts.map(v => "'" + v + "'").join(', ')};`
                    break;
            }
        }
        tag += '">';
    }
    return tag;
}

function nicoURL(match: string, type: string) {
    let url;

    switch (type) {
        case 'mylist/':
        case 'user/':
            url = `https://www.nicovideo.jp/${match}`;
            break;
        case 'series/':
            url = `https://www.nicovideo.jp/${match}`;
            break;
        case 'sm':
        case 'nm':
        case 'so':
            url = `https://www.nicovideo.jp/watch/${match}`;
            break;
        case 'ar':
            url = `https://ch.nicovideo.jp/article/${match}`;
            break;
        case 'nc':
            url = `https://commons.nicovideo.jp/material/${match}`;
            break;
        case 'co':
            url = `https://com.nicovideo.jp/community/${match}`;
            break;
    }

    return `<a href="${url}" target="_blank">${match}</a>`
}

window.addEventListener('load', main);

// vscのバグ回避のため
export {};
