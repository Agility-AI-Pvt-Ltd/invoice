"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Download,
  Eye,
  Loader2,
  X,
  XCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
}

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  invoiceStatus,
}: InvoiceActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeAccepted, setPurgeAccepted] = useState(false);
  const [purgeNumberInput, setPurgeNumberInput] = useState("");
  const [purgeError, setPurgeError] = useState("");
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

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelRemark("");
    setCancelError("");
  };

  const submitCancel = async () => {
    const trimmed = cancelRemark.trim();
    if (!trimmed) {
      setCancelError(
        "Please enter a remark explaining why this invoice is being cancelled.",
      );
      return;
    }
    setCancelError("");
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: trimmed }),
      });
      if (res.ok) {
        closeCancelModal();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel invoice");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setIsCancelling(false);
      setIsOpen(false);
    }
  };

  const closePurgeModal = () => {
    setShowPurgeModal(false);
    setPurgeAccepted(false);
    setPurgeNumberInput("");
    setPurgeError("");
  };

  const submitPermanentDelete = async () => {
    if (!purgeAccepted) {
      setPurgeError("Confirm that you understand the consequences.");
      return;
    }
    const typed = purgeNumberInput.trim();
    if (typed !== invoiceNumber) {
      setPurgeError(
        `Type the invoice number exactly: ${invoiceNumber}`,
      );
      return;
    }
    setPurgeError("");
    setIsPurging(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/permanent`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmInvoiceNumber: typed }),
      });
      if (res.ok) {
        closePurgeModal();
        router.refresh();
      } else {
        const data = await res.json();
        setPurgeError(data.error || "Permanent delete failed");
      }
    } catch {
      setPurgeError("Something went wrong");
    } finally {
      setIsPurging(false);
      setIsOpen(false);
    }
  };

  const isEditable = invoiceStatus === "DRAFT" || invoiceStatus === "SENT";

<<<<<<< HEAD
  const cancelModal =
    showCancelModal &&
    createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center animate-in">
=======
  return (
    <>
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
>>>>>>> ce7ff6bf18702bf9610533f56cda5fbc27f67473
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isCancelling && closeCancelModal()}
          />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Cancel invoice
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This cannot be undone. Enter a remark for your records.
                </p>
              </div>
              <button
                type="button"
                disabled={isCancelling}
                onClick={closeCancelModal}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              Cancellation remark <span className="text-destructive">*</span>
            </label>
            <textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              disabled={isCancelling}
              placeholder="e.g. Customer requested void, duplicate entry, billing error..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 resize-y min-h-[100px]"
            />
            {cancelError ? (
              <p className="text-xs text-destructive mt-2 font-medium">
                {cancelError}
              </p>
            ) : null}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                disabled={isCancelling}
                onClick={closeCancelModal}
                className="flex-1 py-2 text-sm border border-border rounded-xl text-foreground hover:bg-secondary disabled:opacity-50 font-bold"
              >
                Keep invoice
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={submitCancel}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 disabled:opacity-60 font-bold"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Cancel invoice
              </button>
            </div>
          </div>
        </div>,
      document.body,
    );

<<<<<<< HEAD
  const purgeModal =
    showPurgeModal &&
    createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center animate-in overflow-y-auto py-8">
=======
      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200 overflow-y-auto py-8">
>>>>>>> ce7ff6bf18702bf9610533f56cda5fbc27f67473
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isPurging && closePurgeModal()}
          />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 border border-border my-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-destructive">
                  Permanently delete invoice
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  #{invoiceNumber} — there is no way to undo this action.
                </p>
              </div>
              <button
                type="button"
                disabled={isPurging}
                onClick={closePurgeModal}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ul className="text-xs text-foreground space-y-2 mb-5 list-disc pl-4 leading-relaxed">
              <li>
                The invoice, its line items, recorded payments, and payment
                links are removed from the database permanently.
              </li>
              <li>
                You will lose access to this invoice in reports, PDF exports,
                and the dashboard history.
              </li>
              <li>
                Any inventory movements tied only to this invoice may lose their
                invoice reference.
              </li>
              <li>
                Gateway or bank records outside this app are not changed—reconcile
                those separately if payments exist.
              </li>
              <li className="font-bold text-foreground">
                Invoice number #{invoiceNumber} becomes available again for a new
                invoice in your organization.
              </li>
            </ul>

            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={purgeAccepted}
                disabled={isPurging}
                onChange={(e) => {
                  setPurgeAccepted(e.target.checked);
                  setPurgeError("");
                }}
                className="mt-0.5 rounded border-border"
              />
              <span>
                I understand these consequences and want to permanently delete
                this invoice.
              </span>
            </label>

            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              Type invoice number to confirm{" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={purgeNumberInput}
              onChange={(e) => setPurgeNumberInput(e.target.value)}
              disabled={isPurging}
              placeholder={invoiceNumber}
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 disabled:opacity-60 font-mono"
            />

            {purgeError ? (
              <p className="text-xs text-destructive mt-2 font-medium">
                {purgeError}
              </p>
            ) : null}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                disabled={isPurging}
                onClick={closePurgeModal}
                className="flex-1 py-2 text-sm border border-border rounded-xl text-foreground hover:bg-secondary disabled:opacity-50 font-bold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={
                  isPurging || !purgeAccepted || purgeNumberInput.trim() !== invoiceNumber
                }
                onClick={submitPermanentDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 disabled:opacity-50 font-bold"
              >
                {isPurging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </div>,
      document.body,
    );

  return (
    <>
      {cancelModal}
      {purgeModal}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg transition-all ${
            isOpen
              ? "bg-secondary text-foreground"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 z-[50] animate-in fade-in zoom-in duration-200">
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

            <div className="h-px bg-border my-1" />

            {invoiceStatus !== "CANCELLED" && invoiceStatus !== "PAID" && (
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(true);
                  setIsOpen(false);
                }}
                disabled={isCancelling}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                Cancel Invoice
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowPurgeModal(true);
                setIsOpen(false);
              }}
              disabled={isPurging}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Permanently delete invoice
            </button>
          </div>
        )}
      </div>
    </>
  );
}
