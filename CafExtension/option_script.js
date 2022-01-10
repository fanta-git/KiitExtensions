const defaultOptions = {
	comment_fold: true, 
	display_all: true,
	comment_log: true, 
	timetable_max: 100,
	wait_time: 3000,
	interval_time: 1000,
	color_threshold: 6
};

const optionsPromise = new Promise(resolve => {
	chrome.storage.local.get({options: {}}, r => resolve(r.options));
});

window.onload = () => {
	optionsPromise.then(res => {
		const options = {};
		for(const key of Object.keys(defaultOptions)){
			options[key] = res[key] ?? defaultOptions[key];
		}
		setValue(options);
	
		document.querySelector('#options_wrapper').onsubmit = event => {
			event.preventDefault();
			saveValue().then(window.close);
		};
	
		document.querySelector('#reset_btn').onclick = () => {
			setValue(defaultOptions);
		};
	
		document.querySelector('#clear_btn').onclick = () => {
			chrome.storage.local.clear().then(window.close);
		};
	});
}

function setValue(setOptions){
	for(const optionDom of document.options_form.elements){
		switch(optionDom.type){
			case "checkbox":
				optionDom.checked = setOptions[optionDom.name];
				break;
			case "number":
				optionDom.value = setOptions[optionDom.name];
				break;
		}
	}
}

function saveValue(){
	const saveOptions = {};
	for(const optionDom of document.options_form.elements){
		switch(optionDom.type){
			case "checkbox":
				saveOptions[optionDom.name] = optionDom.checked;
				break;
			case "number":
				saveOptions[optionDom.name] = Number(optionDom.value);
				break;
		}
	}
	return new Promise(resolve => {
		chrome.storage.local.set({options: saveOptions}, resolve);
	})
}