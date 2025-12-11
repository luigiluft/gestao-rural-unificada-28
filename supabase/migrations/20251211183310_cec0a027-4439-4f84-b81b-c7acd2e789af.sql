-- Force PostgREST schema cache reload by modifying table comment
COMMENT ON TABLE public.storage_positions IS 'Storage positions for warehouse management - updated 2024-12-11';

-- Ensure authenticated role has all necessary permissions on storage_positions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_positions TO anon;

-- Also ensure permissions on pallet_positions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pallet_positions TO authenticated;

-- Also ensure permissions on entrada_pallets
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrada_pallets TO authenticated;

-- Notify PostgREST to reload schema cache (multiple times to ensure it catches)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';