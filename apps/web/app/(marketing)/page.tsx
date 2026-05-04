import HeroSection from "@repo/ui/Hero";
import HowItWorks from "@repo/ui/HowItWorks";
import TypewriterSection from "@repo/ui/TypewriterSection";

export default async function Home() {
  return (
    <div style={{ position: "relative", overflowX: "hidden" }}>
      {/* 1 - Hero: stays pinned while TypewriterSection scrolls over it */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 1,
        }}
      >
        <HeroSection logoSrc="/assets/invoicely.png" />
      </div>

      {/* 2 - Slides up over the hero as the user scrolls (parallax card effect) */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TypewriterSection />
      </div>

      {/* 3 - How It Works slides over the hero on scroll */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          borderRadius: "28px 28px 0 0",
          overflow: "hidden",
          boxShadow: "0 -20px 60px rgba(79,53,210,0.15)",
          marginTop: "-28px",
        }}
      >
        <HowItWorks />
      </div>
    </div>
  );
}
