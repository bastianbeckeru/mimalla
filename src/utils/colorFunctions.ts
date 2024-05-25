export function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, "");

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

export function hexToRgba(hexColor: string, alpha = 1.0) {
  const { r, g, b } = hexToRgb(hexColor);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLuminance(rgbColor: { r: number; g: number; b: number }) {
  const rgb = [rgbColor.r, rgbColor.g, rgbColor.b].map((v) => {
    v /= 255; // Convert RGB value to the range 0-1
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance using relative luminance formula
  return (
    (rgb[0] ?? 0 * 0.2126) + (rgb[1] ?? 0 * 0.7152) + (rgb[2] ?? 0 * 0.0722)
  );
}

export function getHexContrastRatio(hexColor: string) {
  const backgroundColor = hexToRgb(hexColor);
  const textColor = { r: 255, g: 255, b: 255 }; // White

  const luminance1 = getLuminance(backgroundColor);
  const luminance2 = getLuminance(textColor);

  const brighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (brighter + 0.05) / (darker + 0.05);
}