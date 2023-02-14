const parse = (fragment: string) => new Range().createContextualFragment(fragment);

export const extensionMenu = parse(`
    <div id="exmenu">
        <div data-val="reasons" class="exmenu_item reasons">
            <i class="material-icons">people</i>
        </div>
        <div data-val="info" class="exmenu_item info">
            <i class="material-icons">info</i>
        </div>
    </div>
`);

export const musicData = parse(`
    <div id="info">
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
`)

export const timetableLabel = parse(`
    <li data-val="timetable" class="timetable">選曲履歴</li>
`);

export const timetable = parse(`
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
            <div id="error_message"></div>
            <div id="timetable_list"></div>
        </div>
    </div>
`);

export const reasonPriority = parse(
    `<a class="user_name" href="" target="_blank"></a>さんの<a class="priority_list" href="" target="_blank">イチ推しリスト</a>の曲です`
);

export const reasonFav = parse(
    `<a class="user_name" href="" target="_blank"></a>さんの<b class="fav">お気に入り</b>の曲です`
);

export const reasonPlaylist = parse(
    `<a class="user_name" href="" target="_blank"></a>さんの<b class="playlist">プレイリスト</b>の曲です`
);

export const reasonSpecial = parse(
    `<a class="user_name" href="" target="_blank"></a>さんの<b class="special_list">特別メニュー</b>の曲です`
);

export const timetableItem = parse(`
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
`);

export const commentItem = parse(`
    <div class="comment">
        <div class="comment_icon" style=""></div>
        <div class="comment_text"></div>
    </div>
`);
