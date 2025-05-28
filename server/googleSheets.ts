import { google } from "googleapis";

// Opção A: Cole o conteúdo do JSON direto aqui
const credentials = {
  type: "service_account",
  project_id: "western-cirrus-461119-s0",
  private_key_id: "afc10c4bc6262d3ab3fa42497ad84ecd4a375b75",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJWGqXZKsuEkOf\nvIiRtTg1o3zNMpG4JRrafQp1KR8q/H2O2LdlFKSN+klwYVWjzOwFXxhX27PH5ver\nwVUwLMe3kgTq6kuFcJQ4rG5GsR2giFaWRmWmsR3kxsV2IqTS+H7LAGr3WgxZrE7F\nP/msb64230JzQyE/WkkJx36hx74TjVzWfl27ocN1CqeGtq9Oi6iBhqQCoV6n1/U+\npBZuh/WrhItcRSJux+v6ZQ0QeFGRrk9Do60kM3z0qMFzjhRbcWKRLj80uUC57GL9\nw7IcIuCpolxL9kAk7cHzj4TsWZBnYC68bPhPfechKc5UGgpYBfI7AiShCR+DHf60\nPiktmXUpAgMBAAECggEAAJtl4jQhPlJl8PYYTPooeSRCSiXAIeI+FmZgm5xRYKeM\nuFtyaBlbv/rUca81cHjmcENftyoYJ2mMmcW2MZ7nm5J9iyNu3AWMHi9KO30pYJ8b\nRbjgxxPLH4ddjTQ1s4DLdGYOrIARaqF18QB29VG2iyn5URAk1O77Ko6hqjAIOcEG\nuPLBPodjRjy2jbNJxJQPjhSMeOJAw/PoDnFKyL6V10lpmJJV9AUkBX/BoNDu99aF\n9VBXTCqBBWEHzkD39lLadLVT9XHinxFmaQbwmE8gxHrAN+P8Ce3nvhAq20zWy1x8\ndrUgs8ImjoB/bFM2hcHekqJnXT1dNa0y2eEZyzdZ1QKBgQD/qhj+1NlG33XAdifs\nljDjZWpJuKEvgto/4IGs2Ov0NnMzA9Mgt6DGO+yO5gNzxk7xsjf6f5myuAnam1e8\nyv9WaNrfzyx+VnXEo7yDsOyFnr4xbUOl4ZjCWAUE+7yicNSD8J5LEJFWo3qb0nuY\na4Hlbma8Ks+7wo9S0YImPfuclQKBgQDJnBFV5WykXy4rToW7cWxplVYMoxv0ksqE\npv7P5NBC1nQTKA3+OzApxhm+vyk9+BV0BW0QrUeY8ACXqD3WDUiMWPoUb1yEsIbz\nT7/DGMHdAjrT/FfIQzBIGOeRJjy2bBY0iFCTQ6ZMfMAHp8W6aUE4ToblMuDPkBbJ\nlbSNl6X9RQKBgBJUxOQIqOePACdjkWtCPZEgZWWRymTYsgNgeovFJe3ltY7T2GCB\nKhLsmwKH9Xlon6Juz9qzKXcKARLejoTn3TT54a+ocB1C38DQqKScm+jcv/BVUENl\nkIlmvD1mO1k+U85+AyuIrZMTt6fSiLAeDTtBFjaprylcQuCCSx2o1hCdAoGBALEm\nc40YZNgh0j23Z4cG6Q31bID6KaxD97OL0Ub3dY/lRGU4wuLrOyzZpvGWozSScrdZ\ntTX8LHdUHBEmgf89+Mtpu4SNPaxSOKI/Ju7VKDN8rBhtGO0dLKWNTJycDqj0XKaY\nSMS9orh+vXV8lB9yMR660Yk/pY58u6kx5E6uO+pJAoGBAM4GqOk6EmOZFsvwFGwg\nOJY7MJElOCADR8h7yybWLyw2totGiBZdQNLZZ21wHLtAJfaIX5aNRVkVQ6gTJFcm\nhE4PR50p1UM3hsTq6v5K2fVhMeOTMCg7j+mKDvsUKCllSEAJs3ekNom/s6lBB4wX\nZV8LIVHVZpJ7QYys5dmRXt+m\n-----END PRIVATE KEY-----\n",
  client_email:
    "igreen-dashboard@western-cirrus-461119-s0.iam.gserviceaccount.com",
  client_id: "104332682842573314433",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/igreen-dashboard%40western-cirrus-461119-s0.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "1tZow6Qud-IYaOHFMDlkzc8GcvRhCr6pJbWm4m3_XF4A";

export async function fetchLicenciados() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "A1:AQ",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    console.log(`✅ ${data.length} licenciados carregados`);
    return data;
  } catch (error: any) {
    console.error("❌ Erro Google Sheets:", error.message);
    return [];
  }
}
