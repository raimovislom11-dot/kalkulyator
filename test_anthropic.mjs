import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  const models = [
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ];

  for (const model of models) {
    try {
      const msg = await anthropic.messages.create({
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
