# 🚀 DevSync — Collaborative Cloud IDE

> A real-time collaborative code editor and technical interview platform, built for modern development teams.

---

## 🎯 Problem Statement

Remote developers and interviewers lack a unified, secure platform to **code together in real-time**. Existing tools are either:
- Too heavyweight (full IDE setups requiring install)
- Insecure (no access control or role management)
- Fragmented (separate tools for editing, communication, and interviewing)

Teams waste time switching between code editors, video tools, and chat apps — with no shared context.

---

## 💡 Proposed Solution

**DevSync** is a browser-based collaborative cloud IDE that combines:
- ✅ Real-time multi-user code editing (conflict-free, like Google Docs for code)
- ✅ Built-in voice & video calling (no Zoom needed)
- ✅ Role-based access control (Admin / Editor / Viewer)
- ✅ A dedicated **Interview Mode** with synchronized problem statements and timers

One link → everyone is in the same workspace instantly.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS + TailwindCSS |
| **Real-time Sync** | [Yjs](https://yjs.dev/) (CRDT), y-websocket |
| **Code Editor** | Monaco Editor (VS Code engine) |
| **Collaboration** | Yjs Awareness API (cursors, presence) |
| **Voice & Video** | WebRTC (peer-to-peer, Yjs as signaling layer) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Backend/Signaling** | Node.js, y-websocket server |
| **Tunneling** | Pinggy / Cloudflare Tunnel (public sharing) |

---

## ✅ Features — What Works

### 🧑‍💻 Core IDE
- [x] VS Code-inspired dark theme layout
- [x] Monaco Editor with syntax highlighting for all languages
- [x] Nested file & folder system with right-click context menu (New, Rename, Delete)
- [x] Multiple file tabs with open/close support
- [x] Resizable sidebar and bottom terminal panel

### 👥 Real-Time Collaboration
- [x] Multi-cursor live editing — see every user's cursor in real-time
- [x] Conflict-free sync using CRDTs (no merge conflicts, ever)
- [x] Live presence panel — see who's online with color-coded names
- [x] Built-in team chat with timestamps

### 🔐 Security & Authorization
- [x] Waiting Room — guests must request access before joining
- [x] Host approves or rejects each join request (animated notification)
- [x] Protection against host email spoofing (same email as host → blocked)
- [x] Role-based permissions:
  - **Admin** — full control, can manage others
  - **Editor** — can read and write code
  - **Viewer** — read-only (keyboard disabled, cursor hidden)
- [x] Right-click any user in the sidebar to change their role or kick them

### 📞 Voice & Video Calling
- [x] One-click voice call from the activity bar (Phone icon)
- [x] One-click video call with camera (Video icon)
- [x] Floating draggable call window with local PiP camera preview
- [x] Mute / Camera off toggles during call
- [x] Incoming call notification card (animated, non-blocking)
- [x] Clean hang-up with stream cleanup

### 🎯 Interview Mode *(Unique Feature)*
- [x] "Conduct Interview" button on the landing page
- [x] Shared Problem Statement panel (interviewer types, candidate reads live)
- [x] Synchronized countdown timer (interviewer controls, both see it)
  - Color shifts green → orange → red as time runs out
  - "Time's Up!" banner on expiry
- [x] **Private Interviewer Notes** — stored only in `localStorage`, invisible to candidate
- [x] Interview link auto-includes `?interview=1` so candidates join in the right mode

---

## 🌟 Unique Features & Differentiators

| Feature | DevSync | VS Code Live Share | CodePen |
|---|---|---|---|
| Zero install (browser-only) | ✅ | ❌ | ✅ |
| Role-based access control | ✅ | ❌ | ❌ |
| Built-in WebRTC video call | ✅ | ❌ | ❌ |
| Interview Mode with timer | ✅ | ❌ | ❌ |
| Private interviewer notes | ✅ | ❌ | ❌ |
| Waiting room + approval flow | ✅ | ❌ | ❌ |
| CRDT conflict-free editing | ✅ | ✅ | ❌ |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the Yjs collaboration server
node server/yjs-server.js

# 3. Start the frontend
npm run dev
```

Open `http://localhost:5173` — enter your email and create or join a workspace.

### To share publicly (no install required on friends' side):
```bash
ssh -p 443 -R0:localhost:5173 -o StrictHostKeyChecking=no a.pinggy.io
```
Share the generated HTTPS link with anyone.

---

## 👥 Team

Built with ❤️ for the hackathon — **DevSync** redefines what a collaborative IDE can be.
