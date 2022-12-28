import {useState, useEffect, useRef} from 'react';
import {FileText, GitHub, Linkedin, ArrowRight} from 'react-feather';
import {mountainData} from './mountainData';
import {Renderer} from './renderer';
import {Scene} from './scene';

export const App = () => {
  const [mountainIndex, setMountainIndex] = useState(0);
  const mountainIndexRef = useRef(mountainIndex); // to prevent stale callbacks
  mountainIndexRef.current = mountainIndex;
  const sceneRef = useRef<Scene>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutIdRef = useRef<number>();

  const updateMountain = () => {
    const nextIndex = (mountainIndexRef.current + 1) % mountainData.length;
    const nextHeightmap = mountainData[nextIndex].heightmap;
    const success = sceneRef.current!.setHeightmap(nextHeightmap);
    if (success) {
      setMountainIndex(nextIndex);
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = window.setTimeout(updateMountain, 10000);
    }
  };

  useEffect(() => {
    const scene = new Scene();
    sceneRef.current = scene;
    const renderer = new Renderer(canvasRef.current!, scene);
    renderer.render();
    updateMountain();
    return () => {
      window.clearTimeout(timeoutIdRef.current);
    };
  }, []);

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
        left: 20,
        top: 20,
        // writingMode: 'vertical-rl',
        // transform: 'rotate(180deg)'
      }}>
        <span style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 24,
          fontWeight: 600
        }}>Arti Schmidt</span>
        <span style={{
          fontFamily: '"Courier Prime", monospace',
          fontSize: 20,
          whiteSpace: 'pre',
          position: 'relative',
          bottom: 4,
        }}> // Software Engineer</span>
        <br />
        <br />
        <span style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 14,
          fontWeight: 400,
        }}>
          <span style={{fontFamily: '"Courier Prime", monospace',}}>&gt; </span>Hi, I'm studying computer science at Princeton University.
          <br />
          <div style={{height: 4}} />
          <span style={{fontFamily: '"Courier Prime", monospace',}}>&gt; </span>These are some mountains I've hiked or skied, just for fun.
        </span>
      </div>
      <div style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <a href="/resume.pdf">
          <FileText />
        </a>
        <a href="https://github.com/arcturus3">
          <GitHub />
        </a>
        <a href="https://www.linkedin.com/in/artischmidt">
          <Linkedin />
        </a>
      </div>
      <div style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
      }}>
        <ArrowRight onClick={updateMountain} />
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
          {mountainData[mountainIndex].name}
        </div>
        <div style={{
          fontSize: 14,
        }}>
          {mountainData[mountainIndex].elevation} m
        </div>
      </div>
    </>
  );
};
