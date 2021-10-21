function getData(num, dataName) {
	return $('#playlist-edit-songs > .list-item').eq(num).data(dataName);
}

function escStr(str) {
	str = String(str);
	str = str.replace(/\n/g, '<br>').replace(/\//g, '//').replace(/"/g, '/"');
	str = '"' + str + '"';
	return str;
}

function escRev(str) {
	str = String(str);
	str = str.replace(/(^"|[^\/]")/g, '');
	str = str.replace(/\/"/g, '"').replace(/\/\//g, '/').replace(/<br>/g, '\n');
	return str;
}

function disCsv(csv_data) {
	var result = [];
	var i = 0, j = 0, quote = false;
	var result_line = [];
	csv_data = csv_data.split('\r\n');
	csv_data.forEach(function (value) {
		i = j = 0;
		quote = false;
		result_line[0] = '';
		while (value.substr(i, 1) != '') {
			if (value.substr(i, 1) === ',' && !quote) {
				j++;
				result_line[j] = '';
			} else if (value.substr(i, 1) === '"') {
				quote = !quote;
			} else if (value.substr(i, 1) === '/') {
				i++;
			} else {
				result_line[j] += String(value.substr(i, 1));
			}
			i++;
		}
		result.push($.extend([], result_line));
	})
	console.log(result);
	return result;
}

function getNowYMD() {
	var dt = new Date();
	var y = ("00" + (dt.getFullYear()) % 100).slice(-2);
	var m = ("00" + (dt.getMonth() + 1)).slice(-2);
	var d = ("00" + dt.getDate()).slice(-2);
	var result = y + m + d;
	return result;
}

$(function () {
	if (document.getElementById('cssmenu-Exp')) {
		return null;
	}
	$('#edit-page-body > .form-cont').append(`
		<div id="cssmenu-Exp">
			<dt>プレイリストをcsv形式で操作する</dt>
			<dd>
				<div style="display:flex; margin:10px auto;justify-content: left;">
					<div class="btn-normal" id="exportBtn" style="margin: 10px 20px 10px 0px;">エクスポート</div>
					<div class="btn-normal" id="importBtn" style="margin: 10px 20px 10px 0px;">インポート</div>
					<input id="getFile" type="file" accept="text/csv" style="display: none;">
				</div>
			</dd>
		</div>
	`);
	$('#edit-page-body > .form-cont').append(`<div id="testBtn" class="btn-normal">てすと</div>`);


	$(document).on("click", "#testBtn", function () {
		
	});

	$(document).on("click", "#importBtn", function () {
		$('#getFile').click();
	});

	$("#getFile").change(function () {
		let i = 0;
		let arr_data = [];
		let fileList = document.querySelector('#getFile').files;
		if (fileList.length != 0) {
			var reader = new FileReader();
			reader.readAsText(fileList[0])
			reader.onload = function () {
				arr_data = disCsv(reader.result);
				const dataName = arr_data.slice(0, 1).flat();
				arr_data = arr_data.slice(1);
				arr_data.forEach(function (value) {
					i = 0;
					while (getData(i, dataName[0]) != null) {
						if (getData(i, dataName[0]) == value[0]) {
							$('.media-info .col-playlist-menu-cmnt').eq(i).click();
							$('.media-info .playlist-cmnt-input').eq(i).val(escRev(value[2]));
							break;
						}
						i++;
					}
				});
			};
			document.querySelector('#getFile').value = '';
		}
	});

	$(document).on("click", "#exportBtn", function () {
		let i = 0;
		const dataName = ['song-id', 'song-title', 'track-description']
		let csv_data = dataName.join(',');
		while (getData(i, dataName[0]) != null) {
			csv_data += '\r\n' + escStr(getData(i, dataName[0])) + ',' + escStr(getData(i, dataName[1])) + ',' + escStr(getData(i, dataName[2]));
			i++;
		}
		const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
		const blob = new Blob([bom, csv_data], { type: 'text/csv' });
		let downloadLink = document.createElement('a');
		downloadLink.download = $('#playlist-info').data('playlist-title') + getNowYMD() + '.csv';
		downloadLink.href = URL.createObjectURL(blob);
		downloadLink.dataset.downloadurl = ['text/plain', downloadLink.download, downloadLink.href].join(':');
		downloadLink.click();
		downloadLink.remove();
	});
});