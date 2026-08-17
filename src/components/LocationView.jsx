import MapView from './MapView.jsx';

// Konum sekmesi: resLocation paketindeki GNSS alanlarını (Lat / Lon / Altitude
// / Speed / Course) Google Hybrid harita üzerinde canlı gösterir.
export default function LocationView({ packet, topic, vehicleId, stale = false }) {
  const value = packet?.value;
  const coords = extractCoords(value);
  // GNSS kilidi yoksa cihaz yayına devam eder ama koordinatlar eski/geçersizdir;
  // paket taze olsa bile bunu ayrıca söylemek gerekir.
  const gnssActive = value?.gnss_is_active === true;

  if (!packet) {
    return (
      <section className="view">
        <div className="waiting">
          <div className="spinner" />
          <h2>Konum bekleniyor</h2>
          <p>
            <code>{topic}</code> topic'inden <b>{vehicleId}</b> numaralı aracın
            konum verisi bekleniyor.
          </p>
        </div>
      </section>
    );
  }

  const { receivedAt } = packet;

  return (
    <section className="view view-konum">
      <div className="location-layout">
        <div className="map-wrap">
          {coords ? (
            <>
              <MapView lat={coords.lat} lon={coords.lon} />

              <div className={`geo-indicator ${stale || !gnssActive ? 'is-stale' : ''}`}>
                <div className="geo-live">
                  <span className="geo-live-dot" />
                  {stale ? 'VERİ YOK' : gnssActive ? 'CANLI' : 'GNSS YOK'}
                </div>
                <div className="geo-coords">
                  <div className="geo-coord">
                    <span className="geo-coord-label">ENLEM</span>
                    <span className="geo-coord-val">
                      {stale ? 'Veri Yok' : `${coords.lat.toFixed(6)}°`}
                    </span>
                  </div>
                  <div className="geo-coord">
                    <span className="geo-coord-label">BOYLAM</span>
                    <span className="geo-coord-val">
                      {stale ? 'Veri Yok' : `${coords.lon.toFixed(6)}°`}
                    </span>
                  </div>
                </div>
                <a
                  className="geo-link"
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Haritalar'da aç ↗
                </a>
              </div>
            </>
          ) : (
            <div className="map-empty">
              <p>Geçerli enlem/boylam bulunamadı.</p>
              <p className="hint">
                {gnssActive
                  ? 'Cihazdan konum verisi bekleniyor.'
                  : 'GNSS kilidi yok — araç uydu görene kadar konum gelmez.'}
              </p>
            </div>
          )}

          <aside className="location-fields">
            <div className="loc-row">
              <span className="loc-key">Araç No</span>
              <span className="loc-val">{vehicleId}</span>
            </div>
            <div className="loc-row">
              <span className="loc-key">GNSS Kilidi</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : gnssActive ? 'Var' : 'Yok'}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">Enlem</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : coords ? `${coords.lat.toFixed(8)}°` : '—'}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">Boylam</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : coords ? `${coords.lon.toFixed(8)}°` : '—'}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">Rakım</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : formatNum(value?.Altitude, 1, 'm')}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">GNSS Hızı</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : formatNum(value?.Speed, 2, 'km/sa')}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">Yön</span>
              <span className={`loc-val ${stale ? 'is-empty' : ''}`}>
                {stale ? 'Veri Yok' : formatNum(value?.Course, 1, '°', '')}
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-key">{stale ? 'Son Paket' : 'Son Güncelleme'}</span>
              <span className="loc-val">{formatTime(receivedAt)}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

// --- koordinat çıkarımı (Lat / Lon) ---
function extractCoords(value) {
  if (!value || typeof value !== 'object') return null;
  const lat = Number(value.Lat);
  const lon = Number(value.Lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

// Sayı + birim; birim öncesi boşluk derece işaretinde istenmez.
function formatNum(v, decimals, unit = '', sep = ' ') {
  const n = typeof v === 'number' ? v : v == null ? NaN : Number(v);
  if (!Number.isFinite(n)) return '—';
  const text = n.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${text}${sep}${unit}` : text;
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('tr-TR');
  } catch {
    return iso;
  }
}
