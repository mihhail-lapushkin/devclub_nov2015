var React = require('react')

var BlahComponent = React.createClass({
  render: function() {
    return (
      <div className='BlahComponent'>{this.props.message}</div>
    )
  }
})

module.exports = BlahComponent