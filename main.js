import * as THREE from "three";
import { fitCameraToCenteredObject } from "./utils";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const cameraSettings = {
  fov: 60,
  near: 0.1,
  far: 500,
};

const targetPlaneSize = {
  width: 15,
  height: 15,
};

const renderTargetWidth = targetPlaneSize.width * 512;
const renderTargetHeight = targetPlaneSize.height * 512;

let readRenderTarget = new THREE.WebGLRenderTarget(
  renderTargetWidth,
  renderTargetHeight,
);

let writeRenderTarget = new THREE.WebGLRenderTarget(
  renderTargetWidth,
  renderTargetHeight,
);

const geometry = new THREE.PlaneGeometry(
  targetPlaneSize.width,
  targetPlaneSize.height,
);

let material = new THREE.ShaderMaterial({
  uniforms: {
    tex: {
      value: writeRenderTarget.texture,
    },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D tex;
    varying vec2 vUv;
    void main() {
        vec4 color = texture2D(tex, vUv);
        gl_FragColor = color;
    }
  `,
});

const targetPlane = new THREE.Mesh(geometry, material);
scene.add(targetPlane);

function swapRenderTargets() {
  const temp = readRenderTarget;
  readRenderTarget = writeRenderTarget;
  writeRenderTarget = temp;
}

function createKernel(fragmentShader, extraUniforms = {}) {
  const auxCameraAspect = renderTargetWidth / renderTargetHeight;

  const auxScene = new THREE.Scene();
  const auxCamera = new THREE.PerspectiveCamera(
    cameraSettings.fov,
    auxCameraAspect,
    cameraSettings.near,
    cameraSettings.far,
  );

  const auxGeometry = new THREE.PlaneGeometry(20, 20);

  const auxMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
          vUv = uv;
          vPosition = position; 
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
      }
    `,
    fragmentShader,
    uniforms: {
      tex: { value: null },
      ...extraUniforms,
    },
  });
  const auxPlane = new THREE.Mesh(auxGeometry, auxMaterial);
  auxScene.add(auxPlane);

  fitCameraToCenteredObject(auxCamera, auxPlane, 0);

  return { auxScene, auxCamera, auxMaterial };
}

function executeBody(kernel) {
  kernel.auxMaterial.uniforms.tex.value = readRenderTarget.texture;

  renderer.clear();
  renderer.setRenderTarget(writeRenderTarget);
  renderer.render(kernel.auxScene, kernel.auxCamera);
  swapRenderTargets();

  renderer.setRenderTarget(null);
}

const dihiretShader = `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

const heatShader = `
    varying vec2 vUv;
    uniform vec2 mouse;
    uniform sampler2D tex;
    void main() {
      float dist = length(mouse - vUv);
      float previousHeat = texture2D(tex, vUv).r;
      float heat = 2.0 * exp(-dist*70.0);

      float newHeat = max(heat, previousHeat);

      gl_FragColor = vec4(newHeat, vec2(0.0), 1.0);
    } 
`;

let mousePosition = new THREE.Vector2();

const dihiret = createKernel(dihiretShader);
const heat = createKernel(heatShader, {
  mouse: { value: mousePosition },
});

const integratorShader = `
  uniform sampler2D tex;
  uniform float n;
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec4 center = texture2D(tex, vUv);
    vec4 left = texture2D(tex, vUv - vec2(1.0 / n, 0.0));
    vec4 right = texture2D(tex, vUv + vec2(1.0 / n, 0.0));
    vec4 up = texture2D(tex, vUv + vec2(0.0, 1.0 / n));
    vec4 down = texture2D(tex, vUv - vec2(0.0, 1.0 / n));

    // Apply the heat equation
    vec4 laplacian = (left + right + up + down - 4.0 * center) * 25.0;
    vec4 next = center + laplacian * uTime;
    gl_FragColor = next;
  }
`;

let uTime = 0.01;

const integrator = createKernel(integratorShader, {
  n: { value: 1000.0 },
  uTime: { value: uTime },
});

executeBody(dihiret);

document.addEventListener("mousemove", (event) => {
  // normalize the mouse position to the range [0, 1]
  mousePosition.x = event.clientX / window.innerWidth;
  mousePosition.y = 1 - event.clientY / window.innerHeight;
  // console.log(mousePosition);
});

let isMouseDown = false;

document.addEventListener("mousedown", (event) => {
  isMouseDown = true;
});

document.addEventListener("mouseup", (event) => {
  isMouseDown = false;
});


// for mobile

document.addEventListener("touchmove", (event) => {
  // normalize the mouse position to the range [0, 1]
  mousePosition.x = event.touches[0].clientX / window.innerWidth;
  mousePosition.y = 1 - event.touches[0].clientY / window.innerHeight;
  // console.log(mousePosition);
})

document.addEventListener("touchstart", (event) => {
  isMouseDown = true;
})

document.addEventListener("touchend", (event) => {
  isMouseDown = false;
})

function applyHeat() {
  executeBody(heat);
}

camera.position.z = 20;

let integratorEnabled = true;

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    integratorEnabled = !integratorEnabled;
  }
})

function animate() {
  uTime += 0.01;
  if (isMouseDown) {
    applyHeat();
  }

  if (integratorEnabled) {
    executeBody(integrator);
  }
  
  renderer.render(scene, camera);
}
