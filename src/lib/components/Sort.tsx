const attributeMap = {
  0: {
    viewBox: '0 0 21 9',
    width: 21,
    height: 9,
    d: 'M14.5 5l-4 4-4-4zM14.5 4l-4-4-4 4z'
  },
  1: {
    viewBox: '0 0 21 4',
    width: 21,
    height: 4,
    d: 'M6.5 4l4-4 4 4z'
  },
  2: {
    viewBox: '0 0 21 4',
    width: 21,
    height: 4,
    d: 'M14.5 0l-4 4-4-4z'
  },
} as const;

interface SortProps {
  /**
   * 0/undefined = bidirectional
   * 1 = up
   * 2 = down
   */
  direction?: number;
  className?: string;
  onClick?: () => void;
}

export const Sort = (props: SortProps) => {
  const key = props.direction || 0;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...attributeMap[key]} d={undefined} className={props.className} onClick={props.onClick}>
      <g fill="#cbd9f4">
        <path d={attributeMap[key].d} />
      </g>
    </svg>
  )
}