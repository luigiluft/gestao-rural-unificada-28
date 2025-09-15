import { useState, useRef, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NFParser, NFData } from "./NFParser";
import { useTutorial } from "@/contexts/TutorialContext";

interface FileUploadProps {
  onNFDataParsed: (data: NFData) => void;
  onError: (message: string) => void;
}

export function FileUpload({ onNFDataParsed, onError }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isActive, currentStepData } = useTutorial();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus('idle');

    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xml') || fileType === 'text/xml' || fileType === 'application/xml') {
        // Processar XML
        const content = await file.text();
        
        if (!NFParser.validateXML(content)) {
          throw new Error('Arquivo XML inválido ou não é uma NFe válida');
        }

        const nfData = NFParser.parseXML(content);
        if (!nfData) {
          throw new Error('Erro ao processar dados da NFe');
        }

        // Adicionar o conteúdo XML completo aos dados
        nfData.xmlContent = content;

        onNFDataParsed(nfData);
        setUploadStatus('success');
      } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
        // Por enquanto, mostrar mensagem que PDF será implementado
        throw new Error('Processamento de PDF será implementado em breve. Use o XML da NFe por enquanto.');
      } else {
        throw new Error('Formato de arquivo não suportado. Use XML ou PDF da NFe.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      onError(message);
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    // During tutorial, trigger mock data loading instead of file dialog
    if (isActive && currentStepData?.id === 'selecionar-arquivo-nf') {
      const event = new CustomEvent('tutorial-trigger-nf-upload');
      document.dispatchEvent(event);
      return;
    }
    
    fileInputRef.current?.click();
  };

  // Listen for tutorial NF upload simulation
  useEffect(() => {
    const handleTutorialUpload = (event: CustomEvent) => {
      const mockData = event.detail;
      setIsProcessing(true);
      
      // Show specific message for tutorial mode with database entry
      setTimeout(() => {
        onNFDataParsed(mockData);
        setUploadStatus('success');
        setIsProcessing(false);
        
        // Show additional feedback if it's from the database
        if (mockData.entradaId) {
          console.log('Entrada criada no banco de dados com ID:', mockData.entradaId);
        }
      }, 1500);
    };

    document.addEventListener('tutorial-nf-upload', handleTutorialUpload as EventListener);
    
    return () => {
      document.removeEventListener('tutorial-nf-upload', handleTutorialUpload as EventListener);
    };
  }, [onNFDataParsed]);

  return (
    <div className="space-y-4">
      <Card 
        className={`transition-all duration-200 ${
          isDragOver 
            ? 'border-primary bg-primary/5 shadow-md' 
            : 'border-dashed border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={`p-4 rounded-full ${
              uploadStatus === 'success' 
                ? 'bg-success/10' 
                : uploadStatus === 'error' 
                  ? 'bg-destructive/10' 
                  : 'bg-muted'
            }`}>
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-8 h-8 text-success" />
              ) : uploadStatus === 'error' ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isProcessing ? 'Processando arquivo...' : 'Upload de Nota Fiscal'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Arraste e solte o arquivo XML ou PDF da NFe aqui, ou clique para selecionar
              </p>
              
              <Button 
                onClick={openFileDialog}
                disabled={isProcessing}
                variant="outline"
                className="mb-4"
                data-tutorial="selecionar-arquivo-btn"
              >
                <FileText className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: XML (.xml) e PDF (.pdf)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadStatus === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Dados carregados e preenchidos no formulário! No tutorial, utilizamos dados de demonstração pré-configurados.
          </AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.pdf,application/xml,application/pdf,text/xml"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}