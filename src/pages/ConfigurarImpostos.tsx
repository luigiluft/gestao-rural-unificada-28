import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Percent, 
  Calculator, 
  ArrowLeftRight, 
  Package, 
  Receipt, 
  Table, 
  Shield, 
  Settings,
  Smartphone
} from "lucide-react"
import { CFOPConfig } from "@/components/Impostos/CFOPConfig"
import { ICMSConfig } from "@/components/Impostos/ICMSConfig"
import { ICMSSTConfig } from "@/components/Impostos/ICMSSTConfig"
import { DIFALConfig } from "@/components/Impostos/DIFALConfig"
import { IPIConfig } from "@/components/Impostos/IPIConfig"
import { PISCOFINSConfig } from "@/components/Impostos/PISCOFINSConfig"
import { IBPTConfig } from "@/components/Impostos/IBPTConfig"
import { FCPConfig } from "@/components/Impostos/FCPConfig"
import { AjustesICMSConfig } from "@/components/Impostos/AjustesICMSConfig"
import { CFeSATConfig } from "@/components/Impostos/CFeSATConfig"

const taxCategories = [
  { id: "cfop", label: "CFOP", icon: FileText, description: "Código Fiscal de Operações" },
  { id: "icms", label: "ICMS", icon: Percent, description: "Alíquotas por estado" },
  { id: "icms-st", label: "ICMS ST", icon: Calculator, description: "Substituição Tributária" },
  { id: "difal", label: "DIFAL", icon: ArrowLeftRight, description: "Diferencial de Alíquota" },
  { id: "ipi", label: "IPI", icon: Package, description: "Imposto sobre Produtos" },
  { id: "pis-cofins", label: "PIS/COFINS", icon: Receipt, description: "Contribuições Federais" },
  { id: "ibpt", label: "IBPT", icon: Table, description: "Tabela IBPT" },
  { id: "fcp", label: "FCP", icon: Shield, description: "Fundo de Combate à Pobreza" },
  { id: "ajustes", label: "Ajustes ICMS", icon: Settings, description: "Lançamentos de ajuste" },
  { id: "cfe-nfce", label: "CF-e/NFC-e", icon: Smartphone, description: "Configurações SAT" },
]

export default function ConfigurarImpostos() {
  const [activeTab, setActiveTab] = useState("cfop")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurar Impostos</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações fiscais e tributárias do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {taxCategories.map((category) => {
            const Icon = category.icon
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border px-4 py-2 rounded-lg"
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="cfop">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CFOP - Código Fiscal de Operações
              </CardTitle>
              <CardDescription>
                Cadastre e gerencie os códigos fiscais de operações e prestações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CFOPConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                ICMS - Alíquotas Interestaduais
              </CardTitle>
              <CardDescription>
                Configure as alíquotas de ICMS entre estados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ICMSConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icms-st">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                ICMS ST - Substituição Tributária
              </CardTitle>
              <CardDescription>
                Configure MVA e alíquotas de substituição tributária por NCM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ICMSSTConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                DIFAL - Diferencial de Alíquota
              </CardTitle>
              <CardDescription>
                Configure o diferencial de alíquota interestadual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DIFALConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ipi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                IPI - Imposto sobre Produtos Industrializados
              </CardTitle>
              <CardDescription>
                Configure as alíquotas de IPI por NCM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IPIConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pis-cofins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                PIS/COFINS
              </CardTitle>
              <CardDescription>
                Configure as alíquotas de PIS e COFINS por CST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PISCOFINSConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ibpt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Tabela IBPT
              </CardTitle>
              <CardDescription>
                Importe e consulte a tabela do IBPT para cálculo de impostos aproximados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IBPTConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fcp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                FCP - Fundo de Combate à Pobreza
              </CardTitle>
              <CardDescription>
                Configure os percentuais do FCP por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FCPConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ajustes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ajustes de ICMS
              </CardTitle>
              <CardDescription>
                Lançamentos de ajustes de crédito e débito de ICMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AjustesICMSConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cfe-nfce">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                CF-e SAT e NFC-e
              </CardTitle>
              <CardDescription>
                Configurações para emissão de cupons fiscais eletrônicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CFeSATConfig />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
