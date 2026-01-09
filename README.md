# MCP Server for MySQL

[![NPM Version](https://img.shields.io/npm/v/@mrbozkay/mcp_mysql_analyser.svg)](https://www.npmjs.com/package/@mrbozkay/mcp_mysql_analyser)
[![License](https://img.shields.io/github/license/MrBozkay/mcp_mysql_analyser.svg)](https://github.com/MrBozkay/mcp_mysql_analyser/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/MrBozkay/mcp_mysql_analyser.svg)](https://github.com/MrBozkay/mcp_mysql_analyser/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/MrBozkay/mcp_mysql_analyser.svg)](https://github.com/MrBozkay/mcp_mysql_analyser)

**MCP Server for MySQL**, Claude, Kiro IDE, VSCode, Gemini ve diğer MCP destekleyen platformlarda MySQL veritabanlarınızla doğal dil kullanarak etkileşim kurmanızı sağlayan güçlü bir araçtır. Şemaları inceleme, sorgular çalıştırma ve tek satır SQL yazmadan veri analizi yapma imkanı sunar.

Bu araç, veritabanı yönetimi ve keşfi için AI'nin gücünden yararlanmak isteyen geliştiriciler, veri analistleri ve veritabanı yöneticileri için tasarlanmıştır.

## 🚀 Hızlı Başlangıç

**GitHub'tan direkt kurulum - Tüm MCP platformları için:**

```bash
# 1. Projeyi klonlayın
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser

# 2. Otomatik kurulum (Windows)
.\install-global.ps1

# 2. Otomatik kurulum (Linux/Mac)
chmod +x install-global.sh && ./install-global.sh
```

**Artık tüm MCP destekleyen platformlarda MySQL veritabanınızla doğal dil ile konuşabilirsiniz!**

### Desteklenen Platformlar:
- 🎯 **Kiro IDE** - Yerleşik MCP desteği
- 💻 **VSCode** - MCP uzantısı ile
- 🤖 **Claude Desktop** - Anthropic'in resmi uygulaması
- ✨ **Google Gemini** - MCP protokolü desteği
- 🔧 **Cursor IDE** - AI kod editörü
- 📱 **Diğer MCP Clients** - MCP protokolünü destekleyen herhangi bir uygulama

### Örnek Kullanım:
- "Veritabanımdaki tabloları listele"
- "Users tablosunun şemasını göster"
- "En çok satılan ürünleri analiz et"
- "Müşteri churn oranını hesapla"

## İçindekiler

- [Temel Özellikler](#temel-özellikler)
- [Kurulum](#kurulum)
- [Platform Konfigürasyonları](#platform-konfigürasyonları)
  - [Kiro IDE](#kiro-ide)
  - [Claude Desktop](#claude-desktop)
  - [VSCode](#vscode)
  - [Cursor IDE](#cursor-ide)
  - [Google Gemini](#google-gemini)
- [Çevre Değişkenleri](#çevre-değişkenleri)
- [Kullanım](#kullanım)
- [Mevcut Araçlar](#mevcut-araçlar)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

## Temel Özellikler

- **🌐 Çoklu Platform Desteği:** Kiro IDE, VSCode, Claude Desktop, Gemini ve diğer MCP clients
- **🗣️ Doğal Dil Etkileşimi:** Veritabanınızla sade Türkçe/İngilizce kullanarak etkileşim kurun
- **🔍 Şema İncelemesi:** LLM'lerin manuel açıklama olmadan veritabanı yapınızı anlamasını sağlayın
- **⚡ SQL Sorgu Çalıştırma:** LLM ile konuşmalarınızdan doğrudan MySQL veritabanınıza SQL sorguları gönderin
- **📊 Veri Analizi:** LLM'nin veritabanı verilerinizi analiz etmesini ve içgörüler döndürmesini sağlayın
- **🔧 Kolay Kurulum:** GitHub'tan tek komutla kurulum
- **🛡️ Güvenli:** Auto-approve ile güvenli araçlar otomatik onaylanır

## Kurulum

### NPM Global Kurulum (Önerilen)

**En kolay yöntem - NPM Registry'den:**

```bash
npm install -g @mrbozkay/mcp_mysql_analyser
```

Kurulum sonrası `mcp-mysql-analyzer` komutu her yerden kullanılabilir hale gelir.

### GitHub'tan Direkt Kurulum

**Tüm platformlar için otomatik kurulum:**

```bash
# Projeyi klonlayın ve kurun
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser

# Windows (PowerShell)
.\install-global.ps1

# Linux/Mac (Bash)
chmod +x install-global.sh && ./install-global.sh
```

Bu kurulum:
- ✅ Bağımlılıkları otomatik kurar
- ✅ Projeyi derler
- ✅ Global komut olarak kurar (`mcp-mysql-analyzer`)
- ✅ Tüm MCP platformları için hazır hale getirir

### Manuel Kurulum

```bash
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser
npm install && npm run build
npm pack
npm install -g ./mrbozkay-mcp_mysql_analyser-1.0.2.tgz --force
```

## Platform Konfigürasyonları

Kurulum sonrası her platform için özel konfigürasyon gerekir. Önce çevre değişkenlerinizi ayarlayın:

### Çevre Değişkenleri Ayarlama

**Windows (PowerShell):**
```powershell
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_USER="kullanici_adiniz"
$env:MYSQL_PASSWORD="sifreniz"
$env:MYSQL_DB="veritabani_adiniz"
$env:MYSQL_SSL="false"
```

**Linux/Mac (Bash):**
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=kullanici_adiniz
export MYSQL_PASSWORD=sifreniz
export MYSQL_DB=veritabani_adiniz
export MYSQL_SSL=false
```

### Kiro IDE

**Otomatik Kurulum (Önerilen):**
```bash
mcp-mysql-analyzer setup
```

**Manuel Konfigürasyon:**
`.kiro/settings/mcp.json` dosyasını oluşturun:
```json
{
  "mcpServers": {
    "mcp-mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "kullanici_adiniz",
        "MYSQL_PASSWORD": "sifreniz",
        "MYSQL_DB": "veritabani_adiniz"
      },
      "autoApprove": [
        "connect", "list_databases", "list_tables", 
        "table_info", "get_table_ddl", "profile_table"
      ]
    }
  }
}
```

### Claude Desktop

`claude_desktop_config.json` dosyasına ekleyin:
```json
{
  "mcpServers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "kullanici_adiniz",
        "MYSQL_PASSWORD": "sifreniz",
        "MYSQL_DB": "veritabani_adiniz"
      }
    }
  }
}
```

**Dosya Konumları:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### VSCode

VSCode MCP uzantısını kurun ve `settings.json`'a ekleyin:
```json
{
  "mcp.servers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "kullanici_adiniz",
        "MYSQL_PASSWORD": "sifreniz",
        "MYSQL_DB": "veritabani_adiniz"
      }
    }
  }
}
```

### Cursor IDE

`mcp.json` dosyasını oluşturun:
```json
{
  "mcpServers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "kullanici_adiniz",
        "MYSQL_PASSWORD": "sifreniz",
        "MYSQL_DB": "veritabani_adiniz"
      }
    }
  }
}
```

### Google Gemini

Gemini'nin MCP konfigürasyon dosyasına ekleyin:
```json
{
  "servers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "environment": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "kullanici_adiniz",
        "MYSQL_PASSWORD": "sifreniz",
        "MYSQL_DB": "veritabani_adiniz"
      }
    }
  }
}
```

### Diğer MCP Clients

Herhangi bir MCP protokolünü destekleyen client için:
```json
{
  "command": "mcp-mysql-analyzer",
  "args": ["server"],
  "env": {
    "MYSQL_HOST": "localhost",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "kullanici_adiniz",
    "MYSQL_PASSWORD": "sifreniz",
    "MYSQL_DB": "veritabani_adiniz"
  }
}
```

## Çevre Değişkenleri

Server aşağıdaki çevre değişkenleri kullanılarak yapılandırılabilir:

| Değişken | Açıklama | Varsayılan | Zorunlu |
| --- | --- | --- | --- |
| `MYSQL_HOST` | MySQL host adresi | `localhost` | ✅ |
| `MYSQL_PORT` | MySQL port numarası | `3306` | ❌ |
| `MYSQL_USER` | MySQL kullanıcı adı | `root` | ✅ |
| `MYSQL_PASSWORD` | MySQL şifresi | `''` | ❌ |
| `MYSQL_DB` | Varsayılan veritabanı | `null` | ❌ |
| `MYSQL_SSL` | SSL bağlantısı kullan | `false` | ❌ |
| `MYSQL_CONNECTION_LIMIT` | MySQL bağlantı limiti | `5` | ❌ |
| `DEFAULT_SAMPLE_LIMIT` | Sorgular için varsayılan örnek limiti | `10000` | ❌ |
| `DEFAULT_QUERY_TIMEOUT` | Varsayılan sorgu timeout (ms) | `15000` | ❌ |

### Global Komutlar

Kurulum sonrası kullanılabilir komutlar:

```bash
# MCP server başlat
mcp-mysql-analyzer

# Kiro IDE için otomatik kurulum
mcp-mysql-analyzer setup

# Konfigürasyonu doğrula
mcp-mysql-analyzer validate

# Çevre değişkenlerini göster
mcp-mysql-analyzer env

# Yardım göster
mcp-mysql-analyzer --help
```

## Kullanım

### Komut Satırı Aracı Olarak

Global kurulum sonrası `mcp-mysql-analyzer` komutunu her yerden kullanabilirsiniz.

```bash
# MCP server başlat (varsayılan)
mcp-mysql-analyzer

# Yardım göster
mcp-mysql-analyzer --help

# Çevre değişkenlerini kontrol et
mcp-mysql-analyzer env

# Platform kurulumu (Kiro IDE)
mcp-mysql-analyzer setup

# Konfigürasyonu doğrula
mcp-mysql-analyzer validate
```

### MCP Server Olarak

Kurulum sonrası her MCP client'ta server otomatik olarak başlar ve şu araçları sağlar:

**Temel Veritabanı İşlemleri:**
- Veritabanlarını listele
- Tabloları listele  
- Tablo şemalarını incele
- DDL ifadelerini al

**Veri Analizi:**
- Tablo profillemesi
- Sayısal sütun analizi
- Değer dağılımları
- Aykırı değer tespiti
- Yinelenen kayıt bulma
- NULL değer raporları

**Churn Analizi:**
- Temel churn analizi
- Kohort analizi
- Hayatta kalma analizi
- MRR churn analizi

### Platform-Specific Kullanım

**Kiro IDE'de:**
```
"MySQL veritabanımdaki tabloları göster"
"Users tablosunun şemasını analiz et"
"Son 30 günde kayıt olan kullanıcıları listele"
```

**Claude Desktop'ta:**
```
"Can you show me the schema of my products table?"
"Analyze the sales data for trends"
"Find duplicate entries in the customers table"
```

**VSCode'da:**
```
"List all tables in the inventory database"
"Show me the top 10 customers by purchase amount"
"Generate a churn analysis for user activity"
```

## Mevcut Araçlar

| Araç | Açıklama |
| --- | --- |
| `connect(params)` | MySQL veritabanına bağlanır. |
| `list_databases()` | Tüm veritabanlarını listeler. |
| `list_tables(params)` | Bir veritabanındaki tüm tabloları listeler. |
| `table_info(params)` | Bir tablo hakkında detaylı bilgi alır. |
| `get_table_ddl(params)` | Bir tablo için `CREATE TABLE` ifadesini alır. |
| `profile_table(params)` | Temel istatistiklerle bir tabloyu profiller. |
| `analyze_numeric_columns(params)` | Bir tablodaki sayısal sütunları analiz eder. |
| `get_value_distribution(params)` | Bir sütun için değer dağılımını alır. |
| `detect_outliers(params)` | Sayısal bir sütundaki aykırı değerleri tespit eder. |
| `find_duplicates(params)` | Sütun kombinasyonuna dayalı yinelenen satırları bulur. |
| `get_null_report(params)` | Bir tablodaki tüm sütunlar için NULL değerlerin raporunu oluşturur. |
| `generate_churn_sql_basic(params)` | Temel aylık churn analizi için SQL oluşturur. |
| `generate_cohort_sql(params)` | Kohort tutma analizi için SQL oluşturur. |
| `generate_survival_sql(params)` | Kaplan-Meier hayatta kalma eğrisi analizi için SQL oluşturur. |
| `generate_mrr_churn_sql(params)` | MRR churn analizi için SQL oluşturur. |
| `suggest_churn_mapping(params)` | Churn analizi için potansiyel kullanıcı ID ve zaman damgası sütunları önerir. |

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır! Lütfen [GitHub repository](https://github.com/MrBozkay/mcp_mysql_analyser)'sinde bir issue açmaktan veya pull request göndermekten çekinmeyin.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.