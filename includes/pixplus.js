// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     0.1.3
// @license     Public domain
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @include     http://img*.pixiv.net/*
// ==/UserScript==

/** 0.1.3
 * Extension版でアンケートに答えられなくなっていたバグを修正。
 * トップページのレイアウトをバックアップする機能追加。
 * Extension版の自動アップデートに対応。
 */

/** ポップアップのデフォルトのキーバインド一覧
 ** 通常
 * BackSapace/Left/Up   前のイラストに移動。
 * Space/Right/Down     次のイラストに移動。
 * Home/End             最初/最後のイラストに移動。
 * Escape               閉じる。
 * e                    プロフィールを開く。
 * r                    作品一覧を開く。
 * Shift+r              作品に対するイメージレスポンスを開く。
 * t                    ブックマークを開く。
 * y                    スタックフィードを開く。
 * b                    ブックマーク編集モードに移行。
 * Shift+b              ブックマーク詳細ページを開く。
 * f                    イラスト画像を開く。
 * Shift+f              イラストページを開く。
 * g                    リロードする。
 * c                    キャプションの常時表示/自動表示を切り替える。
 * Shift+c              アンケートに答える。
 * v                    マンガモードに移行。
 * Shift+v              マンガサムネイルページを開く。
 * Shift+数字           イラストを評価する。デフォルト設定では無効。1=10点/0=1点
 * i/o                  画像を縮小/拡大する。

 ** ブックマーク編集モード
 * Escape               ブックマーク編集モードを終了。
 * Up/Down              タグ選択モード開始。
 ** タグ選択モード
 * Escape               タグ選択モードを終了。
 * Space                選択中のタグをトグル。
 * Up/Down              上下のタグリストに移動。
 * Left/Right           左右のタグを選択。

 ** マンガモード
 * BackSapace/Left/Up   次のページに移動。
 * Space/Right/Down     次のページに移動。
 * Home/End             最初/最後のページに移動。
 * Escape               マンガモードを終了。
 * f                    表示しているページの画像を開く。
 * Shift+f              表示しているページを開く。
 * Escape/v             マンガモードを終了。

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

 document.addEventListener(
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

/** ギャラリーの仕様
 * イラストの一覧をギャラリーと呼ぶ。pixiv的には「コレクション」？
 * ギャラリーの画像をクリックするとポップアップが開く。ポップアップ内で次/前のイラストに移動出来る。

 ** 対応しているページ一覧
 * マイページ(ログイン時のトップページ/R-18)
 * メンバーイラスト/作品一覧/ブックマーク
 * 新着イラスト(みんな/お気に入りユーザー/R-18)
 * ランキング(デイリー/ルーキー/ウィークリー/マンスリー/各R-18/R-18G)
 * ブックマーク管理
 * イメージレスポンス
 * 検索
 * 投稿イラスト管理ページ
 * ブックマーク詳細ページ

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

(function(){
   if (window.location.href.match(/^http:\/\/img\d+\.pixiv\.net\/img\/[^\/]*\/(\d+)/)) {
     addillustlink(RegExp.$1);
     return;
   }

   /* Opera10.50以降なら、ページ上部のメニューから設定変更可能 */
   var conf_schema = {
     debug:                  [false, 'デバッグモード。'],
     scroll:                 [1,     'イラストページを開いた時にスクロールする。0:なし/1:キャプション/2:イラスト'],
     bookmark_hide:          [false, 'ブックマーク非公開をデフォルトにする。'],
     float_tag_list:         [1,     'タグリストをフロート表示する。0:無効/1:有効/2:AutoPagerizeなどが動作している時のみ有効'],
     locate_recommend_right: [2,     'レコメンドを右側に縦1列に並べる。0:無効/1:有効/2:AutoPagerizeなどが動作している時のみ有効'],
     extagedit:              [true,  'ブックマーク編集時にアローキーでのタグ選択を有効にする。'],
     mod_bookmark_add_page:  [false, 'ブックマーク編集ページにも変更を加える。'],
     tag_separator_style:    ['border-top:2px solid #dae1e7;', 'ブックマーク編集ページでのセパレータのスタイル。'],
     stacc_link:             ['',    '上部メニューの「スタックフィード」のリンク先。空白/all/mypixiv/favorite/self'],
     default_manga_type:     ['',    'デフォルトのマンガ表示タイプ。scroll/slide'],
     rate_confirm:           [true,  'イラストを評価する時に確認をとる。'],
     popup_manga_tb:         [true,  'マンガサムネイルページでポップアップを使用する。'],
     disable_effect:         [false, 'アニメーションなどのエフェクトを無効化する。'],
     workaround:             [false, 'Operaやpixivのバグ回避のための機能を使用する。'],
     popup: {
       preload:              [true,  '先読みを使用する。'],
       big_image:            [false, '原寸の画像を表示する。'],
       caption_height:       [0.4,   '画像を基準としたキャプションの高さ上限。コメントにスクロールバーが付く。'],
       caption_opacity:      [0.9,   'キャプションの不透明度。'],
       remove_pixpedia:      [false, 'タグのpixpediaアイコンを除去する。'],
       rate:                 [true,  '評価機能を使用する。'],
       rate_key:             [false, '評価のキーバインドを有効にする。'],
       font_size:            ['',    'フォントサイズ(e.g. 10px)'],
       auto_manga:           [0,     '自動的にマンガモードを開始する。0:無効/1:有効/2:ページを正規表現で指定'],
       auto_manga_regexp:    ['/(?:bookmark_new_illust|member_illust|mypage|ranking|bookmark)\\.php',
                              'auto_mangaに2を指定した場合に使用する正規表現。'],
       reverse:              [0,     '移動方向を反対にする。0:無効/1:有効/2:ページを正規表現で指定'],
       reverse_regexp:       ['/(?:bookmark_new_illust|member_illust|mypage)\\.php',
                              'reverseに2を指定した場合に使用する正規表現。'],
       auto_zoom:            [0,     '自動ズームする最大サイズ。0で無効。'],
       auto_zoom_size:       [800,   '自動ズーム後のサイズ上限。'],
       auto_zoom_scale:      [4,     '自動ズーム後の拡大率上限。'],
       overlay_control:      [0.3,   '移動用クリックインターフェースの幅。0:使用しない/<1:画像に対する割合/>1:ピクセル']
     }
   };
   var conf = {
     popup: { },
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

     load_js:       load_js,
     load_css:      load_css,
     write_css:     write_css,

     rpc_ids:       {rpc_i_id: 1, rpc_u_id: 2, rpc_e_id: 4, rpc_qr: 8},
     rpc_usable:    false,
     rpc_state:     0,  // flags; e.g. 5=rpc_e_id|rpc_i_id
     rpc_req_tag:   7,  // i|u|e
     rpc_req_rate:  13, // i|e|qr
     rpc_req_qrate: 13,

     recommender: {
       loaded:      false,
       funcs:       [],
       attach:      function(func) {
         if (this.loaded) {
           func();
         } else {
           this.funcs.push(func);
         }
       }
     }
   };
   window.opera.pixplus = pp;
   function rpc_chk(f) {
     return (pp.rpc_state & f) == f;
   }

   var LS = {
     prefix: '__pixplus_',
     s: window.localStorage,
     l: [{name:  'general',
          label: 'General',
          data:  [conf_schema, conf]},
         {name:  'popup',
          label: 'Popup',
          data:  [conf_schema.popup, conf.popup]}],
     create_name: function(s, n) {
       return this.prefix + s + '_' + n;
     },
     get: function(s, n) {
       return this.s.getItem(this.create_name(s, n));
     },
     set: function(s, n, v) {
       return this.s.setItem(this.create_name(s, n), v);
     },
     remove: function(s, n) {
       return this.s.removeItem(this.create_name(s, n));
     },
     conv: {
       'string':  String,
       'boolean': function(s) { return s == 'true'; },
       'number':  parseFloat
     },
     each: function(cb_key, cb_sec, cb_sec_after) {
       each(
         LS.l,
         function(c) {
           if (cb_sec) cb_sec(c, c.data[0], c.data[1]);
           each(
             c.data[0].keys,
             function(key) {
               cb_key(c, c.data[0], c.data[1], key);
             });
           if (cb_sec_after) cb_sec_after(c, c.data[0], c.data[1]);
         });
     },
     init_section: function(name, cs, cf) {
       var keys = [];
       for(var key in cs) {
         var type = typeof(cs[key][0]);
         var func = this.conv[type];
         if (func) {
           cs[key].type = type;
           keys.push(key);
           cf[key] = cs[key][0];
           if (this.s) {
             var v = this.get(name, key);
             if (v) cf[key] = func(v);
           }
         }
       }
       cs.keys = keys.sort();
     },
     parse_bm_tag_order: function(str) {
       var ary = [], ary_ary = [];
       each(
         str.split('\n'),
         function(tag) {
           tag = tag.replace(/[\r\n]/g, '');
           if (tag == '-') {
             ary.push(ary_ary);
             ary_ary = [];
           } else if (tag == '*') {
             ary_ary.push(null);
           } else if (tag) {
             ary_ary.push(tag);
           }
         });
       ary.push(ary_ary);
       return ary;
     },
     parse_bm_tag_aliases: function(str) {
       var aliases = {};
       var lines = str.split('\n');
       var len = Math.floor(lines.length / 2);
       for(var i = 0; i < len; ++i) {
         var tag = lines[i * 2], alias = lines[i * 2 + 1];
         if (tag && alias) aliases[tag] = alias.split(/\s+/);
       }
       return aliases;
     }
   };
   conf.register_section = function(name, label, schema) {
     if (conf_schema[name]) return;
     conf_schema[name] = schema;
     conf[name] = {};
     LS.l.push({name:  name,
                label: label,
                data:  [conf_schema[name], conf[name]]});
     LS.init_section(name, conf_schema[name], conf[name]);
   };

   var options = parseopts(window.location.href);

   if (window.location.pathname.match(/^\/stacc/)) {
     /* スタックページで評価とタグ編集出来ないのをなんとかする */
     window.opera.addEventListener(
       'BeforeScript',
       function(e) {
         if (e.element.src.indexOf('/tag_edit.js') > 0) {
           e.element.text = e.element.text.replace(/\'\.(?=\/rpc_tag_edit\.php\')/g, "'");
         } else if (e.element.src.indexOf('/rating.js') > 0) {
           e.element.text = e.element.text.replace(/\'\.(?=\/\' \+ type_dir \+ \'rpc_rating\.php\')/g, "'");
         }
       }, false);
   }
   window.opera.addEventListener(
     'AfterScript',
     function(e) {
       if (e.element.src.indexOf('illust_recommender.js') >= 0) {
         var _load = window.IllustRecommender.prototype.load;
         window.IllustRecommender.prototype.load = function() {
           _load.apply(this, [].slice.apply(arguments));
           pp.recommender.loaded = true;
           each(pp.recommender.funcs, function(func) { func(); });
         };
       }
     }, false);

   // tag edit
   window.opera.defineMagicFunction(
     'startTagEdit',
     function(real, othis) {
       if (Popup.instance) {
         Popup.instance.tag_editing = true;
         Popup.instance.locate();
       }
       real.apply(othis, [].slice.apply(arguments, [2]));
     });
   window.opera.defineMagicFunction(
     'ef4',
     function(real, othis) {
       new window.Effect.BlindDown(
         'tag_area', {
	   delay:0.2,
	   duration:0.2,
           afterFinish: function() {
             if (Popup.instance) {
               Popup.instance.tag_editing = false;
               Popup.instance.locate();
               Popup.instance.reload();
             }
             if (lc(document.activeElement.tagName || '') == 'input') {
               document.activeElement.blur();
             }
           }
	 });
     });

   // rating
   window.opera.defineMagicFunction(
     'countup_rating', /* WARN */
     function(real, othis, score) {
       if (conf.rate_confirm && !confirm('\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n' + score + '\u70b9')) return;
       if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);
       real.apply(othis, [].slice.apply(arguments, [2]));
     });
   window.opera.defineMagicFunction(
     'send_quality_rating', /* WARN */
     function(real, othis) {
       if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);

       var _ajax = window.jQuery.ajax;
       window.jQuery.ajax = function(obj) {
         var success = obj.success;
         obj.success = function() {
           success.apply(othis, [].slice.apply(arguments));
           if (window.jQuery('#rating').is(':visible')) window.rating_ef2();
         };
         return _ajax.apply(this, [obj]);
       };
       real.apply(othis, [].slice.apply(arguments, [2]));
       window.jQuery.ajax = _ajax;
     });
   window.opera.defineMagicFunction(
     'rating_ef', /* WARN */
     function(real, othis) {
       window.jQuery('#quality_rating').slideDown('fast', after_show);
       function after_show() {
         var f = $x('.//input[@id="qr_kw1"]', Popup.instance ? Popup.instance.rating : document.body);
         if (f) f.focus();
       }
     });
   window.opera.defineMagicFunction(
     'rating_ef2', /* WARN */
     function(real, othis) {
       if (Popup.is_qrate_button(document.activeElement)) document.activeElement.blur();
       real.apply(othis, [].slice.apply(arguments, [2]));
     });

   window.addEventListener('DOMContentLoaded', init_pixplus, false);

   function addillustlink(id) {
     var anc = $c('a', document.body);
     anc.href = 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + id;
     anc.innerText = 'illust page';
     //anc.style.backgroundColor = 'white';
     anc.style.position = 'fixed';
     anc.style.left = '0px';
     anc.style.top = '0px';
     anc.setAttribute('nopopup', '');
   }
   function init_config_ui() {
     var menu = $x('//div[@id="nav"]/ul[contains(concat(" ", @class, " "), " sitenav ")]');
     var sp_manga_tb = $x('//div[@id="manga_top"]/div[span[@id="total_clap"]]/span[img[contains(@src, "spacer.gif")]]');
     if (menu || sp_manga_tb) {
       var anc = $c('a');
       anc.href = 'javascript:void(0)';
       anc.innerText = 'pixplus';
       anc.addEventListener('click', toggle, false);
       if (menu) {
         var li  = $c('li');
         li.appendChild(anc);
         menu.insertBefore(li, menu.firstChild);
       } else if (sp_manga_tb) {
         sp_manga_tb.parentNode.insertBefore(anc, sp_manga_tb.nextSibling);
         anc.parentNode.insertBefore(sp_manga_tb.cloneNode(true), anc.nextSibling);
       }
       write_css('.pixplus_conf{text-align:left;}' +
                 '.pixplus_conf table.conf th{text-align:left;}' +
                 '.pixplus_conf table.conf td{padding-left:4px;}' +
                 '.pixplus_conf table.conf td:first-child{padding-left:1em;}' +
                 '.pixplus_conf button + button{margin-left:4px;}' +
                 '.pixplus_conf .section{display:block;color:#333333;text-decoration:none;font-weight:bold;margin-top:1em;}' +
                 '.pixplus_conf .content{margin-left:1em;}' +
                 '.pixplus_conf textarea{width:100%;}' +
                 '.pixplus_conf td.aliases, .pixplus_conf td.aliases input{width:100%;}');

       var div, tag_order_textarea, tag_alias_table;
       function fire_event() {
         var evt = document.createEvent('Event');
         evt.initEvent('pixplusConfigToggled', true, true);
         document.dispatchEvent(evt);
       }
       function show() {
         create();
         div.style.display = 'block';
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
       function create() {
         if (div) return;
         div = $c('div', null, 'pixplus_conf');
         var gen_js = $c('a', div);
         gen_js.href = 'javascript:void(0)';
         gen_js.innerText = 'Generate Setting JS';
         gen_js.addEventListener('click', gen_set_js, false);

         var table = $c('table', div, 'conf');
         LS.each(
           function(c, cs, cf, key) {
             var row  = table.insertRow(-1);
             var ckey = row.insertCell(-1);
             if (cs[key].type == 'boolean') {
               ckey.setAttribute('colspan', 2);
               var check = $c('input', ckey);
               check.setAttribute('type', 'checkbox');
               check.id = LS.create_name(cs.name, key);
               cs[key].input = check;
               var label = $c('label', ckey);
               label.setAttribute('for', check.id);
               label.innerText = key;
             } else {
               ckey.innerText = key;
               var cval = row.insertCell(-1);
               var input = $c('input', cval);
               cs[key].input = input;
             }
             var cdef = row.insertCell(-1);
             var bdef = $c('button', cdef);
             bdef.innerText = 'Default';
             bdef.addEventListener(
               'click',
               function() {
                 if (cs[key].type == 'boolean') {
                   cs[key].input.checked = cs[key][0];
                 } else {
                   cs[key].input.value = cs[key][0];
                 }
                 cs[key]._set_default = true;
                 if (conf.debug) cs[key].input.style.color = 'gray';
               }, false);
             var cdes = row.insertCell(-1);
             cdes.innerText = cs[key][1];
           },
           function(c, cs, cf) {
             var th = $c('th', table.insertRow(-1));
             th.setAttribute('colspan', 4);
             th.innerText = c.label;
           });

         if (LS.s) {
           var cell = table.insertRow(-1).insertCell(-1);
           cell.setAttribute('colspan', 4);
           create_button('Save', cell, save_conf);
           create_button('Cancel', cell, cancel);
         }

         var tocont = create_section('Tag order', div);
         tocont.innerText = '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff' +
           '\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002\n' +
           '"-": \u30bb\u30d1\u30ec\u30fc\u30bf\n"*": \u6b8b\u308a\u5168\u90e8';
         tag_order_textarea = $c('textarea', tocont);
         tag_order_textarea.rows = '20';
         if (LS.s) {
           var tobtns = $c('div', tocont);
           create_button('Save', tobtns, save_tag_order);
           create_button('Cancel', tobtns, cancel);
         }

         var tacont = create_section('Tag alias', div);
         tacont.innerText = '\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3067\u8907\u6570\u8a18\u8ff0\u3002\u30d6\u30c3' +
           '\u30af\u30de\u30fc\u30af\u6642\u306e\u30bf\u30b0\u306e\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3002';
         tag_alias_table = $c('table', tacont);
         var btaadd = $c('button', tacont);
         btaadd.innerText = 'Add';
         btaadd.addEventListener('click', function() { create_alias_row('', -1); }, false);
         if (LS.s) {
           var tabtns = $c('div', tacont);
           create_button('Save', tabtns, save_tag_alias);
           create_button('Cancel', tabtns, cancel);
         }

         if (LS.s) {
           (function() {
              var mpcont = create_section('MyPage', div);
              var now = window.jQuery.cookie('pixiv_mypage');
              var saved = LS.get('cookie', 'pixiv_mypage');
              mpcont.innerHTML = 'Now: ' + now + '<br />' + 'Saved: ' + saved;
              var mpbtns = $c('div', mpcont);
              create_button('Save', mpbtns, save_mypage);
              var btn_restore = create_button('Restore', mpbtns, restore_mypage);

              if (!saved) btn_restore.setAttribute('disabled', '');

              function save_mypage() {
                LS.set('cookie', 'pixiv_mypage', now);
                window.location.reload();
              }
              function restore_mypage() {
                window.jQuery.cookie('pixiv_mypage', saved, {expires: 30});
                window.location.reload();
              }
            })();
         }

         var wrap = $('manga_top') || $('pageHeader');
         if (wrap) wrap.appendChild(div);
         init();

         function create_section(label, parent) {
           var anc = $c('a', parent, 'section');
           anc.href = 'javascript:void(0)';
           anc.innerText = label;
           var cont = $c('div', parent, 'content');
           cont.style.display = 'none';
           anc.addEventListener(
             'click',
             function(e) {
               e.preventDefault();
               cont.style.display = cont.style.display == 'none' ? 'block' : 'none';
               fire_event();
             }, false);
           return cont;
         }
         function create_button(label, parent, callback) {
           var button = $c('button', parent);
           button.innerText = label;
           button.addEventListener('click', callback, false);
           return button;
         }
       }
       function init() {
         LS.each(
           function(c, cs, cf, key) {
             var val;
             if (cs[key].type == 'boolean') {
               cs[key].input.checked = cf[key];
             } else {
               cs[key].input.value = cf[key];
             }
           });

         if (conf.bm_tag_order) {
           var tag_order = '';
           each(
             conf.bm_tag_order,
             function(ary, idx) {
               each(ary, function(tag, idx) { if (tag === null) ary[idx] = '*'; } );
               if (idx) tag_order += '-\n';
               tag_order += ary.join('\n') + '\n';
             });
           tag_order_textarea.value = tag_order;
         }

         tag_alias_table.innerHTML = '';
         var keys = [];
         for(var key in conf.bm_tag_aliases) keys.push(key);
         keys.sort();
         each(keys, create_alias_row);
       }
       function create_alias_row(key, idx) {
         var row = tag_alias_table.insertRow(idx);
         var crem = row.insertCell(-1);
         var ctag = row.insertCell(-1);
         var caliases = row.insertCell(-1);
         caliases.className = 'aliases';
         var brem = $c('button', crem);
         brem.innerText = 'Remove';
         brem.addEventListener('click', function() { tag_alias_table.deleteRow(row.rowIndex); }, false);
         var itag = $c('input', ctag);
         itag.value = key;
         var ialiases = $c('input', caliases);
         if (key) ialiases.value = conf.bm_tag_aliases[key].join(' ');
       }
       function check_conf() {
         LS.each(
           function(c, cs, cf, key) {
             if (cs[key].type == 'number') {
               var val = cs[key].input.value;
               if (isNaN(parseFloat(val))) throw 'Invalid value - ' + val;
             }
           });
       }
       function get_tag_alias_str() {
         var tag_aliases = '';
         each(
           tag_alias_table.rows,
           function(row) {
             var inputs = $t('input', row);
             var key = inputs[0].value;
             var val = inputs[1].value;
             if (key && val) tag_aliases += key + '\n' + val + '\n';
           });
         return tag_aliases;
       }
       function save_conf() {
         try {
           check_conf();
         } catch(ex) {
           alert(ex);
           return;
         }
         LS.each(
           function(c, cs, cf, key) {
             var val;
             if (cs[key].type == 'boolean') {
               val = cs[key].input.checked;
             } else {
               val = LS.conv[cs[key].type](cs[key].input.value);
             }
             if (val === cs[key][0] && cs[key]._set_default) {
               if (conf.debug) opera.postError('remove LS key - ' + [c.name, key].join(':'));
               LS.remove(c.name, key);
             } else if (val != cf[key]) {
               LS.set(c.name, key, val);
             }
           });
         window.location.reload();
       }
       function save_tag_order() {
         LS.set('bookmark', 'tag_order', tag_order_textarea.value);
         window.location.reload();
       }
       function save_tag_alias() {
         LS.set('bookmark', 'tag_aliases', get_tag_alias_str());
         window.location.reload();
       }
       function cancel() {
         init();
         hide();
       }
       function gen_set_js() {
         var order = LS.parse_bm_tag_order(tag_order_textarea.value);
         var alias = LS.parse_bm_tag_aliases(get_tag_alias_str());

         var js = ['// ==UserScript==',
                   '// @name    pixplus settings',
                   '// @version ' + (new Date()).toLocaleString(),
                   '// @include http://www.pixiv.net/*',
                   '// ==/UserScript==',
                   '(function() {',
                   ' document.addEventListener("pixplusInitialize",init,false);',
                   ' function init() {', ''].join('\n');
         LS.each(
           function(c, cs, cf, key) {
             var val;
             if (cs[key].type == 'boolean') {
               val = cs[key].input.checked;
             } else {
               val = LS.conv[cs[key].type](cs[key].input.value);
             }
             if (val !== cs[key][0]) {
               var ns = 'opera.pixplus.conf';
               if (cf !== conf) ns += '.' + c.name;
               js += '  ' + ns + '.' + key + ' = ' + stringify(val) + ';\n';
             }
           });
         if (order.length) {
           js += '  opera.pixplus.conf.bm_tag_order = [\n';
           each(
             order,
             function(ary) {
               js += '   [\n';
               each(ary, function(tag) { js += '    ' + (tag ? stringify(tag) : 'null') + ',\n'; });
               js += '   ],\n';
             });
           js += '  ];\n';
         }
         var first = true;
         for(var key in alias) {
           if (first) {
             js += '  opera.pixplus.conf.bm_tag_aliases = {\n';
             first = false;
           }
           js += '   ' + stringify(key) + ':[\n';
           each(
             alias[key],
             function(tag) {
               js += '    ' + stringify(tag) + ',\n';
             });
           js += '   ],\n';
         }
         if (!first) js += '  };\n';
         js += ' }\n})();\n';
         window.open('data:text/javascript;application/x-www-form-urlencoded,' + encodeURIComponent(js));

         function stringify(val) {
           if (window.JSON && window.JSON.stringify) return JSON.stringify(val);
           if (typeof val == 'string') {
             return '"' + val.replace(/[\\\"]/g, '\\$0') + '"';
           } else {
             return val.toString();
           }
         }
       }
     }
   }
   function unpack_captions(col, cappath) {
     each(
       $xa(cappath || './/a[img]/text()', col),
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
     unpack_captions(col, 'ul/li/a[img]/label');
   }
   function init_galleries() {
     function area_right() {
       each(
         $xa('//div[contains(concat(" ", @class, " "), " area_right ")]'),
         function(col) {
           add_gallery({collection:    col,
                        cappath:       './/p/a[contains(@href, "mode=medium")]',
                        thumbpath:     'ancestor::div[contains(concat(" ", @class, " "), " ran_text ")]/preceding-sibling::div[contains(concat(" ", @class, " "), " ran_img ")]/a/img',
                        allow_nothumb: 3});
         });
     }
     function mypage() {
       each(
         $xa('//div[contains(concat(" ", @class, " "), " baseTop")]'),
         function(top) {
           var col = $x('ul[contains(concat(" ", @class, " "), " top_display_works ")]', top);
           if (col) {
             unpack_captions(col);
             add_gallery({collection: col,
                          cappath:    'li/text()[last()]'});
           }
         });
       area_right();
     }

     if (window.location.href.match(/\/(?:mypage|cate_r18)\.php/)) {
       mypage();
     } else if (window.location.href.match(/\/member\.php/)) {
       each(
         $xa('//div[contains(concat(" ", @class, " "), " worksListOthers ")]/*[contains(concat(" ", @class, " "), " worksListOthersImg ")]'),
         function(col) {
           unpack_captions(col);
           add_gallery({collection: col});
         });
     } else if (window.location.href.match(/\/member_illust\.php/)) {
       if (options.illust_id) {
         add_gallery({collection: $x('//div[contains(concat(" ", @class, " "), " worksImageresponse ")]'),
                      cappath:    'ul[contains(concat(" ", @class, " "), " worksResponse ")]/li/text()[last()]'});
       } else if (options.id) {
         add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " display_works ")]/..'),
                      colpath:   'div[contains(concat(" ", @class, " "), " display_works ")]'},
                     null, unpack_captions);
       } else {
         // 自分のイラスト管理
         add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " display_works ")]/..'),
                      colpath:   'div[contains(concat(" ", @class, " "), " display_works ")]',
                      cappath:   'ul/li/label'},
                     null, unpack_captions_label);
       }
     } else if (window.location.href.match(/\/response\.php/) && !options.mode) {
       add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " response ") and h3]'),
                    colpath:   'div[contains(concat(" ", @class, " "), " search_a2_result ")]'},
                   null, unpack_captions);
     } else if (window.location.href.match(/\/ranking(_r18g?|_rookie|_log|_tag|_area)?\.php/)) {
       if ((RegExp.$1 == '_tag' || RegExp.$1 == '_area') && !options.type) {
         // 人気タグ別ランキング / 地域ランキング
         area_right();
       } else {
         // その他ランキング
         var cont = ($x('//div[contains(concat(" ", @class, " "), " rankingPager ")]/..') ||
                     $x('//div[contains(concat(" ", @class, " "), " rankingBox ")]'));
         add_gallery({container: cont,
                      colpath:   './/div[contains(concat(" ", @class, " "), " rankingZone ")]',
                      cappath:   'div[contains(concat(" ", @class, " "), " r_right ")]/p/span/a[contains(@href, "mode=medium")]',
                      thumbpath: '../../../../div[contains(concat(" ", @class, " "), " r_left ")]/ul/li[contains(concat(" ", @class, " "), " r_left_img ")]/a/img'});
       }
     } else if (window.location.href.match(/\/bookmark\.php/) && !options.id &&
                (!options.type || options.type.match(/^illust(?:_all)?$/))) {
       // ブックマーク管理
       add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " display_works ")]/..'),
                    colpath:   'div[contains(concat(" ", @class, " "), " display_works ")]',
                    cappath:   'ul/li/label'},
                   conf.debug ? debug_filter : null, unpack_captions_label);
       function debug_filter(item) {
         var c = $x('input[@name="book_id[]"]', item.caption.parentNode);
         if (c) {
           var d = $c('div');
           remove_node_if_tag_name(item.caption.nextSibling, 'br');
           d.innerHTML = 'ID: ' + item.id + '<br />BID: ' + c.value;
           item.caption.parentNode.insertBefore(d, item.caption.nextSibling);
         }
       }
     } else if (window.location.href.match(/\/bookmark_detail\.php/)) {
       add_gallery({collection: $x('//div[contains(concat(" ", @class, " "), " bookmark_works ")]')});
     } else if (window.location.href.match(/\/stacc/)) {
       add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " contents-main ")]/span[@id="insert_status"]'),
                    colpath:   'div[contains(concat(" ", @class, " "), " post ")]',
                    cappath:   'div/div[contains(concat(" ", @class, " "), " post-side ")]/p[contains(concat(" ", @class, " "), " post-imgtitle ")]/a[contains(@href, "mode=medium")]',
                    thumbpath: '../../preceding-sibling::div[contains(concat(" ", @class, " "), " post-content-ref ")]/div[contains(concat(" ", @class, " "), " post-img ")]/a/img',
                    skip_dups: true});
       /*
     } else if (window.location.href.match(/\/event_detail\.php/)) {
       add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " event-cont ")]/div[contains(concat(" ", @class, " "), " thumbContainer ")]'),
                    colpath:   'ul[contains(concat(" ", @class, " "), " thu ")]',
                    thumbpath: 'li/a[contains(@href, "mode=medium")]/img'});
        */
     }

     // 汎用
     if (pp.galleries.length == 0) {
       if ($x('//div[contains(concat(" ", @class, " "), " profile_area ")]/a[@href="/profile.php"]') &&
           $x('//div[contains(concat(" ", @class, " "), " area_right ")]')) {
         mypage();
       } else {
         add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " display_works ")]/..'),
                      colpath:   'div[contains(concat(" ", @class, " "), " display_works ")]'},
                     null, unpack_captions);
         add_gallery({container: $x('//div[contains(concat(" ", @class, " "), " one_column_body ") and div[contains(concat(" ", @class, " "), " search_a2_result ")]]'),
                      colpath:   'div[contains(concat(" ", @class, " "), " search_a2_result ")]'},
                     null, unpack_captions);
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
              alert(msg);
              _error.apply(this, arguments);
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
                  document.body.removeChild(preloader);
                  img.src = src;
                }, false);
              preloader.src = src;
              preloader.style.display = 'none';
              document.body.appendChild(preloader);
              this.preloaders.set(image, preloader);
            };
          }
        })();
       var de = document.documentElement;
       var gallery;
       pp.recommender.attach(
         function() {
           var illusts = $x('.//ul[contains(concat(" ", @class, " "), " illusts ")]', r_container);
           if (!window.location.href.match(/\/bookmark_add\.php/)) {
             if (conf.locate_recommend_right == 1) {
               locate_right();
             } else if (conf.locate_recommend_right == 2 && de.clientWidth >= 1175 &&
                        $x('//li[contains(concat(" ", @class, " "), " pager_ul_next ")]')) {
               with_pager_func(function() {
                                 locate_right();
                                 if (gallery) init_right_gallery(illusts);
                               });
             }
           }
           init_gallery(illusts);
         });
       function init_gallery(illusts) {
         gallery = add_gallery({container: illusts,
                                colpath:   'li',
                                cappath:   'a[img]/following-sibling::text()[1]',
                                thumbpath: 'preceding-sibling::a/img'},
                               null, unpack_captions);
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
                   clickelem(more);
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
             $('recom_wrap').style.display = 'block';
             switch_wrap.appendChild(r_switch);
           } else {
             $('wrapper').style.width = '970px';
             $('recom_wrap').style.display = 'none';
             r_switch_p.appendChild(r_switch);
           }
         }
         locate_right_real();
       }
       function locate_right_real() {
         var anc = $x('a[contains(@href, "bookmark.php?tag=")]', r_caption);
         var wrap = $c('div');
         var div = $c('div', wrap);
         wrap.id = 'recom_wrap';
         if (anc) {
           div.appendChild(anc.cloneNode(true));
           if (r_switch) {
             var r_switch_p_new = $c('span');
             switch_wrap = $c('span', div);
             switch_wrap.id = 'recom_switch_wrap';
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
                   '#recom_switch_wrap:before{content:"[";margin-left:4px;}' +
                   '#recom_switch_wrap:after{content:"]";}' +
                   '#recom_wrap{float:right;width:190px;text-align:center;}' +
                   '#recom_wrap ul.illusts{margin:0 !important;padding:0 !important;}' +
                   '#recom_wrap li{float:none !important;}' +
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
       with_pager_func(make_float);
     }
     function make_float() {
       var cont = bm_tag_list ? bm_tag_list : $x('//ul[contains(concat(" ", @class, " "), " tagCloud ")]');
       if (cont) {
         var wrap = $x('ancestor::div[contains(concat(" ", @class, " "), " ui-layout-west ")]', cont);
         if (wrap) {
           write_css('.ui-layout-east{float:right;}' +
                     '.ui-layout-west .areaBottom{margin:0px;}');
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
     bm_add_anc.addEventListener('click', toggle, false);

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
             wrap.innerText = 'Error!';
           }
         }, function() {
           if (cancelled) return;
           wrap.innerText = 'Error!';
         }, true);
     }
     function show() {
       if (bm_form_div) return;
       bm_form_div = $c('div');
       bm_form_div.innerText = 'Loading...';
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
     function toggle(e) {
       e.preventDefault();
       if (bm_form_div) {
         hide();
       } else {
         show();
       }
     }
   }
   function init_per_page() {
     var bm_tag_list = $('bookmark_list');
     if (window.location.href.match(/\/bookmark(?:_tag_setting)?\.php/)) {
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
           // trap
           var _bookmarkToggle = window.bookmarkToggle;
           window.bookmarkToggle = function(container_id, type) {
             if (!options.id && conf.bm_tag_order.length) {
               var container = $(container_id);
               container.className = type;
               each(
                 $t('ul', container),
                 function(ul) {
                   if (type == 'cloud') {
                     ul.className = 'tagCloud';
                   } else {
                     ul.removeAttribute('class');
                   }
                 });
               each(
                 $xa('ul/li', container),
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
               _bookmarkToggle(container_id, type);
             }
             var evt = document.createEvent('Event');
             evt.initEvent('pixplusBMTagToggled', true, true);
             document.dispatchEvent(evt);
           };

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
                     '.msgbox_bottom[float]{z-index:90;padding:4px !important;opacity:0.6;}' +
                     '.msgbox_bottom[float]:hover{opacity:1;}');
           new Floater(msgbox);
         }
       }
     } else if (window.location.href.match(/\/member_illust\.php/)) {
       switch(options.mode) {
       case 'medium':
         init_illust_page_bookmark();
         each(
           $xa('//div[contains(concat(" ", @class, " "), " centeredNavi ")]//a[contains(@href, "mode=medium")]'),
           function(anc) {
             anc.setAttribute('nopopup', '');
           });

         var xpath, pos;
         switch(conf.scroll) {
         case 1:
           xpath = '//div[contains(concat(" ", @class, " "), " works_area ")]';
           pos = 0;
           break;
         case 2:
           xpath = '//div[contains(concat(" ", @class, " "), " works_display ")]';
           pos = 1;
           break;
         }
         if (xpath) {
           var elem = $x(xpath);
           if (elem) window.addEventListener('load', function() { scrollelem(elem, pos); }, false);
         }

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
       case 'big':
         //addillustlink(options.illust_id);
         /*
         var img = $x('//body/div/a/img');
         img.parentNode.href = img.src;
         img.parentNode.onclick = '';
         window.location.replace(img.src);
          */
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
                 img.addEventListener(
                   'click',
                   function(ev) {
                     ev.preventDefault();
                     Popup.run(item, page);
                   }, false);
               }
             });
           document.documentElement.style.minHeight = '100%';
           document.body.style.minHeight = '100%';
         }
         break;
       }
     } else if (window.location.href.match(/\/bookmark_add\.php/)) {
       if (conf.mod_bookmark_add_page && options.type == 'illust') {
         var wrap = $x('//div[contains(concat(" ", @class, " "), " one_column_body ")]');
         var autotag = $x('//h2[contains(text(), "\u8ffd\u52a0")]') ? true : false;
         if (wrap) mod_edit_bookmark(wrap, autotag);
       }
     }
   }
   function init_pixplus() {
     document.body.setAttribute('pixplus', '');
     each(LS.l, function(c) { LS.init_section(c.name, c.data[0], c.data[1]); });
     if (LS.s) {
       var order = LS.get('bookmark', 'tag_order');
       if (order) conf.bm_tag_order = LS.parse_bm_tag_order(order);
       var aliases = LS.get('bookmark', 'tag_aliases');
       if (aliases) conf.bm_tag_aliases = LS.parse_bm_tag_aliases(aliases);
     }
     each(
       ['auto_manga', 'reverse'],
       function(key) {
         try {
           if (!conf.popup[key + '_regexp']) throw 1;
           var v = conf.popup[key], r = new RegExp(conf.popup[key + '_regexp']);
           conf.popup[key + '_p'] = v & 2 ? !!window.location.href.match(r) : !!(v & 1);
         } catch(ex) {
           conf.popup[key + '_p'] = false;
         }
       });

     each(
       $xa('//a[contains(@href, "jump.php")]'),
       function(anc) {
         if (anc.href.match(/^(?:http:\/\/www\.pixiv\.net)?\/?jump\.php\?(.*)$/)) {
           var url = RegExp.$1;
           if (url.match(/^\w+%3a%2f%2f/i)) url = decodeURIComponent(url);
           anc.href = url;
         }
       });

     pp.rpc_usable = true;
     if (!conf.debug) {
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
       document.body.insertBefore(pp.rpc_div, document.body.firstChild);
     }

     var evt = document.createEvent('Event');
     evt.initEvent('pixplusInitialize', true, true);
     document.dispatchEvent(evt);

     init_config_ui();
     init_galleries();
     init_recommend();
     init_taglist();
     init_per_page();

     set_bookmark_anc_href();

     write_css('#header .header_otehrs_ul li{margin-left:0px;}' +
               '#header .header_otehrs_ul li + li{margin-left:16px;}' +
               '*[float]{position:fixed;top:0px;}' +
               // コメント
               (conf.popup.font_size ? 'div.popup{font-size:' + conf.popup.font_size + ';}' : '') +
               '.works_caption hr, div.popup hr{display:block;border:none;height:1px;background-color:silver;}' +
               'hr + br, hr ~ br{display:none;}' +
               // ポップアップ/検索欄がz-index:1000なので
               'div.popup{background-color:white;position:fixed;padding:3px;' +
               '  border:2px solid gray;z-index:10000;}' +
               'div.popup .header{line-height:1.1em;}' +
               //'div.popup .page_counter{font-size:smaller;color:gray;line-height:1em;}' +
               'div.popup .title{font-size:larger;font-weight:bold;}' +
               'div.popup .title:hover{text-decoration:none;}' +
               'div.popup .right{float:right;font-size:smaller;}' +
               'div.popup .right > * + *{margin-left:0.4em;}' +
               'div.popup .right a{color:#258fb8;font-weight:bold;}' +
               'div.popup .right a[enable]{color:gray;font-weight:normal;}' +
               'div.popup .header{background-color:white;}' +
               'div.popup .header .caption{padding-top:2px;position:absolute;' +
               '  background-color:white;z-index:10010;opacity:0;padding-bottom:1px;}' +
               'div.popup .header:hover .caption{opacity:' + conf.popup.caption_opacity + ';}' +
               'div.popup .header .caption[show]{opacity:' + conf.popup.caption_opacity + ';visibility:visible;}' +
               'div.popup .caption .separator{border-bottom:1px solid gray;margin-bottom:1px;padding-bottom:1px;}' +
               'div.popup .comment{overflow:auto;line-height:1.2em;}' +
               'div.popup .tags > * + *{margin-left:0.6em;}' +
               'div.popup .tags > span > a + a{margin-left:0.2em;}' +
               'div.popup .tags > .tageditbtn{font-size:smaller;color:gray;line-height:1.1em;}' +
               //'div.popup .post_cap{line-height:1.1em;}' +
               'div.popup .post_cap img.author_img{box-sizing:border-box;' +
               '  float:left;max-height:3.3em;border:1px solid gray;margin:0px 4px 0px 1px;}' +
               'div.popup .post_cap img.author_img:hover{max-height:100%;}' +
               'div.popup .post_cap .date_wrap > span + span{margin-left:0.6em;}' +
               'div.popup .post_cap .date_repost{font-size:smaller;line-height:1.1em;}' +
               'div.popup .post_cap .date_repost:before{content:"(\u518d ";}' +
               'div.popup .post_cap .date_repost:after{content:")";}' +
               'div.popup .post_cap .info_wrap > span + span{margin-left:0.6em;}' +
               'div.popup .post_cap .info_tools > * + *{margin-left:0.6em;}' +
               'div.popup .post_cap .author a{font-weight:bold;}' +
               'div.popup .post_cap .author a + a{margin-left:0.6em;}' +
               'div.popup .bm_edit{margin-top:2px;}' +
               'div.popup .img_div{margin-top:2px;text-align:center;min-width:320px;line-height:0px;}' +
               'div.popup .img_div img{border:1px solid silver;}' +
               'div.popup .olc{position:absolute;cursor:pointer;z-index:1004;opacity:0;background-color:gainsboro;}' +
               'div.popup .olc:hover{opacity:0.6;}' +
               'div.popup .olc-prev{left:3px;}' +
               'div.popup .olc-next{right:3px;}' +
               /*
               'div.popup .olc-prev:before, div.popup .olc-next:before{display:block;position:absolute;bottom:0;' +
               '  background-color:white;border:1px solid silver;border-bottom-width:0px;font-size:120%;font-weight:bold;' +
               '  padding:0.2em 0.6em;text-decoration:none;line-height:1em;background-color:white;color:gray;}' +
               'div.popup .olc-prev:before{left:0px;content:"Prev";border-left-width:0px;border-top-right-radius:0.6em;}' +
               'div.popup .olc-next:before{right:0px;content:"Next";border-right-width:0px;border-top-left-radius:0.6em;}' +
                */
               (conf.popup.remove_pixpedia ? "div.popup a[href^=\"http://dic.pixiv.net/\"]{display:none;}" : "") +
               // rating
               'div.popup .rating.works_area{padding:0px !important;}' +
               'div.popup .rating.works_area input{display:block;}' +
               'div.popup .rating span + span{margin-left:0.4em;}' +
               'div.popup .rating ul.unit-rating{margin:0px;float:none;}' +
               'div.popup .rating #quality_rating{float:none !important;}' +
               'div.popup .rating h4{margin:0px;}' +
               'div.popup .rating #result{font-size:inherit !important;width:330px;}' +
               //'div.popup .rating dl.ra_a{line-height:1.1em;}' +
               'div.popup .rating dl.ra_a dt{width:auto;}' +
               'div.popup .rating dl.ra_a dd{margin-top:-1.1em;}' +
               'div.popup .rating dl.ra_a:after{content:"";clear:both;height:0;display:block;visibility:hidden;}');
     load_css('http://source.pixiv.net/source/css/bookmark_add.css?20100720');

     load_js('http://ajax.googleapis.com/ajax/libs/prototype/1.6.1.0/prototype.js');
     if (!window.location.href.match(/\/member_illust\.php/) || options.mode != 'manga') {
       load_js('http://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js',
               conf.disable_effect ? disable_effect_jq : null);
     }
     load_js('http://ajax.googleapis.com/ajax/libs/scriptaculous/1.8.3/effects.js',
             conf.disable_effect ? disable_effect_se : null);
     load_js('http://source.pixiv.net/source/js/rpc.js');
     load_js('http://source.pixiv.net/source/js/tag_edit.js');
     if (!$x('//script[contains(@src, "/rating")]')) {
       load_js('http://source.pixiv.net/source/js/modules/rating.js?20101107');
     }

     function disable_effect_jq() {
       window.jQuery.fx.off = true;
     }
     function disable_effect_se() {
       window.Effect.ScopedQueue.prototype.add = function(effect) {
         effect.loop(effect.startOn);
         effect.loop(effect.finishOn);
       };
     }

     if (conf.stacc_link) {
       var stacc_anc;
       if (['all', 'mypixiv', 'favorite', 'self'].indexOf(conf.stacc_link) < 0) {
         alert('conf.stacc_link: invalid value - ' + conf.stacc_link);
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
         alert('conf.default_manga_type: invalid value - ' + conf.default_manga_type);
       } else {
         // http://www.pixiv.net/member_illust.php?mode=manga&illust_id=00000000&type=scroll
         each(
           $xa('//a[contains(@href, "member_illust.php?mode=manga")]'),
           function(anc) {
             if (!anc.innerText.match(/^(?:\u30b9\u30af\u30ed\u30fc\u30eb|\u30b9\u30e9\u30a4\u30c9)\u5f0f/)) {
               var o = parseopts(anc.href);
               if (!o.type) anc.href += '&type=' + conf.default_manga_type;
             }
           });
       }
     }

     evt = document.createEvent('Event');
     evt.initEvent('pixplusLoaded', true, true);
     document.dispatchEvent(evt);
   }

   function set_bookmark_anc_href(root) {
     if (conf.bookmark_hide) {
       each(
         $xa('.//a[contains(@href, "bookmark.php")]', root),
         function(anc) {
           if (!anc.href.match(/[\?&]rest=/) &&
               (anc.href.match(/[\?&]type=illust/) ||
                !anc.href.match(/[\?&]type=/))) {
             anc.href += (anc.href.match(/\?/) ? "&" : "?") + "rest=hide";
           }
         });
     }
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
   function Gallery(args, filter, filter_col) {
     this.args = args;
     this.args.cappath = this.args.cappath || 'ul/li/text()[1]';
     this.args.thumbpath = this.args.thumbpath || 'preceding-sibling::a[position()=1 and contains(@href, "mode=medium")]/img';
     this.filter = filter;
     this.filter_col = filter_col;

     this.items     = [];
     this.idmap     = {};
     this.first     = null;
     this.last      = null;
     this.prev_dups = [];
     this.page_item = 0;
     this.page_col  = 0;

     this.onadditem = new Signal();

     if (this.args.container && this.args.colpath) {
       var self = this;
       this.detect_new_collection();
       this.args.container.addEventListener(
         'DOMNodeInserted',
         function() {
           setTimeout(function() { self.detect_new_collection(); }, 100);
         }, false);
       Gallery.oncreate.emit(this);
     } else if (this.args.collection) {
       this.add_collection(this.args.collection);
       Gallery.oncreate.emit(this);
     } else {
       throw 1;
     }
     return this;
   }
   Gallery.oncreate = new Signal();
   Gallery.prototype.detect_new_collection = function() {
     var self = this;
     each(
       $xa(this.args.colpath, this.args.container),
       function(col) {
         if (!col.hasAttribute('pixplus_loaded')) {
           self.add_collection(col);
         }
       });
   };
   Gallery.prototype.add_collection = function(col) {
     if (this.filter_col) this.filter_col(col);
     col.setAttribute('pixplus_loaded', 'true');

     var caps = $xa(this.args.cappath, col);
     if (!caps.length) return;

     var self = this;
     var prev = this.last;
     this.page_item = 0;
     ++this.page_col;
     each(
       caps,
       function(cap, cnt) {
         var thumb = $x(self.args.thumbpath, cap);
         var thumb_anc = $x('ancestor-or-self::a', thumb);
         if ((!self.args.allow_nothumb || cnt < self.args.allow_nothumb) && !thumb) return;
         var url = cap.href || (thumb_anc && thumb_anc.href);
         if (!url || !url.match(/[\?&]illust_id=(\d+)/)) return;
         if (cap.nodeType == 3) {
           var new_caption = $c('a');
           new_caption.href = url;
           new_caption.innerText = trim(cap.nodeValue);
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

         var item;
         var pbtn = thumb;
         if (!pbtn) {
           pbtn = $c('a');
           pbtn.href = url;
           pbtn.innerText = '\u25a0';
           pbtn.style.marginRight = '4px';
           cap.parentNode.insertBefore(pbtn, cap);
         }
         pbtn.addEventListener(
           'click',
           function(e) {
             if (e.shiftKey || e.ctrlKey) return;
             e.preventDefault();
             Popup.run(item);
           }, false);

         item = new GalleryItem(url, thumb, cap, prev, self);
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
     var self = this;
     this.root_div              = $c('div',     null,               'popup');
     this.header                = $c('div',     this.root_div,      'header');
     // 文字によってはキャプションの幅計算が壊れるのでタイトルをblockなエレメントでラップする
     this.title_div             = $c('div',     this.header,        'title_wrapper');
     //this.page_counter          = $c('span',    this.title_div,     'page_counter');
     this.title                 = $c('a',       this.title_div,     'title');
     this.title.setAttribute('nopopup', '');
     this.header_right          = $c('span',    this.title_div,     'right');
     this.status                = $c('span',    this.header_right,  'status');
     this.status.style.display  = 'none';
     this.manga_btn             = $c('a',       this.header_right,  'manga_btn');
     this.manga_btn.addEventListener('click', bind_event(this.toggle_manga_mode, this), false);
     this.res_btn               = $c('a',       this.header_right,     'res_btn');
     this.res_btn.innerText     = '[R]';
     this.bm_btn                = $c('a',       this.header_right,  'bm_btn');
     this.bm_btn.href           = 'javascript:void(0)';
     this.bm_btn.innerText      = '[B]';
     this.bm_btn.addEventListener('click', bind_event(this.edit_bookmark, this), false);
     this.caption               = $c('div',     this.header,        'caption');
     this.err_msg               = $c('div',     this.caption,       'error separator');
     this.comment               = $c('div',     this.caption,       'comment');
     this.tags                  = $c('div',     this.caption,       'tags separator');
     this.tags.id               = 'tag_area';
     this.tag_edit              = $c('div',     this.caption);
     this.tag_edit.id           = 'tag_edit';
     this.rating                = $c('div',     this.caption,       'rating separator works_area');
     this.post_cap              = $c('div',     this.caption,       'post_cap');
     this.a_img                 = $c('img',     this.post_cap,      'author_img');
     this.date_wrap             = $c('div',     this.post_cap,      'date_wrap');
     this.date                  = $c('span',    this.date_wrap,     'date');
     this.date_repost           = $c('span',    this.date_wrap,     'date_repost');
     this.info                  = $c('div',     this.post_cap,      'info_wrap');
     this.info_size             = $c('span',    this.info,          'info_size');
     this.info_scale            = $c('span',    this.info,          'info_scale');
     this.info_tools            = $c('span',    this.info,          'info_tools');
     this.author                = $c('div',     this.post_cap,      'author');
     this.a_profile             = $c('a',       this.author);
     this.a_illust              = $c('a',       this.author);
     this.a_illust.innerText    = '\u4f5c\u54c1';
     this.a_bookmark            = $c('a',       this.author);
     this.a_bookmark.innerText  = '\u30d6\u30c3\u30af\u30de\u30fc\u30af';
     this.a_stacc               = $c('a',       this.author);
     this.a_stacc.innerText     = '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9';
     this.bm_edit               = $c('div',     this.root_div,      'bm_edit');
     this.img_div               = $c('div',     this.root_div,      'img_div');
     this.img_anc               = $c('a',       this.img_div);
     this.image                 = $c('img',     this.img_anc);
     this.image_scaled          = this.image;

     if (conf.popup.overlay_control > 0) {
       this.olc_prev              = $c('span',    this.img_div,       'olc olc-prev');
       this.olc_next              = $c('span',    this.img_div,       'olc olc-next');
       this.olc_prev.addEventListener('click', bind_event(this.prev, this, false, false, true), false);
       this.olc_next.addEventListener('click', bind_event(this.next, this, false, false, true), false);
     }

     this.init_display();

     this.bm_loading = false;
     this.rating_enabled = false;
     this.tag_editing = false;
     this.has_qrate = false;
     this.has_image_response = false;
     this.zoom_scale = 1;

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

     this.onsetitem = new Signal(null, Popup.onsetitem);
     this.onload = new Signal(null, Popup.onload);
     this.onkeypress = new Signal(null, Popup.onkeypress);
     this.onclick = new Signal(null, Popup.onclick);
     this.onclose = new Signal(close, Popup.onclose);

     this.onclick.bind_event(this, this.img_anc, 'click', false);

     //document.body.insertBefore(this.root_div, document.body.firstChild);
     document.body.appendChild(this.root_div);
     this.locate();
     Popup.oncreate.emit(this);
     window.addEventListener('keypress', keypress, false);
     window.addEventListener('resize',   locate,   false);
     function close() {
       window.removeEventListener('keypress', keypress, false);
       window.removeEventListener('resize',   locate,   false);
       this.onclick.unbind_events();
     }
     function keypress(e) {
       self.keypress(e);
     }
     function locate() {
       self.locate();
     }
     this.set(item, false, false, false, typeof manga_page == 'number' ? manga_page : -1);
     return this;
   }
   Popup.oncreate = new Signal();
   Popup.onsetitem = new Signal();
   Popup.onload = new Signal();
   Popup.onkeypress = new Signal(
     function(e) {
       var p = this;
       var c = e.keyCode, s = e.shiftKey, m_e = p.manga.enabled;
       if (p.is_bookmark_editing()) {
         if (c == 27 && m()) q(e, p.close_edit_bookmark);
       } else {
         if (c == e.which) {
           switch(c) {
           case 69: case 101: if (m())  q(e, p.open_author_profile,   s); return; // e
           case 82: case 114: if (m(1)) q(e, a_illust,                s); return; // r
           case 84: case 116: if (m())  q(e, p.open_author_bookmark,  s); return; // t
           case 89: case 121: if (m())  q(e, p.open_author_staccfeed, s); return; // y
           case 66: case  98: if (m(1)) q(e, bookmark, s);                return; // b
           case 70: case 102: if (m(1)) q(e, p.open, !s);                 return; // f
           case 71: case 103: if (m())  q(e, p.reload);                   return; // g
           case 67: case  99: if (m(1)) q(e, caption, s);                 return; // c
           case 86: case 118: if (m(1)) q(e, manga, s);                   return; // v
           case 73: case 105: if (m())  q(e, zoom, -1);                   return; // i
           case 79: case 111: if (m())  q(e, zoom,  1);                   return; // o
           }
           if (conf.popup.rate && conf.popup.rate_key && ((c >= 33 && c <= 41) || c == 126) && m(1)) {
             var score = c == 126 ? 1 : 43 - c;
             window.countup_rating(score);
             return;
           }
         }
         if (e.qrate) {
           var n;
           switch(c) {
           case 38: if (m()) q(e, sel_qr, e.qrate.previousSibling); return; // up
           case 40: if (m()) q(e, sel_qr, e.qrate.nextSibling);     return; // down
           case 27: if (m()) q(e, window.rating_ef2);               return; // esc
           }
           function sel_qr(node) {
             if (Popup.is_qrate_button(node)) node.focus();
           }
         } else {
           switch(c) {
           case  8: case 37: case 38: if (m()) q(e, p.prev, c == 8,  c == 38); break; // bs/left/up
           case 32: case 39: case 40: if (m()) q(e, p.next, c == 32, c == 40); break; // space/right/down
           case 35: if (m()) q(e, p.last);                                     break; // end
           case 36: if (m()) q(e, p.first);                                    break; // home
           case 27: if (m()) q(e, m_e ? p.toggle_manga_mode : p.close);        break; // escape
           }
         }
       }
       function a_illust(response) {
         response ? p.open_image_response() : p.open_author_illust();
       }
       function bookmark(detail) {
         detail ? p.open_bookmark_detail() : p.toggle_edit_bookmark();
       }
       function caption(qrate) {
         qrate ? p.toggle_qrate() : p.toggle_caption();
       }
       function manga(tb) {
         tb ? p.open_manga_tb() : p.toggle_manga_mode();
       }
       function zoom(z) {
         p.set_zoom(p.zoom_scale + z);
       }
       function q(e, f) {
         if (e) e.preventDefault();
         return f.apply(p, [].slice.apply(arguments, [2]));
       }
       function m(shift, ctrl, alt) {
         if (!shift && e.shiftKey) return false;
         if (!ctrl  && e.ctrlKey)  return false;
         if (!alt   && e.altKey)   return false;
         return true;
       }
     });
   Popup.onclick = new Signal(
     function(ev) {
       ev.preventDefault();
       this.close();
     });
   Popup.onclose = new Signal();
   Popup.run = function(item, manga_page) {
     if (Popup.instance) {
       Popup.instance.set(item, false, false, false, manga_page);
     } else {
       Popup.instance = new Popup(item, manga_page);
       Popup.instance.onclose.connect(
         function() {
           Popup.instance = null;
         });
     }
     return Popup.instance;
   };
   Popup.run_url = function(url) {
     var item = new GalleryItem(url, null, null, Popup.instance ? Popup.instance.item : null);
     if (Popup.instant_prev) Popup.instant_prev.next = item;
     Popup.instant_prev = item;
     return Popup.run(item);
   };
   Popup.prototype.init_display = function(msg) {
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
   Popup.prototype.set_status = function(msg) {
     this.status.innerText = msg;
     this.status.style.display = 'inline';
     this.err_msg.style.display = 'none';
     this.locate();
   };
   Popup.prototype.error = function(msg) {
     this.set_status('Error!');
     if (msg) {
       this.err_msg.innerText = msg;
       this.err_msg.style.display = 'block';
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
   /*
   Popup.prototype.update_page_counter = function(item) {
     if (item.gallery && item.page_item && item.page_col) {
       var text = '';
       if (item.gallery.page_col < item.gallery.page_item) {
         text += item.page_col + '+';
       }
       text += item.page_item;
       this.page_counter.innerText = '[' + text + ']';
       this.page_counter.style.display = 'inline';
     } else {
       this.page_counter.style.display = 'none';
     }
   };
    */
   Popup.prototype.set = function(item, scroll, close, reload, manga_page) {
     if (!item) {
       if (close) this.close();
       return;
     }
     if (this.loader) this.loader.cancel();
     if (!this.item && item.caption) {
       //this.update_page_counter(item);
       this.title.innerText = trim(item.caption.innerText);
       this.title.href = item.medium;
     }
     var self = this;
     this.set_status('Loading');
     this.item   = Popup.lastitem = item;
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
     this.onsetitem.emit(this);
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
     //this.update_page_counter(this.item);

     if (scroll) scrollelem(this.item.thumb || this.item.caption);

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
     this.info.style.display = 'block';
     this.info_tools.style.display = 'none';
     /* ツールは「&nbsp;」区切り
      * R-18やマイピク限定の場合は全角スペースを挟んでその旨表示
      */
     if (loader.text.match(/<div[^>]+class="works_data"[^>]*>[\r\n]*<p>([^\u3000]*).*?<\/p>[\r\n]*?<h3>(.*)<\/h3>/i)) {
       var tmp = RegExp.$1.split('\uff5c');
       _title = trim(RegExp.$2);
       if (tmp[0].match(/((\d{4}\u5e74\d{2}\u6708\d{2})\u65e5 \d{2}:\d{2})/)) {
         var _date = RegExp.$2;
         this.date.innerText = RegExp.$1;
         // 再投稿表示。「日」が抜けてる。pixivのバグ？
         if (loader.text.match(/(\d{4}\u5e74\d{2}\u6708\d{2})\u65e5? (\d{2}:\d{2}) \u306b\u518d\u6295\u7a3f/)) {
           this.date_repost.innerText = (RegExp.$1 == _date ? '' : RegExp.$1 + '\u65e5 ') + RegExp.$2;
           this.date_repost.style.display = 'inline';
         } else {
           this.date_repost.style.display = 'none';
         }
         this.date_wrap.style.display = 'block';
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
         this.info_tools.style.display = 'inline';
       }
     }
     this.root_div.setAttribute('manga', this.manga.usable ? 'true' : 'false');

     if (this.item.caption) {
       this.title.innerText = trim(this.item.caption.innerText);
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
       this.a_img.src            = RegExp.$3;
       this.a_profile.href       = RegExp.$1;
       this.a_profile.innerHTML  = RegExp.$4; // 属性を使うのでtrimしない。
       this.a_illust.href        = '/member_illust.php?id=' + RegExp.$2;
       this.a_bookmark.href      = '/bookmark.php?id=' + RegExp.$2;
       if (loader.text.match(/<a[^>]+href=\"http:\/\/www\.pixiv\.net(\/stacc\/[^\/]+)\"[^>]+title=\"\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\"/i)) {
         this.a_stacc.href       = RegExp.$1;
         this.a_stacc.style.display = 'inline';
       }
       this.a_img.style.display  = 'block';
       this.author.style.display = 'block';
       this.post_cap.style.display = 'block';
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
       this.res_btn.style.display = 'inline';
     }
     this.bm_btn.style.display = 'none';
     if (loader.text.match(/<div[^>]+class=\"works_iconsBlock\"[^>]*>([\s\S]*?)<\/div>/i)) {
       if (RegExp.$1.match(/bookmark_detail\.php\?/i)) {
         this.bm_btn.setAttribute('enable', '');
       } else {
         this.bm_btn.removeAttribute('enable');
       }
       this.bm_btn.href = '/bookmark_add.php?type=illust&illust_id=' + this.item.id;
       this.bm_btn.style.display = 'inline';
     }
     this.comment.style.display = 'none';
     if (loader.text.match(/<p[^>]+class=\"works_caption\"[^>]*>(.*)<\/p>/i) &&
         (this.comment.innerHTML = edit_comment(RegExp.$1))) {
       this.comment.style.display = 'block';
     }
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
           html += '<a href="javascript:void(0)" class="tageditbtn" onclick="startTagEdit()">[E]</a>';
         }
         this.tags.innerHTML = html;
         this.tags.style.display = 'block';
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
       this.rating.style.display = 'block';
       this.rating_enabled = true;

       var anc = $x('div[@id="rating"]/h4/a', this.rating);
       if (anc && anc.getAttribute('onclick') == 'rating_ef4()') { /* WARN */
         anc.onclick = '';
         anc.addEventListener(
           'click',
           function(ev) {
             var qr = $x('div[@id="quality_rating"]', self.rating);
             window[qr && qr.visible() ? 'rating_ef2' : 'rating_ef'](); /* WARN */
             ev.preventDefault();
           }, false);
       }
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
       this.onload.emit(this);
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
     this.manga_btn.innerText = '[M:' + (this.manga.page + 1) + '/' + this.manga.page_count + ']';
   };
   Popup.create_zoom_image = function(url, width, height) {
     var svg_img = document.createElementNS(XMLNS_SVG, 'image');
     svg_img.setAttribute('width', '100%');
     svg_img.setAttribute('height', '100%');
     svg_img.style.imageRendering = 'optimizeSpeed';
     svg_img.setAttributeNS(XMLNS_XLINK, 'xlink:href', url);
     var svg = document.createElementNS(XMLNS_SVG, 'svg');
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
     this.img_div.style.display = 'block';
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
     this.info_size.innerText = this.image_size_orig.join('x');
     this.info_scale.innerText = scale + 'x';
     this.post_cap.style.display = 'block';
   };
   Popup.prototype.locate = function() {
     var de = document.documentElement;
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
       //bm_edit.style.maxWidth  = mw;
       //bm_edit.style.maxHeight = mh;
     } else {
       tg.style.margin = '0px';
       tg.style.maxWidth = mw;
       tg.style.maxHeight = mh;
       this.caption.style.pixelWidth = this.header.offsetWidth;
       var ch = this.img_div.offsetHeight * conf.popup.caption_height - this.tags.offsetHeight - this.author.offsetHeight;
       this.comment.style.maxHeight = (ch < 48 ? 48 : ch) + 'px';
       /*
       if (this.caption.offsetHeight * 2 > this.img_div.offsetHeight) {
         var o = this.root_div.offsetHeight - this.img_div.offsetHeight;
         this.root_div.style.minHeight = (this.caption.offsetHeight * 2 + o) + 'px';
       }
        */
       var ph = this.caption.offsetHeight + 48;
       if (tg.offsetHeight < ph) tg.style.margin = (ph - tg.offsetHeight) / 2 + 'px 0px';
       if (conf.popup.overlay_control > 0) {
         var width;
         if (conf.popup.overlay_control < 1) {
           width = Math.floor(this.root_div.clientWidth * conf.popup.overlay_control);
         } else {
           width = Math.floor(conf.popup.overlay_control);
         }
         this.olc_prev.style.pixelWidth  = width;
         this.olc_prev.style.pixelHeight = this.img_div.offsetHeight;
         this.olc_next.style.pixelWidth  = width;
         this.olc_next.style.pixelHeight = this.img_div.offsetHeight;
       }
     }
     this.root_div.style.pixelLeft = (de.clientWidth  - this.root_div.offsetWidth)  / 2;
     this.root_div.style.pixelTop  = (de.clientHeight - this.root_div.offsetHeight) / 2;
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
     if (this.onclose.emit(this)) return;
     if (this.loader) this.loader.cancel();
     if (this.conn_g_add_item) this.conn_g_add_item.disconnect();
     document.body.removeChild(this.root_div);
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
   Popup.prototype.keypress = function(e) {
     var ae = document.activeElement;
     if (ae && lc(ae.tagName || '') == 'input') {
       if (Popup.is_qrate_button(ae)) {
         e.qrate = ae;
         this.onkeypress.emit(this, e);
       }
     } else {
       this.onkeypress.emit(this, e);
     }
   };
   Popup.prototype.toggle_qrate = function() {
     if (this.has_qrate) {
       var anc = $x('div[@id="rating"]/h4/a', this.rating), qr;
       if (anc) {
         this.caption.setAttribute('show', '');
         clickelem(anc);
       }
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
             self.bm_edit.innerHTML = RegExp.$1;
             self.bm_edit.style.display    = 'block';
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
     this.img_div.style.display    = 'block';
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
       //if (conf.debug) console.log('trying parallel load - ' + this.item.img_url_base);
       this.parallel = true;
       this.load_image(this.item.img_url_base + (conf.popup.big_image ? '' : '_m') + this.item.img_url_ext);
     }

     geturl(
       this.url,
       function(text) {
         if (text.match(/<span[^>]+class="error"[^>]*>(.+)<\/span>/i)) {
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
           //if (conf.debug) console.log('parallel load failed - ' + self.item.img_url_base);
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

   window.opera.addEventListener(
     'AfterEvent.click',
     function(e) {
       if (e.event.shiftKey || e.event.ctrlKey) return;
       var anc = $x('ancestor-or-self::a[1]', e.event.target);
       if (!e.eventCancelled && anc && !anc.hasAttribute('nopopup') &&
           anc.href.match(/^(?:http:\/\/www\.pixiv\.net\/)?member_illust\.php.*[\?&](illust_id=\d+)/)) {
         if (Popup.instance || $t('img', anc).length ||
             !$x('//a[contains(@href, "member_illust.php") and contains(@href, "' + RegExp.$1 + '")]//img')) {
           var opts = parseopts(anc.href);
           if (opts.illust_id && opts.mode == 'medium') {
             e.event.preventDefault();
             Popup.run_url(anc.href);
           }
         }
       }
     }, false);

   function mod_edit_bookmark(root, autotag, title, comment, on_close) {
     var form          = $x('.//form[@action="bookmark_add.php"]', root);
     var input_tag     = $x('.//input[@id="input_tag"]', root);
     var tagcloud      = $x('.//ul[contains(concat(" ", @class, " "), " tagCloud ")]', root);

     var tag_wraps     = $xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]', root);
     var tag_wrap_it   = tag_wraps.length >= 2 ? tag_wraps[0] : null;
     var tag_wrap_bm   = tag_wraps[tag_wraps.length >= 2 ? 1 : 0];
     var tags_illust   = tag_wrap_it ? $xa('ul/li/a', tag_wrap_it) : [];
     var tags_bookmark = $xa('ul/li/a', tag_wrap_bm);

     root.className += ' pixplus_bm_wrap';
     if (!mod_edit_bookmark.css_written) {
       write_css('.pixplus_bm_wrap .bookmain_title{padding:4px;}' +
                 '.pixplus_bm_wrap .bookmain_title_img{text-align:left;}' +
                 '.pixplus_bm_wrap .box_main_sender{padding-right:0px;padding-bottom:0px;}' +
                 '.pixplus_bm_wrap .box_one_body{padding:0px;}' +
                 '.pixplus_bm_wrap .box_one_body > dl{padding:4px 4px 0px 4px;margin:0px;line-height:24px;}' +
                 '.pixplus_bm_wrap .box_one_body > dl:last-child{padding:4px;}' +
                 '.pixplus_bm_wrap .box_one_body > dl > dd{margin-top:-24px;}' +
                 '.pixplus_bm_wrap .autoinput_wrap{text-align:right;line-height:normal;margin-top:4px;}' +
                 '.pixplus_bm_wrap .autoinput_wrap > a + a{margin-left:0.6em;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag{margin:4px;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag + .bookmark_recommend_tag{margin-top:16px;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > span:first-child{display:none;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > br{display:none;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > ul{padding:0px;margin:0px;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > ul + ul{margin-top:4px;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > ul > li{padding:2px;margin-right:4px;}' +
                 '.pixplus_bm_wrap .bookmark_recommend_tag > ul > li[selected]{border:2px solid #56E655;padding:0px;}' +
                 '.pixplus_bm_wrap .bookmark_bottom{padding-bottom:4px;}' +
                 '.pixplus_bm_wrap .bookmark_bottom input{margin:0px;}');
       mod_edit_bookmark.css_written = true;
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
       var close  = $c('input', submit.parentNode, 'btn_type01 bookmark_submit_btn');
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

     var autoinput_wrap = $c('div', null, 'autoinput_wrap');
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

     each(
       tags_illust.concat(tags_bookmark),
       function(it) {
         var tag = it.firstChild.nodeValue;
         it.addEventListener(
           'click',
           function(e) {
             e.preventDefault();
             window.add_form(tag);
           }, false);
         it.onclick = '';
         it.href = '/tags.php?tag=' + tag;
       });

     var initialized = false, jq_ready;
     load_js('http://source.pixiv.net/source/js/bookmark_add_v4.js?20101028',
             init,
             function() {
               /* window.jQuery(function)=>jQuery.fn.ready()がjQuery.isReady === trueの時
                * 同期的にコールバックするためwindow.getAllTagsなどが未定義となる。
                * エラー回避のみ。
                */
               if (jq_ready) return;
               jq_ready = window.jQuery.fn.ready;
               window.jQuery.fn.ready = function(func) {
                 setTimeout(func, 10);
               };
             });

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
         each(
           reorder_tags($xa('ul/li', tag_wrap_bm)),
           function(list) {
             var ul = $c('ul', tag_wrap_bm, 'tagCloud');
             each(
               list,
               function(li) {
                 li.parentNode.removeChild(li);
                 ul.appendChild(li);
               });
           });
         tag_wrap_bm.removeChild($t('ul', tag_wrap_bm)[0]);
       } else {
         bookmarkTagSort.init();
       }

       var first = true;
       var p = 'pixplus-bm-tag-' + Math.floor(Math.random() * 100);
       each(
         $xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', root),
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
         each(
           $xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', root),
           function(ul) {
             var l = $t('li', ul);
             if (l.length) items.push(l);
           });
         if (items.length) {
           input_tag.addEventListener(
             'keypress',
             function(e) {
               if (e.shiftKey || e.ctrlKey || e.altKey) return;
               if (selected) {
                 switch(e.keyCode) {
                 case 32: toggle(e); break; // space
                 case 27: unselect(e); break; // escape
                 case 37: select(e, false, -1,  0); break; // left
                 case 38: select(e, false,  0, -1); break; // up
                 case 39: select(e, false,  1,  0); break; // right
                 case 40: select(e, false,  0,  1); break; // down
                 }
               } else if (e.keyCode == 40 || e.keyCode == 38) {
                 select(e, true, 0, e.keyCode == 40 ? 0 : items.length - 1);
               }
             }, false);
           function toggle(e) {
             e.preventDefault();
             if (selected) toggle_tag($x('a', selected));
           }
           function unselect(e) {
             if (e) e.preventDefault();
             if (selected) {
               selected.removeAttribute('selected');
               selected = null;
             }
           }
           function select(e, absolute, px, py) {
             e.preventDefault();
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
       each(
         tags_bookmark,
         function(t) {
           var tag = t.firstChild.nodeValue;
           if (tags.indexOf(tag) < 0) {
             var aliases = conf.bm_tag_aliases[tag];
             each(
               aliases ? [tag].concat(aliases) : [tag],
               function(tag) {
                 if (func(t, tag)) {
                   toggle_tag(t);
                   return true;
                 } else {
                   return false;
                 }
               });
           }
         });
     }
     function toggle_tag(tag) {
       clickelem(tag);
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
       anc.innerText = text;
       anc.style.fontSize = 'x-small';
       anc.addEventListener('click', click_func, false);
       if (parent) parent.appendChild(anc);
       return anc;
     }
     function get_caption() {
       var i_title   = title || $x('//div[contains(concat(" ", @class, " "), " works_data ")]/h3');
       var i_comment = comment || $x('//div[contains(concat(" ", @class, " "), " works_tag ")]/preceding-sibling::p');
       return (i_title ? i_title.innerText : '') + (i_comment ? i_comment.innerText : '');
     }
   }

   function add_gallery(args, filter, filter_col) {
     try {
       var g = new Gallery(args, filter, filter_col);
       pp.galleries.push(g);
       return g;
     } catch(ex) {
       return null;
     }
   }

   function reorder_tags(list) {
     var ary = [];
     each(
       conf.bm_tag_order,
       function(order) {
         var ary_ary = [];
         each(
           order,
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
     each(
       ary,
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

   function Floater(wrap, cont) {
     this.wrap = wrap;
     this.cont = cont;
     if (!Floater.instances) Floater.instances = [];
     Floater.instances.push(this);
     if (Floater.loaded) this.init();
   }
   Floater.load = function() {
     if (Floater.loaded) return;
     each(Floater.instances, function(inst) { inst.init(); });
     window.addEventListener('scroll', Floater.update_float, false);
     window.addEventListener('resize', Floater.force_update, false);
     document.addEventListener('pixplusBMTagToggled', Floater.force_update, false);
     document.addEventListener('pixplusConfigToggled', Floater.force_update, false);
     Floater.loaded = true;
   };
   Floater.update_float = function() {
     each(Floater.instances, function(inst) { inst.update_float(); });
   };
   Floater.force_update = function() {
     each(Floater.instances, function(inst) { inst.force_update(); });
   };
   Floater.prototype.init = function() {
     this.wrap.style.boxSizing = 'border-box';
     this.wrap.style.pixelWidth = this.wrap.offsetWidth;
     if (this.cont) {
       this.cont.style.display = 'block';
       this.cont.style.overflowX = 'hidden';
       this.cont.style.overflowY = 'auto';
       this.update_height();
     }
     this.update_position();
     this.update_float();
   };
   Floater.prototype.force_update = function() {
     this.unfloat();
     this.floating = undefined;
     this.update_position();
     this.update_float();
   };
   Floater.prototype.update_position = function () {
     this.wrap_pos = getpos(this.wrap);
   };
   Floater.prototype.unfloat = function () {
     this.wrap.removeAttribute('float');
     /*
     if (this.cont) {
       this.cont.style.overflowX = '';
       this.cont.style.overflowY = '';
       this.cont.style.maxHeight = '';
     }
      */
     this.floating = false;
   };
   Floater.prototype.update_height = function () {
     if (this.cont) {
       var de = document.documentElement;
       var mh = de.clientHeight - (this.wrap.offsetHeight - this.cont.offsetHeight);
       if (!this.floating) mh -= getpos(this.wrap).top - de.scrollTop;
       this.cont.style.maxHeight = mh;
     }
   };
   Floater.prototype.update_float = function () {
     var de = document.documentElement;
     if (this.floating !== true && de.scrollTop > this.wrap_pos.top) {
       this.wrap.setAttribute('float', '');
       this.floating = true;
     } else if (this.floating !== false && de.scrollTop < this.wrap_pos.top) {
       this.unfloat();
     }
     this.update_height();
   };
   window.addEventListener('load', Floater.load, false);

   function Signal(def, parent) {
     this.def = def;
     this.parent = parent;
     this.funcs = [];
     this.id = 1;
     this.bind_events = [];
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
     if (this.def    && (res = this.def.apply(inst, args))) return res;
     if (this.parent && (res = Signal.prototype.emit.apply(this.parent, arguments))) return res;
     return false;
   };
   Signal.prototype.bind_event = function(inst, obj, name, capture) {
     var self = this;
     var func = function(ev) {
       self.emit(inst, ev);
     };
     obj.addEventListener(name, func, capture);
     this.bind_events.push([obj, name, func, capture]);
   };
   Signal.prototype.unbind_events = function() {
     each(this.bind_events,
          function(ent) {
            ent[0].removeEventListener(ent[1], ent[2]);
          });
   };
   Signal.Connection = function(signal, id) {
     this.signal = signal;
     this.id = id;
     this.disconnected = false;
   };
   Signal.Connection.prototype.disconnect = function() {
     if (!this.disconnected) this.signal.disconnect(this.id);
   };

   function with_pager_func(func) {
     if (window.AutoPagerize || window.AutoPatchWork) {
       func();
     } else {
       if (!with_pager_func.funcs) {
         with_pager_func.funcs = [];
         connect_event('GM_AutoPagerizeLoaded');
         connect_event('AutoPatchWork.request');
       }
       with_pager_func.funcs.push(func);
     }
     function connect_event(name) {
       document.addEventListener(
         name,
         function() {
           each(with_pager_func.funcs, function(func) { func(); });
           with_pager_func.funcs = null;
           document.removeEventListener(name, arguments.callee, false);
         }, false);
     }
   }

   // 汎用
   function $(id, elem) {
     return document.getElementById(id);
   }
   function $t(tag, elem) {
     return (elem || document).getElementsByTagName(tag);
   }
   function $c(tag, parent, cls) {
     var elem = document.createElement(tag);
     if (parent) parent.appendChild(elem);
     if (cls) elem.className = cls;
     return elem;
   }
   function $x(xpath, root) {
     if (arguments.length > 1 && !root) return null;
     var doc = root ? root.ownerDocument : (root = document);
     // XPathResult.FIRST_ORDERED_NODE_TYPE = 9
     return doc.evaluate(xpath, root, null, 9, null).singleNodeValue;
   }
   function $xa(xpath, root) {
     var doc = root ? root.ownerDocument : (root = document);
     // XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 7
     var nodes = doc.evaluate(xpath, root, null, 7, null);
     var res = new Array();
     for(var i = 0; i < nodes.snapshotLength; ++i) {
       res.push(nodes.snapshotItem(i));
     }
     return res;
   }
   function getpos(element, root) {
     var left = element.offsetLeft, top = element.offsetTop;
     while((element = element.offsetParent) && element != root) {
       left += element.offsetLeft;
       top += element.offsetTop;
     }
     return {left: left, top: top};
   }
   function scrollelem(element, pos) {
     if (!element) return;
     pos = parseFloat(typeof pos == 'undefined' ? 0.5 : pos);
     var p = element.parentNode;
     while(p) {
       if (p.scrollHeight > p.offsetHeight) {
         p.scrollTop = getpos(element, p).top - p.clientHeight * pos;
         return;
       }
       p = p.parentNode;
     }
     window.scroll(0, getpos(element).top - window.innerHeight * pos);
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
   function clickelem(elem) {
     var evt = elem.ownerDocument.createEvent('MouseEvents');
     evt.initMouseEvent('click', true, true, window,
                        0, 0, 0, 0, 0, false, false, false, false, 0, null);
     elem.dispatchEvent(evt);
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
           document.body.removeChild(img);
           imgcache[url] = img;
           if (cb_load) cb_load(img);
         }, false);
       if (cb_error && !cb_abort) cb_abort = cb_error;
       if (cb_error) img.addEventListener('error', cb_error, false);
       if (cb_abort) img.addEventListener('abort', cb_abort, false);
       img.src = url;
       img.style.display = 'none';
       document.body.appendChild(img);
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
     return $x('//' + elem + '[contains(@' + attr + ', "' + name + '")]');
   }
   function load_js(url, cb_load, cb_add, cb_noadd) {
     if (chk_ext_src('script', 'src', url)) {
       if (cb_load) cb_load();
       if (cb_noadd) cb_noadd();
       return false;
     } else {
       if (cb_add) cb_add();
       var js  = $c('script');
       js.type = 'text/javascript';
       if (cb_load) js.addEventListener('load', cb_load, false);
       js.src  = url;
       document.body.appendChild(js);
       return true;
     }
   }
   function load_css(url) {
     if (chk_ext_src('link', 'href', url)) {
       return false;
     } else {
       var css  = $c('link');
       css.rel  = 'stylesheet';
       css.type = 'text/css';
       css.href = url;
       document.body.appendChild(css);
       return true;
     }
   }
   function write_css(source) {
     var css = $c('style');
     css.setAttribute('type', 'text/css');
     css.innerText = source;
     document.body.appendChild(css);
   }

   function bind(func, obj) {
     var args = [].slice.apply(arguments, [2]);
     return function() {
       func.apply(obj, args.concat([].slice.apply(arguments)));
     };
   }
   function bind_event(func, obj) {
     var args = [].slice.apply(arguments, [2]);
     return function(ev) {
       ev.preventDefault();
       func.apply(obj, args);
     };
   }

   function create_post_data(form) {
     var data = new Object();
     each(
       $t('input', form),
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
 })();
