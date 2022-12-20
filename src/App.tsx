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
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)'
      }}>
        <span style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 18,
          fontWeight: 600
        }}>Arti Schmidt</span>
        <span style={{
          fontFamily: '"Courier Prime", monospace',
          whiteSpace: 'pre'
        }}> // Software Engineer</span>
      </div>
      <div style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <a href="/resume.pdf">
          <FileText size={20} />
        </a>
        <a href="https://github.com/arcturus3">
          <GitHub size={20} />
        </a>
        <a href="https://www.linkedin.com/in/artischmidt">
          <Linkedin size={20} />
        </a>
      </div>
    </>
  );
};
