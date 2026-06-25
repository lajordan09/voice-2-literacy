export interface Student {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  completedSessions: number;
  averageEngagement: number;
  masteredSkills: string[];
  workingSkills: string[];
  recentBadge: string;
}

export interface SessionLog {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  raw_input: string;
  edited_version: string;
  skill_mastery_focus: string;
  sub_skill: string;
  engagement_score: number;
  coach_notes: string;
  status: string;
}

export type FocusType = "Punctuation" | "Capitalization" | "Vocabulary Upgrading" | "Elaboration";

export interface CoachResponse {
  coachReply: string;
  suggestedFocus: FocusType;
  highlightedSegment: string;
  scaffoldType: "the_stop_sign" | "the_name_game" | "word_upgrade" | "evidence_check";
  hints: string[];
  detectedFrustration: boolean;
  isActivityCompleted: boolean;
  teacherLogAssessment: {
    skill_mastery_focus: FocusType;
    sub_skill: string;
    engagement_score: number;
    coach_notes: string;
  };
}
