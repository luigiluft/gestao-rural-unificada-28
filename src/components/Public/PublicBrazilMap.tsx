import { useEffect, useRef, useState } from "react";
import brazilMapSvg from "@/assets/brazil-map.svg?raw";
import { useDepositosParaMapa } from "@/hooks/useDepositosParaMapa";

interface HoveredDeposito {
  nome: string;
  cidade: string;
  estado: string;
  tipo: string;
  x: number;
  y: number;
}

export function PublicBrazilMap() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [hoveredDeposito, setHoveredDeposito] = useState<HoveredDeposito | null>(null);
  const { data: depositos, isLoading } = useDepositosParaMapa();

  useEffect(() => {
    if (!depositos || depositos.length === 0) return;

    const container = svgRef.current;
    if (!container) return;

    const svgElement = container.querySelector("svg");
    if (!svgElement) return;

    // Ajustar viewBox / responsivo
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Reset todos os paths para cor padrão
    const allPaths = svgElement.querySelectorAll("path");
    allPaths.forEach((path) => {
      const p = path as SVGPathElement;
      p.setAttribute("fill", "#e5e7eb");
      p.setAttribute("stroke", "#ffffff");
      p.setAttribute("stroke-width", "0.5");
      p.style.cursor = "default";
    });

    // Remover marcadores antigos
    svgElement.querySelectorAll("[data-marker='deposito']").forEach((el) => el.remove());

    const listeners: {
      el: Element;
      enter: (e: MouseEvent) => void;
      leave: (e: MouseEvent) => void;
    }[] = [];

    // Destacar municípios com depósitos + criar marcador
    depositos.forEach((deposito) => {
      const escapedId = CSS.escape(deposito.svgId);
      const path = svgElement.querySelector(`#${escapedId}`) as SVGPathElement | null;

      if (!path) {
        console.warn(`❌ Município não encontrado: ${deposito.svgId}`);
        return;
      }

      const color = deposito.tipo_deposito === "franquia" ? "#22c55e" : "#3b82f6";

      // destacar o município
      path.setAttribute("fill", color);
      path.setAttribute("stroke", "#14532d");
      path.setAttribute("stroke-width", "1.5");
      path.style.cursor = "pointer";

      // calcular centro do município
      const bbox = path.getBBox();
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      // criar marcador (círculo)
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("data-marker", "deposito");
      marker.setAttribute("cx", String(cx));
      marker.setAttribute("cy", String(cy));
      marker.setAttribute("r", "8");
      marker.setAttribute("fill", deposito.tipo_deposito === "franquia" ? "#16a34a" : "#2563eb");
      marker.setAttribute("stroke", "#ffffff");
      marker.setAttribute("stroke-width", "1.2");
      marker.style.cursor = "pointer";

      const parent = (path.parentNode as SVGGElement) ?? svgElement;
      parent.appendChild(marker);

      const handleMouseEnter = (e: MouseEvent) => {
        path.setAttribute("opacity", "0.8");
        marker.setAttribute("opacity", "0.9");
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
        marker.setAttribute("opacity", "1");
        setHoveredDeposito(null);
      };

      path.addEventListener("mouseenter", handleMouseEnter);
      path.addEventListener("mouseleave", handleMouseLeave);
      marker.addEventListener("mouseenter", handleMouseEnter);
      marker.addEventListener("mouseleave", handleMouseLeave);

      listeners.push(
        { el: path, enter: handleMouseEnter, leave: handleMouseLeave },
        { el: marker, enter: handleMouseEnter, leave: handleMouseLeave },
      );
    });

    return () => {
      listeners.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      svgElement.querySelectorAll("[data-marker='deposito']").forEach((el) => el.remove());
    };
  }, [depositos]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Carregando mapa...
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={svgRef} 
        className="w-full h-[300px]" 
        dangerouslySetInnerHTML={{ __html: brazilMapSvg }} 
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-3">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Franquias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Filiais</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDeposito && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: hoveredDeposito.x + 10,
            top: hoveredDeposito.y + 10,
          }}
        >
          <p className="font-semibold">{hoveredDeposito.nome}</p>
          <p className="text-sm text-muted-foreground">
            {hoveredDeposito.cidade}, {hoveredDeposito.estado}
          </p>
          <p className="text-xs capitalize mt-1">
            {hoveredDeposito.tipo === "franquia" ? "Franquia" : "Filial"}
          </p>
        </div>
      )}
    </div>
  );
}
