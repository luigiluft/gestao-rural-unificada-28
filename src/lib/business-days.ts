/**
 * Utilitários para cálculo de dias úteis
 * Considera apenas fins de semana (sábado e domingo) como não úteis
 */

/**
 * Verifica se uma data é um dia útil (segunda a sexta)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = segunda, 5 = sexta
}

/**
 * Adiciona N dias úteis a uma data
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < businessDays) {
    result.setDate(result.getDate() + 1);
    
    if (isBusinessDay(result)) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Calcula a data mínima permitida para agendamento (APÓS os dias úteis bloqueados)
 */
export function getMinScheduleDate(businessDaysBlocked: number): string {
  const today = new Date();
  // Normalizar para início do dia
  today.setHours(0, 0, 0, 0);
  
  const minDate = addBusinessDays(today, businessDaysBlocked);
  
  // Retorna no formato YYYY-MM-DD para input type="date"
  return minDate.toISOString().split('T')[0];
}

/**
 * Verifica se uma data está A PARTIR do período de dias úteis bloqueados (inclusive)
 */
export function isDateAfterBlockedBusinessDays(
  targetDate: Date, 
  businessDaysBlocked: number
): boolean {
  const today = new Date();
  // Normalizar ambas as datas para início do dia para comparação correta
  today.setHours(0, 0, 0, 0);
  
  const targetDateNormalized = new Date(targetDate);
  targetDateNormalized.setHours(0, 0, 0, 0);
  
  const minAllowedDate = addBusinessDays(today, businessDaysBlocked);
  
  return targetDateNormalized >= minAllowedDate;
}