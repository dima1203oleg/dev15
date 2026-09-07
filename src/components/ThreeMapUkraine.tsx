import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RegionData, ThreatTrajectory } from '../types';
import { INITIAL_REGIONS } from '../data/ukraineMapData';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers
} from 'lucide-react';

interface ThreeMapUkraineProps {
  variant?: 'hero' | 'workspace' | 'full';
  theme?: 'light' | 'dark';
  regions?: RegionData[];
  trajectories?: ThreatTrajectory[];
  selectedRegionId?: string | null;
  onSelectRegion?: (region: RegionData) => void;
  activeThreatCount?: number;
  className?: string;
  enableControls?: boolean;
}

// Convert SVG path command string into THREE.Shape
function parseSvgPathToShape(pathStr: string, scaleX = 0.042, scaleY = 0.042, offsetX = 500, offsetY = 330): THREE.Shape | null {
  const shape = new THREE.Shape();
  const tokens = pathStr.trim().split(/\s+/);
  
  let currentX = 0;
  let currentY = 0;
  let hasMoved = false;

  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i];
    if (cmd === 'M' || cmd === 'm') {
      const coords = tokens[i + 1]?.split(',').map(Number);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const x = (coords[0] - offsetX) * scaleX;
        const y = -(coords[1] - offsetY) * scaleY;
        currentX = x;
        currentY = y;
        shape.moveTo(x, y);
        hasMoved = true;
      }
      i += 2;
    } else if (cmd === 'L' || cmd === 'l') {
      const coords = tokens[i + 1]?.split(',').map(Number);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const x = (coords[0] - offsetX) * scaleX;
        const y = -(coords[1] - offsetY) * scaleY;
        currentX = x;
        currentY = y;
        shape.lineTo(x, y);
      }
      i += 2;
    } else if (cmd === 'Z' || cmd === 'z') {
      shape.closePath();
      i += 1;
    } else if (cmd.includes(',')) {
      const coords = cmd.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const x = (coords[0] - offsetX) * scaleX;
        const y = -(coords[1] - offsetY) * scaleY;
        currentX = x;
        currentY = y;
        shape.lineTo(x, y);
      }
      i += 1;
    } else {
      i += 1;
    }
  }

  return hasMoved ? shape : null;
}

