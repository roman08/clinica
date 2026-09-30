// Hero 3D: una muela de esmalte brillante que flota, gira y sigue al ratón,
// rodeada de destellos. Es una mejora progresiva: si el módulo no carga
// (file://), no hay WebGL o algo falla, se queda la foto de .hero__fallback.
import * as THREE from './vendor/three.module.js';

const container = document.querySelector('[data-hero3d]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const COLORS = {
  enamel: 0xfbfaf6,
  sheen: 0xffe4d6,
  teal: 0x357e83,
  tealDark: 0x245a5e,
  peach: 0xfde3d8,
  coral: 0xef947c,
};

if (container && supportsWebGL()) {
  try {
    init();
  } catch (error) {
    console.warn('Hero 3D desactivado, se muestra la versión estática.', error);
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'hero__canvas';

  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  addLights(scene);

  const tooth = createTooth();
  scene.add(tooth);

  const shadow = createShadow();
  scene.add(shadow);

  const sparkles = [createSparkles(36, 0.38), createSparkles(26, 0.24)];
  sparkles.forEach((layer) => scene.add(layer));

  // ---- Interacción: la muela se inclina hacia el ratón ----
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function pose(time) {
    pointer.x += (pointer.targetX - pointer.x) * 0.06;
    pointer.y += (pointer.targetY - pointer.y) * 0.06;

    const float = Math.sin(time * 1.1) * 0.12;
    tooth.position.y = 0.55 + float;
    tooth.rotation.y = time * 0.35 + pointer.x * 0.6;
    tooth.rotation.x = 0.18 + pointer.y * 0.25;
    tooth.rotation.z = Math.sin(time * 0.6) * 0.06;

    // La sombra se encoge cuando la muela sube, como si se alejara del suelo.
    shadow.scale.setScalar(1 - float * 0.6);
    shadow.material.opacity = 0.32 - float * 0.4;

    sparkles.forEach((layer, index) => {
      layer.rotation.y = time * (index ? -0.08 : 0.05);
      layer.material.opacity = 0.55 + Math.sin(time * 2.2 + index * Math.PI) * 0.45;
    });
  }

  function render() {
    renderer.render(scene, camera);
  }

  // ---- Bucle: solo corre si el hero se ve, la pestaña está activa y se permite movimiento ----
  let time = 0.6;
  let lastFrame = 0;
  let running = false;
  let inView = true;

  function tick(now) {
    // Limitar el paso evita saltos al volver de otra pestaña.
    const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;
    time += delta;
    pose(time);
    render();
  }

  function updateLoop() {
    const shouldRun = inView && !document.hidden && !reducedMotion.matches;
    if (shouldRun === running) return;
    running = shouldRun;
    lastFrame = 0;
    renderer.setAnimationLoop(running ? tick : null);
    if (!running) {
      pose(time);
      render();
    }
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 9 / camera.aspect : 9;
    camera.updateProjectionMatrix();
    if (!running) render();
  }

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateLoop();
  }).observe(container);
  document.addEventListener('visibilitychange', updateLoop);
  reducedMotion.addEventListener('change', updateLoop);

  renderer.domElement.addEventListener('webglcontextlost', () => {
    container.classList.remove('is-3d-ready');
    renderer.setAnimationLoop(null);
    running = false;
  });

  container.append(renderer.domElement);
  resize();
  pose(time);
  render();
  container.classList.add('is-3d-ready');
  updateLoop();
}

// Mapa de entorno sin HDR ni addons: una sala virtual con paneles de luz en
// los colores de la marca. El esmalte refleja verde azulado, melocotón y blanco.
function createEnvironment(renderer) {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x9cc4c4, side: THREE.BackSide }),
  ));

  const panel = (color, intensity, position, size) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  };

  panel(0xffffff, 6, [0, 9, 2], [10, 6]);
  panel(0xffffff, 3, [0, 2, 9], [8, 4]);
  panel(COLORS.teal, 3, [-9, 0, 0], [6, 12]);
  panel(COLORS.coral, 3, [9, -1, 0], [6, 10]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
  return texture;
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(COLORS.peach, 1.2);
  rim.position.set(-4, 1, -4);
  scene.add(rim);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// Corona: una esfera deformada, aplanada, con cuello más estrecho y cuatro
// cúspides alrededor de un surco central.
function createCrownGeometry() {
  const geometry = new THREE.SphereGeometry(1, 96, 64);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const { x, y, z } = vertex;

    const angle = Math.atan2(z, x);
    const radial = Math.min(Math.hypot(x, z), 1);
    const top = smoothstep(0.1, 0.95, y);

    const cusps = 0.17 * (0.5 + 0.5 * Math.cos(4 * angle + Math.PI / 4)) * Math.sin(radial * Math.PI);
    const groove = -0.26 * (1 - radial) ** 3;
    const neck = 1 - 0.28 * smoothstep(0, -1, y);

    vertex.set(
      x * 1.12 * neck,
      (y > 0 ? y * 0.8 : y * 0.72) + top * (cusps + groove),
      z * 1.0 * neck,
    );
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createTooth() {
  const tooth = new THREE.Group();
  const enamel = new THREE.MeshPhysicalMaterial({
    color: COLORS.enamel,
    roughness: 0.22,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 0.5,
    sheenColor: new THREE.Color(COLORS.sheen),
    envMapIntensity: 1.1,
  });

  tooth.add(new THREE.Mesh(createCrownGeometry(), enamel));

  // Dos raíces cónicas, abiertas hacia fuera y con la punta redondeada.
  [-1, 1].forEach((side) => {
    const root = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.17, 1.35, 40, 1, true), enamel);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), enamel);
    tip.position.y = -0.675;
    root.add(shaft, tip);
    root.position.set(side * 0.4, -1.05, 0);
    root.rotation.z = side * 0.14;
    tooth.add(root);
  });

  return tooth;
}

function radialTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createShadow() {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(20, 60, 62, 0.9)'], [1, 'rgba(20, 60, 62, 0)']]),
      transparent: true,
      depthWrite: false,
      opacity: 0.32,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.1;
  return shadow;
}

// Textura de destello: una estrella de cuatro puntas dibujada en canvas.
function sparkleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
  glow.addColorStop(0.25, 'rgba(255, 245, 238, 0.6)');
  glow.addColorStop(1, 'rgba(255, 245, 238, 0)');
  context.fillStyle = glow;
  context.beginPath();
  context.moveTo(32, 0);
  context.quadraticCurveTo(35, 29, 64, 32);
  context.quadraticCurveTo(35, 35, 32, 64);
  context.quadraticCurveTo(29, 35, 0, 32);
  context.quadraticCurveTo(29, 29, 32, 0);
  context.fill();
  return new THREE.CanvasTexture(canvas);
}

function createSparkles(count, size) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Reparto en una corteza esférica alrededor de la muela.
    const radius = 2.1 + Math.random() * 1.3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.8 + 0.2;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size,
    map: sparkleTexture(),
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
}
