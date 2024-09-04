import React, { Children, cloneElement, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Table.module.css';

interface TableHeadProps {
  children?: ReactNode;
}

interface TableCellProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

interface TableProps {
  children?: ReactNode;
  rowHeight?: string;
  firstRowHeight?: string;
  columnWidths: string;
  style?: CSSProperties;
}

export const TableCell = (props: TableCellProps) => {
  return <span
    className={classNames(props.className, styles.cell)}
    style={props.style}
    children={props.children}
  />
}

export const TableHead = (props: TableHeadProps) => {
  return Children.map(props.children, (child, i) => !React.isValidElement(child)
    ? child
    : cloneElement(child as any, {key: child.key ?? i, className: classNames(child.props.className, styles.heading)})
  );
}

export const Table = (props: TableProps) => {
  return (
    <div className={styles.table} style={{'--height': props.rowHeight, '--first-height': props.firstRowHeight, '--col-widths': props.columnWidths, ...props.style} as any}>
      {props.children}
    </div>
  )
}