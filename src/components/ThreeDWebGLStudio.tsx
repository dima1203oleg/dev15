import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  ShieldAlert, 
  ShieldCheck, 
  Crosshair, 
  Flame, 
  Compass, 
  Layers, 
  Zap, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  Radio, 
  Sliders, 
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Activity
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings } from '../types';
import { INITIAL_TRAJECTORIES } from '../data/spatialThreatData';

interface ThreeDWebGLStudioProps {
  regions: RegionData[];
  onSelectRegion: (region: RegionData) => void;
  myRegionId: string;
  onNavigateToShelters: () => void;
  onNavigateToSimulator: () => void;
}

// Helper to parse SVG path like "M 100,70 L 175,60 ... Z" into THREE.Shape
function parseSvgPathToShape(pathStr: string, scale = 1, offsetX = -500, offsetY = -325): THREE.Shape | null {
  try {
    const shape = new THREE.Shape();
    // Normalize string
    const tokens = pathStr.replace(/,/g, ' ').replace(/([MLZ])/gi, ' $1 ').trim().split(/\s+/);
    let i = 0;
    let started = false;

    while (i < tokens.length) {
      const cmd = tokens[i].toUpperCase();
      if (cmd === 'M') {
        const x = (parseFloat(tokens[i + 1]) + offsetX) * scale;
        const y = -(parseFloat(tokens[i + 2]) + offsetY) * scale; // Invert Y for 3D coordinate space
        shape.moveTo(x, y);
        started = true;
        i += 3;
      } else if (cmd === 'L') {
        const x = (parseFloat(tokens[i + 1]) + offsetX) * scale;
        const y = -(parseFloat(tokens[i + 2]) + offsetY) * scale;
        if (!started) {
          shape.moveTo(x, y);
          started = true;
        } else {
          shape.lineTo(x, y);
        }
        i += 3;
      } else if (cmd === 'Z') {
        shape.closePath();
        i += 1;
      } else {
        // Fallback next
        i += 1;
      }
    }
    return shape;
  } catch (err) {
    console.warn('Error parsing SVG path to shape', err);
    return null;
  }
}

// 3D SAM Interceptor state
interface ActiveInterceptor {
  id: string;
  targetId: string;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  progress: number;
  speed: number;
  isHit: boolean;
  mesh?: THREE.Group;
  trailMesh?: THREE.Points;
}

