const _ = require('lodash');
const shortId = require('shortid');
const parseBase64 = require('../utils/parse-base64');

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

  CB.File = function (name, data, mimeType) {
    this.attributes = {
      name: name,
      url: '',
      metaData: {},
      provider: '',
      mimeType: '',
    };
    if (_.isString(data)) {
      throw new TypeError("Creating an CB.File from a String is not yet supported.");
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
    if(mimeType) this.set('mimeType', mimeType);
  };
  /**
   * 通过url构建CBFile
   * @param name
   * @param url
   * @param metaData
   * @param type
   * @return {File}
   */
  CB.File.withURL = function (name, url, metaData, type) {
    if(!name || !url) throw new Error("Please provide file name and url");
    const file = new CB.File(name, null, type);
    if(metaData) {
      for(let prop in metaData) {
        if(!file.attributes.metaData[prop]) file.attributes.metaData[prop] = metaData[prop];
      }
    }
    file.attributes.url = url;
    file.attributes.provider = 'external';
    return file;
  };

  CB.File.prototype = {
    className: '_File',

    /**
     * 获取文件名
     */
    getName: function () {
      return this.get('name');
    },
    /**
     * 获取文件链接
     */
    getUrl: function () {
      return this.get('url');
    },
    /**
     * 获取尺寸
     */
    getSize: function () {
      return this.metaData().size;
    },
    /**
     * 获取文件所有者
     * @return {owner|{id, displayName}|*}
     */
    getOwnerId: function () {
      return this.metaData().owner;
    },
    /**
     * 获取 metaData数据
     * @param attr
     * @return {*}
     */
    getMetaData: function (attr) {
      return this.attributes.metaData[attr];
    },
    /**
     * 设置 metaData数据
     * @param attr
     * @param value
     */
    setMetaData: function (attr, value) {
      if(_.isObject(attr) && !value) {
        _.each(attr, (v, k) => {
          this.setMetaData(k, v);
        });
      }
      this.attributes.metaData[attr] = value;
    },
    /**
     * 如果文件是图片，获取图片的缩略图URL。可以传入宽度、高度、质量、格式等参数。
     * @param width
     * @param height
     * @param quality
     * @param scaleToFit
     * @param fmt
     */
    thumbnailURL: function (width, height, quality, scaleToFit, fmt) {
      return '';
    },
    /**
     * 获取数据
     * @param attrName
     * @return {*}
     */
    get: function (attrName) {
      switch (attrName) {
        case 'objectId':
          return this.id;
        case 'url':
        case 'name':
        case 'mimeType':
        case 'metaData':
        case 'createdAt':
        case 'updatedAt':
          return this.attributes[attrName];
        default:
          return this.attributes.metaData[attrName];
      }
    },
    /**
     * 设置属性
     */
    set: function (key, value) {
      if(_.isObject(key) && !value) {
        _.each(key, (v, k) => {
          this.set(k, v);
        });
      }
      switch (key) {
        case 'name':
        case 'url':
        case 'mimeType':
        case 'provider':
        case 'metaData':
        case 'updatedAt':
        case 'createdAt':
          this.attributes[key] = value;
          break;
        case 'objectId':
          this.id = value;
          break;
        default:
          // File 并非一个 CBObject，不能完全自定义其他属性，所以只能都放在 metaData 上面
          if(_.isString(key)) this.attributes.metaData[key] = value;
          break;
      }
    },
    /**
     * 转化为json
     * @return {string}
     */
    toJSON: function () {
      return JSON.stringify(this.toOrigin());
    },
    /**
     * 转化为原始数据
     * @return {object}
     */
    toOrigin: function () {
      return CB._decode(this);
    },
    /**
     * 获取当前的引用对象(无完整数据）
     */
    getPointer: function () {
      return {
        __type: "File",
        className: '_File',
        objectId: this.id
      };
    },

    /**
     * 保存数据
     * @return {*}
     */
    save: async function (client) {
      if(this.id) throw new Error('File already saved. If you want to manipulate a file, use CB.Query to get it.');
      if(this._data) {
        const mimeType = this.get('mimeType');
        let data = this._data;
        if(data.base64) {
          data = parseBase64(data.base64, mimeType);
        }
        if(data.blob) {
          if(!data.blob.type && mimeType) {
            data.blob.type = mimeType;
          }
          if(!data.blob.name) {
            data.blob.name = this.get('name');
          }
          data = data.blob;
        }
        if(Buffer.isBuffer(data)) {
          this.attributes.metaData.size = data.length;
        }
        this.id = shortId.generate();
        const ossCloud = await CB.oss.uploadBuffer(this.id, data);
        this.set('url', ossCloud.url);
        this.set('provider', 'oss');
        const unsaved = this.toOrigin();
        unsaved['objectId:override'] = unsaved.objectId;
        delete unsaved.objectId;
        await CB.crud.save('_File', unsaved, client);
        if(!ossCloud.url) throw new Error('Upload successful, but unknown reason can not get url');
        return this;
      }else {
        const cbCloud = await CB.crud.save('_File', this.toOrigin(), client);
        this.id = cbCloud.objectId;
        return this;
      }
    },
  };

};
