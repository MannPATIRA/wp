# Dream University Navigator

An AI-powered platform empowering high school students with personalized university admissions guidance, transforming the complex college application process into an engaging, supportive experience.

## Technologies

- TypeScript/React frontend
- Node.js/Express backend
- PostgreSQL with Drizzle ORM
- AI-powered recommendation engine
- Modern authentication mechanisms
- Type-safe schema validation

## Features

- Personalized university preparation recommendations
- Real-world opportunity discovery through dynamic web searches
- Academic profile analysis and goal setting
- Timeline planning for university admission
- Smart opportunity matching based on student profiles

## Project Structure

- **client/**: React frontend application
- **server/**: Express backend and API routes
- **server/agents/**: AI recommendation agents for opportunity discovery
- **shared/**: Shared types and schemas
- **scripts/**: Utility scripts for maintenance and testing

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Access the application at `http://localhost:5000`

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL database connection string
- `OPENAI_API_KEY`: OpenAI API key for the recommendation engine
- `GOOGLE_API_KEY`: Google API key for web search
- `GOOGLE_SEARCH_CX`: Google Custom Search Engine ID

## Testing

Run the comprehensive testing script to verify recommendation quality:

```bash
node scripts/comprehensive-field-test.cjs
```