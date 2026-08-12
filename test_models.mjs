import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const envFile = fs.readFileSync('/Users/macbookpro/Desktop/calc/kalkulyator/.env.local', 'utf-8');
const apiKey = envFile.match(/ANTHROPIC_API_KEY=(.*)/)[1];

const anthropic = new Anthropic({
  apiKey: apiKey,
});

async function main() {
  const models = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
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
