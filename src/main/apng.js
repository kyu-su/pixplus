(function(generator) {
  _.apng = generator();
  _.apng.__mod_generator = generator;
})(function() {
  return {
    crc: {
      table: [
        0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035,
        249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049,
        498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639,
        325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317,
        997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443,
        901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665,
        651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303,
        671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565,
        1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059,
        2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297,
        1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223,
        1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405,
        1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995,
        1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649,
        1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015,
        1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989,
        3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523,
        3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377,
        4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879,
        4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637,
        3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859,
        3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161,
        3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815,
        3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221,
        2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371,
        2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881,
        2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567,
        2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701,
        2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035,
        2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897,
        3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431,
        3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117
      ],

      calc: function(bytesary) {
        var crc = 0xffffffff;
        for(var i = 0; i < bytesary.length; ++i) {
          var data = bytesary[i];
          for(var j = 0; j < data.length; ++j) {
            crc = (this.table[((crc ^ data[j]) >>> 0) & 0xff] ^ (crc >>> 8)) >>> 0;
          }
        }
        crc = (crc ^ 0xffffffff) >>> 0;
        return crc;
      }
    },

    b64: {
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

      decode: function(b64str) {
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

        var buf = new ArrayBuffer(length),
            data = new Uint8Array(buf);

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

      encode: function(bytesary) {
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
    },

    dialog: {
      dom: {},

      create: function() {
        if (this.dom.root) {
          return;
        }

        var dom = this.dom;
        dom.root = _.e('div', {id: 'pp-apng-generator', cls: 'pp-dialog'});
        dom.title = _.e('div', {text: _.lng.apng.title, cls: 'pp-dialog-title'}, dom.root);
        dom.content = _.e('div', {cls: 'pp-dialog-content'}, dom.root);
        dom.progressbar = _.e('div', {cls: 'pp-progress-bar'}, dom.content);
        dom.progress = _.e('div', {cls: 'pp-progress'}, dom.progressbar);
        dom.error = _.e('div', {id: 'pp-apng-generator-error'}, dom.content);
        dom.preview = new w.Image();
        dom.preview.id = 'pp-apng-generator-preview';
        dom.content.appendChild(dom.preview);
        dom.warning = _.e('div', {id: 'pp-apng-generator-warning', text: _.lng.apng.warning}, dom.content);
        dom.preparing = _.e('div', {id: 'pp-apng-generator-preparing', text: _.lng.apng.preparing}, dom.content);
        dom.howtosave = _.e('div', {id: 'pp-apng-generator-howtosave', text: _.lng.apng.how2save}, dom.content);
        dom.actions = _.e('div', {cls: 'pp-dialog-actions'}, dom.content);
        dom.generate = _.e('button', {text: _.lng.apng.generate, id: 'pp-apng-generator-generate'}, dom.actions);
        dom.cancel = _.e('button', {text: _.lng.apng.cancel, id: 'pp-apng-generator-cancel'}, dom.actions);
        dom.dl_link = _.e('a', null, dom.actions);
        dom.download = _.e('button', {text: _.lng.apng.download}, dom.dl_link);
        dom.close = _.e('button', {text: _.lng.apng.close, id: 'pp-apng-generator-close'}, dom.actions);

        _.listen(this.dom.preview, 'load', function() {
          _.modal.centerize();
        });

        var that = this;

        _.listen(dom.generate, 'click', function() {
          dom.generate.setAttribute('disabled', '');
          try {
            _.apng.generate(
              that.frames,
              that.oncomplete.bind(that),
              that.onerror.bind(that),
              that.onprogress.bind(that)
            );
          } catch(ex) {
            that.onerror(String(ex));
          }
        });

        _.listen([dom.cancel, dom.close], 'click', function() {
          _.modal.end(dom.root);
        });
      },

      onprogress: function(curr, max) {
        this.dom.progress.style.width =
          g.Math.floor(this.dom.progressbar.clientWidth * curr / max) + 'px';
      },

      onerror: function(msg) {
        this.dom.error.textContent = 'Error: ' + (msg || 'Unknown error');
        this.dom.root.classList.add('pp-error');
        _.modal.centerize();
      },

      oncomplete: function(result, b64) {
        var dom = this.dom;
        if (b64) {
          dom.preview.src = 'data:image/png;base64,' + result;
          dom.howtosave.classList.add('pp-show');
        } else {
          var dl_filename = [
            this.illust.author_id,
            this.illust.id,
            this.illust.author_name,
            this.illust.title
          ].join(' ') + '.png';

          var blob = new w.Blob(result, {type: 'image/png'});
          this.object_url = w.URL.createObjectURL(blob);
          this.dom.preview.src = this.object_url;
          this.dom.dl_link.href = this.object_url;
          this.dom.dl_link.setAttribute('download', dl_filename);
          this.dom.dl_link.classList.remove('pp-hide');
          dom.howtosave.classList.remove('pp-show');
        }
        this.dom.root.classList.add('pp-done');
      },

      revoke_object_url: function() {
        if (this.object_url) {
          w.URL.revokeObjectURL(this.object_url);
          delete this.object_url;
        }
      },

      open: function(illust, get_frames) {
        this.create();

        this.illust = illust;

        this.dom.progress.style.width = '0px';
        this.dom.preview.src = '';
        this.dom.root.classList.remove('pp-done');
        this.dom.root.classList.remove('pp-error');
        this.dom.dl_link.classList.add('pp-hide');

        d.body.appendChild(this.dom.root);
        _.modal.begin(this.dom.root, {
          onclose: this.close.bind(this),
          centerize: 'both'
        });

        var that = this;
        var retry = function() {
          that.frames = get_frames();
          if (that.frames) {
            that.dom.root.classList.remove('pp-preparing');
          } else {
            that.dom.root.classList.add('pp-preparing');
            w.setTimeout(retry, 1000);
          }
          that.dom.generate[(that.frames ? 'remove' : 'set') + 'Attribute']('disabled', '');
        };
        retry();
      },

      close: function() {
        this.revoke_object_url();
        if (this.dom.root.parentNode) {
          this.dom.root.parentNode.removeChild(this.dom.root);
        }
      }
    },

    onmessage: function(ev) {
      try {
        var data = ev.data;
        var frames = data.frames;
        var transferables = [];
        frames.forEach(function(frame) {
          if (frame.image_buf) {
            transferables.push(frame.image_buf);
          }
        });

        var result = this.generate_bytes(frames);
        if (data.return_b64) {
          result = this.b64.encode(result);
        }
        self.postMessage({
          command: 'complete',
          data: {
            result: result,
            b64: data.return_b64
          }
        });
      } catch(ex) {
        var msg = String(ex);
        if (msg.length > 100) {
          msg = msg.slice(0, 100) + ' ...';
        }
        self.postMessage({
          command: 'error',
          data: [
            'JS error (maybe bug)',
            '',
            msg,
            '',
            'Stack:',
            ex.stack
          ].join('\n')
        });
      }
    },

    send_progress: function(curr, max) {
      self.postMessage({
        command: 'progress',
        data: [curr, max]
      });
    },

    generate: function(frames, oncomplete, onerror, onprogress) {
      var that = this;

      this.prepare_frames(frames, function(frames, transferables) {
        var code = [
          'apng=(', that.__mod_generator.toString(), ')();',
          'onmessage=apng.onmessage.bind(apng);'
        ];

        var worker, objurl;

        if (w.Blob && w.URL) {
          var blob = new w.Blob(code, {type: 'application/javascript'});
          objurl = w.URL.createObjectURL(blob);
          worker = new w.Worker(objurl);
        } else {
          // Presto Opera support
          worker = new w.Worker('data:application/javascript,' + w.encodeURIComponent(code.join('')));
        }

        var end = function() {
          worker.terminate();
          if (objurl) {
            w.URL.revokeObjectURL(objurl);
          }
        };

        worker.onmessage = function(ev) {
          var data = ev.data, stop = false;

          if (data.command === 'progress') {
            onprogress(data.data[0], data.data[1]);
          } else if (data.command === 'error') {
            onerror(data.data);
            end();
          } else if (data.command === 'complete') {
            oncomplete(data.data.result, data.data.b64);
            end();
          }
        };

        worker.onerror = function(ev) {
          onerror(ev.message);
          end();
        };

        worker.postMessage({
          frames: frames,
          return_b64: !(w.Blob && w.URL)
        }, transferables);
      }, function(msg) {
        onerror(msg);
      }, onprogress);
    },

    prepare_frames: function(frames, oncomplete, onerror, onprogress) {
      var canvas = _.e('canvas');
      canvas.style.display = 'none';
      d.body.appendChild(canvas);

      var oncomplete_ = function(frames, transferables) {
        canvas.parentNode.removeChild(canvas);
        oncomplete(frames, transferables || []);
      };

      var onerror_ = function(msg) {
        canvas.parentNode.removeChild(canvas);
        onerror(msg);
      };

      if (canvas.toBlob) {
        this.prepare_frames_by_blob(canvas, frames, oncomplete_, onerror_, onprogress);
      } else {
        this.prepare_frames_by_data_url(canvas, frames, oncomplete_, onerror_);
      }
    },

    prepare_frames_by_blob: function(canvas, frames, oncomplete, onerror, onprogress) {
      var frames_new = [], transferables = [];

      var prog = 0, prog_max = frames.length * 2;

      var next_frame = function() {
        var frame = frames.shift();
        canvas.width = frame.image.naturalWidth;
        canvas.height = frame.image.naturalHeight;
        canvas.getContext('2d').drawImage(frame.image, 0, 0);

        canvas.toBlob(function(blob) {
          var reader = new w.FileReader();

          reader.onload = function() {
            frames_new.push({
              delay: frame.delay,
              image_buf: reader.result
            });
            transferables.push(reader.result);

            onprogress(++prog, prog_max);

            if (frames.length) {
              next_frame();
            } else {
              oncomplete(frames_new, transferables);
            }
          };

          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      };

      next_frame();
    },

    prepare_frames_by_data_url: function(canvas, frames, oncomplete, onerror) {
      var frames_new = [];

      frames.forEach(function(frame) {
        canvas.width = frame.image.naturalWidth;
        canvas.height = frame.image.naturalHeight;
        canvas.getContext('2d').drawImage(frame.image, 0, 0);

        var url = canvas.toDataURL('image/png');
        var match = /^data:image\/png;base64,(.*)$/.exec(url);
        if (!match) {
          onerror('Failed to parse data url');
        }

        frames_new.push({
          delay: frame.delay,
          image_b64: match[1]
        });
      });

      oncomplete(frames_new);
    },

    generate_bytes: function(frames) {
      var acTL = this.pack_chunk(
        [0x61, 0x63, 0x54, 0x4c], // acTL
        [
          this.uint32(frames.length),
          this.uint32(0) // loop count
        ]
      );

      this.seq_num = 0;

      var data = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])];
      for(var i = 0; i < frames.length; ++i) {
        var frame = this.make_frame(frames[i], i === 0 ? acTL : null);
        data = data.concat(frame);
        this.send_progress(frames.length + i + 1, frames.length * 2);
      }

      // IEND
      data = data.concat(this.pack_chunk([73, 69, 78, 68], []));
      return data;
    },

    uint32: function(value) {
      return new Uint8Array([
        (value >> 24) & 0xff,
        (value >> 16) & 0xff,
        (value >>  8) & 0xff,
        (value >>  0) & 0xff
      ]);
    },

    uint16: function(value) {
      return new Uint8Array([
        (value >> 8) & 0xff,
        (value >> 0) & 0xff
      ]);
    },

    pack_chunk: function(type, bodies) {
      return [
        this.uint32(bodies.reduce(function(a, b) {
          return a + b.byteLength;
        }, 0)),
        new Uint8Array(type)
      ].concat(bodies).concat([
        this.uint32(this.crc.calc([type].concat(bodies)))
      ]);
    },

    make_frame: function(frame, acTL) {
      var that = this;

      /* chunk order:
       IHDR
       acTL frame count, play count
       fcTL 1st frame header
       IDAT 1st frame data
       fcTL 2nd frame header
       fdAT 2nd frame data
       ...
       IEND

       https://wiki.mozilla.org/APNG_Specification#Chunk_Sequence_Numbers
       */

      var data;
      if (frame.image_buf) {
        data = new Uint8Array(frame.image_buf);
      } else {
        data = this.b64.decode(frame.image_b64);
      }

      // http://www.w3.org/TR/PNG/#5PNG-file-signature
      if (data[0] !== 137 ||
          data[1] !== 80 ||
          data[2] !== 78 ||
          data[3] !== 71 ||
          data[4] !== 13 ||
          data[5] !== 10 ||
          data[6] !== 26 ||
          data[7] !== 10) {
        throw 'Invalid PNG signature';
      }

      data = data.subarray(8);

      var chunk, IHDR, IDATs = [];
      while((chunk = this.parse_chunk(data))) {
        // http://www.w3.org/TR/PNG/#11Critical-chunks
        if (chunk.type === 'IHDR') {
          if (IHDR) {
            throw 'Multiple IHDR chunks detected';
          }
          IHDR = chunk;
        } else if (chunk.type === 'IDAT') {
          IDATs.push(chunk);
        } else {
          throw 'unexpected chunk type - ' + chunk.type;
        }
        data = data.subarray(chunk.size);
      }
      if (!IHDR) {
        throw 'IHDR chunk not found';
      }
      if (!IDATs.length) {
        throw 'IDAT chunk not found';
      }

      // IHDR: http://www.w3.org/TR/PNG/#11IHDR
      //   bytes
      //       4 Width
      //       4 Height
      //       1 Bit depth
      //       1 Colour type
      //       1 Compression method
      //       1 Filter method
      //       1 Interlace method

      // https://wiki.mozilla.org/APNG_Specification#.60fcTL.60:_The_Frame_Control_Chunk
      // offset
      //      0    sequence_number       (unsigned int)   Sequence number of the animation chunk, starting from 0
      //      4    width                 (unsigned int)   Width of the following frame
      //      8    height                (unsigned int)   Height of the following frame
      //     12    x_offset              (unsigned int)   X position at which to render the following frame
      //     16    y_offset              (unsigned int)   Y position at which to render the following frame
      //     20    delay_num             (unsigned short) Frame delay fraction numerator
      //     22    delay_den             (unsigned short) Frame delay fraction denominator
      //     24    dispose_op            (byte)           Type of frame area disposal to be done after rendering this frame
      //     25    blend_op              (byte)           Type of frame area rendering for this frame

      var fcTL = this.pack_chunk(
        [0x66, 0x63, 0x54, 0x4c],
        [
          this.uint32(this.seq_num++),
          IHDR.data.subarray(0, 8), // width, height
          this.uint32(0), // x_offset
          this.uint32(0), // y_offset
          this.uint16(frame.delay), // delay_num
          this.uint16(1000), // delay_den (1000 means that delay_num is millisecond)

          new Uint8Array([
            // dispose_op:
            //   0 APNG_DISPOSE_OP_NONE
            //   1 APNG_DISPOSE_OP_BACKGROUND
            //   2 APNG_DISPOSE_OP_PREVIOUS
            0,

            // blend_op:
            //   0 APNG_BLEND_OP_SOURCE
            //   1 APNG_BLEND_OP_OVER
            0
          ])
        ]
      );

      var ret;
      if (acTL) {
        ret = [IHDR.all_data].concat(acTL, fcTL);
        IDATs.forEach(function(IDAT) {
          ret.push(IDAT.all_data);
        });
      } else {
        ret = fcTL;
        IDATs.forEach(function(IDAT) {
          ret = ret.concat(that.pack_chunk(
            [0x66, 0x64, 0x41, 0x54],
            [
              that.uint32(that.seq_num++),
              IDAT.data
            ]
          ));
        });
      }

      return ret;
    },

    parse_chunk: function(data) {
      // http://www.w3.org/TR/PNG/#5Chunk-layout

      if (data.length < 12) {
        throw 'Data terminated unexpectedly';
      }

      if (data[0] & 0x80) {
        throw 'chunk size < 0';
      }

      var data_size = (((data[0] << 24) & 0xff000000) |
                       ((data[1] << 16) & 0x00ff0000) |
                       ((data[2] <<  8) & 0x0000ff00) |
                       ((data[3] <<  0) & 0x000000ff));
      var chunk_size = data_size + 12;

      if (data.length < chunk_size) {
        throw 'remaining data size < chunk size';
      }

      var chunk_type = '';
      for (var i = 4; i < 8; ++i) {
        var c = data[i];
        if ((c >= 65 && c <= 90 /* A-Z */) ||
            (c >= 97 && c <= 122 /* a-z */)) {
          chunk_type += String.fromCharCode(c);
        } else {
          throw 'invalid character for chunk type - ' + c;
        }
      }

      var crc = (((data[data_size +  8] << 24) & 0xff000000) |
                 ((data[data_size +  9] << 16) & 0x00ff0000) |
                 ((data[data_size + 10] <<  8) & 0x0000ff00) |
                 ((data[data_size + 11] <<  0) & 0x000000ff));

      if (chunk_type === 'IEND') {
        return null;
      }

      return {
        size: chunk_size,
        type: chunk_type,
        data: data.subarray(8, 8 + data_size),
        crc: crc,
        all_data: data.subarray(0, chunk_size)
      };
    }
  };
});
