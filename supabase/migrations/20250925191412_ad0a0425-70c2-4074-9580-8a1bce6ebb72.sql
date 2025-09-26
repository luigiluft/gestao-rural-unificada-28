-- Add default_route field to permission_templates
ALTER TABLE public.permission_templates 
ADD COLUMN default_route text;

-- Comment on the new column
COMMENT ON COLUMN public.permission_templates.default_route IS 'Default route to redirect user after login (e.g., /proof-of-delivery)';

-- Add some default routes for common roles
UPDATE public.permission_templates 
SET default_route = '/proof-of-delivery' 
WHERE target_role = 'motorista';

-- Update any existing motorista-related templates if they exist
UPDATE public.permission_templates 
SET default_route = '/proof-of-delivery' 
WHERE nome ILIKE '%motorista%' OR permissions::text LIKE '%motorista.deliveries.view%';