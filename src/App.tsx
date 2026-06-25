import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, FileSpreadsheet, RefreshCw, Sparkles, Smile } from "lucide-react";
import StudentCoach from "./components/StudentCoach";
import TeacherDashboard from "./components/TeacherDashboard";
import { Student, SessionLog } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [studentsRes, sessionsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/sessions"),
      ]);

      if (!studentsRes.ok || !sessionsRes.ok) {
        throw new Error("Could not sync with local database.");
      }

      const studentsData = await studentsRes.json();
      const sessionsData = await sessionsRes.json();

      setStudents(studentsData);
      setSessionLogs(sessionsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to retrieve student records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div id="app-root-wrapper" className="min-h-screen bg-[#f8f7f2] font-sans text-[#2d2d2d] flex flex-col py-6 px-4 md:px-8">
      
      {/* Navigation and View Switcher */}
      <header id="app-header" className="max-w-5xl w-full mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-[#e5e1d5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#5a5a40] rounded-full flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div>
            <h1 className="text-xl font-serif italic font-bold text-[#5a5a40] tracking-tight">Voice2Literacy</h1>
            <p className="text-[10px] text-[#7d796b] font-bold uppercase tracking-wider">Growth-Mindset Speech Coach</p>
          </div>
        </div>

        {/* Responsive Dual View Buttons */}
        <div id="view-mode-tabs" className="bg-[#efede4] p-1 rounded-full flex items-center gap-1 self-start sm:self-center border border-[#e5e1d5]">
          <button
            id="tab-student-mode"
            onClick={() => setActiveTab("student")}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "student"
                ? "bg-white text-[#5a5a40] shadow-sm font-semibold"
                : "text-[#7d796b] hover:text-[#5a5a40]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student Lab</span>
          </button>
          
          <button
            id="tab-teacher-mode"
            onClick={() => setActiveTab("teacher")}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "teacher"
                ? "bg-white text-[#5a5a40] shadow-sm font-semibold"
                : "text-[#7d796b] hover:text-[#5a5a40]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Teacher Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Container Stage */}
      <main id="app-main-content" className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center">
        {loading && students.length === 0 ? (
          <div id="full-loading-screen" className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#e5e1d5] shadow-sm">
            <RefreshCw className="w-8 h-8 text-[#5a5a40] animate-spin mb-3" />
            <p className="text-xs text-[#7d796b] font-bold animate-pulse">Initializing Speech & Scaffolding Engine...</p>
          </div>
        ) : error ? (
          <div id="sync-error-banner" className="bg-[#fff9ed] text-[#2d2d2d] p-6 rounded-3xl border-2 border-[#f5e1bc] text-center space-y-3">
            <h3 className="font-serif italic text-lg font-bold text-[#5a5a40]">Offline Database Problem</h3>
            <p className="text-xs leading-relaxed text-[#7d796b]">{error}</p>
            <button
              id="retry-fetch-btn"
              onClick={fetchData}
              className="px-5 py-2 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div id="active-panel-view">
            {activeTab === "student" ? (
              <StudentCoach students={students} onSessionLogged={fetchData} />
            ) : (
              <TeacherDashboard
                students={students}
                sessionLogs={sessionLogs}
                onRefreshData={fetchData}
              />
            )}
          </div>
        )}
      </main>

      {/* Humble educational info footer */}
      <footer id="app-footer" className="max-w-5xl w-full mx-auto mt-6 bg-[#5a5a40] text-white/80 rounded-xl py-3 px-6 text-[10px] flex flex-col sm:flex-row items-center justify-between gap-2 font-medium tracking-wide">
        <div className="flex gap-4 uppercase font-bold">
          <span>Privacy: COPPA Compliant</span>
          <span>Secure Voice Encryption Active</span>
        </div>
        <div className="flex gap-4">
          <span className="text-white">● Active Teacher Link</span>
        </div>
      </footer>

    </div>
  );
}
