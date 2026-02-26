declare module 'react-plotly.js' {
  import { Component } from 'react';
  
  interface PlotParams {
    data: any[];
    layout?: any;
    frames?: any[];
    config?: any;
    style?: any;
    className?: string;
    useResizeHandler?: boolean;
    debug?: boolean;
    onClick?: (data: any) => void;
    onHover?: (data: any) => void;
    onUnhover?: (data: any) => void;
    onSelected?: (data: any) => void;
    onDeselect?: (data: any) => void;
    onRelayout?: (data: any) => void;
    onRelayouting?: (data: any) => void;
    onRestyle?: (data: any) => void;
    revision?: number;
    transition?: any;
  }
  
  export default class Plot extends Component<PlotParams> {}
}
