import React from 'react';
import { GlobalStyles } from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';

/**
 * Computes O(1) CSS custom property tokens from the active MUI Theme.
 * Attached once on `.MuiDataGrid-root` so virtualized body rows & cells stay
 * pure DOM + static classes (zero per-cell Emotion runtime overhead) while
 * automatically adapting to host Light/Dark palettes and primary/error colors.
 */
export function buildDataGridThemeVars(theme: Theme): Record<string, string> {
  const isDark = theme.palette.mode === 'dark';
  return {
    '--DataGrid-containerBackground': theme.palette.background.paper,
    '--DataGrid-pinnedBackground': theme.palette.background.paper,
    '--DataGrid-rowBorderColor': theme.palette.divider,
    '--DataGrid-cellOffsetMultiplier': '2',
    '--DataGrid-rowHoverBackground': theme.palette.action.hover,
    '--DataGrid-rowSelectedBackground': alpha(
      theme.palette.primary.main,
      isDark ? 0.16 : 0.08,
    ),
    '--DataGrid-rowSelectedHoverBackground': alpha(
      theme.palette.primary.main,
      isDark ? 0.24 : 0.12,
    ),
    '--DataGrid-focusOutlineColor': theme.palette.primary.main,
    '--DataGrid-focusOutlineDarkColor': theme.palette.primary.dark,
    '--DataGrid-focusShadowColor': alpha(
      theme.palette.primary.main,
      isDark ? 0.32 : 0.16,
    ),
    '--DataGrid-editingRowBg': theme.palette.background.paper,
    '--DataGrid-editingRowBorderColor': alpha(
      theme.palette.primary.main,
      isDark ? 0.36 : 0.22,
    ),
    '--DataGrid-errorColor': theme.palette.error.main,
    '--DataGrid-errorShadowColor': alpha(
      theme.palette.error.main,
      isDark ? 0.42 : 0.28,
    ),
    '--DataGrid-actionColor': theme.palette.text.secondary,
    '--DataGrid-disabledColor': theme.palette.text.disabled,
    '--DataGrid-checkboxHoverBg': alpha(
      theme.palette.primary.main,
      isDark ? 0.12 : 0.04,
    ),
    '--DataGrid-dragHoverBg': alpha(
      theme.palette.primary.main,
      isDark ? 0.14 : 0.06,
    ),
    '--DataGrid-scrollbarThumb': isDark
      ? 'rgba(255, 255, 255, 0.24)'
      : 'rgba(0, 0, 0, 0.2)',
    '--DataGrid-scrollbarThumbHover': isDark
      ? 'rgba(255, 255, 255, 0.4)'
      : 'rgba(0, 0, 0, 0.35)',
  };
}

/**
 * Module-level constant GlobalStyles element injected once via Emotion's
 * useInsertionEffect before first paint. Zero per-row/cell runtime cost and
 * requires no manual CSS import from host applications.
 */
