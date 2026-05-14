"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

/* ─── typing text ────────────────────────────────────────────────── */
const TEXT =
  "Invoice  #INV-2024-001\n" +
  "Client:  Acme Corporation\n" +
  "─────────────────────────\n" +
  "Web Design        45,000\n" +
  "SEO Package       18,000\n" +
  "Support Plan       8,200\n" +
  "─────────────────────────\n" +
  "Total Due         71,200";

/* ─── keyboard layout ────────────────────────────────────────────── */
const ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
const ALL_KEYS = ROWS.flat();

function charToKey(ch: string): string {
  if (ch === " ") return "SP";
  if (ch === "\n") return "EN";
  const u = ch.toUpperCase();
  return ALL_KEYS.includes(u)
    ? u
    : ALL_KEYS[ch.charCodeAt(0) % ALL_KEYS.length]!;
}

/* ─── invoice data ───────────────────────────────────────────────── */
type Status = "paid" | "pending" | "overdue";
interface InvDef {
  id: string;
  client: string;
  total: string;
  items: [string, string][];
  status: Status;
  left: string;
  top: string;
  rot: number;
  sc: number;
  blur: number;
  scrollIn: number;
}

const INVS: InvDef[] = [
  {
    id: "INV-001",
    client: "Acme Corp",
    total: "₹84,200",
    items: [
      ["Brand Design", "₹45,000"],
      ["Website Dev", "₹39,200"],
    ],
    status: "paid",
    left: "15%",
    top: "20%",
    rot: -15,
    sc: 0.9,
    blur: 0,
    scrollIn: 0.05,
  },
  {
    id: "INV-002",
    client: "TechFlow Inc.",
    total: "₹36,500",
    items: [
      ["API Integration", "₹22,000"],
      ["QA Testing", "₹14,500"],
    ],
    status: "pending",
    left: "82%",
    top: "18%",
    rot: 12,
    sc: 0.85,
    blur: 0.5,
    scrollIn: 0.12,
  },
  {
    id: "INV-003",
    client: "Nexus Studios",
    total: "₹1,20,000",
    items: [
      ["Motion Design", "₹75,000"],
      ["VFX Package", "₹45,000"],
    ],
    status: "paid",
    left: "70%",
    top: "65%",
    rot: 18,
    sc: 0.8,
    blur: 1.5,
    scrollIn: 0.2,
  },
  {
    id: "INV-004",
    client: "Orion Health",
    total: "₹28,900",
    items: [
      ["App Development", "₹20,000"],
      ["UI Audit", "₹8,900"],
    ],
    status: "overdue",
    left: "12%",
    top: "72%",
    rot: -22,
    sc: 0.75,
    blur: 2,
    scrollIn: 0.28,
  },
  {
    id: "INV-005",
    client: "Spark Agency",
    total: "₹62,000",
    items: [
      ["Campaign Design", "₹40,000"],
      ["Strategy", "₹22,000"],
    ],
    status: "paid",
    left: "88%",
    top: "45%",
    rot: 10,
    sc: 0.82,
    blur: 1,
    scrollIn: 0.35,
  },
  {
    id: "INV-006",
    client: "Lunar Labs",
    total: "₹18,500",
    items: [
      ["Copywriting", "₹10,000"],
      ["SEO Audit", "₹8,500"],
    ],
    status: "pending",
    left: "20%",
    top: "8%",
    rot: 5,
    sc: 0.7,
    blur: 2.5,
    scrollIn: 0.42,
  },
  {
    id: "INV-007",
    client: "Vortex Media",
    total: "₹42,000",
    items: [
      ["Video Edit", "₹30,000"],
      ["Audio Post", "₹12,000"],
    ],
    status: "paid",
    left: "78%",
    top: "35%",
    rot: -8,
    sc: 0.88,
    blur: 0,
    scrollIn: 0.5,
  },
  {
    id: "INV-008",
    client: "Skyline Arch",
    total: "₹95,000",
    items: [
      ["3D Render", "₹60,000"],
      ["Planning", "₹35,000"],
    ],
    status: "pending",
    left: "15%",
    top: "45%",
    rot: 14,
    sc: 0.78,
    blur: 1.8,
    scrollIn: 0.58,
  },
];

const STATUS_C: Record<Status, [string, string]> = {
  paid: ["#e6faf0", "#00875a"],
  pending: ["#fff7e6", "#d48a00"],
  overdue: ["#fff0f0", "#cc3333"],
};

