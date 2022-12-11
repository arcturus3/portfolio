import {Renderer} from './renderer';
import {Scene} from './scene';
import rawHeightmaps from '../heightmap_generator/data/result.json?raw';
import './style.css'

const getHeightmap = () => {
  const heightmaps = JSON.parse(rawHeightmaps);
  const bytes = window.atob(heightmaps[0].heightmap);
  const array = Uint8Array.from(bytes, c => c.charCodeAt(0));
  // const array = Float32Array.from(bytes, c => c.charCodeAt(0));
  return array;
};

const heightmap = getHeightmap();
console.log(heightmap);
const scene = new Scene(heightmap);
const renderer = new Renderer(scene);
const root = document.getElementById('app')!;
root.appendChild(renderer.getRenderTarget());
renderer.start();
