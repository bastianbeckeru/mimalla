export const useOperatingSystem = () => {
  const isApple = (
    navigator.userAgent || // preferido
    navigator.platform || // fallback
    ""
  )
    .toUpperCase()
    .includes("MAC");

  return { isApple, modifierKey: isApple ? "⌘" : "Ctrl" };
};
