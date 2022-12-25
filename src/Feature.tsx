import {useState, useEffect, useRef} from 'react';
import {Info, ArrowRight} from 'react-feather';
import Chance from 'chance';
import {Renderer} from './renderer';
import {Scene} from './scene';
import {Mountain, mountainData} from './mountainData';

export const Feature = () => {
  const shuffledDataRef = useRef<Mountain[]>();
  const sceneRef = useRef<Scene>();
  const rootRef = useRef<HTMLDivElement>(null);
  const [mountainIndex, setMountainIndex] = useState(0);

  useEffect(() => {
    const chance = new Chance();
    shuffledDataRef.current = chance.shuffle(mountainData);
    shuffledDataRef.current = mountainData;
    const scene = new Scene(shuffledDataRef.current[mountainIndex].heightmap);
    sceneRef.current = scene;
    const renderer = new Renderer(scene);
    window.addEventListener('resize', renderer.handleResize);
    rootRef.current!.appendChild(renderer.getRenderTarget());
    renderer.render();
  }, []);

  useEffect(() => {
    sceneRef.current!.handleHeightmapChange(shuffledDataRef.current[mountainIndex].heightmap);
  }, [mountainIndex]);

  return (
    <>
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
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 40,
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
      }}>
        <Info size={20} />
        <div>
          <div style={{
            fontFamily: '"Courier Prime", monospace',
            textAlign: 'center'
          }}>
            {shuffledDataRef.current?.[mountainIndex].name}
          </div>
          <div style={{
            fontFamily: '"Courier Prime", monospace',
            fontSize: 12,
            textAlign: 'center',
          }}>
            {shuffledDataRef.current?.[mountainIndex].elevation} m
          </div>
        </div>
        <ArrowRight size={20} onClick={() => {
          setMountainIndex(prev => (prev + 1) % shuffledDataRef.current!.length);
          console.log(mountainIndex);
        }} />
      </div>
    </>
  );
};
