import React, { Component } from 'react';
import { AggregateConfig, Table, ViewConfig,  } from '@jpmorganchase/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';


/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement {
  load: (table: Table) => void,
}

/**
 * Schema declaration Interface
 */
interface SchemaServerRespond {
  stock: String,
  top_ask_price: Number,
  top_bid_price: Number,
  timestamp: Date,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem: PerspectiveViewerElement = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      const elemDom: HTMLElement = elem as unknown as HTMLElement;
      elemDom.setAttribute("view", "xy_line");
      elemDom.setAttribute("column-pivots", `["stock"]`);
      elemDom.setAttribute("sort", `["timestamp"]`);
      elemDom.setAttribute("columns", `["timestamp","top_ask_price"]`);
      elemDom.setAttribute("aggregates", `{"stock":"distinct count","top_ask_price":"avg","top_bid_price":"avg","timestamp":"distinct count"}`);

      // Add more Perspective configurations here.
      const viewConfig: ViewConfig = {
        column_pivot: ["stock"],
        row_pivot: [],
        sort: ["timestamp"],
        aggregate: [ 
          { column: "stock", op: "distinct count" } as AggregateConfig,
          { column: "top_ask_price", op: "avg" } as AggregateConfig,
          { column: "top_bid_price", op: "avg" } as AggregateConfig,
          { column: "timestamp", op: "distinct count" } as AggregateConfig,
        ]

      };

      const tableView = this.table.view(viewConfig);

      elem.load(this.table);
    }
  }

  async componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      const uniqueElements = await this.getUniqueElements(this.props.data);
      this.table.update(uniqueElements);

    }
  }

  async getUniqueElements(data: ServerRespond[])
  {

    let dataNotRepeated: ServerRespond[] = [];

    // filter array from repeteaded
    for (let i = 0; i < data.length; i++) {

      let elementRepeated = false;
      for (let j = 0; j < data.length; j++) {
        if (i === j) continue;
        if (data[i].timestamp === data[j].timestamp &&
          data[i].stock === data[j].stock
        ) {
          elementRepeated = true;
          break;
        }
      }

      if (elementRepeated === false) {

        // Format the data from ServerRespond to the schema
        const elementServerRespond: SchemaServerRespond = {
          stock: data[i].stock,
          top_ask_price: data[i].top_ask && data[i].top_ask.price || 0,
          top_bid_price: data[i].top_bid && data[i].top_bid.price || 0,
          timestamp: data[i].timestamp
        };

        dataNotRepeated.push(elementServerRespond as unknown as ServerRespond);

      }
    }

    return dataNotRepeated;

  }


}

export default Graph;
