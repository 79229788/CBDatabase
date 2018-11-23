const _ = require('lodash');
module.exports = function (className, object, index) {
  const res = {};
  const variableValue = getVariableValue(object.value);
  switch (object.type) {
    //**************************************************
    //****************************************基本类型
    case 'equal':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} = ${variableValue.value}`;
        res.index = index - 1;
      }else {
        if(_.isArray(object.value)) {
          res.clause = `${getVariableKey(object.key)} = ANY($${index + 1})`;
        }else {
          res.clause = `${getVariableKey(object.key)} = $${index + 1}`;
        }
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'notEqual':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} != ${variableValue.value}`;
        res.index = index - 1;
      }else {
        if(_.isArray(object.value)) {
          res.clause = `NOT ${getVariableKey(object.key)} = ANY($${index + 1})`;
        }else {
          res.clause = `${getVariableKey(object.key)} != $${index + 1}`;
        }
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'greaterThan':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} > ${variableValue.value}`;
        res.index = index - 1;
      }else {
        res.clause = `${getVariableKey(object.key)} > $${index + 1}`;
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'greaterThanOrEqual':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} >= ${variableValue.value}`;
        res.index = index - 1;
      }else {
        res.clause = `${getVariableKey(object.key)} >= $${index + 1}`;
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'lessThan':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} < ${variableValue.value}`;
        res.index = index - 1;
      }else {
        res.clause = `${getVariableKey(object.key)} < $${index + 1}`;
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'lessThanOrEqual':
      if(variableValue.isVariable) {
        res.clause = `${getVariableKey(object.key)} <= ${variableValue.value}`;
        res.index = index - 1;
      }else {
        res.clause = `${getVariableKey(object.key)} <= $${index + 1}`;
        res.value = object.value;
        res.index = index;
      }
      break;
    case 'prefixText':
      res.clause = `"${className}"."${object.key}" LIKE $${index + 1} || '%'`;
      res.value = object.value;
      res.index = index;
      break;
    case 'suffixText':
      res.clause = `"${className}"."${object.key}" LIKE '%' || $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    case 'containsText':
      res.clause = `"${className}"."${object.key}" LIKE '%' || $${index + 1} || '%'`;
      res.value = object.value;
      res.index = index;
      break;


    //**************************************************
    //****************************************数组类型
    //数组元素全包含
    case 'containsAllArray':
      res.clause = `"${className}"."${object.key}" = $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //包含数组元素
    case 'containsInArray':
      res.clause = `"${className}"."${object.key}" @> $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //数组元素被包含
    case 'containedByArray':
      res.clause = `"${className}"."${object.key}" <@ $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //数组元素有重叠
    case 'overlapInArray':
      res.clause = `"${className}"."${object.key}" && $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //数组元素全不包含
    case 'notContainAllArray':
      res.clause = `"${className}"."${object.key}" <> $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //数组元素不被包含
    case 'notContainInArray':
      res.clause = `NOT ($${index + 1} = ANY("${className}"."${object.key}"))`;
      res.value = object.value;
      res.index = index;
      break;
    //匹配数组长度
    case 'lengthInArray':
      if(object.value === 0) {
        res.clause =  `
        (ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) IS NULL
        OR ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) = $${index + 1})
        `;
      }else {
        res.clause = `ARRAY_LENGTH("${className}"."${object.key}", ${object.dim || 1}) = $${index + 1}`;
      }
      res.value = object.value;
      res.index = index;
      break;


    //**************************************************
    //****************************************JSON类型
    //JSON中的基础运算符判断
    case 'equalInJson':
      if(_.isArray(object.jsonValue)) {
        res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} = ANY($${index + 1})`;
      }else {
        res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} = $${index + 1}`;
      }
      res.value = object.jsonValue;
      res.index = index;
      break;
    case 'notEqualInJson':
      if(_.isArray(object.jsonValue)) {
        res.clause = `NOT "${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} = ANY($${index + 1})`;
      }else {
        res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} != $${index + 1}`;
      }
      res.value = object.jsonValue;
      res.index = index;
      break;
    case 'greaterThanInJson':
      res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} > $${index + 1}`;
      res.value = object.jsonValue;
      res.index = index;
      break;
    case 'greaterThanOrEqualInJson':
      res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} >= $${index + 1}`;
      res.value = object.jsonValue;
      res.index = index;
      break;
    case 'lessThanInJson':
      res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} < $${index + 1}`;
      res.value = object.jsonValue;
      res.index = index;
      break;
    case 'lessThanOrEqualInJson':
      res.clause = `"${className}"."${object.key}" ${getJsonArrowClause(object.jsonKey)} <= $${index + 1}`;
      res.value = object.jsonValue;
      res.index = index;
      break;
    //JSON中是否存在指定key
    case 'existKeyInJson':
      res.clause = `"${className}"."${object.key}" ? $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //JSON中是否存在多个key中的任意一个
    case 'existAnyKeysInJson':
      res.clause = `"${className}"."${object.key}" ?| $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    //JSON中是否存在指定的全部key
    case 'existAllKeysInJson':
      res.clause = `"${className}"."${object.key}" ?& $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    case 'containsInJson':
      res.clause = `"${className}"."${object.key}" @> $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;
    case 'containedByJson':
      res.clause = `"${className}"."${object.key}" <@ $${index + 1}`;
      res.value = object.value;
      res.index = index;
      break;

    //**************************************************
    //****************************************其它
    case 'exist':
      res.clause = `"${className}"."${object.key}" IS NOT NULL`;
      res.index = index - 1;
      break;
    case 'notExist':
      res.clause = `"${className}"."${object.key}" IS NULL`;
      res.index = index - 1;
      break;
  }
  return res;
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
    const res = {};
    res.isVariable = false;
    res.value = `'${value}'`;
    if(typeof value === 'string' && value.indexOf('${') >= 0 && value.indexOf('}') > 0 ) {
      res.isVariable = true;
      res.value = value.replace(/\$\{([\s\S][^\}]*)\}/g, `"${className}"."$1"`);
    }
    if(typeof value === 'string' && value.indexOf('$') >= 0 && value.indexOf('{') < 0 && value.indexOf('}') < 0) {
      res.isVariable = true;
      res.value = `"${className}"."${value.substr(1)}"`
    }
    return res;
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
