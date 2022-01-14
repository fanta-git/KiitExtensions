'use strict';

const options = {
	comment_fold: false, 
	display_all: true, 
	comment_log: true, 
	notification_music: true, 
	notification_comment: true, 
	timetable_max: 100, 
	wait_time: 3000, 
	interval_time: 1000, 
	color_threshold: 6, 
};

window.onload = () => {
	storageGet('options').then(optRes => {
		Object.assign(options, optRes ?? {});
		setMenuDom();

		window.addEventListener('focus', _ => notification.close());

		chrome.storage.onChanged.addListener((changes, namespace) => {
			for (const [key, {oldValue, newValue}] of Object.entries(changes)) {
				console.log('CHANGED', newValue);
				switch(key){
					case 'music_data':
						if(newValue) setMusicDetail(newValue);
						break;
					case 'options':
						location.reload();
						break;
				}
			}
		});

		intervalCallFunc(options.interval_time, observeCafe);
	});
};

async function intervalCallFunc(interval, func){
	while(true){
		const funcret = func();
		await new Promise(r => setTimeout(r, interval));
		await funcret;
	}
}

const userIcons = new class {
	constructor(){
		this.userData = {};
		this.pool = [];
	}

	save(...user_ids){
		for(const user_id of user_ids){
			if(this.userData[user_id] === undefined && !this.pool.includes(user_id)) this.pool.push(user_id);
		}
	}

	async load(){
		if(this.pool.length){
			const res = await callApi('/api/kiite_users', {user_ids: this.pool});
			this.add(...res);
		}
		this.pool.length = 0;
	}

	add(...items){
		for(const item of items){
			this.userData[item.user_id] ??= item;
		}
	}

	get(user_id){
		const dammy = {
			avatar_url: "https://kiite.jp/img/icon-user.jpg", 
			id: null, 
			nickname: "???", 
			user_id: 0, 
			user_name: ""
		};
		return this.userData?.[user_id] ?? dammy;
	}
}

const notification = new class {
	flag;
	constructor(){
		this.ntcList = [];
	}

	send(text, opt = {}){
		if(this.flag && !document.hasFocus()){
			const ntcItem = new Notification(text, opt);
			this.ntcList.push(ntcItem);
		}
	}

	close(){
		for(const item of this.ntcList) item.close();
	}

	set(e){
		storageGet('ntc_flag').then(res => {
			this.flag = res ?? false;
			e.querySelector('.material-icons').textContent = (this.flag ? 'notifications_active' : 'notifications_off');
		});
	}

	toggle(e){
		const ct = e.currentTarget;
		
		Notification.requestPermission().then(res => {
			if(res === 'granted' || this.flag){
				this.flag = !this.flag;
				storageSet('ntc_flag', this.flag);
				ct.querySelector('.material-icons').textContent = (this.flag ? 'notifications_active' : 'notifications_off');
			}
		});
	}
}

async function callApi(url, queryParam = {}, count = 0) {
	const nowtime = Date.now();
	const queryUrl = Object.keys(queryParam).length ? '?'+new URLSearchParams(queryParam) : '';
	const stc = (callApi.stc ??= {lastCallApi: 0});
	const api_min_interval = 1000;
	const api_max_retry = 3;

	if(nowtime - stc.lastCallApi < api_min_interval){
		stc.lastCallApi += api_min_interval;
		await new Promise(r => setTimeout(r, stc.lastCallApi - nowtime));
	}else{
		stc.lastCallApi = nowtime;
	}

	const res = await fetch(url+queryUrl);

	if(res.status === 200){
		const json = await res.json();
		console.log('API', json);
		return json;
	}else{
		if(api_max_retry <= count && apiRetry){
			console.log('Error', {url: url, queryParam: queryParam, res: res});
			throw Error('APIの読み込みに失敗しました');
		}else{
			await new Promise(r => setTimeout(r, 500));
			return await callApi(url, queryParam, count++);
		}
	}
}

function storageGet(key){
	return new Promise(resolve => (
		chrome.storage.local.get(key, r => {
			console.log('GET', r), resolve(typeof key === 'object' ? r: r[key])
		})
	));
}

function storageSet(key, value){
	return new Promise(resolve => (
		chrome.storage.local.set({[key]: value}, r => {
			console.log('SET', {[key]: value});
			resolve(r);
		})
	));
}

