_.api = {
  post: function(url, illust, data, onsuccess, onerror) {
    for(var key in data) {
      if (typeof(data[key]) === 'function') {
        var err = false;
        data[key] = data[key](illust, function() {
          if (onerror) {
            onerror.call(w, arguments);
          }
          err = true;
        });
        if (err) {
          return;
        }
      }
    }

    _.xhr.post_data(
      url,
      data,
      function(res) {
        var data;
        try {
          data = JSON.parse(res);
        } catch(ex) {
          if (onerror) {
            onerror('JSON parse error', ex);
          }
          return;
        }
        onsuccess(data);
      },
      function(message) {
        if (onerror) {
          onerror('XHR error: ' + message);
        }
      }
    );
  },

  token: function(illust, error) {
    if (illust && illust.token) {
      return illust.token;
    } else {
      error('Failed to detect security token needed to call APIs');
    }
    return null;
  },

  uid: function(illust, error) {
    try {
      return w.pixiv.user.id;
    } catch(ex) {
      error('Failed to get user id', ex);
    }
    return null;
  }
};

_.popup.api = {
  post: function(url, data, onsuccess, onerror) {
    _.api.post(url, _.popup.illust, data, onsuccess, function() {
      _.popup.status_error.apply(_.popup, arguments);
      onerror.call(w, arguments);
    });
  }
};
