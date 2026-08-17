# SMT Dashboard

MQTT yayınından **113 numaralı elektrikli aracın** verilerini canlı izleyen
arayüz. Bir Node.js köprüsü broker'a bağlanır, React arayüz Socket.IO üzerinden
veriyi alır.

```
Broker (mqtts://mqtt.dtscimnak.com:8883)
        │  resJ1939/113     → araç, tahrik, batarya, durum
        │  resLocation/113  → GNSS konumu
        ▼
   server.js  ──►  Socket.IO  (resData / resLocation)
        ▼
   React arayüz (Vite, :5174)
```

Her araç broker'da **kendi topic dalına** yayın yapar; payload'ın içinde araç
kimliği yoktur, ayrım topic yolundaki numarayla olur. Başka bir aracı izlemek
için `.env` içindeki `VEHICLE_ID` değiştirilir — ancak alan adları araç tipine
göre farklıdır (dizel araçlar `EngSpeed`, `HydTemp` gibi bambaşka bir paket
yayınlar), bu yüzden farklı tipte bir araca geçerken
[`src/config/fields.js`](src/config/fields.js) de güncellenmelidir.

## Kurulum

```bash
npm install
```

`.env.example` dosyasını `.env` olarak kopyalayıp broker bilgilerini girin.

## Çalıştırma

```bash
npm run dev
```

- Köprü sunucusu: `http://localhost:4001` (sağlık kontrolü: `/health`)
- Arayüz: `http://localhost:5174`

Yalnızca birini çalıştırmak için `npm run server` / `npm run ui`.

## Canlıya alma

İki parça ayrı yerlerde barındırılır:

| Parça | Nerede | Neden |
| --- | --- | --- |
| Köprü (`server.js`) | **Railway** | MQTT ve WebSocket bağlantısını sürekli açık tutması gerekir; serverless ortamlarda çalışmaz |
| Arayüz (`dist/`) | **Vercel** | Derlenmiş statik dosyalar, CDN'den dağıtılır |

Yapılandırma dosyaları depoda hazırdır: [`railway.json`](railway.json) köprüyü
`node server.js` ile başlatır ve `/health` ucundan sağlık kontrolü yapar;
[`vercel.json`](vercel.json) arayüzü `vite build` ile derleyip `dist/` klasörünü
yayınlar.

### 1. Köprü — Railway

Railway panelinde depodan yeni bir servis oluşturulur ve **Variables** sekmesine
şu değişkenler girilir (değerler yerel `.env` dosyasındakilerle aynıdır):

```
MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD,
MQTT_TLS, MQTT_REJECT_UNAUTHORIZED, VEHICLE_ID,
DATABASE_URL, DATABASE_SSL, HISTORY_SAMPLE_MS,
ALLOWED_ORIGIN
```

`PORT` değişkenini Railway kendisi enjekte eder, elle girilmez. `ALLOWED_ORIGIN`
arayüzün adresidir (2. adımdan sonra netleşir); virgülle birden fazla adres
verilebilir. Servise **Settings → Networking → Generate Domain** ile genel bir
adres verilir; `https://<ad>.up.railway.app/health` çağrısı `connected: true`
ve `history.ready: true` dönüyorsa köprü ayaktadır.

### 2. Arayüz — Vercel

Aynı depo Vercel'e bağlanır; framework `vite` olarak algılanır. Tek bir ortam
değişkeni gerekir:

```
VITE_BRIDGE_URL=https://<ad>.up.railway.app
```

Bu değer **derleme anında** pakete gömülür — sonradan değiştirilirse yeniden
deploy almak gerekir. Tanımlanmazsa arayüz `localhost:4001` adresine bağlanmaya
çalışır ve tarayıcı konsoluna bunu açıkça yazar.

### 3. İki adresi birbirine tanıtma

Vercel adresi belli olunca Railway'deki `ALLOWED_ORIGIN` değişkeni o adrese
çekilir (örn. `https://smt-dashboard.vercel.app`). Vercel'in her dalda ürettiği
**önizleme adresleri farklıdır**; önizlemelerin de veri görmesi isteniyorsa o
adresler `ALLOWED_ORIGIN`'e virgülle eklenir.

## Sekmeler

