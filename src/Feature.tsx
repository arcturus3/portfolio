import {useEffect, useRef} from 'react';
import {Renderer} from './renderer';
import {Scene} from './scene';
import rawMountainData from '../heightmap_generator/data/result.json?raw';

type Mountain = {
  id: string,
  name: string,
  coords: [number, number],
  elevation: number,
  radius: number,
  heightmap: string,
};

const getMountainData = () => {
  const mountainData: Mountain[] = JSON.parse(rawMountainData);
  return mountainData.map(mountain => {
    const bytes = window.atob(mountain.heightmap);
    const buffer = Uint8Array.from(bytes, c => c.charCodeAt(0)).buffer;
    const array = new Float32Array(buffer);
    return {
      ...mountain,
      heightmap: array
    };
  });
};

export const Feature = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountainData = getMountainData();
    const scene = new Scene(mountainData[4].heightmap);
    const renderer = new Renderer(scene);
    window.addEventListener('resize', renderer.handleResize);
    rootRef.current!.appendChild(renderer.getRenderTarget());
    renderer.render();
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    />
  );
};
