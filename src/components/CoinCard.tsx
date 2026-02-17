import React from 'react';

interface CoinCardProps {
    id: number;
    name: string;
    imageUrl: string;
    dateAdded: string;
}

/**
 * Reusable coin card component for displaying coins in grid
 */
export function CoinCard({ id, name, imageUrl, dateAdded }: CoinCardProps) {
    return (
        <a href={`/coin-detail/${id}`} className="group cursor-pointer block">
            <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden relative border border-gray-200 hover:border-blue-300">
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full aspect-square object-cover group-hover:brightness-75 transition"
                    loading="lazy"
                />
                <div className="p-3 bg-gradient-to-t from-gray-900 via-transparent to-transparent absolute inset-0 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end">
                    <h3 className="font-bold text-white text-xs sm:text-sm truncate">{name}</h3>
                    <p className="text-xs text-gray-200 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"></path>
                        </svg>
                        Ver detalles
                    </p>
                </div>
                <div className="p-3">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{new Date(dateAdded).toLocaleDateString()}</p>
                </div>
            </div>
        </a>
    );
}
