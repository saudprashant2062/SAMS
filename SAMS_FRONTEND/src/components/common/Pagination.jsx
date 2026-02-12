import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } =
    pagination;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
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
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Showing {startItem}–{endItem} of {total} results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="px-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="min-w-8 h-8 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: p === page ? "var(--primary)" : "transparent",
                color: p === page ? "#fff" : "var(--text-secondary)",
                border:
                  p === page
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border)",
              }}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
