# Arkos GridAI MVP

A revolutionary grid bankability analysis platform that delivers 5-minute analysis reports for renewable energy projects.

## Project Structure

- `frontend/vercel-ui/` - Next.js frontend application
- `backend/` - FastAPI backend service
- `infra/` - Infrastructure as Code (Terraform)

## Setup Instructions

### Backend Setup

1. Install Python 3.8+ if not already installed
2. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```
3. Start the backend server:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Or on Windows:
   ```
   start_backend.bat
   ```

### Frontend Setup (requires Node.js 16+ and npm/yarn)

1. Install dependencies:
   ```
   cd frontend/vercel-ui
   npm install
   ```
2. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Development Workflow

1. Backend API runs on `http://localhost:8000`
2. Frontend runs on `http://localhost:3000`
3. API documentation available at `http://localhost:8000/docs`

## Key Features

- Australia-first grid bankability analysis
- Real-time queue intelligence
- TRI (Transmission, Risk, Interconnection) scoring
- PDF report generation
- Waitlist management

## License

Proprietary - All rights reserved