export const ThreeMapUkraine: React.FC<ThreeMapUkraineProps> = ({
  variant = 'hero',
  theme = 'light',
  regions = INITIAL_REGIONS,
  trajectories = [],
  selectedRegionId = null,
  onSelectRegion,
  activeThreatCount = 0,
  className = '',
  enableControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const kyivIsAlarm = regions.some((region) => (region.id === 'kyiv_obl' || region.id === 'kyiv_city') && region.isAlarm);
  const dniproIsAlarm = regions.some((region) => region.id === 'dnipro' && region.isAlarm);

  // Interactive Hover state
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [viewAngle, setViewAngle] = useState<'3D' | 'TOP'>('3D');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Region meshes map for raycasting & material updates
  const regionMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; defaultY: number; regionData: RegionData }>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsTargetRef = useRef<{ rotX: number; rotY: number; zoom: number }>({ rotX: -0.22, rotY: 0.05, zoom: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || (variant === 'hero' ? 380 : 320);
    setWebglUnavailable(false);

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    // Keep the whole country readable in the hero viewport. The previous
    // framing left the extruded meshes too small beside the DOM copy.
    camera.position.set(0, 25, 31);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglUnavailable(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.35 : 1.15;

    container.appendChild(renderer.domElement);

    // 2. Realistic Lighting adjusted for Light / Dark Mode
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x315363 : 0xf8fafc,
      isDark ? 1.85 : 1.9
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      isDark ? 0x93c5fd : 0xffffff, 
      isDark ? 2.8 : 2.4
    );
    dirLight.position.set(24, 42, 28);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(
      isDark ? 0x3b82f6 : 0xdbeafe, 
      isDark ? 1.6 : 1.1
    );
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    const blueAccentLight = new THREE.PointLight(0x3b82f6, isDark ? 3.5 : 2.2, 50);
    blueAccentLight.position.set(0, 10, 0);
    scene.add(blueAccentLight);

    const redAlertLight = new THREE.PointLight(0xef4444, isDark ? 4.5 : 3.5, 45);
    redAlertLight.position.set(8, 8, 2);
    scene.add(redAlertLight);

    const orangeThreatLight = new THREE.PointLight(0xf97316, isDark ? 3.8 : 2.0, 40);
    orangeThreatLight.position.set(-4, 6, 4);
    scene.add(orangeThreatLight);

    // 3. Map Root Group
    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    // 4. Soft Ambient Occlusion Shadow Plane beneath map
    const shadowGeo = new THREE.PlaneGeometry(54, 38);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      if (isDark) {
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        grad.addColorStop(0.5, 'rgba(30, 58, 138, 0.25)');
        grad.addColorStop(1, 'rgba(11, 17, 30, 0)');
      } else {
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.22)');
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.06)');
        grad.addColorStop(1, 'rgba(244, 247, 251, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotateX(-Math.PI / 2);
    shadowMesh.position.y = -0.6;
    mapGroup.add(shadowMesh);

    // 5. Build 3D Extruded Meshes for EVERY Region / Oblast
    const regionMeshes = new Map<string, { mesh: THREE.Mesh; defaultY: number; regionData: RegionData }>();
    const interactiveMeshesList: THREE.Mesh[] = [];

    regions.forEach((region) => {
      const shape = parseSvgPathToShape(region.path);
      if (!shape) return;

      const isAlarm = region.isAlarm;
      const isSelected = selectedRegionId === region.id;

      // 3D Extrusion settings
      const depth = isAlarm ? 2.4 : 2.0;
      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.12,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

      // Color palette adjusted for Light vs Dark
      let topColor = isDark ? 0x365967 : 0xf8fafc;
      let sideColor = isDark ? 0x1c3440 : 0x94a3b8;
      let roughness = isDark ? 0.4 : 0.35;
      let metalness = isDark ? 0.3 : 0.05;

      if (isAlarm) {
        if (region.threatType === 'ballistic') {
          topColor = isDark ? 0xdc2626 : 0xef4444;
          sideColor = isDark ? 0x991b1b : 0xb91c1c;
        } else if (region.threatType === 'drone') {
          topColor = isDark ? 0xe11d48 : 0xf87171;
          sideColor = isDark ? 0x9f1239 : 0xdc2626;
        } else {
          topColor = isDark ? 0xf43f5e : 0xfb7185;
          sideColor = isDark ? 0xbe123c : 0xe11d48;
        }
      } else if (isSelected) {
        topColor = isDark ? 0x2563eb : 0x3b82f6;
        sideColor = isDark ? 0x1e40af : 0x1d4ed8;
      }

      const topMaterial = new THREE.MeshPhysicalMaterial({
        color: topColor,
        roughness,
        metalness,
        clearcoat: isAlarm ? 0.6 : (isDark ? 0.4 : 0.25),
        clearcoatRoughness: 0.2,
      });

      const sideMaterial = new THREE.MeshStandardMaterial({
        color: sideColor,
        roughness: 0.6,
        metalness: isDark ? 0.4 : 0.1,
      });

      const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      const defaultY = isAlarm ? 0.3 : 0;
      mesh.position.y = defaultY;
      mesh.userData = { regionId: region.id, regionData: region };

      mapGroup.add(mesh);
      regionMeshes.set(region.id, { mesh, defaultY, regionData: region });
      interactiveMeshesList.push(mesh);
    });

    regionMeshesRef.current = regionMeshes;

    // 6. Dynamic Radar Wave Rings over Alarm Regions (Derived from live/cached regions)
    const radarRings: { mesh: THREE.Mesh; speed: number; maxScale: number }[] = [];

    const createRadarWave = (center: [number, number], color: number, maxScale: number, speed: number) => {
      const ringGeo = new THREE.RingGeometry(0.4, 0.7, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isDark ? 0.9 : 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotateX(-Math.PI / 2);
      
      const x = (center[0] - 500) * 0.042;
      const z = (center[1] - 330) * 0.042;
      ringMesh.position.set(x, 2.3, z);
      mapGroup.add(ringMesh);
      radarRings.push({ mesh: ringMesh, speed, maxScale });
    };

    // Dynamically spawn radar rings for all active alarm regions
    const alarmedRegionsList = regions.filter(r => r.isAlarm);
    if (alarmedRegionsList.length > 0) {
      alarmedRegionsList.forEach((r, idx) => {
        const isCritical = r.threatType === 'ballistic' || r.threatType === 'missile';
        const color = isCritical 
          ? (isDark ? 0xf87171 : 0xef4444) 
          : (isDark ? 0xfb923c : 0xf59e0b);
        createRadarWave(r.center, color, 4.5 + (idx % 2) * 1.5, 0.035 + (idx % 3) * 0.005);
      });
    }

    // 7. 3D Trajectory Curved Light Arcs between key threat vectors
    const createArc = (p1: THREE.Vector3, p2: THREE.Vector3, color: number) => {
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 4.5; // Elevated arc
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineDashedMaterial({
        color,
        dashSize: 0.6,
        gapSize: 0.3,
        linewidth: 2,
        transparent: true,
        opacity: isDark ? 0.95 : 0.85,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcLine.computeLineDistances();
      mapGroup.add(arcLine);
    };

    // Render 3D arcs dynamically from active trajectories or regional interconnections
    if (trajectories && trajectories.length > 0) {
      trajectories.forEach(traj => {
        const targetRegionObj = regions.find(r => r.id === traj.targetRegion);
        if (targetRegionObj) {
          const targetPos = new THREE.Vector3(
            (targetRegionObj.center[0] - 500) * 0.042,
            2.4,
            (targetRegionObj.center[1] - 330) * 0.042
          );
          // Calculate origin offset based on threat angle or default entry point
          const originPos = new THREE.Vector3(
            targetPos.x + (traj.threatType === 'ballistic' ? 6 : -5),
            2.4,
            targetPos.z + (traj.threatType === 'ballistic' ? -6 : -4)
          );
          const arcColor = traj.threatType === 'ballistic' 
            ? (isDark ? 0xf43f5e : 0xe11d48) 
            : traj.threatType === 'missile'
              ? (isDark ? 0xfb923c : 0xf59e0b)
              : (isDark ? 0x38bdf8 : 0x0284c7);
          createArc(originPos, targetPos, arcColor);
        }
      });
    }

    // 8. Pointer interactivity (mouse, touch and pen selection on oblast meshes)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredMesh: THREE.Mesh | null = null;

    const updatePointerPosition = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    const clearHover = () => {
      if (currentHoveredMesh) {
        const prevEntry = regionMeshes.get(currentHoveredMesh.userData.regionId);
        if (prevEntry) currentHoveredMesh.position.y = prevEntry.defaultY;
        currentHoveredMesh = null;
      }
      setHoveredRegion(null);
      setTooltipPos(null);
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointerPosition(e.clientX, e.clientY);

      // Touch and pen have no hover state. Their final pointer position is
      // retained for the following click/pointerup hit-test instead.
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;

      const rect = container.getBoundingClientRect();

      // Mouse Parallax Rotation
      controlsTargetRef.current.rotY = mouse.x * 0.18 + 0.05;
      controlsTargetRef.current.rotX = -mouse.y * 0.12 - 0.22;

      // Raycast to find hovered region
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesList);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        if (hitMesh !== currentHoveredMesh) {
          if (currentHoveredMesh) {
            const prevEntry = regionMeshes.get(currentHoveredMesh.userData.regionId);
            if (prevEntry) {
              currentHoveredMesh.position.y = prevEntry.defaultY;
            }
          }
          currentHoveredMesh = hitMesh;
          hitMesh.position.y += 0.35;
          const regData = hitMesh.userData.regionData as RegionData;
          setHoveredRegion(regData);
        }
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        clearHover();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        updatePointerPosition(e.clientX, e.clientY);
      }
    };

    const handlePointerClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesList);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const regData = hitMesh.userData.regionData as RegionData;
        if (onSelectRegion) {
          onSelectRegion(regData);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', clearHover);
    container.addEventListener('click', handlePointerClick);

    // 9. Animation Render Loop
    let animationFrameId: number;
    const clock = new THREE.Timer();
    clock.connect(document);
    let currentRotX = -0.22;
    let currentRotY = 0.05;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const renderFrame = (timestamp?: number) => {
      clock.update(timestamp);
      const elapsedTime = clock.getElapsed();

      // Keep the selected state visible without introducing motion when the
      // operating system requests reduced motion.
      if (!reducedMotion) {
        currentRotX += (controlsTargetRef.current.rotX - currentRotX) * 0.06;
        currentRotY += (controlsTargetRef.current.rotY - currentRotY) * 0.06;
        mapGroup.rotation.x = currentRotX;
        mapGroup.rotation.y = currentRotY;

        radarRings.forEach((r, idx) => {
          const cycle = (elapsedTime * 1.3 + idx * 0.5) % 2.5;
          const progress = cycle / 2.5;
          const scale = 1 + progress * (r.maxScale - 1);
          r.mesh.scale.set(scale, scale, scale);
          (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (isDark ? 0.9 : 0.8) * (1 - progress));
        });

        redAlertLight.intensity = (isDark ? 4.5 : 3.0) + Math.sin(elapsedTime * 4.0) * 1.5;
        blueAccentLight.intensity = (isDark ? 3.5 : 2.0) + Math.cos(elapsedTime * 2.0) * 0.8;
        orangeThreatLight.intensity = (isDark ? 3.8 : 2.0) + Math.sin(elapsedTime * 3.0) * 1.0;
      }

      renderer.render(scene, camera);
    };

    const animate = (timestamp?: number) => {
      animationFrameId = requestAnimationFrame(animate);
      renderFrame(timestamp);
    };

    if (reducedMotion) renderFrame();
    else animate();

    // 10. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', clearHover);
      container.removeEventListener('click', handlePointerClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      clock.dispose();
      renderer.dispose();
    };
  }, [regions, trajectories, selectedRegionId, variant, isDark]);

  // Adjust Camera Zoom & View Angle
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZoom = Math.max(0.7, Math.min(1.6, zoomLevel + delta));
    setZoomLevel(newZoom);
    cameraRef.current.position.set(0, 25 / newZoom, 31 / newZoom);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleToggleView = () => {
    if (!cameraRef.current) return;
    if (viewAngle === '3D') {
      setViewAngle('TOP');
      cameraRef.current.position.set(0, 56, 0.1);
      cameraRef.current.lookAt(0, 0, 0);
    } else {
      setViewAngle('3D');
      cameraRef.current.position.set(0, 36, 44);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleResetView = () => {
    if (!cameraRef.current) return;
    setZoomLevel(1);
    setViewAngle('3D');
    cameraRef.current.position.set(0, 25, 31);
    cameraRef.current.lookAt(0, 0, 0);
    controlsTargetRef.current = { rotX: -0.22, rotY: 0.05, zoom: 1 };
  };

  if (webglUnavailable) {
    const fallbackRegions = (regions || INITIAL_REGIONS)
      .filter((region) => region.isAlarm || region.id === selectedRegionId)
      .slice(0, 6);

    return (
      <div
        className={`relative flex h-full w-full flex-col justify-center overflow-hidden rounded-3xl border p-4 ${
          isDark ? 'border-cyan-900/70 bg-slate-950/80 text-white' : 'border-blue-100 bg-slate-50 text-slate-900'
        } ${className}`}
        role="img"
        aria-label="2.5D карта безпеки України: WebGL недоступний, доступний спрощений режим"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage: `linear-gradient(135deg, ${isDark ? 'rgba(34,211,238,.16)' : 'rgba(37,99,235,.12)'} 1px, transparent 1px), linear-gradient(45deg, ${isDark ? 'rgba(34,211,238,.10)' : 'rgba(37,99,235,.08)'} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <div className={`text-[10px] font-black tracking-[0.16em] ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>2.5D SAFETY MODE</div>
            <div className="mt-1 text-sm font-black">Спрощена просторова карта</div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>WebGL недоступний. Критичні дані та вибір регіону залишаються доступними.</div>
          </div>
          <Layers className={`h-7 w-7 shrink-0 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`} aria-hidden="true" />
        </div>
        <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fallbackRegions.length > 0 ? fallbackRegions.map((region) => (
            <button
              key={region.id}
              type="button"
              aria-label={`Вибрати регіон ${region.name}`}
              onClick={() => onSelectRegion?.(region)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
                isDark ? 'border-rose-900/70 bg-rose-950/30 text-rose-100 hover:bg-rose-900/50' : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <span className="block truncate">{region.name}</span>
              <span className="mt-0.5 block text-[10px] font-semibold opacity-75">{region.isAlarm ? 'Статус: тривога' : 'Обраний регіон'}</span>
            </button>
          )) : (
            <div className={`col-span-full rounded-xl border px-3 py-3 text-xs font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              Актуальні регіональні дані поки не передані джерелом.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing touch-pan-y ${className}`}
    >
      {/* 3D Map Floating Interactive Tooltip */}
      {hoveredRegion && tooltipPos && (
        <div 
          className="absolute z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className={`${
            isDark 
              ? 'bg-slate-900/95 text-white border-slate-700/80 shadow-[0_10px_25px_rgba(0,0,0,0.5)]' 
              : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-[0_10px_25px_rgba(0,0,0,0.12)]'
          } backdrop-blur-md rounded-2xl p-3 border min-w-[190px] animate-in fade-in zoom-in-95 duration-150`}>
            <div className={`flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <span className="font-bold text-xs">{hoveredRegion.name}</span>
              {hoveredRegion.isAlarm ? (
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isDark 
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800' 
                    : 'text-rose-600 bg-rose-50 border-rose-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Тривога
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark 
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Спокійно
                </span>
              )}
            </div>

            {hoveredRegion.isAlarm ? (
              <div className="space-y-1 text-[11px]">
                <div className={isDark ? 'text-slate-300' : 'text-slate-500'}>
                  Загроза: <strong className={isDark ? 'text-rose-300 font-bold' : 'text-slate-800 font-bold'}>{hoveredRegion.threatType.toUpperCase()}</strong>
                </div>
                {hoveredRegion.durationMinutes > 0 && (
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    Триває: {hoveredRegion.durationMinutes} хв
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Населення: {(hoveredRegion.population / 1000).toFixed(0)} тис.
              </div>
            )}
            <div className="mt-1.5 pt-1 border-t border-slate-100/10 text-[9px] text-blue-400 font-bold text-right">
              Натисніть для деталей →
            </div>
          </div>
        </div>
      )}

      {/* Map Control Tools (Top Right) */}
      {enableControls && (
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-30">
          <button
            type="button"
            aria-label="Збільшити карту"
            onClick={() => handleZoom(0.15)}
            className={`min-h-11 min-w-11 p-2 rounded-xl border shadow-xs backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center ${
              isDark 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700' 
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
            }`}
            title="Збільшити"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Зменшити карту"
            onClick={() => handleZoom(-0.15)}
            className={`min-h-11 min-w-11 p-2 rounded-xl border shadow-xs backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center ${
              isDark 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700' 
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
            }`}
            title="Зменшити"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Перемкнути 3D та 2D ракурс"
            onClick={handleToggleView}
            className={`min-h-11 min-w-11 p-2 rounded-xl border shadow-xs backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center ${
              viewAngle === 'TOP' 
                ? 'bg-blue-600 text-white border-blue-500' 
                : (isDark ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white/90 hover:bg-white text-slate-600 border-slate-200/80')
            }`}
            title="Змінити ракурс 3D / 2D"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Скинути ракурс карти"
            onClick={handleResetView}
            className={`min-h-11 min-w-11 p-2 rounded-xl border shadow-xs backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center ${
              isDark 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700' 
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
            }`}
            title="Скинути ракурс"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* City Markers Overlay with Ukrainian Labels */}
      {variant === 'hero' && (
        <>
          {/* Kyiv Node */}
          <button
            type="button"
            aria-label="Вибрати регіон Київ"
            onClick={() => {
              const reg = (regions || INITIAL_REGIONS).find(r => r.id === 'kyiv_obl' || r.id === 'kyiv_city');
              if (reg && onSelectRegion) onSelectRegion(reg);
            }}
            className="absolute top-[32%] left-[47%] -translate-x-1/2 -translate-y-1/2 min-h-11 px-2 flex items-center gap-2 cursor-pointer z-20 group hover:scale-110 transition-transform bg-transparent border-0"
          >
            <div className="relative flex items-center justify-center w-5 h-5">
              {kyivIsAlarm ? <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80" /> : null}
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-white shadow-md" />
            </div>
            <span className={`text-xs font-black drop-shadow-xs transition-colors ${
              isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-blue-600'
            }`}>
              Київ
            </span>
          </button>

          {/* Kharkiv Node */}
          <button
            type="button"
            aria-label="Вибрати регіон Харків"
            onClick={() => {
              const reg = (regions || INITIAL_REGIONS).find(r => r.id === 'kharkiv');
              if (reg && onSelectRegion) onSelectRegion(reg);
            }}
            className="absolute top-[36%] left-[73%] -translate-x-1/2 -translate-y-1/2 min-h-11 px-2 flex items-center gap-2 cursor-pointer z-20 group hover:scale-110 transition-transform bg-transparent border-0"
          >
            <div className="relative flex items-center justify-center w-4 h-4">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border-2 border-white shadow-md" />
            </div>
            <span className={`text-xs font-bold drop-shadow-xs transition-colors ${
              isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-blue-600'
            }`}>
              Харків
            </span>
          </button>

          {/* Dnipro Node */}
          <button
            type="button"
            aria-label="Вибрати регіон Дніпро"
            onClick={() => {
              const reg = (regions || INITIAL_REGIONS).find(r => r.id === 'dnipro');
              if (reg && onSelectRegion) onSelectRegion(reg);
            }}
            className="absolute top-[55%] left-[67%] -translate-x-1/2 -translate-y-1/2 min-h-11 px-2 flex items-center gap-2 cursor-pointer z-20 group hover:scale-110 transition-transform bg-transparent border-0"
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              {dniproIsAlarm ? <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80" /> : null}
              <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-lg ${dniproIsAlarm ? 'bg-rose-600' : 'bg-cyan-400'}`} />
            </div>
            <span className={`text-xs font-black drop-shadow-xs transition-colors ${
              dniproIsAlarm
                ? (isDark ? 'text-rose-400 group-hover:text-rose-300' : 'text-slate-900 group-hover:text-rose-600')
                : (isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-blue-600')
            }`}>
              Дніпро
            </span>
          </button>

          {/* Odesa Node */}
          <button
            type="button"
            aria-label="Вибрати регіон Одеса"
            onClick={() => {
              const reg = (regions || INITIAL_REGIONS).find(r => r.id === 'odesa');
              if (reg && onSelectRegion) onSelectRegion(reg);
            }}
            className="absolute top-[68%] left-[44%] -translate-x-1/2 -translate-y-1/2 min-h-11 px-2 flex items-center gap-2 cursor-pointer z-20 group hover:scale-110 transition-transform bg-transparent border-0"
          >
            <div className="relative flex items-center justify-center w-4 h-4">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white shadow-md" />
            </div>
            <span className={`text-xs font-bold drop-shadow-xs transition-colors ${
              isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-blue-600'
            }`}>
              Одеса
            </span>
          </button>
        </>
      )}
    </div>
  );
};
