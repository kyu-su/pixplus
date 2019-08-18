_.extend(_.i18n, {
    setup: function () {
        var lng;
        if (d.documentElement) {
            lng = _.i18n[d.documentElement.lang];
        }
        if (!lng && g.navigator) {
            lng = _.i18n[g.navigator.language];
        }
        _.lng = lng || _.i18n.en;
    },

    key_subst: function (msg, key) {
        return msg.replace('#{key}', {'comma': ',', 'plus': '+'}[key] || key);
    }
});
