import React, { useState, useRef, useEffect } from 'react';
import { Disc } from 'lucide-react';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Set gentle volume
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-30 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      <audio 
        ref={audioRef} 
        loop 
        // Royalty-free "City Night" / Synth Pop style track
        src="https://cdn.pixabay.com/audio/2023/10/24/audio_035c91845a.mp3" 
      />
      
      <button 
        onClick={togglePlay}
        className="group flex items-center gap-3 pr-5 pl-1.5 py-1.5 rounded-full glass-panel border border-blue-500/20 text-blue-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-900/30 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      >
        <div className={`relative w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 group-hover:border-blue-400/30 transition-all ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
          <Disc size={20} className={`transition-colors ${isPlaying ? 'text-blue-400' : 'text-gray-500'}`} />
          {isPlaying && (
            <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping opacity-20"></div>
          )}
        </div>
        
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-blue-300 transition-colors">
            {isPlaying ? 'Now Playing' : 'Paused'}
          </span>
          <span className="text-xs font-bold font-['Orbitron'] text-white tracking-wide group-hover:text-blue-100 transition-colors">
            NEO-TOKYO FM
          </span>
        </div>

        <div className="ml-3 flex gap-0.5 items-end h-4">
            {isPlaying ? (
              <>
               <span className="w-0.5 bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite] h-2"></span>
               <span className="w-0.5 bg-blue-400 animate-[pulse_1.1s_ease-in-out_infinite] h-4"></span>
               <span className="w-0.5 bg-blue-400 animate-[pulse_0.8s_ease-in-out_infinite] h-3"></span>
               <span className="w-0.5 bg-blue-400 animate-[pulse_1.2s_ease-in-out_infinite] h-2"></span>
              </>
            ) : (
              <div className="flex gap-0.5 h-full items-center">
                 <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
                 <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
                 <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
              </div>
            )}
        </div>
      </button>
    </div>
  );
};

export default AudioPlayer;