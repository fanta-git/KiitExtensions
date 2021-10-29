'use strict';

const timetableItemTemplate = new Range().createContextualFragment(`
	<div class="timetable_item" data-timestamp="">
		<div class="bg_black"></div>
		<div class="thumbnail" style=""></div>
		<div class="music_info">
			<div class="onair">ON AIR</div>
			<div class="timestamp">--分前</div>
			<div class="title"></div>
			<div class="artist"></div>
			<div class="rotate invisible">
				<b>回</b>
				<span class="count"></span>
			</div>
			<div class="new_fav invisible">
				<span class="new_fav_icon">
					<i class="material-icons in">favorite</i>
					<i class="material-icons out">favorite</i>
				</span>
				<span class="count"></span>
			</div>
			<div class="source">
				<a href="" target="_brank"><i class="material-icons">open_in_new</i></a>		
			</div>
		</div>
		<div class="comment_list empty folded"></div>
		<div class="comment_tail">
			<i class="material-icons">expand_more</i>
		</div>
	</div>
`);

const timetableCommentTemplate = new Range().createContextualFragment(`
	<div class="comment">
		<div class="comment_icon" style=""></div>
		<div class="comment_text"></div>
	</div>
`);

const timetableBrankTemplate =  new Range().createContextualFragment(`
	<div class="timetable_item">
		<div class="timetable_brank">
			<i class="material-icons">more_vert</i>
		</div>
	</div>
`);

let timetableDic = JSON.parse(localStorage.timetable || '[]');

