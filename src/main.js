const {App, AwsLambdaReceiver} = require('@slack/bolt');
const {Configuration, OpenAIApi} = require('openai');
const { generateSQLPrompt, generateSummaryPrompt } = require('./prompt');
const { executeSQLRemotely, generateSQLQueries, summarizeData } = require('./result');
const {SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand} = require('@aws-sdk/client-scheduler');

require('dotenv').config();

// const hostPort = process.env.PORT || 8443;

const openAIConfiguration = new Configuration({
    apiKey: process.env.OPENAI_SECRET_KEY,
});

// const s3 = new aws.S3();
// s3.listBuckets((err, data) => {
//     if(err){
//         console.log(err);
//     } else{
//         console.log(JSON.stringify(data));
//     }
// })

const openai = new OpenAIApi(openAIConfiguration);

const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
})

const app = new App({
    // signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    // appToken: process.env.SLACK_APP_TOKEN,
    // socketMode: true,
    receiver: awsLambdaReceiver,
    // port: hostPort,
});

const remindChannel = async (reminder) => {
    const channelId = reminder.channel;
    const reminderMessage = `Guys, feel free to gain insights on users, devices and much more!! Ask using the command\`/segwise How many users use Samsung and OnePlus?\``;
    try {
        await app.client.chat.postMessage({
            channel: channelId,
            text: reminderMessage,
        });
    } catch (error) {
        console.log(error);
    }
}

const setupReminder = async (slackEvent) => {
    try {
        console.log(`Setup reminder: ${slackEvent}`);
        const auth = await app.client.auth.test();
        if(auth.user == slackEvent.user){
            const client = new SchedulerClient();
            const scheduleDescription = new CreateScheduleCommand({
                Name: `segwise-reminder-${slackEvent.channel}-1h`,
                FlexibleTimeWindow: 0,
                ScheduleExpression: 'rate(1 hour)',
                GroupName: 'segwise-reminders',
                Target: {
                    Arn: '',
                    RoleArn: '',
                    Input: JSON.stringify({channel: slackEvent.channel}),
                }
            });
            return await client.send(scheduleDescription);   
        }
    
    } catch (error) {
        console.log(`Error creating reminder. error=${error}`);
    }
};

const deleteReminder = async (slackEvent) => {
    try {
        console.log(`Delete Reminder: ${slackEvent}`);
        const auth = await app.client.auth.test();
        if(auth.user === slackEvent.user){
            const client = new SchedulerClient();
            const scheduler = new DeleteScheduleCommand({
                Name: `segwise-reminder-${slackEvent.channel}-1h`,
                GroupName: `segwise-reminders`,
            });
            await client.send(scheduler);
        }
    } catch (error) {
        console.log(`Error deleting reminser. error=${error}`);
    }
}


const handleCommand = async (command, say) => {
    console.log(`Command recieved: ${command.text}`);
    const trimmedMessage = command.text;

    if(trimmedMessage.length === 0){
        return await say(`<@${command.user_id}>, I don't have answer to 'nothing' 😅`);
    }

    const queryWithContext = generateSQLPrompt(trimmedMessage);

    const sqlQueries =  await generateSQLQueries(openai, [{role: 'user', content: queryWithContext}]);

    if(sqlQueries.length == 0){
        return await say(`<@${command.user_id}>, The question \`${command.text}\` is out of my domain, or 'me no comprende!'. Try a question involving insights.`);
    }

    try {
        const dataResult = JSON.stringify(await Promise.any(sqlQueries.map(sql => executeSQLRemotely(sql))));

        console.log(`RAW_DATA :: ${dataResult}`)

        const prompt = generateSummaryPrompt(trimmedMessage, dataResult);
        const result = await summarizeData(openai, prompt);
        
        console.log(`SUMMARY :: ${result}`);

        await say(`<@${command.user_id}>, ${result}\n_Your question: \`${command.text}\`_`);

    } catch (error) {
        console.log(error);
        await say(`<@${command.user_id}>, Sorry I was not able to obtain insight on \`${trimmedMessage}\`. Try to reword \`${command.text}\` or a different query.`);
    }
}

app.command('/segwise', async ({command, ack, say}) => {
    ack();
    await handleCommand(command, say);
});

app.event('member_joined_channel', async ({event}) => {
    await setupReminder(event);
});

app.event('member_left_channel', async ({event}) => {
    await deleteReminder(event);
})


module.exports.handler = async (event, context, callback) => {
    const data = JSON.parse(event);
    if(data.Records){
        const payload = JSON.parse(data.Records[0].body);
        try {
            await remindChannel(payload);
        } catch (error) {
            console.log(error);
        } finally {
            callback(null, 200);
        }
    } else {
        const handler = await awsLambdaReceiver.start();
        return handler(event, context, callback);
    }
  }