export type Options = {
    comment_fold: boolean;
    display_all: boolean;
    comment_log: boolean;
    notification_music: boolean;
    notification_comment: boolean;
    timetable_max: number;
    wait_time: number;
    interval_time: number;
    color_threshold: number;
};

const options: Options = {
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

export default options;