window.onload = () => {
	document.querySelector('#now_playing_info .inner .source').insertAdjacentHTML('afterend', `
		<div class="rd_toggle" id="rd_toggle">
			<i class="material-icons">info</i>
		</div>
		<div class="ntc_toggle" id="ntc_toggle">
			<i class="material-icons">${localStorage.ntc_flag === 'true' ? 'notifications_active' : 'notifications_off'}</i>
		</div>
	`);

	document.querySelector('#reasons').insertAdjacentHTML('afterend', `
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

	document.querySelector('#cafe_menu > ul').insertAdjacentHTML('beforeend', `
		<li data-val="timetable" class="timetable">選曲履歴</li>
	`);

	document.querySelector('#cafe').insertAdjacentHTML('beforeend', `
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
				<div id="timetable_list"></div>
			</div>
		</div>
	`);

	if(!!timetableDic[0]){
		let timetableListNode = document.createDocumentFragment();
		for(const element of timetableDic){
			timetableListNode.append(timetableItemCreate(element));
		}
		document.querySelector('#timetable_list').append(timetableListNode);
	}

	const qsCafe = document.querySelector('#cafe'),
		qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li'),
		viewclass = Array.from(qsaMenuLi, v => `view_${v.dataset.val}`),
		qsRdIcon = document.querySelector('#rd_toggle .material-icons');

	document.querySelector('#rd_toggle').onclick = () => {
		qsRdIcon.textContent = (qsRdIcon.innerText === 'info') ? 'people' : 'info';
		qsCafe.classList.toggle('view_music_data');
	};

	document.querySelector('#ntc_toggle').onclick = () => {
		Notification.requestPermission();
		localStorage.ntc_flag = (localStorage.ntc_flag === 'true' ? 'false' : 'true');
		document.querySelector('#ntc_toggle .material-icons').innerText = (localStorage.ntc_flag === 'true'? 'notifications_active' : 'notifications_off');
	};

	for(const element of qsaMenuLi){
		document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`).onclick = () => {
			qsCafe.classList.remove(...viewclass);
			qsCafe.classList.add(`view_${element.dataset.val}`);
		};
	};
	

	document.querySelector('#timetable_del').onclick = () => {
		if(confirm('本当に再生履歴を全て削除しますか？')){
			localStorage.timetable = '[]';
			localStorage.endtime = '';
			timetableDic = [];
			for(const element of document.querySelectorAll('#timetable_list .timetable_item')){
				element.remove();
			};
		}
	};

	setTimeout(() => {
		let obsComment = {};
		setInterval(() => {
			const qsaUser = document.querySelectorAll('#cafe_space .user'),
				qsTimetableFirst = document.querySelector('#timetable_list .timetable_item:first-child');
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
						Notification.requestPermission().then(() => {
							new Notification(commentData.text,{ body : commentData.userName });
						});
					}
					qsTimetableFirst.querySelector('.comment_list').append(timetableCommentCreate(commentData));
					qsTimetableFirst.querySelector('.comment_list').classList.remove('empty');
					timetableDic[0].commentList.push(commentData);
					localStorage.timetable = JSON.stringify(timetableDic);
				}
				obsComment[commentData.userId] = commentData.text;
			}
			if(!!newData.gesture_rotate && timetableDic[0].gesture_rotate < newData.gesture_rotate){
				if(!timetableDic[0].gesture_rotate){
					qsTimetableFirst.querySelector('.rotate').classList.remove('invisible');
				}
				qsTimetableFirst.querySelector('.rotate > .count').textContent = newData.gesture_rotate;
				timetableDic[0].gesture_rotate = newData.gesture_rotate;
			}
			if(!!newData.new_fav && timetableDic[0].new_fav < newData.new_fav){
				if(!timetableDic[0].new_fav){
					qsTimetableFirst.querySelector('.new_fav').classList.remove('invisible');
				}
				qsTimetableFirst.querySelector('.new_fav > .count').textContent = newData.new_fav;
				timetableDic[0].new_fav = newData.new_fav;
			}
		}, 1000);
	},3000);
};

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

			let timetableListNode = document.querySelector('#timetable_list').cloneNode(true);

			if(!timetableDic[0] || timetableDic[0].title !== music_data.title){
				timetableDic.unshift({
					timestamp: timestamp_time.getTime(),
					thumbnailId: music_data.thumbnailUrl.split('/')[5],
					title: music_data.title,
					artist: document.querySelector('#now_playing_info .artist span').textContent,
					videoId: music_data.videoId,
					gesture_rotate: 0,
					new_fav: 0,
					commentList: [],
					brank: !!localStorage.endtime && parseInt(localStorage.endtime) + 10000 < timestamp_time.getTime()
				});
				const timetableMax = 100;
				if(timetableMax < timetableDic.length){
					timetableDic.splice(timetableMax, timetableDic.length - timetableMax);
				}

				timetableListNode.prepend(timetableItemCreate(timetableDic[0]));

				if(localStorage.ntc_flag === 'true' && !document.hasFocus()){
					Notification.requestPermission().then(() => {
						new Notification(music_data.title);
					});
				}

				localStorage.timetable = JSON.stringify(timetableDic);
				localStorage.endtime = (timestamp_time.getTime() + (music_data.lengthInSeconds * 1000)) + '';
			}

			timetableListNode.querySelectorAll('.timetable_item').forEach((element, index) => {
				if(index < 100){
					if(!!element.querySelector('.timestamp')){
						element.querySelector('.timestamp').innerText = ((lag) => {
							if(lag < 60){
								return 'すこし前';
							}else if(lag < 3600){
								return parseInt(lag / 60) + '分前';
							}else if(lag < 86400){
								return parseInt(lag / 3600) + '時間前';
							}
							return parseInt(lag / 86400) + '日前';
						})((nowtime - element.dataset.timestamp) / 1000);
					}
					if(!!element.querySelector('.comment_tail')){
						element.querySelector('.comment_tail').onclick = (_this) => {
							_this.target.closest('.timetable_item').querySelector('.comment_list').classList.toggle('folded');
						};
					}
				}else{
					element.remove();
				}
			});

			document.querySelector('#timetable_list').replaceWith(timetableListNode);
		}, 500);
	}
});

function timetableItemCreate(itemData){
	let newNode = document.createDocumentFragment();
	newNode.appendChild(timetableItemTemplate.cloneNode(true));
	newNode.querySelector('.timetable_item').dataset.timestamp = itemData.timestamp;
	newNode.querySelector('.thumbnail').style.backgroundImage = `url('https://nicovideo.cdn.nimg.jp/thumbnails/${itemData.thumbnailId.split('.')[0]}/${itemData.thumbnailId}')`;
	newNode.querySelector('.title').textContent = itemData.title;
	newNode.querySelector('.artist').textContent = itemData.artist;
	newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${itemData.videoId}`;
	if(!!itemData.gesture_rotate){
		newNode.querySelector('.rotate').classList.remove('invisible');
		newNode.querySelector('.rotate > .count').textContent = itemData.gesture_rotate;
	}
	if(!!itemData.new_fav){
		newNode.querySelector('.new_fav').classList.remove('invisible');
		newNode.querySelector('.new_fav > .count').textContent = itemData.new_fav;
	}
	if(!!itemData.commentList[0]){
		newNode.querySelector('.comment_list').classList.remove('empty');
		for(const element of itemData.commentList){
			newNode.querySelector('.comment_list').appendChild(timetableCommentCreate(element));
		}
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