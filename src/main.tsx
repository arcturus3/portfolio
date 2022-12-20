import {Renderer} from './renderer';
import {Scene} from './scene';
import rawHeightmaps from '../heightmap_generator/data/result.json?raw';
import './style.css'
import {createRoot} from 'react-dom/client';
import {App} from './App';

const getHeightmap = () => {
  const heightmaps = JSON.parse(rawHeightmaps);
  const bytes = window.atob(heightmaps[4].heightmap);
  const buffer = Uint8Array.from(bytes, c => c.charCodeAt(0)).buffer;
  const array = new Float32Array(buffer);
  return array;
};

const heightmap = getHeightmap();
const scene = new Scene(heightmap);
const renderer = new Renderer(scene);
const root = document.getElementById('app')!;
root.appendChild(renderer.getRenderTarget());
renderer.render();

window.addEventListener('resize', renderer.handleResize);

const uiRoot = document.getElementById('ui-root')!;
createRoot(uiRoot).render(<App />);
