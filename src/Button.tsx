import classNames from 'classnames';
import {Icon} from 'react-feather';

type ButtonProps = {
  onClick?: () => void,
  text: string,
  icon: Icon,
  iconPosition: 'left' | 'right',
};

export const Button = (props: ButtonProps) => {
  return (
    <button
      className={classNames(
        'flex',
        'gap-3',
        'items-center',
        props.iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse',
      )}
      onClick={props.onClick}
    >
      <>
        <props.icon />
        <span className='
          font-mono text-lg opacity-75 mt-0.5 max-[420px]:max-w-[100px]
          whitespace-nowrap overflow-clip text-ellipsis
        '>
          {props.text}
        </span>
      </>
    </button>
  );
};
