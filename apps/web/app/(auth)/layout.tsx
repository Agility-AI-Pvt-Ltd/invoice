import { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <Image src="/assets/invoicely.png" alt="" width={40} height={40} className="rounded-lg object-contain shadow-md" />
            <span className="text-xl font-bold heading-display">Invoicely</span>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden md:flex flex-col justify-center items-center relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80 z-0" />
        <div className="absolute top-0 left-0 right-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="relative z-10 text-center max-w-lg p-12">
          <div className="flex justify-center mb-8">
            <Image src="/assets/invoicely.png" alt="" width={96} height={96} className="rounded-2xl object-contain shadow-xl" />
          </div>
          <h2 className="text-5xl font-bold heading-display mb-6 tracking-tight">Invoicely</h2>
          <p className="text-primary-foreground/80 text-xl font-light leading-relaxed">
            Streamline your business with modern, professional GST-compliant invoices. Get paid faster and manage everything in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
