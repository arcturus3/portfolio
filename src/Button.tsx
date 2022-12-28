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
        props.iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse',
      )}
      onClick={props.onClick}
    >
      <>
        <props.icon />
        <span className='font-mono text-lg opacity-75'>{props.text}</span>
      </>
    </button>
  );
};
