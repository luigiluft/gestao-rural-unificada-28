-- Fase 1.1: Adicionar novo valor 'cliente' ao enum app_role
-- Este comando precisa ser executado sozinho primeiro

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';