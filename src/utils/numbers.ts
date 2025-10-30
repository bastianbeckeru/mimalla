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
