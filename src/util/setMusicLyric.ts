import { NicoEmbedProp } from "./types";
import type {} from 'typed-query-selector';

async function setMusicLyric (musicInfo: NicoEmbedProp) {
    const url = new URL('https://vocadb.net/api/songs');
    const params = new URLSearchParams({
        query: 'https://www.nicovideo.jp/watch/' + musicInfo.videoId,
        fields: 'Lyrics'
    });
    url.search = params.toString()
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    const jpLyric = data.items[0]?.lyrics.find((v: any) => v.translationType === 'Original');
    if (jpLyric) {
        document.querySelector('#lyric div.contents')!.innerText = jpLyric.value;
    } else {
        document.querySelector('#lyric div.contents')!.innerText = "歌詞が見つかりませんでした";
    }
}

export default setMusicLyric;
