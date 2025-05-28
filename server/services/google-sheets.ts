import { google } from 'googleapis';
import type { InsertLicenciado, InsertSyncLog, SyncLog } from '@shared/schema';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

export class GoogleSheetsService {
  private sheets: any;
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.credentials.client_email,
        private_key: config.credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async fetchLicenciadosData(): Promise<InsertLicenciado[]> {
    try {
      console.log('Fetching data from Google Sheets...');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('No data found in spreadsheet');
      }

      // Assume first row is header
      const headers = rows[0];
      const dataRows = rows.slice(1);

      const licenciados: InsertLicenciado[] = dataRows.map((row: any[]) => {
        const licenciado: any = {};
        
        headers.forEach((header: string, index: number) => {
          const value = row[index] || '';
          
          switch (header.toLowerCase()) {
            case 'codigo':
              licenciado.codigo = parseInt(value) || 0;
              break;
            case 'nome':
              licenciado.nome = value;
              break;
            case 'status':
              licenciado.status = value.toLowerCase() || 'ativo';
              break;
            case 'clientes_ativos':
            case 'clientesativos':
              licenciado.clientesAtivos = parseInt(value) || 0;
              break;
            case 'clientes_telecom':
            case 'clientestelecom':
              licenciado.clientesTelecom = parseInt(value) || 0;
              break;
            case 'graduacao':
              licenciado.graduacao = value;
              break;
            case 'patrocinador_id':
            case 'patrocinadorid':
              licenciado.patrocinadorId = value ? parseInt(value) : null;
              break;
            case 'cidade':
              licenciado.cidade = value;
              break;
            case 'uf':
              licenciado.uf = value;
              break;
            case 'data_ativacao':
            case 'dataativacao':
              licenciado.dataAtivacao = value ? new Date(value) : new Date();
              break;
          }
        });

        return licenciado;
      });

      console.log(`Processed ${licenciados.length} records from Google Sheets`);
      return licenciados;
      
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });
      
      return !!response.data;
    } catch (error) {
      console.error('Google Sheets connection validation failed:', error);
      return false;
    }
  }
}

// Cache implementation
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService();