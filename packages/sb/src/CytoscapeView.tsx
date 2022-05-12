import React from 'react';
import cytoscape, { ElementDefinition } from 'cytoscape';
import { createUseStyles } from 'react-jss';
import { asserts } from '../../ts/src/lib/helpers';

interface Props {
  elements: ElementDefinition[];
}

const useStyles = createUseStyles({
  container: {
    height: '100vh'
  }
});

export default function CytoscapeView({ elements }: Props) {
  const classes = useStyles();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(
    () => {
      asserts(containerRef.current !== null, 'The component should have been initialized!');
      cytoscape({
        container: containerRef.current,
        elements,
        layout: {
          name: 'breadthfirst'
        },
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(name)'
            }
          }
        ]
      });
    },
    []
  );

  return (
    <div ref={ containerRef } className={ classes.container } />
  );
}
