import {useState, useEffect, useRef} from 'react';
import {FileText, GitHub, Linkedin, MapPin, ArrowRight} from 'react-feather';
import {mountainData} from './mountainData';
import {Renderer} from './renderer';
import {Scene} from './scene';
import {Button} from './Button';
import {Link} from './Link';

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
      timeoutIdRef.current = window.setTimeout(updateMountain, 30000);
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
      <div className='w-full h-full max-w-6xl p-8 mx-auto'>
        <div className='w-full h-full relative'>
          <div className='absolute top-0 left-0'>
            <span className='font-sans font-semibold text-3xl align-text-bottom inline-block mb-2 mr-3'>Arti Schmidt</span>
            <span className='font-mono text-xl align-text-bottom inline-block mb-2'>// Software Engineer</span>
            <br />
            <span className='font-sans text-base'>
              {[
                "Hi, I'm studying computer science at Princeton University.",
                "I'm passionate about building things with code.",
                "I'm especially interested in web apps, games, machine learning, and robotics.",
                "I love the outdoors; these are some of my favorite mountains.",
              ].map((line, i) => (
                <div key={i}>
                  <span className='opacity-100 whitespace-pre'>&gt;  </span>
                  <span className='opacity-75'>{line}</span>
                </div>
              ))}
            </span>
          </div>
          <div className='absolute bottom-0 left-0 flex flex-col gap-4'>
            <Link url='/resume.pdf'>
              <Button
                text='Resume'
                icon={FileText}
                iconPosition='left'
              />
            </Link>
            <Link url='https://github.com/arcturus3'>
              <Button
                text='GitHub'
                icon={GitHub}
                iconPosition='left'
              />
            </Link>
            <Link url='https://www.linkedin.com/in/artischmidt'>
              <Button
                text='LinkedIn'
                icon={Linkedin}
                iconPosition='left'
              />
            </Link>
          </div>
          <div className='absolute bottom-0 right-0 flex flex-col gap-4 items-end'>
            <Link url={
              `https://www.google.com/maps/@` +
              `?api=1&map_action=map&basemap=terrain&zoom=15` +
              `&center=${mountainData[mountainIndex].coords[0]}%2c${mountainData[mountainIndex].coords[1]}`
            }>
              <Button
                text={mountainData[mountainIndex].name}
                icon={MapPin}
                iconPosition='right'
              />
            </Link>
            <Button
              onClick={updateMountain}
              text='Next'
              icon={ArrowRight}
              iconPosition='right'
            />
          </div>
        </div>
      </div>
    </>
  );
};
