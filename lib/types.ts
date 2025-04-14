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
  
  // API response structures
  legs?: {
    boardPointIataCode: string;
    offPointIataCode: string;
    aircraftEquipment?: {
      aircraftType: string;
    };
    scheduledLegDuration?: string;
  }[];
  
  segments?: {
    boardPointIataCode: string;
    offPointIataCode: string;
    scheduledSegmentDuration?: string;
    partnership?: {
      operatingFlight: {
        carrierCode: string;
        flightNumber?: string;
      };
    };
  }[];
  
  flightPoints?: {
    iataCode: string;
    departure?: {
      timings: {
        qualifier: string;
        value: string;
      }[];
    };
    arrival?: {
      timings: {
        qualifier: string;
        value: string;
      }[];
    };
  }[];
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