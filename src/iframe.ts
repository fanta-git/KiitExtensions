import chromeStorage from "./util/chromeStorage";

function main() {
    if (document.referrer === 'https://cafe.kiite.jp/') {
        const player = document.querySelector<HTMLDivElement>('#ext-player')!;
        const musicData = JSON.parse(player.dataset.props!);
        chromeStorage.set('musicData', musicData);
    }
};

window.onload = main;

// vscのバグ回避のため
export {};
