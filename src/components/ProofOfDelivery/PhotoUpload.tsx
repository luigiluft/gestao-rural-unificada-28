import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  deliveryId: string;
  onPhotoUploaded: () => void;
}

interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  timestamp?: Date;
  size: number;
  type: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ deliveryId, onPhotoUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [recebidoPor, setRecebidoPor] = useState('');
  const [documentoRecebedor, setDocumentoRecebedor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  const extractPhotoMetadata = async (file: File): Promise<PhotoMetadata> => {
    return new Promise((resolve) => {
      const metadata: PhotoMetadata = {
        size: file.size,
        type: file.type,
        timestamp: new Date()
      };

      // Try to extract EXIF data
      const reader = new FileReader();
      reader.onload = () => {
        // In a real implementation, you would use an EXIF library
        // For now, we'll use the current location if available
        if (location) {
          metadata.latitude = location.lat;
          metadata.longitude = location.lng;
        }
        resolve(metadata);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Apenas arquivos de imagem são permitidos');
    }

    // Limit to 5 files
    const limitedFiles = validFiles.slice(0, 5);
    
    if (limitedFiles.length < validFiles.length) {
      toast.warning('Máximo de 5 fotos por entrega');
    }

    setSelectedFiles(limitedFiles);

    // Create previews
    const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => {
      // Clean up old previews
      prev.forEach(url => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up the removed preview
      if (prev[index]) {
        URL.revokeObjectURL(prev[index]);
      }
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos uma foto');
      return;
    }

    if (!recebidoPor.trim()) {
      toast.error('Informe quem recebeu a entrega');
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos and extract metadata
      const photoPromises = selectedFiles.map(async (file, index) => {
        const metadata = await extractPhotoMetadata(file);
        
        // Upload to Supabase Storage
        const fileName = `${deliveryId}/${Date.now()}-${index}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create photo record
        const { error: photoError } = await supabase
          .from('comprovante_fotos')
          .insert({
            comprovante_id: deliveryId,
            url_foto: uploadData.path,
            tipo: 'comprovante_entrega',
            descricao: `Foto ${index + 1} - ${metadata.latitude && metadata.longitude ? 
              `Localização: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}` : 
              'Sem localização'}`
          });

        if (photoError) throw photoError;

        return metadata;
      });

      const metadatas = await Promise.all(photoPromises);

      // Get the timestamp from the photo (or use current time)
      const photoTimestamp = metadatas[0]?.timestamp || new Date();

      // Update delivery record
      const { error: updateError } = await supabase
        .from('comprovantes_entrega')
        .update({
          status: 'entregue',
          recebido_por: recebidoPor,
          documento_recebedor: documentoRecebedor || null,
          observacoes: observacoes || null,
          data_entrega: photoTimestamp.toISOString(),
          total_fotos: selectedFiles.length,
          latitude: metadatas[0]?.latitude || location?.lat,
          longitude: metadatas[0]?.longitude || location?.lng
        })
        .eq('id', deliveryId);

      if (updateError) throw updateError;

      // Update delivery assignment status
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ status: 'concluido' })
        .eq('comprovante_id', deliveryId);

      if (assignmentError) throw assignmentError;

      toast.success('Comprovante enviado com sucesso!');
      onPhotoUploaded();
    } catch (error: any) {
      console.error('Erro ao enviar comprovante:', error);
      toast.error('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Comprovante de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location indicator */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <MapPin className="h-4 w-4" />
            <span>Localização capturada</span>
          </div>
        )}

        {/* File input */}
        <div>
          <Label>Fotos da Entrega</Label>
          <div className="mt-2">
            <Input
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
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Tirar/Selecionar Fotos
            </Button>
          </div>
        </div>

        {/* Photo previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="recebido-por">Recebido por *</Label>
            <Input
              id="recebido-por"
              value={recebidoPor}
              onChange={(e) => setRecebidoPor(e.target.value)}
              placeholder="Nome de quem recebeu a entrega"
              required
            />
          </div>

          <div>
            <Label htmlFor="documento">Documento (CPF/RG/CNH)</Label>
            <Input
              id="documento"
              value={documentoRecebedor}
              onChange={(e) => setDocumentoRecebedor(e.target.value)}
              placeholder="Documento do recebedor (opcional)"
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a entrega (opcional)"
              rows={3}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Máximo de 5 fotos por entrega</p>
          <p>• As fotos devem mostrar claramente a entrega</p>
          <p>• A localização será capturada automaticamente</p>
        </div>
      </CardContent>
    </Card>
  );
};