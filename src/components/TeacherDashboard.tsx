import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Trash2, User, Check, Settings, Plus, Star, BarChart2, TrendingUp, Calendar, AlertCircle, FileSpreadsheet, RefreshCw, Layers } from "lucide-react";
import { Student, SessionLog } from "../types";

interface TeacherDashboardProps {
  students: Student[];
  sessionLogs: SessionLog[];
  onRefreshData: () => void;
}

export default function TeacherDashboard({
  students,
  sessionLogs,
  onRefreshData,
}: TeacherDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFocusFilter, setSelectedFocusFilter] = useState("All");
  const [selectedEngagementFilter, setSelectedEngagementFilter] = useState("All");
  
  // Custom lesson state variables
  const [juicyWords, setJuicyWords] = useState<string[]>(["went ➔ galloped / scampered", "good ➔ spectacular / magnificent", "said ➔ bellows / whispers"]);
  const [newWordPair, setNewWordPair] = useState("");
  const [activeLessonTrack, setActiveLessonTrack] = useState("Balanced Scaffolding Track");

  // Calculate high-level statistics
  const totalSessions = sessionLogs.length;
  const avgEngagement = totalSessions > 0
    ? parseFloat((sessionLogs.reduce((acc, curr) => acc + curr.engagement_score, 0) / totalSessions).toFixed(1))
    : 0.0;

  const focusBreakdown = sessionLogs.reduce((acc: Record<string, number>, curr) => {
    acc[curr.skill_mastery_focus] = (acc[curr.skill_mastery_focus] || 0) + 1;
    return acc;
  }, {});

  // Handle word addition
  const handleAddJuicyWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordPair.trim()) return;
    setJuicyWords([...juicyWords, newWordPair]);
    setNewWordPair("");
  };

  // Handle Delete Session Log
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session log? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter session logs
  const filteredLogs = sessionLogs.filter((log) => {
    const matchesSearch = log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.raw_input.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.edited_version.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFocus = selectedFocusFilter === "All" || log.skill_mastery_focus === selectedFocusFilter;
    const matchesEngagement = selectedEngagementFilter === "All" || log.engagement_score.toString() === selectedEngagementFilter;

    return matchesSearch && matchesFocus && matchesEngagement;
  });

  return (
    <div id="teacher-dashboard" className="bg-white min-h-[600px] rounded-[32px] border border-[#e5e1d5] shadow-xs p-4 md:p-6 space-y-6">
      
      {/* Title Bar with Sync option */}
      <div id="teacher-title-bar" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e1d5] pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#5a5a40] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#5a5a40]" />
            Teacher Console
          </h1>
          <p className="text-xs text-[#7d796b] font-medium">Monitor speech-to-text transcriptions, COPS scaffolding metrics, and diagnostics.</p>
        </div>

        <button
          id="refresh-data-btn"
          onClick={onRefreshData}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-full text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Real-Time Logs</span>
        </button>
      </div>

      {/* Analytics Summary Panel */}
      <div id="analytics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card 1 */}
        <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e5e1d5] flex items-center gap-3">
          <div className="p-3 bg-[#efede4] text-[#7d796b] rounded-xl border border-[#e5e1d5]/40">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#7d796b] uppercase tracking-wider block">Completed Sessions</span>
            <span className="text-xl font-serif font-bold text-[#2d2d2d]">{totalSessions}</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e5e1d5] flex items-center gap-3">
          <div className="p-3 bg-[#fff9ed] text-[#9d7d2d] rounded-xl border border-[#f5e1bc]">
            <Star className="w-5 h-5 fill-[#9d7d2d] text-[#9d7d2d]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#7d796b] uppercase tracking-wider block">Avg. Engagement</span>
            <span className="text-xl font-serif font-bold text-[#2d2d2d]">{avgEngagement} / 5</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e5e1d5] flex items-center gap-3 col-span-1 sm:col-span-2">
          <div className="p-3 bg-[#f5f9f2] text-[#4a5a40] rounded-xl border border-[#d5e5cc] self-start">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-[#7d796b] uppercase tracking-wider block mb-1.5">Scaffolding Focus Breakdown</span>
            <div className="flex flex-wrap gap-2">
              {["Punctuation", "Capitalization", "Vocabulary Upgrading", "Elaboration"].map((focus) => {
                const count = focusBreakdown[focus] || 0;
                const colors = {
                  "Punctuation": "bg-[#fff9ed] text-[#9d7d2d] border-[#f5e1bc]",
                  "Capitalization": "bg-[#fff9ed] text-[#9d7d2d] border-[#f5e1bc]",
                  "Vocabulary Upgrading": "bg-[#efede4] text-[#7d796b] border-[#e5e1d5]",
                  "Elaboration": "bg-[#f5f9f2] text-[#4a5a40] border-[#d5e5cc]",
                }[focus];
                return (
                  <span key={focus} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors}`}>
                    {focus}: <strong className="font-extrabold">{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Classroom Setup & Scaffolding customization */}
      <div id="classroom-control-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class Roster */}
        <div className="bg-white p-5 rounded-3xl border border-[#e5e1d5] shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-serif italic font-bold text-[#5a5a40] text-sm flex items-center gap-1.5 border-b border-[#e5e1d5] pb-2">
            <User className="w-4 h-4 text-[#5a5a40]" />
            Class Roster & Skill Badges
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e1d5] text-[#7d796b] font-bold uppercase tracking-wider">
                  <th className="pb-2">Student</th>
                  <th className="pb-2 text-center">Sessions</th>
                  <th className="pb-2 text-center">Avg. Engagement</th>
                  <th className="pb-2">Mastered Skills</th>
                  <th className="pb-2">Recent Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efede4]">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#fcfaf7]">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="text-xl bg-[#efede4] p-1.5 rounded-xl border border-[#e5e1d5]/45">{student.avatar}</span>
                      <div>
                        <div className="font-bold text-[#2d2d2d]">{student.name}</div>
                        <div className="text-[10px] text-[#7d796b] font-semibold">{student.grade}</div>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-bold text-[#2d2d2d]">{student.completedSessions}</td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 bg-[#fff9ed] text-[#9d7d2d] px-2 py-0.5 rounded-full font-bold border border-[#f5e1bc]">
                        <Star className="w-3 h-3 fill-[#9d7d2d] text-[#9d7d2d]" />
                        {student.averageEngagement}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {student.masteredSkills.map((skill) => (
                          <span key={skill} className="bg-[#efede4] text-[#7d796b] px-1.5 py-0.5 rounded-md text-[9px] font-semibold">
                            {skill}
                          </span>
                        ))}
                        {student.masteredSkills.length === 0 && (
                          <span className="text-[#7d796b] italic">None yet</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="bg-[#f5f9f2] text-[#4a5a40] border border-[#d5e5cc] px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {student.recentBadge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lesson Scaffolding customizer */}
        <div className="bg-white p-5 rounded-3xl border border-[#e5e1d5] shadow-xs space-y-4">
          <h3 className="font-serif italic font-bold text-[#5a5a40] text-sm flex items-center gap-1.5 border-b border-[#e5e1d5] pb-2">
            <Settings className="w-4 h-4 text-[#5a5a40]" />
            Classroom Customizer
          </h3>

          {/* Configuration Track Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#7d796b]">Active Learning Track</label>
            <select
              value={activeLessonTrack}
              onChange={(e) => setActiveLessonTrack(e.target.value)}
              className="w-full text-xs bg-[#fcfaf7] border border-[#e5e1d5] rounded-xl p-2.5 font-medium text-[#2d2d2d] focus:outline-none focus:border-[#5a5a40]"
            >
              <option>Balanced Scaffolding Track (Default)</option>
              <option>Heavy Vocabulary Upgrade Focus</option>
              <option>Punctuation Mastery Track</option>
              <option>Elaboration Expansion Mode</option>
            </select>
          </div>

          {/* Juicy Words list */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#7d796b]">Vocabulary Upgrades (Juicy Words)</label>
            <div className="bg-[#fcfaf7] p-2.5 rounded-xl border border-[#e5e1d5] max-h-[110px] overflow-y-auto space-y-1">
              {juicyWords.map((word, i) => (
                <div key={i} className="text-[10px] font-semibold text-[#2d2d2d] bg-white px-2 py-1 rounded-md border border-[#e5e1d5]/60">
                  {word}
                </div>
              ))}
            </div>

            {/* Form to add words */}
            <form onSubmit={handleAddJuicyWord} className="flex gap-1.5">
              <input
                type="text"
                value={newWordPair}
                onChange={(e) => setNewWordPair(e.target.value)}
                placeholder="e.g., ran ➔ sprinted"
                className="flex-1 bg-white border border-[#e5e1d5] rounded-xl px-2.5 py-1.5 text-xs text-[#2d2d2d] focus:outline-none focus:border-[#5a5a40]"
              />
              <button
                type="submit"
                className="bg-[#5a5a40] hover:bg-[#4a4a34] text-white p-2 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Real-time Session Logs (Comparison Matrix) */}
      <div id="session-logs-section" className="bg-white p-5 rounded-3xl border border-[#e5e1d5] shadow-xs space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e1d5] pb-3">
          <h3 className="font-serif italic font-bold text-[#5a5a40] text-sm flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#5a5a40]" />
            Historical Student Sessions & Comparison Logs
          </h3>

          {/* Total logs matching count */}
          <span className="text-[10px] bg-[#efede4] text-[#7d796b] px-3 py-1 rounded-full font-bold">
            {filteredLogs.length} Records Found
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-[#7d796b] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, raw transcripts, edits..."
              className="w-full text-xs bg-[#fcfaf7] border border-[#e5e1d5] rounded-xl pl-10 pr-3 py-2.5 text-[#2d2d2d] placeholder-[#7d796b]/60 focus:outline-none focus:border-[#5a5a40]"
            />
          </div>

          {/* Skill focus filter */}
          <div>
            <select
              value={selectedFocusFilter}
              onChange={(e) => setSelectedFocusFilter(e.target.value)}
              className="w-full text-xs bg-[#fcfaf7] border border-[#e5e1d5] rounded-xl p-2.5 font-medium text-[#2d2d2d] focus:outline-none"
            >
              <option value="All">All Focuses</option>
              <option value="Punctuation">Punctuation</option>
              <option value="Capitalization">Capitalization</option>
              <option value="Vocabulary Upgrading">Vocabulary Upgrading</option>
              <option value="Elaboration">Elaboration</option>
            </select>
          </div>

          {/* Engagement filter */}
          <div>
            <select
              value={selectedEngagementFilter}
              onChange={(e) => setSelectedEngagementFilter(e.target.value)}
              className="w-full text-xs bg-[#fcfaf7] border border-[#e5e1d5] rounded-xl p-2.5 font-medium text-[#2d2d2d] focus:outline-none"
            >
              <option value="All">All Engagement Levels</option>
              <option value="5">5/5 Engagement</option>
              <option value="4">4/5 Engagement</option>
              <option value="3">3/5 Engagement</option>
              <option value="2">2/5 Engagement</option>
              <option value="1">1/5 Engagement</option>
            </select>
          </div>

        </div>

        {/* Logs Listing / Comparison Matrix */}
        <div id="session-logs-list" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                id={`session-log-card-${log.id}`}
                layout
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 bg-[#fcfaf7] hover:bg-[#fff9ed]/30 border border-[#e5e1d5] rounded-2xl space-y-3 relative group transition-colors"
              >
                {/* Log Header metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2d2d2d] text-xs">{log.studentName}</span>
                    <span className="text-[10px] text-[#7d796b] font-medium">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Focus Tag */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      log.skill_mastery_focus === "Punctuation" ? "bg-[#fff9ed] text-[#9d7d2d] border-[#f5e1bc]" :
                      log.skill_mastery_focus === "Capitalization" ? "bg-[#fff9ed] text-[#9d7d2d] border-[#f5e1bc]" :
                      log.skill_mastery_focus === "Vocabulary Upgrading" ? "bg-[#efede4] text-[#7d796b] border-[#e5e1d5]" :
                      "bg-[#f5f9f2] text-[#4a5a40] border-[#d5e5cc]"
                    }`}>
                      {log.skill_mastery_focus}
                    </span>

                    {/* Engagement score stars */}
                    <span className="inline-flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3 h-3 ${idx < log.engagement_score ? "fill-[#9d7d2d] text-[#9d7d2d]" : "text-[#e5e1d5]"}`}
                        />
                      ))}
                    </span>

                    {/* Trash Button */}
                    <button
                      id={`delete-log-btn-${log.id}`}
                      onClick={() => handleDeleteSession(log.id)}
                      className="text-[#7d796b] hover:text-[#e65a5a] p-1 rounded-md hover:bg-[#efede4] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comparative Diffs Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left block: original spoken transcription */}
                  <div className="bg-white p-3 rounded-xl border border-[#e5e1d5]/70">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7d796b] block mb-1">
                      📝 Raw Spoken transcription:
                    </span>
                    <p className="text-xs text-[#7d796b] italic font-medium leading-relaxed">
                      "{log.raw_input}"
                    </p>
                  </div>

                  {/* Right block: edited correct text */}
                  <div className="bg-[#f5f9f2] p-3 rounded-xl border border-[#d5e5cc]">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#4a5a40] block mb-1">
                      ✨ Polished Written Masterpiece:
                    </span>
                    <p className="text-xs text-[#2d2d2d] font-serif font-bold italic leading-relaxed">
                      "{log.edited_version}"
                    </p>
                  </div>
                </div>

                {/* Analytical Diagnostics from Coach Voicey */}
                <div className="bg-white p-3 rounded-xl border border-[#e5e1d5]/60 flex items-start gap-2">
                  <div className="bg-[#fff9ed] border border-[#f5e1bc] text-[#9d7d2d] p-1.5 rounded-lg text-xs mt-0.5">
                    🤖
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7d796b] block">
                      Coach Diagnostics & Scaffolding Notes:
                    </span>
                    <p className="text-xs text-[#2d2d2d] font-medium leading-relaxed">
                      {log.coach_notes}
                    </p>
                  </div>
                </div>

              </motion.div>
            ))}

            {filteredLogs.length === 0 && (
              <div id="no-logs-alert" className="text-center py-12 bg-[#fcfaf7] border border-[#e5e1d5] rounded-2xl">
                <AlertCircle className="w-8 h-8 text-[#7d796b]/60 mx-auto mb-2" />
                <h4 className="font-serif italic font-bold text-[#5a5a40] text-sm">No session logs match your filters</h4>
                <p className="text-xs text-[#7d796b]">Complete sessions in the Student panel to populate logs!</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