| Sekme | İçerik |
| --- | --- |
| **Sürüş Verileri** | Yol Sayacı / Çalışma Saati / Yük kartları + hız, tahrik motorları, gaz ve fren göstergeleri |
| **Batarya ve Enerji** | Toplam şarj/deşarj kartları + SOC göstergesi |
| **Durum Verileri** | Araç durum kodu + park, kasa kaldırma, SOC alarmı kutucukları |
| **Geçmiş Grafik** | Tarih aralığı seçip alanların zaman serisini çizer |
| **Konum** | `resLocation` → Google Hybrid harita, rakım/hız/yön/GNSS kilidi |

## Geçmiş Grafik

Köprü, gelen paketlerden en fazla `HISTORY_SAMPLE_MS` (varsayılan 5 sn) aralıkla
örnek alıp **PostgreSQL**'e yazar. Arayüz bu geçmişi
`GET /history?from=&to=&keys=&points=` ucundan çeker; sonuç grafik için ~1200
noktaya seyreltilir ve veri akışının kesildiği aralıklarda çizgi kopar.

Kayıt tarayıcıdan bağımsızdır: yazan taraf MQTT'ye abone olan köprü sürecidir,
**sayfa hiç açılmasa da** köprü ayakta olduğu sürece kayıt sürer.

### Kurulum

`.env` içine bağlantı adresini yazmak yeterlidir:

```
DATABASE_URL=postgres://kullanici:sifre@localhost:5432/smt
```

`arac_ornekleri` tablosu ve alan sütunları köprü açılışında otomatik
oluşturulur; elle SQL çalıştırmak gerekmez. `src/config/fields.js` dosyasına
yeni bir alan eklenirse, köprü yeniden başlatıldığında sütun da eklenir.
Şemanın okunabilir hâli: [`sql/schema.sql`](sql/schema.sql).

| Sütun | Tip |
| --- | --- |
| `zaman` | `TIMESTAMPTZ` |
| `arac_id` | `INTEGER` |
| `Speed_of_vehicle` … `SOC_high_alarm_DW105AE` | `DOUBLE PRECISION` |
| `Lat` / `Lon` / `Altitude` / `Speed` / `Course` / `gnss_is_active` | `DOUBLE PRECISION` |

Birincil anahtar `(arac_id, zaman)` — hem tekilliği sağlar hem de aralık
sorgularının kullandığı indekstir.

Bir satır **iki topic'in birleşimidir**: yazmayı `resJ1939` paketi tetikler,
konum sütunları en son görülen `resLocation` paketinden doldurulur. İki akış
aynı hızda gelmediği için "aynı anda geldiler" varsayımı yapılmaz.

> Önceki sondaj makinesi sürümünün `sondaj_ornekleri` tablosu bu araçla ilgisiz
> sütunlar taşıdığı için artık kullanılmıyor. Eski kayıtlar korunsun diye
> silinmedi; istenirse elle `DROP TABLE` edilebilir.

`DATABASE_URL` boş bırakılırsa geçmiş kaydı kapanır; canlı izleme (MQTT →
Socket.IO) veritabanından bağımsız çalışmaya devam eder ve Geçmiş Grafik sekmesi
durumu açıkça bildirir. Veritabanı sonradan erişilemez hale gelirse de köprü
çökmez, yalnızca geçmiş kaydı durur.

Kayıtlar **süresiz** saklanır: köprü hiçbir zaman eski satırları silmez.

## Veri kesintisi

Araçtan **15 saniye** boyunca yeni paket gelmezse arayüz tüm değerleri
`Veri Yok` olarak gösterir ve üst bardaki **Araç Durumu** rozeti `Pasif`e döner.
Veri yeniden akmaya başladığında sayfa yenilemeden normale döner. Süre
`src/App.jsx` içindeki `STALE_MS` sabitiyle değiştirilir.

## Tema

Üst bardaki görünüm düğmesine tıklanınca altında üç seçenek açılır; düğme o an
seçili modun ikonunu taşır. Seçim tarayıcıda saklanır ve sayfa açılışında
boyanmadan önce uygulanır.

| Mod | id | Davranış |
| --- | --- | --- |
| Sistem | `system` | Cihazın `prefers-color-scheme` ayarını izler |
| Koyu (varsayılan) | `dark` | Nötr gri zemin, amber vurgu |
| Açık | `light` | Beyaz zemin, lacivert vurgu |

`system` bir palet değil, bir tercihtir: `<html data-theme>` özniteliğine her
zaman çözümlenmiş palet (`dark` ya da `light`) yazılır, böylece CSS tarafında
ek bir kural gerekmez. Sistem modundayken işletim sistemi ayarı değişirse
arayüz sayfa yenilemeden birlikte değişir.

