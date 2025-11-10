import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  categorySlug: string;
  totalItems: number;
  itemsPerPage: number;
  baseUrl?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  categorySlug,
  totalItems,
  itemsPerPage,
  baseUrl
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    if (baseUrl) {
      if (page === 1) {
        return baseUrl;
      }
      return `${baseUrl}&page=${page}`;
    } else {
      if (page === 1) {
        return `/categories/${categorySlug}`;
      }
      return `/categories/${categorySlug}?page=${page}`;
    }
  };

  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push(-1); // Ellipsis
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        {/* Mobile pagination */}
        {currentPage > 1 && (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-muted-foreground bg-card hover:bg-muted"
          >
            <span title="Предишна">Previous</span>
          </Link>
        )}
        {currentPage < totalPages && (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-muted-foreground bg-card hover:bg-muted"
          >
            <span title="Следваща">Next</span>
          </Link>
        )}
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <span title="Показване">Showing</span> <span className="font-medium">{startItem}</span> <span title="до">to</span>{' '}
            <span className="font-medium">{endItem}</span> <span title="от">of</span>{' '}
            <span className="font-medium">{totalItems}</span> <span title="каталог артикули">catalog items</span>
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous button */}
            {currentPage > 1 ? (
              <Link
                href={getPageUrl(currentPage - 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <span className="sr-only" title="Предишна">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <span className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-muted text-sm font-medium text-muted-foreground cursor-not-allowed">
                <span className="sr-only" title="Предишна">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}

            {/* Page numbers */}
            {visiblePages.map((page, index) => {
              if (page === -1) {
                // Ellipsis
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = page === currentPage;

              return (
                <Link
                  key={page}
                  href={getPageUrl(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {page}
                </Link>
              );
            })}

            {/* Next button */}
            {currentPage < totalPages ? (
              <Link
                href={getPageUrl(currentPage + 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <span className="sr-only" title="Следваща">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <span className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-muted text-sm font-medium text-muted-foreground cursor-not-allowed">
                <span className="sr-only" title="Следваща">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
