import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Send, HelpCircle, Volume2, VolumeX, Sparkles, Trophy, RotateCcw, ArrowRight, CheckCircle, ArrowLeft, BookOpen } from "lucide-react";
import WaveformAnimation from "./WaveformAnimation";
import { Student, FocusType, CoachResponse } from "../types";

// Polyfill speech recognition
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface StudentCoachProps {
  students: Student[];
  onSessionLogged: () => void;
}

export default function StudentCoach({ students, onSessionLogged }: StudentCoachProps) {
  // 1. Setup Phase State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState("🐨");
  
  // 2. Active Session State
  const [focusType, setFocusType] = useState<FocusType>("Punctuation");
  const [sessionStage, setSessionStage] = useState<"choose_student" | "choose_focus" | "input" | "coaching" | "completed">("choose_student");
  
  // Speech & Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // TextInput & Transcript State
  const [studentText, setStudentText] = useState("");
  const [currentEditAttempt, setCurrentEditAttempt] = useState("");
  
  // Coach Response / AI State
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [frustrationMode, setFrustrationMode] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<string | null>(null);
  
  // Confetti particles for completion
  const [showConfetti, setShowConfetti] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Services
  useEffect(() => {
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (sessionStage === "input") {
          setStudentText((prev) => (prev ? prev + " " + transcript : transcript));
        } else if (sessionStage === "coaching") {
          setCurrentEditAttempt(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone blocked. You can type in the box below!");
        } else {
          setSpeechError(`Sound problem: ${event.error}. Feel free to type!`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [sessionStage]);

  // Read coach feedback aloud when it arrives
  useEffect(() => {
    if (coachResponse?.coachReply && !isMuted && synthRef.current) {
      synthRef.current.cancel(); // Stop any current speaking
      
      const utterance = new SpeechSynthesisUtterance(coachResponse.coachReply);
      utterance.rate = 1.05; // Slightly faster for high energy
      utterance.pitch = 1.25; // Friendly child-coach high pitch
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      activeUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  }, [coachResponse, isMuted]);

  // Handle Recording Toggle
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition isn't supported in this browser. Don't worry, you can type your ideas!");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Create a brand new student profile
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentName,
          avatar: newStudentAvatar,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedStudent(data);
        setNewStudentName("");
        setIsCreatingProfile(false);
        setSessionStage("choose_focus");
        onSessionLogged(); // Refresh listing
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit original idea to server
  const handleSendIdea = async () => {
    const textToSubmit = studentText.trim();
    if (!textToSubmit) return;

    setIsLoadingCoach(true);
    setSpeechError(null);
    setFrustrationMode(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "initiate",
          studentIdea: textToSubmit,
          studentIdeaHistory: [textToSubmit],
          focusType: focusType,
          studentFrustrated: false,
        }),
      });

      if (response.ok) {
        const data: CoachResponse = await response.json();
        setCoachResponse(data);
        setEditHistory([textToSubmit]);
        setSessionStage("coaching");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Submit correction/edit attempt to server
  const handleSendEdit = async (forcedText?: string) => {
    const textToSubmit = (forcedText || currentEditAttempt).trim();
    if (!textToSubmit) return;

    setIsLoadingCoach(true);
    setSpeechError(null);

    const updatedHistory = [...editHistory, textToSubmit];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "feedback",
          studentIdea: studentText,
          studentIdeaHistory: updatedHistory,
          focusType: focusType,
          studentFrustrated: frustrationMode,
        }),
      });

      if (response.ok) {
        const data: CoachResponse = await response.json();
        setCoachResponse(data);
        setEditHistory(updatedHistory);
        setCurrentEditAttempt("");

        if (data.isActivityCompleted) {
          // Success! Log the finished session to server DB
          await logCompletedSession(data, textToSubmit);
          setSessionStage("completed");
          triggerConfetti();
        } else if (data.detectedFrustration) {
          setFrustrationMode(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Persistent server log
  const logCompletedSession = async (finalCoachResponse: CoachResponse, finalEditedText: string) => {
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent?.id || "student_anonymous",
          studentName: selectedStudent?.name || "Guest Student",
          raw_input: studentText,
          edited_version: finalEditedText,
          skill_mastery_focus: finalCoachResponse.teacherLogAssessment.skill_mastery_focus,
          sub_skill: finalCoachResponse.teacherLogAssessment.sub_skill,
          engagement_score: finalCoachResponse.teacherLogAssessment.engagement_score,
          coach_notes: finalCoachResponse.teacherLogAssessment.coach_notes,
        }),
      });

      // Award specific badge based on category
      const focus = finalCoachResponse.teacherLogAssessment.skill_mastery_focus;
      if (focus === "Punctuation") setEarnedBadge("Punctuation Pioneer");
      else if (focus === "Capitalization") setEarnedBadge("Capital Captain");
      else if (focus === "Vocabulary Upgrading") setEarnedBadge("Juicy Word Wizard");
      else setEarnedBadge("Curious Thinker");

      onSessionLogged(); // Triggers teacher dashboard reload
    } catch (err) {
      console.error("Failed to log session:", err);
    }
  };

  // Pivot to confidence booster immediately
  const handleConfidenceBooster = async () => {
    setFrustrationMode(true);
    setIsLoadingCoach(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "feedback",
          studentIdea: studentText,
          studentIdeaHistory: editHistory,
          focusType: focusType,
          studentFrustrated: true, // Signals Gemini to boost confidence
        }),
      });

      if (response.ok) {
        const data: CoachResponse = await response.json();
        setCoachResponse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Trigger CSS particles celebration
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  const resetSession = () => {
    setStudentText("");
    setCurrentEditAttempt("");
    setCoachResponse(null);
    setEditHistory([]);
    setFrustrationMode(false);
    setEarnedBadge(null);
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setSessionStage("choose_focus");
  };

  const textToHighlightAndBake = (fullText: string, segmentToHighlight: string) => {
    if (!segmentToHighlight || !fullText.toLowerCase().includes(segmentToHighlight.toLowerCase())) {
      return <span id="full-text-display">{fullText}</span>;
    }

    const index = fullText.toLowerCase().indexOf(segmentToHighlight.toLowerCase());
    const before = fullText.substring(0, index);
    const match = fullText.substring(index, index + segmentToHighlight.length);
    const after = fullText.substring(index + segmentToHighlight.length);

    return (
      <span id="interactive-text-rendered">
        {before}
        <motion.span
          id="pulsing-edit-word"
          className="bg-[#fff9ed] text-[#9d7d2d] font-serif font-bold px-2 py-0.5 rounded-lg border border-[#f5e1bc] inline-block mx-1 shadow-xs"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {match}
        </motion.span>
        {after}
      </span>
    );
  };

  return (
    <div id="student-coach-container" className="relative bg-white min-h-[600px] flex flex-col p-4 md:p-6 rounded-[32px] border border-[#e5e1d5] shadow-sm overflow-hidden">
      
      {/* Visual Confetti Fallback */}
      {showConfetti && (
        <div id="confetti-curtain" className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          {Array.from({ length: 60 }).map((_, i) => {
            const colors = ["#5a5a40", "#829a84", "#a5a58d", "#9d7d2d", "#fff9ed", "#efede4"];
            const randomColor = colors[i % colors.length];
            const left = Math.random() * 100;
            const top = -10 - Math.random() * 20;
            const duration = 2.5 + Math.random() * 2;
            const delay = Math.random() * 1.5;

            return (
              <motion.div
                key={i}
                id={`confetti-particle-${i}`}
                className="absolute w-3 h-3 rounded-md animate-bounce"
                style={{ backgroundColor: randomColor, left: `${left}%` }}
                initial={{ top: `${top}%`, rotate: 0, opacity: 1 }}
                animate={{ top: "110%", rotate: 360 * 2, opacity: 0 }}
                transition={{ duration: duration, delay: delay, ease: "easeIn", repeat: 0 }}
              />
            );
          })}
        </div>
      )}

      {/* Dynamic Header */}
      <div id="student-header" className="flex items-center justify-between border-b border-[#e5e1d5] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#5a5a40] text-white p-2 rounded-xl shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif italic font-bold text-[#5a5a40] tracking-tight">Literacy Lab</h1>
            <p className="text-xs text-[#7d796b] font-medium">4th Grade Speech-to-Write Coach</p>
          </div>
        </div>

        {/* Audio Output Settings */}
        <button
          id="audio-output-toggle"
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && synthRef.current) {
              synthRef.current.cancel();
              setIsSpeaking(false);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all duration-200 ${
            isMuted
              ? "bg-[#efede4] text-[#7d796b] hover:bg-[#e5e1d5]"
              : "bg-[#f5f9f2] text-[#4a5a40] hover:bg-[#d5e5cc] border border-[#d5e5cc]"
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Coach Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Coach Speaks</span>
            </>
          )}
        </button>
      </div>

      {/* Main Interactive Work Area */}
      <div id="student-main-workspace" className="flex-1 flex flex-col justify-center">
        
        {/* Stage 1: Choose or Create Profile */}
        {sessionStage === "choose_student" && (
          <motion.div
            id="choose-student-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto py-6"
          >
            <h2 className="text-2xl font-serif font-medium text-[#2d2d2d] mb-1">Welcome, Writing Hero! 🌟</h2>
            <p className="text-[#7d796b] text-sm mb-6">Who is playing and building awesome ideas today?</p>

            {!isCreatingProfile ? (
              <div id="profiles-picker" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      id={`student-select-${student.id}`}
                      onClick={() => {
                        setSelectedStudent(student);
                        setSessionStage("choose_focus");
                      }}
                      className="flex flex-col items-center p-4 bg-white hover:bg-[#f8f7f2] border border-[#e5e1d5] hover:border-[#5a5a40] rounded-2xl shadow-xs hover:shadow-sm transition-all group"
                    >
                      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {student.avatar}
                      </span>
                      <span className="font-bold text-[#2d2d2d] text-sm">{student.name}</span>
                      <span className="text-xs text-[#7d796b] font-medium">{student.recentBadge || "Ready!"}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    id="new-profile-btn"
                    onClick={() => setIsCreatingProfile(true)}
                    className="w-full bg-[#5a5a40] hover:bg-[#4a4a34] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-sm"
                  >
                    + Create a New Profile
                  </button>
                </div>
              </div>
            ) : (
              <form id="create-profile-form" onSubmit={handleCreateStudent} className="bg-[#fcfaf7] p-5 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-4 text-left">
                <h3 className="font-serif italic text-base font-bold text-[#5a5a40]">Let's create your writing badge!</h3>
                
                <div>
                  <label className="block text-xs font-bold text-[#7d796b] mb-1">Your Name or Pen-Name</label>
                  <input
                    type="text"
                    id="new-student-name-input"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter your first name..."
                    maxLength={15}
                    className="w-full border border-[#e5e1d5] bg-white rounded-xl px-3.5 py-2 text-sm focus:border-[#5a5a40] focus:outline-none font-medium text-[#2d2d2d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7d796b] mb-1">Choose Your Buddy Avatar</label>
                  <div className="flex gap-2.5 justify-center py-2 bg-[#efede4] rounded-xl">
                    {["🐨", "🐻", "🦊", "🦁", "🦉", "🦄"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        id={`avatar-emoji-${emoji}`}
                        onClick={() => setNewStudentAvatar(emoji)}
                        className={`text-2xl p-1.5 rounded-lg transition-transform ${
                          newStudentAvatar === emoji ? "bg-white scale-125 shadow-sm border border-[#e5e1d5]" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    id="cancel-profile-btn"
                    onClick={() => setIsCreatingProfile(false)}
                    className="flex-1 bg-[#efede4] hover:bg-[#e5e1d5] text-[#7d796b] font-bold py-2 rounded-xl transition-all text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    id="submit-profile-btn"
                    className="flex-1 bg-[#5a5a40] hover:bg-[#4a4a34] text-white font-bold py-2 rounded-xl shadow-xs transition-all text-xs"
                  >
                    Save & Start!
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Stage 2: Choose Scaffolding Focus */}
        {sessionStage === "choose_focus" && selectedStudent && (
          <motion.div
            id="choose-focus-stage"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto py-4 space-y-5 w-full"
          >
            <div className="text-center">
              <span className="text-4xl">{selectedStudent.avatar}</span>
              <h2 className="text-xl font-serif font-medium text-[#2d2d2d] mt-1">Hello, {selectedStudent.name}!</h2>
              <p className="text-[#7d796b] text-xs mt-0.5">Choose your super literacy challenge for today:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Challenge 1 */}
              <button
                id="select-stop-sign-btn"
                onClick={() => {
                  setFocusType("Punctuation");
                  setSessionStage("input");
                }}
                className="flex items-start gap-3 p-4 bg-white hover:bg-[#fff9ed]/60 border border-[#e5e1d5] hover:border-[#f5e1bc] rounded-2xl text-left shadow-xs transition-all group"
              >
                <div className="text-3xl p-2 bg-[#fff9ed] border border-[#f5e1bc] rounded-xl group-hover:scale-105 transition-transform">🛑</div>
                <div>
                  <h4 className="font-serif italic text-[#5a5a40] font-bold text-sm">The Stop Sign</h4>
                  <p className="text-xs text-[#7d796b]">Find where to place periods in run-on sentences.</p>
                </div>
              </button>

              {/* Challenge 2 */}
              <button
                id="select-name-game-btn"
                onClick={() => {
                  setFocusType("Capitalization");
                  setSessionStage("input");
                }}
                className="flex items-start gap-3 p-4 bg-white hover:bg-[#fff9ed]/60 border border-[#e5e1d5] hover:border-[#f5e1bc] rounded-2xl text-left shadow-xs transition-all group"
              >
                <div className="text-3xl p-2 bg-[#fff9ed] border border-[#f5e1bc] rounded-xl group-hover:scale-105 transition-transform">📛</div>
                <div>
                  <h4 className="font-serif italic text-[#5a5a40] font-bold text-sm">The Name Game</h4>
                  <p className="text-xs text-[#7d796b]">Capitalize proper nouns (places, days, names!).</p>
                </div>
              </button>

              {/* Challenge 3 */}
              <button
                id="select-word-upgrade-btn"
                onClick={() => {
                  setFocusType("Vocabulary Upgrading");
                  setSessionStage("input");
                }}
                className="flex items-start gap-3 p-4 bg-white hover:bg-[#fff9ed]/60 border border-[#e5e1d5] hover:border-[#f5e1bc] rounded-2xl text-left shadow-xs transition-all group"
              >
                <div className="text-3xl p-2 bg-[#fff9ed] border border-[#f5e1bc] rounded-xl group-hover:scale-105 transition-transform">🍒</div>
                <div>
                  <h4 className="font-serif italic text-[#5a5a40] font-bold text-sm">Word Upgrade</h4>
                  <p className="text-xs text-[#7d796b]">Replace flat words with colorful, "Juicy Words"!</p>
                </div>
              </button>

              {/* Challenge 4 */}
              <button
                id="select-evidence-check-btn"
                onClick={() => {
                  setFocusType("Elaboration");
                  setSessionStage("input");
                }}
                className="flex items-start gap-3 p-4 bg-white hover:bg-[#fff9ed]/60 border border-[#e5e1d5] hover:border-[#f5e1bc] rounded-2xl text-left shadow-xs transition-all group"
              >
                <div className="text-3xl p-2 bg-[#fff9ed] border border-[#f5e1bc] rounded-xl group-hover:scale-105 transition-transform">💡</div>
                <div>
                  <h4 className="font-serif italic text-[#5a5a40] font-bold text-sm">Evidence Check</h4>
                  <p className="text-xs text-[#7d796b]">Add an exciting "Why" or "Because" detail.</p>
                </div>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                id="change-student-btn"
                onClick={() => setSessionStage("choose_student")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5a5a40] hover:text-[#4a4a34]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Student Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Input Ideas (Text or Voice) */}
        {sessionStage === "input" && selectedStudent && (
          <motion.div
            id="draft-idea-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto py-2 space-y-4 w-full"
          >
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#fff9ed] text-[#9d7d2d] border border-[#f5e1bc] px-4 py-1.5 rounded-full inline-block">
                Active Challenge: {focusType}
              </span>
              <h2 className="text-2xl font-serif font-medium text-[#2d2d2d] mt-4">What is your amazing idea?</h2>
              <p className="text-[#7d796b] text-sm mt-1">Tap the microphone and tell me your thoughts, or type it in!</p>
            </div>

            {/* Recorder Section */}
            <div className="bg-white p-6 rounded-3xl border border-[#e5e1d5] shadow-xs flex flex-col items-center space-y-4">
              <WaveformAnimation isRecording={isRecording} isSpeaking={isSpeaking} color="bg-[#5a5a40]" />

              {/* Huge Mic Button */}
              <button
                id="mic-record-toggle"
                onClick={toggleRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ring-8 ring-[#5a5a40]/10 ${
                  isRecording ? "bg-[#e65a5a] text-white animate-pulse" : "bg-[#5a5a40] text-white"
                }`}
              >
                {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>

              <span className="text-xs font-bold text-[#2d2d2d]">
                {isRecording ? "Listening to you... Tap to finish!" : "Tap the Mic to speak!"}
              </span>

              {speechError && (
                <div id="recording-error-alert" className="text-xs bg-[#fff9ed] text-[#9d7d2d] border border-[#f5e1bc] rounded-xl p-3 text-center font-medium">
                  {speechError}
                </div>
              )}
            </div>

            {/* Text Area fallback & modification */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#7d796b] uppercase tracking-wider">📝 Your Spoken Idea</label>
              <div className="relative">
                <textarea
                  id="student-idea-textarea"
                  value={studentText}
                  onChange={(e) => setStudentText(e.target.value)}
                  placeholder="Your ideas will appear here as you speak, or you can write them here..."
                  className="w-full bg-[#fcfaf7] border border-[#d9d5c5] rounded-2xl p-4 text-sm font-medium text-[#2d2d2d] focus:outline-none focus:border-[#5a5a40] min-h-[90px] pr-10 italic text-[#5a5a40]"
                />
                {studentText && (
                  <button
                    id="clear-idea-text"
                    onClick={() => setStudentText("")}
                    className="absolute right-3 top-3 text-xs bg-[#efede4] text-[#7d796b] hover:bg-[#e5e1d5] font-bold px-2 py-0.5 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Stage Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                id="back-to-focus-btn"
                onClick={() => setSessionStage("choose_focus")}
                className="flex-1 bg-[#efede4] hover:bg-[#e5e1d5] border border-[#e5e1d5] text-[#7d796b] font-bold py-2.5 px-4 rounded-xl transition-all text-xs"
              >
                Go Back
              </button>
              <button
                id="submit-original-idea-btn"
                onClick={handleSendIdea}
                disabled={isLoadingCoach || !studentText.trim()}
                className="flex-1 bg-[#5a5a40] hover:bg-[#4a4a34] disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs flex items-center justify-center gap-1.5"
              >
                {isLoadingCoach ? (
                  <span>Calling Coach...</span>
                ) : (
                  <>
                    <span>Send to Coach!</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Stage 4: Interactive Coach Workstation */}
        {sessionStage === "coaching" && coachResponse && selectedStudent && (
          <motion.div
            id="coaching-conversation-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 max-w-xl mx-auto w-full py-1"
          >
            {/* Coach Character Avatar Panel */}
            <div id="coach-avatar-panel" className="bg-[#fcfaf7] p-4 rounded-3xl border border-[#e5e1d5] shadow-xs flex gap-4 items-center relative overflow-hidden">
              <div className="absolute right-2 top-2 bg-[#efede4] text-[#7d796b] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coach Voicey
              </div>

              {/* Character Visual container */}
              <div className="flex flex-col items-center">
                <motion.div
                  id="coach-character-graphic"
                  className="w-16 h-16 bg-gradient-to-tr from-[#9d7d2d] to-[#fff9ed] rounded-full flex items-center justify-center text-4xl shadow-xs border border-[#e5e1d5]"
                  animate={
                    isSpeaking
                      ? { y: [0, -6, 0], scale: [1, 1.05, 1] }
                      : { y: [0, -1, 0] }
                  }
                  transition={{
                    duration: isSpeaking ? 0.4 : 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🦁
                </motion.div>
                <div className={`mt-1.5 h-1.5 w-12 rounded-full bg-[#efede4] overflow-hidden ${isSpeaking ? "bg-[#fff9ed]" : ""}`}>
                  {isSpeaking && (
                    <motion.div
                      className="h-full bg-[#5a5a40] w-full"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
              </div>

              {/* Chat bubble */}
              <div className="flex-1 bg-[#fff9ed] p-3 rounded-2xl border border-[#f5e1bc]">
                <p className="text-xs md:text-sm font-semibold text-[#2d2d2d] leading-relaxed">
                  {coachResponse.coachReply}
                </p>
              </div>
            </div>

            {/* Surgical Edit Scaffolding Focus Frame */}
            <div id="surgical-edit-challenge-frame" className="bg-[#5a5a40] text-white p-5 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#fff9ed]/25 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">
                    {coachResponse.scaffoldType === "the_stop_sign" && "🛑"}
                    {coachResponse.scaffoldType === "the_name_game" && "📛"}
                    {coachResponse.scaffoldType === "word_upgrade" && "🍒"}
                    {coachResponse.scaffoldType === "evidence_check" && "💡"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fff9ed]">
                    {coachResponse.suggestedFocus}: {coachResponse.scaffoldType.replace(/_/g, " ")}
                  </span>
                </div>
                
                {/* Confidence Booster trigger */}
                {!frustrationMode && (
                  <button
                    id="frustration-booster-btn"
                    onClick={handleConfidenceBooster}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#fff9ed] hover:text-white rounded-lg text-[11px] font-bold transition-all border border-white/10"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>I'm Stuck!</span>
                  </button>
                )}
              </div>

              {/* Focus sentence rendering with custom highlighting */}
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 text-center min-h-[50px] flex items-center justify-center">
                <blockquote className="text-sm md:text-base font-serif italic tracking-wide text-white leading-relaxed">
                  {textToHighlightAndBake(editHistory[editHistory.length - 1] || studentText, coachResponse.highlightedSegment)}
                </blockquote>
              </div>

              {/* Option Choice buttons / Scaffolding Help */}
              {coachResponse.hints && coachResponse.hints.length > 0 && (
                <div id="scaffolding-hints-palette" className="space-y-2">
                  <p className="text-[11px] text-[#fff9ed]/85 font-bold uppercase tracking-wider text-center">
                    {coachResponse.scaffoldType === "word_upgrade" ? "👉 Tap a Juicy Word to upgrade!:" : "👉 Quick Hints to Help:"}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {coachResponse.hints.map((hintText, index) => {
                      // Attempt to apply the hint choice automatically
                      const handleApplyHint = () => {
                        let finalSentence = editHistory[editHistory.length - 1];
                        
                        if (coachResponse.scaffoldType === "word_upgrade" && coachResponse.highlightedSegment) {
                          // Replace the flat word with the juicy word
                          const regex = new RegExp(`\\b${coachResponse.highlightedSegment}\\b`, "i");
                          finalSentence = finalSentence.replace(regex, hintText);
                        } else if (coachResponse.scaffoldType === "the_name_game" && coachResponse.highlightedSegment) {
                          // Capitalize proper nouns
                          const regex = new RegExp(`\\b${coachResponse.highlightedSegment}\\b`, "i");
                          finalSentence = finalSentence.replace(regex, hintText);
                        } else if (coachResponse.scaffoldType === "the_stop_sign") {
                          // Add periods/punctuation from the suggestion
                          finalSentence = hintText;
                        } else {
                          // Standard suggestion fallback
                          finalSentence = hintText;
                        }

                        setCurrentEditAttempt(finalSentence);
                        handleSendEdit(finalSentence);
                      };

                      return (
                        <button
                          key={index}
                          id={`hint-option-btn-${index}`}
                          onClick={handleApplyHint}
                          className="bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/20 hover:border-white/40 text-[#fff9ed] font-bold py-2 px-3 rounded-xl text-xs transition-all text-center"
                        >
                          {hintText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confidence Booster Banner */}
              {frustrationMode && (
                <div id="confidence-booster-panel" className="bg-[#fff9ed] text-[#9d7d2d] p-3 rounded-xl border border-[#f5e1bc] space-y-1">
                  <h5 className="font-serif italic font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Confidence Booster Activated!
                  </h5>
                  <p className="text-[11px] font-semibold leading-relaxed text-[#7d796b]">
                    Don't worry, even master writers get stuck sometimes! You can choose one of the options above, or write your answer directly! Let's conquer this together!
                  </p>
                </div>
              )}
            </div>

            {/* Custom Student Corrected Draft Input Bar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#7d796b]">✏️ Write or Speak Your Corrected Version:</label>
              
              <div className="flex gap-2 items-center">
                <button
                  id="coaching-mic-record"
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl shadow-xs transition-transform active:scale-95 ${
                    isRecording ? "bg-[#e65a5a] text-white animate-pulse" : "bg-white border border-[#e5e1d5] text-[#5a5a40] hover:bg-[#efede4]"
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                
                <input
                  type="text"
                  id="student-edit-input"
                  value={currentEditAttempt}
                  onChange={(e) => setCurrentEditAttempt(e.target.value)}
                  placeholder="Type your improved idea here..."
                  className="flex-1 bg-[#fcfaf7] border border-[#e5e1d5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#5a5a40] font-medium text-[#2d2d2d]"
                />

                <button
                  id="submit-edit-correction-btn"
                  onClick={() => handleSendEdit()}
                  disabled={isLoadingCoach || !currentEditAttempt.trim()}
                  className="bg-[#5a5a40] hover:bg-[#4a4a34] disabled:opacity-50 text-white p-3 rounded-xl shadow-xs transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {isRecording && (
                <p className="text-[10px] text-[#e65a5a] font-bold uppercase animate-pulse">Listening... speak your correction now!</p>
              )}
            </div>

            {/* Cancel / Restart Options */}
            <div className="pt-2 flex justify-between items-center text-xs text-[#5a5a40] font-bold">
              <button
                id="coach-restart-btn"
                onClick={resetSession}
                className="hover:text-[#4a4a34] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over
              </button>

              <button
                id="coach-change-focus-btn"
                onClick={() => setSessionStage("choose_focus")}
                className="hover:text-[#4a4a34]"
              >
                Change Skill Focus
              </button>
            </div>
          </motion.div>
        )}

        {/* Stage 5: Session Completed (Celebration Frame!) */}
        {sessionStage === "completed" && selectedStudent && coachResponse && (
          <motion.div
            id="completed-success-screen"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto text-center py-4 space-y-5"
          >
            {/* Giant Success Icon */}
            <div className="flex justify-center">
              <motion.div
                id="trophy-badge"
                className="w-24 h-24 bg-gradient-to-tr from-[#9d7d2d] via-[#f5e1bc] to-[#5a5a40] rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white"
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeatDelay: 1, repeat: Infinity }}
              >
                🏆
              </motion.div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#2d2d2d]">Sensational Job, Writing Champ! 🎉</h2>
              <p className="text-sm text-[#7d796b] font-semibold">You polished your idea into a masterwork!</p>
            </div>

            {/* Side by side transformation summary */}
            <div className="bg-[#fcfaf7] rounded-3xl p-5 border border-[#e5e1d5] shadow-xs text-left space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#7d796b] uppercase tracking-wider block">📝 Your First Spoken Idea:</span>
                <p className="text-xs text-[#7d796b] italic mt-0.5 font-medium">"{studentText}"</p>
              </div>
              <div className="border-t border-[#e5e1d5] pt-3">
                <span className="text-[10px] font-bold text-[#5a5a40] uppercase tracking-wider block">✨ Your Polished Masterpiece:</span>
                <p className="text-xs md:text-sm text-[#2d2d2d] font-serif font-bold italic mt-0.5 leading-relaxed">
                  "{editHistory[editHistory.length - 1]}"
                </p>
              </div>
            </div>

            {/* Badge Earned Card */}
            {earnedBadge && (
              <motion.div
                id="earned-badge-celebration"
                className="bg-[#fcfaf7] text-[#2d2d2d] border border-[#e5e1d5] rounded-3xl p-4 flex items-center gap-3 shadow-xs text-left"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-3xl bg-white p-2.5 rounded-xl shadow-xs border border-[#e5e1d5]">🏅</div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#9d7d2d] block">New Badge Unlocked:</span>
                  <h4 className="font-serif italic font-bold text-sm text-[#5a5a40]">{earnedBadge}</h4>
                  <p className="text-[10px] text-[#7d796b] font-medium">You practiced your {focusType} skills perfectly!</p>
                </div>
              </motion.div>
            )}

            {/* Action choice buttons */}
            <div className="flex gap-3 pt-2">
              <button
                id="session-change-student-btn"
                onClick={() => setSessionStage("choose_student")}
                className="flex-1 bg-[#efede4] hover:bg-[#e5e1d5] text-[#7d796b] font-bold py-2.5 rounded-xl transition-all text-xs border border-[#e5e1d5]"
              >
                Switch Student
              </button>
              <button
                id="session-next-quest-btn"
                onClick={resetSession}
                className="flex-1 bg-[#5a5a40] hover:bg-[#4a4a34] text-white font-bold py-2.5 rounded-xl shadow-xs transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <span>Play Next Quest!</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
