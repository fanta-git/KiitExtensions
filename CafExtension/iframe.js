window.onload = () => {
	const music_data = document.querySelector('#ext-player').dataset.props;
	if(music_data && JSON.parse(music_data).parentUrl.startsWith('https://cafe.kiite.jp/')){
		chrome.storage.local.set({music_data: JSON.parse(music_data)});
	}
};