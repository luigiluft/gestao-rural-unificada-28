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
 * Calcula a data máxima permitida para agendamento baseada em dias úteis
 */
export function getMaxScheduleDate(businessDaysLimit: number): string {
  const today = new Date();
  const maxDate = addBusinessDays(today, businessDaysLimit);
  
  // Retorna no formato YYYY-MM-DD para input type="date"
  return maxDate.toISOString().split('T')[0];
}

/**
 * Verifica se uma data está dentro do limite de dias úteis permitidos
 */
export function isDateWithinBusinessDaysLimit(
  targetDate: Date, 
  businessDaysLimit: number
): boolean {
  const today = new Date();
  const maxAllowedDate = addBusinessDays(today, businessDaysLimit);
  
  return targetDate <= maxAllowedDate;
}