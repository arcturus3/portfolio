import * as THREE from 'three';
import Chance from 'chance';
import {Heightmap} from './heightmap';

import terrainVertexShader from './terrainVertex.glsl?raw';
import terrainFragmentShader from './terrainFragment.glsl?raw';
import pointsVertexShader from './pointsVertex.glsl?raw';
import pointsFragmentShader from './pointsFragment.glsl?raw';

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

  pointCount = 200000;
  meshSize = 199; // one less than heightmap size for exact vertex positions
  rotationTimeSeconds = 60;
  morphTimeSeconds = 2;

  constructor() {
    super();
    this.generateMeshGeometry();
    this.generatePointsGeometry();
    this.buildScene();

    this.background = new THREE.Color(0x101010);
  }

  buildScene() {
    const terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
        light: {value: [1, 2, 2]},

      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader
    });

    const pointsMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
      },
      vertexShader: pointsVertexShader,
      fragmentShader: pointsFragmentShader
    });

    const terrainGroup = new THREE.Group();
    terrainGroup.add(new THREE.Points(this.pointsGeometry, pointsMaterial));
    this.meshGeometry.computeVertexNormals();
    terrainGroup.add(new THREE.Mesh(this.meshGeometry, terrainMaterial));
    this.add(terrainGroup);
    this.terrainGroup = terrainGroup;
  }

  generateMeshGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2, this.meshSize, this.meshSize);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.5, 0);
    this.meshGeometry = geometry;
  }

  generatePointsGeometry() {
    const chance = new Chance();
    const positionBuffer = new Float32Array(this.pointCount * 3);
    const position = new THREE.BufferAttribute(positionBuffer, 3);
    const opacityBuffer = new Float32Array(this.pointCount);
    const opacity = new THREE.BufferAttribute(opacityBuffer, 1);
    for (let i = 0; i < this.pointCount; i++) {
      const x = chance.floating({min: -1, max: 1});
      const z = chance.floating({min: -1, max: 1});
      position.setXYZ(i, x, -0.5, z);
      opacity.setX(i, 0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('opacity', opacity);
    this.pointsGeometry = geometry;
  }

  applyHeightmap(heightmap: Heightmap, geometry: THREE.BufferGeometry) {
    const maxHeight = heightmap.getHeight(0, 0); // approximate max height
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = heightmap.getHeight(x, z) - maxHeight;
      position.setY(i, y);
    }
    position.needsUpdate = true;
  }

  applyHeightmapOpacities(heightmap: Heightmap, points: THREE.BufferGeometry) {
    const getOpacity = (x: number, z: number) => {
      const threshold = 0.5;
      const radius = Math.min(Math.hypot(x, z), 1);
      if (radius <= threshold)
        return 1;
      else
        return 1 - THREE.MathUtils.smoothstep(radius, threshold, 1);
    };

    const getSlope = (x: number, z: number) => {
      const epsilon = 0.001;
      const a = new THREE.Vector3(epsilon, heightmap.getHeight(x + epsilon, z) - heightmap.getHeight(x, z), 0);
      const b = new THREE.Vector3(0, heightmap.getHeight(x, z + epsilon) - heightmap.getHeight(x, z), epsilon);
      const normal = new THREE.Vector3().crossVectors(b, a).normalize();
      return normal.y ** 6;
    }

    const position = points.getAttribute('position');
    const opacity = points.getAttribute('opacity');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      opacity.setX(i, getOpacity(x, z) * getSlope(x, z));
    }
    opacity.needsUpdate = true;
  }

  setHeightmap(heightmap: Heightmap) {
    if (this.morphFactor < 1) {
      return false;
    }
    this.morphFactor = 0;
    this.originMeshGeometry = this.meshGeometry.clone();
    this.targetMeshGeometry = this.meshGeometry.clone();
    this.originPointsGeometry = this.pointsGeometry.clone();
    this.targetPointsGeometry = this.pointsGeometry.clone();
    this.applyHeightmap(heightmap, this.targetMeshGeometry);
    this.applyHeightmap(heightmap, this.targetPointsGeometry);
    this.applyHeightmapOpacities(heightmap, this.targetPointsGeometry);
    return true;
  }

  lerpVertices(out: THREE.BufferGeometry, origin: THREE.BufferGeometry, target: THREE.BufferGeometry, factor: number) {
    const outPosition = out.getAttribute('position');
    const originPosition = origin.getAttribute('position');
    const targetPosition = target.getAttribute('position');
    for (let i = 0; i < outPosition.count; i++) {
      outPosition.setX(i, THREE.MathUtils.lerp(originPosition.getX(i), targetPosition.getX(i), factor));
      outPosition.setY(i, THREE.MathUtils.lerp(originPosition.getY(i), targetPosition.getY(i), factor));
      outPosition.setZ(i, THREE.MathUtils.lerp(originPosition.getZ(i), targetPosition.getZ(i), factor));
    }
    outPosition.needsUpdate = true;
  }

  lerpVerticesOpacities(out: THREE.BufferGeometry, origin: THREE.BufferGeometry, target: THREE.BufferGeometry, factor: number) {
    const outOpacity = out.getAttribute('opacity');
    const originOpacity = origin.getAttribute('opacity');
    const targetOpacity = target.getAttribute('opacity');
    for (let i = 0; i < outOpacity.count; i++) {
      outOpacity.setX(i, THREE.MathUtils.lerp(originOpacity.getX(i), targetOpacity.getX(i), factor));
    }
    outOpacity.needsUpdate = true;
  }

  update(deltaSeconds: number) {
    const angle = 2 * Math.PI * deltaSeconds / this.rotationTimeSeconds;
    this.terrainGroup.rotateY(angle);

    if (this.morphFactor < 1) {
      this.morphFactor += deltaSeconds / this.morphTimeSeconds;
      this.morphFactor = Math.min(1, this.morphFactor);
      const smoothedFactor = THREE.MathUtils.smootherstep(this.morphFactor, 0, 1);
      this.lerpVertices(this.meshGeometry, this.originMeshGeometry, this.targetMeshGeometry, smoothedFactor);
      this.lerpVertices(this.pointsGeometry, this.originPointsGeometry, this.targetPointsGeometry, smoothedFactor);
      this.lerpVerticesOpacities(this.pointsGeometry, this.originPointsGeometry, this.targetPointsGeometry, smoothedFactor);
      this.meshGeometry.computeVertexNormals();
      this.meshGeometry.normalizeNormals();
    }
  }
}
