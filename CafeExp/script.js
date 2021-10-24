let timetableItemTemplate = $(`
	<li data-timestamp="">
		<div class="bg_black"></div>
		<div class="thumbnail" style=""></div>
		<div class="music_info">
			<div class="title_bar">
				<span class="onair">ON AIR</span>
				<span class="timestamp">--分前</span>
				<span class="title"></span>
			</div>
			<span class="artist"></span>
		</div>
		<div class="comment_list"></div>
		<div class="source">
			<a href="" target="_brank"><i class="material-icons">open_in_new</i></a>		
		</div>
	</li>
`).get(0);

let timetableCommentTemplate = $(`
	<div class="comment">
		<div class="comment_icon" style=""></div>
		<div class="comment_text"></div>
	</div>
`).get(0);

let timetableDic = JSON.parse(localStorage.timetable || '[]');

$(() => {
	$('#now_playing_info .inner .source').after(`
		<div class="rd_toggle" id="rd_toggle">
			<i class="material-icons">info</i>
		</div>
		<div class="ntc_toggle" id="ntc_toggle">
			<i class="material-icons">${localStorage.ntc_flag === 'true' ? 'notifications_active' : 'notifications_off'}</i>
		</div>
	`);

	$('#reasons').after(`
		<div id="music_data">
			<div class="inner">
				<div id="music_detail">
					<div class="music_detail_items">
						<i class="material-icons">play_arrow</i>
						<div id="viewCounter">39,392</div>
					</div>
					<div class="music_detail_items">
						<i class="material-icons">textsms</i>
						<div id="commentCounter">410</div>
					</div>
					<div class="music_detail_items">
						<i class="material-icons">folder</i>
						<div id="mylistCounter">804</div>
					</div>
				</div>
				<div id="music_description">
					動画を再生すると説明文や再生数などがここに表示されます<br>
					曲名の右にある人のマークを押すと普段の画面になります
				</div>
			</div>
		</div>
	`);

	$('#cafe_menu > ul').append(`
		<li data-val="timetable" class="timetable">選曲履歴</li>
	`);

	$('#cafe').append(`
		<div id="timetable">
			<div class="logo_mini">
				<div class="logo_inner">
					<img src="/assets/logo.png">
					<div class="logo_cafe">Cafe</div>
				</div>
			</div>
			<div class="inner">
				<h2>選曲履歴</h2>
				<div class="exp">
					これまで流れた曲とコメントを確認することができます<br>
					あなたがKiiteCafeを開いていない時の履歴を確認することはできません
				</div>
				<div id="timetable_del_wrapper">
					<div id="timetable_del">履歴を全て削除</div>
				</div>
				<div id="timetable_list">
				</div>
			</div>
		</div>
	`);

	const timetableListNode = $('<ul></ul>').get(0);
	for(const element of timetableDic){
		timetableListNode.append(timetableItemCreate(element));
	}
	$('#timetable_list').append($(timetableListNode));
	
	document.querySelector('#cafe').classList.add('view_reasons');

	let obsData = {};
	setInterval(() => {
		for(const element of document.querySelectorAll('#cafe_space .user')){
			const commentData = {
				iconName: element.querySelector('.thumbnail').style.backgroundImage.split('"')[1].split('/')[4],
				text: element.querySelector('.comment').textContent,
				userId: element.dataset.user_id,
				userName: element.querySelector('.user_nickname').textContent
			};
			if(!!commentData.text && obsData[commentData.userId] !== commentData.text){  //コメントを記録
				if(localStorage.ntc_flag === 'true' && !document.hasFocus()){
					Notification.requestPermission();
					var notification = new Notification(commentData.text,{ body : commentData.userName });
				}
				$('#timetable_list > ul > li:first-child > .comment_list').append($(timetableCommentCreate(commentData)));
				timetableDic[0].commentList.push(commentData);
				localStorage.timetable = JSON.stringify(timetableDic);
			}
			//for(value of commentData.text.filter(v => !~obsData[commentData.userId].indexOf(v))){};
			obsData[commentData.userId] = commentData.text;
		};
	}, 1000);

	const viewclass = Array.from(document.querySelectorAll('#cafe_menu > ul > li'), v => `view_${v.className}`);
	for(const element of document.querySelectorAll('#cafe_menu > ul > li')){
		$(document).on('click', `#cafe_menu > ul > li.${element.className}`, () => {
			document.querySelector('#cafe').classList.remove(...viewclass);
			document.querySelector('#cafe').classList.add(`view_${element.className}`);
		});
	};
});

