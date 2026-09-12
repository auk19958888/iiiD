// sign.js
// 按 OMS 官方文档《加签算法》实现（https://apidoc-oms.xlwms.com/docs/开发验签工具）
//
// 步骤：
// 1. 把 data 里的所有字段，按字典序（不分大小写）升序排序（递归处理嵌套对象/数组）
// 2. 把 appKey、排序好的 data（JSON字符串）、reqTime 这三个参数按字典序排序
//    （结果固定是 appKey → data → reqTime），只拼接这三者的"值"（不拼 key 名）
// 3. HMAC_SHA256(key = appSecret, message = 上面拼接的字符串) → 十六进制小写 = authcode

const crypto = require('crypto');

/**
 * 递归地把对象的 key 按字典序（不分大小写）升序排序，数组内部元素也递归处理。
 */
function sortDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    Object.keys(value)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .forEach((key) => {
        sorted[key] = sortDeep(value[key]);
      });
    return sorted;
  }
  return value;
}

/**
 * 生成签名（authcode）
 * @param {object} params - { appKey, data, reqTime }
 * @param {string} appSecret
 * @returns {string} 十六进制签名
 */
function generateSign({ appKey, data, reqTime, path = '' }, appSecret) {
  const sortedData = sortDeep(data);
  const dataStr = JSON.stringify(sortedData);

  const parts = { appKey, data: dataStr, reqTime };
  const sortedKeys = Object.keys(parts).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const concatenated = sortedKeys.map((key) => parts[key]).join('');

  const message = path
    ? appSecret + path + concatenated + appSecret
    : concatenated;

  return crypto.createHmac('sha256', appSecret).update(message, 'utf8').digest('hex');
}

/**
 * 调试用：打印签名过程每一步，方便和 OMS 后台"开发验签工具"核对。
 */
function debugSign({ appKey, data, reqTime, path = '' }, appSecret) {
  const sortedData = sortDeep(data);
  const dataStr = JSON.stringify(sortedData);
  const parts = { appKey, data: dataStr, reqTime };
  const sortedKeys = Object.keys(parts).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const concatenated = sortedKeys.map((key) => parts[key]).join('');
  const sign = crypto.createHmac('sha256', appSecret).update(concatenated, 'utf8').digest('hex');

  console.log('--- 签名调试信息 ---');
  console.log('1. 排序后的 data JSON：', dataStr);
  console.log('2. 拼接字符串（待加密明文）：', concatenated);
  console.log('3. authcode：', sign);
  console.log('--------------------');

  return sign;
}

module.exports = { generateSign, debugSign };
