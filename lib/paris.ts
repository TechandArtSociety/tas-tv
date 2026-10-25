const TZ = "Europe/Paris";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function parts(date: Date) {
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

/** "YYYY-MM-DD" of the Paris calendar day containing this instant. */
export function parisDay(date: Date): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Hour (0-23) on the Paris clock. */
export function parisHour(date: Date): number {
  return Number(parts(date).hour);
}

/** The next calendar day, as "YYYY-MM-DD". */
export function nextDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The instant of midnight, Paris time, at the start of `day` (handles the 23 h and 25 h days). */
export function parisMidnight(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  let guess = target;
  for (let step = 0; step < 3; step += 1) {
    const p = parts(new Date(guess));
    guess += target - Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  }
  return new Date(guess);
}
