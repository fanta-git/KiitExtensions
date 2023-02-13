import { ReasonPriorityWithComment, ReturnCafeSongWithComment } from "./apiTypes";
import { CommentDataType, MouseEventElement } from "./types";
import * as templates from './templates';
import options from "./options";
import notice from "./notice";
import fetchCafeAPI from "./fetchCafeAPI";
import { userDataCache } from "./userDataCache";

const emptyData = {
    avatar_url: "https://kiite.jp/img/icon-user.jpg",
    id: null,
    nickname: "CafeUser",
    user_id: 0,
    user_name: ""
};

export function setTimetable(timetableData: ReturnCafeSongWithComment[], rotateHistory: Record<string, number[]>, commentLog: Record<number, CommentDataType[]>) {
    const timetable = document.createDocumentFragment();

    for (const musicData of timetableData) {
        timetable.appendChild(
            createTimetableItem(musicData, rotateHistory[musicData.id], commentLog[musicData.id])
        );
    }
    updateTimecounter(timetable);

    document.querySelector('div#timetable_list')!.replaceChildren(timetable);
}

export function updateTimetable(newFavs: number[], rotates: number[], newComments: CommentDataType[]) {
    const qsTimetableFirst = document.querySelector('#timetable_list div.timetable_item:first-child');
    if (qsTimetableFirst === null) return null;

    const qsNewFavCount = qsTimetableFirst.querySelector('.new_fav span.count')!;
    if (Number(qsNewFavCount!.textContent) < newFavs.length) {
        qsNewFavCount.parentElement?.classList.remove('invisible');
        qsNewFavCount!.textContent = newFavs.length.toString();
    }

    const qsRotateCount = qsTimetableFirst.querySelector('.rotate span.count')!;
    if (Number(qsRotateCount!.textContent) < rotates.length) {
        qsRotateCount.parentElement?.classList.remove('invisible');
        qsRotateCount!.textContent = rotates.length.toString();
    }

    if (newComments.length) {
        if (options.notification_comment) {
            for (const comment of newComments) {
                const commentUser = userDataCache.get(comment.user_id) ?? emptyData;
                notice.noticeSend(comment.text, { body: commentUser.nickname, icon: commentUser.avatar_url });
            }
        }

        if (options.comment_log) {
            qsTimetableFirst.querySelector('div.comment_list')!.appendChild(timetableCommentCreate(newComments));
            qsTimetableFirst.querySelector('div.comment_list')!.classList.remove('empty');
        }
    }
}

