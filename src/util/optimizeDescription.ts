import options from "./options";

const optimizeDescription = (description: string) => {
    return description
        .replace(/<\/?a.*?>/g, '')
        .replace(/https?:\/\/[\w!?/+\-~=;.,*&@#$%()'[\]]+/g, '<a href="$&" target="_blank">$&</a>')
        .replace(/(?<![\/\w@＠])(mylist\/|user\/|series\/|sm|nm|so|ar|nc|co)\d+/g, nicoURL)
        .replace(/(?<![\/\w])[@＠](\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>')
        .replace(/(?<=color:)[^;"]+/g, changeColor)
        .replace(/<font(.*?)>/g, fontToSpan)
        .replace(/<\/font>/g, '</span>')
};

function changeColor(color: string) {
    const threshold = options.color_threshold;
    if (threshold === 0) return color;
    let [r, g, b] = extractRGB(color.trim());

    if (r === g && g === b) {
        [r, g, b] = [255 - r, 255 - g, 255 - b];
    } else if (blightRatio(r, g, b) < threshold) {
        [r, g, b] = [r || 1, g || 1, b || 1];
        let top = 255 / Math.min(r, g, b), bottom = 1, mag = (top + bottom) / 2;

        for (let i = 0; i < 8; i++) {
            if (blightRatio(r * mag, g * mag, b * mag) < threshold) {
                bottom = mag;
            } else {
                top = mag;
            }
            mag = (top + bottom) / 2;
        }
        [r, g, b] = [Math.min(Math.round(r * mag), 255), Math.min(Math.round(g * mag), 255), Math.min(Math.round(b * mag), 255)]
    }

    return `rgb(${r}, ${g}, ${b})`;
}

function extractRGB(color: string) {
    if (color.startsWith('rgba')) {
        const calc = (rgb: number, a: number) => rgb + (255 - rgb) * (1 - a);
        const [r, g, b, a] = color.match(/(?<=\().*?(?=\))/)![0].split(',').map(Number);
        return [calc(r, a), calc(g, a), calc(b, a)];
    }

    if (color.startsWith('rgb')) {
        return color.match(/(?<=\().*?(?=\))/)![0].split(',').map(Number);
    }

    if (color.startsWith('#')) {
        return color.match(/[\da-fA-F]{2}/g)!.map(d => parseInt(d, 16));
    }

    const canvas = document.createElement('canvas').getContext('2d')!;
    canvas.fillStyle = color;
    if (!canvas.fillStyle.startsWith('#')) return [255, 255, 255];
    return canvas.fillStyle.match(/[\da-fA-F]{2}/g)!.map(d => parseInt(d, 16));
}

function blightRatio(r: number, g: number, b: number) {
    [r, g, b] = [Math.min(r / 255, 1), Math.min(g / 255, 1), Math.min(b / 255, 1)];

    return (
        (r <= .3298 ? r / 12.92 : ((r + .055) / 1.055) ** 2.4) * .2126 +
        (g <= .3298 ? g / 12.92 : ((g + .055) / 1.055) ** 2.4) * .7512 +
        (b <= .3298 ? b / 12.92 : ((b + .055) / 1.055) ** 2.4) * .0722 +
        .05
    ) / .05
}

function fontToSpan(match: string, attributes: string) {
    let tag = '<span';
    if (attributes.trim().length) {
        tag += ' style="';
        for (const attr of attributes.trim().split(/(?<=") +/)) {
            const [propaty, value] = attr.replace(/"/g, '').split('=');
            switch (propaty) {
                case 'color':
                    tag += `color: ${changeColor(value)};`;
                    break;
                case 'size':
                    let sizeVal = 0;
                    const sizeToPx = [8, 13, 16, 18, 24, 32, 48];
                    if (value.startsWith('+')) {
                        sizeVal = 3 + Number(value.slice(1));
                    } else if (value.startsWith('-')) {
                        sizeVal = 3 - Number(value.slice(1));
                    } else {
                        sizeVal = Number(value);
                    }
                    if (sizeVal < 1) {
                        sizeVal = 1;
                    } else if (7 < sizeVal) {
                        sizeVal = 7;
                    }
                    tag += `font-size: ${sizeToPx[sizeVal - 1]}px;`;
                    break;
                case 'face':
                    const fonts = value.split(/ *, */);
                    tag += `font-family ${fonts.map(v => "'" + v + "'").join(', ')};`
                    break;
            }
        }
        tag += '">';
    }
    return tag;
}

function nicoURL(match: string, type: string) {
    let url;

    switch (type) {
        case 'mylist/':
        case 'user/':
            url = `https://www.nicovideo.jp/${match}`;
            break;
        case 'series/':
            url = `https://www.nicovideo.jp/${match}`;
            break;
        case 'sm':
        case 'nm':
        case 'so':
            url = `https://www.nicovideo.jp/watch/${match}`;
            break;
        case 'ar':
            url = `https://ch.nicovideo.jp/article/${match}`;
            break;
        case 'nc':
            url = `https://commons.nicovideo.jp/material/${match}`;
            break;
        case 'co':
            url = `https://com.nicovideo.jp/community/${match}`;
            break;
    }

    return `<a href="${url}" target="_blank">${match}</a>`
}

export default optimizeDescription;
