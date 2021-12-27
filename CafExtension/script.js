'use strict';

const settings = {
	timetableMax: 100,
	waitTime: 2000,
	intervalTime: 1000,
	endtimeTolerance: 10000,
	colorThreshold: 6,
	commmentFold: true,
	displayReasonAll: true
};

const timetableItemTemplate = new Range().createContextualFragment(`
	<div class="timetable_item" data-timestamp="">
		<div class="bg_black"></div>
		<div class="thumbnail" style=""></div>
		<div class="music_info">
			<div class="onair">ON AIR</div>
			<div class="timestamp">**分前</div>
			<div class="reason">
				<div class="icon" style=""></div>
				<div class="text"></div>
			</div>
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
		<div class="comment_list empty${settings.commmentFold ? ' folded' : ''}"></div>
		<div class="comment_tail${settings.commmentFold ? '' : ' invisible'}">
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

const timetableBrankTemplate = new Range().createContextualFragment(`
	<div class="timetable_item">
		<div class="timetable_brank">
			<i class="material-icons">more_vert</i>
		</div>
	</div>
`);

const reasonTextPriorityTemplate = new Range().createContextualFragment(`
	<a class="user_name" href="" target="_blank"></a>さんの<a class="priority_list" href="" target="_blank">イチ推しリスト</a>の曲です
`);

const reasonTextFavTemplate = new Range().createContextualFragment(`
	<a class="user_name" href="" target="_blank"></a>さんの<b class="fav">お気に入り</b>の曲です
`);

const reasonTextPlaylistTemplate = new Range().createContextualFragment(`
	<a class="user_name" href="" target="_blank"></a>さんの<b class="playlist">プレイリスト</b>の曲です
`);

const reasonTextSpecialTemplate = new Range().createContextualFragment(`
	<a class="user_name" href="" target="_blank"></a>さんの<b class="playlist">特別メニュー</b>の曲です
`);

const timetableDic = JSON.parse(localStorage.timetable ?? '[]'), 
	obsComment = {};
let musicEndtime = parseInt(localStorage.endtime),
	notice_flag = localStorage.ntc_flag === 'true';

window.onload = () => {
	setMenuDom();
	setTimetable();

	chrome.storage.onChanged.addListener((changes, namespace) => {
		for (const [key, {oldValue, newValue}] of Object.entries(changes)) {
			if(key === 'music_data' && !!newValue.videoId){
				setMusicDetail(newValue);
			}
		}
	});
};

let lastCallApi = 0;
async function callApi(url, queryParam = {}) {
	const nowtime = Date.now();
	if(nowtime - lastCallApi < 500){
		lastCallApi += 500;
		await new Promise(r => setTimeout(r, lastCallApi - nowtime));
	}else{
		lastCallApi = nowtime;
	}

	if(Object.keys(queryParam).length){
		url += '?' + new URLSearchParams(queryParam);
	}

	const res = await fetch(url);
	const json = await res.json();
	console.log(json);

	return json;
};

function setMenuDom(){
	document.querySelector('#now_playing_info .source').insertAdjacentHTML('afterend', `
		<div class="rd_toggle" id="rd_toggle">
			<i class="material-icons">info</i>
		</div>
		<div class="ntc_toggle" id="ntc_toggle">
			<i class="material-icons">${notice_flag ? 'notifications_active' : 'notifications_off'}</i>
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
				<h2>選曲履歴100</h2>
				<div class="exp">
					Kiite Cafe にログインしているユーザの、プレイリストやお気に入り、イチ推しリストから自動的に選曲されます<br>
					コメント履歴はあなたがKiite Cafeにログインしている間しか記録されません
				</div>
				<div id="timetable_list"></div>
			</div>
		</div>
	`);

	const qsCafe = document.querySelector('#cafe'),
		qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li'),
		viewclass = Array.from(qsaMenuLi, v => `view_${v.dataset.val}`),
		qsRdIcon = document.querySelector('#rd_toggle .material-icons');

	document.querySelector('#rd_toggle').onclick = () => {
		qsRdIcon.textContent = (qsRdIcon.textContent === 'info') ? 'people' : 'info';
		qsCafe.classList.toggle('view_music_data');
	};

	document.querySelector('#ntc_toggle').onclick = () => {
		Notification.requestPermission();
		notice_flag = !notice_flag;
		localStorage.ntc_flag = (notice_flag ? 'true' : 'false');
		document.querySelector('#ntc_toggle .material-icons').textContent = (notice_flag ? 'notifications_active' : 'notifications_off');
	};

	for(const element of qsaMenuLi){
		document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`).onclick = () => {
			qsCafe.classList.remove(...viewclass);
			qsCafe.classList.add(`view_${element.dataset.val}`);
		};
	};
}

