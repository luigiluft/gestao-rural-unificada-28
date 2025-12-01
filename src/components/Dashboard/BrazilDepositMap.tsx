import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDepositosParaMapa } from "@/hooks/useDepositosParaMapa";
import { Skeleton } from "@/components/ui/skeleton";
import brazilMapSvg from "@/assets/brazil-map.svg?raw";

export const BrazilDepositMap = () => {
  const svgRef = useRef<HTMLDivElement>(null);
  const { data: depositos, isLoading } = useDepositosParaMapa();
  const [hoveredDeposito, setHoveredDeposito] = useState<{
    nome: string;
    cidade: string;
    estado: string;
    tipo: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !depositos || depositos.length === 0) return;

    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    // Ajustar viewBox para garantir que o mapa inteiro seja visível
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Reset all paths to default color
    const allPaths = svgElement.querySelectorAll("path");
    allPaths.forEach((path) => {
      path.setAttribute("fill", "#e5e7eb");
      path.setAttribute("stroke", "#ffffff");
      path.setAttribute("stroke-width", "0.5");
    });

    // Highlight municipalities with deposits
    depositos.forEach((deposito) => {
      console.log(`🔍 Procurando município: #${deposito.svgId}`);
      const path = svgElement.querySelector(`#${deposito.svgId}`);
      
      if (path) {
        console.log(`✅ Município encontrado: ${deposito.svgId}`);
        const color = deposito.tipo_deposito === "franquia" ? "#10b981" : "#3b82f6";
        path.setAttribute("fill", color);
        path.setAttribute("stroke", "#ffffff");
        path.setAttribute("stroke-width", "1");
        path.classList.add("cursor-pointer", "transition-all", "duration-200");
        path.setAttribute("data-deposito", JSON.stringify(deposito));

        const handleMouseEnter = (e: MouseEvent) => {
          path.setAttribute("opacity", "0.8");
          const rect = (e.target as SVGElement).getBoundingClientRect();
          setHoveredDeposito({
            nome: deposito.nome,
            cidade: deposito.cidade,
            estado: deposito.estado,
            tipo: deposito.tipo_deposito,
            x: e.clientX,
            y: e.clientY,
          });
        };

        const handleMouseLeave = () => {
          path.setAttribute("opacity", "1");
          setHoveredDeposito(null);
        };

        path.addEventListener("mouseenter", handleMouseEnter as any);
        path.addEventListener("mouseleave", handleMouseLeave as any);
      } else {
        console.warn(`❌ Município não encontrado no SVG: ${deposito.svgId}`);
      }
    });
  }, [depositos]);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Depósitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Depósitos
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Franquia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Filial</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            ref={svgRef}
            className="w-full h-[500px] rounded-lg border bg-muted/20 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: brazilMapSvg }}
          />
          
          {/* Tooltip */}
          {hoveredDeposito && (
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${hoveredDeposito.x + 10}px`,
                top: `${hoveredDeposito.y + 10}px`,
              }}
            >
              <Card className="shadow-lg border-2">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    <p className="font-semibold text-sm">{hoveredDeposito.nome}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hoveredDeposito.cidade}, {hoveredDeposito.estado}
                  </p>
                  <Badge variant={hoveredDeposito.tipo === "franquia" ? "default" : "secondary"} className="text-xs">
                    {hoveredDeposito.tipo === "franquia" ? "Franquia" : "Filial"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
