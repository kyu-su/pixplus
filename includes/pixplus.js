// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     0.4
// @license     Public domain
// @description pixivをほげる。
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @exclude     *pixivreader*
// ==/UserScript==

/** 0.4
 * pixivreaderと衝突するらしいので、excludeに追加。
 * Chrome/Safari拡張版にオプションページ追加。設定が引き継がれない。
 */

/** ポップアップのデフォルトのキーバインド一覧
 ** 通常
 * a/BackSapace/Left    前のイラストに移動。
 * Space/Right          次のイラストに移動。
 * Up/Down              キャプションをスクロールする。
 * Home/End             最初/最後のイラストに移動。
 * Escape               閉じる。
 * e                    プロフィールを開く。
 * r                    作品一覧を開く。
 * Shift+r              イメージレスポンス一覧を開く。
 * t                    ブックマークを開く。
 * y                    スタックフィードを開く。
 * b                    ブックマーク編集モードに移行。
 * Shift+b              ブックマーク詳細ページを開く。
 * f                    イラスト画像を開く。
 * Shift+f              イラストページを開く。
 * g                    リロードする。
 * c                    キャプションの常時表示/自動表示を切り替える。
 * Shift+c              コメント表示を切り替え。
 * d                    アンケートに答える。
 * v                    マンガモードに移行。
 * Shift+v              マンガサムネイルページを開く。
 * Shift+数字           イラストを評価する。デフォルト設定では無効。1=10点/0=1点
 * +/-                  画像を縮小/拡大する。

 ** ブックマーク編集モード
 * Escape               ブックマーク編集モードを終了。
 * Up/Down              タグ選択モード開始。
 ** タグ選択モード
 * Escape               タグ選択モードを終了。
 * Space                選択中のタグをトグル。
 * Up/Down              上下のタグリストに移動。
 * Left/Right           左右のタグを選択。

 ** マンガモード
 * Escape/v             マンガモードを終了。
 * BackSapace/Left      前のページに移動。
 * Space/Right          次のページに移動。
 * Home/End             最初/最後のページに移動。
 * f                    表示しているページの画像を開く。
 * Shift+f              表示しているページを開く。

 ** アンケート
 * Up                   一つ上の選択肢にフォーカスを移す。
 * Down                 一つ下の選択肢にフォーカスを移す。

 **
 * 移動系のキーバインドは端に到達した時の挙動がキーによって違う。
 * ブックマーク編集モードでは、フォームにフォーカスがある場合はキーバインドが動作しない。

 * 左手の範囲でシングルキーショートカットとかぶらない感じで。
 */

/** 設定の変更方法
 * Opera10.50以降なら、ページ上部のメニュー「pixplus」から設定変更が可能。

 * スクリプトを直接書き換えてもいいが、pixplusInitializeイベント中に
 * opera.pixplus.confオブジェクトを書き換える事で個人設定を別スクリプトに分離出来る。
 * スクリプトのロード順は問わないのでファイル名は任意。以下サンプル。

 window.document.addEventListener(
   'pixplusInitialize',
   function() {
     opera.pixplus.conf.bookmark_hide = true;
     opera.pixplus.conf.disable_effect = true;
   }, false);
 */

/** コメントの処理について
 * 8文字以上の横罫線はhrタグに置換される。
 * brタグが含まれていなければ、4文字以上の空白を改行に置換する。
 * aタグのhref属性の先頭のjump.phpは削除される。
 */

/** 対応しているページ一覧
 * マイページ(ログイン時のトップページ/R-18)
 * メンバーイラスト/作品一覧/ブックマーク
 * 新着作品(みんな/お気に入りユーザー/マイピク/R-18)
 * ランキング(デイリー/ルーキー/ウィークリー/マンスリー/各R-18/R-18G)
 * ランキングカレンダー
 * ブックマーク管理
 * イメージレスポンス
 * 検索
 * 投稿イラスト管理ページ
 * ブックマーク詳細ページ
 * 閲覧・評価・コメント履歴
 * イベント(詳細/参加者)

 ** 人気タグ別ランキングについて
 * 現在この機能自体存在しないが、2009/10/22付けの開発者ブログに「何らかの方法で数ヶ月以内に再開します」とある。
 * http://dev.pixiv.net/archives/892022.html
 * 2010/07/20 http://twitter.com/pixiv/status/18992660402 やっちゃうらしい。

 ** ギャラリーに含まれないイラストへのリンクをクリックした場合の挙動
 * ポップアップが既に表示さてていれば、無条件でポップアップ内で表示。
 * ポップアップが表示されていない場合、imgエレメントを含むか、ページ内に
 * 同じリンク先かつ子孫にimgエレメントを持つリンクが存在しない場合にのみ
 * 新規にポップアップを開く。
 * ポップアップ内でのイラストの移動は出来ない。
 * ただしそのイラストを開く前にポップアップが開いていた場合、そのイラストに戻れる。
 */

/** 画像ファイルのURLについて
 * サムネイルやマンガの各ページはすべて同じディレクトリにある。
 * ファイル名は「\d+(?:_[0-9a-f]{10})?(?:_[sm]|_100|_p\d+)?\.ext」形式。
 * 公開レベルをマイピク限定/非公開にするとイラストIDの後ろに16進ランダム10桁な数字がつく。
 * 拡張子はすべて同じ。マンガ作品で複数の形式を使うと投稿エラーになる。
 * 以前は全ページがjpg固定で、他の形式は投稿時に変換されていた。
 * ユーザーIDは`-'を含むかも知れない。\w+とかやると失敗する。
 */

(function(func, unsafeWindow, userjs) {
   if (window.opera || unsafeWindow) {
     if (window.opera && opera.extension) {
       opera.extension.onmessage = function(ev){
         var data = JSON.parse(ev.data);
         if (data.command == 'config') {
           //var uri = ev.origin.replace(/^(widget:\/\/[^\/]+).*$/, '$1/');
           //func(window, window, {base_uri: uri, conf: data.data});
           func(window, window, {conf: data.data});
         }
       };
     } else {
       func(unsafeWindow || window, window);
     }
   } else {
     (function(func) {
        if (userjs) {
          func();
        } else if (window.chrome) {
          chrome.extension.sendRequest( /* WARN */
            {command: 'config'},
            function(data) {
              if (data.command == 'config') {
                func(JSON.stringify({base_uri: chrome.extension.getURL('/'),
                                     conf:     data.data}));
              }
            });
        } else if (window.safari) {
          safari.self.addEventListener(
            'message',
            function(ev) {
              if (ev.name == 'config') {
                func(JSON.stringify({base_uri: safari.extension.baseURI,
                                     conf:     ev.message}));
              }
            }, false);
          safari.self.tab.dispatchMessage('config', null);
        } else {
          func();
        }
      })(function(conf) {
           conf = conf ? ',' + conf : '';

           var s = window.document.createElement('script');
           s.setAttribute('type', 'text/javascript');
           s.textContent = '(' + func.toString() + ')(window,window' + conf + ')';
           window.document.body.appendChild(s);

           window.document.addEventListener(
             'pixplusConfigSet',
             function(ev) {
               console.log(ev);
             }, false);
         });
   }
 })
