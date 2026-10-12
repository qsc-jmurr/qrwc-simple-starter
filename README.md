# QRWC Workshop: Simple App (starter)

In about 30 minutes you'll connect a web page to a Q-SYS Core and control a Gain component in **both directions**. Move the fader on the page and the Core follows; move it in a UCI and the page follows. Pull the Core's network cable and the page reconnects on its own.

The page is already built. You only write the QRWC code, all of it in **`app/page.tsx`**, in the four places marked `TODO`.

---

## Before the day: set up (30 min, at home)

**Install these, in this order:**

| Install | Get it | Check it worked |
|---|---|---|
| **Node.js 24 LTS** (anything from 22.5 works) | [nodejs.org](https://nodejs.org/en/download) | `node -v` |
| **Git for Windows**, which includes **Git Bash** (Mac: `xcode-select --install`) | [git-scm.com](https://git-scm.com/install/windows) | `git --version` |
| **VS Code** | [code.visualstudio.com](https://code.visualstudio.com/) | it opens |
| **Chrome or Edge** | | |

On Windows, use **Git Bash** for the commands below. In VS Code: Terminal → New Terminal, then the **⌄** next to **+** → Select Default Profile → **Git Bash**. (PowerShell can refuse to run `npm` with "running scripts is disabled".)

**Then get the app running:**

```bash
cd qrwc-simple-starter      # wherever you cloned or unzipped it
npm install                 # 1-3 minutes, needs the internet
npm run dev
```

Open http://localhost:3000. You'll see the app with **Connecting…** at the bottom, and it won't connect yet. That's expected: you're ready. Press `Ctrl+C` in the terminal to stop it.

---

## Step 0: In the room (5 min)

1. Join the workshop Wi-Fi (turn off any VPN), then run `npm run dev` again.
2. Open `app/page.tsx` and set the two values at the top. Your instructor gives you the Core's IP, and a token if Access Control is on:

   ```ts
   const CORE_IP = "ws://192.168.1.100"; // just ws:// and the IP, no path
   const API_KEY = "";                   // the token, or "" if there isn't one
   ```

3. Open the browser console: **F12 → Console**. QRWC tells you what it's doing there.

VS Code underlines a few names in yellow (`CORE_IP`, `setGain` and so on) as "never used". That's expected: they disappear as you fill in the steps.

**On the Core** (your instructor has done this): a **Gain** component named `Gain` with **Code Access = External**, the design **running** on a real Core (QRWC doesn't connect to Emulation), and **WebSocket** enabled in Core Manager → Network → Services.

---

## Step 1: Connect (8 min)

**Where:** under `── STEP 1: CONNECT ──`, replacing the `TODO 1` comment.

Give QRWC the Core's address, and it opens the connection and looks after it:

```ts
const q = await Qrwc.createQrwc<Design>({
  host: CORE_IP, // QRWC adds /qrc-public-api/v0 for you
  apiKey: API_KEY || undefined,
  pollingInterval: 100,
  componentFilter: (component) => component.Name === "Gain",
  logger: SHOW_QRWC_LOGS ? console : quietLogger,
  reconnect: { maxAttempts: 10, delay: 1000, backoffFactor: 2, maxDelay: 10_000 }, // see STEP 4
});

if (cancelled) return void q?.close(); // the page closed while we were connecting
if (!q) return setStatus("Couldn't connect"); // createQrwc returns undefined, it doesn't throw

instance = q;
setQrwc(q);
setStatus(`Connected to ${q.engineStatus.DesignName}`);
```

✅ **Check:** the footer turns green and shows your design's name, and the fader and button are enabled.

What the options do:

- **`host`**: QRWC owns the connection, which is what lets it reconnect for you in step 4.
- **`pollingInterval`**: how often (ms) QRWC asks the Core what changed. 100 is plenty; 34 is the minimum.
- **`componentFilter`**: fetch only the Gain. Without it, QRWC fetches every component with Code Access and polls every one of their controls. On a big design that floods the Core at start-up and fills the console with ChangeGroup errors.
- **`logger`**: the quiet logger shows each QRWC error once. Set `SHOW_QRWC_LOGS = true` at the top to see everything QRWC does, then set it back.
- **`reconnect`**: how QRWC retries if the connection drops. More in step 4.

> **Why `<Design>`?** It tells TypeScript which components and controls exist. Type `q.components.` and see the autocomplete. A typo such as `q.components.Gian` becomes a red squiggle instead of a bug.

---

## Step 2: Core → page (10 min)

**Where:** under `── STEP 2: CORE → PAGE ──`, replacing the `TODO 2` comment.

Grab the two controls:

```ts
const { gain, mute } = q.components.Gain.controls;
```

**a) Read what they are right now.** The `"update"` event only fires when something *changes*, so without this the page would show 0 dB and "Mute" until someone touched the fader.

```ts
setGain(gain.state.Value ?? 0);
setGainLabel(gain.state.String ?? "—");
setIsMuted(mute.state.Bool);
```

**b) Then follow every change**, wherever it comes from:

```ts
gain.on("update", (state) => {
  console.log("gain:", state.String);
  setGain(state.Value ?? 0);
  setGainLabel(state.String ?? "—"); // formatted by the Core, e.g. "-12.0dB"
});
mute.on("update", (state) => {
  console.log("mute:", state.Bool);
  setIsMuted(state.Bool);
});
```

✅ **Check:** move the gain in a UCI or in Designer. The page's fader and readout follow it, the mute button changes colour when you mute from the UCI, and the console shows only your `gain:` and `mute:` lines.

> Each control's `state` has `Value` (a number, e.g. -12), `String` (text, e.g. "-12.0dB"), `Position` (0–1) and `Bool` (true/false).

---

## Step 3: Page → Core (8 min)

**Where:** the two handlers under `── STEP 3: PAGE → CORE ──` (replace the `console.log`s).

```ts
const handleGainChange = (value: number) => qrwc?.components.Gain.controls.gain.update(value);
const handleToggleMute = () => qrwc?.components.Gain.controls.mute.update(!isMuted);
```

`update()` takes a number, a boolean (`true`/`false` become 1/0), text, or `{ Position: 0.5 }`.

Notice there's no `setGain` here. The Core confirms the change, the `"update"` event from step 2 fires, and that moves the fader. The Core is the single source of truth, so every browser and UCI agrees.

✅ **Check:** drag the page's fader and the UCI follows. Press **Mute** and the Core mutes. Open the page in a second tab and move one: both stay in sync.

**That's two-way control. 🎉**

---

## Step 4: Survive a drop (6 min)

**Where:** under `── STEP 4: SURVIVE A DROP ──`, replacing the `TODO 4` comment.

You already told QRWC how to reconnect (`reconnect` in step 1). Now show the user what's happening:

```ts
q.on("disconnected", (reason) =>
  setStatus(reason === "reconnection failed" ? "Disconnected: refresh to retry" : "Reconnecting…"),
);
q.on("reconnected", () => setStatus(`Connected to ${q.engineStatus.DesignName}`));
```

✅ **Check:** when your instructor unplugs the Core (or stops the design), the footer turns amber and says **Reconnecting…**, and the controls disable. When it comes back, the footer goes green again with **no refresh**, and the fader still works both ways.

While it's down, the browser prints red `WebSocket connection … failed` lines on each retry. Those come from the browser itself, not your code, and stop once it reconnects.

How it works: QRWC waits 1 s, then 2, 4, 8, then 10 s between tries, up to 10 tries (about 75 seconds). After that it gives up with `"reconnection failed"`. The `gain` and `mute` objects from step 2 survive the reconnect, so your listeners keep working.

---