function setMenuDom(){
	document.querySelector('#now_playing_info .source').insertAdjacentHTML('afterend', `
		<div class="rd_toggle" id="rd_toggle">
			<i class="material-icons">info</i>
		</div>
		<div class="ntc_toggle" id="ntc_toggle">
			<i class="material-icons"></i>
		</div>
	`);

	notification.set(document.querySelector('#ntc_toggle'));

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

	const qsCafe = document.querySelector('#cafe');
	const qsaMenuLi = document.querySelectorAll('#cafe_menu > ul > li');
	const viewclass = Array.from(qsaMenuLi, v => `view_${v.dataset.val}`);
	const qsRdIcon = document.querySelector('#rd_toggle .material-icons');

	document.querySelector('#rd_toggle').onclick = () => {
		qsRdIcon.textContent = (qsRdIcon.textContent === 'info') ? 'people' : 'info';
		qsCafe.classList.toggle('view_music_data');
	};

	if(options.notification_music || options.notification_comment){
		document.querySelector('#ntc_toggle').onclick = e => notification.toggle(e);
	}else{
		document.querySelector('#ntc_toggle').remove();
	}

	for(const element of qsaMenuLi){
		document.querySelector(`#cafe_menu > ul > li.${element.dataset.val}`).onclick = () => {
			qsCafe.classList.remove(...viewclass);
			qsCafe.classList.add(`view_${element.dataset.val}`);
		};
	}
}

