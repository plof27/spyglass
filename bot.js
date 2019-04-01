var Discord = require('discord.js');
var config = require('./config.json');

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ' + bot.user);
    console.log('At: ' + bot.readyAt);
});

bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        var channel = message.channel;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'ping':
                channel.send('pong!');
            break;
            case 'bulge':
                channel.send('OWO')
            break;
            case 'headpat':
                channel.send('>///<\n*purr*');
            break;
            case 'sfw':
                for (var i=0; i<3; i++) channel.send({
                    files: [{
                        attachment: './img/sasuke.jpeg',
                        name: 'Safe for work sasuke.jpeg'
                    }]
                })
                    .catch(console.log);
            break;
         }
     }
});

bot.login(config.token);
