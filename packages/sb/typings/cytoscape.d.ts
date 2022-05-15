import { CytoscapeOptions as DefaultCytoscapeOptions, LayoutOptions as DefaultLayoutOptions } from 'cytoscape';

declare module 'cytoscape' {
  export = cytoscape;
  declare function cytoscape(options?: cytoscape.CytoscapeOptions): cytoscape.Core;

  namespace cytoscape {
    interface KlayLayoutOptions {
      name: 'klay';
      nodeDimensionsIncludeLabels: boolean;
      klay: Partial<{
        direction: 'UP';
        layoutHierarchy: boolean;
        nodeLayering: 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'INTERACTIVE';
        nodePlacement: 'BRANDES_KOEPF' | 'LINEAR_SEGMENTS' | 'INTERACTIVE' | 'SIMPLE';
      }>
    }

    type LayoutOptions = DefaultLayoutOptions | KlayLayoutOptions;

    interface CytoscapeOptions extends DefaultCytoscapeOptions {
      layout?: LayoutOptions | undefined;
    }
  }
}
