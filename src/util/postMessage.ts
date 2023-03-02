import { CommentData, ReturnCafeSongWithComment } from "./apiTypes";
import { ApiVideoInfo, NowPlayingPlayer } from "./types";

export const MESSAGE_TYPE = 'KiitExtentions';
export const ACTIONS = {
    NOW_PLAYING: 'nowPlaying',
    COMMENTS: 'comments',
    NEW_FAVS: 'newFavs',
    GESTURE: 'gesture'
} as const;

export type MessageData = {
    type: typeof MESSAGE_TYPE,
    action: typeof ACTIONS['NOW_PLAYING'],
    data: ApiVideoInfo
} | {
    type: typeof MESSAGE_TYPE,
    action: typeof ACTIONS['COMMENTS'],
    data: CommentData[]
} | {
    type: typeof MESSAGE_TYPE,
    action: typeof ACTIONS['NEW_FAVS'],
    data: number[]
} | {
    type: typeof MESSAGE_TYPE,
    action: typeof ACTIONS['GESTURE'],
    data: Record<number, string>
};