function setMusicDetail(music_info){
	if(notice_flag && !document.hasFocus()){
		Notification.requestPermission().then(() => {
			new Notification(music_info.title);
		});
	}

	document.querySelector('#viewCounter').textContent = parseInt(music_info.viewCounter).toLocaleString();
	document.querySelector('#mylistCounter').textContent = parseInt(music_info.mylistCounter).toLocaleString();
	document.querySelector('#commentCounter').textContent = parseInt(music_info.thread.commentCounter).toLocaleString();
	document.querySelector('#music_description').innerHTML = (
		music_info.description
			.replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@])(mylist|user)\/\d+/g,'<a href="https://www.nicovideo.jp/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@])(sm|nm)\d+/g, '<a href="https://www.nicovideo.jp/watch/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@])nc\d+/g, '<a href="https://commons.nicovideo.jp/material/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@])co\d+/g, '<a href="https://com.nicovideo.jp/community/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w])@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
			.replace(/#[0-9a-fA-F]{6}/g, ((match) => {
				let [r, g, b] = [parseInt(match.substr(1, 2), 16), parseInt(match.substr(3, 2), 16), parseInt(match.substr(5, 2), 16)];
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
				}else if(blightRatio(r, g, b) < settings.colorThreshold){
					[r, g, b] = [r || 1, g || 1, b || 1];
					let top = 255 / Math.min(r, g, b), bottom = 1,mag = (top + bottom)/ 2;

					for(let i = 0; i < 8; i++){
						if(blightRatio(r * mag, g * mag, b * mag) < settings.colorThreshold){
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
}

function setTimetable(){
	const observer = new MutationObserver(addTimetable);

	callApi('/api/cafe/timetable', {with_comment: 1, limit: 100})
		.then(res => timetableCreate(...res))
		.then(timetable => document.querySelector('#timetable_list').append(timetable))
		.then(_ => observer.observe(document.querySelector('#now_playing_info .title'), {childList: true}));
}

function addTimetable(){
	callApi('/api/cafe/now_playing')
		.then(res => timetableCreate(res))
		.then(res => {
			const qsTimetable = document.querySelector('#timetable_list');
			if(qsTimetable.querySelector('.timetable_item:first-child').dataset.id !== res.id){
				qsTimetable.querySelectorAll('.timetable_item:nth-child(n + 100)').forEach(e => {
					e.remove();
				});
				qsTimetable.prepend(res);
			}
			updateTimecounter(qsTimetable);
		});
}

const userData = {};

async function timetableCreate(...dataArr){
	const timetable = document.createDocumentFragment();
	const selection_id = [];
	const add_user_ids = [];
	for(const music_data of dataArr){
		const reason_user_id = music_data.reasons.find(e => e.user_id === music_data.request_user_ids[0]).user_id;
		//music_data.reasons[0].user_idも候補、こっちは多分正確な理由ではないけどスマホ版と同じになる
		if(userData[reason_user_id] !== null && !add_user_ids.includes(reason_user_id)){
			add_user_ids.push(reason_user_id);
		}

		selection_id.push(music_data.id);
	}
	
	if(add_user_ids.length){
		const res = await callApi('/api/kiite_users', {user_ids: add_user_ids});
		for(const user_data of res){
			userData[user_data.user_id] = user_data;
		}
	}
	
	const rotate_history = await callApi('/api/cafe/rotate_users', {ids: selection_id});
	
	for(const music_data of dataArr){
		const reason = music_data.reasons.find(e => e.user_id === music_data.request_user_ids[0]);
		const newNode = document.createDocumentFragment();
		newNode.append(timetableItemTemplate.cloneNode(true));
		
		switch(reason.type){
			case 'favorite':
				newNode.querySelector('.reason .text').append(reasonTextFavTemplate.cloneNode(true));
				if(!settings.displayReasonAll){
					newNode.querySelector('.reason').classList.add('invisible');
				}
				break;
			case 'add_playlist':
				newNode.querySelector('.reason .text').append(reasonTextPlaylistTemplate.cloneNode(true));
				if(!settings.displayReasonAll){
					newNode.querySelector('.reason').classList.add('invisible');
				}
				break;
			case 'priority_playlist':
				newNode.querySelector('.reason .text').append(reasonTextPriorityTemplate.cloneNode(true));
				newNode.querySelector('.reason .priority_list').href = `https://kiite.jp/playlist/${reason.list_id}`;
				break;
			default:
				newNode.querySelector('.reason .text').append(reasonTextSpecialTemplate.cloneNode(true));
				if(!settings.displayReasonAll){
					newNode.querySelector('.reason').classList.add('invisible');
				}
				break;
		}
		
		newNode.querySelector('.timetable_item').dataset.timestamp = new Date(music_data.start_time).getTime();
		newNode.querySelector('.timetable_item').dataset.id = music_data.id;
		newNode.querySelector('.thumbnail').style.backgroundImage = `url("${music_data.thumbnail.replace('http://', 'https://')}")`;
		newNode.querySelector('.reason .icon').style.backgroundImage = `url("${userData[reason.user_id].avatar_url}")`;
		newNode.querySelector('.reason .user_name').textContent = userData[reason.user_id].nickname;
		newNode.querySelector('.reason .user_name').href = `https://kiite.jp/user/${reason.user_id}`;
		newNode.querySelector('.title').textContent = music_data.title;
		newNode.querySelector('.artist').textContent = music_data.artist_name;
		newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${music_data.baseinfo.video_id}`;

		if(!!music_data.new_fav_user_ids?.length){
			newNode.querySelector('.new_fav').classList.remove('invisible');
			newNode.querySelector('.new_fav > .count').textContent = music_data.new_fav_user_ids.length;
		}
		
		if(!!rotate_history[music_data.id]?.length){
			const rotate = newNode.querySelector('.rotate');
			rotate.classList.remove('invisible');
			rotate.querySelector('.count').textContent = rotate_history[music_data.id].length;
		}
		timetable.append(newNode);
	}
	updateTimecounter(timetable);

	return timetable;
}

// function timetableCommentCreate(itemData){
// 	const newNode = timetableCommentTemplate.cloneNode(true);
// 	newNode.querySelector('.comment_icon').style.backgroundImage = `url("${itemData.iconUrl}")`;
// 	newNode.querySelector('.comment_text').textContent = itemData.text;
// 	if(itemData.presenter){
// 		newNode.querySelector('.comment_text').classList.add('presenter');
// 	}
// 	return newNode;
// }

function updateTimecounter(timetable){
	const nowtime = Date.now();
	timetable.querySelectorAll('.timetable_item').forEach((element, index) => {
		if(!!index){
			element.classList.remove('onair_now');
		}else{
			element.classList.add('onair_now')
		}
		if(!!element.querySelector('.timestamp')){
			element.querySelector('.timestamp').textContent = ((lag) => {
				if(lag < 60){
					return ~~(lag) + '秒前';
				}else if(lag < 3600){
					return ~~(lag / 60) + '分前';
				}else if(lag < 86400){
					return ~~(lag / 3600) + '時間前';
				}
				return ~~(lag / 86400) + '日前';
			})((nowtime - element.dataset.timestamp) / 1000);
		}
	});
}