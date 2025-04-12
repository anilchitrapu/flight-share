# Flight Share

A React application to share screenshots of flight itineraries.

## Features

- Real-time flight status tracking
- Beautiful itinerary sharing interface
- Screenshot generation for easy sharing
- Multiple flight entry support

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Radix UI
- Vercel Deployment

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/anilchitrapu/flight-share.git
cd flight-share
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your API credentials.

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

The following environment variables are required:

- `AMADEUS_CLIENT_ID`: Your Amadeus API client ID
- `AMADEUS_CLIENT_SECRET`: Your Amadeus API client secret
- `AVIATIONSTACK_API_KEY`: Your Aviationstack API key
- `NEXT_PUBLIC_APP_URL`: The URL of your application (default: http://localhost:3000)

## Deployment

This project is configured for deployment on Vercel. The deployment process is automated through GitHub Actions.

## License

MIT License - see [LICENSE](LICENSE) for details. 