import React from 'react'
import cytoscape, { ElementDefinition } from 'cytoscape'
import klay from 'cytoscape-klay'
import { createUseStyles } from 'react-jss'
import { asserts } from '../../ts/src/lib/helpers'

cytoscape.use(klay)

interface Props {
  elements: ElementDefinition[]
}

const useStyles = createUseStyles({
  container: {
    height: '100vh',
  },
})

export default function CytoscapeView({ elements }: Props) {
  const classes = useStyles()
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    asserts(containerRef.current !== null, 'The component should have been initialized!')
    cytoscape({
      container: containerRef.current,
      elements,
      layout: {
        name: 'klay',
        nodeDimensionsIncludeLabels: true,
        klay: {
          direction: 'UP',
          nodeLayering: 'LONGEST_PATH',
          nodePlacement: 'LINEAR_SEGMENTS',
        },
      },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(name)',
            'font-size': '10px',
            'background-color': '#767676',
          },
        },
        {
          selector: 'node[?highlight]',
          style: {
            label: 'data(name)',
            'background-color': '#c71919',
          },
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'line-color': '#767676',
            'target-arrow-color': '#767676',
            width: '1px',
          },
        },
        {
          selector: 'edge[?highlight]',
          style: {
            'line-color': '#c71919',
            'target-arrow-color': '#c71919',
            width: '2px',
          },
        },
      ],
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className={classes.container}
    />
  )
}
