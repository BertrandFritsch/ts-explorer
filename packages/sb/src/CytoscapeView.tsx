import React from 'react';
import cytoscape, { ElementDefinition } from 'cytoscape';
import klay from 'cytoscape-klay';
import { createUseStyles } from 'react-jss';
import { asserts } from '../../ts/src/lib/helpers';

cytoscape.use(klay);

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
          name: 'klay',
          nodeDimensionsIncludeLabels: true,
          klay: {
            direction: 'UP'
          }
        },
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(name)',
              'font-size': '10px'
            }
          },
          {
            selector: 'edge',
            style: {
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'line-color': '#dd4de2',
              'target-arrow-color': '#dd4de2',
              'opacity': 0.5,
              width: '1px'
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
