-- Add missing DELETE policies for entrada_status_historico
CREATE POLICY "Users can delete status history for entries they manage"
ON public.entrada_status_historico
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.entradas e
    WHERE e.id = entrada_status_historico.entrada_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM public.franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);

-- Add missing DELETE policies for allocation_wave_items
CREATE POLICY "Users can delete wave items for entries they manage"
ON public.allocation_wave_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.allocation_waves w
    JOIN public.entradas e ON e.deposito_id = w.deposito_id
    JOIN public.entrada_itens ei ON ei.entrada_id = e.id
    WHERE ei.id = allocation_wave_items.entrada_item_id
    AND (
      e.user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR (
        has_role(auth.uid(), 'franqueado'::app_role)
        AND w.deposito_id IN (
          SELECT f.id FROM public.franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);