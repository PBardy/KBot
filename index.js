require('dotenv').config()

const fs = require('fs');
const Discord = require('discord.js');
const summons = require('./assets/summons.json');
const { requestAnimationFrame, cancelAnimationFrame } = require('request-animation-frame-polyfill');

const client = new Discord.Client();
const channels = ['no-humans-allowed', 'bot-commands'];

const COMMAND_PREFIX = "!";
const MAX_PINGS_ALLOWED = 10;
const MAX_SUMMONS_ALLOWED = 100;

const processMessage = (msg) => {
  const split = msg.content.split(" ");
  if (split.length > 1) {
    const [command, ...rest] = split;
    const parameters = rest.join(" ").split(" ");
    const key = command.slice(1, command.length);
    if (commands.hasOwnProperty(key)) {
      const func = commands[key];
      func(msg, parameters);
    }
  } else {
    const [command] = split;
    const key = command.slice(1, command.length);
    if (commands.hasOwnProperty(key)) {
      const func = commands[key];
      func(msg);
    }
  } 
}

const saveSummons = () => {
  const data = JSON.stringify(summons);
  fs.writeFile('./assets/summons.json', data, (err) => {
    if (err) throw err;
  });
}

let msgQueue = [];
let stopped = true;
let paused = false;

let fps = 1;
let pings = 0;
let tickRate = 1000 / fps;

const stop = (msg) => {
  msgQueue = [];
  stopped = true;
  clearInterval(spamRef);
}

const pause = (msg) => {
  paused = true;
}

const spamReply = (msg, user, reply) => {
  msgQueue = [];
  paused = false;
  stopped = false;
  for (let i = 0; i < MAX_PINGS_ALLOWED; i++) {
    msgQueue.push(`${user} ${reply}`)
  }

  spamRef = setInterval(() => {
    if (stopped || msgQueue.length === 0 || pings >= MAX_PINGS_ALLOWED) return clearInterval(spamRef);
    if (paused) return;
    const txt = msgQueue.shift();
    pings++;
    msg.channel.send(txt);
  }, tickRate);

}

const add = (msg, parameters) => {
  if (parameters == null) return;
  if (parameters.length < 2) {
    msg.reply("Invalid syntax! Summonings are made by '!add <user> <img | text>'");
    return;
  }

  const keys = Object.keys(summons);
  if (keys != null) {
    const length = keys.length;
    const [user, ...imageOrText] = parameters;
    if (user.match(/[<@!>]/g)) {
      if (length < MAX_SUMMONS_ALLOWED) {
        summons[user] = imageOrText.join(" ");

        msg.reply("Summoning added");
        saveSummons();
        return;
      }
    }
  }

  msg.reply("Invalid syntax! Summonings are made by '!add <user> <img | text>'");
};

const summon = (msg, parameters) => {
  if (parameters == null) return;
  if (parameters.length < 1) {
    msg.reply("Invalid syntax! Summonings are made by '!summon <user>'");
    return;
  }

  const [user] = parameters;
  if (summons.hasOwnProperty(user)) {
    const reply = summons[user];
    spamReply(msg, user, reply);
  }
};


const commands = {
  "add": add,
  "stop": stop,
  "pause": pause,
  "summon": summon,
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
});

client.on('message', (msg) => {
  if((msg.author.bot)) return
  if(!channels.includes(msg.channel.name)) return
  if(msg.content.startsWith(COMMAND_PREFIX)) {
    processMessage(msg);
  }
})

client.login(process.env.CLIENT_TOKEN);