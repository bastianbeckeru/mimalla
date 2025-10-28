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
    return color <= 0.03928
      ? color / 12.92
      : Math.pow((color + 0.055) / 1.055, 2.4);
  }

  const r = linearize(rgbColor.r);
  const g = linearize(rgbColor.g);
  const b = linearize(rgbColor.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

// Convertir HEX a HSL
function hexToHSL(hex: HexColor) {
  let r = 0,
    g = 0,
    b = 0;

  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1]!, 16);
    g = parseInt(hex[2] + hex[2]!, 16);
    b = parseInt(hex[3] + hex[3]!, 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2]!, 16);
    g = parseInt(hex[3] + hex[4]!, 16);
    b = parseInt(hex[5] + hex[6]!, 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convertir HSL a HEX
function hslToHex(h: number, s: number, l: number): HexColor {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Obtener versión complementaria del color (clara si es oscura, oscura si es clara)
function getComplementaryShade(hexColor: HexColor): HexColor {
  const hsl = hexToHSL(hexColor);

  // Si es oscuro (l < 50), hacer claro
  // Si es claro (l >= 50), hacer oscuro
  const newLightness =
    hsl.l < 50
      ? 85 // Color claro (pero no blanco puro)
      : 25; // Color oscuro (pero no negro puro)

  // Opcionalmente aumentar saturación para colores más vivos
  const newSaturation = Math.min(100, hsl.s * 1.2);

  return hslToHex(hsl.h, newSaturation, newLightness);
}

export function getContrastingShade(
  hexColor: HexColor,
  options: {
    darkLightness?: number;
    lightLightness?: number;
    saturationBoost?: number;
    threshold?: number;
  } = {},
) {
  const {
    darkLightness = 15, // Qué tan oscuro (0-100)
    lightLightness = 85, // Qué tan claro (0-100)
    saturationBoost = 1.2, // Multiplicador de saturación
    threshold = 50, // Umbral para considerar oscuro/claro
  } = options;

  const hsl = hexToHSL(hexColor);

  const isDark = hsl.l < threshold;
  const newLightness = isDark ? lightLightness : darkLightness;
  const newSaturation = Math.min(100, hsl.s * saturationBoost);

  return hslToHex(hsl.h, newSaturation, newLightness);
}
