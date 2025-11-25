import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ArrowLeft, ArrowRight, Menu } from 'lucide-react';
import * as THREE from 'three';
import { PROJECTS } from './data';
import { Project } from './types';
import ParticleImage from './components/ParticleImage';
import ProjectModal from './components/ProjectModal';
import AudioPlayer from './components/AudioPlayer';

// A component to handle the smooth sliding logic of the carousel
const CarouselScene: React.FC<{ 
  activeIndex: number; 
  onProjectSelect: (project: Project) => void; 
}> = ({ activeIndex, onProjectSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const smoothedIndex = useRef(activeIndex);

  useFrame((state, delta) => {
    smoothedIndex.current = THREE.MathUtils.damp(
      smoothedIndex.current,
      activeIndex,
      2.5,
      delta
    );
  });

  return (
    <group ref={groupRef}>
      {PROJECTS.map((project, i) => (
        <ProjectCard 
          key={project.id}
          index={i}
          project={project}
          smoothedIndex={smoothedIndex}
          isActive={i === activeIndex}
          onClick={() => onProjectSelect(project)}
        />
      ))}
    </group>
  );
};

// Individual Project Card in 3D Space
const ProjectCard: React.FC<{
  index: number;
  project: Project;
  smoothedIndex: React.MutableRefObject<number>;
  isActive: boolean;
  onClick: () => void;
}> = ({ index, project, smoothedIndex, isActive, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate relative position
    const offset = index - smoothedIndex.current;
    
    // Config for the layout
    const spacing = 7.5; // Increased spacing for volumetric expansion
    
    const x = offset * spacing;
    const z = -Math.abs(offset) * 3.0; // Deeper curve
    const yRotation = -offset * 0.15; // Stronger rotation

    meshRef.current.position.x = x;
    meshRef.current.position.z = z;
    meshRef.current.rotation.y = yRotation;

    // Scale down for inactive items
    const scale = 1 - Math.min(Math.abs(offset) * 0.15, 0.3);
    meshRef.current.scale.setScalar(scale);
  });

  const opacity = isActive ? 1.0 : 0.15;

  return (
    <group ref={meshRef} onClick={onClick}>
      <ParticleImage 
        url={project.coverImage} 
        isActive={isActive} 
        opacity={opacity}
      />
      
      {/* 3D Floating Typography */}
      <group position={[0, -2.8, 0.5]}>
        <Text
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          fontSize={0.25}
          letterSpacing={0.1}
          color="white"
          anchorX="center"
          anchorY="top"
          fillOpacity={isActive ? 0.95 : 0.3}
        >
          {project.title.toUpperCase()}
        </Text>
        <Text
          position={[0, -0.4, 0]}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          fontSize={0.12}
          letterSpacing={0.05}
          color="#9ca3af" // Gray-400 equivalent
          anchorX="center"
          anchorY="top"
          fillOpacity={isActive ? 0.8 : 0.2}
        >
          {project.subtitle.toUpperCase()}
        </Text>
        
        {isActive && (
           <Text
            position={[0, -0.8, 0]}
            fontSize={0.08}
            color="#3b82f6"
            anchorX="center"
            anchorY="top"
          >
            [ VIEW PROJECT ]
          </Text>
        )}
      </group>
    </group>
  );
};


const App: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const nextProject = () => {
    setActiveIndex((prev) => (prev + 1) % PROJECTS.length);
  };

  const prevProject = () => {
    setActiveIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
  };

  return (
    <div className="relative w-full h-screen bg-[#000000] text-white selection:bg-blue-500 selection:text-white overflow-hidden">
      
      {/* Deep Void Background */}
      <div className="absolute inset-0 bg-[#000000] -z-10"></div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-8 z-30 flex justify-between items-center pointer-events-none">
        <h1 className="text-xl font-bold tracking-[0.3em] font-['Orbitron'] text-white/80 pointer-events-auto cursor-pointer">
          ZHANLIN
        </h1>
        <button className="p-2 text-white/50 hover:text-white pointer-events-auto transition-colors">
          <Menu size={20} />
        </button>
      </header>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-blue-500/50 font-mono text-xs">LOADING DATA...</div>}>
          <Canvas 
            camera={{ position: [0, 0, 10], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            {/* Dark Fog for Depth blending */}
            <fog attach="fog" args={['#000000', 8, 28]} />
            <ambientLight intensity={0.1} />
            
            <CarouselScene 
              activeIndex={activeIndex} 
              onProjectSelect={(p) => setSelectedProject(p)} 
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Navigation Controls Only (No Big Text) */}
      <div className="absolute inset-y-0 w-full flex justify-between items-center px-4 md:px-12 pointer-events-none">
        <button 
          onClick={prevProject} 
          className="pointer-events-auto p-4 rounded-full hover:bg-white/5 text-white/20 hover:text-white/80 transition-all backdrop-blur-sm group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <button 
          onClick={nextProject} 
          className="pointer-events-auto p-4 rounded-full hover:bg-white/5 text-white/20 hover:text-white/80 transition-all backdrop-blur-sm group"
        >
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Footer / Status */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto z-20">
        <span className="text-[10px] font-mono text-gray-600">01</span>
        <div className="flex gap-1">
          {PROJECTS.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-0.5 rounded-full transition-all duration-500 ${idx === activeIndex ? 'w-8 bg-blue-500/80' : 'w-2 bg-gray-800 hover:bg-gray-600'}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-gray-600">0{PROJECTS.length}</span>
      </div>

      <AudioPlayer />

      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
};

export default App;