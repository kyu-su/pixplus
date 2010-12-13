// ==UserScript==
// @name        pixplus-c2n.js
// @author      wowo
// @version     0.1
// @license     Public domain
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// ==/UserScript==

(function() {
   document.addEventListener(
     'pixplusInitialize',
     function() {
       var bg_div;
       window.opera.pixplus.conf.popup.overlay_control = false;
       window.opera.pixplus.Popup.oncreate.connect(
         function() {
           var self = this;
           bg_div = document.createElement('div');
           bg_div.style.cssText = 'position:fixed;top:0px;left:0px;width:100%;height:100%;' +
             'background-color:black;opacity:0.4;z-index:9999;';
           bg_div.addEventListener( 'click', function() { self.close(); }, false);
           document.body.appendChild(bg_div);
         });
       window.opera.pixplus.Popup.onclose.connect(
         function() {
           document.body.removeChild(bg_div);
         });
       window.opera.pixplus.Popup.onclick.connect(
         function(ev) {
           ev.preventDefault();
           this.next(true);
           return true;
         });
     }, false);
 })();
