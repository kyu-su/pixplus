_.extend(_, {
  redirect_jump_page: function(root) {
    if (_.conf.general.redirect_jump_page !== 2) {
      return;
    }
    _.qa('a[href*="jump.php"]', root).forEach(function(link) {
      var re;
      if ((re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?jump\.php\?(.+)$/.exec(link.href))) {
        link.href = g.decodeURIComponent(re[1]);
      }
    });
  },

  modify_caption: function(caption, base_illust) {
    if (!caption) {
      return;
    }

    var last = null;
    _.qa('a[href*="mode=medium"]', caption).forEach(function(link) {
      var query = _.illust.parse_illust_url(link.href);
      if (query && query.mode === 'medium' && query.illust_id) {
        var illust = _.illust.create_from_id(query.illust_id);
        illust.link = link;
        illust.connection = _.onclick(illust.link, function() {
          _.popup.show(illust);
          return true;
        });
        illust.prev = last || base_illust;
        if (last) {
          last.next = illust;
        }
        last = illust;
      }
    });

    if (last) {
      last.next = base_illust;
    }
  },

  reorder_tag_list: function(list, cb_get_tagname) {
    var list_parent = list.parentNode, lists = [list];

    var tags = _.qa('li', list), tag_map = { };
    tags.forEach(function(tag) {
      var tagname = cb_get_tagname(tag);
      if (tagname) {
        tag_map[tagname] = tag;
        tag.parentNode.removeChild(tag);
      }
    });

    var all_list, all_list_before;

    var add_list = function() {
      var new_list = list.cloneNode(false);
      list_parent.insertBefore(new_list, list.nextSibling);
      list = new_list;
      lists.push(list);
      return list;
    };

    _.conf.bookmark.tag_order.forEach(function(tag_order, idx) {
      if (idx > 0) {
        add_list();
      }
      tag_order.forEach(function(tag) {
        if (tag) {
          if (tag_map[tag]) {
            list.appendChild(tag_map[tag]);
            tag_map[tag] = null;
          }
        } else {
          all_list = list;
          all_list_before = list.lastChild;
        }
      });
    });

    for(var tag in tag_map) {
      if (!tag_map[tag]) {
        continue;
      }
      if (!all_list) {
        all_list = add_list();
      }
      all_list.insertBefore(tag_map[tag], all_list_before ? all_list_before.nextSibling : null);
    }

    return lists;
  }
});