// Stack phase — offsets and rotations per card index
const STACK_Y_OFFSETS = [0, -8, -16, -24, -32, -40, -48, -56];
const STACK_ROTATIONS = [0, 1.5, -1, 2, -2, 1, -1.5, 0.5];
const STACK_SCALES = [0.88, 0.865, 0.85, 0.835, 0.82, 0.805, 0.79, 0.775];

/* ─── Key ────────────────────────────────────────────────────────── */
function Key({
  label,
  pressed,
  w = 30,
}: {
  label: string;
  pressed: boolean;
  w?: number;
}) {
  return (
    <motion.div
      animate={{ y: pressed ? 2 : 0 }}
      transition={{ duration: 0.065, ease: "easeOut" }}
      style={{
        width: w,
        height: 26,
        borderRadius: 4,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
        fontFamily: "monospace",
        fontWeight: 700,
        letterSpacing: "0.05em",
        userSelect: "none",
        cursor: "default",
        background: pressed
          ? "linear-gradient(145deg, #1a1e2e, #222639)"
          : "linear-gradient(145deg, #363d55, #272d42)",
        color: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.78)",
        boxShadow: pressed
          ? "0 1px 0 #08091a, inset 0 2px 4px rgba(0,0,0,0.55)"
          : "0 3px 0 #08091a, 0 5px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.11)",
      }}
    >
      {label}
    </motion.div>
  );
}

/* ─── Cloud Visual ──────────────────────────────────────────────── */
function CloudVisual() {
  return (
    <div
      style={{
        position: "relative",
        width: 500,
        height: 280,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 60%, rgba(79,53,210,0.10) 0%, transparent 70%)",
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />
      <img
        src="/assets/cloud.png"
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 24px 48px rgba(79,53,210,0.12))",
        }}
      />
    </div>
  );
}

/* ─── Invoice Card ───────────────────────────────────────────────── */
function InvCard({
  inv,
  p,
  index,
}: {
  inv: InvDef;
  p: MotionValue<number>;
  index: number;
}) {
  const START = inv.scrollIn;
  const ASSORT_START = 0.7;
  const ASSORT_END = 0.8;
  const CLOUD_START = 0.82;
  const CLOUD_END = 0.94;
  const STACK_START = 0.96;
  const STACK_END = 1.0;

  const stackYOffset = STACK_Y_OFFSETS[index] ?? 0;
  const stackRot = STACK_ROTATIONS[index] ?? 0;
  const stackSc = STACK_SCALES[index] ?? 0.78;

  const x = useTransform(
    p,
    [
      0,
      START,
      START + 0.12,
      ASSORT_START,
      ASSORT_END,
      CLOUD_START,
      CLOUD_END,
      STACK_START,
      STACK_END,
    ],
    ["50%", "50%", inv.left, inv.left, "50%", "50%", "50%", "50%", "50%"],
  );

  const y = useTransform(
    p,
    [
      0,
      START,
      START + 0.12,
      ASSORT_START,
      ASSORT_END,
      CLOUD_START,
      CLOUD_END,
      STACK_START,
      STACK_END,
    ],
    [
      "50%",
      "50%",
      inv.top,
      inv.top,
      "40%",
      "40%",
      "-20%",
      "-20%",
      `calc(48% + ${stackYOffset}px)`,
    ],
  );

  const scale = useTransform(
    p,
    [
      0,
      START,
      START + 0.12,
      ASSORT_START,
      ASSORT_END,
      CLOUD_START,
      CLOUD_END,
      STACK_START,
      STACK_END,
    ],
    [0, 0.4, inv.sc, inv.sc, 0.72, 0.72, 0.3, 0.3, stackSc],
  );

  const rotate = useTransform(
    p,
    [
      0,
      START,
      START + 0.12,
      ASSORT_START,
      ASSORT_END,
      CLOUD_START,
      CLOUD_END,
      STACK_START,
      STACK_END,
    ],
    [0, 0, inv.rot, inv.rot, (index - INVS.length / 2) * 4, 0, 0, 0, stackRot],
  );

  const opacity = useTransform(
    p,
    [
      0,
      START,
      START + 0.05,
      CLOUD_START,
      CLOUD_END,
      STACK_START - 0.01,
      STACK_START + 0.04,
    ],
    [0, 0, 1, 1, 0, 0, 1],
  );

  const filter = useTransform(
    p,
    [START, START + 0.15],
    [`blur(${inv.blur}px)`, "blur(0px)"],
  );

  const [bg, fg] = STATUS_C[inv.status];

  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
        rotate,
        scale,
        opacity,
        filter,
        zIndex: 10 + (INVS.length - index), // front card = highest z during stack
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 190,
          background: "#fff",
          borderRadius: 14,
          padding: "14px 16px",
          boxShadow:
            "0 16px 48px rgba(0,0,0,0.09), 0 3px 10px rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.07)",
          fontFamily: "var(--font-marketing-body), sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 9, color: "#8b87aa", marginBottom: 2 }}>
              {inv.id}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1340" }}>
              {inv.client}
            </div>
          </div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 100,
              background: bg,
              color: fg,
              textTransform: "capitalize",
            }}
          >
            {inv.status}
          </span>
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.06)",
            paddingTop: 7,
            marginBottom: 7,
          }}
        >
          {inv.items.map(([name, amt]) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                color: "#6b688a",
                padding: "2px 0",
              }}
            >
              <span>{name}</span>
              <span style={{ fontWeight: 600 }}>{amt}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "2px solid rgba(79,53,210,0.08)",
            paddingTop: 7,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: "#4a4468" }}>
            Total
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#4f35d2",
              fontFamily: "var(--font-marketing-display), sans-serif",
            }}
          >
            {inv.total}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Typewriter body ────────────────────────────────────────────── */
