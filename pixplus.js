// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     0.6
// @license     Apache License 2.0
// @description pixivをほげる。
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @exclude     *pixivreader*
// ==/UserScript==

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
 * 企画目録(新着/注目/まとめ/関連)

 * 2009/10/22 http://dev.pixiv.net/archives/892022.html
 * 2010/07/20 http://twitter.com/pixiv/status/18992660402
 */

(function(func, unsafeWindow, userjs) {
  if (window.opera || unsafeWindow) {
    // OperaUserJS/OperaExtension/Greasemonkey
    if (window.top !== window) return;
    if (window.opera && opera.extension) {
      (function() {
        function open_options() {
          opera.extension.postMessage(JSON.stringify({'command': 'open-options'}));
        }
        opera.extension.onmessage = function(ev){
          var data = JSON.parse(ev.data);
          if (data.command === 'config') {
            func(window, window, {conf: data.data, open_options: open_options});
          }
        };
        opera.extension.postMessage(JSON.stringify({'command': 'config'}));
      })();
    } else {
      func(unsafeWindow || window, window);
    }
  } else if (String(window) === '[object ChromeWindow]') {
    // FirefoxAdd-On
    (function() {
      var pref = Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefBranch);
      function check_key(key) {
        if (!(key && (typeof key === 'string' || key instanceof String) && /^[a-z_]+$/.test(key))) {
          throw 'invalid argument';
        }
        return 'extensions.pixplus.' + key;
      }
      var storage = {
        getBoolPref: function(key) {
          return pref.getBoolPref(check_key(key));
        },
        setBoolPref: function(key, val) {
          return pref.setBoolPref(check_key(key), !!val);
        },
        getCharPref: function(key) {
          return decodeURIComponent(escape(pref.getCharPref(check_key(key))));
        },
        setCharPref: function(key, val) {
          return pref.setCharPref(check_key(key), unescape(encodeURIComponent(String(val))));
        }
      };
      function open_options() {
        window.openDialog('chrome://pixplus/content/options.xul');
      }
      function load(content_window, url) {
        var sandbox = new Components.utils.Sandbox(content_window);
        sandbox.window = content_window.wrappedJSObject;
        sandbox.safeWindow = content_window;
        sandbox.document = sandbox.window.document;
        sandbox.storage = storage;
        sandbox.open_options = open_options;
        sandbox.__proto__ = new XPCNativeWrapper(sandbox.window);
        try {
          var data = '{storage: this.storage, open_options: this.open_options}';
          var src = '(' + func.toString() + ')(this.window, this.safeWindow, ' + data + ')';
          Components.utils.evalInSandbox(src, sandbox);
        } catch(ex) {
          alert(String(ex));
          throw ex;
        }
      }
      window.addEventListener('load', function() {
        var appcontent = window.document.getElementById('appcontent');
        if (appcontent) {
          appcontent.addEventListener('DOMContentLoaded', function(ev) {
            var window = ev.target.defaultView.window;
            if (window.top === window &&
                window.location.hostname === 'www.pixiv.net' &&
                window.location.href.indexOf('pixivreader') < 0) {
              var url = window.location.href;
              load(window, url);
            }
          }, true);
        }
      }, false);
    })();
  } else {
    // Chrome/Safari
    if (window.top !== window || window.location.href.indexOf('pixivreader') >= 0) return;
    (function(func) {
      if (userjs) {
        func();
      } else if (window.chrome) {
        chrome.extension.sendRequest( /* WARN */
          {command: 'config'},
          function(data) {
            if (data.command === 'config') {
              func(JSON.stringify({
                base_uri: chrome.extension.getURL('/'),
                conf:     data.data
              }));
            }
          });
      } else if (window.safari) {
        safari.self.addEventListener('message', function(ev) {
          if (ev.name === 'config') {
            func(JSON.stringify({
              base_uri: safari.extension.baseURI,
              conf:     ev.message
            }));
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
    });
   }
})(function(window, safeWindow, _extension_data) {
  var conf_schema = [
    /* __CONFIG_BEGIN__ */
    {"name": "general", "label": "General", "items": [
      {"key": "debug", "value": false, "desc": "\u30c7\u30d0\u30c3\u30b0\u30e2\u30fc\u30c9"},
      {"key": "scroll", "value": 1, "desc": "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u3044\u305f\u6642\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b",
       "hint": [{"value": 0, "title": "\u30b9\u30af\u30ed\u30fc\u30eb\u3057\u306a\u3044"},
                {"value": 1, "title": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3"},
                {"value": 2, "title": "\u30a4\u30e9\u30b9\u30c8"}]},
      {"key": "bookmark_hide", "value": false, "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u975e\u516c\u958b\u3092\u30c7\u30d5\u30a9\u30eb\u30c8\u306b\u3059\u308b"},
      {"key": "float_tag_list", "value": 2, "desc": "\u30bf\u30b0\u30ea\u30b9\u30c8\u3092\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u3059\u308b",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u6709\u52b9"},
                {"value": 2, "title": "\u30da\u30fc\u30b8\u30e3"}]},
      {"key": "locate_recommend_right", "value": 2, "desc": "\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u7e261\u5217\u306b\u4e26\u3079\u308b",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u6709\u52b9"},
                {"value": 2, "title": "\u30da\u30fc\u30b8\u30e3"}]},
      {"key": "bookmark_form", "value": 1, "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306e\u30ad\u30fc\u64cd\u4f5c",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u30a2\u30ed\u30fc\u30ad\u30fc"},
                {"value": 2, "title": "\u30a2\u30eb\u30d5\u30a1\u30d9\u30c3\u30c8"}]},
      {"key": "mod_bookmark_add_page", "value": false, "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30da\u30fc\u30b8\u306b\u3082\u5909\u66f4\u3092\u52a0\u3048\u308b"},
      {"key": "tag_separator_style", "value": "border-top:2px solid #dae1e7;", "desc": "\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30bb\u30d1\u30ec\u30fc\u30bf\u306e\u30b9\u30bf\u30a4\u30eb"},
      {"key": "stacc_link", "value": "", "desc": "\u4e0a\u90e8\u30e1\u30cb\u30e5\u30fc\u306e\u300c\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u306e\u30ea\u30f3\u30af\u5148",
       "hint": [{"value": "",         "title": "\u5909\u66f4\u3057\u306a\u3044"},
                {"value": "all",      "title": "\u3059\u3079\u3066"},
                {"value": "favorite", "title": "\u304a\u6c17\u306b\u5165\u308a"},
                {"value": "mypixiv",  "title": "\u30de\u30a4\u30d4\u30af"},
                {"value": "self",     "title": "\u3042\u306a\u305f"}]},
      {"key": "rate_confirm", "value": true, "desc": "\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b"},
      {"key": "disable_effect", "value": false, "desc": "\u30a2\u30cb\u30e1\u30fc\u30b7\u30e7\u30f3\u306a\u3069\u306e\u30a8\u30d5\u30a7\u30af\u30c8\u3092\u7121\u52b9\u5316\u3059\u308b"},
      {"key": "workaround", "value": false, "desc": "Opera\u3084pixiv\u306e\u30d0\u30b0\u56de\u907f\u306e\u305f\u3081\u306e\u6a5f\u80fd\u3092\u4f7f\u7528\u3059\u308b(\u4e00\u6642\u7684\u306b\u6a5f\u80fd\u3057\u306a\u3044)"},
      {"key": "fast_user_bookmark", "value": 0, "desc": "\u304a\u6c17\u306b\u5165\u308a\u30e6\u30fc\u30b6\u30fc\u306e\u8ffd\u52a0\u3092\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u884c\u3046",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u6709\u52b9(\u516c\u958b)"},
                {"value": 2, "title": "\u6709\u52b9(\u975e\u516c\u958b)"}]},
      {"key": "popup_ranking_log", "value": true, "desc": "\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u4f7f\u7528\u3059\u308b"}
    ]},
    {"name": "popup", "label": "Popup", "items": [
      {"key": "preload", "value": true, "desc": "\u5148\u8aad\u307f\u3092\u4f7f\u7528\u3059\u308b"},
      {"key": "big_image", "value": false, "desc": "\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b"},
      {"key": "caption_height", "value": 0.4, "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055"},
      {"key": "caption_opacity", "value": 0.9, "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u4e0d\u900f\u660e\u5ea6"},
      {"key": "remove_pixpedia", "value": false, "desc": "\u30bf\u30b0\u306epixpedia\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b"},
      {"key": "rate", "value": true, "desc": "\u8a55\u4fa1\u6a5f\u80fd\u3092\u4f7f\u7528\u3059\u308b"},
      {"key": "rate_key", "value": false, "desc": "\u8a55\u4fa1\u306e\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u6709\u52b9\u306b\u3059\u308b"},
      {"key": "font_size", "value": "", "desc": "\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba(e.g. 10px)"},
      {"key": "auto_manga", "value": 0, "desc": "\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u6709\u52b9"},
                {"value": 2, "title": "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"}]},
      {"key": "auto_manga_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage|ranking|bookmark)\\.php",
       "desc": "auto_manga\u306b2\u3092\u6307\u5b9a\u3057\u305f\u5834\u5408\u306b\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe"},
      {"key": "reverse", "value": 0, "desc": "\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b",
       "hint": [{"value": 0, "title": "\u7121\u52b9"},
                {"value": 1, "title": "\u6709\u52b9"},
                {"value": 2, "title": "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"}]},
      {"key": "reverse_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage)\\.php", "desc": "reverse\u306b2\u3092\u6307\u5b9a\u3057\u305f\u5834\u5408\u306b\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe"},
      {"key": "auto_zoom", "value": 0, "desc": "\u81ea\u52d5\u30ba\u30fc\u30e0\u3059\u308b\u6700\u5927\u30b5\u30a4\u30ba(0:\u7121\u52b9)"},
      {"key": "auto_zoom_size", "value": 800, "desc": "\u81ea\u52d5\u30ba\u30fc\u30e0\u5f8c\u306e\u30b5\u30a4\u30ba\u4e0a\u9650"},
      {"key": "auto_zoom_scale", "value": 4, "desc": "\u81ea\u52d5\u30ba\u30fc\u30e0\u5f8c\u306e\u62e1\u5927\u7387\u4e0a\u9650"},
      {"key": "overlay_control", "value": 0.3, "desc": "\u79fb\u52d5\u7528\u30af\u30ea\u30c3\u30af\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9\u306e\u5e45(0:\u4f7f\u7528\u3057\u306a\u3044/<1:\u753b\u50cf\u306b\u5bfe\u3059\u308b\u5272\u5408/>1:\u30d4\u30af\u30bb\u30eb)"},
      {"key": "scroll_height", "value": 32, "desc": "\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u9ad8\u3055"},
      {"key": "author_status_icon", "value": true, "desc": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3\u3092\u8868\u793a\u3059\u308b(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)"},
      {"key": "show_comment_form", "value": true, "desc": "\u30b3\u30e1\u30f3\u30c8\u306e\u6295\u7a3f\u30d5\u30a9\u30fc\u30e0\u3092\u8868\u793a\u3059\u308b"},
      {"key": "manga_spread", "value": true, "desc": "\u30de\u30f3\u30ac\u306e\u898b\u958b\u304d\u8868\u793a\u3092\u4f7f\u7528\u3059\u308b"}
    ]},
    {"name": "key", "label": "Key", "items": [
      {"key": "popup_prev", "value": "Backspace,a", "desc": "\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "mode": "default"},
      {"key": "popup_prev_direction", "value": "Left", "desc": "\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(conf.popup.reverse\u306e\u5f71\u97ff\u3092\u53d7\u3051\u306a\u3044)"},
      {"key": "popup_next", "value": "Space", "desc": "\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"},
      {"key": "popup_next_direction", "value": "Right", "desc": "\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(conf.popup.reverse\u306e\u5f71\u97ff\u3092\u53d7\u3051\u306a\u3044)"},
      {"key": "popup_first", "value": "Home", "desc": "\u6700\u521d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"},
      {"key": "popup_last", "value": "End", "desc": "\u6700\u5f8c\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"},
      {"key": "popup_close", "value": "Escape", "desc": "\u9589\u3058\u308b"},
      {"key": "popup_caption_scroll_up", "value": "Up", "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b"},
      {"key": "popup_caption_scroll_down", "value": "Down", "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b"},
      {"key": "popup_caption_toggle", "value": "c", "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u5e38\u6642\u8868\u793a/\u81ea\u52d5\u8868\u793a\u3092\u5207\u308a\u66ff\u3048\u308b"},
      {"key": "popup_comment_toggle", "value": "Shift+c", "desc": "\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u3092\u5207\u308a\u66ff\u3048"},
      {"key": "popup_open", "value": "Shift+f", "desc": "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u304f"},
      {"key": "popup_open_big", "value": "f", "desc": "\u30a4\u30e9\u30b9\u30c8\u753b\u50cf\u3092\u958b\u304f"},
      {"key": "popup_open_profile", "value": "e", "desc": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u958b\u304f"},
      {"key": "popup_open_illust", "value": "r", "desc": "\u4f5c\u54c1\u4e00\u89a7\u3092\u958b\u304f"},
      {"key": "popup_open_bookmark", "value": "t", "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3092\u958b\u304f"},
      {"key": "popup_open_staccfeed", "value": "y", "desc": "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3092\u958b\u304f"},
      {"key": "popup_open_response", "value": "Shift+r", "desc": "\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u3092\u958b\u304f"},
      {"key": "popup_reload", "value": "g", "desc": "\u30ea\u30ed\u30fc\u30c9"},
      {"key": "popup_bookmark_start", "value": "b", "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb"},
      {"key": "popup_bookmark_end", "value": "Escape", "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u7d42\u4e86"},
      {"key": "popup_bookmark_submit", "value": "Enter,Space", "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9: \u9001\u4fe1"},
      {"key": "popup_open_bookmark_detail", "value": "Shift+b", "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u8a73\u7d30\u30da\u30fc\u30b8\u3092\u958b\u304f"},
      {"key": "popup_manga_start", "value": "v", "desc": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u958b\u59cb"},
      {"key": "popup_manga_end", "value": "v,Escape", "desc": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u7d42\u4e86"},
      {"key": "popup_open_manga_thumbnail", "value": "Shift+v", "desc": "\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3092\u958b\u304f"},
      {"key": "popup_rate01", "value": "Shift+0,Shift+~", "desc": "\u8a55\u4fa1\u3059\u308b(1\u70b9)"},
      {"key": "popup_rate02", "value": "Shift+9,Shift+)", "desc": "\u8a55\u4fa1\u3059\u308b(2\u70b9)"},
      {"key": "popup_rate03", "value": "Shift+8,Shift+(", "desc": "\u8a55\u4fa1\u3059\u308b(3\u70b9)"},
      {"key": "popup_rate04", "value": "Shift+7,Shift+'", "desc": "\u8a55\u4fa1\u3059\u308b(4\u70b9)"},
      {"key": "popup_rate05", "value": "Shift+6,Shift+&", "desc": "\u8a55\u4fa1\u3059\u308b(5\u70b9)"},
      {"key": "popup_rate06", "value": "Shift+5,Shift+%", "desc": "\u8a55\u4fa1\u3059\u308b(6\u70b9)"},
      {"key": "popup_rate07", "value": "Shift+4,Shift+$", "desc": "\u8a55\u4fa1\u3059\u308b(7\u70b9)"},
      {"key": "popup_rate08", "value": "Shift+3,Shift+#", "desc": "\u8a55\u4fa1\u3059\u308b(8\u70b9)"},
      {"key": "popup_rate09", "value": "Shift+2,Shift+\"", "desc": "\u8a55\u4fa1\u3059\u308b(9\u70b9)"},
      {"key": "popup_rate10", "value": "Shift+1,Shift+!", "desc": "\u8a55\u4fa1\u3059\u308b(10\u70b9)"},
      {"key": "popup_qrate_start", "value": "d", "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u958b\u59cb"},
      {"key": "popup_qrate_end", "value": "Escape,d", "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u7d42\u4e86"},
      {"key": "popup_qrate_select_prev", "value": "Up", "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9: \u524d\u306e\u9078\u629e\u80a2\u3092\u9078\u629e"},
      {"key": "popup_qrate_select_next", "value": "Down", "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9: \u6b21\u306e\u9078\u629e\u80a2\u3092\u9078\u629e"},
      {"key": "popup_qrate_submit", "value": "Enter,Space", "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9: \u9001\u4fe1"},
      {"key": "popup_tag_edit_start", "value": "", "desc": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb"},
      {"key": "popup_tag_edit_end", "value": "Escape", "desc": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u7d42\u4e86"},
      {"key": "popup_zoom_in", "value": "plus,Shift+plus", "desc": "\u753b\u50cf\u3092\u62e1\u5927\u3059\u308b(Opera/Firefox\u306e\u307f)"},
      {"key": "popup_zoom_out", "value": "-,Shift+-", "desc": "\u753b\u50cf\u3092\u7e2e\u5c0f\u3059\u308b(Opera/Firefox\u306e\u307f)"},
      {"key": "popup_help", "value": "?,Shift+?", "desc": "\u30d8\u30eb\u30d7\u3092\u8868\u793a"}
    ]},
    {"name": "bookmark", "label": "Bookmark", "items": [
      {"key": "tag_order", "value": "", "desc": ""},
      {"key": "tag_aliases", "value": "", "desc": ""}
    ]}
    /* __CONFIG_END__ */
  ];
  var conf = {
    bm_tag_order: [ ],
    bm_tag_aliases: { }
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

    rpc_ids:       {rpc_i_id: 1, rpc_u_id: 2, rpc_e_id: 4, rpc_qr: 8, rpc_t_id: 16},
    rpc_usable:    false,
    rpc_state:     0,  // flags; e.g. 5=rpc_e_id|rpc_i_id
    rpc_req_tag:   7,  // i|u|e
    rpc_req_rate:  13, // i|e|qr
    rpc_req_qrate: 13,

    lazy_scroll: lazy_scroll,
    load_css: load_css,
    write_css: function(source) {
      if (!arguments.callee.css) {
        arguments.callee.css = window.document.createElement('style');
        arguments.callee.css.setAttribute('type', 'text/css');
        window.document.body.appendChild(arguments.callee.css);
      }
      arguments.callee.css.textContent += source;
    },
    open: function() {
      window.open.apply(window, Array.prototype.slice.apply(arguments));
    },
    key_enabled: function(ev) {
      return !((check_node(ev.target, 'TextArea') ||
                (check_node(ev.target, 'Input') &&
                 // http://www.w3.org/TR/html5/the-input-element.html#attr-input-type
                 (!ev.target.type || /^(?:text|search|tel|url|email|password|number)$/i.test(ev.target.type)))) ||
               !!window.document.getElementById('HaH-div-element'));
    },

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
      },
      limit_thumb: [
        'http://source.pixiv.net/source/images/limit_unknown_s.png',
        'http://source.pixiv.net/source/images/limit_mypixiv_s.png'
      ]
    }
  };

  if (window.pixplus || (window.opera && window.opera.pixplus)) { // for compatibility
    //window.opera.postError('pixplus is already loaded');
    return;
  }
  window.pixplus = pp;
  if (window.opera) window.opera.pixplus = pp; // for compatibility
  function rpc_chk(f) {
    return (pp.rpc_state & f) === f;
  }
  function rpc_create_data(ids, data) {
    if (!data) data = {};
    each(ids, function(id) {
      data[id] = $('rpc_' + id).getAttribute('title');
    });
    return data;
  }

  var LS = {
    /* __STORAGE_COMMON_ENTRIES_BEGIN__ */
    u: false, // usable or not
    map: { },
    conv: {
      'string':  [String, String],
      'boolean': [function(s) { return s === 'true'; },
                  function(v) { return v ? 'true' : 'false'; }],
      'number':  [function(s) {
        var v = parseFloat(s);
        return isNaN(v) ? null : v;
      }, String]
    },
    init_map: function() {
      each(conf_schema, function(sec) {
        var map = { };
        each(sec.items, function(item) {
          map[item.key] = item;
        });
        LS.map[sec.name] = {schema: sec, map: map};
      });
    },
    get_conv: function(s, n) {
      return LS.conv[typeof LS.map[s].map[n].value];
    },
    each: function(cb_item, cb_sec, cb_sec_after) {
      for(var i = 0; i < conf_schema.length; ++i) {
        var sec = conf_schema[i];
        if (cb_sec && cb_sec(sec)) return;
        for(var j = 0; j < sec.items.length; ++j) {
          cb_item(sec.items[j], sec);
        }
        if (cb_sec_after) cb_sec_after(sec);
      }
    },
    parse_bm_tag_order: function(str) {
      var ary = [], ary_ary = [], lines = str.split(/[\r\n]+/);
      for(var i = 0; i < lines.length; ++i) {
        var tag = lines[i];
        if (tag === '-') {
          if (ary_ary.length) ary.push(ary_ary);
          ary_ary = [];
        } else if (tag === '*') {
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
      var lines = str.split(/[\r\n]+/);
      for(var i = 0; i < Math.floor(lines.length / 2); ++i) {
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
    init: function() {
      each(conf_schema, function(sec) {
        if (sec.name === 'bookmark') return;
        var obj = sec.name === 'general' ? conf : conf[sec.name] = { }; // for compatibility
        LS.map[sec.name].conf = obj;
        each(sec.items, function(item) {
          obj[item.key] = item.value;
          if (LS.u) {
            var v = LS.get(sec.name, item.key);
            if (typeof v !== 'undefined' && v !== null) obj[item.key] = v;
          }
        });
      });
      if (LS.u) {
        var order = LS.get('bookmark', 'tag_order');
        if (order) conf.bm_tag_order = LS.parse_bm_tag_order(order);
        var aliases = LS.get('bookmark', 'tag_aliases');
        if (aliases) conf.bm_tag_aliases = LS.parse_bm_tag_aliases(aliases);
      }
      each(['auto_manga', 'reverse'], function(key) {
        try {
          if (!conf.popup[key + '_regexp']) throw 1;
          var v = conf.popup[key] & 0xf, r = new RegExp(conf.popup[key + '_regexp']);
          conf.popup[key + '_p'] = v === 2 ? r.test(window.location.href) : v === 1;
        } catch(ex) {
          conf.popup[key + '_p'] = false;
        }
      });
    }
  };
  LS.init_map();

  pp.save_conf = function() {
    if (!LS.u) return;
    LS.each(function(sec, key) {
      if (!sec.conf) return;
      var val = sec.conf[key];
      if (val !== LS.get(sec.name, key)) LS.set(sec.name, key, val);
    });
    LS.set('bookmark', 'tag_order', LS.bm_tag_order_to_str(conf.bm_tag_order));
    LS.set('bookmark', 'tag_aliases', LS.bm_tag_aliases_to_str(conf.bm_tag_aliases));
  };

  (function() {
    if (_extension_data) {
      if (_extension_data.storage) {
        // firefox
        LS.u = true;
        LS.get = function(s, n) {
          var key = LS.map[s].path.join('_') + '_' + n, val;
          var def = LS.map[s].schema[n][0];
          if (typeof def === 'boolean') {
            val = _extension_data.storage.getBoolPref(key);
          } else {
            val = LS.get_conv(s, n)[0](_extension_data.storage.getCharPref(key));
          }
          return (typeof val === 'undefined' || val === null || val.constructor !== def.constructor
                  ? (LS.map[s] ? LS.map[s].schema[n][0] : '')
                  : val);
        };
        LS.set = function(s, n, v) {
          var key = LS.map[s].path.join('_') + '_' + n;
          if (typeof LS.map[s].schema[n][0] === 'boolean') {
            _extension_data.storage.setBoolPref(key, v);
          } else {
            _extension_data.storage.setCharPref(key, v);
          }
        };
        LS.remove = function(s, n) {
          LS.set(s, n, LS.map[s].schema[n][0]);
        };
      } else {
        // opera/chrome/safari
        LS.u = true;
        LS.get = function(s, n) {
          return _extension_data.conf[s + '_' + n];
        };
        LS.set = function(s, n, v) {
          var data = { section: s, key: n, value: v };
          if (window.opera) {
            opera.extension.postMessage(JSON.stringify({'command': 'config-set', 'data': data}));
          } else {
            /*
            var ev = window.document.createEvent('Event');
            ev.initEvent('pixplusConfigSet', true, true);
            ev.data = data;
            window.document.dispatchEvent(ev);
             */
          }
        };
        LS.remove = function(s, n) {
          var data = { section: s, key: n };
          if (window.opera) {
            opera.extension.postMessage(JSON.stringify({'command': 'config-remove', 'data': data}));
          } else {
          }
        };
      }
    } else {
      // opera userjs/greasemonkey
      LS.u = !!window.localStorage;
      LS.get = function(s, n) {
        var value = window.localStorage.getItem(create_name(s, n));
        return (typeof value === 'undefined' || value === null
                ? LS.map[s].map[n].value
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

  function wrap_global(name, func, cb_init) {
    if (!name || !func) return;
    if (window[name]) {
      window[name] = wrap_global.wrap(func, window[name]);
      if (cb_init) cb_init();
    } else {
      if (!wrap_global.items) wrap_global.items = [];
      wrap_global.items.push({name: name, func: func, cb_init: cb_init});
      if (!wrap_global.timer) {
        wrap_global.check_count = 0;
        wrap_global.timer = window.setTimeout(wrap_global.check, 300);
      }
      return;
    }
  }
  wrap_global.wrap = function(func, real) {
    return function() {
      func.apply(window, [real, this].concat(Array.prototype.slice.apply(arguments)));
    };
  };
  wrap_global.check = function() {
    if (!wrap_global.items) return;
    for(var i = 0; i < wrap_global.items.length; ++i) {
      var item = wrap_global.items[i];
      if (window[item.name]) {
        window[item.name] = wrap_global.wrap(item.func, window[item.name]);
        if (item.cb_init) item.cb_init();
        wrap_global.items.splice(i, 1);
        --i;
      }
    }
    if (++wrap_global.check_count < 30 && wrap_global.items.length) {
      wrap_global.timer = window.setTimeout(wrap_global.check, 300);
    } else {
      wrap_global.timer = null;
    }
  };
  var defineMagicFunction = wrap_global;

  /* __CONFIG_UI_BEGIN__ */
  function ConfigUI(root, options_page, msg_filter) {
    this.root = root;
    this.options_page = options_page;
    this.msg_filter = msg_filter || function(s) { return s; };

    this.pager = $c('div', this.root, {id: 'pp-conf-pager'});
    this.page_list = $c('ul', this.pager, {id: 'pp-conf-pagelist'});
    this.pager_content = $c('div', this.pager, {id: 'pp-conf-pager-content'});
    this.pages = [];

    this.input_table = (function(self) {
      var input_table = { };
      var idx, page;
      LS.each(function(item, sec) {
        var value = options_page ? LS.get(sec.name, item.key) : LS.map[sec.name].conf[item.key];
        var type = typeof item.value;
        var row = page.table.insertRow(-1), cell = row.insertCell(-1), input;
        row.className = 'pp-conf-entry pp-conf-entry-' + (idx & 1 ? 'odd' : 'even');
        if (item.hint) {
          input = $c('select');
          each(item.hint, function(hint) {
            $c('option', input, {value: hint.value, text: self.msg_filter(hint.title)});
          });
        } else {
          input = $c('input');
        }
        input.id = 'pp-conf-' + sec.name + '-' + item.key;
        if (type === 'boolean') {
          cell.setAttribute('colspan', '2');
          input.setAttribute('type', 'checkbox');
          input.checked = value;
          var label = $c('label', cell);
          label.appendChild(input);
          label.appendChild(window.document.createTextNode(item.key));
        } else {
          cell.textContent = item.key;
          input.value = value;
          cell = row.insertCell(-1);
          cell.className = 'pp-conf-cell-value';
          cell.appendChild(input);
        }
        input_table[sec.name + '_' + item.key] = input;

        var def = $c('button', row.insertCell(-1), {text: 'Default'});
        $ev(def).click(function() {
          if (type === 'boolean') {
            input.checked = item.value;
          } else {
            input.value = item.value;
          }
          if (LS.u) LS.remove(sec.name, item.key);
          self.update_export();
          return true;
        });
        row.insertCell(-1).textContent = self.msg_filter(item.desc);

        $ev(input).change(function(ev) {
          var value;
          if (type === 'boolean') {
            value = input.checked;
          } else {
            value = LS.conv[type][0](input.value);
          }
          if (LS.u) LS.set(sec.name, item.key, value);
          if (!options_page) LS.map[sec.name].conf[item.key] = value;
          self.update_export();
        });

        ++idx;
      }, function(sec) {
        if (sec.name === 'bookmark') return true;
        page = self.make_page(sec.label, sec.name);
        page.table = $c('table', page.content);
        return false;
      });
      return input_table;
    })(this);

    for(var i = 0; i < ConfigUI.pages.length; ++i) {
      var page = this.make_page(ConfigUI.pages[i].label, ConfigUI.pages[i].id);
      ConfigUI.pages[i].content.call(this, page, {options_page: options_page});
    }

    this.show_page(this.pages[0]);
    this.update_export();
  }

  // for Opera10.1x
  ConfigUI.stringify = function(val) {
    if (window.JSON && window.JSON.stringify) {
      return JSON.stringify(val);
    } else {
      var str = '';
      if (typeof val === 'string' || val instanceof String) {
        return '"' + val.replace(/[\\\"]/g, '\\$0')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r') + '"';
      } else if (val instanceof Array) {
        for(var i = 0; i < val.length; ++i) {
          if (i) str += ',';
          str += ConfigUI.stringify(val[i]);
        }
        return '[' + str + ']';
      } else if (typeof val === 'number') {
        return String(val);
      } else if (typeof val === 'object') {
        var first = true;
        for(var key in val) {
          if (!val.hasOwnProperty(key)) continue;
          if (first) {
            first = false;
          } else {
            str += ',';
          }
          str += ConfigUI.stringify(key) + ':' + ConfigUI.stringify(val[key]);
        }
        return '{' + str + '}';
      } else {
        throw 1;
      }
    }
  };

  ConfigUI.prototype = {
    create_description: function(msg) {
      return $c('div', null, {html: this.msg_filter(msg)});
    },
    make_page: function(text, id) {
      var page = find(this.pages, function(page) {
        return page.id === id;
      });
      if (page) return page;

      page = {
        id:      id,
        tab:     $c('li', this.page_list),
        content: $c('div', this.pager_content, {id: 'pp-conf-' + id, cls: 'pp-conf-page'})
      };
      page.label = $c('a', page.tab, {href: '#pp-conf-' + id, text: text});

      $ev(page.label, {ctx: this}).click(function() {
        if (this.selected_page === page) return true;
        /*
        this.selected_page.content.style.position = 'absolute';
        page.content.style.position = 'absolute';
        $ef(this.selected_page.content).fade_out(function() {
          this.className = 'pp-conf-page';
        });
        $ef(page.content).fade_in(function() {
          page.content.style.position = '';
        });
         */
        this.show_page(page);
        return true;
      });

      this.pages.push(page);
      return page;
    },
    show_page: function(page, animate) {
      if (this.selected_page) {
        this.selected_page.tab.className = '';
        if (!animate) this.selected_page.content.className = 'pp-conf-page';
      }
      page.tab.className = 'select';
      page.content.className = 'pp-conf-page select';
      this.selected_page = page;
    },

    get_tag_alias_str: function() {
      var tag_aliases = '';
      for(var i = 0; i < this.tag_alias_table.rows.length; ++i) {
        var row = this.tag_alias_table.rows[i];
        var inputs = row.getElementsByTagName('input');
        var key = inputs[0].value;
        var val = inputs[1].value;
        if (key && val) tag_aliases += key + '\n' + val + '\n';
      }
      return tag_aliases;
    },

    update_export: function() {
    },
    export_export: function() {
      var obj = { }, self = this;
      LS.each(function(item, sec) {
        var input = self.input_table[sec.name + '_' + item.key], val;
        if (!input) return;
        val = (typeof item.value === 'boolean'
               ? input.checked
               : LS.get_conv(sec.name, item.key)[0](input.value));
        //if (val !== item.value) obj[sec.name + '_' + item.key] = val;
        obj[sec.name + '_' + item.key] = val;
      });
      obj['bookmark_tag_order'] = this.tag_order_textarea.value.replace(/\r/g, '');
      obj['bookmark_tag_aliases'] = this.get_tag_alias_str();
      this.export_input.value = ConfigUI.stringify(obj);
    },
    export_import: function() {
      var obj = window.JSON.parse(this.export_input.value);
      LS.each(function(item, sec) {
        if (sec.name === 'bookmark') return;
        var val = obj[sec.name + '_' + item.key];
        if (typeof val !== 'undefined' && val !== null) {
          LS.set(sec.name, item.key, val);
        }
      });
      if (obj['bookmark_tag_order']) LS.set('bookmark', 'tag_order', obj['bookmark_tag_order']);
      if (obj['bookmark_tag_aliases']) LS.set('bookmark', 'tag_aliases', obj['bookmark_tag_aliases']);
      window.location.reload();
    },

    generate_js: function(new_line, indent_level) {
      var js = [];
      var order = LS.parse_bm_tag_order(this.tag_order_textarea.value);
      var alias = LS.parse_bm_tag_aliases(this.get_tag_alias_str());
      var indent = 0, self = this;
      if (!indent_level) indent_level = 0;

      function push(str) {
        var sp = '';
        for(var i = 0; i < indent_level * indent; ++i) sp += ' ';
        js.push(sp + str);
      }

      LS.each(function(item, sec) {
        if (sec.name === 'bookmark') return;
        var input = self.input_table[sec.name + '_' + item.key], val;
        if (typeof item.value === 'boolean') {
          val = input.checked;
        } else {
          val = LS.get_conv(sec.name, item.key)[0](input.value);
        }
        if (val !== item.value) {
          var path = (sec.name === 'general' ? '' : sec.name + '.') + item.key; // for compatibility
          push('window.pixplus.conf.' + path + '=' + ConfigUI.stringify(val) + ';');
        }
      });
      if (order.length) {
        push('window.pixplus.conf.bm_tag_order=[');
        ++indent;
        for(var i = 0; i < order.length; ++i) {
          var ary = order[i];
          push('[');
          ++indent;
          for(var j = 0; j < ary.length; ++j) {
            var tag = ary[j];
            push((tag ? ConfigUI.stringify(tag) : 'null') + ',');
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
          push('window.pixplus.conf.bm_tag_aliases={');
          alias_f = false;
          ++indent;
        }
        push(ConfigUI.stringify(key) + ':[');
        ++indent;
        for(var j = 0; j < alias[key].length; ++j) {
          var tag = alias[key][j];
          push(ConfigUI.stringify(tag) + ',');
        }
        --indent;
        push('],');
      }
      if (!alias_f) {
        js.push('};');
        --indent;
      }
      return js.join(new_line || '');
    }
  };

  ConfigUI.pages = [{
    id: 'key',
    content: function(page) {
      var editor_row, editor_root;
      function close_editor(row, input) {
        if (editor_row) (function(row, root) {
          $ef(root).hide(function() { /* WARN */
            row.parentNode.removeChild(row);
          });
        })(editor_row, editor_root);
        editor_row = null;
        editor_root = null;
      }
      function open_editor(row, input) {
        close_editor();
        editor_row = $c('tr');
        editor_root = $c('div', $c('td', editor_row, {cls: 'pp-conf-key-editor', 'a:colspan': '4'}));
        var list = $c('ul', editor_root);
        function reset() {
          list.innerHTML = '';
          each(input.value.split(','), add);
        }
        function add(key) {
          var li = $c('li', list);
          $ev($c('button', li, {text: '\u00d7'})).click(function() {
            list.removeChild(li);
            apply();
          });
          $c('label', li, {text: key});
        }
        function apply() {
          var keys = [];
          each($xa('li/label', list), function(key) {
            keys.push(key.textContent);
          });
          input.value = keys.join(',');
          var ev = window.document.createEvent('Event');
          ev.initEvent('input', true, true);
          input.dispatchEvent(ev);
        }
        reset();
        var add_line = $c('div', editor_root, {cls: 'pp-conf-key-editor-add-line'});
        var add_input = $c('input', add_line, {'a:placeholder': 'Grab key'});
        $ev(add_input).key(function(ev, conn, key) {
          this.value = key;
          // workaround for firefox4
          if (browser.gecko && key == $ev.KEY_ESCAPE) {
            window.setTimeout(function() {
              add_input.value = key;
            }, 0);
          }
          return true;
        });
        $ev($c('button', add_line, {'text': 'Add'})).click(function() {
          add(add_input.value);
          add_input.value = '';
          apply();
        });
        $ev($c('button', add_line, {'text': 'Close'})).click(close_editor);
        row.parentNode.insertBefore(editor_row, row.nextSibling);
        $ef(editor_root).show(); /* WARN */
      }
      each(page.table.rows, function(row) {
        var input = $t('input', row)[0];
        $ev(input).focus(function() {
          open_editor(row, input);
        });
      });
    }
  }, {
    label: 'Tags', id: 'tags',
    content: function(page) {
      var self = this;
      page.content.appendChild(this.create_description("\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002<br>-: \u30bb\u30d1\u30ec\u30fc\u30bf<br>*: \u6b8b\u308a\u5168\u90e8"));
      this.tag_order_textarea = $c('textarea', page.content);
      this.tag_order_textarea.value = (this.options_page
                                       ? LS.get('bookmark', 'tag_order')
                                       : LS.bm_tag_order_to_str(conf.bm_tag_order));
      $ev(this.tag_order_textarea).change(function() {
        if (LS.u) LS.set('bookmark', 'tag_order', self.tag_order_textarea.value);
        self.update_export();
      });

      page.content.appendChild(this.create_description("\u30bf\u30b0\u306e\u30a8\u30a4\u30ea\u30a2\u30b9\u3002\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3059\u308b\u3002\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3002"));
      this.tag_alias_table = $c('table', page.content, {id: 'pp-conf-bookmark-tag_aliases'});

      $ev($c('button', page.content, {text: 'Add'})).click(function() { add_row(); });

      function save() {
        if (LS.u) LS.set('bookmark', 'tag_aliases', self.get_tag_alias_str());
        self.update_export();
      }

      function add_row(tag, list) {
        var row = self.tag_alias_table.insertRow(-1), cell;
        cell = row.insertCell(-1);
        cell.className = 'pp-conf-cell-remove';
        $ev($c('button', cell, {text: '\u00d7'})).click(function() {
          row.parentNode.removeChild(row);
          save();
        });

        cell = row.insertCell(-1);
        cell.className = 'pp-conf-cell-tag';
        $ev($c('input', cell, {value: tag || ''})).change(save);

        cell = row.insertCell(-1);
        cell.className = 'pp-conf-cell-aliases';
        $ev($c('input', cell, {value: list ? list.join(' ') : ''})).change(save);
      }

      var aliases = (this.options_page
                     ? LS.parse_bm_tag_aliases(LS.get('bookmark', 'tag_aliases'))
                     : conf.bm_tag_aliases);
      for(var key in aliases) add_row(key, aliases[key]);
    }
  }, {
    label: 'Export', id: 'export',
    content: function(page) {
      this.export_form = $c('form', page.content);
      this.export_input = $c('input', this.export_form);
      $ev(this.export_input).listen(['mousedown', 'mouseup'], function() {
        this.select(); /* WARN */
      });

      $ev($c('input', this.export_form, {type: 'button', value: 'Export'}), {ctx: this}).click(function() {
        this.export_export();
      });

      if (window.JSON && LS.u) {
        $c('input', this.export_form, {type: 'submit', value: 'Import'});
        $ev(this.export_form, {ctx: this}).listen('submit', function() {
          try {
            this.export_import();
          } catch(ex) {
            alert(ex);
          }
          return true;
        });
      }

      if (window.opera) {
        $ev($c('input', this.export_form, {type: 'button', value: 'UserJS'}), {ctx: this}).click(function() {
          var js = [
            '// ==UserScript==',
            '// @name    pixplus settings',
            '// @version ' + (new Date()).toLocaleString(),
            '// @include http://www.pixiv.net/*',
            '// ==/UserScript==',
            '(function() {',
            '  window.document.addEventListener("pixplusInitialize",init,false);',
            '  function init() {',
            '    ' + this.generate_js('\n    ', 2),
            '  }',
            '})();'
          ].join('\n');
          (this.options_page ? window : pp).open('data:text/javascript;charset=utf-8,' + encodeURI(js));
        });
      }
    }
  }, {
    label: 'Help', id: 'help',
    content: function(page) {
      page.content.appendChild(ConfigUI.create_help_table(this.msg_filter));
    }
  }, {
    label: 'About', id: 'about',
    content: function(page, args) {
      var urls = [
        'http://crckyl.pa.land.to/pixplus/',
        'http://my.opera.com/crckyl/',
        'http://crckyl.ath.cx:8088/pixplus/'
      ];
      var prefix = args.options_page ? '' : '/jump.php?';
      var release = ConfigUI.changelog_data[0];
      var html = '<dl>' +
        '<dt>Name</dt><dd>pixplus</dd>' +
        '<dt>Version</dt><dd>' + release.version + ' - ' + release.date + '</dd>' +
        '<dt>Web</dt><dd><ul>';
      for(var i = 0; i < urls.length; ++i) {
        html += '<li><a href="' + urls[i] + '" onclick="this.href=&quot;' + prefix + urls[i] + '&quot;">' + urls[i] + '</a></li>';
      }
      html += '</ul></dd>' +
        '<dt>Contact</dt><dd><ul>' +
        '<li><a href="http://twitter.com/crckyl">@crckyl</a></li>' +
        '<li><a href="mailto:crckyl@gmail.com">crckyl@gmail.com</a></li>' +
        '</ul></dd>' +
        '<dt>License</dt><dd>Apache License 2.0</dd>' +
        '</dl>';
      page.content.innerHTML = html;
    }
  }, {
    label: 'ChangeLog', id: 'changelog',
    content: function(page) {
      var dl = $c('dl', page.content);
      each(ConfigUI.changelog_data, function(release) {
        $c('dt', dl, {text: release.version + ' - ' + release.date});
        var ul = $c('ul', $c('dd', dl));
        each(release.changes, function(change) {
          $c('li', ul, {text: change});
        });
      });
    }
  }, {
    label: 'Debug', id: 'debug',
    content: function(page) {
      var debug_input = this.input_table['general_debug'];
      function show() {
        page.tab.style.display = '';
        page.content.style.display = '';
      }
      function hide() {
        page.tab.style.display = 'none';
        page.content.style.display = 'none';
        if (this.selected_page === page) this.show_page(this.pages[0]);
      }
      function update() {
        if (debug_input.checked) {
          show();
        } else {
          hide();
        }
      }
      update();
      $ev(debug_input).change(update);

      var input_line = $c('div', page.content);
      var input      = $c('input', input_line);
      var cancel_l   = $c('label', input_line);
      var cancel     = $c('input', cancel_l, {type: 'checkbox', css: 'margin-left:4px;', checked: true});
      var console_l  = $c('label', input_line);
      var console    = $c('input', console_l, {type: 'checkbox', css: 'margin-left:4px;', checked: true});
      var logger     = $c('table', page.content, {border: 1, css: 'margin-top:4px;'});
      cancel_l.appendChild(window.document.createTextNode('Cancel'));
      console_l.appendChild(window.document.createTextNode('Console'));
      function clear() {
        logger.innerHTML = '';
        var row = logger.insertRow(0);
        row.insertCell(-1).textContent = 'Key';
        row.insertCell(-1).textContent = 'type';
        row.insertCell(-1).textContent = 'keyCode';
        row.insertCell(-1).textContent = 'charCode';
        row.insertCell(-1).textContent = 'keyIdentifier';
        row.insertCell(-1).textContent = 'which';
        row.insertCell(-1).textContent = 'eventPhase';
        row.insertCell(-1).textContent = 'detail';
      }
      clear();
      $ev($c('button', input_line, {text: 'Clear', css: 'margin-left:4px;'})).click(clear);
      $ev(input).key(function(ev, conn, key) {
        var row = logger.insertRow(1);
        row.insertCell(-1).textContent = key;
        row.insertCell(-1).textContent = ev.type;
        row.insertCell(-1).textContent = ev.keyCode;
        row.insertCell(-1).textContent = ev.charCode;
        row.insertCell(-1).textContent = ev.keyIdentifier;
        row.insertCell(-1).textContent = ev.which;
        row.insertCell(-1).textContent = ev.eventPhase;
        row.insertCell(-1).textContent = ev.detail;
        if (console.checked) window.console.log(ev);
        return cancel.checked;
      });
    }
  }];

  ConfigUI.changelog_data = [{
    date: '2011/04/xx', version: '0.6', changes: [
      '\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306e\u30ab\u30b9\u30bf\u30de\u30a4\u30ba\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u51e6\u7406\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30e9\u30a4\u30bb\u30f3\u30b9\u3092Apache License 2.0\u306b\u5909\u66f4\u3002',
      'Webkit\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306e\u8868\u793a\u304c\u5909\u3060\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0(\u5fa9\u6d3b)\u3002',
      'Chrome\u3067\u30bb\u30f3\u30bf\u30fc\u30af\u30ea\u30c3\u30af\u306b\u3082\u53cd\u5fdc\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'Webkit\u3067\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002'
    ]
  }, {
    date: '2011/03/26', version: '0.5.1', changes: [
      '\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u304c\u975e\u8868\u793a\u306e\u6642\u3082conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.extagedit\u3092\u5ec3\u6b62\u3057\u3066conf.bookmark_form\u306b\u5909\u66f4\u3002',
      'pixiv\u306e\u8a00\u8a9e\u8a2d\u5b9a\u304c\u65e5\u672c\u8a9e\u4ee5\u5916\u306e\u6642\u306b\u30de\u30f3\u30ac\u304c\u95b2\u89a7\u3067\u304d\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30de\u30f3\u30ac\u306e\u898b\u958b\u304d\u8868\u793a\u3092\u4fee\u6b63\u3002',
      'Firefox4\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u753b\u9762\u3067\u30bf\u30b0\u3092\u9078\u629e\u3067\u304d\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u6e08\u307f\u306e\u30a4\u30e9\u30b9\u30c8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/02/15', version: '0.5.0', changes: [
      'conf.extension\u3092\u5ec3\u6b62\u3002Opera\u62e1\u5f35\u7248\u306e\u30c4\u30fc\u30eb\u30d0\u30fc\u30a2\u30a4\u30b3\u30f3\u3092\u524a\u9664\u3002',
      'Firefox\u3067\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'Firefox\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30d5\u30a9\u30fc\u30e0\u3067\u30a2\u30ed\u30fc\u30ad\u30fc\u3067\u30bf\u30b0\u9078\u629e\u3092\u884c\u3046\u6642\u306b\u5165\u529b\u5c65\u6b74\u304c\u8868\u793a\u3055\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30bf\u30b0\u7de8\u96c6\u306eUI\u3092\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u3068\u540c\u3058\u306b\u5909\u66f4\u3002',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u307e\u307e\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u3059\u308b\u3068\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\u3082\u53ef\u80fd\u306a\u3089\u539f\u5bf8\u306e\u753b\u50cf\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002',
      '\u30e1\u30f3\u30d0\u30fc\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u306a\u3069\u3092\u958b\u3044\u305f\u6642\u306b\u8a55\u4fa1\u306a\u3069\u304c\u51fa\u6765\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u8a2d\u5b9a\u753b\u9762\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002',
      'Opera10.1x\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u3044\u305f\u6642\u306b\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u5c0f\u8aac\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3067\u304d\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.expand_novel\u3092\u524a\u9664\u3002',
      '\u4ed6\u30e6\u30fc\u30b6\u30fc\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u305f\u306e\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/02/04', version: '0.4.0', changes: [
      'pixivreader\u3068\u885d\u7a81\u3059\u308b\u3089\u3057\u3044\u306e\u3067\u3001exclude\u306b\u8ffd\u52a0\u3002',
      '\u8a2d\u5b9a\u307e\u308f\u308a\u3092\u4f5c\u308a\u76f4\u3057\u3002Chrome/Safari\u62e1\u5f35\u7248\u306b\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u8ffd\u52a0\u3002\u8a2d\u5b9a\u304c\u5f15\u304d\u7d99\u304c\u308c\u306a\u3044\u3002',
      'OperaExtension\u7248\u3067\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002',
      '\u95b2\u89a7\u3067\u304d\u306a\u3044\u30de\u30f3\u30ac\u304c\u3042\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30ba\u30fc\u30e0\u6a5f\u80fd\u3067Firefox\u3092\u30b5\u30dd\u30fc\u30c8\u3002',
      '\u4f01\u753b\u76ee\u9332\u95a2\u9023\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      '\u30de\u30f3\u30ac\u30da\u30fc\u30b8\u306e\u5909\u66f4(\u898b\u958b\u304d\u8868\u793a\u306a\u3069)\u306b\u5bfe\u5fdc\u3002\u305d\u308c\u306b\u4f34\u3063\u3066conf.default_manga_type\u3068conf.popup_manga_tb\u3092\u524a\u9664\u3002',
      '\u4f5c\u54c1\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      'Chrome/Safari\u3067AutoPatchWork\u306b\u5bfe\u5fdc\u3002'
    ]
  }, {
    date: '2011/01/15', version: '0.3.2', changes: [
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/01/14', version: '0.3.1', changes: [
      'Opera\u4ee5\u5916\u306e\u30d6\u30e9\u30a6\u30b6\u306b\u304a\u3044\u3066\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3084\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u306a\u3069\u306e\u6a5f\u80fd\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.popup.rate_key=true\u306e\u6642\u3001Shift\u30ad\u30fc\u306a\u3057\u3067\u8a55\u4fa1\u3067\u304d\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'ChromeExtension/SafariExtension\u7248\u3067\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002',
      'OperaExtension\u7248\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u3067\u6570\u5024\u304cNaN\u306b\u306a\u308b\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2010/12/26', version: '0.3.0', changes: [
      'conf.fast_user_bookmark\u8ffd\u52a0\u3002',
      '\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)\u3092\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.popup.author_status_icon)\u8ffd\u52a0\u3002',
      '\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u306e\u8868\u793a\u3092\u5909\u66f4\u3002',
      '\u95b2\u89a7\u30fb\u8a55\u4fa1\u30fb\u30b3\u30e1\u30f3\u30c8\u5c65\u6b74\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      '\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u5909\u66f4\u3002Shift+c:\u30b3\u30e1\u30f3\u30c8\u8868\u793a/d:\u30a2\u30f3\u30b1\u30fc\u30c8/a:\u623b\u308b',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30a4\u30d9\u30f3\u30c8API\u3092Popup.on*\u306e\u307f\u306b\u5909\u66f4\u3002',
      'conf.expand_novel\u8ffd\u52a0\u3002',
      '\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u306b\u5bfe\u5fdc\u3002conf.popup_ranking_log\u8ffd\u52a0\u3002',
      '\u30a4\u30d9\u30f3\u30c8\u8a73\u7d30/\u53c2\u52a0\u8005\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      'Extension\u7248\u306b\u30c4\u30fc\u30eb\u30d0\u30fc\u30dc\u30bf\u30f3\u3068\u8a2d\u5b9a\u753b\u9762\u3092\u8ffd\u52a0\u3002conf.extension.*\u8ffd\u52a0\u3002',
      '\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3092\u8a2d\u5b9a\u3057\u3066\u3044\u306a\u3044\u6642\u3001\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2010/12/01', version: '0.2.0', changes: [
      'Extension\u7248\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u3089\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u8ffd\u52a0\u3002',
      'Extension\u7248\u306e\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002',
      '\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002conf.popup.scroll_height\u8ffd\u52a0\u3002',
      '\u753b\u50cf\u3092\u62e1\u5927/\u7e2e\u5c0f\u3059\u308b\u30ad\u30fc\u3092o/i\u304b\u3089+/-\u306b\u5909\u66f4\u3002',
      'd\u30ad\u30fc(\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u623b\u308b)\u3092\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306b\u8ffd\u52a0\u3002'
    ]
  }, {
    date: '2010/11/14', version: '0.1.2', changes: [
      '\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u3092\u8868\u793a\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u305f\u5f8c\u3001\u9078\u629e\u80a2\u304c\u8868\u793a\u3055\u308c\u305f\u307e\u307e\u306b\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u4e0a\u3067\u8a55\u4fa1\u3084\u30bf\u30b0\u7de8\u96c6\u304c\u51fa\u6765\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30de\u30a6\u30b9\u64cd\u4f5c\u7528UI\u306e\u8868\u793a\u3092\u5909\u66f4\u3002',
      'conf.popup.overlay_control\u8ffd\u52a0\u3002',
      '\u30de\u30f3\u30ac\u30da\u30fc\u30b8(mode=manga)\u3067\u6539\u30da\u30fc\u30b8\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u8a55\u4fa1\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2010/11/02', version: '0.1.1', changes: [
      '\u30a4\u30d9\u30f3\u30c8\u30da\u30fc\u30b8(e.g. http://www.pixiv.net/event_halloween2010.php)\u7528\u306e\u6c4e\u7528\u30b3\u30fc\u30c9\u8ffd\u52a0\u3002',
      'conf.locate_recommend_right\u304c2\u306e\u6642\u3001\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'pixiv\u306e\u5909\u66f4(\u8a55\u4fa1\u3001\u30e9\u30f3\u30ad\u30f3\u30b0\u3001etc)\u306b\u5bfe\u5fdc\u3002'
    ]
  }, {
    date: '2010/10/27', version: '0.1.0', changes: [
      'Opera11\u306eExtension\u306b\u5bfe\u5fdc\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u4e26\u3079\u308b\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002',
      'AutoPatchWork\u306b\u5bfe\u5fdc\u3002'
    ]
  }];

  ConfigUI.help_data = [{
    "mode": "\u901a\u5e38",
    "keys": [{
      "key":  "a/BackSapace/Left",
      "desc": "\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"
    }, {
      "key":  "Space/Right",
      "desc": "\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"
    }, {
      "key":  "Up/Down",
      "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b"
    }, {
      "key":  "Home/End",
      "desc": "\u6700\u521d/\u6700\u5f8c\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5"
    }, {
      "key":  "Escape",
      "desc": "\u9589\u3058\u308b"
    }, {
      "key":  "e",
      "desc": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u958b\u304f"
    }, {
      "key":  "r",
      "desc": "\u4f5c\u54c1\u4e00\u89a7\u3092\u958b\u304f"
    }, {
      "key":  "Shift+r",
      "desc": "\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u3092\u958b\u304f"
    }, {
      "key":  "t",
      "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3092\u958b\u304f"
    }, {
      "key":  "y",
      "desc": "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3092\u958b\u304f"
    }, {
      "key":  "b",
      "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb"
    }, {
      "key":  "Shift+b",
      "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u8a73\u7d30\u30da\u30fc\u30b8\u3092\u958b\u304f"
    }, {
      "key":  "f",
      "desc": "\u30a4\u30e9\u30b9\u30c8\u753b\u50cf\u3092\u958b\u304f"
    }, {
      "key":  "g",
      "desc": "\u30ea\u30ed\u30fc\u30c9"
    }, {
      "key":  "Shift+f",
      "desc": "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u304f"
    }, {
      "key":  "c",
      "desc": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u5e38\u6642\u8868\u793a/\u81ea\u52d5\u8868\u793a\u3092\u5207\u308a\u66ff\u3048\u308b"
    }, {
      "key":  "Shift+c",
      "desc": "\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u3092\u5207\u308a\u66ff\u3048"
    }, {
      "key":  "d",
      "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u958b\u59cb"
    }, {
      "key":  "v",
      "desc": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u958b\u59cb"
    }, {
      "key":  "Shift+v",
      "desc": "\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3092\u958b\u304f"
    }, {
      "key":  "Shift+Number",
      "desc": "\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u3002\u30c7\u30d5\u30a9\u30eb\u30c8\u8a2d\u5b9a\u3067\u306f\u7121\u52b9(1=10\u70b9/0=1\u70b9)"
    }, {
      "key":  "+/-",
      "desc": "\u753b\u50cf\u3092\u7e2e\u5c0f/\u62e1\u5927\u3059\u308b"
    }, {
      "key":  "?",
      "desc": "\u30d8\u30eb\u30d7\u3092\u8868\u793a"
    }]
  }, {
    "mode": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9",
    "keys": [{
      "key":  "Escape",
      "desc": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u3092\u7d42\u4e86"
    }, {
      "key":  "Enter",
      "desc": "\u9001\u4fe1"
    }]
  }, {
    "mode": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9",
    "keys": [{
      "key":  "v/Escape",
      "desc": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u7d42\u4e86"
    }, {
      "key":  "a/BackSapace/Left",
      "desc": "\u524d\u306e\u30da\u30fc\u30b8\u306b\u79fb\u52d5"
    }, {
      "key":  "Space/Right",
      "desc": "\u6b21\u306e\u30da\u30fc\u30b8\u306b\u79fb\u52d5"
    }, {
      "key":  "Home/End",
      "desc": "\u6700\u521d/\u6700\u5f8c\u306e\u30da\u30fc\u30b8\u306b\u79fb\u52d5"
    }, {
      "key":  "f",
      "desc": "\u8868\u793a\u3057\u3066\u3044\u308b\u30da\u30fc\u30b8\u306e\u753b\u50cf\u3092\u958b\u304f"
    }, {
      "key":  "Shift+f",
      "desc": "\u8868\u793a\u3057\u3066\u3044\u308b\u30da\u30fc\u30b8\u3092\u958b\u304f"
    }]
  }, {
    "mode": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9",
    "keys": [{
      "key":  "d/Escape",
      "desc": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u3092\u7d42\u4e86"
    }, {
      "key":  "Up",
      "desc": "\u4e00\u3064\u4e0a\u306e\u9078\u629e\u80a2\u306b\u30d5\u30a9\u30fc\u30ab\u30b9\u3092\u79fb\u3059"
    }, {
      "key":  "Down",
      "desc": "\u4e00\u3064\u4e0b\u306e\u9078\u629e\u80a2\u306b\u30d5\u30a9\u30fc\u30ab\u30b9\u3092\u79fb\u3059"
    }]
  }];

  ConfigUI.create_help_table = function(msg_filter) {
    if (!msg_filter) msg_filter = function(s) { return s; };
    var table = $c('table', null, {cls: 'pp-help-table'});
    var captions = [];
    each(ConfigUI.help_data, function(help) {
      var cell = table.insertRow(-1).insertCell(-1);
      cell.setAttribute('colspan', '2');
      cell.className = 'pp-help-mode';
      cell.textContent = msg_filter(help.mode);
      each(help.keys, function(key) {
        var row = table.insertRow(-1);
        row.insertCell(-1).textContent = key.key;
        row.insertCell(-1).textContent = msg_filter(key.desc);
      });
      captions.push(cell);
    });
    each(ConfigUI.help_data, function(help, idx_h) {
      var rep = msg_filter(help.mode);
      each(table.rows, function(row) {
        if (row.cells.length < 2) return;
        var node = row.cells[1].firstChild;
        var terms = node.nodeValue.split(rep);
        if (terms.length < 2) return;
        each(terms, function(term, idx_t) {
          if (idx_t > 0) {
            var label = $c('label', null, {text: rep});
            node.parentNode.insertBefore(label, node);
            $ev(label).hover(function() {
              captions[idx_h].setAttribute('highlight', '');
            }, function() {
              captions[idx_h].removeAttribute('highlight');
            });
          }
          node.parentNode.insertBefore(window.document.createTextNode(term), node);
        });
        node.parentNode.removeChild(node);
      });
    });
    return table;
  };

  ConfigUI.css =
    '#pp-conf-pagelist li{display:inline-block;z-index:99;list-style-type:none;}' +
    '#pp-conf-pagelist li.select{background-color:white;border:1px solid silver;border-bottom:0px;}' +
    '#pp-conf-pagelist li a{color:inherit;display:block;padding:2px 6px;text-decoration:none;}' +
    '#pp-conf-pagelist li.select a{padding:1px 5px 2px 5px;}' +
    '#pp-conf-pager-content{border:1px solid silver;padding:4px;margin-top:-1px;z-index:98;}' +
    '.pp-conf-page{display:none;width:100%;overflow:auto;}' +
    '.pp-conf-page.select{display:inline-block;}' +
    '.pp-conf-page input, .pp-conf-page textarea{' +
    '  box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;}' +
    '.pp-conf-page button{display:inline-block;white-space:nowrap;padding:0px;}' +
    '.pp-conf-page textarea{width:100%;}' +
    '.pp-conf-cell-value select, .pp-conf-cell-value input{margin:0px;padding:0px;width:100%;}' +
    '.pp-conf-key-editor{padding-left:1em;}' +
    //'.pp-conf-page .pp-conf-key-editor button{display:inline-block;}' +
    '.pp-conf-key-editor ul label{margin-left:4px;}' +
    '.pp-conf-key-editor ul li{list-style-type:none;margin-bottom:2px;}' +
    '.pp-conf-key-editor .pp-conf-key-editor-add-line button{margin-left:4px;}' +
    '#pp-conf-tags textarea{height:200px;margin-bottom:1em;}' +
    '#pp-conf-tags .pp-conf-cell-aliases{width:100%;}' +
    '#pp-conf-tags .pp-conf-cell-aliases input{width:100%;}' +
    '#pp-conf-export form{display:block;}' +
    '#pp-conf-export input{margin-left:0.2em;}' +
    '.pp-help-table{line-height:1.2em;}' +
    '.pp-help-table td{padding:0px 4px;}' +
    '.pp-help-table td.pp-help-mode{padding:0px;font-weight:bold;}' +
    '.pp-help-table td.pp-help-mode[highlight]{background-color:#ffdfdf;}' +
    '.pp-help-table td label{color:navy;}' +
    '#pp-conf-about dt{font-weight:bold;}' +
    '#pp-conf-about *+dt{margin-top:0.6em;}' +
    '#pp-conf-about dd{margin-left:1.6em;}' +
    '#pp-conf-about dd ul li{list-style-type:none;}' +
    '#pp-conf-changelog dt{font-weight:bold;}' +
    '#pp-conf-changelog ul{padding-left:2em;}' +
    '#pp-conf-changelog ul li{list-style-type:disc;}';
  /* __CONFIG_UI_END__ */

  function show_help() {
    var de = window.document.documentElement;
    var background = $c('div', window.document.body, {id: 'pp-help-background'});
    var root = $c('div', window.document.body, {id: 'pp-help'});
    root.appendChild(ConfigUI.create_help_table());
    root.style.position = 'fixed';
    root.style.left = Math.floor((de.clientWidth  - root.offsetWidth)  / 2) + 'px';
    root.style.top  = Math.floor((de.clientHeight - root.offsetHeight) / 2) + 'px';

    Popup.stop_key = true;
    var conn_click = $ev(background).click(close);
    var conn_key   = $ev(window).key(function(ev, conn, key) {
      if (key === $ev.KEY_ESCAPE || key === '?') return close();
      return false;
    });

    function close() {
      conn_click.disconnect();
      conn_key.disconnect();
      background.parentNode.removeChild(background);
      root.parentNode.removeChild(root);
      Popup.stop_key = false;
      return true;
    }
  }

  function init_config_ui() {
    if (_extension_data && !(_extension_data.base_uri || _extension_data.open_options)) return;

    var root, click_handler;
    var sitenav = $x('//div[@id="nav"]/ul[contains(concat(" ", @class, " "), " sitenav ")]');
    if (sitenav) {
      var config_anc;

      function fire_event() {
        var ev = window.document.createEvent('Event');
        ev.initEvent('pixplusConfigToggled', true, true);
        window.document.dispatchEvent(ev);
      }
      function show() {
        create();
        $ef(root).show(); /* WARN */
        fire_event();
        if (click_handler) click_handler.disconnect();
        click_handler = $ev(window.document.body, {capture: true}).click(function(ev) {
          if (!is_ancestor(root, ev.target) &&
              !is_ancestor(config_anc, ev.target)) {
            hide();
          }
          return false;
        });
      }
      function hide() {
        $ef(root).hide(); /* WARN */
        fire_event();
        if (click_handler) click_handler.disconnect();
      }
      function toggle() {
        if (!root || root.style.display === 'none') {
          show();
        } else {
          hide();
        }
      }

      function create_menu_item(text, func) {
        var item = $c('li');
        $ev($c('a', item, {href: '#', text: text})).click(function() {
          func();
          return true;
        });
        return item;
      }

      var menu_items = [];
      if (/\/mypage\.php/.test(window.location.pathname) && window.localStorage) (function() {
        var mi_restore, mi_restore_input, key = '__pixplus_cookie_pixiv_mypage';
        menu_items.push(create_menu_item('Save layout', function() {
          var value = window.jQuery.cookie('pixiv_mypage');
          window.localStorage[key] = value;
          mi_restore_input.value = value;
          //mi_restore.style.display = 'block';
        }));
        menu_items.push(mi_restore = create_menu_item('Restore layout', function() {
          window.jQuery.cookie('pixiv_mypage', mi_restore_input.value,
                               {expires: 30, domain: 'pixiv.net', path: '/'});
          window.location.reload();
        }));
        mi_restore_input = $c('input', mi_restore, {value: window.localStorage[key] || ''});
        $ev(mi_restore_input).listen(['mousedown', 'mouseup'], function() {
          this.select(); /* WARN */
        });
        //if (!window.localStorage[key]) mi_restore.style.display = 'none';
      })();

      var li  = $c('li', null, {id: 'pp-sitenav-menu-caption'});
      sitenav.insertBefore(li, sitenav.firstChild);
      config_anc = $c('a', menu_items.length ? $c('div', li) : li, {href: '#', text: 'pixplus'});
      if (menu_items.length) {
        li.appendChild(config_anc.cloneNode(true));
        var menu = $c('ul', li, {id: 'pp-sitenav-menu'});
        each(menu_items, function(item) {
          menu.appendChild(item);
        });
      }
      $ev(config_anc).click(function() {
        if (_extension_data) {
          if (_extension_data.open_options) {
            _extension_data.open_options();
          } else {
            pp.open(_extension_data.base_uri + 'options.html');
          }
        } else {
          toggle();
        }
        return true;
      });

      function create() {
        if (root) return;
        root = $c('div', null, {id: 'pp-conf-root'});
        var ui = new ConfigUI(root);
        var li = $c('li', null, {id: 'pp-conf-close'});
        ui.page_list.insertBefore(li, ui.page_list.firstChild);
        $ev($c('a', li, {href: '#', text: '\u00d7'})).click(function() {
          hide();
          return true;
        });

        if (!LS.u) {
          var note = $c('div', root, {text: "\u8a2d\u5b9a\u306f\u4fdd\u5b58\u3055\u308c\u307e\u305b\u3093\u3002"});
          if (window.opera) note.textContent += "Export\u30bf\u30d6\u3067\u8a2d\u5b9a\u3092\u5909\u66f4\u3059\u308bUserJS\u3092\u51fa\u529b\u3067\u304d\u307e\u3059\u3002";
        }

        ($('manga_top') || $('pageHeader')).appendChild(root);
      }
    }
  }

  function unpack_captions(col, xpath_cap) {
    each($xa(xpath_cap || './/a[img]/text()', col), function(node) {
      if (check_node(node.previousSibling, 'BR')) {
        node.parentNode.removeChild(node.previousSibling);
      }
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
      each($xa('//div[contains(concat(" ", @class, " "), " area_right ")]'), function(root) {
        add_gallery({
          root:          root,
          xpath_col:     '.',
          xpath_cap:     './/li//a[contains(@href, "mode=medium")][preceding-sibling::*[contains(concat(" ", @class, " "), " ranknumsmall ")] or ancestor::*[contains(concat(" ", @class, " "), " ran_text ")]]',
          xpath_tmb:     'ancestor::*[contains(concat(" ", @class, " "), " ran_text ")]/preceding-sibling::*[contains(concat(" ", @class, " "), " ran_img ")]//img',
          allow_nothumb: 3
        });
      });
    }
    function mypage() {
      each($xa('//div[contains(concat(" ", @class), " baseTop")]'), function(root) {
        add_gallery({
          root:      root,
          xpath_col: './/ul[contains(concat(" ", @class, " "), " top_display_works ")]',
          xpath_cap: './li/text()[last()]'
        }, unpack_captions);
      });
      area_right();
    }

    var re;
    if (/^\/(?:mypage|cate_r18)\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/mypage.php
      // http://www.pixiv.net/cate_r18.php
      mypage();
    } else if (/^\/member\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/member.php?id=11
      mypage();
      each($xa('//div[contains(concat(" ", @class, " "), " worksListOthersImg ")]'), function(root) {
        add_gallery({root: root, xpath_col: '.'}, unpack_captions);
      });
    } else if (/^\/member_illust\.php/.test(window.location.pathname)) {
      if (options.illust_id) {
        // http://www.pixiv.net/member_illust.php?mode=medium&illust_id=14602505
        // 下部のイメージレスポンス
        add_gallery({
          xpath_col: '//div[contains(concat(" ", @class, " "), " worksImageresponse ")]',
          xpath_cap: './ul[contains(concat(" ", @class, " "), " worksResponse ")]/li/text()[last()]'
        });
      } else if (options.id) {
        // http://www.pixiv.net/member_illust.php?id=11
        add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]'}, unpack_captions);
      } else {
        // 自分のイラスト管理
        // http://www.pixiv.net/member_illust.php
        add_gallery({
          xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]',
          xpath_cap: './ul/li/a[img]/following-sibling::text()[1]'
        }, unpack_captions);
      }
    } else if ((re = /^\/ranking(_tag|_area)?\.php/.exec(window.location.pathname))) {
      if ((re[1] === '_tag' || re[1] === '_area') && !options.type) {
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
        add_gallery({
          xpath_col: '//div[contains(concat(" ", @class, " "), " rankingZone ")]',
          xpath_cap: './div[contains(concat(" ", @class, " "), " r_right ")]/p/span/a[contains(@href, "mode=medium")]',
          xpath_tmb: '../../../../div[contains(concat(" ", @class, " "), " r_left ")]/ul/li[contains(concat(" ", @class, " "), " r_left_img ")]/a/img'
        });
      }
    } else if (/^\/bookmark\.php/.test(window.location.pathname) && !options.id &&
               (!options.type || /^illust(?:_all)?$/.test(options.type))) {
      // ブックマーク管理
      // http://www.pixiv.net/bookmark.php
      // http://www.pixiv.net/bookmark.php?type=illust_all
      function debug_filter(item) {
        var c = $x('./input[@name="book_id[]"]', item.caption.parentNode);
        if (c) {
          if (check_node(item.caption.nextSibling, 'BR')) {
            item.caption.parentNode.removeChild(item.caption.nextSibling);
          }
          var d = $c('div', null, {html: 'ID: ' + item.id + '<br />BID: ' + c.value});
          item.caption.parentNode.insertBefore(d, item.caption.nextSibling);
        }
      }
      add_gallery({
        xpath_col: '//div[contains(concat(" ", @class, " "), " display_works ")]',
        xpath_cap: './ul/li/text()[preceding-sibling::a/img]'
      }, unpack_captions, conf.debug ? debug_filter : null);
    } else if (/^\/bookmark_detail\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/bookmark_detail.php?illust_id=15092961
      // 下部の「****の他の作品」
      add_gallery({xpath_col: '//div[contains(concat(" ", @class, " "), " bookmark_works ")]'});
    } else if (/^\/stacc/.test(window.location.pathname)) {
      // http://www.pixiv.net/stacc/
      add_gallery({
        xpath_col: '//span[@id="insert_status"]/div[contains(concat(" ", @class, " "), " post ")]',
        xpath_cap: './div/div[contains(concat(" ", @class, " "), " post-side ")]/p[contains(concat(" ", @class, " "), " post-imgtitle ")]/a[contains(@href, "mode=medium")]',
        xpath_tmb: '../../preceding-sibling::div[contains(concat(" ", @class, " "), " post-content-ref ")]/div[contains(concat(" ", @class, " "), " post-img ")]/a/img',
        skip_dups: true
      });
      add_gallery({
        xpath_col:  '//span[@id="insert_status"]/div[contains(concat(" ", @class, " "), " post ")]',
        xpath_tmb:  './/*[contains(concat(" ", @class, " "), " add_fav_content_area ")]/a[contains(@href, "mode=medium")]/img',
        thumb_only: true
      });
    } else if (/^\/event_detail\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/event_detail.php?event_id=805
      add_gallery({
        xpath_col:  '//div[contains(concat(" ", @class, " "), " event-cont ")]//ul[contains(concat(" ", @class, " "), " thu ")]',
        xpath_tmb:  './li/a[contains(@href, "mode=medium")]/img',
        thumb_only: true
      });
    } else if (/^\/event_member\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/event_member.php?event_id=805
      add_gallery({
        xpath_col:  '//div[@id="contents"]//div[contains(concat(" ", @class, " "), " thumbFull ")]/ul',
        xpath_tmb:  './li/a[contains(@href, "member_event.php")]/img[contains(concat(" ", @class, " "), " thui ")]',
        thumb_only: true,
        get_url:    get_url_from_image
      });
    } else if (/^\/(?:view|rating|comment)_all\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/view_all.php
      // http://www.pixiv.net/rating_all.php
      // http://www.pixiv.net/comment_all.php
      add_gallery({
        xpath_col:     '//div[contains(concat(" ", @class, " "), " archiveListNaviBody ")]/dl',
        xpath_cap:     './dd/a[contains(@href, "mode=medium")]',
        allow_nothumb: -1
      });
    } else if (/^\/ranking_log\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/ranking_log.php
      if (conf.popup_ranking_log) {
        add_gallery({
          xpath_col:  '//table[contains(concat(" ", @class, " "), " calender_ranking ")]',
          xpath_tmb:  './/a[contains(@href, "ranking.php")]//img',
          thumb_only: true,
          skip_dups:  true,
          get_url:    get_url_from_image
        });
      }
    } else if (/^\/user_event\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/user_event.php
      // http://www.pixiv.net/user_event.php?mode=attn
      add_gallery({
        xpath_col: '//div[contains(concat(" ", @class, " "), " linkStyleWorks ")]/ol',
        xpath_cap: './li/text()[preceding-sibling::a/img]'
      }, unpack_captions);
      if (options.id) {
        // http://www.pixiv.net/user_event.php?id=23
        add_gallery({
          xpath_col: '//div[contains(concat(" ", @class, " "), " rounded ")]/div[contains(concat(" ", @class, " "), " status-description ")]',
          xpath_cap: './h3[contains(concat(" ", @class, " "), " status-title ")]/a',
          xpath_tmb: '../preceding-sibling::div[contains(concat(" ", @class, " "), " status-thumbnail ")]/a/img'
        });
      }
    } else if (/^\/user_event_related\.php/.test(window.location.pathname)) {
      // http://www.pixiv.net/user_event_related.php?id=23
      pp.write_css('ol.linkStyleWorks p{font-size:inherit;padding:0px;}');
      add_gallery({
        xpath_col: '//ol[contains(concat(" ", @class, " "), " linkStyleWorks ")]',
        xpath_cap: './li/p[preceding-sibling::a/img]'
      }, function(col) {
        unpack_captions(col, './li/a/p');
      });
      add_gallery({
        xpath_col: '//div[contains(concat(" ", @class, " "), " rounded ")]/div[contains(concat(" ", @class, " "), " status-description ")]',
        xpath_cap: './h3[contains(concat(" ", @class, " "), " status-title ")]/a',
        xpath_tmb: '../preceding-sibling::div[contains(concat(" ", @class, " "), " status-thumbnail ")]/a/img'
      });
    }

    // 汎用
    if (pp.galleries.length === 0) {
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
      var re;
      if (thumb && (re = /http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+(?:\/mobile)?\/(\d+)_(?:128x128|s)/i.exec(thumb.src))) {
        return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + re[1];
      } else {
        return null;
      }
    }
  }

  function init_recommend() {
    var r_container = $('illust_recommendation');
    var r_caption = $x('../../../preceding-sibling::div/h3/span[text()[contains(., \"\u304a\u3059\u3059\u3081\")]]', r_container);
    var r_switch = $('switchButton'), r_switch_p = r_switch ? r_switch.parentNode : null;
    var float_wrap = null;
    if (!r_container) return;

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
          if (_error) _error.apply(this, arguments);
        };
      }
    })();

    var de = window.document.documentElement;
    var gallery;

    function init_gallery(illusts) {
      gallery = add_gallery({
        root:      illusts,
        xpath_col: './li',
        xpath_cap: './a[img]/following-sibling::text()[1]',
        xpath_tmb: 'preceding-sibling::a/img'
      }, unpack_captions);
      if (float_wrap) init_right_gallery(illusts);
    }
    function init_right_gallery(illusts) {
      var floater = new Floater(float_wrap, illusts), conn;
      init_pager();
      gallery.onadditem.connect(init_pager, true);
      function init_pager() {
        var more = $x('.//div[contains(concat(" ", @class, " "), " commands ")]/a[contains(@title, \"\u3082\u3063\u3068\u898b\")]', r_container);
        if (more) {
          if (conn) conn.disconnect();
          conn = $ev(illusts, {async: true}).scroll(function(ev, conn) {
            if (illusts.scrollHeight - illusts.scrollTop < illusts.clientHeight * 2) {
              send_click(more);
              conn.disconnect();
            }
          });
        }
        floater.update_height();
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
      var wrap = $c('div', null, {id: 'pp-recom-wrap'});
      var div = $c('div', wrap);
      if (anc) {
        div.appendChild(anc.cloneNode(true));
        if (r_switch) {
          var r_switch_p_new = $c('span');
          switch_wrap = $c('span', div, {id: 'pp-recom-switch-wrap'});
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

      pp.write_css('#wrapper{width:1160px;}' +
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

    function wait_xpath(xpath, root, func) {
      var node = $x(xpath, root);
      if (node) {
        func(node);
      } else {
        $ev(root, {async: true}).listen(['DOMNodeInserted', 'DOMAttrModified'], function(ev, conn) {
          node = $x(xpath, root);
          if (node) {
            func(node);
            conn.disconnect();
          }
        });
      }
    }
    wait_xpath(
      './/ul[contains(concat(" ", @class, " "), " illusts ") and li]',
      r_container,
      function(illusts) {
        if (!/^\/bookmark_add\.php/.test(window.location.pathname) && de.clientWidth >= 1175) {
          if (conf.locate_recommend_right === 1) {
            locate_right();
          } else if (conf.locate_recommend_right === 2 &&
                     $x('//li[contains(concat(" ", @class, " "), " pager_ul_next ")]')) {
            Pager.wait(function() {
              locate_right();
              if (gallery) init_right_gallery(r_container);
            });
          }
        }
        init_gallery(illusts);
      });
  }

  function init_taglist() {
    var bm_tag_list = $('bookmark_list');
    if (bm_tag_list) {
      pp.write_css('.area_bookmark, #bookmark_list{padding:0px !important;}' +
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

    Floater.auto_run(function() {
      var cont = bm_tag_list ? bm_tag_list : $x('//ul[contains(concat(" ", @class, " "), " tagCloud ")]');
      if (cont) {
        var wrap = $x('ancestor::div[contains(concat(" ", @class, " "), " ui-layout-west ")]', cont);
        if (wrap) {
          pp.write_css('.ui-layout-east{float:right;}' +
                       '.ui-layout-west .area_new{margin:0px;}');
          var floater = new Floater(wrap, cont);
          window.document.addEventListener('pixplusBMTagToggled', bind(floater.update_height, floater), false);
        }
      }
    });
    return bm_tag_list;
  }

  function init_illust_page_bookmark() {
    var bm_add_anc = $x('//div[contains(concat(" ", @class, " "), " works_illusticonsBlock ")]//a[contains(@href, "bookmark_add.php")]');
    var display = $x('//div[contains(concat(" ", @class, " "), "works_display")]');
    if (!bm_add_anc || !display) return;
    var bm_form_div, loader;
    $ev(bm_add_anc).click(function() {
      if (bm_form_div) {
        hide();
      } else {
        show();
      }
      return true;
    });

    function Loader(url, wrap) {
      var cancelled = false;
      this.cancel = function() { cancelled = true; };
      geturl(url, function(text) {
        var re;
        if (cancelled) return;
        if ((re = /<form[^>]+action="bookmark_add.php"[\s\S]*?<\/form>/mi.exec(text))) {
          wrap.innerHTML = re[0];
          var form = new BookmarkForm(wrap, {
            autotag: !$x('preceding-sibling::a[contains(@href, "bookmark_detail.php")]', bm_add_anc),
            closable: true
          });
          form.onclose.connect(hide);
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
      bm_form_div = $c('div', null, {text: 'Loading', css: 'margin:1em'});
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
    if (/^\/bookmark(?:_tag_setting)?\.php/.test(window.location.pathname)) {
      if (options.type && /^(?:reg_)?user$/.test(options.type)) {
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
          each(list, function(list) {
            var ul = $c('ul', bm_tag_list);
            each(list, function(li) {
              li.parentNode.removeChild(li);
              ul.appendChild(li);
            });
          });
          defineMagicFunction('bookmarkToggle', function(real, othis, container_id, type) {
            var container = $(container_id);
            container.className = type;
            each($t('ul', container), function(ul) {
              if (type === 'cloud') {
                ul.className = 'tagCloud';
              } else {
                ul.removeAttribute('class');
              }
            });
            each($xa('ul/li', container), function(li, idx) {
              var cn = li.className.replace(/bg_(?:gray|white)/, '');
              if (type === 'flat') cn += idx & 1 ? ' bg_gray' : ' bg_white';
              li.className = cn;
            });

            $('book_outlist').style.display = type === 'flat' ? 'none' : 'block';

            var flat = type === 'flat', toggle_btns = $xa('.//a/span', $('bookmark_toggle_btn'));
            toggle_btns[0].className = flat ? 'book_flat_on' : 'book_flat_off';
            toggle_btns[1].className = flat ? 'book_cloud_off' : 'book_cloud_on';

            window.jQuery.cookie('bookToggle', type, {
              expires: 30, domain: window.location.hostname.replace(/^(\w+)\./, '.')
            });

            var ev = window.document.createEvent('Event');
            ev.initEvent('pixplusBMTagToggled', true, true);
            window.document.dispatchEvent(ev);
          }, function() {
            var flat = $t('ul', bm_tag_list)[0].className !== 'tagCloud';
            window.bookmarkToggle('bookmark_list', flat ? 'flat' : 'cloud');
          });
        }

        Floater.auto_run(function() {
          var msgbox = $x('//div[contains(concat(" ", @class, " "), " msgbox_bottom ")]');
          var form = $x('//form[@action="bookmark_setting.php"]');
          if (msgbox && form) {
            msgbox.parentNode.removeChild(msgbox);
            form.insertBefore(msgbox, form.firstChild);
            pp.write_css('.msgbox_bottom{border:0px !important;}' +
                         // ポップアップより下(z-index:90)に表示する
                         '.msgbox_bottom[float]{z-index:90;opacity:0.6;}' +
                         '.msgbox_bottom[float]:hover{opacity:1;}');

            new Floater(msgbox, null, true);
          }
        });
      }
    } else if (/^\/member_illust\.php/.test(window.location.pathname)) {
      switch(options.mode) {
      case 'medium':
        init_illust_page_bookmark();
        each($xa('//div[contains(concat(" ", @class, " "), " centeredNavi ")]//a[contains(@href, "mode=medium")]'),
             function(anc) {
               anc.setAttribute('nopopup', '');
             });

        var elem, pos, de = window.document.documentElement;
        if (conf.scroll === 1) {
          elem = $x('//div[contains(concat(" ", @class, " "), " works_area ")]');
          pos = 0;
        } else if (conf.scroll === 2) {
          elem = $x('//div[contains(concat(" ", @class, " "), " works_display ")]');
          pos = 1;
        }
        if (elem) window.scroll(0, getpos(elem).top - (de.clientHeight - elem.offsetHeight) * pos);

        var works_caption = $x('//p[contains(concat(" ", @class, " "), " works_caption ")]');
        if (works_caption) {
          works_caption.innerHTML = edit_comment(works_caption.innerHTML);
        }

        var re, img = $x('//div[contains(concat(" ", @class, " "), " works_display ")]/a[starts-with(@href, "member_illust.php?mode=big")]/img');
        // 冒頭メモ参照
        if (img && (re = /^(http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+\/\d+(?:_[0-9a-f]{10})?)_m(\.\w+)(?:\?.*)?$/i.exec(img.src))) {
          img.parentNode.href = re[1] + re[2];
        }
        break;
      case 'manga':
        (function(func) {
          if (window.pixiv.manga.imageContainer) {
            func();
          } else {
            var _setup = window.pixiv.manga.setup;
            window.pixiv.manga.setup = function() {
              _setup.apply(this, Array.prototype.slice.apply(arguments));
              func();
            };
          }
        })(function() {
          var re;
          if ((re = /^#pp_page=(\d+)$/.exec(window.location.hash))) {
            var page = parseInt(re[1]);
            each(window.pixiv.context.images, function(ary, idx) {
              if ((page + 1) <= ary.length) {
                window.pixiv.manga.updatePosition(window.pixiv.manga.findPosition(idx));
                window.pixiv.manga.move(idx);
                return true;
              }
              page -= ary.length;
              return false;
            });
          } else if (window.location.hash === '#pp_manga_tb') {
            window.pixiv.manga.toggleView();
          }
        });
        break;
      }
    } else if (/^\/bookmark_add\.php/.test(window.location.pathname)) {
      if (conf.mod_bookmark_add_page && options.type === 'illust') {
        var wrap = $x('//div[contains(concat(" ", @class, " "), " one_column_body ")]');
        if (wrap) new BookmarkForm(wrap, {autotag: !!$x('//h2[contains(text(), \"\u8ffd\u52a0\")]')});
      }
      conf.debug && chk_ext_src('script', 'src', pp.url.js.bookmark_add_v4);
    } else if (/^\/search_user\.php/.test(window.location.pathname)) {
      Pager.wait(function() {
        var research = $x('//div[contains(concat(" ", @class, " "), " re_research ")]');
        if (research) {
          var parent = research.parentNode;
          parent.removeChild(research);
          parent.insertBefore(research, parent.firstChild);
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
      pp.rpc_div = $c('div', null, {css: 'display:none'});
      window.document.body.insertBefore(pp.rpc_div, window.document.body.firstChild);
    }

    pp.write_css('#header .header_otehrs_ul li{margin-left:0px;}' +
                 '#header .header_otehrs_ul li + li{margin-left:16px;}' +
                 '*[float]{position:fixed;top:0px;}' +
                 // workaround
                 '.book_flat_on,.book_flat_off,.book_cloud_on,.book_cloud_off{padding-bottom:15px;}' +
                 // icon
                 '.pixplus-check{width:14px;height:14px;background-position:-1701px -547px;' +
                 '  background-image:url("' + pp.url.img.sprite + '");}' +
                 '.pixplus-heart{width:16px;height:14px;background-position:-1701px -480px;' +
                 '  background-image:url("' + pp.url.img.sprite + '");}' +
                 '.pixplus-flag{width:14px;height:16px;background-position:-1701px -1px;' +
                 '  background-image:url("' + pp.url.img.sprite + '");}' +
                 // caption
                 (conf.popup.font_size ? '#pp-popup{font-size:' + conf.popup.font_size + ';}' : '') +
                 '.works_caption hr, #pp-popup hr{display:block;border:none;height:1px;background-color:silver;}' +
                 'hr + br, hr ~ br{display:none;}' +
                 // menu
                 '#pp-sitenav-menu-caption > a{display:block;}' +
                 '#pp-sitenav-menu-caption div{padding:3px;margin-top:-3px;margin-left:-3px;background-color:white;' +
                 '  z-index:10002;position:absolute;display:none;}' +
                 '#pp-sitenav-menu-caption:hover div{padding:2px;border:solid silver;border-width:1px 1px 0px 1px;' +
                 '  display:block;}' +
                 '#pp-sitenav-menu{display:none;position:absolute;z-index:10001;background-color:white;' +
                 '  border:1px solid silver;padding:2px;margin-top:1px;margin-left:-3px;}' +
                 '#pp-sitenav-menu-caption:hover #pp-sitenav-menu{display:block;}' +
                 '#pp-sitenav-menu li{margin:0px;padding:0px;display:block;float:none;}' +
                 '#pp-sitenav-menu li input{width:2em;margin-left:2px;padding:1px;}' +
                 // config
                 '#pp-conf-root{margin-bottom:4px;}' +
                 ConfigUI.css +
                 '#pp-conf-pager-content{height:600px;}' +
                 '.pp-conf-page{width:960px;max-height:600px;overflow:auto;}' +
                 // help
                 '#pp-help-background{position:fixed;background:white;opacity:0.9;z-index:10001;' +
                 '  left:0px;top:0px;width:100%;height:100%;}' +
                 '#pp-help{background-color:white;border:2px solid gray;z-index:10002;padding:2px;}' +
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
                 '#pp-popup #pp-caption .pp-separator{border-top:1px solid gray;margin-top:1px;padding-top:1px;}' +
                 '#pp-popup #pp-caption .pp-separator-b{border-bottom:1px solid gray;margin-bottom:1px;padding-bottom:1px;}' +
                 '#pp-popup #pp-comment-wrap{overflow:auto;line-height:normal;}' +
                 '#pp-popup #tag_area > * + *{margin-left:0.6em;}' +
                 '#pp-popup #tag_area > span > a + a{margin-left:0.2em;}' +
                 '#pp-popup #tag_area > #pp-tag-edit-btn{font-size:smaller;color:gray;line-height:1.1em;}' +
                 '#pp-popup #pp-bm-edit{margin-top:2px;}' +
                 '#pp-popup #pp-img-div{margin-top:2px;text-align:center;' +
                 '  min-width:480px;min-height:360px;line-height:0px;border:1px solid silver;}' +
                 '#pp-popup #pp-img-div a{display:inline-block;}' +
                 '#pp-popup #pp-img-div a img{display:block;}' +
                 '#pp-popup #pp-img-div #pp-error-message{display:none;width:480px;height:360px;' +
                 '  line-height:360px;text-align:center;vertical-align:middle;}' +
                 '#pp-popup .pp-olc{position:absolute;cursor:pointer;z-index:1004;opacity:0;background-color:gainsboro;}' +
                 '#pp-popup .pp-olc:hover{opacity:0.6;}' +
                 '#pp-popup #pp-olc-prev{left:3px;}' +
                 '#pp-popup #pp-olc-next{right:3px;}' +
                 (conf.popup.remove_pixpedia ? "#pp-popup a[href^=\"http://dic.pixiv.net/\"]{display:none;}" : "") +
                 '#pp-popup.pp-error #pp-caption{display:none;}' +
                 '#pp-popup.pp-error #pp-img-div a{display:none;}' +
                 '#pp-popup.pp-error #pp-img-div #pp-error-message{display:block;}' +
                 // rating
                 '#pp-popup #pp-rating{line-height:1.1em;padding:0px !important;}' +
                 '#pp-popup #pp-rating input{display:block;line-height:1em;}' +
                 '#pp-popup #pp-rating input:focus{background-color:#feffdf;}' +
                 '#pp-popup #pp-rating #unit span > div:before{content:":";margin-right:0.4em;}' +
                 '#pp-popup #pp-rating #unit span + span{margin-left:0.8em;}' +
                 '#pp-popup #pp-rating #after_q_rating{font-size:inherit;}' +
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
                 // info
                 '#pp-popup #pp-info{line-height:1.1em;position:relative;}' +
                 '#pp-popup #pp-info #pp-author-img{' +
                 '  box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;' +
                 '  float:left;max-height:3.3em;border:1px solid gray;margin-right:4px;}' +
                 '#pp-popup #pp-info #pp-author-img:hover{max-height:100%;}' +
                 '#pp-popup #pp-info #pp-date-wrap > span + span{margin-left:0.6em;}' +
                 '#pp-popup #pp-info #pp-date-wrap:after{content:"\\a";white-space:pre-wrap;line-height:1em;}' +
                 '#pp-popup #pp-info #pp-date-repost{font-size:smaller;line-height:1.1em;}' +
                 '#pp-popup #pp-info #pp-date-repost:before{content:\"(\u518d \";}' +
                 '#pp-popup #pp-info #pp-date-repost:after{content:")";}' +
                 '#pp-popup #pp-info #pp-info-wrap > span + span{margin-left:0.6em;}' +
                 '#pp-popup #pp-info #pp-info-wrap:after{content:"\\a";white-space:pre-wrap;line-height:1em;}' +
                 '#pp-popup #pp-info #pp-info-tools > * + *{margin-left:0.6em;}' +
                 '#pp-popup #pp-info #pp-author-status{position:absolute;left:3px;top:2px;display:inline-block;}' +
                 '#pp-popup #pp-info #pp-author-img:hover + #pp-author-status{display:none;}' +
                 '#pp-popup #pp-info #pp-author a{font-weight:bold;}' +
                 '#pp-popup #pp-info #pp-author a + a{margin-left:0.6em;}' +
                 // comments
                 '#pp-popup #pp-viewer-comments > div{margin-left:0.8em;padding-left:4px;border-left:3px solid #d6dee5;}' +
                 '#pp-popup #pp-viewer-comments input + input{margin-left:0.4em;}' +
                 '#pp-popup #pp-viewer-comments .worksComment{padding:2px 0px;}' +
                 '#pp-popup #pp-viewer-comments .worksComment:last-child{border:none;}' +
                 // tag edit
                 '#pp-popup #tag_edit > div{margin:0px !important;}'
                );

    init_config_ui();
    init_galleries();
    init_recommend();
    init_taglist();
    init_per_page();

    $ev(window.document.body).click(function(ev) {
      var anc = $x('ancestor-or-self::a[1]', ev.target), re;
      if (anc && !anc.hasAttribute('nopopup') && (anc.getAttribute('href') || '').charAt(0) != '#' &&
          (re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?member_illust\.php.*[\?&](illust_id=\d+)/.exec(anc.href))) {
        if (Popup.instance || $t('img', anc).length ||
            !$x('//a[contains(@href, "member_illust.php") and contains(@href, "' + re[1] + '")]//img')) {
          var opts = parseopts(anc.href);
          if (opts.illust_id && opts.mode === 'medium') {
            ev.preventDefault();
            Popup.run_url(anc.href);
            log(['Open popup: ', anc]);
            return true;
          }
        }
      }
      return false;
    });

    if (conf.bookmark_hide) {
      each($xa('.//a[contains(@href, "bookmark.php")]'), function(anc) {
        if (!/[\?&]rest=/.test(anc.href) &&
            (/[\?&]type=illust/.test(anc.href) ||
             !/[\?&]type=/.test(anc.href))) {
          anc.href += (anc.href.indexOf('?') >= 0 ? "&" : "?") + "rest=hide";
        }
      });
    }

    if (conf.stacc_link) {
      var stacc_anc;
      if (['all', 'mypixiv', 'favorite', 'self'].indexOf(conf.stacc_link) < 0) {
        alert('conf.stacc_link: invalid value - ' + conf.stacc_link);
      } else if ((stacc_anc = $x('//div[@id="nav"]/ul/li/a[contains(@href, "/stacc")]'))) {
        if (conf.stacc_link === 'all') {
          stacc_anc.href = '/stacc/p/all';
        } else {
          stacc_anc.href = '/stacc/my/home/' + conf.stacc_link + '/all';
        }
      }
    }

    if (conf.fast_user_bookmark && window.pixiv && window.pixiv.Favorite) {
      (function() {
        var _open = window.pixiv.Favorite.prototype.open;
        window.pixiv.Favorite.prototype.open = function() {
          var btn = $('favorite-button');
          var form = $x('//*[@id="favorite-preference"]//form[contains(@action, "bookmark_add.php")]');
          var restrict = $xa('.//input[@name="restrict"]', form);
          if (btn && form && restrict.length === 2) {
            each(restrict, function(r) { r.checked = r.value === conf.fast_user_bookmark - 1; });
            window.jQuery.post(
              form.getAttribute('action'),
              window.jQuery(form).serialize(),
              function(data) {
                var re;
                if (/<div[^>]+class=\"[^\"]*one_complete_title[^\"]*\"[^>]*>[\r\n]*<a[^>]+href=\"member\.php\?id=[^>]*>/i.test(data)) {
                  window.jQuery('#favorite-button')
                    .addClass('added')
                    .attr('title', '\u304a\u6c17\u306b\u5165\u308a\u3067\u3059');
                  window.jQuery('form', this.preference)
                    .attr('action', '/bookmark_setting.php')
                    .find('div.action').append('<input type="button" value=\"\u304a\u6c17\u306b\u5165\u308a\u89e3\u9664\" class="button remove"/>')
                    .find('input[name="mode"]').remove();
                  btn.style.opacity = '1';
                } else if ((re = /<span[^>]+class=\"[^\"]*error[^\"]*\"[^>]*>(.+)<\/span>/i.exec(data))) {
                  alert(re[1]);
                } else {
                  alert('Error!');
                }
              }).error(function() {
                alert('Error!');
              });
            btn.style.opacity = '0.2';
          } else {
            _open.apply(this, Array.prototype.slice.apply(arguments));
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

  function init_js() {
    // rate
    defineMagicFunction('countup_rating', function(real, othis, score) {
      var msg = "\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n%s\u70b9".replace('%s', String(score));
      if (conf.rate_confirm && !confirm(msg)) return;
      if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);
      real.apply(othis, Array.prototype.slice.apply(arguments, [2]));
    });
    defineMagicFunction('send_quality_rating', function(real, othis) {
      if (Popup.instance && Popup.instance.item) uncache(Popup.instance.item.medium);

      var _ajax = window.jQuery.ajax;
      window.jQuery.ajax = function(obj) {
        var othis = this;
        var success = obj.success;
        obj.success = function() {
          try {
            success.apply(othis, Array.prototype.slice.apply(arguments));
            if (Popup.instance && Popup.instance.has_qrate) {
              if (window.jQuery('#rating').is(':visible')) window.rating_ef2();
              each(
                $xa('.//div[@id="result"]/div[starts-with(@id, "qr_item")]', Popup.instance.rating),
                function(item) {
                  var re;
                  if ((re = /^qr_item(\d+)$/.exec(item.id)) && (parseInt(re[1]) & 1)) {
                    var value = $x('following-sibling::div', item);
                    if (value && !value.hasAttribute('id')) value.setAttribute('highlight', '');
                  }
                });
            }
          } catch(ex) {
            alert('Error!\nCheck referer setting.');
            throw ex;
          }
        };
        return _ajax.apply(this, [obj]);
      };
      real.apply(othis, Array.prototype.slice.apply(arguments, [2]));
      window.jQuery.ajax = _ajax;
    });
    defineMagicFunction('rating_ef', function(real, othis) {
      window.jQuery('#quality_rating').slideDown(200, after_show);
      function after_show() {
        var f = $x('.//input[@id="qr_kw1"]', Popup.instance ? Popup.instance.rating : window.document.body);
        if (f) f.focus();
      }
    });
    defineMagicFunction('rating_ef2', function(real, othis) {
      if (Popup.is_qrate_button(window.document.activeElement)) window.document.activeElement.blur();
      real.apply(othis, Array.prototype.slice.apply(arguments, [2]));
    });
  }

  function init_pixplus() {
    window.document.body.setAttribute('pixplus', '');

    each($xa('//a[contains(@href, "jump.php")]'), function(anc) {
      var re;
      if ((re = /^(?:http:\/\/www\.pixiv\.net)?\/?jump\.php\?(.*)$/.exec(anc.href))) {
        var url = re[1];
        if (/^\w+%3a%2f%2f/i.test(url)) url = decodeURIComponent(url);
        anc.href = url;
      }
    });

    pp.load_css(pp.url.css.bookmark_add);

    function mod_rpc_url(url) {
      if (url === './rpc_rating.php') {
        return '/rpc_rating.php';
      } else if (url === './rpc_tag_edit.php') {
        return '/rpc_tag_edit.php';
      }
      return url;
    }
    function jq_onload() {
      window.jQuery.noConflict();
      if (/^\/stacc\//.test(window.location.pathname)) {
        var _ajax = window.jQuery.ajax;
        window.jQuery.ajax = function(obj) {
          if (obj) obj.url = mod_rpc_url(obj.url);
          return _ajax.apply(this, Array.prototype.slice.apply(arguments));
        };
      }
      init_pixplus_real();
    }
    function pt_onload() {
      var _request = window.Ajax.Request.prototype.request;
      window.Ajax.Request.prototype.request = function(url) {
        url = mod_rpc_url(url);
        return _request.apply(this, [url].concat(Array.prototype.slice.apply(arguments, [1])));
      };
    }

    (function($js) {
      if (!$x('//script[contains(@src, "/rating_manga")]')) {
        $js = $js.script(pp.url.js.rating);
      }
      return $js;
    })($js
       .script(pp.url.js.jquery)
       .wait(jq_onload)
       .script(pp.url.js.prototypejs)
       .wait(/^\/stacc\//.test(window.location.pathname) ? pt_onload : null)
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
      .script(pp.url.js.tag_edit)
      .wait(init_js);

    setTimeout(Floater.init, 100);
  }

  /* __LIBRARY_BEGIN__ */

  var browser = {
    opera:  false,
    gecko:  false,
    webkit: false
  };
  if (typeof window !== 'undefined') {
    browser[window.opera
            ? 'opera'
            : (window.getMatchedCSSRules
               ? 'webkit'
               : 'gecko')] = true;
  }

  function Signal(def) {
    this.def = def;
    this.funcs = [];
    this.id = 1;
    return this;
  }

  Signal.prototype = {
    connect: function(func, async) {
      var conn = new Signal.Connection(this, this.id);
      var timer, last_args;
      this.funcs.push({
        id: this.id,
        cb: function() {
          last_args = [this, Array.prototype.slice.apply(arguments)];
          if (async) {
            if (timer) return null;
            timer = setTimeout(function() {
              timer = null;
              func.apply(last_args[0], last_args[1]);
            }, typeof async === 'number' ? async : 40);
          } else {
            return func.apply(this, last_args[1]);
          }
          return null;
        },
        conn: conn
      });
      ++this.id;
      return conn;
    },

    disconnect: function(id) {
      each(this.funcs, function(func, idx) {
        if (func.id === id) {
          this.funcs[idx].conn.disconnected = true;
          this.funcs.splice(idx, 1);
          return true;
        }
        return false;
      }, this);
    },

    emit: function(inst) {
      var args = Array.prototype.slice.apply(arguments, [1]);
      var res;
      for(var i = 0; i < this.funcs.length; ++i) {
        res = this.funcs[i].cb.apply(inst, args);
        if (res) return res;
      }
      if (this.def && (res = this.def.apply(inst, args))) return res;
      return false;
    }
  };

  Signal.Connection = function(signal, id) {
    this.signal = signal;
    this.id = id;
    this.disconnected = false;
  };

  Signal.Connection.prototype = {
    disconnect: function() {
      if (!this.disconnected) this.signal.disconnect(this.id);
    }
  };

  function $ev(ctx, args) {
    var opts = args || {};
    var obj = {
      ctx: ctx,

      click: function(func) {
        return listen('click', function(ev, conn) {
          if (ev.button !== 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) return false;
          return func.call(this, ev, conn);
        });
      },

      key: function(func) {
        var conn = listen('keypress', function(ev, conn) {
          var key = $ev.parse_key_event(ev);
          return func.call(this, ev, conn, key[1]);
        });
        if (browser.webkit) {
          conn = listen('keydown', function(ev, conn) {
            var key = $ev.parse_key_event(ev);
            if (key[0] === 4) {
              return func.call(this, ev, conn, key[1]);
            } else {
              return false;
            }
          }, conn);
        }
        return conn;
      },

      scroll: function(func) {
        return listen('scroll', func);
      },

      resize: function(func) {
        return listen('resize', func);
      },

      submit: function(func) {
        return listen('submit', func);
      },

      change: function(func) {
        var name;
        if (check_node(obj.ctx, 'Input')) {
          if (!obj.ctx || /^(?:text|search|tel|url|email|password|number)$/i.test(obj.ctx.type)) {
            name = 'input';
          } else {
            name = 'change';
          }
        } else if (check_node(obj.ctx, 'TextArea')) {
          name = 'input';
        } else if (check_node(obj.ctx, 'Select')) {
          name = 'change';
        } else {
          alert('[bug]unknown type');
        }
        return listen(name, func);
      },

      hover: function(hover, leave) {
        var conn = listen('mouseover', hover);
        return listen('mouseout', leave, conn);
      },

      focus: function(focus, blur) {
        var conn = listen('focus', focus);
        if (blur) conn = listen('blur', blur, conn);
        return conn;
      },

      listen: function(name, func) {
        if (name instanceof Array) {
          var conn;
          each(name, function(name) {
            conn = listen(name, func, conn);
          });
          return conn;
        } else {
          return listen(name, func);
        }
      }
    };

    function listen(name, func, conn) {
      if (!conn) conn = new $ev.Connection(ctx);
      var timer, ev_last;
      var listener = function(ev) {
        if (conn.disconnected) return;
        if (opts.async) {
          if (timer) {
            ev_last = ev;
          } else {
            ev_last = ev;
            timer = setTimeout(function() {
              if (conn.disconnected) return;
              timer = null;
              func.call(opts.ctx || ctx, ev_last, conn);
            }, typeof opts.async === 'number' ? opts.async : 40);
          }
        } else {
          if (func.call(opts.ctx || ctx, ev, conn)) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      };
      obj.ctx.addEventListener(name, listener, !!opts.capture);
      conn.listeners.push([name, listener, !!opts.capture]);
      return conn;
    }
    return obj;
  };

  $ev.BIT_OFFSET_CHAR = 0;
  $ev.BIT_OFFSET_SPEC = 8;
  $ev.BIT_OFFSET_MODS = 24;
  $ev.key_map_code = { };
  $ev.key_map_name = { };
  $ev.key_map_encode = { };
  $ev.key_map_decode = { };
  each([
    {code: 8,   name: 'Backspace'},
    {code: 9,   name: 'Tab'},
    {code: 13,  name: 'Enter'},
    {code: 27,  name: 'Escape'},
    {code: 32,  name: 'Space'},
    {code: 33,  name: 'PageUp'},
    {code: 34,  name: 'PageDown'},
    {code: 35,  name: 'End'},
    {code: 36,  name: 'Home'},
    {code: 37,  name: 'Left'},
    {code: 38,  name: 'Up'},
    {code: 39,  name: 'Right'},
    {code: 40,  name: 'Down'},
    {code: 45,  name: 'Insert'},
    {code: 46,  name: 'Delete'},
    {code: 112, name: 'F1'}, {code: 113, name: 'F2'}, {code: 114, name: 'F3'}, {code: 115, name: 'F4'},
    {code: 116, name: 'F5'}, {code: 117, name: 'F6'}, {code: 118, name: 'F7'}, {code: 119, name: 'F8'},
    {code: 120, name: 'F9'}, {code: 121, name: 'F10'}, {code: 122, name: 'F11'}, {code: 123, name: 'F12'}
  ], function(entry) {
    $ev['KEY_' + entry.name.toUpperCase()] = entry.name;
    $ev.key_map_code[entry.code] = entry.name;
    $ev.key_map_name[entry.name] = entry.code;
  });
  each([['+', 'plus'], [',', 'comma'], [' ', 'Space'], ['\t', 'Tab']], function(entry) {
    $ev.key_map_encode[entry[0]] = entry[1];
    $ev.key_map_decode[entry[1]] = entry[0];
  });

  $ev.parse_key_event = function(ev) {
    var c = ev.keyCode || ev.charCode;
    var role = 0, keys = [], key;
    if (ev.ctrlKey)  keys.push('Control');
    if (ev.shiftKey) keys.push('Shift');
    if (ev.altKey)   keys.push('Alt');
    if (ev.metaKey)  keys.push('Meta');
    if (ev.keyIdentifier) {
      if (ev.keyIdentifier.lastIndexOf('U+', 0) === 0) {
        c = parseInt(ev.keyIdentifier.substring(2), 16);
        if (c < 0x20) {
          key = $ev.key_map_code[c] || ('_c' + String(c));
          role = 4;
        } else if (c === 0x7f) {
          key = $ev.KEY_DELETE;
          role = 4;
        } else {
          key = lc(String.fromCharCode(c));
          role = 3;
        }
        keys.push($ev.key_map_encode[key] || key);
      } else {
        keys.push(ev.keyIdentifier);
        role = 4;
      }
      keys = unique(keys); // for chrome10
    } else if (c === ev.which && c > 0x20 && c < 0x7f) {
      role = 0;
      key = lc(String.fromCharCode(c));
      keys.push($ev.key_map_encode[key] || key);
    } else if ($ev.key_map_code[c]) {
      role = 1;
      keys.push($ev.key_map_code[c]);
    } else {
      role = 2;
      keys.push('_c' + String(c));
    }
    return [role, keys.join('+')];
  };

  /*
  $ev.key_to_code = function(key) {
    var code = 0;
    if (typeof key === 'string' || key instanceof String) {
      each(key.split('+'), function(key) {
        var c;
        key = $ev.key_map_decode[key] || key;
        if (key === 'Control') {
          code |= 1 << $ev.BIT_OFFSET_MODS;
        } else if (key === 'Shift') {
          code |= 1 << ($ev.BIT_OFFSET_MODS + 1);
        } else if (key === 'Alt') {
          code |= 1 << ($ev.BIT_OFFSET_MODS + 2);
        } else if (key === 'Meta') {
          code |= 1 << ($ev.BIT_OFFSET_MODS + 3);
        } else if ($ev.key_map_name[key]) {
          code |= $ev.key_map_name[key] << $ev.BIT_OFFSET_SPEC;
        } else if (key.length === 1) {
          c = key.charCodeAt(0);
          if (c > 0x20 && c < 0x7f) {
            code |= c;
          } else {
            alert('invalid key - ' + key);
          }
        } else if (key.length > 2 && key.lastIndexOf('_c', 0) === 0) {
          c = parseInt(key.substring(2));
          if (c < (1 << ($ev.BIT_OFFSET_MODS - $ev.BIT_OFFSET_SPEC))) {
            code |= c << $ev.BIT_OFFSET_SPEC;
          } else {
            alert('invalid key - ' + key);
          }
        } else {
          alert('unknown key name - ' + key);
        }
      });
    } else {
      var c = key.keyCode || key.charCode, key;
      if (key.ctrlKey)  code |= 1 << $ev.BIT_OFFSET_MODS;
      if (key.shiftKey) code |= 1 << ($ev.BIT_OFFSET_MODS + 1);
      if (key.altKey)   code |= 1 << ($ev.BIT_OFFSET_MODS + 2);
      if (key.metaKey)  code |= 1 << ($ev.BIT_OFFSET_MODS + 3);
      if (c === key.which && c > 0x20 && c < 0x7f) {
        if (c >= 0x41 && c <= 0x5a) c += 0x20; // toLowerCase()
        code |= c;
      } else if (c <= (1 << ($ev.BIT_OFFSET_MODS - $ev.BIT_OFFSET_SPEC))) {
        code |= c << $ev.BIT_OFFSET_SPEC;
      } else {
        alert('invalid key code - ' + c);
      }
    }
    return code;
  };
   */

  $ev.key_check = function(ev, key) {
    if (!key) return false;
    if (key.indexOf(',') >= 0) {
      var keys = key.split(',');
      for(var i = 0; i < keys.length; ++i) {
        if ($ev.key_check(ev, keys[i])) return true;
      }
      return false;
    }
    return $ev.parse_key_event(ev)[1].split('+').sort().join('+') === key.split('+').sort().join('+');
  };

  $ev.Connection = function(ctx) {
    this.ctx = ctx;
    this.disconnected = false;
    this.listeners = [];
  };

  $ev.Connection.prototype = {
    disconnect: function() {
      this.disconnected = true;
      each(this.listeners, function(item) {
        this.ctx.removeEventListener(item[0], item[1], item[2]);
      }, this);
    }
  };

  function $ef(ctx) {
    var obj = {
      ctx: ctx,
      style: { },

      show: function(func, opts) {
        obj.ctx.style.display = '';
        save_style({overflow: 'hidden', width: obj.ctx.clientWidth + 'px'});
        animate({style: [{name: 'height', suffix: 'px', from: 0, to: obj.ctx.clientHeight, floor: true},
                         {name: 'opacity', from: 0, to: 1}]}, func, opts);
      },
      hide: function(func, opts) {
        save_style({overflow: 'hidden', width: obj.ctx.clientWidth + 'px'});
        animate({style: [{name: 'height', suffix: 'px', from: obj.ctx.clientHeight, to: 0, floor: true},
                         {name: 'opacity', from: 1, to: 0}]},
                function() {
                  obj.ctx.style.display = 'none';
                  if (func) func.call(this);
                }, opts);
      },
      resize: function(func, opts) {
        save_style({overflow: 'hidden', width: obj.ctx.clientWidth + 'px'});
        animate({style: [{name: 'height', suffix: 'px', from: opts.from, to: obj.ctx.clientHeight, floor: true}]},
                func, opts);
      },
      fade_in: function(func, opts) {
        obj.ctx.style.display = '';
        animate({style: [{name: 'opacity', from: 0, to: 1}]}, func, opts);
      },
      fade_out: function(func, opts) {
        animate({style: [{name: 'opacity', from: 1, to: 0}]}, function() {
          obj.ctx.style.display = 'none';
          if (func) func.call(this);
        }, opts);
      }
    };

    function save_style(dic) {
      obj.style = { };
      for(var key in dic) {
        obj.style[key] = obj.ctx.style[key];
        obj.ctx.style[key] = dic[key] || '';
      }
    }
    function restore_style() {
      if (!obj.style) return;
      for(var key in obj.style) {
        obj.ctx.style[key] = obj.style[key];
      }
      obj.style = { };
    }
    function animate(args, cb_end, opts) {
      if (opts) for(var key in opts) args[key] = opts[key];
      if (conf.disable_effect) {
        apply(args, 0);
        end(args, cb_end);
        return;
      }
      obj.duration = args.duration || 200;
      obj.start = Date.now();
      obj.end = obj.start + obj.duration;
      apply(args, 0);
      obj.timer = window.setInterval(function() {
        var now = Date.now();
        if (now >= obj.end) {
          window.clearInterval(obj.timer);
          end(args, cb_end);
        } else {
          var pos = (now - obj.start) / obj.duration;
          apply(args, pos);
        }
      }, args.interval || 0);
    }
    function end(args, cb_end) {
      apply(args, 1);
      restore_style();
      if (cb_end) cb_end.call(obj.ctx);
    }
    function apply(args, pos) {
      if (args.style) {
        each(args.style, function(entry) {
          var value = entry.from + ((entry.to - entry.from) * pos);
          if (entry.floor) value = Math.floor(value);
          if (entry.suffix) value += entry.suffix;
          if (pos === 0 && !obj.style[entry.name]) obj.style[entry.name] = obj.ctx.style[entry.name];
          obj.ctx.style[entry.name] = value;
        });
      }
    }
    return obj;
  }

  function $(id, elem) {
    return window.document.getElementById(id);
  }
  function $t(tag, elem) {
    return (elem || window.document).getElementsByTagName(tag);
  }
  function $c(tag, parent, opts) {
    var elem = window.document.createElement(tag);
    if (parent) parent.appendChild(elem);
    if (opts) {
      for(var key in opts) {
        if (key.lastIndexOf('a:', 0) === 0) {
          elem.setAttribute(key.substring(2), opts[key]);
        } else {
          var obj = elem, terms = ($c.map[key] || key).split('.');
          for(var i = 0; i < terms.length - 1; ++i) {
            obj = obj[terms[i]];
          }
          obj[terms[terms.length - 1]] = opts[key];
        }
      }
    }
    return elem;
  }
  $c.map = {
    cls:  'className',
    text: 'textContent',
    html: 'innerHTML',
    css:  'style.cssText'
  };
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

  function is_ancestor(ancestor, elem) {
    while(elem) {
      // Firefox3.6: elem === ancestor is always false
      if (elem == ancestor) return true;
      elem = elem.parentNode;
    }
    return false;
  }

  function check_node(node, name) {
    // for Firefox3.6
    return (node instanceof (typeof safeWindow === 'undefined' ? window : safeWindow)['HTML' + name + 'Element'] ||
            (typeof Components !== 'undefined' &&
             node instanceof Components.interfaces['nsIDOMHTML' + name + 'Element']));
  }

  function each(list, func, obj) {
    if (!list) return list;
    for(var i = 0; i < list.length; ++i) {
      if (func.call(obj || list, list[i], i)) break;
    }
    return list;
  }

  function unique(list) {
    var ret = [];
    for(var i = 0; i < list.length; ++i) {
      var match = false;
      for(var j = 0; j < ret.length; ++j) {
        if (ret[j] === list[i]) {
          match = true;
          break;
        }
      }
      if (!match) ret.push(list[i]);
    }
    return ret;
  }

  function find(list, func, obj) {
    for(var i = 0; i < list.length; ++i) {
      if (func.call(obj || list, list[i], i)) return list[i];
    }
    return null;
  }

  function bind(func, obj) {
    var args = Array.prototype.slice.apply(arguments, [2]);
    return function() {
      return func.apply(obj || window, args.concat(Array.prototype.slice.apply(arguments)));
    };
  }

  function lc(str) {
    return (str || '').toLowerCase();
  }

  function trim(str) {
    return str.replace(/(?:^[\x01-\x20\u3000]+|[\x01-\x20\u3000]+$)/g, '');
  }

  /* __LIBRARY_END__ */

  function LoaderBase(cb_load, cb_error) {
    this.stopped = false;
    this.cb_load = cb_load;
    this.cb_error = cb_error;
  }
  LoaderBase.prototype = {
    complete: function() {
      if (!this.stopped && this.cb_load) this.cb_load.call(this);
      this.stopped = true;
    },

    error: function(msg) {
      if (!this.stopped && this.cb_error) this.cb_error.call(this, msg);
      this.stopped = true;
    },

    cancel: function() {
      this.stopped = true;
    }
  };

  function GalleryItem(url, thumb, caption, prev, gallery) {
    var id = parseInt(/[\?&]illust_id=(\d+)/.exec(url)[1]);
    if (gallery && gallery.args.skip_dups && prev && id === prev.id) prev = prev.prev;

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
    this.limited = thumb && pp.url.limit_thumb.indexOf(thumb.src) >= 0 ? true : false;

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

  GalleryItem.prototype = {
    parse_img_url: function(url) {
      // 冒頭メモ参照
      var re;
      if ((re = /^(http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+\/\d+(?:_[0-9a-f]{10})?)(?:_[sm]|_100|_p\d+)?(\.\w+)(?:\?.*)?$/.exec(url))) {
        this.img_url_base = re[1];
        this.img_url_ext  = re[2];
      }
    },
    popup: function() {
      Popup.run(this);
    },
    preload: function() {
      if (conf.popup.preload) {
        if (!this.loaded) {
          this.loaded = true;
          new Popup.Loader(
            this,
            (conf.popup.auto_manga_p && (conf.popup.auto_manga & 16)
             ? bind(function() {
               new Popup.MangaLoader(this, 0);
             }, this)
             : null));
        }
      }
    }
  };

  function Gallery(args, filter_col, filter) {
    this.args = args;
    this.args.xpath_cap = this.args.xpath_cap || './ul/li/a[img and contains(@href, "mode=medium")]/following-sibling::text()[1]';
    this.args.xpath_tmb = this.args.xpath_tmb || 'preceding-sibling::a[contains(@href, "mode=medium")]/img';
    this.filter_col = filter_col;
    this.filter = filter;

    this.items          = [];
    this.idmap          = {};
    this.first          = null;
    this.first_limited  = null;
    this.last           = null;
    this.last_limited   = null;
    this.prev_dups      = [];
    this.page_item      = 0;
    this.page_col       = 0;

    this.onadditem = new Signal();

    if (this.args.xpath_col) {
      this.detect_new_collection();
      //if (this.page_col === 0) throw 1;
      $ev(window.document.body, {async: true}).listen('DOMNodeInserted', bind(Gallery.prototype.detect_new_collection, this));
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

  Gallery.prototype = {
    detect_new_collection: function() {
      var self = this;
      each($xa(this.args.xpath_col, this.args.root), function(col) {
        if (!col.hasAttribute('pixplus_loaded')) {
          self.add_collection(col);
        }
      });
    },
    add_collection: function(col) {
      if (this.filter_col) this.filter_col(col);
      var elements = $xa(this.args.thumb_only ? this.args.xpath_tmb : this.args.xpath_cap, col);
      if (!elements.length) return;
      log('collection detected - ' + elements.length);
      col.setAttribute('pixplus_loaded', 'true');

      var self = this;
      var prev = this.last;
      var prev_limited = this.last_limited;
      this.page_item = 0;
      ++this.page_col;
      each(elements, function(elem, cnt) {
        var thumb, cap;
        if (self.args.thumb_only) {
          thumb = elem;
        } else {
          thumb = $x(self.args.xpath_tmb, elem);
          cap = elem;
        }
        if ((!self.args.allow_nothumb || cnt < self.args.allow_nothumb) && !thumb) return;

        var url = (self.args.get_url || Gallery.get_url)(cap, thumb);
        if (!url || !/[\?&]illust_id=(\d+)/.test(url)) return;

        if (cap) {
          if (cap.nodeType === 3) {
            var new_caption = $c('a', null, {href: url, text: trim(cap.nodeValue), 'a:nopopup': ''});
            cap.parentNode.replaceChild(new_caption, cap);
            cap = new_caption;
          } else if (check_node(cap, 'Anchor')) {
            cap.setAttribute('nopopup', '');
          } else if (!$x('ancestor::a', cap)) {
            if (cap.childNodes.length === 1 && cap.firstChild.nodeType === 3) {
              cap.innerHTML = '<a href="' + url + '" nopopup>' + cap.innerHTML + '</a>';
            }
          }
        }

        var item = new GalleryItem(url, thumb, cap, prev, self);

        var pbtn = thumb;
        if (!thumb && cap) {
          /*
          pbtn = $c('a');
          pbtn.href = url;
          pbtn.textContent = '\u25a0';
          pbtn.style.marginRight = '4px';
          cap.parentNode.insertBefore(pbtn, cap);
          item.added_popup_button = pbtn;
           */
        }
        if (pbtn) {
          $ev($x('ancestor-or-self::a', pbtn)).click(function() {
            // for HaH bookmarklet
            if (window.opera && window.document.activeElement === this) this.blur();
            Popup.run(item);
            return true;
          });
        }

        if (!self.first_limited) self.first_limited = item;
        if (!self.first && !item.limited) self.first = item;
        if (self.filter) self.filter(item);

        if (self.args.skip_dups && self.idmap[item.id]) {
          self.prev_dups.push(item);
        } else {
          if (!item.limited) {
            if (prev) prev.next = item;
            if (prev_limited) prev_limited.next = item;
            if (self.prev_dups.length) {
              each(self.prev_dups, function(p) { p.next = item; });
              self.prev_dups = [];
            }
            self.last = prev = item;
          }
          self.last_limited = prev_limited = item;
          self.items.push(item);
          self.idmap[item.id] = item;
          self.onadditem.emit(self, item);
        }
      });
    }
  };

  function Popup(item, manga_page) {
    this.root_div              = $c('div', null, {id: 'pp-popup'});
    this.header                = $c('div', this.root_div, {id: 'pp-header'});
    this.title_div             = $c('div', this.header, {id: 'pp-title_wrapper'});
    this.title                 = $c('a', this.title_div, {id: 'pp-title', 'a:nopopup': ''});
    this.header_right          = $c('span', this.title_div, {id: 'pp-right'});
    this.status                = $c('span', this.header_right, {id: 'pp-status', css: 'display:none'});
    this.manga_btn             = $c('a', this.header_right, {id: 'pp-manga-btn'});
    $ev(this.manga_btn).click(bind(function() { this.toggle_manga_mode(); return true; }, this));
    this.res_btn               = Popup.create_button('[R]', this.header_right, 'pp-res-btn');
    this.comments_btn          = Popup.create_button('[C]', this.header_right, 'pp-comments-btn',
                                                     bind(this.toggle_viewer_comments, this));
    this.bm_btn                = Popup.create_button('[B]', this.header_right, 'pp-bm-btn',
                                                     bind(this.toggle_bookmark_edit, this));
    //this.help_btn              = Popup.create_button('[?]', this.header_right, 'pp-help-btn', show_help);
    this.caption               = $c('div', this.header, {id: 'pp-caption'});
    this.comment_wrap          = $c('div', this.caption, {id: 'pp-comment-wrap'});
    this.comment               = $c('div', this.comment_wrap, {id: 'pp-comment'});
    this.viewer_comments       = $c('div', this.comment_wrap, {id: 'pp-viewer-comments'});
    this.viewer_comments_w     = $c('div', this.viewer_comments);
    this.viewer_comments_c     = $c('div', this.viewer_comments_w);
    this.viewer_comments_a     = $c('div', this.viewer_comments_w, {id: 'one_comment_area'});
    this.tags                  = $c('div', this.caption, {id: 'tag_area'});
    this.rating                = $c('div', this.caption, {id: 'pp-rating', cls: 'pp-separator works_area'});
    this.post_cap              = $c('div', this.caption, {id: 'pp-info', cls: 'pp-separator'});
    this.a_img                 = $c('img', this.post_cap, {id: 'pp-author-img'});
    this.a_status              = $c('span', this.post_cap, {id: 'pp-author-status'});
    this.date_wrap             = $c('span', this.post_cap, {id: 'pp-date-wrap'});
    this.date                  = $c('span', this.date_wrap, {id: 'pp-date'});
    this.date_repost           = $c('span', this.date_wrap, {id: 'pp-date-repost'});
    this.info                  = $c('span', this.post_cap, {id: 'pp-info-wrap'});
    this.info_size             = $c('span', this.info, {id: 'pp-info-size'});
    this.info_tools            = $c('span', this.info, {id: 'pp-info-tools'});
    this.author                = $c('span', this.post_cap, {id: 'pp-author'});
    this.a_profile             = $c('a', this.author);
    this.a_illust              = $c('a', this.author, {text: "\u4f5c\u54c1"});
    this.a_bookmark            = $c('a', this.author, {text: "\u30d6\u30c3\u30af\u30de\u30fc\u30af"});
    this.a_stacc               = $c('a', this.author, {text: "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9"});
    this.bm_edit               = $c('div', this.root_div, {id: 'pp-bm-edit'});
    this.tag_edit              = $c('div', this.root_div, {id: 'tag_edit'});
    this.img_div               = $c('div', this.root_div, {id: 'pp-img-div'});
    if (conf.popup.overlay_control > 0) {
      this.olc_prev            = $c('span', this.img_div, {id: 'pp-olc-prev', cls: 'pp-olc'});
      this.olc_next            = $c('span', this.img_div, {id: 'pp-olc-next', cls: 'pp-olc'});
      $ev(this.olc_prev).click(bind(function() {
        this.prev(false, true);
        return true;
      }, this));
      $ev(this.olc_next).click(bind(function() {
        this.next(false, true);
        return true;
      }, this));
    }
    this.error_div = $c('div', this.img_div, {id: 'pp-error-message'});

    this.init_display();
    this.init_comments();

    this.images = { };
    this.bm_loading = false;
    this.rating_enabled = false;
    this.viewer_comments_enabled = false;
    this.expand_header = false;
    this.tag_edit_enabled = false;
    this.tag_loading = false;
    this.has_qrate = false;
    this.has_image_response = false;
    this.zoom_scale = 1;

    var self = this;
    this.manga = {
      usable:      false,
      enabled:     false,
      page:        -1,
      pages:       [],
      page_count:  -1,
      page_inc:    1,
      page_dec:    -1,
      preload_map: {},
      init: function() {
        this.usable      = false;
        this.enabled     = false;
        this.page        = -1;
        this.pages       = [];
        this.page_count  = -1;
        this.page_inc    = 1;
        this.page_dec    = -1;
        this.preload_map = {};
      },
      preload: function() {
        if (conf.popup.preload) {
          var page = this.page + this.page_inc;
          if (page < this.page_count && !this.preload_map[page]) {
            new Popup.MangaLoader(self.item, page);
          }
        }
      }
    };

    $ev(this.img_div).click(bind(function(ev) {
      Popup.onclick.emit(this, ev);
      return true;
    }, this));
    $ev(this.viewer_comments).click(bind(function(ev) {
      var target = ev.target.wrappedJSObject || ev.target;
      if (target === this.viewer_comments ||
          target === this.viewer_comments_w) {
        this.toggle_viewer_comment_form();
        return true;
      }
      return false;
    }, this));
    $ev(this.tag_edit, {async: true}).listen('DOMNodeInserted', bind(function() {
      var end = $x('.//input[contains(@onclick, "endTagEdit")]', this.tag_edit);
      if (end) {
        end.setAttribute('onclick', '');
        end.onclick = '';
        $ev(end).click(bind(function() {
          this.toggle_tag_edit();
          return true;
        }, this));
      }
    }, this));

    Popup.oncreate.emit(this, item, manga_page);
  }

  Popup._keypress = function(ev, conn, key) {
    if (!Popup.stop_key) return Popup.instance.keypress(ev, key);
    return false;
  };
  Popup._locate = function() {
    Popup.instance.locate();
  };
  Popup.set_event_handler = function() {
    Popup.ev_conn_key = $ev(window, {capture: conf.debug}).key(Popup._keypress);
    window.addEventListener('resize', Popup._locate, false);
  };
  Popup.unset_event_handler = function() {
    Popup.ev_conn_key.disconnect();
    window.removeEventListener('resize', Popup._locate, false);
  };

  Popup.oncreate = new Signal(function(item, manga_page) {
    //window.document.body.insertBefore(this.root_div, window.document.body.firstChild);
    window.document.body.appendChild(this.root_div);
    this.locate();
    this.set(item, false, false, false, typeof manga_page === 'number' ? manga_page : -1);
    Popup.set_event_handler();
  });
  Popup.onsetitem = new Signal();
  Popup.onload = new Signal();
  Popup.onkeypress = new Signal(function(ev, key) {
    function sel_qr(prev) {
      var node = prev ? ev.qrate.previousSibling : ev.qrate.nextSibling;
      if (Popup.is_qrate_button(node)) node.focus();
    }
    return (function() {
      for(var i = 0; i < arguments.length; ++i) {
        var map = arguments[i];
        if (!map.run) continue;
        for(var j = 0; j < map.map.length; ++j) {
          var entry = map.map[j];
          if ($ev.key_check(ev, map.map[j].k)) {
            entry.f.apply(entry.ctx || map.ctx || this, entry.a || []);
            return true;
          }
        }
        if (map.stop) break;
      }
      return false;
    }).call(this, {
      run: this.is_bookmark_editing(),
      stop: true,
      ctx: this.bookmark_form,
      map: [
        {k: conf.key.popup_bookmark_submit, f: BookmarkForm.prototype.submit},
        {k: conf.key.popup_bookmark_end,    f: BookmarkForm.prototype.close}
      ]
    }, {
      run: this.is_tag_editing(),
      stop: true,
      map: [
        {k: conf.key.popup_tag_edit_end, f: this.toggle_tag_edit}
      ]
    }, {
      run: !!ev.qrate,
      map: [
        {k: conf.key.popup_qrate_select_prev, f: this.qrate_move_selection, a: [-1]},
        {k: conf.key.popup_qrate_select_next, f: this.qrate_move_selection, a: [1]},
        {k: conf.key.popup_qrate_submit,      f: this.qrate_submit},
        {k: conf.key.popup_qrate_end,         f: this.toggle_qrate}
      ]
    }, {
      run: !ev.qrate,
      map: [
        {k: conf.key.popup_qrate_start, f: this.toggle_qrate}
      ]
    }, {
      run: conf.popup.rate && conf.popup.rate_key,
      map: [
        {k: conf.key.popup_rate01, f: window.countup_rating, a: [1], ctx: window},
        {k: conf.key.popup_rate02, f: window.countup_rating, a: [2], ctx: window},
        {k: conf.key.popup_rate03, f: window.countup_rating, a: [3], ctx: window},
        {k: conf.key.popup_rate04, f: window.countup_rating, a: [4], ctx: window},
        {k: conf.key.popup_rate05, f: window.countup_rating, a: [5], ctx: window},
        {k: conf.key.popup_rate06, f: window.countup_rating, a: [6], ctx: window},
        {k: conf.key.popup_rate07, f: window.countup_rating, a: [7], ctx: window},
        {k: conf.key.popup_rate08, f: window.countup_rating, a: [8], ctx: window},
        {k: conf.key.popup_rate09, f: window.countup_rating, a: [9], ctx: window},
        {k: conf.key.popup_rate10, f: window.countup_rating, a: [10], ctx: window}
      ]
    }, {
      run: this.manga.enabled,
      map: [
        {k: conf.key.popup_manga_end, f: this.toggle_manga_mode},
      ]
    }, {
      run: !this.manga.enabled,
      map: [
        {k: conf.key.popup_manga_start, f: this.toggle_manga_mode},
      ]
    }, {
      run: true,
      map: [
        {k: conf.key.popup_prev,                 f: this.prev, a: [true]},
        {k: conf.key.popup_next,                 f: this.next, a: [true]},
        {k: conf.key.popup_prev_direction,       f: this.prev, a: [false, true]},
        {k: conf.key.popup_next_direction,       f: this.next, a: [false, true]},
        {k: conf.key.popup_caption_scroll_up,    f: this.scroll_caption, a: [-conf.popup.scroll_height]},
        {k: conf.key.popup_caption_scroll_down,  f: this.scroll_caption, a: [conf.popup.scroll_height]},
        {k: conf.key.popup_first,                f: this.first},
        {k: conf.key.popup_last,                 f: this.last},
        {k: conf.key.popup_close,                f: this.close},
        {k: conf.key.popup_open_profile,         f: this.open_author_profile},
        {k: conf.key.popup_open_illust,          f: this.open_author_illust},
        {k: conf.key.popup_open_bookmark,        f: this.open_author_bookmark},
        {k: conf.key.popup_open_staccfeed,       f: this.open_author_staccfeed},
        {k: conf.key.popup_open_response,        f: this.open_image_response},
        {k: conf.key.popup_bookmark_start,       f: this.toggle_bookmark_edit},
        {k: conf.key.popup_open_bookmark_detail, f: this.open_bookmark_detail},
        {k: conf.key.popup_open,                 f: this.open},
        {k: conf.key.popup_open_big,             f: this.open, a: [true]},
        {k: conf.key.popup_reload,               f: this.reload},
        {k: conf.key.popup_caption_toggle,       f: this.toggle_caption},
        {k: conf.key.popup_comment_toggle,       f: this.toggle_viewer_comments},
        {k: conf.key.popup_tag_edit_start,       f: this.toggle_tag_edit},
        {k: conf.key.popup_open_manga_thumbnail, f: this.open_manga_tb},
        {k: conf.key.popup_zoom_in,              f: this.set_zoom, a: [this.zoom_scale + 1]},
        {k: conf.key.popup_zoom_out,             f: this.set_zoom, a: [this.zoom_scale - 1]},
        {k: conf.key.popup_help,                 f: show_help}
      ]
    });
  });

  Popup.onclick = new Signal(function(ev) { this.close(); });
  Popup.onclose = new Signal(function() {
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
    var btn = $c('a', parent, {id: id, href: 'javascript:void(0)', text: text});
    if (cb_click) $ev(btn).click(function() {
      cb_click();
      return true;
    });
    return btn;
  };

  Popup.create_zoom_image = function(img, width, height, r_width, r_height) {
    /* security error
    var canvas = $c('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, width, height);
    for(var y = height - 1; y >= 0; --y) {
      for(var x = width - 1; x >= 0; --x) {
        for(var i = 0; i < 4; ++i) {
          var rx = x * r_width / width, ry = y * r_height / height;
          data[y * width * 4 + x * 4 + i] = data[ry * width * 4 + rx * 4 + i];
        }
      }
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
    */

    if (browser.opera) {
      var svg_img = window.document.createElementNS(XMLNS_SVG, 'image');
      svg_img.setAttribute('width', '100%');
      svg_img.setAttribute('height', '100%');
      svg_img.style.imageRendering = 'optimizeSpeed';
      svg_img.setAttributeNS(XMLNS_XLINK, 'xlink:href', img.src);
      var svg = window.document.createElementNS(XMLNS_SVG, 'svg');
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.appendChild(svg_img);
      return svg;
    } else {
      img = img.cloneNode(false);
      img.style.cssText = '';
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      if (browser.gecko) {
        img.style.imageRendering = 'optimizeSpeed';
      } else if (browser.webkit) {
        //img.style.imageRendering = '-webkit-crisp-edges';
      }
      return img;
    }
  };
  Popup.is_qrate_button = function(elem) {
    return !!elem && check_node(elem, 'Input') && /^qr_kw\d+$/.test(elem.id);
  };

  Popup.prototype = {
    init_display: function() {
      each([
        this.manga_btn,
        this.res_btn,
        this.bm_btn,
        this.comment,
        this.tags,
        this.rating,
        this.post_cap,
        this.a_img,
        this.author,
        this.a_stacc,
        this.bm_edit,
        this.tag_edit,
        this.img_div
      ], function(elem) {
        elem.style.display = 'none';
      });
    },
    init_comments: function(keep_form) {
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
    },
    set_status: function(msg) {
      this.status.textContent = msg;
      this.status.style.display = '';
      this.locate();
    },
    error: function(msg) {
      this.set_status('Error!');
      this.load_pre();
      if (msg) {
        this.root_div.className += ' pp-error';
        this.error_div.textContent = msg;
        this.locate();
        this.update_olc();
      }
    },
    complete: function() {
      this.status.style.display = 'none';
      this.root_div.className = this.root_div.className.replace(/ *pp-error */, ' ');
    },

    first: function() {
      if (this.manga.usable && this.manga.enabled) {
        this.set_manga_page(0);
      } else if (this.item.gallery) {
        this.set(this.item.gallery.first, true);
      }
    },
    last: function() {
      if (this.manga.usable && this.manga.enabled) {
        this.set_manga_page(this.manga.page_count - 1);
      } else if (this.item.gallery) {
        this.set(this.item.gallery.last, true);
      }
    },

    prev: function(close, no_auto) {
      if (this.manga.usable && this.manga.enabled) {
        var page = this.manga.page - this.manga.page_dec;
        if (page < 0 && (conf.popup.auto_manga & 16)) {
          this.manga.enabled = false;
          this.prev(close);
        } else {
          this.set_manga_page(page);
        }
      } else {
        var g = this.item.gallery;
        var r = !no_auto && conf.popup.reverse_p;
        var item = r ? this.item.next : this.item.prev;
        this.set(item, true, close);
      }
    },
    next: function(close, no_auto) {
      if (this.manga.usable) {
        if (this.manga.enabled) {
          var page = this.manga.page + this.manga.page_inc;
          if (page >= this.manga.page_count && (conf.popup.auto_manga & 16)) {
            this.manga.enabled = false;
            this.next(close);
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
      this.set(item, true, close);
    },

    set: function(item, scroll, close, reload, manga_page) {
      if (!item) {
        if (close) this.close();
        return;
      }
      if (this.loader) this.loader.cancel();
      if (!this.item && item.caption) {
        this.title.textContent = trim(item.caption.textContent);
        this.title.href = item.medium;
      }
      this.item = Popup.lastitem = item;
      this.init_manga_page = manga_page;

      Popup.onsetitem.emit(this, this.item);
      if (this.conn_g_add_item) {
        this.conn_g_add_item.disconnect();
        this.conn_g_add_item = null;
      }
      if (this.item.gallery) this.conn_g_add_item = this.item.gallery.onadditem.connect(function() { self.update_olc(); });

      if (item.limited && item.thumb) {
        this.load_pre(scroll);
        this.complete();
        this.caption.style.display = 'none';
        this.set_images([{image: item.thumb.cloneNode(false), url: item.thumb.src}], false);
        this.update_olc();
        Popup.onload.emit(this);
        if (this.item.prev) this.item.prev.preload();
        if (this.item.next) this.item.next.preload();
      } else {
        var self = this;
        this.set_status('Loading');
        this.loader = new Popup.Loader(
          this.item,
          function() { self.load(this, scroll); },
          function(msg) {
            self.error(msg);
          },
          reload);
      }
    },

    load_pre: function(scroll) {
      if (scroll) pp.lazy_scroll(this.item.thumb || this.item.caption);
      this.init_comments();
      this.manga.init();
      this.manga_btn.style.display = 'none';
      this.caption.style.display = '';
      this.bm_edit.innerHTML = '';
      this.bm_edit.style.display = 'none';
      this.tag_edit.innerHTML = '';
      this.tag_edit.style.display = 'none';
      this.expand_header = false;
    },
    load: function(loader, scroll) {
      var self = this, re;
      this.load_pre(scroll);
      this.complete();

      if (pp.rpc_usable) {
        var rpc_html = '';
        pp.rpc_state = 0;
        for(var id in pp.rpc_ids) {
          if ((re = new RegExp('(<div[^>]+id="' + id + '"[^>]*>[^<]+</div>)', 'i').exec(loader.text))) {
            rpc_html += re[1];
            pp.rpc_state |= pp.rpc_ids[id];
          }
        }
        pp.rpc_div.innerHTML = rpc_html;
      }

      var img_size, _title = 'Error!';
      this.info.style.display = '';
      this.info_tools.style.display = 'none';
      /* ツールは「&nbsp;」区切り
       * R-18やマイピク限定の場合は全角スペースを挟んでその旨表示
       */
      if ((re = /<div[^>]+class="works_data"[^>]*>[\r\n]*<p>([^\u3000]*).*?<\/p>[\r\n]*?<h3>(.*)<\/h3>/i.exec(loader.text))) {
        var tmp = re[1].split('\uff5c'), _date = tmp[0].split(' ')[0];
        _title = trim(re[2]);
        this.date.textContent = tmp[0];
        if ((re = /(\d{4}\u5e74\d{2}\u6708\d{2})\u65e5? (\d{2}:\d{2}) \u306b\u518d\u6295\u7a3f/.exec(loader.text))) {
          this.date_repost.textContent = (re[1] === _date ? '' : re[1] + '\u65e5 ') + re[2];
          this.date_repost.style.display = '';
        } else {
          this.date_repost.style.display = 'none';
        }
        if (tmp.length > 1 && (re = /(\d+)\u00d7(\d+)|(?:\u6f2b\u753b|Manga|\u6f2b\u756b) (\d+)P/.exec(tmp[1]))) {
          if (re[3]) {
            this.manga.page_count = parseInt(re[3]);
            this.manga.usable = this.manga.page_count > 0;
          } else {
            img_size = {width: parseInt(re[1]), height: parseInt(re[2])};
          }
        }
        if (tmp.length > 2) {
          // tools.php?tool=hoge
          var html = '';
          each(trim(tmp[2]).split('&nbsp;'), function(tool) {
            html += '<span><a href="/search.php?word=' + encodeURIComponent(tool) + '&s_mode=s_tag">' + tool + '</a></span>';
          });
          this.info_tools.innerHTML = html;
          this.info_tools.style.display = '';
        }
      }

      if (this.item.caption) {
        this.title.textContent = trim(this.item.caption.textContent);
      } else {
        this.title.innerHTML = _title || '(Empty title)';
      }
      this.title.href = this.item.medium;

      this.set_manga_button_text();
      this.manga_btn.style.display = this.manga.usable ? 'inline' : 'none';
      this.manga_btn.removeAttribute('enable');
      this.manga_btn.href = urlmode(this.item.medium, 'manga') + '#pp_manga_tb';

      if ((re = /<a\s+href=\"(\/member\.php\?id=(\d+))[^\"]*\"[^>]*><img\s+src=\"([^\"]+\.pixiv\.net\/[^\"]+)\"\s+alt=\"([^\"]+)\"[^>]*><\/a>/i.exec(loader.text))) {
        var a_status_class = '';
        this.a_img.src            = re[3];
        this.a_profile.href       = re[1];
        this.a_profile.innerHTML  = trim(re[4]) || '(Author)';
        this.a_illust.href        = '/member_illust.php?id=' + re[2];
        this.a_bookmark.href      = '/bookmark.php?id=' + re[2];
        if ((re = /<a[^>]+href=\"http:\/\/www\.pixiv\.net(\/stacc\/[^\/\"]+)\"/i.exec(loader.text))) {
          this.a_stacc.href = re[1];
          this.a_stacc.style.display = '';
        }
        if (conf.popup.author_status_icon) {
          if (/<a[^>]+id=\"mypixiv-button\"[^>]+class=\"[^\"]*added[^\"]*\"/i.test(loader.text)) {
            a_status_class = 'pixplus-flag';
          } else if (/<span[^>]+class=\"list_fav\">/i.test(loader.text)) {
            a_status_class = 'pixplus-heart';
          } else if (/<form[^>]+action=\"\/?bookmark_setting\.php\"[^>]*>/i.test(loader.text)) {
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
      if ((re = /<p[^>]+class=\"worksAlso\"><a[^>]+href=\"\/?(response\.php\?illust_id=(\d+))\">/i.exec(loader.text))) {
        this.has_image_response = true;
        this.res_btn.href = '/' + re[1];
        if (re[2] === this.item.id) {
          this.res_btn.removeAttribute('enable');
        } else {
          this.res_btn.setAttribute('enable', '');
        }
        this.res_btn.style.display = '';
      }

      if (/<a[^>]+href=\"[^\"]*bookmark_detail\.php\?/i.test(loader.text)) {
        this.bm_btn.setAttribute('enable', '');
      } else {
        this.bm_btn.removeAttribute('enable');
      }
      this.bm_btn.href = '/bookmark_add.php?type=illust&illust_id=' + this.item.id;
      this.bm_btn.style.display = '';

      this.comment.style.display = 'none';
      if ((re = /<p[^>]+class=\"works_caption\"[^>]*>(.*)<\/p>/i.exec(loader.text))) {
        if ((this.comment.innerHTML = edit_comment(re[1]))) this.comment.style.display = '';
      }

      this.tag_edit_enabled = false;
      this.tag_edit_btn = null;
      this.tags.style.display = 'none';
      if ((re = /<span[^>]+id=\"tags\"[^>]*>(.*)<\/span>/i.exec(loader.text))) {
        var html = '';
        each(re[1].replace(/\s*\n\s*/g, '').split('\u3000'), function(t) {
          t = trim(t);
          if (t) html += '<span>' + t.replace(/> </g, '><') + '</span>';
        });
        if (!/<a /i.test(html)) html = '';
        // タグ編集はrpc_i_id/rpc_u_id/rpc_e_idを要求
        if (pp.rpc_usable && rpc_chk(pp.rpc_req_tag) &&
            /<a[^>]+onclick="startTagEdit\(\)"/i.exec(loader.text)) {
          this.tag_edit_enabled = true;
        }
        if (html || this.tag_edit_enabled) {
          this.tags.innerHTML = (html || '').replace(/(<a[^>]+href=\")(tags\.php[^\"]*)/ig, '$1/$2');
          if (this.tag_edit_enabled) {
            this.tag_edit_btn = $c('a', this.tags, {id: 'pp-tag-edit-btn', href: '#', text: '[E]'});
            $ev(this.tag_edit_btn, {ctx: this}).click(function() {
              this.toggle_tag_edit();
              return true;
            });
          }
          this.tags.style.display = '';
        }
      }

      this.has_qrate = false;
      this.rating_enabled = false;
      this.rating.style.display = 'none';
      var re_rtv, re_rtc, re_rtt;
      //<h4>Views：<div style="display:inline;" id="jd_rtv">3495</div>　Rating Count：<div style="display:inline;" id="jd_rtc">211</div>　Ratings：<div style="display:inline;" id="jd_rtt">2091</div></h4>
      if (conf.popup.rate && pp.rpc_usable && rpc_chk(pp.rpc_req_rate) &&
          //(re_rtv = /<div[^>]+id=\"jd_rtv\"[^>]*>(\d+)<\/div>/i.exec(loader.text)) &&
          //(re_rtc = /<div[^>]+id=\"jd_rtc\"[^>]*>(\d+)<\/div>/i.exec(loader.text)) &&
          //(re_rtt = /<div[^>]+id=\"jd_rtt\"[^>]*>(\d+)<\/div>/i.exec(loader.text))) {
          (re = /(<div[^>]+id=\"unit\"[^>]*>)[\r\n]*<h\d>(.*)<\/h\d>/i.exec(loader.text))) {
        /*
         var html = '<div id="rating"><div id="unit"><h4>' +
         '<span>' + "\u95b2\u89a7\u6570: " + re_rtv[0] + '</span>' +
         '<span>' + "\u8a55\u4fa1\u56de\u6570: " + re_rtc[0] + '</span>' +
         '<span>' + "\u7dcf\u5408\u70b9: " + re_rtt[0] + '</span>';
         if ((re = /(<a[^>]+href=\")\/?(questionnaire_illust\.php[^>]+><img[^>]+><\/a>)/i.exec(loader.text))) {
         // add '/' for staccfeed
         html += '<span>' + re[1] + '/' + re[2] + '</span>';
         }
         html += '</h4>';
         */
        var html = '<div id="rating">' + re[1] + '<span>' + re[2].replace(/\uff1a/g, '').replace(/\u3000/g, '</span><span>') + '</span>';
        if ((re = /(<ul[^>]+class=\"unit-rating\"[^>]*>[\s\S]*?<\/ul>)/i.exec(loader.text))) html += re[1];
        html += '</div>';
        if (rpc_chk(pp.rpc_req_qrate)) {
          var re1 = /<h4[^>]+id=\"after_q_rating\"[^>]*>.*<\/h4>/i.exec(loader.text);
          if (re1 && (re = /(<div[^>]+id=\"quality_rating\"[^>]*>[\s\S]*?<\/div>)/i.exec(loader.text))) {
            html += re1[0] + '</div>' + re[1];
            this.has_qrate = true;
          } else if ((re1 = /<h4[^>]*><a[^>]+onClick=\"onOff\('result'\).*<\/h4>/i.exec(loader.text))) {
            if ((re = /(<div[^>+]id=\"result\"[\s\S]*?\n<\/div>)/i.exec(loader.text))) {
              html += re1[0] + '</div>' + re[1];
              this.has_qrate = true;
            }
          }
        }
        if (!this.has_qrate) html += '</div>';
        this.rating.innerHTML = html;
        this.rating.style.display = '';
        this.rating_enabled = true;

        var anc = $x('./div[@id="rating"]/h4/a', self.rating);
        if (anc && anc.getAttribute('onclick') === 'rating_ef4()') {
          anc.setAttribute('onclick', '');
          anc.onclick = '';
          $ev(anc).click(function() {
            var qr = $x('./div[@id="quality_rating"]', self.rating);
            window[qr && window.jQuery(qr).is(':visible') ? 'rating_ef2' : 'rating_ef']();
            return true;
          });
        }
      }

      this.viewer_comments_enabled = false;
      if (pp.rpc_usable && (re = /(<form[^>]+action=\"\/?member_illust\.php\"[^>]*>[\s\S]*?<\/form>)/i.exec(loader.text))) {
        (function() {
          var form = re[1], html = '';
          each(form.match(/<input[^>]+type=\"hidden\"[^>]+>/ig), function(hidden) { html += hidden; });
          if (html) {
            form = $c('form', this.viewer_comments_c, {html: html, 'a:action': '/member_illust.php', 'a:method': 'POST'});
            var comment = $c('input', form, {'a:type': 'text', 'a:name': 'comment', 'a:maxlength': '255'});
            var submit = $c('input', form, {cls: 'btn_type04', value: 'Send', 'a:type': 'submit', 'a:name': 'submit'});
            $ev(submit).click(function() {
              if (trim(comment.value)) {
                window.jQuery.post(
                  form.getAttribute('action'),
                  window.jQuery(form).serialize(),
                  function() {
                    self.reload_viewer_comments();
                    comment.removeAttribute('disabled');
                    comment.value = '';
                    submit.removeAttribute('disabled');
                  }
                ).error(function() {
                  alert('Error!');
                });
                comment.setAttribute('disabled', '');
                submit.setAttribute('disabled', '');
              } else {
                alert("\u30b3\u30e1\u30f3\u30c8\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
              }
              return true;
            });
            this.viewer_comments_enabled = true;
          }
        }).apply(this);
      }

      if (this.manga.usable && this.init_manga_page >= 0) {
        this.set_manga_mode(true, this.init_manga_page);
        this.init_manga_page = -1;
      } else if (conf.popup.auto_manga_p && (conf.popup.auto_manga & 16) && this.manga.usable && !this.item.manga.viewed) {
        this.set_manga_mode(true);
      } else {
        var url = this.manga.usable ? urlmode(this.item.medium, 'manga') : null;
        this.set_images([{image: loader.image, size: img_size, url: url}], this.manga.usable);
        this.update_olc();
        Popup.onload.emit(this);
        if (this.manga.usable) this.manga.preload();
      }
      if (this.item.prev) this.item.prev.preload();
      if (this.item.next) this.item.next.preload();
    },

    set_manga_page: function(page) {
      if (page < 0) {
        this.set(this.item);
      } else if (page !== this.manga.page) {
        if (page < this.manga.page_count) {
          var self = this;
          this.set_status('Loading');
          // エラーの時に次のページに移動する
          this.manga.page = page;
          if (this.loader) this.loader.cancel();
          this.loader = new Popup.MangaLoader(
            this.item, page,
            function() { self.manga_onload(this, page); },
            function(msg) { self.error(msg); });
        } else {
          this.set(this.item);
        }
      }
    },
    manga_onload: function(loader, page) {
      this.complete();
      //this.manga.page = page;
      this.manga.pages = loader.pages;
      this.manga.page_inc = loader.page_inc;
      this.manga.page_dec = loader.page_dec;
      this.item.manga.viewed = true;
      this.set_manga_button_text();
      this.set_images(loader.images, true);
      this.images.order = [];
      each(loader.pages, function(page) { this.images.order.push(page.image_index); }, this);
      this.manga.preload();
    },
    set_manga_button_text: function() {
      var pages = [];
      each(this.manga.pages, function(p) { pages.push(p.page + 1); });
      if (!pages.length) pages.push(0);
      this.manga_btn.textContent = '[M:' + pages.join('+') + '/' + this.manga.page_count + ']';
    },

    set_images: function(images, no_zoom) {
      each(this.images.list, function(img) { img.anchor.parentNode.removeChild(img.anchor); });
      this.images = {
        list:   [],
        order:  [],
        curidx: 0
      };

      this.img_div.style.display = '';
      each(images, function(entry, idx) {
        var image = entry.image || entry;
        image.style.cssText = '';
        var anc = $c('a', this.img_div, {href: entry.url || image.src.replace(/_[sm](\.\w+)$/, '$1')});
        anc.appendChild(image);

        var size = {width: image.width, height: image.height};
        this.images.list.push({
          image:        image,
          anchor:       anc,
          size:         size,
          display_size: entry.size || size
        });
        this.images.order.push(idx);
      }, this);

      var zoom = this.zoom_scale = 1;
      if (!no_zoom && conf.popup.auto_zoom) {
        var width = this.images.list[0].size.width, height = this.images.list[0].size.height;
        var len = width > height ? width : height;
        if (len <= conf.popup.auto_zoom) {
          zoom = Math.floor(conf.popup.auto_zoom_size / len);
          if (zoom > conf.popup.auto_zoom_scale) zoom = Math.floor(conf.popup.auto_zoom_scale);
          if (zoom < 1) zoom = 1;
        }
      }
      if (zoom > 1) {
        this.set_zoom(zoom);
      } else {
        this.locate();
        this.update_info();
      }
    },

    adjust_image_size: function() {
      if (!this.images.list) return;

      var width = 0, height = 0;
      each(this.images.list, function(image) {
        width += image.size.width;
        if (image.size.height > height) height = image.size.height;
      });

      var de = window.document.documentElement;
      var mw = de.clientWidth  + this.img_div.clientWidth  - this.root_div.offsetWidth  - 32;
      var mh = de.clientHeight + this.img_div.clientHeight - this.root_div.offsetHeight - 32;
      var rw = width;
      if (width > mw || height > mh) {
        var sw = mw / width, sh = mh / height, scale = sw < sh ? sw : sh;
        rw = 0
        each(this.images.list, function(image) {
          var w = Math.floor(image.size.width * scale);
          image.image.style.width = w + 'px';
          rw += image.image.offsetWidth;
        });
      }
      if (this.images.list.length > 1) {
        this.img_div.style.width = rw + 'px';
      } else {
        this.img_div.style.width = '';
      }

      var ch = this.img_div.clientHeight;
      each(this.images.list, function(image) {
        var m = Math.max(Math.floor((ch - image.image.offsetHeight) / 2), 0);
        image.image.style.marginTop = m + 'px';
      });
    },

    set_zoom: function(zoom) {
      zoom = zoom < 1 ? 1 : Math.floor(zoom);
      if (browser.webkit ||
          this.images.list.length !== 1 ||
          zoom === this.zoom_scale) {
        this.locate();
        this.update_info();
        return;
      }

      this.zoom_scale = zoom;
      var img = this.images.list[0];
      if (this.zoom_scale === 1) {
        if (img.image_unscaled) {
          img.image.parentNode.replaceChild(img.image_unscaled, img.image);
          img.image = img.image_unscaled;
          img.image_unscaled = null;
        }
      } else {
        var w = img.size.width * this.zoom_scale, h = img.size.height * this.zoom_scale;
        var scaled = Popup.create_zoom_image(img.image_unscaled || img.image, w, h, img.size.width, img.size.height);
        img.image.parentNode.replaceChild(scaled, img.image);
        if (!img.image_unscaled) img.image_unscaled = img.image;
        img.image = scaled;
      }
      this.locate();
      this.update_info();
    },

    update_info: function() {
      var info_size = [];
      each(this.images.list, function(img) {
        var sup = [], re;
        var scale = Math.floor(img.image.offsetWidth / img.display_size.width * 100) / 100;
        if (scale !== 1) sup.push(scale + 'x');
        if ((re = /\.([^\/\.\?]+)(?:\?.*)?$/.exec(img.image.src))) sup.push(re[1]);
        info_size.push(img.display_size.width + 'x' + img.display_size.height + (sup.length ? '(' + sup.join('/') + ')' : ''));
      });
      this.info_size.textContent = info_size.join('/');
      this.post_cap.style.display = '';
    },

    locate: function() {
      var de = window.document.documentElement;
      this.root_div.style.minHeight = '';
      if (this.is_bookmark_editing() || this.is_tag_editing()) {
        // temporary do nothing
      } else {
        this.adjust_image_size();

        this.caption.style.width = this.header.offsetWidth + 'px';
        var cap_height, post_cap_height = this.caption.offsetHeight - this.comment_wrap.offsetHeight - 3;
        if (this.expand_header) {
          cap_height = this.img_div.offsetHeight - post_cap_height;
        } else {
          cap_height = Math.floor(this.img_div.offsetHeight * conf.popup.caption_height) - post_cap_height;
        }
        this.comment_wrap.style.maxHeight = Math.max(cap_height, 128) + 'px';

        /*
         if (!this.expand_header) {
         this.img_div.style.margin = '';
         var ph = this.caption.offsetHeight + 48;
         if (this.img_div.offsetHeight < ph) {
         this.img_div.style.margin = (ph - this.img_div.offsetHeight) / 2 + 'px 0px';
         }
         }
         */

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
      this.root_div.style.left = Math.floor((de.clientWidth  - this.root_div.offsetWidth)  / 2) + 'px';
      this.root_div.style.top  = Math.floor((de.clientHeight - this.root_div.offsetHeight) / 2) + 'px';
    },

    update_olc: function(page) {
      if (conf.popup.overlay_control > 0) {
        var m = this.manga.usable && this.manga.enabled;
        this.olc_prev.style.display = m || this.item.prev ? 'inline' : 'none';
        this.olc_next.style.display = m || this.item.next ? 'inline' : 'none';
      }
    },

    reload: function() {
      this.set(this.item, null, null, true);
    },

    close: function() {
      if (Popup.onclose.emit(this)) return;
      if (this.loader) this.loader.cancel();
      if (this.conn_g_add_item) this.conn_g_add_item.disconnect();
      window.document.body.removeChild(this.root_div);
      if (pp.rpc_usable) {
        pp.rpc_div.innerHTML = '';
        pp.rpc_state = 0;
      }
    },

    open: function(big) {
      if (this.manga.usable && this.manga.page < 0) {
        pp.open(big ? urlmode(this.item.medium, 'manga') : this.item.medium);
      } else if (big) {
        var idx = this.images.order[(this.images.curidx++) % this.images.order.length];
        pp.open(this.images.list[idx].anchor.href);
      } else if (this.manga.usable) {
        pp.open(urlmode(this.item.medium, 'manga') + '#pp_page=' + this.manga.page);
      } else {
        pp.open(this.item.medium);
      }
    },

    open_image_response: function() {
      this.has_image_response && pp.open(this.res_btn.href);
    },

    open_manga_tb: function() {
      if (this.manga.usable) {
        var url = urlmode(this.item.medium, 'manga') + '#pp_manga_tb';
        this.item.manga.viewed = true;
        pp.open(url);
      }
    },

    toggle_caption: function() {
      if (this.caption.hasAttribute('show')) {
        this.caption.removeAttribute('show');
      } else {
        this.caption.setAttribute('show', '');
      }
      if (!this.is_caption_visible() && Popup.is_qrate_button(window.document.activeElement)) {
        window.document.activeElement.blur();
      }
    },

    is_caption_visible: function() {
      return !!window.document.querySelector('#pp-caption[show],#pp-caption:hover');
    },

    keypress: function(ev, key) {
      if (Popup.is_qrate_button(ev.target)) {
        ev.qrate = ev.target;
        return Popup.onkeypress.emit(this, ev, key);
      } else if (pp.key_enabled(ev)) {
        return Popup.onkeypress.emit(this, ev, key);
      } else {
        return false;
      }
    },

    toggle_qrate: function() {
      if (this.has_qrate) {
        var anc = $x('./div[@id="rating"]/h4/a', this.rating), qr;
        if (anc) {
          this.caption.setAttribute('show', '');
          send_click(anc);
        }
      }
    },

    qrate_move_selection: function(move) {
      var btn = window.document.activeElement;
      if (Popup.is_qrate_button(btn)) {
        for(; move !== 0; move += move < 0 ? 1 : -1) {
          var next = move < 0 ? btn.previousSibling : btn.nextSibling;
          if (Popup.is_qrate_button(next)) btn = next;
        }
        if (btn) btn.focus();
      }
    },

    qrate_submit: function(force) {
      var btn = window.document.activeElement;
      if (!Popup.is_qrate_button(btn)) return;
      if (!force && !this.is_caption_visible()) return;
      send_click(btn);
    },

    toggle_viewer_comments: function() {
      if (!this.viewer_comments_enabled) return;
      if (!this.viewer_comments_a.innerHTML || !window.jQuery(this.viewer_comments).is(':visible')) {
        this.caption.setAttribute('show', '');
      }
      if (!this.viewer_comments_a.innerHTML) {
        window.jQuery.post(
          '/rpc_comment_history.php',
          rpc_create_data(['i_id', 'u_id']),
          bind(function(data) {
            this.viewer_comments_a.innerHTML = data;
            each($xa('.//a[contains(@href, "member_illust.php?mode=comment_del")]', this.viewer_comments_a),
                 bind(trap_delete, this));
            show.call(this);
          }, this)
        );
      } else if (!window.jQuery(this.viewer_comments).is(':visible')) {
        show.call(this);
      }else{
        this.comments_btn.removeAttribute('enable');
        window.jQuery(this.viewer_comments).slideUp(200, bind(function() {
          this.expand_header = false;
          this.locate();
        }, this));
      }
      function trap_delete(del) {
        var url = del.getAttribute('href');
        del.setAttribute('onclick', '');
        del.onclick = '';
        if (/^\w/.test(url)) url = '/' + url;
        $ev(del).click(bind(function() {
          if (confirm("\u30b3\u30e1\u30f3\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u3002\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f")) {
            window.jQuery.ajax({
              url: url,
              context: this,
              success: Popup.prototype.reload_viewer_comments,
              error: function() {
                alert('Error!');
              }});
          }
          return true;
        }, this));
      }
      function show() {
        this.expand_header = true;
        this.locate();
        this.comments_btn.setAttribute('enable', '');
        window.jQuery(this.viewer_comments).slideDown(200);
        window.jQuery(this.comment_wrap).animate({scrollTop: this.comment.offsetHeight}, 200);
      }
    },

    toggle_viewer_comment_form: function() {
      var hidden = this.viewer_comments_c.style.display === 'none', comment;
      this.viewer_comments_c.style.display = hidden ? 'block' : 'none';
      if (hidden && (comment = $x('./form/input[@name="comment"]', this.viewer_comments_c))) comment.focus();
      conf.popup.show_comment_form = !!hidden;
      if (LS.u) LS.set('popup', 'show_comment_form', !!hidden);
    },

    reload_viewer_comments: function() {
      if (this.viewer_comments_enabled) {
        this.init_comments(true);
        this.toggle_viewer_comments();
      }
    },

    toggle_bookmark_edit: function() {
      if (this.is_bookmark_editing()) {
        if (this.bookmark_form) {
          this.bookmark_form.destroy();
          this.bookmark_form = null;
        }
        this.bm_edit.style.display = 'none';
        this.caption.style.display = '';
        this.img_div.style.display = '';
        this.locate();
      } else if (!this.bm_loading) {
        this.bm_loading  = true;
        this.set_status('Loading');
        geturl('/bookmark_add.php?type=illust&illust_id=' + this.item.id, bind(function(text) {
          var re;
          this.bm_loading = false;
          if ((re = /<form[^>]+action="bookmark_add.php"[\s\S]*?<\/form>/i.exec(text))) {
            this.complete();
            // エラー回避
            if (!window.update_input_tag) window.update_input_tag = function() { };
            this.bm_edit.innerHTML = re[0];
            this.bm_edit.style.display = '';
            this.caption.style.display = 'none';
            this.img_div.style.display = 'none';
            this.bookmark_form = new BookmarkForm(this.bm_edit, {
              title: this.title, comment: this.comment,
              autotag: !this.bm_btn.hasAttribute('enable'),
              closable: true, signal_key: Popup.onkeypress
            });
            this.bookmark_form.onclose.connect(bind(function() {
              this.toggle_bookmark_edit();
              this.reload();
            }, this));
            this.locate();
          } else {
            this.error('Failed to parse bookmark HTML');
          }
        }, this), bind(function() {
          this.bm_loading = false;
          this.error('Failed to load bookmark HTML');
        }, this), true);
      }
    },

    is_bookmark_editing: function() {
      return this.bm_edit.style.display !== 'none';
    },

    toggle_tag_edit: function() {
      if (this.is_tag_editing()) {
        this.tag_edit.style.display = 'none';
        this.caption.style.display = '';
        this.img_div.style.display = '';
        this.locate();
        this.reload();
      } else if (!this.tag_loading) {
        this.tag_loading = true;
        this.tag_edit_btn.textContent = '[Loading]';
        window.jQuery.post(
          '/rpc_tag_edit.php',
          rpc_create_data(['i_id', 'u_id', 'e_id'], {mode: 'first'}),
          bind(function(data) {
            this.tag_edit.innerHTML = data.html.join('');
            this.tag_edit.style.display = '';
            this.caption.style.display = 'none';
            this.img_div.style.display = 'none';
            this.locate();
            this.tag_loading = false;
            this.tag_edit_btn.textContent = '[E]';
          }, this),
          'json').error(function() { alert('Error!'); });
      }
    },

    is_tag_editing: function() {
      return this.tag_edit.style.display !== 'none';
    },

    open_author_profile: function() {
      if (this.author.style.display !== 'none') pp.open(this.a_profile.href);
    },

    open_author_illust: function() {
      if (this.author.style.display !== 'none') pp.open(this.a_illust.href);
    },

    open_author_bookmark: function() {
      if (this.author.style.display !== 'none') pp.open(this.a_bookmark.href);
    },

    open_author_staccfeed: function() {
      if (this.author.style.display !== 'none' && this.a_stacc.style.display !== 'none') {
        pp.open(this.a_stacc.href);
      }
    },

    open_bookmark_detail: function() {
      pp.open('http://www.pixiv.net/bookmark_detail.php?illust_id=' + this.item.id);
    },

    set_manga_mode: function(manga_mode, page) {
      if (!this.manga.usable || !!this.manga.enabled === !!manga_mode) return;
      if ((this.manga.enabled = manga_mode)) {
        this.manga.enabled = true;
        this.manga_btn.setAttribute('enable', '');
        this.update_olc();
        this.set_manga_page(page || 0);
      } else {
        this.set(this.item);
      }
    },

    toggle_manga_mode: function(page) {
      if (this.manga.usable) this.set_manga_mode(!this.manga.enabled, page);
    },

    scroll_caption: function(pos) {
      this.comment_wrap.scrollTop += pos;
    }
  };

  Popup.Loader = function(item, cb_load, cb_error, reload) {
    LoaderBase.call(this, cb_load, cb_error);
    this.item      = item;
    this.url       = item.medium;
    this.text      = '';
    this.image     = null;
    this.parallel  = false;
    this.text_cmp  = false;
    this.img_cmp   = false;

    this.item.loaded = true;

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

    geturl(this.url, bind(function(text) {
      var re;
      if ((re = /<span[^>]+class=\"error\"[^>]*>(.+)<\/span>/i.exec(text))) {
        this.error(re[1].replace(/<[^>]*>/g, ''));
      } else {
        this.text = text;
        this.text_cmp = true;
        if (this.img_cmp) {
          this.complete();
        } else if (!this.parallel) {
          this.parse_text();
        } // else 画像が並列ロード中かキャンセルされた
      }
    }, this), bind(function() {
      this.error('Failed to load HTML');
    }, this), reload);
    return this;
  };

  Popup.Loader.prototype = {
    load_image: function(url) {
      var self = this;
      getimg(url, function(img) {
        self.img_cmp = true;
        self.image = img;
        if (conf.popup.big_image) {
          self.item.img_big = img;
        } else {
          self.item.img_med = img;
        }
        self.complete();
      }, function() {
        if (self.parallel && conf.popup.big_image) {
          log('parallel load failed - ' + self.item.img_url_base);
          self.parallel = false;
          if (self.text_cmp) self.parse_text();
        } else {
          self.error('Failed to load image');
        }
      }, function() {
        self.error('Load image aborted');
      });
    },

    parse_text: function() {
      var url, re;
      if ((re = /<img src=\"(http:\/\/img\d+\.pixiv\.net\/img\/[^\"]+)\"/i.exec(this.text))) {
        url = re[1];
        if (conf.popup.big_image &&
            !/<div[^>]+class=\"[^\"]*works_display[^\"]*\"[^>]*><a[^>]+href=\"member_illust\.php\?mode=manga/i.test(this.text) &&
            (re = /^(.+)_m(\.[^\.]+)$/.exec(url))) {
          url = re[1] + re[2];
        }
      }
      if (url) {
        this.load_image(url);
        if (!this.item.img_url_base) this.item.parse_img_url(url);
      } else {
        this.error('Failed to parse image URL');
      }
    },

    complete: function() {
      if (this.text_cmp && this.img_cmp) LoaderBase.prototype.complete.call(this);
    },

    error: function(msg) {
      uncache(this.url);
      LoaderBase.prototype.error.call(this, msg);
    }
  };
  Popup.Loader.prototype.__proto__ = LoaderBase.prototype;

  Popup.MangaLoader = function(item, page, cb_load, cb_error) {
    LoaderBase.call(this, cb_load, cb_error);
    this.item       = item;
    this.page       = page;

    this.images     = null;
    this.pages      = [{page: page, image_index: 0}];
    this.page_inc   = 1;
    this.page_dec   = 1;
    this.load_html  = conf.popup.manga_spread;

    if (this.load_html) {
      if (item.manga_pages) {
        this.load_pages(item.manga_pages);
        return;
      } else {
        geturl(urlmode(item.medium, 'manga'),
               bind(Popup.MangaLoader.prototype.parse_html, this),
               bind(function() {
                 this.error('Failed to load manga page');
               }, this));
      }
    }
    this.image_url = item.img_url_base + '_p' + page + item.img_url_ext;
    this.image_url_big = item.img_url_base + '_big_p' + page + item.img_url_ext;
    this.load_image(this.image_url, this.image_url_big);
  };

  Popup.MangaLoader.prototype = {
    check_complete: function(image) {
      if (!this.images) return;
      for(var i = 0; i < this.images.length; ++i) {
        if (this.images[i] instanceof Array) return;
      }
      this.complete();
    },

    load_image: function(url, url_big) {
      var load = bind(Popup.MangaLoader.prototype.onload_image, this);
      var error = bind(function() {
        this.error('Failed to load manga image');
      }, this);
      if (getimg.cache[url_big] === false) {
        getimg(url, load, error);
      } else {
        getimg(conf.popup.big_image ? url_big : url, load,
               conf.popup.big_image ? function() { getimg(url, load, error); } : error);
      }
    },

    onload_image: function(image) {
      if (this.images) {
        each(this.images, function(obj, idx) {
          if (obj instanceof Array && obj.indexOf(image.src) >= 0) {
            this[idx] = image;
          }
        });
        this.check_complete();
      } else {
        this.images = [image];
      }
    },

    parse_html: function(html) {
      var manga_pages = [];
      var containers = html.split(/<div[^>]+class=\"[^\"]*image-container[^\"]*\"[^>]*>(.*?)<\/(?:div|section)>/i);
      var page = 0;
      for(var i = 0; i + 1 < containers.length; i += 2) {
        var images = containers[i + 1].split(/<script[^>]*>[^<]*(push|unshift)\([\"\'](http:\/\/img\d+\.pixiv\.net\/img\/[^\/]+\/\d+(?:_[0-9a-f]{10})?_p\d+\.\w+)/i);
        var pages = [], j;
        for(j = 0; j + 2 < images.length; j += 3) {
          pages.push({
            url: images[j + 2],
            url_big: images[j + 2].replace(/(_p\d+\.\w+)$/, '_big$1'),
            page: page++,
            image_index: pages.length
          });
        }
        if (pages.length < 1) {
          this.error('Invalid html');
          return;
        }
        if (images[1] === 'unshift') pages.reverse();
        for(j = 0; j < pages.length; ++j) {
          manga_pages.push({list: pages, page_inc: pages.length - j, page_dec: j + 1});
        }
      }
      this.load_pages(manga_pages);
    },

    load_pages: function(pages) {
      this.item.manga_pages = pages;

      if (!pages[this.page]) {
        this.error('Invalid page data');
        return;
      }

      this.page_inc = pages[this.page].page_inc;
      this.page_dec = pages[this.page].page_dec;

      var image = this.images && this.images[0];
      this.pages = [];
      this.images = [];
      each(pages[this.page].list, function(page, idx) {
        this.pages.push({page: page.page, image_index: page.image_index});

        var urls = [page.url, page.url_big];
        if (image) {
          for(var i = 0; i < urls.length; ++i) {
            if (urls[i] === this.image_url || urls[i] === this.image_url_big) {
              this.images.push(image);
              return;
            }
          }
        }
        this.images.push(urls);
      }, this);
      each(this.images, function(urls) {
        if (urls instanceof Array) {
          Popup.MangaLoader.prototype.load_image.apply(this, urls);
        }
      }, this);
      this.check_complete();
    }
  };
  Popup.MangaLoader.prototype.__proto__ = LoaderBase.prototype;

  function BookmarkForm(root, opts) {
    this.root          = root;
    this.key_type      = conf.bookmark_form;

    this.title         = opts.title || $x('//div[contains(concat(" ", @class, " "), " works_data ")]/h3');
    this.comment       = opts.comment || $x('//div[contains(concat(" ", @class, " "), " works_tag ")]/preceding-sibling::p');
    this.form          = $x('.//form[@action="bookmark_add.php"]', this.root);
    this.input_tag     = $x('.//input[@id="input_tag"]', this.root);
    this.tagcloud      = $x('.//ul[contains(concat(" ", @class, " "), " tagCloud ")]', this.root);

    this.tag_wraps     = $xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]', this.root);
    this.tag_wrap_it   = this.tag_wraps.length >= 2 ? this.tag_wraps[0] : null;
    this.tag_wrap_bm   = this.tag_wraps[this.tag_wraps.length >= 2 ? 1 : 0];
    this.tags_illust   = this.tag_wrap_it ? $xa('ul/li/a', this.tag_wrap_it) : [];
    this.tags_bookmark = $xa('ul/li/a', this.tag_wrap_bm);

    this.connections   = [];

    BookmarkForm.write_css();
    BookmarkForm.trap_jquery_ready();

    this.root.className = this.root.className.replace(/ *pp-bm-form */, ' ') + ' pp-bm-wrap';

    this.btn_submit = find($xa('.//input[@type="submit"]', root), function(submit, idx) {
      if (idx + 1 < this.length) {
        submit.parentNode.parentNode.removeChild(submit.parentNode);
        return false;
      }
      return true;
    });
    if (opts.closable) {
      this.onclose = new Signal(BookmarkForm.prototype.destroy);
      this.btn_close = $c('input', this.btn_submit.parentNode,
                          {type: 'button', value: "\u9589\u3058\u308b", cls: 'btn_type01 bookmark_submit_btn'});
      this.connections.push($ev(this.btn_close).click(bind(function(ev, conn) {
        conn.disconnect();
        this.close();
        return true;
      }, this)));
    }

    if (conf.bookmark_hide) (function() {
      var hide = $x('.//input[@type="radio" and @name="restrict" and @value="1"]', this.root);
      if (hide) hide.checked = true;
    }).call(this);

    this.connections.push($ev(this.form).submit(bind(function() {
      this.submit();
      return true;
    }, this)));

    this.connections.push($ev(this.root).key(function(ev, conn, key) {
      if (key === $ev.KEY_ESCAPE && $x('ancestor-or-self::input', ev.target)) {
        ev.target.blur();
        return true;
      }
      return false;
    }));

    each([this.tags_illust, this.tags_bookmark], function(group, idx) {
      each(group, function(it) {
        var tag = it.firstChild.nodeValue;
        it.setAttribute('onclick', '');
        it.onclick = '';
        $ev(it).click(function() {
          window.add_form(tag);
          return true;
        });
        if (idx === 0) {
          it.href = '/tags.php?tag=' + tag;
        } else {
          it.href = '/bookmark.php?tag=' + tag + (conf.bookmark_hide ? '&rest=hide' : '');
        }
      });
    });

    $js.script(pp.url.js.bookmark_add_v4).wait(bind(function() {
      // 二回目以降bookmark_add_v4.jsの初期化関数が呼ばれない
      window.alltags = window.getAllTags();
      // magic 11.00.1029
      window.tag_chk(window.String.prototype.split.apply($('input_tag').value, [/\s+|\u3000+/]));

      if (conf.bm_tag_order.length) {
        each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]' +
                 '/a[starts-with(@id, "myBookmarkTagsSortBy")]', this.root),
             function(anc) {
               if (anc.previousSibling.nodeType === 3) {
                 // &nbsp;
                 anc.parentNode.removeChild(anc.previousSibling);
               }
               anc.parentNode.removeChild(anc);
             });
        each(reorder_tags($xa('ul/li', this.tag_wrap_bm)), function(list) {
          var ul = $c('ul', this.tag_wrap_bm, {cls: 'tagCloud'});
          each(list, function(li) {
            li.parentNode.removeChild(li);
            ul.appendChild(li);
          });
        }, this);
        this.tag_wrap_bm.removeChild($t('ul', this.tag_wrap_bm)[0]);
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
      each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', this.root),
           function(ul, idx) {
             var q = p + '-' + idx;
             var tags = $xa('li/a', ul);
             each(tags, function(tag, idx) {
               tag.id = q + '-' + idx;
               tag.style.navLeft = '#' + q + '-' + (idx ? idx - 1 : tags.length - 1);
               tag.style.navRight = '#' + q + '-' + (tags[idx + 1] ? idx + 1 : 0);
             });
             if (first && tags.length) {
               this.input_tag.style.navDown = '#' + tags[0].id;
               first = false;
             }
           },
           this);

      if (opts.autotag) this.autoinput_from_tag();

      var keyhandler = BookmarkForm.prototype.keypress_common;
      if (this.key_type === 1) {
        this.tag_items = [];
        this.tag_preselected_index = {x: 0, y: 0};
        this.input_tag.setAttribute('autocomplete', 'off');
        this.input_tag.focus();
        each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', this.root),
             function(ul) {
               var l = $t('li', ul);
               if (l.length) this.tag_items.push(l);
             }, this);
        if (this.tag_items.length) {
          $ev(this.input_tag).key(bind(BookmarkForm.prototype.keypress1, this));
        }
      } else if (this.key_type === 2) {
        this.set_root_key_enabled(true);
        this.key_map_root = {};
        each($xa('.//input[@type!="hidden"]', this.root), function(input, idx) {
          if (idx >= BookmarkForm.keys_root.length) return true;
          var div = $c('div', null, {css: 'display:inline-block', 'a:ppaccesskey': BookmarkForm.keys_root[idx]});
          input.parentNode.insertBefore(div, input);
          input.parentNode.removeChild(input);
          div.appendChild(input);
          this.key_map_root[BookmarkForm.keys_root[idx]] = input;
          return false;
        }, this);

        this.key_map_tag_list = {};
        each($xa('.//div[contains(concat(" ", @class, " "), " bookmark_recommend_tag ")]/ul', this.root),
             function(ul, idx) {
               if (idx >= BookmarkForm.keys_tag.length) return;
               this.key_map_tag_list[BookmarkForm.keys_tag[idx]] = ul;
               ul.setAttribute('ppaccesskey', BookmarkForm.keys_tag[idx]);
             },
             this);

        keyhandler = BookmarkForm.prototype.keypress2;
        //this.connections.push($ev(this.root).listen(['focus', 'blur'], bind(function() {
        //  alert();
        //  this.set_root_key_enabled(lc(window.document.activeElement) !== 'input');
        //}, this)));
      } else {
        this.input_tag.focus();
      }
      if (keyhandler) {
        if (opts.signal_key) {
          this.connections.push(opts.signal_key.connect(bind(keyhandler, this)));
        } else {
          $ev(window).key(bind(keyhandler, this));
        }
      }
    }, this));

    (function() {
      var bottom = $x('.//div[contains(concat(" ", @class, " "), " bookmark_bottom ")]', this.root);
      try {
        if (bottom.firstChild.nodeType === 3 &&
            check_node(bottom.firstChild.nextSibling, 'BR')) {
          bottom.removeChild(bottom.firstChild);
          bottom.removeChild(bottom.firstChild);
        }
      } catch (x) { }
      var note = $x('.//dd/text()[contains(., \"10\u500b\")]', this.root);
      if (note) {
        if (check_node(note.previousSibling, 'BR')) {
          note.parentNode.removeChild(note.previousSibling);
        }
        note.parentNode.removeChild(note);
      }
    }).call(this);
  }

  BookmarkForm.keys_root = ['q', 'w', 'e', 'r'];
  BookmarkForm.keys_tag = ['a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
  BookmarkForm.write_css = function() {
    pp.write_css('.pp-bm-wrap .bookmain_title{padding:4px;}' +
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
                 '.pp-bm-wrap .bookmark_recommend_tag > ul > li{padding:2px;}' +
                 '.pp-bm-wrap .bookmark_recommend_tag > ul > li[pppreselected]{border:2px solid #56E655;padding:0px;}' +
                 '.pp-bm-wrap .bookmark_bottom{padding-bottom:4px;}' +
                 '.pp-bm-wrap .bookmark_bottom input{margin:0px;}' +
                 '.pp-bm-wrap *[ppaccesskey]:before{' +
                 '  display:none;content:attr(ppaccesskey);font-size:10px;font-weight:bold;padding:1px;' +
                 //'  position:absolute;margin-top:-0.4em;margin-left:-0.8em;' +
                 '  color:white;background-color:gray;line-height:1em;height:1em;}' +
                 '.pp-bm-wrap.pp-access-key-on div[ppaccesskey]:before{display:inline-block;}' +
                 '.pp-bm-wrap.pp-access-key-on ul[ppaccesskey]:before{display:inline-block;}' +
                 '.pp-bm-wrap ul.pp-access-key-on li[ppaccesskey]:before{display:inline-block;}' +
                 ''
                );
    BookmarkForm.write_css = function() { };
  };
  BookmarkForm.trap_jquery_ready = function() {
    /* window.jQuery(function)=>jQuery.fn.ready()がjQuery.isReady === trueの時
     * 同期的にコールバックするためwindow.getAllTagsなどが未定義となる。
     */
    window.jQuery.fn.ready = function(func) {
      setTimeout(func, 10);
    };
    BookmarkForm.trap_jquery_ready = function() { };
  };

  BookmarkForm.set_key_label_enabled = function(node, enabled) {
    var classes = node.className.replace(/ *pp-access-key-on */, ' ');
    if (enabled) classes += ' pp-access-key-on';
    node.className = classes;
  };

  BookmarkForm.prototype = {
    autoinput: function(func) {
      var tags = this.input_tag.value.split(/\s+|\u3000+/);
      each(this.tags_bookmark, function(bt) {
        var tag = bt.parentNode.getAttribute('jsatagname');
        if (tags.indexOf(tag) >= 0) return;
        var aliases = conf.bm_tag_aliases[tag];
        each([tag].concat(conf.bm_tag_aliases[tag] || []), function(tag) {
          if (func.call(this, bt, tag)) {
            send_click(bt);
            return true;
          } else {
            return false;
          }
        }, this);
      }, this);
    },

    autoinput_from_tag: function() {
      this.autoinput(function(anc, tag) {
        for(var i = 0; i < this.tags_illust.length; ++i) {
          var itag = this.tags_illust[i].firstChild.nodeValue;
          if (lc(itag).indexOf(lc(tag)) >= 0) return true;
        }
        return false;
      });
    },

    keypress_common: function(ev, conn, key) {
      return false;
      /*
      if (!pp.key_enabled(ev)) return false;
      if (key === $ev.KEY_ENTER || key === $ev.KEY_SPACE) {
        this.submit();
        return true;
      } else if (key === $ev.KEY_ESCAPE) {
        this.close();
        return true;
      }
      return false;
       */
    },

    // conf.bookmark_form === 1
    toggle_preselected: function() {
      send_click($x('.//a', this.tag_preselected));
    },

    unpreselect_tag: function() {
      if (this.tag_preselected) {
        this.tag_preselected.removeAttribute('pppreselected');
        this.tag_preselected = null;
      }
    },

    preselect_tag: function(x, y) {
      this.unpreselect_tag();
      if (y < 0) {
        y = this.tag_items.length - 1;
      } else if (y >= this.tag_items.length) {
        y = 0;
      }
      if (y !== this.tag_preselected_index.y) x = 0;
      if (x < 0) {
        x = this.tag_items[y].length - 1;
      } else if (x >= this.tag_items[y].length) {
        x = 0;
      }
      this.tag_preselected_index.x = x;
      this.tag_preselected_index.y = y;
      this.tag_preselected = this.tag_items[y][x];
      this.tag_preselected.setAttribute('pppreselected', 'yes');
    },

    keypress1: function(ev, conn, key) {
      if (this.tag_preselected) {
        var x = 0, y = 0;
        switch(key) {
        case $ev.KEY_SPACE:  this.toggle_preselected(); return true;
        case $ev.KEY_ESCAPE: this.unpreselect_tag(); return true;
        case $ev.KEY_LEFT:   x = -1; break;
        case $ev.KEY_UP:     y = -1; break;
        case $ev.KEY_RIGHT:  x = 1; break;
        case $ev.KEY_DOWN:   y = 1; break;
        }
        if (x !== 0 || y !== 0) {
          this.preselect_tag(this.tag_preselected_index.x + x, this.tag_preselected_index.y + y);
          return true;
        }
      } else if (key === $ev.KEY_UP || key === $ev.KEY_DOWN) {
        this.preselect_tag(0, key === $ev.KEY_DOWN ? 0 : this.tag_items.length - 1);
        return true;
      }
      return false;
    },

    // conf.bookmark_form === 2
    set_root_key_enabled: function(enabled) {
      this.root_key_enabled = !!enabled;
      BookmarkForm.set_key_label_enabled(this.root, enabled);
    },

    select_tag_list: function(ul) {
      if (ul) {
        this.set_root_key_enabled(false);
        BookmarkForm.set_key_label_enabled(ul, false);
        this.key_map_tags = {};
        each($t('li', ul), function(li, idx) {
          if (idx >= BookmarkForm.keys_tag.length) return;
          this.key_map_tags[BookmarkForm.keys_tag[idx]] = li;
          li.setAttribute('ppaccesskey', BookmarkForm.keys_tag[idx]);
        }, this);
        BookmarkForm.set_key_label_enabled(ul, true);
        this.selected_list = ul;
      } else {
        if (this.selected_list) BookmarkForm.set_key_label_enabled(this.selected_list, false);
        this.set_root_key_enabled(true);
        this.key_map_tags = null;
        this.selected_list = null;
      }
    },

    keypress2: function(ev, conn, key) {
      if (!pp.key_enabled(ev)) return false;
      if (this.root_key_enabled) {
        if (this.key_map_root[key]) {
          if (this.key_map_root[key].type === 'radio') {
            this.key_map_root[key].checked = true;
          } else {
            this.key_map_root[key].focus();
          }
          return true;
        }
        if (this.key_map_tag_list[key]) {
          this.select_tag_list(this.key_map_tag_list[key]);
          return true;
        }
      }
      if (this.key_map_tags) {
        if (key === $ev.KEY_ESCAPE) {
          this.select_tag_list(null);
          return true;
        }
        if (this.key_map_tags[key]) {
          send_click($t('a', this.key_map_tags[key])[0]);
          this.select_tag_list(null);
          return true;
        }
      }
      return this.keypress_common(ev, conn, key);
    },

    submit: function() {
      var submit_text = this.btn_submit.value;
      this.btn_submit.value = "\u9001\u4fe1\u4e2d";
      this.btn_submit.setAttribute('disabled', '');
      window.jQuery.post(
        this.form.getAttribute('action'),
        window.jQuery(this.form).serialize(),
        bind(function(data) {
          this.btn_submit.value = submit_text;
          this.btn_submit.removeAttribute('disabled');
          this.close();
        }, this)).error(function() {
          alert('Error!');
        });
    },

    close: function() {
      if (this.onclose) this.onclose.emit(this);
    },

    destroy: function() {
      each(this.connections, function(conn) {
        conn.disconnect();
      });
      this.connections = [];
    }
  };

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
    each(conf.bm_tag_order, function(order) {
      var ary_ary = [];
      each(order, function(tag) {
        if (!tag) {
          ary_ary.push(null);
          return;
        }
        for(var i = 0; i < list.length; ++i) {
          if (t(list[i]) === tag) {
            ary_ary.push(list[i]);
            list.splice(i, 1);
            break;
          }
        }
      });
      if (ary_ary.length > 0) ary.push(ary_ary);
    });
    list.sort(function(a, b) {
      a = t(a); b = t(b);
      return a === b ? 0 : (a < b ? -1 : 1);
    });
    each(ary, function(ary_ary, idx) {
      var null_idx = ary_ary.indexOf(null);
      if (null_idx >= 0) {
        Array.prototype.splice.apply(ary[idx], [null_idx, 1].concat(list));
        list = [];
        return true;
      }
      return false;
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
    this.floating = false;
    this.disable_float = false;
    this.use_placeholder = true;
    Floater.instances.push(this);
    if (Floater.initialized) this.init();
  }
  Floater.instances = [];
  Floater.initialized = false;
  Floater.init = function() {
    if (Floater.initialized) return;
    each(Floater.instances, function(inst) {
      inst.init();
    });
    $ev(window, true).scroll(Floater.update_float);
    $ev(window, true).resize(Floater.update_height);
    Floater.initialized = true;
  };
  Floater.auto_run = function(func) {
    if (conf.float_tag_list === 1) {
      func();
    } else if (conf.float_tag_list === 2) {
      Pager.wait(func);
    }
  };
  Floater.update_float = function() {
    each(Floater.instances, function(inst) { inst.update_float(); });
  };
  Floater.update_height = function() {
    each(Floater.instances, function(inst) { inst.update_height(); });
  };

  Floater.prototype = {
    init: function() {
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
    },

    unfloat: function () {
      if (this.placeholder) {
        this.placeholder.parentNode.removeChild(this.placeholder);
        this.placeholder = null;
      }
      this.scroll_save();
      this.wrap.removeAttribute('float');
      this.scroll_restore();
      this.floating = false;
    },

    update_height: function () {
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
    },

    update_float: function () {
      if (this.disable_float) return;
      var de = window.document.documentElement;
      var sc = browser.webkit ? window.document.body : window.document.documentElement;
      var pos = getpos(this.placeholder || this.wrap);
      if (!this.floating && sc.scrollTop > pos.top) {
        this.scroll_save();
        if (this.use_placeholder) {
          this.placeholder = this.wrap.cloneNode(false);
          this.placeholder.style.width = this.wrap.offsetWidth + 'px';
          this.placeholder.style.height = '0px';
          this.wrap.parentNode.insertBefore(this.placeholder, this.wrap);
        }
        this.wrap.setAttribute('float', '');
        if (this.use_placeholder) {
          this.placeholder.style.height = Math.min(this.wrap.offsetHeight, de.clientHeight) + 'px';
        }
        this.scroll_restore();
        this.floating = true;
      } else if (this.floating && sc.scrollTop < pos.top) {
        this.unfloat();
      }
      this.update_height();
    },

    scroll_save: function () {
      if (this.cont) this.scroll_pos = this.cont.scrollTop;
    },

    scroll_restore: function () {
      if (this.cont) this.cont.scrollTop = this.scroll_pos;
    }
  };

  var Pager = new function() {
    var loaded = ((_extension_data && _extension_data.has_pager) ||
                  window.AutoPagerize || window.AutoPatchWork ||
                  $('AutoPatchWork-Bar'));
    var funcs = [];
    this.wait = function(func) {
      if (loaded) {
        func();
      } else {
        funcs.push(func);
      }
    };
    if (loaded) return;
    $ev(window.document).listen(['GM_AutoPagerizeLoaded', 'AutoPatchWork.initialized'], function(ev, conn) {
      loaded = true;
      each(funcs, function(func) { func(); });
      conn.disconnect();
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
    }

    ctx.prototype = {
      script: function(url) {
        log('$js#script: ' + url);
        this.urls.push(url);
        if (this.block) {
          ++this.load_cnt;
        } else {
          this.add_load(url, true);
        }
        return this;
      },

      wait: function(func) {
        log('$js#wait');
        if (this.load_cnt > 0) {
          var new_obj = new ctx(true);
          this.wait = {ctx: new_obj, func: func};
          return new_obj;
        } else {
          if (func) func();
          return this;
        }
      },

      add_load: function(url, raise) {
        var elem = chk_ext_src('script', 'src', url);
        if (raise) ++this.load_cnt;
        if (elem) {
          if (elem.getAttribute('type') === 'script/cache') { // webkit
            log('$js#labjs: ' + url);
            var callee = arguments.callee, self = this;
            setTimeout(function() { callee.apply(self, [url]); }, 0);
          } else if (elem.readyState === 'loading' || elem.readyState === 'interactive') {
            log('$js#preexists: ' + url);
            wait.apply(this, [elem]);
          } else if (elem.readyState) { // for opera
            load_cb.apply(this);
          } else {
            setTimeout(bind(load_cb, this), 0);
          }
        } else {
          log('$js#load: ' + url);
          elem = $c('script', null, {async: false});
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
      },

      fire: function() {
        log('$js#fire');
        this.block = false;
        each(this.urls, function(url) {
          this.add_load(url);
        }, this);
      },

      unblock: function() {
        log('$js#unblock');
        if (this.wait) {
          if (this.wait.func) this.wait.func();
          if (this.wait.ctx)  this.wait.ctx.fire();
        }
      }
    };
  };

  function getpos(elem, root) {
    var left = elem.offsetLeft, top = elem.offsetTop;
    while((elem = elem.offsetParent) && elem !== root) {
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
    if (!elem || elem === arguments.callee.last) return;
    offset = parseFloat(typeof offset === 'undefined' ? 0.2 : offset);
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
          if (/auto|scroll/i.test(style.overflowY)) {
            lazy_scroll(elem, offset, p, p);
            break;
          }
        }
        p = p.parentNode;
      }
      lazy_scroll(elem, offset, doc.documentElement, browser.webkit ? doc.body : doc.documentElement); /* WARN */
    }
  }

  function send_click(elem) {
    var ev = elem.ownerDocument.createEvent('MouseEvents');
    ev.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    elem.dispatchEvent(ev);
  }

  function parseopts(str) {
    var opts = {};
    each(str.replace(/^.*?\?/, '').replace(/#.*$/, '').split('&'), function(p) {
      var pair = p.split('=', 2);
      if (pair[0] && pair[1]) {
        opts[pair[0]] = pair[1];
      }
    });
    return opts;
  }

  function edit_comment(str) {
    str = str.replace(/(?:<br ?\/?>)*([\-\u2015\u2500\u2501\uff3f])\1{7,}(?:<br ?\/?>)*/g, '<hr />');
    if (!/<br[ \/>]/i.test(str)) {
      str = str
        .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
        .replace(/[\s\u3000]{4,}/g, '<br />');
    }
    return str.replace(/(<a\s+href=\")\/?jump\.php\?/ig, '$1');
  }

  var urlcache = new Object();
  function geturl(url, cb_load, cb_error, reload) {
    //geturl.cnt = geturl.cnt || 0;
    //if (++geturl.cnt % 3 === 0) return cb_error();
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
  function getimg(url, cb_load, cb_error, cb_abort) {
    if (url instanceof Array) {
      var stop = false, urls = [].concat(url);
      function check() {
        if (stop) return;
        for(var i = 0; i < urls.length; ++i) {
          if (urls[i]) {
            if (typeof urls[i] === 'string' || urls[i] instanceof String) {
              return;
            } else {
              stop = true;
              cb_load(urls[i]);
            }
            return;
          }
        }
        stop = true;
        cb_error();
      }
      each(urls, function(url, idx) {
        if (stop) return;
        getimg(url, function(image) {
          urls[idx] = image;
          check();
        }, function() {
          urls[idx] = null;
          check();
        });
      });
    } else {
      if (getimg.cache[url]) {
        if (cb_load) cb_load(getimg.cache[url]);
      } else {
        function error() {
          getimg.cache[url] = false;
          cb_error();
        }
        var img = new Image();
        img.addEventListener('load', function() {
          img.parentNode.removeChild(img);
          getimg.cache[url] = img;
          if (cb_load) cb_load(img);
        }, false);
        if (cb_error && !cb_abort) cb_abort = cb_error;
        if (cb_error) img.addEventListener('error', error, false);
        if (cb_abort) img.addEventListener('abort', cb_abort, false);
        img.src = url;
        img.style.display = 'none';
        window.document.body.appendChild(img);
      }
    }
  }
  getimg.cache = {};
  function urlmode(url, mode) {
    return url.replace(/([\?&])mode=[^&]*/, '$1mode=' + mode);
  }
  function chk_ext_src(elem, attr, url) {
    var name = url.replace(/\?.*$/, '').replace(/.*\//, '');
    var ret = $x('//' + elem + '[contains(@' + attr + ', "' + name + '")]');
    if (conf.debug && ret) {
      var attr_f = ret.getAttribute(attr);
      if (attr_f !== url) alert('New one?\n' + attr_f);
    }
    return ret;
  }

  function load_css(url) {
    if (chk_ext_src('link', 'href', url)) {
      return false;
    } else {
      $c('link', window.document.body, {rel: 'stylesheet', type: 'text/css', href: url});
      return true;
    }
  }

  function log(msg) {
    if (!conf.debug) return;
    if (window.console && window.console.log) {
      window.console && window.console.log && window.console.log(msg);
    } else if (window.opera) {
      window.opera.postError(String(msg));
    }
  }

  function create_post_data(form) {
    var data = new Object();
    each($t('input', form), function(input) {
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

  function alert() {
    safeWindow.alert.apply(safeWindow, Array.prototype.slice.apply(arguments));
  }

  // 10.63+ loading => interactive => DOMContentLoaded => complete => Load
  // http://my.opera.com/crckyl/blog/show.dml/26153641
  if (window.opera && (window.opera.version() < 10.50 || window.document.readyState === 'loading')) {
    window.document.addEventListener('DOMContentLoaded', init_pixplus, false);
  } else {
    init_pixplus();
  }
}, this.unsafeWindow,
   /* __GREASEMONKEY_REMOVE__
    true
    __GREASEMONKEY_REMOVE__ */
   false /* __GREASEMONKEY_REMOVE__ */
  );
