import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_EN_US_LOCALE_TEXT,
  GRID_ZH_CN_LOCALE_TEXT,
  resolveLocaleText,
} from './localeText';

test('resolveLocaleText returns zh-CN defaults when no override is supplied', () => {
  const locale = resolveLocaleText();
  assert.equal(locale.toolbarColumns, '列设置');
  assert.equal(locale.toolbarFilters, '筛选');
  assert.equal(locale.MuiTablePagination.labelRowsPerPage, '每页行数:');
  assert.equal(
    locale.MuiTablePagination.labelDisplayedRows({ from: 1, to: 10, count: 64 }),
    '第 1-10 条，共 64 条',
  );
  assert.equal(
    locale.MuiTablePagination.labelDisplayedRows({ from: 0, to: 0, count: 0 }),
    '0 条记录',
  );
});

test('GRID_EN_US_LOCALE_TEXT provides complete English strings and singular/plural formatting', () => {
  const locale = resolveLocaleText(GRID_EN_US_LOCALE_TEXT);
  assert.equal(locale.toolbarColumns, 'Columns');
  assert.equal(locale.toolbarExportExcel, 'Export to Excel (.xlsx)');
  assert.equal(locale.footerRowSelected(1), '1 row selected');
  assert.equal(locale.footerRowSelected(5), '5 rows selected');
  assert.equal(locale.footerLoadedRows(50, 240), 'Loaded 50 of 240 rows');
  assert.equal(
    locale.MuiTablePagination.labelDisplayedRows({ from: 11, to: 20, count: 240 }),
    '11–20 of 240',
  );
});

test('resolveLocaleText deep-merges MuiTablePagination and filterOperatorLabels without clobbering siblings', () => {
  const locale = resolveLocaleText({
    toolbarColumns: 'Custom Cols',
    MuiTablePagination: {
      labelRowsPerPage: 'Per page:',
    },
    filterOperatorLabels: {
      contains: 'matches',
    },
  });
  assert.equal(locale.toolbarColumns, 'Custom Cols');
  assert.equal(locale.toolbarFilters, GRID_ZH_CN_LOCALE_TEXT.toolbarFilters);
  assert.equal(locale.MuiTablePagination.labelRowsPerPage, 'Per page:');
  assert.equal(locale.filterOperatorLabels.contains, 'matches');
  assert.equal(locale.filterOperatorLabels.equals, '等于');
  assert.equal(GRID_EN_US_LOCALE_TEXT.filterOperatorLabels.contains, 'contains');
  assert.equal(
    locale.MuiTablePagination.labelDisplayedRows({ from: 1, to: 5, count: 12 }),
    '第 1-5 条，共 12 条',
  );
});
