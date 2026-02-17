import { useState } from 'react';
import { UserPlus, CheckCircle, LayoutDashboard } from 'lucide-react';
import RegisterUser from './components/RegisterUser';
import MarkAttendance from './components/MarkAttendance';
import AttendanceDashboard from './components/AttendanceDashboard';

type View = 'register' | 'attendance' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('attendance');

  const navButtons = [
    {
      id: 'attendance',
      label: 'Mark Attendance',
      icon: CheckCircle,
      color: 'green',
    },
    {
      id: 'register',
      label: 'Register User',
      icon: UserPlus,
      color: 'blue',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'orange',
    },
  ];

  const getButtonClass = (id: string, color: string) => {
    const isActive = currentView === id;
    const colorMap = {
      green: 'bg-green-600 hover:bg-green-700',
      blue: 'bg-blue-600 hover:bg-blue-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
    };
    const activeColor = colorMap[color as keyof typeof colorMap] || 'bg-green-600';

    return `flex items-center justify-center gap-2 w-full md:w-auto px-3 md:px-4 py-2.5 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
      isActive ? `${activeColor} text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="w-full px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800 text-center md:text-left">
              Face Recognition
            </h1>
            <div className="grid grid-cols-3 md:flex gap-2 md:gap-4">
              {navButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setCurrentView(btn.id as View)}
                    className={getButtonClass(btn.id, btn.color)}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-4 md:py-8 px-4 md:px-6">
        {currentView === 'register' && <RegisterUser />}
        {currentView === 'attendance' && <MarkAttendance />}
        {currentView === 'dashboard' && <AttendanceDashboard />}
      </main>

      <footer className="bg-white mt-8 md:mt-12 py-4 md:py-6 text-center text-gray-600 px-4">
        <p className="text-sm md:text-base">Face Recognition Attendance System</p>
      </footer>
    </div>
  );
}

export default App;
