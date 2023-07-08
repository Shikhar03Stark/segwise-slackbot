const knowledge = require('../knowledge');

const generateSQLPrompt = (userQuery) => {
    const awareness = `${knowledge.query.selfKnowledge}\nVery Strict rules:"${knowledge.query.strictBehaviour}"`
    const domain = `${knowledge.domainKnowledge}\n\nThe Schema of sqlite3 database is: ${knowledge.schemaKnowledge}`;
    const question = `Based on above context and schema, generate fuzzy text matxhing, case-insensitive and one line SQL query without explaination for the question in triple quotes.`;
    const prompt = `${awareness}\n\n${domain}\n\n${question}\n\n'''${userQuery}'''`;
    return prompt;
}

const generateSummaryPrompt = (userQuery, rawData) => {
    const awareness = `${knowledge.summarize.selfKnowledge}\nVery Strict rules:"${knowledge.summarize.strictBehaviour}"`
    const domain = `${knowledge.domainKnowledge}\n\nThe Schema of sqlite3 database is: ${knowledge.schemaKnowledge}`;
    const question = `For the question '''${userQuery}''', Don't use words like SQL, query or too technical words. Describe or summarize the following result in simple English., '''${rawData}'''`;
    return `${awareness}\n\n${domain}\n\n${question}\n\n${question}`;
    
}

module.exports = {
    generateSQLPrompt,
    generateSummaryPrompt,
}