**Açık** tek aydınlık temadır. Koyu temada doğal olan bazı değerlerin
(beyaz alfa dolgular, ağır gölgeler, açık ton bölge renkleri) beyaz üzerinde
karşılığı yoktur; bu yüzden `--gauge-track`, `--neutral-*`, `--shadow-*`,
`--zone-*` ve `--ok`/`--off` bu temada ayrıca ezilir. Renkler beyaz zeminde
WCAG AA (4.5:1) eşiğini geçecek şekilde seçilmiştir.

Mod listesi ve varsayılan iki yerde geçer, **birlikte güncellenmelidir**:
[`src/config/themes.js`](src/config/themes.js) ve `index.html` içindeki açılış
script'i. Tanınmayan bir kayıt (örn. kaldırılmış bir mod) yok sayılır,
varsayılana düşülür.

Arayüzdeki **her renk** `src/styles.css` başındaki CSS değişkenlerinden gelir;
bir paleti değiştirmek için ilgili `:root[data-theme='<id>']` bloğunu düzenlemek
yeterlidir.

Bilinçli olarak temadan bağımsız tutulanlar:

- **Gösterge bölgeleri** (yeşil/sarı/kırmızı): renk değil anlam taşır —
  Normal / Uyarı / Tehlike. Yine de bir tema gerekirse `--zone-*`
  değişkenlerini ezebilir (Açık tema bunu kontrast için yapar).
- **Amblem yedeği** (`.seal-*`): marka kimliği.
- **Harita işaretçisinin beyaz çerçevesi**: uydu görüntüsünde kontrast için.

## Marka

Üst barda amblem yoktur; yalnızca iki satır yazı durur (**SMT** ve alt başlık).
İkisi de [`src/components/Logo.jsx`](src/components/Logo.jsx) içindedir.

## Alan tanımları

Etiketler, birimler, gösterge aralıkları ve Normal/Uyarı/Tehlike eşiklerinin
tamamı tek dosyada: [`src/config/fields.js`](src/config/fields.js). Bir eşiği
veya ismi değiştirmek için yalnızca bu dosya düzenlenir.

### Alan eşleştirmesi

`resJ1939/113` paketindeki 15 alanın tamamı kullanılır:

| Alan | Gösterim |
| --- | --- |
| `Speed_of_vehicle` | Araç Hızı (gösterge, 0–120 km/sa) |
| `Main_drive_motor_speed` | Ana Motor Devri (gösterge, ±3000 d/dk) |
| `Auxiliary_drive_motor_speed` | Yardımcı Motor Devri (gösterge, ±3000 d/dk) |
| `Throttle_depth` | Gaz Pedalı (gösterge, %) |
| `Braking_depth` | Fren Pedalı (gösterge, %) |
| `Trip_Number_KM` | Yol Sayacı (kart) |
| `Total_working_hours` | Toplam Çalışma Saati (kart) |
| `payload_8xxHE` | Yük (kart) |
| `Accumulated_charging_amount_Kwh` | Toplam Şarj Enerjisi (kart) |
| `Accumulated_discharge_amount_Kwh` | Toplam Deşarj Enerjisi (kart) |
| `SOC` | Batarya Doluluk (gösterge, ters bölgeli) |
| `Vehicle_status` | Araç Durum Kodu (kart) |
| `Parking_signal` | Park Sinyali (kutucuk) |
| `Container_lifting_DW105AE` | Kasa Kaldırma (kutucuk) |
| `SOC_high_alarm_DW105AE` | SOC Yüksek Alarmı (kutucuk) |

Bilinçli tercihler:

- **Tahrik motoru göstergeleri simetriktir** (−3000…+3000, sıfır ortada):
  motorlar geri viteste ve rejeneratif frenlemede negatif devir yayınlar.
- **SOC'un bölgeleri terstir** — kırmızı solda, yeşil sağda: boş batarya
  tehlikelidir, dolu batarya değil.
- **`Vehicle_status` sayısal bir durum kodudur**, 0/1 değil. Kodların anlamı
  cihaz tarafında doğrulanmadığı için etiketlenmez, ham değer gösterilir.
  `payload_8xxHE` de aynı sebeple birimsizdir.

### Diğer topic'ler

Araç bu iki topic dışında `resStatus/113` (cihazın CPU/bellek/disk/sinyal
sağlığı), `resJ1939DTC/113` (arıza kodları), `resISO9141/113` ve
`resISO15765/113` (OBD kanalları — 113'te tüm alanlar sıfır) yayınlar. Arayüz
şu an bunları kullanmıyor.
