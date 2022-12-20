import {FileText, GitHub, Linkedin, ArrowRight, Info} from 'react-feather';
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
            Jungfrau
          </div>
          <div style={{
            fontFamily: '"Courier Prime", monospace',
            fontSize: 12,
            textAlign: 'center',
          }}>
            4602 m
          </div>
        </div>
        <ArrowRight size={20} />
      </div>
    </>
  );
};
