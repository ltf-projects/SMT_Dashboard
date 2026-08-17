// ---------------------------------------------------------------------------
// 113 numaralı elektrikli aracın MQTT paketlerindeki alanların tek merkezi
// tanımı.
//
// Kaynak topic'ler (mqtt.dtscimnak.com):
//   resJ1939/113    → araç/tahrik/batarya verileri  (bu dosyadaki FIELDS)
//   resLocation/113 → konum verileri                (LOCATION_FIELDS)
//
// Her alan; Türkçe etiketi, birimi, hangi sekmede görüneceği ve nasıl
// çizileceği (radyal gösterge / üst bilgi kartı / durum kutucuğu) ile birlikte
// burada tanımlanır. Arayüzdeki tüm bileşenler ve köprünün veritabanı şeması
// bu dosyayı kaynak alır, yani bir eşiği ya da etiketi değiştirmek için
// yalnızca burası düzenlenir.
// ---------------------------------------------------------------------------

// Gösterge bölgeleri renk değil "seviye" taşır; gerçek renkler CSS'te
// --zone-normal / --zone-warning / --zone-danger değişkenlerinden gelir.
// Böylece tema değiştiğinde bölge renkleri de birlikte güncellenebilir.
export const ZONE_LEGEND = [
  { level: 'normal', label: 'Normal' },
  { level: 'warning', label: 'Uyarı' },
  { level: 'danger', label: 'Tehlike' },
];

// Normal → Uyarı → Tehlike sınırlarını kısa yazmak için yardımcı.
const zones = (normalTo, warningTo, dangerTo) => [
  { to: normalTo, level: 'normal' },
  { to: warningTo, level: 'warning' },
  { to: dangerTo, level: 'danger' },
];

// Tahrik motorları iki yönlü çalışır: ileri sürüşte pozitif, geri vites ve
// rejeneratif frenlemede negatif devir gelir (brokerdaki diğer araçlarda
// -800 d/dk'ya varan değerler görülüyor). Bu yüzden gösterge sıfır ortada
// olacak şekilde simetriktir; her iki uç da tehlike bölgesidir.
const motorZones = (limit, normalTo, warningTo) => [
  { to: -warningTo, level: 'danger' },
  { to: -normalTo, level: 'warning' },
  { to: normalTo, level: 'normal' },
  { to: warningTo, level: 'warning' },
  { to: limit, level: 'danger' },
];

export const CATEGORIES = [
  { id: 'surus', title: 'Sürüş Verileri' },
  { id: 'enerji', title: 'Batarya ve Enerji' },
  { id: 'durum', title: 'Durum Verileri' },
];

// --- Sürüş Verileri: göstergelerin üstündeki özet kartları -----------------
const SURUS_STATS = [
  {
    key: 'Trip_Number_KM',
    tr: 'Yol Sayacı',
    unit: 'km',
    decimals: 0,
    icon: 'road',
    tone: 'amber',
  },
  {
    key: 'Total_working_hours',
    tr: 'Toplam Çalışma Saati',
    unit: 'sa',
    decimals: 2,
    icon: 'clock',
    tone: 'ember',
  },
  {
    // Araçtan gelen yük kanalı. Birimi cihaz tarafında doğrulanmadığı için
    // birim yazılmaz; ham değer olduğu gibi gösterilir.
    key: 'payload_8xxHE',
    tr: 'Yük',
    unit: '',
    decimals: 2,
    icon: 'load',
    tone: 'crimson',
  },
].map((f) => ({ ...f, category: 'surus', kind: 'stat' }));

// --- Sürüş Verileri: radyal göstergeler ------------------------------------
const SURUS_GAUGES = [
  { key: 'Speed_of_vehicle', tr: 'Araç Hızı', unit: 'km/sa', min: 0, max: 120, zones: zones(80, 100, 120) },
  {
    key: 'Main_drive_motor_speed',
    tr: 'Ana Motor Devri',
    unit: 'd/dk',
    min: -3000,
    max: 3000,
    zones: motorZones(3000, 2400, 2700),
    decimals: 0,
  },
  {
    key: 'Auxiliary_drive_motor_speed',
    tr: 'Yardımcı Motor Devri',
    unit: 'd/dk',
    min: -3000,
    max: 3000,
    zones: motorZones(3000, 2400, 2700),
    decimals: 0,
  },
  { key: 'Throttle_depth', tr: 'Gaz Pedalı', unit: '%', min: 0, max: 100, zones: zones(70, 85, 100) },
  { key: 'Braking_depth', tr: 'Fren Pedalı', unit: '%', min: 0, max: 100, zones: zones(70, 85, 100) },
].map((f) => ({ unit: '', decimals: 2, ...f, category: 'surus', kind: 'gauge' }));

