/**
 * Utilitários para cálculo de janelas de entrega
 */

import { addBusinessDays } from "./business-days";
import { format } from "date-fns";

/**
 * Calcula a data final da janela de entrega
 * @param startDate Data de início da janela
 * @param windowDays Quantidade de dias da janela
 * @returns Data final da janela
 */
export function calculateDeliveryWindowEnd(startDate: Date, windowDays: number): Date {
  if (windowDays <= 1) {
    return new Date(startDate);
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (windowDays - 1));
  return endDate;
}

/**
 * Formata a janela de entrega para exibição
 * @param startDate Data de início da janela
 * @param windowDays Quantidade de dias da janela
 * @returns String formatada da janela (ex: "15/09 a 17/09")
 */
export function formatDeliveryWindow(startDate: Date, windowDays: number): string {
  const endDate = calculateDeliveryWindowEnd(startDate, windowDays);
  
  if (windowDays <= 1) {
    return format(startDate, "dd/MM");
  }
  
  return `${format(startDate, "dd/MM")} a ${format(endDate, "dd/MM")}`;
}

/**
 * Formata a janela de entrega completa com descrição
 * @param startDate Data de início da janela
 * @param windowDays Quantidade de dias da janela
 * @returns String formatada completa (ex: "15/09 a 17/09 (3 dias)")
 */
export function formatDeliveryWindowComplete(startDate: Date, windowDays: number): string {
  const windowText = formatDeliveryWindow(startDate, windowDays);
  const dayText = windowDays === 1 ? "dia" : "dias";
  return `${windowText} (${windowDays} ${dayText})`;
}

/**
 * Verifica se uma data está dentro da janela de entrega
 * @param targetDate Data a ser verificada
 * @param windowStart Data de início da janela
 * @param windowDays Quantidade de dias da janela
 * @returns true se a data está dentro da janela
 */
export function isDateInDeliveryWindow(
  targetDate: Date, 
  windowStart: Date, 
  windowDays: number
): boolean {
  const windowEnd = calculateDeliveryWindowEnd(windowStart, windowDays);
  
  // Normalizar datas para comparação
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const start = new Date(windowStart);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(windowEnd);
  end.setHours(23, 59, 59, 999);
  
  return target >= start && target <= end;
}