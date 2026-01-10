interface EventSectionHeaderProps {
  icon: string;
  title: string;
}

export default function EventSectionHeader({ icon, title }: EventSectionHeaderProps) {
  return (
    <div className="px-4 py-3 bg-blue-600/10 border-b border-blue-600/20">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-semibold text-blue-400 uppercase">{title}</h2>
      </div>
    </div>
  );
}
