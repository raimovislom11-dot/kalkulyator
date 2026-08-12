import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const envFile = fs.readFileSync('/Users/macbookpro/Desktop/calc/kalkulyator/.env.local', 'utf-8');
const apiKeyMatch = envFile.match(/ANTHROPIC_API_KEY=(.*)/);
if (!apiKeyMatch) {
  console.log('No ANTHROPIC_API_KEY found');
  process.exit(1);
}
const apiKey = apiKeyMatch[1].trim();

const anthropic = new Anthropic({
  apiKey: apiKey,
});

async function main() {
  const models = [
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2',
    'claude-3-5-sonnet-20241022',
  ];

  for (const model of models) {
    try {
      await anthropic.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hello' }]
      });
      console.log(`✅ ${model} works`);
    } catch (err) {
      console.log(`❌ ${model} failed: ${err.message}`);
    }
  }
}

main();
