// Radyal göstergelerin üstünde duran geniş özet kartları (Yol Sayacı /
// Toplam Şarj Enerjisi / Araç Durum Kodu ...). Kümülatif sayaçlar ve kod
// alanları göstergeye sığmadığı için burada yazıyla gösterilir.

const ICONS = {
  bolt: (
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />
  ),
  chip: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <rect x="9" y="9" width="6" height="6" rx="1.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  // Ufka doğru daralan yol: kilometre sayacı.
  road: (
    <>
      <path d="M8.5 3.5 4 20.5M15.5 3.5 20 20.5" />
      <path d="M12 4.5v3M12 10.5v3M12 16.5v3" />
    </>
  ),
  // Şarj fişi: kümülatif şarj enerjisi.
  plug: (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M6 8h12v2.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
      <path d="M12 16.5V21" />
    </>
  ),
  // Yük kasası.
  load: (
    <>
      <rect x="3.5" y="7.5" width="17" height="11" rx="2" />
      <path d="M8 7.5v11M13 7.5v11M3.5 12.5h17" />
    </>
  ),
};

function formatNum(v, decimals) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return v.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function StatCard({
  label,
  value,
  unit,
  decimals = 0,
  icon = 'chip',
  tone = 'amber',
  stale = false,
}) {
  const hasValue = !stale && typeof value === 'number' && !Number.isNaN(value);

  return (
    <div className={`stat-card stat-card--${tone} ${hasValue ? '' : 'is-empty'}`}>
      <span className="stat-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">{ICONS[icon] || ICONS.chip}</svg>
      </span>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {hasValue ? formatNum(value, decimals) : stale ? 'Veri Yok' : '—'}
          {unit && hasValue ? <span className="stat-unit"> {unit}</span> : null}
        </span>
      </div>
    </div>
  );
}
