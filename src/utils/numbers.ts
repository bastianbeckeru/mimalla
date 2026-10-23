export function arabicToRoman(num: number): string {
  if (num < 1 || num > 100) {
    throw new Error(`El número debe estar entre 1 y 100. (${num})`);
  }

  const romanNumerals: { value: number; numeral: string }[] = [
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];

  let result = "";

  for (const { value, numeral } of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }

  return result;
}

export function calculateMedian(array: number[]): number {
  if (array.length === 0) {
    throw new Error("Cannot calculate median of an empty array");
  }

  const sortedArray = [...array].sort((a, b) => a - b);
  const length = sortedArray.length;
  const mid = Math.floor(length / 2);

  const upper = sortedArray[mid] ?? 0;

  if (length % 2 === 0) {
    return ((sortedArray[mid - 1] ?? upper) + upper) / 2;
  }
  return upper;
}
