# Sports Academy Management System

A comprehensive full-stack web application for managing sports academy operations, athlete performance tracking, and analytics.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Admin, Coach, and Athlete roles with specific permissions ok
- **Athlete & Coach Management**: Complete profile management system
- **Batch & Schedule Management**: Organize training sessions and schedules
- **Attendance Tracking**: Session-wise attendance with statistics
- **Performance Analytics**: Track athlete progress with visual charts
- **Dashboard**: Role-specific dashboards with key metrics

### Technology Stack

**Backend:**
- Python 3.10+
- Django 5.0
- Django REST Framework
- MySQL / SQLite
- Pandas & NumPy for analytics
- JWT Authentication

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Recharts for data visualization
- Axios for API calls
- React Router for navigation

## 📋 Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm
- MySQL (optional, can use SQLite for development)

## 🛠️ Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r ../requirements.txt
```

4. **Configure environment variables:**
```bash
# Copy the example env file
copy ..\.env.example .env

# Edit .env and configure your database settings
# For development, you can use SQLite (default)
```

5. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (Admin):**
```bash
python manage.py createsuperuser
```

7. **Run development server:**
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run development server:**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🎯 Usage

### First Time Setup

1. **Access the application:**
   - Open `http://localhost:5173` in your browser

2. **Register an account:**
   - Click "Register" and create an account
   - Choose your role (Admin/Coach/Athlete)

3. **Login:**
   - Use your credentials to login

### Admin Workflow

1. **Create Sports:**
   - Navigate to Sports section
   - Add sports categories (e.g., Cricket, Football, Basketball)

2. **Create Batches:**
   - Go to Batches section
   - Create training batches and assign coaches

3. **Manage Athletes:**
   - Add athlete profiles
   - Assign them to batches

4. **Define Performance Metrics:**
   - Set up performance tests for each sport
   - Define metrics like speed, endurance, skill ratings

### Coach Workflow

1. **View Assigned Batches:**
   - See all batches you're coaching

2. **Mark Attendance:**
   - Select a session
   - Mark attendance for athletes

3. **Record Performance:**
   - Create test sessions
   - Enter performance results for athletes

### Athlete Workflow

1. **View Dashboard:**
   - See attendance statistics
   - View performance summary

2. **Track Progress:**
   - View performance trends
   - See improvement over time

## 📁 Project Structure

```
sports_academy/
├── backend/                    # Django Backend
│   ├── sports_academy/        # Project settings
│   ├── core/                  # User authentication
│   ├── academy/               # Academy management
│   └── performance/           # Performance tracking
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── context/          # React context
│   └── public/
├── requirements.txt           # Python dependencies
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Academy
- `GET/POST /api/academy/sports/` - Sports management
- `GET/POST /api/academy/batches/` - Batch management
- `GET/POST /api/academy/athletes/` - Athlete profiles
- `GET/POST /api/academy/schedules/` - Schedule management
- `GET/POST /api/academy/attendance/` - Attendance tracking
- `GET /api/academy/attendance/stats/` - Attendance statistics

### Performance
- `GET/POST /api/performance/metrics/` - Performance metrics
- `GET/POST /api/performance/sessions/` - Test sessions
- `GET/POST /api/performance/results/` - Test results
- `GET /api/performance/results/trends/` - Performance trends
- `GET /api/performance/results/summary/` - Performance summary

## 🎨 Features Highlights

### Dashboard
- Role-specific statistics
- Quick action buttons
- Visual metrics cards

### Performance Analytics
- Line charts showing progress over time
- Improvement percentage calculations
- Best, average, and latest values
- Historical data tracking

### Attendance System
- Bulk attendance marking
- Attendance percentage calculation
- Session-wise tracking
- Status options: Present, Absent, Late, Excused

## 🔒 Security Features

- JWT-based authentication
- Token refresh mechanism
- Role-based access control
- Password hashing
- CORS configuration
- Protected API endpoints

## 🚧 Future Enhancements

- PDF report generation
- Email notifications
- Mobile app
- Advanced analytics with ML
- Video analysis integration
- Payment management
- Parent portal

## 📝 License

This project is created for academic purposes.

## 👥 Support

For issues or questions, please create an issue in the repository.

## 🙏 Acknowledgments

Built with modern web technologies for efficient sports academy management.
