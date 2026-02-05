export default function LoadingSkeleton() {
  return (
    <div className="px-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-24" />
            </div>
          </div>
          <div className="space-y-2 mb-4 pt-3 border-t border-gray-700">
            <div className="h-4 bg-gray-700 rounded w-40" />
            <div className="h-4 bg-gray-700 rounded w-32" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-14 bg-gray-700 rounded-lg" />
            <div className="flex-1 h-14 bg-gray-700 rounded-lg" />
            <div className="w-14 h-14 bg-gray-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

