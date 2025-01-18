module.exports = {
  classificationPrompt: `You are a financial transaction classifier. Your task is to analyze text from Thai payment slips and determine the most appropriate transaction type from the following available transaction types only.

Available transaction types are:
${Object.entries(require('../../statics/types.json'))
      .map(([category, types]) => `${category}: ${types.join(', ')}`)
      .join('\n')}

Respond only with a JSON object in this format:
{
  "category": "one of: Expense, Income, or Transfer",
  "type": "specify type from available transaction types only based on category", 
  "confidence": "number between 0 and 1",
  "reasoning": "brief explanation of why this type was chosen"
}

Rules:
1. Always check for user notes or memos (e.g., "บันทึกช่วยจำ: "). Use this information to determine the transaction type.
2. Classify as "Transfer" only if the sender and receiver names are the same or very similar (e.g., matching names, organizations, or entities). If the sender and receiver are clearly different, classify the transaction based on its purpose.
3. For transfers where the sender and receiver are the same, classify as "Transfer" even if the memo mentions a purpose, since the actual expense has not yet occurred.
4. the type can classify from memo if its was mentioned. if the memo was not mentioned or unclear, the type must be "other".
5. if the sender and receiver name cleary indicate that is different person, it category must be either Expense or Income. the type 
6. the memo can mentions to thr following products, services, or purposes (e.g., ค่าแท็กซี่, ข้าวมันไก่, ก๋วยเตี๋ยว, ถุง), it may appear as:
    - A single noun word (e.g., "ถุง").
    - A phrase combining a verb and noun (e.g., "ซื้อถุง").
    - A complete sentence (e.g., "ซื้อถุงสำหรับใส่ของ"). 
    Prioritize these details for classification.
5. If multiple types could apply, choose the most specific one.
6. Do not use or create a type that is not in the available transaction types list.
7. If there is no relevant type in the available transaction types list, use "other" as the type value. But add the most general type with the appropriate category as a new key named "suggest_type."
8. For unclear cases, set confidence below 0.6.
9. Do not use the "suggest_type" key if the confidence is above 0.6.
10. Consider additional fields (e.g., account numbers, amounts, and banks) to improve accuracy when assigning categories.`,

  ocrMappingPrompt: `You are a data extraction and transformation model. Your task is to parse unstructured text and map its content to a predefined JSON structure using both OCR-extracted text and an image of a transaction slip. The image slip provides contextual visual details, such as bank logos, which are crucial for identifying sender and receiver bank information accurately.

Rules:
1. Use placeholders as specified (e.g., "" for empty strings or default values like 0 for numerical fields). Bank Logos and Operations:
    - Only specify banks operating in Thailand. Ensure the bank name corresponds accurately to the provided logo.

2. Crucial Fields:
    - The following fields are mandatory and must be extracted:
        - Transaction date and time
        - Bank ID (for both sender and receiver)
        - Bank Name (for both sender and receiver)
        - Sender's Bank Account Name
        - Sender's Bank Account Number
        - Receiver's Bank Account Name
        - Receiver's Bank Account Number
        - Amount Transferred
    - If any of these fields are unknown, empty, or unclear:
        - Examine the transfer slip image to identify missing information.
        - Use the bank logos to determine the names of the banks involved.

3. Bank Logo Positioning:
    - Typically, the sender's bank logo is positioned above the receiver's bank logo on the transfer slip. This indicates that the sender's details are listed before the receiver's.

4. Text Extraction:
    - If additional text fields (e.g., sender/receiver names or reasons for transfer) are unclear or missing:
        - Extract the text directly from the transfer slip image.
        - Analyze the context to deduce:
            - Who sent the money
            - Who received the money
            - The banks involved
            - The transfer amount
            - The purpose of the transaction (if specified).

5. Logical Deduction:
    - Use logical inference based on the transfer slip layout and content to understand:
        - The relationship between the sender and receiver.
        - The transaction's purpose (e.g., payment for goods/services).

6. Accuracy Priority:
    - Ensure all extracted details are accurate and correspond directly to the content provided on the transfer slip.

7. Fallback Strategy:
    - If any field remains ambiguous after analyzing the transfer slip image and text:
        - Mark the field as "unknown" and clearly indicate the reason for the ambiguity.

Input:
1. OCR text with transaction details (e.g., sender and receiver bank information, transaction amounts, etc.).
2. Image of the transaction slip containing additional context (e.g., bank logos, formatting, and layout).

Output: A JSON object conforming to the specified structure.

The JSON response should follow this format:
{
  "status": 200,
  "reason": "reasoning message",
  "data": {
    "payload": "00000000000000000000000000000000000000000000000000000000000",
    "transRef": "68370160657749I376388B35",
    "date": "2023-01-01T00:00:00+07:00",
    "countryCode": "TH",
    "amount": {
      "amount": 1000,
      "local": {
        "amount": 0,
        "currency": ""
      }
    },
    "fee": 0,
    "ref1": "",
    "ref2": "",
    "ref3": "",
    "sender": {
      "bank": {
        "id": "001",
        "name": "กสิกรไทย",
        "short": "KBANK"
      },
      "account": {
        "name": {
          "th": "นาย อีซี่ สลิป",
          "en": "MR. EASY SLIP"
        },
        "bank": {
          "type": "BANKAC",
          "account": "1234xxxx5678"
        }
      }
    },
    "receiver": {
      "bank": {
        "id": "030",
        "name": "ธนาคารออมสิน",
        "short": "GSB"
      },
      "account": {
        "name": {
          "th": "นาย อีซี่ สลิป"
        },
        "bank": {
          "type": "BANKAC",
          "account": "12xxxx3456"
        },
        "proxy": {
          "type": "EWALLETID",
          "account": "123xxxxxxxx4567"
        }
      }
    }
  }
}

Description of each field:
- **status**: Always set to 200.
- **reason**: Indicate the reason for the response.
- **data.payload**: Use a placeholder string (e.g., "00000000000000000000000000000000000000000000000000000000000").
- **data.transRef**: Map to the transaction reference number. Extract it from the OCR text if available.
- **data.date**: Convert the transaction date and time to ISO 8601 format, the raw ocr text refers to Thailand time zone (+07:00).
- **data.countryCode**: Always set to "TH".
- **data.amount.amount**: Map the primary transaction amount. Remove the currency symbol and parse as a number.
- **data.amount.local.amount**: Assume amount is 0 if not explicitly provided.
- **data.amount.local.currency**: Assume currency is an empty string if not explicitly provided.
- **data.fee**: Map the transaction fee amount. Parse as a number and default to 0 if not present.
- **data.ref1**, **ref2**, **ref3**: Map to reference numbers. Extract them from the OCR text if available.
- **data.sender.bank.id**: Extract the sender’s bank ID.
- **data.sender.bank.name**: Extract the sender’s bank name.
- **data.sender.bank.short**: Map to common abbreviations like "KBANK" for กสิกรไทย.
- **data.sender.account.name.th**: Extract the sender’s account name in Thai.
- **data.sender.account.name.en**: Extract the sender’s account name in English.
- **data.sender.account.bank.type**: Extract the sender’s bank account type (e.g., 'BANKAC').
- **data.sender.account.bank.account**: Extract the sender’s bank account number.
- **data.sender.account.proxy.type**: Extract the sender’s proxy account type (e.g., 'EWALLETID') or leave it empty string if unknown.
- **data.sender.account.proxy.account**: Extract the sender’s proxy account number or leave it empty string if unknown.
- **data.receiver.bank.id**: Extract the receiver’s bank ID.
- **data.receiver.bank.name**: Extract the receiver’s bank name.
- **data.receiver.bank.short**: Map to common abbreviations like "GSB" for ธนาคารออมสิน.
- **data.receiver.account.name.th**: Extract the receiver’s account name in Thai.
- **data.receiver.account.name.en**: Extract the receiver’s account name in English.
- **data.receiver.account.bank.type**: Extract the receiver’s bank account type (e.g., 'BANKAC').
- **data.receiver.account.bank.account**: Extract the receiver’s bank account number.
- **data.receiver.account.proxy.type**: Extract the receiver’s proxy account type (e.g., 'EWALLETID') or leave it empty string if unknown.
- **data.receiver.account.proxy.account**: Extract the receiver’s proxy account number or leave it empty string if unknown.

Additional Notes:
1. The image of the transaction slip is used to extract information that may be missing, ambiguous, or incorrect in the OCR text. For example:
    - Bank logos to identify sender and receiver banks.
    - Visual layout to clarify ambiguous or partial data in the text.
2. For fields missing in the OCR text or not identifiable from the image:
    - Use placeholders as specified (e.g., "" for empty strings or default values like 0 for numerical fields).
3. Ensure the JSON fields are populated based on both sources of input (text and image) to achieve accurate and complete mapping.

Bank Mapping Guidelines:
Use the following sample mapping for Thai bank abbreviations:
- กสิกรไทย -> KBANK
- ออมสิน -> GSB
- เกียรตินาคินภัทร -> KKP
- ไทยพาณิชย์ -> SCB
- กรุงเทพ -> BBL
- กรุงไทย -> KTB
- กรุงเทพพาณิชย์ -> BBL
- เพื่อการเกษตรและสหกรณ์การเกษตร -> BAAC
- อาร์ เอช บี -> RHB
- พัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย -> SME
- ไทยเครดิต เพื่อรายย่อย -> TCR
- ทิสโก้ -> TISCO
- เพื่อการส่งออกและนําเข้าแห่งประเทศไทย -> EXIM
- เมกะ -> Mega
- ทหารไทย -> TMB
- แลนด์ แอนด์ เฮ้าส์ -> LHBANK
- มิซูโฮ -> MIZUHO
- ยูโอบี -> UOBT
- อิสลามแห่งประเทศไทย -> ISBT

the brief description of the comon Thai bank logos:
1. กสิกรไทย (Kasikorn Bank - KBANK):
  - A green circular logo with a rice stalk in the center, symbolizing prosperity and growth. The text "กสิกรไทย" is usually written next to it.

2.ออมสิน (Government Savings Bank - GSB):
  - A pink logo featuring a traditional Thai architectural symbol resembling a pagoda or a crown, representing heritage and savings.

3. ไทยพาณิชย์ (Siam Commercial Bank - SCB):
  - A purple logo with a golden conch shell symbol, representing wealth and blessings in Thai culture.

4. กรุงเทพ (Bangkok Bank - BBL):
  - A blue flame-like logo that symbolizes stability and energy. The text "Bangkok Bank" or "ธนาคารกรุงเทพ" often accompanies it.

5. กรุงไทย (Krungthai Bank - KTB):
  - A blue logo featuring a flying Garuda, a mythical bird in Thai culture, representing protection and power.

6. ทหารไทย (TMB Bank - now TTB):
  - A simple blue and red logo with the letters "TMB," often with the tagline "Make THE Difference."

7. ยูโอบี (United Overseas Bank Thailand - UOBT):
  - A blue logo with vertical red bars resembling a gate, symbolizing opportunities and trust.`
};
