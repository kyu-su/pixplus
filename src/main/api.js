_.popup.api = {
  call: function(url, data, onsuccess, onerror) {
    for(var key in data) {
      if (typeof(data[key]) === 'function') {
        var err = false;
        data[key] = data[key](function() {
          _.popup.status_error.apply(_.popup, arguments);
          if (onerror) {
            onerror();
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
          _.popup.status_error('JSON parse error', ex);
          if (onerror) {
            onerror();
          }
          return;
        }
        onsuccess(data);
      },
      function(message) {
        _.popup.status_error('XHR error: ' + message);
        if (onerror) {
          onerror();
        }
      }
    );
  },

  token: function(error) {
    if (_.popup.illust.token) {
      return _.popup.illust.token;
    } else {
      error('Failed to detect security token needed to call APIs');
    }
    return null;
  },

  uid: function(error) {
    try {
      return w.pixiv.user.id;
    } catch(ex) {
      error('Failed to get user id', ex);
    }
    return null;
  }
};
