import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Workbook } from 'exceljs';
@Injectable()
export class ExportService extends BaseService {
  protected readonly logger = new Logger('ExportService');

  constructor() {
    super();
  }

  // Utilidad para convertir valores a CSV seguro
  private toCsvValue(val: any): string {
    if (val === null || val === undefined) return '';
    let s = String(val);
    // Escapar dobles comillas
    if (s.includes('"')) s = s.replace(/"/g, '""');
    // Encapsular si contiene separadores, comillas o saltos de línea
    if (/[",\n\r;]/.test(s)) s = `"${s}"`;
    return s;
  }

  // FLS-12 Exporta un array de objetos a CSV y devuelve Buffer
  async exportArrayToCsv(rows: any[]): Promise<any> {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        return this.customThrowError(
          '',
          'FLS-12-01',
          'Array vacío o no válido',
        );
      }

      const headers = Object.keys(rows[0]);
      const lines: string[] = [];
      lines.push(headers.join(','));

      for (const r of rows) {
        const line = headers.map((h) => this.toCsvValue(r[h])).join(',');
        lines.push(line);
      }

      const csv = lines.join('\r\n');
      const buf = Buffer.from(csv, 'utf8');
      return this.customSuccessResponse(
        buf,
        { rows: rows.length },
        HttpStatus.OK,
        'Archivo CSV generado',
        'files/export-array-csv',
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'FLS-12', 'Error exportando array a CSV');
    }
  }

  // FLS-10 Exporta un array de objetos a Excel y devuelve Buffer
  async exportArrayToExcel(rows: any[], sheetName: string = 'Datos') {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        return this.customThrowError(
          '',
          'FLS-10-01',
          'Array vacío o no válido',
        );
      }

      const workbook = new Workbook();
      const sheet = workbook.addWorksheet(sheetName);

      // Encabezados basados en las llaves del primer objeto
      const headers = Object.keys(rows[0]);
      sheet.addRow(headers);

      // Agregar filas
      for (const r of rows) {
        sheet.addRow(headers.map((h) => r[h]));
      }

      // Auto width
      sheet.columns?.forEach((col) => {
        let max = 10;
        // eachCell puede ser opcional en typings -> usar optional chaining
        col.eachCell?.({ includeEmpty: true }, (cell) => {
          const v = cell?.value != null ? String(cell.value) : '';
          max = Math.max(max, v.length + 2);
        });
        // Si no se recorrieron celdas (p. ej., sin datos), usar longitud del header
        const header = (col.header as string) || '';
        max = Math.max(max, header.length + 2);
        (col as any).width = max;
      });

      const raw = await workbook.xlsx.writeBuffer();
      // Asegurar Buffer de Node.js (exceljs puede retornar ArrayBuffer/Uint8Array en algunos entornos)
      const nodeBuffer: Buffer = Buffer.isBuffer(raw)
        ? (raw as Buffer)
        : Buffer.from(raw as any);
      return this.customSuccessResponse(
        nodeBuffer,
        { rows: rows.length },
        HttpStatus.OK,
        'Archivo Excel generado',
        'files/export-array',
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'FLS-10', 'Error exportando array a Excel');
    }
  }
}
