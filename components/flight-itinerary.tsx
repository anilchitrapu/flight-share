"use client"

import { format, isSameDay } from "date-fns"
import { Plane } from "lucide-react"
import type { Flight } from "@/lib/types"
import { getAirportName } from "@/lib/utils"

interface FlightItineraryProps {
  flights: Flight[]
  itineraryName?: string
}

interface FlightGroup {
  date: Date
  flights: (Flight & { departureDate: Date; arrivalDate: Date })[]
}

// Function to truncate airport names to fit in two lines
const truncateAirportName = (name: string, maxLength = 30): string => {
  if (!name) return '';
  
  // First try to find a natural break point (like "International" or "Airport")
  const parts = name.split(' ');
  if (parts.length > 3) {
    // Try to make a sensible two-line name
    const firstLine = parts.slice(0, Math.ceil(parts.length/2)).join(' ');
    return firstLine;
  }
  
  // If the name is too long, truncate it
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
};

export function FlightItinerary({ flights, itineraryName }: FlightItineraryProps) {
  // Helper function to format time from ISO string
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return format(date, "h:mm a") // e.g., 9:10 PM
    } catch {
      return "N/A"
    }
  }

  // Helper function to get airline name from code
  const getAirlineName = (code: string) => {
    const airlines: Record<string, string> = {
      DL: "Delta Air Lines", AA: "American Airlines", UA: "United Airlines",
      WN: "Southwest Airlines", B6: "JetBlue Airways", AS: "Alaska Airlines",
      LH: "Lufthansa", BA: "British Airways", AF: "Air France", KL: "KLM Royal Dutch Airlines",
      // Add more as needed
    }
    return airlines[code] || code
  }

  // Helper function to format ISO 8601 duration to human-readable
  const formatDuration = (isoDuration: string) => {
    if (!isoDuration) return "N/A";
    const hourMatch = isoDuration.match(/(\d+)H/);
    const minuteMatch = isoDuration.match(/(\d+)M/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  // Group flights by departure date
  const flightGroups: FlightGroup[] = [];
  flights.forEach(flight => {
    if (!flight.date || !flight.status) return;
    const departureDate = new Date(flight.status.departure);
    const arrivalDate = new Date(flight.status.arrival);
    // Only group if departure and arrival are on the same day, or if it's the only flight for that departure day
    const isOvernight = !isSameDay(departureDate, arrivalDate);
    const enrichedFlight = { ...flight, departureDate, arrivalDate, isOvernight };

    const existingGroup = flightGroups.find(group => isSameDay(group.date, departureDate));
    if (existingGroup) {
        // Add to existing group, maintaining order
        existingGroup.flights.push(enrichedFlight);
    } else {
        flightGroups.push({ date: departureDate, flights: [enrichedFlight] });
    }
  });

  // Sort groups by date, then sort flights within each group by departure time
  flightGroups.sort((a, b) => a.date.getTime() - b.date.getTime());
  flightGroups.forEach(group => {
    group.flights.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime());
  });

  return (
    <div className="space-y-5 p-2 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{itineraryName || "Flight Itinerary"}</h3>
          <p className="text-sm text-gray-600">
            {flights.length} {flights.length === 1 ? "flight" : "flights"}
          </p>
        </div>
        <div className="h-11 w-11 rounded-full bg-sky-100 flex items-center justify-center">
          <Plane className="h-5 w-5 text-sky-600" />
        </div>
      </div>

      {/* Flight Groups */}
      <div className="space-y-4">
        {flightGroups.map((group, groupIndex) => (
          <div key={group.date.toISOString()} className="px-1">
            {/* Date Header */}
            <div className="bg-gray-100 py-1.5 px-3 rounded mb-3 shadow-sm">
              <p className="text-base font-medium text-gray-800 text-center">{format(group.date, "EEE, MMM d, yyyy")}</p>
            </div>
            
            {/* Flights within Group */}
            <div className="space-y-3">
              {group.flights.map((flight) => {
                if (!flight.status) return null;

                const departureTime = formatTime(flight.status.departure);
                const arrivalTime = formatTime(flight.status.arrival);
                const departureAirport = flight.status.flightPoints?.[0]?.iataCode || 
                  flight.status.segments?.[0]?.boardPointIataCode || "N/A";
                const arrivalAirport = flight.status.flightPoints?.[1]?.iataCode || 
                  flight.status.segments?.[0]?.offPointIataCode || "N/A";
                const formattedDuration = formatDuration(flight.status.duration);
                
                // Get airport names
                const departureAirportName = getAirportName(departureAirport);
                const arrivalAirportName = getAirportName(arrivalAirport);

                return (
                  // Individual flight card
                  <div key={flight.id} className="pl-4 py-2">
                    {/* Airline Info */}
                    <div className="mb-2">
                      <h4 className="font-semibold text-base text-gray-900">
                        {flight.airline} {flight.flightNumber}
                      </h4>
                      <p className="text-sm text-gray-600">{getAirlineName(flight.airline)}</p>
                    </div>

                    {/* Departure/Arrival Row */}
                    <div className="flex items-center justify-between space-x-3">
                      {/* Departure Info */}
                      <div className="text-center flex-shrink-0 w-[80px]">
                        <p className="text-xl font-bold text-gray-900">{departureAirport}</p>
                        <p className="text-sm text-gray-500">{departureTime}</p>
                        {departureAirportName && (
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-tight max-h-8 overflow-hidden line-clamp-2">
                            {truncateAirportName(departureAirportName)}
                          </p>
                        )}
                      </div>

                      {/* Flight Path Graphic */}
                      <div className="flex-1 text-center min-w-0">
                        <div className="relative flex items-center justify-center h-px my-3">
                          <div className="border-t border-gray-300 w-full"></div>
                          <div className="absolute bg-white px-2">
                            <Plane className="h-4 w-4 text-sky-600 transform -rotate-45" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formattedDuration}</p>
                      </div>

                      {/* Arrival Info */}
                      <div className="text-center flex-shrink-0 w-[80px]">
                        <p className="text-xl font-bold text-gray-900">{arrivalAirport}</p>
                        <p className="text-sm text-gray-500">{arrivalTime}</p>
                        {flight.isOvernight && <p className="text-xs text-sky-600 font-medium">+1 day</p>}
                        {arrivalAirportName && (
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-tight max-h-8 overflow-hidden line-clamp-2">
                            {truncateAirportName(arrivalAirportName)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Divider between date groups */}            
            {groupIndex < flightGroups.length - 1 && (
              <div className="border-t border-dashed border-gray-200 my-4 mx-1"></div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 pb-1 px-2 mt-4">
        <p className="text-xs text-gray-500">Generated with Flight Share • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
