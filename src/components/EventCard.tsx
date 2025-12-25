import { Calendar, MapPin,MapPinned, Clock, Bike } from 'lucide-react';


interface EventCardProps {
    title: string;
    type: string;
    date: string;
    month: string;
    origem?: string;
    destino: string;
    time: string;
    mapUrl: string;
    km?: string;
}

export default function EventCard({ title, type, date, month, origem, destino, time, mapUrl, km }: EventCardProps) {
    const newDate = new Date(time);
  const hours = String(newDate.getHours()).padStart(2, '0');
  const minutes = String(newDate.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
    return (
        <div className="bg-zinc-800 p-6 rounded-lg">
            <Calendar className="w-8 h-8 mb-4 text-brand-red" />
            <h3 className="text-xl font-bold mb-2">{date} de {month}</h3>
            <p className="text-lg mb-4">{title} - {type}</p>
            <div className="flex flex-col gap-2 text-gray-400">
                {origem && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>De: {origem}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <MapPinned className="w-4 h-4" />
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-line: underline">Para: {destino}</a>
                </div>
                {km && (
                    <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4" />
                        <span>Distância: {km} km</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
                <Clock className="w-4 h-4" />
                <span>{formattedTime}</span>
            </div>
        </div>
    )
} 