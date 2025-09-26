# Edge Functions Reference

Este documento lista todas as Edge Functions implementadas no sistema e como utilizá-las.

## 🟢 Edge Functions Implementadas e em Uso

### 1. **manage-entradas**
**Localização**: `supabase/functions/manage-entradas/index.ts`
**Uso**: Gerenciamento completo de entradas de mercadorias
**Ações disponíveis**:
- `create` - Criar nova entrada
- `update` - Atualizar entrada existente
- `update_status` - Mudar status da entrada
- `get_coordinates` - Obter coordenadas de franquia/fazenda

**Exemplo de uso**:
```typescript
const { data, error } = await supabase.functions.invoke('manage-entradas', {
  body: {
    action: 'create',
    data: { /* dados da entrada */ }
  }
})
```

### 2. **manage-saidas**
**Localização**: `supabase/functions/manage-saidas/index.ts`
**Uso**: Gerenciamento de saídas de mercadorias
**Ações disponíveis**:
- `create` - Criar nova saída
- `update_status` - Atualizar status da saída
- `corrigir_status` - Corrigir status incorreto
- `expedir` - Marcar saída como expedida
- `delete_reservation` - Remover reserva de estoque

**Exemplo de uso**:
```typescript
const { data, error } = await supabase.functions.invoke('manage-saidas', {
  body: {
    action: 'update_status',
    data: { id: saidaId, status: 'expedido' }
  }
})
```

### 3. **manage-usuarios**
**Localização**: `supabase/functions/manage-usuarios/index.ts`
**Uso**: Gerenciamento de usuários, motoristas e veículos
**Ações disponíveis**:
- `createMotorista` - Criar novo motorista
- `updateMotorista` - Atualizar dados do motorista
- `deleteMotorista` - Remover motorista
- `createVeiculo` - Criar novo veículo
- `updateVeiculo` - Atualizar veículo
- `deleteVeiculo` - Remover veículo
- `listProfiles` - Listar perfis de usuários
- `makeAdmin` - Tornar usuário administrador
- `linkChild` - Vincular usuário como subconta
- `unlinkChild` - Desvincular subconta
- `getUserPermissions` - Obter permissões do usuário
- `saveUserPermissions` - Salvar permissões do usuário

### 4. **manage-configuracoes**
**Localização**: `supabase/functions/manage-configuracoes/index.ts`
**Uso**: Gerenciamento de configurações do sistema
**Ações disponíveis**:
- `update` - Atualizar configuração

### 5. **send-invite**
**Localização**: `supabase/functions/send-invite/index.ts`
**Uso**: Envio de convites para novos usuários
**Funcionalidade**: Envia email de convite com template personalizado

### 6. **manage-estoque**
**Localização**: `supabase/functions/manage-estoque/index.ts`
**Uso**: Gerenciamento de estoque, produtos e movimentações
**Ações disponíveis**:
- `createProduct` - Criar novo produto
- `listProducts` - Listar produtos
- `createMovement` - Criar movimentação de estoque
- `createStoragePosition` - Criar posição de armazenamento
- `updateStoragePosition` - Atualizar posição
- `bulkCreatePositions` - Criar múltiplas posições
- `allocatePallet` - Alocar pallet
- `createReservation` - Criar reserva de estoque
- `deleteReservation` - Remover reserva
- `refreshEstoque` - Atualizar cálculos de estoque

### 7. **manage-comprovantes**
**Localização**: `supabase/functions/manage-comprovantes/index.ts`
**Uso**: Gerenciamento de comprovantes de entrega
**Ações disponíveis**:
- `create` - Criar comprovante
- `update` - Atualizar comprovante
- `uploadPhoto` - Upload de foto do comprovante
- `assignDriver` - Atribuir motorista
- `updateAssignment` - Atualizar atribuição
- `inviteDriver` - Convidar novo motorista

