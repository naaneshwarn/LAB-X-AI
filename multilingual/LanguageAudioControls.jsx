import React, { useRef, useState } from "react";
import { Volume2, VolumeX, Globe } from "lucide-react";

export default function LanguageAudioControls({
  selectedLanguage,
  onLanguageChange,
  explanationText,
  audioUrl
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayToggle = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-3">
      {/* Top Bar: Language Dropdown + Audio Narration Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <label htmlFor="lang-select" className="text-sm font-medium text-slate-300">
            Language / ಭಾಷೆ:
          </label>
          <select
            id="lang-select"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="en">English (EN)</option>
            <option value="kn">ಕನ್ನಡ (Kannada - KN)</option>
          </select>
        </div>

        {audioUrl ? (
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isPlaying
              ? selectedLanguage === "kn" ? "ನಿಲ್ಲಿಸಿ (Stop)" : "Stop Audio"
              : selectedLanguage === "kn" ? "ಕೇಳಿ (Listen)" : "Play Narration"}
          </button>
        ) : (
          <span className="text-xs text-slate-400 italic">
            {selectedLanguage === "kn" ? "ಪಠ್ಯ ಮಾತ್ರ ಲಭ್ಯವಿದೆ (Text-only mode)" : "Audio unavailable (Text-only mode)"}
          </span>
        )}
      </div>

      {/* Explanation Display Box */}
      <p className="text-sm leading-relaxed text-slate-200 bg-slate-800/70 p-3 rounded-lg">
        {explanationText}
      </p>

      {/* Hidden HTML5 Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}