// --- Batarya ve Enerji: sayaç kartları -------------------------------------
// Kümülatif sayaçlar (yüz binlerce kWh) göstergeye sığmaz; kart olarak yazılır.
const ENERJI_STATS = [
  {
    key: 'Accumulated_charging_amount_Kwh',
    tr: 'Toplam Şarj Enerjisi',
    unit: 'kWh',
    decimals: 0,
    icon: 'plug',
    tone: 'amber',
  },
  {
    key: 'Accumulated_discharge_amount_Kwh',
    tr: 'Toplam Deşarj Enerjisi',
    unit: 'kWh',
    decimals: 0,
    icon: 'bolt',
    tone: 'crimson',
  },
].map((f) => ({ ...f, category: 'enerji', kind: 'stat' }));

// --- Batarya ve Enerji: radyal gösterge ------------------------------------
const ENERJI_GAUGES = [
  {
    key: 'SOC',
    tr: 'Batarya Doluluk (SOC)',
    unit: '%',
    min: 0,
    max: 100,
    decimals: 1,
    // Bölgeler diğer göstergelerin tersidir: dolu batarya iyi, boş batarya
    // tehlikelidir. Bu yüzden kırmızı solda, yeşil sağda.
    zones: [
      { to: 20, level: 'danger' },
      { to: 40, level: 'warning' },
      { to: 100, level: 'normal' },
    ],
  },
].map((f) => ({ ...f, category: 'enerji', kind: 'gauge' }));

// --- Durum Verileri: kod kartı ---------------------------------------------
// Araç durum kodu 0/1 değil, sayısal bir durum kodudur (gözlemlenen: 2).
// Kodların anlamı cihaz tarafında doğrulanmadığı için etiketlenmez, ham
// değer olduğu gibi gösterilir.
const DURUM_STATS = [
  {
    key: 'Vehicle_status',
    tr: 'Araç Durum Kodu',
    unit: '',
    decimals: 0,
    icon: 'chip',
    tone: 'ember',
  },
].map((f) => ({ ...f, category: 'durum', kind: 'stat' }));

// --- Durum Verileri: dijital kutucuklar ------------------------------------
const DURUM_BOXES = [
  { key: 'Parking_signal', tr: 'Park Sinyali' },
  { key: 'Container_lifting_DW105AE', tr: 'Kasa Kaldırma' },
  { key: 'SOC_high_alarm_DW105AE', tr: 'SOC Yüksek Alarmı' },
].map((f) => ({ ...f, category: 'durum', kind: 'digital', unit: '', decimals: 0 }));

export const FIELDS = [
  ...SURUS_STATS,
  ...SURUS_GAUGES,
  ...ENERJI_STATS,
  ...ENERJI_GAUGES,
  ...DURUM_STATS,
  ...DURUM_BOXES,
];

// --- Konum alanları (resLocation topic'i) ----------------------------------
// Ayrı bir topic'ten geldiği için FIELDS'in dışındadır: sekmelerde gösterge
// olarak çizilmez, Konum sekmesi ve geçmiş tablosu tarafından kullanılır.
export const LOCATION_FIELDS = [
  { key: 'Lat', tr: 'Enlem', unit: '°', decimals: 6 },
  { key: 'Lon', tr: 'Boylam', unit: '°', decimals: 6 },
  { key: 'Altitude', tr: 'Rakım', unit: 'm', decimals: 1 },
  { key: 'Speed', tr: 'GNSS Hızı', unit: 'km/sa', decimals: 2 },
  { key: 'Course', tr: 'Yön', unit: '°', decimals: 1 },
  // GNSS kilidi mantıksal bir alandır; veritabanına 0/1 olarak yazılır.
  { key: 'gnss_is_active', tr: 'GNSS Kilidi', unit: '', decimals: 0 },
].map((f) => ({ ...f, category: 'konum', kind: 'location' }));

// Geçmiş tablosunun sütunları: iki topic'in sayısal alanlarının tamamı.
export const HISTORY_FIELDS = [...FIELDS, ...LOCATION_FIELDS];

// Çizim türüne göre alanları döndürür (yukarıdaki tanım sırası korunur).
// Canlı sayfa kategorilere bölünmez: aynı türden bütün alanlar tek ızgarada
// toplanır. Kategoriler yalnızca Geçmiş Grafik'te ayrı ayrı çizilir.
export function fieldsOfKind(kind) {
  return FIELDS.filter((f) => f.kind === kind);
}
