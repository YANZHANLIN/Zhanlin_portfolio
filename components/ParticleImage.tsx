import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useLoader, ThreeElements, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex Shader: Depth Map Generation & Volumetric Displacement
const vertexShader = `
uniform float uTime;
uniform float uHover;      // 1.0 when active project, 0.0 when background
uniform float uInteraction; // 1.0 when mouse hovering
uniform float uOpacity;
uniform sampler2D uTexture;

varying vec2 vUv;
varying float vVisibility; // Used to hide dark pixels (background)
varying float vElevation;  // Used to colorize based on depth

// Pseudo-random generator
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 3D Noise for organic turbulence
float noise(vec3 p) {
    return sin(p.x * 0.5) * sin(p.y * 0.5) * sin(p.z * 0.5);
}

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // -- 1. TEXTURE FETCH FOR DEPTH (The Core Mechanic) --
  vec4 imgColor = texture2D(uTexture, uv);
  
  // Calculate Luminance (Brightness)
  float luminance = dot(imgColor.rgb, vec3(0.299, 0.587, 0.114));
  vElevation = luminance;

  // -- 2. VOLUMETRIC EXTRUSION --
  float depthStrength = 4.0; 
  float activeFactor = 0.5 + (0.5 * uHover); 
  pos.z += luminance * depthStrength * activeFactor;

  // -- 3. ENHANCED BREATHING EFFECT --
  // Much stronger idle animation
  float breathTime = uTime * 1.2; // Faster breath
  float breathSine = sin(breathTime + pos.x * 0.8);
  
  // Z-axis heave (breathing chest)
  pos.z += breathSine * 0.25 * luminance; // Increased amplitude
  
  // Expansion/contraction
  pos.xy *= (1.0 + (sin(uTime * 0.8) * 0.04));

  // -- 4. STRONG MOUSE INTERACTION (Magnetic Fluid) --
  if (uInteraction > 0.0) {
      // Chaotic noise field
      float noiseVal = noise(vec3(pos.x * 3.0, pos.y * 3.0, uTime * 4.0));
      
      vec3 displace = vec3(
          cos(uTime * 6.0 + pos.z) * 0.4, // X wobble
          sin(uTime * 6.0 + pos.z) * 0.4, // Y wobble
          noiseVal * 0.8                  // Z scatter
      );
      
      // Apply displacement
      pos += displace * uInteraction * (0.5 + 0.5 * luminance);
  }

  // -- 5. EDGE DIFFUSION & BLUR --
  float distFromCenter = distance(uv, vec2(0.5));
  float scatter = smoothstep(0.35, 0.55, distFromCenter);
  vec3 randomDir = vec3(
      random(uv) - 0.5, 
      random(uv + vec2(1.0)) - 0.5, 
      (random(uv + vec2(2.0)) - 0.5) * 0.5
  );
  pos += randomDir * scatter * 2.5;

  // -- 6. VISIBILITY CULLING --
  float luminanceThreshold = 0.15;
  vVisibility = smoothstep(luminanceThreshold, luminanceThreshold + 0.1, luminance);
  vVisibility *= (1.0 - smoothstep(0.4, 0.5, distFromCenter));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // -- POINT SIZE CALCULATION --
  // Slightly increased base size to compensate for lower particle count
  float baseSize = 5.0; 
  // Pulse size with breath too
  float sizePulse = 1.0 + (sin(uTime * 2.0) * 0.1); 
  gl_PointSize = baseSize * sizePulse * (luminance + 0.2) * (15.0 / -mvPosition.z);
  gl_PointSize *= (1.0 + uInteraction * 0.5); // Grow significantly on hover

  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment Shader: Rendering the Void
const fragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;

varying vec2 vUv;
varying float vVisibility;
varying float vElevation;

void main() {
  if (vVisibility < 0.01) discard;

  vec2 coord = gl_PointCoord - vec2(0.5);
  float len = length(coord);
  if (len > 0.5) discard; 

  vec4 texColor = texture2D(uTexture, vUv);
  
  vec3 deepColor = vec3(0.02, 0.05, 0.15); 
  vec3 highlightColor = texColor.rgb;
  
  vec3 finalColor = mix(deepColor, highlightColor, vElevation);
  finalColor += vec3(0.0, 0.1, 0.2) * vElevation;

  float alpha = 1.0 - smoothstep(0.3, 0.5, len);
  alpha *= uOpacity * vVisibility;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

type ParticleImageProps = ThreeElements['points'] & {
  url: string;
  isActive: boolean;
  opacity?: number;
}

const ParticleImage: React.FC<ParticleImageProps> = ({ url, isActive, opacity = 1.0, ...props }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useLoader(THREE.TextureLoader, url);
  const [hovered, setHovered] = useState(false);
  
  // Interaction State
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const previousPointer = useRef({ x: 0, y: 0 });
  const wasDragging = useRef(false); // Flag to prevent click after drag

  const geometry = useMemo(() => {
    // Optimization: Reduced density from 384 to 220
    // This reduces vertex count from ~147k to ~48k per card (3x performance boost)
    const segments = 220; 
    const geom = new THREE.PlaneGeometry(8, 5, segments, segments); 
    return geom;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      const targetHover = isActive ? 1.0 : 0.0; 
      materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uHover.value,
        targetHover,
        0.05
      );
      
      // Use internal hovered state for reaction
      const targetInteraction = (hovered && isActive) ? 1.0 : 0.0;
      materialRef.current.uniforms.uInteraction.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uInteraction.value,
        targetInteraction,
        0.1 // Faster reaction
      );

      materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uOpacity.value,
        opacity,
        0.05
      );
    }
  });

  // Handlers for Rotation Logic
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isActive) return;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    isDragging.current = true;
    wasDragging.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    previousPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    setHovered(true);

    if (isDragging.current && isActive && meshRef.current) {
      const dx = e.clientX - previousPointer.current.x;
      const dy = e.clientY - previousPointer.current.y;
      
      // Rotate the mesh locally
      meshRef.current.rotation.y += dx * 0.005;
      meshRef.current.rotation.x += dy * 0.005;
      
      previousPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isActive) return;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Calculate total drag distance
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If moved significantly, mark as "was dragging" to block click
    if (dist > 5) {
      wasDragging.current = true;
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // If we were dragging, we consume the click event so it doesn't bubble to parent
    if (wasDragging.current) {
      e.stopPropagation();
      wasDragging.current = false; // Reset
    }
  };

  return (
    <points 
      ref={meshRef} 
      geometry={geometry} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      {...props}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          uHover: { value: 0.0 },       
          uInteraction: { value: 0.0 }, 
          uTexture: { value: texture },
          uOpacity: { value: 0 }
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleImage;