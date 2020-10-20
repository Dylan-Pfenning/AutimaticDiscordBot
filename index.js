const Discord = require('discord.js');
const tmi = require('tmi.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
const { prefix, token, twitchID, twitchSecret, TimTwitchID } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
const opts = {
    identity: {
        username: "TimBot",
        password: twitchSecret
    },
    channels: [
        "autimatictv"
    ]
};
const twitchNameMap = new Map();

const twitchClient = new tmi.client(opts);

client.once('ready', async ready => {
    console.log('TimBot Up and Running!');
    twitchClient.connect();
    console.log('Tim bot in the chat beep boop')
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
        if (userInfo.data.length == 0) {
            message.channel.send("This twitch user doesn't exist.");
            return;
        }
        //Generate sentance to say to verify identity
        let secretPhrase = 'Tim is the best awper in NA'
        twitchNameMap.set(`${twitchName[1]}`, {key: secretPhrase, discord: message});
        message.member.send(`Your secret phrase to type in autimatics chat for verification is;`);
        message.member.send(secretPhrase);
    }
});


twitchClient.on('message', (target, context, msg) => {
    const secretPhrase = msg.trim();
    if (twitchNameMap.has(context.username)) {
        if (secretPhrase === twitchNameMap.get(context.username).key) {
            let discord = twitchNameMap.get(context.username).discord;
            //assign roles to the user
            const role = discord.guild.roles.cache.find(role => role.name === "Follower");
            discord.member.roles.add(role);
            //change users name
            discord.member.setNickname(context.username);
            discord.channel.send(`Verified <@${discord.member.id}>`);
            //Remove this value from the map
            twitchNameMap.delete(context.username);
        }
    }
});

client.login(token);


//to refresh https://twitchtokengenerator.com/api/refresh/<REFRESH_TOKEN>

