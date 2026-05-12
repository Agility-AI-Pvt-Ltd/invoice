import type { ReactNode } from "react";
import { Oswald, Quicksand } from "next/font/google";

import "./marketing.css";

const marketingDisplay = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-marketing-display",
  display: "swap",
});

const marketingBody = Oswald({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-marketing-body",
  display: "swap",
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${marketingDisplay.variable} ${marketingBody.variable} marketing-root`}
    >
      {children}
    </div>
  );
}
