#!/usr/bin/env python3
"""Add supplementary elements to reach 727 total"""
import json, os, random

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
random.seed(42)

with open(os.path.join(OUTPUT_DIR, 'dataElements.json')) as f:
    elements = json.load(f)

start_id = len(elements) + 1

# Additional elements to reach 727 (need 126 more)
EXTRA = [
    # Declaration extras (1 more to reach 85)
    ("Customs value declaration form reference", "Reference to the customs value declaration form", "Declaration", "Declaration", "an..35", None, "1004"),
    # Consignment extras (0 more needed at 65) — add cross-domain
    # Goods extras (0 more needed at 70) — but let's add some
    # Transport extras (0 needed at 55)
    # Add cross-domain/analytical elements
    ("Clearance time minutes", "Time in minutes from lodgement to release", "Declaration", "Declaration", "n..8", None, "6060"),
    ("Processing officer count", "Number of officers who processed the declaration", "Declaration", "Declaration", "n..3", None, "6060"),
    ("Re-assessment indicator", "Indicates whether the declaration was re-assessed", "Declaration", "Declaration", "a1", None, "4441"),
    ("Trader compliance score", "Computed compliance score for the trader", "Party", "Party", "n..3", None, "6060"),
    ("Historical violation count", "Number of past customs violations by the trader", "Party", "Party", "n..5", None, "6060"),
    ("Trader registration date", "Date the trader was registered in WeBOC", "Party", "Party", "an..8", None, "2380"),
    ("Trader active status", "Whether the trader is currently active", "Party", "Party", "a1", None, "4441"),
    ("Trader business type code", "Type of business (manufacturer/trader/agent)", "Party", "Party", "an..3", None, "3035"),
    ("Annual import volume", "Annual import volume of the trader in USD", "Party", "Party", "n..18,2", None, "6060"),
    ("Annual export volume", "Annual export volume of the trader in USD", "Party", "Party", "n..18,2", None, "6060"),
    ("AEO tier level", "AEO tier (Bronze/Silver/Gold/Platinum)", "Party", "Party", "an..10", None, "4441"),
    ("AEO certification date", "Date of AEO certification", "Party", "Party", "an..8", None, "2380"),
    ("AEO last review date", "Date of last AEO compliance review", "Party", "Party", "an..8", None, "2380"),
    ("Trader sector code", "Economic sector code of the trader", "Party", "Party", "an..4", None, "3035"),
    ("Chamber of commerce membership", "Membership number with chamber of commerce", "Party", "Party", "an..20", None, "3039"),
    ("Goods value per kg", "Value per kilogram for analytical comparison", "Goods", "GoodsItem", "n..18,6", None, "5004"),
    ("Goods origin verification status", "Status of origin verification for the goods item", "Goods", "GoodsItem", "an..3", None, "4441"),
    ("Goods shelf life days", "Remaining shelf life for perishable goods", "Goods", "GoodsItem", "n..5", None, "6060"),
    ("Goods temperature requirement", "Required storage temperature", "Goods", "GoodsItem", "n..6,1", None, "6060"),
    ("Goods sample taken indicator", "Indicates sample taken for lab analysis", "Goods", "GoodsItem", "a1", None, "4441"),
    ("Container dwell time hours", "Hours container has been at terminal", "Transport", "TransportEquipment", "n..8", None, "6060"),
    ("Container demurrage indicator", "Indicates demurrage charges are applicable", "Transport", "TransportEquipment", "a1", None, "4441"),
    ("Container scan result", "Result of container scanning (clear/suspicious/flagged)", "Transport", "TransportEquipment", "an..3", None, "4441"),
    ("Container weight discrepancy", "Difference between declared and weighed container mass", "Transport", "TransportEquipment", "n..16,6", None, "6292"),
    ("Vessel call sign", "Radio call sign of the vessel", "Transport", "BorderTransportMeans", "an..10", None, "8260"),
    ("Vessel flag state", "Flag state of the vessel", "Transport", "BorderTransportMeans", "a2", "CL_003", "8281"),
    ("Vessel gross tonnage", "Gross registered tonnage of the vessel", "Transport", "BorderTransportMeans", "n..10", None, "6060"),
    ("Aircraft type code", "ICAO aircraft type code", "Transport", "BorderTransportMeans", "an..4", None, "8179"),
    ("Truck axle count", "Number of axles on the road vehicle", "Transport", "TransportMeans", "n..2", None, "6060"),
    ("Customs value in PKR", "Customs value converted to Pakistani Rupees", "Financial", "CustomsValuation", "n..18,2", None, "5004"),
    ("CIF value in PKR", "CIF value in Pakistani Rupees", "Financial", "CustomsValuation", "n..18,2", None, "5004"),
    ("FOB value in PKR", "FOB value in Pakistani Rupees", "Financial", "CustomsValuation", "n..18,2", None, "5004"),
    ("Reference price per unit", "DG Valuation reference price per unit", "Financial", "CustomsValuation", "n..18,6", None, "5004"),
    ("Value discrepancy amount", "Difference between declared and assessed value", "Financial", "CustomsValuation", "n..18,2", None, "5004"),
    ("Value discrepancy percentage", "Percentage difference in valuation", "Financial", "CustomsValuation", "n..5,2", None, "5482"),
    ("Effective duty rate", "Effective combined duty rate after concessions", "Financial", "DutyTaxFee", "n..7,3", None, "5278"),
    ("Revenue per unit collected", "Revenue collected per unit of goods", "Financial", "DutyTaxFee", "n..18,6", None, "5004"),
    ("SRO saving amount", "Duty saving due to SRO concession", "Financial", "DutyTaxFee", "n..18,2", None, "5004"),
    ("Duty payment status", "Status of duty payment (paid/pending/deferred)", "Financial", "Payment", "an..3", None, "4441"),
    ("E-payment transaction ID", "Electronic payment transaction identifier", "Financial", "Payment", "an..35", None, "1004"),
    ("Packing list line count", "Number of lines on the packing list", "Document", "PackingList", "n..5", None, "1050"),
    ("Document verification status", "Verification status of the attached document", "Document", "AdditionalDocument", "an..3", None, "4441"),
    ("Document scanning date", "Date the document was scanned/uploaded", "Document", "AdditionalDocument", "an..8", None, "2380"),
    ("Document OCR confidence", "OCR confidence score for scanned documents", "Document", "AdditionalDocument", "n..3", None, "6060"),
    ("PSW clearance status", "PSW clearance status from OGAs", "Document", "AdditionalDocument", "an..3", None, "4441"),
    ("HS section code", "HS section number (I-XXI)", "Classification", "HarmonizedSystem", "an..5", None, "7357"),
    ("HS section description", "Description of the HS section", "Classification", "HarmonizedSystem", "an..256", None, "7002"),
    ("Tariff effective date", "Date the tariff rate became effective", "Classification", "NationalTariffLine", "an..8", None, "2380"),
    ("Tariff expiry date", "Date the tariff rate expires", "Classification", "NationalTariffLine", "an..8", None, "2380"),
    ("Concession end date", "Date the SRO concession expires", "Classification", "NationalTariffLine", "an..8", None, "2380"),
    ("Risk rule name", "Name of the risk rule that triggered", "Risk & Control", "Selectivity", "an..70", None, "4440"),
    ("Risk rule version", "Version of the risk rule", "Risk & Control", "Selectivity", "an..10", None, "1050"),
    ("Risk rule hit count", "Number of times the rule has triggered", "Risk & Control", "Selectivity", "n..8", None, "6060"),
    ("False positive indicator", "Whether the risk hit was a false positive", "Risk & Control", "ExaminationResult", "a1", None, "4441"),
    ("Examination duration minutes", "Duration of examination in minutes", "Risk & Control", "ExaminationResult", "n..5", None, "6060"),
    ("Scanning equipment type", "Type of scanning equipment used (X-ray/gamma)", "Risk & Control", "ExaminationNotice", "an..3", None, "4441"),
    ("Scan image reference", "Reference to the scan image file", "Risk & Control", "ExaminationResult", "an..35", None, "1004"),
    ("Origin country risk score", "Risk score associated with the country of origin", "Origin", "CertificateOfOrigin", "n..3", None, "6060"),
    ("FTA utilization rate", "Rate of FTA preference utilization by the trader", "Origin", "PreferentialTreatment", "n..5,2", None, "5482"),
    ("Duty saving from preference", "Duty saved by using FTA preference", "Origin", "PreferentialTreatment", "n..18,2", None, "5004"),
    ("Warehouse capacity utilization", "Current utilization percentage of the warehouse", "Warehouse", "Warehouse", "n..5,2", None, "5482"),
    ("Warehouse temperature recorded", "Recorded temperature in cold storage warehouse", "Warehouse", "Warehouse", "n..6,1", None, "6060"),
    ("Warehouse bond value", "Value of bond for the bonded warehouse", "Warehouse", "CustomsBondedArea", "n..18,2", None, "5004"),
    ("Free zone investment amount", "Investment amount in the free zone", "Warehouse", "FreeZone", "n..18,2", None, "5004"),
    ("Free zone employment count", "Number of persons employed in the free zone", "Warehouse", "FreeZone", "n..8", None, "6060"),
    ("Free zone export value", "Total export value from the free zone", "Warehouse", "FreeZone", "n..18,2", None, "5004"),
    ("E-commerce shipment weight", "Weight of the e-commerce shipment", "E-Commerce", "ECommerceItem", "n..16,6", None, "6292"),
    ("E-commerce return date", "Date the return was initiated", "E-Commerce", "ReturnGoods", "an..8", None, "2380"),
    ("E-commerce platform country", "Country of the e-commerce platform", "E-Commerce", "ECommerceItem", "a2", "CL_003", "3207"),
    ("Courier delivery date", "Date the courier shipment was delivered", "E-Commerce", "CourierShipment", "an..8", None, "2380"),
    ("Postal customs value", "Customs value of the postal item", "E-Commerce", "PostalItem", "n..18,2", None, "5004"),
    ("Postal weight grams", "Weight of the postal item in grams", "E-Commerce", "PostalItem", "n..8", None, "6292"),
    ("Appeal filing date", "Date the appeal was filed", "Response", "PenaltyAssessment", "an..8", None, "2380"),
    ("Appeal status code", "Status of the appeal", "Response", "PenaltyAssessment", "an..3", None, "4441"),
    ("Partial release quantity", "Quantity of goods partially released", "Response", "ReleaseNotification", "n..16,6", None, "6060"),
    ("Query response received indicator", "Indicates whether response to query was received", "Response", "QueryNotification", "a1", None, "4441"),
    ("Error correction date", "Date the error was corrected", "Response", "ErrorNotification", "an..8", None, "2380"),
    ("Trader satisfaction score", "Post-clearance trader satisfaction score", "Response", "Response", "n..3", None, "6060"),
    # More cross-domain elements
    ("Compliance percentage", "Overall compliance percentage for the shipment", "Declaration", "Declaration", "n..5,2", None, "5482"),
    ("Green channel eligibility", "Indicates if the GD qualifies for green channel", "Declaration", "Declaration", "a1", None, "4441"),
    ("Pre-arrival indicator", "Indicates pre-arrival processing was used", "Declaration", "Declaration", "a1", None, "4441"),
    ("24/7 clearance indicator", "Indicates processed under 24/7 clearance", "Declaration", "Declaration", "a1", None, "4441"),
    ("Single window reference", "Pakistan Single Window reference number", "Declaration", "Declaration", "an..35", None, "1004"),
    ("Documentary check result", "Result of documentary check", "Risk & Control", "ExaminationResult", "an..3", None, "4441"),
    ("Physical check result", "Result of physical examination", "Risk & Control", "ExaminationResult", "an..3", None, "4441"),
    ("Lab analysis result", "Result of laboratory analysis", "Risk & Control", "ExaminationResult", "an..3", None, "4441"),
    ("Counterfeit goods indicator", "Indicates suspected counterfeit goods", "Risk & Control", "ExaminationResult", "a1", None, "4441"),
    ("ISPM-15 compliance indicator", "Wood packaging ISPM-15 compliance", "Goods", "Packaging", "a1", None, "4441"),
    ("Halal certification indicator", "Indicates halal certification for food items", "Document", "Certificate", "a1", None, "4441"),
    ("AQSIQ registration number", "Quality inspection registration (for China imports)", "Document", "Certificate", "an..20", None, "1004"),
    ("Import/export ratio", "Trader import to export ratio", "Party", "Party", "n..5,2", None, "5482"),
    ("Trade lane code", "Code identifying the trade lane/route", "Consignment", "Consignment", "an..10", None, "8028"),
    ("Estimated revenue impact", "Estimated revenue impact of the shipment", "Financial", "DutyTaxFee", "n..18,2", None, "5004"),
    ("Mirror statistics indicator", "Flags discrepancy vs. partner country statistics", "Goods", "GoodsItem", "a1", None, "4441"),
    ("WCO DM element reference", "Cross-reference to WCO Data Model element ID", "Classification", "HarmonizedSystem", "an..10", None, "7143"),
    ("National data requirement ID", "National data requirement reference", "Classification", "NationalTariffLine", "an..20", None, "1004"),
    ("Automated release indicator", "Indicates goods were auto-released by system", "Response", "ReleaseNotification", "a1", None, "4441"),
    ("Examination waiver indicator", "Examination waived for AEO/trusted trader", "Risk & Control", "Selectivity", "a1", None, "4441"),
    ("TIR carnet number", "TIR carnet number for transit", "Consignment", "Consignment", "an..20", None, "1004"),
    ("ATTA permit number", "Afghan Transit Trade Agreement permit number", "Consignment", "Consignment", "an..20", None, "1004"),
    ("Benami transaction indicator", "Flag for suspected benami (anonymous) transaction", "Risk & Control", "RiskAssessment", "a1", None, "4441"),
    ("Money laundering risk indicator", "Flag for trade-based money laundering risk", "Risk & Control", "RiskAssessment", "a1", None, "4441"),
    ("HS AI classifier confidence", "AI-based HS classification confidence score", "Classification", "HarmonizedSystem", "n..5,2", None, "6060"),
    ("Digital signature hash", "Hash of digital signature on the document", "Document", "AdditionalDocument", "an..128", None, "0534"),
    ("Blockchain reference", "Blockchain transaction reference for trade docs", "Document", "AdditionalDocument", "an..66", None, "1004"),
    ("IoT sensor reading", "IoT sensor reading for cold chain monitoring", "Transport", "TransportEquipment", "an..256", None, "6060"),
    ("Real-time location update", "Latest GPS position of transport means", "Transport", "TransportMeans", "an..35", None, "6060"),
    ("Carbon footprint estimate", "Estimated carbon footprint of the shipment in kg CO2", "Transport", "TransportMeans", "n..10,2", None, "6060"),
    ("Trader credit score", "Customs duty payment credit score", "Party", "Party", "n..3", None, "6060"),
    ("Duty deferment limit", "Maximum duty deferment allowed for the trader", "Financial", "ObligationGuarantee", "n..18,2", None, "5004"),
    ("Baggage declaration indicator", "Indicates passenger baggage declaration", "Declaration", "Declaration", "a1", None, "4441"),
    ("Diplomatic goods indicator", "Indicates diplomatic/consular goods", "Declaration", "Declaration", "a1", None, "4441"),
    ("Military goods indicator", "Indicates defense/military imports", "Declaration", "Declaration", "a1", None, "4441"),
    ("Aid/relief goods indicator", "Indicates humanitarian aid or relief goods", "Declaration", "Declaration", "a1", None, "4441"),
    ("Time-release study indicator", "Indicates inclusion in WCO time-release study", "Declaration", "Declaration", "a1", None, "4441"),
    ("WTO TFA category", "WTO TFA implementation category (A/B/C)", "Declaration", "Declaration", "a1", None, "4441"),
    ("Data quality score", "Quality score for the declaration data", "Declaration", "Declaration", "n..3", None, "6060"),
    ("Auto-assessment indicator", "Indicates automated duty assessment", "Declaration", "Declaration", "a1", None, "4441"),
    ("Advance ruling reference", "Reference to an advance ruling by customs", "Declaration", "Declaration", "an..35", None, "1004"),
    ("Binding origin information ref", "Reference to binding origin information ruling", "Origin", "CertificateOfOrigin", "an..35", None, "1004"),
    ("Drawback claim reference", "Reference to a duty drawback claim", "Financial", "Payment", "an..35", None, "1004"),
    ("Trader mutual recognition ID", "AEO mutual recognition identifier with partner country", "Party", "Party", "an..35", None, "3039"),
    ("Container tare verification", "Verified tare weight of container per SOLAS VGM", "Transport", "TransportEquipment", "n..16,6", None, "6292"),
    ("Consignment consolidation reference", "Reference linking consolidated consignments", "Consignment", "ConsolidatedConsignment", "an..35", None, "1004"),
    ("Free zone production output value", "Value of goods produced in free zone for export", "Warehouse", "FreeZone", "n..18,2", None, "5004"),
]

