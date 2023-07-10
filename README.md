# segwise-slackbot
Segwise assignment for slackbot - support domain-specific QA and reminders of 'use me'

## Features
 - Add the segwise-bot to to your channel and ask for insights on in-house data using natural language.
 - Get reminders on hourly-basis on how to use the bot and help you interact with it.

## Accomplishments
 - Deployed the slack-bot on aws cloud, online on my 'Personal Workspace' workspace [email to get invite](mailto:hv.harshit321@gmail.com)
 - Serverless architecture of slack-bot (scales based on demand)
 - Scalable 'reminders' architecture

## How to run the SlackBot on my machine
 - Pre-requisites
    - Generate your `SLACK_SIGNING_SECRET` and `SLACK_APP_TOKEN`
    - Generate your `OPENAI_SECRET_KEY`
    - Generate your AWS credentials (can run aws-cli or adequate permissions to run aws-eventbridge, aws-iam, aws-lambda)
    - Setup AWS-CLI
    - Create a 'Standard' SQS queue and store ARN in `MESSAGE_QUEUE_ARN`
    - Create a service-level role with the following minimum properties:
    ```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "sqs:SendMessage"
                ],
                "Resource": [
                    "arn:aws:sqs:<region>:<accId>:<Standard queue name>"
                ]
            }
        ]
    }
    ```

      - Store the role ARN in `SCHEDULER_ROLE_ARN`
      - Run the [segwise-user-service](https://github.com/Shikhar03Stark/segwise-user-service) on public domain or localhost (also can use ngrok)
      - Store the external service host and port in `EXTERNAL_SERVER_HOST` and `EXTERNAL_SERVER_PORT`
      - Install [Ngrok](https://ngrok.com/download)
      - Install Serverless globally `npm i -g serverless`
- Steps
    - Install Serverless plugin offline (to run lambda environment on the host machine) `npm i -D serverless-offline`
    - Store the variables discussed above in `.env` file in root of project
    - Run the slackbot `serverless offline --noPreprendStageInUrl`
    - Create a public tunnel to local slackbot `ngrok http 3000`
    - Copy the ngrok url + /slack/events (eg. https://abcdef.ngrok-free.com/slack/events)
    - Use this link to subscribe to Slack events API [setup your app](https://slack.dev/bolt-js/tutorial/getting-started-http#setting-up-events-with-http)
    - Use the bot by adding it to any of the channels 🚀
