const Discord = require('discord.js');
const tmi = require('tmi.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
const { prefix, token, twitchID, twitchRecovery, twitchSecret} = require('./config.json');
var secretPhrases;
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
var opts = {
    identity: {
        username: "TimBot",
        password: twitchSecret
    },
    channels: [
        "autimatictv"
    ]
};
const twitchNameMap = new Map();

const twitchClient  = new tmi.client(opts);

async function getSecretPhraseJson(){
    secretPhrases = await fetch(`https://jsonblob.com/api/0aa61eda-1312-11eb-b297-97083b87b7bc`,{
        method: 'GET'
    }).then(response => response.json());
    console.log("successfully grabbed JSON")
}

client.once('ready', async ready => {
    getSecretPhraseJson();
    console.log('TimBot Up and Running!');
    twitchClient.connect();
    console.log('Tim bot in the chat beep boop');
})


client.on('message', async message => {
    if (message.channel instanceof Discord.DMChannel) return;
    console.log(message.member.user.id);
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (command === 'verify') {
        if(message.member.roles.cache.some(role => role.name === 'Follower') || message.member.roles.cache.some(role => role.name === "Verification In Progress")){
            message.channel.send("You're already verified");
            return;
        }
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

        var obj_keys = Object.keys(secretPhrases.secret_phrases);
        var ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
        let secretPhrase = secretPhrases.secret_phrases[ran_key];
        //Generate sentance to say to verify identity
        const role = message.guild.roles.cache.find(role => role.name === "Verification In Progress");
        message.member.roles.add(role);
        twitchNameMap.set(`${twitchName[1]}`, { key: secretPhrase, discord: message });
        message.member.send(`Your secret phrase to type in autimatics chat for verification is;`);
        message.member.send(secretPhrase);
        
    }

    if(command === 'update'){
        //mod role id: 462789424774643734
        if(message.member.roles.cache.has('4627894247746437342')){
            getSecretPhraseJson();
            message.channel.send("Updating beep boop");
            return;
        }
    }

    if(command === 'token'){
        if(message.member.user.id === '145463495830405120'){

            console.log("Updating auth token");
        }
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
            const roleToRemove = discord.guild.roles.cache.find(role => role.name === "Verification In Progress");
            discord.member.roles.remove(roleToRemove);
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

