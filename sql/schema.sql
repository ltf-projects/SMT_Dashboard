-- SMT Dashboard — 36 numaralı dizel makinenin geçmiş şeması.
-- server.js bu işlemleri açılışta otomatik uygular; dosya elle kurulum içindir.

DROP TABLE IF EXISTS public.arac_ornekleri;

CREATE TABLE IF NOT EXISTS public.makine_ornekleri (
  zaman                       TIMESTAMPTZ NOT NULL,
  arac_id                     INTEGER NOT NULL,
  "EngTotalRevolutions"       DOUBLE PRECISION,
  "EngTotalFuelUsed"          DOUBLE PRECISION,
  "EngTotalHoursOfOperations" DOUBLE PRECISION,
  "EngSpeed"                  DOUBLE PRECISION,
  "EngCoolantTemp"            DOUBLE PRECISION,
  "ActualEngPercentTorque"    DOUBLE PRECISION,
  "EngOilPress"               DOUBLE PRECISION,
  "Keyswitch_BatPot"          DOUBLE PRECISION,
  "EngFuelRate"               DOUBLE PRECISION,
  PRIMARY KEY (arac_id, zaman)
);

COMMENT ON TABLE public.makine_ornekleri IS
  'resJ1939/36 motor ve yakıt verilerinden HISTORY_SAMPLE_MS aralıkla alınan örnekler.';

ALTER TABLE public.makine_ornekleri ENABLE ROW LEVEL SECURITY;
