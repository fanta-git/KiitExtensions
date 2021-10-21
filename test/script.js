$(() => {
	$('.popup-dtl-fn').append(`
		<div class="testBtn" id="testBtn">
			<i class="material-icons">info</i>
		</div>
	`);
	
	
});


$(document).on('click', '#testBtn', (()=>{
	//apidata = (await (await fetch("https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search?q=%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF&targets=title&fields=contentId,title,viewCounter&filters[viewCounter][gte]=10000&_sort=-viewCounter&_offset=0&_limit=3&_context=apiguide")).json())['data'];
	//console.log(apidata);
}));

chrome.runtime.onMessage.addListener((request, sender) => {
	const music_data = JSON.parse(request.data);
	const viewCounter = music_data['viewCounter'];
	const mylistCounter = music_data['mylistCounter'];
	const commentCounter = music_data['thread']['commentCounter'];
	alert(viewCounter);
	//何かの処理
});