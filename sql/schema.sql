-- ---------------------------------------------------------------------------
-- SMT Dashboard — geçmiş örnekleri tablosu (113 numaralı elektrikli araç)
--
-- Bu dosyayı çalıştırmak ZORUNLU DEĞİLDİR: köprü (server.js) açılışta tabloyu
-- ve eksik sütunları kendisi oluşturur. Şemayı elle kurmak, gözden geçirmek
-- veya sürüm kontrolünde tutmak isteyenler için buradadır.
--
-- Sütunlar src/config/fields.js dosyasındaki alan tanımlarından üretilmiştir
-- (FIELDS + LOCATION_FIELDS). Oraya yeni bir alan eklenirse köprü yeniden
-- başlatıldığında sütun da eklenir (ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
--
-- Bir satır iki topic'in birleşimidir:
--   resJ1939/113    → araç, tahrik, batarya ve durum alanları
--   resLocation/113 → Lat / Lon / Altitude / Speed / Course / gnss_is_active
-- Tetikleyici resJ1939 paketidir; konum sütunları en son görülen konum
-- paketinden doldurulur.
--
-- NOT: Önceki sondaj makinesi sürümünün `sondaj_ornekleri` tablosu bu araçla
-- ilgisiz sütunlar taşıdığı için kullanılmaz. Eski kayıtlar korunsun diye
-- silinmez; istenirse elle DROP edilebilir.
--
-- Supabase SQL Editor'da olduğu gibi çalıştırılabilir.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.arac_ornekleri (
  zaman                              TIMESTAMPTZ NOT NULL,
  arac_id                            INTEGER     NOT NULL,

  -- Sürüş Verileri
  "Trip_Number_KM"                   DOUBLE PRECISION,
  "Total_working_hours"              DOUBLE PRECISION,
  "payload_8xxHE"                    DOUBLE PRECISION,
  "Speed_of_vehicle"                 DOUBLE PRECISION,
  "Main_drive_motor_speed"           DOUBLE PRECISION,
  "Auxiliary_drive_motor_speed"      DOUBLE PRECISION,
  "Throttle_depth"                   DOUBLE PRECISION,
  "Braking_depth"                    DOUBLE PRECISION,

  -- Batarya ve Enerji
  "Accumulated_charging_amount_Kwh"  DOUBLE PRECISION,
  "Accumulated_discharge_amount_Kwh" DOUBLE PRECISION,
  "SOC"                              DOUBLE PRECISION,

  -- Durum Verileri
  "Vehicle_status"                   DOUBLE PRECISION,
  "Parking_signal"                   DOUBLE PRECISION,
  "Container_lifting_DW105AE"        DOUBLE PRECISION,
  "SOC_high_alarm_DW105AE"           DOUBLE PRECISION,

  -- Konum (resLocation). gnss_is_active mantıksal gelir, 0/1 olarak yazılır.
  "Lat"                              DOUBLE PRECISION,
  "Lon"                              DOUBLE PRECISION,
  "Altitude"                         DOUBLE PRECISION,
  "Speed"                            DOUBLE PRECISION,
  "Course"                           DOUBLE PRECISION,
  "gnss_is_active"                   DOUBLE PRECISION,

  -- Hem tekilliği sağlar hem de aralık sorgusunun kullandığı indekstir:
  -- WHERE arac_id = $1 AND zaman BETWEEN $2 AND $3
  PRIMARY KEY (arac_id, zaman)
);

COMMENT ON TABLE public.arac_ornekleri IS
  'resJ1939/<arac_id> ve resLocation/<arac_id> paketlerinden HISTORY_SAMPLE_MS aralıkla alınan örnekler (Geçmiş Grafik).';

-- ---------------------------------------------------------------------------
-- Satır düzeyi güvenlik
--
-- Supabase, public şemasındaki tabloları otomatik REST API üzerinden yayınlar.
-- RLS kapalıyken bu tablo, projenin anon anahtarını bilen herkese açık olur.
-- Politika tanımlamadan RLS'i açmak API erişimini tamamen kapatır.
--
-- Köprü etkilenmez: tabloyu oluşturan `postgres` rolü sahibi olduğu için RLS'i
-- atlar ve doğrudan Postgres bağlantısıyla yazmaya/okumaya devam eder.
-- ---------------------------------------------------------------------------
ALTER TABLE public.arac_ornekleri ENABLE ROW LEVEL SECURITY;
