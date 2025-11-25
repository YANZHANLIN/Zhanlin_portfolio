import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useLoader, ThreeElements } from '@react-three/fiber';
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
  // We read the texture here in the vertex shader (Vertex Texture Fetch)
  vec4 imgColor = texture2D(uTexture, uv);
  
  // Calculate Luminance (Brightness) of the pixel
  // This determines "how close" the particle is.
  float luminance = dot(imgColor.rgb, vec3(0.299, 0.587, 0.114));
  vElevation = luminance;

  // -- 2. VOLUMETRIC EXTRUSION --
  // Brighter pixels pop forward. Darker pixels stay back.
  // We multiply by uHover to flatten inactive cards slightly.
  float depthStrength = 3.5; 
  float activeFactor = 0.5 + (0.5 * uHover); 
  pos.z += luminance * depthStrength * activeFactor;

  // -- 3. ORGANIC IDLE BREATHING --
  // The whole cloud gently undulates
  float breath = sin(uTime * 0.8 + pos.x) * 0.1;
  pos.z += breath * luminance; // Only the structure breathes, not the void

  // -- 4. MOUSE INTERACTION (Magnetic Fluid) --
  // When hovered, add turbulent noise to simulate a digital fluid
  if (uInteraction > 0.0) {
      float noiseVal = noise(vec3(pos.x * 2.0, pos.y * 2.0, uTime * 2.0));
      vec3 displace = vec3(
          cos(uTime * 5.0 + pos.z) * 0.2,
          sin(uTime * 5.0 + pos.z) * 0.2,
          noiseVal * 0.5
      );
      pos += displace * uInteraction;
  }

  // -- 5. EDGE DIFFUSION & BLUR --
  // The user wants edges to be "blurred and diffuse".
  // We scatter particles based on their distance from the center UV.
  float distFromCenter = distance(uv, vec2(0.5));
  
  // Calculate a scatter factor that increases towards edges
  float scatter = smoothstep(0.35, 0.55, distFromCenter);
  
  // Random dispersion direction
  vec3 randomDir = vec3(
      random(uv) - 0.5, 
      random(uv + vec2(1.0)) - 0.5, 
      (random(uv + vec2(2.0)) - 0.5) * 0.5
  );
  
  // Apply scatter: Push edge particles outward into a mist
  pos += randomDir * scatter * 2.0;

  // -- 6. VISIBILITY CULLING (The "Shape" Effect) --
  // Calculate visibility.
  // 1. Luminance Threshold: Hide black background pixels (void sculpting)
  // 2. Edge Fade: Fade out the scattered particles at the very edge
  float luminanceThreshold = 0.15;
  vVisibility = smoothstep(luminanceThreshold, luminanceThreshold + 0.1, luminance);
  
  // Soften the outer scattered area
  vVisibility *= (1.0 - smoothstep(0.4, 0.5, distFromCenter));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // -- POINT SIZE CALCULATION --
  // Brighter (foreground) = Bigger
  // Closer to camera = Bigger
  float baseSize = 3.5;
  gl_PointSize = baseSize * (luminance + 0.2) * (15.0 / -mvPosition.z);
  gl_PointSize *= (1.0 + uInteraction * 0.3); // Grow on hover

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
  // -- 1. DISCARD DARK/VOID PIXELS --
  if (vVisibility < 0.01) discard;

  // -- 2. CIRCULAR SOFT PARTICLE --
  vec2 coord = gl_PointCoord - vec2(0.5);
  float len = length(coord);
  if (len > 0.5) discard; // Circular clip

  // -- 3. COLOR MAPPING --
  vec4 texColor = texture2D(uTexture, vUv);
  
  // "Holographic" Color Grading
  // Map low elevation (dark) to Deep Blue/Void color
  // Map high elevation (bright) to Original Color + Cyan tint
  vec3 deepColor = vec3(0.02, 0.05, 0.15); // Dark Blue
  vec3 highlightColor = texColor.rgb;
  
  // Mix based on the luminance/elevation calculated in vertex
  vec3 finalColor = mix(deepColor, highlightColor, vElevation);
  
  // Boost highlights slightly
  finalColor += vec3(0.0, 0.1, 0.2) * vElevation;

  // -- 4. ALPHA & GLOW --
  // Soft edge for individual particle
  float alpha = 1.0 - smoothstep(0.3, 0.5, len);
  
  // Combine with vertex visibility and global opacity
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

  // Increase segment count significantly for "dense point cloud" look
  const geometry = useMemo(() => {
    // 384x384 = ~147k particles. Good balance for performance/detail.
    const segments = 384; 
    const geom = new THREE.PlaneGeometry(8, 5, segments, segments); 
    return geom;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      // Time
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Carousel Active State Interp
      const targetHover = isActive ? 1.0 : 0.0; 
      materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uHover.value,
        targetHover,
        0.05
      );
      
      // Mouse Interaction Interp
      const targetInteraction = (hovered && isActive) ? 1.0 : 0.0;
      materialRef.current.uniforms.uInteraction.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uInteraction.value,
        targetInteraction,
        0.08
      );

      // Opacity Interp
      materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uOpacity.value,
        opacity,
        0.05
      );
    }
  });

  return (
    <points 
      ref={meshRef} 
      geometry={geometry} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
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