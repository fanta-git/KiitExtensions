import { CommentData, ReturnCafeSongWithComment, SelectReasonsWithComment, CafeUser } from "../util/apiTypes";
import { NowPlayingPlayer } from "../util/types";

declare global {
    interface Window {
        cafe_users: {
            comments: CommentData[],
            new_fav_user_ids: number[],
            gesture: { user_gestures: Record<number, string> }
            users: CafeUser[]
        },
        cafe_music: {
            reason: { reasons: SelectReasonsWithComment[] },
            now_playing: ReturnCafeSongWithComment,
            next_song: ReturnCafeSongWithComment,
            now_playing_player: NowPlayingPlayer
        }
    }
}