export const ThreeDWebGLStudio: React.FC<ThreeDWebGLStudioProps> = ({
  regions,
  onSelectRegion,
  myRegionId,
  onNavigateToShelters,
  onNavigateToSimulator,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Studio Controls State
  const [cameraPreset, setCameraPreset] = useState<'TACTICAL_45' | 'TOP_DOWN' | 'INTERCEPTOR' | 'GROUND_SAM' | 'SATELLITE'>('TACTICAL_45');
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [showRadarDomes, setShowRadarDomes] = useState(true);
  const [showBallisticArcs, setShowBallisticArcs] = useState(true);
  const [showDrones, setShowDrones] = useState(true);
  const [showElevationGrid, setShowElevationGrid] = useState(true);
  const [showAirDefenseBubbles, setShowAirDefenseBubbles] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [hoveredRegionData, setHoveredRegionData] = useState<RegionData | null>(null);
  const [selectedThreatInfo, setSelectedThreatInfo] = useState<ThreatTrajectory | null>(INITIAL_TRAJECTORIES[0]);
  const [interceptorsCount, setInterceptorsCount] = useState(0);
  const [lastInterceptionLog, setLastInterceptionLog] = useState<string | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const regionMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const regionEdgeLinesRef = useRef<Map<string, THREE.LineSegments>>(new Map());
  const radarConesRef = useRef<THREE.Mesh[]>([]);
  const missileGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const interceptorsRef = useRef<ActiveInterceptor[]>([]);
  const explosionParticlesRef = useRef<THREE.Points[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Mouse orbit controls refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 750, phi: Math.PI / 3.5, theta: -Math.PI / 12 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Audio synthesizer for 3D interactions
  const playWebAudioSound = (type: 'beep' | 'launch' | 'explosion') => {
    if (!soundEffects) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === 'launch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'explosion') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio context may be restricted
    }
  };

  // Launch 3D Interceptor
  const handleLaunch3DIntercept = () => {
    if (!sceneRef.current) return;

    // Pick target: either selected or first active trajectory
    const targetThreat = selectedThreatInfo || INITIAL_TRAJECTORIES[0];
    
    // Launch from a representative Air Defense Battery (e.g., Kyiv or Center SAM)
    const startPos = new THREE.Vector3(0, 5, -20); // Kyiv battery in 3D coords
    
    // Estimate target position based on trajectory
    const tx = (targetThreat.currentPoint.x - 500) * 0.9;
    const tz = (targetThreat.currentPoint.y - 325) * 0.9;
    const ty = targetThreat.threatType === 'ballistic' ? 90 : 35;
    const targetPos = new THREE.Vector3(tx, ty, tz);

    // Create 3D Interceptor Missile Mesh
    const interceptorGroup = new THREE.Group();
    const missileGeom = new THREE.CylinderGeometry(1.2, 1.8, 14, 8);
    missileGeom.rotateX(Math.PI / 2);
    const missileMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const missileMesh = new THREE.Mesh(missileGeom, missileMat);
    interceptorGroup.add(missileMesh);

    // Glow rocket exhaust
    const glowGeom = new THREE.ConeGeometry(2, 8, 8);
    glowGeom.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.z = -8;
    interceptorGroup.add(glow);

    interceptorGroup.position.copy(startPos);
    interceptorGroup.lookAt(targetPos);
    sceneRef.current.add(interceptorGroup);

    const newInterceptor: ActiveInterceptor = {
      id: `sam-${Date.now()}`,
      targetId: targetThreat.id,
      startPos,
      targetPos,
      currentPos: startPos.clone(),
      progress: 0,
      speed: 0.02 * simSpeed,
      isHit: false,
      mesh: interceptorGroup,
    };

    interceptorsRef.current.push(newInterceptor);
    setInterceptorsCount((prev) => prev + 1);
    playWebAudioSound('launch');
    setLastInterceptionLog(`🚀 Запуск PAC-3 Patriot по ${targetThreat.name}! Перехоплення в повітрі...`);
  };

  // Change camera preset
  const applyCameraPreset = (preset: typeof cameraPreset) => {
    setCameraPreset(preset);
    if (!cameraRef.current) return;

    if (preset === 'TACTICAL_45') {
      cameraSphericalRef.current = { radius: 780, phi: Math.PI / 3.6, theta: -Math.PI / 14 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === 'TOP_DOWN') {
      cameraSphericalRef.current = { radius: 720, phi: 0.05, theta: 0 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === 'GROUND_SAM') {
      // Look up from Kyiv ground air defense battery
      cameraSphericalRef.current = { radius: 320, phi: Math.PI / 2.3, theta: -Math.PI / 4 };
      cameraTargetRef.current.set(20, 60, -30);
    } else if (preset === 'INTERCEPTOR') {
      // Cockpit angle tracking the missile flight path
      cameraSphericalRef.current = { radius: 450, phi: Math.PI / 4.2, theta: Math.PI / 2.8 };
      cameraTargetRef.current.set(-50, 40, 50);
    } else if (preset === 'SATELLITE') {
      cameraSphericalRef.current = { radius: 1100, phi: Math.PI / 4, theta: -Math.PI / 6 };
      cameraTargetRef.current.set(0, 0, 0);
    }
  };

  // Initialize Three.js WebGL Engine
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 900;
    const height = mountRef.current.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Deep slate black
    scene.fog = new THREE.FogExp2(0x030712, 0.0008);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(200, 400, 200);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 2.5, 900);
    cyanRimLight.position.set(-250, 150, -200);
    scene.add(cyanRimLight);

    const roseThreatLight = new THREE.PointLight(0xf43f5e, 2.0, 800);
    roseThreatLight.position.set(250, 180, 200);
    scene.add(roseThreatLight);

    // 5. 3D Elevation Cyber Grid (Floor)
    const gridHelper = new THREE.GridHelper(1400, 40, 0x0284c7, 0x0f172a);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Dynamic Starfield / Atmospheric Dust
    const starsCount = 600;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
      starPositions[i + 1] = Math.random() * 800 + 50;
      starPositions[i + 2] = (Math.random() - 0.5) * 2000;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 2.5,
      transparent: true,
      opacity: 0.6,
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // 6. Build Extruded 3D Ukraine Regions
    const scale = 0.9;
    const offsetX = -500;
    const offsetY = -325;

    regions.forEach((region) => {
      const shape = parseSvgPathToShape(region.path, scale, offsetX, offsetY);
      if (!shape) return;

      const isAlarm = region.isAlarm;
      const isMyRegion = region.id === myRegionId;
      const depth = isAlarm ? 18 : isMyRegion ? 14 : 10;

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 1.2,
        bevelThickness: 1.5,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(Math.PI / 2); // Lay flat on XZ plane

      // Base Material
      let baseColor = 0x0f172a;
      let emissiveColor = 0x000000;
      let emissiveIntensity = 0;

      if (isAlarm) {
        if (region.threatType === 'ballistic') {
          baseColor = 0x881337;
          emissiveColor = 0xe11d48;
          emissiveIntensity = 0.4;
        } else if (region.threatType === 'drone') {
          baseColor = 0x7c2d12;
          emissiveColor = 0xf97316;
          emissiveIntensity = 0.35;
        } else if (region.threatType === 'aviation') {
          baseColor = 0x581c87;
          emissiveColor = 0xa855f7;
          emissiveIntensity = 0.35;
        } else {
          baseColor = 0x991b1b;
          emissiveColor = 0xef4444;
          emissiveIntensity = 0.3;
        }
      } else if (isMyRegion) {
        baseColor = 0x0e7490;
        emissiveColor = 0x06b6d4;
        emissiveIntensity = 0.4;
      }

      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity,
        roughness: 0.3,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { regionId: region.id, regionName: region.name, regionData: region };

      // Edges glowing outline
      const edges = new THREE.EdgesGeometry(geometry);
      const edgeLineMat = new THREE.LineBasicMaterial({
        color: isAlarm ? 0xff4d4d : isMyRegion ? 0x38bdf8 : 0x1e293b,
        linewidth: 2,
      });
      const edgeLine = new THREE.LineSegments(edges, edgeLineMat);
      mesh.add(edgeLine);

      scene.add(mesh);
      regionMeshesRef.current.set(region.id, mesh);
      regionEdgeLinesRef.current.set(region.id, edgeLine);
    });

    // 7. Radar Stations & Volumetric 3D Scan Cones
    const radarLocations = [
      { name: 'Київ (Patriot / С-300)', x: (450 + offsetX) * scale, z: (155 + offsetY) * scale },
      { name: 'Одеса (NASAMS)', x: (470 + offsetX) * scale, z: (460 + offsetY) * scale },
      { name: 'Харків (IRIS-T SLM)', x: (720 + offsetX) * scale, z: (185 + offsetY) * scale },
      { name: 'Львів (SAMP/T Mamba)', x: (140 + offsetX) * scale, z: (220 + offsetY) * scale },
      { name: 'Дніпро (Patriot PAC-2)', x: (675 + offsetX) * scale, z: (285 + offsetY) * scale },
    ];

    radarLocations.forEach((loc) => {
      // 3D Radar Station Base
      const baseGeom = new THREE.CylinderGeometry(4, 6, 8, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeom, baseMat);
      baseMesh.position.set(loc.x, 14, loc.z);
      scene.add(baseMesh);

      // 3D Radar Dome
      const domeGeom = new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const domeMesh = new THREE.Mesh(domeGeom, domeMat);
      domeMesh.position.set(loc.x, 18, loc.z);
      scene.add(domeMesh);

      // 3D Volumetric Scan Cone
      const coneGeom = new THREE.ConeGeometry(90, 80, 16, 1, true);
      coneGeom.rotateX(Math.PI / 2);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.15,
        wireframe: true,
        side: THREE.DoubleSide,
      });
      const coneMesh = new THREE.Mesh(coneGeom, coneMat);
      coneMesh.position.set(loc.x, 30, loc.z);
      scene.add(coneMesh);
      radarConesRef.current.push(coneMesh);

      // Radar Range Ring (Ground Projection)
      const ringGeom = new THREE.RingGeometry(80, 82, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.set(loc.x, 1, loc.z);
      scene.add(ringMesh);
    });

    // 8. 3D Missile & Drone Visuals
    INITIAL_TRAJECTORIES.forEach((threat) => {
      const threatGroup = new THREE.Group();

      if (threat.threatType === 'ballistic') {
        // High-altitude ballistic missile (Iskander / Kinzhal)
        const missileBody = new THREE.ConeGeometry(3.5, 18, 12);
        missileBody.rotateX(Math.PI / 2);
        const missileMat = new THREE.MeshStandardMaterial({
          color: 0xff0055,
          emissive: 0xff0044,
          emissiveIntensity: 0.9,
          roughness: 0.1,
          metalness: 0.9,
        });
        const missileMesh = new THREE.Mesh(missileBody, missileMat);
        threatGroup.add(missileMesh);

        // 3D Parabolic Ballistic Trajectory Curve (Arc into sky)
        const startX = 350;
        const startZ = 120;
        const endX = (threat.currentPoint.x + offsetX) * scale;
        const endZ = (threat.currentPoint.y + offsetY) * scale;
        
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(startX, 15, startZ),
          new THREE.Vector3((startX + endX) / 2, 160, (startZ + endZ) / 2), // High altitude apex
          new THREE.Vector3(endX, 25, endZ)
        );

        const points = curve.getPoints(40);
        const pathGeom = new THREE.BufferGeometry().setFromPoints(points);
        const pathMat = new THREE.LineDashedMaterial({
          color: 0xf43f5e,
          dashSize: 8,
          gapSize: 4,
          linewidth: 2,
        });
        const arcLine = new THREE.Line(pathGeom, pathMat);
        arcLine.computeLineDistances();
        scene.add(arcLine);

      } else {
        // Shahed Delta-wing Drone
        const deltaGeom = new THREE.ConeGeometry(5, 10, 3);
        deltaGeom.rotateX(Math.PI / 2);
        const droneMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.7,
        });
        const droneMesh = new THREE.Mesh(deltaGeom, droneMat);
        threatGroup.add(droneMesh);

        // Rotating Propeller disc
        const propGeom = new THREE.CircleGeometry(4, 8);
        const propMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const prop = new THREE.Mesh(propGeom, propMat);
        prop.position.z = -5;
        threatGroup.add(prop);
      }

      // Initial Position
      const currentX = (threat.currentPoint.x + offsetX) * scale;
      const currentZ = (threat.currentPoint.y + offsetY) * scale;
      const currentY = threat.threatType === 'ballistic' ? 95 : 35;
      threatGroup.position.set(currentX, currentY, currentZ);
      threatGroup.userData = { threatData: threat };

      scene.add(threatGroup);
      missileGroupsRef.current.set(threat.id, threatGroup);
    });

    // 9. Animation & Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime() * (isPlaying ? simSpeed : 0);

      // Orbit camera calculation from spherical coordinates
      const { radius, phi, theta } = cameraSphericalRef.current;
      camera.position.x = cameraTargetRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = cameraTargetRef.current.y + radius * Math.cos(phi);
      camera.position.z = cameraTargetRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(cameraTargetRef.current);

      // Rotate 3D Radar Scan Cones
      radarConesRef.current.forEach((cone, idx) => {
        cone.rotation.y = elapsed * 1.5 + idx * 0.8;
      });

      // Subtle pulse on alarmed regions
      regionMeshesRef.current.forEach((mesh, id) => {
        const reg = regions.find((r) => r.id === id);
        if (reg?.isAlarm) {
          const pulse = Math.sin(elapsed * 3) * 0.2 + 0.8;
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.5;
        }
      });

      // Animate 3D Threats (drones undulating, missiles soaring)
      missileGroupsRef.current.forEach((group, id) => {
        const threat = INITIAL_TRAJECTORIES.find((t) => t.id === id);
        if (threat) {
          if (threat.threatType === 'drone') {
            group.position.y = 35 + Math.sin(elapsed * 2 + parseInt(id.replace(/\D/g, ''))) * 4;
            group.rotation.y = elapsed * 0.4;
          } else {
            // Ballistic oscillation
            group.rotation.x = Math.sin(elapsed * 1.5) * 0.1;
          }
        }
      });

      // Animate SAM Interceptors
      for (let i = interceptorsRef.current.length - 1; i >= 0; i--) {
        const interceptor = interceptorsRef.current[i];
        if (!interceptor.isHit && interceptor.mesh) {
          interceptor.progress += delta * 0.6 * simSpeed;
          
          if (interceptor.progress >= 1) {
            // Interception Hit!
            interceptor.isHit = true;
            playWebAudioSound('explosion');
            setLastInterceptionLog(`🎯 ЦІЛЬ ЗНИЩЕНО! Успішне перехоплення в повітряному просторі!`);

            // Spawn 3D Explosion
            const hitPos = interceptor.targetPos;
            const expCount = 80;
            const expGeom = new THREE.BufferGeometry();
            const expPositions = new Float32Array(expCount * 3);
            for (let p = 0; p < expCount * 3; p += 3) {
              expPositions[p] = hitPos.x + (Math.random() - 0.5) * 20;
              expPositions[p + 1] = hitPos.y + (Math.random() - 0.5) * 20;
              expPositions[p + 2] = hitPos.z + (Math.random() - 0.5) * 20;
            }
            expGeom.setAttribute('position', new THREE.BufferAttribute(expPositions, 3));
            const expMat = new THREE.PointsMaterial({
              color: 0xfacc15,
              size: 4,
              transparent: true,
              opacity: 1,
            });
            const expPoints = new THREE.Points(expGeom, expMat);
            scene.add(expPoints);
            explosionParticlesRef.current.push(expPoints);

            // Remove missile mesh from scene
            scene.remove(interceptor.mesh);
          } else {
            // Lerp position
            interceptor.currentPos.lerpVectors(interceptor.startPos, interceptor.targetPos, interceptor.progress);
            interceptor.mesh.position.copy(interceptor.currentPos);
          }
        }
      }

      // Fade explosions
      for (let e = explosionParticlesRef.current.length - 1; e >= 0; e--) {
        const exp = explosionParticlesRef.current[e];
        const mat = exp.material as THREE.PointsMaterial;
        mat.opacity -= delta * 0.8;
        if (mat.opacity <= 0) {
          scene.remove(exp);
          explosionParticlesRef.current.splice(e, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Mouse Drag & Orbit Event Handlers
    const domElem = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        cameraSphericalRef.current.theta -= deltaX * 0.005;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.005)
        );

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting for region/threat hover
        const rect = domElem.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        const meshesArray: THREE.Object3D[] = Array.from(regionMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(meshesArray, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const rData = hitMesh.userData.regionData as RegionData;
          setHoveredRegionData(rData);
        } else {
          setHoveredRegionData(null);
        }
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        200,
        Math.min(1800, cameraSphericalRef.current.radius + e.deltaY * 0.8)
      );
    };

    const onClick = (e: MouseEvent) => {
      const rect = domElem.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const meshesArray: THREE.Object3D[] = Array.from(regionMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshesArray, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const rData = hitMesh.userData.regionData as RegionData;
        if (rData) {
          onSelectRegion(rData);
          playWebAudioSound('beep');
        }
      }
    };

    // Touch handlers for Mobile Devices
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

        cameraSphericalRef.current.theta -= deltaX * 0.007;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.007)
        );

        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - currentDist;
        cameraSphericalRef.current.radius = Math.max(
          200,
          Math.min(1800, cameraSphericalRef.current.radius + diff * 1.5)
        );
        touchStartDist = currentDist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Window Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    // Event Listeners
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('click', onClick);
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('click', onClick);
      domElem.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [regions, myRegionId]);

  // Update Region colors dynamically when regions prop changes
  useEffect(() => {
    regions.forEach((region) => {
      const mesh = regionMeshesRef.current.get(region.id);
      const edgeLine = regionEdgeLinesRef.current.get(region.id);
      if (mesh && edgeLine) {
        const isAlarm = region.isAlarm;
        const isMyRegion = region.id === myRegionId;

        let baseColor = 0x0f172a;
        let emissiveColor = 0x000000;
        let emissiveIntensity = 0;

        if (isAlarm) {
          if (region.threatType === 'ballistic') {
            baseColor = 0x881337;
            emissiveColor = 0xe11d48;
            emissiveIntensity = 0.4;
          } else if (region.threatType === 'drone') {
            baseColor = 0x7c2d12;
            emissiveColor = 0xf97316;
            emissiveIntensity = 0.35;
          } else if (region.threatType === 'aviation') {
            baseColor = 0x581c87;
            emissiveColor = 0xa855f7;
            emissiveIntensity = 0.35;
          } else {
            baseColor = 0x991b1b;
            emissiveColor = 0xef4444;
            emissiveIntensity = 0.3;
          }
        } else if (isMyRegion) {
          baseColor = 0x0e7490;
          emissiveColor = 0x06b6d4;
          emissiveIntensity = 0.4;
        }

        (mesh.material as THREE.MeshStandardMaterial).color.setHex(baseColor);
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(emissiveColor);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
        (edgeLine.material as THREE.LineBasicMaterial).color.setHex(isAlarm ? 0xff4d4d : isMyRegion ? 0x38bdf8 : 0x1e293b);
      }
    });
  }, [regions, myRegionId]);

  const activeAlarms = regions.filter((r) => r.isAlarm);
  const myRegionData = regions.find((r) => r.id === myRegionId) || regions[0];

  return (
    <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden mb-8">
      
      {/* Top Header & HUD Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>WebGL Engine · Повноформатний Просторовий Digital Twin</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Повітряний Простір України (Three.js WebGL)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Обертайте простір мишкою/пальцем, оцінюйте висоти польоту ракет, радіолокаційні куполи ППО та запускайте перехоплення.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={handleLaunch3DIntercept}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
            <span>Перехоплення (Patriot)</span>
          </button>

          <button
            onClick={() => setSoundEffects(!soundEffects)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              soundEffects ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Звукові ефекти радіолокації та перехоплення"
          >
            {soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs"
            title={isPlaying ? 'Пауза симуляції' : 'Відновити симуляцію'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  simSpeed === spd ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Canvas Viewport + Overlay HUDs */}
      <div className="relative w-full h-[480px] sm:h-[560px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
        
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Camera Angles Bar (Top-Left HUD) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl max-w-[90%] sm:max-w-none">
          <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center px-1.5 uppercase">
            Ракурс:
          </span>
          {[
            { id: 'TACTICAL_45', label: '🎮 Тактичний ракурс' },
            { id: 'TOP_DOWN', label: '🗺️ Планшет' },
            { id: 'INTERCEPTOR', label: '✈️ Кабіна Су-27' },
            { id: 'GROUND_SAM', label: '🛡️ Позиція Patriot' },
            { id: 'SATELLITE', label: '🛰️ Супутник' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyCameraPreset(preset.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraPreset === preset.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 3D Navigation Guide Tip */}
        <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Перетягуйте для обертання 360° · Коліщатко — Zoom</span>
        </div>

        {/* Live Interception Log Banner */}
        {lastInterceptionLog && (
          <div className="absolute top-16 left-3 z-10 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 text-cyan-300 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <Zap className="w-4 h-4 text-cyan-400 animate-bounce shrink-0" />
            <span>{lastInterceptionLog}</span>
          </div>
        )}

        {/* Hovered 3D Region Telemetry Card (Top-Right HUD) */}
        {hoveredRegionData && (
          <div className="absolute top-3 right-3 z-10 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 shadow-2xl text-xs max-w-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-white text-sm">{hoveredRegionData.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                hoveredRegionData.isAlarm ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {hoveredRegionData.isAlarm ? 'ТРИВОГА' : 'СПОКІЙНО'}
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Загроза:</span>
                <span className="font-bold text-amber-300 uppercase">{hoveredRegionData.threatType || 'немає'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Населення:</span>
                <span>{(hoveredRegionData.population / 1000000).toFixed(2)} млн</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Площа:</span>
                <span>{hoveredRegionData.areaKm2.toLocaleString()} км²</span>
              </div>
            </div>
            <button
              onClick={() => onSelectRegion(hoveredRegionData)}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold transition-all text-center"
            >
              Відкрити деталі регіону
            </button>
          </div>
        )}

        {/* Bottom-Right Threat Radar HUD */}
        <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-xl flex flex-col gap-2 max-w-xs text-xs">
          <div className="flex items-center justify-between font-mono font-bold text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>ТЕЛЕМЕТРІЯ РАДАРУ</span>
            </span>
            <span className="text-cyan-400 font-mono">{activeAlarms.length} тривог</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Висота Shahed:</span>
              <span className="text-amber-300 font-bold">350–600м AGL</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Апогей Іскандер:</span>
              <span className="text-rose-400 font-bold">50–85 км</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px]">
            <button
              onClick={onNavigateToShelters}
              className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-center"
            >
              Укриття ({myRegionData.shortName})
            </button>
            <button
              onClick={onNavigateToSimulator}
              className="py-1 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-center"
            >
              Симулятор
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
