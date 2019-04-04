const { performance } = require('perf_hooks');
const Discord = require('discord.js');
require('dotenv').config();

// Initialize Discord Bot
const token = process.env.API_TOKEN || "";
const bot = new Discord.Client();

// state information about current race
// This is terrible. -X
// eat my shorts
let race_name = "";
let max_time = 0;
let start_time = 0;
let allow_join = false;
const players = new Map();

const checkpermission = function (message) {
  return message.member.roles.find(r => r.name === "Organizer" || r.name === "Admin");
};

const process_args = string => string.substring(1).match(/\w+|"[^"]+"/g).map(x => x.replace(new RegExp('"', 'g'), ''));

bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ' + bot.user);
    console.log('At: ' + bot.readyAt);
});

bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '.') {
        var channel = message.channel;
        const args = process_args(message.content);

        switch(args[0]) {
            case 'ping':
                channel.send('pong!');
            break;
            case 'sfw':
              if (checkpermission(message)) {
                for (var i=0; i<3; i++) channel.send({
                  files: [{
                    attachment: './img/sasuke.jpeg',
                    name: 'Safe for work sasuke.jpeg'
                  }]
                })
                .catch(console.log);
              }
            break;
            case 'race':
              if (checkpermission(message)) {
                race_name = args[1]
                max_time = args[2]
                allow_join = true;
                channel.send(`**${race_name}** is now open!\nTime limit: ${max_time} minutes.\nThe race will begin once all participants are ready.`);
                if (!(players.has(message.author.id))) players.set(message.author.id, {user: message.author, ready: false});
              } else {
                channel.send('You do not have permission to use this command.');
              }
            break;
            case 'join':
              if (race_name !== '') {
                if (!(players.has(message.author.id))) {
                  players.set(message.author.id, {user: message.author, ready: false});
                  channel.send(`${message.author} has joined the race.`);
                } else {
                  channel.send('You are already in the race.');
                }
              }
            break;
            case 'quit':
              if players.delete(message.author.id) channel.send(`${message.author} has left the race.`);
            break;
            case 'ready':
              if (players.has(message.author.id)) {
                players.get(message.author.id).ready = true;
              }
         }
     }
});

bot.login(token);
