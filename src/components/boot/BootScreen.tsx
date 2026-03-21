"use client";

import { useState, useEffect } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  { text: "[    0.000000] kelvin-os v1.0 initializing...", delay: 100 },
  { text: "[    0.001234] CPU: Virtual Processor @ 3.5GHz", delay: 80 },
  { text: "[    0.002000] Memory: 16384MB available", delay: 60 },
  { text: "[    0.003100] Loading kernel modules...", delay: 120 },
  { text: "[  OK  ] Started filesystem service", delay: 100 },
  { text: "[  OK  ] Mounted virtual filesystem", delay: 80 },
  { text: "[  OK  ] Loading user profile...", delay: 150 },
  { text: "[  OK  ] Started window manager", delay: 100 },
  { text: "[  OK  ] Started terminal service", delay: 80 },
  { text: "[  OK  ] Started network manager", delay: 60 },
  { text: "[  OK  ] Loading desktop environment...", delay: 200 },
  { text: "", delay: 100 },
  { text: "kelvin-os login: visitor (automatic login)", delay: 150 },
  { text: "", delay: 100 },
  { text: "Welcome to kelvin-os v1.0", delay: 300 },
];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const showNextLine = () => {
      if (currentIndex >= BOOT_MESSAGES.length) {
        timeout = setTimeout(() => {
          setDone(true);
          setTimeout(onComplete, 500);
        }, 400);
        return;
      }

      const msg = BOOT_MESSAGES[currentIndex];
      currentIndex++;

      timeout = setTimeout(() => {
        setVisibleLines((prev) => [...prev, msg.text]);
        showNextLine();
      }, msg.delay);
    };

    showNextLine();

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-black z-[9999] flex flex-col justify-end p-8 font-mono text-sm transition-opacity duration-500 ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="max-w-3xl">
        {visibleLines.map((line, i) => (
          <div
            key={i}
            className={`leading-relaxed ${
              line.startsWith("[  OK  ]")
                ? "text-green-400"
                : line.startsWith("Welcome")
                  ? "text-terminal-accent font-bold"
                  : "text-terminal-fg/70"
            }`}
          >
            {line.startsWith("[  OK  ]") ? (
              <>
                <span className="text-green-400">[ OK ]</span>
                <span className="text-terminal-fg/70">{line.slice(8)}</span>
              </>
            ) : (
              line || "\u00A0"
            )}
          </div>
        ))}
        {!done && <span className="inline-block w-2 h-4 bg-terminal-fg animate-pulse ml-1" />}
      </div>
    </div>
  );
}
