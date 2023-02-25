import { CommentDataType } from "./types";
import type {} from 'typed-query-selector';
import commentItemCreate from "./commentItemCreate";
const COMMENT_MAX = 100;

const updateCommentWindow = (newComments: CommentDataType[]) => {
    document.querySelector('#comments div.contents')!.prepend(commentItemCreate(newComments));
    document.querySelectorAll(`#comments .comment:nth-child(n + ${COMMENT_MAX})`).forEach(e => e.remove());
};

export default updateCommentWindow;