$(document).on("click", "#rd_toggle", () => {
	const element = document.querySelector('#rd_toggle .material-icons');
	if(element.innerText === 'info'){
		element.innerText = 'people';
		document.querySelector('#cafe').classList.remove('view_reasons');
		document.querySelector('#cafe').classList.add('view_music_data');
	}else{
		element.innerText = 'info';
		document.querySelector('#cafe').classList.remove('view_music_data');
		document.querySelector('#cafe').classList.add('view_reasons');
	}
});

$(document).on("click", "#ntc_toggle", () => {
	Notification.requestPermission();
	localStorage.ntc_flag = localStorage.ntc_flag === 'true' ? 'false' : 'true';
	document.querySelector('#ntc_toggle .material-icons').innerText = localStorage.ntc_flag === 'true'? 'notifications_active' : 'notifications_off';
});

$(document).on("click", "#timetable_del", () => {
	if(confirm('本当に再生履歴を全て削除しますか？')){
		localStorage.timetable = '[]';
		timetableDic = [];
		for(const element of document.querySelectorAll('#timetable_list > ul > li')){
			element.remove();
		};
	}
});

chrome.runtime.onMessage.addListener((request) => {
	if(request.type === 'music_data'){
		const music_data = JSON.parse(request.data);
		console.log(music_data);
		document.querySelector('#viewCounter').innerText = (
			parseInt(music_data.viewCounter).toLocaleString()
		);
		document.querySelector('#mylistCounter').innerText = (
			parseInt(music_data.mylistCounter).toLocaleString()
		);
		document.querySelector('#commentCounter').innerText = (
			parseInt(music_data.thread.commentCounter).toLocaleString()
		);
		document.querySelector('#music_description').innerHTML = (
			music_data.description
				.replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
				.replace(/(?<!https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+)mylist\/\d+/g,'<a href="https://www.nicovideo.jp/$&" target="_blank">$&</a>')
				.replace(/(?<!(https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+|@\w+))(sm|nm)\d+/g, '<a href="https://www.nicovideo.jp/watch/$&" target="_blank">$&</a>')
				.replace(/(?<!(https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+|\w+))@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
				.replace(/#[0-9a-fA-F]{6}/g, ((match) => {
					let befCol = {};
					befCol = {
						r: parseInt(match.substr(1, 2), 16),
						g: parseInt(match.substr(3, 2), 16),
						b: parseInt(match.substr(5, 2), 16)
					};
					console.log(befCol);
					const aftcol = rgbToHex(changeColor(befCol, 6));
					return aftcol;
				}))
		);

		setTimeout(() => {
			const 
				nowtime = Date.now(), 
				loadedtime = new Date(parseInt(music_data.actionTrackId.split('_')[1])), 
				song_position = new Date((1 - parseFloat(document.querySelector('#song_position .position').style.width.slice(0, -1))/ 100) * music_data.lengthInSeconds * 1000), 
				timestamp_time = new Date(loadedtime.getTime() - song_position.getTime());

			console.log('song_position', 1 - parseFloat(document.querySelector('#song_position .position').style.width.slice(0, -1))/ 100);

			//loadedtime    : ユーザーが曲を再生し始めた時間(日付)
			//song_position : 再生を始めてからの再生時間(時々ずれる、2秒くらい早い Date型だが中身は秒数なので文字列で表示すると変な感じになる)
			//timestamp_time: Cafeで曲が再生されたであろう時間

			//時系列                ||0---\\-----|===============|============|------->未来
			//                     ||    //     |<-曲が再生開始   |<-Cafeに入る |<-流れ終わる
			//loadedtime           || <--\\-----+-------------->|            +
			//song_position        ||    //     |<------------->|            +
			//timestamp_time       || <--\\---->|               +            +
			//localStorage.endtime || <--//-----+---------------+----------->|(処理の最後に代入するので基本的には一つ前の曲からとった数字を扱う)

			if(!!localStorage.endtime){
				console.log(localStorage.endtime + 0, timestamp_time.getTime(), timestamp_time.getTime() - localStorage.endtime);
				if(parseInt(localStorage.endtime) + 10000 < timestamp_time.getTime()){
					$('#timetable_list > ul').prepend(`
						<li>
							<div class="timetable_brank">
								<i class="material-icons">more_vert</i>
							</div>
						</li>
					`);
					timetableDic.unshift({blank: true});
				}
			}

			const lasttitle = document.querySelector('#timetable_list .title');
			if(!lasttitle || lasttitle.innerText !== music_data.title){
				timetableDic.unshift({
					"timestamp": timestamp_time.getTime(),
					"thumbnailId": music_data.thumbnailUrl.split('/')[5],
					"title": music_data.title,
					"artist": document.querySelector('#now_playing_info .artist span').textContent,
					"videoId": music_data.videoId,
					"commentList": []
				});
				if(100 < timetableDic.length){
					timetableDic.splice(100, timetableDic.length - 100);
				}

				$('#timetable_list > ul').prepend($(timetableItemCreate(timetableDic[0])));

				if(localStorage.ntc_flag === 'true' && !document.hasFocus()){
					Notification.requestPermission();
					var notification = new Notification(music_data.title);
				}

				localStorage.timetable = JSON.stringify(timetableDic);
				localStorage.endtime = (timestamp_time.getTime() + (music_data.lengthInSeconds * 1000)) + '';
			}
			
			document.querySelectorAll('#timetable_list > ul > li').forEach((element, index) => {
				if(index < 100){
					if(!!element.querySelectorAll('.timestamp').length){
						element.querySelector('.timestamp').innerText = ((lag_ms) => {
							const lag_s = parseInt(lag_ms / 1000);
							if(lag_s < 3600){
								return parseInt(lag_s / 60) + '分前';
							}
							if(lag_s < 86400){
								return parseInt(lag_s / 3600) + '時間前';
							}
							return parseInt(lag_s / 86400) + '日前';
						})(nowtime - element.dataset.timestamp);
					}
				}else{
					element.remove();
				}
			});
		}, 500);
	}
});

