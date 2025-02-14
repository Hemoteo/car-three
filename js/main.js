import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Coche } from './Coche.js';
import * as CANNON from 'cannon-es';

// Crear escena, cámara y renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controles de órbita
const controls = new OrbitControls(camera, renderer.domElement);

// Crear el mundo de físicas
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravedad estándar

// Cargar modelo GLTF (terreno)
const loader = new GLTFLoader();
loader.load('./assets/Free_Terrain_003.glb', (gltf) => {
  const terrain = gltf.scene;
  terrain.scale.set(16, 8, 16); // Ajusta la escala si es necesario
  terrain.position.set(0, -1, 0); // Ajusta la posición si es necesario
  scene.add(terrain);

  // Crear un cuerpo físico para el terreno
  const terrainShape = new CANNON.Box(new CANNON.Vec3(terrain.scale.x / 2, 1, terrain.scale.z / 2));
  const terrainBody = new CANNON.Body({
    mass: 0, // Masa 0 significa que es estático
    position: new CANNON.Vec3(terrain.position.x, terrain.position.y, terrain.position.z),
    shape: terrainShape
  });
  world.addBody(terrainBody);
}, undefined, (error) => {
  console.error('Error cargando el modelo GLB:', error);
});

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Crear coche del jugador
const coche = new Coche(scene, world, 0, 1000, 0);
coche.velocidad = 0.1; // Velocidad inicial

// Crear un objeto "dummy" como target de la cámara
const cameraTarget = new THREE.Object3D();
scene.add(cameraTarget);

controls.target = cameraTarget.position;
controls.enableDamping = true; // Suaviza el movimiento de la cámara
controls.dampingFactor = 0.1; // Factor de suavizado

// Controles del coche
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (event) => { keys[event.key] = true; });
window.addEventListener('keyup', (event) => { keys[event.key] = false; });

camera.position.z = 5;
camera.position.y = 3;

// Bucle de animación
function animate() {
  requestAnimationFrame(animate);

  // Controles de movimiento
  if (keys.w) coche.mover(true);
  if (keys.s) coche.mover(false);
  if (keys.a) coche.girar(1);
  if (keys.d) coche.girar(-1);

  // Seguir al coche con la cámara
  const offset = new THREE.Vector3(0, 3, -5); // Altura y distancia detrás del coche
  offset.applyEuler(new THREE.Euler(0, coche.angulo, 0, 'XYZ')); // Rotar según dirección del coche
  camera.position.copy(coche.group.position.clone().add(offset));
  camera.lookAt(coche.group.position);

  // Actualizar la física del coche y otros objetos
  updatePhysics();

  // Actualizar el target de la cámara a la posición del coche
  cameraTarget.position.copy(coche.group.position);

  controls.update();
  renderer.render(scene, camera);
}

// Función para actualizar la física del coche
function updatePhysics() {
  world.step(1 / 60); // Pasar 1/60 por cada frame
  coche.group.position.copy(coche.cuerpo.position);
  coche.group.rotation.setFromQuaternion(coche.cuerpo.quaternion);
}

animate();

// Ajustar vista al redimensionar
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});