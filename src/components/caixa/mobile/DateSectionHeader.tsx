interface DateSectionHeaderProps {
  date: string;
  label: string;
}

export default function DateSectionHeader({ date, label }: DateSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border-b border-blue-500/20 sticky top-0 z-10">
      <span className="text-base">📅</span>
      <span className="text-sm font-semibold text-blue-400">{label}</span>
      <span className="text-sm text-gray-400">-</span>
      <span className="text-sm text-gray-400">{date}</span>
    </div>
  );
}
