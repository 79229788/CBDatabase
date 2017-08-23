const _ = require('lodash');

module.exports = function (CB) {
  CB.table = {
    /**
     * 获取所有表名
     * @param tableSchema
     * @param client
     */
    getTableNames: async function (tableSchema, client) {
      const spl = `
        SELECT 
          "table_name"
        FROM 
          "information_schema"."tables"
        WHERE 
          "table_schema" = '${tableSchema}'
      `;
      const _client = client || await CB.pg;
      try {
        const result = await _client.query(spl);
        return result.rows.map(row => row.table_name);
      }catch (error) {
        throw new Error('[DATABASE TABLE OPERATION ERROR] - getTableNames: ' + error.message);
      }
    },
    /**
     * 获取表的所有字段（列）
     * @param tableSchema
     * @param tableName
     * @param client
     * @return {Promise.<string>}
     */
    getColumnNames: async function (tableSchema, tableName, client) {
      const spl = `
        SELECT 
          "column_name"
        FROM 
          "information_schema"."columns"
        WHERE 
          "table_schema" = '${tableSchema}'
        AND
          "table_name" = '${tableName}'
      `;
      const _client = client || await CB.pg;
      try {
        const result = await _client.query(spl);
        return result.rows.map(row => row.column_name);
      }catch (error) {
        throw new Error('[DATABASE TABLE OPERATION ERROR] - getColumnNames: ' + error.message);
      }
    },
    /**
     * 生成列语句
     * @param object
     * @return {string}
     * @private
     */
    _generateColumnClause: function (object) {
      let defaultValue = '';
      if(!_.isUndefined(object.default)) {
        defaultValue = 'DEFAULT ';
        if(['json', 'jsonb'].indexOf(object.type) > -1) {
          defaultValue += JSON.stringify(object.default);
        }else {
          defaultValue += object.default;
        }
      }
      return `
        "${object.name}"
        ${object.type}
        ${object.serial ? 'SERIAL' : ''}
        ${object.isPrimary ? 'PRIMARY KEY' : ''}
        ${object.isNotNull ? 'NOT NULL' : ''}
        ${defaultValue}
      `;
    },
    /**
     * 创建表
     * @param tableSchema
     * @param tableName
     * @param columns
     * @param client
     * @return {Promise.<string>}
     */
    createTable: async function (tableSchema, tableName, columns, client) {
      const spl = `
        CREATE TABLE ${tableSchema}."${tableName}"
          (
            ${(columns || []).map((object) => {
              return this._generateColumnClause(object);
            }).join(', ')}
          )
      `;
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl);
        return 'ok';
      }catch (error) {
        throw new Error('[DATABASE TABLE OPERATION ERROR] - ' + error.message);
      }finally {
        if(!client) _client.release();
      }
    },
    /**
     * 创建一个空表
     * @param tableSchema
     * @param tableName
     * @param client
     * @return {Promise.<*|Promise.<string>>}
     */
    createEmptyTable: async function (tableSchema, tableName, client) {
      return await this.createTable(tableSchema, tableName, null, client);
    },
    /**
     * 创建列
     * @param tableSchema
     * @param tableName
     * @param columnOption
     * @param client
     * @return {Promise.<void>}
     */
    createColumn: async function (tableSchema, tableName, columnOption, client) {
      const spl = `
        ALTER TABLE 
          ${tableSchema}."${tableName}"
        ADD
          ${this._generateColumnClause(columnOption)}
      `;
      const _client = client || await CB.pg.connect();
      try {
        await _client.query(spl);
        return 'ok';
      }catch (error) {
        throw new Error('[DATABASE TABLE OPERATION ERROR] - ' + error.message);
      }finally {
        if(!client) _client.release();
      }
    },
  };
};