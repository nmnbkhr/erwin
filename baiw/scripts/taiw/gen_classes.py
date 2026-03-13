#!/usr/bin/env python3
"""Generate classes.json for TAIW"""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')

CLASS_DEFS = {
    "Declaration": [
        ("Declaration", "A formal request made to customs to place goods under a given customs procedure", None, ["DeclarationGovernment", "DeclarationGoodShipment"], 25),
        ("DeclarationGovernment", "Government-specific declaration processing information and procedures", "Declaration", [], 15),
        ("DeclarationGoodShipment", "Link between a declaration and the goods shipment it covers", "Declaration", [], 12),
        ("CustomsDeclarationDocument", "The physical or electronic customs declaration document", "Declaration", [], 10),
        ("Amendment", "A modification to a previously accepted declaration", "Declaration", [], 12),
        ("Cancellation", "A request to cancel a previously accepted declaration", "Declaration", [], 11),
    ],
    "Consignment": [
        ("Consignment", "A separately identifiable collection of goods items transported together", None, ["ConsignmentItem"], 18),
        ("ConsignmentItem", "An individual item within a consignment", "Consignment", [], 15),
        ("TransportContractDocument", "A document evidencing a contract of carriage (B/L, AWB)", None, [], 12),
        ("AssociatedTransportDocument", "Additional transport documentation linked to the consignment", None, [], 10),
        ("ConsolidatedConsignment", "Multiple consignments grouped under a single transport contract", "Consignment", [], 10),
    ],
    "Goods": [
        ("Commodity", "A tradeable article or product classified under a tariff nomenclature", None, ["GoodsItem"], 12),
        ("GoodsItem", "An individual goods line item in a declaration or consignment", "Commodity", [], 10),
        ("GoodsMeasure", "Quantitative measurements of goods — weight, volume, supplementary units", "GoodsItem", [], 8),
        ("Packaging", "Details of how goods are packed — type, quantity, marks and numbers", "GoodsItem", [], 7),
        ("DangerousGoods", "Hazardous materials classification per UN dangerous goods regulations", "GoodsItem", [], 6),
        ("Classification", "Tariff classification of goods under HS or national nomenclature", "GoodsItem", [], 8),
        ("TariffQuantity", "Quantity expressed in tariff-specific units for duty calculation", "GoodsItem", [], 5),
        ("AdditionalInformation", "Supplementary coded or free-text information about the goods", "GoodsItem", [], 7),
        ("PreviousDocument", "Reference to a prior customs document related to the goods", "GoodsItem", [], 7),
    ],
    "Transport": [
        ("TransportMeans", "Any vehicle or vessel used to carry goods across borders", None, ["BorderTransportMeans"], 10),
        ("BorderTransportMeans", "The active transport means crossing the customs border", "TransportMeans", [], 8),
        ("TransitTransportMeans", "Transport means used during transit movement", "TransportMeans", [], 5),
        ("ArrivalTransportMeans", "Transport means on arrival at destination", "TransportMeans", [], 5),
        ("DepartureTransportMeans", "Transport means at point of departure", "TransportMeans", [], 5),
        ("TransportEquipment", "Containers, swap bodies, and other transport equipment", None, [], 7),
        ("Seal", "Physical or electronic seal affixed to transport equipment", "TransportEquipment", [], 5),
        ("Itinerary", "The planned or actual route of transport", None, [], 5),
        ("TransportEvent", "A significant event during transport — loading, departure, arrival", None, [], 5),
    ],
    "Party": [
        ("Party", "Any organization or person involved in international trade", None, [], 8),
        ("Agent", "A person or company authorized to act on behalf of another party", "Party", [], 4),
        ("Buyer", "The party purchasing the goods in a trade transaction", "Party", [], 3),
        ("Seller", "The party selling the goods in a trade transaction", "Party", [], 3),
        ("Consignor", "The party consigning goods for shipment (shipper)", "Party", [], 3),
        ("Consignee", "The party to whom the goods are consigned (receiver)", "Party", [], 3),
        ("Declarant", "The party making the customs declaration", "Party", [], 4),
        ("Carrier", "The party responsible for the transport of goods", "Party", [], 3),
        ("CustomsBroker", "A licensed professional handling customs formalities", "Party", [], 4),
        ("Importer", "The party importing goods into a customs territory", "Party", [], 3),
        ("Exporter", "The party exporting goods from a customs territory", "Party", [], 3),
        ("Manufacturer", "The party that manufactured or produced the goods", "Party", [], 3),
        ("NotifyParty", "The party to be notified upon arrival of goods", "Party", [], 3),
        ("FreightForwarder", "An intermediary arranging transport and logistics", "Party", [], 3),
        ("WarehouseKeeper", "The operator of a customs bonded warehouse", "Party", [], 3),
    ],
    "Location": [
        ("Location", "A geographic place relevant to trade and customs operations", None, [], 8),
        ("Address", "A structured postal address associated with a location or party", "Location", [], 7),
        ("LoadingLocation", "The place where goods are loaded onto transport", "Location", [], 4),
        ("UnloadingLocation", "The place where goods are unloaded from transport", "Location", [], 4),
        ("CustomsOffice", "A government office where customs formalities are performed", "Location", [], 6),
        ("EntryPort", "The first port of arrival in the importing country", "Location", [], 4),
        ("ExitPort", "The last port of departure from the exporting country", "Location", [], 4),
        ("DestinationCountry", "The final country of destination for the goods", "Location", [], 3),
    ],
    "Financial": [
        ("CustomsValuation", "Determination of the customs value of imported goods per WTO rules", None, [], 10),
        ("DutyTaxFee", "Individual duty, tax, or fee line applied to goods", None, [], 8),
        ("ObligationGuarantee", "Financial security ensuring payment of customs duties", None, [], 6),
        ("Payment", "Record of duty/tax payment made to customs", None, [], 5),
        ("AccountingEntry", "A booking entry in the customs duty accounts", None, [], 4),
        ("ExchangeRate", "Currency conversion rate applied to value calculations", None, [], 4),
        ("BankAccount", "Bank account details for payment or refund", None, [], 4),
        ("TradeFinanceDocument", "Letter of credit, bank guarantee, or other trade finance instrument", None, [], 4),
    ],
    "Document": [
        ("AdditionalDocument", "Any supporting document attached to a declaration", None, [], 5),
        ("Certificate", "An official document certifying a fact (origin, health, conformity)", None, [], 5),
        ("License", "A government authorization to import/export specific goods", None, [], 4),
        ("Permit", "A permission document required by regulatory agencies", None, [], 4),
        ("Invoice", "Commercial invoice detailing the trade transaction", None, [], 5),
        ("PackingList", "Detailed list of goods and their packaging", None, [], 3),
        ("BillOfLading", "Transport document for sea freight", None, [], 4),
        ("AirWaybill", "Transport document for air cargo", None, [], 3),
        ("InsuranceDocument", "Cargo insurance certificate or policy", None, [], 2),
    ],
    "Classification": [
        ("HarmonizedSystem", "The WCO Harmonized System commodity classification (HS)", None, [], 10),
        ("NationalTariffLine", "Country-specific tariff line extending HS to 8+ digits", "HarmonizedSystem", [], 7),
        ("PreferenceCode", "Code indicating preferential tariff treatment under FTA/GSP", None, [], 5),
        ("QuotaAllocation", "Allocation of import quota quantities for restricted goods", None, [], 4),
        ("Restriction", "Trade restriction or prohibition applicable to the goods", None, [], 4),
    ],
    "Risk & Control": [
        ("RiskAssessment", "Automated or manual risk evaluation of a declaration", None, [], 7),
        ("ExaminationNotice", "Notification that goods have been selected for examination", None, [], 5),
        ("ExaminationResult", "Outcome of a physical or documentary examination", None, [], 5),
        ("GovernmentProcedure", "A customs procedure code (CPC) governing the goods movement", None, [], 4),
        ("Selectivity", "Criteria and rules for automated risk-based channel assignment", None, [], 4),
    ],
    "Origin": [
        ("CertificateOfOrigin", "Document certifying the country of origin of goods", None, [], 7),
        ("PreferentialTreatment", "Application of reduced duty rates under trade agreements", None, [], 5),
        ("RulesOfOrigin", "Criteria determining whether goods qualify for preferential origin", None, [], 5),
        ("OriginDeclaration", "Self-certification of origin by the exporter", None, [], 5),
        ("RegionalValueContent", "Calculation of regional value for origin determination", None, [], 4),
        ("CumulationRule", "Rules allowing materials from partner countries to count as originating", None, [], 4),
    ],
    "Warehouse": [
        ("Warehouse", "A customs-approved storage facility for goods under customs control", None, [], 6),
        ("CustomsBondedArea", "A designated area where goods are stored under bond", "Warehouse", [], 4),
        ("FreeZone", "A designated area with special customs and tax treatment", None, [], 5),
        ("TemporaryStorage", "Short-term storage of goods pending customs clearance", None, [], 4),
        ("InwardProcessing", "Import of goods for processing and re-export", None, [], 3),
        ("OutwardProcessing", "Export of goods for processing and re-import", None, [], 3),
    ],
    "E-Commerce": [
        ("ECommerceItem", "A goods item sold through an online platform or marketplace", None, [], 5),
        ("DeMinimisDeclaration", "Simplified declaration for low-value e-commerce shipments", None, [], 4),
        ("SimplifiedDeclaration", "Reduced data requirement declaration for trusted traders", None, [], 4),
        ("ReturnGoods", "Declaration for return of previously exported e-commerce goods", None, [], 3),
        ("PostalItem", "Goods shipped via postal service subject to customs clearance", None, [], 3),
        ("CourierShipment", "Express courier shipments with expedited customs clearance", None, [], 3),
    ],
    "Response": [
        ("Response", "A formal reply from customs to a submitted declaration or request", None, [], 6),
        ("DecisionNotification", "Notification of a customs decision (acceptance, rejection, query)", "Response", [], 5),
        ("ReleaseNotification", "Authorization to release goods from customs control", "Response", [], 4),
        ("QueryNotification", "A request from customs for additional information", "Response", [], 4),
        ("ErrorNotification", "Notification of errors found in a submitted declaration", "Response", [], 3),
        ("PenaltyAssessment", "Assessment of fines or penalties for customs violations", "Response", [], 3),
    ],
}

classes = []
idx = 1
for domain, cls_list in CLASS_DEFS.items():
    for name, desc, parent, children, elem_count in cls_list:
        classes.append({
            "id": f"CLS_{idx:03d}",
            "name": name,
            "domain": domain,
            "description": desc,
            "elementCount": elem_count,
            "parentClass": parent,
            "childClasses": children,
            "stereotype": "ABIE"
        })
        idx += 1

with open(os.path.join(OUTPUT_DIR, 'classes.json'), 'w') as f:
    json.dump(classes, f, indent=2)

print(f"classes.json: {len(classes)} classes")
