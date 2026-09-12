// sign.js
// ⚠️ 这个文件的算法是"最佳推测"，不是从你们 OMS 官方文档里直接抄来的。
// 我只找到了同公司另一个 API 文档站（智能设备接口）公开的加签算法，
// OMS（api.xlwms.com/openapi/...）的官方签名说明需要登录后台才能看到。
//
// 推测规则（来自同公司同类接口）：
//   1. 取出 appKey / timestamp / data 等参数，按参数名字典序排序（data 内部不用排序）
//   2. 按 "key1value1key2value2..." 拼接成字符串（value 是 JSON.stringify 后的结果）
//   3. baseString = appSecret + path + 拼接结果 + appSecret
//   4. sign = HMAC_SHA256(key=appSecret, message=baseString) 的十六进制小写
//
// 如果调用后一直报"签名错误/sign不匹配"，把 OMS 后台"开发指南-签名规则"那页发给我，
// 我照实际规则改这一个文件就行，其它代码不用动。

const crypto = require('crypto');

/**
 * 生成签名
 * @param {string} path - 接口路径，例如 /openapi/v1/outboundOrder/create
 * @param {object} params - 除 sign 外的所有参数，通常是 { appKey, reqTime/timestamp, data }
 * @param {string} appSecret
 * @returns {string} 十六进制签名
 */
function generateSign(path, params, appSecret) {
  const sortedKeys = Object.keys(params).sort();

  const concatenated = sortedKeys
    .map((key) => {
      const value = params[key];
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      return `${key}${valueStr}`;
    })
    .join('');

  const baseString = `${appSecret}${path}${concatenated}${appSecret}`;

  return crypto.createHmac('sha256', appSecret).update(baseString, 'utf8').digest('hex');
}

/**
 * 调试用：打印出签名过程的每一步，方便你和真实文档里的示例对比核对。
 */
function debugSign(path, params, appSecret) {
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys
    .map((key) => {
      const value = params[key];
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      return `${key}${valueStr}`;
    })
    .join('');
  const baseString = `${appSecret}${path}${concatenated}${appSecret}`;
  const sign = crypto.createHmac('sha256', appSecret).update(baseString, 'utf8').digest('hex');

  console.log('--- 签名调试信息 ---');
  console.log('1. 排序后的 key：', sortedKeys);
  console.log('2. 拼接字符串：', concatenated);
  console.log('3. baseString：', baseString);
  console.log('4. sign：', sign);
  console.log('--------------------');

  return sign;
}

module.exports = { generateSign, debugSign };
