"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Qrwc } from "@q-sys/qrwc";


const CORE_IP = "ws://10.130.61.195";
const API_KEY = "09f55593-85b1-42e5-8c24-2b7d6bb93bbd";

type Design = {
  Gain: "gain" | "mute";
};

type QrwcInstance = Awaited<ReturnType<typeof Qrwc.createQrwc<Design>>>;

const SHOW_QRWC_LOGS = false;

let lastError = "";
const quietLogger = {
  error: (e: unknown) => {
    const message = String(e instanceof Error ? e.message : e).split("\n")[0];
    if (message !== lastError) console.warn(message);
    lastError = message;
  },
};

export default function Home() {
  // Everything the page shows.
  const [qrwc, setQrwc] = useState<QrwcInstance>();
  const [status, setStatus] = useState("Connecting…");
  const [gain, setGain] = useState(0);
  const [gainLabel, setGainLabel] = useState("—");
  const [isMuted, setIsMuted] = useState(false);

  // The fader and button only work while this is true.
  const online = status.startsWith("Connected");

  useEffect(() => {
    let cancelled = false; // becomes true if the page closes while we're still connecting
    let instance: QrwcInstance; // the connection, so the cleanup below can close it

    (async () => {
      // STEP 1: CONNECT
     

      // STEP 2: Update the UI from the Core
      //a) Set values upon connection to the Core
      //b) Listen for updates fro mthe Core

      // Reconnection Logic
    })();

    // Close the connection when the page goes away. (Already done.)
    return () => {
      cancelled = true;
      instance?.close();
    };
  }, []);

  // STEP 3: Send Feedback from UI to the Core
  //a) Create functions for sending UI updates to the Core
  //b) Assign the functions to the UI elements
  
  // The UI is rendered below.
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
      <Image src="/logo-horizon.png" alt="Q-SYS" width={160} height={40} className="h-8 w-auto" priority />

      <section className="w-full max-w-md space-y-8 rounded-panel border border-line bg-surface p-6 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.6)]">
        <header className="space-y-1">
          <h1 className="text-2xl tracking-tight">Simple QRWC App</h1>
          <p className="font-mono text-xs text-ink-muted">Gain control of a Q-SYS system via QRWC</p>
        </header>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="gain" className="text-xs uppercase tracking-wide text-ink-muted">
              Gain
            </label>
            <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-sm tabular-nums">{gainLabel}</span>
          </div>
          <input
            id="gain"
            type="range"
            min={-100}
            max={20}
            step={0.5}
            value={gain}
            disabled={!online}
            className="w-full cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>

        <button
          disabled={!online}
          className={`w-full rounded-xl py-3 text-sm font-medium transition active:translate-y-px disabled:opacity-40 ${
            isMuted ? "bg-danger text-white" : "bg-ok text-black"
          }`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <footer className="flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted">
          <span
            className={`h-2 w-2 rounded-full ${online ? "bg-ok" : status.endsWith("…") ? "bg-warn animate-pulse" : "bg-danger"}`}
          />
          {status}
          <span className="ml-auto font-mono">Made by Q-SYS UK</span>
        </footer>
      </section>
    </main>
  );
}
