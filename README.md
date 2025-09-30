# YourKanjiName

AI-powered Japanese Kanji name generator based on psychological profiling.

## 🌟 Features

- **Psychological Profiling**: 6 fundamental motivations (knowledge, creative, belonging, dominance, stability, freedom)
- **Gender-Aware**: Considers both declared gender and personality traits
- **Multi-language Support**: Japanese and English
- **Advanced Matching Algorithm**: Sophisticated kanji selection based on personality and gender
- **Beautiful UI**: Modern, responsive design with animations

## 🏗️ Architecture

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **Session Management**: UUID-based sessions
- **Question Flow**: Dynamic branching based on answers
- **Scoring Engine**: Multi-dimensional personality assessment
- **Matching Engine**: AI-powered kanji selection

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Modern CSS with gradients and animations
- **State Management**: React hooks
- **API Integration**: RESTful API client

## 📁 Project Structure

```
kanjiname/
├── src/
│   ├── server.ts                 # Express server
│   ├── routes/                   # API routes
│   │   ├── sessions.ts
│   │   ├── questions.ts
│   │   ├── answers.ts
│   │   └── generation.ts
│   ├── services/                 # Business logic
│   │   ├── SessionService.ts
│   │   ├── FlowService.ts
│   │   ├── QuestionService.ts
│   │   ├── AnswerService.ts
│   │   └── GenerationService.ts
│   ├── config/
│   │   └── database.ts
│   ├── data/
│   │   └── kanjiDatabase.ts      # Kanji data
│   └── __tests__/
│       └── api.test.ts
├── schema.sql                    # Database schema
├── questions.json                # Question flow data
├── scoring.ts                    # Scoring logic
├── kanjiMatching.ts              # Matching algorithm
├── QuestionFlow.tsx              # Frontend component
├── QuestionFlow.css              # Frontend styles
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd kanjiname
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database
```bash
psql -U postgres -c "CREATE DATABASE yourkanjiname;"
psql -U postgres -d yourkanjiname -f schema.sql
```

5. Run development server
```bash
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:session_id` - Get session info
- `GET /api/sessions/:session_id/next-question` - Get next question

### Questions
- `GET /api/questions/:question_id` - Get specific question

### Answers
- `POST /api/sessions/:session_id/answers` - Submit answer

### Generation
- `POST /api/sessions/:session_id/generate` - Generate kanji name
- `GET /api/sessions/:session_id/result` - Get existing result

### Health
- `GET /health` - Health check

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## 🔧 Development

```bash
# Run development server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 Question Flow

1. **Q0**: Introduction
2. **Q1**: Gender declaration
3. **Q2-Q5**: Gender-specific trait questions
4. **Q6-Q9**: Childhood/adolescent motivation questions
5. **Q10-Q11**: Motivation subtype questions
6. **Result**: Generate kanji name

## 🎯 Scoring System

### Gender Traits (-10 to +10)
- Strong Masculine: +6 or higher
- Soft Masculine: +1 to +5
- Neutral: -1 to +1
- Soft Feminine: -2 to -5
- Strong Feminine: -6 or lower

### Motivations (0-10 points each)
- Knowledge Desire (知識欲)
- Creative Desire (創造欲)
- Belonging Desire (所属欲)
- Dominance Desire (支配欲)
- Stability Desire (安定欲)
- Freedom Desire (自由欲)

### Matching Score
- Gender Match: 30%
- Motivation Match: 40%
- Subtype Match: 30%

## 🌐 Deployment

### Environment Variables

```env
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=yourkanjiname
DB_USER=your_db_user
DB_PASSWORD=your_db_password
FRONTEND_URL=https://your-frontend-url.com
```

### Production Checklist

- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all API endpoints
- [ ] Load test the application
- [ ] Set up CI/CD pipeline

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.