import { GoogleGenerativeAI } from '@google/generative-ai';
import { settingsManager } from './src/services/SettingsManager';
import * as dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const config = settingsManager.getSettings().ai;
  console.log('--- Testing Gemini Configuration ---');
  console.log(`Provider: ${config.provider}`);
  console.log(`Model: ${config.model}`);
  console.log(`Base URL: ${config.baseUrl || 'Default (Google)'}`);
  console.log(`Key: ${config.apiKey ? '******' + config.apiKey.slice(-4) : 'Missing'}`);

  if (!config.apiKey) {
    console.error('❌ No API Key found in settings.');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ 
        model: config.model,
    }, {
        baseUrl: config.baseUrl || undefined 
    });

    console.log('Sending request...');
    const result = await model.generateContent("Hello, are you online?");
    const response = await result.response;
    const text = response.text();
    console.log('✅ Success! Response:', text);
  } catch (error: any) {
    console.error('❌ API Call Failed:');
    if (error.message) console.error(`Message: ${error.message}`);
    if (error.status) console.error(`Status: ${error.status}`);
    if (error.statusText) console.error(`StatusText: ${error.statusText}`);
    // console.error('Full Error:', error); // Verbose
  }
}

testGemini();
