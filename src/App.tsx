import {useState, useEffect, useRef} from 'react';
import {FileText, GitHub, Linkedin, MapPin, ArrowRight} from 'react-feather';
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
      timeoutIdRef.current = window.setTimeout(updateMountain, 60000);
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
        className='fixed w-full h-full'
      />
      <div className='fixed left-8 top-8'>
        <span className='font-sans font-semibold text-3xl align-text-bottom'>Arti Schmidt</span>
        <span className='font-mono text-2xl align-text-bottom'> // Software Engineer</span>
        <br />
        <br />
        <span className='font-sans text-base'>
          <span className='font-mono'>&gt; </span>Hi, I'm studying computer science at Princeton University.
          <br />
          <span className='font-mono'>&gt; </span>These are some mountains I've hiked or skied, just for fun.
        </span>
      </div>
      <div className='fixed left-8 bottom-8 flex flex-col gap-5'>
        <a
          href='/resume.pdf'
          target='_blank'
          rel='noopener noreferrer'
        >
          <FileText />
        </a>
        <a
          href='https://github.com/arcturus3'
          target='_blank'
          rel='noopener noreferrer'
        >
          <GitHub />
        </a>
        <a
          href='https://www.linkedin.com/in/artischmidt'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Linkedin />
        </a>
      </div>
      <div className='fixed left-1/2 bottom-8 -translate-x-1/2 font-mono text-center flex flex-row'>
        <a
          href={
            `https://www.google.com/maps/@` +
            `?api=1&map_action=map&basemap=terrain&zoom=15` +
            `&center=${mountainData[mountainIndex].coords[0]}%2c${mountainData[mountainIndex].coords[1]}`
          }
          target='_blank'
          rel='noopener noreferrer'
        >
          <MapPin />
        </a>
        <div className='w-52'>
          <span className='text-lg'>
            {mountainData[mountainIndex].name}
          </span>
          <br />
          <span className='text-base'>
            {mountainData[mountainIndex].elevation} m
          </span>
        </div>
        <ArrowRight
          className='cursor-pointer'
          onClick={updateMountain}
        />
      </div>
    </>
  );
};
