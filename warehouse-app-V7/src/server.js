// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const XlwmsClient = require('./xlwmsClient');
const mockData = require('./mockData');
const {
  normalizeInboundList,
  normalizeOutboundList,
  normalizeWarehouseList,
  normalizeProductList,
  normalizeInventoryList,
} = require('./fieldMap');

const app = express();
// ---------- 调试签名 ----------
app.get('/api/debug/sign', (req, res) => {
  res.json({
    success: false,
    message: '请使用 POST 请求测试签名接口'
  });
});

app.use(express.json());

// ---------- 简单密码保护 ----------
const { APP_PASSWORD } = process.env;
if (APP_PASSWORD) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth) {
      const [, base64] = auth.split(' ');
      const [, pass] = Buffer.from(base64 || '', 'base64').toString().split(':');
      if (pass === APP_PASSWORD) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="warehouse-app"');
    res.status(401).send('需要密码才能访问');
  });
  console.log('🔒 已启用密码保护（APP_PASSWORD 已设置）');
} else {
  console.log('⚠️  未设置 APP_PASSWORD，当前无密码保护，任何人拿到网址都能访问，建议部署前设置。');
}

app.use(express.static(path.join(__dirname, '..', 'public')));

const { XLWMS_APP_KEY, XLWMS_APP_SECRET, XLWMS_BASE_URL, PORT } = process.env;
const DEMO_MODE = !XLWMS_APP_KEY || !XLWMS_APP_SECRET;

if (DEMO_MODE) {
  console.log('⚠️  未检测到 XLWMS_APP_KEY / XLWMS_APP_SECRET，当前以【演示模式】运行（假数据，不会真的调用OMS接口）。');
  console.log('   配置 .env 后重启，即可切换为真实调用。');
} else {
  console.log('✅ 已加载 appKey/appSecret，将真实调用 OMS 接口：', XLWMS_BASE_URL || 'https://api.xlwms.com');
}

const client = DEMO_MODE
  ? null
  : new XlwmsClient({
      appKey: XLWMS_APP_KEY,
      appSecret: XLWMS_APP_SECRET,
      baseUrl: XLWMS_BASE_URL,
    });

// 统一错误处理包装
function handle(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

// ---------- 仓库 ----------
app.get('/api/warehouses', handle(async () => {
  if (DEMO_MODE) return mockData.warehouses;
  // 该接口 data 直接是数组（无分页）
  const list = await client.getWarehouseList({});
  return { list: normalizeWarehouseList(list) };
}));

// ---------- 产品 ----------
app.get('/api/products', handle(async () => {
  if (DEMO_MODE) return mockData.products;
  const result = await client.getProductPage({ page: 1, pageSize: 50 });
  return { list: normalizeProductList(result?.records || []) };
}));

app.post('/api/products', handle(async (req) => {
  if (DEMO_MODE) {
    const newProduct = { ...req.body, id: Date.now() };
    mockData.products.list.unshift(newProduct);
    return newProduct;
  }
  // data 是数组，支持批量；这里单个创建就传一个元素的数组
  return client.batchCreateProduct([req.body]);
}));

// ---------- 入库单：上架状态 / 时间 / 收货数量 ----------
app.get('/api/inbound', handle(async () => {
  if (DEMO_MODE) return mockData.inboundOrders;
  const result = await client.getInboundOrderPage({ page: 1, pageSize: 50 });
  return { list: normalizeInboundList(result?.records || []) };
}));

app.post('/api/inbound', handle(async (req) => {
  if (DEMO_MODE) {
    const newOrder = {
      ...req.body,
      orderNo: 'IB' + Date.now(),
      status: '待入库',
      createTime: new Date().toISOString(),
    };
    mockData.inboundOrders.list.unshift(newOrder);
    return newOrder;
  }
  // ⚠️ 创建入库单的 data 是单个对象，不是数组
  return client.createInboundOrder(req.body);
}));

// ---------- 出库单：客户订单 + 物流单号 ----------
app.get('/api/outbound', handle(async () => {
  if (DEMO_MODE) return mockData.outboundOrders;
  const result = await client.getOutboundOrderPage({ page: 1, pageSize: 50 });
  return { list: normalizeOutboundList(result?.records || []) };
}));

app.post('/api/outbound', handle(async (req) => {
  if (DEMO_MODE) {
    const newOrder = {
      ...req.body,
      orderNo: 'OB' + Date.now(),
      status: '待出库',
      createTime: new Date().toISOString(),
    };
    mockData.outboundOrders.list.unshift(newOrder);
    return newOrder;
  }
  // data 是数组，支持批量最大100单；这里单个创建就传一个元素的数组
  return client.createOutboundOrder([req.body]);
}));

// ---------- 库存 ----------
app.get('/api/inventory', handle(async () => {
  if (DEMO_MODE) return mockData.inventory;
  const result = await client.getInventoryPage({ page: 1, pageSize: 50 });
  return { list: normalizeInventoryList(result?.records || []) };
}));

app.get('/api/mode', (req, res) => {
  res.json({ demoMode: DEMO_MODE });
});

// OMS 调试：查看真实库存接口原始返回结构（不做字段映射，方便排查）
app.get('/api/debug/inventory', handle(async () => {
  if (DEMO_MODE) return mockData.inventory;
  return client.getInventoryPage({ page: 1, pageSize: 10 });
}));

const port = PORT || 3000;
app.listen(port, () => {
  console.log(`仓库管理程序已启动: http://localhost:${port}`);
});
