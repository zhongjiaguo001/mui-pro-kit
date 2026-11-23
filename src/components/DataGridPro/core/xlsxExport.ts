import type { GridColDef, GridValidRowModel } from '../types';
import { formatCellValue, resolveCellValue } from './gridCore';

// Standard IEEE 802.3 CRC32 lookup table for valid OOXML (.xlsx) ZIP containers
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function excelColLetter(index: number): string {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildStoreZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const checksum = crc32(data);

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header signature
    lv.setUint16(4, 20, true); // version needed: 2.0
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // compression method: 0 (store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5621, true); // mod date
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    // Central directory header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // central file header signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // store
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5621, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    output.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    output.set(part, pos);
    pos += part.length;
  }
  output.set(eocd, pos);
  return output;
}

export interface XlsxMergeRange {
  startRow: number; // 1-based Excel row index
  endRow: number;
  startCol: number; // 0-based column index
  endCol: number;
}

export interface XlsxExportOptions<
  R extends GridValidRowModel = GridValidRowModel,
> {
  columnGroupingModel?: import('../types').GridColumnGroupingModel;
  rowSpanning?: boolean;
  extraMerges?: XlsxMergeRange[];
  _phantomRowType?: R;
}

/**
 * Generates a valid OOXML Excel (.xlsx) workbook binary with typed numeric
 * cells, formatted numeric styles, multi-level column group merged headers,
 * vertical rowSpan merged cells, frozen header rows, and auto-sized columns.
 */
