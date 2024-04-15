// Function to convert hex color to RGB array
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values to RGB
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
}

// Function to calculate luminance from RGB values
function getLuminance(color: number[]) {
  const rgb = color.map((value) => {
    value /= 255; // Convert RGB value to the range 0-1
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance using relative luminance formula
  return (
    0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0)
  );
}

// Function to calculate contrast ratio between two colors
export function getContrastRatio(hexColor: string | undefined) {
  if (!hexColor) return 0;

  const backgroundColor = hexToRgb(hexColor);
  const textColor = hexToRgb("#FFFFFF");

  const luminance1 = getLuminance(backgroundColor);
  const luminance2 = getLuminance(textColor);

  // Ensure luminance1 is the lighter color
  const [lighter, darker] =
    luminance1 > luminance2
      ? [luminance1, luminance2]
      : [luminance2, luminance1];

  // Calculate contrast ratio
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  return contrastRatio;
}
