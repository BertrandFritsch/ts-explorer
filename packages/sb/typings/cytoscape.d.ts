import { CytoscapeOptions as DefaultCytoscapeOptions, LayoutOptions as DefaultLayoutOptions } from 'cytoscape';

declare module 'cytoscape' {
  export = cytoscape;
  declare function cytoscape(options?: cytoscape.CytoscapeOptions): cytoscape.Core;

  namespace cytoscape {
    interface KlayLayoutOptions {
      name: 'klay';
      nodeDimensionsIncludeLabels: boolean;
      klay: {
        direction: 'UP'
      }
    }

    type LayoutOptions = DefaultLayoutOptions | KlayLayoutOptions;

    interface CytoscapeOptions extends DefaultCytoscapeOptions {
      layout?: LayoutOptions | undefined;
    }
  }
}
