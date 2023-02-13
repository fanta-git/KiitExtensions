import { ReasonPriorityWithComment, ReturnCafeSongWithComment, User } from "./apiTypes";
import fetchCafeAPI from "./fetchCafeAPI";
import { CommentDataType } from "./types";


export const userDataCache = new Map<number, User>();

export async function fetchUserData(timetableData: ReturnCafeSongWithComment[], commentLog: Record<string, CommentDataType[]>) {
    const existUserData = timetableData
        .flatMap(v => v.reasons.filter((v): v is ReasonPriorityWithComment => v.hasOwnProperty('user')))
        .map(v => v.user);
    for (const user of existUserData) userDataCache.set(user.user_id, user);

    const newUsers = new Set<number>();
    const commentedUserIds = Object.values(commentLog).flat().map(v => v.user_id);
    const topReasonUserIds = timetableData.map(v => v.reasons[0].user_id);
    for (const userId of [...commentedUserIds, ...topReasonUserIds]) {
        if (newUsers.has(userId) || userDataCache.has(userId)) continue;
        newUsers.add(userId);
    }

    const users = await fetchCafeAPI('/api/kiite_users', { user_ids: [...newUsers] });
    for (const user of users) userDataCache.set(user.user_id, user);
}