function TypewriterBody({ p }: { p: MotionValue<number> }) {
  const paperRef = useRef<HTMLPreElement>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const charCount = useTransform(p, [0.08, 0.65], [0, TEXT.length]);

  useMotionValueEvent(charCount, "change", (v) => {
    const idx = Math.min(Math.round(v), TEXT.length);
    if (paperRef.current) paperRef.current.textContent = TEXT.slice(0, idx);
    const ch = TEXT[idx];
    if (ch) {
      setPressed(charToKey(ch));
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPressed(null), 125);
    }
  });

  const ROW_PADS = [0, 8, 16, 24];

  return (
    <div
      style={{
        width: 480,
        background:
          "linear-gradient(155deg, #252940 0%, #1b2030 60%, #141622 100%)",
        borderRadius: "16px 16px 22px 22px",
        padding: "14px 18px 26px",
        boxShadow: [
          "0 60px 100px rgba(0,0,0,0.55)",
          "0 24px 48px rgba(0,0,0,0.3)",
          "inset 0 1px 0 rgba(255,255,255,0.08)",
          "inset 0 -2px 0 rgba(0,0,0,0.3)",
        ].join(", "),
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#181c2b",
          borderRadius: "8px 8px 0 0",
          padding: "8px 12px 0",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, #f7f5f1 0%, #fdfbf8 100%)",
            borderRadius: "2px 2px 0 0",
            padding: "12px 14px 8px",
            minHeight: 92,
            boxShadow:
              "0 -4px 20px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                top: 12 + i * 15,
                height: 1,
                background: "rgba(99,102,241,0.08)",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 30,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(220,60,60,0.15)",
            }}
          />
          <pre
            ref={paperRef}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: "#1e1e40",
              margin: 0,
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
              position: "relative",
              zIndex: 1,
              minHeight: 78,
              paddingLeft: 12,
            }}
          />
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              display: "inline-block",
              width: 1,
              height: 9,
              background: "#4f35d2",
              marginLeft: 1,
              verticalAlign: "text-bottom",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
        }}
      >
        {ROWS.map((row, ri) => (
          <div
            key={ri}
            style={{ display: "flex", gap: 3.5, paddingLeft: ROW_PADS[ri] }}
          >
            {row.map((k) => (
              <Key key={k} label={k} pressed={pressed === k} />
            ))}
          </div>
        ))}
        <div style={{ display: "flex", gap: 3.5, marginTop: 1 }}>
          <Key label="⌘" pressed={false} w={36} />
          <Key label="SP" pressed={pressed === "SP"} w={168} />
          <Key label="EN" pressed={pressed === "EN"} w={46} />
        </div>
      </div>
    </div>
  );
}

