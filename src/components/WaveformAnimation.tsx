import { motion } from "motion/react";

interface WaveformAnimationProps {
  isRecording: boolean;
  isSpeaking: boolean;
  color?: string;
}

export default function WaveformAnimation({
  isRecording,
  isSpeaking,
  color = "bg-rose-500",
}: WaveformAnimationProps) {
  // If we are doing nothing, show a flat small line
  const barCount = 15;
  const bars = Array.from({ length: barCount });

  return (
    <div id="waveform-container" className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs mx-auto px-4">
      {bars.map((_, i) => {
        // Calculate a nice staggered wave delay and height
        const delay = i * 0.08;
        const middleDist = Math.abs(i - barCount / 2);
        const maxScale = Math.max(0.2, 1 - middleDist * 0.12);

        return (
          <motion.div
            key={i}
            id={`waveform-bar-${i}`}
            className={`w-1.5 rounded-full ${color}`}
            initial={{ height: "8px" }}
            animate={
              isRecording
                ? {
                    height: ["8px", `${maxScale * 48}px`, "8px"],
                  }
                : isSpeaking
                ? {
                    height: ["8px", `${maxScale * 36}px`, "8px"],
                  }
                : {
                    height: ["8px", "10px", "8px"],
                  }
            }
            transition={{
              duration: isRecording ? 1.0 : isSpeaking ? 1.4 : 2.5,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}
