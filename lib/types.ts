export interface FlightStatus {
  type: string;
  scheduledDepartureDate: string;
  flightDesignator: {
    carrierCode: string;
    flightNumber: string;
  };
  departure: string;
  departureTerminal?: string;
  departureGate?: string;
  arrival: string;
  arrivalTerminal?: string;
  arrivalGate?: string;
  aircraft?: string;
  duration: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  date: Date | undefined;
  status?: FlightStatus;
  isLoading?: boolean;
  error?: string;
} 