window.onload = () => {
	const music_data = document.querySelector('#ext-player').dataset.props;
	if(music_data && JSON.parse(music_data).parentUrl.startsWith('https://cafe.kiite.jp/')){
		const send_data = {type: 'music_data', data: music_data};
		chrome.runtime.sendMessage(send_data);
	}
};