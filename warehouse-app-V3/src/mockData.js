// mockData.js — 仅在没有配置 appKey/appSecret 的演示模式下使用
// 字段名参照 fieldMap.js 里的约定，等真实接口返回结构确认后，
// 只需要改 fieldMap.js，不用改这里的假数据结构。

module.exports = {
  warehouses: {
    list: [
      { warehouseCode: 'US-LAX-01', warehouseName: '洛杉矶仓', country: '美国', address: 'Los Angeles, CA' },
      { warehouseCode: 'US-NJ-02', warehouseName: '新泽西仓', country: '美国', address: 'Edison, NJ' },
    ],
  },
  products: {
    list: [
      { sku: 'SKU-0001', productName: '无线蓝牙耳机', weight: '0.12kg', createTime: '2026-08-01' },
      { sku: 'SKU-0002', productName: '硅胶手机壳', weight: '0.05kg', createTime: '2026-08-03' },
    ],
  },

  // ---- 入库单：上架状态 / 时间 / 收货数量 ----
  inboundOrders: {
    list: [
      {
        inboundNo: 'IB20260901001',
        warehouseCode: 'US-LAX-01',
        putawayStatus: '已上架',
        planQty: 500,
        receiveQty: 500,
        putawayQty: 500,
        receiveTime: '2026-09-02 14:20',
        putawayTime: '2026-09-03 09:10',
        createTime: '2026-09-01 08:00',
      },
      {
        inboundNo: 'IB20260905002',
        warehouseCode: 'US-NJ-02',
        putawayStatus: '部分上架',
        planQty: 300,
        receiveQty: 300,
        putawayQty: 180,
        receiveTime: '2026-09-06 11:05',
        putawayTime: '',
        createTime: '2026-09-05 10:30',
      },
      {
        inboundNo: 'IB20260908003',
        warehouseCode: 'US-LAX-01',
        putawayStatus: '收货中',
        planQty: 120,
        receiveQty: 60,
        putawayQty: 0,
        receiveTime: '',
        putawayTime: '',
        createTime: '2026-09-08 16:45',
      },
      {
        inboundNo: 'IB20260910004',
        warehouseCode: 'US-NJ-02',
        putawayStatus: '待收货',
        planQty: 800,
        receiveQty: 0,
        putawayQty: 0,
        receiveTime: '',
        putawayTime: '',
        createTime: '2026-09-10 09:00',
      },
    ],
  },

  // ---- 出库单：客户订单 + 物流单号 ----
  outboundOrders: {
    list: [
      {
        orderNo: 'OB20260908001',
        customerOrderNo: 'AMZ-3391-2201',
        warehouseCode: 'US-LAX-01',
        salesPlatform: 'Amazon',
        status: '已出库',
        trackingNo: '1Z999AA10123456784',
        carrier: 'UPS',
        createTime: '2026-09-08 09:12',
      },
      {
        orderNo: 'OB20260910003',
        customerOrderNo: 'SHOPIFY-88213',
        warehouseCode: 'US-NJ-02',
        salesPlatform: 'Shopify',
        status: '新建',
        trackingNo: '',
        carrier: '',
        createTime: '2026-09-10 15:40',
      },
      {
        orderNo: 'OB20260911005',
        customerOrderNo: 'AMZ-3391-2255',
        warehouseCode: 'US-LAX-01',
        salesPlatform: 'Amazon',
        status: '已出库',
        trackingNo: '9405511899561234567892',
        carrier: 'USPS',
        createTime: '2026-09-11 07:55',
      },
    ],
  },

  inventory: {
    list: [
      { sku: 'SKU-0001', productName: '无线蓝牙耳机', warehouseCode: 'US-LAX-01', availableQty: 1240, lockedQty: 30 },
      { sku: 'SKU-0003', productName: '便携充电宝 10000mAh', warehouseCode: 'US-NJ-02', availableQty: 88, lockedQty: 12 },
    ],
  },
};
