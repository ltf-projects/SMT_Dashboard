# SMT Dashboard

MQTT yayınından **36 numaralı dizel makinenin** motor, yakıt ve konum
verilerini canlı izleyen React arayüzü. Node.js köprüsü MQTT broker'a bağlanır,
veriyi Socket.IO ile arayüze iletir ve seçili motor alanlarını PostgreSQL'e
kaydeder.

```text
resJ1939/36   ─┐
               ├─ server.js ─ Socket.IO ─ React
resLocation/36 ┘      └────── PostgreSQL
```

## Kurulum ve çalıştırma

```bash
npm install
npm run dev
```

- Köprü: `http://localhost:4001`
- Sağlık kontrolü: `http://localhost:4001/health`
- Arayüz: `http://localhost:5174`

Ortam değişkenleri için `.env.example` dosyasını temel alın. Ana ayarlar:

- `VEHICLE_ID=36`
- `DATABASE_URL`: PostgreSQL bağlantısı; boşsa geçmiş kapalıdır.
- `HISTORY_SAMPLE_MS`: geçmiş örnekleme aralığı, varsayılan 5000 ms.
- `VITE_BRIDGE_URL`: production arayüzünün bağlanacağı köprü adresi.
- `ALLOWED_ORIGIN`: köprüye erişebilecek arayüz origin'leri.

## Gösterilen motor alanları

| MQTT alanı | Arayüz |
| --- | --- |
| `EngTotalRevolutions` | Toplam Devir |
| `EngTotalFuelUsed` | Toplam Harcanan Yakıt |
| `EngTotalHoursOfOperations` | Toplam Çalışma Saati |
| `EngSpeed` | Motor Hızı |
| `EngCoolantTemp` | Hararet |
| `ActualEngPercentTorque` | Motor Tork Yükü |
| `EngOilPress` | Motor Yağ Basıncı |
| `Keyswitch_BatPot` | Akü Voltajı |
| `EngFuelRate` | Yakıt Tüketim Hızı |

Etiketler, birimler, gösterge aralıkları ve alarm bölgeleri
`src/config/fields.js` dosyasından yönetilir. Bu dosya aynı zamanda geçmiş
tablosundaki alan sütunlarının kaynağıdır.

Araçtan 15 saniye veri gelmezse değerler `Veri Yok`, makine durumu `Pasif`
gösterilir. Konum verisi `resLocation/36` üzerinden ayrı izlenir.

## Geçmiş veritabanı

Köprü açılışında eski elektrikli araç tablosu `arac_ornekleri` kaldırılır ve
`makine_ornekleri` oluşturulur. Geçmiş yalnızca yukarıdaki dokuz dizel motor
alanını içerir. Kayıtlar `(arac_id, zaman)` birincil anahtarıyla saklanır ve
`GET /history` üzerinden okunur.

> `arac_ornekleri` içindeki eski kayıtlar migration çalıştığında kalıcı olarak
> silinir.

## Canlıya alma

- Köprü Railway üzerinde `node server.js` ile çalışır (`railway.json`).
- Arayüz Vercel üzerinde Vite ile derlenir (`vercel.json`).
- Railway değişkenlerinde `VEHICLE_ID=36`, Vercel değişkenlerinde
  `VITE_BRIDGE_URL=<Railway adresi>` bulunmalıdır.