### 8. **manage-inventario**
**Localização**: `supabase/functions/manage-inventario/index.ts`
**Uso**: Gerenciamento de inventários
**Ações disponíveis**:
- `createInventario` - Criar novo inventário
- `updateInventario` - Atualizar inventário
- `createInventarioItem` - Adicionar item ao inventário
- `updateInventarioItem` - Atualizar item/posição
- `deleteInventarioItem` - Remover item
- `finalizeInventario` - Finalizar inventário
- `createDivergencia` - Criar divergência
- `updateDivergencia` - Atualizar divergência

### 9. **manage-viagens**
**Localização**: `supabase/functions/manage-viagens/index.ts`
**Uso**: Gerenciamento de viagens e veículos
**Ações disponíveis**:
- `create` - Criar viagem
- `createWithRemessas` - Criar viagem com remessas
- `update` - Atualizar viagem
- `updateViagemData` - Atualizar datas da viagem
- `confirm` - Confirmar viagem
- `delete` - Excluir viagem
- `createVeiculo` - Criar veículo
- `updateVeiculo` - Atualizar veículo
- `deleteVeiculo` - Excluir veículo

### 10. **manage-notifications**
**Localização**: `supabase/functions/manage-notifications/index.ts`
**Uso**: Sistema de notificações
**Ações disponíveis**:
- `create` - Criar notificação
- `markAsRead` - Marcar como lida
- `markAllAsRead` - Marcar todas como lidas
- `delete` - Excluir notificação
- `bulkCreate` - Criar múltiplas notificações
- `sendViagemNotification` - Notificar sobre viagem
- `sendMotoristaNotification` - Notificar motorista

## 🎯 Benefícios da Migração Completa

### ✅ **Logs Centralizados**
- Todas as operações são registradas nos logs das Edge Functions
- Facilita debugging e auditoria
- Visibilidade completa das operações do sistema

### ✅ **Validações Server-Side**
- Validações robustas no backend
- Controle de acesso centralizado
- Prevenção de operações inválidas

### ✅ **Transações Atômicas**
- Operações complexas garantem consistência
- Rollback automático em caso de erro
- Integridade dos dados preservada

### ✅ **Segurança Aprimorada**
- Controle de permissões no backend
- Validação de usuários autenticados
- Prevenção de acesso não autorizado

### ✅ **Performance Otimizada**
- Menos round-trips entre frontend e backend
- Operações em lote quando possível
- Cache otimizado pelo Supabase

### ✅ **Preparação para Integrações**
- Base sólida para APIs externas
- Webhooks e automações futuras
- Escalabilidade garantida

## 📋 Checklist de Migração

- [x] **manage-entradas** - Completamente migrado
- [x] **manage-saidas** - Completamente migrado  
- [x] **manage-usuarios** - Completamente migrado
- [x] **manage-configuracoes** - Completamente migrado
- [x] **send-invite** - Completamente migrado
- [x] **manage-estoque** - Completamente migrado
- [x] **manage-comprovantes** - Completamente migrado
- [x] **manage-inventario** - Completamente migrado
- [x] **manage-viagens** - Completamente migrado
- [x] **manage-notifications** - Disponível (implementação conforme necessidade)

## 🔍 Como Verificar se uma Edge Function Está Funcionando

1. **Logs da Edge Function**: Acesse o Supabase Dashboard > Functions > [nome-funcao] > Logs
2. **Network Tab**: Verifique se as chamadas estão sendo feitas para `/functions/v1/[nome-funcao]`
3. **Console do Browser**: Procure por logs de erro ou sucesso
4. **Database**: Verifique se os dados estão sendo criados/atualizados corretamente

## ⚡ Padrão de Uso

Todas as Edge Functions seguem o mesmo padrão:

```typescript
const { data, error } = await supabase.functions.invoke('nome-da-funcao', {
  body: {
    action: 'acao-desejada',
    data: { 
      // dados necessários para a ação
    }
  }
})

if (error || !data?.success) {
  throw new Error(data?.error || 'Mensagem de erro padrão')
}

return data.data // dados retornados pela função
```

Este padrão garante consistência e facilita manutenção do código.