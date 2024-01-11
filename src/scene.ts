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

  pointCount = 50000;
  meshSize = 199; // one less than heightmap size for exact vertex positions
  alphaMapSize = 1000;
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
    // const alphaMap = this.generateAlphaMap();
    // const pointsMaterial = new THREE.PointsMaterial({
    //   color: 0xffffff,
    //   transparent: true,
    //   opacity: 0.1,
    //   size: 0.001,
    // });
    // const terrainMaterial = new THREE.MeshStandardMaterial({
      // color: 0xffffff,
      // transparent: true,
      // alphaMap: alphaMap,
      // polygonOffset: true,
      // polygonOffsetFactor: 1,
      // polygonOffsetUnits: 1,
    // });
    // to prevent underside of terrain showing due to transparent edges
    // const coverMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x101010,
    //   polygonOffset: true,
    //   polygonOffsetFactor: 2,
    //   polygonOffsetUnits: 1,
    // });

    const terrainMaterial = new THREE.ShaderMaterial({
      // transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
        // background: {value: [1, 0, 0]},
        light: {value: [2, 2, 2]},

      },
      vertexShader: `
        varying vec3 frag_position;
        varying vec3 frag_normal;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          frag_position = vec3(position);
          frag_normal = normal;
        }
      `,
      fragmentShader: `
        uniform vec3 diffuse;
        uniform vec3 background;
        uniform vec3 light;
        varying vec3 frag_position;
        varying vec3 frag_normal;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        float get_opacity(vec3 position) {
          const float threshold = 0.5;
          float radius = clamp(length(vec2(position.x, position.z)), 0.0, 1.0);
          if (radius <= threshold)
            return 1.0;
          else
            return 1.0 - smoothstep(threshold, 1.0, radius) + mix(-2.5/255.0, 2.5/255.0, rand(vec2(position.x, position.z))); // dithering
        }

        void main() {
          // vec3 light_ray = normalize(light - frag_position);
          vec3 light_ray = normalize(vec3(2, 2, 2));
          float intensity = max(0.0, dot(frag_normal, light_ray));
          float half_lambert_intensity = pow(0.5 * intensity + 0.5, 2.0);
          // vec3 lit_diffuse = intensity * diffuse;
          // vec3 lit_diffuse = intensity * (frag_normal.y < 0.5 ? vec3(0.0, 0.0, 0.0) : diffuse);
          // vec3 lit_diffuse = half_lambert_intensity * mix(vec3(0.0, 0.0, 0.0), diffuse, frag_normal.y);
          vec3 lit_diffuse = half_lambert_intensity * (frag_normal.y < 0.75 ? 4. * background : diffuse);
          vec3 color = mix(background, lit_diffuse, get_opacity(frag_position));
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const terrainGroup = new THREE.Group();
    // terrainGroup.add(new THREE.Points(this.pointsGeometry, pointsMaterial));
    this.meshGeometry.computeVertexNormals();
    terrainGroup.add(new THREE.Mesh(this.meshGeometry, terrainMaterial));
    // terrainGroup.add(new THREE.Mesh(this.meshGeometry, coverMaterial));
    this.add(terrainGroup);
    this.terrainGroup = terrainGroup;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.025);
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
      const x = chance.normal({dev: 0.25});
      const z = chance.normal({dev: 0.25});
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

  generateAlphaMap() {
    const size = this.alphaMapSize;
    const center = (size - 1) / 2;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let value;
        if (Math.hypot(i - center, j - center) <= center) {
          value = 255;
        }
        else {
          value = 0;
        }
        const index = i * size + j;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = value;
      }
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.needsUpdate = true;
    return texture;
  }

  applyHeightmap(heightmap: Heightmap, geometry: THREE.BufferGeometry) {
    const maxHeight = heightmap.getHeight(0, 0); // approximate max height
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
