import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Left Side: Auth Form */}
      <div className="flex flex-col justify-center px-8 lg:px-24 py-12 bg-background relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 overflow-hidden p-0.5">
              <Image
                src="/assets/Invoicely_logo_Final.png"
                alt=""
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight heading-display">
              Agility <span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="animate-in">{children}</div>
        </div>

        <footer className="mt-auto pt-12 text-center lg:text-left text-xs text-muted-foreground font-medium uppercase tracking-widest">
          &copy; 2026 Agility AI Pvt Ltd. All rights reserved.
        </footer>
      </div>

      {/* Right Side: Visual/Branding */}
      <div className="hidden lg:flex relative bg-secondary overflow-hidden items-center justify-center p-12">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full -mr-96 -mt-96 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -ml-48 -mb-48 blur-[100px]" />

        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Status: Optimized
            </div>
            <h2 className="text-4xl font-bold heading-display leading-tight tracking-tight">
              Built for the next generation of{" "}
              <span className="text-primary">Indian Businesses</span>.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Simplify your billing, stay tax-compliant, and focus on what
              matters most—growing your dream.
            </p>
          </div>

          {/* Testimonial/Trust Badge */}
          <div className="bg-card/50 backdrop-blur-xl border border-border p-6 rounded-3xl shadow-2xl text-left max-w-sm mx-auto">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-amber-500 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm font-medium italic text-foreground leading-relaxed mb-4">
              "The fastest invoicing tool we've ever used. The GSTR-1 reports
              alone saved our accountant 10 hours a month."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                RS
              </div>
              <div>
                <p className="text-xs font-bold">Ryan Shukla</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Founder, Agility AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