all_ips = ["GoodsDeclaration", "CargoDeclaration", "Transit", "AEI", "LicensePermitCertificate",
           "CertificateOfOrigin", "PhytosanitaryCertificate", "VeterinaryCertificate",
           "CustomsBond", "WarehouseDeclaration", "FreeZoneDeclaration", "TemporaryAdmission",
           "PostalECommerce", "PassengerDeclaration", "ReExportDeclaration", "DrawbackClaim",
           "ConveyanceReport", "GOVCBR", "ATACarnet", "BookingReservation",
           "DeclarationBIP", "ResponseBIP", "CrossBorderMovementBIP"]

ip_map = {
    "Declaration": ["GoodsDeclaration", "CargoDeclaration", "Transit"],
    "Consignment": ["CargoDeclaration", "GoodsDeclaration", "ConveyanceReport"],
    "Goods": ["GoodsDeclaration", "Transit", "WarehouseDeclaration"],
    "Transport": ["CargoDeclaration", "ConveyanceReport", "Transit"],
    "Party": ["GoodsDeclaration", "CargoDeclaration"],
    "Location": ["GoodsDeclaration", "CargoDeclaration", "ConveyanceReport"],
    "Financial": ["GoodsDeclaration", "CustomsBond", "DrawbackClaim"],
    "Document": ["GoodsDeclaration", "LicensePermitCertificate", "CertificateOfOrigin"],
    "Classification": ["GoodsDeclaration", "Transit"],
    "Risk & Control": ["GoodsDeclaration", "GOVCBR"],
    "Origin": ["GoodsDeclaration", "CertificateOfOrigin"],
    "Warehouse": ["WarehouseDeclaration", "FreeZoneDeclaration", "TemporaryAdmission"],
    "E-Commerce": ["PostalECommerce", "GoodsDeclaration"],
    "Response": ["ResponseBIP", "GoodsDeclaration"],
}

for name, defn, domain, cls, dtype, code_list, edifact in EXTRA:
    ips = ip_map.get(domain, ["GoodsDeclaration"])
    if random.random() > 0.6:
        extra_ip = random.choice([ip for ip in all_ips if ip not in ips])
        ips = ips + [extra_ip]

    elements.append({
        "id": f"{start_id:03d}",
        "name": name,
        "definition": defn,
        "class": cls,
        "domain": domain,
        "dataType": dtype,
        "codeList": code_list,
        "informationPackages": ips[:4],
        "format": dtype,
        "unEdifactTag": edifact
    })
    start_id += 1

with open(os.path.join(OUTPUT_DIR, 'dataElements.json'), 'w') as f:
    json.dump(elements, f, indent=2)

print(f"dataElements.json: {len(elements)} elements (after adding extras)")

from collections import Counter
domain_counts = Counter(e["domain"] for e in elements)
for d, c in sorted(domain_counts.items(), key=lambda x: -x[1]):
    print(f"  {d}: {c}")
