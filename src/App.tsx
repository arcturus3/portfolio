import {FileText, GitHub, Linkedin} from 'react-feather';
import {Feature} from './Feature';

export const App = () => {
  return (
    <>
      <Feature />
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
          Hi, I'm studying computer science at Princeton University.
          <br />
          <div style={{height: 4}} />
          These are my favorite mountains I've hiked or skied, just for fun.
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
    </>
  );
};
