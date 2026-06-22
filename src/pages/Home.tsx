import { useRef, Suspense, Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, Award, Zap, Globe, Cpu, Layers, MousePointer2 } from "lucide-react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "motion/react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Image, Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/src/lib/utils";
import { CATEGORIES, KEY_DATES, JURY } from "@/src/constants";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import heroBg from "@/src/assets/hero-bg.png";

const AI_TOOLS = [
  { name: "Stable Diffusion", category: "Image Generation" },
  { name: "Runway", category: "Video" },
  { name: "Pika", category: "Video" },
  { name: "ComfyUI", category: "Workflow" },
  { name: "ControlNet", category: "Control" },
  { name: "ChatGPT", category: "Text" },
  { name: "Claude", category: "Text" },
  { name: "Rhino + Grasshopper", category: "CAD" },
  { name: "Blender", category: "3D" },
  { name: "nano banana", category: "Multimodal" },
  { name: "OpenClaw", category: "Workflow" },
  { name: "Midjourney", category: "Image" },
  { name: "DALL-E 3", category: "Image" },
  { name: "Leonardo.ai", category: "Image" },
  { name: "Veras", category: "Architecture" },
  { name: "LookX", category: "Architecture" },
  { name: "Adobe Firefly", category: "Design" },
  { name: "Magnific AI", category: "Upscaling" },
];

// Static Hero Image Path
const HERO_IMAGE_URL = heroBg;

// Simple Error Boundary for Canvas
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Canvas Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-white text-black font-mono text-xs">
          [ MODEL_LOAD_ERROR ]
        </div>
      );
    }
    return this.props.children;
  }
}

