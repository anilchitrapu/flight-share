"use client"

import { format, isSameDay } from "date-fns"
import { Plane, ArrowRight, QrCode } from "lucide-react"
import type { Flight } from "@/lib/types"
import { getAirportName } from "@/lib/utils"

interface FlightItineraryProps {
  flights: Flight[]
  itineraryName?: string
}

// Function to truncate airport names to fit in two lines
const truncateAirportName = (name: string, maxLength = 30): string => {
  if (!name) return '';
  
  // Smart truncation that preserves the beginning and important parts
  if (name.length <= maxLength) return name;
  
  // Try to find natural break points like spaces
  const words = name.split(' ');
  
  // If we have multiple words, try to keep the most important ones
  if (words.length > 1) {
    // Keep first word and as many as will fit within maxLength
    let result = words[0];
    let currentLength = result.length;
    
    for (let i = 1; i < words.length; i++) {
      if (currentLength + words[i].length + 1 <= maxLength - 3) {
        result += ' ' + words[i];
        currentLength += words[i].length + 1;
      } else {
        // We can't fit more words, so add ellipsis and break
        result += '...';
        break;
      }
    }
    
    return result;
  }
  
  // If it's just one long word or we couldn't fit multiple words
  return name.substring(0, maxLength - 3) + '...';
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

  // Helper function to extract proper airport codes from flight status response
  const getFlightEndpoints = (flight: Flight) => {
    if (!flight.status) return { departureAirport: 'N/A', arrivalAirport: 'N/A' };

    let departureAirport = 'N/A';
    let arrivalAirport = 'N/A';

    // Prioritize 'legs' data if available
    if (flight.status.legs && Array.isArray(flight.status.legs) && flight.status.legs.length > 0) {
      departureAirport = flight.status.legs[0].boardPointIataCode || 'N/A';
      arrivalAirport = flight.status.legs[0].offPointIataCode || 'N/A';
    } 
    // Fallback to 'segments' data if available
    else if (flight.status.segments && Array.isArray(flight.status.segments) && flight.status.segments.length > 0) {
      departureAirport = flight.status.segments[0].boardPointIataCode || 'N/A';
      arrivalAirport = flight.status.segments[0].offPointIataCode || 'N/A';
    } 
    // Final fallback to 'flightPoints' if available
    else if (flight.status.flightPoints && Array.isArray(flight.status.flightPoints) && flight.status.flightPoints.length >= 2) {
      departureAirport = flight.status.flightPoints[0].iataCode || 'N/A';
      arrivalAirport = flight.status.flightPoints[1].iataCode || 'N/A';
    }

    return { departureAirport, arrivalAirport };
  };

  // Function to determine the overall journey details
  const getJourneyDetails = () => {
    if (!flights || flights.length === 0 || !flights[0].status) {
      return { origin: 'N/A', destination: 'N/A', startDate: null, endDate: null };
    }

    // Get the first flight's origin and the last flight's destination
    const firstFlight = flights[0];
    const lastFlight = flights[flights.length - 1];
    
    const { departureAirport: origin } = getFlightEndpoints(firstFlight);
    const { arrivalAirport: destination } = getFlightEndpoints(lastFlight);
    
    // Get the first flight's departure date and the last flight's arrival date
    const startDate = firstFlight.status ? new Date(firstFlight.status.departure) : null;
    const endDate = lastFlight.status ? new Date(lastFlight.status.arrival) : null;
    
    return { origin, destination, startDate, endDate };
  };

  // Get journey details for the title
  const { origin, destination, startDate, endDate } = getJourneyDetails();
  
  // Generate a booking code based on itinerary name or random
  const generateBookingCode = () => {
    // If itinerary name exists, format it (remove spaces, uppercase)
    if (itineraryName) {
      return itineraryName.replace(/\s+/g, '').toUpperCase().substring(0, 6);
    }
    
    // Otherwise generate random
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  const bookingCode = generateBookingCode();

  // Sort flights by departure time
  const sortedFlights = [...flights].sort((a, b) => {
    if (!a.status?.departure || !b.status?.departure) return 0;
    return new Date(a.status.departure).getTime() - new Date(b.status.departure).getTime();
  });

  // Calculate travel dates from first and last flight
  const getTravelDates = () => {
    if (flights.length === 0 || !flights.some(f => f.status)) {
      return { startDate: null, endDate: null };
    }
    
    const validFlights = flights.filter(f => f.status && f.status.departure);
    if (!validFlights.length) return { startDate: null, endDate: null };
    
    validFlights.sort((a, b) => {
      // At this point we know these have status objects because of our filter
      return new Date(a.status!.departure).getTime() - new Date(b.status!.departure).getTime();
    });
    
    const firstFlight = validFlights[0];
    const lastFlight = validFlights[validFlights.length - 1];
    
    // These are safe because we filtered for flights with status and departure/arrival
    const startDate = new Date(firstFlight.status!.departure);
    const endDate = new Date(lastFlight.status!.arrival);
    
    return { startDate, endDate };
  };
  
  const { startDate: travelStartDate, endDate: travelEndDate } = getTravelDates();

  return (
    <div className="font-sans w-full">
      <div className="bg-[#fffaf0] rounded-lg overflow-hidden w-full shadow-[0_0_15px_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.05)] border border-gray-100 relative" style={{
        backgroundImage: `radial-gradient(#00000003 1px, transparent 0)`,
        backgroundSize: `20px 20px`,
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
        backgroundBlendMode: 'normal'
      }}>
        {/* Subtle paper edge effect at the top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-b from-gray-200 to-transparent opacity-50"></div>
        
        {/* Boarding Pass Header with Booking Code */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center">
            <h2 className="text-xl sm:text-2xl font-bold whitespace-nowrap tracking-wider font-mono">BOARDING PASS</h2>
            <Plane className="ml-2 sm:ml-3 h-5 sm:h-6 w-5 sm:w-6" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold">{bookingCode}</div>
        </div>
        
        {/* Flight Name - Move from right side to left */}
        <div className="px-6 pt-4">
          <div className="text-lg font-bold">{sortedFlights[0]?.airline} {sortedFlights[0]?.flightNumber}</div>
        </div>
        
        {/* Flight List */}
        <div className="divide-y divide-gray-200">
          {sortedFlights.map((flight, index) => {
            if (!flight.status) return null;

            const { departureAirport, arrivalAirport } = getFlightEndpoints(flight);
            const departureDate = new Date(flight.status.departure);
            const arrivalDate = new Date(flight.status.arrival);
            const isOvernight = !isSameDay(departureDate, arrivalDate);
            const formattedDuration = formatDuration(flight.status.duration);
            
            // Get airport names
            const departureAirportName = getAirportName(departureAirport);
            const arrivalAirportName = getAirportName(arrivalAirport);
            
            return (
              <div key={flight.id} className="p-6 hover:bg-[#fffdf7] bg-[#fffaf0]">
                {/* Remove flight info from here as we've moved it to the top */}
                
                {/* Flight details */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Departure */}
                  <div className="col-span-3 flex flex-col">
                    <div className="text-3xl font-bold mb-1">{departureAirport}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 break-words min-h-[2.5rem]">{truncateAirportName(departureAirportName)}</div>
                    <div className="text-xl font-bold mt-auto">{formatTime(flight.status.departure)}</div>
                    <div className="text-sm">{format(departureDate, "EEE, MMM d")}</div>
                  </div>
                  
                  {/* Middle section with duration */}
                  <div className="col-span-1 flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-medium text-gray-500 text-center w-full">{formattedDuration}</div>
                    <div className="h-0.5 w-full bg-gray-300 my-2"></div>
                    <div className="relative w-full flex justify-center">
                      <Plane className="h-4 w-4 text-gray-500 transform -rotate-45" />
                      {isOvernight && <span className="text-xs text-blue-600 absolute -right-1 -top-1">+1</span>}
                    </div>
                  </div>
                  
                  {/* Arrival */}
                  <div className="col-span-3 flex flex-col items-end">
                    <div className="text-3xl font-bold mb-1">{arrivalAirport}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 break-words text-right min-h-[2.5rem]">{truncateAirportName(arrivalAirportName)}</div>
                    <div className="text-xl font-bold mt-auto">{formatTime(flight.status.arrival)}</div>
                    <div className="text-sm">{format(arrivalDate, "EEE, MMM d")}</div>
                  </div>
                </div>
                
                {/* Additional details */}
                <div className="mt-4 flex justify-between text-sm">
                  {flight.status.departureTerminal && (
                    <div>
                      <span className="text-gray-500">Terminal:</span> {flight.status.departureTerminal}
                    </div>
                  )}
                  {flight.status.departureGate && (
                    <div>
                      <span className="text-gray-500">Gate:</span> {flight.status.departureGate}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="bg-[#f8f5ed] p-4 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500">Generated with Flight Share • {new Date().toLocaleDateString()}</p>
        </div>
        
        {/* Subtle paper edge effect at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-t from-gray-200 to-transparent opacity-50"></div>
      </div>
    </div>
  );
}
