import React from 'react';
import type { RefObject } from 'react';
import { Box, Button, Divider, Paper, Typography } from '@mui/material';
import type { GridApiPro, GridStateSnapshot } from './DataGridPro';
import type { EnterpriseOrder } from '../data/enterpriseOrders';

export interface GridEventLogEntry {
  id: number;
  event: string;
  summary: string;
  timestamp: string;
}

interface StateInspectorProps {
  snapshot: GridStateSnapshot | null;
  apiRef?: RefObject<GridApiPro<EnterpriseOrder> | null>;
  recentEvents?: GridEventLogEntry[];
  onCommandFeedback?: (message: string) => void;
}

export function StateInspector({
  snapshot,
  apiRef,
  recentEvents = [],
  onCommandFeedback,
}: StateInspectorProps) {
  if (!snapshot) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#64748B' }}>
          暂未采集到表格状态，请先返回基础演示视图交互表格。
        </Typography>
      </Paper>
    );
  }

  const runApiCommand = (label: string, fn: (api: GridApiPro<EnterpriseOrder>) => void) => {
    const api = apiRef?.current;
    if (!api) return;
    fn(api);
    onCommandFeedback?.(label);
  };

  const sections: Array<{ title: string; keyName: string; data: unknown }> = [
    {
      title: '排序模型',
      keyName: 'sorting.sortModel',
      data: snapshot.sorting,
    },
    {
      title: '多条件筛选模型',
      keyName: 'filter.filterModel',
      data: snapshot.filterModel,
    },
    {
      title: '固定列配置',
      keyName: 'pinnedColumns',
      data: snapshot.pinnedColumns,
    },
    {
      title: '列可见性与列序模型',
      keyName: 'columns.visibility & orderedFields',
      data: {
        columnVisibilityModel: snapshot.columnVisibilityModel,
        orderedFields: snapshot.columnOrder,
      },
    },
    {
      title: '列宽覆盖记录',
      keyName: 'columns.dimensions',
      data: snapshot.columnSizing,
    },
    {
      title: '行分组、聚合与透视模型',
      keyName: 'rowGrouping & aggregation & pivot',
      data: {
        rowGroupingModel: snapshot.rowGroupingModel,
        aggregationModel: snapshot.aggregationModel,
        pivotMode: Boolean(snapshot.pivotMode),
        ...(snapshot.pivotModel ? { pivotModel: snapshot.pivotModel } : {}),
      },
    },
    {
      title: '分页、行选择与主从展开',
      keyName: 'pagination & selection & detailPanel',
      data: {
        paginationModel: snapshot.paginationModel,
        density: snapshot.density,
        filteredRowCount: snapshot.filteredRowCount,
        totalRowCount: snapshot.totalRowCount,
        selectedRowIds: snapshot.rowSelectionModel,
        detailPanelExpandedRowIds: snapshot.detailPanelExpandedRowIds,
      },
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>
          实时 GridState 状态检视与 apiRef 命令台
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#475569', mt: 0.5 }}>
          以下状态由 TanStack Table 内部状态树实时映射为与 MUI X DataGrid Pro 同构的声明式模型，可直接通过 apiRef 命令式接口操控并监听 subscribeEvent 事件流。
        </Typography>
      </Box>

      {apiRef && (
        <Paper
          variant="outlined"
          data-testid="apiref-command-console"
          sx={{
            p: 2,
            bgcolor: '#FFFFFF',
            borderColor: '#E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
              apiRef 命令式控制
            </Typography>
            <Typography
              component="code"
              className="font-mono-tabular"
              sx={{ fontSize: '0.75rem', color: '#1976D2' }}
            >
              useGridApiRef() · subscribeEvent / publishEvent
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已执行 apiRef.setSortModel(amount desc)', (api) => {
                  api.setSortModel([{ field: 'amount', sort: 'desc' }]);
                })
              }
            >
              按金额降序 (setSortModel)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已执行 apiRef.setFilterModel(priority=high)', (api) => {
                  api.setFilterModel({
                    items: [
                      {
                        id: 'api_high_priority',
                        field: 'priority',
                        operator: 'is',
                        value: 'high',
                      },
                    ],
                    logicOperator: 'and',
                    quickFilterValues: [],
                  });
                })
              }
            >
              筛选高优先 (setFilterModel)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已执行 apiRef.setRowSelectionModel(前3行)', (api) => {
                  const top3 = api.getAllRowIds().slice(0, 3);
                  api.setRowSelectionModel(top3);
                })
              }
            >
              选中前 3 行 (setRowSelectionModel)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已执行 apiRef.setDensity(compact)', (api) => {
                  api.setDensity(snapshot.density === 'compact' ? 'standard' : 'compact');
                })
              }
            >
              切换紧凑密度 (setDensity)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已执行 apiRef.setQuickFilterValues(["华东"])', (api) => {
                  api.setQuickFilterValues(['华东']);
                })
              }
            >
              快搜「华东」(setQuickFilterValues)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已触发 apiRef.exportDataAsCsv()', (api) => {
                  api.exportDataAsCsv({ fileName: 'orders-apiref-export' });
                })
              }
            >
              导出 CSV (exportDataAsCsv)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                runApiCommand('已触发 apiRef.exportDataAsExcel()', (api) => {
                  api.exportDataAsExcel({ fileName: 'orders-apiref-export' });
                })
              }
            >
              导出 Excel (exportDataAsExcel)
            </Button>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() =>
                runApiCommand('已通过 apiRef 重置排序、筛选、选择与密度', (api) => {
                  api.setSortModel([]);
                  api.setFilterModel({ items: [], logicOperator: 'and', quickFilterValues: [] });
                  api.setRowSelectionModel([]);
                  api.setDensity('standard');
                  api.setPage(0);
                  api.hidePreferences();
                  api.setChartsPanelOpen(false);
                })
              }
              sx={{ color: '#475569' }}
            >
              重置全部状态
            </Button>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
              最近事件流 (subscribeEvent)
            </Typography>
            {recentEvents.length === 0 ? (
              <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                点击上方命令或在表格中操作排序、筛选、勾选行，此处将实时记录触发的事件。
              </Typography>
            ) : (
              <Box
                data-testid="apiref-event-log"
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
              >
                {recentEvents.map((item) => (
                  <Box
                    key={item.id}
                    className="font-mono-tabular"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      fontSize: '0.75rem',
                      px: 1,
                      py: 0.45,
                      borderRadius: '4px',
                      bgcolor: '#F8FAFC',
                      color: '#334155',
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontSize: '0.72rem', color: '#64748B', flexShrink: 0 }}
                    >
                      {item.timestamp}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1976D2', flexShrink: 0 }}
                    >
                      {item.event}
                    </Typography>
                    <Typography
                      component="span"
                      noWrap
                      sx={{ fontSize: '0.75rem', color: '#334155', minWidth: 0 }}
                    >
                      {item.summary}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        {sections.map((section) => (
          <Paper
            key={section.keyName}
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: '#FFFFFF',
              borderColor: '#E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                {section.title}
              </Typography>
              <Typography
                component="code"
                className="font-mono-tabular"
                sx={{ fontSize: '0.75rem', color: '#1976D2' }}
              >
                {section.keyName}
              </Typography>
            </Box>

            <Box
              component="pre"
              className="font-mono-tabular"
              sx={{
                m: 0,
                p: 1.5,
                borderRadius: '6px',
                bgcolor: '#F8FAFC',
                border: '1px solid #F1F5F9',
                fontSize: '0.75rem',
                lineHeight: 1.6,
                color: '#1E293B',
                overflowX: 'auto',
                maxHeight: 220,
              }}
            >
              {JSON.stringify(section.data, null, 2)}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
