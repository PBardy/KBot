const brain = require('brain.js')

class Bot {

  constructor() {
    this.memory = []
    this.responding = true
    this.training = false
    this.net = new brain.recurrent.LSTM()
  }

  toggleRespondMode(msg) {
    this.responding = !(this.responding)
    if(msg == null) return
    msg.channel.send(`${this.responding ? 'Entering' : 'Leaving'} respond mode`)
    this.toggleTrainingMode(null)
    if(!(this.responding)) return
    if(!(this.memory.length > 0)) return
    this.net.train(this.memory, Bot.configs.training)
  }

  toggleTrainingMode(msg) {
    this.training = !(this.training)
    if(msg == null) return
    msg.channel.send(`${this.training ? 'Entering' : 'Leaving'} training mode`)
    this.toggleRespondMode(null)
  }

  processCommand(msg) {
    if(msg.content === '!train') (this.toggleTrainingMode(msg))
    if(msg.content === '!respond') (this.toggleRespondMode(msg))
  }

  processText(msg) {

    if(this.training) {
      const lines = msg.content.split('\n')
      lines.forEach((line) => this.memory.push(line))
    }

    if(this.responding) {
      msg.channel.send(this.net.run(msg.content))
    }

  }

}

Bot.instance = null

Bot.configs = {
  training: {
    iterations: 20000,
    callback: Bot.onTrainCallback,
    callbackPeriod: 10,
  }
}

Bot.getBot = () => {
  return Bot.instance ? Bot.instance : (Bot.instance = new Bot())
}

Bot.onTrainCallback = (event) => {
  console.log(`
    Iterations: ${event.iterations}
    Error rate: ${event.error}  
  `)
}

module.exports = Bot