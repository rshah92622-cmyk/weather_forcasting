const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// API Keys
const OPENWEATHER_API_KEY = '6a78ebd832d2907870c99de24ac7ccbe';
const GROQ_API_KEY = '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';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Weather API Routes ──────────────────────────────────────────────

// Current weather by city or coordinates
app.get('/api/weather/current', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    }
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current weather', details: err.message });
  }
});

// 5-day / 3-hour forecast
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    }
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forecast', details: err.message });
  }
});

// Air quality
app.get('/api/weather/air-quality', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch air quality', details: err.message });
  }
});

// ─── AI Recommendation Route ────────────────────────────────────────

app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { weatherData, cropType, soilType, season, location, historicalData } = req.body;

    const systemPrompt = `You are an expert agricultural advisor AI for Indian farmers. 
You provide practical, actionable farming recommendations based on weather conditions, soil types, and crop requirements.
Always respond in a structured format with clear sections.
Consider local farming practices, seasonal patterns, and sustainable agriculture methods.
Provide recommendations in both English and Hindi when possible.
Focus on: planting schedules, irrigation advice, pest/disease warnings, harvest timing, and cost-saving tips.`;

    const userPrompt = `Based on the following conditions, provide detailed farming recommendations:

**Location:** ${location || 'Not specified'}
**Current Weather:** 
- Temperature: ${weatherData?.temp || 'N/A'}°C
- Humidity: ${weatherData?.humidity || 'N/A'}%
- Wind Speed: ${weatherData?.wind || 'N/A'} m/s
- Condition: ${weatherData?.condition || 'N/A'}
- Rainfall: ${weatherData?.rain || '0'} mm

**Crop Type:** ${cropType || 'General'}
**Soil Type:** ${soilType || 'Not specified'}
**Season:** ${season || 'Current'}

${historicalData ? `**Historical Weather Pattern:** ${historicalData}` : ''}

Please provide:
1. 🌱 **Planting Recommendation** - Is this a good time to plant? What crops to consider?
2. 💧 **Irrigation Advisory** - How much water is needed given the current conditions?
3. 🐛 **Pest & Disease Alert** - Any risks based on current weather?
4. 📅 **Weekly Action Plan** - What should the farmer do this week?
5. 💰 **Cost-Saving Tips** - How to save money based on weather predictions
6. ⚠️ **Weather Warnings** - Any extreme weather alerts?`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    
    res.json({
      recommendation: data.choices?.[0]?.message?.content || 'No recommendation available.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get AI recommendation', details: err.message });
  }
});

// Quick AI query for specific questions
app.post('/api/ai/query', async (req, res) => {
  try {
    const { question, context } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful farming assistant. Give concise, practical answers to farming questions. Focus on Indian agriculture context.' 
          },
          { role: 'user', content: `${context ? 'Context: ' + context + '\n\n' : ''}Question: ${question}` }
        ],
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json({
      answer: data.choices?.[0]?.message?.content || 'Unable to process your question.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process query', details: err.message });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌾 Farmer Weather Dashboard running at http://localhost:${PORT}`);
});
