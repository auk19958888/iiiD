// xlwmsClient.js
// 封装对 OMS OpenAPI 的调用。
// 所有路径均已对照官方文档 https://apidoc-oms.xlwms.com 的 OpenAPI 定义核实过。

const axios = require('axios');
const { generateSign } = require('./sign');

class XlwmsClient {
  constructor({ appKey, appSecret, baseUrl }) {
    if (!appKey || !appSecret) {
      throw new Error('缺少 appKey 或 appSecret，请检查 .env 文件');
    }
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.baseUrl = baseUrl || 'https://api.xlwms.com';
  }

  /**
   * 通用调用方法。
   * @param {string} path 接口路径，如 /openapi/v1/outboundOrder/create
   * @param {object|array} data 业务参数（文档里的 data 字段）
   * @returns {*} 直接返回 OMS 响应里的 data 字段（已经脱去 code/msg 信封）
   */
  async callApi(path, data) {
    const reqTime = String(Math.floor(Date.now() / 1000));
    const authcode = generateSign({ appKey: this.appKey, data, reqTime }, this.appSecret);

    // 官方文档：authcode 通过 GET 方式（query string）传递，其余参数通过 POST body 传递。
    const body = { appKey: this.appKey, data, reqTime };

    let resp;
    try {
      resp = await axios.post(`${this.baseUrl}${path}?authcode=${encodeURIComponent(authcode)}`, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
    } catch (err) {
      if (err.response) {
        const e = new Error(
          `OMS接口报错 [${path}]: HTTP ${err.response.status} ${JSON.stringify(err.response.data)}`
        );
        e.status = err.response.status;
        e.data = err.response.data;
        throw e;
      }
      throw new Error(`调用OMS接口失败 [${path}]: ${err.message}`);
    }

    const body2 = resp.data; // { code, msg, data }
    if (body2 && typeof body2.code !== 'undefined' && body2.code !== 200) {
      throw new Error(`OMS业务报错 [${path}]: code=${body2.code} msg=${body2.msg || '无详细信息'}`);
    }
    return body2 ? body2.data : body2;
  }

  // ---------- 仓库信息 ----------
  // ✅ 已确认：POST /v1/warehouse/options
  getWarehouseList(params = {}) {
    return this.callApi('/openapi/v1/warehouse/options', params);
  }

  // ---------- 产品 ----------
  // ✅ 已确认：POST /v1/product/pagelist，data 需要 { page, pageSize, ... }
  getProductPage(params = {}) {
    return this.callApi('/openapi/v1/product/pagelist', params);
  }

  // ✅ 已确认：POST /v1/product/batchCreate，data 是数组
  batchCreateProduct(products) {
    return this.callApi('/openapi/v1/product/batchCreate', products);
  }

  // ---------- 入库单 ----------
  // ✅ 已确认：POST /v1/inboundOrder/create
  // ⚠️ data 是【单个对象】，不是数组！一次调用只能创建一个入库单。
  createInboundOrder(order) {
    return this.callApi('/openapi/v1/inboundOrder/create', order);
  }

  // ✅ 已确认：POST /v1/inboundOrder/pageList（之前代码里写成了 /page，是错的）
  getInboundOrderPage(params = {}) {
    return this.callApi('/openapi/v1/inboundOrder/pageList', params);
  }

  // ✅ 已确认：POST /v1/inboundOrder/detail，data: { inboundOrderNoList: [...] }
  getInboundOrderDetail(params) {
    return this.callApi('/openapi/v1/inboundOrder/detail', params);
  }

  // ---------- 出库单（小包） ----------
  // ✅ 已确认：POST /v1/outboundOrder/create，data 是数组，单次最大100单
  createOutboundOrder(orders) {
    return this.callApi('/openapi/v1/outboundOrder/create', orders);
  }

  // ✅ 已确认：POST /v1/outboundOrder/pageList
  getOutboundOrderPage(params = {}) {
    return this.callApi('/openapi/v1/outboundOrder/pageList', params);
  }

  // ✅ 已确认：POST /v1/outboundOrder/detail
  getOutboundOrderDetail(params) {
    return this.callApi('/openapi/v1/outboundOrder/detail', params);
  }

  // ---------- 库存 ----------
  // ✅ 已确认：POST /v1/integratedInventory/pageOpen，data 需要 { page, pageSize, ... }
  getInventoryPage(params = {}) {
    return this.callApi('/openapi/v1/integratedInventory/pageOpen', params);
  }
}

module.exports = XlwmsClient;
