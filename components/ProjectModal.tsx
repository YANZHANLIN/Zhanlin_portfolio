import React, { useState } from 'react';
import { Project } from '../types';
import { X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import AIChat from './AIChat';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [feedback, setFeedback] = useState('');

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % project.galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + project.galleryImages.length) % project.galleryImages.length);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to backend
    alert("Feedback transmission simulated. Thank you.");
    setFeedback('');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl h-[90vh] glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(59,130,246,0.1)] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Left: Gallery (60%) */}
        <div className="w-full md:w-3/5 h-1/2 md:h-full relative bg-black group">
          <img 
            src={project.galleryImages[currentImageIndex]} 
            alt={project.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
          
          {/* Navigation Arrows */}
          <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {project.galleryImages.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-blue-500 w-6' : 'bg-gray-600'}`}
              />
            ))}
          </div>

          <button 
            onClick={onClose} 
            className="absolute top-6 left-6 md:hidden p-2 rounded-full bg-black/50 text-white z-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Right: Info (40%) */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full overflow-y-auto custom-scrollbar bg-gray-900/80 p-8 flex flex-col gap-6 border-l border-white/5 relative">
          
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 hidden md:block p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="mt-4">
            <h2 className="text-3xl font-bold font-['Orbitron'] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
              {project.title}
            </h2>
            <p className="text-lg text-blue-200/80 font-light tracking-wide">{project.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full border border-blue-500/30 text-xs text-blue-300 bg-blue-900/10">
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-invert text-gray-300 leading-relaxed text-sm">
            <p>{project.description}</p>
            <p className="mt-4 opacity-70">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          {/* Feedback Section */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <MessageSquare size={14} /> 
              Visitor Feedback
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Leave a comment..."
                className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-lg transition-colors tracking-wider"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* AI Chat Integration */}
      <AIChat projectTitle={project.title} aiContext={project.aiContext} />
    </div>
  );
};

export default ProjectModal;