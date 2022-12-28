import * as THREE from 'three';
import Chance from 'chance';
import {Heightmap} from './heightmap';

export class Scene extends THREE.Scene {
  terrainGroup!: THREE.Group;
  pointsGeometry!: THREE.BufferGeometry;
  meshGeometry!: THREE.BufferGeometry;

  // maintain start and end geometries for morphing
  // interpolating heightmap and heights at each step is rather slow
  originPointsGeometry!: THREE.BufferGeometry;
  targetPointsGeometry!: THREE.BufferGeometry;
  originMeshGeometry!: THREE.BufferGeometry;
  targetMeshGeometry!: THREE.BufferGeometry;
  morphFactor = 1;

  pointCount = 25000;
  meshSize = 99; // one less than heightmap size for exact vertex positions
  rotationTimeSeconds = 60;
  morphTimeSeconds = 2;

  constructor() {
    super();
    this.generateMeshGeometry();
    this.generatePointsGeometry();
    this.buildScene();
  }

  buildScene() {
    const loader = new THREE.TextureLoader();
    const alphaMap = loader.load('/alpha_map.png');
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      size: 0.001,
    });
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaMap: alphaMap,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    // to prevent underside of terrain showing due to transparent edges
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0x101010,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 1,
    });

    const terrainGroup = new THREE.Group();
    terrainGroup.add(new THREE.Points(this.pointsGeometry, pointsMaterial));
    terrainGroup.add(new THREE.Mesh(this.meshGeometry, terrainMaterial));
    terrainGroup.add(new THREE.Mesh(this.meshGeometry, coverMaterial));
    this.add(terrainGroup);
    this.terrainGroup = terrainGroup;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(2, 1, 0);
    this.add(ambientLight, directionalLight);
  }

  generateMeshGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2, this.meshSize, this.meshSize);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.5, 0);
    this.meshGeometry = geometry;
  }

  generatePointsGeometry() {
    const chance = new Chance();
    const buffer = new Float32Array(this.pointCount * 3);
    const vertices = new THREE.BufferAttribute(buffer, 3);
    let i = 0;
    while (i < this.pointCount) {
      const x = chance.normal({dev: 0.33});
      const z = chance.normal({dev: 0.33});
      if (Math.hypot(x, z) > 1) {
        continue;
      }
      vertices.setXYZ(i, x, -0.5, z);
      i++;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', vertices);
    this.pointsGeometry = geometry;
  }

  applyHeightmap(heightmap: Heightmap, geometry: THREE.BufferGeometry) {
    const maxHeight = heightmap.getHeight(0, 0);
    const vertices = geometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getZ(i);
      const y = heightmap.getHeight(x, z) - maxHeight;
      vertices.setY(i, y);
    }
    vertices.needsUpdate = true;
  }

  setHeightmap(heightmap: Heightmap) {
    if (this.morphFactor < 1) {
      return false;
    }
    this.morphFactor = 0;
    this.originPointsGeometry = this.pointsGeometry.clone();
    this.targetPointsGeometry = this.pointsGeometry.clone();
    this.originMeshGeometry = this.meshGeometry.clone();
    this.targetMeshGeometry = this.meshGeometry.clone();
    this.applyHeightmap(heightmap, this.targetPointsGeometry);
    this.applyHeightmap(heightmap, this.targetMeshGeometry);
    return true;
  }

  lerpVertices(out: THREE.BufferGeometry, origin: THREE.BufferGeometry, target: THREE.BufferGeometry, factor: number) {
    const outVertices = out.getAttribute('position');
    const originVertices = origin.getAttribute('position');
    const targetVertices = target.getAttribute('position');
    for (let i = 0; i < outVertices.count; i++) {
      outVertices.setX(i, THREE.MathUtils.lerp(originVertices.getX(i), targetVertices.getX(i), factor));
      outVertices.setY(i, THREE.MathUtils.lerp(originVertices.getY(i), targetVertices.getY(i), factor));
      outVertices.setZ(i, THREE.MathUtils.lerp(originVertices.getZ(i), targetVertices.getZ(i), factor));
    }
    outVertices.needsUpdate = true;
  }

  update(deltaSeconds: number) {
    const angle = 2 * Math.PI * deltaSeconds / this.rotationTimeSeconds;
    this.terrainGroup.rotateY(angle);

    if (this.morphFactor < 1) {
      this.morphFactor += deltaSeconds / this.morphTimeSeconds;
      this.morphFactor = Math.min(1, this.morphFactor);
      const smoothedFactor = THREE.MathUtils.smootherstep(this.morphFactor, 0, 1);
      this.lerpVertices(this.pointsGeometry, this.originPointsGeometry, this.targetPointsGeometry, smoothedFactor);
      this.lerpVertices(this.meshGeometry, this.originMeshGeometry, this.targetMeshGeometry, smoothedFactor);
      this.meshGeometry.computeVertexNormals();
      this.meshGeometry.normalizeNormals();
    }
  }
}
