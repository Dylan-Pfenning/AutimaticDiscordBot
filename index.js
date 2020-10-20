const Discord = require('discord.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
const { prefix, token, twitchID, twitchSecret, TimTwitchID } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });


client.once('ready', async ready => {
    console.log('GPQ Bot 1.0 Ready!');
})

client.on('message', async message => {
    if (message.channel instanceof Discord.DMChannel) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'verify') {
        //grab the user ID from the name given to verify
        const twitchName = message.content.split(" ");
        let userInfo = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName[1]}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${twitchSecret}`,
                'Client-ID': twitchID
            }
        }).then(response => response.json());
        //Get the userID
        if(userInfo.data.length == 0){
            message.channel.send("This twitch user doesn't exist.");
            return;   
        }
        userID = userInfo.data[0].id;
        //checks to see if the user actually follows auti
        let checkFollow = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${TimTwitchID}&from_id=${userID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${twitchSecret}`,
                'Client-ID': twitchID
            }
        }).then(response => response.json());

        if (checkFollow.total == 1) {
            message.channel.send("Approved");
            //assign roles to the user
            const role = message.guild.roles.cache.find(role =>role.name === "Follower");
            message.member.roles.add(role);
            //change users name
            message.member.setNickname(userInfo.data[0].display_name);
        }
        else {
            message.channel.send("Please follow autimatic to access his discord!");
        }
    }

});

client.login(token);