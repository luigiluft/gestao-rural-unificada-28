-- Add layout_paginas column to loja_configuracao table
ALTER TABLE public.loja_configuracao 
ADD COLUMN IF NOT EXISTS layout_paginas JSONB DEFAULT '{
  "home": {
    "blocos": [
      {"id": "hero-1", "tipo": "hero", "ordem": 0, "config": {"titulo": "Bem-vindo à nossa loja", "subtitulo": "Produtos de qualidade para você", "textoBotao": "Ver Produtos", "imagemFundo": null}},
      {"id": "produtos-1", "tipo": "grade_produtos", "ordem": 1, "config": {"titulo": "Nossos Produtos", "quantidade": 8, "categoria": null}},
      {"id": "contato-1", "tipo": "contato", "ordem": 2, "config": {"mostrarWhatsapp": true, "mostrarEmail": true, "mostrarEndereco": false}}
    ]
  }
}'::jsonb;