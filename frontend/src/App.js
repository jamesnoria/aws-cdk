import React from "react";
import axios from "axios";

export default class PersonList extends React.Component {
  state = {
    testing: [],
  };

  componentDidMount() {
    axios
      .get("https://bfyy8005z5.execute-api.us-east-1.amazonaws.com/prod/cv", {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        const testing = res.data;
        this.setState({ testing });
      });
  }

  render() {
    return (
      <ul>
        <h1>Hola viejo</h1>
        {this.state.testing.map((test) => (
          <img src={test.url} alt="test" />
        ))}
      </ul>
    );
  }
}
