# 🚀 MCP MySQL Analyzer

[![GitHub Release](https://img.shields.io/github/v/release/MrBozkay/mcp_mysql_analyser?style=for-the-badge&logo=github)](https://github.com/MrBozkay/mcp_mysql_analyser/releases/latest)
[![License](https://img.shields.io/github/license/MrBozkay/mcp_mysql_analyser?style=for-the-badge)](https://github.com/MrBozkay/mcp_mysql_analyser/blob/main/LICENSE)
[![CI Status](https://img.shields.io/github/actions/workflow/status/MrBozkay/mcp_mysql_analyser/ci.yml?style=for-the-badge&logo=github-actions)](https://github.com/MrBozkay/mcp_mysql_analyser/actions)
[![Downloads](https://img.shields.io/github/downloads/MrBozkay/mcp_mysql_analyser/total?style=for-the-badge&logo=download)](https://github.com/MrBozkay/mcp_mysql_analyser/releases)

> **AI ile MySQL veritabanınızla doğal dil kullanarak etkileşim kurun!**

**MCP MySQL Analyzer**, tüm MCP destekleyen AI platformlarda MySQL veritabanlarınızla doğal dil kullanarak etkileşim kurmanızı sağlayan güçlü bir araçtır. Tek satır SQL yazmadan şemaları inceleme, sorgular çalıştırma ve gelişmiş veri analizi yapma imkanı sunar.

## ✨ Öne Çıkan Özellikler

- 🌐 **Evrensel Uyumluluk** - Tüm MCP destekleyen platformlarda çalışır
- 🗣️ **Doğal Dil Desteği** - Türkçe ve İngilizce ile veritabanınızla konuşun
- ⚡ **Tek Komut Kurulum** - Dakikalar içinde hazır
- 🔍 **Akıllı Şema Analizi** - AI'nın veritabanınızı otomatik anlaması
- 📊 **Gelişmiş Analitik** - Churn, kohort, outlier analizi ve daha fazlası
- 🛡️ **Güvenli Bağlantı** - SSL desteği ve güvenli kimlik doğrulama
- 🎯 **Auto-Approve** - Güvenli işlemler için otomatik onay

## 🚀 Hızlı Başlangıç

### 📦 Kurulum

**Önerilen Yöntem - GitHub'tan Direkt:**

```bash
# 1. Projeyi klonlayın
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser

# 2. Otomatik kurulum
# Windows (PowerShell)
.\install-global.ps1

# Linux/Mac (Bash)
chmod +x install-global.sh && ./install-global.sh
```

**Alternatif - Tarball Kurulumu:**

```bash
npm install -g https://github.com/MrBozkay/mcp_mysql_analyser/archive/v1.1.1.tar.gz
```

### ⚙️ Hızlı Konfigürasyon

```bash
# Otomatik kurulum (Kiro IDE için)
mcp-mysql-analyzer setup

# Konfigürasyonu doğrula
mcp-mysql-analyzer validate

# Çevre değişkenlerini kontrol et
mcp-mysql-analyzer env
```

## 🎯 Desteklenen Platformlar

| Platform | Durum | Kurulum |
|----------|-------|---------|
| 🎯 **Kiro IDE** | ✅ Tam Destek | `mcp-mysql-analyzer setup` |
| 🤖 **Claude Desktop** | ✅ Tam Destek | Manuel konfigürasyon |
| 💻 **VSCode** | ✅ MCP Uzantısı | settings.json |
| ✨ **Cursor IDE** | ✅ Tam Destek | mcp.json |
| 🔍 **Google Gemini** | ✅ MCP Desteği | Gemini konfigürasyonu |
| 📱 **Diğer MCP Clients** | ✅ Evrensel | Standart MCP protokolü |

## 💬 Kullanım Örnekleri

### Türkçe Komutlar
```
"Veritabanımdaki tüm tabloları listele"
"Users tablosunun şemasını detaylı göster"
"Son 30 günde en çok satılan ürünleri analiz et"
"Müşteri churn oranını hesapla ve grafikle göster"
"Orders tablosunda yinelenen kayıtları bul"
```

### English Commands
```
"Show me all tables in my database"
"Analyze the schema of the products table"
"Find outliers in the sales_amount column"
"Generate a cohort analysis for user retention"
"Create a churn analysis for the last quarter"
```

## 📋 İçindekiler

- [Kurulum Detayları](#-kurulum-detayları)
- [Platform Konfigürasyonları](#-platform-konfigürasyonları)
- [Çevre Değişkenleri](#-çevre-değişkenleri)
- [Mevcut Araçlar](#-mevcut-araçlar)
- [Gelişmiş Kullanım](#-gelişmiş-kullanım)
- [Sorun Giderme](#-sorun-giderme)
- [Katkıda Bulunma](#-katkıda-bulunma)

## 🔧 Kurulum Detayları

### Sistem Gereksinimleri

- **Node.js** 18.x veya üzeri
- **MySQL** 5.7+ veya 8.0+
- **NPM** 8.x veya üzeri
- **İşletim Sistemi:** Windows, macOS, Linux

### Kurulum Seçenekleri

#### 1️⃣ GitHub Otomatik Kurulum (Önerilen)

```bash
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser

# Windows
.\install-global.ps1

# Linux/Mac
chmod +x install-global.sh && ./install-global.sh
```

Bu kurulum:
- ✅ Tüm bağımlılıkları kurar
- ✅ TypeScript'i derler
- ✅ Global komut oluşturur
- ✅ Tüm platformlar için hazırlar

#### 2️⃣ NPM Direkt Kurulum

```bash
# Gelecekte mevcut olacak
npm install -g @mrbozkay/mcp_mysql_analyser
```

#### 3️⃣ Manuel Kurulum

```bash
git clone https://github.com/MrBozkay/mcp_mysql_analyser.git
cd mcp_mysql_analyser
npm install
npm run build
npm pack
npm install -g ./mrbozkay-mcp_mysql_analyser-*.tgz
```

### Kurulum Doğrulama

```bash
# Komutun çalıştığını kontrol edin
mcp-mysql-analyzer --help

# Sürüm bilgisini görün
mcp-mysql-analyzer --version

# Çevre değişkenlerini kontrol edin
mcp-mysql-analyzer env
```

## 🔧 Platform Konfigürasyonları

### 🎯 Kiro IDE (Önerilen)

**Otomatik Kurulum:**
```bash
mcp-mysql-analyzer setup
```

**Manuel Konfigürasyon:**
`.kiro/settings/mcp.json` dosyasını oluşturun:

```json
{
  "mcpServers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DB": "your_database"
      },
      "autoApprove": [
        "connect", "list_databases", "list_tables", 
        "table_info", "get_table_ddl", "profile_table",
        "analyze_numeric_columns", "get_value_distribution"
      ]
    }
  }
}
```

### 🤖 Claude Desktop

**Konfigürasyon Dosyası:** `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DB": "your_database"
      }
    }
  }
}
```

**Dosya Konumları:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### 💻 VSCode

**Gereksinimler:** MCP uzantısını kurun

**Konfigürasyon:** `settings.json`'a ekleyin:

```json
{
  "mcp.servers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DB": "your_database"
      }
    }
  }
}
```

### ✨ Cursor IDE

**Konfigürasyon Dosyası:** `mcp.json`

```json
{
  "mcpServers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DB": "your_database"
      }
    }
  }
}
```

### 🔍 Google Gemini

**Konfigürasyon:**

```json
{
  "servers": {
    "mysql-analyzer": {
      "command": "mcp-mysql-analyzer",
      "args": ["server"],
      "environment": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DB": "your_database"
      }
    }
  }
}
```

### 📱 Diğer MCP Clients

Herhangi bir MCP protokolünü destekleyen client için standart konfigürasyon:

```json
{
  "command": "mcp-mysql-analyzer",
  "args": ["server"],
  "env": {
    "MYSQL_HOST": "localhost",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "your_username",
    "MYSQL_PASSWORD": "your_password",
    "MYSQL_DB": "your_database"
  }
}
```

## ⚙️ Çevre Değişkenleri

### Temel Konfigürasyon

| Değişken | Açıklama | Varsayılan | Zorunlu |
|----------|----------|------------|---------|
| `MYSQL_HOST` | MySQL sunucu adresi | `localhost` | ✅ |
| `MYSQL_PORT` | MySQL port numarası | `3306` | ❌ |
| `MYSQL_USER` | MySQL kullanıcı adı | `root` | ✅ |
| `MYSQL_PASSWORD` | MySQL şifresi | `''` | ❌ |
| `MYSQL_DB` | Varsayılan veritabanı | `null` | ❌ |
| `MYSQL_SSL` | SSL bağlantısı | `false` | ❌ |

### Gelişmiş Ayarlar

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `MYSQL_CONNECTION_LIMIT` | Maksimum bağlantı sayısı | `5` |
| `DEFAULT_SAMPLE_LIMIT` | Varsayılan örnek limiti | `10000` |
| `DEFAULT_QUERY_TIMEOUT` | Sorgu timeout (ms) | `15000` |

### Çevre Değişkenlerini Ayarlama

**Windows (PowerShell):**
```powershell
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_USER="your_username"
$env:MYSQL_PASSWORD="your_password"
$env:MYSQL_DB="your_database"
$env:MYSQL_SSL="false"
```

**Linux/Mac (Bash):**
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password
export MYSQL_DB=your_database
export MYSQL_SSL=false
```

**Kalıcı Ayarlar (.env dosyası):**
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DB=your_database
MYSQL_SSL=false
```

## 🛠️ Mevcut Araçlar

### 🔍 Şema ve Yapı Analizi

| Araç | Açıklama | Kullanım |
|------|----------|----------|
| `connect` | MySQL veritabanına bağlanır | Bağlantı testi |
| `list_databases` | Tüm veritabanlarını listeler | "Veritabanlarını listele" |
| `list_tables` | Tablolarını listeler | "Tabloları göster" |
| `table_info` | Tablo detaylarını gösterir | "Users tablosunun şemasını göster" |
| `get_table_ddl` | CREATE TABLE ifadesini alır | "Tablo yapısını göster" |

### 📊 Veri Analizi

| Araç | Açıklama | Kullanım |
|------|----------|----------|
| `profile_table` | Tablo profillemesi yapar | "Tabloyu analiz et" |
| `analyze_numeric_columns` | Sayısal sütunları analiz eder | "Sayısal verileri analiz et" |
| `get_value_distribution` | Değer dağılımını gösterir | "Kategori dağılımını göster" |
| `detect_outliers` | Aykırı değerleri bulur | "Outlier'ları tespit et" |
| `find_duplicates` | Yinelenen kayıtları bulur | "Duplicate kayıtları bul" |
| `get_null_report` | NULL değer raporunu oluşturur | "Eksik verileri analiz et" |

### 📈 Churn ve Kohort Analizi

| Araç | Açıklama | Kullanım |
|------|----------|----------|
| `generate_churn_sql_basic` | Temel churn analizi | "Müşteri kaybını analiz et" |
| `generate_cohort_sql` | Kohort analizi | "Kullanıcı tutma oranını hesapla" |
| `generate_survival_sql` | Hayatta kalma analizi | "Survival analizi yap" |
| `generate_mrr_churn_sql` | MRR churn analizi | "Gelir kaybını analiz et" |
| `suggest_churn_mapping` | Churn için sütun önerileri | "Churn analizi için uygun sütunları öner" |

## 🚀 Gelişmiş Kullanım

### Global Komutlar

```bash
# MCP server başlat (varsayılan)
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

### Platform-Specific Kullanım Örnekleri

#### Kiro IDE'de
```
"MySQL veritabanımdaki tabloları göster"
"Users tablosunun şemasını analiz et"
"Son 30 günde kayıt olan kullanıcıları listele"
"Orders tablosunda outlier'ları bul"
```

#### Claude Desktop'ta
```
"Can you show me the schema of my products table?"
"Analyze the sales data for trends"
"Find duplicate entries in the customers table"
"Generate a churn analysis for the last quarter"
```

#### VSCode'da
```
"List all tables in the inventory database"
"Show me the top 10 customers by purchase amount"
"Create a cohort analysis for user retention"
"Detect anomalies in the transaction amounts"
```

### Güvenlik ve Auto-Approve

Güvenli işlemler için auto-approve listesi:

```json
"autoApprove": [
  "connect",
  "list_databases", 
  "list_tables",
  "table_info",
  "get_table_ddl",
  "profile_table",
  "analyze_numeric_columns",
  "get_value_distribution",
  "get_null_report"
]
```

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### Bağlantı Sorunları
```bash
# Bağlantıyı test edin
mcp-mysql-analyzer env

# MySQL servisinin çalıştığını kontrol edin
mysql -h localhost -u your_username -p
```

#### Komut Bulunamadı
```bash
# Global kurulumu kontrol edin
npm list -g @mrbozkay/mcp_mysql_analyser

# PATH'i kontrol edin
echo $PATH  # Linux/Mac
echo $env:PATH  # Windows
```

#### Konfigürasyon Sorunları
```bash
# Konfigürasyonu doğrulayın
mcp-mysql-analyzer validate

# Kiro IDE için yeniden kurulum
mcp-mysql-analyzer setup --force
```

### Debug Modu

```bash
# Detaylı log ile çalıştırın
DEBUG=* mcp-mysql-analyzer

# Sadece MCP logları
DEBUG=mcp:* mcp-mysql-analyzer
```

### Performans Optimizasyonu

```bash
# Bağlantı limitini artırın
export MYSQL_CONNECTION_LIMIT=10

# Timeout süresini ayarlayın
export DEFAULT_QUERY_TIMEOUT=30000

# Örnek limitini azaltın
export DEFAULT_SAMPLE_LIMIT=1000
```

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! İşte nasıl katkıda bulunabileceğiniz:

### 🐛 Hata Bildirimi

1. [GitHub Issues](https://github.com/MrBozkay/mcp_mysql_analyser/issues) sayfasını ziyaret edin
2. Mevcut issue'ları kontrol edin
3. Yeni bir issue oluşturun ve şunları ekleyin:
   - Hatanın detaylı açıklaması
   - Yeniden üretme adımları
   - Sistem bilgileri (OS, Node.js versiyonu)
   - Hata logları

### 💡 Özellik Önerisi

1. [Discussions](https://github.com/MrBozkay/mcp_mysql_analyser/discussions) bölümünde önerinizi paylaşın
2. Özelliğin faydalarını açıklayın
3. Mümkünse kullanım senaryoları ekleyin

### 🔧 Kod Katkısı

1. Repository'yi fork edin
2. Feature branch oluşturun: `git checkout -b feature/amazing-feature`
3. Değişikliklerinizi commit edin: `git commit -m 'Add amazing feature'`
4. Branch'inizi push edin: `git push origin feature/amazing-feature`
5. Pull Request oluşturun

### 📝 Dokümantasyon

- README iyileştirmeleri
- Kod yorumları
- Kullanım örnekleri
- Çeviri katkıları

### 🧪 Test Katkısı

- Yeni test senaryoları
- Property-based test iyileştirmeleri
- Platform uyumluluğu testleri

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Model Context Protocol](https://modelcontextprotocol.io/) ekibine protokol için
- [MySQL](https://mysql.com/) ekibine güçlü veritabanı için
- [TypeScript](https://typescriptlang.org/) ekibine tip güvenliği için
- Tüm katkıda bulunanlara ve kullanıcılara

## 📞 İletişim

- **GitHub:** [MrBozkay](https://github.com/MrBozkay)
- **Issues:** [GitHub Issues](https://github.com/MrBozkay/mcp_mysql_analyser/issues)
- **Discussions:** [GitHub Discussions](https://github.com/MrBozkay/mcp_mysql_analyser/discussions)

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

[![GitHub stars](https://img.shields.io/github/stars/MrBozkay/mcp_mysql_analyser?style=social)](https://github.com/MrBozkay/mcp_mysql_analyser/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/MrBozkay/mcp_mysql_analyser?style=social)](https://github.com/MrBozkay/mcp_mysql_analyser/network/members)

</div>