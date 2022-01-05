'use strict';

const settings = {
	waitTime: 3000, 
	timetableLength: 100, 
	intervalTime: 1000, 
	colorThreshold: 6, 
	commmentFold: true, 
	displayReasonAll: true, 
	apiLimitInterval: 1000, 
	apiRetry: 3
};

const userData = {};
class poolUserId{
	constructor(){
		this.pool = [];
	}

	add(...user_ids){
		for(const user_id of user_ids){
			if(userData[user_id] === undefined && !this.pool.includes(user_id)){
				this.pool.push(user_id);
			}
		}
	}

	async load(){
		if(!!this.pool.length){
			const res = await callApi('/api/kiite_users', {user_ids: this.pool});
			for(const user_data of res){
				userData[user_data.user_id] = user_data;
			}
		}
		this.pool = [];
	}

	async addAndLoad(...user_ids){
		this.add(...user_ids);
		await this.load();
	}
}

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
			<div class="artist"><span></span></div>
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
	<a class="user_name" href="" target="_blank"></a>さんの<b class="special_list">特別メニュー</b>の曲です
`);

window.onload = () => {
	setMenuDom();

	chrome.storage.onChanged.addListener((changes, namespace) => {
		for (const [key, {oldValue, newValue}] of Object.entries(changes)) {
			if(key === 'music_data' && !!newValue.videoId){
				setMusicDetail(newValue);
			}
		}
	});

	storageGet('commentData').then(res => {
		Object.assign(commentData, res);
		console.log(commentData);
		intervalCallFunc(observeCafe, settings.intervalTime);
	})
};

let lastCallApi = 0;
async function callApi(url, queryParam = {}, count = 0) {
	const nowtime = Date.now();
	const queryUrl = Object.keys(queryParam).length ? '?'+new URLSearchParams(queryParam) : '';

	if(nowtime - lastCallApi < settings.apiLimitInterval){
		lastCallApi += settings.apiLimitInterval;
		await new Promise(r => setTimeout(r, lastCallApi - nowtime));
	}else{
		lastCallApi = nowtime;
	}

	const res = await fetch(url+queryUrl);

	if(res.status === 200){
		const json = await res.json();
		console.log(json);
		return json;
	}else{
		if(settings.apiRetry <= count && !!apiRetry){
			console.error(url+queryParam, res);
			throw new Error('apiの呼び出しに失敗しました');
		}else{
			await new Promise(r => setTimeout(r, 500));
			return await callApi(url, queryParam, count++);
		}
	}
}

function storageGet(key){
	return new Promise(resolve => {
		chrome.storage.local.get(key, r => resolve(r[key]))
	});
}

function storageSet(key, value){
	return new Promise(resolve => {
		chrome.storage.local.set({[key]: value}, resolve)
	});
}

let notice_flag = false;
function setMenuDom(){
	document.querySelector('#now_playing_info .source').insertAdjacentHTML('afterend', `
		<div class="rd_toggle" id="rd_toggle">
			<i class="material-icons">info</i>
		</div>
		<div class="ntc_toggle" id="ntc_toggle">
			<i class="material-icons">${notice_flag ? 'notifications_active' : 'notifications_off'}</i>
		</div>
	`);

	storageGet('ntc_flag').then(res => {
		notice_flag = res;
		document.querySelector('#ntc_toggle .material-icons').textContent = (notice_flag ? 'notifications_active' : 'notifications_off');
	});

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
		storageSet('ntc_flag', notice_flag);
		document.querySelector('#ntc_toggle .material-icons').textContent = (notice_flag ? 'notifications_active' : 'notifications_off');
	};

	for(const element of qsaMenuLi){
		document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`).onclick = () => {
			qsCafe.classList.remove(...viewclass);
			qsCafe.classList.add(`view_${element.dataset.val}`);
		};
	}
}

