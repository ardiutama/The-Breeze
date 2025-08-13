import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const eventForm = document.getElementById('event-form') as HTMLFormElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const outputDiv = document.getElementById('output') as HTMLDivElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const btnText = generateBtn.querySelector('.btn-text') as HTMLElement;
const btnSpinner = generateBtn.querySelector('.spinner') as HTMLElement;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
      eventName: { type: Type.STRING, description: "Creative name for the event." },
      dateSuggestion: { type: Type.STRING, description: "Suggested date or day of the week, considering the selected month/season." },
      targetAudience: { type: Type.STRING, description: "The primary group of guests this event is for." },
      entertainment: { type: Type.STRING, description: "Specific entertainment suggestion (e.g., 'Acoustic duo from Ubud')." },
      menuConcept: { type: Type.STRING, description: "A brief concept for the food and beverage offerings." },
      promotionStrategy: { type: Type.STRING, description: "A few bullet points, separated by a hyphen or bullet point character, on how to market the event." },
      costEstimate: { type: Type.STRING, description: "Estimated total cost in Indonesian Rupiah (IDR)." },
      expectedRevenue: { type: Type.STRING, description: "Projected revenue in Indonesian Rupiah (IDR)." },
      netProfit: { type: Type.STRING, description: "Calculated net profit in Indonesian Rupiah (IDR)." },
      guestCapacity: { type: Type.NUMBER, description: "Recommended number of guests (pax)." },
      eventObjective: { type: Type.STRING, description: "The main business goal of the event." },
      successMetrics: { type: Type.STRING, description: "How to measure the event's success." },
    },
    required: [
      'eventName', 'dateSuggestion', 'targetAudience', 'entertainment',
      'menuConcept', 'promotionStrategy', 'costEstimate', 'expectedRevenue',
      'netProfit', 'guestCapacity', 'eventObjective', 'successMetrics'
    ]
  };

const generatePrompt = (formData: FormData): string => {
    const month = formData.get('month');
    const audience = formData.get('audience');
    const type = formData.get('type');
    const goal = formData.get('goal');
    const cuisine = formData.get('cuisine');

    let criteria = 'Based on the following criteria, generate one event idea:\n';
    if (month && month !== 'any') criteria += `- Month/Season: ${month}\n`;
    if (audience && audience !== 'any') criteria += `- Target Audience: ${audience}\n`;
    if (type && type !== 'any') criteria += `- Event Type: ${type}\n`;
    if (goal && goal !== 'any') criteria += `- Primary Goal: ${goal}\n`;
    if (cuisine) criteria += `- Cuisine Focus: ${cuisine}\n`;

    if (criteria === 'Based on the following criteria, generate one event idea:\n') {
        return 'Generate a creative and profitable event idea suitable for any time of year.';
    }
    
    return criteria;
};

const displayResult = (data: Record<string, any>) => {
    outputDiv.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'event-card';

    // Title
    const title = document.createElement('h3');
    title.textContent = data.eventName;
    card.appendChild(title);

    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'details-grid';

    const keyToIconMap: { [key: string]: string } = {
        dateSuggestion: '📅',
        targetAudience: '👥',
        guestCapacity: '👨‍👩‍👧‍👦',
        entertainment: '🎤',
        menuConcept: '🍽️',
        eventObjective: '🎯',
        successMetrics: '📈',
    };

    const keyToLabelMap: { [key: string]: string } = {
        dateSuggestion: 'Date Suggestion',
        targetAudience: 'Target Audience',
        guestCapacity: 'Guest Capacity',
        entertainment: 'Entertainment',
        menuConcept: 'Menu Concept',
        eventObjective: 'Event Objective',
        successMetrics: 'Success Metrics',
    };
    
    // Create detail items
    for (const key in keyToLabelMap) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item';
            
            const strong = document.createElement('strong');
            strong.innerHTML = `${keyToIconMap[key]} ${keyToLabelMap[key]}`;
            
            const p = document.createElement('p');
            p.textContent = data[key];

            detailItem.appendChild(strong);
            detailItem.appendChild(p);
            detailsGrid.appendChild(detailItem);
        }
    }
    card.appendChild(detailsGrid);

    // Promotion Strategy
    if (data.promotionStrategy) {
        const promoItem = document.createElement('div');
        promoItem.className = 'detail-item';
        promoItem.innerHTML = `<strong>📣 Promotion Strategy</strong>`;
        const list = document.createElement('ul');
        const strategies = data.promotionStrategy.split(/•|-|\*|\n/).filter((s: string) => s.trim() !== '');
        strategies.forEach((strategy: string) => {
            const li = document.createElement('li');
            li.textContent = strategy.trim();
            list.appendChild(li);
        });
        promoItem.appendChild(list);
        card.appendChild(promoItem);
    }

    // Financials
    const financials = document.createElement('div');
    financials.className = 'financials';
    financials.innerHTML = `<h4>💰 Financial Overview</h4>`;

    const financialGrid = document.createElement('div');
    financialGrid.className = 'financial-grid';
    
    const financialData = {
        'Cost Estimate': data.costEstimate,
        'Expected Revenue': data.expectedRevenue,
        'Net Profit': data.netProfit
    };

    for(const label in financialData) {
        const item = document.createElement('div');
        item.className = 'financial-item';
        item.innerHTML = `<strong>${label}</strong><p>${financialData[label as keyof typeof financialData]}</p>`;
        financialGrid.appendChild(item);
    }
    
    financials.appendChild(financialGrid);
    card.appendChild(financials);

    outputDiv.appendChild(card);
};

const displayError = (message: string) => {
    outputDiv.innerHTML = `<p class="placeholder" style="color: #e53e3e;">${message}</p>`;
};

eventForm.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'block';
    
    loader.style.display = 'block'; // This is the main content loader
    outputDiv.innerHTML = '';

    const formData = new FormData(eventForm);
    const userPrompt = generatePrompt(formData);

    const systemInstruction = `You are an expert event planner and profitability consultant specializing in luxury beachside restaurants in Bali. 
    Your task is to generate a single, highly detailed, and creative event idea for 'Breeze at The Samaya Seminyak'. 
    You must consider the restaurant's brand identity (luxury, romantic, beachfront), the target audience, and the local Balinese culture and seasonality. 
    The idea must be practical, profitable, and enhance the guest experience.
    Structure your response as a JSON object that adheres to the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        displayResult(data);

    } catch (error) {
        console.error('Error generating event idea:', error);
        displayError('Sorry, an error occurred while generating the idea. Please check the console and try again.');
    } finally {
        generateBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
        loader.style.display = 'none'; // Hide main content loader
    }
});