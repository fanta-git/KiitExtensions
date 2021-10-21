(() => {
	element = document.getElementById('test');
	textcl = element.style.color.match(/\d+/g);

	newcolor = changeColor({ 
		r: parseInt(textcl[0]), 
		g: parseInt(textcl[1]), 
		b: parseInt(textcl[2])
	},6);
	newcode = `rgb(${newcolor.r}, ${newcolor.g}, ${newcolor.b})`;

	document.getElementById('old').style.color = element.style.color;
	document.getElementById('new').style.color = newcode;
})();

function changeColor(textRGB,backRGB = {r: 0, g: 0, b: 0}, thr = 7) {
	const blight = (_r, _g, _b) => {
		_r = Math.min(_r / 255, 1);
		_g = Math.min(_g / 255, 1);
		_b = Math.min(_b / 255, 1);

		return (
			(_r <= .3298 ? _r / 12.92 : ((_r + .055) / 1.055) ** 2.4) * .2126 +
			(_g <= .3298 ? _g / 12.92 : ((_g + .055) / 1.055) ** 2.4) * .7512 +
			(_b <= .3298 ? _b / 12.92 : ((_b + .055) / 1.055) ** 2.4) * .0722 + 
			.05
		);
	};

	let {r, g, b} = textRGB;
	const 
		backBlight = blight(backRGB.r, backRGB.g, backRGB.g), 
		textBlight = blight(r, g, b);

	if(r === g && g === b){  //グレー系は反転だけして返す
		return { r: 255 - r, g: 255 - g, b: 255 - b };
	}

	if(thr <= Math.max(textBlight/backBlight, backBlight/textBlight)){  //コントラストが閾値以上ならそのまま返す
		return { r: r, g: g, b: b };
	}
	let mag = 1;
	if(backBlight < textBlight){
		r = r || 1;
		g = g || 1;
		b = b || 1;

		let top = 255 / Math.min(r, g, b), bottom = 1;
		mag = (top + bottom)/ 2;

		for(let i = 0; i < 8; i++){  //コントラストの逆算は怠いので二分探索のノリで出す
			if(blight(r * mag, g * mag, b * mag)/backBlight < thr){
				bottom = mag;
			}else{
				top = mag;
			}
			mag = (top + bottom)/ 2;
		}
	}else{
		let top = 1, bottom = 0;
		mag = (top + bottom)/ 2;

		for(let i = 0; i < 8; i++){
			if(backBlight/blight(r * mag, g * mag, b * mag) < thr){
				top = mag;
			}else{
				bottom = mag;
			}
			mag = (top + bottom)/ 2;
		}
	}

	return {
		r: Math.min(Math.round(r * mag), 255), 
		g: Math.min(Math.round(g * mag), 255), 
		b: Math.min(Math.round(b * mag), 255)
	};
}