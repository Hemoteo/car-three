import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Coche {
  constructor(scene, world, x = 0, y = 0, z = 0) {
    this.scene = scene;
    this.world = world; // Guarda el mundo de física
    this.group = new THREE.Group();

    // Crear la carrocería
    const cuerpoGeom = new THREE.BoxGeometry(2, 0.5, 1);
    const cuerpoMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.cuerpo = new THREE.Mesh(cuerpoGeom, cuerpoMat);
    this.cuerpo.position.set(0, 0.5, 0);
    this.group.add(this.cuerpo);

    // Crear las ruedas
    const ruedaGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
    const ruedaMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    this.ruedas = [];
    const posicionesRuedas = [
      [-0.8, 0.25, 0.5], // Delantera izquierda
      [0.8, 0.25, 0.5], // Delantera derecha
      [-0.8, 0.25, -0.5], // Trasera izquierda
      [0.8, 0.25, -0.5], // Trasera derecha
    ];

    // Añadir ruedas al coche y crear los cuerpos físicos para cada una
    this.ruedasFisicas = [];
    posicionesRuedas.forEach((pos) => {
      const rueda = new THREE.Mesh(ruedaGeom, ruedaMat);
      rueda.rotation.z = Math.PI / 2;
      rueda.position.set(...pos);
      this.group.add(rueda);
      this.ruedas.push(rueda);

      // Crear cuerpo físico para cada rueda
      const ruedaFisica = new CANNON.Body({
        mass: 1, // Masa de la rueda
        position: new CANNON.Vec3(...pos), // Posición inicial de la rueda
        shape: new CANNON.Cylinder(0.25, 0.25, 0.5), // Forma de la rueda
        material: new CANNON.Material('ruedaMaterial'),
      });
      this.world.addBody(ruedaFisica);
      this.ruedasFisicas.push(ruedaFisica);
    });

    // Crear el cuerpo físico principal del coche
    this.cuerpoFisico = new CANNON.Body({
      mass: 1, // Masa del coche
      position: new CANNON.Vec3(x, y, z),
      shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), // Tamaño del coche
      material: new CANNON.Material('cocheMaterial')
    });
    this.world.addBody(this.cuerpoFisico);

    // Posicionar el coche en la escena
    this.group.position.set(x, y, z);
    this.scene.add(this.group);

    // Velocidad y dirección
    this.velocidad = 0;
    this.angulo = 0;

    const cocheMaterial = new CANNON.Material('cocheMaterial');
    const ruedaMaterial = new CANNON.Material('ruedaMaterial');

    const contacto = new CANNON.ContactMaterial(cocheMaterial, ruedaMaterial, {
      friction: 0.3, // Baja la fricción si es demasiado alta
      restitution: 0.1, // Rebote bajo
    });
    this.world.addContactMaterial(contacto);
  }

  // Actualizar la posición de la malla según la física de CANNON.js
  actualizarPosicion() {
    // Actualizar posición y rotación del coche
    this.group.position.copy(this.cuerpoFisico.position);
    this.group.rotation.setFromRotationMatrix(this.cuerpoFisico.rotation);

    // Actualizar la posición de las ruedas
    this.ruedas.forEach((rueda, index) => {
      rueda.position.copy(this.ruedasFisicas[index].position);
      rueda.rotation.setFromRotationMatrix(this.ruedasFisicas[index].rotation);
    });
  }

  // Mover el coche
  mover(adelante = true) {
    const direccion = adelante ? 1 : -1;
    const fuerza = 50000; // Fuerza aplicada al coche en cada movimiento
    const fuerzaVector = new CANNON.Vec3(
      -Math.sin(this.group.rotation.y) * fuerza * direccion,
      0,
      -Math.cos(this.group.rotation.y) * fuerza * direccion
    );

    // Aplicar fuerza en la dirección de movimiento
    const puntoAplicacion = new CANNON.Vec3(
      this.cuerpoFisico.position.x,
      this.cuerpoFisico.position.y - 0.2, // Aplica la fuerza más abajo
      this.cuerpoFisico.position.z - 0.5 // Un poco hacia atrás para mayor realismo
    );
    this.cuerpoFisico.applyForce(fuerzaVector, puntoAplicacion);

    // Hacer girar las ruedas
    this.ruedas.forEach((rueda) => {
      rueda.rotation.x -= this.velocidad * 5;
    });
  }

  // Girar el coche
  girar(direccion) {
    this.angulo += direccion * 0.05;
    this.group.rotation.y = this.angulo;
  }
}