function setMusicDetail(music_info){
	if(options.notification_music) notification.send(music_info.title, { icon: music_info.thumbnailUrl });

	document.querySelector('#viewCounter').textContent = parseInt(music_info.viewCounter).toLocaleString();
	document.querySelector('#mylistCounter').textContent = parseInt(music_info.mylistCounter).toLocaleString();
	document.querySelector('#commentCounter').textContent = parseInt(music_info.thread.commentCounter).toLocaleString();
	document.querySelector('#music_description').innerHTML = (
		music_info.description
			.replace(/<a.*?>(.*?)<\/a>/, '$1')
			.replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
			.replace(/(?<![\/\w@＠])(mylist\/|user\/|series\/|sm|nm|so|nc|co)\d+/g, nicoURL)
			.replace(/(?<![\/\w])[@＠](\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
			.replace(/(?<=color:)[^;"]+/g, changeColor)
			.replace(/<font(.*?)>(.*?)<\/font>/g, delFontTag)
	);
}

function createTimetableItem(music_data, rotate_data, comment_data){
	const stc = (createTimetableItem.stc ??= {
		reasonTextPriorityTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<a class="priority_list" href="" target="_blank">イチ推しリスト</a>の曲です`),
		reasonTextFavTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="fav">お気に入り</b>の曲です`),
		reasonTextPlaylistTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="playlist">プレイリスト</b>の曲です`),
		reasonTextSpecialTemplate: new Range().createContextualFragment(`<a class="user_name" href="" target="_blank"></a>さんの<b class="special_list">特別メニュー</b>の曲です`), 
		timetableItemTemplate: new Range().createContextualFragment(`
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
				<div class="comment_list empty folded"></div>
				<div class="comment_tail">
					<i class="material-icons">expand_more</i>
				</div>
			</div>
		`)
	});
	const reason = music_data.reasons[0];
	const newNode = document.createDocumentFragment();

	newNode.append(stc.timetableItemTemplate.cloneNode(true));
	
	switch(reason.type){
		case 'favorite':
			newNode.querySelector('.reason .text').append(stc.reasonTextFavTemplate.cloneNode(true));
			if(!options.display_all) newNode.querySelector('.reason').classList.add('invisible');
			break;
		case 'add_playlist':
			newNode.querySelector('.reason .text').append(stc.reasonTextPlaylistTemplate.cloneNode(true));
			if(!options.display_all) newNode.querySelector('.reason').classList.add('invisible');
			break;
		case 'priority_playlist':
			if(music_data.presenter_user_ids?.includes(reason.user_id)){
				newNode.querySelector('.reason .text').append(stc.reasonTextSpecialTemplate.cloneNode(true));
			}else{
				newNode.querySelector('.reason .text').append(stc.reasonTextPriorityTemplate.cloneNode(true));
				newNode.querySelector('.reason .priority_list').href = `https://kiite.jp/playlist/${reason.list_id}`;
			}

			const reason_comment_users = music_data.reasons.filter(v => v.playlist_comment);
			if(reason_comment_users.length){
				const reason_comment_data = [];
				for(const priority_list of reason_comment_users){
					userIcons.add(priority_list.user)
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

	const userIconData = userIcons.get(reason.user_id)
	newNode.querySelector('.reason .icon').style.backgroundImage = `url("${userIconData.avatar_url}")`;
	newNode.querySelector('.reason .user_name').textContent = userIconData.nickname;
	newNode.querySelector('.reason .user_name').href = `https://kiite.jp/user/${userIconData.user_name}`;

	newNode.querySelector('.timetable_item').dataset.timestamp = new Date(music_data.start_time).getTime();
	newNode.querySelector('.timetable_item').dataset.id = music_data.id;
	newNode.querySelector('.thumbnail').style.backgroundImage = `url("${music_data.thumbnail.replace('http://', 'https://')}")`;
	
	newNode.querySelector('.title').textContent = music_data.title;
	newNode.querySelector('.artist').dataset.artist_id = music_data.artist_id;
	newNode.querySelector('.artist span').textContent = music_data.artist_name;
	newNode.querySelector('.source > a').href = `https://kiite.jp/search/song?keyword=${music_data.baseinfo.video_id}`;

	if(options.comment_log && comment_data?.length){
		newNode.querySelector('.comment_list').append(timetableCommentCreate(comment_data));
		newNode.querySelector('.comment_list').classList.remove('empty');
	}

	newNode.querySelector('.music_info .artist span').onclick = e => {
		callApi('https://cafe.kiite.jp/api/artist/id', {artist_id: e.target.parentNode.dataset.artist_id}).then(res => {
			window.open('https://kiite.jp/creator/'+res.creator_id, '_blank');
		});
	};

	if(options.comment_fold){
		newNode.querySelector('.comment_tail').onclick = e => {
			if((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)){
				const elementFolded = e.target.closest('.timetable_item').querySelector('.comment_list').classList.contains('folded');
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
				e.target.closest('.timetable_item').querySelector('.comment_list').classList.toggle('folded');
			}
		};
	}else{
		newNode.querySelector('.comment_list').classList.remove('folded');
		newNode.querySelector('.comment_tail').remove();
	}

	if(music_data.new_fav_user_ids?.length){
		newNode.querySelector('.new_fav').classList.remove('invisible');
		newNode.querySelector('.new_fav > .count').textContent = music_data.new_fav_user_ids.length;
	}
	
	if(rotate_data?.length){
		const rotate = newNode.querySelector('.rotate');
		rotate.classList.remove('invisible');
		rotate.querySelector('.count').textContent = rotate_data.length;
	}
	return newNode;
}

function timetableCommentCreate(dataArr){
	const stc = (timetableCommentCreate.stc ??= {
		timetableCommentTemplate: new Range().createContextualFragment(`
			<div class="comment">
				<div class="comment_icon" style=""></div>
				<div class="comment_text"></div>
			</div>
		`)
	});

	const commentList = document.createDocumentFragment();
	for(const itemData of dataArr){
		const newNode = stc.timetableCommentTemplate.cloneNode(true);
		newNode.querySelector('.comment_icon').style.backgroundImage = `url("${userIcons.get(itemData.user_id).avatar_url}")`;
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
		if(index){
			element.classList.remove('onair_now');
		}else{
			element.classList.add('onair_now')
		}
		if(element.querySelector('.timestamp')){
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

async function observeCafe(){
	const stc = (observeCafe.stc ??= {endtime: null, commentData: {}, obsComment: {}});
	if(stc.endtime === null){
		const timetableData = await callApi('/api/cafe/timetable', {with_comment: 1, limit: options.timetable_max});
		const rotate_history = await callApi('/api/cafe/rotate_users', {ids: timetableData.map(e => e.id)});
		stc.commentData = await storageGet('commentData') ?? {};
		stc.commentData[timetableData[0].id] ??= [];

		const timetable = document.createDocumentFragment();
		stc.endtime = new Date(timetableData[0].start_time).getTime() + timetableData[0].msec_duration;
		
		for(const music_data of timetableData){
			const reason_user_id = music_data.reasons[0].user_id;
			userIcons.save(reason_user_id);
			userIcons.save(...music_data.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
			if(stc.commentData[music_data.id] !== undefined) userIcons.save(...stc.commentData[music_data.id].map(e => e.user_id));
		}
		
		await userIcons.load();
		
		for(const music_data of timetableData){
			timetable.append(createTimetableItem(music_data, rotate_history[music_data.id], stc.commentData[music_data.id]));
		}
		updateTimecounter(timetable);
		
		document.querySelector('#timetable_list').replaceChildren(timetable);
	}else if(stc.endtime + options.wait_time < Date.now()){
		const newItem = await callApi('/api/cafe/now_playing');
		const lastId = document.querySelector(`#timetable_list .timetable_item:nth-child(${options.timetable_max})`)?.dataset.id;
		stc.endtime = new Date(newItem.start_time).getTime() + newItem.msec_duration;
		stc.commentData[newItem.id] ??= [];
		for(const comment_music_id of Object.keys(stc.commentData)){
			if(comment_music_id < lastId) delete stc.commentData[comment_music_id];
		}
		userIcons.save(newItem.reasons[0].user_id);
		userIcons.save(...newItem.reasons.filter(e => e?.playlist_comment != null).map(e => e.user_id));
		await userIcons.load();
		document.querySelectorAll(`#timetable_list .timetable_item:nth-child(n + ${options.timetable_max})`).forEach(e => e.remove());
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
		if(element.classList.contains('new_fav')) new_fav_user_ids.push(element.dataset.user_id);
		if(element.classList.contains('gesture_rotate')) gesture_rotate_user_ids.push(element.dataset.user_id);
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
	for(const element of document.querySelectorAll('#cafe_space .user')){
		const comment_user_id = element.dataset.user_id;
		const comment_text = element.querySelector('.comment').textContent;
		if(stc.obsComment[comment_user_id] === undefined){
			stc.obsComment[comment_user_id] = comment_text;
		}else if(stc.obsComment[comment_user_id] !== comment_text){
			if(comment_text){
				newComments.push({
					user_id: comment_user_id, 
					text: comment_text, 
					type: 'user'
				});
	
				userIcons.save(comment_user_id);
			}
			stc.obsComment[comment_user_id] = comment_text;
		}
	}

	if(newComments.length){
		await userIcons.load();

		if(options.notification_comment){
			for(const comment of newComments){
				const commentUser = userIcons.get(comment.user_id);
				notification.send(comment.text,{ body : commentUser.nickname, icon: commentUser.avatar_url });
			}
		}

		stc.commentData[music_id].push(...newComments);

		storageSet('commentData', stc.commentData);
		
		if(options.comment_log){
			qsTimetableFirst.querySelector('.comment_list').append(timetableCommentCreate(newComments));
			qsTimetableFirst.querySelector('.comment_list').classList.remove('empty');
		}
	}
}

function changeColor(color){
	if(!options.color_threshold) return color;

	color = color.trim();

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
	}else if(blightRatio(r, g, b) < options.color_threshold){
		[r, g, b] = [r || 1, g || 1, b || 1];
		let top = 255 / Math.min(r, g, b), bottom = 1,mag = (top + bottom)/ 2;

		for(let i = 0; i < 8; i++){
			if(blightRatio(r * mag, g * mag, b * mag) < options.color_threshold){
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
					style += `font-size: ${sizeToPx[sizeVal - 1]}px;`;
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

function nicoURL(match, type){
	let url;

	switch(type){
		case 'mylist/':
		case 'user/':
			url = 'https://www.nicovideo.jp/'+match;
			break;
		case 'series/':
			url = 'https://www.nicovideo.jp/' + match;
			break;
		case 'sm':
		case 'nm':
		case 'so':
			url = 'https://www.nicovideo.jp/watch/'+match;
			break;
		case 'nc':
			url = 'https://commons.nicovideo.jp/material/'+match;
			break;
		case 'co':
			url = 'https://com.nicovideo.jp/community/'+match;
			break;
	}

	return `<a href="${url}" target="_blank">${match}</a>`
}