export function serializeRowsToXlsxBytes<R extends GridValidRowModel>(
  rows: R[],
  columns: GridColDef<R>[],
  sheetName = '数据导出',
  options?: XlsxExportOptions<R>,
): Uint8Array {
  const exportCols = columns.filter((col) => col.type !== 'actions');
  const safeSheetName = escapeXml(
    sheetName.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet1',
  );

  const colDefsXml = exportCols
    .map((col, idx) => {
      const charWidth = Math.max(
        12,
        Math.min(48, Math.round((col.width ?? 140) / 7)),
      );
      return `<col min="${idx + 1}" max="${idx + 1}" width="${charWidth}" customWidth="1"/>`;
    })
    .join('');

  const merges: XlsxMergeRange[] = [...(options?.extraMerges ?? [])];

  // Optional multi-level column group header row above leaf column headers
  const groupHeaderRowsXml: string[] = [];
  let headerRowCount = 1;
  if (options?.columnGroupingModel && options.columnGroupingModel.length > 0) {
    const fieldToGroupName = new Map<string, string>();
    for (const grp of options.columnGroupingModel) {
      const collect = (
        children: import('../types').GridColumnGroup['children'],
        label: string,
      ) => {
        for (const ch of children) {
          if ('field' in ch) {
            fieldToGroupName.set(ch.field, label);
          } else {
            collect(ch.children, ch.headerName ?? ch.groupId);
          }
        }
      };
      collect(grp.children, grp.headerName ?? grp.groupId);
    }

    if (fieldToGroupName.size > 0) {
      headerRowCount = 2;
      const groupCells: string[] = [];
      let cIdx = 0;
      while (cIdx < exportCols.length) {
        const label = fieldToGroupName.get(exportCols[cIdx].field) ?? '';
        let spanEnd = cIdx;
        if (label) {
          while (
            spanEnd + 1 < exportCols.length &&
            fieldToGroupName.get(exportCols[spanEnd + 1].field) === label
          ) {
            spanEnd += 1;
          }
        }
        for (let k = cIdx; k <= spanEnd; k += 1) {
          const ref = `${excelColLetter(k)}1`;
          const text = k === cIdx ? escapeXml(label) : '';
          groupCells.push(
            `<c r="${ref}" s="3" t="inlineStr"><is><t>${text}</t></is></c>`,
          );
        }
        if (spanEnd > cIdx) {
          merges.push({
            startRow: 1,
            endRow: 1,
            startCol: cIdx,
            endCol: spanEnd,
          });
        }
        cIdx = spanEnd + 1;
      }
      groupHeaderRowsXml.push(
        `<row r="1" ht="22" customHeight="1">${groupCells.join('')}</row>`,
      );
    }
  }

  const leafHeaderExcelRow = headerRowCount;
  const headerCellsXml = exportCols
    .map((col, cIdx) => {
      const ref = `${excelColLetter(cIdx)}${leafHeaderExcelRow}`;
      const label = escapeXml(col.headerName ?? col.field);
      return `<c r="${ref}" s="1" t="inlineStr"><is><t>${label}</t></is></c>`;
    })
    .join('');

  // Optional rowSpanning vertical merge detection
  const coveredCells = new Set<string>();
  if (options?.rowSpanning && rows.length > 1) {
    for (let cIdx = 0; cIdx < exportCols.length; cIdx += 1) {
      const col = exportCols[cIdx];
      if (col.rowSpan === false) continue;
      let r = 0;
      while (r < rows.length) {
        const baseRaw = resolveCellValue(rows[r], col);
        const baseVal = col.rowSpanValueGetter
          ? col.rowSpanValueGetter(baseRaw, rows[r])
          : baseRaw;
        if (baseVal === null || baseVal === undefined || baseVal === '') {
          r += 1;
          continue;
        }
        let end = r;
        while (end + 1 < rows.length) {
          const nextRaw = resolveCellValue(rows[end + 1], col);
          const nextVal = col.rowSpanValueGetter
            ? col.rowSpanValueGetter(nextRaw, rows[end + 1])
            : nextRaw;
          if (Object.is(baseVal, nextVal)) {
            end += 1;
          } else {
            break;
          }
        }
        if (end > r) {
          merges.push({
            startRow: leafHeaderExcelRow + 1 + r,
            endRow: leafHeaderExcelRow + 1 + end,
            startCol: cIdx,
            endCol: cIdx,
          });
          for (let k = r + 1; k <= end; k += 1) {
            coveredCells.add(`${k}:${cIdx}`);
          }
        }
        r = end + 1;
      }
    }
  }

  const dataRowsXml = rows
    .map((row, rIdx) => {
      const excelRowNum = leafHeaderExcelRow + 1 + rIdx;
      const cellsXml = exportCols
        .map((col, cIdx) => {
          const ref = `${excelColLetter(cIdx)}${excelRowNum}`;
          if (coveredCells.has(`${rIdx}:${cIdx}`)) {
            return `<c r="${ref}" s="0"/>`;
          }
          const raw = resolveCellValue(row, col);
          if (
            col.type === 'number' &&
            raw !== null &&
            raw !== undefined &&
            raw !== '' &&
            Number.isFinite(Number(raw))
          ) {
            return `<c r="${ref}" s="2" t="n"><v>${Number(raw)}</v></c>`;
          }
          const formatted = escapeXml(formatCellValue(raw, row, col));
          return `<c r="${ref}" s="0" t="inlineStr"><is><t>${formatted}</t></is></c>`;
        })
        .join('');
      return `<row r="${excelRowNum}">${cellsXml}</row>`;
    })
    .join('');

  const mergeCellsXml =
    merges.length > 0
      ? `<mergeCells count="${merges.length}">` +
        merges
          .map(
            (m) =>
              `<mergeCell ref="${excelColLetter(m.startCol)}${m.startRow}:${excelColLetter(m.endCol)}${m.endRow}"/>`,
          )
          .join('') +
        '</mergeCells>'
      : '';

  const sheetXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0">' +
    `<pane ySplit="${headerRowCount}" topLeftCell="A${headerRowCount + 1}" activePane="bottomLeft" state="frozen"/>` +
    '</sheetView></sheetViews>' +
    `<cols>${colDefsXml}</cols>` +
    '<sheetData>' +
    groupHeaderRowsXml.join('') +
    `<row r="${leafHeaderExcelRow}" ht="24" customHeight="1">${headerCellsXml}</row>` +
    dataRowsXml +
    '</sheetData>' +
    mergeCellsXml +
    '</worksheet>';

  // Styles: 0=default body, 1=leaf header bold shaded, 2=numeric #,##0 right-aligned, 3=group header centered bold
  const stylesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="4">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>' +
    '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '</cellXfs>' +
    '</styleSheet>';

  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>';

  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';

  const enc = new TextEncoder();
  return buildStoreZip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypesXml) },
    { name: '_rels/.rels', data: enc.encode(rootRelsXml) },
    { name: 'xl/workbook.xml', data: enc.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: enc.encode(stylesXml) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml) },
  ]);
}

/**
 * Serializes visible rows and columns into pretty-printed JSON for data export.
 */
export function serializeRowsToJson<R extends GridValidRowModel>(
  rows: R[],
  columns: GridColDef<R>[],
): string {
  const exportCols = columns.filter((col) => col.type !== 'actions');
  const records = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of exportCols) {
      const key = col.headerName ?? col.field;
      const raw = resolveCellValue(row, col);
      obj[key] = col.type === 'number' || col.type === 'boolean'
        ? raw
        : formatCellValue(raw, row, col);
    }
    return obj;
  });
  return JSON.stringify(records, null, 2);
}
