import { Link } from "react-router-dom";
import { useEmpresaMatriz } from "@/hooks/useEmpresaMatriz";

interface PlatformLogoProps {
  to?: string;
  showName?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PlatformLogo({ 
  to = "/site", 
  showName = true, 
  className = "",
  size = "md"
}: PlatformLogoProps) {
  const { data: empresaData } = useEmpresaMatriz();
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const logoElement = (
    <div className={`flex items-center gap-2 ${className}`}>
      {empresaData?.logo_url ? (
        <img 
          src={empresaData.logo_url} 
          alt={empresaData.nome_fantasia || "Logo"} 
          className={`${sizeClasses[size]} object-contain rounded-lg`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center`}>
          <span className="text-primary-foreground font-bold text-xl">
            {(empresaData?.nome_fantasia || "AgroHub").charAt(0)}
          </span>
        </div>
      )}
      {showName && (
        <span className={`font-bold ${textSizeClasses[size]} text-foreground`}>
          {empresaData?.nome_fantasia || "AgroHub"}
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="hover:opacity-90 transition-opacity">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
