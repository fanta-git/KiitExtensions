function main___() {
    if (document.referrer === 'https://cafe.kiite.jp/') {
        chrome.storage.local.set({
            music_data: JSON.parse((document.querySelector('#ext-player') as any).dataset.props)
        });
    }
};

window.onload = main__;
