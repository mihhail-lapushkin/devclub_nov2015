var React = require('react')
var ReactDom = require('react')
var BlahComponent = require('./BlahComponent')
var SomeDataFetcher = require('../../common/data/SomeDataFetcher')

var App = React.createClass({
  getInitialState: function() {
    return {
      message: 'Blah!'
    }
  },

  componentDidMount: function() {
    SomeDataFetcher.fetch((error, result) => {
      this.setState({
        message: result.someData
      })
    })
  },

  render: function() {
    return (
      <html>
        <head>
          <meta charSet="UTF-8" />
          <link rel="stylesheet" type="text/css" href="client.css" />
        </head>
        <body>
          <BlahComponent message={this.state.message}/>
          <script type="text/javascript" src="client.js"></script>
        </body>
      </html>
    )
  }
})

module.exports = App