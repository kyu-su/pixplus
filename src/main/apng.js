(function(generator) {
  _.apng = generator();
  _.apng.base64 = _.base64;
  _.apng.crc32 = _.crc32;
  _.apng.__mod_generator = generator;

  var APNGDialog = _.class.create(_.Dialog.prototype, {
    init: function(illust, get_frames) {
      APNGDialog.super.init.call(this, {title: _.lng.apng.title, cls: 'pp-apng-generator'});
      this.illust = illust;
      this.get_frames = get_frames;

      var dom = this.dom;
      dom.progressbar = _.e('div', {cls: 'pp-progress-bar'}, dom.content);
      dom.progress = _.e('div', {cls: 'pp-progress'}, dom.progressbar);
      dom.error = _.e('div', {id: 'pp-apng-generator-error'}, dom.content);
      dom.preview = new w.Image();
      dom.preview.id = 'pp-apng-generator-preview';
      dom.content.appendChild(dom.preview);
      dom.warning = _.e('div', {id: 'pp-apng-generator-warning', text: _.lng.apng.warning}, dom.content);
      dom.preparing = _.e('div', {id: 'pp-apng-generator-preparing', text: _.lng.apng.preparing}, dom.content);
      dom.howtosave = _.e('div', {id: 'pp-apng-generator-howtosave', text: _.lng.apng.how2save}, dom.content);

      _.listen(dom.preview, 'load', function() {
        _.modal.centerize();
      });

      var that = this;
      dom.generate = this.add_action('generate', {
        text: _.lng.apng.generate,
        callback: this.generate.bind(this)
      });

      dom.dl_link = this.add_action('download', {
        text: _.lng.apng.download,
        type: 'link'
      });

      this.add_action('close');

      var retry = function() {
        that.frames = that.get_frames();
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

    generate: function() {
      this.dom.generate.setAttribute('disabled', '');
      try {
        _.apng.generate(
          this.frames,
          this.oncomplete.bind(this),
          this.onerror.bind(this),
          this.onprogress.bind(this)
        );
      } catch(ex) {
        var msg = String(ex);
        if (msg.length > 100) {
          msg = msg.slice(0, 100) + ' ...';
        }
        this.onerror([
          msg,
          '',
          'Stack:',
          ex.stack
        ].join('\n'));
      }
    },

    onprogress: function(curr, max) {
      this.dom.progress.style.width =
        g.Math.floor(this.dom.progressbar.clientWidth * curr / max) + 'px';
    },

    onerror: function(msg) {
      this.dom.error.textContent = (msg || 'Unknown error');
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

    onclose: function() {
      APNGDialog.super.onclose.call(this);
      this.revoke_object_url();
    }
  });

  _.apng.Dialog = APNGDialog;

})(function() {
  return {
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
          result = this.base64.enc(result);
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
          'apng.base64=(', _.base64.__mod_generator.toString(), ')();',
          'apng.crc32=(', _.crc32.__mod_generator.toString(), ')();',
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
        this.uint32(this.crc32.calc([type].concat(bodies)))
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
        data = this.base64.dec(frame.image_b64);
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