// 3D Kinetic Model Component with Reveal Shader
function KineticModel({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { mouse, viewport } = useThree();
  const texture = useLoader(THREE.TextureLoader, url);
  
  const targetRotation = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));

  const shaderArgs = useRef({
    uniforms: {
      uTexture: { value: texture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform float uTime;
      varying vec2 vUv;

      // Simple noise for frosted glass effect
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        float dist = distance(uv, uMouse);
        
        // Reveal radius
        float radius = 0.15;
        float edge = 0.1;
        float mask = smoothstep(radius, radius + edge, dist);
        
        // Glassy effect: blur + noise
        vec4 color = texture2D(uTexture, uv);
        
        // Simple "blur" by sampling nearby
        vec4 blurred = vec4(0.0);
        float samples = 8.0;
        for(float i=0.0; i<8.0; i++) {
          float angle = i * 6.28318 / 8.0;
          blurred += texture2D(uTexture, uv + vec2(cos(angle), sin(angle)) * 0.01);
        }
        blurred /= 8.0;
        
        // Add some "frosted" noise
        blurred.rgb += noise(uv * 100.0 + uTime) * 0.05;
        
        // Mix clear and blurred based on mouse distance
        vec4 finalColor = mix(color, blurred, mask);
        
        // Initial state is blurred (uHover handles the transition if needed, but here we use dist)
        gl_FragColor = finalColor;
      }
    `
  });
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Mouse rotation logic
    targetRotation.current.y = -mouse.x * 0.26;
    targetRotation.current.x = mouse.y * 0.26;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current.x, 0.03);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current.y, 0.03);

    // Scaling
    const baseScale = Math.max(viewport.width, viewport.height) * 0.5;
    const targetScale = hovered ? baseScale * 1.1 : baseScale;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
    meshRef.current.scale.set(scaleRef.current, scaleRef.current, 1);

    // Update shader uniforms
    // Convert mouse (-1 to 1) to UV (0 to 1)
    mousePos.current.x = THREE.MathUtils.lerp(mousePos.current.x, (mouse.x + 1) / 2, 0.1);
    mousePos.current.y = THREE.MathUtils.lerp(mousePos.current.y, (mouse.y + 1) / 2, 0.1);
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uMouse.value.copy(mousePos.current);
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uHover.value = THREE.MathUtils.lerp(material.uniforms.uHover.value, hovered ? 1 : 0, 0.1);
  });

  return (
    <mesh 
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial 
        args={[shaderArgs.current]} 
        transparent 
        depthWrite={false}
      />
    </mesh>
  );
}

// Custom Crosshair Cursor
function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    // Use a local variable to ensure the target exists and has addEventListener
    const target = window;
    if (target && target.addEventListener) {
      target.addEventListener("mousemove", handleMouseMove);
      return () => target.removeEventListener("mousemove", handleMouseMove);
    }
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
      style={{ x: mouseX, y: mouseY }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-white" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-white" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white" />
        <div className="w-1 h-1 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const submitPath = user ? "/submit" : "/login?redirect=/submit";

  usePageMeta({
    title: "AI Architecture Awards 2026 — Global Recognition for AI-Driven Design",
    description: "Submit your AI-driven architecture, landscape, urban, interior, visualization, and animation work to the 2026 AI Architecture Awards. Open for entries until August 9, 2026.",
    canonicalPath: "/",
  });

  return (
    <div className="flex flex-col bg-white selection:bg-black selection:text-white font-sans text-black scroll-smooth relative md:cursor-none">
      <div className="hidden md:block">
        <CustomCursor />
      </div>
      <div className="grainy-overlay" />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden hairline-grid"
      >
        {/* Top Left Title */}
        <div className="absolute top-6 left-6 md:top-12 md:left-12 z-30 max-w-[90vw] md:max-w-4xl pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="monospace-label mb-4"
            >
              SYSTEM.INIT / 2026
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-5xl sm:text-7xl md:text-[10rem] font-bold uppercase tracking-tighter leading-[0.85] text-black"
            >
              AI <br />
              ARCHITECTURE. <br />
              <span className="text-black/20">AWARDS</span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-6 md:mt-8 flex items-center space-x-4 md:space-x-6"
            >
              <div className="h-[1px] w-16 md:w-24 bg-black/20" />
              <span className="monospace-label">NEURAL_SYNTHESIS // 01</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Central Kinetic Model Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-screen flex items-center justify-center z-10"
        >
          <div className="w-full h-full">
            <CanvasErrorBoundary>
              <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
                <color attach="background" args={["#ffffff"]} />
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
                <Suspense fallback={null}>
                  <KineticModel url={HERO_IMAGE_URL} />
                </Suspense>
              </Canvas>
            </CanvasErrorBoundary>
          </div>
        </motion.div>

        {/* Bottom UI — right on desktop, centered/full-width on mobile */}
        <div className="absolute bottom-6 right-6 left-6 md:bottom-12 md:right-12 md:left-auto z-30 flex flex-col items-stretch md:items-end space-y-6 md:space-y-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1.2 }}
            className="flex flex-col items-stretch md:items-end space-y-6 md:space-y-8"
          >
            <div className="hidden md:block text-right max-w-xs">
              <div className="monospace-label mb-2">STATUS.ACTIVE</div>
              <p className="text-[10px] uppercase tracking-widest text-black/60 leading-relaxed">
                The global platform for recognizing excellence in design facilitated by machine intelligence.
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-end">
              <Link
                to={submitPath}
                className="btn-primary w-full md:w-auto text-center"
              >
                Initialize Entry
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flowing Sections */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
      >

      {/* Manifesto Section */}
      <section className="py-24 md:py-48 border-y border-black/10 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <div className="col-span-12 lg:col-span-7">
              <div className="monospace-label mb-6 md:mb-12">01 // MANIFESTO</div>
              <h2 className="text-5xl sm:text-7xl md:text-9xl font-bold uppercase tracking-tighter leading-[0.85] md:leading-[0.8] mb-8 md:mb-12">
                THE FUTURE <br />
                IS <span className="font-sans normal-case tracking-normal">Generative</span>
              </h2>
              <div className="grid grid-cols-2 gap-6 md:gap-12 mt-12 md:mt-24">
                <div className="border-l border-black/20 pl-4 md:pl-8 py-2 md:py-4">
                  <span className="block text-4xl md:text-6xl font-bold tracking-tighter">50+</span>
                  <span className="monospace-label">NATIONS.CONNECTED</span>
                </div>
                <div className="border-l border-black/20 pl-4 md:pl-8 py-2 md:py-4">
                  <span className="block text-4xl md:text-6xl font-bold tracking-tighter">1.2K</span>
                  <span className="monospace-label">ENTRIES.PROCESSED</span>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-end">
              <div className="p-6 md:p-12 bg-black/5 backdrop-blur-md border border-black/10 rounded-sm">
                <p className="text-base md:text-xl text-black/80 leading-relaxed mb-6 md:mb-8">
                  The AI Architecture Awards (AIAA) is a digital laboratory dedicated to recognizing excellence in design facilitated by artificial intelligence.
                </p>
                <p className="text-sm text-black/40 leading-relaxed mb-8 md:mb-12">
                  From generative design to advanced visualization, we celebrate the synergy between human creativity and machine intelligence.
                </p>
                <Link to={submitPath} className="flex items-center space-x-4 group text-black">
                  <span className="monospace-label group-hover:text-black/60 transition-colors">ACCESS_MISSION_PROTOCOL</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Scattered on desktop, grid on mobile */}
      <section className="py-24 md:py-48 border-b border-black/10 bg-white relative overflow-hidden lg:min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-12 md:mb-32">
            <div className="flex items-baseline gap-4 md:gap-6 mb-4 flex-wrap">
              <span className="text-6xl md:text-9xl font-bold tracking-tighter leading-none">02</span>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none">CATEGORIES</h2>
            </div>
            <div className="monospace-label text-black/40">( HAVE FUN EXPLORING )</div>
          </div>

          {/* Mobile: simple 2-column grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:hidden">
            {CATEGORIES.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Link
                  to={`${submitPath}${submitPath.includes('?') ? '&' : '?'}category=${category.id}`}
                  className="group relative block"
                >
                  <div className="monospace-label mb-2 font-bold">0{idx + 1}.</div>
                  <div className="aspect-square bg-black/5 backdrop-blur-sm border border-black/10 flex items-center justify-center p-4 transition-all group-hover:bg-black group-hover:text-white overflow-hidden relative">
                    <div className="text-center relative z-10">
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight leading-tight">{category.title}</h3>
                    </div>
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-bold">
                        {idx + 1}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop: scattered absolute layout */}
          <div className="hidden lg:block relative h-[120vh] w-full">
            {CATEGORIES.map((category, idx) => {
              const positions = [
                { top: '5%', left: '10%', delay: 0.1 },
                { top: '15%', left: '45%', delay: 0.2 },
                { top: '5%', left: '75%', delay: 0.3 },
                { top: '35%', left: '5%', delay: 0.4 },
                { top: '45%', left: '35%', delay: 0.5 },
                { top: '45%', left: '65%', delay: 0.6 },
                { top: '75%', left: '15%', delay: 0.7 },
                { top: '85%', left: '45%', delay: 0.8 },
                { top: '75%', left: '80%', delay: 0.9 },
              ];
              const pos = positions[idx % positions.length];
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: pos.delay }}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute z-20"
                >
                  <Link
                    to={`${submitPath}${submitPath.includes('?') ? '&' : '?'}category=${category.id}`}
                    className="group relative block"
                  >
                    <motion.div
                      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
                      className="relative"
                    >
                      <div className="monospace-label mb-2 flex items-center space-x-2">
                        <span className="font-bold">0{idx + 1}.</span>
                      </div>
                      <div className="h-48 w-48 md:h-64 md:w-64 bg-black/5 backdrop-blur-sm border border-black/10 flex items-center justify-center p-8 transition-all group-hover:bg-black group-hover:text-white overflow-hidden">
                        <div className="text-center">
                          <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-4">{category.title}</h3>
                          <div className="h-[1px] w-8 bg-black/20 mx-auto group-hover:bg-white/40 transition-colors" />
                        </div>
                        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-bold">
                            {idx + 1}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="absolute inset-0 hairline-grid opacity-30 pointer-events-none" />
      </section>

      {/* Timeline */}
      <section className="py-24 md:py-48 border-b border-black/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <div className="col-span-12 lg:col-span-4">
              <div className="monospace-label mb-4 md:mb-8">03 // TIMELINE</div>
              <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-4 md:mb-8">SCHEDULE</h2>
              <p className="monospace-label text-black/40 leading-relaxed">
                MARK YOUR CALENDARS FOR THE 2026 CYCLE.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="divide-y divide-black/10">
                {KEY_DATES.map((date, idx) => (
                  <div key={idx} className="py-6 md:py-12 group cursor-default">
                    <div className="flex items-start gap-4 md:gap-12">
                      <span className="monospace-label text-black/20 group-hover:text-black transition-colors flex-shrink-0">0{idx + 1}</span>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <h3 className="text-xl md:text-3xl font-bold uppercase tracking-tight group-hover:translate-x-2 md:group-hover:translate-x-4 transition-transform order-2 sm:order-1 leading-tight">{date.label}</h3>
                        <span className="text-sm md:text-xl font-mono order-1 sm:order-2 text-black/40 group-hover:text-black transition-colors flex-shrink-0">{date.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jury */}
      <section className="py-24 md:py-48 border-b border-black/10 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 md:mb-32 text-center">
            <div className="monospace-label mb-4 md:mb-8">04 // THE PANEL</div>
            <h2 className="text-5xl sm:text-7xl md:text-9xl font-bold uppercase tracking-tighter">JURY</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10 border border-black/10">
            {JURY.map((member: any, idx) => (
              <div key={idx} className="group bg-white p-6 md:p-10 relative overflow-hidden flex flex-col">
                <div className="aspect-[4/5] overflow-hidden transition-all duration-700 bg-black/5 border border-black/5">
                  {member.placeholder ? (
                    <div className="h-full w-full flex items-center justify-center text-black/10 font-bold text-4xl uppercase tracking-tighter">
                      JURY_{idx + 1}
                    </div>
                  ) : (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  )}
                </div>
                <div className="mt-6 md:mt-10 flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight">
                    {member.placeholder ? "Call for Jury" : member.name}
                  </h3>
                  <div className="mt-2 md:mt-3 monospace-label text-black/40 leading-relaxed">
                    {member.role}
                  </div>
                  {member.bio && (
                    <p className="mt-6 text-xs text-black/60 leading-relaxed">{member.bio}</p>
                  )}
                  {(member.instagram || member.linkedin) && (
                    <div className="mt-6 flex flex-col gap-2">
                      {member.instagram && (
                        <a
                          href={`https://instagram.com/${member.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="monospace-label text-black/60 hover:text-black transition-colors"
                        >
                          IG · @{member.instagram}
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={`https://www.linkedin.com/in/${member.linkedin}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="monospace-label text-black/60 hover:text-black transition-colors"
                        >
                          LinkedIn · {member.linkedin}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools */}
      <section className="py-24 md:py-48 border-b border-black/10 overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-12 md:mb-32">
          <div className="monospace-label mb-4 md:mb-8">INTEGRATIONS</div>
          <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter">WORKS WITH <br /> <span className="text-black/40">YOUR WORKFLOW</span></h2>
        </div>

        <div className="relative space-y-8">
          {/* Row 1: Left Scroll */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: [0, -1920] }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="flex whitespace-nowrap"
            >
              {[...AI_TOOLS, ...AI_TOOLS, ...AI_TOOLS].map((tool, idx) => (
                <div key={idx} className="mx-4 flex h-20 w-64 flex-col items-center justify-center border border-black/10 bg-black/5 backdrop-blur-md p-6 transition-all hover:bg-black hover:border-black group">
                  <span className="text-lg font-bold uppercase tracking-tight group-hover:scale-105 group-hover:text-white transition-all">{tool.name}</span>
                  <span className="mt-1 text-[8px] monospace-label group-hover:text-white/60 transition-all">{tool.category}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 2: Right Scroll */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: [-1920, 0] }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="flex whitespace-nowrap"
            >
              {[...AI_TOOLS, ...AI_TOOLS, ...AI_TOOLS].reverse().map((tool, idx) => (
                <div key={idx} className="mx-4 flex h-20 w-64 flex-col items-center justify-center border border-black/10 bg-black/5 backdrop-blur-md p-6 transition-all hover:bg-black hover:border-black group">
                  <span className="text-lg font-bold uppercase tracking-tight group-hover:scale-105 group-hover:text-white transition-all">{tool.name}</span>
                  <span className="mt-1 text-[8px] monospace-label group-hover:text-white/60 transition-all">{tool.category}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 md:py-64 bg-white text-black relative overflow-hidden hairline-grid">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] md:text-[40rem] font-bold uppercase tracking-tighter leading-none select-none">
            AIAA
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 relative z-10 text-center">
          <div className="monospace-label mb-6 md:mb-12">FINAL.CALL</div>
          <h2 className="text-6xl sm:text-8xl md:text-[12rem] font-bold uppercase tracking-[-0.04em] leading-[0.85]">
            SHAPE THE <br />
            <span className="text-transparent border-text-black" style={{ WebkitTextStroke: '1px black' }}>FUTURE</span>
          </h2>
          <p className="mx-auto mt-8 md:mt-16 max-w-2xl text-base md:text-xl text-black/40 leading-relaxed">
            THE 2026 CALL FOR ENTRIES IS NOW LIVE.
          </p>
          <div className="mt-12 md:mt-24 flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12">
            <Link
              to="/submit"
              className="w-full sm:w-auto btn-primary"
            >
              Initialize Entry
            </Link>
          </div>
        </div>
      </section>
    </motion.div>

    {/* Footer Navigation - Fixed Bottom (desktop only — overlaps content on mobile) */}
    <footer className="hidden md:flex fixed bottom-0 left-0 w-full z-50 px-12 py-6 justify-between items-center pointer-events-none">
      <div className="monospace-label pointer-events-auto">
        01. META INTERACTION SDK - SOFTWARE FOR XR DEVS
      </div>
      <div className="monospace-label pointer-events-auto">
        LOCAL TIME: ZUR 01:45 PM
      </div>
    </footer>
  </div>
);
}
