export type RGBColor = {
  r: number; // red
  g: number; // green
  b: number; // blue
  a?: number; // alpha
};

export type HexColor = `#${string}`;
export type RGBAColor = `rgba(${number}, ${number}, ${number}, ${number})`;

export function hexToRgb(hexColor: HexColor) {
  const hex = hexColor.replace(/^#/, "");

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

export function hexToRgba(hexColor: HexColor, a = 1.0): RGBAColor {
  const { r, g, b } = hexToRgb(hexColor);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function getLuminance(hexColor: HexColor): number {
  const rgbColor = hexToRgb(hexColor);

  // Convert RGB components to linear values
  function linearize(color: number) {
    color /= 255;
    return color <= 0.04045
      ? color / 12.92
      : Math.pow((color + 0.055) / 1.055, 2.4);
  }

  const r = linearize(rgbColor.r);
  const g = linearize(rgbColor.g);
  const b = linearize(rgbColor.b);

  // Calculate luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance;
}

export function getContrastRatio({
  backgroundColor,
  foregroundColor,
}: {
  backgroundColor: HexColor;
  foregroundColor: HexColor;
}): number {
  const bgLuminance = getLuminance(backgroundColor);
  const fgLuminance = getLuminance(foregroundColor);

  const brighter = Math.max(bgLuminance, fgLuminance);
  const darker = Math.min(bgLuminance, fgLuminance);

  return (brighter + 0.05) / (darker + 0.05);
}

export function parseHexColor(color: string): HexColor {
  // Expresión regular para verificar el formato de un color hexadecimal (# seguido de 3 o 6 carácteres hexadecimales)
  const hexColorPattern = /^#([0-9A-Fa-f]{3}){1,2}$/;

  return (hexColorPattern.test(color) && color) as HexColor;
}

export function checkContrasts({
  elementColor,
  lowContrastThreshold = 2,
}: {
  elementColor: string;
  lowContrastThreshold?: number;
}) {
  const isDarkMode = true;
  const parsedColor = parseHexColor(elementColor);
  const backgroundColor = isDarkMode ? "#0a0a0a" : "#ffffff";
  const textColor = isDarkMode ? "#fafafa" : "#0a0a0a";

  const backgroundElementContrast = getContrastRatio({
    backgroundColor: backgroundColor,
    foregroundColor: parsedColor,
  });

  const elementTextContrast = getContrastRatio({
    backgroundColor: parsedColor,
    foregroundColor: textColor,
  });

  return {
    backgroundElementContrast,
    elementTextContrast,
    hasLowBackgroundElementContrast:
      backgroundElementContrast < lowContrastThreshold,
    hasLowElementTextContrast: elementTextContrast < lowContrastThreshold,
  };
}
