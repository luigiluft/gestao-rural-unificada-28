import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Camera,
  Upload,
  Check,
  X,
  MapPin,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ViagemMotorista } from '@/hooks/useMotoristaViagens'

interface MotoristaPhotoUploadProps {
  viagem: ViagemMotorista
  onVoltar: () => void
}

export const MotoristaPhotoUpload: React.FC<MotoristaPhotoUploadProps> = ({ viagem, onVoltar }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Buscar comprovante existente para esta viagem
  const { data: comprovante } = useQuery({
    queryKey: ['comprovante-viagem', viagem.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comprovantes_entrega')
        .select('*')
        .eq('tracking_id', viagem.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      return data
    }
  })

  // Obter localização atual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          toast.success('Localização capturada com sucesso!')
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          toast.error('Erro ao obter localização. Verifique as permissões.')
        }
      )
    } else {
      toast.error('Geolocalização não é suportada neste navegador.')
    }
  }

  // Selecionar arquivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedFiles(files)
      
      // Criar previews
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setPreviewUrls(urls)
    }
  }

  // Mutation para upload de fotos
  const uploadPhotosMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFiles || selectedFiles.length === 0) {
        throw new Error('Selecione pelo menos uma foto')
      }

      // Criar ou atualizar comprovante
      let comprovanteId = comprovante?.id

      if (!comprovanteId) {
        const { data: novoComprovante, error: comprovanteError } = await supabase
          .from('comprovantes_entrega')
          .insert({
            codigo: `VGM-${viagem.numero}`,
            cliente_nome: `Viagem ${viagem.numero}`,
            produto_descricao: 'Carga da viagem',
            status: 'pendente',
            tracking_id: viagem.id,
            observacoes: observacoes,
            latitude: currentLocation?.lat,
            longitude: currentLocation?.lng,
            localizacao: currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : null,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single()

        if (comprovanteError) throw comprovanteError
        comprovanteId = novoComprovante.id
      }

      // Upload das fotos
      const uploadPromises = Array.from(selectedFiles).map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${comprovanteId}-${index}-${Date.now()}.${fileExt}`
        const filePath = `comprovantes/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(filePath)

        // Salvar registro da foto
        const { error: fotoError } = await supabase
          .from('comprovante_fotos')
          .insert({
            comprovante_id: comprovanteId,
            url_foto: publicUrl,
            tipo: 'entrega',
            descricao: `Foto ${index + 1} da entrega da viagem ${viagem.numero}`
          })

        if (fotoError) throw fotoError

        return publicUrl
      })

      await Promise.all(uploadPromises)

      // Atualizar status do comprovante
      const { error: updateError } = await supabase
        .from('comprovantes_entrega')
        .update({
          status: 'confirmado',
          data_entrega: new Date().toISOString(),
          total_fotos: selectedFiles.length,
          observacoes: observacoes
        })
        .eq('id', comprovanteId)

      if (updateError) throw updateError

      // Marcar viagem como entregue se estiver finalizada
      if (viagem.status === 'finalizada') {
        const { error: viagemError } = await supabase
          .from('viagens')
          .update({ 
            status: 'entregue',
            updated_at: new Date().toISOString()
          })
          .eq('id', viagem.id)

        if (viagemError) throw viagemError
      }

      return comprovanteId
    },
    onSuccess: () => {
      toast.success('Fotos enviadas com sucesso! Viagem marcada como entregue.')
      queryClient.invalidateQueries({ queryKey: ['motorista-viagens'] })
      queryClient.invalidateQueries({ queryKey: ['comprovante-viagem', viagem.id] })
      onVoltar()
    },
    onError: (error: any) => {
      console.error('Erro ao enviar fotos:', error)
      toast.error('Erro ao enviar fotos: ' + error.message)
    }
  })

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onVoltar}>
            ← Voltar
          </Button>
          <Badge variant={viagem.status === 'finalizada' ? 'default' : 'secondary'}>
            Viagem #{viagem.numero}
          </Badge>
        </div>

        {/* Informações da Viagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprovante de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Viagem:</span>
                <p>#{viagem.numero}</p>
              </div>
              <div>
                <span className="font-medium">Entregas:</span>
                <p>{viagem.remessas_entregues}/{viagem.total_remessas}</p>
              </div>
              <div>
                <span className="font-medium">Veículo:</span>
                <p>{viagem.veiculos?.placa} - {viagem.veiculos?.modelo}</p>
              </div>
              <div>
                <span className="font-medium">Peso Total:</span>
                <p>{viagem.peso_total?.toFixed(0) || 0} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos da Carga Descarregada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botão de localização */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {currentLocation ? 'Localização Capturada' : 'Capturar Localização'}
              </Button>
              {currentLocation && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  GPS Ativo
                </Badge>
              )}
            </div>

            {/* Seletor de arquivos */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-dashed"
              >
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Clique para selecionar fotos</p>
                  <p className="text-xs text-muted-foreground">Múltiplas fotos permitidas</p>
                </div>
              </Button>
            </div>

            {/* Preview das fotos */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Fotos Selecionadas ({previewUrls.length})</Label>
                <div className="grid grid-cols-2 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1 right-1 text-xs"
                      >
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações sobre a Entrega</Label>
              <Textarea
                id="observacoes"
                placeholder="Descreva o estado da carga, local de descarga, etc..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Botão de envio */}
            <Button
              onClick={() => uploadPhotosMutation.mutate()}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploadPhotosMutation.isPending}
              className="w-full"
            >
              {uploadPhotosMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando Fotos...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovante ({selectedFiles?.length || 0} fotos)
                </>
              )}
            </Button>

            {/* Status do comprovante */}
            {comprovante && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Comprovante já enviado</span>
                  <Badge variant="outline">{comprovante.total_fotos} fotos</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}