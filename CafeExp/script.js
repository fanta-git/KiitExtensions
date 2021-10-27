'use strict';

const timetableItemTemplate = $(`
	<li data-timestamp="">
		<div class="bg_black"></div>
		<div class="thumbnail" style=""></div>
		<div class="music_info">
			<div class="onair">ON AIR</div>
			<div class="timestamp">--分前</div>
			<div class="title"></div>
			<div class="artist"></div>
			<div class="rotate">
				<b>回</b>
				<span class="count"></span>
			</div>
			<div class="new_fav">
				<span class="new_fav_icon">
					<i class="material-icons in">favorite</i>
					<i class="material-icons out">favorite</i>
				</span>
				<span class="count"></span>
			</div>
		</div>
		<div class="comment_list"></div>
		<div class="footer"></div>
		<div class="source">
			<a href="" target="_brank"><i class="material-icons">open_in_new</i></a>		
		</div>
	</li>
`).get(0);

const timetableCommentTemplate = $(`
	<div class="comment">
		<div class="comment_icon" style=""></div>
		<div class="comment_text"></div>
	</div>
`).get(0);

const timetableBrankTemplate = $(`
	<li>
		<div class="timetable_brank">
			<i class="material-icons">more_vert</i>
		</div>
	</li>
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
					再生しても表示されない時は再読み込みしてください
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
					これまで流れた曲とコメントを最大100曲分まで確認することができます<br>
					あなたがKiiteCafeを開いていない時の履歴を確認することはできません
				</div>
				<div id="timetable_del_wrapper">
					<div id="timetable_del">履歴を全て削除</div>
				</div>
				<div id="timetable_list">
					<ul></ul>
				</div>
			</div>
		</div>
	`);

	let timetableListNode = document.createDocumentFragment();
	for(const element of timetableDic){
		timetableListNode.appendChild(timetableItemCreate(element));
	}
	if(!!timetableListNode){
		document.querySelector('#timetable_list > ul').appendChild(timetableListNode);
	}
	
	const qsCafe = document.querySelector('#cafe');
	qsCafe.classList.add('view_reasons');

	setTimeout(() => {
		let obsComment = {};
		setInterval(() => {
			const qsaUser = document.querySelectorAll('#cafe_space .user');
			let newData = {};
			qsaUser.forEach(e => {
				e.classList.forEach(v => {
					newData[v] = (newData[v] || 0) + 1;
				});
			});
			for(const element of qsaUser){
				const commentData = {
					iconName: element.querySelector('.thumbnail').style.backgroundImage.split('"')[1].split('/')[4],
					text: element.querySelector('.comment').textContent,
					userId: element.dataset.user_id,
					userName: element.querySelector('.user_nickname').textContent
				};
				if(obsComment[commentData.userId] !== undefined && !!commentData.text && obsComment[commentData.userId] !== commentData.text){
					if(localStorage.ntc_flag === 'true' && !document.hasFocus()){
						Notification.requestPermission().then(permission => {
							new Notification(commentData.text,{ body : commentData.userName });
						});
					}
					$('#timetable_list > ul > li:first-child > .comment_list').append($(timetableCommentCreate(commentData)));
					timetableDic[0].commentList.push(commentData);
					localStorage.timetable = JSON.stringify(timetableDic);
				}
				obsComment[commentData.userId] = commentData.text;
			}
			if(newData.gesture_rotate && timetableDic[0].gesture_rotate < newData.gesture_rotate){
				timetableDic[0].gesture_rotate = newData.gesture_rotate;
				//DOMの書き換え
				
				console.log('gesture_rotate:', newData.gesture_rotate || 0);
			}
			if(newData.new_fav && timetableDic[0].new_fav < newData.new_fav){
				timetableDic[0].new_fav = newData.new_fav;
				//DOMの書き換え
				console.log('new_fav:', newData.new_fav || 0);
			}
		}, 1000);
	},3000);


	const qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li'),
		viewclass = Array.from(qsaMenuLi, v => `view_${v.dataset.val}`);
	for(const element of qsaMenuLi){
		$(document).on('click', `#cafe_menu > ul > li.${element.dataset.val}`, () => {
			qsCafe.classList.remove(...viewclass);
			qsCafe.classList.add(`view_${element.dataset.val}`);
		});
	};
});

$(document).on("click", "#rd_toggle", () => {
	const qsRdIcon = document.querySelector('#rd_toggle .material-icons'),
		qsCafe = document.querySelector('#cafe');
	
	if(qsRdIcon.innerText === 'info'){
		qsRdIcon.innerText = 'people';
		qsCafe.classList.remove('view_reasons');
		qsCafe.classList.add('view_music_data');
	}else{
		qsRdIcon.innerText = 'info';
		qsCafe.classList.remove('view_music_data');
		qsCafe.classList.add('view_reasons');
	}
});

$(document).on("click", "#ntc_toggle", () => {
	Notification.requestPermission();
	localStorage.ntc_flag = (localStorage.ntc_flag === 'true' ? 'false' : 'true');
	document.querySelector('#ntc_toggle .material-icons').innerText = (localStorage.ntc_flag === 'true'? 'notifications_active' : 'notifications_off');
});

