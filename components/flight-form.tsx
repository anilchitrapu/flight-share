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
      // Add a temporary class to ensure all content is visible during screenshot
      itineraryRef.current.classList.add('screenshot-mode');
      
      // Enhanced html2canvas options
      const canvas = await html2canvas(itineraryRef.current, {
        scale: 3, // Higher scale for better resolution
        backgroundColor: "#ffffff",
        allowTaint: true, // Allow cross-origin images
        useCORS: true, // Use CORS for external resources
        logging: false,
        foreignObjectRendering: false, // More reliable rendering in some browsers
        ignoreElements: (element) => {
          // Ignore any elements that might interfere with capture
          return element.classList?.contains('ignore-screenshot') || false;
        },
        onclone: (documentClone) => {
          // Fix for SVG and airplane icon rendering issues
          const clonedDiv = documentClone.querySelector('[data-ref="itinerary-ref"]');
          if (clonedDiv) {
            // Find all plane icons and ensure they're properly rendered
            const planeIcons = clonedDiv.querySelectorAll('.lucide-plane');
            planeIcons.forEach(icon => {
              // Ensure the plane icon has sufficient padding
              const iconContainer = icon.closest('div');
              if (iconContainer) {
                (iconContainer as HTMLElement).style.padding = '4px';
              }
            });
            
            // Ensure all airport descriptions are visible
            const airportDescs = clonedDiv.querySelectorAll('.text-\\[10px\\]');
            airportDescs.forEach(desc => {
              // Force all airport names to be visible
              const descElement = desc as HTMLElement;
              descElement.style.maxHeight = 'none';
              descElement.style.overflow = 'visible';
              descElement.style.display = 'block';
              // Use any type for non-standard CSS properties
              (descElement.style as any).lineClamp = 'none';
              (descElement.style as any).webkitLineClamp = 'none';
            });
          }
        }
      });

      // Remove temporary class
      itineraryRef.current.classList.remove('screenshot-mode');

      const image = canvas.toDataURL("image/png", 1.0); // Higher quality PNG
      const link = document.createElement("a");
      link.href = image;
      link.download = `${itineraryName.replace(/[^a-zA-Z0-9]/g, '_') || 'flight'}_itinerary.png`;
      link.click();
    } catch (error) {
      console.error("Error generating screenshot:", error);
      toast.error("Failed to generate screenshot");
      // Remove temporary class in case of error
      if (itineraryRef.current) {
        itineraryRef.current.classList.remove('screenshot-mode');
      }
    } finally {
      setIsGeneratingScreenshot(false);
    }
  };

  const isFormValid = flights.every((flight) => flight.airline && flight.flightNumber && flight.date)

  return (
    <div>
      <form onSubmit={handleSubmit} className="p-6 bg-black text-yellow-300 font-mono rounded-lg">
        <div className="space-y-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-yellow-300 mb-1 uppercase tracking-wider">Itinerary Name</label>
            <Input
              type="text"
              placeholder="e.g. Summer Vacation 2025"
              value={itineraryName}
              onChange={(e) => setItineraryName(e.target.value)}
              className="bg-black border-yellow-500 text-yellow-300 placeholder-yellow-700 font-mono uppercase"
            />
          </div>
          
          {/* Flight board header */}
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs uppercase tracking-widest text-center border-b border-yellow-500 pb-2">
            <div>Airline</div>
            <div>Flight</div>
            <div>Date</div>
          </div>
          
          {flights.map((flight, index) => (
            <div key={flight.id} className="flex flex-col md:flex-row gap-3 pb-4 border-b border-yellow-500/30">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="DL"
                  value={flight.airline}
                  onChange={(e) => updateFlight(flight.id, "airline", e.target.value.toUpperCase())}
                  maxLength={3}
                  className="bg-black border-yellow-500 text-yellow-300 font-mono font-bold uppercase tracking-widest h-12"
                />
              </div>

              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="123"
                  value={flight.flightNumber}
                  onChange={(e) => updateFlight(flight.id, "flightNumber", e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={4}
                  className="bg-black border-yellow-500 text-yellow-300 font-mono font-bold tracking-widest h-12"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-mono bg-black border-yellow-500 text-yellow-300 h-12 uppercase tracking-widest",
                            !flight.date && "text-yellow-700"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-yellow-300" />
                          {flight.date ? format(flight.date, "dd MMM yyyy").toUpperCase() : <span>SELECT DATE</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-yellow-500">
                        <Calendar
                          mode="single"
                          selected={flight.date}
                          onSelect={(date) => updateFlight(flight.id, "date", date)}
                          initialFocus
                          className="flight-board-calendar"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFlight(flight.id)}
                    disabled={flights.length === 1}
                    className="text-yellow-300 hover:text-red-500 h-12 w-12 flex-shrink-0 bg-black border border-yellow-500"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button 
            type="button" 
            variant="outline" 
            onClick={addFlight} 
            className="w-full mt-4 font-mono text-black bg-yellow-300 hover:bg-yellow-400 border-yellow-500"
          >
            <Plus className="mr-2 h-4 w-4" /> ADD FLIGHT
          </Button>
        </div>

        <div className="mt-6">
          <Button 
            type="submit" 
            className="w-full font-mono text-black bg-yellow-300 hover:bg-yellow-400 border-yellow-500 uppercase tracking-wider h-12"
            disabled={!isFormValid || flights.some(f => f.isLoading)}
          >
            {flights.some(f => f.isLoading) ? "LOADING..." : "GENERATE BOARDING PASS"}
          </Button>
        </div>
      </form>

      {showItinerary && (
        <div className="p-6 border-t border-gray-100">
          <div 
            ref={itineraryRef} 
            data-ref="itinerary-ref"
            className="bg-white rounded-lg w-full mx-auto"
            style={{ height: 'auto', overflow: 'visible' }}
          >
            <FlightItinerary flights={flights} itineraryName={itineraryName} />
          </div>

          <div className="mt-6">
            <Button
              onClick={generateScreenshot}
              className="w-full text-black bg-yellow-400 hover:bg-yellow-500 border-yellow-600"
              disabled={isGeneratingScreenshot}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingScreenshot ? "GENERATING..." : "DOWNLOAD BOARDING PASSES"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Add global styles for flight board inspired components */}
      <style jsx global>{`
        .flight-board-calendar {
          background-color: black;
          color: #fde047;
          font-family: 'Courier New', monospace;
        }
        .flight-board-calendar .rdp-button:hover:not([disabled]) {
          background-color: #fde047;
          color: black;
        }
        .flight-board-calendar .rdp-day_selected {
          background-color: #fde047;
          color: black;
        }
      `}</style>
    </div>
  )
}
