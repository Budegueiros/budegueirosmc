import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export default function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  loading,
}: InfiniteScrollTriggerProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        rootMargin: '100px', // Carregar quando estiver a 100px do final
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-400 text-sm">Todos os membros foram carregados</p>
      </div>
    );
  }

  return (
    <div ref={observerRef} className="py-6 text-center">
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-gray-400 text-sm">Carregando mais...</span>
        </div>
      ) : (
        <div className="h-20" aria-hidden="true" />
      )}
    </div>
  );
}

