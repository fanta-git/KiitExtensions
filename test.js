


let xhr = new XMLHttpRequest();
const rss_url = 'https://www.nicovideo.jp/mylist/71681568?rss=2.0';
xhr.open(`GET`, rss_url);
xhr.responseType = `document`;
xhr.send();

xhr.onload = () => {
	let rss_data = xhr.response;
	console.log(rss_data);
};