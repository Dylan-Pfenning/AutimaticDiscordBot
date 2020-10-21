const Discord = require('discord.js');
const tmi = require('tmi.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
const { prefix, token, twitchID, twitchRecovery, twitchSecret, jsonBlob } = require('./config.json');
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

const twitchClient = new tmi.client(opts);

async function getSecretPhraseJson() {
    secretPhrases = await fetch(`https://jsonblob.com/api/${jsonBlob}`, {
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
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if(command === 'agree'){
        //Send user exact instructions to verify

        //give user the verification role.
    }



    if (command === 'verify') {
        //766496134990135326   768313201787142175'  
        if (message.member.roles.cache.some(role => role.id === '766496134990135326') || message.member.roles.cache.some(role => role.id ==='768313201787142175')) {
            message.member.send("You're already verified");
            return;
        }
        //grab the user ID from the name given to verify
        const twitchName = message.content.split(" ");
        if (message.content === '!verify') {
            message.member.send("Please add your twitch name after the !verify command!");
            return;
        }

        let userInfo = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName[1]}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${twitchSecret}`,
                'Client-ID': twitchID
            }
        }).then(response => response.json());
        //Get the userID
        if (userInfo.data.length == 0) {
            message.member.send("This twitch user doesn't exist.");
            return;
        }

        var obj_keys = Object.keys(secretPhrases.secret_phrases);
        var ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
        let secretPhrase = secretPhrases.secret_phrases[ran_key];
        //Generate sentance to say to verify identity
        message.member.roles.add('768313201787142175');
        message.memeber.roles.remove('768277106383519745');
        twitchNameMap.set(`${twitchName[1]}`, { key: secretPhrase, discord: message });
        message.member.send(`Your secret phrase to type in autimatics *TWITCH* chat for verification is;`);
        message.member.send(secretPhrase);
        message.member.send('Post the secret phrase above here: https://www.twitch.tv/autimaticTV');


    }

    if (command === 'update') {
        //mod role id: 462789424774643734
        if (message.member.roles.cache.has('4627894247746437342')) {
            getSecretPhraseJson();
            message.channel.send("Updating beep boop");
            return;
        }
    }
});


twitchClient.on('message', (target, context, msg) => {
    const secretPhrase = msg.trim();
    if (twitchNameMap.has(context.username)) {
        if (secretPhrase === twitchNameMap.get(context.username).key) {
            let discord = twitchNameMap.get(context.username).discord;
            //assign roles to the user
            discord.member.roles.add('766496134990135326');
            const roleToRemove = discord.guild.roles.cache.find(role => role.name === "Verification In Progress");
            discord.member.roles.remove('768313201787142175');
            //change users name
            discord.member.setNickname(context.username);
            discord.member.send(`You have been verified!`);
            //Remove this value from the map
            twitchNameMap.delete(context.username);
        }
    }
});

client.login(token);


//to refresh https://twitchtokengenerator.com/api/refresh/<REFRESH_TOKEN>

