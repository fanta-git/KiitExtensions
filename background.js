chrome.runtime.onMessage.addListener((request, sender) => {
	if(request.type == 'music_data'){
		var send_data = { type: 'music_data', data: request.data };
		chrome.tabs.query({ url : "https://cafe.kiite.jp/*" }, (tabs) => {
			tabs.forEach((element) => {
				chrome.tabs.sendMessage(element.id, send_data);	
			});
		});
		return true;
	}
});