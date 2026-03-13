#!/usr/bin/env python3
"""Generate codeLists.json for TAIW — 50 key code lists"""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')

CODE_LISTS = [
    {"id": "CL_001", "name": "Declaration type code", "source": "WCO", "values": [
        {"code": "IM", "description": "Import declaration"}, {"code": "EX", "description": "Export declaration"},
        {"code": "TR", "description": "Transit declaration"}, {"code": "CO", "description": "Combined declaration"},
        {"code": "RE", "description": "Re-export declaration"}, {"code": "WH", "description": "Warehousing declaration"},
        {"code": "TA", "description": "Temporary admission"}, {"code": "IB", "description": "In-bond transfer"}
    ], "pakMapping": "WeBOC GD Type field (HC, EX, WH, TR, TS, IB, EB, TA, EFS, TI, RI, RE, SS, BD, ST, PB)"},
    {"id": "CL_002", "name": "Message function code", "source": "UN/EDIFACT 1225", "values": [
        {"code": "9", "description": "Original"}, {"code": "5", "description": "Replacement"},
        {"code": "1", "description": "Cancellation"}, {"code": "4", "description": "Change/amendment"},
        {"code": "11", "description": "Response"}, {"code": "46", "description": "Provisional"}
    ], "pakMapping": "WeBOC message function for GD submission/amendment/cancellation"},
    {"id": "CL_003", "name": "Country code (ISO 3166-1 alpha-2)", "source": "ISO", "values": [
        {"code": "PK", "description": "Pakistan"}, {"code": "CN", "description": "China"},
        {"code": "US", "description": "United States"}, {"code": "AE", "description": "United Arab Emirates"},
        {"code": "SA", "description": "Saudi Arabia"}, {"code": "DE", "description": "Germany"},
        {"code": "GB", "description": "United Kingdom"}, {"code": "AF", "description": "Afghanistan"},
        {"code": "IN", "description": "India"}, {"code": "TR", "description": "Türkiye"},
        {"code": "ID", "description": "Indonesia"}, {"code": "MY", "description": "Malaysia"},
        {"code": "JP", "description": "Japan"}, {"code": "KR", "description": "South Korea"},
        {"code": "BD", "description": "Bangladesh"}, {"code": "IR", "description": "Iran"},
        {"code": "IT", "description": "Italy"}, {"code": "NL", "description": "Netherlands"},
        {"code": "FR", "description": "France"}, {"code": "TH", "description": "Thailand"}
    ], "pakMapping": "Country of origin, destination, dispatch in WeBOC GD"},
    {"id": "CL_004", "name": "Currency code (ISO 4217)", "source": "ISO", "values": [
        {"code": "PKR", "description": "Pakistani Rupee"}, {"code": "USD", "description": "US Dollar"},
        {"code": "EUR", "description": "Euro"}, {"code": "GBP", "description": "British Pound"},
        {"code": "CNY", "description": "Chinese Yuan"}, {"code": "AED", "description": "UAE Dirham"},
        {"code": "SAR", "description": "Saudi Riyal"}, {"code": "JPY", "description": "Japanese Yen"},
        {"code": "CHF", "description": "Swiss Franc"}, {"code": "CAD", "description": "Canadian Dollar"}
    ], "pakMapping": "Invoice currency and SBP exchange rate reference"},
    {"id": "CL_005", "name": "Transport mode code (UN/ECE Rec 19)", "source": "UN/ECE", "values": [
        {"code": "1", "description": "Maritime transport"}, {"code": "2", "description": "Rail transport"},
        {"code": "3", "description": "Road transport"}, {"code": "4", "description": "Air transport"},
        {"code": "5", "description": "Mail"}, {"code": "6", "description": "Multimodal transport"},
        {"code": "7", "description": "Fixed transport installations (pipeline)"}, {"code": "8", "description": "Inland waterway transport"},
        {"code": "9", "description": "Mode not applicable"}
    ], "pakMapping": "Mode of transport in WeBOC (Sea ~60%, Air ~25%, Land ~15%)"},
    {"id": "CL_006", "name": "Package type code (UN/ECE Rec 21)", "source": "UN/ECE", "values": [
        {"code": "CT", "description": "Carton"}, {"code": "BG", "description": "Bag"},
        {"code": "BX", "description": "Box"}, {"code": "PK", "description": "Package"},
        {"code": "DR", "description": "Drum"}, {"code": "CR", "description": "Crate"},
        {"code": "PL", "description": "Pallet"}, {"code": "BL", "description": "Bale"},
        {"code": "CY", "description": "Cylinder"}, {"code": "SK", "description": "Sack"},
        {"code": "CS", "description": "Case"}, {"code": "RL", "description": "Reel/roll"},
        {"code": "NE", "description": "Unpacked/unpackaged"}
    ], "pakMapping": "Package type in WeBOC GD line items"},
    {"id": "CL_007", "name": "Container size/type code (ISO 6346)", "source": "ISO", "values": [
        {"code": "20GP", "description": "20ft General Purpose"}, {"code": "40GP", "description": "40ft General Purpose"},
        {"code": "40HC", "description": "40ft High Cube"}, {"code": "20RF", "description": "20ft Reefer"},
        {"code": "40RF", "description": "40ft Reefer"}, {"code": "20OT", "description": "20ft Open Top"},
        {"code": "40OT", "description": "40ft Open Top"}, {"code": "20FR", "description": "20ft Flat Rack"},
        {"code": "40FR", "description": "40ft Flat Rack"}, {"code": "20TK", "description": "20ft Tank Container"}
    ], "pakMapping": "Container type at KPT, PQIA, Gwadar terminals"},
    {"id": "CL_008", "name": "Customs procedure code (CPC)", "source": "WCO Kyoto/National", "values": [
        {"code": "4000", "description": "Home consumption (import for domestic use)"}, {"code": "4071", "description": "Import with duty exemption under SRO"},
        {"code": "1000", "description": "Export (outright)"}, {"code": "1040", "description": "Export after inward processing"},
        {"code": "7100", "description": "Warehousing entry"}, {"code": "4071", "description": "Release from warehouse for home consumption"},
        {"code": "8000", "description": "Transit"}, {"code": "5300", "description": "Temporary admission"},
        {"code": "6100", "description": "Re-import after outward processing"}, {"code": "3100", "description": "Re-export"}
    ], "pakMapping": "CPC codes used in WeBOC GD Government Procedure field"},
    {"id": "CL_009", "name": "Preference code", "source": "National", "values": [
        {"code": "100", "description": "Normal (MFN) rate"}, {"code": "200", "description": "GSP preference"},
        {"code": "300", "description": "FTA preference"}, {"code": "310", "description": "CPFTA-II preference"},
        {"code": "320", "description": "SAFTA preference"}, {"code": "330", "description": "ECO TPA preference"},
        {"code": "340", "description": "D-8 PTA preference"}, {"code": "400", "description": "SRO concessionary rate"},
        {"code": "500", "description": "Duty exemption (diplomatic/aid)"}, {"code": "210", "description": "EU GSP+ preference"}
    ], "pakMapping": "Preference code in WeBOC GD for concessionary duty rates"},
    {"id": "CL_010", "name": "Party function code", "source": "UN/EDIFACT 3035", "values": [
        {"code": "AG", "description": "Agent/representative"}, {"code": "BY", "description": "Buyer"},
        {"code": "SE", "description": "Seller"}, {"code": "CN", "description": "Consignee"},
        {"code": "CZ", "description": "Consignor/shipper"}, {"code": "DT", "description": "Declarant"},
        {"code": "CA", "description": "Carrier"}, {"code": "CB", "description": "Customs broker"},
        {"code": "IM", "description": "Importer"}, {"code": "EX", "description": "Exporter"},
        {"code": "MF", "description": "Manufacturer"}, {"code": "NI", "description": "Notify party"},
        {"code": "FW", "description": "Freight forwarder"}, {"code": "WH", "description": "Warehouse keeper"}
    ], "pakMapping": "Party roles in WeBOC GD"},
    {"id": "CL_011", "name": "Location function code", "source": "UN/EDIFACT 3227", "values": [
        {"code": "1", "description": "Place of terms of delivery"}, {"code": "5", "description": "Place of departure"},
        {"code": "7", "description": "Place of delivery"}, {"code": "9", "description": "Place of loading"},
        {"code": "11", "description": "Place of discharge"}, {"code": "13", "description": "Place of destination"},
        {"code": "14", "description": "Country of origin"}, {"code": "17", "description": "Country of destination"},
        {"code": "18", "description": "Country of transit"}, {"code": "22", "description": "Customs office of entry"},
        {"code": "24", "description": "Customs office of exit"}, {"code": "27", "description": "Country of dispatch"},
        {"code": "35", "description": "Examination location"}
    ], "pakMapping": "Location codes in WeBOC GD"},
    {"id": "CL_012", "name": "Document type code", "source": "UN/EDIFACT 1001", "values": [
        {"code": "380", "description": "Commercial invoice"}, {"code": "714", "description": "Packing list"},
        {"code": "705", "description": "Bill of lading"}, {"code": "740", "description": "Air waybill"},
        {"code": "861", "description": "Certificate of origin"}, {"code": "935", "description": "Import licence"},
        {"code": "941", "description": "Phytosanitary certificate"}, {"code": "933", "description": "Veterinary certificate"},
        {"code": "270", "description": "Insurance certificate"}, {"code": "325", "description": "Weight certificate"},
        {"code": "520", "description": "Transit document"}, {"code": "235", "description": "Customs bond"}
    ], "pakMapping": "Supporting document types attached to WeBOC GD"},
    {"id": "CL_013", "name": "Duty/tax type code", "source": "National/WCO", "values": [
        {"code": "A00", "description": "Customs duty"}, {"code": "A10", "description": "Additional customs duty (ACD)"},
        {"code": "A20", "description": "Regulatory duty (RD)"}, {"code": "B00", "description": "Sales tax (GST)"},
        {"code": "B10", "description": "Further sales tax"}, {"code": "C00", "description": "Advance income tax (WHT)"},
        {"code": "D00", "description": "Federal excise duty (FED)"}, {"code": "E00", "description": "Anti-dumping duty"},
        {"code": "E10", "description": "Countervailing duty"}, {"code": "F00", "description": "Surcharge"}
    ], "pakMapping": "Duty/tax types in WeBOC assessment module"},
    {"id": "CL_014", "name": "Payment method code", "source": "UN/EDIFACT 4461", "values": [
        {"code": "E", "description": "Electronic bank transfer"}, {"code": "C", "description": "Cash"},
        {"code": "D", "description": "Deferred payment"}, {"code": "G", "description": "Government account"},
        {"code": "O", "description": "Online payment (1-Link/JazzCash/Easypaisa)"}, {"code": "S", "description": "Surety bond"},
        {"code": "K", "description": "Bank challan"}, {"code": "L", "description": "Letter of credit"}
    ], "pakMapping": "Payment methods in WeBOC (mostly E-payment via banks)"},
    {"id": "CL_015", "name": "Guarantee type code", "source": "WCO/National", "values": [
        {"code": "0", "description": "No guarantee"}, {"code": "1", "description": "Comprehensive guarantee"},
        {"code": "2", "description": "Individual guarantee by bank"}, {"code": "3", "description": "Cash deposit"},
        {"code": "4", "description": "Individual guarantee by insurer"}, {"code": "5", "description": "Guarantee waived (AEO)"},
        {"code": "8", "description": "Guarantee not required under SRO"}
    ], "pakMapping": "Bond/guarantee types for WeBOC warehousing and transit"},
    {"id": "CL_016", "name": "Examination type code", "source": "National", "values": [
        {"code": "DOC", "description": "Documentary examination"}, {"code": "PHY", "description": "Physical examination"},
        {"code": "SCN", "description": "Non-intrusive scanning (X-ray/gamma)"},
        {"code": "LAB", "description": "Laboratory analysis/sampling"}, {"code": "SPC", "description": "Special examination (controlled delivery)"},
        {"code": "PCA", "description": "Post-clearance audit"}
    ], "pakMapping": "Examination types in WeBOC (linked to selectivity channel)"},
    {"id": "CL_017", "name": "Examination result code", "source": "National", "values": [
        {"code": "SAT", "description": "Satisfactory — no discrepancy found"}, {"code": "MIN", "description": "Minor discrepancy (correctable)"},
        {"code": "MAJ", "description": "Major discrepancy (duty shortfall/misdeclaration)"}, {"code": "SEZ", "description": "Seizure — goods confiscated"},
        {"code": "REF", "description": "Referred for further investigation"}, {"code": "PEN", "description": "Penalty assessed"}
    ], "pakMapping": "Examination results recorded in WeBOC"},
    {"id": "CL_018", "name": "Seal type code", "source": "WCO/National", "values": [
        {"code": "CA", "description": "Carrier seal"}, {"code": "CU", "description": "Customs seal"},
        {"code": "SH", "description": "Shipper seal"}, {"code": "TO", "description": "Terminal operator seal"},
        {"code": "EL", "description": "Electronic seal (e-seal)"}, {"code": "OT", "description": "Other/third-party seal"}
    ], "pakMapping": "Seal types for container and vehicle sealing at customs"},
    {"id": "CL_019", "name": "Risk level code", "source": "National/WCO", "values": [
        {"code": "G", "description": "Green — low risk (auto-release)"}, {"code": "Y", "description": "Yellow — medium risk (documentary check)"},
        {"code": "R", "description": "Red — high risk (physical examination)"}, {"code": "B", "description": "Blue — post-clearance audit selection"},
        {"code": "W", "description": "White — controlled delivery (enforcement)"}
    ], "pakMapping": "WeBOC selectivity channels (Green ~60%, Yellow ~25%, Red ~15%)"},
    {"id": "CL_020", "name": "AEO status code", "source": "WCO/National", "values": [
        {"code": "NONE", "description": "Not AEO certified"}, {"code": "AEO-S", "description": "AEO for Safety/Security"},
        {"code": "AEO-C", "description": "AEO for Customs Simplification"}, {"code": "AEO-F", "description": "AEO Full (Safety + Customs)"},
        {"code": "SUSP", "description": "AEO status suspended"}, {"code": "REVK", "description": "AEO status revoked"}
    ], "pakMapping": "AEO tiers in Pakistan (Bronze/Silver/Gold — <50 certified as of 2025)"},
    {"id": "CL_021", "name": "Valuation method code (WTO 1-6)", "source": "WTO", "values": [
        {"code": "1", "description": "Transaction value of imported goods (Article 1)"},
        {"code": "2", "description": "Transaction value of identical goods (Article 2)"},
        {"code": "3", "description": "Transaction value of similar goods (Article 3)"},
        {"code": "4", "description": "Deductive value (Article 5)"},
        {"code": "5", "description": "Computed value (Article 6)"},
        {"code": "6", "description": "Fallback method (Article 7)"}
    ], "pakMapping": "WTO valuation methods — Pakistan mostly uses Method 1, DG Valuation applies Method 6 for under-invoicing"},
    {"id": "CL_022", "name": "Incoterms (2020)", "source": "ICC", "values": [
        {"code": "EXW", "description": "Ex Works"}, {"code": "FCA", "description": "Free Carrier"},
        {"code": "FAS", "description": "Free Alongside Ship"}, {"code": "FOB", "description": "Free on Board"},
        {"code": "CFR", "description": "Cost and Freight"}, {"code": "CIF", "description": "Cost, Insurance and Freight"},
        {"code": "CPT", "description": "Carriage Paid To"}, {"code": "CIP", "description": "Carriage and Insurance Paid To"},
        {"code": "DAP", "description": "Delivered at Place"}, {"code": "DPU", "description": "Delivered at Place Unloaded"},
        {"code": "DDP", "description": "Delivered Duty Paid"}
    ], "pakMapping": "Terms of delivery in WeBOC GD — CIF most common for imports"},
    {"id": "CL_023", "name": "UN/LOCODE (Pakistan ports)", "source": "UN/ECE", "values": [
        {"code": "PKKHI", "description": "Karachi (KPT/KICT/PICT/SAPT)"}, {"code": "PKBQM", "description": "Port Muhammad Bin Qasim (QICT/PIBT)"},
        {"code": "PKGWD", "description": "Gwadar Port"}, {"code": "PKLHE", "description": "Lahore (airport + dry port)"},
        {"code": "PKISB", "description": "Islamabad (airport)"}, {"code": "PKPEW", "description": "Peshawar (airport + dry port)"},
        {"code": "PKFSD", "description": "Faisalabad (dry port)"}, {"code": "PKWGA", "description": "Wagah (India land border)"},
        {"code": "PKTRK", "description": "Torkham (Afghanistan land border)"}, {"code": "PKCHM", "description": "Chaman (Afghanistan land border)"},
        {"code": "PKSST", "description": "Sost (China land border, KKH)"}, {"code": "PKMUX", "description": "Multan (dry port)"},
        {"code": "PKSKT", "description": "Sialkot (airport + dry port)"}, {"code": "PKQTA", "description": "Quetta (airport)"}
    ], "pakMapping": "Pakistan customs stations and ports in WeBOC"},
    {"id": "CL_024", "name": "HS Chapter (01-97)", "source": "WCO", "values": [
        {"code": "01-05", "description": "Live animals; Animal products"}, {"code": "06-14", "description": "Vegetable products"},
        {"code": "15", "description": "Animal/vegetable fats and oils"}, {"code": "16-24", "description": "Prepared foodstuffs"},
        {"code": "25-27", "description": "Mineral products"}, {"code": "28-38", "description": "Chemical products"},
        {"code": "39-40", "description": "Plastics and rubber"}, {"code": "41-43", "description": "Hides, skins, leather"},
        {"code": "44-46", "description": "Wood and articles of wood"}, {"code": "47-49", "description": "Pulp, paper"},
        {"code": "50-63", "description": "Textiles and textile articles"}, {"code": "64-67", "description": "Footwear, headgear"},
        {"code": "68-70", "description": "Stone, cement, ceramic, glass"}, {"code": "71", "description": "Precious metals, stones, jewelry"},
        {"code": "72-83", "description": "Base metals and articles"}, {"code": "84-85", "description": "Machinery, electrical equipment"},
        {"code": "86-89", "description": "Vehicles, aircraft, vessels"}, {"code": "90-92", "description": "Optical, measuring, medical instruments"},
        {"code": "93", "description": "Arms and ammunition"}, {"code": "94-96", "description": "Furniture, toys, misc manufactured"},
        {"code": "97", "description": "Works of art, antiques"}
    ], "pakMapping": "HS chapters for PCT (Pakistan Customs Tariff) classification"},
    {"id": "CL_025", "name": "Selectivity channel code", "source": "National", "values": [
        {"code": "G", "description": "Green channel — auto release"},
        {"code": "Y", "description": "Yellow channel — documentary check"},
        {"code": "R", "description": "Red channel — physical examination"},
        {"code": "B", "description": "Blue channel — post clearance audit"}
    ], "pakMapping": "WeBOC risk selectivity channels"},
    {"id": "CL_026", "name": "GD type code (Pakistan)", "source": "National", "values": [
        {"code": "HC", "description": "Home Consumption"}, {"code": "WH", "description": "Warehousing"},
        {"code": "EX", "description": "Export"}, {"code": "TR", "description": "Transit (ATTA)"},
        {"code": "TS", "description": "Transshipment"}, {"code": "IB", "description": "In-Bond Transfer"},
        {"code": "EB", "description": "Ex-Bond"}, {"code": "TA", "description": "Temporary Admission"},
        {"code": "EFS", "description": "Export Facilitation Scheme"}, {"code": "TI", "description": "Temporary Import"},
        {"code": "RI", "description": "Re-Import"}, {"code": "RE", "description": "Re-Export"},
        {"code": "SS", "description": "Ship Stores"}, {"code": "BD", "description": "Batch Data"},
        {"code": "ST", "description": "Safe Transportation"}, {"code": "PB", "description": "Personal Baggage"}
    ], "pakMapping": "All 16 GD types in WeBOC (the $6.5B data gap affected 9 of these)"},
    {"id": "CL_027", "name": "Collectorate code (Pakistan)", "source": "National", "values": [
        {"code": "APPR", "description": "MCC Appraisement (East/West/South)"}, {"code": "PREV", "description": "MCC Preventive"},
        {"code": "PORT", "description": "MCC Port Qasim"}, {"code": "AIRK", "description": "MCC Air Freight Unit Karachi"},
        {"code": "LAHE", "description": "CC Lahore"}, {"code": "FAIS", "description": "CC Faisalabad"},
        {"code": "ISLA", "description": "CC Islamabad"}, {"code": "PESH", "description": "CC Peshawar"},
        {"code": "QUET", "description": "CC Quetta"}, {"code": "GWDR", "description": "CC Gwadar"},
        {"code": "HYED", "description": "CC Hyderabad"}, {"code": "MULT", "description": "CC Multan"},
        {"code": "SIAL", "description": "CC Sialkot"}
    ], "pakMapping": "FBR customs collectorate codes"},
    {"id": "CL_028", "name": "FTA agreement code", "source": "National", "values": [
        {"code": "CPFTA2", "description": "China-Pakistan FTA Phase 2"}, {"code": "SAFTA", "description": "South Asian Free Trade Area"},
        {"code": "D8PTA", "description": "D-8 Preferential Trade Agreement"}, {"code": "ECOTPA", "description": "ECO Trade Preferential Agreement"},
        {"code": "GSPPLUS", "description": "EU GSP Plus"}, {"code": "APTA", "description": "Asia-Pacific Trade Agreement"},
        {"code": "PKMY", "description": "Pakistan-Malaysia FTA (negotiating)"}, {"code": "PKTR", "description": "Pakistan-Türkiye FTA (negotiating)"}
    ], "pakMapping": "FTA codes used in preference declarations"},
    {"id": "CL_029", "name": "SRO type code", "source": "National", "values": [
        {"code": "CD", "description": "Customs duty exemption/reduction"}, {"code": "ST", "description": "Sales tax exemption"},
        {"code": "RD", "description": "Regulatory duty imposition"}, {"code": "FED", "description": "Federal excise duty"},
        {"code": "WHT", "description": "Withholding tax exemption"}, {"code": "ADD", "description": "Anti-dumping duty"},
        {"code": "CVD", "description": "Countervailing duty"}, {"code": "GEN", "description": "General notification"}
    ], "pakMapping": "Types of Statutory Regulatory Orders from FBR (500+ active)"},
    {"id": "CL_030", "name": "Customs duty slab code", "source": "National", "values": [
        {"code": "0", "description": "0% — Raw materials/essentials"}, {"code": "3", "description": "3% — Basic inputs"},
        {"code": "5", "description": "5% — Semi-finished goods"}, {"code": "7", "description": "7% — Industrial inputs"},
        {"code": "10", "description": "10% — Intermediate goods"}, {"code": "11", "description": "11% — Standard rate"},
        {"code": "15", "description": "15% — Semi-luxury goods"}, {"code": "16", "description": "16% — Consumer goods"},
        {"code": "20", "description": "20% — Luxury/protective rate"}, {"code": "25", "description": "25% — Highly protected items"},
        {"code": "30", "description": "30% — Maximum protective rate"}
    ], "pakMapping": "Pakistan customs duty slabs (First Schedule, Customs Act 1969)"},
    {"id": "CL_031", "name": "Province code (Pakistan)", "source": "National", "values": [
        {"code": "PB", "description": "Punjab"}, {"code": "SD", "description": "Sindh"},
        {"code": "KP", "description": "Khyber Pakhtunkhwa"}, {"code": "BL", "description": "Balochistan"},
        {"code": "IC", "description": "Islamabad Capital Territory"}, {"code": "AK", "description": "Azad Jammu & Kashmir"},
        {"code": "GB", "description": "Gilgit-Baltistan"}, {"code": "NMD", "description": "Newly Merged Districts (ex-FATA)"}
    ], "pakMapping": "Province codes for trader registration and customs jurisdiction"},
    {"id": "CL_032", "name": "Unit of measure code", "source": "UN/ECE Rec 20", "values": [
        {"code": "KGM", "description": "Kilogram"}, {"code": "TNE", "description": "Metric ton"},
        {"code": "LTR", "description": "Litre"}, {"code": "MTR", "description": "Metre"},
        {"code": "MTK", "description": "Square metre"}, {"code": "MTQ", "description": "Cubic metre"},
        {"code": "PCE", "description": "Piece"}, {"code": "PRS", "description": "Pair"},
        {"code": "DZN", "description": "Dozen"}, {"code": "GRM", "description": "Gram"},
        {"code": "LBR", "description": "Pound"}, {"code": "KWH", "description": "Kilowatt hour"}
    ], "pakMapping": "UOM codes in WeBOC for quantity declaration"},
    {"id": "CL_033", "name": "Response decision code", "source": "National", "values": [
        {"code": "ACC", "description": "Accepted"}, {"code": "REJ", "description": "Rejected"},
        {"code": "QRY", "description": "Query — additional information required"},
        {"code": "HLD", "description": "Held — pending further processing"},
        {"code": "REL", "description": "Released"}, {"code": "PRL", "description": "Partial release"},
        {"code": "CAN", "description": "Cancelled"}, {"code": "AMD", "description": "Amendment required"}
    ], "pakMapping": "WeBOC GD status codes"},
    {"id": "CL_034", "name": "Port terminal code (KPT)", "source": "National", "values": [
        {"code": "KICT", "description": "Karachi International Container Terminal (Hutchison)"}, {"code": "PICT", "description": "Pakistan International Container Terminal (Maersk)"},
        {"code": "SAPT", "description": "South Asia Pakistan Terminals (DP World)"}, {"code": "KPT-BT", "description": "KPT Bulk Terminal"},
        {"code": "QICT", "description": "Qasim International Container Terminal"}, {"code": "PIBT", "description": "Pakistan International Bulk Terminal"},
        {"code": "FOTCO", "description": "Fauji Oil Terminal & Distribution Co"}, {"code": "EVTL", "description": "Engro Vopak Terminal"},
        {"code": "GPA", "description": "Gwadar Port Authority"}
    ], "pakMapping": "Port terminal operators in WeBOC"},
    {"id": "CL_035", "name": "Dangerous goods class (ADR)", "source": "UN", "values": [
        {"code": "1", "description": "Explosives"}, {"code": "2", "description": "Gases"},
        {"code": "3", "description": "Flammable liquids"}, {"code": "4", "description": "Flammable solids"},
        {"code": "5", "description": "Oxidizing substances"}, {"code": "6", "description": "Toxic/infectious substances"},
        {"code": "7", "description": "Radioactive material"}, {"code": "8", "description": "Corrosive substances"},
        {"code": "9", "description": "Miscellaneous dangerous goods"}
    ], "pakMapping": "DG class for hazardous cargo handling at ports"},
    {"id": "CL_036", "name": "CPEC SEZ code", "source": "National", "values": [
        {"code": "RSHK", "description": "Rashakai SEZ (KP)"}, {"code": "AIIC", "description": "Allama Iqbal Industrial City (Punjab)"},
        {"code": "DHBJ", "description": "Dhabeji SEZ (Sindh)"}, {"code": "BSTN", "description": "Bostan SEZ (Balochistan)"},
        {"code": "M3IC", "description": "M-3 Industrial City (Faisalabad)"}, {"code": "ICTZ", "description": "ICT Model Zone (Islamabad)"},
        {"code": "CMJK", "description": "China SEZ Mirpur (AJK)"}, {"code": "GFZA", "description": "Gwadar Free Zone (Phase 1&2)"}
    ], "pakMapping": "CPEC Special Economic Zones with customs privileges"},
    {"id": "CL_037", "name": "Trader type code", "source": "National", "values": [
        {"code": "MFR", "description": "Manufacturer/producer"}, {"code": "TRD", "description": "Commercial trader"},
        {"code": "IND", "description": "Industrial consumer"}, {"code": "GOV", "description": "Government entity"},
        {"code": "NGO", "description": "Non-profit/NGO"}, {"code": "DIP", "description": "Diplomatic mission"},
        {"code": "AEO", "description": "Authorized Economic Operator"}, {"code": "CHA", "description": "Clearing/handling agent"}
    ], "pakMapping": "Trader categories in WeBOC registration"},
    {"id": "CL_038", "name": "OGA code (Other Government Agency)", "source": "National", "values": [
        {"code": "DPP", "description": "Department of Plant Protection"}, {"code": "AQSD", "description": "Animal Quarantine Service"},
        {"code": "DRAP", "description": "Drug Regulatory Authority of Pakistan"}, {"code": "PSQCA", "description": "Pakistan Standards & Quality Control Authority"},
        {"code": "PNRA", "description": "Pakistan Nuclear Regulatory Authority"}, {"code": "MOC", "description": "Ministry of Commerce (strategic goods)"},
        {"code": "MNH", "description": "Ministry of National Health"}, {"code": "ANF", "description": "Anti-Narcotics Force"},
        {"code": "SUPARCO", "description": "Space & Upper Atmosphere Research Commission"}, {"code": "PEC", "description": "Pakistan Engineering Council"}
    ], "pakMapping": "OGAs integrated via Pakistan Single Window (PSW) — ~40 of 70+ active"},
    {"id": "CL_039", "name": "Bank code (Pakistan)", "source": "National", "values": [
        {"code": "HBL", "description": "Habib Bank Limited"}, {"code": "UBL", "description": "United Bank Limited"},
        {"code": "NBP", "description": "National Bank of Pakistan"}, {"code": "MCB", "description": "MCB Bank Limited"},
        {"code": "ABL", "description": "Allied Bank Limited"}, {"code": "SBP", "description": "State Bank of Pakistan"},
        {"code": "BAF", "description": "Bank Alfalah"}, {"code": "MEZ", "description": "Meezan Bank"},
        {"code": "STD", "description": "Standard Chartered Pakistan"}, {"code": "FAY", "description": "Faysal Bank"}
    ], "pakMapping": "Banks authorized for customs duty e-payment"},
    {"id": "CL_040", "name": "Customs bond type code", "source": "National", "values": [
        {"code": "SUR", "description": "Surety bond (bank guarantee)"}, {"code": "CSH", "description": "Cash security deposit"},
        {"code": "INS", "description": "Insurance bond"}, {"code": "PRB", "description": "Personal bond"},
        {"code": "IDB", "description": "Indemnity bond"}, {"code": "PDB", "description": "Post-dated bank cheque"}
    ], "pakMapping": "Bond types for warehousing, transit, temporary admission in WeBOC"},
    {"id": "CL_041", "name": "Conveyance type code", "source": "National", "values": [
        {"code": "VES", "description": "Vessel (cargo ship)"}, {"code": "TKR", "description": "Tanker vessel"},
        {"code": "BLK", "description": "Bulk carrier"}, {"code": "CNT", "description": "Container vessel"},
        {"code": "AIR", "description": "Aircraft (cargo)"}, {"code": "PAX", "description": "Passenger aircraft (belly cargo)"},
        {"code": "TRK", "description": "Truck/lorry"}, {"code": "TRL", "description": "Trailer/semi-trailer"},
        {"code": "RWG", "description": "Railway wagon"}, {"code": "PIP", "description": "Pipeline"}
    ], "pakMapping": "Conveyance types at Pakistani ports/borders"},
    {"id": "CL_042", "name": "Afghan transit route code", "source": "National", "values": [
        {"code": "TRK-KHI", "description": "Torkham via Karachi seaport"}, {"code": "TRK-PQ", "description": "Torkham via Port Qasim"},
        {"code": "CHM-KHI", "description": "Chaman via Karachi seaport"}, {"code": "CHM-PQ", "description": "Chaman via Port Qasim"},
        {"code": "WAG-TRK", "description": "Wagah to Torkham (rail/road)"}
    ], "pakMapping": "ATTA transit routes through Pakistan"},
    {"id": "CL_043", "name": "Import/export indicator", "source": "National", "values": [
        {"code": "I", "description": "Import"}, {"code": "E", "description": "Export"},
        {"code": "T", "description": "Transit"}, {"code": "R", "description": "Re-export"},
        {"code": "D", "description": "Domestic (in-bond)"}
    ], "pakMapping": "Trade direction indicator"},
    {"id": "CL_044", "name": "Goods condition code", "source": "WCO", "values": [
        {"code": "NEW", "description": "New/unused goods"}, {"code": "USD", "description": "Used/second-hand goods"},
        {"code": "REC", "description": "Reconditioned"}, {"code": "DMG", "description": "Damaged goods"},
        {"code": "SAM", "description": "Samples (not for sale)"}, {"code": "RET", "description": "Returned goods"}
    ], "pakMapping": "Goods condition affects valuation and duty"},
    {"id": "CL_045", "name": "Trade finance instrument code", "source": "Banking", "values": [
        {"code": "LC", "description": "Letter of credit"}, {"code": "DA", "description": "Documents against acceptance"},
        {"code": "DP", "description": "Documents against payment"}, {"code": "TT", "description": "Telegraphic transfer"},
        {"code": "OA", "description": "Open account"}, {"code": "AD", "description": "Advance payment"},
        {"code": "CON", "description": "Consignment basis"}
    ], "pakMapping": "Payment terms — LC required for >$10K imports, advance payment restrictions"},
    {"id": "CL_046", "name": "Compliance status code", "source": "National", "values": [
        {"code": "COM", "description": "Compliant"}, {"code": "NCM", "description": "Non-compliant"},
        {"code": "PAR", "description": "Partially compliant"}, {"code": "UND", "description": "Under review"},
        {"code": "EXM", "description": "Exempt from compliance requirement"}
    ], "pakMapping": "Trader compliance status in WeBOC risk module"},
    {"id": "CL_047", "name": "WCO DM conformity level", "source": "WCO", "values": [
        {"code": "L1", "description": "Level 1 — Exploratory (studying WCO DM)"},
        {"code": "L2", "description": "Level 2 — Mapping (mapping national data to WCO DM)"},
        {"code": "L3", "description": "Level 3 — Implementing (building WCO DM compliant systems)"},
        {"code": "L4", "description": "Level 4 — Conformant (published MIP, fully compliant)"},
        {"code": "L5", "description": "Level 5 — Interoperable (cross-border data exchange using WCO DM)"}
    ], "pakMapping": "Pakistan is at Level 1-2 (WeBOC not fully WCO DM conformant, no MIP published)"},
    {"id": "CL_048", "name": "WeBOC module code", "source": "National", "values": [
        {"code": "GD", "description": "Goods Declaration"}, {"code": "IGM", "description": "Import General Manifest"},
        {"code": "EGM", "description": "Export General Manifest"}, {"code": "TR", "description": "Transit"},
        {"code": "WH", "description": "Warehouse"}, {"code": "AUC", "description": "Auction"},
        {"code": "CCA", "description": "Cross-border Credit Account"}, {"code": "RFS", "description": "Refund/Drawback"},
        {"code": "RPT", "description": "Reporting"}, {"code": "USR", "description": "User management"}
    ], "pakMapping": "Major WeBOC system modules"},
    {"id": "CL_049", "name": "PSW service code", "source": "National", "values": [
        {"code": "DPP-PC", "description": "Plant protection certificate"}, {"code": "DPP-FR", "description": "Fumigation and release order"},
        {"code": "AQSD-HC", "description": "Animal health certificate"}, {"code": "DRAP-IL", "description": "Drug import licence"},
        {"code": "PSQCA-IS", "description": "Inspection certificate"}, {"code": "MOC-IP", "description": "Import permit (strategic goods)"},
        {"code": "PNRA-RC", "description": "Radiation clearance"}, {"code": "ANF-NC", "description": "Narcotics clearance"}
    ], "pakMapping": "PSW electronic services from OGAs"},
    {"id": "CL_050", "name": "Data quality issue code", "source": "Analytical", "values": [
        {"code": "MIS", "description": "Missing required field"}, {"code": "INV", "description": "Invalid format/value"},
        {"code": "DUP", "description": "Duplicate record"}, {"code": "INC", "description": "Inconsistent across fields"},
        {"code": "OUT", "description": "Outlier value (statistical)"}, {"code": "OBS", "description": "Obsolete code used"},
        {"code": "UNM", "description": "Unmapped to WCO DM standard"}
    ], "pakMapping": "Data quality issues identified in WeBOC trade data"},
]

with open(os.path.join(OUTPUT_DIR, 'codeLists.json'), 'w') as f:
    json.dump(CODE_LISTS, f, indent=2)

print(f"codeLists.json: {len(CODE_LISTS)} code lists")
