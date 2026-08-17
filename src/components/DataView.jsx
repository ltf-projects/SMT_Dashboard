import { useMemo, useState } from 'react';
import { ZONE_LEGEND, fieldsOfKind } from '../config/fields.js';
import Gauge from './Gauge.jsx';
import StatCard from './StatCard.jsx';
import DigitalCard from './DigitalCard.jsx';
import HistoryView from './HistoryView.jsx';

// Canlı veriler tek sayfada toplanır: üç kategori ayrı sekme değil, aynı
// sayfada birbirini izleyen üç bölümdür. Geçmiş ise ayrı sekme kalır — o,
// gelen paketi değil köprüdeki /history ucundan kendi verisini çizer ve kendi
// tarih denetimlerini taşır.
const LIVE_ID = 'canli';
const HISTORY_ID = 'gecmis';

const TABS = [
  { id: LIVE_ID, title: 'Canlı Veriler' },
  { id: HISTORY_ID, title: 'Geçmiş Grafik' },
];

// Arama için metni normalleştirir: Türkçe büyük/küçük harf kuralları (I→ı,
// İ→i) uygulanır, ardından aksanlı harfler ASCII karşılığına indirgenir.
// Böylece "sicakl" yazınca "Sıcaklık", "yag" yazınca "Yağlama" da bulunur.
const TR_MAP = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u' };

function normalizeTr(text) {
  return String(text)
    .toLocaleLowerCase('tr')
    .replace(/[ığüşöçâîû]/g, (c) => TR_MAP[c] || c);
}

// Sayfanın çizim sırası: yazıyla okunan kutular (özet kartları ve durum
// kutucukları) üstte toplanır, radyal göstergeler en altta gelir. Kategori
// ayrımı yoktur — aynı türden bütün alanlar tek bir ızgarada birleşir.
const SECTION_ORDER = ['stat', 'digital', 'gauge'];

export default function DataView({ packet, topic, vehicleId, stale = false }) {
  const [activeTab, setActiveTab] = useState(LIVE_ID);
  const [search, setSearch] = useState('');

  const value = packet?.value;
  const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value);

  const isHistory = activeTab === HISTORY_ID;
  const livePacket = packet;
  const receivedAt = livePacket?.receivedAt;
  const viewStale = stale;

  const query = normalizeTr(search.trim());

  // Sayfadaki üç ızgara. Arama hepsini birden süzer; boş kalan ızgara çizilmez.
  const sections = useMemo(() => {
    const matches = (key, tr) =>
      !query || normalizeTr(tr).includes(query) || normalizeTr(String(key)).includes(query);
    const read = (key) => (key && isPlainObject ? value[key] : undefined);
    const asNumber = (v) => (typeof v === 'number' ? v : v == null ? undefined : Number(v));

    return SECTION_ORDER.map((kind) => ({
      kind,
      items: fieldsOfKind(kind)
        .filter((f) => matches(f.key, f.tr))
        // Dijital kutucuk ham değeri kendi yorumlar; diğerleri sayı bekler.
        .map((f) => ({
          ...f,
          current: kind === 'digital' ? read(f.key) : asNumber(read(f.key)),
        })),
    })).filter((s) => s.items.length > 0);
  }, [query, value, isPlainObject]);

  // Bölge açıklaması gösterge ızgarasının üstünde bir kez durur.
  const legendItems = sections
    .filter((s) => s.kind === 'gauge')
    .flatMap((s) => s.items);

  const isEmpty = sections.length === 0;

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2 className="view-title">Araç Verileri</h2>
          <p className={`view-sub ${viewStale ? 'view-sub--stale' : ''}`}>
            {!livePacket
              ? 'Araçtan henüz paket alınmadı'
              : viewStale
                ? `Veri akışı durdu — son paket: ${formatTime(receivedAt)}`
                : `Son güncelleme: ${formatTime(receivedAt)}`}
          </p>
        </div>
      </div>

      <div className="subtabs-row">
        <nav className="subtabs" role="tablist" aria-label="Görünüm seçimi">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`subtab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.title}
            </button>
          ))}
        </nav>

        {/* Arama canlı kartları süzer; geçmiş sekmesinin kendi denetimleri var. */}
        {!isHistory && (
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Veri ara..."
              aria-label="Verilerde ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                aria-label="Aramayı temizle"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {isHistory ? (
        <HistoryView />
      ) : !livePacket ? (
        <WaitingState topic={topic} vehicleId={vehicleId} />
      ) : isEmpty ? (
        <p className="empty">
          {query
            ? `“${search.trim()}” için sonuç bulunamadı.`
            : 'Gösterilecek veri yok.'}
        </p>
      ) : (
        sections.map((section) => {
          if (section.kind === 'stat') {
            return (
              <div className="stat-row" key={section.kind}>
                {section.items.map((f) => (
                  <StatCard
                    key={f.key}
                    label={f.tr}
                    value={f.current}
                    unit={f.unit}
                    decimals={f.decimals}
                    icon={f.icon}
                    tone={f.tone}
                    stale={viewStale}
                  />
                ))}
              </div>
            );
          }

          if (section.kind === 'gauge') {
            return (
              <div key={section.kind}>
                <ZoneLegend items={legendItems} />
                <div className="gauge-grid">
                  {section.items.map((f) => (
                    <Gauge
                      key={f.key}
                      label={f.tr}
                      value={f.current}
                      unit={f.unit}
                      min={f.min}
                      max={f.max}
                      zones={f.zones}
                      decimals={f.decimals}
                      tickDecimals={f.tickDecimals}
                      stale={viewStale}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="digital-grid" key={section.kind}>
              {section.items.map((f) => (
                <DigitalCard key={f.key} label={f.tr} value={f.current} stale={viewStale} />
              ))}
            </div>
          );
        })
      )}
    </section>
  );
}

// Bölge renklerinin açıklaması. Her kartta ya da her bölümde tekrar etmek
// yerine sayfanın başında bir kez gösterilir.
function ZoneLegend({ items }) {
  const levels = new Set(items.flatMap((f) => f.zones?.map((z) => z.level) ?? []));
  const shown = ZONE_LEGEND.filter((l) => levels.has(l.level));
  if (shown.length === 0) return null;

  return (
    <div className="zone-legend">
      {shown.map((l) => (
        <span className="zone-legend-item" key={l.level}>
          <i className={`zone-legend-dot zone-${l.level}`} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

function WaitingState({ topic, vehicleId }) {
  return (
    <div className="waiting">
      <div className="spinner" />
      <h2>Veri bekleniyor</h2>
      <p>
        <code>{topic}</code> topic'inden <b>{vehicleId}</b> numaralı aracın
        paketi bekleniyor. Köprü sunucusu broker'a bağlı olduğunda veriler
        burada anlık görünecek.
      </p>
    </div>
  );
}

// --- yardımcılar ---
function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('tr-TR');
  } catch {
    return iso;
  }
}
