const _ = require('lodash');
const moment = require('moment');
const shortId = require('shortid');
const Condition = require('./crud_condition');

//********** Transaction Action Block Demo
// (async () => {
//   const client = await CB.pg.connect();
//   try {
//     await client.query('BEGIN');
//     //query...
//     await client.query('COMMIT');
//   }catch (error) {
//     await client.query('ROLLBACK');
//     console.log(error);
//   }finally {
//     client.release();
//   }
// })().catch(e => console.log(e.message));

module.exports = function (CB) {
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
          let _className = className, _tailKey = object.key;
          if(object.key.indexOf('.') > -1) {
            const arr = object.key.split('.');
            if(arr.length > 5) throw new Error('[DATABASE FIND ERROR] - include查询最多仅支持5层嵌套，请规范使用！');
            const prve = _.clone(arr);prve.pop();
            _className = _.find(opts.includeCollection, {key: prve.join('.')}).className;
            _tailKey = arr[arr.length - 1];
          }
          if(object.type === 'array') {
            joinsSelectClause += `
              ,CASE WHEN COUNT("${object.className}") = 0 THEN '[]' ELSE JSON_AGG("${object.className}") END AS "${object.key}"
            `;
            joinsRelationClause += `
              LEFT JOIN LATERAL JSON_ARRAY_ELEMENTS("${_className}"."${object.key}") "${_className}${object.key}" ON true
              LEFT JOIN "${object.className}" ON "${_className}${object.key}" ->> 'objectId' = "${object.className}"."objectId"
            `;
          }else {
            if(isExistJointArray) {
              joinsSelectClause += `
                ,JSON_AGG("${object.className}")->0 AS "${object.key}"
              `;
              joinsGroupClause += `
                ,"${object.className}"."objectId"
              `;
            }else {
              joinsSelectClause += `
                ,ROW_TO_JSON("${object.className}") AS "${object.key}"
              `;
            }
            joinsRelationClause += `
              LEFT JOIN "${object.className}"
              ON "${object.className}"."objectId" = "${_className}"."${_tailKey}" ->> 'objectId'
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
      opts.orderCollection.forEach((orderObject) => {
        orderItems.push(`"${className}"."${orderObject.key}" ${orderObject.type}`);
      });
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
          selectClause = `count('objectId')`;
          joinsSelectClause = '';
          joinsRelationClause = '';
          joinsGroupClause = '';
          orderClause = '';
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
            rows.forEach((row) => {
              _.each(row, (value, key) => {
                if(key.indexOf('.') > 0) {
                  const arr = key.split('.');
                  if(arr.length === 2 && row[arr[0]] && row[arr[0]][arr[1]]) row[arr[0]][arr[1]] = value;
                  if(arr.length === 3 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]]) row[arr[0]][arr[1]][arr[2]] = value;
                  if(arr.length === 4 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]] && row[arr[0]][arr[1]][arr[2]][arr[3]]) row[arr[0]][arr[1]][arr[2]][arr[3]] = value;
                  if(arr.length === 5 && row[arr[0]] && row[arr[0]][arr[1]] && row[arr[0]][arr[1]][arr[2]] && row[arr[0]][arr[1]][arr[2]][arr[3]] && row[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]]) row[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]] = value;
                  delete row[key];
                }
              });
            });
            if(type === 'first') return rows[0] || null;
            return rows;
          case 'count':
            return parseInt(result.rows[0].count);
        }
      }catch (error) {
        throw new Error('[DATABASE FIND ERROR] - ' + error.message);
      }
    },
    /**
     * 保存数据（有则创建，没有则更新）
     * @param className
     * @param object
     * @param client
     */
    save: async function (className, object, client) {
      if(object.objectId) {
        await this.update(className, object, client);
      }else {
        await this.create(className, object, client);
      }
    },
    /**
     * 创建数据
     * @param className
     * @param object
     * @param client
     * @return {Promise}
     */
    create: async function (className, object, client) {
      _.extend(object, {
        objectId: shortId.generate(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const spl = `
        INSERT INTO 
          "${className}" ("${_.keys(object).map(value => value.replace(':increment', ''))}).join('","')}") 
        VALUES
          (${_.map(new Array(_.size(object)), (value, index) => {
            return '$' + (index + 1);
          }).join(',')})
      `;
      printSql(spl, className, 'insert');
      const params = _.values(object);
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl, params);
        return object;
      }catch (error) {
        throw new Error('[DATABASE INSERT ERROR] - ' + error.message);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 更新数据
     * @param className
     * @param object
     * @param client
     * @return {Promise}
     */
    update: async function (className, object, client) {
      _.extend(object, {
        updatedAt: new Date()
      });
      let index = 0;
      const spl = `
        UPDATE 
          "${className}" 
        SET
          ${_.map(object, (value, key) => {
            index++;
            if(key.indexOf(':increment') > 0) {
              return `"${key.replace(':increment', '')}" = "${key.replace(':increment', '')}" ${value < 0 ? '-' : '+'} $${index}`;
            }
            return `"${key}" = $${index}`;
          }).join(',')}
        WHERE
          "objectId" = '${object.objectId}'
      `;
      printSql(spl, className, 'update');
      const params = _.values(object);
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl, params);
        return object;
      }catch (error) {
        throw new Error('[DATABASE UPDATE ERROR] - ' + error.message);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 删除数据
     * @param className
     * @param objectId
     * @param client
     */
    delete: async function (className, objectId, client) {
      const spl = `
        DELETE FROM 
          "${className}" 
        WHERE 
          "objectId" = '${objectId}'" 
      `;
      printSql(spl, className, 'delete');
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl);
        return 'ok';
      }catch (error) {
        throw new Error('[DATABASE DELETE ERROR] - ' + error.message);
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
};
