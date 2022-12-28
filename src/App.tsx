import {useState, useEffect, useRef, ReactNode} from 'react';
import {FileText, GitHub, Linkedin, MapPin, ArrowRight} from 'react-feather';
import classNames from 'classnames';
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
    <div>
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
        <Link
          url='/resume.pdf'
          text='Resume'
          icon={<FileText />}
          iconPosition='left'
        />
        <Link
          url='https://github.com/arcturus3'
          text='GitHub'
          icon={<GitHub />}
          iconPosition='left'
        />
        <Link
          url='https://www.linkedin.com/in/artischmidt'
          text='LinkedIn'
          icon={<Linkedin />}
          iconPosition='left'
        />
      </div>
      <div className='fixed right-8 bottom-8 flex flex-col gap-5 items-end'>
        <ArrowRight
          className='cursor-pointer'
          onClick={updateMountain}
        />
        <Link
          url={
            `https://www.google.com/maps/@` +
            `?api=1&map_action=map&basemap=terrain&zoom=15` +
            `&center=${mountainData[mountainIndex].coords[0]}%2c${mountainData[mountainIndex].coords[1]}`
          }
          text={mountainData[mountainIndex].name}
          icon={<MapPin />}
          iconPosition='right'
        />
      </div>
    </div>
  );
};

type LinkProps = {
  url: string,
  text: string,
  icon: ReactNode,
  iconPosition: 'left' | 'right',
};

const Link = (props: LinkProps) => {
  return (
    <a
      className={classNames(
        'flex',
        'gap-3',
        props.iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse',
      )}
      href={props.url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {props.icon}
      <span className='font-mono text-lg leading-none'>{props.text}</span>
    </a>
  );
};
