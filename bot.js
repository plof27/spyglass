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
let number_unready = 0;
let countdown = 9;
let channel = undefined;
const players = new Map();

// verify that the sender has permission to use this thing ~make this less shitty
const checkpermission = function (message) {
  return message.member.roles.find(r => r.name === "Organizer" || r.name === "Admin");
};

const doIfAllowed = function (message, action) {
  if (message.member.roles.find(r => r.name === "Organizer" || r.name === "Admin")) {
    action(message);
  } else {
    channel.send('You do not have permission to use this command.')
  }
};

// process the args, splitting by spaces and preserving phrases in quotes
const process_args = string => string.substring(1).match(/\w+|"[^"]+"/g).map(x => x.replace(new RegExp('"', 'g'), ''));

// countdown and start the race!
const start_race = () => x = setInterval(() => { // this weird construction is so that 'channel' is in scope and we can reuse this function.
  if (countdown > 0) {
    if (countdown <= 5) channel.send(countdown);
    countdown--;
  } else {
    channel.send('GO!');
    start_time = performance.now();
    clearInterval(x);
    allow_join = false;
  }
}, 1000);

// run once on startup
bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ' + bot.user);
    console.log('At: ' + bot.readyAt);
});

bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `.`
    if (message.content.substring(0, 1) == '.') {
        channel = message.channel;
        const args = process_args(message.content);

        // switch case for each statement
        switch(args[0]) {
            case 'ping':
                channel.send('pong!');
            break;

            // post safe for work sasuke
            case 'sfw':
              doIfAllowed(message, (message) => {
                for (var i=0; i<3; i++) channel.send({
                  files: [{
                    attachment: './img/sasuke.jpeg',
                    name: 'Safe for work sasuke.jpeg'
                  }]
                })
                .catch(console.log);
              });
            break;

            // declare a new race
            case 'race':
              doIfAllowed(message, (message) => {
                race_name = args[1]
                max_time = args[2]
                allow_join = true;
                channel.send(`**${race_name}** is now open!\nTime limit: ${max_time} minutes.\nThe race will begin once all participants are ready.`);
                players.set(message.author.id, {user: message.author, ready: false});
                number_unready = 1;
              });
            break;

            // reset everything so you can do another race
            case 'reset':
              doIfAllowed(message, (message) => {
                race_name = '';
                start_time = 0;
                allow_join = false;
                number_unready = 0;
                countdown = 9;
                players.clear();
                channel.send('Race parameters reset.');
              });
            break;

            // join the current race
            case 'join':
              if (race_name !== '') {
                if (!(players.has(message.author.id))) {
                  players.set(message.author.id, {user: message.author, ready: false});
                  channel.send(`${message.author} has joined the race.`);
                  number_unready++;
                } else {
                  channel.send('You are already in the race.');
                }
              }
            break;

            // quit the current race
            case 'quit':
              if (players.delete(message.author.id)) channel.send(`${message.author} has left the race.`);
            break;

            // ready up! once everyons's ready, start the race!
            case 'ready':
              if (players.has(message.author.id)) {
                players.get(message.author.id).ready = true;
                channel.send(`${message.author} is ready.`)
                number_unready--;
                if (number_unready === 0) {
                  channel.send('All players ready! Starting the race in 10 seconds!');
                  start_race();
                }
              } else {
                channel.send('You are not in a race.');
              }
            break;

            // oh god i gotta piss
            case 'unready':
              if (players.has(message.author.id)) {
                players.get(message.author.id).ready = false;
                channel.send(`${message.author} no longer ready.`)
                number_unready++;
              } else {
                channel.send('You are not in this race.');
              }
            break;

            // forcibly start a race, even if not everyone is ready
            case 'forcestart':
            doIfAllowed(message, (message) => {
              channel.send('Forcibly starting race.');
              start_race();
            });
            break;

            // ping all players who aren't ready
            case 'yell':
              doIfAllowed(message, (message) => {
                let count = 0
                players.forEach((val, key) => {
                  console.log(val);
                  console.log(val.ready);
                  if (val.ready === false) {
                    val.user.send('Ready up! We\'re waitin on ya!');
                    count++;
                  }
                });
                channel.send(`${count} user${count===1 ? 's' : ''} yelled at.`)
              });
            break;

            // this is a test command
            case 'special':
              doIfAllowed(message, (message) => {
                channel.send(`${message.author} hi!!`);
              });
            break;
         }
     }
});

bot.login(token);
