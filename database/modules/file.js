const _ = require('lodash');
const shortId = require('shortid');
const fileType = require('file-type');
const parseBase64 = require('../utils/parse-base64');

module.exports = function (CB) {

  const b64Digit = function (number) {
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

  const encodeBase64 = function (array) {
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

  CB.File = function (name, data, mimeType, extName) {
    this.attributes = {
      name: name,
      url: '',
      metaData: {},
      provider: '',
      mimeType: mimeType || '',
    };
    if(_.isString(data)) {
      throw new TypeError("Creating an CB.File from a String is not yet supported.");
    }
    if(_.isArray(data)) {
      this.attributes.metaData.size = data.length;
      data = { base64: encodeBase64(data) };
    }
    this._data = data;
    this._extName = extName || '';
    let owner = null;
    if (data && data.owner) owner = data.owner;
    this.attributes.metaData.owner = owner ? owner.id : 'unknown';
  };
  /**
   * 通过url构建CBFile
   * @param name
   * @param url
   * @param metaData
   * @param mimeType
   * @return {File}
   */
  CB.File.withURL = function (name, url, metaData, mimeType) {
    if(!name || !url) throw new Error("Please provide file name and url");
    const file = new CB.File(name, null, mimeType);
    if(metaData) {
      for(let prop in metaData) {
        if(!file.attributes.metaData[prop]) file.attributes.metaData[prop] = metaData[prop];
      }
    }
    file.attributes.url = url;
    file.attributes.provider = 'external';
    return file;
  };
  /**
   * 获取指针对象
   * @param objectId
   * @param relationId
   */
  CB.File.getPointer = function (objectId, relationId) {
    return {
      __type: "File",
      className: relationId ? `_File@_@${relationId}` : '_File',
      objectId: objectId
    };
  };

  CB.File.prototype = {
    className: '_File',

    rootName: 'files',

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
     * 获取内存大小
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
     * 设置根目录名
     * @param name
     */
    setRootName: function (name) {
      this.rootName = name;
    },
    /**
     * 设置分类
     * @param cate
     */
    setCategory: function (cate) {
      if(!cate) return;
      this.set('category', cate);
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
        case 'category':
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
      return CB.File.getPointer(this.id);
    },
    /**
     * 设置归属id，表示使用继承表保存
     * @param relationId
     */
    belongTo: function (relationId) {
      if(!relationId) return;
      this._belongTo = `${this.className}@_@${relationId}`;
    },
    /**
     * 保存数据
     * @param client
     * @return {*}
     */
    save: async function (client) {
      let fileId = '';
      if(this._data) {
        let data =  this._data;
        if(data.base64) data = parseBase64(data.base64);
        if(Buffer.isBuffer(data)) this.attributes.metaData.size = data.length;
        const typeInfo = fileType(data);
        if(_.isObject(typeInfo) && typeInfo.mime) {
          this._extName = typeInfo.ext;
          this.set('mimeType', typeInfo.mime);
        }
        fileId = this.id || shortId.generate();
        const ossCloud = await CB.oss.uploadBuffer(`${this.rootName}/${fileId}${this._extName ? `.${this._extName}` : ''}`, data);
        if(!ossCloud.url) throw new Error('Upload successful, but unknown reason can not get url');
        const url = CB.oss.config.url ? `${CB.oss.config.url}/${ossCloud.name}` : ossCloud.url;
        this.set('url', url);
        this.set('provider', 'oss');
      }
      const unsaved = this.toOrigin();
      if(fileId) unsaved['objectId:override'] = fileId;
      delete unsaved.__type;
      delete unsaved.className;
      if(this._belongTo) {
        await CB.table.createChildTable('public', this.className, this._belongTo, [
          {name: 'objectId', type: 'text', isPrimary: true}
        ], client);
        this.className = this._belongTo;
      }
      const saved = await CB.crud.save(this.className, unsaved, null, null, client);
      this.id = saved.objectId;
      return this;
    },
    /**
     * 删除文件
     * @param suffix
     * @param client
     * @return {*}
     */
    destroy: async function (suffix, client) {
      if(!this.id) throw new Error('待删除的文件必须指定其objectId！');
      if(this._belongTo) this.className = this._belongTo;
      //***从数据库中删除
      await CB.crud.delete(this.className, {
        objectId: this.id
      }, null, client);
      //***从oss中删除
      await CB.oss.deleteFile(`${this.rootName}/${this.id}.${suffix}`);
      return 'ok';
    }
  };

};
