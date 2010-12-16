// ==UserScript==
// @name        pixplus-dogear.js
// @author      wowo
// @version     0.1
// @license     Public domain
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// ==/UserScript==

(function() {
   var LS = {
     s: window.localStorage,
     prefix: '__pp_dogear_',
     get: function(key) {
       return LS.s.getItem(LS.prefix + key);
     },
     set: function(key, value) {
       LS.s.setItem(LS.prefix + key, value);
     }
   };

   function init() {
     var page = location.pathname.replace(/\W/ig, '_');
     var id = LS.get(page + '_id');
     var icon;

     window.opera.pixplus.Popup.onsetitem.connect(
       function(item) {
         if (item.gallery) {
           LS.set(page + '_id', item.id);
           move_icon(item);
         }
       });
     window.opera.pixplus.Gallery.oncreate.connect(
       function() {
         this.items.forEach(check_item);
         this.onadditem.connect(check_item);
       });

     function move_icon(item) {
       if (item.thumb) {
         if (!icon) {
           icon = document.createElement('span');
           icon.className = 'pixplus-check';
           icon.style.position = 'absolute';
         }
         if (icon.parentNode) icon.parentNode.removeChild(icon);
         icon.style.pixelLeft = item.thumb.offsetLeft + 2;
         icon.style.pixelTop = item.thumb.offsetTop + 2;
         item.thumb.offsetParent.appendChild(icon);
       }
     }

     function check_item(item) {
       if (item.id == id) {
         move_icon(item);
         id = null;
       }
     }
   }
   document.addEventListener('pixplusInitialize', init, false);
 })();
