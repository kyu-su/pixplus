_.popup.mouse = {
    init: function () {
        _.onwheel(w, function (ev) {
            if (!_.popup.running || _.conf.popup.mouse_wheel === 0) {
                return false;
            }

            var node = ev.target;
            while (node && node.nodeType === w.Node.ELEMENT_NODE) {
                if (node === d.body || node === d.documentElement) {
                    break;
                }
                if (node.scrollHeight > node.offsetHeight) {
                    return false;
                }
                node = node.parentNode;
            }

            var action;
            _.popup.input.wheel_delta += ev.wheelDelta || -ev.detail || 0;
            if (_.conf.popup.mouse_wheel_delta < 0) {
                if (_.popup.input.wheel_delta <= _.conf.popup.mouse_wheel_delta) {
                    action = 'prev';
                } else if (_.popup.input.wheel_delta >= -_.conf.popup.mouse_wheel_delta) {
                    action = 'next';
                }
            } else {
                if (_.popup.input.wheel_delta >= _.conf.popup.mouse_wheel_delta) {
                    action = 'prev';
                } else if (_.popup.input.wheel_delta <= -_.conf.popup.mouse_wheel_delta) {
                    action = 'next';
                }
            }
            if (action) {
                if (_.conf.popup.mouse_wheel === 1) {
                    action += '_direction';
                }
                _.popup.input[action]();
                _.popup.input.wheel_delta = 0;
            }

            return true;
        });

        var dom = _.popup.dom;

        _.onclick(dom.resize_mode, function () {
            _.popup.input.switch_resize_mode();
            return true;
        });

        _.onclick(dom.button_comment, function () {
            _.popup.comment.toggle();
            return true;
        });

        _.onclick(dom.button_vote, function () {
            _.popup.open_vote_dialog();
            return true;
        });

        _.onclick(dom.button_like, function () {
            _.popup.send_like();
            return true;
        });

        _.onclick(dom.button_bookmark, function () {
            _.popup.bookmark.toggle();
            return true;
        });

        _.onclick(dom.button_manga, function () {
            _.popup.manga.toggle();
            return true;
        });

        _.onclick(dom.image_wrapper, function () {
            _.popup.hide();
            return true;
        });

        _.onclick(dom.olc_prev, function () {
            _.popup.input.prev_direction();
            return true;
        });

        _.onclick(dom.olc_next, function () {
            _.popup.input.next_direction();
            return true;
        });

        _.onwheel(dom.image_scroller, function (ev) {

            /* Firefox
             *   MouseScrollEvent::axis
             *     HORIZONTAL_AXIS = 1
             *     VERTICAL_AXIS   = 2
             *
             * https://developer.mozilla.org/en/docs/DOM/MouseScrollEvent
             */

            if (((ev.wheelDeltaX || ev.axis === 1) && _.popup.can_scroll_horizontally()) ||
                ((ev.wheelDeltaY || ev.axis === 2) && _.popup.can_scroll_vertically())) {
                ev.stopPropagation();
            }
            return false;
        });

        _.onclick(dom.tagedit_wrapper, function (ev) {
            var endbtn = ev.target;
            if (/^input$/i.test(endbtn.tagName) && /endTagEdit/.test(endbtn.getAttribute('onclick'))) {
                _.popup.tagedit.end();
                return true;
            }
            return false;
        });

        _.onclick(dom.comment_form_btn, function () {
            _.popup.comment.toggle_form();
        });
    }
};
