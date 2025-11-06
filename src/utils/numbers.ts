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

export const formatCurrency = (
  value: number,
  notation: "standard" | "compact" = "standard",
) => {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    notation: notation,
    minimumFractionDigits: notation === "standard" ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);

  return notation === "compact" ? formatted.replace(/\s/g, "") : formatted;
};

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

export function calculateStatistics(numbers: number[]) {
  if (numbers.length === 0) {
    throw new Error("Array cannot be empty");
  }

  // Sort array for median and quartile calculations
  const sorted = [...numbers].sort((a, b) => a - b);
  const count = numbers.length;

  // Sum
  const sum = numbers.reduce((acc, num) => acc + num, 0);

  // Mean (Average)
  const mean = sum / count;

  // Median
  const median = calculateMedian(sorted);

  // Mode
  const mode = calculateMode(numbers);

  // Min and Max
  const min = sorted[0]!;
  const max = sorted[count - 1]!;

  // Range
  const range = max - min;

  // Variance
  const variance =
    numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / count;

  // Standard Deviation
  const standardDeviation = Math.sqrt(variance);

  // Quartiles
  const q1 = calculateMedian(sorted.slice(0, Math.floor(count / 2)));
  const q2 = median;
  const q3 = calculateMedian(sorted.slice(Math.ceil(count / 2)));

  return {
    mean,
    median,
    mode,
    range,
    min,
    max,
    variance,
    standardDeviation,
    sum,
    count,
    quartiles: {
      q1,
      q2,
      q3,
    },
  };
}

export function calculateMedian(array: number[]): number {
  if (array.length === 0) {
    throw new Error("Cannot calculate median of an empty array");
  }

  const sortedArray = [...array].sort((a, b) => a - b);
  const length = sortedArray.length;
  const mid = Math.floor(length / 2);

  if (length % 2 === 0) {
    return (sortedArray[mid - 1]! + sortedArray[mid]!) / 2;
  }
  return sortedArray[mid]!;
}

function calculateMode(numbers: number[]): number[] {
  const frequency: Map<number, number> = new Map();

  // Count frequencies
  numbers.forEach((num) => {
    frequency.set(num, (frequency.get(num) || 0) + 1);
  });

  // Find maximum frequency
  const maxFrequency = Math.max(...frequency.values());

  // Get all numbers with maximum frequency
  const modes = Array.from(frequency.entries())
    .filter(([_, freq]) => freq === maxFrequency)
    .map(([num, _]) => num);

  // If all numbers appear once, there's no mode
  if (maxFrequency === 1) {
    return [];
  }

  return modes.sort((a, b) => a - b);
}
