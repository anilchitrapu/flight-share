"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, X, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { FlightItinerary } from "./flight-itinerary"
import { useRef } from "react"
import html2canvas from "html2canvas"
import type { Flight } from "@/lib/types"
import { toast } from "sonner"

export function FlightForm() {
  const [flights, setFlights] = useState<Flight[]>([{ id: "1", airline: "", flightNumber: "", date: undefined }])
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false)
  const [showItinerary, setShowItinerary] = useState(false)
  const itineraryRef = useRef<HTMLDivElement>(null)
  const [itineraryName, setItineraryName] = useState<string>("")

  const addFlight = () => {
    setFlights([
      ...flights,
      {
        id: Date.now().toString(),
        airline: "",
        flightNumber: "",
        date: undefined,
      },
    ])
  }

  const removeFlight = (id: string) => {
    if (flights.length > 1) {
      setFlights(flights.filter((flight) => flight.id !== id))
    }
  }

  const updateFlight = (id: string, field: keyof Flight, value: string | Date | undefined) => {
    setFlights(flights.map((flight) => (flight.id === id ? { ...flight, [field]: value } : flight)))
  }

  const fetchFlightStatus = async (flight: Flight) => {
    if (!flight.airline || !flight.flightNumber || !flight.date) return

    const formattedDate = format(flight.date, "yyyy-MM-dd")
    const params = new URLSearchParams({
      carrierCode: flight.airline,
      flightNumber: flight.flightNumber,
      scheduledDepartureDate: formattedDate,
    })

    try {
      const response = await fetch(`/api/flight-status?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch flight status")
      }

      const data = await response.json()
      if (data.length === 0) {
        throw new Error("Flight not found")
      }

      return data[0]
    } catch (error) {
      console.error("Error fetching flight status:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlights(flights.map(flight => ({ ...flight, isLoading: true, error: undefined })))
    try {
      const updatedFlights = await Promise.all(
        flights.map(async (flight) => {
          try {
            const status = await fetchFlightStatus(flight)
            return { ...flight, status, isLoading: false }
          } catch (error) {
            return { 
              ...flight, 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error occurred" 
            }
          }
        })
      )
      setFlights(updatedFlights)
      const hasErrors = updatedFlights.some(flight => flight.error)
      if (hasErrors) {
        toast.error("Some flights could not be found. Please check the details and try again.")
        return
      }
      setShowItinerary(true)
    } catch (error) {
      console.error("Error processing flights:", error)
      toast.error("An error occurred while processing your flights")
    }
  }

  const generateScreenshot = async () => {
    if (!itineraryRef.current) return;

    setIsGeneratingScreenshot(true);

    try {
      const canvas = await html2canvas(itineraryRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${itineraryName.replace(/[^a-zA-Z0-9]/g, '_') || 'flight'}_itinerary.png`;
      link.click();
    } catch (error) {
      console.error("Error generating screenshot:", error);
      toast.error("Failed to generate screenshot");
    } finally {
      setIsGeneratingScreenshot(false);
    }
  };

  const isFormValid = flights.every((flight) => flight.airline && flight.flightNumber && flight.date)

  return (
    <div>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Name</label>
            <Input
              type="text"
              placeholder="e.g. Summer Vacation 2025"
              value={itineraryName}
              onChange={(e) => setItineraryName(e.target.value)}
            />
          </div>
          {flights.map((flight, index) => (
            <div key={flight.id} className="flex flex-col md:flex-row gap-3 pb-4 border-b border-gray-100">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline Code</label>
                <Input
                  type="text"
                  placeholder="e.g. DL"
                  value={flight.airline}
                  onChange={(e) => updateFlight(flight.id, "airline", e.target.value.toUpperCase())}
                  maxLength={3}
                  className="uppercase"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
                <Input
                  type="text"
                  placeholder="e.g. 123"
                  value={flight.flightNumber}
                  onChange={(e) => updateFlight(flight.id, "flightNumber", e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={4}
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !flight.date && "text-gray-400")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {flight.date ? format(flight.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={flight.date}
                      onSelect={(date) => updateFlight(flight.id, "date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFlight(flight.id)}
                  disabled={flights.length === 1}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addFlight} className="w-full mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add Another Flight
          </Button>
        </div>

        <div className="mt-6">
          <Button 
            type="submit" 
            className="w-full bg-sky-600 hover:bg-sky-700" 
            disabled={!isFormValid || flights.some(f => f.isLoading)}
          >
            {flights.some(f => f.isLoading) ? "Loading..." : "Generate Itinerary"}
          </Button>
        </div>
      </form>

      {showItinerary && (
        <div className="p-6 border-t border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Itinerary</h2>
            <p className="text-sm text-gray-500">Share this with your friends and family</p>
          </div>

          <div 
            ref={itineraryRef} 
            className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-[800px] mx-auto"
            style={{ height: 'auto', overflow: 'visible' }}
          >
            <FlightItinerary flights={flights} itineraryName={itineraryName} />
          </div>

          <div className="mt-6">
            <Button
              onClick={generateScreenshot}
              className="w-full bg-sky-600 hover:bg-sky-700"
              disabled={isGeneratingScreenshot}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingScreenshot ? "Generating..." : "Download Screenshot"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
