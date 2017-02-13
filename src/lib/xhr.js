_.xhr = {
  cache: { },

  remove_cache: function(url) {
    this.cache[url] = null;
  },

  request: function(method, url, headers, data, cb_success, cb_error) {
    var msg;

    if (!/^(?:(?:http)?:\/\/www\.pixiv\.net)?\/(?:member_illust|bookmark_add|rpc_rating|rpc_tag_edit|rpc\/post_comment)\.php(?:\?|$)/.test(url)) {
      msg = 'URL not allowed - ' + url;
      _.error(msg);
      if (cb_error) {
        cb_error(msg);
      }
      return;
    }

    var that = this;
    var xhr = new w.XMLHttpRequest();

    xhr.onload = function() {
      if (xhr.status === 200) {
        that.cache[url] = xhr.responseText;
        cb_success(xhr.responseText);
      } else {
        msg = xhr.status + ' ' + xhr.statusText;
        _.error(msg);
        if (cb_error) {
          cb_error(msg);
        }
      }
    };

    xhr.onerror = function() {
      msg = 'XHR communication error';
      _.error(msg);
      if (cb_error) {
        cb_error(msg);
      }
    };

    xhr.open(method, url, true);

    if (headers) {
      headers.forEach(function(p) {
        xhr.setRequestHeader(p[0], p[1]);
      });
    }

    xhr.send(data);
  },

  get: function(url, cb_success, cb_error) {
    if (this.cache[url]) {
      cb_success(this.cache[url]);
      return;
    }
    this.request('GET', url, null, null, cb_success, cb_error);
  },

  post_data: function(url, data, cb_success, cb_error) {
    this.request(
      'POST',
      url,
      [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
      this.serialize(data),
      cb_success, cb_error
    );
  },

  post: function(form, cb_success, cb_error) {
    this.request(
      'POST',
      form.getAttribute('action'),
      [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
      this.serialize(form),
      cb_success, cb_error
    );
  },

  serialize: function(form) {
    var data = '', data_map = { };
    if (/^form$/i.test(form.nodeName)) {
      _.qa('input', form).forEach(function(input) {
        switch((input.type || '').toLowerCase()) {
        case 'reset':
        case 'submit':
          break;
        case 'checkbox':
        case 'radio':
          if (!input.checked) {
            break;
          }
        default:
          data_map[input.name] = input.value;
          break;
        }
      });
    } else {
      data_map = form;
    }
    for(var key in data_map) {
      if (data) {
        data += '&';
      }
      data += g.encodeURIComponent(key) + '=' + g.encodeURIComponent(data_map[key]);
    }
    return data;
  }
};
