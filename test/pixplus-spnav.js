// ==UserScript==
// @name        pixplus-spnav.js
// @author      wowo
// @version     0.1
// @license     Public domain
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// ==/UserScript==

(function() {
   var _p = 'pp_spnav';

   function init() {
     var css = window.opera.pixplus.write_css;
     css('.' + _p + '_item{padding:3px !important;}' +
         '.' + _p + '_item:focus,.' + _p + '_item:focus:hover{' +
         '  padding:4px !important;border:none !important;' +
         '  outline:0px solid;background-image:-o-skin("Active element inside");}'
     );

     window.opera.pixplus.Gallery.oncreate.connect(
       function() {
         this.items.forEach(bind(add_item, this));
         this.onadditem.connect(bind(add_item, this));
       });
     window.opera.pixplus.Popup.onsetitem.connect(
       function(item) {
         if (item.thumb) prefocus(item.thumb);
       });

     function add_item(item) {
       if (!item.thumb) return;

       var pos = getpos(item.thumb);
       if (pos.left < 0) return;

       if (!this.spnav) {
         this.spnav = {
           left: -1,
           rows: []
         };
       }
       if (this.spnav.left < 0 || pos.left < this.spnav.left) {
         this.spnav.rows.push([]);
       }
       this.spnav.left = pos.left;

       var row = this.spnav.rows.length - 1;
       var cell = this.spnav.rows[row].length;
       this.spnav.rows[row].push(item);
       if (cell > 0) {
         set_spnav(this.spnav.rows[row][cell - 1], item, true);
         set_spnav(item, this.spnav.rows[row][0], true);
       }
       if (row > 0) {
         if (cell < this.spnav.rows[row - 1].length) set_spnav(this.spnav.rows[row - 1][cell], item, false);
         //if (cell < this.spnav.rows[0].length) set_spnav(item, this.spnav.rows[0][cell], false);
       }

       item.thumb.addEventListener('focus', function() { window.opera.pixplus.lazy_scroll(document.activeElement); }, false);
     }
   }
   function load() {
     find(window.opera.pixplus.galleries,
          function(g) {
            return find(g.items,
                        function(item) {
                          if (item.thumb) {
                            prefocus(item.thumb);
                            return true;
                          }
                          return false;
                        }) >= 0;
          });
   }
   document.addEventListener('pixplusInitialize', init, false);
   document.addEventListener('pixplusLoaded', load, false);

   var num = 0;
   function set_spnav(item1, item2, side) {
     var a1 = item1.thumb, a2 = item2.thumb;
     if (!a1.id) a1.id = _p + ++num;
     if (!a2.id) a2.id = _p + ++num;
     if (a1.className.indexOf(_p + '_item') < 0) a1.className += ' ' + _p + '_item';
     if (a2.className.indexOf(_p + '_item') < 0) a2.className += ' ' + _p + '_item';
     if (side) {
       a1.style.navRight = '#' + a2.id;
       a2.style.navLeft = '#' + a1.id;
     } else {
       a1.style.navDown = '#' + a2.id;
       a2.style.navUp = '#' + a1.id;
     }
   }
   function prefocus(elem) {
     var ae, save;
     document.moveFocusRight();
     ae = document.activeElement;
     save = ae.style.navRight;
     ae.style.navRight = '#' + elem.id;
     document.moveFocusRight();
     ae.style.navRight = save;
   }

   function $x(xpath, root) {
     if (arguments.length > 1 && !root) return null;
     var doc = root ? root.ownerDocument : (root = document);
     // XPathResult.FIRST_ORDERED_NODE_TYPE = 9
     return doc.evaluate(xpath, root, null, 9, null).singleNodeValue;
   }
   function bind(func, obj) {
     var args = [].slice.apply(arguments, [2]);
     return function() {
       func.apply(obj || window, args.concat([].slice.apply(arguments)));
     };
   }
   function find(list, func) {
     for(var i = 0; i < list.length; ++i) {
       if (func(list[i], i)) return i;
     }
     return -1;
   }
   function getpos(element, root) {
     var left = element.offsetLeft, top = element.offsetTop;
     while((element = element.offsetParent) && element != root) {
       left += element.offsetLeft;
       top += element.offsetTop;
     }
     return {left: left, top: top};
   }
 })();