$(document).on("click", "#timetable_del", () => {
	if(confirm('本当に再生履歴を全て削除しますか？')){
		localStorage.timetable = '[]';
		localStorage.endtime = '';
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
		document.querySelector('#viewCounter').innerText = parseInt(music_data.viewCounter).toLocaleString();
		document.querySelector('#mylistCounter').innerText = parseInt(music_data.mylistCounter).toLocaleString();
		document.querySelector('#commentCounter').innerText = parseInt(music_data.thread.commentCounter).toLocaleString();
		document.querySelector('#music_description').innerHTML = (
			music_data.description
				.replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
				.replace(/(?<!https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+)mylist\/\d+/g,'<a href="https://www.nicovideo.jp/$&" target="_blank">$&</a>')
				.replace(/(?<!(https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+|@\w+))(sm|nm)\d+/g, '<a href="https://www.nicovideo.jp/watch/$&" target="_blank">$&</a>')
				.replace(/(?<!(https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+|\w+))@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
				.replace(/#[0-9a-fA-F]{6}/g, ((match) => {
					let [r, g, b] = [parseInt(match.substr(1, 2), 16), parseInt(match.substr(3, 2), 16), parseInt(match.substr(5, 2), 16)];
					const thr = 6;
					const blightRatio = (_r, _g, _b) => {
						[_r, _g, _b] = [Math.min(_r / 255, 1), Math.min(_g / 255, 1), Math.min(_b / 255, 1)];

						return (
							(_r <= .3298 ? _r / 12.92 : ((_r + .055) / 1.055) ** 2.4) * .2126 +
							(_g <= .3298 ? _g / 12.92 : ((_g + .055) / 1.055) ** 2.4) * .7512 +
							(_b <= .3298 ? _b / 12.92 : ((_b + .055) / 1.055) ** 2.4) * .0722 + 
							.05
						)/ .05
					};

					if(r === g && g === b){
						[r, g, b] = [255 - r, 255 - g, 255 - b];
					}else if(blightRatio(r, g, b) < thr){
						[r, g, b] = [r || 1, g || 1, b || 1];
						let top = 255 / Math.min(r, g, b), bottom = 1,mag = (top + bottom)/ 2;

						for(let i = 0; i < 8; i++){
							if(blightRatio(r * mag, g * mag, b * mag) < thr){
								bottom = mag;
							}else{
								top = mag;
							}
							mag = (top + bottom)/ 2;
						}
						[r, g, b] = [Math.min(Math.round(r * mag), 255), Math.min(Math.round(g * mag), 255), Math.min(Math.round(b * mag), 255)]
					}

					return('#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0'));
				}))
		);

		setTimeout(() => {
			const nowtime = Date.now(), 
				loadedtime = new Date(parseInt(music_data.actionTrackId.split('_')[1])), 
				song_position = new Date((1 - parseFloat(document.querySelector('#song_position .position').style.width.slice(0, -1))/ 100) * music_data.lengthInSeconds * 1000), 
				timestamp_time = new Date(loadedtime.getTime() - song_position.getTime());

			if(!timetableDic[0] || timetableDic[0].title !== music_data.title){
				timetableDic.unshift({
					timestamp: timestamp_time.getTime(),
					thumbnailId: music_data.thumbnailUrl.split('/')[5],
					title: music_data.title,
					artist: document.querySelector('#now_playing_info .artist span').textContent,
					videoId: music_data.videoId,
					commentList: [],
					gesture_rotate: 0,
					new_fav: 0,
					brank: !!localStorage.endtime && parseInt(localStorage.endtime) + 10000 < timestamp_time.getTime()
				});
				if(100 < timetableDic.length){
					timetableDic.splice(100, timetableDic.length - 100);
				}

				$('#timetable_list > ul').prepend($(timetableItemCreate(timetableDic[0])));

				if(localStorage.ntc_flag === 'true' && !document.hasFocus()){
					Notification.requestPermission().then((permission) => {
						new Notification(music_data.title);
					});
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
	let newNode = document.createDocumentFragment();
	newNode.appendChild(timetableItemTemplate.cloneNode(true));
	newNode.querySelector('li').dataset.timestamp = itemData.timestamp;
	newNode.querySelector('.thumbnail').style.backgroundImage = `url('https://nicovideo.cdn.nimg.jp/thumbnails/${itemData.thumbnailId.split('.')[0]}/${itemData.thumbnailId}')`;
	newNode.querySelector('.title').textContent = itemData.title;
	newNode.querySelector('.artist').textContent = itemData.artist;
	newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${itemData.videoId}`;
	if(!!itemData.gesture_rotate){
		newNode.querySelector('.rotate').classList.add('show');
		newNode.querySelector('.rotate > .count').textContent = itemData.gesture_rotate;
	}
	if(!!itemData.new_fav){
		newNode.querySelector('.new_fav').classList.add('show');
		newNode.querySelector('.new_fav > .count').textContent = itemData.new_fav;
	}
	for(const element of itemData.commentList){
		newNode.querySelector('.comment_list').appendChild(timetableCommentCreate(element));
	}
	if(itemData.brank){
		newNode.appendChild(timetableBrankTemplate.cloneNode(true));
	}
	return newNode;
}

function timetableCommentCreate(itemData){
	let newNode = timetableCommentTemplate.cloneNode(true);
	let imgUrl;
	if(itemData.iconName === 'icon-user.jpg'){
		imgUrl = 'https://kiite.jp/img/icon-user.jpg';
	}else{
		imgUrl = `https://d7209z8dzwjpy.cloudfront.net/avatar/${itemData.iconName}`;
	}
	newNode.querySelector('.comment_icon').style.backgroundImage = `url('${imgUrl}')`;
	newNode.querySelector('.comment_text').textContent = itemData.text;
	return newNode;
}