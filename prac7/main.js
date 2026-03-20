import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/loaders/RGBELoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector(".webgl"),
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const controls = new OrbitControls(camera, document.body);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.45;

const particlesGroup = new THREE.Group();
scene.add(particlesGroup);

const groupCount = 3;
const particlesPerGroup = 30;

const palette = [
  new THREE.Color(0x00ffcc),
  new THREE.Color(0x00e5ff),
  new THREE.Color(0xffffff),
];

const particlesSource =
  "https://cdn.jsdelivr.net/gh/whisk0s/web-design2@main/prac7/assets/prac7_assets_sparkling_particle-Picsart-BackgroundRemover-Picsart-BackgroundRemover.webm";

// Preprocess video frames to cut near-white matte that appears on some hosts/codecs.
const matteCanvas = document.createElement("canvas");
matteCanvas.width = 256;
matteCanvas.height = 256;
const matteCtx = matteCanvas.getContext("2d", { willReadFrequently: true });
const processedTexture = new THREE.CanvasTexture(matteCanvas);
processedTexture.colorSpace = THREE.SRGBColorSpace;
processedTexture.minFilter = THREE.LinearFilter;
processedTexture.magFilter = THREE.LinearFilter;

const videos = [];
for (let g = 0; g < groupCount; g++) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = particlesSource;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.playbackRate = 0.01 + Math.random() * 1.0;
  videos.push(video);

  const tryPlay = video.play();
  if (tryPlay && typeof tryPlay.catch === "function") {
    tryPlay.catch(() => {});
  }

  const particlesGeometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(particlesPerGroup * 3);
  const colorsArray = new Float32Array(particlesPerGroup * 3);

  for (let i = 0; i < particlesPerGroup; i++) {
    const i3 = i * 3;

    positionsArray[i3] = (Math.random() - 0.5) * 30;
    positionsArray[i3 + 1] = (Math.random() - 0.5) * 30;
    positionsArray[i3 + 2] = (Math.random() - 0.5) * 30;

    const randomColor = palette[Math.floor(Math.random() * palette.length)];
    colorsArray[i3] = randomColor.r;
    colorsArray[i3 + 1] = randomColor.g;
    colorsArray[i3 + 2] = randomColor.b;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positionsArray, 3),
  );
  particlesGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colorsArray, 3),
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 3.2,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    depthTest: false,
    alphaTest: 0.001,
    map: processedTexture,
    alphaMap: processedTexture,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.frustumCulled = false;
  particlesGroup.add(particles);
}

window.addEventListener(
  "pointerdown",
  () => {
    videos.forEach((video) => {
      if (video.paused) {
        const tryPlay = video.play();
        if (tryPlay && typeof tryPlay.catch === "function") {
          tryPlay.catch(() => {});
        }
      }
    });
  },
  { once: true },
);

const hdrLoader = new RGBELoader();
hdrLoader.load(
  "https://cdn.jsdelivr.net/gh/whisk0s/web-design2@main/prac7/assets/dikhololo_night_2k.hdr",
  (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdrTexture;
    scene.backgroundRotation.y = (Math.PI / 180) * -160;
    scene.backgroundRotation.x = (Math.PI / 180) * -20;
  },
  undefined,
  (error) => {
    console.error("HDR load failed:", error);
  },
);

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  particlesGroup.rotation.x = elapsedTime * 0.1;
  particlesGroup.rotation.y = elapsedTime * 0.04;

  if (matteCtx && videos[0] && videos[0].readyState >= 2) {
    matteCtx.drawImage(videos[0], 0, 0, matteCanvas.width, matteCanvas.height);
    const frame = matteCtx.getImageData(0, 0, matteCanvas.width, matteCanvas.height);
    const data = frame.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 238 && g > 238 && b > 238) {
        data[i + 3] = 0;
      }
    }
    matteCtx.putImageData(frame, 0, 0);
    processedTexture.needsUpdate = true;
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};

tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
