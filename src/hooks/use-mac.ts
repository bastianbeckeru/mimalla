import { useEffect, useState } from "react";

export const useIsMac = () => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0,
    );
  }, []);

  return isMac;
};
