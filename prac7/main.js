import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { RGBELoader } from "jsm/loaders/RGBELoader.js";

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
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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
  "https://raw.githubusercontent.com/whisk0s/web-design2/refs/heads/main/prac7/assets/sparkling_particle-Picsart-BackgroundRemover.webm";

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

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;

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
    size: 10,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.001,
    alphaMap: videoTexture,
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
  "https://raw.githubusercontent.com/whisk0s/web-design2/refs/heads/main/prac7/assets/qwantani_dusk_2_puresky_2k.hdr",
  (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    hdrTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = hdrTexture;
    scene.backgroundRotation.y = (Math.PI / 180) * -160;
    scene.backgroundRotation.x = (Math.PI / 180) * -20;
  },
);

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  particlesGroup.rotation.x = elapsedTime * 0.1;

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
