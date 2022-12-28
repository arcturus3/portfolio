import {ReactNode} from 'react';

type LinkProps = {
  url: string,
  children: ReactNode,
};

export const Link = (props: LinkProps) => {
  return (
    <a
      href={props.url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {props.children}
    </a>
  );
};
