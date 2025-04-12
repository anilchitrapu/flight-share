"use client"

import { format, addDays } from "date-fns"
import { Plane } from "lucide-react"

interface Flight {
  id: string
  airline: string
  flightNumber: string
  date: Date | undefined
}

interface FlightItineraryProps {
  flights: Flight[]
  itineraryName?: string
}

export function FlightItinerary({ flights, itineraryName }: FlightItineraryProps) {
  // This would be replaced with actual API data in the real implementation
  const mockFlightDetails = (flight: Flight) => {
    // Simulate some overnight flights based on flight number
    // This is just for demonstration - in a real app, this would come from the API
    const isOvernightFlight = Number.parseInt(flight.flightNumber) % 2 === 0 // Even flight numbers are overnight

    return {
      airline: getAirlineName(flight.airline),
      departure: isOvernightFlight ? "10:00 PM" : "10:00 AM",
      arrival: isOvernightFlight ? "06:30 AM" : "12:30 PM",
      origin: "JFK",
      destination: "LAX",
      // Calculate if arrival is next day (for overnight flights)
      isNextDayArrival: isOvernightFlight,
      // Calculate duration based on departure and arrival times
      duration: isOvernightFlight ? "8h 30m" : "2h 30m",
    }
  }

  // Mock function to get airline name from code
  const getAirlineName = (code: string) => {
    const airlines: Record<string, string> = {
      DL: "Delta Air Lines",
      AA: "American Airlines",
      UA: "United Airlines",
      WN: "Southwest Airlines",
      B6: "JetBlue Airways",
      AS: "Alaska Airlines",
      LH: "Lufthansa",
      BA: "British Airways",
      AF: "Air France",
      KL: "KLM Royal Dutch Airlines",
      // Add more airlines as needed
    }

    return airlines[code] || code
  }

  return (
    <div className="space-y-8 py-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{itineraryName || "Flight Itinerary"}</h3>
          <p className="text-sm text-gray-500">
            {flights.length} {flights.length === 1 ? "flight" : "flights"}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
          <Plane className="h-6 w-6 text-sky-600" />
        </div>
      </div>

      {flights.map((flight, index) => {
        if (!flight.date) return null

        const details = mockFlightDetails(flight)
        const arrivalDate = details.isNextDayArrival && flight.date ? addDays(flight.date, 1) : flight.date

        return (
          <div key={flight.id} className="border-l-4 border-sky-500 pl-4 py-2">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {flight.airline} {flight.flightNumber}
                </h4>
                <p className="text-sm text-gray-600">{details.airline}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{format(flight.date, "EEE, MMM d, yyyy")}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{details.origin}</p>
                <p className="text-sm text-gray-500">{details.departure}</p>
                <p className="text-xs text-gray-500">{format(flight.date, "MMM d")}</p>
              </div>

              <div className="flex-1 mx-4">
                <div className="relative flex items-center justify-center">
                  <div className="border-t-2 border-gray-300 flex-grow"></div>
                  <div className="mx-2">
                    <Plane className="h-4 w-4 text-sky-600 transform rotate-90" />
                  </div>
                  <div className="border-t-2 border-gray-300 flex-grow"></div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-1">{details.duration}</p>
              </div>

              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{details.destination}</p>
                <p className="text-sm text-gray-500">{details.arrival}</p>
                {details.isNextDayArrival && <p className="text-xs text-sky-600 font-medium">+1 day</p>}
              </div>
            </div>

            {index < flights.length - 1 && <div className="border-t border-dashed border-gray-200 my-4"></div>}
          </div>
        )
      })}

      <div className="text-center pt-2 pb-1">
        <p className="text-xs text-gray-500">Generated with Flight Share • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