export const DATA_GRID_STATIC_STYLES = (
  <GlobalStyles
    styles={{
      '.tabular-nums': {
        fontVariantNumeric: 'tabular-nums',
      },
      '.font-mono-tabular': {
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontVariantNumeric: 'tabular-nums',
      },
      '.MuiDataGrid-root': {
        '--DataGrid-containerBackground': '#ffffff',
        '--DataGrid-rowBorderColor': 'rgba(224, 224, 224, 1)',
        '--DataGrid-cellOffsetMultiplier': 2,
        '--DataGrid-pinnedBackground': '#ffffff',
        '--DataGrid-rowHoverBackground': 'rgba(0, 0, 0, 0.04)',
        '--DataGrid-rowSelectedBackground': 'rgba(25, 118, 210, 0.08)',
        '--DataGrid-rowSelectedHoverBackground': 'rgba(25, 118, 210, 0.12)',
        '--DataGrid-focusOutlineColor': '#1976d2',
      },
      '.MuiDataGrid-scrollShadow': {
        '--color': '0, 0, 0',
        '--opacity': 0.11,
        position: 'absolute',
        top: 0,
        bottom: '-1px',
        width: '12px',
        pointerEvents: 'none',
        transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '.MuiDataGrid-scrollShadow--left': {
        background:
          'linear-gradient(90deg, rgba(var(--color), var(--opacity)) 0%, rgba(var(--color), calc(var(--opacity) * 0.42)) 38%, rgba(var(--color), 0) 100%)',
      },
      '.MuiDataGrid-scrollShadow--right': {
        background:
          'linear-gradient(270deg, rgba(var(--color), var(--opacity)) 0%, rgba(var(--color), calc(var(--opacity) * 0.42)) 38%, rgba(var(--color), 0) 100%)',
      },
      '.datagrid-scroller::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '.datagrid-scroller::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '.datagrid-scroller::-webkit-scrollbar-thumb': {
        background: 'var(--DataGrid-scrollbarThumb, rgba(0, 0, 0, 0.2))',
        borderRadius: '4px',
      },
      '.datagrid-scroller::-webkit-scrollbar-thumb:hover': {
        background: 'var(--DataGrid-scrollbarThumbHover, rgba(0, 0, 0, 0.35))',
      },
      '.MuiDataGrid-pinnedRows--top': {
        boxShadow:
          '0 2px 5px -1px rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.08)',
      },
      '.MuiDataGrid-pinnedRows--bottom': {
        boxShadow:
          '0 -2px 5px -1px rgba(0, 0, 0, 0.12), 0 -1px 2px 0 rgba(0, 0, 0, 0.08)',
      },
      '.MuiDataGrid-row': {
        position: 'relative',
        display: 'flex',
        width: '100%',
        borderBottom: '1px solid var(--DataGrid-rowBorderColor, #e0e0e0)',
        boxSizing: 'border-box',
        contain: 'style',
      },
      '.MuiDataGrid-row:hover': {
        backgroundColor:
          'var(--row-hover-bg, var(--DataGrid-rowHoverBackground, rgba(0, 0, 0, 0.04))) !important',
      },
      '.MuiDataGrid-row:hover .MuiDataGrid-cell--pinned': {
        backgroundColor:
          'var(--row-hover-bg, var(--DataGrid-rowHoverBackground, rgba(0, 0, 0, 0.04))) !important',
      },
      '.MuiDataGrid-cell': {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
      },
      '.MuiDataGrid-cell:not(.MuiDataGrid-cell--editing):focus, .MuiDataGrid-cell:not(.MuiDataGrid-cell--editing):focus-within':
        {
          outline: 'solid var(--DataGrid-focusOutlineColor, #1976d2) 1px',
          outlineOffset: '-1px',
        },
      '.MuiDataGrid-cell--editing-cell': {
        outline: '2px solid var(--DataGrid-focusOutlineColor, #1976d2)',
        outlineOffset: '-2px',
        boxShadow:
          '0 1px 4px var(--DataGrid-focusShadowColor, rgba(25, 118, 210, 0.16))',
      },
      '.MuiDataGrid-cell--editing-cell:has([data-edit-error="true"])': {
        outline: '2px solid var(--DataGrid-errorColor, #d32f2f)',
        boxShadow:
          '0 1px 6px var(--DataGrid-errorShadowColor, rgba(211, 47, 47, 0.28))',
      },
      '.MuiDataGrid-cell--editing-row': {
        backgroundColor: 'var(--DataGrid-editingRowBg, #ffffff)',
        boxShadow:
          'inset 0 0 0 1px var(--DataGrid-editingRowBorderColor, rgba(25, 118, 210, 0.22))',
      },
      '.MuiDataGrid-cell--editing-row:has([data-edit-error="true"])': {
        outline: '2px solid var(--DataGrid-errorColor, #d32f2f)',
        outlineOffset: '-2px',
        boxShadow:
          '0 1px 6px var(--DataGrid-errorShadowColor, rgba(211, 47, 47, 0.28))',
      },
      '.MuiDataGrid-cell--editing-row:focus-within': {
        zIndex: 3,
        outline: '2px solid var(--DataGrid-focusOutlineColor, #1976d2)',
        outlineOffset: '-2px',
        boxShadow:
          '0 1px 4px var(--DataGrid-focusShadowColor, rgba(25, 118, 210, 0.16))',
      },
      '.MuiDataGrid-cell--editing-row:focus-within:has([data-edit-error="true"])':
        {
          outline: '2px solid var(--DataGrid-errorColor, #d32f2f)',
          boxShadow:
            '0 1px 6px var(--DataGrid-errorShadowColor, rgba(211, 47, 47, 0.28))',
        },
      '.MuiDataGrid-cellInner': {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
      },
      '.MuiDataGrid-actionsCell': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
      },
      '.MuiDataGrid-actionBtn': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        padding: 0,
        border: 0,
        borderRadius: '50%',
        background: 'transparent',
        color: 'var(--DataGrid-actionColor, rgba(0, 0, 0, 0.54))',
        cursor: 'pointer',
        transition:
          'background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '.MuiDataGrid-actionBtn:hover:not(:disabled)': {
        backgroundColor:
          'var(--DataGrid-rowHoverBackground, rgba(0, 0, 0, 0.04))',
        color: 'var(--DataGrid-focusOutlineColor, #1976d2)',
      },
      '.MuiDataGrid-actionBtn--primary': {
        color: 'var(--DataGrid-focusOutlineColor, #1976d2)',
      },
      '.MuiDataGrid-actionBtn--primary:hover:not(:disabled)': {
        color: 'var(--DataGrid-focusOutlineDarkColor, #1565c0)',
      },
      '.MuiDataGrid-actionBtn--error:hover:not(:disabled)': {
        color: 'var(--DataGrid-errorColor, #d32f2f)',
      },
      '.MuiDataGrid-actionBtn:disabled': {
        color: 'var(--DataGrid-disabledColor, rgba(0, 0, 0, 0.26))',
        cursor: 'default',
      },
      '.MuiDataGrid-detailToggleBtn': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        padding: 0,
        border: 0,
        borderRadius: '50%',
        background: 'transparent',
        color: 'var(--DataGrid-actionColor, rgba(0, 0, 0, 0.54))',
        cursor: 'pointer',
        transition:
          'background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '.MuiDataGrid-detailToggleBtn:hover': {
        backgroundColor:
          'var(--DataGrid-rowHoverBackground, rgba(0, 0, 0, 0.04))',
      },
      '.MuiDataGrid-detailToggleBtn[aria-expanded="true"]': {
        color: 'var(--DataGrid-focusOutlineColor, #1976d2)',
      },
      '.MuiDataGrid-detailToggleIcon': {
        width: '20px',
        height: '20px',
        fill: 'currentColor',
        transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '.MuiDataGrid-detailToggleBtn[aria-expanded="true"] .MuiDataGrid-detailToggleIcon':
        {
          transform: 'rotate(90deg)',
        },
      '.MuiDataGrid-checkboxWrap': {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        cursor: 'pointer',
        color: 'var(--DataGrid-actionColor, rgba(0, 0, 0, 0.6))',
        transition: 'background-color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '.MuiDataGrid-checkboxWrap:hover': {
        backgroundColor:
          'var(--DataGrid-checkboxHoverBg, rgba(25, 118, 210, 0.04))',
      },
      '.MuiDataGrid-checkboxWrap--disabled': {
        color: 'var(--DataGrid-disabledColor, rgba(0, 0, 0, 0.22))',
        cursor: 'default',
      },
      '.MuiDataGrid-checkboxWrap--disabled:hover': {
        backgroundColor: 'transparent',
      },
      '.MuiDataGrid-checkboxWrap--checked': {
        color: 'var(--DataGrid-focusOutlineColor, #1976d2)',
      },
      '.MuiDataGrid-checkboxInput': {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        opacity: 0,
        cursor: 'inherit',
      },
      '.MuiDataGrid-checkboxSvg': {
        width: '22px',
        height: '22px',
        fill: 'currentColor',
        pointerEvents: 'none',
      },
      '.MuiDataGrid-dragHandle': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        color: 'var(--DataGrid-actionColor, rgba(0, 0, 0, 0.45))',
        cursor: 'grab',
      },
      '.MuiDataGrid-dragHandle:active': {
        cursor: 'grabbing',
      },
      '.MuiDataGrid-dragHandle:hover': {
        color: 'var(--DataGrid-focusOutlineColor, #1976d2)',
        backgroundColor:
          'var(--DataGrid-dragHoverBg, rgba(25, 118, 210, 0.06))',
      },
      '.MuiDataGrid-dragHandle--disabled': {
        color: 'var(--DataGrid-disabledColor, rgba(0, 0, 0, 0.22))',
        cursor: 'not-allowed',
      },
      '.MuiDataGrid-dragHandle--disabled:hover, .MuiDataGrid-dragHandle--disabled:active':
        {
          color: 'var(--DataGrid-disabledColor, rgba(0, 0, 0, 0.22))',
          backgroundColor: 'transparent',
          cursor: 'not-allowed',
        },
      '@media print': {
        '.MuiDataGrid-toolbarWrapper, .MuiDataGrid-footerContainer': {
          display: 'none !important',
        },
        '.MuiDataGrid-root': {
          height: 'auto !important',
          overflow: 'visible !important',
          border: 'none !important',
        },
        '.datagrid-scroller': {
          overflow: 'visible !important',
        },
        '.MuiDataGrid-printSheet': {
          border: 'none !important',
          padding: '0 !important',
        },
      },
    }}
  />
);
