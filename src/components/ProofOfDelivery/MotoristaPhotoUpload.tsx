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
  Loader2,
  FolderOpen
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ViagemMotorista } from '@/hooks/useMotoristaViagens'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'

interface MotoristaPhotoUploadProps {
  viagem: ViagemMotorista
  onVoltar: () => void
}

interface PhotoWithExif {
  file: File
  previewUrl: string
  exifData?: {
    dateTime?: Date
    latitude?: number
    longitude?: number
    address?: string
  }
}

export const MotoristaPhotoUpload: React.FC<MotoristaPhotoUploadProps> = ({ viagem, onVoltar }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoWithExif[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, capturedAt: Date} | null>(null)
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false)
  const [isProcessingExif, setIsProcessingExif] = useState(false)
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

  // Função para extrair dados EXIF
  const extractExifData = async (file: File): Promise<PhotoWithExif['exifData']> => {
    try {
      const exifr = await import('exifr')
      const exifData = await exifr.parse(file, {
        gps: true,
        exif: true,
        iptc: false,
        icc: false
      })

      let dateTime: Date | undefined
      let latitude: number | undefined
      let longitude: number | undefined

      // Extrair data e hora
      if (exifData?.DateTimeOriginal) {
        dateTime = new Date(exifData.DateTimeOriginal)
      } else if (exifData?.DateTime) {
        dateTime = new Date(exifData.DateTime)
      }

      // Extrair coordenadas GPS
      if (exifData?.latitude && exifData?.longitude) {
        latitude = exifData.latitude
        longitude = exifData.longitude
      }

      return {
        dateTime,
        latitude,
        longitude
      }
    } catch (error) {
      console.warn('Erro ao extrair dados EXIF:', error)
      return undefined
    }
  }

  // Obter localização atual e data
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const now = new Date()
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            capturedAt: now
          })
          toast.success(`Localização e data capturadas: ${now.toLocaleString('pt-BR')}`)
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          let errorMessage = 'Erro ao obter localização. '
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permissão negada. Habilite a localização nas configurações do navegador.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Posição indisponível. Verifique sua conexão GPS.'
              break
            case error.TIMEOUT:
              errorMessage += 'Tempo limite excedido. Tente novamente.'
              break
            default:
              errorMessage += 'Verifique as permissões e tente novamente.'
              break
          }
          toast.error(errorMessage)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      )
    } else {
      toast.error('Geolocalização não é suportada neste navegador.')
    }
  }
  
  // Verificar se uma foto tem dados EXIF completos (localização E data)
  const photoHasCompleteExif = (photo: PhotoWithExif): boolean => {
    return !!(
      photo.exifData?.latitude && 
      photo.exifData?.longitude && 
      photo.exifData?.dateTime
    )
  }
  
  // Verificar se tem dados suficientes para enviar
  const hasRequiredData = (): boolean => {
    if (selectedPhotos.length === 0) return false
    
    // Verificar se alguma foto tem EXIF completo
    const hasPhotoWithCompleteExif = selectedPhotos.some(photoHasCompleteExif)
    
    // Se tem foto com EXIF completo, OK
    if (hasPhotoWithCompleteExif) return true
    
    // Se não tem EXIF completo, precisa ter capturado localização/data manualmente
    return currentLocation !== null
  }

  // Função para tirar foto - agora funciona tanto no mobile quanto desktop com PWA Elements
  const takePhoto = async () => {
    try {
      setIsCapturingPhoto(true)
      
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1200,
        height: 1600
      })

      if (image.base64String) {
        // Converter base64 para File
        const response = await fetch(`data:image/jpeg;base64,${image.base64String}`)
        const blob = await response.blob()
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        await addPhotoWithExif(file)
        toast.success('Foto capturada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error)
      toast.error('Erro ao capturar foto. Tente novamente.')
    } finally {
      setIsCapturingPhoto(false)
    }
  }

  // Função para adicionar foto e processar EXIF
  const addPhotoWithExif = async (file: File) => {
    setIsProcessingExif(true)
    
    const previewUrl = URL.createObjectURL(file)
    const exifData = await extractExifData(file)
    
    const newPhoto: PhotoWithExif = {
      file,
      previewUrl,
      exifData
    }
    
    setSelectedPhotos(prev => [...prev, newPhoto])
    setIsProcessingExif(false)
  }

  // Selecionar arquivos da galeria/sistema
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      setIsProcessingExif(true)
      const filesArray = Array.from(fileList)
      
      // Processar cada arquivo individualmente
      for (const file of filesArray) {
        await addPhotoWithExif(file)
      }
      
      setIsProcessingExif(false)
    }
  }

  // Função para limpar uma foto específica
  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index)
    setSelectedPhotos(newPhotos)
  }

  // Mutation para upload de fotos - sempre requer foto + localização + data
  const uploadPhotosMutation = useMutation({
    mutationFn: async () => {
      // Validar requisitos mínimos
      if (selectedPhotos.length === 0) {
        throw new Error('Adicione pelo menos uma foto da carga descarregada')
      }
      
      // Verificar se tem localização e data (via EXIF ou captura manual)
      const hasPhotoWithCompleteExif = selectedPhotos.some(photoHasCompleteExif)
      if (!hasPhotoWithCompleteExif && !currentLocation) {
        throw new Error('É necessário capturar a localização e data ou usar uma foto que contenha essas informações')
      }

      // Criar ou atualizar comprovante via Edge Function
      let comprovanteId = comprovante?.id
      
      // Usar localização da foto com EXIF ou da captura manual
      const locationData = hasPhotoWithCompleteExif 
        ? {
            latitude: selectedPhotos.find(photoHasCompleteExif)?.exifData?.latitude,
            longitude: selectedPhotos.find(photoHasCompleteExif)?.exifData?.longitude,
            data_entrega: selectedPhotos.find(photoHasCompleteExif)?.exifData?.dateTime?.toISOString()
          }
        : {
            latitude: currentLocation?.lat,
            longitude: currentLocation?.lng,
            data_entrega: currentLocation?.capturedAt?.toISOString()
          }

      if (!comprovanteId) {
        const { data: comprovanteData, error: comprovanteError } = await supabase.functions.invoke('manage-comprovantes', {
          body: {
            action: 'create',
            data: {
              codigo: `VGM-${viagem.numero}`,
              cliente_nome: `Viagem ${viagem.numero}`,
              produto_descricao: 'Carga da viagem',
              status: 'pendente',
              tracking_id: viagem.id,
              observacoes: observacoes,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              localizacao: locationData.latitude ? `${locationData.latitude}, ${locationData.longitude}` : null,
              data_entrega: locationData.data_entrega
            }
          }
        })

        if (comprovanteError || !comprovanteData?.success) {
          throw new Error(comprovanteData?.error || 'Erro ao criar comprovante')
        }
        comprovanteId = comprovanteData.data.id
      }

      // Upload das fotos via Edge Function
      for (const [index, photo] of selectedPhotos.entries()) {
        const fileExt = photo.file.name.split('.').pop()
        const fileName = `${comprovanteId}-${index}-${Date.now()}.${fileExt}`
        const filePath = `comprovantes/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(filePath, photo.file)

        if (uploadError) throw uploadError

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(filePath)

        // Usar dados EXIF da foto ou dados capturados manualmente
        const photoLocationData = photoHasCompleteExif(photo)
          ? {
              latitude: photo.exifData?.latitude,
              longitude: photo.exifData?.longitude,
              data_foto: photo.exifData?.dateTime?.toISOString()
            }
          : {
              latitude: currentLocation?.lat,
              longitude: currentLocation?.lng,
              data_foto: currentLocation?.capturedAt?.toISOString()
            }

        // Salvar registro da foto via Edge Function
        const { data: fotoData, error: fotoError } = await supabase.functions.invoke('manage-comprovantes', {
          body: {
            action: 'uploadPhoto',
            data: {
              comprovante_id: comprovanteId,
              url_foto: publicUrl,
              tipo: 'entrega',
              descricao: `Foto ${index + 1} da entrega da viagem ${viagem.numero}`,
              latitude: photoLocationData.latitude,
              longitude: photoLocationData.longitude,
              data_foto: photoLocationData.data_foto
            }
          }
        })

        if (fotoError || !fotoData?.success) {
          throw new Error(fotoData?.error || 'Erro ao salvar foto')
        }
      }

      // Atualizar status do comprovante via Edge Function
      const { data: updateData, error: updateError } = await supabase.functions.invoke('manage-comprovantes', {
        body: {
          action: 'update',
          data: {
            id: comprovanteId,
            status: 'confirmado',
            data_entrega: new Date().toISOString(),
            total_fotos: selectedPhotos.length,
            observacoes: observacoes
          }
        }
      })

      if (updateError || !updateData?.success) {
        throw new Error(updateData?.error || 'Erro ao atualizar comprovante')
      }

      // Marcar viagem como entregue se estiver finalizada via Edge Function
      if (viagem.status === 'finalizada') {
        const { data: viagemData, error: viagemError } = await supabase.functions.invoke('manage-viagens', {
          body: {
            action: 'update',
            data: {
              id: viagem.id,
              status: 'entregue',
              updated_at: new Date().toISOString()
            }
          }
        })

        if (viagemError || !viagemData?.success) {
          throw new Error(viagemData?.error || 'Erro ao atualizar viagem')
        }
      }

      return comprovanteId
    },
    onSuccess: () => {
      toast.success('Comprovante enviado com sucesso! Viagem marcada como entregue.')
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
            {/* Botão de localização e data */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {currentLocation ? '✓ Localização e Data Capturadas' : 'Capturar Localização e Data'}
                </Button>
                {currentLocation && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    GPS Ativo
                  </Badge>
                )}
              </div>
              
              {/* Aviso se não tem EXIF completo e não capturou localização */}
              {selectedPhotos.length > 0 && !selectedPhotos.some(photoHasCompleteExif) && !currentLocation && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  ⚠️ Esta foto não contém localização ou data. Capture manualmente para poder enviar.
                </div>
              )}
            </div>

            {/* Botão para selecionar foto */}
            <div className="space-y-3">
              {/* Botão para selecionar da galeria/arquivos */}
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
                  className="w-full h-16"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    📁 Selecionar Foto
                  </div>
                </Button>
              </div>
            </div>

            {/* Preview das fotos com dados EXIF */}
            {selectedPhotos.length > 0 && (
              <div className="space-y-4">
                <Label>Fotos Selecionadas ({selectedPhotos.length})</Label>
                {isProcessingExif && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando dados da foto...
                  </div>
                )}
                <div className="space-y-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <img
                          src={photo.previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              Foto {index + 1}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePhoto(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Dados EXIF */}
                          <div className="text-xs space-y-1">
                            {photo.exifData?.dateTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Data: {photo.exifData.dateTime.toLocaleString('pt-BR')}</span>
                              </div>
                            )}
                            {photo.exifData?.latitude && photo.exifData?.longitude && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>GPS: {photo.exifData.latitude.toFixed(6)}, {photo.exifData.longitude.toFixed(6)}</span>
                              </div>
                            )}
                            {!photo.exifData?.dateTime && !photo.exifData?.latitude && (
                              <span className="text-muted-foreground">Sem dados EXIF disponíveis</span>
                            )}
                          </div>
                        </div>
                      </div>
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
              disabled={!hasRequiredData() || uploadPhotosMutation.isPending || isProcessingExif}
              className="w-full h-16"
            >
              {uploadPhotosMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando Comprovante...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovante ({selectedPhotos.length} foto{selectedPhotos.length !== 1 ? 's' : ''})
                </>
              )}
            </Button>
            
            {/* Mensagem de ajuda */}
            {selectedPhotos.length === 0 && (
              <div className="text-xs text-center text-muted-foreground">
                Adicione pelo menos uma foto para enviar o comprovante
              </div>
            )}
            {selectedPhotos.length > 0 && !hasRequiredData() && (
              <div className="text-xs text-center text-orange-600">
                Esta foto não contém localização ou data. Clique em "Capturar Localização e Data" acima.
              </div>
            )}

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