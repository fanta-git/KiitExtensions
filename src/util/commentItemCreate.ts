import { CommentDataType } from "./types";
import * as templates from './templates';
import { userDataCache } from "./userDataCache";

const emptyData = {
    avatar_url: "https://kiite.jp/img/icon-user.jpg",
    id: null,
    nickname: "CafeUser",
    user_id: 0,
    user_name: ""
};

function commentItemCreate(dataArr: CommentDataType[]) {
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

export default commentItemCreate;
