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
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
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

  // Mutation para upload de fotos
  const uploadPhotosMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPhotos || selectedPhotos.length === 0) {
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
      const uploadPromises = selectedPhotos.map(async (photo, index) => {
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

        // Salvar registro da foto com dados EXIF
        const { error: fotoError } = await supabase
          .from('comprovante_fotos')
          .insert({
            comprovante_id: comprovanteId,
            url_foto: publicUrl,
            tipo: 'entrega',
            descricao: `Foto ${index + 1} da entrega da viagem ${viagem.numero}`,
            latitude: photo.exifData?.latitude,
            longitude: photo.exifData?.longitude,
            data_foto: photo.exifData?.dateTime?.toISOString()
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
          total_fotos: selectedPhotos.length,
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

            {/* Botões de captura e seleção */}
            <div className="space-y-3">
              {/* Botão para tirar foto */}
              <Button
                variant="default"
                onClick={takePhoto}
                disabled={isCapturingPhoto}
                className="w-full h-16"
              >
                {isCapturingPhoto ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Abrindo Câmera...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-2" />
                    📷 Tirar Foto
                  </>
                )}
              </Button>

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
                    📁 Selecionar da Galeria
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
              disabled={selectedPhotos.length === 0 || uploadPhotosMutation.isPending || isProcessingExif}
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
                  Enviar Comprovante ({selectedPhotos.length} fotos)
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