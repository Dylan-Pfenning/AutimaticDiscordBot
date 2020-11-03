const Discord = require('discord.js');
const tmi = require('tmi.js');
const fetch = require('node-fetch');
global.Headers = global.Headers || require("fetch-headers");
//const { prefix, token, twitchID, twitchRecovery, twitchSecret, jsonBlob } = require('./config.json');
var secretPhrases;
var DiscordGuild;
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
var opts = {
    identity: {
        username: "TimBot",
        password: process.env.twitchSecret
    },
    channels: [
        "autimatictv"
    ]
};
const twitchNameMap = new Map();

const twitchClient = new tmi.client(opts);

async function getSecretPhraseJson() {
    secretPhrases = await fetch(`https://jsonblob.com/api/${process.env.jsonBlob}`, {
        method: 'GET'
    }).then(response => response.json());
    console.log("successfully grabbed JSON")
}

client.once('ready', async ready => {
    getSecretPhraseJson();
    console.log('TimBot Up and Running!');
    twitchClient.connect();
    console.log('Tim bot in the chat beep boop');
    DiscordGuild = client.guilds.cache.find(guild => guild.id === '462786774499065858');
    console.log(`Discord guild is ${DiscordGuild.name}`);
    startup(client.guilds.cache.find(guild => guild.id === '462786774499065858'));
})

client.on('message', async message => {
    if (message.channel instanceof Discord.DMChannel) return;
    const args = message.content.slice(process.env.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'verify') {

        //766496134990135326   768313201787142175'  
        if (message.member.roles.cache.some(role => role.id === '766496134990135326') || message.member.roles.cache.some(role => role.id === '768313201787142175')) {
            try {
                message.member.send("You're already verified");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }
        //grab the user ID from the name given to verify
        const twitchNameArr = message.content.split(" ");
        if (twitchNameArr[1] === undefined) {
            try {
                message.member.send("Please add your twitch name after the !verify command!");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }

        if (twitchNameArr[2] !== undefined) {
            try {
                message.member.send(`The bot has detected potential auto correct in your command. Please only type "!verify YOURTWITCHNAMEHERE" for verification to work!`);
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }
        const twitchName = twitchNameArr[1].toLowerCase();

        let userInfo = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.twitchSecret}`,
                'Client-ID': process.env.twitchID
            }
        }).then(response => response.json());
        //Get the userID
        if (userInfo.data === undefined) {
            try {
                message.member.send("This twitch user doesn't exist.");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
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
        try {
            message.member.send('Post the secret phrase here: https://www.twitch.tv/autimaticTV');
            message.member.send(`Your secret phrase to type in autimatics *TWITCH* chat for verification is:`);
            message.member.send(secretPhrase);
        } catch (err) {
            console.log(`${message.member.nickname} has dm's privated`);
        }
        message.delete();

    }

    if (command === 'sign') {
        if (message.channel.id !== '768723751776026628') {
            try {
                message.member.send("Please use this command in the dotted line chat.");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }
        //ensure user sent the link
        const steamLinkArr = message.content.split(" ");
        if (steamLinkArr[1] === undefined) {
            try {
                message.member.send("Please add your steam URL after the !sign command!");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }
        //If they had an auto correct error (another space)
        if (steamLinkArr[2] !== undefined) {
            try {
                message.member.send(`The bot has detected potential auto correct in your command. Please only type "!sign YOURSTEAMURLHERE" for verification to work!`);
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }

        //Check to make sure the splitter is in the right place
        const steamURL = steamLinkArr[1].split('/');
        let steamURLToSend = steamLinkArr[1];
        let id64;
        if (steamURL[3] === 'id' || steamURL[1] === 'id') {
            let steamVanity;
            if (steamURL[0] !== 'https:') {
                steamVanity = steamURL[2];
                steamURLToSend = 'https://' + steamLinkArr[1];
            } else {
                steamVanity = steamURL[4];
            }

            //if its a valid splitter
            let steamInfo = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.steamKey}&vanityurl=${steamVanity}`, {
                method: 'GET'
            }).then(response => response.json());

            if (steamInfo.response.steamid === undefined) {
                try {
                    message.member.send('Invalid profile URL');
                } catch (err) {
                    console.log(`${message.member.nickname} has dm's privated`);
                }
                message.delete();
                return;
            }

            id64 = steamInfo.response.steamid;

        } else if (steamURL[3] === 'profiles' || steamURL[1] === 'profiles') {
            if (steamURL[0] !== 'https:') {
                id64 = steamURL[2];
                steamURLToSend = 'https://' + steamLinkArr[1];
            } else {
                id64 = steamURL[4];
            }
        }

        let steamUserInfo = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.steamKey}&steamids=${id64}`, {
            method: 'GET'
        }).then(response => response.json());
        //has to = 1
        if (steamUserInfo.response.players[0].commentpermission === 1) {
            //if its valid -> post it in the dotted line chat
            let signSpot = message.guild.channels.cache.find(channel => channel.id === '770883449023496223');
            signSpot.send(steamURLToSend);
            try {
                message.member.send("Your link has been approve and will be signed soon!");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        } else {
            try {
                message.member.send("Either your profile or your comments are private. Please make them public so Tim can sign your profile");
            } catch (err) {
                console.log(`${message.member.nickname} has dm's privated`);
            }
            message.delete();
            return;
        }

    }

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


    if (command === 'update') {
        //mod role id: 462789424774643734 
        if (message.member.roles.cache.has('462789424774643734')) {
            getSecretPhraseJson();
            console.log("Updating beep boop");
            return;
        }
    }

    if (command === 'maint') {
        if (message.member.roles.cache.has('462789424774643734')) {
            startup(message.guild);
        }
    }
});

function startup(tempGuild) {
    //Get all members with the role id: 768313201787142175
    let roleToRemoveId = "768313201787142175";
    let roleToAdd = "768277106383519745";
    let roleToRemove = tempGuild.roles.cache.get(roleToRemoveId);
    let membersWithRole;
    tempGuild.members.fetch().then(fetchedMembers => {
        membersWithRole = fetchedMembers.filter(member => member.roles.cache.has(roleToRemoveId));
        // We now have a collection with all online member objects in the totalOnline variable
        console.log(`${membersWithRole}`);
        console.log(`Bot has cleared out all the users with the verification in progress role.`);
    });
    // membersWithRole.forEach(member => {
    //     member.roles.add(roleToAdd);
    //     member.roles.remove(roleToRemoveId);
    //     member.send(`Hi due to my restart your verification progress has been reset. Please start again`).catch(err =>{
    //         console.log(`${member.nickname} has dm's privated`);
    //     });
    // });
    
}

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
        if (DiscordGuild.members.cache.some(member => member.nickname === context['display-name'])) {
            var upgradeMember = DiscordGuild.members.cache.find(member => member.nickname === context['display-name']);
            upgradeMember.send("You've been upgraded!!!!!!");
        }
    }
});

client.login(process.env.token);

//Guild.members.random() <- get random guild member for rankings