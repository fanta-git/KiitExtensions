import { User } from "./apiTypes";
import fetchCafeAPI from "./fetchCafeAPI";

export const userDataCache = new Map<number, User>();

export async function fetchUserData(userIds: number[]) {
    const userIdsSet = new Set(userIds);
    userDataCache.forEach((_, id) => userIdsSet.delete(id));
    if (userIdsSet.size) return;

    const users = await fetchCafeAPI('/api/kiite_users', { user_ids: [...userIdsSet] });
    for (const user of users) userDataCache.set(user.user_id, user);
}

export async function setUserData(userData: User[]) {
    for (const user of userData) userDataCache.set(user.user_id, user);
}
