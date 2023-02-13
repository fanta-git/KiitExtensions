import notice from "./notice";
import * as image from "./imageBase64";

function rotate() {
    const rotateBtn = document.querySelector('div.btn.gesture.rotate')!;
    if (rotateBtn.classList.contains('on')) return;
    rotateBtn.click();
    notice.noticeSend('回りました', {
        icon: image.rotate
    });
}

function sendFav() {
    const favBtn = document.querySelector('div.favorite')!;
    if (favBtn.classList.contains('is_faved')) return;
    favBtn.click()
    notice.noticeSend('お気に入りに追加しました', {
        icon: image.fav
    });
}

const keybordShortcut = { rotate, sendFav };

export default keybordShortcut;
