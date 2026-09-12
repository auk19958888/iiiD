// fieldMap.js
// ⚠️ 这是唯一需要在拿到真实接口返回结构后修改的文件。
//
// 领星OMS真实接口返回的字段名我还没有确认（需要登录后台才能看完整响应示例），
// 下面每一项右边的字符串是"猜测的真实字段名"，等你把接口返回的原始 JSON
// 发给我（或者你自己对照文档改），只改这一个文件，前端和其他逻辑都不用动。
//
// 用法：把 OMS 原始返回的一条记录传进 normalizeInbound / normalizeOutbound，
// 会返回一个字段名统一、前端认识的对象。

const INBOUND_FIELD_MAP = {
  inboundNo: 'inboundNo',       // 入库单号（也可能叫 orderNo / inStoreNo）
  warehouseCode: 'warehouseCode',
  putawayStatus: 'shelfStatus', // 上架状态（也可能叫 putawayStatus / status）
  planQty: 'planQty',           // 计划数量
  receiveQty: 'receiveQty',     // 收货数量（也可能叫 actualReceiveQty / arrivalQty）
  putawayQty: 'shelfQty',       // 已上架数量
  receiveTime: 'receiveTime',   // 收货时间
  putawayTime: 'shelfTime',     // 上架时间
  createTime: 'createTime',
};

const OUTBOUND_FIELD_MAP = {
  orderNo: 'outboundOrderNo',       // 出库单号（文档里创建接口没直接给字段名，按惯例猜的）
  customerOrderNo: 'customerOrderNo', // 客户/店铺原始订单号（也可能叫 refNo / platformOrderNo）
  warehouseCode: 'warehouseCode',
  status: 'status',
  trackingNo: 'trackingNo',         // 物流跟踪单号（也可能叫 trackNo / carrierTrackingNo / logisticsNo）
  carrier: 'carrier',               // 承运商（也可能叫 logisticsChannel / shippingMethod）
  sku: 'sku',
  quantity: 'quantity',
  createTime: 'createTime',
};

function mapFields(raw, fieldMap) {
  const out = {};
  for (const [ourKey, theirKey] of Object.entries(fieldMap)) {
    out[ourKey] = raw[theirKey] !== undefined ? raw[theirKey] : '';
  }
  return out;
}

function normalizeInboundList(rawList) {
  return (rawList || []).map((item) => mapFields(item, INBOUND_FIELD_MAP));
}

function normalizeOutboundList(rawList) {
  return (rawList || []).map((item) => mapFields(item, OUTBOUND_FIELD_MAP));
}

module.exports = { normalizeInboundList, normalizeOutboundList, INBOUND_FIELD_MAP, OUTBOUND_FIELD_MAP };
