const _ = require('lodash');
const moment = require('moment');
const shortId = require('shortid');
const Condition = require('./crud_condition');

module.exports = function (CB) {
  /**
   * 合并嵌套的所有子对象
   * @param row
   */
  const mergeChildren = (row) => {
    const rootItems = {};
    //把连接过来的子类合并到其父根类属性中
    _.each(row, (value, key) => {
      if(key.indexOf('.') > 0) {
        const arr = key.split('.');
        if(arr.length === 2 && row[arr[0]] && row[arr[0]][arr[1]]) merge(row[arr[0]][arr[1]], value);
        if(arr.length === 3 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]]) merge(row[arr[0]][arr[1]][arr[2]], value);
        if(arr.length === 4 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]] && row[arr[0]][arr[1]][arr[2]][arr[3]]) merge(row[arr[0]][arr[1]][arr[2]][arr[3]], value);
        if(arr.length === 5 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]] && row[arr[0]][arr[1]][arr[2]][arr[3]] && row[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]]) merge(row[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]], value);
        delete row[key];
      }
      if(key.indexOf('^') === 0) rootItems[key] = value;
    });
    //把父根类合并到最外层对象中
    _.each(rootItems, (value, key) => {
      if(key.indexOf('^') === 0) {
        merge(row[key.substr(1)], value);
        delete row[key];
      }
    });
    //进行合并
    function merge(oldItem, newItem) {
      if(_.isArray(oldItem)) {
        oldItem = oldItem.map((item) => {
          return _.extend(item, _.find(newItem, {objectId: item.objectId}));
        });
      }
      _.extend(oldItem, newItem);
    }
  };
  /**
   * 数据类型兼容处理
   * 1.浮点数String转为Number
   * 2.时间String转为Date
   *
   * @param row
   * @param className
   * @param selectItems
   */
  const compatibleDataType = (row, className, selectItems) => {
    _.each(row, (value, key) => {
      if(_.isArray(value)) {
        value.forEach(item => {
          compatibleDataType({_: item}, className, selectItems);
        });
      }
      if(_.isObject(value) && ['Pointer', 'File'].indexOf(value.__type) > -1 && Object.keys(value).length > 3) {
        compatibleDataType(value, value.className, selectItems);
      }
      if(['createdAt', 'updatedAt'].indexOf(key) > -1) {
        row[key] = new Date(value);
      }
    });
    //搜索需要的列选项
    const floatColumns = [];
    const objectColumns = [];
    const stringColumns = [];
    CB.pgConfig.tableList.forEach(table => {
      if(table.name === className) {
        for(let column of table.columns) {
          if(selectItems.length > 0 && selectItems.indexOf(column) < 0) continue;
          if(column.type === 'money'
            || column.type === 'real'
            || column.type === 'double'
            || column.type.indexOf('numeric') === 0
            || column.type.indexOf('decimal') === 0
          ) {
            floatColumns.push(column);
          }
          if(column.type === 'object') {
            objectColumns.push(column);
          }
          if(column.type === 'text'
            || column.type.indexOf('char') === 0
            || column.type.indexOf('character') === 0
          ) {
            stringColumns.push(column);
          }
        }
      }
    });
    //处理浮点数数据
    floatColumns.forEach((column) => {
      const origin = row[column.name];
      if(_.isString(origin) && origin !== '') {
        const value = origin.replace('$', '');
        const number = Number(value);
        row[column.name] = !_.isNaN(number) ? number : value;
      }
    });
    //处理对象数据
    objectColumns.forEach((column) => {
      const origin = row[column.name];
      if(_.isString(origin) && origin !== '') {
        row[column.name] = JSON.parse(origin);
      }
    });
    //处理字符串数据
    stringColumns.forEach((column) => {
      const origin = row[column.name];
      if(!origin) row[column.name] = '';
    });
  };
  /**
   * 处理服务器数据
   * @param rows
   * @param className
   * @param selectItems
   */
  const handleServerData = (rows, className, selectItems) => {
    rows.forEach((row) => {
      mergeChildren(row);
      compatibleDataType(row, className, selectItems);
    });
  };
  /**
   * 数据库操作（数据库连接和关闭，请使用前自行实现）
   * @type {*}
   */
  CB.crud = {
    /**
     * 查询数据
     * @param className
     * @param type
     * @param options
     * @param client
     * @return {Promise.<number|Array|*|HTMLCollection|string|SQLResultSetRowList>}
     */
    find: async function (className, type, options, client) {
      type = type || 'find';
      const opts = _.extend({
        skip: 0,
        limit: 1000,
        //*** 指定列集合
        //- [[表字段]]
        selectCollection: [],
        //*** 包含查询集合，最多支持5层嵌套
        //- [{key: 表字段(嵌套务必使用"."连接), className: 表名, type: 类型(pointer, array), conditionCollection: 同主查询, conditionJoins: 同主查询, orderCollection: 同主查询}]
        includeCollection: [],
        //*** 条件查询集合
        //- [[{name: 指定名(仅在条件查询拼接时使用), key: 表字段, type: 条件类型(太多..省略)，jsonKey: json数据键, jsonValue: json数据值}]]
        conditionCollection: [],
        //*** 条件查询拼接
        //- 'name1 && (name2 || name3)'
        conditionJoins: '',
        //*** 排序集合
        //- [[{key: 表字段, type: 类型(asc, desc)]]
        orderCollection: [],
      }, options || {});
      //****************
      //*****指定查询列
      //*****
      let selectClause = `"${className}".*`;
      if(opts.selectCollection.length > 0) {
        const selects = _.flatten(opts.selectCollection);
        if(selects.indexOf('objectId') < 0) selects.unshift('objectId');
        if(selects.indexOf('createdAt') < 0) selects.push('createdAt');
        if(selects.indexOf('updatedAt') < 0) selects.push('updatedAt');
        selectClause = selects.map((value) => {
          return `"${className}"."${value}"`;
        }).join(',');
      }
      //****************
      //*****连接查询
      //*****
      let joinsSelectClause = '', joinsRelationClause = '', joinsGroupClause = '';
      let isExistJointArray = false;
      if(opts.includeCollection.length > 0) {
        isExistJointArray = !!_.find(opts.includeCollection, {type: 'array'});
        if(isExistJointArray) joinsGroupClause = `GROUP BY "${className}"."objectId"`;
        _.each(opts.includeCollection, (object) => {
          let _className = className, _tailKey = object.key.replace(/^\^/, '');
          if(object.key.indexOf('.') > -1) {
            const arr = object.key.split('.');
            if(arr.length > 5) throw new Error('[DATABASE FIND ERROR] - include查询最多仅支持5层嵌套，请规范使用！');
            const prev = _.clone(arr);prev.pop();
            _className = _.find(opts.includeCollection, {key: prev.join('.')}).className;
            _tailKey = arr[arr.length - 1].replace(/^\^/, '');
          }
          const joinClassOrigin = object.className; //连接表的原名
          const joinClassAlias = object.className = `${joinClassOrigin}_${_tailKey}_alias`; //连接表设置别名(防止不重复)
          if(object.type === 'array') {
            joinsSelectClause += `
              ,CASE WHEN COUNT("${joinClassAlias}") = 0 THEN '[]' ELSE JSON_AGG(TO_JSON("${joinClassAlias}")) END AS "${object.key}"
            `;
            joinsRelationClause += `
              LEFT JOIN LATERAL UNNEST("${_className}"."${_tailKey}") "${_className}_${_tailKey}_iterator" ON true
              LEFT JOIN "${joinClassOrigin}" AS "${joinClassAlias}"
              ON "${joinClassAlias}"."objectId" = "${_className}_${_tailKey}_iterator" ->> 'objectId'
            `;
          }else {
            if(isExistJointArray) {
              joinsSelectClause += `
                ,JSON_AGG(TO_JSON("${joinClassAlias}")) -> 0 AS "${object.key}"
              `;
              joinsGroupClause += `
                ,"${joinClassAlias}"."objectId"
              `;
            }else {
              joinsSelectClause += `
                ,ROW_TO_JSON("${joinClassAlias}") AS "${object.key}"
              `;
            }
            joinsRelationClause += `
              LEFT JOIN "${joinClassOrigin}" AS "${joinClassAlias}"
              ON "${joinClassAlias}"."objectId" = "${_className}"."${_tailKey}" ->> 'objectId'
            `;
          }
        });
      }
      //****************
      //*****查询条件
      //*****
      let whereClause = '';
      let conditionClauseItems = [];
      let conditionJoinsItems = [];
      let conditionClauseMap = {};
      //***主查询
      opts.conditionCollection.forEach((conditionObject) => {
        const clause = Condition(className, conditionObject);
        if(conditionObject.name) conditionClauseMap[className + conditionObject.name] = clause;
        conditionClauseItems.push(clause);
      });
      //处理条件拼接
      if(opts.conditionJoins && JSON.stringify(conditionClauseMap) !== '{}') {
        let conditionJoins = opts.conditionJoins;
        _.each(conditionClauseMap, (value, key) => {
          conditionJoins = conditionJoins.replace(key.replace(className, ''), value);
        });
        conditionJoinsItems.push('(' + conditionJoins.replace(/&\s*&/g, ' AND ').replace(/\|\s*\|/g, ' OR ') + ')');
      }
      //***关联查询
      opts.includeCollection.forEach((object) => {
        (object.conditionCollection || []).forEach((conditionObject) => {
          const clause = Condition(object.className, conditionObject);
          if(conditionObject.name) conditionClauseMap[object.className + conditionObject.name] = clause;
          conditionClauseItems.push(clause);
        });
        //处理条件拼接
        if(object.conditionJoins && JSON.stringify(conditionClauseMap) !== '{}') {
          let conditionJoins = object.conditionJoins;
          _.each(conditionClauseMap, (value, key) => {
            conditionJoins = conditionJoins.replace(key.replace(object.className, ''), value);
          });
          conditionJoinsItems.push('(' + conditionJoins.replace(/&\s*&/g, ' AND ').replace(/\|\s*\|/g, ' OR ') + ')');
        }
      });
      if(conditionClauseItems.length > 0) {
        whereClause = 'WHERE ' + conditionClauseItems.join(' AND ');
      }
      if(conditionJoinsItems.length > 0) {
        whereClause = 'WHERE ' + conditionJoinsItems.join(' AND ');
      }
      //****************
      //*****排序
      //*****
      let orderClause = '', orderItems = [];
      //***主查询
      if(opts.orderCollection.length === 0) {
        //当未指定时，使用默认排序
        orderItems.push(`"${className}"."createdAt" asc`);
      }else {
        opts.orderCollection.forEach((orderObject) => {
          orderItems.push(`"${className}"."${orderObject.key}" ${orderObject.type}`);
        });
      }
      //***关联查询
      opts.includeCollection.forEach((object) => {
        (object.orderCollection || []).forEach((orderObject) => {
          orderItems.push(`"${object.className}"."${orderObject.key}" ${orderObject.type}`);
        });
      });
      if(orderItems.length > 0) orderClause = 'ORDER BY ' + orderItems.join(', ');

      //****************
      //*****查询类型
      //*****
      switch (type) {
        case 'first':
          opts.skip = 0;
          opts.limit = 1;
          break;
        case 'count':
          if(opts.includeCollection.length > 0) {
            orderClause = '';
          }else {
            selectClause = `count('objectId')`;
            joinsSelectClause = '';
            joinsRelationClause = '';
            joinsGroupClause = '';
            orderClause = '';
          }
          break;
      }
      //****************
      //*****合并sql语句
      //*****
      const spl = `
        SELECT
          ${selectClause}
          ${joinsSelectClause}
        FROM 
          "${className}"
        ${joinsRelationClause}
        ${whereClause}
        ${joinsGroupClause}
        ${orderClause}
        OFFSET ${opts.skip}
        LIMIT ${opts.limit}
      `;
      printSql(spl, className, 'find');
      const _client = client || CB.pg;
      try {
        const result = await _client.query(spl);
        switch (type) {
          case 'first':
          case 'find':
            const rows = result.rows;
            handleServerData(rows, className, _.flatten(opts.selectCollection));
            if(type === 'first') return rows[0] || null;
            return rows;
          case 'count':
            if(opts.includeCollection.length > 0) {
              return parseInt(result.rows.length);
            }else {
              return parseInt(result.rows[0].count);
            }
        }
      }catch (error) {
        //*****表不存在时，直接返回空值
        if(error.code === '42P01') {
          switch (type) {
            case 'first':
              return null;
            case 'find':
              return [];
            case 'count':
              return 0;
          }
        }
        throw new Error(`[DATABASE FIND ERROR] - ${className}: [${error.code || -1}]${error.message}`);
      }
    },
    /**
     * 保存数据（有则创建，没有则更新）
     * @param className
     * @param object
     * @param client
     */
    save: async function (className, object, client) {
      if(object.objectId && ['undefined', 'null', 'false', 'NaN'].indexOf(object.objectId) < 0) {
        return await this.update(className, object, {
          objectId: object.objectId
        }, client);
      }else {
        return await this.create(className, object, client);
      }
    },
    /**
     * 创建数据(不支持创建空数据)
     * @param className
     * @param object
     * @param client
     * @return {Promise}
     */
    create: async function (className, object, client) {
      if(_.size(object) === 0) return;
      _.extend(object, {
        objectId: shortId.generate(),
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      //强制自定义objectId
      if(object['objectId:override']) {
        object.objectId = object['objectId:override'];
        delete object['objectId:override'];
      }
      //删除无效属性
      _.each(object, (value, key) => {
        if(key.indexOf(':[action]remove') > 0) delete object.key;
      });
      //指定需要立即返回的字段
      const returningValues = [];
      _.each(object, (value, key) => {
        if(key.indexOf(':[action]') > 0) returningValues.push(`"${key.split(':[action]')[0]}"`);
      });
      const returningClause = returningValues.length > 0 ? `RETURNING ${returningValues.join(',')}` : '';
      const spl = `
        INSERT INTO 
          "${className}" ("${
        Object.keys(object).map((key) => {
          if(key.indexOf(':[action]') > 0) key = key.split(':[action]')[0];
          return key;
        }).join('","')
        }") 
        VALUES
          (${_.map(new Array(_.size(object)), (value, index) => {
        return '$' + (index + 1);
      }).join(',')})
        ${returningClause}
      `;
      const params = _.values(object);
      printSql(spl, className, 'insert');
      printSqlParams(params, className, 'insert');
      const _client = client || await CB.pg.connect();
      try {
        const result = await _client.query(spl, params);
        if(returningValues.length > 0) {
          result.rows.forEach((row) => {
            _.each(object, (value, key) => {
              if(key.indexOf(':[action]') > 0) {
                const _key = key.split(':[action]')[0];
                object[_key] = row[_key] || null;
                delete object[key];
              }
            });
          });
        }
        return object;
      }catch (error) {
        throw new Error(`[DATABASE INSERT ERROR] - ${className}: [${error.code || -1}]${error.message}`);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 更新数据
     * @param className
     * @param object
     * @param condition
     * @param client
     * @return {Promise}
     */
    update: async function (className, object, condition, client) {
      if(_.size(object) === 0) return;
      _.extend(object, {
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      const tmpObject = _.clone(object);
      _.each(condition, (value, key) => {
        delete tmpObject[key];
      });
      //指定需要立即返回的字段
      const returningValues = [];
      _.each(tmpObject, (value, key) => {
        if(key.indexOf(':[action]') > 0) returningValues.push(`"${key.split(':[action]')[0]}"`);
      });
      const returningClause = returningValues.length > 0 ? `RETURNING ${returningValues.join(',')}` : '';
      let index = 0;
      const spl = `
        UPDATE 
          "${className}" 
        SET
          ${_.map(tmpObject, (value, key) => {
        index++;
        //特殊属性处理
        if(key.indexOf(':[action]increment') > 0) {
          const _key = key.replace(':[action]increment', '');
          return `"${_key}" = "${_key}" + $${index}`;
        }
        if(key.indexOf(':[action]append') > 0) {
          const _key = key.replace(':[action]append', '');
          return `"${_key}" = array_append("${_key}", $${index})`;
        }
        if(key.indexOf(':[action]prepend') > 0) {
          const _key = key.replace(':[action]prepend', '');
          return `"${_key}" = array_prepend("${_key}", $${index})`;
        }
        if(key.indexOf(':[action]concat') > 0) {
          const _key = key.replace(':[action]concat', '');
          return `"${_key}" = array_cat("${_key}", $${index})`;
        }
        if(key.indexOf(':[action]remove') > 0) {
          const _key = key.replace(':[action]remove', '');
          return `"${_key}" = array_remove("${_key}", $${index})`;
        }
        return `"${key}" = $${index}`;
      }).join(',')}
        WHERE
          ${
        _.map(condition, (value, key) => {
          index++;
          return `"${key}" = $${index}`;
        }).join(',')
        }
        ${returningClause}
      `;
      const params = _.values(tmpObject).concat(_.values(condition));
      printSql(spl, className, 'update');
      printSqlParams(params, className, 'update');
      const _client = client || await CB.pg.connect();
      try {
        const result = await _client.query(spl, params);
        if(returningValues.length > 0) {
          result.rows.forEach((row) => {
            _.each(object, (value, key) => {
              if(key.indexOf(':[action]') > 0) {
                const _key = key.split(':[action]')[0];
                object[_key] = row[_key] || null;
                delete object[key];
              }
            });
          });
        }
        return object;
      }catch (error) {
        throw new Error(`[DATABASE UPDATE ERROR] - ${className}: [${error.code || -1}]${error.message}`);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 删除数据
     * @param className
     * @param condition
     * @param client
     */
    delete: async function (className, condition, client) {
      let index = 0;
      const spl = `
        DELETE FROM 
          "${className}" 
        WHERE 
          ${
        _.map(condition, (value, key) => {
          index++;
          if(key.indexOf(':batch') > 0) {
            return `"${key.replace(':batch', '')}" = ANY(VALUES ${value.map(() => {
              const item = `($${index})`;
              index++;
              return item;
            }).join(',')})`;
          }
          return `"${key}" = $${index}`;
        }).join(',')
        } 
      `;
      const params = [];
      _.each(condition, (value, key) => {
        if(key.indexOf(':batch') > 0) {
          value.forEach((item) => {
            params.push(item);
          });
        }else {
          params.push(value);
        }
      });
      printSql(spl, className, 'delete');
      printSqlParams(params, className, 'delete');
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl, params);
        return 'ok';
      }catch (error) {
        throw new Error(`[DATABASE DELETE ERROR] - ${className}: [${error.code || -1}]${error.message}`);
      }finally {
        if(!client) _client.release();
      }
    },
  };
  /**
   * 打印SQL语句
   * @param className
   * @param sql
   * @param type
   */
  function printSql(sql, className, type) {
    if(CB.pgConfig.printSql) {
      sql = `↓[Database ${type} class ${className}: ${moment().format('YYYY-MM-DD HH:mm:ss')}]\n` + sql;
      sql = sql.replace(/\n+/g, '\n');
      sql = sql.replace(/\s*,/g, ',\n ');
      sql = sql.replace(/ {2,}/g, ' ');
      console.log(sql);
    }
  }
  /**
   * 打印SQL参数
   * @param className
   * @param params
   * @param type
   */
  function printSqlParams(params, className, type) {
    if(CB.pgConfig.printSqlParams) {
      console.log(`↓[Database ${type} class ${className}: ${moment().format('YYYY-MM-DD HH:mm:ss')}]\n`, params);
    }
  }
};
