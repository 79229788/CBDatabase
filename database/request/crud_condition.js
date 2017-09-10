module.exports = function (className, object) {
  switch (object.type) {
    //**************************************************
    //****************************************基本类型
    case 'equal':
      return `"${className}"."${object.key}" = '${object.value}'`;
    case 'equals':
      return `"${className}"."${object.key}" = ANY(VALUES ${object.value.map((item) => {
        return `('${item}')`
      }).join(',')})`;
    case 'notEqual':
      return `"${className}"."${object.key}" != '${object.value}'`;
    case 'greaterThan':
      return `"${className}"."${object.key}" > '${object.value}'`;
    case 'greaterThanOrEqual':
      return `"${className}"."${object.key}" >= '${object.value}'`;
    case 'lessThan':
      return `"${className}"."${object.key}" < '${object.value}'`;
    case 'lessThanOrEqual':
      return `"${className}"."${object.key}" <= '${object.value}'`;
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
      return `"${className}"."${object.key}" = '${object.value}'`;
    //包含数组元素
    case 'containsInArray':
      return `"${className}"."${object.key}" @> '${object.value}'`;
    //数组元素被包含
    case 'containedByArray':
      return `"${className}"."${object.key}" <@ '${object.value}'`;
    //数组元素有重叠
    case 'overlapInArray':
      return `"${className}"."${object.key}" && '${object.value}'`;
    //数组元素全不包含
    case 'notContainAllArray':
      return `"${className}"."${object.key}" <> '${object.value}'`;
    //数组元素不被包含
    case 'notContainInArray':
      return `NOT ('${object.value}' = ANY("${className}"."${object.key}"))`;


    //**************************************************
    //****************************************JSON类型
    //JSON中的基础运算符判断
    case 'equalInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' = '${object.jsonValue}'`;
    case 'equalsInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' = ANY(VALUES ${object.jsonValue.map((item) => {
        return `('${item.id}')`
      }).join(',')})`;
    case 'notEqualInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' != '${object.jsonValue}'`;
    case 'greaterThanInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' > '${object.jsonValue}'`;
    case 'greaterThanOrEqualInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' >= '${object.jsonValue}'`;
    case 'lessThanInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' < '${object.jsonValue}'`;
    case 'lessThanOrEqualInJson':
      return `"${className}"."${object.key}" ->> '${object.jsonKey}' <= '${object.jsonValue}'`;
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
};
