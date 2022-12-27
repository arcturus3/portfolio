import {useState, useEffect, useRef} from 'react';
import {ArrowRight} from 'react-feather';
import Chance from 'chance';
import {Renderer} from './renderer';
import {Scene} from './scene';
import {Mountain, mountainData} from './mountainData';
import { Heightmap } from './heightmap';

export const Feature = () => {
  const shuffledDataRef = useRef<Mountain[]>();
  const sceneRef = useRef<Scene>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mountainIndex, setMountainIndex] = useState(0);

  useEffect(() => {
    const chance = new Chance();
    shuffledDataRef.current = chance.shuffle(mountainData);
    shuffledDataRef.current = mountainData;
    const scene = new Scene();
    sceneRef.current = scene;
    const renderer = new Renderer(canvasRef.current!, scene);
    renderer.render();
  }, []);

  useEffect(() => {
    sceneRef.current!.setHeightmap(new Heightmap(shuffledDataRef.current[mountainIndex].heightmap));
  }, [mountainIndex]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
        }}
      />
      <div style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
      }}>
        <ArrowRight onClick={() => {
          setMountainIndex(prev => (prev + 1) % shuffledDataRef.current!.length);
        }} />
      </div>
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        fontFamily: '"Courier Prime", monospace',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 17,
          marginBottom: 4,
        }}>
          {shuffledDataRef.current?.[mountainIndex].name}
        </div>
        <div style={{
          fontSize: 14,
        }}>
          {shuffledDataRef.current?.[mountainIndex].elevation} m
        </div>
      </div>
    </>
  );
};
