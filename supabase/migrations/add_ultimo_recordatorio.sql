-- Add ultimo_recordatorio timestamp to expediente
ALTER TABLE expediente
  ADD COLUMN IF NOT EXISTS ultimo_recordatorio TIMESTAMPTZ;
