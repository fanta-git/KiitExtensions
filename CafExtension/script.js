'use strict';

const options = {
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
    Object.assign(options, await storage.get('options') ?? {});
    setMenuDom();

    window.addEventListener('focus', () => notification.close());

    window.addEventListener('beforeunload', () => {
        storage.save();
        notification.close();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log('CHANGED', newValue);
            switch (key) {
                case 'music_data':
                    if (newValue) setMusicDetail(newValue);
                    break;
                case 'options':
                    location.reload();
                    break;
            }
        }
    });

    intervalCallFunc(options.interval_time, observeCafe);
}

async function intervalCallFunc(interval, func) {
    while (true) {
        const res = func();
        await new Promise(r => setTimeout(r, interval));
        await res;
    }
}

const userIcons = new class {
    #userData = {};
    #pool = [];
    #emptyData = {
        avatar_url: "https://kiite.jp/img/icon-user.jpg",
        id: null,
        nickname: "CafeUser",
        user_id: 0,
        user_name: ""
    };

    save(...user_ids) {
        for (const user_id of user_ids) {
            if (this.#userData[user_id] === undefined && !this.#pool.includes(user_id)) this.#pool.push(user_id);
        }
    }

    async load() {
        if (!this.#pool.length) return null;
        const res = await callApi('/api/kiite_users', { user_ids: this.#pool });
        this.add(...res);
        this.#pool.length = 0;
    }

    add(...items) {
        for (const item of items) {
            this.#userData[item.user_id] ??= item;
        }
    }

    get(user_id) {
        return this.#userData?.[user_id] ?? this.#emptyData;
        return this.#emptyData;// ?????????
    }
}

const notification = new class {
    #flag;
    #ntcList = [];

    send(text, opt = {}) {
        if (this.#flag && !document.hasFocus()) {
            const ntcItem = new Notification(text, opt);
            this.#ntcList.push(ntcItem);
        }
    }

    close() {
        for (const item of this.#ntcList) item.close();
    }

    async set(e) {
        this.#flag = await storage.get('ntc_flag') ?? false;
        e.querySelector('.material-icons').textContent = (this.#flag ? 'notifications_active' : 'notifications_off');
    }

    async toggle(e) {
        const ct = e.currentTarget;
        if (this.#flag || await Notification.requestPermission() === 'granted') {
            this.#flag = !this.#flag;
            storage.update('ntc_flag', this.#flag);
            ct.querySelector('.material-icons').textContent = (this.#flag ? 'notifications_active' : 'notifications_off');
        }
    }
}

const storage = new class {
    #pool = {};
    get(key) {
        return new Promise(resolve => (
            chrome.storage.local.get(key, r => {
                console.log('GET', r);
                resolve(r[key]);
            })
        ));
    }

    update(key, value) {
        this.#pool[key] = value;
    }

    save() {
        return new Promise(resolve => (
            chrome.storage.local.set(this.#pool, r => {
                console.log('SET', this.#pool);
                this.#pool = {};
                resolve(r);
            })
        ));
    }
}

async function callApi(url, queryParam = {}, count = 0) {
    const nowtime = Date.now();
    const queryUrl = (Object.keys(queryParam).length ? `?${new URLSearchParams(queryParam)}` : '');
    const stc = callApi.staticVariable ??= { lastCallApi: 0 };
    const apiMinInterval = 1000;
    const apiMaxRetry = 3;

    if (nowtime - stc.lastCallApi < apiMinInterval) {
        stc.lastCallApi += apiMinInterval;
        await new Promise(r => setTimeout(r, stc.lastCallApi - nowtime));
    } else {
        stc.lastCallApi = nowtime;
    }

    const res = await fetch(url + queryUrl);

    if (res.status === 200) {
        const json = await res.json();
        console.log('API', json);
        return json;
    } else {
        if (apiMaxRetry <= count && apiRetry) {
            console.log('Error', { url: url, queryParam: queryParam, res: res });
            throw Error('API????????????????????????????????????');
        } else {
            await new Promise(r => setTimeout(r, 500));
            return await callApi(url, queryParam, count++);
        }
    }
}

function setMenuDom() {
    document.querySelector('#reasons').insertAdjacentHTML('beforebegin', `
        <div id="exmenu">
            <div id="exmenu_list">
                <div data-val="reasons" class="exmenu_item reasons selected">
                    <i class="material-icons">people</i>
                </div>
                <div data-val="music_data" class="exmenu_item info">
                    <i class="material-icons">info</i>
                </div>
                <div data-val="cafe_comments" class="exmenu_item forum">
                    <i class="material-icons">forum</i>
                </div>
            </div>
        </div>
    `);

    document.querySelector('#now_playing_info .source').insertAdjacentHTML('afterend', `
        <div class="ntc_toggle" id="ntc_toggle">
            <i class="material-icons"></i>
        </div>
    `);

    notification.set(document.querySelector('#ntc_toggle'));

    document.querySelector('#reasons').insertAdjacentHTML('afterend', `
        <div id="music_data" class="reason_block">
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
                    ?????????????????????????????????????????????????????????????????????????????????<br>
                    ????????????????????????????????????????????????????????????????????????
                </div>
            </div>
        </div>
        <div id="cafe_comments" class="reason_block">
            <div class="inner">
                <div class="caption">??????????????????</div>
                <div class="comment_list"></div>
            </div>
        </div>
    `);

    document.querySelector('#cafe_menu > ul').insertAdjacentHTML('beforeend', `
        <li data-val="timetable" class="timetable">????????????</li>
    `);

    document.querySelector('#cafe').insertAdjacentHTML('beforeend', `
        <div id="timetable">
            <div class="logo_mini">
                <div class="logo_inner">
                    <img src="/assets/logo.png">
                    <div class="logo_cafe">Cafe</div>
                </div>
            </div>
            <div class="inner">
                <h2>????????????100</h2>
                <div class="exp">
                    Kiite Cafe ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????<br>
                    ?????????????????????????????????Kiite Cafe?????????????????????????????????????????????????????????
                </div>
                <div id="error_message"></div>
                <div id="timetable_list"></div>
            </div>
        </div>
    `);

    const qsCafe = document.querySelector('#cafe');
    const qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li');
    const qsaExmenuLi = document.querySelectorAll('#exmenu_list .exmenu_item');

    qsCafe.classList.add('view_reasons');
    qsCafe.querySelector('#reasons').classList.add('reason_block');

    for (const element of qsaExmenuLi) {
        element.onclick = () => {
            qsCafe.classList.remove(...Array.from(qsaExmenuLi, v => `view_${v.dataset.val}`));
            qsCafe.classList.add(`view_${element.dataset.val}`);
            document.querySelector('#exmenu_list .exmenu_item.selected').classList.remove('selected');
            element.classList.add('selected');
        };
    }

    if (options.notification_music || options.notification_comment) {
        document.querySelector('#ntc_toggle').onclick = e => notification.toggle(e);
    } else {
        document.querySelector('#ntc_toggle').remove();
    }

    for (const element of qsaMenuLi) {
        document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`).onclick = () => {
            qsCafe.classList.remove(...Array.from(qsaMenuLi, v => `view_${v.dataset.val}`));
            qsCafe.classList.add(`view_${element.dataset.val}`);
        };
    }
}

function setMusicDetail(musicInfo) {
    if (options.notification_music) notification.send(musicInfo.title, { icon: musicInfo.thumbnailUrl });

    document.querySelector('#viewCounter').textContent = parseInt(musicInfo.viewCounter).toLocaleString();
    document.querySelector('#mylistCounter').textContent = parseInt(musicInfo.mylistCounter).toLocaleString();
    document.querySelector('#commentCounter').textContent = parseInt(musicInfo.thread.commentCounter).toLocaleString();
    document.querySelector('#music_description').innerHTML = (
        musicInfo.description
            .replace(/<\/?a.*?>/g, '')
            .replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
            .replace(/(?<![\/\w@???])(mylist\/|user\/|series\/|sm|nm|so|ar|nc|co)\d+/g, nicoURL)
            .replace(/(?<![\/\w])[@???](\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
            .replace(/(?<=color:)[^;"]+/g, changeColor)
            .replace(/<font(.*?)>/g, fontToSpan)
            .replace(/<\/font>/g, '</span>')
    );
}

function createTimetableItem(musicData, rotateData, commentData) {
    const stc = createTimetableItem.staticVariable ??= {
        reasonTextPriorityTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>?????????<a class="priority_list" href="" target="_blank">?????????????????????</a>????????????`),
        reasonTextFavTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>?????????<b class="fav">???????????????</b>????????????`),
        reasonTextPlaylistTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>?????????<b class="playlist">??????????????????</b>????????????`),
        reasonTextSpecialTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>?????????<b class="special_list">??????????????????</b>????????????`),
        timetableItemTemplate: new Range().createContextualFragment(`
            <div class="timetable_item" data-timestamp="">
                <div class="bg_black"></div>
                <div class="thumbnail" style=""></div>
                <div class="music_info">
                    <div class="onair">ON AIR</div>
                    <div class="timestamp">**??????</div>
                    <div class="reason">
                        <div class="icon" style=""></div>
                        <div class="text"></div>
                    </div>
                    <div class="title"></div>
                    <div class="artist"><span></span></div>
                    <div class="rotate invisible">
                        <b>???</b>
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
            newNode.querySelector('.reason .text').append(stc.reasonTextFavTemplate.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason').classList.add('invisible');
            break;
        case 'add_playlist':
            newNode.querySelector('.reason .text').append(stc.reasonTextPlaylistTemplate.cloneNode(true));
            if (!options.display_all) newNode.querySelector('.reason').classList.add('invisible');
            break;
        case 'priority_playlist':
            if (musicData.presenter_user_ids?.includes(reason.user_id)) {
                newNode.querySelector('.reason .text').append(stc.reasonTextSpecialTemplate.cloneNode(true));
            } else {
                newNode.querySelector('.reason .text').append(stc.reasonTextPriorityTemplate.cloneNode(true));
                newNode.querySelector('.reason .priority_list').href = `https://kiite.jp/playlist/${reason.list_id}`;
            }

            const reasonCommentUsers = musicData.reasons.filter(v => v.playlist_comment);
            if (reasonCommentUsers.length) {
                const reasonCommentData = [];
                for (const priorityList of reasonCommentUsers) {
                    userIcons.add(priorityList.user);
                    reasonCommentData.push({
                        user_id: priorityList.user_id,
                        text: priorityList.playlist_comment,
                        type: 'priority'
                    });
                }
                newNode.querySelector('.comment_list').append(timetableCommentCreate(reasonCommentData));
                newNode.querySelector('.comment_list').classList.remove('empty');
            }
            break;
    }

    const userIconData = userIcons.get(reason.user_id)
    newNode.querySelector('.reason .icon').style.backgroundImage = `url("${userIconData.avatar_url}")`;
    newNode.querySelector('.reason .user_name').textContent = userIconData.nickname;
    newNode.querySelector('.reason .user_name').href = `https://kiite.jp/user/${userIconData.user_name}`;

    newNode.querySelector('.timetable_item').dataset.timestamp = new Date(musicData.start_time).getTime();
    newNode.querySelector('.timetable_item').dataset.id = musicData.id;
    newNode.querySelector('.thumbnail').style.backgroundImage = `url("${musicData.thumbnail.replace('http://', 'https://')}")`;

    newNode.querySelector('.title').textContent = musicData.title;
    newNode.querySelector('.artist').dataset.artist_id = musicData.artist_id;
    newNode.querySelector('.artist span').textContent = musicData.artist_name;
    newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${musicData.baseinfo.video_id}`;

    if (options.comment_log && commentData?.length) {
        newNode.querySelector('.comment_list').append(timetableCommentCreate(commentData));
        newNode.querySelector('.comment_list').classList.remove('empty');
    }

    newNode.querySelector('.music_info .artist span').onclick = e => {
        callApi('https://cafe.kiite.jp/api/artist/id', { artist_id: e.currentTarget.parentNode.dataset.artist_id }).then(res => {
            window.open(`https://kiite.jp/creator/${res.creator_id}`, '_blank');
        });
    };

    if (options.comment_fold) {
        newNode.querySelector('.comment_tail').onclick = e => {
            if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
                const elementFolded = e.target.closest('.timetable_item').querySelector('.comment_list').classList.contains('folded');
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
                e.target.closest('.timetable_item').querySelector('.comment_list').classList.toggle('folded');
            }
        };
    } else {
        newNode.querySelector('.comment_list').classList.remove('folded');
        newNode.querySelector('.comment_tail').remove();
    }

    if (musicData.new_fav_user_ids?.length) {
        newNode.querySelector('.new_fav').classList.remove('invisible');
        newNode.querySelector('.new_fav > .count').textContent = musicData.new_fav_user_ids.length;
    }

    if (rotateData?.length) {
        const rotate = newNode.querySelector('.rotate');
        rotate.classList.remove('invisible');
        rotate.querySelector('.count').textContent = rotateData.length;
    }
    return newNode;
}

function timetableCommentCreate(dataArr) {
    const stc = timetableCommentCreate.staticVariable ??= {
        timetableCommentTemplate: new Range().createContextualFragment(`
            <div class="comment">
                <div class="comment_icon" style=""></div>
                <div class="comment_text"></div>
            </div>
        `)
    };

    const commentList = document.createDocumentFragment();
    for (const itemData of dataArr) {
        const newNode = stc.timetableCommentTemplate.cloneNode(true);
        newNode.querySelector('.comment_icon').style.backgroundImage = `url("${userIcons.get(itemData.user_id).avatar_url}")`;
        newNode.querySelector('.comment_text').textContent = itemData.text;
        switch (itemData.type) {
            case 'presenter':
                newNode.querySelector('.comment_text').classList.add('presenter');
                break;
            case 'priority':
                newNode.querySelector('.comment_text').classList.add('reason_comment_text');
                break;
        }
        commentList.append(newNode);
    }
    return commentList;
}

function updateTimecounter(timetable) {
    const nowtime = Date.now();
    timetable.querySelectorAll('.timetable_item').forEach((element, index) => {
        if (index) {
            element.classList.remove('onair_now');
        } else {
            element.classList.add('onair_now')
        }
        if (element.querySelector('.timestamp')) {
            element.querySelector('.timestamp').textContent = ((lag) => {
                if (lag < 60) {
                    return `${~~(lag)}??????`;
                } else if (lag < 3600) {
                    return `${~~(lag / 60)}??????`;
                } else if (lag < 86400) {
                    return `${~~(lag / 3600)}?????????`;
                }
                return `${~~(lag / 86400)}??????`;
            })((nowtime - element.dataset.timestamp) / 1000);
        }
    });
}

async function observeCafe() {
    const stc = observeCafe.staticVariable ??= { endtime: null, commentData: {}, obsComment: {} };
    if (stc.endtime === null) {
        const timetableData = await callApi('/api/cafe/timetable', { with_comment: 1, limit: options.timetable_max });
        const rotateHistory = await callApi('/api/cafe/rotate_users', { ids: timetableData.map(e => e.id) });
        stc.commentData = await storage.get('commentData') ?? {};
        stc.commentData[timetableData[0].id] ??= [];

        const timetable = document.createDocumentFragment();
        stc.endtime = new Date(timetableData[0].start_time).getTime() + timetableData[0].msec_duration;

        for (const musicData of timetableData) {
            userIcons.save(musicData.reasons[0].user_id);
            userIcons.save(...musicData.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
            if (stc.commentData[musicData.id] !== undefined) userIcons.save(...stc.commentData[musicData.id].map(e => e.user_id));
        }

        await userIcons.load();

        for (const musicData of timetableData) {
            timetable.append(createTimetableItem(musicData, rotateHistory[musicData.id], stc.commentData[musicData.id]));
        }
        updateTimecounter(timetable);

        document.querySelector('#timetable_list').replaceChildren(timetable);
    } else if (stc.endtime + options.wait_time < Date.now()) {
        const newItem = (await callApi('/api/cafe/timetable', { with_comment: 1, limit: 1 }))[0];
        const lastId = document.querySelector(`#timetable_list .timetable_item:nth-child(${options.timetable_max})`)?.dataset.id;
        stc.endtime = new Date(newItem.start_time).getTime() + newItem.msec_duration;
        stc.commentData[newItem.id] ??= [];
        for (const commentMusicId of Object.keys(stc.commentData)) {
            if (commentMusicId < lastId) delete stc.commentData[commentMusicId];
        }
        userIcons.save(newItem.reasons[0].user_id);
        userIcons.save(...newItem.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
        await userIcons.load();
        document.querySelectorAll(`#timetable_list .timetable_item:nth-child(n + ${options.timetable_max})`).forEach(e => e.remove());
        document.querySelector('#timetable_list').prepend(createTimetableItem(newItem));
        updateTimecounter(document.querySelector('#timetable_list'));
    }

    const qsTimetableFirst = document.querySelector('#timetable_list .timetable_item:first-child');
    if (qsTimetableFirst === null) return null;
    const qsRotate = qsTimetableFirst.querySelector('.rotate');
    const qsNewFav = qsTimetableFirst.querySelector('.new_fav');
    const newFavUserIds = [];
    const gestureRotateUserIds = [];

    for (const element of document.querySelectorAll('#cafe_space .user')) {
        if (element.classList.contains('new_fav')) newFavUserIds.push(element.dataset.user_id);
        if (element.classList.contains('gesture_rotate')) gestureRotateUserIds.push(element.dataset.user_id);
    }

    if (Number(qsNewFav.querySelector('.count').textContent) < newFavUserIds.length) {
        qsNewFav.classList.remove('invisible');
        qsNewFav.querySelector('.count').textContent = newFavUserIds.length;
    }

    if (Number(qsRotate.querySelector('.count').textContent) < gestureRotateUserIds.length) {
        qsRotate.classList.remove('invisible');
        qsRotate.querySelector('.count').textContent = gestureRotateUserIds.length;
    }

    const newComments = [];
    for (const element of document.querySelectorAll('#cafe_space .user')) {
        const commentUserId = element.dataset.user_id;
        const commentText = element.querySelector('.comment').textContent;
        if (stc.obsComment[commentUserId] === undefined) {
            stc.obsComment[commentUserId] = commentText;
        } else if (stc.obsComment[commentUserId] !== commentText) {
            if (commentText) {
                newComments.push({
                    user_id: commentUserId,
                    text: commentText,
                    type: 'user'
                });

                userIcons.save(commentUserId);
            }
            stc.obsComment[commentUserId] = commentText;
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

        stc.commentData[qsTimetableFirst.dataset.id].push(...newComments);

        storage.update('commentData', stc.commentData);

        if (options.comment_log) {
            qsTimetableFirst.querySelector('.comment_list').append(timetableCommentCreate(newComments));
            qsTimetableFirst.querySelector('.comment_list').classList.remove('empty');
        }

        document.querySelector('#cafe_comments .comment_list').prepend(timetableCommentCreate(newComments));
        document.querySelectorAll(`#cafe_comments .comment:nth-child(n + 15)`).forEach(e => e.remove());
    }
}

function changeColor(color) {
    if (!options.color_threshold) return color;

    color = color.trim();

    const blightRatio = (_r, _g, _b) => {
        [_r, _g, _b] = [Math.min(_r / 255, 1), Math.min(_g / 255, 1), Math.min(_b / 255, 1)];

        return (
            (_r <= .3298 ? _r / 12.92 : ((_r + .055) / 1.055) ** 2.4) * .2126 +
            (_g <= .3298 ? _g / 12.92 : ((_g + .055) / 1.055) ** 2.4) * .7512 +
            (_b <= .3298 ? _b / 12.92 : ((_b + .055) / 1.055) ** 2.4) * .0722 +
            .05
        ) / .05
    };

    let r, g, b;

    if (color.startsWith('rgba')) {
        const calc = (rgb, a) => rgb + (255 - rgb) * (1 - a);
        let a;
        [r, g, b, a] = color.match(/(?<=\().*?(?=\))/)[0].split(',').map(Number);
        [r, g, b] = [calc(r, a), calc(g, a), calc(b, a)];
    } else if (color.startsWith('rgb')) {
        [r, g, b] = color.match(/(?<=\().*?(?=\))/)[0].split(',').map(Number);
    } else if (color.startsWith('#')) {
        [r, g, b] = color.match(/[\da-fA-F]{2}/g).map(d => parseInt(d, 16));
    } else {
        const canvas = document.createElement('canvas').getContext('2d');
        canvas.fillStyle = color;
        if (!canvas.fillStyle.startsWith('#')) return 'rgb(255, 255, 255)';
        [r, g, b] = canvas.fillStyle.match(/[\da-fA-F]{2}/g).map(d => parseInt(d, 16));
    }

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

function fontToSpan(match, attributes) {
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

function nicoURL(match, type) {
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

window.onload = main;