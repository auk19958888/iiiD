// xlwmsClient.js
// 封装对 OMS OpenAPI 的调用。
//
// ⚠️ 路径核对状态说明：
// - 「已确认」：直接来自你给的文档页面截图/内容，路径是准的。
// - 「推测」：文档侧边栏只给了页面 slug（比如 getparceloutboundordersusingpost），
//   没有直接告诉我真实请求路径，是我按同一模块内已确认路径的命名规律猜的。
//   调用前请打开对应文档页面确认一下 URL，不对的话告诉我，改一行就行。

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
   * 通用调用方法
   * @param {string} path 接口路径，如 /openapi/v1/outboundOrder/create
   * @param {object|array} data 业务参数（文档里的 data 字段）
   */
  async callApi(path, data) {
    const reqTime = String(Math.floor(Date.now() / 1000));
    const signParams = { appKey: this.appKey, reqTime, data };
    const sign = generateSign(path, signParams, this.appSecret);

    // OMS authcode 通常作为请求参数传递。
    // 这里同时保留 sign，方便兼容不同版本接口。
    const authcode = sign;
    const body = { appKey: this.appKey, reqTime, data, sign };

    try {
      const resp = await axios.post(`${this.baseUrl}${path}?authcode=${encodeURIComponent(authcode)}`, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return resp.data;
    } catch (err) {
      if (err.response) {
        // 服务器有响应但是报错了（比如签名错误、参数错误）
        const e = new Error(
          `OMS接口报错 [${path}]: ${err.response.status} ${JSON.stringify(err.response.data)}`
        );
        e.status = err.response.status;
        e.data = err.response.data;
        throw e;
      }
      throw new Error(`调用OMS接口失败 [${path}]: ${err.message}`);
    }
  }

  // ---------- 仓库信息（路径：推测） ----------
  getWarehouseList(params = {}) {
    return this.callApi('/openapi/v1/warehouse/list', params);
  }

  // ---------- 产品（路径：推测） ----------
  getProductPage(params = {}) {
    // params 建议包含: pageNo, pageSize, 可选筛选条件
    return this.callApi('/openapi/v1/product/pagelist', params);
  }

  batchCreateProduct(products) {
    // products: 数组，每个元素是一个产品对象
    return this.callApi('/openapi/v1/product/batchCreate', products);
  }

  // ---------- 入库单（路径：推测，命名参照已确认的出库单接口） ----------
  createInboundOrder(orders) {
    return this.callApi('/openapi/v1/inboundOrder/create', orders);
  }

  getInboundOrderPage(params = {}) {
    return this.callApi('/openapi/v1/inboundOrder/page', params);
  }

  getInboundOrderDetail(params) {
    return this.callApi('/openapi/v1/inboundOrder/detail', params);
  }

  // ---------- 出库单（小包）（创建接口路径：已确认；其余：推测） ----------
  createOutboundOrder(orders) {
    // ✅ 已确认：https://api.xlwms.com/openapi/v1/outboundOrder/create
    // orders: 数组，单次最大100单
    return this.callApi('/openapi/v1/outboundOrder/create', orders);
  }

  getOutboundOrderPage(params = {}) {
    return this.callApi('/openapi/v1/outboundOrder/pageList', params);
  }

  getOutboundOrderDetail(params) {
    return this.callApi('/openapi/v1/outboundOrder/detail', params);
  }

  // ---------- 库存（路径：推测，来自 slug "post_v1-integratedinventory-pageopen"） ----------
  getInventoryPage(params = {}) {
    return this.callApi('/openapi/v1/integratedInventory/pageOpen', params);
  }
}

module.exports = XlwmsClient;
