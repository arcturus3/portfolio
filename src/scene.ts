import * as THREE from 'three';
import Chance from 'chance';

export class Scene extends THREE.Scene {
  camera!: THREE.PerspectiveCamera;
  terrain!: THREE.Object3D;
  secondsPerRotation = 60;

  constructor(heightmap: Float32Array) {
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

  // need to prevent underside of mesh from showing, maybe drop at edges
  // need to fix bright highlights on mesh
  // investigate downsides to (large) polygon offset
  // render order versus polygon offset
  buildTerrain(heightmap: Float32Array) {
    const loader = new THREE.TextureLoader();
    const alphaMap = loader.load('/alpha_map.png');

    const terrainGeometry = this.buildTerrainGeometry(heightmap);
    const pointsGeometry = this.buildPointsGeometry(heightmap);

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      alphaMap: alphaMap,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.5,
      size: 0.5,
    });
    // to prevent underside of terrain showing due to transparent edges
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 1,
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    const cover = new THREE.Mesh(terrainGeometry, coverMaterial);

    const group = new THREE.Group();
    group.add(terrain);
    group.add(points);
    group.add(cover);
    this.add(group);
    this.terrain = group;
  }

  getY(heightmap: Float32Array, x: number, z: number) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const center = (size - 1) / 2;
    if (Math.hypot(x, z) > center) {
      return -1;
    }
    const i = Math.round(x + center);
    const j = Math.round(z + center);
    return heightmap[j * size + i];
  }

  buildPointsGeometry(heightmap: Float32Array) {
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
    geometry.scale(3, 3, 3);
    return geometry;
  }

  buildTerrainGeometry(heightmap: Float32Array) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const terrainGeometry = new THREE.PlaneGeometry(size - 1, size - 1, size - 1, size - 1);
    terrainGeometry.rotateX(-Math.PI / 2);
    const vertices = terrainGeometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      vertices.setY(i, heightmap[i]);
    }
    terrainGeometry.computeVertexNormals();
    terrainGeometry.normalizeNormals();
    terrainGeometry.scale(3, 3, 3);
    vertices.needsUpdate = true;
    return terrainGeometry;
  }

  getCamera() {
    return this.camera;
  }

  update(timeDelta: number) {
    const angle = 2 * Math.PI * timeDelta / this.secondsPerRotation
    this.terrain.rotateY(angle);
  }

  handleHeightmapChange(heightmap: Float32Array) {
    this.remove(this.terrain);
    this.buildTerrain(heightmap);
  }
}
