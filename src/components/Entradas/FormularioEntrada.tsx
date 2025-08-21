import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NFData, NFItem } from "./NFParser";
import { Plus, Trash2 } from "lucide-react";
import { SeletorDeposito } from "./SeletorDeposito";
import { useFranquiaByCnpj } from "@/hooks/useFranquiaByCnpj";
import { useToast } from "@/hooks/use-toast";

interface FormularioEntradaProps {
  nfData?: NFData | null;
  onSubmit: (dados: any) => void;
  onCancel: () => void;
}

interface ItemEntrada {
  produto: string;
  lote: string;
  codigo?: string; // Código do produto (cProd)
  codigoEAN?: string; // Código EAN (cEAN)
  quantidade: number;
  unidade: string;
  deposito: string;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
  dataValidade?: string;
  quantidadeLote?: number;
  dataFabricacao?: string;
}

export function FormularioEntrada({ nfData, onSubmit, onCancel }: FormularioEntradaProps) {
  const { toast } = useToast();
  
  // Buscar franquia automaticamente pelo CNPJ da entrega (prioridade) ou destinatário
  const cnpjBusca = nfData?.entrega?.cnpj || nfData?.destinatarioCpfCnpj;
  const ieBusca = nfData?.entrega?.ie;
  const { data: franquiaEncontrada } = useFranquiaByCnpj(cnpjBusca, ieBusca);
  const [dadosEntrada, setDadosEntrada] = useState({
    numeroNF: '',
    serie: '',
    chaveNFe: '',
    naturezaOperacao: '',
    dataEntrada: '',
    dataEmissao: '',
    origem: '',
    observacoes: '',
    depositoId: ''
  });

  const [itens, setItens] = useState<ItemEntrada[]>([]);
  const [novoItem, setNovoItem] = useState<ItemEntrada>({
    produto: '',
    lote: '',
    quantidade: 0,
    unidade: '',
    deposito: '',
    valorUnitario: 0,
    valorTotal: 0
  });

  // Preencher dados quando NFe é carregada
  useEffect(() => {
    if (nfData) {
      setDadosEntrada({
        numeroNF: nfData.numeroNF,
        serie: nfData.serie,
        chaveNFe: nfData.chaveNFe,
        naturezaOperacao: nfData.naturezaOperacao,
        dataEntrada: nfData.dataEmissao,
        dataEmissao: nfData.dataEmissao,
        origem: nfData.emitente.nome,
        observacoes: `Importado da NFe ${nfData.numeroNF}/${nfData.serie}\nEmitente: ${nfData.emitente.nome}\nDestinatário: ${nfData.destinatario.nome}`,
        depositoId: franquiaEncontrada?.id || ''
      });

      // Converter itens da NFe para itens de entrada
      const itensConvertidos: ItemEntrada[] = nfData.itens.map((item) => ({
        produto: item.descricao,
        lote: item.lote || '', // Usar o lote real do XML
        codigo: item.codigo, // Código do produto (cProd)
        codigoEAN: item.codigoEAN || '', // Código EAN (cEAN) 
        quantidade: item.quantidade,
        unidade: item.unidade,
        deposito: 'Armazém A', // Padrão
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
        dataValidade: item.dataValidade, // Incluir data de validade se disponível
        quantidadeLote: item.quantidadeLote, // Incluir quantidade do lote
        dataFabricacao: item.dataFabricacao // Incluir data de fabricação
      }));

      setItens(itensConvertidos);
      
      // Mostrar toast informando se a franquia foi encontrada ou não
      if (franquiaEncontrada) {
        const origem = nfData.entrega?.cnpj ? "entrega" : "destinatário";
        toast({
          title: "Franquia identificada automaticamente",
          description: `Franquia "${franquiaEncontrada.nome}" selecionada baseada no CNPJ da ${origem}.`,
        });
      } else if (cnpjBusca) {
        const origem = nfData.entrega?.cnpj ? "entrega" : "destinatário";
        toast({
          title: "Franquia não encontrada",
          description: `Não foi possível encontrar uma franquia com o CNPJ ${cnpjBusca} da ${origem}. Selecione manualmente.`,
          variant: "destructive"
        });
      }
    }
  }, [nfData, franquiaEncontrada, toast]);

  const adicionarItem = () => {
    if (novoItem.produto && novoItem.quantidade > 0) {
      const valorTotal = novoItem.quantidade * novoItem.valorUnitario;
      setItens([...itens, { ...novoItem, valorTotal }]);
      setNovoItem({
        produto: '',
        lote: '',
        quantidade: 0,
        unidade: '',
        deposito: '',
        valorUnitario: 0,
        valorTotal: 0
      });
    }
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularValorTotal = () => {
    return itens.reduce((total, item) => total + item.valorTotal, 0);
  };

  const handleSubmit = () => {
    const dadosCompletos = {
      ...dadosEntrada,
      itens,
      valorTotal: calcularValorTotal(),
      tipo: nfData ? 'nfe' : 'manual',
      xmlContent: nfData?.xmlContent
    };
    onSubmit(dadosCompletos);
  };

  const handleNovoItemChange = (campo: keyof ItemEntrada, valor: any) => {
    const novoItemAtualizado = { ...novoItem, [campo]: valor };
    
    // Recalcular valor total quando quantidade ou valor unitário mudam
    if (campo === 'quantidade' || campo === 'valorUnitario') {
      novoItemAtualizado.valorTotal = novoItemAtualizado.quantidade * novoItemAtualizado.valorUnitario;
    }
    
    setNovoItem(novoItemAtualizado);
  };

  return (
    <div className="space-y-6">
      {/* Dados da Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dados da Entrada
            {nfData && <Badge variant="secondary">Importado da NFe</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroNF">Número da NF</Label>
              <Input
                id="numeroNF"
                value={dadosEntrada.numeroNF}
                onChange={(e) => setDadosEntrada({...dadosEntrada, numeroNF: e.target.value})}
                placeholder="Ex: 123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serie">Série</Label>
              <Input
                id="serie"
                value={dadosEntrada.serie}
                onChange={(e) => setDadosEntrada({...dadosEntrada, serie: e.target.value})}
                placeholder="Ex: 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEntrada">Data da Entrada</Label>
              <Input
                id="dataEntrada"
                type="date"
                value={dadosEntrada.dataEntrada}
                onChange={(e) => setDadosEntrada({...dadosEntrada, dataEntrada: e.target.value})}
              />
            </div>
          </div>
          
          {nfData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chaveNFe">Chave da NFe</Label>
                <Input
                  id="chaveNFe"
                  value={dadosEntrada.chaveNFe}
                  onChange={(e) => setDadosEntrada({...dadosEntrada, chaveNFe: e.target.value})}
                  placeholder="Chave de 44 dígitos"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="naturezaOperacao">Natureza da Operação</Label>
                <Input
                  id="naturezaOperacao"
                  value={dadosEntrada.naturezaOperacao}
                  onChange={(e) => setDadosEntrada({...dadosEntrada, naturezaOperacao: e.target.value})}
                  placeholder="Ex: Venda de Mercadoria"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origem">Origem/Fornecedor</Label>
              <Input
                id="origem"
                value={dadosEntrada.origem}
                onChange={(e) => setDadosEntrada({...dadosEntrada, origem: e.target.value})}
                placeholder="Ex: Cooperativa ABC"
              />
            </div>

            <SeletorDeposito
              value={dadosEntrada.depositoId}
              onValueChange={(value) => setDadosEntrada({...dadosEntrada, depositoId: value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={dadosEntrada.observacoes}
              onChange={(e) => setDadosEntrada({...dadosEntrada, observacoes: e.target.value})}
              placeholder="Observações gerais sobre a entrada..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Itens da Entrada */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar Novo Item */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-7 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs">Produto</Label>
                <Input
                  placeholder="Nome do produto"
                  value={novoItem.produto}
                  onChange={(e) => handleNovoItemChange('produto', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lote</Label>
                <Input
                  placeholder="Lote"
                  value={novoItem.lote}
                  onChange={(e) => handleNovoItemChange('lote', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={novoItem.quantidade || ''}
                  onChange={(e) => handleNovoItemChange('quantidade', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Select value={novoItem.unidade} onValueChange={(value) => handleNovoItemChange('unidade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Un" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sacas">Sacas</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Depósito</Label>
                <Select value={novoItem.deposito} onValueChange={(value) => handleNovoItemChange('deposito', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Armazém A">Armazém A</SelectItem>
                    <SelectItem value="Armazém B">Armazém B</SelectItem>
                    <SelectItem value="Depósito Campo">Depósito Campo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Unit.</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={novoItem.valorUnitario || ''}
                  onChange={(e) => handleNovoItemChange('valorUnitario', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ação</Label>
                <Button onClick={adicionarItem} size="sm" className="w-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Itens */}
          {itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="w-[50px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.produto}</TableCell>
                    <TableCell>{item.lote}</TableCell>
                    <TableCell>{item.quantidade} {item.unidade}</TableCell>
                    <TableCell>{item.deposito}</TableCell>
                    <TableCell>R$ {item.valorUnitario.toFixed(2)}</TableCell>
                    <TableCell>R$ {item.valorTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {itens.length > 0 && (
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                Total: R$ {calcularValorTotal().toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={itens.length === 0}
        >
          Registrar Entrada
        </Button>
      </div>
    </div>
  );
}