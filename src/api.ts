import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  scenario: string;
  options: string[];
  correctAnswer: string;
  cherExplanation: string;
  hint: string;
}

const SYSTEM_INSTRUCTION = `You are Cher Anthony, a Singapore Principles of Accounts (POA) teacher. Generate a short, punchy multiple-choice question for a secondary school student.

Phase Names and Focus:
1. 'The Fact Finder': 
   - PRIORITY (80%): Focus on identifying "Accounting" vs "Non-accounting" information based on daily business scenarios (e.g., paying bills, buying stock, receiving compliments, hiring plans, WhatsApp inquiries). Options MUST be exactly: ["Accounting", "Non-accounting"]. Ensure a random 50/50 mix of Accounting and Non-accounting scenarios.
   - SECONDARY (20%): Focus on identifying Source Documents, but ONLY ask about "Invoice" or "Credit Note". Do not ask about other documents.
2. 'The Name Game': Focus on identifying specific accounts in a transaction. Provide 3 options where the wrong ones use incorrect account names (e.g., using 'Money' instead of 'Cash at bank').
3. 'The Master Mapper': Focus on classifying Elements (Asset, Liability, Equity, Income, Expense), Nature (Debit/Credit), and Financial Statement placement. For Phase 3, questions MUST follow a three-step identification: Account Name -> Element -> Nature (Dr/Cr) -> Financial Statement.

Question Style:
- Generate direct, simple scenarios. Keep stems simple (e.g. 'Mr Tan buys a laptop for SGD1,200.').
- Keep stems short and punchy.
- CLEAN TEXT: Do NOT wrap the scenario in double quotes. 
- Format all amounts with currency and commas, e.g. SGD1,000.
- Use English (Singapore) spelling (e.g. 'centre' not 'center').
- Output MUST be a valid JSON object.`;

const fallbackQuestions: Record<number, GeneratedQuestion[]> = {
  1: [
    {
      scenario: "Mr Tan receives an Invoice for SGD500 for repair tools.",
      options: ["Accounting", "Non-accounting"],
      correctAnswer: "Accounting",
      cherExplanation: "Receiving an invoice means the business owes money, which is a financial transaction.",
      hint: "Cher Anthony's Tip: Ask yourself—did the value of the business change right now?"
    },
    {
      scenario: "A customer sends a WhatsApp message to ask if your shop is open on Public Holidays.",
      options: ["Accounting", "Non-accounting"],
      correctAnswer: "Non-accounting",
      cherExplanation: "Answering a customer's question does not involve any exchange of money or goods.",
      hint: "Cher Anthony's Tip: Ask yourself—did the value of the business change right now?"
    },
    {
      scenario: "You pay SGD1,200 for shop rental via PayNow.",
      options: ["Accounting", "Non-accounting"],
      correctAnswer: "Accounting",
      cherExplanation: "Paying rent decreases cash, making it an accounting transaction.",
      hint: "Cher Anthony's Tip: Ask yourself—did the value of the business change right now?"
    }
  ],
  2: [
    {
      scenario: "Mr Tan buys a new printer and pays by cash.",
      options: ["Office Equipment, Cash in hand", "Printer, Money", "Purchases, Cash at bank"],
      correctAnswer: "Office Equipment, Cash in hand",
      cherExplanation: "A printer is Office Equipment (an asset), and paying by cash reduces Cash in hand.",
      hint: "Cher Anthony's Tip: Every transaction affects at least two accounts. Look for what comes in and what goes out!"
    }
  ],
  3: [
    {
      scenario: "Map the following account: Inventory",
      options: [
        "Asset | Debit | Statement of Financial Position",
        "Asset | Credit | Statement of Financial Position",
        "Expense | Debit | Statement of Financial Performance"
      ],
      correctAnswer: "Asset | Debit | Statement of Financial Position",
      cherExplanation: "Inventory is an Asset with a Debit nature, and it belongs in the Statement of Financial Position.",
      hint: "Cher Anthony's Tip: Think about the accounting equation and where this account lives!"
    }
  ]
};

export async function generateQuestion(chapter: number, difficulty: number): Promise<GeneratedQuestion> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const phaseName = chapter === 1 ? "'The Fact Finder'" : chapter === 2 ? "'The Name Game'" : "'The Master Mapper'";
    const prompt = `Generate a Level ${difficulty} question for the phase ${phaseName} based on the system instructions.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    return JSON.parse(result.response.text());
  } catch (e) {
    console.error("AI Error, using fallback:", e);
    const fallbacks = fallbackQuestions[chapter] || fallbackQuestions[1];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
