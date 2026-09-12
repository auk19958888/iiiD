const PAGES = {
  outbound: {
    title: '客户订单（出库单）',
    subtitle: '含客户原始订单号与物流跟踪单号',
    endpoint: '/api/outbound',
    columns: [
      { key: 'customerOrderNo', label: '客户订单号', mono: true },
      { key: 'orderNo', label: '出库单号', mono: true },
      { key: 'warehouseCode', label: '仓库' },
      { key: 'status', label: '状态', badge: true },
      { key: 'trackingNo', label: '物流单号', mono: true, empty: '—' },
      { key: 'carrier', label: '承运商', empty: '—' },
      { key: 'sku', label: 'SKU', mono: true },
      { key: 'quantity', label: '数量' },
      { key: 'createTime', label: '创建时间' },
    ],
  },
  inbound: {
    title: '入库单',
    subtitle: '上架状态 / 收货数量 / 时间节点',
    endpoint: '/api/inbound',
    columns: [
      { key: 'inboundNo', label: '入库单号', mono: true },
      { key: 'warehouseCode', label: '仓库' },
      { key: 'putawayStatus', label: '上架状态', badge: true },
      { key: 'planQty', label: '计划数量' },
      { key: 'receiveQty', label: '收货数量' },
      { key: 'putawayQty', label: '已上架数量' },
      { key: 'receiveTime', label: '收货时间', empty: '未收货' },
      { key: 'putawayTime', label: '上架时间', empty: '未上架' },
      { key: 'createTime', label: '创建时间' },
    ],
  },
  warehouses: {
    title: '仓库',
    subtitle: '',
    endpoint: '/api/warehouses',
    columns: [
      { key: 'warehouseCode', label: '编码', mono: true },
      { key: 'warehouseName', label: '名称' },
      { key: 'country', label: '国家' },
      { key: 'address', label: '地址' },
    ],
  },
  products: {
    title: '产品',
    subtitle: '',
    endpoint: '/api/products',
    columns: [
      { key: 'sku', label: 'SKU', mono: true },
      { key: 'productName', label: '产品名称' },
      { key: 'weight', label: '重量' },
      { key: 'createTime', label: '创建时间' },
    ],
  },
  inventory: {
    title: '库存',
    subtitle: '',
    endpoint: '/api/inventory',
    columns: [
      { key: 'sku', label: 'SKU', mono: true },
      { key: 'productName', label: '产品名称' },
      { key: 'warehouseCode', label: '仓库' },
      { key: 'availableQty', label: '可用库存' },
      { key: 'lockedQty', label: '锁定库存' },
    ],
  },
};

const STATUS_BADGE_CLASS = {
  '已出库': 'ok', '已发货': 'ok', '已入库': 'ok', '已上架': 'ok',
  '待出库': 'pending', '待收货': 'pending', '部分上架': 'pending',
  '在途': 'transit', '收货中': 'transit',
};

let currentPage = 'outbound';

async function init() {
  const modeResp = await fetch('/api/mode').then((r) => r.json());
  if (modeResp.demoMode) {
    document.getElementById('modeLabel').textContent = '演示模式（假数据）';
    document.getElementById('demoBanner').style.display = 'block';
  } else {
    document.getElementById('modeLabel').textContent = '已对接真实接口';
  }

  document.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => switchPage(el.dataset.page));
  });

  loadPage(currentPage);
}

function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  loadPage(page);
}

async function loadPage(page) {
  const config = PAGES[page];
  document.getElementById('pageTitle').textContent = config.title;
  document.getElementById('pageSubtitle').textContent = config.subtitle;
  document.getElementById('tableContainer').innerHTML = '<div class="empty">加载中…</div>';

  try {
    const resp = await fetch(config.endpoint).then((r) => r.json());
    if (!resp.success) throw new Error(resp.message || '请求失败');
    const list = Array.isArray(resp.data)
      ? resp.data
      : (resp.data?.list || resp.data?.records || resp.data?.rows || []);
    renderTable(config, list);
  } catch (err) {
    document.getElementById('tableContainer').innerHTML =
      `<div class="empty">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

function renderTable(config, list) {
  const container = document.getElementById('tableContainer');
  if (!list.length) {
    container.innerHTML = '<div class="empty">暂无数据</div>';
    return;
  }

  const thead = `<thead><tr>${config.columns
    .map((c) => `<th>${c.label}</th>`)
    .join('')}</tr></thead>`;

  const rows = list
    .map((row) => {
      const cells = config.columns
        .map((c) => {
          const value = row[c.key];
          const display = value === '' || value === undefined || value === null
            ? (c.empty || '—')
            : value;
          if (c.badge) {
            const cls = STATUS_BADGE_CLASS[value] || 'pending';
            return `<td><span class="badge ${cls}">${escapeHtml(String(display))}</span></td>`;
          }
          const monoClass = c.mono ? 'mono' : '';
          return `<td class="${monoClass}">${escapeHtml(String(display))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  container.innerHTML = `<table>${thead}<tbody>${rows}</tbody></table>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
