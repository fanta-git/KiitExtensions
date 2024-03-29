import chromeStorage from "./chromeStorage";
import fetchCafeAPI from "./fetchCafeAPI";
import options from "./options";
import { CommentDataType } from "./types";
import type {} from 'typed-query-selector';
import { setTimetable, updateTimetable } from "./timetable";
import notice from "./notice";
import { fetchUserData, userDataCache } from "./userDataCache";

const emptyData = {
    avatar_url: "https://kiite.jp/img/icon-user.jpg",
    id: null,
    nickname: "CafeUser",
    user_id: 0,
    user_name: ""
};

const dammyFunc = () => {};

const commentLog: Record<string, CommentDataType[]> = {};
let endtime: number;
async function observeCafe() {
    Object.assign(commentLog, await chromeStorage.get('commentData') ?? {});
    getCafeData();

    while (true) {
        const timetableData = await fetchCafeAPI('/api/cafe/timetable', { limit: options.timetable_max, with_comment: true });
        const rotateHistory = await fetchCafeAPI('/api/cafe/rotate_users', { ids: timetableData.map(e => e.id) });
        endtime = new Date(timetableData[0].start_time).getTime() + timetableData[0].msec_duration;

        await setTimetable(timetableData, rotateHistory, commentLog);

        const selectionId = timetableData[0].id;
        commentLog[selectionId] ??= [];

        while (Date.now() < endtime + options.wait_time) {
            const { newFavs, rotates, newComments } = getCafeData();
            commentLog[selectionId].push(...newComments);
            chromeStorage.set('commentData', commentLog);

            await fetchUserData(newComments.map(v => v.user_id));
            if (options.original_timetable) {
                // @ts-ignore
                if (Object.hasOwn(window, 'cafe_timetable') && window.cafe_timetable.update !== dammyFunc) window.cafe_timetable.update = dammyFunc;
                await updateTimetable(newFavs, rotates, newComments);
            }

            if (options.notification_comment) {
                for (const comment of newComments) {
                    const commentUser = userDataCache.get(comment.user_id) ?? emptyData;
                    notice.noticeSend(comment.text, { body: commentUser.nickname, icon: commentUser.avatar_url });
                }
            }

            await new Promise(r => setTimeout(r, options.interval_time));
        }
    }
}

const lastComments = new Map<number, string>();
function getCafeData() {
    const qsUsers = Array.from(document.querySelectorAll('#cafe_space div.user'));

    const newFavs = qsUsers.filter(v => v.classList.contains('new_fav')).map(v => Number(v.dataset.user_id!));
    const rotates = qsUsers.filter(v => v.classList.contains('gesture_rotate')).map(v => Number(v.dataset.user_id!));
    const users = qsUsers.map(v => ({
            user_id: Number(v.dataset.user_id),
            text: v.querySelector('div.comment')?.textContent ?? "",
            type: v.classList.contains('presenter') ? ('presenter' as const) : ('user' as const)
        }));
    const newComments = users.filter(v => v.text && v.text !== lastComments.get(v.user_id));

    lastComments.clear();
    for (const comment of users) lastComments.set(comment.user_id, comment.text);

    return { newFavs, rotates, newComments };
}

export default observeCafe;
