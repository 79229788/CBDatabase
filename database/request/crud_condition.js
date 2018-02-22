module.exports = function (className, object) {
  switch (object.type) {
    //**************************************************
    //****************************************基本类型
    case 'equal':
      return `${getVariableKey(object.key)} = ${getVariableValue(object.value)}`;
    case 'equals':
      return `"${className}"."${object.key}" = ANY(VALUES ${object.value.map((item) => {
        return `('${item}')`
      }).join(',')})`;
    case 'notEqual':
      return `${getVariableKey(object.key)} != ${getVariableValue(object.value)}`;
    case 'greaterThan':
      return `${getVariableKey(object.key)} > ${getVariableValue(object.value)}`;
    case 'greaterThanOrEqual':
      return `${getVariableKey(object.key)} >= ${getVariableValue(object.value)}`;
    case 'lessThan':
      return `${getVariableKey(object.key)} < ${getVariableValue(object.value)}`;
    case 'lessThanOrEqual':
      return `${getVariableKey(object.key)} <= ${getVariableValue(object.value)}`;
    case 'prefixText':
      return `"${className}"."${object.key}" LIKE '${object.value}%'`;
    case 'suffixText':
      return `"${className}"."${object.key}" LIKE '%${object.value}'`;
    case 'containsText':
      return `"${className}"."${object.key}" LIKE '%${object.value}%'`;


    //**************************************************
    //****************************************数组类型
    //数组元素全包含
    case 'containsAllArray':
      return `"${className}"."${object.key}" = '{"${object.value.join('","')}"}'`;
    //包含数组元素
    case 'containsInArray':
      return `"${className}"."${object.key}" @> '{"${object.value.join('","')}"}'`;
    //数组元素被包含
    case 'containedByArray':
      return `"${className}"."${object.key}" <@ '{"${object.value.join('","')}"}'`;
    //数组元素有重叠
    case 'overlapInArray':
      return `"${className}"."${object.key}" && '{"${object.value.join('","')}"}'`;
    //数组元素全不包含
    case 'notContainAllArray':
      return `"${className}"."${object.key}" <> '{"${object.value.join('","')}"}'`;
    //数组元素不被包含
    case 'notContainInArray':
      return `NOT ('${object.value}' = ANY("${className}"."${object.key}"))`;
    //匹配数组长度
    case 'lengthInArray':
      if(object.value === 0) {
        return `
        (ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) IS NULL
        OR ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) = 0)
        `;
      }
      return `ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) = ${object.value}`;


    //**************************************************
    //****************************************JSON类型
    //JSON中的基础运算符判断
    case 'equalInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} = '${object.jsonValue}'`;
    case 'equalsInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} = ANY(VALUES ${object.jsonValue.map((item) => {
        return `('${item.id}')`
      }).join(',')})`;
    case 'notEqualInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} != '${object.jsonValue}'`;
    case 'greaterThanInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} > '${object.jsonValue}'`;
    case 'greaterThanOrEqualInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} >= '${object.jsonValue}'`;
    case 'lessThanInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} < '${object.jsonValue}'`;
    case 'lessThanOrEqualInJson':
      return `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} <= '${object.jsonValue}'`;
    //JSON中是否存在指定key
    case 'existKeyInJson':
      return `"${className}"."${object.key}" ? '${object.value}'`;
    //JSON中是否存在多个key中的任意一个
    case 'existAnyKeysInJson':
      return `"${className}"."${object.key}" ?| '${object.value}'`;
    //JSON中是否存在指定的全部key
    case 'existAllKeysInJson':
      return `"${className}"."${object.key}" ?& '${object.value}'`;
    case 'containsInJson':
      return `"${className}"."${object.key}" @> '${object.value}'`;
    case 'containedByJson':
      return `"${className}"."${object.key}" <@ '${object.value}'`;

    //**************************************************
    //****************************************其它
    case 'exist':
      return `"${className}"."${object.key}" IS NOT NULL`;
    case 'notExist':
      return `"${className}"."${object.key}" IS NULL`;
  }

  /**
   * 获取json箭头语句
   * @param jsonKey
   * @return {string}
   */
  function getJsonArrowClause(jsonKey) {
    const keys = jsonKey.split('.').map(item => `'${item}'`);
    const lastKey = keys.pop();
    const startArrow = keys.length > 0 ? ' -> ' : '';
    return startArrow + `${keys.join(' -> ')} ->> ${lastKey}`;
  }
  /**
   * 获取可为变量的值
   * @param value
   * @return {string}
   */
  function getVariableValue(value) {
    if(typeof value === 'string' && value.indexOf('${') >= 0 && value.indexOf('}') > 0 ) {
      return value.replace(/\$\{([\s\S][^\}]*)\}/g, `"${className}"."$1"`);
    }
    if(typeof value === 'string' && value.indexOf('$') >= 0 && value.indexOf('{') < 0 && value.indexOf('}') < 0) {
      return `"${className}"."${value.substr(1)}"`
    }
    return `'${value}'`;
  }
  /**
   * 获取可为变量的键
   * @param key
   * @return {*}
   */
  function getVariableKey(key) {
    if(key.indexOf('${') >= 0 && key.indexOf('}') > 0 ) {
      return key.replace(/\$\{([\s\S][^\}]*)\}/g, `"${className}"."$1"`);
    }
    if(key.indexOf('$') >= 0 && key.indexOf('{') < 0 && key.indexOf('}') < 0) {
      return `"${className}"."${key.substr(1)}"`
    }
    return `"${className}"."${key}"`;
  }
};
