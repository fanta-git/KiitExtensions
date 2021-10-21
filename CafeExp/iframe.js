$(() => {
	const music_data = $('#ext-player').data('props');
	if(music_data.parentUrl.startsWith('https://cafe.kiite.jp/')){
		const send_data = {type: 'music_data', data: JSON.stringify(music_data)};
		chrome.runtime.sendMessage(send_data);
	}
});