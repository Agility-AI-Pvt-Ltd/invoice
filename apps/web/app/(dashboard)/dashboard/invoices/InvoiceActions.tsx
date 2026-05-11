"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Download, 
  Eye,
  Loader2,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceStatus: string;
}

export function InvoiceActions({ invoiceId, invoiceStatus }: InvoiceActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this invoice? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel invoice");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const isEditable = invoiceStatus === "DRAFT" || invoiceStatus === "SENT";

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all ${
          isOpen ? "bg-secondary text-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200">
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Eye className="w-4 h-4" />
            View Invoice
          </Link>

          {isEditable && (
            <Link
              href={`/dashboard/invoices/${invoiceId}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Pencil className="w-4 h-4" />
              Edit Invoice
            </Link>
          )}

          <a
            href={`/api/invoices/${invoiceId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>

          {invoiceStatus !== "CANCELLED" && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Cancel Invoice
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
