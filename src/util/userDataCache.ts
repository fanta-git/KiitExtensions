import { User } from "./apiTypes";
import fetchCafeAPI from "./fetchCafeAPI";


export const userDataCache = new Map<number, User>();

export async function fetchUserData(userIds: number[]) {
    const omited = userIds
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(v => !userDataCache.has(v));

    const users = await fetchCafeAPI('/api/kiite_users', { user_ids: omited });
    for (const user of users) userDataCache.set(user.user_id, user);
}

export async function setUserData(userData: User[]) {
    for (const user of userData) userDataCache.set(user.user_id, user);
}
