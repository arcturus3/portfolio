import * as THREE from 'three';
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper';

export class Scene extends THREE.Scene {
  camera!: THREE.PerspectiveCamera;
  terrain!: THREE.Mesh;
  secondsPerRotation = 60;

  constructor(heightmap) {
    super();
    this.buildCamera();
    this.buildLights();
    this.buildTerrain(heightmap);
  }

  buildCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 10000);
    this.camera.position.y = 50;
    this.camera.position.z = 100;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  buildLights() {
    const light = new THREE.PointLight();
    light.intensity = 2;
    light.position.x = 100;
    light.position.y = 100;
    this.add(light);
  }

  buildTerrain(heightmap) {
    const terrainGeometry = this.buildTerrainGeometry(heightmap);
    const linesGeometry = new THREE.WireframeGeometry(terrainGeometry);

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x101010,
      polygonOffset: true,
      polygonOffsetFactor: 10,
      polygonOffsetUnits: 1,
    });
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.02,
    });
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      size: 0.25,
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    const points = new THREE.Points(terrainGeometry, pointsMaterial);

    points.renderOrder = 0;
    lines.renderOrder = 1;
    // const normals = new VertexNormalsHelper(terrain);
    // scene.add(normals);

    terrain.add(lines);
    terrain.add(points);
    this.add(terrain);
    this.terrain = terrain;
  }

  buildTerrainGeometry(heightmap) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const terrainGeometry = new THREE.PlaneGeometry(size - 1, size - 1, size - 1, size - 1);
    terrainGeometry.rotateX(-Math.PI / 2);
    const vertices = terrainGeometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      vertices.setY(i, heightmap[i]);
    }
    terrainGeometry.computeVertexNormals();
    terrainGeometry.normalizeNormals();
    // vertices.needsUpdate = true;
    return terrainGeometry;
  }

  getCamera() {
    return this.camera;
  }

  update(timeDelta: number) {
    const angle = 2 * Math.PI * timeDelta / this.secondsPerRotation
    this.terrain.rotateY(angle);
  }
}
