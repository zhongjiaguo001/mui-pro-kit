export type OrderStatus = 'settled' | 'processing' | 'pending' | 'overdue';
export type OrderPriority = 'high' | 'medium' | 'low';

export interface EnterpriseOrder extends Record<string, unknown> {
  id: string;
  orderNo: string;
  customer: string;
  industry: string;
  region: string;
  status: OrderStatus;
  amount: number;
  collectionRate: number;
  priority: OrderPriority;
  owner: string;
  approved: boolean;
  createdAt: string;
  remark: string;
}

const CUSTOMERS: Array<{ name: string; industry: string }> = [
  { name: '星河智造科技集团', industry: '智能制造' },
  { name: '华东云网数据股份', industry: '云计算服务' },
  { name: '新锐医药研发中心', industry: '生物医药' },
  { name: '远景精密传感设备', industry: '工业硬件' },
  { name: '启明数字供应链', industry: '物流与供应链' },
  { name: '鼎盛新能源储能', industry: '新能源' },
  { name: '海川金融信息技术', industry: '金融科技' },
  { name: '博雅半导体材料', industry: '半导体' },
  { name: '辰光自动化装备', industry: '智能制造' },
  { name: '青云企业协作软件', industry: '企业软件' },
  { name: '天枢卫星通信科技', industry: '通信设备' },
  { name: '朗润冷链物流网络', industry: '物流与供应链' },
  { name: '锦程智能汽车电子', industry: '汽车电子' },
  { name: '汇智医疗影像系统', industry: '医疗器械' },
  { name: '中科光学检测仪器', industry: '工业硬件' },
  { name: '卓远跨境支付科技', industry: '金融科技' },
];

const REGIONS = ['华东区', '华北区', '华南区', '西南区', '华中区'];
const OWNERS = [
  '林致远',
  '周明哲',
  '陈思语',
  '苏婉清',
  '顾承泽',
  '陆嘉豪',
  '沈知行',
  '许安然',
];
const STATUSES: OrderStatus[] = ['settled', 'processing', 'pending', 'overdue'];
const PRIORITIES: OrderPriority[] = ['high', 'medium', 'low'];
const REMARKS = [
  '年度框架协议首期结算，含华东区域云原生集群上线验收单与季度对账明细',
  '需财务复核增值税专票',
  '定制化私有部署交付中，已完成主备容灾节点联调并等待安全等保三级复测归档',
  '已签署验收确认单',
  '二期扩容采购增补项（含 3 年 7×24 现场驻场运维服务与 SLA 保障条款）',
  '',
  '跨区联合交付项目',
  '待客户法务终审',
];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createInitialEnterpriseOrders(count = 64): EnterpriseOrder[] {
  const rand = seededRandom(20261118);
  const rows: EnterpriseOrder[] = [];

  for (let i = 0; i < count; i += 1) {
    const customerEntry = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];
    const region = REGIONS[Math.floor(rand() * REGIONS.length)];
    const owner = OWNERS[Math.floor(rand() * OWNERS.length)];
    const statusRoll = rand();
    const status: OrderStatus =
      statusRoll < 0.42
        ? 'settled'
        : statusRoll < 0.72
          ? 'processing'
          : statusRoll < 0.89
            ? 'pending'
            : 'overdue';

    const priority: OrderPriority = PRIORITIES[Math.floor(rand() * PRIORITIES.length)];
    const amount = Math.round((18000 + rand() * 480000) / 500) * 500;
    const collectionRate =
      status === 'settled'
        ? 100
        : status === 'processing'
          ? Math.round(35 + rand() * 55)
          : status === 'pending'
            ? Math.round(rand() * 20)
            : Math.round(10 + rand() * 40);

    const month = 6 + Math.floor(rand() * 6); // 06..11
    const day = 1 + Math.floor(rand() * 27);
    const createdAt = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const approved = status === 'settled' || (status === 'processing' && rand() > 0.25);
    const remark = REMARKS[Math.floor(rand() * REMARKS.length)];
    const seq = 1001 + i;

    rows.push({
      id: `ORD-${seq}`,
      orderNo: `SO-2026-${seq}`,
      customer: customerEntry.name,
      industry: customerEntry.industry,
      region,
      status,
      amount,
      collectionRate,
      priority,
      owner,
      approved,
      createdAt,
      remark,
    });
  }

  return rows;
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  settled: { label: '已结算', color: '#15803D' },
  processing: { label: '履行中', color: '#1D4ED8' },
  pending: { label: '待审核', color: '#B45309' },
  overdue: { label: '已逾期', color: '#B91C1C' },
};

export const ORDER_PRIORITY_META: Record<
  OrderPriority,
  { label: string; color: string }
> = {
  high: { label: '高优先', color: '#B91C1C' },
  medium: { label: '常规', color: '#334155' },
  low: { label: '低优先', color: '#64748B' },
};

export interface OrderLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function getOrderLineItems(order: EnterpriseOrder): OrderLineItem[] {
  const total = Math.max(0, Math.round(order.amount));
  const coreUnit = Math.round((total * 0.62) / 100) * 100;
  const deployUnit = Math.round((total * 0.24) / 100) * 100;
  const slaSubtotal = Math.max(0, total - coreUnit - deployUnit);

  return [
    {
      sku: `${order.id}-01`,
      name: `${order.industry}核心套件与企业授权`,
      quantity: 1,
      unitPrice: coreUnit,
      subtotal: coreUnit,
    },
    {
      sku: `${order.id}-02`,
      name: `${order.region}定制集成与现场部署服务`,
      quantity: 1,
      unitPrice: deployUnit,
      subtotal: deployUnit,
    },
    {
      sku: `${order.id}-03`,
      name: '年度 SLA 保障与专属技术支持',
      quantity: 1,
      unitPrice: slaSubtotal,
      subtotal: slaSubtotal,
    },
  ];
}
