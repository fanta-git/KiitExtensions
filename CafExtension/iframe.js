function main() {
    if (document.referrer === 'https://cafe.kiite.jp/') {
        chrome.storage.local.set({
            music_data: JSON.parse(document.querySelector('#ext-player').dataset.props)
        });
    }
};

window.onload = main;
