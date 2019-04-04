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
let number_unfinished = 0;
let countdown = 9;
const players = new Map();

// utility function for displaying times (https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript)
const ms_to_time = function (duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

// perform an action only if the sender of the command is an organizer or an admin
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
    number_unfinished = players.size;
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

            // help command
            case 'help':
              if (args[1] === 'full') {
                channel.send('`.help`\n\t\tDisplay the help message. Use `.help full` for all commands.\n`.ping`\n\t\tPing the bot for a response.\n`.race name max_time`\n\t\tDeclare a new race with a name of `name` and a time limit of `max_time`.\n`.reset`\n\t\tReset race variables so you can declare a new race, or cancel an existing one.\n`.join`\n\t\tJoin an existing race\n`.quit`\n\t\tQuit the current race.\n`.ready`\n\t\tReady up so we can start!\n`.unready`\n\t\tGo back to being not ready.\n`.done`\n\t\tFinish the race and get your time!\n`.yell`\n\t\tPing all players who are in the race but not yet ready.\n`.forcestart`\n\t\tForce the start of a race even if not everyone is ready.\n`.special`\n\t\tAdmin-only test command.\n`sfw`\n\t\tPost safe for work sasuke.');
              } else {
                channel.send('`.help`\t\t\tDisplay the help message. Use `.help full` for all commands.\n`.ping`\t\t\tPing the bot for a response.\n`.join`\t\t\tJoin an existing race\n`.quit`\t\t\tQuit the current race.\n`.ready`\t\t  Ready up so we can start!\n`.unready`\t  Go back to being not ready.\n`.done`\t\t\tFinish the race and get your time!\n')
              }
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
                number_unready--;
                channel.send(`${message.author} is ready. ${number_unready} remain.`)
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

            // finish and post the time! (eventually post to the api~)
            case 'done':
              if (players.has(message.author.id)) {
                const time = performance.now()-start_time;
                channel.send(`${message.author} has finished with an official time of ${ms_to_time(time)}!`)
              }
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
