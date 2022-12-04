import * as three from 'three';
import { getElevationMap } from './elevation';

const getHeightMap = async (): Promise<three.Texture> => {
  const lonePeak = {
    latitude: 45.278056,
    longitude: -111.450278,
  };
  const radius = 500;
  const resolution = 35;
  const elevationMap = await getElevationMap(lonePeak, radius, resolution);
  const size = elevationMap.length;

  const flatElevations = elevationMap.flat();
  const minElevation = Math.min(...flatElevations);
  const maxElevation = Math.max(...flatElevations);
  const normalizedElevations = flatElevations.map(elevation => (
    (elevation - minElevation) / (maxElevation - minElevation) * 255
  ));

  const data = new Uint8Array(4 * size ** 2);
  for (let i = 0; i < size ** 2; i++) {
    const stride = i * 4;
    data[stride] = normalizedElevations[i];
    data[stride + 1] = normalizedElevations[i];
    data[stride + 2] = normalizedElevations[i];
    data[stride + 3] = 255;
  }
  const texture = new three.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
};

const scene = new three.Scene();
const camera = new three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new three.WebGLRenderer({
  antialias: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new three.PlaneGeometry(4, 4, 25, 25);
const material = new three.MeshStandardMaterial({
  // wireframe: true,
  displacementMap: await getHeightMap(),
  displacementScale: 2,
});
const plane = new three.Mesh(geometry, material);
scene.add(plane);

const light = new three.PointLight();
light.position.set(0, 10, 0);
scene.add(light);

// const heightMap = await getHeightMap();

// const base = new three.Mesh(
//   new three.PlaneGeometry(4, 4, 1, 1),
//   new three.MeshBasicMaterial({map: heightMap}),
// );

// scene.add(base);

// console.log(geometry.attributes);

plane.rotateX(-Math.PI / 4);
camera.position.z = 5;


const animate = () => {
  requestAnimationFrame(animate);
  plane.rotateZ(0.005);
  renderer.render(scene, camera);
};

animate();


