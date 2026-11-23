import React from 'react';
import { GlobalStyles } from '@mui/material';

/**
 * Module-level constant GlobalStyles for aligned monospace tabular numerals
 * used across DatePicker, RangePicker, and CalendarPanel.
 */
export const DATE_PICKER_TABULAR_STYLES = (
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
    }}
  />
);
