import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Checkbox,
  InputBase,
  MenuItem,
  Select,
  Tooltip,
  type SelectChangeEvent,
} from '@mui/material';
import type { GridColDef, GridRowId, GridValidRowModel } from '../types';
import {
  evaluateEditCellValidation,
  getDefaultAlignForType,
  normalizeValueOptions,
} from '../core/gridCore';

export type EditCommitNavigation = 'stay' | 'down' | 'next' | 'prev';

interface GridEditCellProps<R extends GridValidRowModel> {
  row: R;
  rowId: GridRowId;
  value: unknown;
  initialTypedValue?: string;
  colDef: GridColDef<R>;
  fontSize: number;
  /** 'cell' commits immediately on blur/Enter/Tab; 'row' edits as part of a multi-cell row draft */
  mode?: 'cell' | 'row';
  autoFocus?: boolean;
  onDraftChange?: (nextRawValue: unknown) => void;
  onCommit: (nextRawValue: unknown, nav: EditCommitNavigation) => void;
  onCancel: () => void;
}

export function GridEditCell<R extends GridValidRowModel>({
  row,
  rowId,
  value,
  initialTypedValue,
  colDef,
  fontSize,
  mode = 'cell',
  autoFocus = true,
  onDraftChange,
  onCommit,
  onCancel,
}: GridEditCellProps<R>) {
  const colType = colDef.type ?? 'string';
  const align = colDef.align ?? getDefaultAlignForType(colType);
  const committedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<string>(() => {
    if (initialTypedValue !== undefined) {
      return initialTypedValue;
    }
    if (value === null || value === undefined) return '';
    if (colType === 'dateTime') {
      return String(value).replace(' ', 'T').slice(0, 16);
    }
    return String(value);
  });

  const [checked, setChecked] = useState<boolean>(() => Boolean(value));

  const currentCandidate: unknown = colType === 'boolean' ? checked : draft;

  const validation = useMemo(
    () => evaluateEditCellValidation(currentCandidate, row, rowId, colDef),
    [colDef, currentCandidate, row, rowId],
  );
  const validationError = validation.valid ? null : validation.errorMessage;

  useEffect(() => {
    if (!autoFocus || !inputRef.current) return;
    inputRef.current.focus();
    if (initialTypedValue !== undefined) {
      const len = inputRef.current.value.length;
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch {
        // number inputs in some browsers disallow setSelectionRange
      }
    } else if (colType === 'string' || colType === 'number') {
      inputRef.current.select();
    }
  }, [autoFocus, colType, initialTypedValue]);

  const finishCommit = (val: unknown, nav: EditCommitNavigation) => {
    const check = evaluateEditCellValidation(val, row, rowId, colDef);
    if (!check.valid) {
      // Official MUI X behavior: keep editor active and surface live red error tooltip
      inputRef.current?.focus();
      return;
    }
    if (mode === 'cell') {
      if (committedRef.current) return;
      committedRef.current = true;
    }
    onCommit(val, nav);
  };

  const finishCancel = () => {
    if (mode === 'cell') {
      if (committedRef.current) return;
      committedRef.current = true;
    }
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      finishCommit(draft, 'down');
    } else if (e.key === 'Tab') {
      if (mode === 'cell') {
        e.preventDefault();
        finishCommit(draft, e.shiftKey ? 'prev' : 'next');
      }
      // In row mode, allow native Tab focus traversal between editable inputs in the same row
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishCancel();
    }
  };

  // Official MUI X custom renderEditCell hook
  if (colDef.renderEditCell) {
    return (
      <Tooltip
        open={Boolean(validationError)}
        title={validationError ?? ''}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            role: 'alert',
            sx: {
              bgcolor: '#D32F2F',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 500,
              px: 1.25,
              py: 0.5,
            },
          },
          arrow: { sx: { color: '#D32F2F' } },
        }}
      >
        <Box
          data-edit-error={validationError ? 'true' : undefined}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            boxShadow: validationError ? 'inset 0 0 0 2px #D32F2F' : undefined,
          }}
        >
          {colDef.renderEditCell({
            id: rowId,
            field: colDef.field,
            value: currentCandidate,
            row,
            colDef,
            error: validationError ?? false,
            onChange: (nextVal) => {
              setDraft(String(nextVal ?? ''));
              setChecked(Boolean(nextVal));
              onDraftChange?.(nextVal);
            },
            onCommit: (nextVal) =>
              finishCommit(nextVal !== undefined ? nextVal : currentCandidate, 'stay'),
            onCancel: finishCancel,
          })}
        </Box>
      </Tooltip>
    );
  }

  if (colType === 'boolean') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            finishCommit(checked, 'down');
          } else if (e.key === 'Tab' && mode === 'cell') {
            e.preventDefault();
            finishCommit(checked, e.shiftKey ? 'prev' : 'next');
          } else if (e.key === 'Escape') {
            e.preventDefault();
            finishCancel();
          }
        }}
      >
        <Checkbox
          autoFocus={autoFocus}
          size="small"
          checked={checked}
          onChange={(_, nextChecked) => {
            setChecked(nextChecked);
            onDraftChange?.(nextChecked);
            if (mode === 'cell') {
              finishCommit(nextChecked, 'stay');
            }
          }}
          onBlur={() => {
            if (mode === 'cell') {
              finishCommit(checked, 'stay');
            }
          }}
          slotProps={{
            input: {
              'aria-label': `编辑${colDef.headerName ?? colDef.field}`,
            },
          }}
        />
      </Box>
    );
  }

  if (colType === 'singleSelect') {
    const options = normalizeValueOptions(colDef.valueOptions);
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
      const nextVal = e.target.value;
      setDraft(nextVal);
      onDraftChange?.(nextVal);
      if (mode === 'cell') {
        finishCommit(nextVal, 'stay');
      }
    };

    return (
      <Select
        open={mode === 'cell' ? true : undefined}
        autoFocus={autoFocus}
        fullWidth
        variant="standard"
        disableUnderline
        value={draft}
        onChange={handleSelectChange}
        onClose={() => {
          if (mode === 'cell' && !committedRef.current) {
            finishCancel();
          }
        }}
        onKeyDown={(e) => {
          if (mode === 'row') {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              finishCommit(draft, 'down');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              finishCancel();
            }
          }
        }}
        onClick={(e) => e.stopPropagation()}
        MenuProps={{
          slotProps: {
            paper: {
              elevation: 8,
              sx: { borderRadius: '4px', mt: 0.5 },
            },
          },
        }}
        sx={{
          width: '100%',
          height: '100%',
          fontSize: `${fontSize}px`,
          color: 'rgba(0, 0, 0, 0.87)',
          '& .MuiSelect-select': {
            py: 0,
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem
            key={String(opt.value)}
            value={String(opt.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    );
  }

  const inputType =
    colType === 'date'
      ? 'date'
      : colType === 'dateTime'
        ? 'datetime-local'
        : colType === 'number'
          ? 'number'
          : 'text';

  return (
    <Tooltip
      open={Boolean(validationError)}
      title={validationError ?? ''}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          role: 'alert',
          sx: {
            bgcolor: '#D32F2F',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 500,
            px: 1.25,
            py: 0.5,
            boxShadow: '0 2px 8px rgba(211, 47, 47, 0.35)',
          },
        },
        arrow: {
          sx: { color: '#D32F2F' },
        },
      }}
    >
      <Box
        data-edit-error={validationError ? 'true' : undefined}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          mx: '-10px',
          px: '10px',
          boxSizing: 'content-box',
          bgcolor: validationError ? 'rgba(211, 47, 47, 0.04)' : 'transparent',
          boxShadow: validationError ? 'inset 0 0 0 2px #D32F2F' : undefined,
        }}
      >
        <InputBase
          inputRef={inputRef}
          fullWidth
          type={inputType}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onDraftChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (mode === 'cell') {
              const check = evaluateEditCellValidation(
                draft,
                row,
                rowId,
                colDef,
              );
              if (check.valid) {
                finishCommit(draft, 'stay');
              } else {
                finishCancel();
              }
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          inputProps={{
            'aria-label': `编辑${colDef.headerName ?? colDef.field}`,
            'aria-invalid': Boolean(validationError) || undefined,
            style: {
              textAlign: align,
              fontSize: `${fontSize}px`,
              padding: 0,
              fontVariantNumeric:
                colType === 'number' ||
                colType === 'date' ||
                colType === 'dateTime'
                  ? 'tabular-nums'
                  : undefined,
            },
          }}
          sx={{
            width: '100%',
            height: '100%',
            color: validationError ? '#B71C1C' : 'rgba(0, 0, 0, 0.87)',
            fontFamily:
              colType === 'number' ||
              colType === 'date' ||
              colType === 'dateTime'
                ? 'JetBrains Mono, monospace'
                : 'inherit',
          }}
        />
      </Box>
    </Tooltip>
  );
}
