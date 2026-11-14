-- Prova de entrega imutável depois da confirmação do contratante.
-- Correção = nova versão (version + 1); a anterior fica no histórico.
CREATE OR REPLACE FUNCTION delivery_proofs_lock_confirmed() RETURNS trigger AS $$
BEGIN
  IF OLD.confirmed_at IS NOT NULL THEN
    IF NEW.snapshot IS DISTINCT FROM OLD.snapshot
       OR NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256
       OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
       OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
       OR NEW.confirmed_name IS DISTINCT FROM OLD.confirmed_name THEN
      RAISE EXCEPTION 'delivery_proof_locked: prova % já confirmada; crie uma nova versão', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  -- O snapshot nunca muda, mesmo antes da confirmação (o hash é sobre ele)
  IF NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256 THEN
    RAISE EXCEPTION 'delivery_proof_snapshot_immutable: prova %', OLD.id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS delivery_proofs_lock_confirmed_trg ON delivery_proofs;
--> statement-breakpoint
CREATE TRIGGER delivery_proofs_lock_confirmed_trg
  BEFORE UPDATE ON delivery_proofs
  FOR EACH ROW EXECUTE FUNCTION delivery_proofs_lock_confirmed();
--> statement-breakpoint
-- Acerto pago é imutável (correção = acerto de ajuste novo).
CREATE OR REPLACE FUNCTION settlements_lock_paid() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'paid' THEN
    RAISE EXCEPTION 'settlement_locked: acerto % já pago; crie um ajuste', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS settlements_lock_paid_trg ON settlements;
--> statement-breakpoint
CREATE TRIGGER settlements_lock_paid_trg
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION settlements_lock_paid();
