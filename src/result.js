const fetch = require('node-fetch');


const executeSQLRemotely = async (sql) => {
        const url = `${process.env.EXTERNAL_SERVER_HOST}:${process.env.EXTERNAL_SERVER_PORT}/v1/admin/query`;
        const payload = {
            query: sql,
        }
        console.log(JSON.stringify(payload));
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {'Content-Type': 'application/json'}
        });
        const data = await response.json();
        console.log(`RCE :: ${JSON.stringify(data)}`);
        if(response.ok) {
            return JSON.stringify(data).substr(0, 250);
        }

        const error = new Error(`Error executing script. message=${data}`);
        error.status = response.status;
        throw error;
}

const generateSQLQueries = async (openai, messages) => {

    const selectRegex = /^select(?:(?!insert|delete|alter)[\s\S])*$/i;

    const queryResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        n: 3,
        temperature: 0.8,
    });

    
    console.log(`SQL :: ${JSON.stringify(queryResponse.data)}`);

    return queryResponse.data.choices.filter(choice => selectRegex.test(choice.message.content)).map(choice => choice.message.content);
}

const summarizeData = async (openai, prompt) => {
    const summaryResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            {role: 'user', content: prompt},
        ],
        n: 1,
        temperature: 0.2,
    });
    console.log(`SUMMARY_RESPONSE :: ${JSON.stringify(summaryResponse.data)}`);
    return summaryResponse.data.choices[0].message.content;
}

module.exports = {
    executeSQLRemotely,
    generateSQLQueries,
    summarizeData,
}