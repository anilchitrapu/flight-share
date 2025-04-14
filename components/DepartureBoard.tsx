"use client"

import { FlipText } from './FlipText'
import { Plane } from 'lucide-react'

interface DepartureBoardProps {
  title: string
  subtitle: string
}

export function DepartureBoard({ title, subtitle }: DepartureBoardProps) {
  return (
    <div className="departure-board-container mb-6 relative">
      {/* Airplane icon in top right */}
      <div className="absolute top-3 right-3">
        <Plane className="h-6 w-6 text-yellow-300 transform -rotate-45" />
      </div>
      
      <div className="text-center py-4">
        <div className="mb-2">
          <FlipText 
            text={title}
            fontSize="2.5rem"
            color="#FACC15"
            className="font-bold tracking-wider"
            sporadicFlip={true}
            flipInterval={8500}    // Every 8.5 seconds
            flipProbability={0.3}  // 30% chance when interval triggers
          />
        </div>
        
        <div className="mx-auto max-w-[80%]">
          <FlipText 
            text={subtitle}
            fontSize="0.875rem"
            color="#e5e7eb"
            className="tracking-wide"
            sporadicFlip={true}
            flipInterval={12000}   // Every 12 seconds
            flipProbability={0.25} // 25% chance when interval triggers
          />
        </div>
      </div>
      
      {/* Grid lines effect */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="border-r border-t border-gray-800/30"></div>
        ))}
      </div>
    </div>
  )
} 