function createTimetableItem(musicData: ReturnCafeSongWithComment, rotateData: number[], commentData: CommentDataType[]) {
    const reason = musicData.reasons[0];
    const newNode = document.createDocumentFragment();

    newNode.appendChild(templates.timetableItem.cloneNode(true));
    const reasonText = newNode.querySelector('.reason div.text')!;

    switch (reason.type) {
        case 'favorite':
            reasonText.appendChild(templates.reasonFav.cloneNode(true));
            if (!options.display_all) newNode.querySelector('div.reason')!.classList.add('invisible');
            break;
        case 'add_playlist':
            reasonText.appendChild(templates.reasonPlaylist.cloneNode(true));
            if (!options.display_all) newNode.querySelector('div.reason')!.classList.add('invisible');
            break;
        case 'priority_playlist':
            if (musicData.presenter_user_ids?.includes(reason.user_id)) {
                reasonText.appendChild(templates.reasonSpecial.cloneNode(true));
            } else {
                reasonText.appendChild(templates.reasonPriority.cloneNode(true));
                newNode.querySelector('.reason a.priority_list')!.href = `https://kiite.jp/playlist/${reason.list_id}`;
            }

            const reasonCommentUsers = musicData.reasons.filter((v): v is ReasonPriorityWithComment => v.hasOwnProperty('user'));
            if (reasonCommentUsers.length) {
                const reasonCommentData: CommentDataType[] = [];
                for (const priorityList of reasonCommentUsers) {
                    reasonCommentData.push({
                        user_id: priorityList.user_id,
                        text: priorityList.playlist_comment,
                        type: 'priority'
                    });
                }
                const commentList = newNode.querySelector('div.comment_list')!;
                commentList.appendChild(timetableCommentCreate(reasonCommentData));
                commentList.classList.remove('empty');
            }
            break;
    }

    const userIconData = userDataCache.get(reason.user_id) ?? emptyData;
    newNode.querySelector('.reason div.icon')!.style.backgroundImage = `url("${userIconData.avatar_url}")`;
    newNode.querySelector('.reason a.user_name')!.textContent = userIconData.nickname;
    newNode.querySelector('.reason a.user_name')!.href = `https://kiite.jp/user/${userIconData.user_name}`;

    newNode.querySelector('div.timetable_item')!.dataset.timestamp = new Date(musicData.start_time).getTime().toString();
    newNode.querySelector('div.timetable_item')!.dataset.id = musicData.id.toString();
    newNode.querySelector('div.thumbnail')!.style.backgroundImage = `url("${musicData.thumbnail.replace('http://', 'https://')}")`;

    newNode.querySelector('div.title')!.textContent = musicData.title;
    newNode.querySelector('div.artist')!.dataset.artist_id = musicData.artist_id?.toString() ?? "";
    newNode.querySelector('.artist span')!.textContent = musicData.artist_name;
    newNode.querySelector('.source > a')!.href = `https://kiite.jp/search/song?keyword=${musicData.baseinfo.video_id}`;

    if (options.comment_log && commentData?.length) {
        const commentList = newNode.querySelector('div.comment_list')!;
        commentList.appendChild(timetableCommentCreate(commentData));
        commentList.classList.remove('empty');
    }

    newNode.querySelector('.music_info .artist span')?.addEventListener('click', {
        handleEvent: async (e: MouseEventElement<HTMLSpanElement>) => {
            const artist = await fetchCafeAPI('/api/artist/id', { artist_id: e.target.parentElement!.dataset.artist_id! });
            window.open(`https://kiite.jp/creator/${artist?.creator_id}`, '_blank');
        }
    }, false);

    if (options.comment_fold) {
        newNode.querySelector('div.comment_tail')?.addEventListener('click', {
            handleEvent: (e: MouseEventElement<HTMLDivElement>) => {
                const timetableItem = e.target!.closest('div.timetable_item')!;
                if (e.ctrlKey !== e.metaKey) {
                    const elementFolded = timetableItem.querySelector('div.comment_list')!.classList.contains('folded');
                    document.querySelectorAll('#timetable_list div.comment_list:not(.empty)').forEach(e => {
                        if (elementFolded) {
                            e.classList.remove('folded');
                        } else {
                            e.classList.add('folded');
                        }
                    });
                } else {
                    timetableItem.querySelector('div.comment_list')!.classList.toggle('folded');
                }
            }
        }, false);
    } else {
        newNode.querySelector('div.comment_list')!.classList.remove('folded');
        newNode.querySelector('div.comment_tail')!.remove();
    }

    if (musicData.new_fav_user_ids?.length) {
        newNode.querySelector('div.new_fav')!.classList.remove('invisible');
        newNode.querySelector('.new_fav > span.count')!.textContent = musicData.new_fav_user_ids.length.toString();
    }

    if (rotateData?.length) {
        newNode.querySelector('div.rotate')!.classList.remove('invisible');
        newNode.querySelector('.rotate > span.count')!.textContent = rotateData.length.toString();
    }
    return newNode;
}

function timetableCommentCreate(dataArr: CommentDataType[]) {
    const commentList = document.createDocumentFragment();
    for (const itemData of dataArr) {
        if (!itemData.text) continue;
        const newNode = templates.commentItem.cloneNode(true) as Element;
        const user = userDataCache.get(itemData.user_id) ?? emptyData;
        newNode.querySelector('div.comment_icon')!.style.backgroundImage = `url("${user.avatar_url}")`;
        newNode.querySelector('div.comment_text')!.textContent = itemData.text;
        const classList = newNode.querySelector('div.comment_text')!.classList;
        switch (itemData.type) {
            case 'presenter':
                classList.add('presenter');
                break;
            case 'priority':
                classList.add('reason_comment_text');
                break;
        }
        commentList.appendChild(newNode);
    }
    return commentList;
}

function updateTimecounter(timetable: DocumentFragment | Element) {
    const nowtime = Date.now();
    timetable.querySelectorAll('div.timetable_item').forEach((element, index) => {
        if (index) {
            element.classList.remove('onair_now');
        } else {
            element.classList.add('onair_now')
        }
        const timestamp = element.querySelector('div.timestamp');
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
