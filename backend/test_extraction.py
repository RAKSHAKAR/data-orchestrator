from app.services.ocr_service import parse_demand_letter
import json

# Actual EasyOCR output from the user's PDF
test_text = """999 Ponce De Leon Blvd. Ste 515
Coral Gables, FL. 33134
Officc: 786-518-3668
UNLtg
shirazidescoubct com
DEMAND LETTER PURSUANT TO FLORIDA STATUTE
8627.7PIPDM
May 22,2026
VIA US CERTIFIED MAIL
DELIVERY CONFIRMATION
SERVICE NUMBER: 9589 0710 5270 2278 5913 /7
KAREN TORIBIO
UNITED AUTOMOBILE INSURANCE COMPANY
PO Box 694300
Miami; FL33269
Provider: UNIVERSAL INJURY GROUP N MIAMI; LLC
Paticnt: BRAYAM RUIZ CARVAJAL
Claim No 0100437083
Policy No. UAHO00473732
Datc of Loss: 11/17/2025
Date(s) of Service; 14/18/2025 01/23/2026
the total amouni billed by the Provider was $14,414.50 however; the amount owed
200 percent Medicare Fee Schedule Part
the total amount demanded $8,990.65 ($10,000 $1,009.35 prior payments) plus interest
"""

result = parse_demand_letter(test_text)
for k, v in result.items():
    val = v["value"]
    conf = v["confidence"]
    if val not in ("N/A", "0.00", "Not found", "No"):
        print(f"  {k}: {val}  (confidence: {conf:.0%})")

print("\n--- Full JSON ---")
print(json.dumps(result, indent=2))
