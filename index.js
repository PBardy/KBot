require('dotenv').config()

const fs = require('fs');
const Discord = require('discord.js');
const summons = require('./assets/summons.json');

const client = new Discord.Client();
const channels = ['no-humans-allowed', 'bot-commands'];

const COMMAND_PREFIX = "!";
const MAX_PINGS_ALLOWED = 60;

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
  } 
}

const saveSummons = () => {
  const data = JSON.stringify(summons);
  fs.writeFile('./assets/summons.json', data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });
}

const spamReply = (msg, user, reply) => {
  let pingsSent = 0;
  let pingsQueue = setInterval(() => {
    msg.channel.send(`${user} ${reply}`);
    pingsSent++;
    if (pingsSent >= MAX_PINGS_ALLOWED) {
      clearInterval(pingsQueue);
    }
  }, 1000);
}

const add = (msg, parameters) => {
  if (parameters.length < 2) {
    msg.reply("Invalid syntax! Summonings are made by '!add <user> <img | text>'");
    return;
  }

  const [user, ...imageOrText] = parameters;
  if (user.match(/[<@!>]/g)) {
    summons[user] = imageOrText.join(" ");

    msg.reply("Summoning added");
    saveSummons();
    return;
  }

  msg.reply("Invalid syntax! Summonings are made by '!add <user> <img | text>'");
};

const summon = (msg, parameters) => {
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

client.login(process.env.CLIENT_TOKEN)