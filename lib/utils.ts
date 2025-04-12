import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import airports from '@/constants/airports.json'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to get airport name from IATA code
export function getAirportName(iataCode: string): string {
  if (!iataCode) return '';
  
  const airport = airports.find((airport: any) => 
    airport.iata === iataCode && airport.status === 1);
  
  return airport?.name || '';
}
