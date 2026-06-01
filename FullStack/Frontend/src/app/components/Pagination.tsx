import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled = false,
  itemLabel = "item",
}: PaginationProps) {
  if (totalPages <= 1 && total <= limit) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: Array<number | "..."> = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-slate-100 flex-wrap">
      <p className="text-xs text-slate-500">
        Menampilkan <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> dari{" "}
        <span className="font-semibold text-slate-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-[#CC0000] hover:bg-[#CC0000]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-1 text-slate-400 text-xs select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={disabled || p === page}
              className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                p === page
                  ? "bg-[#CC0000] text-white shadow-sm cursor-default"
                  : "text-slate-600 hover:text-[#CC0000] hover:bg-[#CC0000]/5"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-[#CC0000] hover:bg-[#CC0000]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
