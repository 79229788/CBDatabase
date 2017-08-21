const _ = require('lodash');

module.exports = function (CB) {
  const hexOctet = function hexOctet() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  // port from browserify path module
  // since react-native packager won't shim node modules.
  const extname = function extname(path) {
    return path.match(/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/)[4];
  };

  const b64Digit = function b64Digit(number) {
    if (number < 26) {
      return String.fromCharCode(65 + number);
    }
    if (number < 52) {
      return String.fromCharCode(97 + (number - 26));
    }
    if (number < 62) {
      return String.fromCharCode(48 + (number - 52));
    }
    if (number === 62) {
      return '+';
    }
    if (number === 63) {
      return '/';
    }
    throw new Error('Tried to encode large digit ' + number + ' in base64.');
  };

  const encodeBase64 = function encodeBase64(array) {
    const chunks = [];
    chunks.length = Math.ceil(array.length / 3);
    _.times(chunks.length, function (i) {
      const b1 = array[i * 3];
      const b2 = array[i * 3 + 1] || 0;
      const b3 = array[i * 3 + 2] || 0;

      const has2 = i * 3 + 1 < array.length;
      const has3 = i * 3 + 2 < array.length;

      chunks[i] = [b64Digit(b1 >> 2 & 0x3F), b64Digit(b1 << 4 & 0x30 | b2 >> 4 & 0x0F), has2 ? b64Digit(b2 << 2 & 0x3C | b3 >> 6 & 0x03) : "=", has3 ? b64Digit(b3 & 0x3F) : "="].join("");
    });
    return chunks.join("");
  };

  CB.File = function (name, data) {
    this.attributes = {
      name: name,
      url: '',
      metaData: {},
      // 用来存储转换后要上传的 base64 String
      base64: ''
    };
    if (_.isString(data)) {
      throw new TypeError("Creating an AV.File from a String is not yet supported.");
    }
    if (_.isArray(data)) {
      this.attributes.metaData.size = data.length;
      data = { base64: encodeBase64(data) };
    }
    this._extName = '';
    this._data = data;
    let owner = null;
    if (data && data.owner) owner = data.owner;
    this.attributes.metaData.owner = owner ? owner.id : 'unknown';
  };
  /**
   * Creates a fresh AV.File object with exists url for saving to CB Server.
   * @param {String} name the file name
   * @param {String} url the file url.
   * @param {Object} [metaData] the file metadata object.
   * @param {String} [type] Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   * @return {CB.File} the file object
   */
  CB.File.withURL = function (name, url, metaData, type) {
    if (!name || !url) {
      throw new Error("Please provide file name and url");
    }
    const file = new CB.File(name, null, type);
    //copy metaData properties to file.
    if (metaData) {
      for (let prop in metaData) {
        if (!file.attributes.metaData[prop]) file.attributes.metaData[prop] = metaData[prop];
      }
    }
    file.attributes.url = url;
    //Mark the file is from external source.
    file.attributes.metaData.__source = 'external';
    return file;
  };

  CB.File.prototype = {
    className: '_File',

    toJSON: function toJSON() {
      const json = this._toFullJSON();
      // add id and keep __type for backward compatible
      if (_.has(this, 'id')) {
        json.id = this.id;
      }
      return json;
    },
    _toFullJSON: function _toFullJSON(seenObjects) {
      const _this = this;

      const json = _.clone(this.attributes);
      AV._objectEach(json, function (val, key) {
        json[key] = AV._encode(val, seenObjects);
      });
      AV._objectEach(this._operations, function (val, key) {
        json[key] = val;
      });

      if (_.has(this, "id")) {
        json.objectId = this.id;
      }
      _(['createdAt', 'updatedAt']).each(function (key) {
        if (_.has(_this, key)) {
          var val = _this[key];
          json[key] = _.isDate(val) ? val.toJSON() : val;
        }
      });
      json.__type = "File";
      return json;
    },


  };

};
