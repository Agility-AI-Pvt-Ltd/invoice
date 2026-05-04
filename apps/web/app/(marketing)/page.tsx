import HeroSection from "@repo/ui/Hero";
import HowItWorks from "@repo/ui/HowItWorks";
import TypewriterSection from "@repo/ui/TypewriterSection";

export default async function Home() {
  return (
    <div style={{ position: "relative" }}>

      {/* ── LAYER 1: Hero — sticky background, pinned at z:1 ── */}
      <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 1 }}>
        <HeroSection logoSrc="/assets/invoicely.png" />
      </div>

      {/*
        ── LAYER 2: TypewriterSection overlay ──
        Key rules:
        1. NO overflow:hidden — that breaks position:sticky inside TypewriterSection
        2. TypewriterSection internally is 400vh tall with its own sticky inner div
           so it pins itself at 100vh for the entire scroll animation
        3. A 100vh spacer before it lets the hero show fully first
        4. marginTop: -100vh overlaps this layer with the hero stack
      */}
      <div style={{ position: "relative", zIndex: 2, marginTop: "-100vh" }}>

        {/* Spacer: hero stays visible for the first 100vh of scroll */}
        <div style={{ height: "100vh" }} />

        {/*
          Direct render — no overflow:hidden wrapper.
          TypewriterSection's own sticky inner div already has:
          - rounded-t corners (24px)
          - box-shadow upwards
          - gradient background
          - height: 100vh sticky pinned
          - 400vh outer scroll space for the animation
        */}
        <TypewriterSection />

      </div>

      {/*
        ── LAYER 3: HowItWorks — slides over TypewriterSection when its animation ends ──
        position:sticky + zIndex:3 means it will pin on top once TypewriterSection scrolls away.
        IMPORTANT: must NOT have overflow:hidden on the outer sticky div.
        Inner div handles its own scroll with overflow:auto.
      */}
      {/* <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 3 }}>
        <div style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "48px 48px 0 0",
          boxShadow: "0 -24px 80px rgba(79,53,210,0.22), 0 -4px 20px rgba(0,0,0,0.1)",
        }}>
        </div>
      </div> */}

    </div>
  );
}
