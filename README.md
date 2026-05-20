# MeetFlow — Peer-to-Peer Video Calls

A Google Meet–like video calling app built with **Next.js**, **WebRTC**, and **Socket.IO**. Fully peer-to-peer, no third-party media relay, free to run.

## Features

- **End-to-end video & audio** — P2P via WebRTC, no media touches the server
- **Room-based meetings** — unique 8-char codes, shareable invite links
- **Camera & mic controls** — toggle on/off during a call
- **Screen sharing** — share your screen with all participants
- **In-call chat** — text messaging alongside the video feed
- **Responsive grid layout** — adapts from 1 to 3+ columns (mobile → desktop)
- **Connection status** — shows connecting state and media permission errors
- **Dark mode UI** — Tailwind CSS, dark-first design
- **Lightweight signaling** — Socket.IO only for room management & ICE exchange

## Architecture

```
Browser A ←——RTCPeerConnection——→ Browser B
     ↕                              ↕
Socket.IO  ←— signaling (offers/answers/ICE) —→ Socket.IO
    │                                          │
    └────────── Room management ───────────────┘
```

- **Signaling server** (`server/index.js`): Express + Socket.IO on port `3001`
- **Next.js app** (port `3000`): React frontend + API routes (`/api/create-room`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
cd server && npm install
cd ..
npm install
```

### Run

Starts both Next.js (port 3000) and the signaling server (port 3001):

```bash
npm run dev
```

Or separately:

```bash
npm run dev:next    # Next.js on :3000
npm run dev:signal  # Signaling on :3001
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Enter your name on the landing page
2. Click **New Meeting** to create a room, or paste a room code and click **Join**
3. Allow camera/microphone access when prompted
4. Share the invite link (via the **Copy Link** button) so others can join
5. Use the bottom toolbar to mute, stop camera, share screen, open chat, or leave

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Signaling | Socket.IO |
| Media | WebRTC (RTCPeerConnection + getUserMedia) |
| ICE | Google STUN (no TURN) |
| Language | TypeScript |

## Notes

- **STUN only** — calls work on the same network or with compatible NAT. For production, add a TURN server.
- No media is recorded or stored. Chat messages are ephemeral (in-memory on the signaling server).
- Works best in Chrome, Firefox, and Edge. Safari has limited screen-share support.

## License

MIT
