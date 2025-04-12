import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

// Simple in-memory cache for API responses
// Key: carrierCode-flightNumber-date, Value: { data: response, timestamp: Date }
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Basic input validation (can be expanded)
interface FlightQuery {
  carrierCode: string;
  flightNumber: string;
  scheduledDepartureDate: string; // YYYY-MM-DD
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function validateQuery(query: any): query is FlightQuery {
  return (
    typeof query.carrierCode === 'string' &&
    query.carrierCode.length >= 2 &&
    query.carrierCode.length <= 3 &&
    typeof query.flightNumber === 'string' &&
    /^[0-9]{1,4}$/.test(query.flightNumber) &&
    typeof query.scheduledDepartureDate === 'string' &&
    isValidDate(query.scheduledDepartureDate)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  if (!validateQuery(queryParams)) {
    return NextResponse.json(
      { error: 'Invalid query parameters provided.' },
      { status: 400 }
    );
  }

  const { carrierCode, flightNumber, scheduledDepartureDate } = queryParams;
  
  // Create cache key
  const cacheKey = `${carrierCode}-${flightNumber}-${scheduledDepartureDate}`;
  const now = Date.now();
  
  // Check cache first
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    console.log(`Cache hit for flight ${carrierCode}${flightNumber} on ${scheduledDepartureDate}`);
    return NextResponse.json(cache[cacheKey].data);
  }

  // No cache hit, proceed with API call
  // Ensure environment variables are set
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Amadeus API credentials are not set in environment variables.');
    return NextResponse.json(
      { error: 'Internal server error: API configuration missing.' },
      { status: 500 }
    );
  }

  const amadeus = new Amadeus({
    clientId: clientId,
    clientSecret: clientSecret,
    // hostname: 'production' // Use 'production' for live data, 'test' for testing
  });

  try {
    console.log(`Fetching flight status for ${carrierCode}${flightNumber} on ${scheduledDepartureDate}`);
    const response = await amadeus.schedule.flights.get({
      carrierCode: carrierCode,
      flightNumber: flightNumber,
      scheduledDepartureDate: scheduledDepartureDate,
    });

    // Check if flight data exists
    if (!response.data || response.data.length === 0) {
        return NextResponse.json(
            { error: 'Flight not found for the given details.' },
            { status: 404 }
        );
    }

    // Log the full response to help with debugging
    console.log('Amadeus Response:', JSON.stringify(response.data[0], null, 2));

    // Return full response data to the client
    const relevantData = response.data.map((flight: any) => ({
        type: flight.type,
        scheduledDepartureDate: flight.scheduledDepartureDate,
        flightDesignator: flight.flightDesignator,
        flightPoints: flight.flightPoints,
        segments: flight.segments,
        legs: flight.legs,
        departure: flight.flightPoints?.[0]?.departure?.timings?.[0]?.value,
        departureTerminal: flight.flightPoints?.[0]?.departure?.terminal?.code,
        departureGate: flight.flightPoints?.[0]?.departure?.gate?.mainGate,
        arrival: flight.flightPoints?.[1]?.arrival?.timings?.[0]?.value,
        arrivalTerminal: flight.flightPoints?.[1]?.arrival?.terminal?.code,
        arrivalGate: flight.flightPoints?.[1]?.arrival?.gate?.mainGate,
        aircraft: flight.legs?.[0]?.aircraftEquipment?.aircraftType,
        duration: flight.legs?.[0]?.scheduledLegDuration || flight.segments?.[0]?.scheduledSegmentDuration,
    }));
    
    // Store in cache
    cache[cacheKey] = {
      data: relevantData,
      timestamp: now
    };

    return NextResponse.json(relevantData);

  } catch (error: any) {
    // Log the entire error object for better debugging
    console.error('Amadeus API Call Failed. Full Error:', error);

    // Attempt to extract details from Amadeus response if available
    let errorMessage = 'Failed to fetch flight status.';
    let errorStatus = 500;

    if (error.response && error.response.data && error.response.data.errors) {
        const amadeusError = error.response.data.errors[0];
        errorMessage = `Amadeus API Error: ${amadeusError.title}${amadeusError.detail ? ` - ${amadeusError.detail}` : ''}`;
        errorStatus = error.response.status || 500;
        console.error('Parsed Amadeus Error:', { title: amadeusError.title, detail: amadeusError.detail, status: errorStatus });
    } else if (error.description) {
        // Sometimes the SDK wraps the error
        errorMessage = error.description;
        console.error('Amadeus SDK Error Description:', error.description);
    } else if (error.message) {
        // Fallback to general error message
        errorMessage = error.message;
    }

    // Return the extracted or generic error message
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus }
    );
  }
} 