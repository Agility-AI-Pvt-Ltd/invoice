import HeroSection from "@repo/ui/Hero";
import TypewriterSection from "@repo/ui/TypewriterSection";

export default async function Home() {
  return (
    <div style={{ position: "relative" }}>
      {/* ── LAYER 1: Hero — sticky background, pinned at z:1 ── */}
      <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 1 }}>
        <HeroSection logoSrc="/assets/invoicely.png" brandName="Invoicely" />
      </div>

      {/*
        ── LAYER 2: TypewriterSection overlay ──
        pointerEvents: "none" on this wrapper so the Hero navbar and CTAs
        remain clickable while TypewriterSection hasn't scrolled over them yet.
        TypewriterSection itself restores pointerEvents: "auto" on its sticky
        inner panel, so its own interactions still work once it's visible.
      */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: "-100vh",
          pointerEvents: "none",
        }}
      >
        {/* Spacer: hero stays visible for the first 100vh of scroll */}
        <div style={{ height: "100vh" }} />

        <TypewriterSection />
      </div>
    </div>
  );
}
