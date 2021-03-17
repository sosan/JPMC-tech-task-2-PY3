import React, { Component } from 'react';
import DataStreamer, { ServerRespond } from './DataStreamer';
import Graph from './Graph';
import './App.css';
import { clearInterval, setInterval } from 'timers';


/**
 * State declaration for <App />
 */
interface IState {
  data: ServerRespond[],
  isRunningStreamingData: Boolean,
  textStreaming: String
}

/**
 * The parent element of the react app.
 * It renders title, button and Graph react element.
 */
class App extends Component<{}, IState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      // data saves the server responds.
      // We use this state to parse data down to the child element (Graph) as element property
      data: [],
      //control if timer should be running or not
      isRunningStreamingData: false,
      textStreaming: "Start Streaming Data"
    };

    // bind `this` to method handleserverresponses
    // this way we can use this.state
    this.handleTimer = this.handleTimer.bind(this);

    // bind `this` to method handleserverresponses
    // this way we can use this.state
    this.handleServerResponses = this.handleServerResponses.bind(this);

  }
  //timer control, definition mehh
  timer: ReturnType<typeof setInterval> | undefined;

  /**
   * Render Graph react component with state.data parse as property data
   */
  renderGraph() {
    return (<Graph data={this.state.data} />)
  }

  /**
   * When it's closed remove timer
   */
  componentWillUnmount() 
  {
    this.removeTimer();
  }


  /**
   * Get new data from server and update the state with the new data
   */
  async getDataFromServer() {
    
    let isRunning = !this.state.isRunningStreamingData;


    //controlling is on/off streaming
    this.setState({ isRunningStreamingData: isRunning });


    //update text button
    this.updateTextButton(isRunning);

    if (this.state.isRunningStreamingData === true)
    {
      this.removeTimer();
    }
    else
    {
      // begin timer from 100ms
      this.timer = await setInterval(this.handleTimer, 100);
    }

  }

  async handleTimer()
  {
    // when server python finnished to read all data
    //error getting stocks...reinitalizing app
    DataStreamer.getData(this.handleServerResponses);

  }

  removeTimer()
  {
    clearInterval(this.timer as ReturnType<typeof setInterval>);
    
    this.setState({ isRunningStreamingData: false, data: [] });
    this.updateTextButton(false);

  }

  handleServerResponses(serverResponds: ServerRespond[])
  {
    // case no data, remove timer and update state Button
    if (serverResponds === undefined) {
      this.removeTimer();
    }
    else {

      // Update the state by creating a new array of data that consists of
      // Previous data in the state and the new data from server
      let newDataRepeated: ServerRespond[] = [];
      // pushed before data to array
      newDataRepeated.push(...this.state.data);
      // pushed new data to array
      newDataRepeated.push(...serverResponds);
      this.setState({ data: newDataRepeated });
      
      // this.setState({ data: [...this.state.data, ...serverResponds] });
    }

  }

  /**
   * Update text Buttton
   * Pass parameter ?
   */
  updateTextButton(isRunningStreamingData: Boolean)
  {
    if (isRunningStreamingData === true) {
      this.setState({ textStreaming: "Stop Streaming Data" });
    }
    else {
      this.setState({ textStreaming: "Start Streaming Data" });
    }
  }

  /**
   * Render the App react component
   */
  render() {
    return (
      <div className="App">
        <header className="App-header">
          Bank & Merge Co Task 2
        </header>
        <div className="App-content">
          <button className="btn btn-primary Stream-button"
            // when button is click, our react app tries to request
            // new data from the server.
            // As part of your task, update the getDataFromServer() function
            // to keep requesting the data every 100ms until the app is closed
            // or the server does not return anymore data.
            onClick={() => { this.getDataFromServer() }}>
            {this.state.textStreaming}
          </button>
          <div className="Graph">
            {this.renderGraph()}
          </div>
        </div>
      </div>
    )
  }
}

export default App;
