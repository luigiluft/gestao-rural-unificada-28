-- Remove the duplicate unique constraint to fix ON CONFLICT ambiguity
-- Keep the index version and remove the constraint version

DROP INDEX IF EXISTS estoque_unique_combination_idx;