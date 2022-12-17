import * as THREE from 'three';
import Chance from 'chance';
import alphaMapUrl from '../alpha_map.png';
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
    this.camera.position.y = 75;
    this.camera.position.z = 225;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  buildLights() {
    // need to prevent bright white highlights
    const light = new THREE.PointLight();
    light.intensity = 8;
    light.position.x = 100;
    light.position.y = 100;
    this.add(light);

    const temp = new THREE.AmbientLight();
    temp.intensity = 2;
    this.add(temp);

    const light2 = new THREE.PointLight();
    light2.intensity = 10;
    light.position.y = 100;
    this.add(light2);
  }

  buildTerrain(heightmap) {
    const terrainGeometry = this.buildTerrainGeometry(heightmap);
    const linesGeometry = new THREE.WireframeGeometry(terrainGeometry);
    const pointsGeometry = this.buildPointsGeometry(heightmap);

    const loader = new THREE.TextureLoader();
    const alphaMap = loader.load(alphaMapUrl);

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      side: THREE.DoubleSide, // need to drop mesh to 0 at edges still
      polygonOffset: true,
      polygonOffsetFactor: 20,
      polygonOffsetUnits: 1,
      alphaMap: alphaMap,
      transparent: true,
      // visible: false,
    });
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
    });
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.5,
      size: 0.5,
    });
    // go under terrain to prevent alpha showing
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide, // need to drop mesh to 0 at edges still
      polygonOffset: true, // use render order instead of offset?
      polygonOffsetFactor: 40,
      polygonOffsetUnits: 1,
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    const cover = new THREE.Mesh(terrainGeometry, coverMaterial);

    points.renderOrder = 0;
    lines.renderOrder = 1;
    // const normals = new VertexNormalsHelper(terrain);
    // scene.add(normals);

    // terrain.add(lines);
    // points.rotateY(-Math.PI / 2);
    terrain.add(points);
    terrain.add(cover);
    this.add(terrain);
    this.terrain = terrain;
  }

  getY(heightmap, x, z) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const center = (size - 1) / 2;
    if (Math.hypot(x, z) > center) {
      return -1;
    }
    const i = Math.round(x + center);
    const j = Math.round(z + center);
    return heightmap[j * size + i];
  }

  buildPointsGeometry(heightmap) {
    const points = 10000;
    const chance = new Chance();
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points * 3);
    let count = 0;
    while (count < points) {
      const stride = count * 3;
      const x = chance.normal({dev: 50});
      const z = chance.normal({dev: 50});
      const y = this.getY(heightmap, x, z);
      if (y == -1) {
        continue;
      }
      vertices[stride] = x;
      vertices[stride + 1] = y;
      vertices[stride + 2] = z;
      count++;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
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