function timetableItemCreate(itemData){
	let newNode = timetableItemTemplate.cloneNode(true);
	newNode.dataset.timestamp = itemData.timestamp;
	newNode.querySelector('.thumbnail').style.backgroundImage = `url('https://nicovideo.cdn.nimg.jp/thumbnails/${itemData.thumbnailId.split('.')[0]}/${itemData.thumbnailId}')`;
	newNode.querySelector('.title').textContent = itemData.title;
	newNode.querySelector('.artist').textContent = itemData.artist;
	newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${itemData.videoId}`;
	for(const element of itemData.commentList){
		newNode.querySelector('.comment_list').appendChild(timetableCommentCreate(element));
	}
	return newNode;
}

function timetableCommentCreate(itemData){
	let newNode = timetableCommentTemplate.cloneNode(true);
	newNode.querySelector('.comment_icon').style.backgroundImage = `url('https://d7209z8dzwjpy.cloudfront.net/avatar/${itemData.iconName}')`;
	newNode.querySelector('.comment_text').textContent = itemData.text;
	return newNode;
}

function changeColor(textRGB, thr = 7) {  //ニコニコは白背景、Kiiteは黒背景で文字色そのままに動画説明文を載せると読みにくいためそれを直す
	let {r, g, b} = textRGB;
	const blightRatio = (_r, _g, _b) => {  //#000000とのコントラストを返す関数 https://lifehackdev.com/ZakkiBlog/articles/detail/web15
		_r = Math.min(_r / 255, 1);
		_g = Math.min(_g / 255, 1);
		_b = Math.min(_b / 255, 1);

		return (
			(_r <= .3298 ? _r / 12.92 : ((_r + .055) / 1.055) ** 2.4) * .2126 +
			(_g <= .3298 ? _g / 12.92 : ((_g + .055) / 1.055) ** 2.4) * .7512 +
			(_b <= .3298 ? _b / 12.92 : ((_b + .055) / 1.055) ** 2.4) * .0722 + 
			.05
		)/ .05
	};

	if(r === g && g === b){  //グレー系は反転だけして返す
		return { r: 255 - r, g: 255 - g, b: 255 - b };
	}

	if(thr <= blightRatio(r, g, b)){  //コントラストが閾値以上ならそのまま返す
		return { r: r, g: g, b: b };
	}

	r = r || 1;  //0なら1にする
	g = g || 1;
	b = b || 1;

	let top = 255 / Math.min(r, g, b), bottom = 1, mag = (top + bottom)/ 2;

	for(let i = 0; i < 8; i++){  //コントラストの逆算は怠いので二分探索のノリで出す
		if(blightRatio(r * mag, g * mag, b * mag) < thr){
			bottom = mag;
		}else{
			top = mag;
		}
		mag = (top + bottom)/ 2;
	}

	return {
		r: Math.min(Math.round(r * mag), 255), 
		g: Math.min(Math.round(g * mag), 255), 
		b: Math.min(Math.round(b * mag), 255)
	};
}

function rgbToHex(color){
	const {r, g, b} = color;
	return(
		'#' + 
		(r || 0).toString(16).padStart(2, '0') + 
		(g || 0).toString(16).padStart(2, '0') + 
		(b || 0).toString(16).padStart(2, '0')
	);
}