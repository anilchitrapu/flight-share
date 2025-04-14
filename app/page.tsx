import { FlightForm } from "@/components/flight-form"
import { DepartureBoard } from "@/components/DepartureBoard"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-700 via-gray-500 to-gray-300 bg-gradient-enhanced" id="main-container">
      <div className="container relative z-10 mx-auto px-4 py-6 max-w-3xl">
        <DepartureBoard 
          title="FLIGHT SHARE"
          subtitle="SHARE YOUR FLIGHT DETAILS WITH FRIENDS AND FAMILY"
        />

        <div className="bg-black rounded-xl shadow-lg overflow-hidden">
          <FlightForm />
        </div>
      </div>
    </main>
  )
}
