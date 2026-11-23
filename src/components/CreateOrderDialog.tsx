import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import type {
  EnterpriseOrder,
  OrderPriority,
  OrderStatus,
} from '../data/enterpriseOrders';

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (order: EnterpriseOrder) => void;
  nextSequence: number;
}

export function CreateOrderDialog({
  open,
  onClose,
  onCreate,
  nextSequence,
}: CreateOrderDialogProps) {
  const [customer, setCustomer] = useState('');
  const [industry, setIndustry] = useState('智能制造');
  const [region, setRegion] = useState('华东区');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [priority, setPriority] = useState<OrderPriority>('medium');
  const [amount, setAmount] = useState('85000');
  const [owner, setOwner] = useState('林致远');
  const [approved, setApproved] = useState(false);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<{ customer?: string; amount?: string }>({});

  const resetForm = () => {
    setCustomer('');
    setIndustry('智能制造');
    setRegion('华东区');
    setStatus('pending');
    setPriority('medium');
    setAmount('85000');
    setOwner('林致远');
    setApproved(false);
    setRemark('');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { customer?: string; amount?: string } = {};

    if (!customer.trim()) {
      nextErrors.customer = '请输入客户名称';
    }
    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = '请输入大于 0 的有效金额';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const seq = nextSequence;
    const today = new Date().toISOString().slice(0, 10);
    onCreate({
      id: `ORD-${seq}`,
      orderNo: `SO-2026-${seq}`,
      customer: customer.trim(),
      industry,
      region,
      status,
      amount: parsedAmount,
      collectionRate: status === 'settled' ? 100 : status === 'processing' ? 50 : 0,
      priority,
      owner: owner.trim() || '林致远',
      approved,
      createdAt: today,
      remark: remark.trim(),
    });

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-order-dialog-title"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle
          id="create-order-dialog-title"
          sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#0F172A' }}
        >
          新增订单记录
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="客户名称"
            required
            fullWidth
            size="small"
            value={customer}
            onChange={(e) => {
              setCustomer(e.target.value);
              if (errors.customer) setErrors((p) => ({ ...p, customer: undefined }));
            }}
            error={Boolean(errors.customer)}
            helperText={errors.customer}
            placeholder="例如：明略智能科技股份有限公司"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="new-order-industry-label">所属行业</InputLabel>
              <Select
                labelId="new-order-industry-label"
                label="所属行业"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <MenuItem value="智能制造">智能制造</MenuItem>
                <MenuItem value="云计算服务">云计算服务</MenuItem>
                <MenuItem value="生物医药">生物医药</MenuItem>
                <MenuItem value="金融科技">金融科技</MenuItem>
                <MenuItem value="半导体">半导体</MenuItem>
                <MenuItem value="新能源">新能源</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="new-order-region-label">负责区域</InputLabel>
              <Select
                labelId="new-order-region-label"
                label="负责区域"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <MenuItem value="华东区">华东区</MenuItem>
                <MenuItem value="华北区">华北区</MenuItem>
                <MenuItem value="华南区">华南区</MenuItem>
                <MenuItem value="西南区">西南区</MenuItem>
                <MenuItem value="华中区">华中区</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="订单金额 (CNY)"
              required
              type="number"
              size="small"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
              }}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
            />

            <TextField
              label="负责人"
              size="small"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="new-order-status-label">订单状态</InputLabel>
              <Select
                labelId="new-order-status-label"
                label="订单状态"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                <MenuItem value="settled">已结算</MenuItem>
                <MenuItem value="processing">履行中</MenuItem>
                <MenuItem value="pending">待审核</MenuItem>
                <MenuItem value="overdue">已逾期</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="new-order-priority-label">优先级</InputLabel>
              <Select
                labelId="new-order-priority-label"
                label="优先级"
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
              >
                <MenuItem value="high">高优先</MenuItem>
                <MenuItem value="medium">常规</MenuItem>
                <MenuItem value="low">低优先</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="备注说明"
            size="small"
            fullWidth
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="可选，记录合同条款或交付备注"
          />

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
            }
            label="已完成内部审批"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCancel} color="inherit">
            取消
          </Button>
          <Button type="submit" variant="contained">
            确认新增
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
