_.base64 = (function(gen) {
  var base64 = gen();
  base64.__mod_generator = gen;
  return base64;
})(function() {
  return {
    make_table: function() {
      if (this.table) {
        return;
      }

      var that = this;
      this.table_dec = {};
      this.table_enc = [];
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function(c, i) {
        that.table_dec[c] = i;
        that.table_enc.push(c);
      });
    },

    dec: function(b64str) {
      this.make_table();

      b64str = b64str.replace(/=+$/, '');

      var length = Math.floor(b64str.length * 3 / 4),
          remains = b64str.length % 4;
      if (remains === 1) {
        throw 'Invalid base64 length';
      } else if (remains === 2) {
        ++length;
      } else if (remains === 3) {
        length += 2;
      }

      var data = new Uint8Array(length);

      for(var idx = 0, wi = 0; idx < b64str.length; ++idx) {
        var c = this.table_dec[b64str[idx]];
        if (typeof(c) === 'undefined') {
          throw 'Invalid character for base64 - ' + b64str[idx];
        }
        if ((idx % 4) === 0) {
          data[wi++] = (c << 2) & 0xfc;
        } else if ((idx % 4) === 1) {
          data[wi - 1] |= (c >> 4) & 0x3;
          data[wi++] = (c << 4) & 0xf0;
        } else if ((idx % 4) === 2) {
          data[wi - 1] |= (c >> 2) & 0xf;
          data[wi++] = (c << 6) & 0xc0;
        } else if ((idx % 4) === 3) {
          data[wi - 1] |= c & 0x3f;
        }
      }

      return data;
    },

    enc: function(bytesary) {
      this.make_table();

      var b64 = [];

      var that = this;
      var add = function(sixbits) {
        var c = that.table_enc[sixbits];
        if (!c) {
          throw 'Base64 encode table has no entry for - 0x' + sixbits.toString(16);
        }
        b64.push(c);
      };

      var idx = 0, p = -1;
      for(var i = 0; i < bytesary.length; ++i) {
        var bytes = bytesary[i];
        for(var j = 0; j < bytes.length; ++j) {
          if (idx % 3 === 0) {
            add((bytes[j] >> 2) & 0x3f);
            p = (bytes[j] << 4) & 0x30;
          } else if (idx % 3 === 1) {
            add(p | ((bytes[j] >> 4) & 0xf));
            p = (bytes[j] << 2) & 0x3c;
          } else if (idx % 3 === 2) {
            add(p | ((bytes[j] >> 6) & 0x3));
            add(bytes[j] & 0x3f);
          }
          ++idx;
        }
      }

      if (p >= 0) {
        add(p);
      }

      while((b64.length % 4) !== 0) {
        b64.push('=');
      }

      return b64.join('');
    }
  };
});
