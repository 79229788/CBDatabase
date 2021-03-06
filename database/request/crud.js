const _ = require('lodash');
const moment = require('moment');
const uniqid = require('uniqid');
const Condition = require('./crud_condition');

module.exports = function (CB) {
  /**
   * 合并嵌套的所有子对象
   * @param row
   */
  const mergeChildren = (row) => {
    //***生成特殊嵌套结构的关系对象
    const relationMap = {};
    for(let key in row) {
      const value = row[key];
      if(key.indexOf('^') === 0) {
        const relationKeys = key.substr(1).split('.');
        let keyIndex = 0;
        (function loop(map) {
          let relationKey = relationKeys[keyIndex];
          if(!map[relationKey]) {
            map[relationKey] = {};
            //***处理第一层
            if(!map.value) {
              const pointer = row[relationKey] || null;
              if(pointer) {
                if(!_.isArray(value)) {
                  if(!value || !value.objectId) {
                    map[relationKey].value = null;
                  }else {
                    map[relationKey].value = Object.assign({}, pointer, value);
                  }
                }else {
                  const list = [];
                  value.forEach((item, index) => {
                    if(pointer[index] && item.objectId) {
                      list.push(Object.assign({}, pointer[index], item));
                    }
                  });
                  map[relationKey].value = list;
                }
              }
            }
            //***处理其它层
            else {
              const pointer = map.value[relationKey] || null;
              if(pointer) {
                if(!_.isArray(pointer)) {
                  if(!value || !value.objectId) {
                    map.value[relationKey] = null;
                  }else {
                    Object.assign(pointer, value);
                  }
                }else {
                  const list = [];
                  value.forEach((item, index) => {
                    if(pointer[index] && item.objectId) {
                      list.push(Object.assign(pointer[index], item));
                    }
                  });
                  map.value[relationKey] = list;
                }
              }
            }
          }else {
            keyIndex ++;
            loop(map[relationKey]);
          }
        })(relationMap);
        delete row[key];
      }
    }
    //***将关系对象的数据并合并到row中
    for(let key in relationMap) {
      if(row[key]) {
        row[key] = relationMap[key].value;
      }
    }
  };
  /**
   * 处理数据类型
   * @param row
   * @param className
   * @param selectItems
   */
  const handleCompatibleDataType = function (row, className, selectItems) {
    selectItems = selectItems || [];
    //搜索需要的列选项
    const floatColumns = [];
    const objectColumns = [];
    const dateColumns = [];
    const datetimeColumns = [];
    (function findColumns(table, isParent) {
      if(!table) return;
      if(table.parent) {
        findColumns(_.find(CB.pg.config.tableList, {name: table.parent}), true);
      }
      if(table.name === className.split('@_@')[0] || isParent) {
        for(let column of table.columns) {
          if(selectItems.length > 0 && selectItems.indexOf(column.name) < 0) continue;
          if(column.type.indexOf('money') === 0
            || column.type.indexOf('real') === 0
            || column.type.indexOf('double') === 0
            || column.type.indexOf('numeric') === 0
            || column.type.indexOf('decimal') === 0
          ) floatColumns.push(column);
          if(column.type === 'date') dateColumns.push(column);
          if(column.type === 'timestamp') datetimeColumns.push(column);
          if(column.type === 'object') objectColumns.push(column);
        }
      }
    })(_.find(CB.pg.config.tableList, table => table.name === className.split('@_@')[0]), false);
    //处理浮点数数据
    floatColumns.forEach((column) => {
      const origin = row[column.name];
      if(_.isString(origin) && origin !== '') {
        const value = origin.replace('$', '').replace(/,/g, '');
        const number = Number(value);
        row[column.name] = !_.isNaN(number) ? number : value;
      }
      if(_.isArray(origin)) {
        row[column.name] = origin.map(item => {
          if(_.isString(item) && item !== '') {
            const value = item.replace('$', '').replace(/,/g, '');
            const number = Number(value);
            return !_.isNaN(number) ? number : value;
          }
          return item;
        });
      }
    });
    //处理对象数据
    objectColumns.forEach((column) => {
      const origin = row[column.name];
      if(_.isString(origin) && origin !== '') {
        row[column.name] = JSON.parse(origin);
      }
    });
    //处理日期数据
    dateColumns.forEach((column) => {
      const origin = row[column.name];
      row[column.name] = origin ? moment(origin).format('YYYY-MM-DD') : null;
    });
    //处理日期时间数据
    datetimeColumns.forEach((column) => {
      const origin = row[column.name];
      row[column.name] = origin ? moment(origin).format('YYYY-MM-DD HH:mm:ss') : null;
    });
  };
  /**
   * 数据类型兼容处理
   * 1.浮点数String转为Number
   * 2.时间String转为Date
   * 3.....
   *
   * @param row
   * @param className
   * @param selectMap
   */
  const compatibleDataType = (row, className, selectMap) => {
    //***处理第一层
    handleCompatibleDataType(row, className, selectMap.selects);
    //***处理内嵌层
    (function loop(row, selectMap) {
      for(let key in row) {
        const value = row[key];
        //***如果为数组检查数组(因为内嵌查询只要到数组就终止的特点，因为无需再对数组继续遍历)
        if(_.isArray(value) > 0 && _.isObject(value[0])
          && ['Pointer', 'File'].indexOf(value[0].__type) > -1
          && Object.keys(value[0]).length > 3) {
          value.forEach(item => {
            handleCompatibleDataType(item, item.className, selectMap[key].selects);
          });
        }
        //***如果为对象，继续遍历
        else if(_.isObject(value)
          && ['Pointer', 'File'].indexOf(value.__type) > -1
          && Object.keys(value).length > 3) {
          loop(value, selectMap[key]);
          handleCompatibleDataType(value, value.className, (selectMap[key]).selects);
        }
      }
    })(row, selectMap);
  };
  /**
   * 处理服务器数据[合并连接字段和处理数据类型]
   * @param rows
   * @param className
   * @param selectMap
   */
  const handleServerData = (rows, className, selectMap) => {
    rows.forEach((row) => {
      mergeChildren(row);
      compatibleDataType(row, className, selectMap);
    });
  };
  /**
   * 仅仅处理服务器数据类型
   * @param rows
   * @param className
   * @param selectMap
   */
  const handleServerDataType = (rows, className, selectMap) => {
    rows.forEach((row) => {
      compatibleDataType(row, className, selectMap);
    });
  };
  /**
   * 获取查找语句
   * @param className
   * @param selectCollection
   * @param includeCollection
   * @param conditionCollection
   * @param conditionJoins
   * @param orderCollection
   * @return {{selectClause: string, joinsSelectClause: string, joinsRelationClause: string, whereClause: string, joinsGroupClause: string, orderClause: string}}
   */
  const getFindClauses = (className, selectCollection, includeCollection, conditionCollection, conditionJoins, orderCollection) => {
    //****************
    //*****指定主查询列
    //*****
    const selectClauseList = [];
    if(selectCollection.length > 0) {
      const selects = _.flatten(selectCollection);
      if(selects.indexOf('objectId') < 0) selects.unshift('objectId');
      if(selects.indexOf('createdAt') < 0) selects.push('createdAt');
      if(selects.indexOf('updatedAt') < 0) selects.push('updatedAt');
      selects.forEach(select => {
        selectClauseList.push(`"${className}"."${select}"`);
      });
    }
    const selectClause = selectClauseList.length > 0
      ? selectClauseList.join(',')
      : `"${className}".*`;
    //****************
    //*****连接查询
    //*****
    let joinsSelectClause = '', joinsRelationClause = '', joinsGroupClause = '';
    let isExistJointArray = false;
    if(includeCollection.length > 0) {
      isExistJointArray = !!_.find(includeCollection, {type: 'array'});
      if(isExistJointArray) joinsGroupClause = `GROUP BY "${className}"."objectId"`;
      includeCollection.forEach((object) => {
        let _className = className, _tailKey = object.key.replace('^', '');
        if(object.key.indexOf('.') > -1) {
          const arr = object.key.split('.');
          if(arr.length > 5) throw new Error('[DATABASE FIND ERROR] - include查询最多仅支持5层嵌套，请规范使用！');
          const prev = _.clone(arr);prev.pop();
          _className = _.find(includeCollection, {key: prev.join('.')}).className;
          _tailKey = arr[arr.length - 1].replace('^', '');
        }
        const joinClassOrigin = object.className; //连接表的原名
        const joinClassAlias = object.className = `${joinClassOrigin}_${_tailKey}_alias`; //连接表设置别名(防止不重复)
        //***获取连接表中的select数据
        const selectKeyValueList = [];
        if((object.selectCollection || []).length > 0) {
          const selects = _.flatten(object.selectCollection);
          if(selects.indexOf('objectId') < 0) selects.unshift('objectId');
          if(selects.indexOf('createdAt') < 0) selects.push('createdAt');
          if(selects.indexOf('updatedAt') < 0) selects.push('updatedAt');
          selects.forEach(select => {
            selectKeyValueList.push(`'${select}',"${joinClassAlias}"."${select}"`);
          });
        }
        const rowToJsonClause = selectKeyValueList.length > 0
          ? `JSON_BUILD_OBJECT(${selectKeyValueList.join(',')})`
          : `ROW_TO_JSON("${joinClassAlias}".*)`;
        //***处理连接表相关语句
        if(object.type === 'array') {
          joinsSelectClause += `
              ,CASE WHEN COUNT("${joinClassAlias}") = 0 THEN '[]' ELSE JSON_AGG(${rowToJsonClause}) END AS "${object.key}"
            `;
          joinsRelationClause += `
              LEFT JOIN LATERAL UNNEST("${_className}"."${_tailKey}") "${_className}_${_tailKey}_iterator" ON true
              LEFT JOIN "${joinClassOrigin}" AS "${joinClassAlias}"
              ON "${joinClassAlias}"."objectId" = "${_className}_${_tailKey}_iterator" ->> 'objectId'
            `;
        }else {
          if(isExistJointArray) {
            joinsSelectClause += `
                ,JSON_AGG(${rowToJsonClause}) -> 0 AS "${object.key}"
              `;
            joinsGroupClause += `
                ,"${joinClassAlias}"."objectId"
              `;
          }else {
            joinsSelectClause += `
                ,${rowToJsonClause} AS "${object.key}"
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
    let conditionClauseValues = [];
    let conditionJoinsItems = [];
    let conditionClauseMap = {};
    let conditionIndex = 0;
    //***主查询
    conditionCollection.forEach((conditionObject) => {
      const condition = Condition(className, conditionObject, conditionIndex);
      if(conditionObject.name) conditionClauseMap[conditionObject.name] = condition.clause;
      conditionClauseItems.push(condition.clause);
      if(_.has(condition, 'value')) conditionClauseValues.push(condition.value);
      conditionIndex = condition.index;
      conditionIndex ++;
    });
    //***关联查询
    includeCollection.forEach((object) => {
      (object.conditionCollection || []).forEach((conditionObject) => {
        const condition = Condition(object.className, conditionObject, conditionIndex);
        if(conditionObject.name) {
          if(conditionClauseMap[conditionObject.name]) throw new Error('查询条件的name不允许重复[主查询与子查询也不能出现重复]');
          conditionClauseMap[conditionObject.name] = condition.clause;
        }
        conditionClauseItems.push(condition.clause);
        if(_.has(condition, 'value')) conditionClauseValues.push(condition.value);
        conditionIndex = condition.index;
        conditionIndex ++;
      });
      //处理条件拼接
      if(object.conditionJoins && JSON.stringify(conditionClauseMap) !== '{}') {
        let conditionJoins = object.conditionJoins;
        _.each(conditionClauseMap, (value, key) => {
          const reg = new RegExp(key, 'g');
          conditionJoins = conditionJoins.replace(reg, value);
        });
        conditionJoinsItems.push('(' + conditionJoins.replace(/&&/g, ' AND ').replace(/\|\|/g, ' OR ') + ')');
      }
    });
    //处理条件拼接
    if(conditionJoins && JSON.stringify(conditionClauseMap) !== '{}') {
      _.each(conditionClauseMap, (value, key) => {
        const reg = new RegExp(key, 'g');
        conditionJoins = conditionJoins.replace(reg, value);
      });
      conditionJoinsItems.push('(' + conditionJoins.replace(/&&/g, ' AND ').replace(/\|\|/g, ' OR ') + ')');
    }
    if(conditionClauseItems.length > 0) {
      whereClause = 'WHERE ' + conditionClauseItems.join(' AND ');
    }
    if(conditionJoinsItems.length > 0) {
      whereClause = 'WHERE ' + conditionJoinsItems.join(' AND ');
    }
    //****************
    //*****排序
    //*****
    let orderClause = '', orderItems = [], orderTopItems = [], orderBottomItems = [];
    //***主查询
    if(orderCollection.length === 0) {
      //当未指定时，使用默认排序
      if(includeCollection.length === 0) {
        orderItems.push(`"${className}"."createdAt" asc`);
      }
    }else {
      orderCollection.forEach((orderObject) => {
        const clause = `"${className}"."${orderObject.key}" ${orderObject.type}`;
        if(orderObject.action === 'top') {
          orderTopItems.push(clause);
        }else if(orderObject.action === 'bottom') {
          orderBottomItems.push(clause);
        }else {
          orderItems.push(clause);
        }
      });
    }
    //***关联查询
    includeCollection.forEach((object) => {
      (object.orderCollection || []).forEach((orderObject) => {
        const clause = `"${object.className}"."${orderObject.key}" ${orderObject.type}`;
        if(orderObject.action === 'top') {
          orderTopItems.push(clause);
        }else if(orderObject.action === 'bottom') {
          orderBottomItems.push(clause);
        }else {
          orderItems.push(clause);
        }
      });
    });
    orderItems.unshift.apply(orderItems, orderTopItems);
    orderItems.push.apply(orderItems, orderBottomItems);
    if(orderItems.length > 0) orderClause = 'ORDER BY ' + orderItems.join(', ');

    return {
      selectClause: selectClause,
      joinsSelectClause: joinsSelectClause,
      joinsRelationClause: joinsRelationClause,
      whereClause: whereClause,
      whereClauseValues: conditionClauseValues,
      joinsGroupClause: joinsGroupClause,
      orderClause: orderClause,
    };
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
      const isUnionQuery = !!options.queryOptionsCollection;
      let opts = {};
      if(!isUnionQuery) {
        opts = Object.assign({
          skip: 0,
          limit: 1000,
          //***仅仅查询自己（仅仅用于继承表）
          only: false,
          //***指定列去重（不支持联合查询）
          distinctKey: '',
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
      }else {
        opts = Object.assign({
          queryOptionsCollection: [], //见单个查询的所有条件（除了排序和数量限制）
          isUnionAll: true,
          orderCollection: [],
          skip: 0,
          limit: 1000,
        }, options || {});
      }
      let sql = '';
      let unionClassName = '';
      let unionSelectCollection = null;
      let whereClauseValues = [];
      if(!isUnionQuery) {
        const clauses = getFindClauses(
          className,
          opts.selectCollection,
          opts.includeCollection,
          opts.conditionCollection,
          opts.conditionJoins,
          opts.orderCollection
        );
        let selectClause = clauses.selectClause;
        let joinsSelectClause = clauses.joinsSelectClause;
        let joinsRelationClause = clauses.joinsRelationClause;
        let whereClause = clauses.whereClause;
        let joinsGroupClause = clauses.joinsGroupClause;
        let orderClause = clauses.orderClause;
        whereClauseValues = clauses.whereClauseValues;
        //*****查询类型
        switch (type) {
          case 'first':
            opts.skip = 0;
            opts.limit = 1;
            break;
          case 'count':
            selectClause = `COUNT(${options.distinctKey ? `DISTINCT "${className}"."${options.distinctKey}"` : '1'}) ${opts.includeCollection.length > 0 ? 'OVER()' : ''}`;
            joinsSelectClause = '';
            orderClause = '';
            opts.skip = 0;
            opts.limit = 1;
            break;
        }
        //*****组合成sql语句
        sql = `
          SELECT
            ${selectClause}
            ${joinsSelectClause}
          FROM 
            ${opts.only ? 'ONLY' : ''} "${className}"
          ${joinsRelationClause}
          ${whereClause}
          ${joinsGroupClause}
          ${orderClause}
          OFFSET ${opts.skip}
          LIMIT ${opts.limit}
        `;
        //如果需要去重，重写sql
        if(options.distinctKey && type !== 'count') {
          sql = `
            SELECT DISTINCT ON ("first"."${options.distinctKey}") *
            FROM (  
              SELECT
                ${selectClause}
                ${joinsSelectClause}
              FROM 
                ${opts.only ? 'ONLY' : ''} "${className}"
              ${joinsRelationClause}
              ${whereClause}
              ${joinsGroupClause}
              ${orderClause}
            ) AS "first"
            OFFSET ${opts.skip}
            LIMIT ${opts.limit}
          `;
        }
      }else {
        const items = [];
        opts.queryOptionsCollection.forEach((item, index) => {
          if(index === 0) {
            unionClassName = item.className;
            unionSelectCollection = item.selectCollection;
          }
          const clauses = getFindClauses(
            item.className,
            item.selectCollection,
            item.includeCollection,
            item.conditionCollection,
            item.conditionJoins,
            []
          );
          //*****查询类型
          let selectClause =clauses.selectClause;
          let joinsSelectClause = clauses.joinsSelectClause;
          let joinsRelationClause = clauses.joinsRelationClause;
          let whereClause = clauses.whereClause;
          let joinsGroupClause = clauses.joinsGroupClause;
          whereClauseValues = clauses.whereClauseValues;
          //*****查询类型
          switch (type) {
            case 'count':
              selectClause = `COUNT(1) ${item.includeCollection.length > 0 ? 'OVER()' : ''}`;
              joinsSelectClause = '';
              break;
          }
          items.push(`
            (SELECT
              ${selectClause}
              ${joinsSelectClause}
            FROM 
              ${opts.only ? 'ONLY' : ''} "${item.className}"
            ${joinsRelationClause}
            ${whereClause}
            ${joinsGroupClause}
            ${type === 'count' ? 'OFFSET 0' : ''}
            ${type === 'count' ? 'LIMIT 1' : ''}
            )
          `);
        });
        let orderClause = 'ORDER BY ' + (opts.orderCollection.length === 0
          ? '"createdAt" asc'
          : opts.orderCollection.map(orderObject => `"${orderObject.key}" ${orderObject.type}`).join(', '));
        if(type === 'count') orderClause = '';
        //*****组合成sql语句
        sql = `
          ${items.join(`\nUNION ${opts.isUnionAll ? 'ALL' : ''}\n`)}
          ${orderClause}
          ${type !== 'count' ? `OFFSET ${opts.skip}` : ''}
          ${type !== 'count' ? `LIMIT ${opts.limit}` : ''}
        `;
      }
      printSql(sql, unionClassName || className, 'find');
      printSqlParams(whereClauseValues, className, 'find');
      const _client = client || CB.pg;
      try {
        const result = await _client.query(sql, whereClauseValues);
        switch (type) {
          case 'first':
          case 'find':
            const rows = result.rows;
            const selectMap = {};
            selectMap.selects = _.flatten(unionSelectCollection || opts.selectCollection);
            (opts.includeCollection || []).forEach(item => {
              const keys = item.key.replace('^', '');
              _.set(selectMap, keys, {selects: _.flatten(item.selectCollection || [])});
            });
            handleServerData(rows, unionClassName || className, selectMap);
            if(type === 'first') return rows[0] || null;
            return rows;
          case 'count':
            let count = 0;
            result.rows.forEach(row => {
              count += Number(row.count);
            });
            return count;
        }
      }catch (error) {
        //*****表不存在时，强制返回空值[强制忽略错误，会影响事务功能，请谨慎处理事务中表不存在的find查询]
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
        throw handleError(error, className);
      }
    },
    /**
     * 保存数据（有则创建，没有则更新）
     * @param className
     * @param object
     * @param conditionCollection (仅在更新时有用)
     * @param returnKeys (仅在更新时有用)
     * @param client
     */
    save: async function (className, object, conditionCollection, returnKeys, client) {
      if(object.objectId && ['undefined', 'null', 'false', 'NaN'].indexOf(object.objectId) < 0) {
        return await this.update(className, object, conditionCollection, returnKeys, client);
      }else {
        return await this.create(className, object, returnKeys, client);
      }
    },
    /**
     * 创建数据(不支持创建空数据)
     * @param className
     * @param object
     * @param returnKeys
     * @param client
     * @return {Promise}
     */
    create: async function (className, object, returnKeys, client) {
      if(_.size(object) === 0) return;
      Object.assign(object, {
        objectId: uniqid(),
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
      const returningValues = _.clone(returnKeys || []).map(item => `"${item}"`);
      _.each(object, (value, key) => {
        if(key.indexOf(':[action]') > 0) returningValues.push(`"${key.split(':[action]')[0]}"`);
      });
      const returningClause = returningValues.length > 0 ? `RETURNING ${ _.uniq(returningValues).join(',')}` : '';
      const sql = `
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
      printSql(sql, className, 'insert');
      printSqlParams(params, className, 'insert');
      const _client = client || await CB.pg.connect();
      try {
        const result = await _client.query(sql, params);
        if(result.rowCount === 0) return null;
        if(returningValues.length > 0) {
          handleServerDataType(result.rows, className, {});
          result.rows.forEach((row) => {
            _.each(object, (value, key) => {
              if(key.indexOf(':[action]') > 0) {
                const _key = key.split(':[action]')[0];
                object[_key] = row[_key] || null;
                delete object[key];
              }
            });
            returningValues
              .map(item => item.replace(/^"(\S*)"$/, '$1'))
              .forEach((key) => {
                object[key] = row[key];
              });
          });
        }
        return object;
      }catch (error) {
        throw handleError(error, className);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 更新数据
     * @param className
     * @param object
     * @param condition
     * @param returnKeys
     * @param client
     * @return {Promise}
     */
    update: async function (className, object, condition, returnKeys, client) {
      if(_.size(object) === 0) return;
      let index = 0;
      //重新得到要更新的object
      Object.assign(object, {
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      const tmpObject = _.clone(object);
      delete tmpObject.objectId;
      delete tmpObject['objectId:override'];
      //指定需要立即返回的字段
      const returningValues = _.clone(returnKeys || []).map(item => `"${item}"`);
      _.each(tmpObject, (value, key) => {
        if(key.indexOf(':[action]') > 0) returningValues.push(`"${key.split(':[action]')[0]}"`);
      });
      if(!object.objectId) returningValues.push(`"objectId"`);
      returningValues.push(`"createdAt"`);
      const returningClause = returningValues.length > 0 ? `RETURNING ${ _.uniq(returningValues).join(',')}` : '';
      //*****生成设置数据
      let setClauses = [];
      _.each(tmpObject, (value, key) => {
        //特殊属性处理
        if(key.indexOf(':[action]incrementDate') > 0) {
          const _key = key.replace(':[action]incrementDate', '');
          setClauses.push(`"${_key}" = "${_key}" + INTERVAL $${index + 1}`);
        }else if(key.indexOf(':[action]increment') > 0) {
          const _key = key.replace(':[action]increment', '');
          setClauses.push(`"${_key}" = "${_key}" + $${index + 1}`);
        }else if(key.indexOf(':[action]append') > 0) {
          const _key = key.replace(':[action]append', '');
          setClauses.push(`"${_key}" = array_append("${_key}", $${index + 1})`);
        }else if(key.indexOf(':[action]prepend') > 0) {
          const _key = key.replace(':[action]prepend', '');
          setClauses.push(`"${_key}" = array_prepend("${_key}", $${index + 1})`);
        }else if(key.indexOf(':[action]concat') > 0) {
          const _key = key.replace(':[action]concat', '');
          setClauses.push(`"${_key}" = array_cat("${_key}", $${index + 1})`);
        }else if(key.indexOf(':[action]remove') > 0) {
          const _key = key.replace(':[action]remove', '');
          setClauses.push(`"${_key}" = array_remove("${_key}", $${index + 1})`);
        }else {
          setClauses.push(`"${key}" = $${index + 1}`);
        }
        index ++;
      });

      //*****生成查询语句
      let otherWhereClause = '';
      let conditionClauseItems = [];
      let conditionClauseValues = [];
      let conditionClauseMap = {};
      let conditionIndex = index;
      if(object.objectId) {
        otherWhereClause += `"objectId" = $${index + 1}`;
        conditionIndex ++;
      }
      if(condition) {
        condition.forEach((conditionObject) => {
          const condition = Condition(className, conditionObject, conditionIndex);
          if(conditionObject.name) conditionClauseMap[className + conditionObject.name] = condition.clause;
          conditionClauseItems.push(condition.clause);
          if(_.has(condition, 'value')) conditionClauseValues.push(condition.value);
          conditionIndex = condition.index;
          conditionIndex ++;
        });
        if(conditionClauseItems.length > 0) {
          otherWhereClause += `${object.objectId ? ' AND ' : ''}${conditionClauseItems.join(' AND ')}`;
        }
      }
      const sql = `
        UPDATE 
          "${className}" 
        SET
          ${setClauses.join(',')}
        WHERE
          ${otherWhereClause}
        ${returningClause}
      `;
      let params =  _.values(tmpObject);
      if(object.objectId) params.push(object.objectId);
      params = params.concat(conditionClauseValues);
      printSql(sql, className, 'update');
      printSqlParams(params, className, 'update');
      const _client = client || await CB.pg.connect();
      try {
        const result = await _client.query(sql, params);
        if(result.rowCount === 0) return null;
        if(returningValues.length > 0) {
          handleServerDataType(result.rows, className, {});
          result.rows.forEach((row) => {
            _.each(object, (value, key) => {
              if(key.indexOf(':[action]') > 0) {
                const _key = key.split(':[action]')[0];
                object[_key] = _.has(row, _key) ? row[_key] : null;
                delete object[key];
              }
            });
            returningValues
              .map(item => item.replace(/^"(\S*)"$/, '$1'))
              .forEach((key) => {
                object[key] = row[key];
              });
          });
        }
        return object;
      }catch (error) {
        throw handleError(error, className);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 删除数据
     * @param className
     * @param idCondition
     * @param otherCondition
     * @param returnKeys
     * @param client
     */
    delete: async function (className, idCondition, otherCondition, returnKeys, client) {
      //*****获取id查询语句
      let index = 0;
      let idWhereClause = '';
      let idWhereClauseValues = [];
      _.each(idCondition, (value, key) => {
        if(key && value) {
          if(key.indexOf(':batch') > 0) {
            if(value.length > 0) {
              idWhereClause = `"${key.replace(':batch', '')}" = ANY($${index + 1})`;
              idWhereClauseValues.push(value);
            }
          }else {
            idWhereClause = `"${key}" = $${index + 1}`;
            idWhereClauseValues.push(value);
          }
          index++;
        }
      });
      //*****获取其它查询语句
      let otherWhereClause = '';
      let conditionClauseItems = [];
      let conditionClauseValues = [];
      let conditionClauseMap = {};
      let conditionIndex = index;
      if(otherCondition) {
        otherCondition.forEach((conditionObject) => {
          const condition = Condition(className, conditionObject, conditionIndex);
          if(conditionObject.name) conditionClauseMap[className + conditionObject.name] = condition.clause;
          conditionClauseItems.push(condition.clause);
          if(_.has(condition, 'value')) conditionClauseValues.push(condition.value);
          conditionIndex = condition.index;
          conditionIndex ++;
        });
        if(conditionClauseItems.length > 0) {
          otherWhereClause = conditionClauseItems.join(' AND ');
        }
      }
      //*****指定需要立即返回的字段
      const returningValues = _.clone(returnKeys || []).map(item => `"${item}"`);
      returningValues.push(`"objectId"`);
      returningValues.push(`"createdAt"`);
      returningValues.push(`"updatedAt"`);
      const returningClause = `RETURNING ${ _.uniq(returningValues).join(',')}`;
      const sql = `
        DELETE FROM 
          "${className}" 
        WHERE 
          ${_.compact([idWhereClause, otherWhereClause]).join(' AND ')}
        ${returningClause}
      `;
      const params = idWhereClauseValues.concat(conditionClauseValues);
      printSql(sql, className, 'delete');
      printSqlParams(params, className, 'delete');
      const _client = client || await CB.pg.connect();
      try {
        const result = await _client.query(sql, params);
        if(result.rowCount === 0) return null;
        handleServerDataType(result.rows, className, {});
        return result.rows;
      }catch (error) {
        //*****表不存在时，直接返回成功状态[强制忽略错误，会影响事务功能，请谨慎处理事务中表不存在表操作]
        if(error.code === '42P01') return 'table not exist';
        throw handleError(error, className);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 自定义查询语句
     * @param sql
     * @param params
     * @param client
     * @return {Promise.<*>}
     */
    custom: async function (sql, params, client) {
      const _client = client || await CB.pg.connect();
      return await _client.query(sql, params)
    },
  };
  /**
   * 处理错误
   * @param error
   * @param className
   */
  function handleError(error, className) {
    const _error = new Error();
    _error.code = error.code || -1;
    _error.message = `[${className}] ${error.message}`;
    return _error;
  }
  /**
   * 打印SQL语句
   * @param className
   * @param sql
   * @param type
   */
  function printSql(sql, className, type) {
    if(CB.pg.config.printSql) {
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
    if(CB.pg.config.printSqlParams) {
      console.log(`↓[Database ${type} class ${className}: ${moment().format('YYYY-MM-DD HH:mm:ss')}]\n`, params);
    }
  }
};
