import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  status: string;
  confidence_score: number;
  users: {
    name: string;
    employee_id: string;
    department: string;
  } | null;
}

export default function AttendanceDashboard() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttendance: 0,
    attendanceRate: 0,
  });

  const fetchData = async () => {
    setLoading(true);

    // Fetch total users
    const { data: users } = await supabase
      .from('users')
      .select('*');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's attendance (with users relation)
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, users(name, employee_id, department)')
      .gte('check_in_time', today.toISOString())
      .order('check_in_time', { ascending: false });

    // ✅ FIXED: Fetch recent attendance WITH users relation
    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('*, users(name, employee_id, department)')
      .order('check_in_time', { ascending: false })
      .limit(50);

    setAttendanceRecords((allAttendance as AttendanceRecord[]) || []);

    const totalUsers = users?.length || 0;
    const todayCount = attendance?.length || 0;
    const rate = totalUsers > 0 ? (todayCount / totalUsers) * 100 : 0;

    setStats({
      totalUsers,
      todayAttendance: todayCount,
      attendanceRate: Math.round(rate),
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 md:w-8 h-6 md:h-8 text-blue-600" />
            Attendance Dashboard
          </h2>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Total Users</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Today's Attendance</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{stats.todayAttendance}</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Attendance Rate</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{stats.attendanceRate}%</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 md:w-6 h-5 md:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">Recent Attendance Records</h3>
        </div>

        {loading ? (
          <div className="p-8 md:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm md:text-base text-gray-600">Loading attendance records...</p>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-gray-500 text-sm md:text-base">
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    ID
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Department
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <div className="text-xs md:text-sm font-medium text-gray-900">
                        {record.users?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs md:text-sm text-gray-500">
                        {record.users?.employee_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-xs md:text-sm text-gray-500">
                        {record.users?.department || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <div className="text-xs md:text-sm text-gray-500">
                        {formatDate(record.check_in_time)}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
