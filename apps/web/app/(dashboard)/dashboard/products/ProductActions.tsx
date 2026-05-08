"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2,
  XCircle,
  Eye,
  Box
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "./actions";
import ProductModal from "./ProductModal";

interface ProductActionsProps {
  product: any;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + window.scrollY, left: rect.right - 192 + window.scrollX }); // 192 is w-48
      }
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${product.name}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteProduct(product.id);
      if (result?.error) {
        alert(result.error);
      } else {
        // Success handled by revalidatePath
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const dropdownMenu = isOpen ? createPortal(
    <div 
      ref={menuRef}
      className="fixed w-48 bg-card border border-border rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 z-[99999] animate-in fade-in zoom-in duration-200"
      style={{ top: coords.top + 8, left: coords.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={() => {
          setEditOpen(true);
          setIsOpen(false);
        }}
        className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-foreground hover:bg-secondary transition-all"
      >
        <Pencil className="w-4 h-4" />
        Edit Item
      </button>

      <div className="h-px bg-border my-1 mx-2" />
      
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black text-destructive hover:bg-destructive/5 transition-all disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Delete Item
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all ${
          isOpen ? "bg-secondary text-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {dropdownMenu}

      {/* Render Modal OUTSIDE the dropdown conditional block */}
      <ProductModal 
        product={product}
        isOpenOverride={editOpen}
        onCloseOverride={() => setEditOpen(false)}
      />
    </div>
  );
}

