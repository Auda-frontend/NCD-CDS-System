import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",  # Meta Llama 3 8B — same model as above
    messages=[
        {
            "role": "system",
            "content": "You are a clinical assistant for Rwanda's NCD program."
        },
        {
            "role": "user",
            "content": "Explain Stage 1 hypertension briefly in 2 sentences."
        }
    ],
    max_tokens=100,
    temperature=0.1
)

print(response.choices[0].message.content)
print("\n✓ Working")