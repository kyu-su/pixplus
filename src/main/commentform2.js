_.CommentForm2 = _.class.create({
    init: function (wrap, illust) {
        this.illust = illust;

        var dom = this.dom = {};

        dom.wrap = wrap;
        dom.illust = illust;

        dom.root = _.e('div', {cls: 'pp-commform2-root'}, wrap);
        dom.overlay = _.e('div', {cls: 'pp-commform2-overlay'}, dom.root);
        dom.overlay_message = _.e('div', {cls: 'pp-commform2-overlay-message'}, dom.overlay);
        dom.mainbar = _.e('div', {cls: 'pp-commform2-mainbar'}, dom.root);
        dom.prof_img = _.e('div', {cls: 'pp-commform2-prof-image'}, dom.mainbar);
        dom.textarea_wrap = _.e('div', {cls: 'pp-commform2-textarea-wrap'}, dom.mainbar);
        dom.textarea = _.e('textarea', {cls: 'pp-commform2-textarea'}, dom.textarea_wrap);
        dom.submit_wrap = _.e('div', {cls: 'pp-commform2-submit-wrap'}, dom.mainbar);
        dom.submit = _.e('button', {cls: 'pp-commform2-submit'}, dom.submit_wrap);

        // dom.overlay.appendChild(dom.icon_loading = _.svg.comment_loading(d));
        // dom.overlay.appendChild(dom.icon_error   = _.svg.comment_error(d));

        // dom.reply_to_wrap.insertBefore(
        //   dom.icon_reply_to = _.svg.comment_reply_to(d), dom.reply_to_wrap.firstChild);

        // var that = this;
        // this.tabs.forEach(function(name) {
        //   var text = _.lng.commform['tab_' + name],
        //       tab  = _.e('div', {cls: 'pp-commform-tab pp-commform-tab-' + name, text: text}, dom.tabbar),
        //       cont = _.e('div', {cls: 'pp-commform-cont pp-commform-cont-' + name}, dom.form);

        //   _.onclick(tab, function() {
        //     that.select_tab(name);
        //   });

        //   dom['tab_' + name]  = tab;
        //   dom['cont_' + name] = cont;

        //   that['tab_' + name](cont);
        // });

        // this.select_tab(_.conf.general.commform_default_tab);
    }
});