/* ─── Stack full-viewport panel ─────────────────────────────────── */
function StackFullPanel({ p }: { p: MotionValue<number> }) {
  const STACK_START = 0.96;

  const opacity = useTransform(
    p,
    [STACK_START - 0.01, STACK_START + 0.04],
    [0, 1],
  );
  const y = useTransform(p, [STACK_START - 0.01, STACK_START + 0.04], [40, 0]);

  const STATUS_C: Record<Status, [string, string]> = {
    paid: ["#e6faf0", "#00875a"],
    pending: ["#fff7e6", "#d48a00"],
    overdue: ["#fff0f0", "#cc3333"],
  };

  // Show only first 5 cards in the static fan
  const fanCards = INVS.slice(0, 5);
  const fanRots = [-18, -9, 0, 9, 18];
  const fanY = [12, 6, 0, 6, 12];
  const fanZ = [1, 2, 5, 2, 1];
  const fanSc = [0.88, 0.93, 1, 0.93, 0.88];

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "stretch",
        opacity,
        y,
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      {/* ── LEFT: card fan ── */}
      <div
        style={{
          flex: "0 0 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle glow behind the fan */}
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(79,53,210,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Fanned cards */}
        <div style={{ position: "relative", width: 300, height: 340 }}>
          {fanCards.map((inv, i) => {
            const [bg, fg] = STATUS_C[inv.status];
            return (
              <div
                key={inv.id}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translateX(-50%) translateY(calc(-50% + ${fanY[i]}px)) rotate(${fanRots[i]}deg) scale(${fanSc[i]})`,
                  zIndex: fanZ[i],
                  width: 220,
                  background: "#fff",
                  borderRadius: 18,
                  padding: "18px 20px",
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  fontFamily: "var(--font-marketing-body), sans-serif",
                  transformOrigin: "bottom center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#8b87aa",
                        marginBottom: 3,
                      }}
                    >
                      {inv.id}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1a1340",
                      }}
                    >
                      {inv.client}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 100,
                      background: bg,
                      color: fg,
                      textTransform: "capitalize",
                    }}
                  >
                    {inv.status}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    paddingTop: 8,
                    marginBottom: 8,
                  }}
                >
                  {inv.items.map(([name, amt]) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "#6b688a",
                        padding: "3px 0",
                      }}
                    >
                      <span>{name}</span>
                      <span style={{ fontWeight: 600 }}>{amt}</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: "2px solid rgba(79,53,210,0.08)",
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 10, fontWeight: 600, color: "#4a4468" }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#4f35d2",
                      fontFamily: "var(--font-marketing-display), sans-serif",
                    }}
                  >
                    {inv.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Count badge */}
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(79,53,210,0.12)",
            borderRadius: 100,
            padding: "8px 20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4f35d2",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-marketing-body), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#1a1340",
            }}
          >
            {INVS.length} invoices synced
          </span>
        </div>
      </div>

      {/* ── RIGHT: text ── */}
      <div
        style={{
          flex: "0 0 50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 6vw 0 4vw",
          gap: 28,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(79,53,210,0.07)",
            border: "1px solid rgba(79,53,210,0.14)",
            borderRadius: 100,
            padding: "6px 16px",
            width: "fit-content",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4f35d2",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-marketing-body), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#4f35d2",
              letterSpacing: "0.04em",
            }}
          >
            Invoice Management
          </span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-marketing-display), sans-serif",
            fontSize: "clamp(2.6rem, 4.5vw, 4rem)",
            fontWeight: 800,
            color: "#1a1340",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Manage all your
          <br />
          invoices{" "}
          <span
            style={{
              WebkitTextStroke: "2px #4f35d2",
              WebkitTextFillColor: "transparent",
            }}
          >
            in one place
          </span>
        </h2>

        {/* Body */}
        <p
          style={{
            fontFamily: "var(--font-marketing-body), sans-serif",
            fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
            color: "#8b87aa",
            lineHeight: 1.65,
            fontWeight: 400,
            margin: 0,
            maxWidth: 440,
          }}
        >
          Our platform keeps every invoice accessible, trackable, and
          beautifully arranged — so you always know what's paid, what's pending,
          and what needs your attention.
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(
            [
              {
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="8.5"
                      cy="8.5"
                      r="5"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12.5"
                      y1="12.5"
                      x2="16.5"
                      y2="16.5"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                label: "Instant search",
                desc: "Find any invoice in milliseconds",
              },
              {
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 2.5C7.1 2.5 4.75 4.85 4.75 7.75V11l-1.5 2h13.5l-1.5-2V7.75C15.25 4.85 12.9 2.5 10 2.5Z"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 14.5a2 2 0 0 0 4 0"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                label: "Auto-reminders",
                desc: "Chase payments without the awkwardness",
              },
              {
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="2.5"
                      y="13"
                      width="3"
                      height="4.5"
                      rx="1"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                    />
                    <rect
                      x="8.5"
                      y="9"
                      width="3"
                      height="8.5"
                      rx="1"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                    />
                    <rect
                      x="14.5"
                      y="5"
                      width="3"
                      height="12.5"
                      rx="1"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4 8.5L8.5 6l4 2.5L17 4"
                      stroke="#4f35d2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                label: "Live dashboard",
                desc: "Revenue, aging, and status at a glance",
              },
            ] as { svg: React.ReactNode; label: string; desc: string }[]
          ).map(({ svg, label, desc }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: "rgba(79,53,210,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {svg}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-marketing-body), sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1a1340",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-marketing-body), sans-serif",
                    fontSize: 13,
                    color: "#8b87aa",
                    fontWeight: 400,
                  }}
                >
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div>
          <a href="/register" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "#4f35d2",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: 100,
                fontFamily: "var(--font-marketing-body), sans-serif",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 12px 30px rgba(79,53,210,0.25)",
                pointerEvents: "auto",
              }}
            >
              Get Started Free
            </button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */
export default function TypewriterSection() {
  const ref = useRef<HTMLDivElement>(null);
  // Extended to 550vh to give room for the stack phase
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  const STACK_START = 0.96;

  const sectionOp = useTransform(p, [0, 1], [1, 1]);
  const headingOp = useTransform(p, [0, 0.04, 0.2, 0.3], [1, 1, 1, 0]);
  const headingY = useTransform(p, [0, 0.3], [0, -30]);
  const twY = useTransform(p, [0, 0.08, 0.7, 0.8], [120, 0, 0, 120]);
  const twOp = useTransform(p, [0, 0.06, 0.7, 0.8], [0, 1, 1, 0]);
  const twScale = useTransform(p, [0, 0.8], [1, 0.85]);
  const hintOp = useTransform(p, [0, 0.05, 0.12], [1, 1, 0]);

  const cloudY = useTransform(
    p,
    [0.72, 0.82, STACK_START - 0.01, STACK_START],
    [-60, 0, 0, -60],
  );
  const cloudScale = useTransform(
    p,
    [0.72, 0.82, STACK_START - 0.01, STACK_START],
    [0.9, 1, 1, 0.8],
  );
  const cloudOp = useTransform(
    p,
    [0.72, 0.82, STACK_START - 0.01, STACK_START + 0.01],
    [0, 1, 1, 0],
  );

  // Feature texts
  const feat1Op = useTransform(p, [0.28, 0.33, 0.4, 0.44], [0, 1, 1, 0]);
  const feat1Y = useTransform(p, [0.28, 0.33, 0.4, 0.44], [20, 0, 0, -20]);
  const feat2Op = useTransform(p, [0.44, 0.49, 0.56, 0.6], [0, 1, 1, 0]);
  const feat2Y = useTransform(p, [0.44, 0.49, 0.56, 0.6], [20, 0, 0, -20]);
  const feat3Op = useTransform(p, [0.6, 0.65, 0.68, 0.72], [0, 1, 1, 0]);
  const feat3Y = useTransform(p, [0.6, 0.65, 0.68, 0.72], [20, 0, 0, -20]);

  return (
    // ↓ Extended from 400vh → 550vh for the stack phase
    <div
      ref={ref}
      style={{ height: "550vh", position: "relative", pointerEvents: "none" }}
    >
      <motion.div
        style={{
          position: "sticky",
          top: 30,
          height: "calc(100vh - 10px)",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #f8f7ff 0%, #edf5ff 40%, #fff0f7 70%, #fffaf5 100%)",
          opacity: sectionOp,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -24px 80px rgba(79,53,210,0.18)",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: [
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(199,185,255,0.12) 0%, transparent 65%)",
              "radial-gradient(ellipse 40% 30% at 15% 70%, rgba(197,220,255,0.08) 0%, transparent 60%)",
              "radial-gradient(ellipse 40% 30% at 85% 20%, rgba(255,220,240,0.06) 0%, transparent 60%)",
            ].join(", "),
          }}
        />

        {/* Cloud image */}
        <motion.div
          style={{
            position: "absolute",
            top: "4%",
            left: "50%",
            translateX: "-50%",
            zIndex: 50,
            opacity: cloudOp,
            y: cloudY,
            scale: cloudScale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            pointerEvents: "none",
            width: "100%",
            maxWidth: 600,
          }}
        >
          <CloudVisual />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(79,53,210,0.15)",
              borderRadius: 100,
              padding: "10px 24px",
              boxShadow: "0 15px 35px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: "#4f35d2",
                borderRadius: "50%",
              }}
              className="pulse-dot"
            />
            <span
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1340",
              }}
            >
              Smart Cloud Services
            </span>
          </div>
        </motion.div>

        {/* Heading wrapper — fades out when stack phase begins */}
        <motion.div
          style={{
            position: "relative",
            zIndex: 10,
            marginBottom: 40,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            opacity: useTransform(
              p,
              [STACK_START - 0.02, STACK_START + 0.01],
              [1, 0],
            ),
          }}
        >
          {/* Original heading */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: headingOp,
              y: headingY,
              pointerEvents: "none",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)",
                fontWeight: 800,
                color: "#1a1340",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                margin: "0 0 16px",
              }}
            >
              Billing,{" "}
              <span
                style={{
                  WebkitTextStroke: "1.5px #4f35d2",
                  WebkitTextFillColor: "transparent",
                }}
              >
                reimagined
              </span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-marketing-body), sans-serif",
                fontSize: "1rem",
                color: "#8b87aa",
                margin: "0 auto",
                fontWeight: 450,
                maxWidth: 550,
                textAlign: "center",
              }}
            >
              Every keypress transforms your chaos into clarity with our
              AI-powered cloud ledger.
            </p>
          </motion.div>

          {/* Feature 1 */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: feat1Op,
              y: feat1Y,
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: "clamp(1.75rem, 3.8vw, 2.95rem)",
                fontWeight: 800,
                color: "#1a1340",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
                maxWidth: 980,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Generate professional invoices{" "}
              <span
                style={{
                  WebkitTextStroke: "1.2px #4f35d2",
                  WebkitTextFillColor: "transparent",
                }}
              >
                in seconds
              </span>{" "}
              with customizable templates
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: feat2Op,
              y: feat2Y,
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: "clamp(1.75rem, 3.8vw, 2.95rem)",
                fontWeight: 800,
                color: "#1a1340",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
                maxWidth: 980,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Send invoices{" "}
              <span
                style={{
                  WebkitTextStroke: "1.2px #4f35d2",
                  WebkitTextFillColor: "transparent",
                }}
              >
                directly <br /> via email
              </span>{" "}
              with payment links
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: feat3Op,
              y: feat3Y,
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: "clamp(1.75rem, 3.8vw, 2.95rem)",
                fontWeight: 800,
                color: "#1a1340",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
                maxWidth: 980,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Support{" "}
              <span
                style={{
                  WebkitTextStroke: "1.2px #4f35d2",
                  WebkitTextFillColor: "transparent",
                }}
              >
                multiple payment methods
              </span>{" "}
              for faster collections
            </p>
          </motion.div>

          {/* Invisible spacer */}
          <div style={{ visibility: "hidden", pointerEvents: "none" }}>
            <h1
              style={{
                fontFamily: "var(--font-marketing-display), sans-serif",
                fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                margin: "0 0 16px",
              }}
            >
              Billing, reimagined
            </h1>
            <p style={{ fontSize: "1rem", margin: 0 }}>placeholder</p>
          </div>
        </motion.div>

        {/* Cards + typewriter canvas — fades out when stack phase begins */}
        <motion.div
          style={{
            position: "relative",
            width: "100vw",
            height: "65vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: useTransform(
              p,
              [STACK_START - 0.02, STACK_START + 0.01],
              [1, 0],
            ),
          }}
        >
          {INVS.map((inv, i) => (
            <InvCard key={inv.id} inv={inv} p={p} index={i} />
          ))}
          <motion.div
            style={{
              position: "relative",
              zIndex: 5,
              scale: twScale,
              y: twY,
              opacity: twOp,
            }}
          >
            <div
              style={{
                transform:
                  "perspective(1400px) rotateX(20deg) rotateY(-5deg) rotateZ(-1deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <TypewriterBody p={p} />
            </div>
          </motion.div>
        </motion.div>

        {/* Stack phase — full-viewport two-column layout */}
        <StackFullPanel p={p} />

        {/* Scroll hint */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            translateX: "-50%",
            opacity: hintOp,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-marketing-body), sans-serif",
            fontSize: 11,
            color: "#8b87aa",
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ textTransform: "uppercase", fontWeight: 600 }}>
            Scroll to start typing
          </span>
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↓
          </motion.span>
        </motion.div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.15); } }
          .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        `}</style>
      </motion.div>
    </div>
  );
}
