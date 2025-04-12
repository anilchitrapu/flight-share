import { FlightForm } from "@/components/flight-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Flight Share <span className="inline-block ml-1">✈️</span>
          </h1>
          <p className="text-gray-600">Add your flight details and share them with friends and family</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <FlightForm />
        </div>
      </div>
    </main>
  )
}
