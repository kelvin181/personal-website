"use client";

import { useState, useCallback } from "react";
import BootScreen from "@/components/boot/BootScreen";
import Desktop from "@/components/desktop/Desktop";

export default function Home() {
  const [booting, setBooting] = useState(true);

  const handleBootComplete = useCallback(() => {
    setBooting(false);
  }, []);

  return (
    <>
      {booting && <BootScreen onComplete={handleBootComplete} />}
      <Desktop />
    </>
  );
}
