import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  // 1. 'isMounted' adında bir state oluşturuyoruz. Başlangıç değeri 'false'.
  const [isMounted, setIsMounted] = useState(false);

  // 2. useEffect hook'u, sadece tarayıcıda, component ilk render olduktan sonra çalışır.
  useEffect(() => {
    // Component'in tarayıcıya mount olduğunu (yerleştiğini) state'e kaydediyoruz.
    setIsMounted(true);
  }, []); // Boş dizi, bu etkinin sadece bir kez çalışmasını sağlar.

  // 3. Eğer component henüz tarayıcıya mount olmadıysa (yani SSR sırasında veya ilk anda), hiçbir şey render etme (null).
  if (!isMounted) {
    return null;
  }

  // 4. Eğer component tarayıcıya mount olduysa, o zaman çocuklarını (children) render et.
  return <>{children}</>;
};

export default ClientOnly;
