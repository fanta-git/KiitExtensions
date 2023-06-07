export type Options = {
    comment_fold: boolean;
    display_all: boolean;
    comment_log: boolean;
    notification_music: boolean;
    notification_comment: boolean;
    original_timetable: boolean;
    timetable_max: number;
    wait_time: number;
    interval_time: number;
    color_threshold: number;
};

export type CommentDataType = {
    user_id: number;
    text: string;
    type: "user" | "priority" | "presenter";
};

export type NicoEmbedProp = {
    videoWatchId: string,
    videoId: string,
    title: string,
    description: string,
    thumbnailUrl: string,
    firstRetrieve: number,
    lengthInSeconds: number,
    viewCounter: number,
    mylistCounter: number,
    defaultThread: string,
    hasOwnerThread: boolean,
    backCommentMode: number,
    hasLargeThumbnail: boolean,
    isCommunityOnly: boolean,
    isSecureHLS: boolean,
    showAds: boolean,
    playOption: {
        noRelatedVideo: boolean,
        autoplay: boolean,
        mute: boolean,
        defaultNoComment: boolean,
        noLinkToNiconico: boolean,
        noController: boolean,
        noHeader: boolean,
        noTags: boolean,
        noShare: boolean,
        noVideoDetail: boolean,
        allowProgrammaticFullScreen: boolean,
        noIncrementViewCount: boolean,
        persistence: boolean,
        disableAdCheck: boolean,
    },
    tags: string[],
    thread: { id: string, commentCounter: number, groupType: number },
    actionTrackId: string,
    videoUploaderId: number,
    channel: { id: number, name: string, thumbnailUrl: string },
    frontendId: number,
    frontendVersion: string,
    nicovideoServerUrl: string,
    nicovideoSpwebServerUrl: string,
    channelServerUrl: string,
    thumbWatchServerUrl: string,
    flapiServerUrl: string,
    nvapiServerUrl: string,
    extplayervUrl: string,
    nicobusUrl: string,
    adsResUrl: string,
    qaUrl: string,
    isProduction: boolean,
    hasUserSession: boolean,
    isSp: boolean,
    os: { type: number, version: string },
    browser: { type: number, version: string },
    isIPad: boolean,
    androidStandardBrowser: boolean,
    nicosid: string,
    jsApiEnable: boolean,
    fromMs: number,
    parentUrl: string,
    isHttps: boolean,
    izumoSite: string,
    noIncrementViewCountAtFirst: boolean
};

export interface MouseEventElement<T extends HTMLElement> extends MouseEvent  {
    target: T
}
