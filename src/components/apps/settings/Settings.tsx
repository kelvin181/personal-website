"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setFontSize,
  setColorScheme,
  resetSettings,
  COLOR_SCHEMES,
  FontSize,
  ColorScheme,
} from "@/store/settingsSlice";
import { setUsername, setHostname } from "@/store/sessionSlice";
import { setWallpaper, WALLPAPERS } from "@/store/desktopSlice";
import { resetFilesystem } from "@/store/filesystemSlice";

type Section = "system" | "appearance" | "about";

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "system", label: "System" },
  { id: "appearance", label: "Appearance" },
  { id: "about", label: "About" },
];

export default function Settings() {
  const dispatch = useAppDispatch();
  const [activeSection, setActiveSection] = useState<Section>("system");
  const { fontSize, colorScheme } = useAppSelector((s) => s.settings);
  const { username, hostname } = useAppSelector((s) => s.session);
  const wallpaper = useAppSelector((s) => s.desktop.wallpaper);

  return (
    <div className="flex h-full flex-row bg-[var(--color-terminal-bg,#0d1117)] font-mono text-sm">
      {/* Sidebar */}
      <div className="w-40 shrink-0 border-r border-terminal-dim/30">
        <div className="px-3 py-2 text-xs uppercase text-terminal-dim">Settings</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`block w-full px-3 py-2 text-left transition-colors ${
              activeSection === item.id
                ? "border-l-2 border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                : "text-terminal-dim hover:bg-white/5 hover:text-terminal-fg"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-y-auto p-4 text-terminal-fg">
        {activeSection === "system" && (
          <SystemPanel
            username={username}
            hostname={hostname}
            onUsernameChange={(v) => dispatch(setUsername(v))}
            onHostnameChange={(v) => dispatch(setHostname(v))}
            onResetFilesystem={() => dispatch(resetFilesystem())}
          />
        )}
        {activeSection === "appearance" && (
          <AppearancePanel
            wallpaper={wallpaper}
            fontSize={fontSize}
            colorScheme={colorScheme}
            onWallpaperChange={(k) => dispatch(setWallpaper(k))}
            onFontSizeChange={(v) => dispatch(setFontSize(v))}
            onColorSchemeChange={(v) => dispatch(setColorScheme(v))}
          />
        )}
        {activeSection === "about" && (
          <AboutPanel
            onResetAll={() => {
              dispatch(resetSettings());
              dispatch(setWallpaper("dark"));
              dispatch(setUsername("visitor"));
              dispatch(setHostname("kelvin-os"));
            }}
          />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 text-xs uppercase tracking-widest text-terminal-dim">{title}</h2>;
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="w-24 shrink-0 text-terminal-dim">{label}</span>
      {children}
    </div>
  );
}

function SystemPanel({
  username,
  hostname,
  onUsernameChange,
  onHostnameChange,
  onResetFilesystem,
}: {
  username: string;
  hostname: string;
  onUsernameChange: (v: string) => void;
  onHostnameChange: (v: string) => void;
  onResetFilesystem: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <SectionHeader title="Machine Identity" />
        <SettingRow label="Username">
          <input
            className="flex-1 rounded border border-terminal-dim/30 bg-black/30 px-2 py-1 text-terminal-fg outline-none focus:border-terminal-accent"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            spellCheck={false}
          />
        </SettingRow>
        <SettingRow label="Hostname">
          <input
            className="flex-1 rounded border border-terminal-dim/30 bg-black/30 px-2 py-1 text-terminal-fg outline-none focus:border-terminal-accent"
            value={hostname}
            onChange={(e) => onHostnameChange(e.target.value)}
            spellCheck={false}
          />
        </SettingRow>
      </div>
      <div>
        <SectionHeader title="Session" />
        <button
          onClick={onResetFilesystem}
          className="rounded border border-terminal-error/40 px-3 py-1.5 text-terminal-error hover:bg-terminal-error/10 transition-colors"
        >
          Reset Filesystem
        </button>
      </div>
    </div>
  );
}

function AppearancePanel({
  wallpaper,
  fontSize,
  colorScheme,
  onWallpaperChange,
  onFontSizeChange,
  onColorSchemeChange,
}: {
  wallpaper: string;
  fontSize: FontSize;
  colorScheme: ColorScheme;
  onWallpaperChange: (k: string) => void;
  onFontSizeChange: (v: FontSize) => void;
  onColorSchemeChange: (v: ColorScheme) => void;
}) {
  const fontSizes: FontSize[] = ["small", "medium", "large"];
  const colorSchemes: { id: ColorScheme; label: string }[] = [
    { id: "default", label: "Default" },
    { id: "amber", label: "Amber" },
    { id: "dracula", label: "Dracula" },
  ];

  return (
    <div>
      <div className="mb-6">
        <SectionHeader title="Wallpaper" />
        <div className="flex flex-wrap gap-2">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.key}
              onClick={() => onWallpaperChange(wp.key)}
              title={wp.label}
              className={`h-10 w-16 rounded border-2 transition-colors ${
                wallpaper === wp.key
                  ? "border-terminal-accent"
                  : "border-terminal-dim/30 hover:border-terminal-dim"
              }`}
              style={{ background: wp.style }}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <SectionHeader title="Font Size" />
        <div className="flex gap-2">
          {fontSizes.map((size) => (
            <button
              key={size}
              onClick={() => onFontSizeChange(size)}
              className={`rounded border px-3 py-1 capitalize transition-colors ${
                fontSize === size
                  ? "border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                  : "border-terminal-dim/30 text-terminal-dim hover:border-terminal-dim hover:text-terminal-fg"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Color Scheme" />
        <div className="flex gap-2">
          {colorSchemes.map(({ id, label }) => {
            const scheme = COLOR_SCHEMES[id];
            return (
              <button
                key={id}
                onClick={() => onColorSchemeChange(id)}
                className={`flex items-center gap-2 rounded border px-3 py-1 transition-colors ${
                  colorScheme === id
                    ? "border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                    : "border-terminal-dim/30 text-terminal-dim hover:border-terminal-dim hover:text-terminal-fg"
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/10"
                  style={{ background: scheme.fg }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AboutPanel({ onResetAll }: { onResetAll: () => void }) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-lg text-terminal-accent">kelvin-os v1.0.0</div>
        <div className="text-terminal-dim">A desktop OS simulator built as a portfolio.</div>
      </div>
      <div className="mb-6">
        <SectionHeader title="Stack" />
        <ul className="space-y-1 text-terminal-dim">
          <li>Next.js 16</li>
          <li>React 19</li>
          <li>Redux Toolkit</li>
          <li>Pyodide 0.27</li>
          <li>Tailwind CSS 4</li>
        </ul>
      </div>
      <div>
        <SectionHeader title="Reset" />
        <button
          onClick={onResetAll}
          className="rounded border border-terminal-error/40 px-3 py-1.5 text-terminal-error hover:bg-terminal-error/10 transition-colors"
        >
          Reset All Settings
        </button>
      </div>
    </div>
  );
}