function setMusicDetail(music_info){
	if(notice_flag && !document.hasFocus()){
		Notification.requestPermission().then(() => {
			new Notification(music_info.title);
		});
	}
	console.log(music_info);

	document.querySelector('#viewCounter').textContent = parseInt(music_info.viewCounter).toLocaleString();
	document.querySelector('#mylistCounter').textContent = parseInt(music_info.mylistCounter).toLocaleString();
	document.querySelector('#commentCounter').textContent = parseInt(music_info.thread.commentCounter).toLocaleString();
	document.querySelector('#music_description').innerHTML = (
		music_info.description
			.replace(/<a.*?>(.*?)<\/a>/, '$1')
			.replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@＠])(mylist|user)\/\d+/g,'<a href="https://www.nicovideo.jp/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@＠])(sm|nm)\d+/g, '<a href="https://www.nicovideo.jp/watch/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@＠])nc\d+/g, '<a href="https://commons.nicovideo.jp/material/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@＠])co\d+/g, '<a href="https://com.nicovideo.jp/community/$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w])[@＠](\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
			.replace(/(?<=color: )[^;"]+/g, changeColor)
			.replace(/<font(.*?)>(.*?)<\/font>/g, delFontTag)
	);
}

function createTimetableItem(music_data, rotate_data = null, comment_data = null){
	// const reasonSearch = data => data.reasons.find(e => e.user_id === data.request_user_ids[0]);
	const reason = music_data.reasons[0];
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
			if(!!music_data.presenter_user_ids?.includes(reason.user_id)){
				newNode.querySelector('.reason .text').append(reasonTextSpecialTemplate.cloneNode(true));
			}else{
				newNode.querySelector('.reason .text').append(reasonTextPriorityTemplate.cloneNode(true));
				newNode.querySelector('.reason .priority_list').href = `https://kiite.jp/playlist/${reason.list_id}`;
			}

			const reason_comment_users = music_data.reasons.filter(v => !!v.playlist_comment);
			if(!!reason_comment_users.length){
				const reason_comment_data = [];
				for(const priority_list of reason_comment_users){
					userData[priority_list.user_id] ??= priority_list.user;
					reason_comment_data.push({
						user_id: priority_list.user_id, 
						text: priority_list.playlist_comment, 
						type: 'priority'
					});
				}
				newNode.querySelector('.comment_list').append(timetableCommentCreate(reason_comment_data));
				newNode.querySelector('.comment_list').classList.remove('empty');
			}
			break;
	}

	newNode.querySelector('.reason .icon').style.backgroundImage = `url("${userData[reason.user_id].avatar_url}")`;
	newNode.querySelector('.reason .user_name').textContent = userData[reason.user_id].nickname;
	newNode.querySelector('.reason .user_name').href = `https://kiite.jp/user/${userData[reason.user_id].user_name}`;

	newNode.querySelector('.timetable_item').dataset.timestamp = new Date(music_data.start_time).getTime();
	newNode.querySelector('.timetable_item').dataset.id = music_data.id;
	newNode.querySelector('.thumbnail').style.backgroundImage = `url("${music_data.thumbnail.replace('http://', 'https://')}")`;
	
	newNode.querySelector('.title').textContent = music_data.title;
	newNode.querySelector('.artist').dataset.artist_id = music_data.artist_id;
	newNode.querySelector('.artist span').textContent = music_data.artist_name;
	newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${music_data.baseinfo.video_id}`;

	if(!!comment_data?.length){
		newNode.querySelector('.comment_list').append(timetableCommentCreate(comment_data));
		newNode.querySelector('.comment_list').classList.remove('empty');
	}

	newNode.querySelector('.music_info .artist span').onclick = _this => {
		callApi('https://cafe.kiite.jp/api/artist/id', {artist_id: _this.target.parentNode.dataset.artist_id}).then(res => {
			window.open('https://kiite.jp/creator/'+res.creator_id, '_blank');
		});
	};

	newNode.querySelector('.comment_tail').onclick = _this => {
		if((_this.ctrlKey && !_this.metaKey) || (!_this.ctrlKey && _this.metaKey)){
			const elementFolded = _this.target.closest('.timetable_item').querySelector('.comment_list').classList.contains('folded');
			if(elementFolded){
				document.querySelectorAll('#timetable_list .comment_list:not(.empty)').forEach(e => {
					e.classList.remove('folded');
				});
			}else{
				document.querySelectorAll('#timetable_list .comment_list:not(.empty)').forEach(e => {
					e.classList.add('folded');
				});
			}
		}else{
			_this.target.closest('.timetable_item').querySelector('.comment_list').classList.toggle('folded');
		}
	};

	if(!!music_data.new_fav_user_ids?.length){
		newNode.querySelector('.new_fav').classList.remove('invisible');
		newNode.querySelector('.new_fav > .count').textContent = music_data.new_fav_user_ids.length;
	}
	
	if(!!rotate_data?.length){
		const rotate = newNode.querySelector('.rotate');
		rotate.classList.remove('invisible');
		rotate.querySelector('.count').textContent = rotate_data.length;
	}
	return newNode;
}

function timetableCommentCreate(dataArr){
	const commentList = document.createDocumentFragment();
	for(const itemData of dataArr){
		const newNode = timetableCommentTemplate.cloneNode(true);
		newNode.querySelector('.comment_icon').style.backgroundImage = `url("${userData[itemData.user_id].avatar_url}")`;
		newNode.querySelector('.comment_text').textContent = itemData.text;
		switch(itemData.type){
			case 'presenter':
				newNode.querySelector('.comment_text').classList.add('presenter');
				break;
			case 'priority':
				newNode.querySelector('.comment_text').classList.add('reason_comment_text');
				break;
		}
		commentList.append(newNode);
	}
	return commentList;
}

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

async function intervalCallFunc(func, interval){
	while(true){
		const funcret = func();
		await new Promise(r => setTimeout(r, interval));
		await funcret;
	}
}

const commentData = {}, obsComment = {};
let endtime = null;
async function observeCafe(){
	if(endtime === null){
		const timetableData = await callApi('/api/cafe/timetable', {with_comment: 1, limit: settings.timetableLength});
		const rotate_history = await callApi('/api/cafe/rotate_users', {ids: timetableData.map(e => e.id)});
		const timetable = document.createDocumentFragment();
		const pool = new poolUserId();
		endtime = new Date(timetableData[0].start_time).getTime() + timetableData[0].msec_duration;
		commentData[timetableData[0].id] ??= [];
		
		for(const music_data of timetableData){
			const reason_user_id = music_data.reasons[0].user_id;
			pool.add(reason_user_id);
			pool.add(...music_data.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
			if(commentData[music_data.id] !== undefined){
				pool.add(...commentData[music_data.id].map(e => e.user_id));
			}
		}
		
		await pool.load();
		
		for(const music_data of timetableData){
			timetable.append(createTimetableItem(music_data, rotate_history[music_data.id], commentData[music_data.id]));
		}
		updateTimecounter(timetable);
		
		document.querySelector('#timetable_list').replaceChildren(timetable);
	}else if(endtime + settings.waitTime < Date.now()){
		const newItem = await callApi('/api/cafe/now_playing');
		const pool = new poolUserId();
		const lastId = document.querySelector(`#timetable_list .timetable_item:nth-child(${settings.timetableLength})`)?.dataset.id;
		endtime = new Date(newItem.start_time).getTime() + newItem.msec_duration;
		commentData[newItem.id] ??= [];
		for(const comment_music_id of Object.keys(commentData)){
			if(comment_music_id < lastId){
				delete commentData[comment_music_id];
			}
		}
		pool.add(newItem.reasons[0].user_id);
		pool.add(...newItem.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
		await pool.load();
		document.querySelectorAll('#timetable_list .timetable_item:nth-child(n + 100)').forEach(e => e.remove());
		document.querySelector('#timetable_list').prepend(createTimetableItem(newItem));
		updateTimecounter(document.querySelector('#timetable_list'));
	}

	const qsTimetableFirst = document.querySelector('#timetable_list .timetable_item:first-child');
	if(qsTimetableFirst === null) return null;
	const qsRotate = qsTimetableFirst.querySelector('.rotate');
	const qsNew_fav = qsTimetableFirst.querySelector('.new_fav');
	const new_fav_user_ids = [];
	const gesture_rotate_user_ids = [];

	for(const element of document.querySelectorAll('#cafe_space .user')){
		if(element.classList.contains('new_fav')){
			new_fav_user_ids.push(element.dataset.user_id);
		}
		if(element.classList.contains('gesture_rotate')){
			gesture_rotate_user_ids.push(element.dataset.user_id);
		}
	}

	if(Number(qsNew_fav.querySelector('.count').textContent) < new_fav_user_ids.length){
		qsNew_fav.classList.remove('invisible');
		qsNew_fav.querySelector('.count').textContent = new_fav_user_ids.length;
	}

	if(Number(qsRotate.querySelector('.count').textContent) < gesture_rotate_user_ids.length){
		qsRotate.classList.remove('invisible');
		qsRotate.querySelector('.count').textContent = gesture_rotate_user_ids.length;
	}

	const newComments = [];
	const music_id = qsTimetableFirst.dataset.id;
	const pool = new poolUserId();
	for(const element of document.querySelectorAll('#cafe_space .user')){
		const comment_user_id = element.dataset.user_id;
		const comment_text = element.querySelector('.comment').textContent;
		if(obsComment[comment_user_id] === undefined){
			obsComment[comment_user_id] = comment_text;
		}else if(obsComment[comment_user_id] !== comment_text){
			if(comment_text !== ''){
				newComments.push({
					user_id: comment_user_id, 
					text: comment_text, 
					type: 'user'
				});
	
				pool.add(comment_user_id);
			}
			obsComment[comment_user_id] = comment_text;
		}
	}

	if(!!newComments.length){
		await pool.load();

		if(notice_flag && !document.hasFocus()){
			Notification.requestPermission().then(() => {
				for(const comment of newComments){
					new Notification(comment.text,{ body : userData[comment.user_id].nickname });
				}
			});
		}

		commentData[music_id].push(...newComments);

		storageSet('commentData', commentData);
		
		qsTimetableFirst.querySelector('.comment_list').append(timetableCommentCreate(newComments));
		qsTimetableFirst.querySelector('.comment_list').classList.remove('empty');
	}
}

