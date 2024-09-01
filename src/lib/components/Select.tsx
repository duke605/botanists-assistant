import ReactSelect, { CSSObjectWithLabel, StylesConfig } from 'react-select';
import selectBg from '@assets/selectMiddle.png';
import caret from '@assets/carot.png';

const common: CSSObjectWithLabel = {
  color: '#aed0e0',
  fontSize: '12px',
};

const styles: StylesConfig = {
  menu: (styles) => ({
    ...styles,
    background: `rgba(${0x08}, ${0x15}, ${0x1c}, 0.9)`,
    border: '1px solid #313f46',
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    background: 'red',
  }),
  control: (styles) => ({
    ...styles,
    ...common,
    backgroundImage: `url(${selectBg})`,
    height: '22px',
    paddingLeft: '3px',
    minHeight: 0,
    flexWrap: 'nowrap'
  }),
  option: (styles, { isFocused }) => {
    // const color = chroma(data.color);
    return {
      ...styles,
      background: isFocused ? '#00527a' : 'transparent',
      display: 'flex',
      justifyContent: 'start',
      alignItems: 'center',
      gap: '5px',
      padding: '3px',
    };
  },
  input: (styles) => ({
    ...styles,
    ...common,
  }),
  placeholder: (styles) => ({
    ...styles,
    color: `rgba(${0xae}, ${0xd0}, ${0xe0}, 0.8)`,
  }),
  singleValue: (styles) => ({
    ...styles,
    ...common,
    padding: 0,
    color: '#aed0e0',
    margin: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',
    gap: '5px',
  }),
};

const components = {
  DropdownIndicator: () => <img style={{padding: '0 8px'}} src={caret} />
};

export const Select = (props: Omit<Parameters<ReactSelect>[0], 'styles'>) => {
  return (
    <ReactSelect components={components} {...props} styles={styles} />
  );
};