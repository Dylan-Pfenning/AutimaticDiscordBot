const Discord = require('discord.js');
const tmi = require('tmi.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
const { prefix, token, twitchID, twitchRecovery, twitchSecret, jsonBlob } = require('./config.json');
var secretPhrases;
var guild;
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
    guild = client.guilds.cache.find(guild => guild.id === '462786774499065858');

})


client.on('message', async message => {
    if (message.channel instanceof Discord.DMChannel) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'topusers') {
        if (message.member.roles.cache.has('462789424774643734')) {
            //get top 5 chatters or something idk.
            let top5Users = 'The top discord users of the week are:\n';
            for (let index = 1; index < 6; index++) {
                let user = message.guild.members.cache.random();
                top5Users += `${index}: ${user.user.username} with a score of: ${Math.floor(Math.random() * 2500) + 1}!\n`;
            }
            top5Users += `Ranks will be reset every week!`;
            message.channel.send(top5Users);
        }
    }



    if (command === 'verify') {

        //766496134990135326   768313201787142175'  
        if (message.member.roles.cache.some(role => role.id === '766496134990135326') || message.member.roles.cache.some(role => role.id === '768313201787142175')) {
            message.member.send("You're already verified");
            message.delete();
            return;
        }
        //grab the user ID from the name given to verify
        const twitchNameArr = message.content.split(" ");
        if (twitchNameArr[1] === undefined) {
            message.member.send("Please add your twitch name after the !verify command!");
            message.delete();
            return;
        }

        if (twitchNameArr[2] !== undefined) {
            message.member.send(`The bot has detected potential auto correct in your command. Please only type "!verify YOURTWITCHNAMEHERE" for verification to work!`);
            message.delete();
            return;
        }
        const twitchName = twitchNameArr[1].toLowerCase();

        let userInfo = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${twitchSecret}`,
                'Client-ID': twitchID
            }
        }).then(response => response.json());
        //Get the userID
        if (userInfo.data === undefined) {
            message.member.send("This twitch user doesn't exist.");
            return;
        }
        var obj_keys = Object.keys(secretPhrases.secret_phrases);
        var ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
        let secretPhrase = secretPhrases.secret_phrases[ran_key];
        //Generate sentance to say to verify identity
        if (message.guild.id === '462786774499065858') {
            message.member.roles.add('768313201787142175');
            message.member.roles.remove('768277106383519745');
        }
        twitchNameMap.set(`${twitchName}`, { key: secretPhrase, discord: message });
        message.member.send('Post the secret phrase here: https://www.twitch.tv/autimaticTV');
        message.member.send(`Your secret phrase to type in autimatics *TWITCH* chat for verification is:`);
        message.member.send(secretPhrase);
        message.delete();

    }

    if (command === 'update') {
        //mod role id: 462789424774643734 
        if (message.member.roles.cache.has('462789424774643734')) {
            getSecretPhraseJson();
            message.channel.send("Updating beep boop");
            return;
        }
    }

    if (command === 'maint') {
        if (message.member.roles.cache.has('462789424774643734')) {
            //Get all members with the role id: 768313201787142175
            let roleToRemove = "768313201787142175";
            let roleToAdd = "768277106383519745";
            let membersWithRole = message.guild.roles.cache.get(roleToRemove).members.array();
            membersWithRole.forEach(member => {
                member.roles.remove(roleToRemove);
                member.roles.add(roleToAdd);
                member.send(`Hi! I will be going down for maintenance so you verification process will be reset!`);
                member.send(`Once I am alive again please make sure to go to the verify channel and use the !verify YOURTWITCHNAME command again!`)
                member.send(`Thank you for your patience!`);
            });
        }
    }
});


twitchClient.on('message', (target, context, msg, self) => {
    const secretPhrase = msg.trim();
    if (self) { return; }
    //console.log(context);
    if (twitchNameMap.has(context.username)) {
        if (secretPhrase === twitchNameMap.get(context.username).key) {
            let discord = twitchNameMap.get(context.username).discord;
            //assign roles to the user
            discord.member.roles.add('766496134990135326');
            const roleToRemove = discord.guild.roles.cache.find(role => role.name === "Verification In Progress");
            discord.member.roles.remove('768313201787142175');
            //change users name
            discord.member.setNickname(context['display-name']);
            discord.member.send(`You have been verified!`);
            //Remove this value from the map
            twitchNameMap.delete(context.username);
        }
    }
    //@TODO_ Need to grab the right reward id for Tims channel point command here.
    if (context[`custom-reward-id`] === '1f8ced92-62fc-4a47-9f61-28839774ce94') {
        console.log(context['display-name']);
        if (guild.members.cache.some(member => member.nickname === context['display-name'])) {
            var upgradeMember = guild.members.cache.find(member => member.nickname === context['display-name']);
            upgradeMember.send("You've been upgraded!!!!!!");
        }
    }
});

client.login(token);

//1f8ced92-62fc-4a47-9f61-28839774ce94

//Guild.members.random() <- get random guild member for rankings