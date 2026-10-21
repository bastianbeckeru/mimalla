export function parsePeriodKey(key: string) {
  const [year = 0, term = 0] = key.split("-").map(Number);
  return { year, term };
}

export function comparePeriodKeys(a: string, b: string) {
  const periodA = parsePeriodKey(a);
  const periodB = parsePeriodKey(b);
  return periodA.year - periodB.year || periodA.term - periodB.term;
}