function changeColor(color){
	const blightRatio = (_r, _g, _b) => {
		[_r, _g, _b] = [Math.min(_r / 255, 1), Math.min(_g / 255, 1), Math.min(_b / 255, 1)];

		return (
			(_r <= .3298 ? _r / 12.92 : ((_r + .055) / 1.055) ** 2.4) * .2126 +
			(_g <= .3298 ? _g / 12.92 : ((_g + .055) / 1.055) ** 2.4) * .7512 +
			(_b <= .3298 ? _b / 12.92 : ((_b + .055) / 1.055) ** 2.4) * .0722 + 
			.05
		)/ .05
	};

	let r, g, b;
	console.log(color);

	if(color.startsWith('rgba')){
		const calc = (rgb, a) => rgb + (255 - rgb) * (1 - a);
		let a;
		[r, g, b, a] = color.match(/(?<=\().*?(?=\))/)[0].split(',').map(Number);
		[r, g, b] = [calc(r, a), calc(g, a), calc(b, a)];
	}else if(color.startsWith('rgb')){
		[r, g, b] = color.match(/(?<=\().*?(?=\))/)[0].split(',').map(Number);
	}else if(color.startsWith('#')){
		[r, g, b] = color.match(/[\da-fA-F]{2}/g).map(d => parseInt(d, 16));
	}else{
		const canvas = document.createElement('canvas').getContext('2d');
		canvas.fillStyle = color;
		if(!canvas.fillStyle.startsWith('#')){
			return 'rgb(255, 255, 255)'
		}
		[r, g, b] = canvas.fillStyle.match(/[\da-fA-F]{2}/g).map(d => parseInt(d, 16));
	}

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

	return `rgb(${r}, ${g}, ${b})`;
}

function delFontTag(match, attributes, text){
	let style = '';
	if(attributes.search(/[^ ]/) !== -1){
		style = ' style="';
		for(const attr of attributes.trim().split(/(?<=") +/)){
			const [propaty, value] = attr.replace(/"/g, '').split('=');
			switch(propaty){
				case 'color':
					style += `color: ${changeColor(value)};`;
					break;
				case 'size':
					let sizeVal = 0;
					const sizeToPx = [8, 13, 16, 18, 24, 32, 48];
					if(value.startsWith('+')){
						sizeVal = 3 + Number(value.slice(1));
					}else if(value.startsWith('-')){
						sizeVal = 3 - Number(value.slice(1));
					}else{
						sizeVal = Number(value);
					}
					if(sizeVal < 1){
						sizeVal = 1;
					}else if(7 < sizeVal){
						sizeVal = 7;
					}
					style += `font-size: ${sizeToPx[sizeVal - 1]};`;
					break;
				case 'face':
					const fonts = value.split(/ *, */);
					style += `font-family ${fonts.map(v => "'"+v+"'").join(', ')};`
					break;
			}
		}
		style += '"';
	}
	return `<span${style}>${text}</span>`;
}