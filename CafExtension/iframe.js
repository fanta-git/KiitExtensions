window.onload = () => {
	if(document.referrer === 'https://cafe.kiite.jp/'){
		const music_data = document.querySelector('#ext-player').dataset.props;
		chrome.storage.local.set({music_data: JSON.parse(music_data)});
	}
};