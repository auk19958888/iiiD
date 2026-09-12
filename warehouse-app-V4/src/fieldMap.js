// fieldMap.js
// 把 OMS 真实接口返回的字段，转换成前端页面认识的统一字段名。
// 字段名已对照 https://apidoc-oms.xlwms.com 官方 OpenAPI 定义核实过
// （分页查询入库单列表 / 分页查询小包出库单列表 / 仓库列表查询 / 综合库存 等接口）。

// 入库单状态: 0-新建；1-待入库；2-收货中；3-已收货；4-已上架；5-已取消；6-待审核；7-驳回
const INBOUND_STATUS_MAP = {
  0: '新建', 1: '待入库', 2: '收货中', 3: '已收货', 4: '已上架', 5: '已取消', 6: '待审核', 7: '驳回',
};

// 小包出库单状态: 0-新建；1-已取面单；2-仓库处理中；3-已出库；4-已取消；5-异常
const OUTBOUND_STATUS_MAP = {
  0: '新建', 1: '已取面单', 2: '仓库处理中', 3: '已出库', 4: '已取消', 5: '异常',
};

function normalizeInboundList(rawList) {
  return (rawList || []).map((item) => ({
    inboundNo: item.inboundOrderNo || '',
    warehouseCode: item.whCode || '',
    putawayStatus: INBOUND_STATUS_MAP[item.status] ?? String(item.status ?? ''),
    trackingNo: item.trackingNo || '',
    referOrderNo: item.referOrderNo || '',
    expectedDate: item.expectedDate || '',
    receiveTime: item.receivedEndTime || '',
    putawayTime: item.shelfEndTime || '',
    createTime: item.orderCreateTime || '',
  }));
}

function normalizeOutboundList(rawList) {
  return (rawList || []).map((item) => ({
    orderNo: item.outboundOrderNo || '',
    customerOrderNo: item.platformOrderNo || item.referOrderNo || item.thirdOrderNo || '',
    warehouseCode: item.whCode || '',
    status: OUTBOUND_STATUS_MAP[item.status] ?? String(item.status ?? ''),
    salesPlatform: item.salesPlatform || '',
    trackingNo: item.logisticsTrackNo || '',
    carrier: item.logisticsChannel || '',
    createTime: item.orderCreateTime || '',
  }));
}

function normalizeWarehouseList(rawList) {
  return (rawList || []).map((item) => ({
    warehouseCode: item.whCode || '',
    warehouseName: item.whNameCn || '',
    country: item.countryCode || '',
  }));
}

function normalizeProductList(rawList) {
  return (rawList || []).map((item) => ({
    sku: item.sku || '',
    productName: item.productName || '',
    weight: item.weight !== undefined && item.weight !== null ? `${item.weight}kg` : '',
  }));
}

function normalizeInventoryList(rawList) {
  return (rawList || []).map((item) => ({
    sku: item.sku || '',
    productName: item.productName || '',
    warehouseCode: item.whCode || '',
    availableQty: item.productStockDtl?.availableAmount ?? 0,
    lockedQty: item.productStockDtl?.lockAmount ?? 0,
  }));
}

module.exports = {
  normalizeInboundList,
  normalizeOutboundList,
  normalizeWarehouseList,
  normalizeProductList,
  normalizeInventoryList,
  INBOUND_STATUS_MAP,
  OUTBOUND_STATUS_MAP,
};