(function(window, safeWindow, _extension_data) {
   var conf_schema = {
     /* __CONFIG_BEGIN__ */
     "debug":                  [false, "\u30c7\u30d0\u30c3\u30b0\u30e2\u30fc\u30c9"],
     "scroll":                 [1, "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u3044\u305f\u6642\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b",
                                [{"value": 0, "title": "\u306a\u3057"},
                                 {"value": 1, "title": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3"},
                                 {"value": 2, "title": "\u30a4\u30e9\u30b9\u30c8"}]],
     "bookmark_hide":          [false, "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u975e\u516c\u958b\u3092\u30c7\u30d5\u30a9\u30eb\u30c8\u306b\u3059\u308b"],
     "float_tag_list":         [1, "\u30bf\u30b0\u30ea\u30b9\u30c8\u3092\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u3059\u308b",
                                [{"value": 0, "title": "\u7121\u52b9"},
                                 {"value": 1, "title": "\u6709\u52b9"},
                                 {"value": 2, "title": "AutoPagerize"}]],
     "locate_recommend_right": [1, "\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u7e261\u5217\u306b\u4e26\u3079\u308b",
                                [{"value": 0, "title": "\u7121\u52b9"},
                                 {"value": 1, "title": "\u6709\u52b9"},
                                 {"value": 2, "title": "AutoPagerize"}]],
     "extagedit":              [true, "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u6642\u306b\u30a2\u30ed\u30fc\u30ad\u30fc\u3067\u306e\u30bf\u30b0\u9078\u629e\u3092\u6709\u52b9\u306b\u3059\u308b"],
     "mod_bookmark_add_page":  [false, "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30da\u30fc\u30b8\u306b\u3082\u5909\u66f4\u3092\u52a0\u3048\u308b"],
     "tag_separator_style":    ["border-top:2px solid #dae1e7;", "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30da\u30fc\u30b8\u3067\u306e\u30bb\u30d1\u30ec\u30fc\u30bf\u306e\u30b9\u30bf\u30a4\u30eb"],
     "stacc_link":             ["", "\u4e0a\u90e8\u30e1\u30cb\u30e5\u30fc\u306e\u300c\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u306e\u30ea\u30f3\u30af\u5148",
                                [{"value": "",         "title": "\u5909\u66f4\u3057\u306a\u3044"},
                                 {"value": "all",      "title": "\u3059\u3079\u3066"},
                                 {"value": "favorite", "title": "\u304a\u6c17\u306b\u5165\u308a"},
                                 {"value": "mypixiv",  "title": "\u30de\u30a4\u30d4\u30af"},
                                 {"value": "self",     "title": "\u3042\u306a\u305f"}]],
     "default_manga_type":     ["", "\u30c7\u30d5\u30a9\u30eb\u30c8\u306e\u30de\u30f3\u30ac\u8868\u793a\u30bf\u30a4\u30d7",
                                [{"value": "",       "title": "\u5909\u66f4\u3057\u306a\u3044"},
                                 {"value": "scroll", "title": "\u30b9\u30af\u30ed\u30fc\u30eb"},
                                 {"value": "slide",  "title": "\u30b9\u30e9\u30a4\u30c9"}]],
     "rate_confirm":           [true, "\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b"],
     "popup_manga_tb":         [true, "\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u4f7f\u7528\u3059\u308b"],
     "disable_effect":         [false, "\u30a2\u30cb\u30e1\u30fc\u30b7\u30e7\u30f3\u306a\u3069\u306e\u30a8\u30d5\u30a7\u30af\u30c8\u3092\u7121\u52b9\u5316\u3059\u308b"],
     "workaround":             [false, "Opera\u3084pixiv\u306e\u30d0\u30b0\u56de\u907f\u306e\u305f\u3081\u306e\u6a5f\u80fd\u3092\u4f7f\u7528\u3059\u308b"],
     "fast_user_bookmark":     [0, "\u304a\u6c17\u306b\u5165\u308a\u30e6\u30fc\u30b6\u30fc\u306e\u8ffd\u52a0\u3092\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u884c\u3046",
                                [{"value": 0, "title": "\u7121\u52b9"},
                                 {"value": 1, "title": "\u6709\u52b9(\u516c\u958b)"},
                                 {"value": 2, "title": "\u6709\u52b9(\u975e\u516c\u958b)"}]],
     "expand_novel":           [false, "\u5c0f\u8aac\u30da\u30fc\u30b8\u306e\u30ed\u30fc\u30c9\u6642\u306b\u5168\u30da\u30fc\u30b8\u3092\u8868\u793a\u3059\u308b"],
     "popup_ranking_log":      [true, "\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u4f7f\u7528\u3059\u308b"],
     "popup": {
       "preload":              [true, "\u5148\u8aad\u307f\u3092\u4f7f\u7528\u3059\u308b"],
       "big_image":            [false, "\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b"],
       "caption_height":       [0.4, "\u753b\u50cf\u3092\u57fa\u6e96\u3068\u3057\u305f\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u4e0a\u9650\u3002\u30b3\u30e1\u30f3\u30c8\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u30d0\u30fc\u304c\u4ed8\u304f"],
       "caption_opacity":      [0.9, "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u4e0d\u900f\u660e\u5ea6"],
       "remove_pixpedia":      [false, "\u30bf\u30b0\u306epixpedia\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b"],
       "rate":                 [true, "\u8a55\u4fa1\u6a5f\u80fd\u3092\u4f7f\u7528\u3059\u308b"],
       "rate_key":             [false, "\u8a55\u4fa1\u306e\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u6709\u52b9\u306b\u3059\u308b"],
       "font_size":            ["", "\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba(e.g. 10px)"],
       "auto_manga":           [0, "\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b",
                                [{"value": 0, "title": "\u7121\u52b9"},
                                 {"value": 1, "title": "\u6709\u52b9"},
                                 {"value": 2, "title": "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"}]],
       "auto_manga_regexp":    ["/(?:bookmark_new_illust|member_illust|mypage|ranking|bookmark)\\.php",
                                "auto_manga\u306b2\u3092\u6307\u5b9a\u3057\u305f\u5834\u5408\u306b\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe"],
       "reverse":              [0, "\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b",
                                [{"value": 0, "title": "\u7121\u52b9"},
                                 {"value": 1, "title": "\u6709\u52b9"},
                                 {"value": 2, "title": "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"}]],
       "reverse_regexp":       ["/(?:bookmark_new_illust|member_illust|mypage)\\.php",
                                "reverse\u306b2\u3092\u6307\u5b9a\u3057\u305f\u5834\u5408\u306b\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe"],
       "auto_zoom":            [0, "\u81ea\u52d5\u30ba\u30fc\u30e0\u3059\u308b\u6700\u5927\u30b5\u30a4\u30ba(0:\u7121\u52b9)"],
       "auto_zoom_size":       [800, "\u81ea\u52d5\u30ba\u30fc\u30e0\u5f8c\u306e\u30b5\u30a4\u30ba\u4e0a\u9650"],
       "auto_zoom_scale":      [4, "\u81ea\u52d5\u30ba\u30fc\u30e0\u5f8c\u306e\u62e1\u5927\u7387\u4e0a\u9650"],
       "overlay_control":      [0.3, "\u79fb\u52d5\u7528\u30af\u30ea\u30c3\u30af\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9\u306e\u5e45(0:\u4f7f\u7528\u3057\u306a\u3044/<1:\u753b\u50cf\u306b\u5bfe\u3059\u308b\u5272\u5408/>1:\u30d4\u30af\u30bb\u30eb)"],
       "scroll_height":        [32, "\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u9ad8\u3055"],
       "author_status_icon":   [true, "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)\u3092\u8868\u793a\u3059\u308b"],
       "show_comment_form":    [true, "\u30b3\u30e1\u30f3\u30c8\u306e\u6295\u7a3f\u30d5\u30a9\u30fc\u30e0\u3092\u8868\u793a\u3059\u308b"]
     },
     "extension": {
       "show_toolbar_icon":    [true, "\u30c4\u30fc\u30eb\u30d0\u30fc\u30a2\u30a4\u30b3\u30f3\u3092\u8868\u793a\u3059\u308b"],
       "show_config_ui":       [false, "\u30da\u30fc\u30b8\u5185\u306b\u8a2d\u5b9a\u30dc\u30bf\u30f3\u3092\u8868\u793a\u3059\u308b"]
     }
     /* __CONFIG_END__ */
   };
   var conf = {
     popup: { },
     extension: { },
     /** タグの並び換え+分類。
      * 処理対象はブックマーク管理ページとイラストのブックマーク編集時のタグリスト。
      * 文字列の二次配列で表現し、完全一致したタグのみ適用される。
      * nullの部分にはマッチしなかった全てのタグが挿入される。
      */
     bm_tag_order: [/*['foo', 'bar'], [null, 'baz']*/],
     /** ブックマークタグのエイリアス。自動入力に使用する。
      * 自分が使用するタグに対して複数のエイリアスを指定。
      * 例えばfooにbar、bazの二つのエイリアスを指定すると、
      * イラストのタグにbarかbazが含まれている場合にfooが自動入力される。
      */
     bm_tag_aliases: {/*'hoge': ['fuga', 'piyo'], 'foo':  ['bar', 'baz']*/}
   };

   var browser = {
     opera:  false,
     gecko:  false,
     webkit: false
   };
   browser[window.opera
           ? 'opera'
           : (window.getMatchedCSSRules
              ? 'webkit'
              : 'gecko')] = true;

   var XMLNS_SVG = "http://www.w3.org/2000/svg";
   var XMLNS_XLINK = "http://www.w3.org/1999/xlink";

   var pp = {
     conf_schema:   conf_schema,
     conf:          conf,

     galleries:     [],
     Popup:         Popup,
     Gallery:       Gallery,
     GalleryItem:   GalleryItem,

     geturl:        geturl,
     uncache:       uncache,
     parseimgurl:   parseimgurl,
     lazy_scroll:   lazy_scroll,

     load_css:      load_css,
     write_css:     write_css,

     rpc_ids:       {rpc_i_id: 1, rpc_u_id: 2, rpc_e_id: 4, rpc_qr: 8},
     rpc_usable:    false,
     rpc_state:     0,  // flags; e.g. 5=rpc_e_id|rpc_i_id
     rpc_req_tag:   7,  // i|u|e
     rpc_req_rate:  13, // i|e|qr
     rpc_req_qrate: 13,

     url: {
       js: {
         jquery:             'http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js',
         prototypejs:        'http://ajax.googleapis.com/ajax/libs/prototype/1.6.1.0/prototype.js',
         effects:            'http://ajax.googleapis.com/ajax/libs/scriptaculous/1.8.3/effects.js',
         rpc:                'http://source.pixiv.net/source/js/rpc.js',
         rating:             'http://source.pixiv.net/source/js/modules/rating.js?20101107',
         tag_edit:           'http://source.pixiv.net/source/js/tag_edit.js',
         bookmark_add_v4:    'http://source.pixiv.net/source/js/bookmark_add_v4.js?20101028',
         illust_recommender: 'http://source.pixiv.net/source/js/illust_recommender.js?021216'
       },
       css: {
         bookmark_add: 'http://source.pixiv.net/source/css/bookmark_add.css?20100720'
       },
       img: {
         sprite: 'http://source.pixiv.net/source/images/sprite_20101101.png'
       }
     },

     recommender: {
       loaded: false,
       funcs:  [],
       wait:   function(func) {
         if (this.loaded) {
           func();
         } else {
           this.funcs.push(func);
         }
       }
     }
   };
   if (window.pixplus || (window.opera && window.opera.pixplus)) {
     //window.opera.postError('pixplus is already loaded');
     return;
   }
   if (window.opera) {
     window.opera.pixplus = pp;
   } else {
     window.pixplus = pp;
   }
   function rpc_chk(f) {
     return (pp.rpc_state & f) == f;
   }

   var LS = {
     /* __STORAGE_COMMON_ENTRIES_BEGIN__ */
     u: false, // usable or not
     l: [{name:   'extension',
          label:  'Extension',
          path:   ['conf', 'extension'],
          schema: conf_schema.extension,
          conf:   conf.extension, /* __REMOVE__ */
          keys:   []},
         {name:   'general',
          label:  'General',
          path:   ['conf'],
          schema: conf_schema,
          conf:   conf, /* __REMOVE__ */
          keys:   []},
         {name:   'popup',
          label:  'Popup',
          path:   ['conf', 'popup'],
          schema: conf_schema.popup,
          conf:   conf.popup, /* __REMOVE__ */
          keys:   []}],
     map: {},
     conv: {
       'string':  [String, String],
       'boolean': [function(s) { return s == 'true'; },
                   function(v) { return v ? 'true' : 'false'; }],
       'number':  [function(s) {
                     var v = parseFloat(s);
                     return isNaN(v) ? null : v;
                   },
                   String]
     },
     get_conv: function(s, n) {
       return this.map[s] ? this.conv[typeof this.map[s].schema[n][0]] : this.conv['string'];
     },
     each: function(cb_key, cb_sec, cb_sec_after) {
       for(var i = 0; i < this.l.length; ++i) {
         var sec = this.l[i];
         if (cb_sec) cb_sec(sec);
         for(var j = 0; j < sec.keys.length; ++j) {
           cb_key(sec, sec.keys[j]);
         }
         if (cb_sec_after) cb_sec_after(sec);
       }
     },
     parse_bm_tag_order: function(str) {
       var ary = [], ary_ary = [], lines = str.split('\n');
       for(var i = 0; i < lines.length; ++i) {
         var tag = lines[i];
         tag = tag.replace(/[\r\n]/g, '');
         if (tag == '-') {
           if (ary_ary.length) ary.push(ary_ary);
           ary_ary = [];
         } else if (tag == '*') {
           ary_ary.push(null);
         } else if (tag) {
           ary_ary.push(tag);
         }
       }
       if (ary_ary.length) ary.push(ary_ary);
       return ary;
     },
     parse_bm_tag_aliases: function(str) {
       var aliases = {};
       var lines = str.split(/\r?\n/);
       var len = Math.floor(lines.length / 2);
       for(var i = 0; i < len; ++i) {
         var tag = lines[i * 2], alias = lines[i * 2 + 1];
         if (tag && alias) {
           aliases[tag] = alias.split(/\s+/);
         }
       }
       return aliases;
     },
     bm_tag_order_to_str: function(bm_tag_order) {
       var str = '';
       if (!bm_tag_order) return str;
       for(var i = 0; i < bm_tag_order.length; ++i) {
         var ary = bm_tag_order[i];
         for(var j = 0; j < ary.length; ++j) {
           if (ary[j] === null) ary[j] = '*';
         }
         if (i) str += '-\n';
         str += ary.join('\n') + '\n';
       }
       return str;
     },
     bm_tag_aliases_to_str: function(bm_tag_aliases) {
       var str = '';
       for(var key in bm_tag_aliases) {
         str += key + '\n' + bm_tag_aliases[key].join(' ') + '\n';
       }
       return str;
     }
     /* __STORAGE_COMMON_ENTRIES_END__ */,
     init_section: function(sec) {
       each(sec.keys,
            function(key) {
              sec.conf[key] = sec.schema[key][0];
              if (LS.u) {
                var v = LS.get(sec.name, key);
                if (typeof v !== 'undefined' && v !== null) sec.conf[key] = v;
              }
            });
     },
     init: function() {
       each(LS.l, function(sec) { LS.init_section(sec); });
       if (LS.u) {
         var order = LS.get('bookmark', 'tag_order');
         if (order) conf.bm_tag_order = LS.parse_bm_tag_order(order);
         var aliases = LS.get('bookmark', 'tag_aliases');
         if (aliases) conf.bm_tag_aliases = LS.parse_bm_tag_aliases(aliases);
       }
       each(['auto_manga', 'reverse'],
            function(key) {
              try {
                if (!conf.popup[key + '_regexp']) throw 1;
                var v = conf.popup[key], r = new RegExp(conf.popup[key + '_regexp']);
                conf.popup[key + '_p'] = v & 2 ? !!window.location.href.match(r) : !!(v & 1);
              } catch(ex) {
                conf.popup[key + '_p'] = false;
              }
            });
     }
   };
   if (!(window.opera && opera.extension)) LS.l.shift();
   each(LS.l,
        function(sec) {
          LS.map[sec.name] = sec;
          for(var key in sec.schema) {
            var type = typeof sec.schema[key][0];
            if (LS.conv[type]) {
              sec.schema[key].type = type;
              sec.keys.push(key);
            }
          }
          sec.keys.sort();
        });

   pp.save_conf = function() {
     if (!LS.u) return;
     LS.each(
       function(sec, key) {
         var val = sec.conf[key];
         if (val !== LS.get(sec.name, key)) LS.set(sec.name, key, val);
       });
     LS.set('bookmark', 'tag_order', LS.bm_tag_order_to_str(conf.bm_tag_order));
     LS.set('bookmark', 'tag_aliases', LS.bm_tag_aliases_to_str(conf.bm_tag_aliases));
   };

   (function() {
      if (_extension_data) {
        LS.u = true;
        LS.get = function(s, n) {
          return _extension_data.conf[s + '_' + n];
        };
        LS.set = function(s, n, v) {
          var data = { section: s, key: n, value: v };
          if (window.opera) {
	    opera.extension.postMessage(JSON.stringify({'command': 'config-set', 'data': data}));
          } else {
            var ev = window.document.createEvent('Event');
            ev.initEvent('pixplusConfigSet', true, true);
            ev.currentTarget = data;
            window.document.dispatchEvent(ev);
          }
        };
        LS.remove = function(s, n) {
          var data = { section: s, key: n };
          if (window.opera) {
	    opera.extension.postMessage(JSON.stringify({'command': 'config-remove', 'data': data}));
          } else {
          }
        };
      } else {
        LS.u = !!window.localStorage;
        LS.get = function(s, n) {
          var value = window.localStorage.getItem(create_name(s, n));
          return (typeof value === 'undefined' || value === null
                  ? (LS.map[s] ? LS.map[s].schema[n][0] : '')
                  : LS.get_conv(s, n)[0](value));
        };
        LS.set = function(s, n, v) {
          return window.localStorage.setItem(create_name(s, n), LS.get_conv(s, n)[1](v));
        };
        LS.remove = function(s, n) {
          return window.localStorage.removeItem(create_name(s, n));
        };
        function create_name(s, n) {
          return '__pixplus_' + s + '_' + n;
        }
      }
      LS.init();
    })();

   var options = parseopts(window.location.href);

   if (window.opera) {
     window.opera.addEventListener(
       'AfterEvent.click',
       function(ev) {
         if (ev.event.shiftKey || ev.event.ctrlKey) return;
         var anc = $x('ancestor-or-self::a[1]', ev.event.target);
         if (!ev.eventCancelled && anc && !anc.hasAttribute('nopopup') &&
             anc.href.match(/^(?:http:\/\/www\.pixiv\.net\/)?member_illust\.php.*[\?&](illust_id=\d+)/)) {
           if (Popup.instance || $t('img', anc).length ||
               !$x('//a[contains(@href, "member_illust.php") and contains(@href, "' + RegExp.$1 + '")]//img')) {
             var opts = parseopts(anc.href);
             if (opts.illust_id && opts.mode == 'medium') {
               ev.event.preventDefault();
               Popup.run_url(anc.href);
             }
           }
         }
       }, false);
   }

   function mod_rpc_url(url) {
     if (url == './rpc_rating.php') {
       return '/rpc_rating.php';
     } else if (url == './rpc_tag_edit.php') {
       return '/rpc_tag_edit.php';
     }
     return url;
   }

   //var defineMagicFunction = window.opera ? window.opera.defineMagicFunction : wrap_global_function;
   var defineMagicFunction = wrap_global_function;
   function wrap_global_function(name, func) {
     if (!name || !func) return;
     if (window[name]) {
       // 名前つき関数が定義濟みのときにwindow.__define[GS]etter__()するとOperaとFirefoxでエラーが出る。
       window[name] = wrap;
     } else {
       var orig = function() { };
       window.__defineGetter__(
         name,
         function() {
           return wrap;
         });
       window.__defineSetter__(
         name,
         function(func) {
           orig = func;
         });
     }
     function wrap() {
       func.apply(window, [orig, this].concat([].slice.apply(arguments)));
     };
   }

   defineMagicFunction(
     'sendRequest',
     function(real, othis, url) {
       url = mod_rpc_url(url);
       real.apply(othis, [url].concat([].slice.apply(arguments, [3])));
     });
   // tag edit
   defineMagicFunction(
     'on_loaded_tag',
     function(real, othis) {
       if (Popup.instance && Popup.instance.tag_edit_enabled) {
         Popup.instance.tag_editing = true;
         Popup.instance.locate();
       }
       real.apply(othis, [].slice.apply(arguments, [2]));
     });
   defineMagicFunction(
     'ef2',
     function(real, othis) {
       real.apply(othis, [].slice.apply(arguments, [2]));
       if (Popup.instance && Popup.instance.tag_edit_enabled) {
         var top = Popup.instance.comment.offsetHeight + Popup.instance.viewer_comments.offsetHeight;
         window.jQuery(Popup.instance.comment_wrap).animate({scrollTop: top}, 200);
       }
     });
   defineMagicFunction(
     'ef4',
     function(real, othis) {
       new window.Effect.BlindDown(
         'tag_area', {
	   delay:0.2,
	   duration:0.2,
           afterFinish: function() {
             if (Popup.instance && Popup.instance.tag_editing) {
               Popup.instance.tag_editing = false;
               Popup.instance.locate();
               Popup.instance.reload();
             }
             if (lc(window.document.activeElement.tagName || '') == 'input') {
               window.document.activeElement.blur();
             }
           }
         });
     });
   // rate
   defineMagicFunction(
     'countup_rating',
     function(real, othis, score) {
       var msg = '\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n' + score + '\u70b9';
       if (conf.rate_confirm && !confirm(msg)) return;
       if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);
       real.apply(othis, [].slice.apply(arguments, [2]));
     });
   defineMagicFunction(
     'send_quality_rating',
     function(real, othis) {
       if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);

       var _ajax = window.jQuery.ajax;
       window.jQuery.ajax = function(obj) {
         var othis = this;
         var success = obj.success;
         obj.success = function() {
           success.apply(othis, [].slice.apply(arguments));
           if (Popup.instance && Popup.instance.has_qrate) {
             if (window.jQuery('#rating').is(':visible')) window.rating_ef2();
             each($xa('.//div[@id="result"]/div[starts-with(@id, "qr_item")]', Popup.instance.rating),
                  function(item) {
                    if (item.id.match(/^qr_item(\d+)$/) && (parseInt(RegExp.$1) & 1)) {
                      var value = $x('following-sibling::div', item);
                      if (value && !value.hasAttribute('id')) value.setAttribute('highlight', '');
                    }
                  });
           }
         };
         return _ajax.apply(this, [obj]);
       };
       real.apply(othis, [].slice.apply(arguments, [2]));
       window.jQuery.ajax = _ajax;
     });
   defineMagicFunction(
     'rating_ef',
     function(real, othis) {
       window.jQuery('#quality_rating').slideDown(200, after_show);
       function after_show() {
         var f = $x('.//input[@id="qr_kw1"]', Popup.instance ? Popup.instance.rating : window.document.body);
         if (f) f.focus();
       }
     });
   defineMagicFunction(
     'rating_ef2',
     function(real, othis) {
       if (Popup.is_qrate_button(window.document.activeElement)) window.document.activeElement.blur();
       real.apply(othis, [].slice.apply(arguments, [2]));
     });
   // viewer comments
   defineMagicFunction(
     'on_loaded_one_comment_view',
     function(real, othis) {
       real.apply(othis, [].slice.apply(arguments, [2]));
       if (Popup.instance && Popup.instance.viewer_comments_enabled) {
         each($xa('.//a[contains(@href, "member_illust.php?mode=comment_del")]',
                  Popup.instance.viewer_comments_a),
              function(btn) {
                $ev(btn).click(
                  function() {
                    geturl(btn.href, bind(Popup.instance.reload_viewer_comments, Popup.instance),
                           function() { safeWindow.alert('Error!'); }, true);
                  });
              });
       }
     });

   defineMagicFunction(
     'bookmarkToggle',
     function(real, othis, container_id, type) {
       if (!options.id && conf.bm_tag_order.length) {
         var container = $(container_id);
         container.className = type;
         each($t('ul', container),
              function(ul) {
                if (type == 'cloud') {
                  ul.className = 'tagCloud';
                } else {
                  ul.removeAttribute('class');
                }
              });
         each($xa('ul/li', container),
              function(li, idx) {
                var cn = li.className.replace(/bg_(?:gray|white)/, '');
                if (type == 'flat') cn += idx & 1 ? ' bg_gray' : ' bg_white';
                li.className = cn;
              });

         $('book_outlist').style.display = type == 'flat' ? 'none' : 'block';

         var flat = type == 'flat', toggle_btns = $xa('.//a/span', $('bookmark_toggle_btn'));
	 toggle_btns[0].className = flat ? 'book_flat_on' : 'book_flat_off';
	 toggle_btns[1].className = flat ? 'book_cloud_off' : 'book_flat_on';

         window.jQuery.cookie('bookToggle', type,
                              {expires: 30, domain: window.location.hostname.replace(/^(\w+)\./, '.')});
       } else {
         real.apply(othis, [].slice.apply(arguments, [2]));
       }
       var ev = window.document.createEvent('Event');
       ev.initEvent('pixplusBMTagToggled', true, true);
       window.document.dispatchEvent(ev);
     });


   /* __CONFIG_UI_BEGIN__ */
   function ConfigUI(root, st, options_page) {
     this.root = root;

     var head = window.document.createElement('div');
     head.id = 'pp-conf-head';
     root.appendChild(head);

     var export_form = window.document.createElement('form');
     var export_input = window.document.createElement('input');
     export_input.addEventListener(
       'mouseup',
       function(ev) {
         export_input.select(0, export_input.value.length); /* WARN */
       }, false);
     export_form.textContent = 'Export/Import:';
     export_form.appendChild(export_input);
     if ((options_page || window.opera || !_extension_data) && window.JSON && st.u) {
       var btn_import = window.document.createElement('input');
       btn_import.type = 'submit';
       btn_import.value = 'Import';
       export_form.addEventListener(
         'submit',
         function(ev) {
           try {
             ev.preventDefault();
             import_json();
           } catch(ex) {
             alert(ex);
           }
         }, false);
       export_form.appendChild(btn_import);
     }
     head.appendChild(export_form);

     if (window.opera) {
       var btn_userjs = window.document.createElement('a');
       btn_userjs.href = 'javascript:void(0)';
       btn_userjs.textContent = 'UserJS';
       btn_userjs.addEventListener(
         'click',
         function() {
           var js = ['// ==UserScript==',
                     '// @name    pixplus settings',
                     '// @version ' + (new Date()).toLocaleString(),
                     '// @include http://www.pixiv.net/*',
                     '// ==/UserScript==',
                     '(function() {',
                     '   window.document.addEventListener("pixplusInitialize",init,false);',
                     '   function init() {',
                     '     ' + gen_js('\n     ', 2),
                     '   }',
                     ' })();'].join('\n');
           window.open('data:text/javascript;charset=utf-8,' + encodeURI(js));
         }, false);
       head.appendChild(btn_userjs);
     }

     var table = window.document.createElement('table');
     table.id = 'pp-conf-table';
     root.appendChild(table);

     var input_table = { };

     var idx;
     st.each(
       function(sec, key) {
         if (sec.name == 'bookmark') return;

         var value = options_page ? st.get(sec.name, key) : sec.conf[key];
         var type = typeof sec.schema[key][0];
         var row = table.insertRow(-1), cell = row.insertCell(-1), input;
         row.className = 'pp-conf-entry pp-conf-entry-' + (idx & 1 ? 'odd' : 'even');
         if (sec.schema[key][2]) {
           input = window.document.createElement('select');
           for(var i = 0; i < sec.schema[key][2].length; ++i) {
             var entry = sec.schema[key][2][i];
             var opt = window.document.createElement('option');
             if (typeof entry === 'string') {
               opt.value = opt.textContent = entry;
             } else {
               opt.value = entry.value;
               opt.textContent = entry.title;
             }
             input.appendChild(opt);
           }
         } else {
           input = window.document.createElement('input');
         }
         input.id = 'pp-conf-' + sec.name + '-' + key;
         if (type == 'boolean') {
           input.setAttribute('type', 'checkbox');
           input.checked = value;

           var label = window.document.createElement('label');
           label.appendChild(input);
           label.appendChild(window.document.createTextNode(key));

           cell.appendChild(label);
           cell.setAttribute('colspan', '2');
         } else {
           cell.textContent = key;
           input.value = value;
           cell = row.insertCell(-1);
           cell.className = 'pp-conf-cell-value';
           cell.appendChild(input);
         }
         input_table[sec.name + '_' + key] = input;

         var def = window.document.createElement('button');
         def.textContent = 'Default';
         def.addEventListener(
           'click',
           function() {
             if (type == 'boolean') {
               input.checked = sec.schema[key][0];
             } else {
               input.value = sec.schema[key][0];
             }
             if (st.u) st.remove(sec.name, key, value);
             update_export();
           }, false);
         row.insertCell(-1).appendChild(def);
         row.insertCell(-1).textContent = sec.schema[key][1];

         input.addEventListener(
           sec.schema[key][2] || type == 'boolean' ? 'change' : 'keyup',
           function() {
             var value;
             if (type == 'boolean') {
               value = input.checked;
             } else {
               value = st.conv[type][0](input.value);
             }
             if (st.u) st.set(sec.name, key, value);
             update_export();
           }, false);

         ++idx;
       },
       function(sec) {
         if (sec.name == 'bookmark') return;
         make_section(sec.label);
       });

     var tocont = make_custom_section('Tag order');
     tocont.textContent = '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff' +
       '\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002\n' +
       '"-": \u30bb\u30d1\u30ec\u30fc\u30bf\n"*": \u6b8b\u308a\u5168\u90e8';
     var tag_order_textarea = window.document.createElement('textarea');
     tag_order_textarea.id = 'pp-conf-bookmark-tag_order';
     tag_order_textarea.rows = '20';
     tag_order_textarea.value = (options_page
                                 ? st.get('bookmark', 'tag_order')
                                 : st.bm_tag_order_to_str(conf.bm_tag_order));
     tag_order_textarea.addEventListener(
       'keyup',
       function() {
         if (st.u) st.set('bookmark', 'tag_order', tag_order_textarea.value);
         update_export();
       }, false);
     tocont.appendChild(tag_order_textarea);

     var tacont = make_custom_section('Tag alias');
     tacont.textContent = '\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3067\u8907\u6570\u8a18\u8ff0\u3002\u30d6\u30c3' +
       '\u30af\u30de\u30fc\u30af\u6642\u306e\u30bf\u30b0\u306e\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3002';
     var tag_alias_table = window.document.createElement('table');
     tag_alias_table.id = 'pp-conf-bookmark-tag_aliases';
     tacont.appendChild(tag_alias_table);
     (function() {
        var add = window.document.createElement('button');
        add.textContent = 'Add';
        add.addEventListener('click', function() { add_row(); }, false);
        tacont.appendChild(add);

        var aliases = options_page ? st.parse_bm_tag_aliases(st.get('bookmark', 'tag_aliases')) : conf.bm_tag_aliases;
        for(var key in aliases) add_row(key, aliases[key]);

        function add_row(tag, list) {
          var row = tag_alias_table.insertRow(-1), cell, remove, input1, input2;
          remove = window.document.createElement('button');
          remove.textContent = 'Remove';
          remove.addEventListener(
            'click',
            function() {
              row.parentNode.removeChild(row);
              save();
            }, false);
          cell = row.insertCell(-1);
          cell.className = 'pp-conf-cell-remove';
          cell.appendChild(remove);

          input1 = window.document.createElement('input');
          input1.value = tag || '';
          input1.addEventListener('keyup', save, false);
          cell = row.insertCell(-1);
          cell.className = 'pp-conf-cell-tag';
          cell.appendChild(input1);

          input2 = window.document.createElement('input');
          input2.value = list ? list.join(' ') : '';
          input2.addEventListener('keyup', save, false);
          cell = row.insertCell(-1);
          cell.className = 'pp-conf-cell-aliases';
          cell.appendChild(input2);
        }

        function save() {
          if (st.u) st.set('bookmark', 'tag_aliases', get_tag_alias_str());
          update_export();
        }
      })();
     update_export();

     function make_custom_section(label) {
       make_section(label);
       var row = table.insertRow(-1), cell = row.insertCell(-1);
       row.className = 'pp-conf-section-custom';
       cell.setAttribute('colspan', '4');
       return cell;
     }
     function make_section(label) {
       var row = table.insertRow(-1);
       row.className = 'pp-conf-section';
       var cell = row.insertCell(-1);
       cell.setAttribute('colspan', '4');
       cell.textContent = label;
       idx = 0;
       return row;
     }
     function get_tag_alias_str() {
       var tag_aliases = '';
       for(var i = 0; i < tag_alias_table.rows.length; ++i) {
         var row = tag_alias_table.rows[i];
         var inputs = row.getElementsByTagName('input');
         var key = inputs[0].value;
         var val = inputs[1].value;
         if (key && val) tag_aliases += key + '\n' + val + '\n';
       }
       return tag_aliases;
     }
     function update_export() {
       var obj = { };
       st.each(
         function(sec, key) {
           var input = input_table[sec.name + '_' + key], val;
           if (!input) return;
           val = (typeof sec.schema[key][0] === 'boolean'
                  ? input.checked
                  : st.get_conv(sec.name, key)[0](input.value));
           if (val !== sec.schema[key][0]) obj[sec.name + '_' + key] = val;
         });
       obj['bookmark_tag_order'] = tag_order_textarea.value.replace(/\r/g, '');
       obj['bookmark_tag_aliases'] = get_tag_alias_str();
       export_input.value = stringify(obj);
     }
     function import_json() {
       var obj = window.JSON.parse(export_input.value);
       st.each(
         function(sec, key) {
           var val = obj[sec.name + '_' + key];
           if (typeof val !== 'undefined' && val !== null) {
             st.set(sec.name, key, val);
           }
         });
       if (obj['bookmark_tag_order']) st.set('bookmark', 'tag_order', obj['bookmark_tag_order']);
       if (obj['bookmark_tag_aliases']) st.set('bookmark', 'tag_aliases', obj['bookmark_tag_aliases']);
       window.location.reload();
     }

     function gen_js(new_line, indent_level) {
       var js = ['var pp=window.opera?window.opera.pixplus:window.pixplus;'];
       var order = st.parse_bm_tag_order(tag_order_textarea.value);
       var alias = st.parse_bm_tag_aliases(get_tag_alias_str());
       var indent = 0;
       if (!indent_level) indent_level = 0;
       st.each(
         function(sec, key) {
           if (sec.name == 'bookmark') return;
           var input = input_table[sec.name + '_' + key], val;
           if (typeof sec.schema[key][0] == 'boolean') {
             val = input.checked;
           } else {
             val = st.get_conv(sec.name, key)[0](input.value);
           }
           if (val !== sec.schema[key][0]) {
             push('pp.' + sec.path.join('.') + '.' + key + '=' + stringify(val) + ';');
           }
         });
       if (order.length) {
         push('pp.conf.bm_tag_order=[');
         ++indent;
         for(var i = 0; i < order.length; ++i) {
           var ary = order[i];
           push('[');
           ++indent;
           for(var j = 0; j < ary.length; ++j) {
             var tag = ary[j];
             push((tag ? stringify(tag) : 'null') + ',');
           }
           --indent;
           push('],');
         }
         --indent;
         push('];');
       }
       var alias_f = true;
       for(var key in alias) {
         if (alias_f) {
           push('pp.conf.bm_tag_aliases={');
           alias_f = false;
           ++indent;
         }
         push(stringify(key) + ':[');
         ++indent;
         for(var j = 0; j < alias[key].length; ++j) {
           var tag = alias[key][j];
           push(stringify(tag) + ',');
         }
         --indent;
         push('],');
       }
       if (!alias_f) {
         js.push('};');
         --indent;
       }
       return js.join(new_line || '');

       function push(str) {
         var sp = '';
         for(var i = 0; i < indent_level * indent; ++i) sp += ' ';
         js.push(sp + str);
       }
     }

     function stringify(val) {
       if (window.JSON && window.JSON.stringify) {
         return JSON.stringify(val);
       } else {
         var str = '';
         if (val.constructor === String) {
           return '"' + val.replace(/[\\\"]/g, '\\$0')
             .replace(/\n/g, '\\n')
             .replace(/\r/g, '\\r') + '"';
         } else if (val.constructor === Array) {
           for(var i = 0; i < val.length; ++i) {
             if (i) str += ',';
             str += stringify(val[i]);
           }
           return '[' + str + ']';
         } else if (val.constructor === Object) {
           var first = true;
           for(var key in val) {
             if (!val.hasOwnProperty(key)) continue;
             if (first) {
               first = false;
             } else {
               str += ',';
             }
             str += stringify(key) + ':' + stringify(val[key]);
           }
           return '{' + str + '}';
         } else if (val.constructor === Number) {
           return String(val);
         } else {
           throw 1;
         }
       }
     } // stringify()
   }
   /* __CONFIG_UI_END__ */

   function init_config_ui() {
     if (_extension_data && !_extension_data.base_uri &&
         !(window.opera && LS.u && LS.get('extension', 'show_config_ui'))) return;

     var menu = $x('//div[@id="nav"]/ul[contains(concat(" ", @class, " "), " sitenav ")]');
     var sp_manga_tb = $x('//div[@id="manga_top"]/div[span[@id="total_clap"]]/span[img[contains(@src, "spacer.gif")]]');
     if (menu || sp_manga_tb) {
       function fire_event() {
         var ev = window.document.createEvent('Event');
         ev.initEvent('pixplusConfigToggled', true, true);
         window.document.dispatchEvent(ev);
       }
       function show() {
         create();
         div.style.display = '';
         fire_event();
       }
       function hide() {
         div.style.display = 'none';
         fire_event();
       }
       function toggle() {
         if (!div || div.style.display == 'none') {
           show();
         } else {
           hide();
         }
       }

       var anc = $c('a');
       anc.href = 'javascript:void(0)';
       anc.textContent = 'pixplus';
       anc.addEventListener(
         'click',
         function() {
           if (_extension_data && _extension_data.base_uri) {
             window.open(_extension_data.base_uri + 'options.html');
           } else {
             toggle();
           }
         }, false);
       if (menu) {
         var li  = $c('li');
         li.appendChild(anc);
         menu.insertBefore(li, menu.firstChild);
       } else if (sp_manga_tb) {
         sp_manga_tb.parentNode.insertBefore(anc, sp_manga_tb.nextSibling);
         anc.parentNode.insertBefore(sp_manga_tb.cloneNode(true), anc.nextSibling);
       }

       var div, tag_order_textarea, tag_alias_table;
       function create() {
         if (div) return;
         div = $c('div', null, 'pp-conf-root');
         new ConfigUI(div, LS);
         ($('manga_top') || $('pageHeader')).appendChild(div);
       }
     }
   }
   function unpack_captions(col, xpath_cap) {
     each($xa(xpath_cap || './/a[img]/text()', col),
          function(node) {
            remove_node_if_tag_name(node.previousSibling, 'br');
            var p = node.parentNode;
            p.removeChild(node);
            if (p.nextSibling) {
              p.parentNode.insertBefore(node, p.nextSibling);
            } else {
              p.parentNode.appendChild(node);
            }
          });
   }
   function unpack_captions_label(col) {
     unpack_captions(col, './ul/li/a[img]/label');
   }
   function init_galleries() {
     function area_right() {
       each($xa('//div[contains(concat(" ", @class, " "), " area_right ")]'),
            function(root) {
              add_gallery({root:          root,
                           xpath_col:     '.',
                           xpath_cap:     './/p/a[contains(@href, "mode=medium")]',
                           xpath_tmb:     'ancestor::div[contains(concat(" ", @class, " "), " ran_text ")]/preceding-sibling::div[contains(concat(" ", @class, " "), " ran_img ")]/a/img',
                           allow_nothumb: 3});
            });
     }
     function mypage() {
       each($xa('//div[contains(concat(" ", @class), " baseTop")]'),
            function(root) {
              add_gallery({root:      root,
                           xpath_col: './/ul[contains(concat(" ", @class, " "), " top_display_works ")]',
                           xpath_cap: './li/text()[last()]'},
                          unpack_captions);
            });
       area_right();
     }

     if (window.location.pathname.match(/^\/(?:mypage|cate_r18)\.php/)) {
       // http://www.pixiv.net/mypage.php
       // http://www.pixiv.net/cate_r18.php
       mypage();
     } else if (window.location.pathname.match(/^\/member\.php/)) {
       // http://www.pixiv.net/member.php?id=11
       add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " worksListOthers ")]/*[contains(concat(" ", @class, " "), " worksListOthersImg ")]'},
                   unpack_captions);
     } else if (window.location.pathname.match(/^\/member_illust\.php/)) {
       if (options.illust_id) {
         // http://www.pixiv.net/member_illust.php?mode=medium&illust_id=14602505
         // 下部のイメージレスポンス
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " worksImageresponse ")]',
                      xpath_cap: './ul[contains(concat(" ", @class, " "), " worksResponse ")]/li/text()[last()]'});
       } else if (options.id) {
         // http://www.pixiv.net/member_illust.php?id=11
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]'},
                     unpack_captions);
       } else {
         // 自分のイラスト管理
         // http://www.pixiv.net/member_illust.php
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]',
                      xpath_cap: './ul/li/label'},
                     unpack_captions_label);
       }
     } else if (window.location.pathname.match(/^\/ranking(?:_tag|_area)?\.php/)) {
       if ((RegExp.$1 == '_tag' || RegExp.$1 == '_area') && !options.type) {
         // 人気タグ別ランキング / 地域ランキング
         // http://www.pixiv.net/ranking_area.php
         area_right();
       } else {
         // その他ランキング
         // http://www.pixiv.net/ranking.php?mode=day
         // http://www.pixiv.net/ranking.php?mode=rookie
         // http://www.pixiv.net/ranking.php?mode=weekly
         // http://www.pixiv.net/ranking.php?mode=monthly
         // http://www.pixiv.net/ranking.php?mode=daily_r18
         // http://www.pixiv.net/ranking.php?mode=weekly_r18
         // http://www.pixiv.net/ranking.php?mode=r18g
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " rankingZone ")]',
                      xpath_cap: './div[contains(concat(" ", @class, " "), " r_right ")]/p/span/a[contains(@href, "mode=medium")]',
                      xpath_tmb: '../../../../div[contains(concat(" ", @class, " "), " r_left ")]/ul/li[contains(concat(" ", @class, " "), " r_left_img ")]/a/img'});
       }
     } else if (window.location.pathname.match(/^\/bookmark\.php/) && !options.id &&
                (!options.type || options.type.match(/^illust(?:_all)?$/))) {
       // ブックマーク管理
       // http://www.pixiv.net/bookmark.php
       // http://www.pixiv.net/bookmark.php?type=illust_all
       function debug_filter(item) {
         var c = $x('./input[@name="book_id[]"]', item.caption.parentNode);
         if (c) {
           var d = $c('div');
           remove_node_if_tag_name(item.caption.nextSibling, 'br');
           d.innerHTML = 'ID: ' + item.id + '<br />BID: ' + c.value;
           item.caption.parentNode.insertBefore(d, item.caption.nextSibling);
         }
       }
       add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]',
                    xpath_cap: './ul/li/text()[preceding-sibling::a/img]'},
                   unpack_captions, conf.debug ? debug_filter : null);
     } else if (window.location.pathname.match(/^\/bookmark_detail\.php/)) {
       // http://www.pixiv.net/bookmark_detail.php?illust_id=15092961
       // 下部の「****の他の作品」
       add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " bookmark_works ")]'});
     } else if (window.location.pathname.match(/^\/stacc/)) {
       // http://www.pixiv.net/stacc/
       add_gallery({xpath_col: '//span[@id="insert_status"]/div[contains(concat(" ", @class, " "), " post ")]',
                    xpath_cap: './div/div[contains(concat(" ", @class, " "), " post-side ")]/p[contains(concat(" ", @class, " "), " post-imgtitle ")]/a[contains(@href, "mode=medium")]',
                    xpath_tmb: '../../preceding-sibling::div[contains(concat(" ", @class, " "), " post-content-ref ")]/div[contains(concat(" ", @class, " "), " post-img ")]/a/img',
                    skip_dups: true});
       add_gallery({xpath_col:  '//span[@id="insert_status"]/div[contains(concat(" ", @class, " "), " post ")]',
                    xpath_tmb:  './/*[contains(concat(" ", @class, " "), " add_fav_content_area ")]/a[contains(@href, "mode=medium")]/img',
                    thumb_only: true});
     } else if (window.location.pathname.match(/^\/event_detail\.php/)) {
       // http://www.pixiv.net/event_detail.php?event_id=805
       add_gallery({xpath_col:  '//div[contains(concat(" ", @class, " "), " event-cont ")]//ul[contains(concat(" ", @class, " "), " thu ")]',
                    xpath_tmb:  './li/a[contains(@href, "mode=medium")]/img',
                    thumb_only: true});
     } else if (window.location.pathname.match(/^\/event_member\.php/)) {
       // http://www.pixiv.net/event_member.php?event_id=805
       add_gallery({xpath_col:  '//div[@id="contents"]//div[contains(concat(" ", @class, " "), " thumbFull ")]/ul',
                    xpath_tmb:  './li/a[contains(@href, "member_event.php")]/img[contains(concat(" ", @class, " "), " thui ")]',
                    thumb_only: true,
                    get_url:    get_url_from_image});
     } else if (window.location.pathname.match(/^\/(?:view|rating|comment)_all\.php/)) {
       // http://www.pixiv.net/view_all.php
       // http://www.pixiv.net/rating_all.php
       // http://www.pixiv.net/comment_all.php
       add_gallery({xpath_col:     '//div[contains(concat(" ", @class, " "), " archiveListNaviBody ")]/dl',
                    xpath_cap:     './dd/a[contains(@href, "mode=medium")]',
                    allow_nothumb: -1});
     } else if (window.location.pathname.match(/^\/ranking_log\.php/)) {
       // http://www.pixiv.net/ranking_log.php
       if (conf.popup_ranking_log) {
         add_gallery({xpath_col:  '//table[contains(concat(" ", @class, " "), " calender_ranking ")]',
                      xpath_tmb:  './/a[contains(@href, "ranking.php")]//img',
                      thumb_only: true,
                      skip_dups:  true,
                      get_url:    get_url_from_image});
       }
     }

     // 汎用
     if (pp.galleries.length == 0) {
       if ($x('//div[contains(concat(" ", @class, " "), " profile_area ")]/a[@href="/profile.php"]') &&
           $x('//div[contains(concat(" ", @class, " "), " area_right ")]')) {
         // http://www.pixiv.net/event_christmas2010.php
         mypage();
       } else {
         // http://www.pixiv.net/new_illust.php
         // http://www.pixiv.net/mypixiv_new_illust.php
         // http://www.pixiv.net/bookmark_new_illust.php
         // http://www.pixiv.net/new_illust_r18.php
         // http://www.pixiv.net/bookmark_new_illust_r18.php
         // http://www.pixiv.net/bookmark.php?id=11
         // http://www.pixiv.net/search.php?word=pixiv&s_mode=s_tag
         // http://www.pixiv.net/response.php?illust_id=15092961
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]'}, unpack_captions);
         add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " search_a2_result ")]'}, unpack_captions);
       }
     }

     function get_url_from_image(cap, thumb) {
       if (thumb && thumb.src.match(/http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+(?:\/mobile)?\/(\d+)_(?:128x128|s)/i)) {
         return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + RegExp.$1;
       } else {
         return null;
       }
     }
   }
   function init_recommend() {
     var r_container = $('illust_recommendation');
     var r_caption = $x('../../../preceding-sibling::div/h3/span[text()[contains(., "\u304a\u3059\u3059\u3081")]]', r_container);
     var r_switch = $('switchButton'), r_switch_p = r_switch ? r_switch.parentNode : null;
     var float_wrap = null;
     if (r_container) {
       (function() {
          if (conf.debug) {
            // trap
            var ir = window.IllustRecommender;
            var _show = ir.prototype.show;
            var _error = ir.error;
            ir.prototype.show = function(res) {
              try {
                _show.apply(this, arguments);
              } catch(ex) {
                this.error(ex);
              }
            };
            ir.prototype.error = function(msg) {
              safeWindow.alert(msg);
              if (_error) _error.apply(this, arguments);
            };
          }
          if (conf.workaround) {
            var il = window.IllustList;
            il.prototype.createPreloader = function(image) {
              var img = window.jQuery(image), src = img.src;
              img.src = this.LOADING_IMAGE_ICON_URL;
              var preloader = new Image();
              preloader.addEventListener(
                'load',
                function() {
                  window.document.body.removeChild(preloader);
                  img.src = src;
                }, false);
              preloader.src = src;
              preloader.style.display = 'none';
              window.document.body.appendChild(preloader);
              this.preloaders.set(image, preloader);
            };
          }
        })();
       var de = window.document.documentElement;
       var gallery;
       pp.recommender.wait(
         function() {
           var illusts = $x('.//ul[contains(concat(" ", @class, " "), " illusts ")]', r_container);
           if (!window.location.pathname.match(/^\/bookmark_add\.php/) && de.clientWidth >= 1175) {
             if (conf.locate_recommend_right == 1) {
               locate_right();
             } else if (conf.locate_recommend_right == 2 &&
                        $x('//li[contains(concat(" ", @class, " "), " pager_ul_next ")]')) {
               wait_pager(function() {
                            locate_right();
                            if (gallery) init_right_gallery(illusts);
                          });
             }
           }
           init_gallery(illusts);
         });
       function init_gallery(illusts) {
         gallery = add_gallery({root:      illusts,
                                xpath_col: './li',
                                xpath_cap: './a[img]/following-sibling::text()[1]',
                                xpath_tmb: 'preceding-sibling::a/img'},
                               unpack_captions);
         if (float_wrap) init_right_gallery(illusts);
       }
       function init_right_gallery(illusts) {
         var floater = new Floater(float_wrap, illusts);
         var timer;
         gallery.onadditem.connect(function() { if (!timer) timer = setTimeout(init_pager, 100); });
         function init_pager() {
           var more = $x('.//div[contains(concat(" ", @class, " "), " commands ")]/a[contains(@title, "\u3082\u3063\u3068\u898b")]', r_container);
           if (more) {
             illusts.addEventListener(
               'scroll',
               function() {
                 if (illusts.scrollHeight - illusts.scrollTop < illusts.clientHeight * 2) {
                   send_click(more);
                   illusts.removeEventListener('scroll', arguments.callee, false);
                 }
               }, false);
           }
           floater.update_height();
           timer = null;
         }
       }

       var switch_wrap;
       function locate_right() {
         var _show = r_container.show, _hide = r_container.hide;
         r_container.show = function() { _show.apply(r_container, arguments); sv(true); };
         r_container.hide = function() { _hide.apply(r_container, arguments); sv(false); };
         function sv(show) {
           r_switch.parentNode.removeChild(r_switch);
           if (show) {
             $('wrapper').style.width = '1160px';
             $('pp-recom-wrap').style.display = '';
             switch_wrap.appendChild(r_switch);
           } else {
             $('wrapper').style.width = '970px';
             $('pp-recom-wrap').style.display = 'none';
             r_switch_p.appendChild(r_switch);
           }
         }
         locate_right_real();
       }
       function locate_right_real() {
         var anc = $x('./a[contains(@href, "bookmark.php?tag=")]', r_caption);
         var wrap = $c('div');
         var div = $c('div', wrap);
         wrap.id = 'pp-recom-wrap';
         if (anc) {
           div.appendChild(anc.cloneNode(true));
           if (r_switch) {
             var r_switch_p_new = $c('span');
             switch_wrap = $c('span', div);
             switch_wrap.id = 'pp-recom-switch-wrap';
             r_switch_p.replaceChild(r_switch_p_new, r_switch);
             r_switch_p = r_switch_p_new;
             switch_wrap.appendChild(r_switch);
           }
         }
         r_container.parentNode.removeChild(r_container);
         div.appendChild(r_container);

         var contents = $('contents');
         contents.parentNode.insertBefore(wrap, contents);
         float_wrap = div;

         write_css('#wrapper{width:1160px;}' +
                   '#contents{width:970px;float:left;}' +
                   '#footer,.adver_footer,.adver_footerBottom{clear:both;}' +
                   '#pp-recom-switch-wrap:before{content:"[";margin-left:4px;}' +
                   '#pp-recom-switch-wrap:after{content:"]";}' +
                   '#pp-recom-wrap{float:right;width:190px;text-align:center;}' +
                   '#pp-recom-wrap ul.illusts{margin:0 !important;padding:0 !important;}' +
                   '#pp-recom-wrap li{float:none !important;}' +
                   // 縦方向の隙間を詰める小細工
                   '#illust_recommendation div.image_container{height:inherit;}' +
                   '#illust_recommendation div.image_container a{display:block;}' +
                   '#illust_recommendation div.image_container>br{display:none;}' +
                   '#illust_recommendation div.caption{height:inherit;overflow:inherit;}' +
                   // オートビューモード/もっと見る
                   '#illust_recommendation div.commands{line-height:1.2em;text-align:left;padding:2px 4px;}' +
                   '#illust_recommendation div.commands>a{display:block;margin:0 !important;padding:0 !important;}');
       }
     }
   }
   function init_taglist() {
     var bm_tag_list = $('bookmark_list');
     if (bm_tag_list) {
       write_css('.area_bookmark, #bookmark_list{padding:0px !important;}' +
                 '#bookmark_list > ul{display:block;}' +
                 '#bookmark_list > ul > li{padding:0px;}' +
                 '#bookmark_list.flat > ul + ul{' + conf.tag_separator_style + '}' +
                 '#bookmark_list.flat > ul > li{display:block !important;padding:0px 4px;}' +
                 '#bookmark_list.cloud > ul{padding:0px 4px;}' +
                 '#bookmark_list.cloud > ul + ul + ul{' + conf.tag_separator_style + '}' +
                 '#bookmark_list.cloud > ul{padding:0px 4px;}' +
                 '#bookmark_list.cloud > ul:first-child{display:none;}');

       if (options.tag) {
         var a = $x('//li/a[contains(@href, "bookmark.php?tag=' + options.tag + '&")]', bm_tag_list);
         if (a) {
           a.style.color          = 'gray';
           a.style.fontWeight     = 'bold';
           a.style.textDecoration = 'none';
         }
       }
     }

     if (conf.float_tag_list == 1) {
       make_float();
     } else if (conf.float_tag_list == 2) {
       wait_pager(make_float);
     }
     function make_float() {
       var cont = bm_tag_list ? bm_tag_list : $x('//ul[contains(concat(" ", @class, " "), " tagCloud ")]');
       if (cont) {
         var wrap = $x('ancestor::div[contains(concat(" ", @class, " "), " ui-layout-west ")]', cont);
         if (wrap) {
           write_css('.ui-layout-east{float:right;}' +
                     '.ui-layout-west .area_new{margin:0px;}');
           new Floater(wrap, cont);
         }
       }
     }
     return bm_tag_list;
   }
   function init_illust_page_bookmark() {
     var bm_add_anc = $x('//div[contains(concat(" ", @class, " "), " works_iconsBlock ")]//a[contains(@href, "bookmark_add.php")]');
     var display = $x('//div[contains(concat(" ", @class, " "), "works_display")]');
     if (!bm_add_anc || !display) return;
     var bm_form_div, loader;
     var autotag = $x('preceding-sibling::a[contains(@href, "bookmark_detail.php")]', bm_add_anc) ? false : true;
     $ev(bm_add_anc).click(
       function() {
         if (bm_form_div) {
           hide();
         } else {
           show();
         }
       });

     function Loader(url, wrap) {
       var cancelled = false;
       this.cancel = function() { cancelled = true; };
       geturl(
         url,
         function(text) {
           var re;
           if (cancelled) return;
           if ((re = text.match(/<form[^>]+action="bookmark_add.php"[\s\S]*?<\/form>/mi))) {
             wrap.innerHTML = re[0];
             mod_edit_bookmark(wrap, autotag, null, null, hide);
           } else {
             wrap.textContent = 'Error!';
           }
         }, function() {
           if (cancelled) return;
           wrap.textContent = 'Error!';
         }, true);
     }
     function show() {
       if (bm_form_div) return;
       bm_form_div = $c('div');
       bm_form_div.textContent = 'Loading...';
       bm_form_div.style.marginTop = '1em';
       loader = new Loader(bm_add_anc.href, bm_form_div);
       display.parentNode.insertBefore(bm_form_div, display);
     }
     function hide() {
       if (!bm_form_div) return;
       if (loader) loader.cancel();
       bm_form_div.parentNode.removeChild(bm_form_div);
       bm_form_div = null;
     }
   }
   function init_per_page() {
     var bm_tag_list = $('bookmark_list');
     if (window.location.pathname.match(/^\/bookmark(?:_tag_setting)?\.php/)) {
       if (options.type && options.type.match(/^(?:reg_)?user$/)) {
         // http://www.pixiv.net/bookmark.php?type=user
         /* oAutoPagerizeと衝突する。
          * //div[@class="two_column_body"]/div[@class="two_column_space"]//div[@class="list_box"]/*
          var msgbox = $x('//div[@class="msgbox_bottom"]');
          var form = $x('//div[@class="two_column_space"]/form[@action="bookmark_setting.php"]');
          var list = $x('div[@class="list_box"]', form);
          if (msgbox && form && list) {
          var p = form.parentNode, pp = p.parentNode;
          p.removeChild(form);
          pp.replaceChild(form, p);
          form.replaceChild(p, list);
          p.appendChild(list);
          write_css('.msgbox_bottom[float]{opacity:0.6;}' +
          '.msgbox_bottom[float]:hover{opacity:1;}');
          msgbox.parentNode.removeChild(msgbox);
          form.insertBefore(msgbox, p);
          new Floater(msgbox);
          }
          */
       } else if (bm_tag_list && !options.id) {
         if (conf.bm_tag_order.length) {
           var head = $xa('ul/li[contains(concat(" ", @class, " "), " level0 ")]', bm_tag_list).reverse()[0];
           var list = reorder_tags($xa('ul/li[contains(concat(" ", @class, " "), " level") and not(contains(concat(" ", @class, " "), " level0 "))]', bm_tag_list));
           each(
             list,
             function(list) {
               var ul = $c('ul', bm_tag_list);
               each(
                 list,
                 function(li) {
                   li.parentNode.removeChild(li);
                   ul.appendChild(li);
                 });
             });
           var flat = $t('ul', bm_tag_list)[0].className != 'tagCloud';
           window.bookmarkToggle('bookmark_list', flat ? 'flat' : 'cloud');
         }

         var msgbox = $x('//div[contains(concat(" ", @class, " "), " msgbox_bottom ")]');
         var form = $x('//form[@action="bookmark_setting.php"]');
         if (msgbox && form) {
           msgbox.parentNode.removeChild(msgbox);
           form.insertBefore(msgbox, form.firstChild);
           write_css('.msgbox_bottom{border:0px !important;}' +
                     // ポップアップより下(z-index:90)に表示する
                     '.msgbox_bottom[float]{z-index:90;opacity:0.6;}' +
                     '.msgbox_bottom[float]:hover{opacity:1;}');
           new Floater(msgbox, null, true);
         }
       }
     } else if (window.location.pathname.match(/^\/member_illust\.php/)) {
       switch(options.mode) {
       case 'medium':
         init_illust_page_bookmark();
         each(
           $xa('//div[contains(concat(" ", @class, " "), " centeredNavi ")]//a[contains(@href, "mode=medium")]'),
           function(anc) {
             anc.setAttribute('nopopup', '');
           });

         var elem, pos, de = window.document.documentElement;
         if (conf.scroll == 1) {
           elem = $x('//div[contains(concat(" ", @class, " "), " works_area ")]');
           pos = 0;
         } else if (conf.scroll == 2) {
           elem = $x('//div[contains(concat(" ", @class, " "), " works_display ")]');
           pos = 1;
         }
         if (elem) window.scroll(0, getpos(elem).top - (de.clientHeight - elem.offsetHeight) * pos);

         var works_caption = $x('//p[contains(concat(" ", @class, " "), " works_caption ")]');
         if (works_caption) {
           works_caption.innerHTML = edit_comment(works_caption.innerHTML);
         }

         var img = $x('//div[contains(concat(" ", @class, " "), " works_display ")]/a[starts-with(@href, "member_illust.php?mode=big")]/img');
         // 冒頭メモ参照
         if (img && img.src.match(/^(http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+\/\d+(?:_[0-9a-f]{10})?)_m(\.\w+)(?:\?.*)?$/i)) {
           img.parentNode.href = RegExp.$1 + RegExp.$2;
         }
         break;
       case 'manga':
         if (options.type == 'slide' && window.location.hash.match(/^#page(\d+)$/)) {
           getPageUrl(parseInt(RegExp.$1));
         }
         break;
       case 'manga_tb':
         if (conf.popup_manga_tb && options.illust_id) {
           var murl = 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + options.illust_id;
           var item = new GalleryItem(murl);
           item.preload();
           each(
             $xa('//div[contains(concat(" ", @class, " "), " tbimg_div ")]/a/img'),
             function(img) {
               if (img.src.match(/_p(\d+)\.\w+$/)) {
                 var page = parseInt(RegExp.$1);
                 $ev(img).click(function() { Popup.run(item, page); });
               }
             });
           window.document.documentElement.style.minHeight = '100%';
           window.document.body.style.minHeight = '100%';
         }
         break;
       }
     } else if (window.location.pathname.match(/^\/bookmark_add\.php/)) {
       if (conf.mod_bookmark_add_page && options.type == 'illust') {
         var wrap = $x('//div[contains(concat(" ", @class, " "), " one_column_body ")]');
         var autotag = $x('//h2[contains(text(), "\u8ffd\u52a0")]') ? true : false;
         if (wrap) mod_edit_bookmark(wrap, autotag);
       }
       conf.debug && chk_ext_src('script', 'src', pp.url.js.bookmark_add_v4);
     } else if (window.location.pathname.match(/^\/novel\/show\.php/)) {
       if (illust_html_list.length < illust_id_list.length) {
         var _jump_to = window.jump_to;
         window.jump_to = function() {
           _jump_to.apply(this, [].slice.apply(arguments));
           window.jump_to = _jump_to;
           setTimeout(init_novel, 100);
         };
       } else {
         setTimeout(init_novel, 100);
       }
     }
   }
   function init_novel() {
     if (conf.expand_novel) {
       var cont = $('preview_area'), after = cont.nextSibling;
       each($xa('div[starts-with(@id, "page_")]', cont),
            function(page, idx) {
              if (idx > 0) {
                var newcont = cont.cloneNode(false);
                cont.removeChild(page);

                page.style.display = '';
                if (page.className.split(/\s+/).indexOf('parsed') < 0) {
		  page.innerHTML = window.parse_page(page.innerHTML);
		  page.className += ' parsed';
	        }
                each($xa('.//*[contains(concat(" ", @class, " "), " novelimage ")]', page),
                     function(img) {
                       if (img.className.split(/\s+/).indexOf('added') < 0) {
                         var id = img.getAttribute('illust_id');
                         if (id && window.illust_html_list[id]) {
                           img.innerHTML = window.illust_html_list[id];
		           img.className += 'added';
                         }
                       }
                     });

                newcont.appendChild(page);
                newcont.style.marginTop = '1em';
                cont.parentNode.insertBefore(newcont, after);
              }
            });
     }
   }
   function init_pixplus_real() {
     var ev = window.document.createEvent('Event');
     ev.initEvent('pixplusInitialize', true, true);
     window.document.dispatchEvent(ev);

     pp.rpc_usable = true;
     if (true || !conf.debug) {
       /* イラストページで誤爆防止のためにタグ編集と評価機能を無効化。 */
       for(var id in pp.rpc_ids) {
         if ($(id)) {
           pp.rpc_usable = false;
           break;
         }
       }
     }
     if (pp.rpc_usable) {
       pp.rpc_div = $c('div');
       pp.rpc_div.style.display = 'none';
       window.document.body.insertBefore(pp.rpc_div, window.document.body.firstChild);
     }

     write_css('#header .header_otehrs_ul li{margin-left:0px;}' +
               '#header .header_otehrs_ul li + li{margin-left:16px;}' +
               '*[float]{position:fixed;top:0px;}' +
               // アイコン
               '.pixplus-check{width:14px;height:14px;background-position:-1701px -547px;' +
               '  background-image:url("' + pp.url.img.sprite + '");}' +
               '.pixplus-heart{width:16px;height:14px;background-position:-1701px -480px;' +
               '  background-image:url("' + pp.url.img.sprite + '");}' +
               '.pixplus-flag{width:14px;height:16px;background-position:-1701px -1px;' +
               '  background-image:url("' + pp.url.img.sprite + '");}' +
               // コメント
               (conf.popup.font_size ? '#pp-popup{font-size:' + conf.popup.font_size + ';}' : '') +
               '.works_caption hr, #pp-popup hr{display:block;border:none;height:1px;background-color:silver;}' +
               'hr + br, hr ~ br{display:none;}' +
               // 設定
               '#pp-conf-head form{display:inline;}' +
               '#pp-conf-head input{margin-left:0.2em;}' +
               '#pp-conf-head a{margin-left:1em;}' +
               '.pp-conf-section{display:block;color:#333333;text-decoration:none;font-weight:bold;margin-top:1em;}' +
               '.pp-conf-content{margin-left:1em;}' +
               '#pp-conf-root button{display:block !important;white-space:pre !important;}' +
               '#pp-conf-root textarea{width:100%;}' +
               '.pp-conf-cell-value select, .pp-conf-cell-value input{margin:0px;width:100%;padding:0px;}' +
               '#pp-conf-bookmark-tag_aliases{width:100%;}' +
               '#pp-conf-bookmark-tag_aliases .pp-conf-cell-aliases{width:100%;}' +
               '#pp-conf-bookmark-tag_aliases .pp-conf-cell-aliases input{width:100%;}' +
               // ポップアップ/検索欄がz-index:1000なので
               '#pp-popup{background-color:white;position:fixed;padding:3px;' +
               '  border:2px solid gray;z-index:10000;}' +
               '#pp-popup #pp-header{line-height:1.1em;}' +
               '#pp-popup #pp-title{font-size:larger;font-weight:bold;}' +
               '#pp-popup #pp-title:hover{text-decoration:none;}' +
               '#pp-popup #pp-right{float:right;font-size:smaller;}' +
               '#pp-popup #pp-right > * + *{margin-left:0.4em;}' +
               '#pp-popup #pp-right a{color:#258fb8;font-weight:bold;}' +
               '#pp-popup #pp-right a[enable]{color:gray;font-weight:normal;}' +
               '#pp-popup #pp-header{background-color:white;}' +
               '#pp-popup #pp-header #pp-caption{padding-top:2px;position:absolute;' +
               '  background-color:white;z-index:10010;opacity:0;padding-bottom:1px;}' +
               '#pp-popup #pp-header:hover #pp-caption{opacity:' + conf.popup.caption_opacity + ';}' +
               '#pp-popup #pp-header #pp-caption[show]{opacity:' + conf.popup.caption_opacity + ';visibility:visible;}' +
               '#pp-popup #pp-caption .pp-separator{border-bottom:1px solid gray;margin-bottom:1px;padding-bottom:1px;}' +
               '#pp-popup #pp-comment-wrap{overflow:auto;line-height:1.2em;}' +
               '#pp-popup #tag_area > * + *{margin-left:0.6em;}' +
               '#pp-popup #tag_area > span > a + a{margin-left:0.2em;}' +
               '#pp-popup #tag_area > #pp-tag-edit-btn{font-size:smaller;color:gray;line-height:1.1em;}' +
               '#pp-popup #pp-post-cap{line-height:1.1em;position:relative;}' +
               '#pp-popup #pp-post-cap #pp-author-img{box-sizing:border-box;' +
               '  float:left;max-height:3.3em;border:1px solid gray;margin-right:4px;}' +
               '#pp-popup #pp-post-cap #pp-author-img:hover{max-height:100%;}' +
               '#pp-popup #pp-post-cap #pp-date-wrap > span + span{margin-left:0.6em;}' +
               '#pp-popup #pp-post-cap #pp-date-wrap:after{content:"\\a";white-space:pre-wrap;line-height:1em;}' +
               '#pp-popup #pp-post-cap #pp-date-repost{font-size:smaller;line-height:1.1em;}' +
               '#pp-popup #pp-post-cap #pp-date-repost:before{content:"(\u518d ";}' +
               '#pp-popup #pp-post-cap #pp-date-repost:after{content:")";}' +
               '#pp-popup #pp-post-cap #pp-info-wrap > span + span{margin-left:0.6em;}' +
               '#pp-popup #pp-post-cap #pp-info-wrap:after{content:"\\a";white-space:pre-wrap;line-height:1em;}' +
               '#pp-popup #pp-post-cap #pp-info-tools > * + *{margin-left:0.6em;}' +
               '#pp-popup #pp-post-cap #pp-author-status{position:absolute;left:3px;top:2px;display:inline-block;}' +
               '#pp-popup #pp-post-cap #pp-author-img:hover + #pp-author-status{display:none;}' +
               '#pp-popup #pp-post-cap #pp-author a{font-weight:bold;}' +
               '#pp-popup #pp-post-cap #pp-author a + a{margin-left:0.6em;}' +
               '#pp-popup #pp-bm-edit{margin-top:2px;}' +
               '#pp-popup #pp-img-div{margin-top:2px;text-align:center;min-width:320px;line-height:0px;}' +
               '#pp-popup #pp-img-div img, #pp-popup #pp-img-div svg{border:1px solid silver;}' +
               '#pp-popup .pp-olc{position:absolute;cursor:pointer;z-index:1004;opacity:0;background-color:gainsboro;}' +
               '#pp-popup .pp-olc:hover{opacity:0.6;}' +
               '#pp-popup #pp-olc-prev{left:3px;}' +
               '#pp-popup #pp-olc-next{right:3px;}' +
               /*
                '#pp-popup .olc-prev:before, #pp-popup .olc-next:before{display:block;position:absolute;bottom:0;' +
                '  background-color:white;border:1px solid silver;border-bottom-width:0px;font-size:120%;font-weight:bold;' +
                '  padding:0.2em 0.6em;text-decoration:none;line-height:1em;background-color:white;color:gray;}' +
                '#pp-popup .olc-prev:before{left:0px;content:"Prev";border-left-width:0px;border-top-right-radius:0.6em;}' +
                '#pp-popup .olc-next:before{right:0px;content:"Next";border-right-width:0px;border-top-left-radius:0.6em;}' +
                */
               (conf.popup.remove_pixpedia ? "#pp-popup a[href^=\"http://dic.pixiv.net/\"]{display:none;}" : "") +
               // rating
               '#pp-popup #pp-rating{padding:0px !important;}' +
               '#pp-popup #pp-rating input{display:block;line-height:1em;}' +
               '#pp-popup #pp-rating input:focus{background-color:#feffdf;}' +
               '#pp-popup #pp-rating span + span{margin-left:0.4em;}' +
               '#pp-popup #pp-rating ul.unit-rating{margin:0px;float:none;}' +
               '#pp-popup #pp-rating #quality_rating{float:none !important;}' +
               '#pp-popup #pp-rating h4{margin:0px;}' +
               '#pp-popup #pp-rating #result{font-size:inherit !important;width:100% !important;}' +
               '#pp-popup #pp-rating #result > div{width:auto !important;}' +
               '#pp-popup #pp-rating dl.ra_a dt{width:100%;}' +
               '#pp-popup #pp-rating dl.ra_a dd{margin-top:-1.1em;}' +
               '#pp-popup #pp-rating dl.ra_a:after{content:"";clear:both;height:0;display:block;visibility:hidden;}' +
               '#pp-popup #pp-rating dl.ra_a dt:nth-child(4n+1){background-color:#efefef;}' +
               '#pp-popup #pp-rating #result div[highlight]{background-color:#efefef;}' +
               '#pp-popup #pp-rating #quality_rating{width:100% !important;}' +
               // comments
               '#pp-popup #pp-viewer-comments > div{margin-left:0.8em;padding-left:4px;border-left:3px solid #d6dee5;}' +
               '#pp-popup #pp-viewer-comments input + input{margin-left:0.4em;}' +
               '#pp-popup #pp-viewer-comments .worksComment{padding:2px 0px;}' +
               '#pp-popup #pp-viewer-comments .worksComment:last-child{border:none;}'
              );

     init_config_ui();
     init_galleries();
     init_recommend();
     init_taglist();
     init_per_page();

     if (conf.bookmark_hide) {
       each($xa('.//a[contains(@href, "bookmark.php")]'),
            function(anc) {
              if (!anc.href.match(/[\?&]rest=/) &&
                  (anc.href.match(/[\?&]type=illust/) ||
                   !anc.href.match(/[\?&]type=/))) {
                anc.href += (anc.href.match(/\?/) ? "&" : "?") + "rest=hide";
              }
            });
     }

     if (conf.stacc_link) {
       var stacc_anc;
       if (['all', 'mypixiv', 'favorite', 'self'].indexOf(conf.stacc_link) < 0) {
         safeWindow.alert('conf.stacc_link: invalid value - ' + conf.stacc_link);
       } else if ((stacc_anc = $x('//div[@id="nav"]/ul/li/a[contains(@href, "/stacc")]'))) {
         if (conf.stacc_link == 'all') {
           stacc_anc.href = '/stacc/p/all';
         } else {
           stacc_anc.href = '/stacc/my/home/' + conf.stacc_link + '/all';
         }
       }
     }

     if (conf.default_manga_type) {
       if (['scroll', 'slide'].indexOf(conf.default_manga_type) < 0) {
         safeWindow.alert('conf.default_manga_type: invalid value - ' + conf.default_manga_type);
       } else {
         // http://www.pixiv.net/member_illust.php?mode=manga&illust_id=00000000&type=scroll
         each(
           $xa('//a[contains(@href, "member_illust.php?mode=manga")]'),
           function(anc) {
             if (!anc.textContent.match(/^(?:\u30b9\u30af\u30ed\u30fc\u30eb|\u30b9\u30e9\u30a4\u30c9)\u5f0f/)) {
               var o = parseopts(anc.href);
               if (!o.type) anc.href += '&type=' + conf.default_manga_type;
             }
           });
       }
     }

     if (conf.fast_user_bookmark && window.pixiv && window.pixiv.Favorite) {
       (function() {
          var _open = window.pixiv.Favorite.prototype.open;
          window.pixiv.Favorite.prototype.open = function() {
            var btn = $('favorite-button');
            var form = $x('//*[@id="favorite-preference"]//form[contains(@action, "bookmark_add.php")]');
            var restrict = $xa('.//input[@name="restrict"]', form);
            if (btn && form && restrict.length == 2) {
              var xhr = new window.XMLHttpRequest();
              xhr.open('POST', form.getAttribute('action'), true);
              xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
              xhr.onload = function() {
                if (xhr.responseText.match(/<div[^>]+class=\"[^\"]*one_complete_title[^\"]*\"[^>]*>[\r\n]*<a[^>]+href=\"member\.php\?id=[^>]*>/i)) {
                  window.jQuery('#favorite-button')
		    .addClass('added')
		    .attr('title', '\u304a\u6c17\u306b\u5165\u308a\u3067\u3059');
	          window.jQuery('form', this.preference)
		    .attr('action', '/bookmark_setting.php')
                    .find('div.action').append('<input type="button" value="\u304a\u6c17\u306b\u5165\u308a\u89e3\u9664" class="button remove"/>')
                    .find('input[name="mode"]').remove();
                  btn.style.opacity = '1';
                } else if (xhr.responseText.match(/<span[^>]+class=\"error\"[^>]*>(.+)<\/span>/i)) {
                  safeWindow.alert(RegExp.$1);
                } else {
                  safeWindow.alert('Error!');
                }
              };
              xhr.onerror = function() {
                safeWindow.alert('Error!');
              };
              each(restrict, function(r) { r.checked = r.value == conf.fast_user_bookmark - 1; });
              xhr.send(create_post_data(form));
              btn.style.opacity = '0.2';
            } else {
              _open.apply(this, [].slice.apply(arguments));
            }
          };
        })();
     }

     (function() {
        var ev = window.document.createEvent('Event');
        ev.initEvent('pixplusLoaded', true, true);
        window.document.dispatchEvent(ev);
      })();
   }
   function init_pixplus() {
     window.document.body.setAttribute('pixplus', '');

     each($xa('//a[contains(@href, "jump.php")]'),
          function(anc) {
            if (anc.href.match(/^(?:http:\/\/www\.pixiv\.net)?\/?jump\.php\?(.*)$/)) {
              var url = RegExp.$1;
              if (url.match(/^\w+%3a%2f%2f/i)) url = decodeURIComponent(url);
              anc.href = url;
            }
          });

     load_css(pp.url.css.bookmark_add);

     if (chk_ext_src('script', 'src', pp.url.js.illust_recommender)) {
       //pp.recommender.loaded = true;
       //each(pp.recommender.funcs, function(func) { func(); });
       (function() {
          var _show = window.IllustRecommender.prototype.show;
          window.IllustRecommender.prototype.show = function() {
            _show.apply(this, [].slice.apply(arguments));
            pp.recommender.loaded = true;
            each(pp.recommender.funcs, function(func) { func(); });
            window.IllustRecommender.prototype.show = _show;
          };
        })();
     }

     (function($js) {
        if (!$x('//script[contains(@src, "/rating_manga")]')) {
          $js = $js.script(pp.url.js.rating);
        }
        return $js;
      })($js
         .script(pp.url.js.jquery)
         .wait(function() {
                 window.jQuery.noConflict();
                 var _ajax = window.jQuery.ajax;
                 window.jQuery.ajax = function(obj) {
                   if (obj) obj.url = mod_rpc_url(obj.url);
                   _ajax.apply(this, [].slice.apply(arguments));
                 };
                 init_pixplus_real();
               })
         .script(pp.url.js.prototypejs)
         .wait()
         .script(pp.url.js.effects)
         .script(pp.url.js.rpc)
         .wait(function() {
                 if (conf.disable_effect) {
                   window.jQuery.fx.off = true;
                   window.Effect.ScopedQueue.prototype.add = function(effect) {
                     effect.loop(effect.startOn);
                     effect.loop(effect.finishOn);
                   };
                 }
               })
        )
       .script(pp.url.js.tag_edit);
   }

   function GalleryItem(url, thumb, caption, prev, gallery) {
     var id = parseInt(url.match(/[\?&]illust_id=(\d+)/)[1]);
     if (gallery && gallery.args.skip_dups && prev && id == prev.id) prev = prev.prev;

     this.loaded  = false;
     this.gallery = gallery;
     this.thumb   = thumb;
     this.caption = caption;
     this.id      = id;
     this.medium  = urlmode(url, 'medium');
     this.big     = urlmode(url, 'big');
     this.prev    = prev || null;
     this.next    = null;
     this.manga   = { viewed: false };
     this.img_med = null;
     this.img_big = null;

     if (gallery) {
       this.page_item = ++gallery.page_item;
       this.page_col  = gallery.page_col;
     } else {
       this.page_item = 0;
       this.page_col  = 0;
     }

     this.img_url_base = null;
     this.img_url_ext  = null;
     if (this.thumb) this.parse_img_url(this.thumb.src);
     return this;
   }
   GalleryItem.prototype.parse_img_url = function(url) {
     // 冒頭メモ参照
     if (url.match(/^(http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+\/\d+(?:_[0-9a-f]{10})?)(?:_[sm]|_100|_p\d+)?(\.\w+)$/)) {
       this.img_url_base = RegExp.$1;
       this.img_url_ext  = RegExp.$2;
     }
   };
   GalleryItem.prototype.popup = function() {
     Popup.run(this);
   };
   GalleryItem.prototype.preload = function() {
     if (conf.popup.preload) {
       var self = this;
       if (!this.loaded) {
         this.loaded = true;
         new Popup.Loader(this, conf.popup.auto_manga_p && (conf.popup.auto_manga & 4) ? preload_manga : null);
         function preload_manga() {
           new Popup.MangaLoader(self, 0);
         }
       }
     }
   };
   function Gallery(args, filter_col, filter) {
     this.args = args;
     this.args.xpath_cap = this.args.xpath_cap || 'ul/li/text()[1]';
     this.args.xpath_tmb = this.args.xpath_tmb || 'preceding-sibling::a[position()=1 and contains(@href, "mode=medium")]/img';
     this.filter_col = filter_col;
     this.filter = filter;

     this.items     = [];
     this.idmap     = {};
     this.first     = null;
     this.last      = null;
     this.prev_dups = [];
     this.page_item = 0;
     this.page_col  = 0;

     this.onadditem = new Signal();

     if (this.args.xpath_col) {
       var self = this;
       this.detect_new_collection();
       //if (this.page_col == 0) throw 1;
       window.document.body.addEventListener(
         'DOMNodeInserted',
         function() {
           setTimeout(function() { self.detect_new_collection(); }, 100);
         }, false);
       Gallery.oncreate.emit(this);
     } else {
       throw 1;
     }
     return this;
   }
   Gallery.get_url = function(cap, thumb) {
     var thumb_anc = thumb && $x('ancestor-or-self::a', thumb);
     return (cap && cap.href) || (thumb_anc && thumb_anc.href);
   };
   Gallery.oncreate = new Signal();
   Gallery.prototype.detect_new_collection = function() {
     var self = this;
     each($xa(this.args.xpath_col, this.args.root),
          function(col) {
            if (!col.hasAttribute('pixplus_loaded')) {
              self.add_collection(col);
            }
          });
   };
   Gallery.prototype.add_collection = function(col) {
     if (this.filter_col) this.filter_col(col);
     var elements = $xa(this.args.thumb_only ? this.args.xpath_tmb : this.args.xpath_cap, col);
     if (!elements.length) return;
     log('collection detected - ' + elements.length);
     col.setAttribute('pixplus_loaded', 'true');

     var self = this;
     var prev = this.last;
     this.page_item = 0;
     ++this.page_col;
     each(elements,
          function(elem, cnt) {
            var thumb, cap;
            if (self.args.thumb_only) {
              thumb = elem;
            } else {
              thumb = $x(self.args.xpath_tmb, elem);
              cap = elem;
            }
            if ((!self.args.allow_nothumb || cnt < self.args.allow_nothumb) && !thumb) return;

            var url = (self.args.get_url || Gallery.get_url)(cap, thumb);
            if (!url || !url.match(/[\?&]illust_id=(\d+)/)) return;

            if (cap) {
              if (cap.nodeType == 3) {
                var new_caption = $c('a');
                new_caption.href = url;
                new_caption.textContent = trim(cap.nodeValue);
                new_caption.setAttribute('nopopup', '');
                cap.parentNode.replaceChild(new_caption, cap);
                cap = new_caption;
              } else if (lc(cap.tagName) == 'a') {
                cap.setAttribute('nopopup', '');
              } else if (!$x('ancestor::a', cap)) {
                if (cap.childNodes.length == 1 && cap.firstChild.nodeType == 3) {
                  cap.innerHTML = '<a href="' + url + '" nopopup>' + cap.innerHTML + '</a>';
                }
              }
            }

            var item = new GalleryItem(url, thumb, cap, prev, self);

            var pbtn = thumb;
            if (!thumb && cap) {
              pbtn = $c('a');
              pbtn.href = url;
              pbtn.textContent = '\u25a0';
              pbtn.style.marginRight = '4px';
              cap.parentNode.insertBefore(pbtn, cap);
              item.added_popup_button = pbtn;
            }
            if (pbtn) $ev($x('ancestor::a', pbtn) || pbtn).click(function() { Popup.run(item); });

            if (!self.first) self.first = item;
            if (self.filter) self.filter(item);

            if (self.args.skip_dups && self.idmap[item.id]) {
              self.prev_dups.push(item);
            } else {
              if (prev) prev.next = item;
              if (self.prev_dups.length) {
                each(self.prev_dups, function(p) { p.next = item; });
                self.prev_dups = [];
              }
              self.last = prev = item;
              self.items.push(item);
              self.idmap[item.id] = item;
              self.onadditem.emit(self, item);
            }
          });
   };

   function Popup(item, manga_page) {
     this.root_div              = $c('div',     null,               'pp-popup');
     this.header                = $c('div',     this.root_div,      'pp-header');
     // 文字によってはキャプションの幅計算が壊れるのでタイトルをblockなエレメントでラップする
     this.title_div             = $c('div',     this.header,        'pp-title_wrapper');
     this.title                 = $c('a',       this.title_div,     'pp-title');
     this.title.setAttribute('nopopup', '');
     this.header_right          = $c('span',    this.title_div,     'pp-right');
     this.status                = $c('span',    this.header_right,  'pp-status');
     this.status.style.display  = 'none';
     this.manga_btn             = $c('a',       this.header_right,  'pp-manga-btn');
     $ev(this.manga_btn).click(bind(function() { this.toggle_manga_mode(); }, this));
     this.res_btn               = Popup.create_button('[R]', this.header_right, 'pp-res-btn');
     this.comments_btn          = Popup.create_button('[C]', this.header_right, 'pp-comments-btn',
                                                      bind(this.toggle_viewer_comments, this));
     this.bm_btn                = Popup.create_button('[B]', this.header_right, 'pp-bm-btn',
                                                      bind(this.edit_bookmark, this));
     this.caption               = $c('div',     this.header,        'pp-caption');
     this.err_msg               = $c('div',     this.caption,       'pp-error', 'pp-separator');
     this.comment_wrap          = $c('div',     this.caption,       'pp-comment-wrap');
     this.comment               = $c('div',     this.comment_wrap,  'pp-comment');
     this.viewer_comments       = $c('div',     this.comment_wrap,  'pp-viewer-comments');
     this.viewer_comments_w     = $c('div',     this.viewer_comments);
     this.viewer_comments_c     = $c('div',     this.viewer_comments_w);
     this.viewer_comments_a     = $c('div',     this.viewer_comments_w, 'one_comment_area');
     this.tag_edit              = $c('div',     this.comment_wrap,  'tag_edit');
     this.tags                  = $c('div',     this.caption,       'tag_area', 'pp-separator');
     this.rating                = $c('div',     this.caption,       'pp-rating', 'pp-separator works_area');
     this.post_cap              = $c('div',     this.caption,       'pp-post-cap');
     this.a_img                 = $c('img',     this.post_cap,      'pp-author-img');
     this.a_status              = $c('span',    this.post_cap,      'pp-author-status');
     this.date_wrap             = $c('span',    this.post_cap,      'pp-date-wrap');
     this.date                  = $c('span',    this.date_wrap,     'pp-date');
     this.date_repost           = $c('span',    this.date_wrap,     'pp-date-repost');
     this.info                  = $c('span',    this.post_cap,      'pp-info-wrap');
     this.info_size             = $c('span',    this.info,          'pp-info-size');
     this.info_scale            = $c('span',    this.info,          'pp-info-scale');
     this.info_tools            = $c('span',    this.info,          'pp-info-tools');
     this.author                = $c('span',    this.post_cap,      'pp-author');
     this.a_profile             = $c('a',       this.author);
     this.a_illust              = $c('a',       this.author);
     this.a_illust.textContent  = '\u4f5c\u54c1';
     this.a_bookmark            = $c('a',       this.author);
     this.a_bookmark.textContent = '\u30d6\u30c3\u30af\u30de\u30fc\u30af';
     this.a_stacc               = $c('a',       this.author);
     this.a_stacc.textContent   = '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9';
     this.bm_edit               = $c('div',     this.root_div,      'pp-bm-edit');
     this.img_div               = $c('div',     this.root_div,      'pp-img-div');
     this.img_anc               = $c('a',       this.img_div);
     this.image                 = $c('img',     this.img_anc);
     this.image_scaled          = this.image;

     if (conf.popup.overlay_control > 0) {
       this.olc_prev            = $c('span', this.img_div, 'pp-olc-prev', 'pp-olc');
       this.olc_next            = $c('span', this.img_div, 'pp-olc-next', 'pp-olc');
       $ev(this.olc_prev).click(bind(function() { this.prev(false, false, true); }, this));
       $ev(this.olc_next).click(bind(function() { this.next(false, false, true); }, this));
     }

     this.init_display();
     this.init_comments();

     this.bm_loading = false;
     this.rating_enabled = false;
     this.viewer_comments_enabled = false;
     this.expand_header = false;
     this.tag_editing = false;
     this.tag_edit_enabled = false;
     this.has_qrate = false;
     this.has_image_response = false;
     this.zoom_scale = 1;

     var self = this;
     this.manga = {
       usable:      false,
       enabled:     false,
       page:        -1,
       page_count:  -1,
       preload_map: {},
       init: function() {
         this.usable      = false;
         this.enabled     = false;
         this.page        = -1;
         this.page_count  = -1;
         this.preload_map = {};
       },
       preload: function() {
         if (conf.popup.preload) {
           var page = this.page + 1;
           if (page < this.page_count && !this.preload_map[page]) {
             new Popup.MangaLoader(self.item, page);
           }
         }
       },
       get_url: function(page) {
         var mode = conf.default_manga_type ? '&type=' + conf.default_manga_type : '';
         return 'http://www.pixiv.net/member_illust.php?mode=manga&illust_id=' + self.item.id + mode + '#page' + page;
       }
     };

     $ev(this.img_anc).click(bind(function(ev) { Popup.onclick.emit(this, ev); }, this));
     $ev(this.viewer_comments).click(
       bind(function(ev) {
              if (ev.target === this.viewer_comments ||
                  ev.target === this.viewer_comments_w) {
                this.toggle_viewer_comment_form();
              }
            }, this));

     Popup.oncreate.emit(this, item, manga_page);
   }
   Popup._keypress = function(ev, key) {
     Popup.instance.keypress(ev, key);
   };
   Popup._locate = function() {
     Popup.instance.locate();
   };
   Popup.set_event_handler = function() {
     Popup.ev_conn_key = $ev(window).key(Popup._keypress);
     window.addEventListener('resize', Popup._locate, false);
   };
   Popup.unset_event_handler = function() {
     Popup.ev_conn_key.disconnect();
     window.removeEventListener('resize', Popup._locate, false);
   };
   Popup.oncreate = new Signal(
     function(item, manga_page) {
       //window.document.body.insertBefore(this.root_div, window.document.body.firstChild);
       window.document.body.appendChild(this.root_div);
       this.locate();
       this.set(item, false, false, false, typeof manga_page == 'number' ? manga_page : -1);
       Popup.set_event_handler();
     });
   Popup.onsetitem = new Signal();
   Popup.onload = new Signal();
   Popup.onkeypress = new Signal(
     function(ev, key) {
       var p = this, s = ev.shiftKey, m_e = p.manga.enabled;
       if (p.is_bookmark_editing()) {
         if (key == $ev.KEY_ESCAPE && m()) q(ev, p.close_edit_bookmark);
       } else {
         switch(key) {
         case 'a': if (m())  q(ev, p.prev, true);               return;
           //case 's': if (m())  q(ev, p.next, true);               return;
         case 'e': if (m())  q(ev, p.open_author_profile,   s); return;
         case 'r': if (m(1)) q(ev, a_illust,                s); return;
         case 't': if (m())  q(ev, p.open_author_bookmark,  s); return;
         case 'y': if (m())  q(ev, p.open_author_staccfeed, s); return;
         case 'b': if (m(1)) q(ev, bookmark, s);                return;
         case 'd': if (m())  q(ev, p.toggle_qrate);             return;
         case 'f': if (m(1)) q(ev, p.open, !s);                 return;
         case 'g': if (m())  q(ev, p.reload);                   return;
         case 'c': if (m(1)) q(ev, caption, s);                 return;
         case 'v': if (m(1)) q(ev, manga, s);                   return;
         case '-': if (m(1)) q(ev, zoom, -1);                   return;
         case '+': if (m(1)) q(ev, zoom,  1);                   return;
         }
         if (conf.popup.rate && conf.popup.rate_key && s && key.length == 1) {
           var score = '1234567890!"#$%&\'()~'.indexOf(key);
           if (score >= 0) {
             window.countup_rating(10 - (score % 10));
             return;
           }
         }
         if (ev.qrate) {
           var n;
           switch(key) {
           case $ev.KEY_UP:     if (m()) q(ev, sel_qr, ev.qrate.previousSibling); return;
           case $ev.KEY_DOWN:   if (m()) q(ev, sel_qr, ev.qrate.nextSibling);     return;
           case $ev.KEY_ESCAPE: if (m()) q(ev, window.rating_ef2);                return;
           }
         } else {
           switch(key) {
           case $ev.KEY_BACKSPACE: if (m()) q(ev, p.prev, true);                                return;
           case $ev.KEY_SPACE:     if (m()) q(ev, p.next, true);                                return;
           case $ev.KEY_LEFT:      if (m()) q(ev, p.prev);                                      return;
           case $ev.KEY_RIGHT:     if (m()) q(ev, p.next);                                      return;
           case $ev.KEY_UP:        if (m()) q(ev, p.scroll_caption, -conf.popup.scroll_height); return;
           case $ev.KEY_DOWN:      if (m()) q(ev, p.scroll_caption,  conf.popup.scroll_height); return;
           case $ev.KEY_END:       if (m()) q(ev, p.last);                                      return;
           case $ev.KEY_HOME:      if (m()) q(ev, p.first);                                     return;
           case $ev.KEY_ESCAPE:    if (m()) q(ev, m_e ? p.toggle_manga_mode : p.close);         return;
           }
         }
       }
       function a_illust(response) {
         response ? p.open_image_response() : p.open_author_illust();
       }
       function bookmark(detail) {
         detail ? p.open_bookmark_detail() : p.toggle_edit_bookmark();
       }
       function caption(comments) {
         comments ? p.toggle_viewer_comments() : p.toggle_caption();
       }
       function manga(tb) {
         tb ? p.open_manga_tb() : p.toggle_manga_mode();
       }
       function zoom(z) {
         p.set_zoom(p.zoom_scale + z);
       }
       function sel_qr(node) {
         if (Popup.is_qrate_button(node)) node.focus();
       }
       function q(e, f) {
         if (e) e.preventDefault();
         return f.apply(p, [].slice.apply(arguments, [2]));
       }
       function m(shift, ctrl, alt, meta) {
         if (!shift && ev.shiftKey) return false;
         if (!ctrl  && ev.ctrlKey)  return false;
         if (!alt   && ev.altKey)   return false;
         if (!meta  && ev.metaKey)  return false;
         return true;
       }
     });
   Popup.onclick = new Signal(function(ev) { this.close(); });
   Popup.onclose = new Signal(
     function() {
       Popup.unset_event_handler();
       Popup.instance = null;
     });
   Popup.run = function(item, manga_page) {
     if (item) {
       if (Popup.instance) {
         Popup.instance.set(item, false, false, false, manga_page);
       } else {
         Popup.instance = new Popup(item, manga_page);
       }
     }
     return Popup.instance;
   };
   Popup.run_url = function(url) {
     var item = new GalleryItem(url, null, null, Popup.instance ? Popup.instance.item : null);
     if (Popup.instant_prev) Popup.instant_prev.next = item;
     Popup.instant_prev = item;
     return Popup.run(item);
   };
   Popup.create_button = function(text, parent, id, cb_click) {
     var btn = $c('a', parent, id);
     btn.href = 'javascript:void(0)';
     btn.textContent = text;
     if (cb_click) $ev(btn).click(cb_click);
     return btn;
   };

   Popup.prototype.init_display = function() {
     each([this.manga_btn,
           this.res_btn,
           this.bm_btn,
           this.err_msg,
           this.comment,
           this.tags,
           this.tag_edit,
           this.rating,
           this.post_cap,
           this.a_img,
           this.author,
           this.a_stacc,
           this.bm_edit,
           this.img_div],
          function(elem) {
            elem.style.display = 'none';
          });
   };
   Popup.prototype.init_comments = function(keep_form) {
     this.comment_wrap.scrollTop = 0;
     this.viewer_comments.style.display = 'none';
     this.viewer_comments_c.innerHTML = '';
     this.viewer_comments_a.innerHTML = '';
     if (pp.rpc_usable) {
       this.comments_btn.style.display = '';
       this.comments_btn.removeAttribute('enable');
       if (!keep_form) this.viewer_comments_c.style.display = conf.popup.show_comment_form ? 'block' : 'none';
     } else {
       this.comments_btn.style.display = 'none';
     }
   };
   Popup.prototype.set_status = function(msg) {
     this.status.textContent = msg;
     this.status.style.display = '';
     this.err_msg.style.display = 'none';
     this.locate();
   };
   Popup.prototype.error = function(msg) {
     this.set_status('Error!');
     if (msg) {
       this.err_msg.textContent = msg;
       this.err_msg.style.display = '';
     }
   };
   Popup.prototype.complete = function() {
     this.status.style.display = 'none';
   };
   Popup.prototype.first = function() {
     if (this.manga.usable && this.manga.enabled) {
       this.set_manga_page(0);
     } else if (this.item.gallery) {
       this.set(this.item.gallery.first, true);
     }
   };
   Popup.prototype.last = function() {
     if (this.manga.usable && this.manga.enabled) {
       this.set_manga_page(this.manga.page_count - 1);
     } else if (this.item.gallery) {
       this.set(this.item.gallery.last, true);
     }
   };
   Popup.prototype.prev = function(close, loop, no_auto) {
     if (this.manga.usable && this.manga.enabled) {
       var page = this.manga.page - 1;
       if (page < 0 && (conf.popup.auto_manga & 4)) {
         this.manga.enabled = false;
         this.prev(close, loop);
       } else {
         this.set_manga_page(page);
       }
     } else {
       var g = this.item.gallery;
       var r = !no_auto && conf.popup.reverse_p;
       var item = r ? this.item.next : this.item.prev;
       if (!item && loop && g) item = r ? g.first : g.last;
       this.set(item, true, close);
     }
   };
   Popup.prototype.next = function(close, loop, no_auto) {
     if (this.manga.usable) {
       if (this.manga.enabled) {
         var page = this.manga.page + 1;
         if (page >= this.manga.page_count && (conf.popup.auto_manga & 4)) {
           this.manga.enabled = false;
           this.next(close, loop);
         } else {
           this.set_manga_page(page);
         }
         return;
       } else if (!no_auto && conf.popup.auto_manga_p && !this.item.manga.viewed) {
         this.set_manga_mode(true);
         return;
       }
     }
     var g = this.item.gallery;
     var r = !no_auto && conf.popup.reverse_p;
     var item = r ? this.item.prev : this.item.next;
     if (!item && loop && g) item = r ? g.last : g.first;
     this.set(item, true, close);
   };
   Popup.prototype.set = function(item, scroll, close, reload, manga_page) {
     if (!item) {
       if (close) this.close();
       return;
     }
     if (this.loader) this.loader.cancel();
     if (!this.item && item.caption) {
       this.title.textContent = trim(item.caption.textContent);
       this.title.href = item.medium;
     }
     var self = this;
     this.set_status('Loading');
     this.item = Popup.lastitem = item;
     this.init_manga_page = manga_page;
     this.loader = new Popup.Loader(
       this.item,
       function() { self.load(this, scroll); },
       function(msg) {
         self.error(msg);
         // エラーでも画像がロード出来れいれば表示する
         // 混乱の恐れがあるのでコメントアウト
         //if (this.image && this.image.complete) self.set_image(this.image);
       },
       reload);
     Popup.onsetitem.emit(this, this.item);
     if (this.conn_g_add_item) {
       this.conn_g_add_item.disconnect();
       this.conn_g_add_item = null;
     }
     if (this.item.gallery) this.conn_g_add_item = this.item.gallery.onadditem.connect(function() { self.update_olc(); });
   };

   Popup.prototype.load = function(loader, scroll) {
     var self = this;
     //this.root_div.style.visibility = 'hidden';
     this.complete();

     if (scroll) lazy_scroll(this.item.thumb || this.item.caption);

     this.expand_header = false;
     this.tag_editing = false;

     this.init_comments();
     this.manga.init();

     if (pp.rpc_usable) {
       var rpc_html = '';
       pp.rpc_state = 0;
       for(var id in pp.rpc_ids) {
         if (loader.text.match(new RegExp('(<div[^>]+id="' + id + '"[^>]*>[^<]+</div>)', 'i'))) {
           rpc_html += RegExp.$1;
           pp.rpc_state |= pp.rpc_ids[id];
         }
       }
       pp.rpc_div.innerHTML = rpc_html;
     }

     var img_size = false, _title = 'Error!';
     this.date_wrap.style.display = 'none';
     this.info.style.display = '';
     this.info_tools.style.display = 'none';
     /* ツールは「&nbsp;」区切り
      * R-18やマイピク限定の場合は全角スペースを挟んでその旨表示
      */
     if (loader.text.match(/<div[^>]+class="works_data"[^>]*>[\r\n]*<p>([^\u3000]*).*?<\/p>[\r\n]*?<h3>(.*)<\/h3>/i)) {
       var tmp = RegExp.$1.split('\uff5c');
       _title = trim(RegExp.$2);
       if (tmp[0].match(/((\d{4}\u5e74\d{2}\u6708\d{2})\u65e5 \d{2}:\d{2})/)) {
         var _date = RegExp.$2;
         this.date.textContent = RegExp.$1;
         // 再投稿表示。「日」が抜けてる。pixivのバグ？
         if (loader.text.match(/(\d{4}\u5e74\d{2}\u6708\d{2})\u65e5? (\d{2}:\d{2}) \u306b\u518d\u6295\u7a3f/)) {
           this.date_repost.textContent = (RegExp.$1 == _date ? '' : RegExp.$1 + '\u65e5 ') + RegExp.$2;
           this.date_repost.style.display = '';
         } else {
           this.date_repost.style.display = 'none';
         }
         this.date_wrap.style.display = '';
       }
       if (tmp.length > 1 && tmp[1].match(/(\d+)\u00d7(\d+)|\u6f2b\u753b (\d+)P/)) {
         if (RegExp.$3) {
           this.manga.page_count = parseInt(RegExp.$3);
           this.manga.usable = this.manga.page_count > 0;
         } else {
           img_size = [parseInt(RegExp.$1), parseInt(RegExp.$2)];
         }
       }
       if (tmp.length > 2) {
         // tools.php?tool=hoge
         var html = '';
         each(
           trim(tmp[2]).split('&nbsp;'),
           function(tool) {
             html += '<span>' + tool + '</span>';
           });
         this.info_tools.innerHTML = html;
         this.info_tools.style.display = '';
       }
     }
     this.root_div.setAttribute('manga', this.manga.usable ? 'true' : 'false');

     if (this.item.caption) {
       this.title.textContent = trim(this.item.caption.textContent);
     } else {
       this.title.innerHTML = _title;
     }
     this.title.href = this.item.medium;

     this.set_manga_button_text();
     this.manga_btn.style.display = this.manga.usable ? 'inline' : 'none';
     this.manga_btn.removeAttribute('enable');
     this.manga_btn.href = urlmode(this.item.medium, 'manga_tb');
     this.img_anc.href = (this.manga.usable
                          ? urlmode(this.item.medium, 'manga', conf.default_manga_type)
                          : loader.image.src.replace(/_[sm](\.\w+)$/, '$1'));

     if (loader.text.match(/<a\s+href=\"(\/member\.php\?id=(\d+))[^\"]*\"[^>]*><img\s+src=\"([^\"]+\.pixiv\.net\/[^\"]+)\"\s+alt=\"([^\"]+)\"[^>]*><\/a>/i)) {
       var a_status_class = '';
       this.a_img.src            = RegExp.$3;
       this.a_profile.href       = RegExp.$1;
       this.a_profile.innerHTML  = RegExp.$4; // 属性を使うのでtrimしない。
       this.a_illust.href        = '/member_illust.php?id=' + RegExp.$2;
       this.a_bookmark.href      = '/bookmark.php?id=' + RegExp.$2;
       if (loader.text.match(/<a[^>]+href=\"http:\/\/www\.pixiv\.net(\/stacc\/[^\/]+)\"[^>]+title=\"\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\"/i)) {
         this.a_stacc.href       = RegExp.$1;
         this.a_stacc.style.display = '';
       }
       if (conf.popup.author_status_icon) {
         if (loader.text.match(/<a[^>]+id=\"mypixiv-button\"[^>]+class=\"[^\"]*added[^\"]*\"/i)) {
           a_status_class = 'pixplus-flag';
         } else if (loader.text.match(/<span[^>]+class=\"list_fav\">/i)) {
           a_status_class = 'pixplus-heart';
         } else if (loader.text.match(/<form[^>]+action=\"\/?bookmark_setting\.php\"[^>]*>/i)) {
           a_status_class = 'pixplus-check';
         }
       }
       if (a_status_class) {
         this.a_status.className = a_status_class;
         this.a_status.style.display = '';
       } else {
         this.a_status.style.display = 'none';
       }
       this.a_img.style.display  = '';
       this.author.style.display = '';
       this.post_cap.style.display = '';
     } else {
       this.a_img.style.display  = 'none';
       this.author.style.display = 'none';
     }

     this.has_image_response = false;
     this.res_btn.style.display = 'none';
     // レスポンスする方とされる方に両対応
     if (loader.text.match(/<p[^>]+class=\"worksAlso\"><a[^>]+href=\"\/?(response\.php\?illust_id=(\d+))\">/i)) {
       this.has_image_response = true;
       this.res_btn.href = '/' + RegExp.$1;
       if (RegExp.$2 == this.item.id) {
         this.res_btn.removeAttribute('enable');
       } else {
         this.res_btn.setAttribute('enable', '');
       }
       this.res_btn.style.display = '';
     }

     this.bm_btn.style.display = 'none';
     if (loader.text.match(/<div[^>]+class=\"works_iconsBlock\"[^>]*>([\s\S]*?)<\/div>/i)) {
       if (RegExp.$1.match(/bookmark_detail\.php\?/i)) {
         this.bm_btn.setAttribute('enable', '');
       } else {
         this.bm_btn.removeAttribute('enable');
       }
       this.bm_btn.href = '/bookmark_add.php?type=illust&illust_id=' + this.item.id;
       this.bm_btn.style.display = '';
     }
     this.comment.style.display = 'none';
     if (loader.text.match(/<p[^>]+class=\"works_caption\"[^>]*>(.*)<\/p>/i) &&
         (this.comment.innerHTML = edit_comment(RegExp.$1))) {
       this.comment.style.display = '';
     }

     this.tag_edit_enabled = false;
     this.tags.style.display = 'none';
     if (loader.text.match(/<span[^>]+id=\"tags\"[^>]*>(.*)<\/span>/i)) {
       var html = '';
       each(
         RegExp.$1.replace(/\s*\n\s*/g, '').split('\u3000'),
         function(t) {
           t = trim(t);
           if (t) html += '<span>' + t.replace(/> </g, '><') + '</span>';
         });
       if (html && html.match(/<a /i)) {
         html = html.replace(/(<a[^>]+href=\")(tags\.php[^\"]*)/ig, '$1/$2');
         // タグ編集はrpc_i_id/rpc_u_id/rpc_e_idを要求
         if (pp.rpc_usable && rpc_chk(pp.rpc_req_tag) &&
             loader.text.match(/<a[^>]+onclick="startTagEdit\(\)"/i)) {
           html += '<a href="javascript:void(0)" id="pp-tag-edit-btn" onclick="startTagEdit()">[E]</a>';
           this.tag_edit_enabled = true;
         }
         this.tags.innerHTML = html;
         this.tags.style.display = '';
       }
     }

     this.has_qrate = false;
     this.rating_enabled = false;
     this.rating.style.display = 'none';
     //var re_rtv, re_rtc, re_rtt;
     if (conf.popup.rate && pp.rpc_usable && rpc_chk(pp.rpc_req_rate) &&
         /*
          (re_rtv = loader.text.match(/<div[^>]+id=\"jd_rtv\"[^>]*>(\d+)<\/div>/i)) &&
          (re_rtc = loader.text.match(/<div[^>]+id=\"jd_rtc\"[^>]*>(\d+)<\/div>/i)) &&
          (re_rtt = loader.text.match(/<div[^>]+id=\"jd_rtt\"[^>]*>(\d+)<\/div>/i))
          */
         loader.text.match(/(<div[^>]+id=\"unit\"[^>]*>[\r\n]<h\d>.*<\/h\d>)/i)) {
       /*
        var html = '<div id="rating"><div id="unit"><h4>' +
        '<span>\u95b2\u89a7\u6570: ' + re_rtv[0] + '</span>' +
        '<span>\u8a55\u4fa1\u56de\u6570: ' + re_rtc[0] + '</span>' +
        '<span>\u7dcf\u5408\u70b9: ' + re_rtt[0] + '</span>';
        if (loader.text.match(/(<a[^>]+href=\")\/?(questionnaire_illust\.php[^>]+><img[^>]+><\/a>)/i)) {
        // add '/' for staccfeed
        html += '<span>' + RegExp.$1 + '/' + RegExp.$2 + '</span>';
        }
        html += '</h4>';
        */
       var html = '<div id="rating">' + RegExp.$1;
       if (loader.text.match(/(<ul[^>]+class=\"unit-rating\"[^>]*>[\s\S]*?<\/ul>)/i)) html += RegExp.$1;
       html += '</div>';
       if (rpc_chk(pp.rpc_req_qrate)) {
         var re = loader.text.match(/<h4[^>]+id=\"after_q_rating\"[^>]*>.*<\/h4>/i);
         if (re && loader.text.match(/(<div[^>]+id=\"quality_rating\"[^>]*>[\s\S]*?<\/div>)/i)) {
           html += re[0] + '</div>' + RegExp.$1;
           this.has_qrate = true;
         } else {
           re = loader.text.match(/<h4[^>]*><a[^>]+onClick=\"onOff\('result'\).*<\/h4>/i);
           if (re && loader.text.match(/(<div[^>+]id=\"result\"[\s\S]*?\n<\/div>)/i)) {
             html += re[0] + '</div>' + RegExp.$1;
             this.has_qrate = true;
           }
         }
       }
       if (!this.has_qrate) html += '</div>';
       this.rating.innerHTML = html;
       this.rating.style.display = '';
       this.rating_enabled = true;

       var anc = $x('./div[@id="rating"]/h4/a', self.rating);
       if (anc && anc.getAttribute('onclick') == 'rating_ef4()') {
         anc.onclick = '';
         anc.addEventListener(
           'click',
           function(ev) {
             var qr = $x('./div[@id="quality_rating"]', self.rating);
             window[qr && window.jQuery(qr).is(':visible') ? 'rating_ef2' : 'rating_ef']();
             ev.preventDefault();
           }, false);
       }
     }

     this.viewer_comments_enabled = false;
     if (pp.rpc_usable && loader.text.match(/(<form[^>]+action=\"\/?member_illust\.php\"[^>]*>[\s\S]*?<\/form>)/i)) {
       (function() {
          var form = RegExp.$1, html = '';
          each(form.match(/<input[^>]+type=\"hidden\"[^>]+>/ig),
               function(hidden) { html += hidden; });
          if (html) {
            var comment = $c('input'), submit = $c('input');
            comment.setAttribute('type', 'text');
            comment.setAttribute('name', 'comment');
            comment.setAttribute('maxlength', '255');
            submit.setAttribute('type', 'submit');
            submit.setAttribute('name', 'submit');
            submit.className = 'btn_type04';
            submit.value     = 'Send';

            form = $c('form');
            form.setAttribute('action', '/member_illust.php');
            form.setAttribute('method', 'POST');
            form.innerHTML = html;
            form.appendChild(comment);
            form.appendChild(submit);

            submit.addEventListener(
              'click',
              function(ev) {
                if (trim(comment.value)) {
                  var xhr = new window.XMLHttpRequest();
                  xhr.open('POST', form.getAttribute('action'), true);
                  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
                  xhr.onload = function() {
                    self.reload_viewer_comments();
                    comment.removeAttribute('disabled');
                    comment.value = '';
                    submit.removeAttribute('disabled');
                  };
                  xhr.onerror = function() {
                    safeWindow.alert('Error!');
                  };
                  xhr.send(create_post_data(form));
                  comment.setAttribute('disabled', '');
                  submit.setAttribute('disabled', '');
                } else {
                  safeWindow.alert('\u30b3\u30e1\u30f3\u30c8\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
                }
              }, false);

            self.viewer_comments_c.appendChild(form);
            self.viewer_comments_enabled = true;
          }
        })();
     }

     this.bm_edit.innerHTML = '';

     if (this.manga.usable && this.init_manga_page >= 0) {
       this.set_manga_mode(true, this.init_manga_page);
       this.init_manga_page = -1;
     } else if (conf.popup.auto_manga_p && (conf.popup.auto_manga & 4) && this.manga.usable && !this.item.manga.viewed) {
       this.set_manga_mode(true);
     } else {
       this.set_image(loader.image, img_size, this.manga.usable);
       this.update_olc();
       Popup.onload.emit(this);
       if (this.manga.usable) this.manga.preload();
     }
     if (this.item.prev) this.item.prev.preload();
     if (this.item.next) this.item.next.preload();
   };

   Popup.prototype.set_manga_page = function(page) {
     if (page < 0) {
       this.set(this.item);
     } else if (page != this.manga.page) {
       if (page < this.manga.page_count) {
         var self = this;
         this.set_status('Loading');
         // エラーの時に次のページに移動する
         this.manga.page = page;
         if (this.loader) this.loader.cancel();
         this.loader = new Popup.MangaLoader(
           this.item, page,
           function(loader) { self.manga_onload(loader, page); },
           function(msg) { self.error(msg); });
       } else {
         this.set(this.item);
       }
     }
   };
   Popup.prototype.manga_onload = function(loader, page) {
     this.complete();
     this.item.manga.viewed = true;
     //this.manga.page = page;
     this.set_manga_button_text();
     this.img_anc.href = loader.image.src;
     this.set_image(loader.image);
     this.manga.preload();
   };
   Popup.prototype.set_manga_button_text = function() {
     var page = this.manga.page + 1; // fix for greasemonkey
     this.manga_btn.textContent = '[M:' + page + '/' + this.manga.page_count + ']';
   };
   Popup.create_zoom_image = function(url, width, height) {
     var svg_img = window.document.createElementNS(XMLNS_SVG, 'image');
     svg_img.setAttribute('width', '100%');
     svg_img.setAttribute('height', '100%');
     svg_img.style.imageRendering = 'optimizeSpeed';
     svg_img.setAttributeNS(XMLNS_XLINK, 'xlink:href', url);
     var svg = window.document.createElementNS(XMLNS_SVG, 'svg');
     svg.setAttribute('width', width);
     svg.setAttribute('height', height);
     svg.appendChild(svg_img);
     return svg;
   };

   Popup.prototype.set_image = function(img, img_size, no_zoom) {
     // キャッシュから使い回されているかもしれない。
     var img_scaled = img;
     img.style.cssText = '';
     if (!img_size || !img_size[0]) img_size = [img.width, img.height];

     this.zoom_scale = 1;
     if (!no_zoom && conf.popup.auto_zoom) {
       var len = img.width > img.height ? img.width : img.height;
       if (len <= conf.popup.auto_zoom) {
         this.zoom_scale = Math.floor(conf.popup.auto_zoom_size / len);
         if (this.zoom_scale > conf.popup.auto_zoom_scale) this.zoom_scale = Math.floor(conf.popup.auto_zoom_scale);
         if (this.zoom_scale < 1) this.zoom_scale = 1;
       }
     }

     if (this.zoom_scale > 1) {
       img_scaled = Popup.create_zoom_image(img.src, img.width * this.zoom_scale, img.height * this.zoom_scale);
     }
     this.image_size = [img.width, img.height];
     this.image_size_orig = img_size;
     this.image_scaled.parentNode.replaceChild(img_scaled, this.image_scaled);
     this.image = img;
     this.image_scaled = img_scaled;
     this.img_div.style.display = '';
     this.locate();
     //this.root_div.style.visibility = 'visible';
     this.update_info();
   };

   Popup.prototype.set_zoom = function(zoom) {
     zoom = zoom < 1 ? 1 : Math.floor(zoom);
     if (zoom == this.zoom_scale) return;
     this.zoom_scale = zoom;
     if (this.zoom_scale == 1) {
       this.image_scaled.parentNode.replaceChild(this.image, this.image_scaled);
       this.image_scaled = this.image;
     } else {
       var w = this.image_size[0] * this.zoom_scale, h = this.image_size[1] * this.zoom_scale;
       var img = Popup.create_zoom_image(this.image.src, w, h);
       this.image_scaled.parentNode.replaceChild(img, this.image_scaled);
       this.image_scaled = img;
     }
     this.locate();
     this.update_info();
   };
   Popup.prototype.update_info = function() {
     var scale = Math.floor(this.image_scaled.clientWidth / this.image_size_orig[0] * 100) / 100;
     this.info_size.textContent = this.image_size_orig.join('x');
     this.info_scale.textContent = scale + 'x';
     this.post_cap.style.display = '';
   };

   Popup.prototype.locate = function() {
     var de = window.document.documentElement;
     var tg = this.is_bookmark_editing() ? this.bm_edit : this.image_scaled;
     var mw = de.clientWidth  + tg.offsetWidth  - this.root_div.offsetWidth  - 32;
     var mh = de.clientHeight + tg.offsetHeight - this.root_div.offsetHeight - 32;
     this.root_div.style.minHeight = '';
     if (this.tag_editing) {
       this.root_div.style.minWidth = '746px';
     } else {
       this.root_div.style.minWidth = '';
     }
     if (this.is_bookmark_editing()) {
       //bm_edit.style.maxWidth  = mw + 'px';
       //bm_edit.style.maxHeight = mh + 'px';
     } else {
       tg.style.margin = '0px';
       tg.style.maxWidth = mw + 'px';
       tg.style.maxHeight = mh + 'px';

       /*
        var a_img_height = 0;
        each([this.date_wrap, this.info, this.author],
        function(elem) { a_img_height += elem.offsetHeight; });
        this.a_img.style.maxHeight = a_img_height + 'px';
        */

       this.caption.style.width = this.header.offsetWidth + 'px';

       var cap_height, post_cap_height = this.caption.offsetHeight - this.comment_wrap.offsetHeight - 3;
       if (this.tag_editing || this.expand_header) {
         cap_height = this.img_div.offsetHeight - post_cap_height;
       } else {
         cap_height = this.img_div.offsetHeight * conf.popup.caption_height - post_cap_height;
       }
       this.comment_wrap.style.maxHeight = (cap_height < 48 ? 48 : cap_height) + 'px';
       /*
        if (this.caption.offsetHeight * 2 > this.img_div.offsetHeight) {
        var o = this.root_div.offsetHeight - this.img_div.offsetHeight;
        this.root_div.style.minHeight = (this.caption.offsetHeight * 2 + o) + 'px';
        }
        */
       if (!(this.tag_editing || this.expand_header)) {
         var ph = this.caption.offsetHeight + 48;
         if (tg.offsetHeight < ph) tg.style.margin = (ph - tg.offsetHeight) / 2 + 'px 0px';
       }
       if (conf.popup.overlay_control > 0) {
         var width;
         if (conf.popup.overlay_control < 1) {
           width = Math.floor(this.root_div.clientWidth * conf.popup.overlay_control);
         } else {
           width = Math.floor(conf.popup.overlay_control);
         }
         this.olc_prev.style.width  = width + 'px';
         this.olc_prev.style.height = this.img_div.offsetHeight + 'px';
         this.olc_next.style.width  = width + 'px';
         this.olc_next.style.height = this.img_div.offsetHeight + 'px';
       }
     }
     //safeWindow.alert([de.clientWidth, this.root_div.offsetWidth]);
     this.root_div.style.left = ((de.clientWidth  - this.root_div.offsetWidth)  / 2) + 'px';
     this.root_div.style.top  = ((de.clientHeight - this.root_div.offsetHeight) / 2) + 'px';
   };

   Popup.prototype.update_olc = function(page) {
     if (conf.popup.overlay_control > 0) {
       var m = this.manga.usable && this.manga.enabled;
       this.olc_prev.style.display = m || this.item.prev ? 'inline' : 'none';
       this.olc_next.style.display = m || this.item.next ? 'inline' : 'none';
     }
   };
   Popup.prototype.reload = function() {
     this.set(this.item, null, null, true);
   };
   Popup.prototype.close = function() {
     if (Popup.onclose.emit(this)) return;
     if (this.loader) this.loader.cancel();
     if (this.conn_g_add_item) this.conn_g_add_item.disconnect();
     window.document.body.removeChild(this.root_div);
     if (pp.rpc_usable) {
       pp.rpc_div.innerHTML = '';
       pp.rpc_state = 0;
     }
   };
   Popup.prototype.open = function(big, same_page) {
     var url;
     if (this.manga.usable) {
       if (this.manga.page >= 0) {
         url = big ? this.image.src : this.manga.get_url(this.manga.page);
       } else {
         url = big ? urlmode(this.item.medium, 'manga', conf.default_manga_type) : this.item.medium;
       }
     } else {
       url = big ? this.img_anc.href : this.item.medium;
     }
     this.open_url(url, same_page);
   };
   Popup.prototype.open_image_response = function(same_page) {
     this.has_image_response && this.open_url(this.res_btn.href, same_page);
   };
   Popup.prototype.open_manga_tb = function(same_page) {
     if (this.manga.usable) {
       var url = urlmode(this.item.medium, 'manga_tb');
       this.item.manga.viewed = true;
       this.open_url(url, same_page);
     }
   };
   Popup.prototype.toggle_caption = function() {
     if (this.caption.hasAttribute('show')) {
       this.caption.removeAttribute('show');
     } else {
       this.caption.setAttribute('show', '');
     }
   };
   Popup.is_qrate_button = function(elem) {
     return elem && lc(elem.tagName || '') == 'input' && elem.id.match(/^qr_kw\d+$/) ? true : false;
   };
   Popup.prototype.keypress = function(ev, key) {
     var ae = window.document.activeElement;
     if (ae && lc(ae.tagName || '') == 'input') {
       if (Popup.is_qrate_button(ae)) {
         ev.qrate = ae;
         Popup.onkeypress.emit(this, ev, key);
       }
     } else {
       Popup.onkeypress.emit(this, ev, key);
     }
   };
   Popup.prototype.toggle_qrate = function() {
     if (this.has_qrate) {
       var anc = $x('./div[@id="rating"]/h4/a', this.rating), qr;
       if (anc) {
         this.caption.setAttribute('show', '');
         send_click(anc);
       }
     }
   };

   Popup.prototype.toggle_viewer_comments = function() {
     if (!this.viewer_comments_enabled) return;
     if (!this.viewer_comments_a.innerHTML || !window.jQuery(this.viewer_comments).is(':visible')) {
       this.caption.setAttribute('show', '');
     }
     var self = this;
     if (!this.viewer_comments_a.innerHTML) {
       var i_id = $('rpc_i_id').getAttribute('title');
       var u_id = $('rpc_u_id').getAttribute('title');
       window.sendRequest(
         '/rpc_comment_history.php', 'post', 'i_id=' + i_id + '&u_id=' + u_id,
         function(obj) {
           //window.on_loaded_one_comment_view(obj);
           self.viewer_comments_a.innerHTML = obj.responseText;
           each($xa('.//a[contains(@href, "member_illust.php?mode=comment_del")]', self.viewer_comments_a),
                function(del) {
                  var url = del.getAttribute('href');
                  del.onclick = '';
                  if (url.match(/^\w/)) url = '/' + url;
                  $ev(del).click(
                    function() {
                      if (!confirm('\u30b3\u30e1\u30f3\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u3002' +
                                   '\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f')) return;
                      geturl(url,
                             function(text) {
                               self.reload_viewer_comments();
                             },
                             function() {
                               safeWindow.alert('Error!');
                             },
                             true);
                    });
                });
           show();
         });
     } else if (!window.jQuery(this.viewer_comments).is(':visible')) {
       show();
     }else{
       this.comments_btn.removeAttribute('enable');
       window.jQuery(this.viewer_comments).slideUp(
         200,
         function() {
           self.expand_header = false;
           self.locate();
         });
     }
     function show() {
       self.expand_header = true;
       self.locate();
       self.comments_btn.setAttribute('enable', '');
       window.jQuery(self.viewer_comments).slideDown(200);
       window.jQuery(self.comment_wrap).animate({scrollTop: self.comment.offsetHeight}, 200);
     }
   };

   Popup.prototype.toggle_viewer_comment_form = function() {
     var hidden = this.viewer_comments_c.style.display == 'none', comment;
     this.viewer_comments_c.style.display = hidden ? 'block' : 'none';
     if (hidden && (comment = $x('./form/input[@name="comment"]', this.viewer_comments_c))) comment.focus();
     if (LS.u) LS.set('popup', 'show_comment_form', !!hidden);
   };
   Popup.prototype.reload_viewer_comments = function() {
     if (this.viewer_comments_enabled) {
       this.init_comments(true);
       this.toggle_viewer_comments();
     }
   };

   Popup.prototype.edit_bookmark = function() {
     if (this.bm_loading) return;
     if (!this.is_bookmark_editing()) {
       var self = this;
       var autotag = !this.bm_btn.hasAttribute('enable');
       this.bm_loading  = true;
       this.set_status('Loading...');
       geturl(
         '/bookmark_add.php?type=illust&illust_id=' + this.item.id,
         function(text) {
           self.bm_loading = false;
           if (text.match(/(<form[^>]+action="bookmark_add.php"[\s\S]*?<\/form>)/i)) {
             self.complete();
             // エラー回避
             if (!window.update_input_tag) window.update_input_tag = function() { };
             self.bm_edit.innerHTML = RegExp.$1;
             self.bm_edit.style.display    = '';
             self.caption.style.visibility = 'hidden';
             self.img_div.style.display    = 'none';
             mod_edit_bookmark(
               self.bm_edit, autotag, self.title, self.comment,
               function() {
                 self.close_edit_bookmark();
                 self.reload();
               });
             self.locate();
           } else {
             self.error('Failed to parse bookmark HTML');
           }
         }, function() {
           self.bm_loading = false;
           self.error('Failed to load bookmark HTML');
         }, true);
     } else {
       this.close_edit_bookmark();
     }
   };

   Popup.prototype.close_edit_bookmark = function() {
     this.bm_edit.style.display    = 'none';
     this.caption.style.visibility = conf.popup.oldcap ? 'visible' : '';
     this.img_div.style.display    = '';
     this.locate();
   };
   Popup.prototype.is_bookmark_editing = function() {
     return this.bm_edit.style.display != 'none';
   };
   Popup.prototype.toggle_edit_bookmark = function() {
     this.is_bookmark_editing() ? this.close_edit_bookmark() : this.edit_bookmark();
   };
   Popup.prototype.open_author_profile = function(same_page) {
     if (this.author.style.display != 'none') this.open_url(this.a_profile.href, same_page);
   };
   Popup.prototype.open_author_illust = function(same_page) {
     if (this.author.style.display != 'none') this.open_url(this.a_illust.href, same_page);
   };
   Popup.prototype.open_author_bookmark = function(same_page) {
     if (this.author.style.display != 'none') this.open_url(this.a_bookmark.href, same_page);
   };
   Popup.prototype.open_author_staccfeed = function(same_page) {
     if (this.author.style.display != 'none' && this.a_stacc.style.display != 'none') {
       this.open_url(this.a_stacc.href, same_page);
     }
   };
   Popup.prototype.open_bookmark_detail = function(same_page) {
     this.open_url('http://www.pixiv.net/bookmark_detail.php?illust_id=' + this.item.id, same_page);
   };
   Popup.prototype.set_manga_mode = function(manga_mode, page) {
     if (!this.manga.usable || !!this.manga.enabled == !!manga_mode) return;
     if ((this.manga.enabled = manga_mode)) {
       this.manga.enabled = true;
       this.manga_btn.setAttribute('enable', '');
       this.update_olc();
       this.set_manga_page(page || 0);
     } else {
       this.set(this.item);
     }
   };
   Popup.prototype.toggle_manga_mode = function(page) {
     if (this.manga.usable) this.set_manga_mode(!this.manga.enabled, page);
   };
   Popup.prototype.open_url = function(url, same_page) {
     if (same_page) {
       window.location.href = url;
     } else {
       window.open(url);
     }
   };
   Popup.prototype.scroll_caption = function(pos) {
     this.comment_wrap.scrollTop += pos;
   };

   Popup.Loader = function(item, load_cb, error_cb, reload) {
     var self = this;
     this.load_cb   = load_cb;
     this.error_cb  = error_cb;
     this.cancelled = false;
     this.item      = item;
     this.url       = item.medium;
     this.text      = '';
     this.image     = null;
     this.parallel  = false;
     this.text_cmp  = false;
     this.img_cmp   = false;

     this.item.loaded = true;

     // キャッシュ機能が二重になっちゃってる。
     if (conf.popup.big_image && this.item.img_big) {
       this.image = this.item.img_big;
       this.img_cmp = true;
     } else if (!conf.popup.big_image && this.item.img_med) {
       this.image = this.item.img_med;
       this.img_cmp = true;
     } else if (this.item.img_url_base && !getcache(this.url)) {
       // conf.popup.big_image = trueの時、イラストがマンガなら大きな画像は存在しないので、失敗したらHTMLソースをパースする。
       // キャッシュを持ってる時は同期的にコールバックするのでやらない。推定したURLが404の時に余分なリクエストが発生するため。
       log('trying parallel load - ' + this.item.img_url_base);
       this.parallel = true;
       this.load_image(this.item.img_url_base + (conf.popup.big_image ? '' : '_m') + this.item.img_url_ext);
     }

     geturl(
       this.url,
       function(text) {
         if (text.match(/<span[^>]+class=\"error\"[^>]*>(.+)<\/span>/i)) {
           self.onerror(RegExp.$1.replace(/<[^>]*>/g, ''));
         } else {
           self.text = text;
           self.text_cmp = true;
           if (self.img_cmp) {
             self.onload();
           } else if (!self.parallel) {
             self.parse_text();
           } // else 画像が並列ロード中かキャンセルされた
         }
       }, function() { self.onerror('Failed to load HTML'); }, reload);
     return this;
   };
   Popup.Loader.prototype.load_image = function(url) {
     var self = this;
     getimg(
       url,
       function(img) {
         self.img_cmp = true;
         self.image = img;
         if (conf.popup.big_image) {
           self.item.img_big = img;
         } else {
           self.item.img_med = img;
         }
         self.onload();
       },
       function() {
         if (self.parallel && conf.popup.big_image) {
           log('parallel load failed - ' + self.item.img_url_base);
           self.parallel = false;
           if (self.text_cmp) self.parse_text();
         } else {
           self.onerror('Failed to load image');
         }
       },
       function() {
         self.onerror('Load image aborted');
       });
   };
   Popup.Loader.prototype.parse_text = function() {
     var url = parseimgurl(this.text, conf.popup.big_image);
     if (url) {
       this.load_image(url);
       if (!this.item.img_url_base) this.item.parse_img_url(url);
     } else {
       this.onerror('Failed to parse image URL');
     }
   };
   Popup.Loader.prototype.onload = function() {
     if (!this.cancelled && this.text_cmp && this.img_cmp && this.load_cb) this.load_cb.apply(this);
   };
   Popup.Loader.prototype.onerror = function(msg) {
     uncache(this.url);
     if (!this.cancelled && this.error_cb) this.error_cb.apply(this, [msg]);
     this.cancelled = true;
   };
   Popup.Loader.prototype.cancel = function() {
     this.cancelled = true;
   };

   Popup.MangaLoader = function(item, page, load_cb, error_cb) {
     var self = this;
     this.load_cb   = load_cb;
     this.error_cb  = error_cb;
     this.cancelled = false;
     this.image     = null;
     /* Popup.Loaderで画像URLのパースに失敗するとGalleryItem#img_url_*がnull */
     getimg(
       item.img_url_base + '_p' + page + item.img_url_ext,
       function(img) {
         self.image = img;
         self.onload();
       },
       function() {
         self.onerror('Failed to load manga image');
       });
     return this;
   };
   Popup.MangaLoader.prototype.onload = function() {
     if (!this.cancelled && this.load_cb) this.load_cb(this);
   };
   Popup.MangaLoader.prototype.onerror = function() {
     if (!this.cancelled && this.error_cb) this.error_cb();
   };
   Popup.MangaLoader.prototype.cancel = function() {
     this.cancelled = true;
   };

   function mod_edit_bookmark(root, autotag, title, comment, on_close) {
     var form          = $x('.//form[@action="bookmark_add.php"]', root);
     var input_tag     = $x('.//input[@id="input_tag"]', root);
     var tagcloud      = $x('.//ul[contains(concat(" ", @class, " "), " tagCloud ")]', root);

     var tag_wraps     = $xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]', root);
     var tag_wrap_it   = tag_wraps.length >= 2 ? tag_wraps[0] : null;
     var tag_wrap_bm   = tag_wraps[tag_wraps.length >= 2 ? 1 : 0];
     var tags_illust   = tag_wrap_it ? $xa('ul/li/a', tag_wrap_it) : [];
     var tags_bookmark = $xa('ul/li/a', tag_wrap_bm);

     if (root.className.indexOf('pp-bm-wrap') < 0) root.className += ' pp-bm-wrap';
     if (!arguments.callee.css_written) {
       write_css('.pp-bm-wrap .bookmain_title{padding:4px;}' +
                 '.pp-bm-wrap .bookmain_title_img{text-align:left;}' +
                 '.pp-bm-wrap .box_main_sender{padding-right:0px;padding-bottom:0px;}' +
                 '.pp-bm-wrap .box_one_body{padding:0px;}' +
                 '.pp-bm-wrap .box_one_body > dl{padding:4px 4px 0px 4px;margin:0px;line-height:24px;}' +
                 '.pp-bm-wrap .box_one_body > dl:last-child{padding:4px;}' +
                 '.pp-bm-wrap .box_one_body > dl > dd{margin-top:-24px;}' +
                 '.pp-bm-wrap #pp-autoinput-wrap{text-align:right;line-height:normal;margin-top:4px;}' +
                 '.pp-bm-wrap #pp-autoinput-wrap > a + a{margin-left:0.6em;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag{margin:4px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag + .bookmark_recommend_tag{margin-top:16px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > span:first-child{display:none;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > br{display:none;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > ul{padding:0px;margin:0px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > ul + ul{margin-top:4px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > ul > li{padding:2px;margin-right:4px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > ul > li[selected]{border:2px solid #56E655;padding:0px;}' +
                 '.pp-bm-wrap .bookmark_bottom{padding-bottom:4px;}' +
                 '.pp-bm-wrap .bookmark_bottom input{margin:0px;}');
       arguments.callee.css_written = true;
     }

     var submit = $xa('.//input[@type="submit"]', root);
     if (submit.length == 2) {
       submit[0].parentNode.parentNode.removeChild(submit[0].parentNode);
       submit = submit[1];
     }

     input_tag.focus();

     // いらないもの削除
     var bottom = $x('.//div[contains(concat(" ", @class, " "), " bookmark_bottom ")]', root);
     try {
       if (bottom.firstChild.nodeType == 3 &&
           lc(bottom.firstChild.nextSibling.tagName) == 'br') {
         bottom.removeChild(bottom.firstChild);
         bottom.removeChild(bottom.firstChild);
       }
     } catch (x) { }
     var note = $x('.//dd/text()[contains(., "10\u500b")]', root);
     if (note) {
       remove_node_if_tag_name(note.previousSibling, 'br');
       note.parentNode.removeChild(note);
     }

     var closed = false;
     if (on_close) {
       var close  = $c('input', submit.parentNode, null, 'btn_type01 bookmark_submit_btn');
       close.type  = 'button';
       close.value = '\u3000\u9589\u3058\u308b\u3000';
       close.addEventListener(
         'click',
         function(e) {
           e.preventDefault();
           if (!closed) {
             on_close(false);
             closed = true;
           }
         }, false);
     }

     var autoinput_wrap = $c('div', null, 'pp-autoinput-wrap');
     create_anc('\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u304b\u3089', autoinput_from_caption, autoinput_wrap);
     create_anc('\u81ea\u52d5\u5165\u529b', autoinput_from_tag, autoinput_wrap);
     input_tag.parentNode.appendChild(autoinput_wrap);

     if (conf.bookmark_hide) {
       var hide = $x('.//input[@type="radio" and @name="restrict" and @value="1"]', root);
       if (hide) hide.checked = true;
     }

     submit.addEventListener(
       'click',
       function(e) {
         e.preventDefault();
         var submit_text = submit.value;
         submit.value = '\u3000\u9001\u4fe1\u4e2d\u3000';
         submit.setAttribute('disabled', '');
         var http = new window.XMLHttpRequest();
         http.open('POST', 'http://www.pixiv.net/bookmark_add.php', true);
         http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
         http.onreadystatechange = function() {
           if (http.readyState == 4) {
             submit.value = submit_text;
             submit.removeAttribute('disabled');
             if (on_close && !closed) {
               on_close(true);
               closed = true;
             }
           }
         };
         http.send(create_post_data(form));
       }, false);

     each(tags_illust.concat(tags_bookmark),
          function(it) {
            var tag = it.firstChild.nodeValue;
            it.onclick = '';
            it.addEventListener(
              'click',
              function(e) {
                e.preventDefault();
                window.add_form(tag);
              }, false);
            it.href = '/tags.php?tag=' + tag;
          });

     var ev_key_func;
     $ev(input_tag).key(
       function(ev, key) {
         if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return;
         if (ev_key_func && ev_key_func(ev, key)) return;
         if (key == $ev.KEY_ESCAPE) {
           ev.cancelBubble = true;
           input_tag.blur();
         }
       });

     var initialized = false;
     (function() {
        /* window.jQuery(function)=>jQuery.fn.ready()がjQuery.isReady === trueの時
         * 同期的にコールバックするためwindow.getAllTagsなどが未定義となる。
         * エラー回避のみ。
         */
        var jq_ready = window.jQuery.fn.ready;
        window.jQuery.fn.ready = function(func) {
          setTimeout(func, 10);
        };
      })();
     $js.script(pp.url.js.bookmark_add_v4).wait(init);

     function init() {
       // 二回目以降のmod_edit_bookmark()でbookmark_add_v4.jsの初期化関数が呼ばれない
       window.alltags = window.getAllTags();
       // magic 11.00.1029
       window.tag_chk(window.String.prototype.split.apply($('input_tag').value, [/\s+|\u3000+/]));

       if (autotag) autoinput_from_tag();

       if (conf.bm_tag_order.length) {
         each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/a[starts-with(@id, "myBookmarkTagsSortBy")]', root),
              function(anc) {
                if (anc.previousSibling.nodeType == 3) {
                  // &nbsp;
                  anc.parentNode.removeChild(anc.previousSibling);
                }
                anc.parentNode.removeChild(anc);
              });
         each(reorder_tags($xa('ul/li', tag_wrap_bm)),
              function(list) {
                var ul = $c('ul', tag_wrap_bm, null, 'tagCloud');
                each(
                  list,
                  function(li) {
                    li.parentNode.removeChild(li);
                    ul.appendChild(li);
                  });
              });
         tag_wrap_bm.removeChild($t('ul', tag_wrap_bm)[0]);
       } else {
         window.bookmarkTagSort.sortedTag = {
	   name: { asc: [], desc: [] },
	   num:  { asc: [], desc: [] }
	 };
         window.bookmarkTagSort.tag = [];
         window.bookmarkTagSort.init();
       }

       var first = true;
       var p = 'pixplus-bm-tag-' + Math.floor(Math.random() * 100);
       each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', root),
            function(ul, idx) {
              var q = p + '-' + idx;
              var tags = $xa('li/a', ul);
              each(tags,
                   function(tag, idx) {
                     tag.id = q + '-' + idx;
                     tag.style.navLeft = '#' + q + '-' + (idx ? idx - 1 : tags.length - 1);
                     tag.style.navRight = '#' + q + '-' + (tags[idx + 1] ? idx + 1 : 0);
                   });
              if (first && tags.length) {
                input_tag.style.navDown = '#' + tags[0].id;
                first = false;
              }
            });

       if (conf.extagedit) {
         var items = [];
         var selected, sx = 0, sy = 0;
         each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', root),
              function(ul) {
                var l = $t('li', ul);
                if (l.length) items.push(l);
              });
         if (items.length) {
           ev_key_func = function(ev, key) {
             if (selected) {
               switch(key) {
               case $ev.KEY_SPACE:  toggle(ev);                return true;
               case $ev.KEY_ESCAPE: unselect(ev);              return true;
               case $ev.KEY_LEFT:   select(ev, false, -1,  0); return true;
               case $ev.KEY_UP:     select(ev, false,  0, -1); return true;
               case $ev.KEY_RIGHT:  select(ev, false,  1,  0); return true;
               case $ev.KEY_DOWN:   select(ev, false,  0,  1); return true;
               }
             } else if (key == $ev.KEY_UP || key == $ev.KEY_DOWN) {
               select(ev, true, 0, key == $ev.KEY_DOWN ? 0 : items.length - 1);
               return true;
             }
             return false;
           };
           function toggle(ev) {
             ev.preventDefault();
             if (selected) send_click($x('./a', selected));
           }
           function unselect(ev) {
             if (ev) ev.preventDefault();
             if (selected) {
               selected.removeAttribute('selected');
               selected = null;
             }
           }
           function select(ev, absolute, px, py) {
             ev.preventDefault();
             if (selected) selected.removeAttribute('selected');
             if (absolute) {
               sx = px;
               sy = py;
             } else {
               sx += px;
               sy += py;
               if (sy < 0) {
                 sy = items.length - 1;
               } else if (sy >= items.length) {
                 sy = 0;
               }
               if (py != 0) sx = 0;
               if (sx < 0) {
                 sx = items[sy].length - 1;
               } else if (sx >= items[sy].length) {
                 sx = 0;
               }
             }
             selected = items[sy][sx];
             selected.setAttribute('selected', 'yes');
           }
         }
       }
     }

     function input_tags(func) {
       var tags = input_tag.value.split(/\s+|\u3000+/);
       each(tags_bookmark,
            function(bt) {
              var tag = bt.parentNode.getAttribute('jsatagname');
              if (tags.indexOf(tag) < 0) {
                var aliases = conf.bm_tag_aliases[tag];
                each(aliases ? [tag].concat(aliases) : [tag],
                     function(tag) {
                       if (func(bt, tag)) {
                         send_click(bt);
                         return true;
                       } else {
                         return false;
                       }
                     });
              }
            });
     }
     function autoinput_from_caption() {
       var caption = get_caption();
       input_tags(
         function(a, t) {
           return caption.toLowerCase().indexOf(t.toLowerCase()) >= 0;
         });
     }
     function autoinput_from_tag() {
       input_tags(
         function(a, t) {
           for(var i = 0; i < tags_illust.length; ++i) {
             var s = tags_illust[i].firstChild.nodeValue;
             if (s.toLowerCase().indexOf(t.toLowerCase()) >= 0) {
               return true;
             }
           }
           return false;
         });
     }
     function create_anc(text, click_func, parent) {
       var anc = $c('a');
       anc.href = 'javascript:void(0)';
       anc.textContent = text;
       anc.style.fontSize = 'x-small';
       anc.addEventListener('click', click_func, false);
       if (parent) parent.appendChild(anc);
       return anc;
     }
     function get_caption() {
       var i_title   = title || $x('//div[contains(concat(" ", @class, " "), " works_data ")]/h3');
       var i_comment = comment || $x('//div[contains(concat(" ", @class, " "), " works_tag ")]/preceding-sibling::p');
       return (i_title ? i_title.textContent : '') + (i_comment ? i_comment.textContent : '');
     }
   }

   function add_gallery(args, filter_col, filter) {
     try {
       var g = new Gallery(args, filter_col, filter);
       pp.galleries.push(g);
       return g;
     } catch(ex) {
       return null;
     }
   }

   function reorder_tags(list) {
     var ary = [];
     each(conf.bm_tag_order,
          function(order) {
            var ary_ary = [];
            each(order,
                 function(tag) {
                   if (!tag) {
                     ary_ary.push(null);
                     return;
                   }
                   list = abst(
                     list,
                     function(li) {
                       try {
                         if (t(li) == tag) {
                           ary_ary.push(li);
                           return false;
                         }
                       } catch(e) { }
                       return true;
                     });
                 });
            ary.push(ary_ary);
          });
     list.sort(function(a, b) {
                 a = t(a); b = t(b);
                 return a == b ? 0 : (a < b ? -1 : 1);
               });
     each(ary,
          function(ary_ary, idx) {
            var null_idx = ary_ary.indexOf(null);
            if (null_idx >= 0) {
              var left = ary_ary.slice(0, null_idx);
              var right = ary_ary.slice(null_idx + 1);
              if (list.length) {
                ary[idx] = left.concat(list).concat(right);
                list = [];
              } else {
                ary[idx] = left.concat(right);
              }
            }
          });
     if (list.length) ary.push(list);
     function t(elem) {
       return $x('.//text()', elem).nodeValue;
     }
     return ary;
   }

   function Floater(wrap, cont, use_placeholder) {
     this.wrap = wrap;
     this.cont = cont;
     this.disable_float = false;
     this.use_placeholder = !!use_placeholder;
     Floater.instances.push(this);
     this.init();
   }
   Floater.instances = [];
   Floater.init = function() {
     window.addEventListener('scroll', Floater.update_float, false);
     window.addEventListener('resize', Floater.force_update, false);
     window.document.addEventListener('pixplusBMTagToggled', Floater.force_update, false);
     window.document.addEventListener('pixplusConfigToggled', Floater.force_update, false);
   };
   Floater.update_float = function() {
     each(Floater.instances, function(inst) { inst.update_float(); });
   };
   Floater.force_update = function() {
     each(Floater.instances, function(inst) { inst.force_update(); });
   };
   Floater.prototype.init = function() {
     this.wrap.style.boxSizing = 'border-box';
     this.wrap.style.webkitBoxSizing = 'border-box';
     this.wrap.style.MozBoxSizing = 'border-box';
     this.wrap.style.width = this.wrap.offsetWidth + 'px';
     if (this.cont) {
       this.cont.style.display = 'block';
       this.cont.style.overflowX = 'hidden';
       this.cont.style.overflowY = 'auto';
     }
     this.update_float();
   };
   Floater.prototype.force_update = function() {
     this.unfloat();
     this.floating = void(0);
     this.disable_float = false;
     this.update_float();
   };
   Floater.prototype.unfloat = function () {
     if (this.placeholder) {
       this.placeholder.parentNode.removeChild(this.placeholder);
       this.placeholder = null;
     }
     this.scroll_save();
     this.wrap.removeAttribute('float');
     this.scroll_restore();
     this.floating = false;
   };
   Floater.prototype.update_height = function () {
     if (this.cont) {
       var de = window.document.documentElement;
       var sc = browser.webkit ? window.document.body : de;
       var mh = de.clientHeight - (this.wrap.offsetHeight - this.cont.offsetHeight);
       if (mh < 60) {
         this.disable_float = true;
         this.unfloat();
         this.cont.style.maxHeight = '';
         return;
       }
       if (!this.floating) mh -= getpos(this.wrap).top - sc.scrollTop;
       this.cont.style.maxHeight = mh + 'px';
     }
   };
   Floater.prototype.update_float = function () {
     if (this.disable_float) return;
     var sc = browser.webkit ? window.document.body : window.document.documentElement;
     var pos = getpos(this.wrap);
     if (this.floating !== true && sc.scrollTop > pos.top) {
       this.wrap_pos = pos;
       this.scroll_save();
       if (this.use_placeholder) {
         this.placeholder = this.wrap.cloneNode(false);
         this.placeholder.style.width = this.wrap.offsetWidth + 'px';
         this.placeholder.style.height = this.wrap.offsetHeight + 'px';
         if (this.wrap.nextSibling) {
           this.wrap.parentNode.insertBefore(this.placeholder, this.wrap.nextSibling);
         } else {
           this.wrap.parentNode.appendChild(this.placeholder);
         }
       }
       this.wrap.setAttribute('float', '');
       this.scroll_restore();
       this.floating = true;
     } else if (this.floating === true && sc.scrollTop < this.wrap_pos.top) {
       this.unfloat();
     }
     this.update_height();
   };
   Floater.prototype.scroll_save = function () {
     if (this.cont) this.scroll_pos = this.cont.scrollTop;
   };
   Floater.prototype.scroll_restore = function () {
     if (this.cont) this.cont.scrollTop = this.scroll_pos;
   };
   Floater.init();

   function Signal(def) {
     this.def = def;
     this.funcs = [];
     this.id = 1;
     return this;
   }
   Signal.prototype.connect = function(f) {
     var conn = new Signal.Connection(this, this.id);
     this.funcs.push({id: this.id, cb: f, conn: conn});
     ++this.id;
     return conn;
   };
   Signal.prototype.disconnect = function(id) {
     var idx = find(this.funcs, function(e) { return e.id == id; });
     if (idx >= 0) {
       this.funcs[idx].conn.disconnected = true;
       this.funcs.splice(idx, 1);
     }
   };
   Signal.prototype.emit = function(inst) {
     var args = [].slice.apply(arguments, [1]);
     var res;
     for(var i = 0; i < this.funcs.length; ++i) {
       res = this.funcs[i].cb.apply(inst, args);
       if (res) return res;
     }
     if (this.def && (res = this.def.apply(inst, args))) return res;
     return false;
   };
   Signal.Connection = function(signal, id) {
     this.signal = signal;
     this.id = id;
     this.disconnected = false;
   };
   Signal.Connection.prototype.disconnect = function() {
     if (!this.disconnected) this.signal.disconnect(this.id);
   };

   function wait_pager(func) {
     var callee = arguments.callee;
     if (window.AutoPagerize || window.AutoPatchWork) {
       func();
     } else {
       if (!callee.funcs) {
         callee.funcs = [];
         connect_event('GM_AutoPagerizeLoaded');
         connect_event('AutoPatchWork.request');
       }
       callee.funcs.push(func);
     }
     function connect_event(name) {
       window.document.addEventListener(
         name,
         function() {
           each(callee.funcs, function(func) { func(); });
           callee.funcs = null;
           window.document.removeEventListener(name, arguments.callee, false);
         }, false);
     }
   }

   // 汎用
   function $(id, elem) {
     return window.document.getElementById(id);
   }
   function $t(tag, elem) {
     return (elem || window.document).getElementsByTagName(tag);
   }
   function $c(tag, parent, id, cls) {
     var elem = window.document.createElement(tag);
     if (parent) parent.appendChild(elem);
     if (id) elem.id = id;
     if (cls) elem.className = cls;
     return elem;
   }
   function $x(xpath, root) {
     if (arguments.length > 1 && !root) return null;
     var doc = root ? root.ownerDocument : (root = window.document);
     // XPathResult.FIRST_ORDERED_NODE_TYPE = 9
     return doc.evaluate(xpath, root, null, 9, null).singleNodeValue;
   }
   function $xa(xpath, root) {
     var doc = root ? root.ownerDocument : (root = window.document);
     // XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 7
     var nodes = doc.evaluate(xpath, root, null, 7, null);
     var res = new Array();
     for(var i = 0; i < nodes.snapshotLength; ++i) {
       res.push(nodes.snapshotItem(i));
     }
     return res;
   }
   function getpos(elem, root) {
     var left = elem.offsetLeft, top = elem.offsetTop;
     while((elem = elem.offsetParent) && elem != root) {
       left += elem.offsetLeft;
       top += elem.offsetTop;
     }
     if (!elem && root) {
       var pos = arguments.callee(root);
       left -= pos.left;
       top -= pos.top;
     }
     return {left: left, top: top};
   }
   function lazy_scroll(elem, offset, root, scroll) {
     if (!elem || elem == arguments.callee.last) return;
     offset = parseFloat(typeof offset == 'undefined' ? 0.2 : offset);
     if (root && scroll) {
       var pos = getpos(elem, root);
       var bt = root.clientHeight * offset, bb = root.clientHeight * (1.0 - offset);
       var top = Math.floor(scroll.scrollTop + bt), bot = Math.floor(scroll.scrollTop + bb);
       //window.jQuery(scroll).stop();
       if (pos.top < top) {
         //window.jQuery(scroll).animate({scrollTop: pos.top - bt}, 200);
         scroll.scrollTop = pos.top - bt;
       } else if (pos.top + elem.offsetHeight > bot) {
         //window.jQuery(scroll).animate({scrollTop: pos.top + elem.offsetHeight - bb}, 200);
         scroll.scrollTop = pos.top + elem.offsetHeight - bb;
       }
       arguments.callee.last = elem;
     } else {
       var doc = window.document;
       var p = elem.parentNode;
       while(p && p !== doc.body && p !== doc.documentElement) { /* WARN */
         if (p.scrollHeight > p.offsetHeight) {
           // for webkit
           var style = p.ownerDocument.defaultView.getComputedStyle(p, '');
           if (style.overflowY.match(/auto|scroll/)) {
             lazy_scroll(elem, offset, p, p);
             break;
           }
         }
         p = p.parentNode;
       }
       lazy_scroll(elem, offset, doc.documentElement, browser.webkit ? doc.body : doc.documentElement); /* WARN */
     }
   }
   function remove_node_if_tag_name(node, tag) {
     if (node && node.tagName && lc(node.tagName) == tag && node.parentNode) {
       node.parentNode.removeChild(node);
     }
   }
   function is_ancestor(ancestor, elem) {
     while(elem) {
       if (elem === ancestor) return true;
       elem = elem.parentNode;
     }
     return false;
   }

   function each(list, func) {
     if (!list) return list;
     for(var i = 0; i < list.length; ++i) {
       if (func(list[i], i)) break;
     }
     return list;
   }
   function find(list, func) {
     for(var i = 0; i < list.length; ++i) {
       if (func(list[i], i)) return i;
     }
     return -1;
   }
   function abst(ary, func) {
     var new_ary = [];
     each(ary, function(i, idx) {if (func(i, idx)) new_ary.push(i);});
     return new_ary;
   }
   function send_click(elem) {
     var ev = elem.ownerDocument.createEvent('MouseEvents');
     ev.initMouseEvent('click', true, true, window,
                       0, 0, 0, 0, 0, false, false, false, false, 0, null);
     elem.dispatchEvent(ev);
   }
   function parseopts(str) {
     var opts = {};
     each(
       str.replace(/^.*?\?/, '').replace(/#.*$/, '').split('&'),
       function(p) {
         var pair = p.split('=', 2);
         if (pair[0] && pair[1]) {
           opts[pair[0]] = pair[1];
         }
       });
     return opts;
   }

   function lc(str) {
     return str.toLowerCase();
   }
   function trim(str) {
     return str.replace(/(?:^[\s\u3000]+|[\s\u3000]+$)/g, '');
   }
   function edit_comment(str) {
     str = str.replace(/(?:<br ?\/?>)*([\-\u2015\u2500\u2501\uff3f])\1{7,}(?:<br ?\/?>)*/g, '<hr />');
     if (!str.match(/<br[ \/>]/i)) {
       str = str
         .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
         .replace(/[\s\u3000]{4,}/g, '<br />');
     }
     return str.replace(/(<a\s+href=\")\/?jump\.php\?/ig, '$1');
   }

   var urlcache = new Object();
   function geturl(url, cb_load, cb_error, reload) {
     if (!reload && urlcache[url]) {
       cb_load(urlcache[url]);
     } else {
       var xhr = new window.XMLHttpRequest();
       xhr.open('GET', url, true);
       xhr.onload  = function() {
         urlcache[url] = xhr.responseText;
         cb_load(xhr.responseText);
       };
       if (cb_error) {
         xhr.onerror = function() {
           cb_error(xhr);
         };
       }
       xhr.send(null);
     }
     return null;
   }
   function getcache(url) {
     return urlcache[url];
   }
   function uncache(url) {
     urlcache[url] = null;
   }
   var imgcache = new Object();
   function getimg(url, cb_load, cb_error, cb_abort) {
     if (imgcache[url]) {
       if (cb_load) cb_load(imgcache[url]);
     } else {
       var img = new Image();
       img.addEventListener(
         'load',
         function() {
           img.parentNode.removeChild(img);
           imgcache[url] = img;
           if (cb_load) cb_load(img);
         }, false);
       if (cb_error && !cb_abort) cb_abort = cb_error;
       if (cb_error) img.addEventListener('error', cb_error, false);
       if (cb_abort) img.addEventListener('abort', cb_abort, false);
       img.src = url;
       img.style.display = 'none';
       window.document.body.appendChild(img);
     }
   }
   function parseimgurl(text, big) {
     try {
       var url = text.match(/<img src=\"(http:\/\/img\d+\.pixiv\.net\/img\/[^\"]+)\"/i)[1];
       // 漫画なら小さい画像を使用する
       if (big && !text.match(/<div[^>]+class=\"works_display\"[^>]*><a[^>]+href=\"member_illust\.php\?mode=manga/i) &&
           url.match(/^(.+)_m(\.[^\.]+)$/)) url = RegExp.$1 + RegExp.$2;
       return url;
     } catch(e) {
       return null;
     }
   }
   function urlmode(url, mode, manga_type) {
     url = url.replace(/([\?&])mode=[^&]*/, '$1mode=' + mode);
     return mode == 'manga' && manga_type ? urlmangatype(url, manga_type) : url;
   }
   function urlmangatype(url, type) {
     if (url.indexOf('&type=') >= 0) {
       return url.replace(/&type=[^&]*/, '&type=' + type);
     } else {
       if (url.match(/^(.*)(#.*)$/)) {
         return RegExp.$1 + '&type=' + type + RegExp.$2;
       } else {
         return url + '&type=' + type;
       }
     }
   }
   function chk_ext_src(elem, attr, url) {
     var name = url.replace(/\?.*$/, '').replace(/.*\//, '');
     var ret = $x('//' + elem + '[contains(@' + attr + ', "' + name + '")]');
     if (conf.debug && ret) {
       var attr_f = ret.getAttribute(attr);
       if (attr_f != url) safeWindow.alert('New one?\n' + attr_f);
     }
     return ret;
   }

   function $ev(ctx) {
     var obj = {
       ctx: ctx,
       click: function(func) {
         var conn = new $ev.Connection(obj.ctx);
         var listener = function(ev) {
           if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) return;
           ev.preventDefault();
           func(ev);
         };
         obj.ctx.addEventListener('click', listener, false);
         conn.listeners.push(['click', listener]);
         return conn;
       },
       key: function(func) {
         var conn = new $ev.Connection(obj.ctx);
         var listener = function(ev) {
           var c = ev.keyCode || ev.charCode, key;
           if (c == ev.which && c > 0x20) {
             key = lc(String.fromCharCode(c));
           } else if ($ev.key_map[c]) {
             if (browser.webkit) return;
             key = $ev.key_map[c];
           } else {
             key = c;
           }
           func(ev, key);
         };
         obj.ctx.addEventListener('keypress', listener, false);
         conn.listeners.push(['keypress', listener]);
         if (browser.webkit) {
           listener = function(ev) {
             var c = ev.keyCode || ev.charCode, key;
             if ($ev.key_map[c]) func(ev, $ev.key_map[c]);
           };
           obj.ctx.addEventListener('keydown', listener, false);
           conn.listeners.push(['keydown', listener]);
         }
         return conn;
       },
       disconnect: function() {
         each(obj.listeners, function(item) { obj.ctx.removeEventListener(item[0], item[1], false); });
       }
     };
     return obj;
   };
   $ev.KEY_BACKSPACE = 'Backspace';
   $ev.KEY_ENTER     = 'Enter';
   $ev.KEY_ESCAPE    = 'Escape';
   $ev.KEY_SPACE     = 'Space';
   $ev.KEY_END       = 'End';
   $ev.KEY_HOME      = 'Home';
   $ev.KEY_LEFT      = 'Left';
   $ev.KEY_UP        = 'Up';
   $ev.KEY_RIGHT     = 'Right';
   $ev.KEY_DOWN      = 'Down';
   $ev.key_map = {
     8:  $ev.KEY_BACKSPACE,
     13: $ev.KEY_ENTER,
     27: $ev.KEY_ESCAPE,
     32: $ev.KEY_SPACE,
     35: $ev.KEY_END,
     36: $ev.KEY_HOME,
     37: $ev.KEY_LEFT,
     38: $ev.KEY_UP,
     39: $ev.KEY_RIGHT,
     40: $ev.KEY_DOWN
   };
   $ev.Connection = function(ctx) {
     this.ctx = ctx;
     this.listeners = [];
   };
   $ev.Connection.prototype.disconnect = function() {
     var self = this;
     each(this.listeners,
          function(item) {
            self.ctx.removeEventListener(item[0], item[1], false);
          });
   };

   var $js = new function() {
     var holder = $t('head')[0];
     this.script = function(url) {
       return new ctx().script(url);
     };
     function ctx(block) {
       this.urls     = [];
       this.scripts  = [];
       this.load_cnt = 0;
       this.block    = block;
     };
     ctx.prototype.script = function(url) {
       log('$js#script: ' + url);
       this.urls.push(url);
       if (this.block) {
         ++this.load_cnt;
       } else {
         this.add_load(url, true);
       }
       return this;
     };
     ctx.prototype.wait = function(func) {
       log('$js#wait');
       if (this.load_cnt > 0) {
         var new_obj = new ctx(true);
         this.wait = {ctx: new_obj, func: func};
         return new_obj;
       } else {
         if (func) func();
         return this;
       }
     };
     ctx.prototype.add_load = function(url, raise) {
       var elem = chk_ext_src('script', 'src', url);
       if (raise) ++this.load_cnt;
       if (elem) {
	 if (elem.getAttribute('type') == 'script/cache') { // webkit
           log('$js#labjs: ' + url);
           var callee = arguments.callee, self = this;
           setTimeout(function() { callee.apply(self, [url]); }, 0);
         } else if (elem.readyState == 'loading' || elem.readyState == 'interactive') {
           log('$js#preexists: ' + url);
           wait.apply(this, [elem]);
         } else if (elem.readyState) { // for opera
           load_cb.apply(this);
         } else {
           setTimeout(bind(load_cb, this), 0);
         }
       } else {
         log('$js#load: ' + url);
         elem = $c('script');
         elem.async = false;
         wait.apply(this, [elem]);
         elem.src  = url;
         holder.appendChild(elem);
       }
       function wait(elem) {
         elem.addEventListener('load', bind(load_cb, this), false);
       }
       function load_cb() {
         if (--this.load_cnt < 1) this.unblock();
       }
     };
     ctx.prototype.fire = function() {
       log('$js#fire');
       this.block = false;
       each(this.urls,
            bind(function(url) {
                   this.add_load(url);
                 }, this));
     };
     ctx.prototype.unblock = function() {
       log('$js#unblock');
       if (this.wait) {
         if (this.wait.func) this.wait.func();
         if (this.wait.ctx)  this.wait.ctx.fire();
       }
     };
   };

   function load_css(url) {
     if (chk_ext_src('link', 'href', url)) {
       return false;
     } else {
       var css  = $c('link');
       css.rel  = 'stylesheet';
       css.type = 'text/css';
       css.href = url;
       window.document.body.appendChild(css);
       return true;
     }
   }
   function write_css(source) {
     var css = $c('style');
     css.setAttribute('type', 'text/css');
     css.textContent = source;
     window.document.body.appendChild(css);
   }

   function bind(func, obj) {
     var args = [].slice.apply(arguments, [2]);
     return function() {
       func.apply(obj || window, args.concat([].slice.apply(arguments)));
     };
   }
   function bind_event(func, obj) {
     var args = [].slice.apply(arguments, [2]);
     return function(ev) {
       ev.preventDefault();
       func.apply(obj, args);
     };
   }

   function log(msg) {
     if (conf.debug) {
       //opera.postError(msg);
       window.console && window.console.log && window.console.log(msg);
     }
   }

   function create_post_data(form) {
     var data = new Object();
     each($t('input', form),
          function(input) {
            switch(lc(input.type)) {
            case 'reset': case 'submit': break;
            case 'checkbox': case 'radio': if (!input.checked) break;
            default: data[input.name] = input.value; break;
            }
          });
     var res = '';
     for(var name in data) {
       if (res) res += '&';
       res += encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
     }
     return res;
   }

   // loading => DOMContentLoaded => interactive => Load => complete
   if (window.opera && (window.document.readyState == 'loading')) {
     window.document.addEventListener('DOMContentLoaded', init_pixplus, false);
   } else {
     init_pixplus();
   }
 },
 this.unsafeWindow,
 /* __GREASEMONKEY_REMOVE__
 true
    __GREASEMONKEY_REMOVE__ */
 false /* __GREASEMONKEY_REMOVE__ */
 );
