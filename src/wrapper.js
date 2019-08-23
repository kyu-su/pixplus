// ==UserScript==
// @name        pixplusPlus
// @author      kyusu
// @version     @VERSION@
// @license     The MIT License
// @description hogehoge
// @icon        http://ccl4.info/pixplus/pixplus_48.png
// @icon64      http://ccl4.info/pixplus/pixplus_64.png
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @include     https://www.pixiv.net/*
// @run-at      document-start
// @downloadURL https://ccl4.info/cgit/pixplus.git/plain/autoupdate/1/pixplus.user.js
// @grant       none
// ==/UserScript==

(function (entrypoint) {
    var w = window, g = this || window;

    if (/pixivreader/.test(w.location.href) || w !== w.top) {
        return;
    }

    var greasemonkey = true;

    var inject = function () {
        var d = w.document;
        if (!(d.body || d.documentElement)) {
            // for scriptish
            window.setTimeout(function () {
                inject();
            }, 100);
            return;
        }
        var s = w.document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.textContent
            = ('(' + entrypoint.toString() + ')'
            + '(this || window,window,window.document)');
        (d.body || d.documentElement).appendChild(s);
    };

    inject();
})(function (g, w, d, _extension_data) {

    if (w.pixplus || w !== w.top) {
        return;
    }

    // __SRC__

    _.run();
});
