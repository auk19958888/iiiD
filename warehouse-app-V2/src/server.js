// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const XlwmsClient = require('./xlwmsClient');
const mockData = require('./mockData');
const { normalizeInboundList, normalizeOutboundList } = require('./fieldMap');

const app = express();
app.use(express.json());

// ---------- 简单密码保护 ----------
// 部署到公网后，任何人拿到网址都能访问，所以加一层基础密码保护。
// 在 .env 里设置 APP_PASSWORD，访问时用任意用户名 + 这个密码登录（浏览器会弹出登录框）。
// 不设置 APP_PASSWORD 的话就不启用保护（本地开发用，不建议线上这样）。
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
  return client.getWarehouseList({});
}));

// ---------- 产品 ----------
app.get('/api/products', handle(async (req) => {
  if (DEMO_MODE) return mockData.products;
  return client.getProductPage({ pageNo: 1, pageSize: 50 });
}));

app.post('/api/products', handle(async (req) => {
  if (DEMO_MODE) {
    const newProduct = { ...req.body, id: Date.now() };
    mockData.products.list.unshift(newProduct);
    return newProduct;
  }
  return client.batchCreateProduct([req.body]);
}));

// ---------- 入库单：上架状态 / 时间 / 收货数量 ----------
app.get('/api/inbound', handle(async () => {
  if (DEMO_MODE) return mockData.inboundOrders;
  const raw = await client.getInboundOrderPage({ pageNo: 1, pageSize: 50 });
  // 真实接口返回的分页结构可能是 raw.data.list 或 raw.list，两种都兼容一下
  const rawList = raw?.data?.list || raw?.list || raw?.data || [];
  return { list: normalizeInboundList(rawList) };
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
  return client.createInboundOrder([req.body]);
}));

// ---------- 出库单：客户订单 + 物流单号 ----------
app.get('/api/outbound', handle(async () => {
  if (DEMO_MODE) return mockData.outboundOrders;
  const raw = await client.getOutboundOrderPage({ pageNo: 1, pageSize: 50 });
  const rawList = raw?.data?.list || raw?.list || raw?.data || [];
  return { list: normalizeOutboundList(rawList) };
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
  return client.createOutboundOrder([req.body]);
}));

// ---------- 库存 ----------
app.get('/api/inventory', handle(async () => {
  if (DEMO_MODE) return mockData.inventory;
  return client.getInventoryPage({ pageNo: 1, pageSize: 50 });
}));

app.get('/api/mode', (req, res) => {
  res.json({ demoMode: DEMO_MODE });
});


// OMS 调试：查看真实库存接口返回结构
app.get('/api/debug/inventory', handle(async () => {
  if (DEMO_MODE) return mockData.inventory;
  return client.getInventoryPage({ pageNo: 1, pageSize: 10 });
}));

const port = PORT || 3000;
app.listen(port, () => {
  console.log(`仓库管理程序已启动: http://localhost:${port}`);
});
