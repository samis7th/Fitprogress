export function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function formatDateBR(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return getLocalDateString(value).split("-").reverse().join("/");
  }

  const [year, month, day] = String(value).slice(0, 10).split("-");

  if (!year || !month || !day) {
    return String(value);
  }

  return `${day}/${month}/${year}`;
}

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function getWeekStart(date = new Date()) {
  const localDate = parseLocalDate(getLocalDateString(date));
  localDate.setDate(localDate.getDate() - localDate.getDay());
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

export function isSameWeek(dateA, dateB = new Date()) {
  const firstDate = parseLocalDate(dateA);
  const secondDate = parseLocalDate(dateB);

  if (!firstDate || !secondDate) return false;

  return getLocalDateString(getWeekStart(firstDate)) === getLocalDateString(getWeekStart(secondDate));
}

export function isPlanCompletedForDate(plan, date = new Date()) {
  return Boolean(plan?.status === "concluido" && plan?.concluido_em && isSameWeek(plan.concluido_em, date));
}
