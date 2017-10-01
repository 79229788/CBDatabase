module.exports.tables = [
  //********************[默认]用户表
  //********************
  {
    name: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'isDel', type: 'boolean', default: false},
      {name: 'username', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'password', type: 'text'},
      {name: 'mobilePhoneNumber', type: 'text', isUnique: true},
      {name: 'mobilePhoneVerified', type: 'boolean', default: false},
      {name: 'email', type: 'text', isUnique: true},
      {name: 'emailVerified', type: 'boolean', default: false},
      {name: 'authData', type: 'object'},
    ]
  },
  //********************[默认]文件表
  //********************
  {
    name: '_File',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
      {name: 'url', type: 'text'},
      {name: 'provider', type: 'text'},
      {name: 'mimeType', type: 'text'},
      {name: 'metaData', type: 'object'},
    ]
  },
  //********************通知表
  //********************
  {
    name: 'Notification',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'key', type: 'text', isUnique: true},        //唯一key(一般用于关联删除)
      {name: 'type', type: 'smallint'},                   //通知类型
      {name: 'title', type: 'text'},                      //通知标题
      {name: 'content', type: 'text'},                    //通知内容
      {name: 'tags', type: 'text[]'},                     //通知标签
      {name: 'url', type: 'text'},                        //内容url
      {name: 'date', type: 'text'},                       //通知日期
      {name: 'sender', type: 'pointer'},                  //发信人
      {name: 'receivers', type: 'pointer[]'},             //收信人
      {name: 'isRead', type: 'boolean', default: false},  //是否阅读
    ]
  },
  //********************员工通知表
  //********************
  {
    name: 'NotificationEmployee',
    parent: 'Notification',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'key', type: 'text', isUnique: true}
    ]
  },
  //********************客户通知表
  //********************
  {
    name: 'NotificationCustomer',
    parent: 'Notification',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'key', type: 'text', isUnique: true}
    ]
  },
  //********************审批事务表（带有审批功能的表，需要继承该表）
  //********************
  {
    name: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'at_number', type: 'text'},                            //审批单的编号
      {name: 'at_money', type: 'money', default: 0},                //审批单中涉及的金额
      {name: 'at_warehouse', type: 'pointer'},                      //审批单的主对象1
      {name: 'at_customer', type: 'pointer'},                       //审批单的主对象2
      {name: 'at_supplier', type: 'pointer'},                       //审批单的主对象3
      {name: 'at_type', type: 'smallint'},                          //类型名称
      {name: 'at_state', type: 'smallint'},                         //1审核中 2审批通过 3审批驳回
      {name: 'at_setting', type: 'pointer'},                        //关联的审批设置
      {name: 'at_progress', type: 'pointer[]'},                     //审批进度
      {name: 'at_transfer', type: 'pointer'},                       //临时转交的审批人
      {name: 'at_jointTotal', type: 'smallint', default: 0},        //审批参与会签的总人数
      {name: 'at_jointCurrents', type: 'pointer[]'},                //审批当前会签已同意的个人
    ]
  },
  //********************审批设置表
  //********************
  {
    name: 'ApprovalSetting',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},                                 //名字
      {name: 'key', type: 'text'},                                  //key
      {name: 'approvers', type: 'pointer[]'},                       //审批人集合
      //{name: 'conditions', type: 'pointer[]'},                      //审批条件集合
      {name: 'isDefault', type: 'boolean', default: false},         //是否为系统默认
      {name: 'isEnable', type: 'boolean', default: true},           //是否激活
      {name: 'isAlarmDingTalk', type: 'boolean', default: false},   //是否通知钉钉
      {name: 'isAlarmWeChat', type: 'boolean', default: true},      //是否通知微信
      {name: 'dingTalkRobot', type: 'text'},                        //钉钉机器人
      {name: 'sort', type: 'smallint'}
    ]
  },
  //********************审批设置表[系统默认]
  //********************
  {
    name: 'ApprovalDefaultSetting',
    parent: 'ApprovalSetting',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'key', type: 'text', isUnique: true},
    ]
  },
  //********************审批进度表
  //********************
  {
    name: 'ApprovalProgress',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'approver', type: 'pointer'},                  //审批人（具体到某个员工）
      {name: 'state', type: 'smallint'},                    //审批状态
      {name: 'date', type: 'text'},                         //审批时间
      {name: 'comments', type: 'text'},                     //审批备注
    ]
  },
  //********************审批者表（非特指某一个人，而是一个完整审批者信息）
  //********************
  {
    name: 'Approver',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'customs', type: 'pointer[]'},
      {name: 'middleRole', type: 'pointer'},
      //{name: 'supervisor', type: 'pointer'},
      {name: 'personType', type: 'smallint'},
      {name: 'actionType', type: 'smallint'},                           //[非主管选项] 审批方式
      //{name: 'isOneByOneSupervisor', type: 'boolean', default: true}, //[主管选项]是否开启主管逐一审批
    ]
  },
  //********************公司表
  //********************
  {
    name: 'Company',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'logo', type: 'file'},                           //企业Logo
      {name: 'name', type: 'text'},                           //企业名称
      {name: 'shortName', type: 'text'},                      //企业简称
      {name: 'size', type: 'smallint'},                       //企业规模
      {name: 'type', type: 'smallint'},                       //企业行业
      {name: 'stockInPurchaseType', type: 'pointer'},         //采购产品入库类型
      {name: 'stockInSaleReturnType', type: 'pointer'},       //销售退货入库类型
      {name: 'stockInCheckIncomeType', type: 'pointer'},      //盘点盘盈入库类型
      {name: 'stockOutSaleType', type: 'pointer'},            //销售产品出库类型
      {name: 'stockOutPurchaseReturnType', type: 'pointer'},  //采购退货出库类型
      {name: 'stockOutCheckLossType', type: 'pointer'},       //盘点盘亏出库类型
      {name: 'defaultMiddleRoles', type: 'pointer[]'},        //系统默认角色

      {name: 'dd_agentId', type: 'text'},                     //钉钉-微应用ID
      {name: 'dd_corpId', type: 'text'},                      //钉钉-企业ID
      {name: 'dd_corpSecret', type: 'text'},                  //钉钉-企业密钥
    ]
  },
  //********************员工表
  //********************
  {
    name: 'Employee',
    parent: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},          //*继承父表
      {name: 'mobilePhoneNumber', type: 'text', isUnique: true},  //*继承父表
      {name: 'email', type: 'text', isUnique: true},              //*继承父表
      {name: '__key', type: 'text'},                              //*relation专用
      {name: 'number', type: 'text'},                             //员工工号
      {name: 'isActive', type: 'boolean', default: false},        //是否在职
      {name: 'isInitPassword', type: 'boolean', default: true},   //是否在用初始密码
      {name: 'isAdmin', type: 'boolean', default: false},         //是否为管理员
      {name: 'isCreator', type: 'boolean', default: false},       //是否为超级管理员（创建者）
      {name: 'otherActionAccess', type: 'text[]'},                //其它的操作权限
      {name: 'middleRole', type: 'pointer'},                   //指定角色
      {name: 'defaultCompany', type: 'pointer'},                  //常用公司
      {name: 'defaultWarehouse', type: 'pointer'},                //常用使用仓库
      {name: 'defaultSettlementAccount', type: 'pointer'},        //常用使用账户
    ]
  },
  //********************角色表
  //********************
  {
    name: 'MiddleRole',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},                           //角色名
      {name: 'desc', type: 'text'},                           //角色描述
      {name: 'actionAccess', type: 'text[]'},                 //角色权限列表
      {name: 'isAdmin', type: 'boolean', default: false},     //是否为管理员
      {name: 'isDefault', type: 'boolean', default: false},   //是否为系统默认项
      {name: 'employees', type: 'relation'},                  //所属员工
      {name: 'sort', type: 'smallint'},                       //排序值
    ]
  },
  //********************客户等级表
  //********************
  {
    name: 'CustomerLevel',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'parentId', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'discount', type: 'numeric(3,2)', default: 1},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************供应商等级表
  //********************
  {
    name: 'SupplierCate',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'parentId', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************商品分类表
  //********************
  {
    name: 'SaleProductCate',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'parentId', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************商品单位表
  //********************
  {
    name: 'SaleProductUnit',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'parentId', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************仓库表
  //********************
  {
    name: 'Warehouse',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'contact', type: 'text'},
      {name: 'address', type: 'text'},
      {name: 'type', type: 'smallint', default: 0},
      {name: 'sort', type: 'smallint'},
    ]
  },
  //********************结算账户表
  //********************
  {
    name: 'SettlementAccount',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},
      {name: 'type', type: 'smallint', default: 1},
      {name: 'balance', type: 'money', default: 0},
      {name: 'sort', type: 'smallint'},
    ]
  },
  //********************出库类型表
  //********************
  {
    name: 'StockOutType',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************入库类型表
  //********************
  {
    name: 'StockInType',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},
      {name: 'sort', type: 'text'},
    ]
  },
  //********************供应商表
  //********************
  {
    name: 'Supplier',
    parent: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},                  //*继承父表
      {name: 'mobilePhoneNumber', type: 'text', isUnique: true},          //*继承父表
      {name: 'email', type: 'text', isUnique: true},                      //*继承父表
      {name: 'company', type: 'pointer'},
      {name: 'principal', type: 'pointer'},                               //负责人
      {name: 'cate', type: 'pointer'},                                    //供应商分类
      {name: 'city', type: 'text[]'},                                     //供应商区域
      {name: 'contactNumber', type: 'text'},                              //供应商电话
      {name: 'address', type: 'text'},                                    //供应商地址
      {name: 'tags', type: 'text[]'},                                     //供应商标签
      {name: 'online_shopUrl', type: 'text'},                             //供应商店铺
      {name: 'online_wwId', type: 'text'},                                //供应商旺旺
      {name: 'online_qqNumber', type: 'text'},                            //供应商QQ
      {name: 'online_wxNumber', type: 'text'},                            //供应商微信
      {name: 'consignees', type: 'pointer[]'},                            //收货人信息列表
      {name: 'defaultConsignee', type: 'pointer'},                        //默认收货人信息
      {name: 'payable', type: 'money', default: 0},                       //应付账款
      {name: 'advanceBalance', type: 'money', default: 0},                //预付款余额
      {name: 'beginningPayable', type: 'money', default: 0},              //期初应付金额
      {name: 'beginningPayed', type: 'money', default: 0},                //期初已收金额
      {name: 'receivable', type: 'money', default: 0},                    //应收退款
      {name: 'beginningReceivable', type: 'money', default: 0},           //期初应收退款
      {name: 'beginningReceived', type: 'money', default: 0},             //期初已收退款
    ]
  },
  //********************收获地址表
  //********************
  {
    name: 'SupplierAddress',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},                           //收货人名字
      {name: 'contacts', type: 'text[]'},                     //收货人电话
      {name: 'area', type: 'text[]'},                         //收货人区域
      {name: 'address', type: 'text'},                        //收货人详细地址
      {name: 'logistics', type: 'object[]'},                    //收货人指定物流信息
    ]
  },
  //********************客户表
  //********************
  {
    name: 'Customer',
    parent: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},                  //*继承父表
      {name: 'mobilePhoneNumber', type: 'text', isUnique: true},          //*继承父表
      {name: 'email', type: 'text', isUnique: true},                      //*继承父表
      {name: 'company', type: 'pointer'},
      {name: 'principal', type: 'pointer'},                               //负责人
      {name: 'level', type: 'pointer'},                                   //客户等级
      {name: 'city', type: 'text[]'},                                     //客户区域
      {name: 'contactNumber', type: 'text'},                              //客户电话
      {name: 'address', type: 'text'},                                    //客户地址
      {name: 'consignees', type: 'pointer[]'},                            //收货人信息列表
      {name: 'defaultConsignee', type: 'pointer'},                        //默认收货人信息
      {name: 'receivable', type: 'money', default: 0},                    //应收账款
      {name: 'advanceBalance', type: 'money', default: 0},                //预收款余额
      {name: 'beginningReceivable', type: 'money', default: 0},           //期初应收金额
      {name: 'beginningReceived', type: 'money', default: 0},             //期初已收金额
      {name: 'payable', type: 'money', default: 0},                       //应付退款
      {name: 'beginningPayable', type: 'money', default: 0},              //期初应付退款
      {name: 'beginningPayed', type: 'money', default: 0},                //期初已收退款
    ]
  },
  //********************收获地址表
  //********************
  {
    name: 'CustomerAddress',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},                           //收货人名字
      {name: 'contacts', type: 'text[]'},                     //收货人电话
      {name: 'area', type: 'text[]'},                         //收货人区域
      {name: 'address', type: 'text'},                        //收货人详细地址
      {name: 'logistics', type: 'object[]'},                    //收货人指定物流信息
    ]
  },
  //********************商品表
  //********************
  {
    name: 'SaleProduct',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'name', type: 'text'},                                       //商品名称
      {name: 'unit', type: 'text'},                                       //商品单位
      {name: 'query', type: 'text'},                                      //查询字符
      {name: 'sort', type: 'smallint', default: -1},                      //排序值
      {name: 'type', type: 'smallint'},                                   //商品类型
      {name: 'cates', type: 'pointer[]'},                                 //商品分类
      {name: 'stock', type: 'integer', default: 0},                       //商品库存
      {name: 'cost', type: 'money', default: 0},                          //商品成本
      {name: 'skuId', type: 'text'},                                      //sku的id
      {name: 'skuSort', type: 'smallint', default: 0},                    //sku的排序值
      {name: 'sizeName', type: 'text'},                                   //规格名字
      {name: 'sizeCode', type: 'text'},                                   //规格编码
      {name: 'sizeBarcode', type: 'text'},                                //规格条形码
      {name: 'price_levels', type: 'pointer[]'},
      {name: 'price_levelPrices', type: 'pointer[]'},
      {name: 'price_customers', type: 'pointer[]'},
      {name: 'price_alonePrices', type: 'pointer[]'},
      {name: 'ownRelatedStockItem', type: 'boolean', default: false},     //是否自身出库关联
      {name: 'ownRelatedStockValue', type: 'smallint', default: -1},      //自身出库关联值
      {name: 'relatedStockItems', type: 'pointer[]'},                     //出库关联条目
      {name: 'relatedStockValues', type: 'smallint[]'},                   //出库关联增量值(和关联条目顺序必须一致)
      {name: 'relatedSplitItems', type: 'pointer[]'},                     //拆组关联条目
      {name: 'relatedSplitValues', type: 'smallint[]'},                   //拆组关联增量值(和关联条目顺序必须一致)
    ]
  },
  //********************等级价格表
  //********************
  {
    name: 'SaleProductPriceLevel',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'level', type: 'pointer'},
      {name: 'price', type: 'money', default: 0},
      {name: 'minOrder', type: 'integer', default: 0},
      {name: 'isBuyable', type: 'boolean', default: true},
    ]
  },
  //********************独立价格表
  //********************
  {
    name: 'SaleProductPriceAlone',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'customer', type: 'pointer'},
      {name: 'price', type: 'money', default: 0},
      {name: 'minOrder', type: 'integer', default: 0},
      {name: 'isBuyable', type: 'boolean', default: true},
    ]
  },
  //********************库存表(中间表)
  //********************
  {
    name: 'StockWarehouseMap',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'warehouse', type: 'pointer'},                   //关联的仓库
      {name: 'saleProduct', type: 'pointer'},                 //关联的商品
      {name: 'count', type: 'integer', default: 0},           //库存数量
      {name: 'minCount', type: 'integer', default: 0},        //库存下限值
      {name: 'maxCount', type: 'integer', default: 0},        //库存上限值
    ]
  },
  //********************商品入库表
  //********************
  {
    name: 'StockIn',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'warehouse', type: 'pointer'},                       //入库仓库
      {name: 'number', type: 'text'},                             //入库单号
      {name: 'date', type: 'text'},                               //入库时间
      {name: 'type', type: 'pointer'},                            //入库类型
      {name: 'comments', type: 'text'},                           //备注
      {name: 'transactorName', type: 'text'},                     //经办人
      {name: 'creator', type: 'pointer'},                         //制单人
      {name: 'details', type: 'relation'},                        //入库明细
    ]
  },
  //********************商品入库明细表
  //********************
  {
    name: 'StockInDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //入库数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************商品出库表
  //********************
  {
    name: 'StockOut',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'warehouse', type: 'pointer'},                         //出库仓库
      {name: 'number', type: 'text'},                               //出库单号
      {name: 'date', type: 'text'},                                 //出库时间
      {name: 'type', type: 'pointer'},                              //出库类型
      {name: 'comments', type: 'text'},                             //备注
      {name: 'transactorName', type: 'text'},                       //经办人
      {name: 'creator', type: 'pointer'},                           //制单人
      {name: 'details', type: 'relation'},                          //出库明细
      {name: 'relatedDetails', type: 'relation'},                   //出库关联明细
    ]
  },
  //********************商品出库明细表
  //********************
  {
    name: 'StockOutDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //出货数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************商品出库关联明细表
  //********************
  {
    name: 'StockOutRelatedDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //出库数量
      {name: 'increment', type: 'integer', default: 0},         //出库增量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************商品调拨表
  //********************
  {
    name: 'StockTransfer',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'outWarehouse', type: 'pointer'},                  //调出仓库
      {name: 'inWarehouse', type: 'pointer'},                   //调入采购单
      {name: 'number', type: 'text'},                           //入库单号
      {name: 'date', type: 'text'},                             //调拨时间
      {name: 'type', type: 'smallint'},                         //调拨类型
      {name: 'comments', type: 'text'},                         //备注
      {name: 'transactorName', type: 'text'},                   //经办人
      {name: 'creator', type: 'pointer'},                       //制单人
      {name: 'details', type: 'relation'},                      //调拨明细
      {name: 'relatedDetails', type: 'relation'},               //调拨关联明细
    ]
  },
  //********************商品调拨明细表
  //********************
  {
    name: 'StockTransferDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //调拨数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
      {name: 'stockWarehouseMap', type: 'pointer'}              //关联的库存表
    ]
  },
  //********************商品调拨关联明细表
  //********************
  {
    name: 'StockTransferRelatedDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //调拨数量
      {name: 'increment', type: 'integer', default: 0},         //调拨增量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************库存盘点表
  //********************
  {
    name: 'StockCheck',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},                             //入库单号
      {name: 'date', type: 'text'},                               //盘点时间
      {name: 'cate', type: 'pointer'},                            //盘点的分类
      {name: 'warehouse', type: 'pointer'},                       //盘点的仓库
      {name: 'sumIncome', type: 'integer', default: 0},           //盘盈总数量
      {name: 'sumLoss', type: 'integer', default: 0},             //盘亏总数量
      {name: 'sumIncomeMoney', type: 'money', default: 0},        //盘盈总金额
      {name: 'sumLossMoney', type: 'money', default: 0},          //盘亏总金额
      {name: 'stockIn', type: 'pointer'},                         //关联的盘盈入库单
      {name: 'stockOut', type: 'pointer'},                        //关联的盘亏出库单
      {name: 'comments', type: 'text'},                           //备注
      {name: 'transactorName', type: 'text'},                     //经办人
      {name: 'creator', type: 'pointer'},                         //制单人
      {name: 'details', type: 'relation'},                        //盘点明细
    ]
  },
  //********************库存盘点明细表
  //********************
  {
    name: 'StockCheckDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'thenStock', type: 'integer', default: 0},         //当时的库存
      {name: 'count', type: 'integer', default: 0},             //盘点数量
      {name: 'income', type: 'integer', default: 0},            //盘盈数量
      {name: 'loss', type: 'integer', default: 0},              //盘亏数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
      {name: 'stockWarehouseMap', type: 'pointer'}              //关联的库存表
    ]
  },
  //********************采购订单表
  //********************
  {
    name: 'PurchasingOrder',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'supplier', type: 'pointer'},                      //关联供应商
      {name: 'number', type: 'text'},                           //采购单号
      {name: 'date', type: 'text'},                             //采购时间
      {name: 'state', type: 'smallint', default: 1},            //采购单状态
      {name: 'stockInState', type: 'smallint', default: 1},     //采购单入库状态
      {name: 'sumCost', type: 'money', default: 0},             //采购总金额
      {name: 'sumIned', type: 'money', default: 0},             //采购已入库金额
      {name: 'isPayed', type: 'boolean', default: false},       //是否已付款
      {name: 'creator', type: 'pointer'},                       //制单人
      {name: 'comments', type: 'text'},                         //备注
      {name: 'details', type: 'relation'},                      //商品明细
    ]
  },
  //********************采购订单明细表
  //********************
  {
    name: 'PurchasingOrderDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //购买数量
      {name: 'cost', type: 'money', default: 0},                //购买单价(成本)
      {name: 'priceSum', type: 'money', default: 0},            //购买总价
      {name: 'ined', type: 'integer', default: 0},              //已入库数量
      {name: 'mergeType', type: 'text'},                        //合并类型
      {name: 'mergeId', type: 'text'},                          //合并id
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************采购入库表
  //********************
  {
    name: 'PurchasingOrderStockIn',
    parent: 'StockIn',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'purchasingOrder', type: 'pointer'},               //入库采购单
      {name: 'supplier', type: 'pointer'},                      //供应商
      {name: 'isPayed', type: 'boolean', default: false},       //是否已付款
      {name: 'sumCost', type: 'money', default: 0},             //入库成本
    ]
  },
  //********************采购入库明细表
  //********************
  {
    name: 'PurchasingOrderStockInDetail',
    parent: 'StockInDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'purchasingOrderDetail', type: 'pointer'},
    ]
  },
  //********************采购退货表
  //********************
  {
    name: 'PurchasingReturn',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'supplier', type: 'pointer'},                      //关联供应商
      {name: 'number', type: 'text'},                           //采购退货单号
      {name: 'date', type: 'text'},                             //采购退货时间
      {name: 'state', type: 'smallint', default: 1},            //采购退货单状态
      {name: 'stockOutState', type: 'smallint', default: 1},    //采购退货单出库状态
      {name: 'sumReturn', type: 'money', default: 0},           //采购退货总金额
      {name: 'sumOuted', type: 'money', default: 0},            //采购退货已出库金额
      {name: 'refundType', type: 'smallint', default: 1},       //采购退货方式
      {name: 'creator', type: 'pointer'},                       //制单人
      {name: 'comments', type: 'text'},                         //备注
      {name: 'details', type: 'relation'},                      //商品明细
    ]
  },
  //********************采购退货明细表
  //********************
  {
    name: 'PurchasingReturnDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //退货数量
      {name: 'price', type: 'money', default: 0},               //退货单价
      {name: 'outed', type: 'integer', default: 0},             //已出库数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************采购退货出库表
  //********************
  {
    name: 'PurchasingReturnStockOut',
    parent: 'StockOut',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'purchasingReturn', type: 'pointer'},                //采购退货单
      {name: 'refundType', type: 'smallint', default: 1},         //采购退货方式
      {name: 'supplier', type: 'pointer'},                        //供应商
      {name: 'isCollected', type: 'boolean', default: false},     //是否已收款
      {name: 'sumReturn', type: 'money', default: 0},             //退货出库合计金额
    ]
  },
  //********************采购退货出库明细表
  //********************
  {
    name: 'PurchasingReturnStockOutDetail',
    parent: 'StockOutDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'purchasingReturnDetail', type: 'pointer'},
    ]
  },
  //********************销售订单表
  //********************
  {
    name: 'SaleOrder',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'customer', type: 'pointer'},                      //关联客户
      {name: 'number', type: 'text'},                           //销售单号
      {name: 'area', type: 'text[]'},                           //销售区域
      {name: 'deliveryDate', type: 'text'},                     //发货时间
      {name: 'state', type: 'smallint', default: 1},            //销售单状态
      {name: 'stockOutState', type: 'smallint', default: 1},    //销售单出库状态
      {name: 'sumSale', type: 'money', default: 0},             //销售总金额
      {name: 'sumOuted', type: 'money', default: 0},            //销售已出库金额
      {name: 'creator', type: 'pointer'},                       //制单人
      {name: 'comments', type: 'text'},                         //备注
      {name: 'details', type: 'relation'},                      //商品明细
      {name: 'relatedDetails', type: 'relation'},               //商品关联明细
    ]
  },
  //********************销售订单明细表
  //********************
  {
    name: 'SaleOrderDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //销售数量
      {name: 'price', type: 'money', default: 0},               //销售价格
      {name: 'outed', type: 'integer', default: 0},             //已出货数量
      {name: 'relatedStockItems', type: 'pointer[]'},           //关联出库条目
      {name: 'relatedStockValues', type: 'smallint[]'},         //关联出库值
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************销售订单关联明细表
  //********************
  {
    name: 'SaleOrderRelatedDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //销售出库数量
      {name: 'increment', type: 'money', default: 0},           //销售出库增量
      {name: 'outed', type: 'integer', default: 0},             //已出库数量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************销售出库表
  //********************
  {
    name: 'SaleOrderStockOut',
    parent: 'StockOut',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'saleOrder', type: 'pointer'},                     //关联订单
      {name: 'customer', type: 'pointer'},                      //关联客户
      {name: 'isCollected', type: 'boolean', default: false},   //是否已收款
      {name: 'sumSale', type: 'money', default: 0},             //销售出库合计金额
    ]
  },
  //********************销售出货明细表
  //********************
  {
    name: 'SaleOrderStockOutDetail',
    parent: 'StockOutDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'saleOrderDetail', type: 'pointer'},
    ]
  },
  //********************销售出库明细表
  //********************
  {
    name: 'SaleOrderStockOutRelatedDetail',
    parent: 'StockOutRelatedDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'saleOrderRelatedDetail', type: 'pointer'},
    ]
  },
  //********************销售退货表
  //********************
  {
    name: 'SaleReturn',
    parent: 'ApprovalTransaction',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'customer', type: 'pointer'},                        //关联客户
      {name: 'number', type: 'text'},                             //销售退货单号
      {name: 'date', type: 'text'},                               //销售退货时间
      {name: 'state', type: 'smallint', default: 1},              //销售退货单状态
      {name: 'stockInState', type: 'smallint', default: 1},       //销售退货单出库状态
      {name: 'sumReturn', type: 'money', default: 0},             //销售退货总金额
      {name: 'sumIned', type: 'money', default: 0},               //销售退货已入库金额
      {name: 'isPayed', type: 'boolean', default: false},         //是否已付款
      {name: 'creator', type: 'pointer'},                         //制单人
      {name: 'comments', type: 'text'},                           //备注
      {name: 'details', type: 'relation'},                        //商品明细
    ]
  },
  //********************销售退货明细表
  //********************
  {
    name: 'SaleReturnDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //退货数量
      {name: 'price', type: 'money', default: 0},               //退货单价
      {name: 'ined', type: 'integer', default: 0},              //已入库数量
      {name: 'relatedSplitItems', type: 'pointer[]'},           //关联拆组条目
      {name: 'relatedSplitValues', type: 'smallint[]'},         //关联拆组值
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************销售退货入库表
  //********************
  {
    name: 'SaleReturnStockIn',
    parent: 'StockIn',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'relatedDetails', type: 'relation'},               //关联明细详情
      {name: 'isSplit', type: 'boolean', default: false},       //是否拆入库
      {name: 'saleReturn', type: 'pointer'},                    //销售退货单
      {name: 'customer', type: 'pointer'},                      //关联客户
      {name: 'isPayed', type: 'boolean', default: false},       //是否已付款
      {name: 'sumReturn', type: 'money', default: 0},           //退货入库合计金额

    ]
  },
  //********************销售退货入库明细表
  //********************
  {
    name: 'SaleReturnStockInDetail',
    parent: 'StockInDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'saleReturnDetail', type: 'pointer'},
    ]
  },
  //********************销售退货入库关联明细表
  //********************
  {
    name: 'SaleReturnStockInRelatedDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'count', type: 'integer', default: 0},             //入库数量
      {name: 'increment', type: 'integer', default: 0},         //入库增量
      {name: 'comments', type: 'text'},                         //备注
      {name: 'saleProduct', type: 'pointer'},                   //关联商品
    ]
  },
  //********************应收账款表
  //********************
  {
    name: 'MoneyReceivable',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},
      {name: 'type', type: 'text'},
      {name: 'creator', type: 'pointer'},
      {name: 'receivable', type: 'money', default: 0},
      {name: 'received', type: 'money', default: 0},
      {name: 'isClose', type: 'boolean', default: false},
      {name: 'date', type: 'text'},
      {name: 'comments', type: 'text'},
      {name: 'details', type: 'pointer[]'},
      //销售应收特有
      {name: 'customer', type: 'pointer'},
      {name: 'saleOrderStockOut', type: 'pointer'},
      //采购退货应收特有
      {name: 'supplier', type: 'pointer'},
      {name: 'purchasingReturnStockOut', type: 'pointer'},
    ]
  },
  //********************收款流水表
  //********************
  {
    name: 'MoneyCollectionRunning',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},
      {name: 'date', type: 'text'},
      {name: 'creator', type: 'pointer'},
      {name: 'payeeName', type: 'text'},
      {name: 'settlementAmount', type: 'money', default: 0},
      {name: 'advanceReceived', type: 'money', default: 0},
      {name: 'usedAdvanceMoney', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
      {name: 'receivableDetails', type: 'pointer[]'},
      {name: 'settlementDetails', type: 'pointer[]'},
      //销售特有
      {name: 'customer', type: 'pointer'},
      {name: 'saleOrderStockOutDetails', type: 'pointer[]'},
      //采购退货特有
      {name: 'supplier', type: 'pointer'},
      {name: 'purchasingReturnStockOutDetails', type: 'pointer[]'},
    ]
  },
  //********************收款流水应收明细表
  //********************
  {
    name: 'MoneyCollectionRunningReceivableDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'targetId', type: 'text'},
      {name: 'targetNumber', type: 'text'},
      {name: 'date', type: 'text'},
      {name: 'receivable', type: 'money', default: 0},
      {name: 'received', type: 'money', default: 0},
      {name: 'current', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
    ]
  },
  //********************收款流水结算明细表
  //********************
  {
    name: 'MoneyCollectionRunningSettlementDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
      {name: 'type', type: 'smallint'},
      {name: 'settlement', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
    ]
  },

  //********************应付账款表
  //********************
  {
    name: 'MoneyPayable',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},
      {name: 'type', type: 'text'},
      {name: 'creator', type: 'pointer'},
      {name: 'payable', type: 'money', default: 0},
      {name: 'payed', type: 'money', default: 0},
      {name: 'isClose', type: 'boolean', default: false},
      {name: 'date', type: 'text'},
      {name: 'comments', type: 'text'},
      {name: 'details', type: 'pointer[]'},
      //采购应付特有
      {name: 'supplier', type: 'pointer'},
      {name: 'purchasingOrder', type: 'pointer'},
      //销售退货应付特有
      {name: 'customer', type: 'pointer'},
      {name: 'saleReturn', type: 'pointer'},
    ]
  },
  //********************付款流水表
  //********************
  {
    name: 'MoneyPaymentRunning',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'number', type: 'text'},
      {name: 'date', type: 'text'},
      {name: 'creator', type: 'pointer'},
      {name: 'payerName', type: 'text'},
      {name: 'settlementAmount', type: 'money', default: 0},
      {name: 'advancePayed', type: 'money', default: 0},
      {name: 'usedAdvanceMoney', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
      {name: 'payableDetails', type: 'pointer[]'},
      {name: 'settlementDetails', type: 'pointer[]'},
      //采购付款特有
      {name: 'supplier', type: 'pointer'},
      {name: 'purchasingOrderDetails', type: 'pointer[]'},
      //销售退货付款特有
      {name: 'customer', type: 'pointer'},
      {name: 'saleReturnDetails', type: 'pointer[]'},
    ]
  },
  //********************付款流水应付明细表
  //********************
  {
    name: 'MoneyPaymentRunningPayableDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'targetId', type: 'text'},
      {name: 'targetNumber', type: 'text'},
      {name: 'date', type: 'text'},
      {name: 'payable', type: 'money', default: 0},
      {name: 'payed', type: 'money', default: 0},
      {name: 'current', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
    ]
  },
  //********************付款流水结算明细表
  //********************
  {
    name: 'MoneyPaymentRunningSettlementDetail',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
      {name: 'type', type: 'smallint'},
      {name: 'settlement', type: 'money', default: 0},
      {name: 'comments', type: 'text'},
    ]
  },

];
