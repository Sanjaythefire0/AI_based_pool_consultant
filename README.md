# Maverick Backend

Backend services for the Maverick project including code quality checker and attendance tracker.


## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_anon_key_here
   
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Server Configuration
   PORT=3000
   ```

## Usage

### Code Quality Checker
```bash
# Start the API server
npm start

# Run code quality analysis directly
npm run analyze
```

### Attendance Tracker
```bash
# Run attendance analysis
npm run attendance
```

## API Endpoints

### POST /analyze
Analyzes code quality of a GitHub repository.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/username/repository"
}
```

**Response:**
```json
{
  "consolidatedScore": "85",
  "consolidatedImprovements": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ]
}
```

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 3000)

## Security

⚠️ **Important:** Never commit your `.env` file to version control. All API keys have been moved to environment variables for security. 
