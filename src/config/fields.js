// 36 numaralı dizel makinenin resJ1939/36 paketindeki alanların tek kaynağı.
// Arayüz, geçmiş grafikleri ve PostgreSQL sütunları bu listeden türetilir.

export const ZONE_LEGEND = [
  { level: 'normal', label: 'Normal' },
  { level: 'warning', label: 'Uyarı' },
  { level: 'danger', label: 'Tehlike' },
];

const zones = (normalTo, warningTo, dangerTo) => [
  { to: normalTo, level: 'normal' },
  { to: warningTo, level: 'warning' },
  { to: dangerTo, level: 'danger' },
];

export const CATEGORIES = [
  { id: 'motor', title: 'Motor Verileri' },
  { id: 'yakit', title: 'Yakıt ve Çalışma' },
];

const STATS = [
  { key: 'EngTotalRevolutions', tr: 'Toplam Devir', unit: '', decimals: 2, icon: 'chip', tone: 'amber', category: 'motor' },
  { key: 'EngTotalFuelUsed', tr: 'Toplam Harcanan Yakıt', unit: 'L', decimals: 1, icon: 'fuel', tone: 'crimson', category: 'yakit' },
  { key: 'EngTotalHoursOfOperations', tr: 'Toplam Çalışma Saati', unit: 'sa', decimals: 1, icon: 'clock', tone: 'ember', category: 'motor' },
].map((f) => ({ ...f, kind: 'stat' }));

const GAUGES = [
  { key: 'EngSpeed', tr: 'Motor Hızı', unit: 'd/dk', min: 0, max: 2500, decimals: 0, zones: zones(1800, 2200, 2500), category: 'motor' },
  { key: 'EngCoolantTemp', tr: 'Hararet', unit: '°C', min: 0, max: 120, decimals: 0, zones: zones(95, 105, 120), category: 'motor' },
  { key: 'ActualEngPercentTorque', tr: 'Motor Tork Yükü', unit: '%', min: 0, max: 125, decimals: 0, zones: zones(80, 100, 125), category: 'motor' },
  {
    key: 'EngOilPress', tr: 'Motor Yağ Basıncı', unit: 'kPa', min: 0, max: 1000, decimals: 0, category: 'motor',
    zones: [
      { to: 100, level: 'danger' }, { to: 200, level: 'warning' },
      { to: 600, level: 'normal' }, { to: 800, level: 'warning' },
      { to: 1000, level: 'danger' },
    ],
  },
  {
    key: 'Keyswitch_BatPot', tr: 'Akü Voltajı', unit: 'V', min: 0, max: 36, decimals: 1, category: 'motor',
    zones: [
      { to: 22, level: 'danger' }, { to: 24, level: 'warning' },
      { to: 30, level: 'normal' }, { to: 32, level: 'warning' },
      { to: 36, level: 'danger' },
    ],
  },
  { key: 'EngFuelRate', tr: 'Yakıt Tüketim Hızı', unit: 'L/sa', min: 0, max: 100, decimals: 1, zones: zones(50, 75, 100), category: 'yakit' },
].map((f) => ({ ...f, kind: 'gauge', tickDecimals: 0 }));

export const FIELDS = [...STATS, ...GAUGES];
export const HISTORY_FIELDS = FIELDS;

export function fieldsOfKind(kind) {
  return FIELDS.filter((f) => f.kind === kind);
}
