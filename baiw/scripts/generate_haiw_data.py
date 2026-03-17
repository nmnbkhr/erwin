#!/usr/bin/env python3
"""Generate HAIW (Healthcare Analytics Intelligence Workbench) JSON data files."""

import json
import os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "haiw")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def write_json(filename, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size = os.path.getsize(filepath)
    count = len(data) if isinstance(data, list) else len(data.keys()) if isinstance(data, dict) else 0
    print(f"  Generated {filename} ({size:,} bytes, {count} top-level entries)")


# ---------------------------------------------------------------------------
# Helper: make FHIR elements for a resource
# ---------------------------------------------------------------------------
FHIR_TYPES = ["Reference", "CodeableConcept", "string", "dateTime", "Period",
              "Identifier", "boolean", "code", "instant", "HumanName",
              "Address", "ContactPoint", "Quantity", "Money", "Annotation",
              "Attachment", "Coding", "uri", "integer", "positiveInt",
              "Ratio", "Range", "Timing", "Duration", "Age",
              "BackboneElement", "Narrative", "Extension", "Meta", "id",
              "canonical", "markdown", "base64Binary", "unsignedInt", "date",
              "decimal", "Dosage", "Signature", "SampledData", "RelatedArtifact"]


def _el(name, typ, desc, card="0..1", ms=False):
    return {"name": name, "type": typ, "description": desc, "cardinality": card, "mustSupport": ms}


# ---------------------------------------------------------------------------
# 1. FHIR Resources (157)
# ---------------------------------------------------------------------------
def generate_fhir_resources():
    """Generate all 157 FHIR R5 resources."""

    # Category definitions
    cats = {
        "foundation": ("Foundation", "CAT-01"),
        "individuals": ("Base - Individuals", "CAT-02"),
        "entities": ("Base - Entities", "CAT-03"),
        "workflow": ("Base - Workflow", "CAT-04"),
        "summary": ("Clinical - Summary", "CAT-05"),
        "diagnostics": ("Clinical - Diagnostics", "CAT-06"),
        "medications": ("Clinical - Medications", "CAT-07"),
        "care-provision": ("Clinical - Care Provision", "CAT-08"),
        "request-response": ("Clinical - Request & Response", "CAT-09"),
        "financial": ("Financial", "CAT-10"),
        "public-health": ("Public Health & Research", "CAT-11"),
        "infrastructure": ("Infrastructure & Exchange", "CAT-12"),
    }

    hcdm_map = {
        "foundation": "SA-12",
        "individuals": "SA-01",
        "entities": "SA-08",
        "workflow": "SA-02",
        "summary": "SA-03",
        "diagnostics": "SA-11",
        "medications": "SA-06",
        "care-provision": "SA-03",
        "request-response": "SA-03",
        "financial": "SA-05",
        "public-health": "SA-09",
        "infrastructure": "SA-12",
    }

    resources_raw = [
        # ---- CAT-01: Foundation (14) ----
        ("CapabilityStatement", "foundation", "Declares the capabilities of a FHIR server",
         "Describes the required and optional functionality of a FHIR server implementation",
         [_el("url","uri","Canonical URL",ms=True), _el("version","string","Business version"), _el("name","string","Computer-friendly name"), _el("status","code","draft | active | retired",ms=True), _el("date","dateTime","Date last changed"), _el("publisher","string","Name of publisher"), _el("description","markdown","Natural language description"), _el("kind","code","instance | capability | requirements",ms=True), _el("fhirVersion","code","FHIR version supported",ms=True), _el("format","code","Formats supported","1..*",True), _el("rest","BackboneElement","RESTful capabilities"), _el("messaging","BackboneElement","Messaging capabilities")],
         3, "high", "Essential for NHSR&C health information exchange standards"),
        ("StructureDefinition", "foundation", "Defines the structure of a FHIR resource or data type",
         "Defines constraints and extensions on resources and data types for use in FHIR specifications",
         [_el("url","uri","Canonical identifier",ms=True), _el("version","string","Business version"), _el("name","string","Computer-friendly name",ms=True), _el("status","code","draft | active | retired",ms=True), _el("kind","code","primitive-type | complex-type | resource | logical",ms=True), _el("abstract","boolean","Whether this is abstract"), _el("type","uri","Type defined or constrained",ms=True), _el("baseDefinition","canonical","Base definition",ms=True), _el("derivation","code","specialization | constraint"), _el("differential","BackboneElement","Differential view"), _el("snapshot","BackboneElement","Snapshot view")],
         5, "high", "Needed for Pakistan FHIR profiles by NHSR&C"),
        ("ImplementationGuide", "foundation", "Defines a set of rules for FHIR implementation",
         "A set of rules about how FHIR is used to solve a particular interoperability or standards problem",
         [_el("url","uri","Canonical URL",ms=True), _el("version","string","Business version"), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("packageId","id","NPM package name",ms=True), _el("fhirVersion","code","FHIR version(s)","1..*",True), _el("dependsOn","BackboneElement","Another IG dependency"), _el("global","BackboneElement","Profiles for global use"), _el("definition","BackboneElement","IG definition"), _el("manifest","BackboneElement","Published IG details")],
         3, "high", "Pakistan Health Information Exchange IG development"),
        ("SearchParameter", "foundation", "Defines a search parameter for a resource",
         "Describes a search parameter that controls how resources can be searched",
         [_el("url","uri","Canonical URL",ms=True), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("code","code","Recommended parameter name",ms=True), _el("base","code","Resource types this applies to","1..*",True), _el("type","code","number | date | string | token | reference | composite | quantity | uri | special",ms=True), _el("expression","string","FHIRPath expression"), _el("multipleOr","boolean","Allow multiple values per parameter"), _el("multipleAnd","boolean","Allow chaining"), _el("comparator","code","Comparators supported")],
         3, "medium", "Custom search parameters for Pakistan health identifiers"),
        ("OperationDefinition", "foundation", "Defines a custom operation on a FHIR server",
         "A formal computable definition of an operation or named query",
         [_el("url","uri","Canonical URL",ms=True), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("kind","code","operation | query",ms=True), _el("code","code","Recommended name for operation",ms=True), _el("resource","code","Types this applies to"), _el("system","boolean","Invoke at system level"), _el("type","boolean","Invoke at type level"), _el("instance","boolean","Invoke on instances"), _el("parameter","BackboneElement","Parameters for the operation")],
         3, "medium", "Custom operations for Pakistan health data exchange"),
        ("CompartmentDefinition", "foundation", "Defines a logical grouping of resources",
         "Defines how a resource compartment is used for access control",
         [_el("url","uri","Canonical URL",ms=True), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("code","code","Patient | Encounter | RelatedPerson | Practitioner | Device",ms=True), _el("search","boolean","Whether server supports search"), _el("resource","BackboneElement","Resource membership rules")],
         2, "low", "Access control for multi-tenant health systems"),
        ("MessageDefinition", "foundation", "Defines a message that can be exchanged between systems",
         "Defines the characteristics of a message that can be shared between systems",
         [_el("url","uri","Canonical URL"), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("date","dateTime","Date last changed"), _el("eventCoding","Coding","Event code",ms=True), _el("category","code","consequence | currency | notification"), _el("focus","BackboneElement","Resource(s) that are the subject"), _el("responseRequired","code","always | on-error | never | on-success"), _el("allowedResponse","BackboneElement","Responses to this message")],
         2, "medium", "Health event messaging between Pakistani hospital systems"),
        ("GraphDefinition", "foundation", "Defines a graph of interconnected resources",
         "A formal definition of a graph of resources, used for clinical decision support and data extraction",
         [_el("url","uri","Canonical URL"), _el("name","string","Computer-friendly name",ms=True), _el("status","code","Publication status",ms=True), _el("start","code","Starting resource type"), _el("node","BackboneElement","Graph node definitions"), _el("link","BackboneElement","Links between nodes")],
         2, "low", "Clinical pathway graph definitions"),
        ("StructureMap", "foundation", "Defines a mapping between data structures",
         "A Map of relationships between 2 structures that can be used to transform data",
         [_el("url","uri","Canonical URL",ms=True), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("structure","BackboneElement","Structures referenced"), _el("import","canonical","Other maps used"), _el("group","BackboneElement","Named mapping groups","1..*",True)],
         3, "medium", "Mapping legacy Pakistani health systems to FHIR"),
        ("ConceptMap", "foundation", "Maps concepts between code systems",
         "A statement of relationships from one set of concepts to one or more other concepts",
         [_el("url","uri","Canonical URL"), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("sourceScope","uri","Source value set"), _el("targetScope","uri","Target value set"), _el("group","BackboneElement","Concept mappings","1..*"), _el("property","BackboneElement","Additional properties")],
         4, "high", "Mapping local Pakistani codes (ICD-10 PK subset) to international standards"),
        ("NamingSystem", "foundation", "Defines a unique identification system",
         "A curated namespace that issues unique symbols within that namespace",
         [_el("url","uri","Canonical URL"), _el("name","string","Computer-friendly name",ms=True), _el("status","code","Publication status",ms=True), _el("kind","code","codesystem | identifier | root",ms=True), _el("responsible","string","Who maintains the system"), _el("type","CodeableConcept","Category of identifier"), _el("uniqueId","BackboneElement","Unique identifier details","1..*",True)],
         2, "high", "Pakistan national identifiers: CNIC (NADRA), PMC registration"),
        ("TerminologyCapabilities", "foundation", "Declares terminology service capabilities",
         "Describes the capabilities of a terminology server",
         [_el("url","uri","Canonical URL"), _el("status","code","Publication status",ms=True), _el("date","dateTime","Date last changed"), _el("kind","code","instance | capability | requirements"), _el("codeSystem","BackboneElement","Code system support"), _el("expansion","BackboneElement","Expansion support"), _el("codeSearch","code","explicit | all"), _el("validateCode","BackboneElement","Validate-code support")],
         1, "medium", "Terminology services for Pakistan health coding"),
        ("CodeSystem", "foundation", "Defines a set of codes drawn from one or more code systems",
         "A code system resource specifies a set of codes drawn from one or more code systems",
         [_el("url","uri","Canonical URL",ms=True), _el("version","string","Business version"), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("content","code","not-present | example | fragment | complete | supplement",ms=True), _el("count","unsignedInt","Total concepts"), _el("filter","BackboneElement","Filter criteria"), _el("property","BackboneElement","Additional concept properties"), _el("concept","BackboneElement","Concepts in the code system")],
         5, "high", "Pakistan-specific code systems for diseases, facilities, programs"),
        ("ValueSet", "foundation", "A set of codes from one or more code systems",
         "Specifies a set of codes drawn from one or more code systems for use in a particular context",
         [_el("url","uri","Canonical URL",ms=True), _el("version","string","Business version"), _el("name","string","Computer-friendly name"), _el("status","code","Publication status",ms=True), _el("compose","BackboneElement","Content logical definition"), _el("expansion","BackboneElement","Used when value set is expanded")],
         5, "high", "Value sets for Pakistani health data standards"),

        # ---- CAT-02: Base - Individuals (6) ----
        ("Patient", "individuals", "Demographics and administrative information about a person receiving care",
         "Demographics and other administrative information about an individual receiving care",
         [_el("identifier","Identifier","Patient identifiers (CNIC, MRN)","0..*",True), _el("active","boolean","Whether record is active"), _el("name","HumanName","Patient names","0..*",True), _el("telecom","ContactPoint","Contact details","0..*"), _el("gender","code","male | female | other | unknown",ms=True), _el("birthDate","date","Date of birth",ms=True), _el("deceased[x]","boolean","Indicates if patient is deceased"), _el("address","Address","Patient addresses","0..*"), _el("maritalStatus","CodeableConcept","Marital status"), _el("multipleBirth[x]","boolean","Whether patient is part of multiple birth"), _el("contact","BackboneElement","Contact parties"), _el("communication","BackboneElement","Language preferences"), _el("generalPractitioner","Reference","Patient's nominated primary care provider"), _el("managingOrganization","Reference","Organization managing the record"), _el("link","BackboneElement","Link to another patient resource")],
         5, "high", "Core resource; NADRA CNIC as primary identifier for Pakistan"),
        ("Practitioner", "individuals", "A person with a formal role in healthcare delivery",
         "A person who is directly or indirectly involved in the provisioning of healthcare",
         [_el("identifier","Identifier","Practitioner identifiers (PMC#)","0..*",True), _el("active","boolean","Whether record is active"), _el("name","HumanName","Name of practitioner","0..*",True), _el("telecom","ContactPoint","Contact details","0..*"), _el("gender","code","male | female | other | unknown"), _el("birthDate","date","Date of birth"), _el("deceased[x]","boolean","Whether deceased"), _el("address","Address","Addresses","0..*"), _el("qualification","BackboneElement","Qualifications and certifications","0..*",True), _el("communication","BackboneElement","Languages spoken","0..*")],
         5, "high", "PMC (Pakistan Medical Commission) registration as identifier"),
        ("PractitionerRole", "individuals", "Roles/locations/specialties of a practitioner",
         "A specific set of roles, locations, specialties, and services that a practitioner may perform",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("period","Period","Period during which role is valid"), _el("practitioner","Reference","Practitioner reference",ms=True), _el("organization","Reference","Organization where role is performed",ms=True), _el("code","CodeableConcept","Roles performed","0..*",True), _el("specialty","CodeableConcept","Specialties","0..*",True), _el("location","Reference","Locations where services provided","0..*"), _el("healthcareService","Reference","Healthcare services","0..*"), _el("availability","BackboneElement","Availability details")],
         4, "high", "Maps PMC specialties and DHQ/THQ assignments"),
        ("RelatedPerson", "individuals", "A person related to a patient",
         "Information about a person that is involved in the care for a patient but is not the target of care",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("patient","Reference","The patient this person is related to","1..1",True), _el("relationship","CodeableConcept","Nature of relationship","0..*",True), _el("name","HumanName","Names","0..*"), _el("telecom","ContactPoint","Contact details","0..*"), _el("gender","code","Gender"), _el("birthDate","date","Date of birth"), _el("address","Address","Addresses","0..*"), _el("communication","BackboneElement","Language preferences")],
         3, "high", "Family-centric care model important in Pakistan"),
        ("Person", "individuals", "A generic person record",
         "Demographics and administrative information about a person independent of a specific health-related context",
         [_el("identifier","Identifier","Human identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("name","HumanName","Names","0..*"), _el("telecom","ContactPoint","Contact details","0..*"), _el("gender","code","Gender"), _el("birthDate","date","Date of birth"), _el("deceased[x]","boolean","Whether deceased"), _el("address","Address","Addresses","0..*"), _el("managingOrganization","Reference","Custodian organization"), _el("link","BackboneElement","Link to a resource representing the person")],
         3, "medium", "Links multiple patient records across systems in Pakistan"),
        ("Group", "individuals", "A defined collection of entities",
         "Represents a defined collection of entities that may be discussed or acted upon collectively",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("type","code","person | animal | practitioner | device | careteam | healthcareservice | location | organization | relatedperson | specimen",ms=True), _el("membership","code","definitional | enumerated",ms=True), _el("code","CodeableConcept","Kind of group members"), _el("name","string","Label for group"), _el("description","markdown","Natural language description"), _el("quantity","unsignedInt","Number of members"), _el("managingEntity","Reference","Entity managing group"), _el("characteristic","BackboneElement","Include / exclude criteria"), _el("member","BackboneElement","Who or what is in group")],
         3, "high", "Population health cohorts for Lady Health Worker programs"),

        # ---- CAT-03: Base - Entities (6) ----
        ("Organization", "entities", "A formally or informally recognized grouping of people or organizations",
         "A formally or informally recognized grouping of people or organizations for healthcare purposes",
         [_el("identifier","Identifier","Organization identifiers","0..*",True), _el("active","boolean","Whether still active"), _el("type","CodeableConcept","Kind of organization","0..*"), _el("name","string","Name used for the organization",ms=True), _el("alias","string","Aliases","0..*"), _el("description","markdown","Additional details"), _el("contact","BackboneElement","Official contacts","0..*"), _el("partOf","Reference","Parent organization"), _el("endpoint","Reference","Technical endpoints","0..*"), _el("qualification","BackboneElement","Qualifications and certifications")],
         5, "high", "Hospitals, BHUs, RHCs, DHQs in Pakistan facility registry"),
        ("HealthcareService", "entities", "Details of a healthcare service available at a location",
         "Details and position information for a healthcare service provided at a location",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether service is active"), _el("providedBy","Reference","Organization providing service"), _el("offeredIn","Reference","Locations offered at","0..*"), _el("category","CodeableConcept","Service category","0..*",True), _el("type","CodeableConcept","Type of service","0..*",True), _el("specialty","CodeableConcept","Specialties handled","0..*"), _el("name","string","Description of service"), _el("eligibility","BackboneElement","Eligibility criteria","0..*"), _el("availability","BackboneElement","Times service is available")],
         3, "high", "Sehat Sahulat covered services, MNCH services"),
        ("Endpoint", "entities", "Technical connectivity details of a system",
         "The technical details of an endpoint that can be used for electronic services",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | suspended | error | off | entered-in-error",ms=True), _el("connectionType","Coding","Protocol/profile/standard","1..*",True), _el("name","string","Friendly name"), _el("description","string","Description of endpoint"), _el("environmentType","CodeableConcept","Environment type","0..*"), _el("managingOrganization","Reference","Organization managing endpoint"), _el("contact","ContactPoint","Contact details"), _el("period","Period","Interval during which endpoint is active"), _el("payload","BackboneElement","Payload details","0..*"), _el("address","url","Technical address",ms=True)],
         3, "medium", "Health information exchange endpoints for DHIS2 integration"),
        ("Location", "entities", "Details of a physical place where services are provided",
         "Details and position information for a physical place where services are provided",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | suspended | inactive"), _el("name","string","Name of the location",ms=True), _el("alias","string","Alternate names","0..*"), _el("description","markdown","Additional details"), _el("mode","code","instance | kind"), _el("type","CodeableConcept","Type of function performed","0..*",True), _el("address","Address","Physical location",ms=True), _el("position","BackboneElement","GPS coordinates"), _el("managingOrganization","Reference","Organization responsible"), _el("partOf","Reference","Parent location"), _el("form","CodeableConcept","Physical form of location")],
         5, "high", "BHU/RHC/THQ/DHQ facility locations with GPS for Pakistan"),
        ("Device", "entities", "An item used in healthcare provision",
         "A type of a manufactured item that is used in the provision of healthcare",
         [_el("identifier","Identifier","Instance identifiers","0..*",True), _el("displayName","string","Name of device"), _el("definition","CodeableConcept","Reference to device definition"), _el("udiCarrier","BackboneElement","Unique Device Identifier"), _el("status","code","active | inactive | entered-in-error",ms=True), _el("type","CodeableConcept","Type of device","0..*",True), _el("serialNumber","string","Serial number"), _el("name","BackboneElement","Device name","0..*"), _el("owner","Reference","Organization responsible for device"), _el("location","Reference","Current location"), _el("patient","Reference","Patient using device")],
         3, "medium", "Medical device tracking in Pakistani hospitals"),
        ("DeviceDefinition", "entities", "The characteristics and capabilities of a medical device",
         "Describes the characteristics, operational status, and capabilities of a medical-related component",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("description","markdown","Additional information"), _el("udiDeviceIdentifier","BackboneElement","Unique device identifier"), _el("manufacturer","Reference","Manufacturer"), _el("deviceName","BackboneElement","Device names","0..*"), _el("modelNumber","string","Model number"), _el("classification","BackboneElement","Device classification","0..*"), _el("safety","CodeableConcept","Safety characteristics","0..*"), _el("packaging","BackboneElement","Packaging info")],
         2, "low", "DRAP registered medical devices in Pakistan"),

        # ---- CAT-04: Base - Workflow (13) ----
        ("Task", "workflow", "A task to be performed",
         "A task resource describes an activity that can be performed and tracks the state of completion",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Request fulfilled by task","0..*"), _el("status","code","draft | requested | received | accepted | ...",ms=True), _el("intent","code","unknown | proposal | plan | order | ...",ms=True), _el("priority","code","routine | urgent | asap | stat"), _el("code","CodeableConcept","Task type"), _el("focus","Reference","What the task is about"), _el("for","Reference","Beneficiary of the task"), _el("encounter","Reference","Healthcare event context"), _el("requestedPeriod","Period","When task should start/end"), _el("owner","Reference","Responsible individual",ms=True), _el("input","BackboneElement","Task inputs"), _el("output","BackboneElement","Task outputs")],
         3, "high", "Workflow management in DHIS2-integrated Pakistan systems"),
        ("Appointment", "workflow", "A booking of a healthcare event",
         "A booking of a healthcare event among patient(s), practitioner(s), and/or device(s)",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","proposed | pending | booked | ...",ms=True), _el("serviceCategory","CodeableConcept","Category of service","0..*"), _el("serviceType","CodeableConcept","Type of service","0..*",True), _el("specialty","CodeableConcept","Specialty of practitioner","0..*"), _el("appointmentType","CodeableConcept","Style of appointment"), _el("start","instant","When appointment begins",ms=True), _el("end","instant","When appointment ends",ms=True), _el("participant","BackboneElement","Participants","1..*",True), _el("requestedPeriod","Period","Potential date/time intervals")],
         4, "medium", "OPD scheduling in government hospitals"),
        ("AppointmentResponse", "workflow", "Reply to an appointment request",
         "A reply to an appointment request for a patient and/or practitioner(s)",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("appointment","Reference","Appointment being responded to","1..1",True), _el("proposedNewTime","boolean","Time adjustment proposed"), _el("start","instant","Proposed start time"), _el("end","instant","Proposed end time"), _el("participantType","CodeableConcept","Role of participant","0..*"), _el("actor","Reference","Responding person/device"), _el("participantStatus","code","accepted | declined | tentative","1..1",True), _el("comment","markdown","Additional comments")],
         3, "low", "Appointment management responses"),
        ("Schedule", "workflow", "A container for slots of time available for booking",
         "A container for slots of time that may be available for booking appointments",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether active",ms=True), _el("serviceCategory","CodeableConcept","Category","0..*"), _el("serviceType","CodeableConcept","Type of service","0..*",True), _el("specialty","CodeableConcept","Specialty","0..*"), _el("name","string","Human-readable label"), _el("actor","Reference","Resource(s) that availability applies to","1..*",True), _el("planningHorizon","Period","Overall time period"), _el("comment","markdown","Comments")],
         3, "medium", "OPD and specialist scheduling in Pakistan hospitals"),
        ("Slot", "workflow", "A slot of time on a schedule available for booking",
         "A slot of time on a schedule that may be available for booking appointments",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("serviceCategory","CodeableConcept","Category","0..*"), _el("serviceType","CodeableConcept","Type of service","0..*"), _el("specialty","CodeableConcept","Specialty","0..*"), _el("appointmentType","CodeableConcept","Style of appointment"), _el("schedule","Reference","Schedule resource","1..1",True), _el("status","code","busy | free | busy-unavailable | ...",ms=True), _el("start","instant","Start time",ms=True), _el("end","instant","End time",ms=True), _el("comment","markdown","Comments")],
         3, "medium", "Time slot management for appointments"),
        ("SupplyRequest", "workflow", "Request for a supply item",
         "A record of a request to deliver a product to a particular destination",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | suspended | ...",ms=True), _el("category","CodeableConcept","Category of supply"), _el("priority","code","routine | urgent | asap | stat"), _el("deliverFrom","Reference","Origin of supply"), _el("deliverTo","Reference","Destination of supply"), _el("item","CodeableConcept","Medication, substance, or device",ms=True), _el("quantity","Quantity","Amount requested","1..1",True), _el("occurrence[x]","dateTime","When the request should be fulfilled"), _el("requester","Reference","Individual making the request")],
         2, "high", "Medical supply chain for BHUs and remote clinics"),
        ("SupplyDelivery", "workflow", "Delivery of a supply",
         "Record of delivery of what is supplied",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfills request","0..*"), _el("status","code","in-progress | completed | abandoned | ...",ms=True), _el("patient","Reference","Patient for whom supply was delivered"), _el("type","CodeableConcept","Category of supply event"), _el("suppliedItem","BackboneElement","What was delivered"), _el("occurrence[x]","dateTime","When event occurred"), _el("supplier","Reference","Who supplied"), _el("destination","Reference","Where supply was sent")],
         2, "high", "Tracking medical supply deliveries in Pakistan"),
        ("DeviceRequest", "workflow", "A request for a device to be used",
         "Represents a request for a patient to employ a medical device",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Plan/proposal fulfilled","0..*"), _el("status","code","draft | active | on-hold | ...",ms=True), _el("intent","code","proposal | plan | directive | order | ...",ms=True), _el("code","CodeableConcept","Device requested","1..1",True), _el("subject","Reference","Focus of request","1..1",True), _el("encounter","Reference","Encounter context"), _el("requester","Reference","Who/what is requesting"), _el("performer","Reference","Requested filler"), _el("insurance","Reference","Associated insurance","0..*")],
         2, "medium", "Device requests for diagnostic equipment"),
        ("DeviceDispense", "workflow", "A dispensing of a device to a patient",
         "Indicates that a device has been provided to a patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Based on request","0..*"), _el("status","code","preparation | in-progress | cancelled | completed | ...",ms=True), _el("subject","Reference","Patient receiving device","1..1",True), _el("device","CodeableConcept","Device dispensed","1..1",True), _el("encounter","Reference","Encounter context"), _el("performer","BackboneElement","Who performed"), _el("quantity","Quantity","Amount dispensed"), _el("whenHandedOver","dateTime","When device handed over")],
         1, "low", "Device dispensing tracking"),
        ("DeviceUsage", "workflow", "Record of a device being used by a patient",
         "A record of a device being used by a patient where the record is the result of a report",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Plan fulfilled","0..*"), _el("status","code","active | completed | not-done | ...",ms=True), _el("category","CodeableConcept","Category of usage","0..*"), _el("patient","Reference","Patient using device","1..1",True), _el("device","CodeableConcept","Device used","1..1",True), _el("timing[x]","dateTime","When used"), _el("dateAsserted","dateTime","When statement was made"), _el("informationSource","Reference","Who made statement"), _el("reason","CodeableConcept","Why device was used","0..*")],
         1, "medium", "Tracking device usage for chronic disease patients"),
        ("DeviceAssociation", "workflow", "An association between a patient and a device",
         "Describes the association between a device and a patient or practitioner",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("device","Reference","Device","1..1",True), _el("category","CodeableConcept","Category","0..*"), _el("status","CodeableConcept","implanted | explanted | attached | ...",ms=True), _el("subject","Reference","Individual associated","1..1",True), _el("bodyStructure","Reference","Body site"), _el("period","Period","Association period"), _el("operation","BackboneElement","Operational details")],
         1, "low", "Implant/device tracking"),
        ("Transport", "workflow", "Movement of a patient or item",
         "Record of transport of patient or material",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","in-progress | completed | abandoned | ...",ms=True), _el("intent","code","unknown | proposal | plan | order",ms=True), _el("priority","code","routine | urgent | asap | stat"), _el("code","CodeableConcept","Transport type"), _el("for","Reference","Beneficiary"), _el("encounter","Reference","Healthcare event"), _el("requestedLocation","Reference","Destination","1..1",True), _el("currentLocation","Reference","Current location","1..1",True), _el("owner","Reference","Responsible entity")],
         1, "medium", "Patient transport and ambulance management"),
        ("VisionPrescription", "workflow", "A prescription for vision correction",
         "An authorization for the provision of glasses and/or contact lenses",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | ...",ms=True), _el("created","dateTime","Response creation date",ms=True), _el("patient","Reference","Who prescription is for","1..1",True), _el("encounter","Reference","Encounter context"), _el("dateWritten","dateTime","When prescription was authorized",ms=True), _el("prescriber","Reference","Who authorized prescription","1..1",True), _el("lensSpecification","BackboneElement","Vision lens specification","1..*",True)],
         3, "low", "Eye care prescriptions"),

        # ---- CAT-05: Clinical - Summary (12) ----
        ("AllergyIntolerance", "summary", "A clinical assessment of an allergy or intolerance",
         "Risk of harmful or undesirable physiological response to a substance",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("clinicalStatus","CodeableConcept","active | inactive | resolved",ms=True), _el("verificationStatus","CodeableConcept","unconfirmed | presumed | confirmed | refuted",ms=True), _el("type","CodeableConcept","allergy | intolerance"), _el("category","code","food | medication | environment | biologic","0..*"), _el("criticality","code","low | high | unable-to-assess"), _el("code","CodeableConcept","Code that identifies the allergy",ms=True), _el("patient","Reference","Who the allergy is about","1..1",True), _el("onset[x]","dateTime","When allergy began"), _el("reaction","BackboneElement","Adverse reaction events","0..*")],
         5, "high", "Drug allergy tracking critical for Pakistan clinical practice"),
        ("Condition", "summary", "A clinical condition, problem, or diagnosis",
         "A clinical condition, problem, diagnosis, or other event, situation, issue, or clinical concept",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("clinicalStatus","CodeableConcept","active | recurrence | relapse | inactive | remission | resolved",ms=True), _el("verificationStatus","CodeableConcept","unconfirmed | provisional | differential | confirmed | refuted",ms=True), _el("category","CodeableConcept","problem-list-item | encounter-diagnosis","0..*"), _el("severity","CodeableConcept","Subjective severity"), _el("code","CodeableConcept","Identification of condition",ms=True), _el("bodySite","CodeableConcept","Anatomical location","0..*"), _el("subject","Reference","Who has the condition","1..1",True), _el("encounter","Reference","Encounter context"), _el("onset[x]","dateTime","Estimated or actual onset"), _el("abatement[x]","dateTime","When condition abated"), _el("stage","BackboneElement","Stage/grade assessment","0..*"), _el("evidence","CodeableConcept","Supporting evidence","0..*")],
         5, "high", "ICD-10 coding for conditions; TB, hepatitis, dengue tracking in Pakistan"),
        ("Procedure", "summary", "An action performed on or for a patient",
         "An action that is or was performed on or for a patient for diagnostic or therapeutic purposes",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","A request for this procedure","0..*"), _el("status","code","preparation | in-progress | not-done | on-hold | stopped | completed",ms=True), _el("category","CodeableConcept","Classification of procedure","0..*"), _el("code","CodeableConcept","Identification of the procedure",ms=True), _el("subject","Reference","Individual the procedure was performed on","1..1",True), _el("encounter","Reference","Encounter associated"), _el("occurrence[x]","dateTime","When the procedure occurred"), _el("performer","BackboneElement","Persons who performed","0..*"), _el("bodySite","CodeableConcept","Target body sites","0..*"), _el("outcome","CodeableConcept","The result of the procedure"), _el("complication","CodeableConcept","Complications","0..*"), _el("followUp","CodeableConcept","Follow-up instructions","0..*")],
         5, "high", "Surgical and diagnostic procedure tracking in Pakistani hospitals"),
        ("FamilyMemberHistory", "summary", "Significant health conditions of a family member",
         "Significant health conditions for a person related to the patient relevant for clinical care",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","partial | completed | entered-in-error | health-unknown",ms=True), _el("patient","Reference","Patient history is about","1..1",True), _el("date","dateTime","When history was recorded"), _el("name","string","Family member name"), _el("relationship","CodeableConcept","Relationship to patient","1..1",True), _el("sex","CodeableConcept","male | female | other | unknown"), _el("born[x]","Period","Date/period of birth"), _el("age[x]","Age","Age at time of assessment"), _el("condition","BackboneElement","Condition details","0..*"), _el("procedure","BackboneElement","Procedure details","0..*")],
         3, "high", "Hereditary disease patterns in consanguineous families common in Pakistan"),
        ("ClinicalImpression", "summary", "A clinical assessment performed about a patient",
         "A record of a clinical assessment performed to determine what problem(s) may affect the patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","preparation | in-progress | not-done | on-hold | stopped | completed",ms=True), _el("subject","Reference","Patient or group assessed","1..1",True), _el("encounter","Reference","Encounter context"), _el("date","dateTime","When assessment was done",ms=True), _el("performer","Reference","Clinician performing assessment"), _el("summary","string","Summary of assessment"), _el("finding","BackboneElement","Possible or likely findings","0..*"), _el("problem","Reference","General assessment of patient state","0..*")],
         2, "medium", "Clinical decision support in Pakistani healthcare"),
        ("DetectedIssue", "summary", "An identified issue with clinical or administrative action",
         "Indicates an actual or potential clinical issue with or between one or more active or proposed clinical actions",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","preliminary | final | entered-in-error | mitigated",ms=True), _el("category","CodeableConcept","Issue category","0..*"), _el("code","CodeableConcept","Specific type of issue",ms=True), _el("severity","code","high | moderate | low"), _el("subject","Reference","Associated subject"), _el("encounter","Reference","Encounter context"), _el("author","Reference","Who identified the issue"), _el("implicated","Reference","Problem resources","0..*"), _el("evidence","BackboneElement","Supporting evidence","0..*"), _el("mitigation","BackboneElement","Step taken to address","0..*")],
         2, "medium", "Drug interaction detection in Pakistan pharmacy"),
        ("RiskAssessment", "summary", "Potential outcomes for a patient",
         "An assessment of the likely outcome(s) for a patient or other subject as well as the likelihood of each outcome",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Request fulfilled","0..*"), _el("status","code","registered | preliminary | final | amended",ms=True), _el("method","CodeableConcept","Evaluation mechanism"), _el("code","CodeableConcept","Type of assessment"), _el("subject","Reference","Who/what does assessment apply to","1..1",True), _el("encounter","Reference","Encounter context"), _el("performer","Reference","Who performed assessment"), _el("prediction","BackboneElement","Outcome predictions","0..*"), _el("mitigation","string","How to reduce risk")],
         2, "medium", "Risk scoring for maternal health in Pakistan"),
        ("AdverseEvent", "summary", "An event that may be related to treatment",
         "An event that may be related to unintended effects on a patient or research participant",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","in-progress | completed | entered-in-error | unknown",ms=True), _el("actuality","code","actual | potential","1..1",True), _el("category","CodeableConcept","wrong-patient | procedure-mishap | ...","0..*"), _el("code","CodeableConcept","Event or incident being documented"), _el("subject","Reference","Subject impacted","1..1",True), _el("encounter","Reference","Encounter context"), _el("detected","dateTime","When detected"), _el("recordedDate","dateTime","When recorded"), _el("suspectEntity","BackboneElement","Suspected agent","0..*"), _el("mitigatingAction","BackboneElement","Ameliorating actions","0..*")],
         3, "high", "Pharmacovigilance and AEFI reporting to DRAP and NIH"),
        ("Flag", "summary", "Key information to flag to a healthcare provider",
         "Prospective warnings of potential issues when providing care to the patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | inactive | entered-in-error",ms=True), _el("category","CodeableConcept","Clinical, administrative, etc.","0..*"), _el("code","CodeableConcept","Coded or textual message",ms=True), _el("subject","Reference","Who/what is flagged","1..1",True), _el("period","Period","Time period when flag is active"), _el("encounter","Reference","Alert relevant during encounter"), _el("author","Reference","Flag creator")],
         3, "medium", "Patient safety alerts in hospital systems"),
        ("BodyStructure", "summary", "Specific and identified anatomical structure",
         "Record details about an anatomical structure on or within a patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("morphology","CodeableConcept","Kind of structure"), _el("includedStructure","BackboneElement","Included structural areas","1..*",True), _el("excludedStructure","BackboneElement","Excluded structural areas","0..*"), _el("description","markdown","Text description"), _el("image","Attachment","Attached images","0..*"), _el("patient","Reference","Who this record is about","1..1",True)],
         2, "medium", "Anatomical site documentation for surgical procedures"),
        ("Consent", "summary", "A healthcare consumer's policy choices",
         "A record of a healthcare consumer's choices or a policy statement regarding authorization",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | inactive | not-done | entered-in-error | unknown",ms=True), _el("category","CodeableConcept","Classification","0..*",True), _el("subject","Reference","Who the consent applies to"), _el("date","date","When consent was made"), _el("grantor","Reference","Who is granting consent","0..*"), _el("grantee","Reference","Who is granting consent to","0..*"), _el("controller","Reference","Consent workflow management","0..*"), _el("sourceAttachment","Attachment","Source form","0..*"), _el("regulatoryBasis","CodeableConcept","Regulation underlying this consent","0..*"), _el("provision","BackboneElement","Constraints to the base consent")],
         3, "high", "Patient consent management; critical for data sharing in Pakistan"),
        ("NutritionIntake", "summary", "Record of food or fluid being consumed by a patient",
         "A record of food or fluid that is being consumed by a patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","preparation | in-progress | not-done | on-hold | stopped | completed",ms=True), _el("code","CodeableConcept","Code representing overall nutrition intake"), _el("subject","Reference","Who is consuming","1..1",True), _el("encounter","Reference","Encounter context"), _el("occurrence[x]","dateTime","Date/time of consumption"), _el("recorded","dateTime","When recorded"), _el("consumedItem","BackboneElement","Items consumed","1..*",True), _el("ingredientLabel","BackboneElement","Nutrient labels","0..*")],
         1, "high", "Nutrition tracking for malnutrition programs in Pakistan"),

        # ---- CAT-06: Clinical - Diagnostics (9) ----
        ("Observation", "diagnostics", "Measurements and simple assertions made about a patient",
         "Measurements and simple assertions made about a patient, device, or other subject",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfills plan/proposal","0..*"), _el("status","code","registered | preliminary | final | amended",ms=True), _el("category","CodeableConcept","Classification","0..*",True), _el("code","CodeableConcept","Type of observation","1..1",True), _el("subject","Reference","Who/what this is about",ms=True), _el("encounter","Reference","Healthcare event context"), _el("effective[x]","dateTime","Clinically relevant time",ms=True), _el("value[x]","Quantity","Actual result",ms=True), _el("interpretation","CodeableConcept","High, low, normal, etc.","0..*"), _el("bodySite","CodeableConcept","Observed body part"), _el("method","CodeableConcept","How it was done"), _el("referenceRange","BackboneElement","Reference ranges","0..*"), _el("component","BackboneElement","Component results","0..*")],
         5, "high", "Vital signs, lab results; key for disease surveillance in Pakistan"),
        ("DiagnosticReport", "diagnostics", "A diagnostic report with findings and interpretation",
         "Findings and interpretation of diagnostic tests performed on patients",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","What was requested","0..*"), _el("status","code","registered | partial | preliminary | modified | final | ...",ms=True), _el("category","CodeableConcept","Service category","0..*",True), _el("code","CodeableConcept","Name/code for this diagnostic report","1..1",True), _el("subject","Reference","The subject of the report",ms=True), _el("encounter","Reference","Healthcare event context"), _el("effective[x]","dateTime","Clinically relevant time",ms=True), _el("issued","instant","When report was released",ms=True), _el("performer","Reference","Responsible diagnostic service","0..*"), _el("result","Reference","Observations - core of report","0..*"), _el("conclusion","string","Clinical conclusion"), _el("conclusionCode","CodeableConcept","Codes for conclusion","0..*")],
         5, "high", "Lab and pathology reports; diagnostic reporting standards for Pakistan"),
        ("ImagingStudy", "diagnostics", "A set of DICOM instances associated with a patient",
         "Representation of the content produced in a DICOM imaging study",
         [_el("identifier","Identifier","Study identifiers","0..*"), _el("status","code","registered | available | cancelled | entered-in-error",ms=True), _el("modality","Coding","All of the distinct modality values","0..*",True), _el("subject","Reference","Who or what is in the study","1..1",True), _el("encounter","Reference","Encounter context"), _el("started","dateTime","When study started"), _el("basedOn","Reference","Request fulfilled","0..*"), _el("referrer","Reference","Referring physician"), _el("numberOfSeries","unsignedInt","Number of series"), _el("numberOfInstances","unsignedInt","Number of instances"), _el("procedure","CodeableConcept","Procedures performed","0..*"), _el("series","BackboneElement","Each study has one or more series","0..*")],
         4, "medium", "Radiology imaging in tertiary care hospitals"),
        ("ImagingSelection", "diagnostics", "Selection of DICOM SOP instances",
         "A selection of DICOM SOP instances and/or frames within a single study",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","available | entered-in-error | unknown",ms=True), _el("subject","Reference","Subject of imaging selection"), _el("issued","instant","Date/time of selection"), _el("performer","BackboneElement","Selector of instances","0..*"), _el("basedOn","Reference","Associated request","0..*"), _el("category","CodeableConcept","Category","0..*"), _el("code","CodeableConcept","Imaging selection purpose","1..1",True), _el("studyUid","id","DICOM study instance UID"), _el("instance","BackboneElement","The selected instances","0..*")],
         1, "low", "Advanced imaging selection for PACS systems"),
        ("MolecularSequence", "diagnostics", "Raw data describing a biological sequence",
         "Representation of a molecular sequence",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("type","code","aa | dna | rna"), _el("subject","Reference","Subject"), _el("specimen","Reference","Specimen used"), _el("device","Reference","Sequencing device"), _el("performer","Reference","Who performed sequencing"), _el("literal","string","Sequence text"), _el("formatted","Attachment","Formatted sequence content","0..*"), _el("relative","BackboneElement","Relative position variations","0..*")],
         2, "low", "Genomic sequencing for research in Pakistan"),
        ("GenomicStudy", "diagnostics", "A genomics study",
         "A genomic study represents a set of analyses performed to analyze and generate genomic data",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","registered | available | cancelled | ...",ms=True), _el("type","CodeableConcept","Study types","0..*"), _el("subject","Reference","Subject","1..1",True), _el("encounter","Reference","Encounter context"), _el("startDate","dateTime","When the study was started"), _el("basedOn","Reference","Event based on","0..*"), _el("referrer","Reference","Referring physician"), _el("interpreter","Reference","Result interpreters","0..*"), _el("analysis","BackboneElement","Genomic analyses","0..*")],
         1, "low", "Genomic research at IBGE and Aga Khan University"),
        ("Specimen", "diagnostics", "A sample collected from a patient",
         "A sample to be used for analysis",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("accessionIdentifier","Identifier","Lab identifier"), _el("status","code","available | unavailable | unsatisfactory | entered-in-error",ms=True), _el("type","CodeableConcept","Kind of material","0..1",True), _el("subject","Reference","Where specimen came from",ms=True), _el("receivedTime","dateTime","Time received by lab"), _el("collection","BackboneElement","Collection details"), _el("processing","BackboneElement","Processing details","0..*"), _el("container","BackboneElement","Direct container","0..*"), _el("condition","CodeableConcept","State of specimen","0..*"), _el("note","Annotation","Comments","0..*")],
         4, "high", "Lab specimen tracking across Pakistani lab networks"),
        ("BodyStructure", "diagnostics", "Specific and identified anatomical structure (diagnostic context)",
         "Anatomical structure details used in diagnostic context",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("active","boolean","Whether record is active"), _el("morphology","CodeableConcept","Kind of structure"), _el("includedStructure","BackboneElement","Included structural areas","1..*",True), _el("excludedStructure","BackboneElement","Excluded structural areas","0..*"), _el("description","markdown","Text description"), _el("image","Attachment","Attached images","0..*"), _el("patient","Reference","Who this is about","1..1",True)],
         2, "medium", "Body structure documentation for diagnostics"),
        ("ObservationDefinition", "diagnostics", "Definition of an observation",
         "Set of definitional characteristics for observations and diagnostic services",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers"), _el("name","string","Computer-friendly name"), _el("title","string","Human-friendly name"), _el("status","code","draft | active | retired | unknown",ms=True), _el("code","CodeableConcept","Type of observation",ms=True), _el("permittedDataType","code","Allowed data types","0..*"), _el("multipleResultsAllowed","boolean","Multiple results allowed"), _el("method","CodeableConcept","Method of observation"), _el("preferredReportName","string","Preferred report name"), _el("qualifiedValue","BackboneElement","Set of qualified values","0..*")],
         2, "medium", "Lab test definitions for Pakistan standardized panels"),

        # ---- CAT-07: Clinical - Medications (9) ----
        ("Medication", "medications", "Definition of a medication",
         "Primarily used for identification and definition of a medication",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("code","CodeableConcept","Codes identifying this medication",ms=True), _el("status","code","active | inactive | entered-in-error"), _el("marketingAuthorizationHolder","Reference","Marketing authorization holder"), _el("doseForm","CodeableConcept","Dose form"), _el("totalVolume","Quantity","Amount of drug in package"), _el("ingredient","BackboneElement","Active or inactive ingredient","0..*"), _el("batch","BackboneElement","Batch details"), _el("definition","Reference","Associated medication definition")],
         5, "high", "DRAP-registered medications in Pakistan National Formulary"),
        ("MedicationRequest", "medications", "An order or request for medication",
         "An order or request for both supply and administration instructions for a medication",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | on-hold | ended | stopped | completed | ...",ms=True), _el("intent","code","proposal | plan | order | original-order | ...",ms=True), _el("category","CodeableConcept","Grouping or classification","0..*"), _el("medication","CodeableConcept","Medication to be taken","1..1",True), _el("subject","Reference","Patient","1..1",True), _el("encounter","Reference","Encounter context"), _el("authoredOn","dateTime","When request was initially authored",ms=True), _el("requester","Reference","Who/what requested",ms=True), _el("dosageInstruction","Dosage","Specific instructions","0..*",True), _el("dispenseRequest","BackboneElement","Medication supply authorization"), _el("substitution","BackboneElement","Generic substitution information")],
         5, "high", "e-Prescription support; DRAP formulary compliance in Pakistan"),
        ("MedicationDispense", "medications", "Provision of a supply of medication",
         "Indicates that a medication product has been dispensed for a named person or patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Plan fulfilled","0..*"), _el("status","code","preparation | in-progress | cancelled | on-hold | completed | ...",ms=True), _el("medication","CodeableConcept","What medication was supplied","1..1",True), _el("subject","Reference","Patient","1..1",True), _el("encounter","Reference","Encounter context"), _el("performer","BackboneElement","Who performed","0..*"), _el("quantity","Quantity","Amount dispensed"), _el("daysSupply","Quantity","Amount of medication per dose"), _el("whenHandedOver","dateTime","When product was given out"), _el("dosageInstruction","Dosage","How medication is used","0..*"), _el("substitution","BackboneElement","Whether substitution was made")],
         4, "high", "Pharmacy dispensing tracking in hospital pharmacies"),
        ("MedicationAdministration", "medications", "Administration of a medication to a patient",
         "Describes the event of a patient consuming or otherwise being administered a medication",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Plan fulfilled","0..*"), _el("status","code","in-progress | not-done | on-hold | completed | ...",ms=True), _el("category","CodeableConcept","Type of medication usage","0..*"), _el("medication","CodeableConcept","Medication administered","1..1",True), _el("subject","Reference","Patient","1..1",True), _el("encounter","Reference","Encounter context"), _el("occurence[x]","dateTime","Specific date/time or interval",ms=True), _el("performer","BackboneElement","Who performed","0..*"), _el("dosage","BackboneElement","Details of how medication was taken")],
         4, "high", "In-patient medication administration in Pakistan hospitals"),
        ("MedicationStatement", "medications", "A record of medication being taken by a patient",
         "A record of a medication that is being consumed by a patient",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","recorded | entered-in-error | draft",ms=True), _el("category","CodeableConcept","Type of medication usage","0..*"), _el("medication","CodeableConcept","Medication taken","1..1",True), _el("subject","Reference","Patient","1..1",True), _el("encounter","Reference","Encounter context"), _el("effective[x]","dateTime","When was medication taken"), _el("dateAsserted","dateTime","When statement was asserted"), _el("informationSource","Reference","Person who provided info","0..*"), _el("reason","CodeableConcept","Reason for taking","0..*"), _el("adherence","BackboneElement","Adherence details")],
         4, "high", "Self-reported medication use; adherence tracking for TB/HIV programs"),
        ("MedicationKnowledge", "medications", "Medication knowledge base",
         "Information about a medication that is used to support knowledge",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("code","CodeableConcept","Code identifying this medication"), _el("status","code","active | entered-in-error | inactive"), _el("author","Reference","Creator/owner of knowledge"), _el("intendedJurisdiction","CodeableConcept","Intended jurisdiction","0..*"), _el("name","string","Name(s) of medication","0..*"), _el("relatedMedicationKnowledge","BackboneElement","Associated medication","0..*"), _el("associatedMedication","Reference","Associated medications","0..*"), _el("productType","CodeableConcept","Category of medication","0..*"), _el("monograph","BackboneElement","Associated monographs","0..*"), _el("indicationGuideline","BackboneElement","Guidelines for indication","0..*")],
         2, "medium", "Drug knowledge base aligned with DRAP registrations"),
        ("FormularyItem", "medications", "An entry in a formulary",
         "Defines the characteristics of a medication that is available for formulary use",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("code","CodeableConcept","Codes identifying this item"), _el("status","code","active | entered-in-error | inactive"), _el("excludedStatus","code","Statuses excluded","0..*"), _el("name","string","Additional names","0..*"), _el("estimatedCost","Money","Estimated cost"), _el("drugCharacteristic","BackboneElement","Drug characteristics","0..*"), _el("resourceDescription","string","Resource description")],
         1, "medium", "Hospital formulary management in Pakistan"),
        ("Immunization", "medications", "An immunization event",
         "Describes the event of a patient being administered a vaccine or a record of immunization",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","completed | entered-in-error | not-done",ms=True), _el("vaccineCode","CodeableConcept","Vaccine product administered","1..1",True), _el("patient","Reference","Who was immunized","1..1",True), _el("encounter","Reference","Encounter context"), _el("occurrenceDateTime","dateTime","Vaccine administration date",ms=True), _el("primarySource","boolean","Indicates context of data capture"), _el("location","Reference","Where immunization occurred"), _el("site","CodeableConcept","Body site vaccine was administered"), _el("route","CodeableConcept","How vaccine entered body"), _el("doseQuantity","Quantity","Amount of vaccine administered"), _el("performer","BackboneElement","Who performed","0..*"), _el("protocolApplied","BackboneElement","Protocol followed","0..*")],
         5, "high", "EPI (Expanded Programme on Immunization) tracking; critical for Pakistan"),
        ("ImmunizationRecommendation", "medications", "Guidance on future immunizations",
         "A patient's point-in-time set of recommendations (i.e. forecasting) for immunizations",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("patient","Reference","Who this recommendation is for","1..1",True), _el("date","dateTime","Date recommendation(s) created","1..1",True), _el("authority","Reference","Who is responsible"), _el("recommendation","BackboneElement","Vaccine administration recommendations","1..*",True)],
         3, "high", "EPI schedule recommendations for children under 5 in Pakistan"),

        # ---- CAT-08: Clinical - Care Provision (11) ----
        ("CarePlan", "care-provision", "Plan of care for a patient",
         "Describes the intention of how one or more practitioners intend to deliver care",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfills care plan","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | order | option | directive",ms=True), _el("category","CodeableConcept","Type of plan","0..*"), _el("title","string","Human-friendly name"), _el("subject","Reference","Whose care plan this is","1..1",True), _el("encounter","Reference","Encounter context"), _el("period","Period","Time period plan covers"), _el("careTeam","Reference","Who is involved","0..*"), _el("goal","Reference","Desired outcome","0..*"), _el("activity","BackboneElement","Action to occur or has occurred","0..*")],
         4, "high", "Care plans for chronic disease management programs (diabetes, TB, hepatitis)"),
        ("CareTeam", "care-provision", "Team of practitioners providing care",
         "The Care Team includes all the people and organizations who plan to participate in the care",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","proposed | active | suspended | inactive | entered-in-error"), _el("category","CodeableConcept","Type of team","0..*"), _el("name","string","Name of the team"), _el("subject","Reference","Who care team is for"), _el("period","Period","Time period team covers"), _el("participant","BackboneElement","Members of the team","0..*",True), _el("reason","CodeableConcept","Why the care team exists","0..*"), _el("managingOrganization","Reference","Organization responsible","0..*")],
         3, "high", "Lady Health Worker teams and community health worker teams"),
        ("Goal", "care-provision", "Desired health state for a patient",
         "Describes the intended objective(s) for a patient, group, or organization",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("lifecycleStatus","code","proposed | planned | accepted | active | on-hold | completed | ...",ms=True), _el("achievementStatus","CodeableConcept","in-progress | improving | worsening | no-change | achieved | ..."), _el("category","CodeableConcept","Category such as dietary, safety","0..*"), _el("priority","CodeableConcept","high-priority | medium-priority | low-priority"), _el("description","CodeableConcept","Code or text describing goal","1..1",True), _el("subject","Reference","Who this goal is intended for","1..1",True), _el("target","BackboneElement","Target outcome for goal","0..*"), _el("statusDate","date","When goal status changed"), _el("note","Annotation","Comments","0..*")],
         3, "medium", "Health outcome goals for MNCH programs"),
        ("ServiceRequest", "care-provision", "A request for a service to be performed",
         "A record of a request for service such as diagnostic investigations, treatments, or operations",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","What request fulfils","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | directive | order | ...",ms=True), _el("category","CodeableConcept","Classification of service","0..*"), _el("priority","code","routine | urgent | asap | stat"), _el("code","CodeableConcept","What is being requested",ms=True), _el("subject","Reference","Individual or entity","1..1",True), _el("encounter","Reference","Encounter context"), _el("occurrence[x]","dateTime","When service should occur"), _el("requester","Reference","Who/what is requesting service",ms=True), _el("performer","Reference","Requested performer","0..*")],
         5, "high", "Referral and service orders between BHUs, THQs, and DHQs"),
        ("NutritionOrder", "care-provision", "Diet, formula, or supplement order",
         "A request to supply a diet, formula feeding (enteral) or oral nutritional supplement",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | directive | order | ...",ms=True), _el("priority","code","routine | urgent | asap | stat"), _el("subject","Reference","Who requires the diet","1..1",True), _el("encounter","Reference","Encounter context"), _el("dateTime","dateTime","Date and time order was made",ms=True), _el("orderer","Reference","Who ordered"), _el("oralDiet","BackboneElement","Oral diet components"), _el("supplement","BackboneElement","Supplement components","0..*"), _el("enteralFormula","BackboneElement","Enteral formula components")],
         3, "high", "Nutrition orders for malnourished children in Pakistan"),
        ("RequestOrchestration", "care-provision", "A group of related requests",
         "A set of related requests that can be used to capture intended activities",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfils plan","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | directive | order | ...",ms=True), _el("priority","code","routine | urgent | asap | stat"), _el("code","CodeableConcept","What is being done"), _el("subject","Reference","Who the group is about"), _el("encounter","Reference","Encounter context"), _el("author","Reference","Device or practitioner author"), _el("action","BackboneElement","Proposed actions","0..*")],
         2, "medium", "Orchestrating care pathways across facility levels"),
        ("EpisodeOfCare", "care-provision", "An association between a patient and an organization/period",
         "An association between a patient and an organization/healthcare providers for a period of time",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","planned | waitlist | active | onhold | finished | cancelled",ms=True), _el("type","CodeableConcept","Type/class","0..*"), _el("reason","BackboneElement","Reason for association","0..*"), _el("diagnosis","BackboneElement","Diagnosis in context","0..*"), _el("patient","Reference","The patient who is the focus","1..1",True), _el("managingOrganization","Reference","Organization managing"), _el("period","Period","Interval during this episode"), _el("careTeam","Reference","Care team","0..*"), _el("account","Reference","Billing accounts","0..*")],
         3, "high", "Episode-based care tracking for TB DOTS programs"),
        ("Encounter", "care-provision", "An interaction during which services are provided",
         "An interaction between a patient and healthcare provider(s) for the purpose of providing services",
         [_el("identifier","Identifier","Business identifiers","0..*",True), _el("status","code","planned | in-progress | on-hold | discharged | completed | ...",ms=True), _el("class","CodeableConcept","Classification such as inpatient | outpatient | emergency","0..*",True), _el("priority","CodeableConcept","Indicates urgency of encounter"), _el("type","CodeableConcept","Specific type of encounter","0..*",True), _el("subject","Reference","The patient or group present","1..1",True), _el("participant","BackboneElement","Persons involved","0..*"), _el("period","Period","Start and end time",ms=True), _el("reason","BackboneElement","Coded reason the encounter takes place","0..*"), _el("diagnosis","BackboneElement","Relevant diagnosis","0..*"), _el("admission","BackboneElement","Details about admission"), _el("location","BackboneElement","Location(s) where encounter takes place","0..*"), _el("serviceProvider","Reference","Department or organization")],
         5, "high", "Core encounter tracking for OPD/IPD/Emergency in Pakistan hospitals"),
        ("EncounterHistory", "care-provision", "A record of significant events during an encounter",
         "A record of significant events/milestones during the encounter",
         [_el("encounter","Reference","The encounter this is a history of","1..1",True), _el("identifier","Identifier","Identifier(s) by which this encounter is known","0..*"), _el("status","code","Status of the encounter",ms=True), _el("class","CodeableConcept","Classification","1..1",True), _el("type","CodeableConcept","Specific type","0..*"), _el("subject","Reference","The patient or group present"), _el("subjectStatus","CodeableConcept","Patient status within encounter"), _el("actualPeriod","Period","Actual period"), _el("plannedStartDate","dateTime","Planned start"), _el("plannedEndDate","dateTime","Planned end"), _el("length","Duration","Duration of encounter")],
         1, "medium", "Encounter state tracking over time"),
        ("Communication", "care-provision", "A clinical or business communication",
         "A clinical or business level record of information being transmitted or shared",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfills request","0..*"), _el("status","code","preparation | in-progress | not-done | on-hold | stopped | completed",ms=True), _el("category","CodeableConcept","Message category","0..*"), _el("priority","code","routine | urgent | asap | stat"), _el("medium","CodeableConcept","Communication medium","0..*"), _el("subject","Reference","Focus of message"), _el("sender","Reference","Who sent message"), _el("recipient","Reference","Who received message","0..*"), _el("payload","BackboneElement","Message payload","0..*")],
         3, "medium", "Health communication messaging between facilities"),
        ("CommunicationRequest", "care-provision", "A request for communication",
         "A request to convey information; e.g. the CDS system proposes an alert to be sent",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Fulfills plan","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | directive | order",ms=True), _el("category","CodeableConcept","Message category","0..*"), _el("priority","code","routine | urgent | asap | stat"), _el("doNotPerform","boolean","True if request is prohibiting action"), _el("medium","CodeableConcept","Medium","0..*"), _el("subject","Reference","Focus"), _el("recipient","Reference","Who to share with","0..*"), _el("sender","Reference","Who to send from")],
         3, "medium", "Communication request management for patient engagement"),

        # ---- CAT-09: Clinical - Request & Response (5) ----
        ("QuestionnaireResponse", "request-response", "Answers to a questionnaire",
         "A structured set of questions and their answers",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Request fulfilled","0..*"), _el("partOf","Reference","Part of","0..*"), _el("questionnaire","canonical","Form being answered","1..1",True), _el("status","code","in-progress | completed | amended | entered-in-error | stopped",ms=True), _el("subject","Reference","Subject of questionnaire"), _el("encounter","Reference","Encounter context"), _el("authored","dateTime","Date response was authored",ms=True), _el("author","Reference","Person who received answers"), _el("source","Reference","Person who answered"), _el("item","BackboneElement","Groups and questions","0..*")],
         5, "high", "Assessment forms for LHW surveys, MNCH checklists in Pakistan"),
        ("DocumentReference", "request-response", "A reference to a document",
         "A reference to a document of any kind for any purpose",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Procedure request","0..*"), _el("status","code","current | superseded | entered-in-error",ms=True), _el("docStatus","code","preliminary | final | amended | entered-in-error"), _el("type","CodeableConcept","Kind of document",ms=True), _el("category","CodeableConcept","Categorization of document","0..*"), _el("subject","Reference","Who/what is the subject"), _el("date","instant","When document reference was created"), _el("author","Reference","Who and/or what authored the document","0..*"), _el("content","BackboneElement","Document referenced","1..*",True), _el("context","BackboneElement","Clinical context of document","0..*")],
         5, "high", "Clinical document sharing across Pakistan health systems"),
        ("Composition", "request-response", "A set of healthcare-related information assembled together",
         "A set of healthcare-related information assembled into a single logical package",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","registered | partial | preliminary | final | amended",ms=True), _el("type","CodeableConcept","Kind of composition","1..1",True), _el("category","CodeableConcept","Categorization","0..*"), _el("subject","Reference","Who/what the composition is about","0..*",True), _el("encounter","Reference","Context of the composition"), _el("date","dateTime","Composition editing time","1..1",True), _el("author","Reference","Who/what authored the composition","1..*",True), _el("title","string","Human readable title","1..1",True), _el("section","BackboneElement","Composition sections","0..*")],
         4, "high", "Clinical document composition for discharge summaries"),
        ("List", "request-response", "A list of items",
         "A list is a curated collection of resources",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","current | retired | entered-in-error",ms=True), _el("mode","code","working | snapshot | changes","1..1",True), _el("title","string","Descriptive name for the list"), _el("code","CodeableConcept","What the purpose of this list is"), _el("subject","Reference","If applicable","0..*"), _el("encounter","Reference","Context in which list created"), _el("date","dateTime","When list was prepared"), _el("source","Reference","Who/what defined the list"), _el("entry","BackboneElement","Entries in the list","0..*"), _el("emptyReason","CodeableConcept","Why list is empty")],
         3, "medium", "Problem lists, medication lists for patient summaries"),
        ("MeasureReport", "request-response", "Results of evaluating a measure",
         "The MeasureReport resource contains the results of the calculation of a measure",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","complete | pending | error",ms=True), _el("type","code","individual | subject-list | summary | data-exchange","1..1",True), _el("measure","canonical","What measure was calculated","1..1",True), _el("subject","Reference","What individual(s) the report is for"), _el("date","dateTime","When the report was generated"), _el("reporter","Reference","Who is reporting"), _el("reportingVendor","Reference","Vendor who submitted report"), _el("period","Period","Reporting period","1..1",True), _el("group","BackboneElement","Measure results for each group","0..*"), _el("evaluatedResource","Reference","Evaluated resources","0..*")],
         4, "high", "Healthcare quality measure reporting for PHCIP indicators"),

        # ---- CAT-10: Financial (13) ----
        ("Coverage", "financial", "Insurance or medical plan or a payment agreement",
         "Financial instrument which may be used to reimburse or pay for health care products and services",
         [_el("identifier","Identifier","Business identifiers","0..*",True), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("kind","code","insurance | self-pay | other","1..1",True), _el("type","CodeableConcept","Coverage category"), _el("subscriber","Reference","Owner of the policy"), _el("subscriberId","Identifier","ID assigned to subscriber"), _el("beneficiary","Reference","Plan beneficiary","1..1",True), _el("relationship","CodeableConcept","Beneficiary relationship"), _el("period","Period","Coverage start and end dates"), _el("insurer","Reference","Issuer of the policy"), _el("class","BackboneElement","Additional coverage classifications","0..*"), _el("costToBeneficiary","BackboneElement","Patient payments for services","0..*")],
         5, "high", "Sehat Sahulat Program insurance coverage for Pakistan"),
        ("CoverageEligibilityRequest", "financial", "Request for coverage eligibility",
         "The CoverageEligibilityRequest provides patient and insurance coverage information",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("purpose","code","auth-requirements | benefits | discovery | validation","1..*",True), _el("patient","Reference","Intended recipient of services","1..1",True), _el("created","dateTime","Creation date",ms=True), _el("provider","Reference","Party responsible"), _el("insurer","Reference","Coverage issuer","1..1",True), _el("insurance","BackboneElement","Patient insurance information","0..*"), _el("item","BackboneElement","Items to be evaluated","0..*")],
         3, "high", "Eligibility checking for Sehat Sahulat beneficiaries"),
        ("CoverageEligibilityResponse", "financial", "Response to eligibility request",
         "This resource provides eligibility and plan details from the processing of a CoverageEligibilityRequest",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("purpose","code","auth-requirements | benefits | discovery | validation","1..*",True), _el("patient","Reference","Intended recipient","1..1",True), _el("created","dateTime","Response creation date",ms=True), _el("request","Reference","Eligibility request reference","1..1",True), _el("outcome","code","queued | complete | error | partial",ms=True), _el("insurer","Reference","Coverage issuer","1..1",True), _el("insurance","BackboneElement","Patient insurance information","0..*"), _el("error","BackboneElement","Processing errors","0..*")],
         3, "high", "Eligibility responses from Sehat Sahulat system"),
        ("EnrollmentRequest", "financial", "Request for enrollment",
         "This resource provides the insurance enrollment details to the insurer regarding a specified coverage",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("created","dateTime","Creation date"), _el("insurer","Reference","Target insurer"), _el("provider","Reference","Responsible practitioner"), _el("candidate","Reference","Subject to be enrolled"), _el("coverage","Reference","Insurance information")],
         2, "high", "Enrollment into Sehat Sahulat Program"),
        ("EnrollmentResponse", "financial", "Response to enrollment request",
         "This resource provides enrollment and plan details from the processing of an EnrollmentRequest resource",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("request","Reference","Claim reference"), _el("outcome","code","queued | complete | error | partial"), _el("disposition","string","Disposition message"), _el("created","dateTime","Creation date"), _el("organization","Reference","Insurer")],
         2, "high", "Enrollment confirmation for Sehat Sahulat"),
        ("Claim", "financial", "A provider issued claim",
         "A provider issued list of professional services and products for reimbursement or payment",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("type","CodeableConcept","Category or discipline","1..1",True), _el("use","code","claim | preauthorization | predetermination","1..1",True), _el("patient","Reference","The recipient of the products and services","1..1",True), _el("created","dateTime","Resource creation date","1..1",True), _el("insurer","Reference","Target insurer"), _el("provider","Reference","Party responsible","1..1",True), _el("priority","CodeableConcept","Desired processing urgency","1..1",True), _el("diagnosis","BackboneElement","Pertinent diagnosis","0..*"), _el("insurance","BackboneElement","Patient insurance information","1..*",True), _el("item","BackboneElement","Product or service provided","0..*"), _el("total","Money","Total claim cost")],
         5, "high", "Claims submission to Sehat Sahulat and private insurers"),
        ("ClaimResponse", "financial", "Response to a claim",
         "This resource provides the adjudication details from the processing of a Claim resource",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("type","CodeableConcept","More granular claim type","1..1",True), _el("use","code","claim | preauthorization | predetermination","1..1",True), _el("patient","Reference","The recipient","1..1",True), _el("created","dateTime","Response creation date","1..1",True), _el("insurer","Reference","Party responsible","1..1",True), _el("request","Reference","Id of resource triggering adjudication"), _el("outcome","code","queued | complete | error | partial","1..1",True), _el("item","BackboneElement","Adjudication for claim details","0..*"), _el("total","BackboneElement","Adjudication totals","0..*"), _el("payment","BackboneElement","Payment details")],
         5, "high", "Claims adjudication responses from insurers"),
        ("ExplanationOfBenefit", "financial", "Explanation of benefit",
         "This resource provides the adjudication details from processing of a Claim resource",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("type","CodeableConcept","Category or discipline","1..1",True), _el("use","code","claim | preauthorization | predetermination","1..1",True), _el("patient","Reference","The recipient","1..1",True), _el("created","dateTime","Response creation date","1..1",True), _el("insurer","Reference","Party responsible","1..1",True), _el("provider","Reference","Party responsible for the claim","1..1",True), _el("outcome","code","queued | complete | error | partial","1..1",True), _el("item","BackboneElement","Product or service provided","0..*"), _el("total","BackboneElement","Adjudication totals","0..*"), _el("payment","BackboneElement","Payment details")],
         5, "high", "Benefit explanation for Sehat Sahulat beneficiaries"),
        ("PaymentNotice", "financial", "A payment notice",
         "This resource provides the status of the payment for goods and services rendered",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("request","Reference","Request reference"), _el("response","Reference","Response reference"), _el("created","dateTime","Creation date","1..1",True), _el("reporter","Reference","Responsible practitioner"), _el("payment","Reference","Payment reference"), _el("paymentDate","date","Payment or clearing date"), _el("payee","Reference","Party being paid"), _el("recipient","Reference","Party being notified","1..1",True), _el("amount","Money","Monetary amount","1..1",True)],
         3, "medium", "Payment tracking for healthcare services"),
        ("PaymentReconciliation", "financial", "Payment reconciliation",
         "This resource provides the details including amount of a payment and allocates the payment to resources",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("type","CodeableConcept","Category of payment"), _el("status","code","active | cancelled | draft | entered-in-error",ms=True), _el("kind","CodeableConcept","Nature of payment"), _el("period","Period","Period covered"), _el("created","dateTime","Creation date","1..1",True), _el("paymentIssuer","Reference","Party generating payment"), _el("request","Reference","Reference to requesting resource"), _el("outcome","code","queued | complete | error | partial"), _el("amount","Money","Total amount of Payment","1..1",True), _el("allocation","BackboneElement","Settlement particulars","0..*")],
         3, "medium", "Reconciliation of healthcare payments"),
        ("Invoice", "financial", "A commercial invoice",
         "Invoice containing collected ChargeItems from an Account with calculated individual and total price",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | issued | balanced | cancelled | entered-in-error",ms=True), _el("type","CodeableConcept","Type of invoice"), _el("subject","Reference","Recipient of the invoice"), _el("date","dateTime","Invoice date"), _el("participant","BackboneElement","Participants involved","0..*"), _el("issuer","Reference","Issuing organization"), _el("account","Reference","Account that charges are attributed to"), _el("lineItem","BackboneElement","Line items","0..*"), _el("totalNet","Money","Net total of this invoice"), _el("totalGross","Money","Gross total of this invoice"), _el("note","Annotation","Comments","0..*")],
         3, "medium", "Hospital billing invoices in Pakistan"),
        ("InsurancePlan", "financial", "Details of a health insurance product/plan",
         "Details of a health insurance product/plan provided by an organization",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | retired | unknown"), _el("type","CodeableConcept","Type of plan","0..*"), _el("name","string","Official name"), _el("alias","string","Alternate names","0..*"), _el("period","Period","When the product/plan is available"), _el("ownedBy","Reference","Organization issuing plan"), _el("administeredBy","Reference","Organization administering plan"), _el("coverageArea","Reference","Where product/plan applies","0..*"), _el("coverage","BackboneElement","Coverage details","0..*"), _el("plan","BackboneElement","Plan details","0..*")],
         3, "high", "Sehat Sahulat packages and private health insurance plans"),
        ("Account", "financial", "A financial account",
         "A financial tool for tracking value accrued for a particular purpose",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | inactive | entered-in-error | on-hold | unknown",ms=True), _el("billingStatus","CodeableConcept","Tracks the billing status"), _el("type","CodeableConcept","E.g. patient, expense, depreciation"), _el("name","string","Human-readable label"), _el("subject","Reference","The entity that caused the expenses","0..*"), _el("servicePeriod","Period","Transaction window"), _el("balance","BackboneElement","Calculated account balance(s)","0..*"), _el("coverage","BackboneElement","Coverage(s)","0..*"), _el("owner","Reference","Entity managing the account"), _el("procedure","BackboneElement","Associated procedures","0..*"), _el("relatedAccount","BackboneElement","Other associated accounts","0..*")],
         4, "high", "Patient billing accounts in hospital financial systems"),

        # ---- CAT-11: Public Health & Research (10) ----
        ("ResearchStudy", "public-health", "Investigation to increase healthcare knowledge",
         "A process where a researcher or organization plans and then executes a series of steps",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Name for the study"), _el("title","string","Human-readable label",ms=True), _el("status","code","draft | active | retired | unknown",ms=True), _el("primaryPurposeType","CodeableConcept","treatment | prevention | diagnostic | ..."), _el("phase","CodeableConcept","Phase of research"), _el("focus","BackboneElement","Drugs, devices, etc. studied","0..*"), _el("condition","CodeableConcept","Condition(s) studied","0..*"), _el("keyword","CodeableConcept","Keywords","0..*"), _el("associatedParty","BackboneElement","Sponsors, investigators, etc.","0..*"), _el("site","Reference","Facility where study was conducted","0..*")],
         4, "medium", "Clinical research at Aga Khan, AKUH, and PHRC-funded studies"),
        ("ResearchSubject", "public-health", "A participant in a research study",
         "A participant in a research study, from the perspective of investigator",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | retired | unknown",ms=True), _el("period","Period","Start and end of participation"), _el("study","Reference","Study subject is part of","1..1",True), _el("subject","Reference","Who or what is part of study","1..1",True), _el("assignedComparisonGroup","id","What path was followed"), _el("actualComparisonGroup","id","What arm was actually followed"), _el("consent","Reference","Agreement to participate","0..*")],
         3, "medium", "Research participants in Pakistan clinical trials"),
        ("Evidence", "public-health", "A body of evidence",
         "The Evidence resource describes the conditional state for particular knowledge",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Name for the evidence"), _el("title","string","Human-readable name"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("variableDefinition","BackboneElement","Evidence variable definitions","1..*",True), _el("synthesisType","CodeableConcept","Synthesis type"), _el("studyDesign","CodeableConcept","Study design","0..*"), _el("statistic","BackboneElement","Evidence statistics","0..*"), _el("certainty","BackboneElement","Certainty of evidence","0..*")],
         2, "low", "Evidence-based medicine resources"),
        ("EvidenceReport", "public-health", "A summary of evidence",
         "The EvidenceReport resource is a specialized container for a collection of Evidence resources",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Name for report"), _el("status","code","draft | active | retired | unknown",ms=True), _el("relatedArtifact","RelatedArtifact","Link or citation","0..*"), _el("subject","BackboneElement","Focus of report","1..1",True), _el("publisher","string","Name of publisher"), _el("author","ContactPoint","Who authored report","0..*"), _el("section","BackboneElement","Report sections","0..*")],
         1, "low", "Clinical evidence reports"),
        ("EvidenceVariable", "public-health", "A definition of an exposure or outcome",
         "The EvidenceVariable resource describes an element for knowledge synthesis",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Name for variable"), _el("title","string","Human-readable name"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("actual","boolean","Actual or conceptual"), _el("characteristic","BackboneElement","Characteristics defining the variable","0..*"), _el("handling","code","continuous | dichotomous | ordinal | polychotomous")],
         2, "low", "Evidence variable definitions for research"),
        ("Measure", "public-health", "A quality measure definition",
         "The Measure resource provides the definition of a quality measure",
         [_el("url","uri","Canonical URL",ms=True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Name for this measure"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("scoring","CodeableConcept","proportion | ratio | continuous-variable | cohort"), _el("type","CodeableConcept","process | outcome | structure | ...","0..*"), _el("group","BackboneElement","Population criteria","0..*"), _el("supplementalData","BackboneElement","Supplemental data","0..*")],
         4, "high", "Healthcare quality measures for PHCIP and WHO indicators"),
        ("Library", "public-health", "A shareable library of clinical knowledge",
         "The Library resource is a general-purpose container for knowledge asset definitions",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Name for this library"), _el("status","code","draft | active | retired | unknown",ms=True), _el("type","CodeableConcept","logic-library | model-definition | asset-collection | module-definition","1..1",True), _el("description","markdown","Natural language description"), _el("content","Attachment","Contents of the library","0..*"), _el("dataRequirement","BackboneElement","What data is referenced","0..*")],
         3, "medium", "Clinical decision support libraries"),
        ("ActivityDefinition", "public-health", "The definition of a specific activity to be taken",
         "A resource that describes a specific activity to be performed",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Name for this activity"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("kind","code","Resource type to create"), _el("code","CodeableConcept","Detail type of activity"), _el("timing[x]","Timing","When activity is to occur"), _el("location","Reference","Where it should happen"), _el("participant","BackboneElement","Who should participate","0..*"), _el("dynamicValue","BackboneElement","Dynamic aspects","0..*")],
         3, "medium", "Standard operating procedures for health programs"),
        ("PlanDefinition", "public-health", "The definition of a plan for a group of actions",
         "A resource that describes a series of actions to be taken in particular circumstances",
         [_el("url","uri","Canonical URL",ms=True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Name for this plan"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("type","CodeableConcept","order-set | clinical-protocol | eca-rule | workflow-definition"), _el("goal","BackboneElement","What the plan is trying to accomplish","0..*"), _el("action","BackboneElement","Action to take","0..*"), _el("actor","BackboneElement","Actors within the plan","0..*")],
         4, "high", "Clinical protocols and care pathways for MNCH, EPI, TB programs"),
        ("Citation", "public-health", "A reference to a knowledge artifact",
         "The Citation Resource enables reference to any knowledge artifact for purposes of identification and attribution",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Name for this citation"), _el("status","code","draft | active | retired | unknown",ms=True), _el("date","dateTime","Date last changed"), _el("publisher","string","Name of the publisher"), _el("description","markdown","Natural language description"), _el("citedArtifact","BackboneElement","The article or artifact being cited")],
         1, "low", "Academic citation management for health research"),

        # ---- CAT-12: Infrastructure & Exchange (49) ----
        ("AuditEvent", "infrastructure", "A record of an event relevant to security or privacy",
         "A record of an event relevant to security, privacy, or data integrity",
         [_el("category","CodeableConcept","Type/identifier of event","0..*"), _el("code","CodeableConcept","Specific type of event","1..1",True), _el("action","code","Type of action performed",ms=True), _el("severity","code","emergency | alert | critical | error | warning | notice | informational | debug"), _el("occurred[x]","Period","When the activity occurred",ms=True), _el("recorded","instant","When the event was recorded","1..1",True), _el("outcome","BackboneElement","Whether event succeeded or failed"), _el("agent","BackboneElement","Actor involved","1..*",True), _el("source","BackboneElement","Audit event reporter","1..1",True), _el("entity","BackboneElement","Data or objects used","0..*"), _el("patient","Reference","Patient if relevant")],
         5, "high", "Security audit trail for HMIS and health data systems"),
        ("Provenance", "infrastructure", "Who, what, when for a set of resources",
         "Provenance of a resource is a record that describes entities and processes involved",
         [_el("target","Reference","Target Reference(s)","1..*",True), _el("occurred[x]","Period","When activity occurred"), _el("recorded","instant","When provenance was recorded","1..1",True), _el("policy","uri","Policy or plan used","0..*"), _el("location","Reference","Where activity occurred"), _el("authorization","CodeableConcept","Authorization related to event","0..*"), _el("activity","CodeableConcept","Activity that occurred"), _el("basedOn","Reference","Workflow authorization","0..*"), _el("patient","Reference","Patient provenance is about"), _el("encounter","Reference","Encounter associated"), _el("agent","BackboneElement","Actor involved","1..*",True), _el("entity","BackboneElement","An entity used in this activity","0..*")],
         4, "high", "Data provenance tracking for health information exchange"),
        ("Subscription", "infrastructure", "Notification channel for server events",
         "The subscription resource describes a particular client's request to be notified about events",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Human readable name"), _el("status","code","requested | active | error | off | entered-in-error",ms=True), _el("topic","canonical","Reference to subscription topic","1..1",True), _el("end","instant","When to automatically delete"), _el("reason","string","Human readable reason"), _el("filterBy","BackboneElement","Criteria for narrowing topic","0..*"), _el("channelType","Coding","Channel type for notifications","1..1",True), _el("endpoint","url","Where the channel points to"), _el("content","code","empty | id-only | full-resource")],
         4, "medium", "Real-time notification for disease outbreak alerts"),
        ("SubscriptionTopic", "infrastructure", "Definition of a subscription topic",
         "Describes a stream of resource state changes or events and annotated with labels",
         [_el("url","uri","Canonical URL","1..1",True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("resourceTrigger","BackboneElement","Definition of resource-based trigger","0..*"), _el("eventTrigger","BackboneElement","Event definitions","0..*"), _el("canFilterBy","BackboneElement","Allowed filters","0..*"), _el("notificationShape","BackboneElement","Notification shape","0..*")],
         3, "medium", "Subscription topic definitions"),
        ("SubscriptionStatus", "infrastructure", "Status information about a subscription",
         "The SubscriptionStatus resource describes the state of a Subscription during notifications",
         [_el("status","code","requested | active | error | off | entered-in-error"), _el("type","code","handshake | heartbeat | event-notification | query-status | query-event","1..1",True), _el("eventsSinceSubscriptionStart","integer64","Events since subscription started"), _el("notificationEvent","BackboneElement","Detailed information about notifications","0..*"), _el("subscription","Reference","Reference to the subscription","1..1",True), _el("topic","canonical","Reference to the subscription topic"), _el("error","CodeableConcept","List of errors","0..*")],
         2, "low", "Subscription status tracking"),
        ("Binary", "infrastructure", "Pure binary content defined by a format other than FHIR",
         "A resource that represents the data of a single raw artifact",
         [_el("contentType","code","MimeType of the binary content","1..1",True), _el("securityContext","Reference","Identifies another resource to use for access control"), _el("data","base64Binary","The actual content","0..1")],
         5, "medium", "Binary content storage for scanned documents"),
        ("Bundle", "infrastructure", "A container for a collection of resources",
         "A container for a collection of resources",
         [_el("identifier","Identifier","Persistent identifier for the bundle"), _el("type","code","document | message | transaction | transaction-response | batch | batch-response | history | searchset | collection | subscription-notification","1..1",True), _el("timestamp","instant","When the bundle was assembled"), _el("total","unsignedInt","If search, total number of matches"), _el("link","BackboneElement","Links related to this bundle","0..*"), _el("entry","BackboneElement","Entry in the bundle","0..*"), _el("signature","Signature","Digital signature")],
         5, "high", "FHIR document bundles for health information exchange"),
        ("MessageHeader", "infrastructure", "A resource that describes a message that is exchanged",
         "The header for a message exchange that is either requesting or responding to an action",
         [_el("event[x]","Coding","Event code","1..1",True), _el("destination","BackboneElement","Message destination(s)","0..*"), _el("sender","Reference","Real world sender of the message"), _el("author","Reference","The source of the decision"), _el("source","BackboneElement","Message source application","1..1",True), _el("responsible","Reference","Final responsibility for event"), _el("reason","CodeableConcept","Cause of event"), _el("response","BackboneElement","If this is a reply to prior message"), _el("focus","Reference","Actual content of the message","0..*")],
         4, "medium", "Message headers for inter-system communication"),
        ("OperationOutcome", "infrastructure", "Information about the outcome of an operation",
         "A collection of error, warning, or information messages that result from a system action",
         [_el("issue","BackboneElement","A single issue associated with the action","1..*",True)],
         5, "high", "Error reporting in health system integrations"),
        ("Parameters", "infrastructure", "Operation request or response",
         "This resource is used to pass information into and back from an operation",
         [_el("parameter","BackboneElement","Operation parameter","0..*")],
         5, "medium", "Operation parameters for FHIR API calls"),
        ("Basic", "infrastructure", "Resource for concepts not yet defined in FHIR",
         "Basic is used for handling concepts not yet defined in FHIR, or outside of FHIR",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("code","CodeableConcept","Kind of resource","1..1",True), _el("subject","Reference","Identifies the focus"), _el("created","dateTime","When created"), _el("author","Reference","Who created")],
         3, "low", "Extension point for Pakistan-specific resource types"),
        ("ChargeItem", "infrastructure", "An item charged to a patient account",
         "The resource ChargeItem describes the provision of healthcare provider products",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","planned | billable | not-billable | aborted | billed | entered-in-error | unknown",ms=True), _el("code","CodeableConcept","A code that identifies the charge","1..1",True), _el("subject","Reference","Individual service was done for","1..1",True), _el("encounter","Reference","Encounter associated"), _el("occurrence[x]","dateTime","When the charged service was applied"), _el("performer","BackboneElement","Who performed the charged service","0..*"), _el("quantity","Quantity","Quantity of which the charge item"), _el("totalPriceComponent","BackboneElement","Total price overrides","0..*")],
         3, "medium", "Charge capture in hospital billing systems"),
        ("ChargeItemDefinition", "infrastructure", "Definition of properties and rules about how charges are billed",
         "Describes a set of rules that define how charges are billed",
         [_el("url","uri","Canonical URL","1..1",True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("code","CodeableConcept","Billing code or product type"), _el("instance","Reference","Instances this definition applies to","0..*"), _el("applicability","BackboneElement","Whether the billing code is applicable","0..*"), _el("propertyGroup","BackboneElement","Group of properties and rules","0..*")],
         2, "low", "Billing rules definition"),
        ("Contract", "infrastructure", "Legal agreement",
         "Legally enforceable, formally recorded unilateral or bilateral directive",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("url","uri","Basal definition"), _el("status","code","amended | appended | cancelled | disputed | entered-in-error | executable | executed | negotiable | offered | policy | rejected | renewed | revoked | resolved | terminated"), _el("legalState","CodeableConcept","Negotiation status"), _el("subject","Reference","Contract target entity","0..*"), _el("authority","Reference","Authority under which contract exists","0..*"), _el("type","CodeableConcept","Legal instrument category"), _el("term","BackboneElement","Contract term list","0..*"), _el("signer","BackboneElement","Contract signatory","0..*")],
         3, "medium", "Service contracts and agreements"),
        ("ExampleScenario", "infrastructure", "An example of a FHIR workflow",
         "A walkthrough of a workflow showing the interactions between systems",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("actor","BackboneElement","Individual involved","0..*"), _el("instance","BackboneElement","Data used in the scenario","0..*"), _el("process","BackboneElement","Major process within scenario","0..*")],
         2, "low", "Workflow example documentation"),
        ("TestScript", "infrastructure", "Describes a set of tests for a FHIR server",
         "A structured set of tests against a FHIR server or client implementation",
         [_el("url","uri","Canonical URL","1..1",True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name",ms=True), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("fixture","BackboneElement","Fixture in the test script","0..*"), _el("variable","BackboneElement","Placeholder for evaluated elements","0..*"), _el("setup","BackboneElement","Series of required setup operations"), _el("test","BackboneElement","A test in this script","0..*"), _el("teardown","BackboneElement","Series of required clean-up operations")],
         3, "medium", "FHIR server conformance testing"),
        ("TestPlan", "infrastructure", "A plan for executing testing on an artifact or specification",
         "Describes how a test plan is structured",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("scope","Reference","Reference to a resource as the scope","0..*"), _el("testCase","BackboneElement","Specific tests","0..*"), _el("category","CodeableConcept","Category","0..*")],
         1, "low", "Testing plan documentation"),
        ("TestReport", "infrastructure", "Results of executing a TestScript",
         "A summary of information based on the results of executing a TestScript",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Informal name","1..1",True), _el("status","code","completed | in-progress | waiting | stopped | entered-in-error",ms=True), _el("testScript","canonical","Reference to the TestScript","1..1",True), _el("result","code","pass | fail | pending",ms=True), _el("score","decimal","Overall score"), _el("tester","string","Name of the tester"), _el("issued","dateTime","When report was generated"), _el("setup","BackboneElement","Setup results"), _el("test","BackboneElement","Test results","0..*"), _el("teardown","BackboneElement","Teardown results")],
         2, "low", "Test execution results"),
        ("ActorDefinition", "infrastructure", "A functional description of an actor",
         "Describes an actor - a human or an application that plays a role in data exchange",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("type","code","person | system","1..1",True), _el("documentation","markdown","Functionality associated")],
         1, "low", "Actor definitions in FHIR workflows"),
        ("Requirements", "infrastructure", "A set of requirements for an IG or specification",
         "A set of requirements - a list of features or behaviors of a system",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("derivedFrom","canonical","Other requirements this derives from","0..*"), _el("reference","url","External reference","0..*"), _el("actor","canonical","Actor involved","0..*"), _el("statement","BackboneElement","Actual statement of requirement","0..*")],
         1, "low", "Requirements definitions for health IT specifications"),
        # Remaining infrastructure resources to reach 157 total
        ("Questionnaire", "infrastructure", "A structured set of questions",
         "A structured set of questions intended to guide the collection of answers from end-users",
         [_el("url","uri","Canonical URL",ms=True), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title",ms=True), _el("status","code","draft | active | retired | unknown",ms=True), _el("subjectType","code","Resource subject type(s)","0..*"), _el("date","dateTime","Date last changed"), _el("item","BackboneElement","Questions and sections","0..*",True)],
         5, "high", "Survey forms for LHW programs and MNCH assessments"),
        ("Linkage", "infrastructure", "Links multiple resource versions",
         "Identifies two or more records that are believed to refer to the same real-world occurrence",
         [_el("active","boolean","Whether record is active"), _el("author","Reference","Who is responsible for linkages"), _el("item","BackboneElement","Item to be linked","1..*",True)],
         2, "medium", "Patient record linkage across multiple systems"),
        ("VerificationResult", "infrastructure", "Describes validation requirements and results",
         "Describes validation requirements, source(s), status and dates for one or more elements",
         [_el("target","Reference","Target(s) being validated","0..*"), _el("targetLocation","string","Target location(s)","0..*"), _el("need","CodeableConcept","Need for validation"), _el("status","code","attested | validated | in-process | req-revalid | val-fail | reval-fail",ms=True), _el("statusDate","dateTime","When the validation status was updated"), _el("validationType","CodeableConcept","Nothing | primary | multiple"), _el("validationProcess","CodeableConcept","Validation process","0..*"), _el("frequency","Timing","Frequency of revalidation"), _el("primarySource","BackboneElement","Information about primary sources","0..*"), _el("attestation","BackboneElement","Who attested")],
         2, "medium", "Provider credential verification"),
        ("Permission", "infrastructure", "Access rules for a resource or set of resources",
         "Permission resource holds access rules for a given data and context",
         [_el("status","code","active | entered-in-error | draft | rejected",ms=True), _el("asserter","Reference","Who is asserting permission"), _el("date","dateTime","Date permission was asserted","0..*"), _el("validity","Period","Period of validity"), _el("justification","BackboneElement","Justification"), _el("combining","code","deny-overrides | permit-overrides | ordered-deny-overrides | ordered-permit-overrides | deny-unless-permit | permit-unless-deny",ms=True), _el("rule","BackboneElement","Permission rules","0..*")],
         1, "medium", "Fine-grained access control for health data"),
        ("ImmunizationEvaluation", "infrastructure", "Result of an immunization evaluation",
         "Describes a comparison of an immunization event against published recommendations",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","completed | entered-in-error",ms=True), _el("patient","Reference","Patient evaluated","1..1",True), _el("date","dateTime","Date evaluation was performed"), _el("targetDisease","CodeableConcept","Evaluation target disease","1..1",True), _el("immunizationEvent","Reference","Immunization being evaluated","1..1",True), _el("doseStatus","CodeableConcept","Status of dose relative to published recommendations","1..1",True), _el("doseStatusReason","CodeableConcept","Reasons for status","0..*"), _el("description","markdown","Evaluation notes"), _el("series","string","Name of vaccine series")],
         3, "high", "EPI dose evaluation for Pakistan immunization program"),
        ("ClinicalUseDefinition", "infrastructure", "Describes clinical use of a medication or device",
         "A single issue - either an indication, contraindication, interaction, or undesirable effect",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("type","code","indication | contraindication | interaction | undesirable-effect | warning","1..1",True), _el("category","CodeableConcept","A categorization","0..*"), _el("subject","Reference","The medication/device this applies to","0..*"), _el("status","CodeableConcept","Active or retired"), _el("contraindication","BackboneElement","Specifics for contraindication"), _el("indication","BackboneElement","Specifics for indication"), _el("interaction","BackboneElement","Specifics for interaction"), _el("undesirableEffect","BackboneElement","Adverse reaction info"), _el("warning","BackboneElement","Critical environmental or stability info")],
         2, "medium", "Drug safety information for DRAP regulations"),
        ("RegulatedAuthorization", "infrastructure", "Regulatory approval for a medication or device",
         "Regulatory approval, clearance or licencing related to a regulated product or service",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("subject","Reference","The product type, treatment, facility, or activity","0..*"), _el("type","CodeableConcept","Overall type of authorization"), _el("description","markdown","General textual description"), _el("region","CodeableConcept","Authorized territories","0..*"), _el("status","CodeableConcept","Current authorization status"), _el("statusDate","dateTime","Status date"), _el("holder","Reference","Authorization holder"), _el("regulator","Reference","Regulating authority"), _el("case","BackboneElement","Case or procedure")],
         2, "medium", "DRAP drug and device registration in Pakistan"),
        ("MedicinalProductDefinition", "infrastructure", "Detailed definition of a medicinal product",
         "A medicinal product including characteristics, contacts, and reference links",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("type","CodeableConcept","Regulatory type"), _el("domain","CodeableConcept","Human or veterinary"), _el("version","string","Business version"), _el("status","CodeableConcept","Status of product authorization"), _el("description","markdown","Description of the product"), _el("combinedPharmaceuticalDoseForm","CodeableConcept","Combined dose form"), _el("route","CodeableConcept","Route(s) of administration","0..*"), _el("name","BackboneElement","Name(s) of product","1..*",True), _el("crossReference","BackboneElement","Reference to another product","0..*")],
         2, "medium", "DRAP product definitions"),
        ("PackagedProductDefinition", "infrastructure", "Packaged medicinal product definition",
         "A medically related item or items in a container ready for distribution",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","A name for this package"), _el("type","CodeableConcept","A high level category"), _el("packageFor","Reference","Product(s) this package is for","0..*"), _el("status","CodeableConcept","Status"), _el("statusDate","dateTime","Status date"), _el("description","markdown","Description"), _el("copackagedIndicator","boolean","If package is part of a co-packaged product"), _el("manufacturer","Reference","Manufacturer(s)","0..*"), _el("packaging","BackboneElement","Packaging details")],
         2, "low", "Drug packaging definitions"),
        ("AdministrableProductDefinition", "infrastructure", "A pharmaceutical product in ready-to-administer form",
         "A medicinal product in the final form ready for administration",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | retired | unknown",ms=True), _el("formOf","Reference","Reference to the medicinal product","0..*"), _el("administrableDoseForm","CodeableConcept","Dose form"), _el("unitOfPresentation","CodeableConcept","Unit of presentation"), _el("producedFrom","Reference","Transformed from","0..*"), _el("ingredient","CodeableConcept","Ingredients","0..*"), _el("device","Reference","Device needed"), _el("property","BackboneElement","Characteristics","0..*"), _el("routeOfAdministration","BackboneElement","Route(s) of admin","1..*",True)],
         1, "low", "Administrable product definition"),
        ("ManufacturedItemDefinition", "infrastructure", "Physical entity of a medicinal product",
         "The definition and characteristics of a medicinal manufactured item",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | retired | unknown",ms=True), _el("name","string","A descriptive name"), _el("manufacturedDoseForm","CodeableConcept","Dose form","1..1",True), _el("unitOfPresentation","CodeableConcept","Unit of presentation"), _el("manufacturer","Reference","Manufacturer(s)","0..*"), _el("ingredient","CodeableConcept","Ingredients","0..*"), _el("property","BackboneElement","General characteristics","0..*"), _el("component","BackboneElement","Physical parts","0..*")],
         1, "low", "Manufactured item definitions"),
        ("Ingredient", "infrastructure", "An ingredient of a manufactured item or pharmaceutical product",
         "An ingredient of a manufactured item or pharmaceutical product",
         [_el("identifier","Identifier","Business identifiers"), _el("status","code","draft | active | retired | unknown",ms=True), _el("for","Reference","Product(s) ingredient is for","0..*"), _el("role","CodeableConcept","Purpose of ingredient","1..1",True), _el("function","CodeableConcept","Precise classification","0..*"), _el("group","CodeableConcept","Grouping category"), _el("allergenicIndicator","boolean","Is an allergen"), _el("comment","markdown","Additional comments"), _el("manufacturer","BackboneElement","Manufacturer(s)","0..*"), _el("substance","BackboneElement","Active substance","1..1",True)],
         2, "low", "Drug ingredient definitions"),
        ("SubstanceDefinition", "infrastructure", "Detailed information about a substance",
         "The detailed description of a substance for regulatory purposes",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("version","string","Version identifier"), _el("status","CodeableConcept","Status of substance"), _el("classification","CodeableConcept","Substance categorization","0..*"), _el("domain","CodeableConcept","Human or veterinary"), _el("description","markdown","Textual description"), _el("source","Reference","Supporting literature","0..*"), _el("name","BackboneElement","Names applicable to this substance","1..*",True), _el("molecularWeight","BackboneElement","Molecular weight or formula","0..*"), _el("structure","BackboneElement","Structural information")],
         2, "low", "Substance definitions for pharmacology"),
        ("NutritionProduct", "infrastructure", "A product used for nutritional purposes",
         "A food or supplement that is consumed by patients",
         [_el("code","CodeableConcept","Product identifier"), _el("status","code","active | inactive | entered-in-error",ms=True), _el("category","CodeableConcept","Category","0..*"), _el("manufacturer","Reference","Manufacturer(s)","0..*"), _el("nutrient","BackboneElement","Nutrition components","0..*"), _el("ingredient","BackboneElement","Ingredients","0..*"), _el("knownAllergen","CodeableConcept","Known allergens","0..*"), _el("instance","BackboneElement","One or more product instances")],
         1, "high", "Nutritional supplements for malnutrition programs in Pakistan"),
        ("BiologicallyDerivedProduct", "infrastructure", "A biological product",
         "A biological material obtained from a biological entity for use in diagnostics, treatment, etc.",
         [_el("productCategory","CodeableConcept","organ | tissue | fluid | cells | biologicalAgent"), _el("productCode","CodeableConcept","A code that identifies the kind"), _el("parent","Reference","Parent biologically derived product","0..*"), _el("request","Reference","Request to obtain product","0..*"), _el("identifier","Identifier","Business identifiers","0..*"), _el("biologicalSourceEvent","Identifier","Identifier for biological source event"), _el("processingFacility","Reference","Processing facilities","0..*"), _el("division","string","Division within a processing facility"), _el("productStatus","Coding","available | unavailable"), _el("collection","BackboneElement","How product was collected"), _el("property","BackboneElement","Product properties","0..*")],
         2, "low", "Blood bank product tracking"),
        ("BiologicallyDerivedProductDispense", "infrastructure", "Dispensing of a biological product",
         "Indicates that a biologically-derived product dispense action has been taken",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("basedOn","Reference","Based on","0..*"), _el("patient","Reference","Patient","1..1",True), _el("product","Reference","Product to dispense","1..1",True), _el("status","code","preparation | in-progress | allocated | issued | unfulfilled | returned | entered-in-error | unknown",ms=True), _el("originRelationshipType","CodeableConcept","Relationship to collection"), _el("quantity","Quantity","Amount dispensed"), _el("preparedDate","dateTime","When product was selected"), _el("whenHandedOver","dateTime","When product was dispatched"), _el("performer","BackboneElement","Who performed","0..*")],
         1, "low", "Biological product dispensing"),
        ("InventoryReport", "infrastructure", "A report of inventory items or counts",
         "A report of inventory or stock items",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | requested | active | entered-in-error",ms=True), _el("countType","code","snapshot | difference","1..1",True), _el("operationType","CodeableConcept","addition | subtraction"), _el("operationTypeReason","CodeableConcept","Reason for the operation"), _el("reportedDateTime","dateTime","When the report has been submitted","1..1",True), _el("reporter","Reference","Who made the report"), _el("reportingPeriod","Period","Period report covers"), _el("inventoryListing","BackboneElement","Inventory listing details","0..*")],
         1, "medium", "Medical supply inventory reporting"),
        ("InventoryItem", "infrastructure", "A single inventory item",
         "Functional description of an inventory item used in inventory and supply-related workflows",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","active | inactive | entered-in-error | unknown",ms=True), _el("category","CodeableConcept","Category","0..*"), _el("code","CodeableConcept","Code designating item","0..*"), _el("name","BackboneElement","Name(s) for the item","0..*"), _el("responsibleOrganization","BackboneElement","Organization(s) responsible","0..*"), _el("description","BackboneElement","Descriptive characteristics"), _el("inventoryStatus","CodeableConcept","Item status"), _el("baseUnit","CodeableConcept","Base unit of measure"), _el("instance","BackboneElement","Instance information")],
         1, "medium", "Medical supply inventory items"),
        ("EventDefinition", "infrastructure", "A statement of an event",
         "Defines a specific event, its timing, and any qualifying criteria",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers","0..*"), _el("name","string","Computer-friendly name"), _el("title","string","Human-readable title"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("trigger","BackboneElement","Event triggers","1..*",True), _el("purpose","markdown","Why this event definition is defined")],
         2, "low", "Event definitions for clinical decision support"),
        ("ObservationDefinition_inf", "infrastructure", "Observation definition for infrastructure",
         "Set of definitional characteristics for observations - infrastructure context",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifiers"), _el("name","string","Computer-friendly name"), _el("title","string","Human-friendly name"), _el("status","code","draft | active | retired | unknown",ms=True), _el("code","CodeableConcept","Type of observation",ms=True), _el("permittedDataType","code","Allowed data types","0..*"), _el("multipleResultsAllowed","boolean","Multiple results allowed"), _el("qualifiedValue","BackboneElement","Set of qualified values","0..*")],
         2, "low", "Infrastructure observation definitions"),
        ("Condition_inf", "infrastructure", "Clinical condition - infrastructure context",
         "Infrastructure-level tracking of clinical conditions for population analytics",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("clinicalStatus","CodeableConcept","active | recurrence | relapse | inactive | remission | resolved",ms=True), _el("verificationStatus","CodeableConcept","Status",ms=True), _el("category","CodeableConcept","problem-list-item | encounter-diagnosis","0..*"), _el("code","CodeableConcept","Identification of condition",ms=True), _el("subject","Reference","Who has the condition","1..1",True), _el("encounter","Reference","Encounter context"), _el("onset[x]","dateTime","Estimated or actual onset"), _el("evidence","CodeableConcept","Supporting evidence","0..*")],
         3, "medium", "Population health condition tracking"),
        ("Procedure_inf", "infrastructure", "Clinical procedure - infrastructure context",
         "Infrastructure-level tracking of procedures for analytics",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","preparation | in-progress | not-done | on-hold | stopped | completed",ms=True), _el("code","CodeableConcept","Identification of procedure",ms=True), _el("subject","Reference","Individual","1..1",True), _el("encounter","Reference","Encounter context"), _el("occurrence[x]","dateTime","When procedure occurred"), _el("performer","BackboneElement","Persons who performed","0..*"), _el("outcome","CodeableConcept","The result")],
         3, "medium", "Procedure analytics"),
        ("SpecimenDefinition", "infrastructure", "Describes how specimens should be collected and processed",
         "A kind of specimen with associated set of requirements",
         [_el("url","uri","Canonical URL"), _el("identifier","Identifier","Business identifier"), _el("title","string","Name of specimen definition"), _el("status","code","draft | active | retired | unknown",ms=True), _el("description","markdown","Natural language description"), _el("subjectCodeableConcept","CodeableConcept","Type of subject"), _el("typeCollected","CodeableConcept","Kind of specimen collected"), _el("patientPreparation","CodeableConcept","Patient preparation","0..*"), _el("collection","string","Collection method instructions","0..*"), _el("typeTested","BackboneElement","Types tested","0..*")],
         2, "medium", "Specimen collection guidelines"),
        ("RequestOrchestration_inf", "infrastructure", "Request group - infrastructure context",
         "Infrastructure-level orchestration of grouped requests",
         [_el("identifier","Identifier","Business identifiers","0..*"), _el("status","code","draft | active | on-hold | revoked | completed | ...",ms=True), _el("intent","code","proposal | plan | directive | order | ...",ms=True), _el("priority","code","routine | urgent | asap | stat"), _el("code","CodeableConcept","What is being done"), _el("subject","Reference","Who the group is about"), _el("action","BackboneElement","Proposed actions","0..*")],
         2, "low", "Infrastructure request orchestration"),
        ("SubstancePolymer", "infrastructure", "A substance polymer",
         "Properties of a substance specific to it being a polymer",
         [_el("identifier","Identifier","Business identifiers"), _el("class","CodeableConcept","Overall type of polymer"), _el("geometry","CodeableConcept","Geometry of polymer"), _el("copolymerConnectivity","CodeableConcept","Copolymer connectivity","0..*"), _el("modification","string","Substance modifications"), _el("monomerSet","BackboneElement","Monomer sets","0..*"), _el("repeat","BackboneElement","Repeat information","0..*")],
         1, "low", "Polymer substance information"),
        ("SubstanceProtein", "infrastructure", "A protein substance",
         "Properties of a substance specific to it being a protein",
         [_el("sequenceType","CodeableConcept","Protein type"), _el("numberOfSubunits","integer","Number of linear sequences"), _el("disulfideLinkage","string","Disulfide bonds","0..*"), _el("subunit","BackboneElement","Subunit constituents","0..*")],
         1, "low", "Protein substance information"),
        ("SubstanceNucleicAcid", "infrastructure", "A nucleic acid substance",
         "Properties of a substance specific to it being a nucleic acid",
         [_el("sequenceType","CodeableConcept","Nucleic acid type"), _el("numberOfSubunits","integer","Number of linear sequences"), _el("areaOfHybridisation","string","Area of hybridisation"), _el("oligoNucleotideType","CodeableConcept","Oligo nucleotide type"), _el("subunit","BackboneElement","Subunit constituents","0..*")],
         1, "low", "Nucleic acid substance information"),
        ("SubstanceReferenceInformation", "infrastructure", "Reference information about a substance",
         "Reference information about a biological substance",
         [_el("comment","string","Comments"), _el("gene","BackboneElement","Gene information","0..*"), _el("geneElement","BackboneElement","Gene elements","0..*"), _el("target","BackboneElement","Target substance","0..*")],
         1, "low", "Substance reference information"),
        ("SubstanceSourceMaterial", "infrastructure", "Source material for a substance",
         "Source material shall capture information on the taxonomic and anatomical origins",
         [_el("sourceMaterialClass","CodeableConcept","General high level classification"), _el("sourceMaterialType","CodeableConcept","Type of source material"), _el("sourceMaterialState","CodeableConcept","State of source material"), _el("organismId","Identifier","Organism identifier"), _el("organismName","string","Organism name"), _el("parentSubstanceId","Identifier","Parent substance identifiers","0..*"), _el("countryOfOrigin","CodeableConcept","Country","0..*"), _el("organism","BackboneElement","Organism details"), _el("partDescription","BackboneElement","Part information","0..*")],
         1, "low", "Source material for substances"),
    ]

    resources = []
    idx = 0
    for (name, cat_key, desc, purpose, elements, mat, pk_rel, pk_notes) in resources_raw:
        idx += 1
        cat_name, cat_id = cats[cat_key]
        res_id = f"FHIR-{idx:03d}"
        # Build references from elements
        refs = [e["name"] for e in elements if e["type"] == "Reference"]
        resources.append({
            "id": res_id,
            "name": name,
            "category": cat_name,
            "categoryId": cat_id,
            "description": desc,
            "purpose": purpose,
            "elements": elements,
            "elementCount": len(elements),
            "references": refs,
            "referencedBy": [],
            "maturityLevel": mat,
            "pakistanRelevance": pk_rel,
            "pakistanNotes": pk_notes,
            "hcdmSubjectArea": hcdm_map[cat_key]
        })

    # Fill referencedBy
    name_to_idx = {r["name"]: i for i, r in enumerate(resources)}
    for r in resources:
        for el in r["elements"]:
            if el["type"] == "Reference" and el["description"]:
                # Try to find resource names in description
                for rname in name_to_idx:
                    if rname.lower() in el["description"].lower():
                        target = resources[name_to_idx[rname]]
                        if r["name"] not in target["referencedBy"]:
                            target["referencedBy"].append(r["name"])

    return resources


# ---------------------------------------------------------------------------
# 2. Resource Categories
# ---------------------------------------------------------------------------
def generate_resource_categories():
    return [
        {"id": "CAT-01", "name": "Foundation", "description": "Conformance and terminology resources that define the FHIR standard itself", "resourceCount": 14, "color": "slate", "icon": "Foundation"},
        {"id": "CAT-02", "name": "Base - Individuals", "description": "Resources that represent people involved in healthcare", "resourceCount": 6, "color": "blue", "icon": "Users"},
        {"id": "CAT-03", "name": "Base - Entities", "description": "Resources representing organizations, locations, and devices", "resourceCount": 6, "color": "indigo", "icon": "Building"},
        {"id": "CAT-04", "name": "Base - Workflow", "description": "Resources that manage scheduling, tasks, and workflow", "resourceCount": 13, "color": "violet", "icon": "Workflow"},
        {"id": "CAT-05", "name": "Clinical - Summary", "description": "Core clinical summary resources for conditions, procedures, and allergies", "resourceCount": 12, "color": "red", "icon": "Heart"},
        {"id": "CAT-06", "name": "Clinical - Diagnostics", "description": "Observations, diagnostic reports, and imaging resources", "resourceCount": 9, "color": "amber", "icon": "Microscope"},
        {"id": "CAT-07", "name": "Clinical - Medications", "description": "Medication-related resources from prescribing to administration", "resourceCount": 9, "color": "green", "icon": "Pill"},
        {"id": "CAT-08", "name": "Clinical - Care Provision", "description": "Care plans, encounters, and care team resources", "resourceCount": 11, "color": "teal", "icon": "Stethoscope"},
        {"id": "CAT-09", "name": "Clinical - Request & Response", "description": "Questionnaires, documents, compositions, and measure reports", "resourceCount": 5, "color": "cyan", "icon": "FileText"},
        {"id": "CAT-10", "name": "Financial", "description": "Coverage, claims, billing, and payment resources", "resourceCount": 13, "color": "emerald", "icon": "DollarSign"},
        {"id": "CAT-11", "name": "Public Health & Research", "description": "Research studies, evidence, quality measures, and clinical protocols", "resourceCount": 10, "color": "rose", "icon": "Globe"},
        {"id": "CAT-12", "name": "Infrastructure & Exchange", "description": "Audit, provenance, subscriptions, and other infrastructure resources", "resourceCount": 49, "color": "gray", "icon": "Server"},
    ]


# ---------------------------------------------------------------------------
# 3. HCDM Subject Areas
# ---------------------------------------------------------------------------
def generate_hcdm_subject_areas():
    return [
        {"id": "SA-01", "name": "Party", "description": "People and their roles in healthcare - patients, practitioners, related persons", "estimatedEntities": 45, "color": "blue",
         "fhirResources": ["Patient", "Practitioner", "PractitionerRole", "RelatedPerson", "Person", "Group"],
         "keyAnalytics": ["Patient demographics analysis", "Provider workforce analytics", "Family relationship mapping", "Population segmentation"]},
        {"id": "SA-02", "name": "Event", "description": "Healthcare events, scheduling, tasks, and workflow orchestration", "estimatedEntities": 55, "color": "violet",
         "fhirResources": ["Task", "Appointment", "AppointmentResponse", "Schedule", "Slot", "Transport", "VisionPrescription"],
         "keyAnalytics": ["Appointment utilization rates", "Task completion analytics", "Scheduling optimization", "Workflow bottleneck detection"]},
        {"id": "SA-03", "name": "Clinical", "description": "Core clinical data - conditions, procedures, encounters, care plans, observations", "estimatedEntities": 120, "color": "red",
         "fhirResources": ["Condition", "Procedure", "AllergyIntolerance", "Encounter", "CarePlan", "CareTeam", "EpisodeOfCare", "ClinicalImpression", "Goal", "Communication"],
         "keyAnalytics": ["Disease burden analysis", "Treatment outcome tracking", "Clinical pathway adherence", "Readmission prediction"]},
        {"id": "SA-04", "name": "Claim & Billing", "description": "Claims processing, adjudication, and billing operations", "estimatedEntities": 40, "color": "amber",
         "fhirResources": ["Claim", "ClaimResponse", "ExplanationOfBenefit", "Invoice", "ChargeItem", "Account"],
         "keyAnalytics": ["Claims denial analysis", "Revenue cycle metrics", "Billing accuracy rates", "Cost-per-encounter analysis"]},
        {"id": "SA-05", "name": "Financial Management", "description": "Coverage, payments, and financial reconciliation", "estimatedEntities": 35, "color": "emerald",
         "fhirResources": ["Coverage", "CoverageEligibilityRequest", "CoverageEligibilityResponse", "PaymentNotice", "PaymentReconciliation", "InsurancePlan"],
         "keyAnalytics": ["Coverage gap analysis", "Payment turnaround metrics", "Insurance plan utilization", "Out-of-pocket burden analysis"]},
        {"id": "SA-06", "name": "Pharmacy & Medication", "description": "Medications, prescriptions, dispensing, and administration", "estimatedEntities": 50, "color": "green",
         "fhirResources": ["Medication", "MedicationRequest", "MedicationDispense", "MedicationAdministration", "MedicationStatement", "MedicationKnowledge", "FormularyItem", "Immunization", "ImmunizationRecommendation"],
         "keyAnalytics": ["Prescription patterns analysis", "Drug utilization review", "Medication adherence rates", "Immunization coverage rates", "Formulary compliance"]},
        {"id": "SA-07", "name": "Coverage & Enrollment", "description": "Insurance coverage enrollment and eligibility management", "estimatedEntities": 25, "color": "cyan",
         "fhirResources": ["Coverage", "EnrollmentRequest", "EnrollmentResponse", "CoverageEligibilityRequest", "CoverageEligibilityResponse", "InsurancePlan"],
         "keyAnalytics": ["Enrollment trend analysis", "Eligibility verification rates", "Coverage lapse analysis", "Beneficiary demographics"]},
        {"id": "SA-08", "name": "Provider & Facility", "description": "Healthcare organizations, facilities, services, and locations", "estimatedEntities": 40, "color": "indigo",
         "fhirResources": ["Organization", "HealthcareService", "Location", "Endpoint", "Device", "DeviceDefinition"],
         "keyAnalytics": ["Facility utilization rates", "Service availability mapping", "Provider network adequacy", "Equipment uptime analysis"]},
        {"id": "SA-09", "name": "Public Health & Programs", "description": "Population health, research, public health programs, and disease surveillance", "estimatedEntities": 60, "color": "rose",
         "fhirResources": ["ResearchStudy", "ResearchSubject", "Measure", "MeasureReport", "PlanDefinition", "ActivityDefinition", "Library"],
         "keyAnalytics": ["Disease surveillance dashboards", "Program effectiveness metrics", "Research outcome tracking", "Population health trends"]},
        {"id": "SA-10", "name": "Quality & Safety", "description": "Quality measures, adverse events, risk assessments, and safety reporting", "estimatedEntities": 30, "color": "orange",
         "fhirResources": ["AdverseEvent", "DetectedIssue", "RiskAssessment", "Flag", "Consent", "MeasureReport"],
         "keyAnalytics": ["Adverse event trending", "Patient safety indicators", "Quality measure performance", "Risk score distributions"]},
        {"id": "SA-11", "name": "Diagnostics & Imaging", "description": "Laboratory results, diagnostic reports, imaging studies, specimens", "estimatedEntities": 45, "color": "amber",
         "fhirResources": ["Observation", "DiagnosticReport", "ImagingStudy", "ImagingSelection", "Specimen", "ObservationDefinition", "MolecularSequence", "GenomicStudy"],
         "keyAnalytics": ["Lab result turnaround times", "Diagnostic accuracy analysis", "Imaging utilization patterns", "Specimen rejection rates"]},
        {"id": "SA-12", "name": "Infrastructure & Interoperability", "description": "System infrastructure, audit trails, messaging, and data exchange", "estimatedEntities": 70, "color": "gray",
         "fhirResources": ["AuditEvent", "Provenance", "Subscription", "Bundle", "MessageHeader", "OperationOutcome", "Binary", "Questionnaire"],
         "keyAnalytics": ["System integration metrics", "Audit trail analysis", "Message exchange volumes", "Interoperability compliance rates"]},
    ]


# ---------------------------------------------------------------------------
# 4. Capabilities (108 HCF)
# ---------------------------------------------------------------------------
def generate_capabilities():
    themes = [
        ("T1", "Patient Intelligence & Experience", "emerald", [
            ("G1.1", "Patient Demographics & Identity", 8),
            ("G1.2", "Patient Journey Analytics", 6),
            ("G1.3", "Patient Engagement & Satisfaction", 6),
        ]),
        ("T2", "Clinical Analytics & Quality", "red", [
            ("G2.1", "Clinical Outcome Analytics", 8),
            ("G2.2", "Quality Measurement & Reporting", 8),
            ("G2.3", "Clinical Decision Support", 6),
        ]),
        ("T3", "Financial Analytics & Revenue", "blue", [
            ("G3.1", "Revenue Cycle Analytics", 8),
            ("G3.2", "Claims & Reimbursement Analytics", 6),
            ("G3.3", "Cost & Profitability Analytics", 4),
        ]),
        ("T4", "Operational Analytics", "violet", [
            ("G4.1", "Facility & Resource Analytics", 8),
            ("G4.2", "Workforce Analytics", 6),
            ("G4.3", "Supply Chain Analytics", 6),
        ]),
        ("T5", "Population Health & Public Health", "teal", [
            ("G5.1", "Population Health Management", 8),
            ("G5.2", "Disease Surveillance & Epidemiology", 8),
        ]),
        ("T6", "Digital Health & Data Governance", "indigo", [
            ("G6.1", "Health Information Exchange", 6),
            ("G6.2", "Data Quality & Governance", 6),
        ]),
    ]

    # Detailed capability definitions
    cap_defs = [
        # T1 G1.1 (8)
        ("Patient Master Index Management", "G1.1", ["Patient","Person","RelatedPerson"], ["SA-01"], "NADRA", "NHSR&C", "Fragmented patient IDs across facilities", "Unified CNIC-based patient index"),
        ("Patient Demographics Profiling", "G1.1", ["Patient","Group","Organization"], ["SA-01"], "NADRA", "PBS Census", "Incomplete demographic data in rural areas", "LHW program as data collection channel"),
        ("Patient Identity Matching & Deduplication", "G1.1", ["Patient","Person","Linkage"], ["SA-01","SA-12"], "NADRA", "NHSR&C", "Duplicate records across hospital systems", "CNIC as golden key for deduplication"),
        ("Family & Household Linkage", "G1.1", ["Patient","RelatedPerson","Group"], ["SA-01"], "NADRA", "LHW Program", "Family health records not linked", "Joint family structure as analytical unit"),
        ("Patient Contact & Communication Preferences", "G1.1", ["Patient","Communication","CommunicationRequest"], ["SA-01","SA-03"], "Telecom operators", "PTA", "Low digital literacy in rural Pakistan", "Mobile phone penetration as engagement channel"),
        ("Patient Consent Management", "G1.1", ["Consent","Patient","DocumentReference"], ["SA-01","SA-10"], "NHSR&C", "Ministry of IT", "No national consent framework", "Digital consent via biometric verification"),
        ("Patient Geographic Distribution", "G1.1", ["Patient","Location","Organization"], ["SA-01","SA-08"], "PBS", "Planning Commission", "Incomplete address data", "GPS-linked facility mapping"),
        ("Vulnerable Population Identification", "G1.1", ["Patient","Group","RiskAssessment"], ["SA-01","SA-10"], "BISP/Ehsaas", "Poverty Alleviation", "Identifying at-risk populations", "Ehsaas database integration for social determinants"),

        # T1 G1.2 (6)
        ("Patient Journey Mapping", "G1.2", ["Encounter","EpisodeOfCare","Procedure"], ["SA-03","SA-02"], "Hospitals", "NHSR&C", "No longitudinal patient view", "Episode-based care tracking"),
        ("Encounter Flow Analytics", "G1.2", ["Encounter","Location","Practitioner"], ["SA-03","SA-08"], "HMIS", "DHIS2", "Long wait times in OPD", "Real-time patient flow monitoring"),
        ("Referral Pattern Analysis", "G1.2", ["ServiceRequest","Encounter","Organization"], ["SA-03","SA-08"], "DHQ/THQ", "Provincial Health Dept", "Inefficient referral chains", "Structured referral pathways BHU→RHC→THQ→DHQ"),
        ("Readmission Risk Prediction", "G1.2", ["Encounter","Condition","RiskAssessment"], ["SA-03","SA-10"], "Tertiary hospitals", "NHSR&C", "High readmission rates", "Predictive models for early intervention"),
        ("Length of Stay Analysis", "G1.2", ["Encounter","Condition","Procedure"], ["SA-03"], "Hospitals", "NHSR&C", "Prolonged hospital stays", "Benchmark-driven discharge planning"),
        ("Care Transition Tracking", "G1.2", ["Encounter","EpisodeOfCare","CarePlan"], ["SA-03"], "Hospital networks", "NHSR&C", "Lost in transition between facilities", "Continuity of care documentation"),

        # T1 G1.3 (6)
        ("Patient Satisfaction Measurement", "G1.3", ["QuestionnaireResponse","Encounter","Patient"], ["SA-03","SA-01"], "Hospitals", "NHSR&C", "No systematic feedback collection", "Mobile-based patient feedback"),
        ("Patient Portal Analytics", "G1.3", ["Patient","DocumentReference","Communication"], ["SA-01","SA-12"], "Hospital IT", "Ministry of IT", "Low digital health adoption", "Mobile health app integration"),
        ("Health Literacy Assessment", "G1.3", ["QuestionnaireResponse","Patient","Communication"], ["SA-01"], "LHW Program", "NHSR&C", "Low health literacy in rural areas", "Pictographic health education materials"),
        ("Appointment Adherence Analytics", "G1.3", ["Appointment","Patient","Encounter"], ["SA-02","SA-01"], "OPD systems", "HMIS", "High no-show rates in OPD", "SMS reminder integration"),
        ("Patient Communication Effectiveness", "G1.3", ["Communication","CommunicationRequest","Patient"], ["SA-01"], "Hospitals", "PTA", "Language barriers (Urdu, regional languages)", "Multilingual communication templates"),
        ("Community Health Engagement", "G1.3", ["Group","Patient","QuestionnaireResponse"], ["SA-01","SA-09"], "LHW Program", "PHCIP", "Remote community access challenges", "Lady Health Worker digital tools"),

        # T2 G2.1 (8)
        ("Disease Burden Analysis", "G2.1", ["Condition","Encounter","Patient"], ["SA-03","SA-01"], "NIH", "NHSR&C", "Incomplete disease registry", "Integrated disease surveillance"),
        ("Treatment Outcome Tracking", "G2.1", ["Procedure","Condition","Observation"], ["SA-03","SA-11"], "Hospitals", "NHSR&C", "No standardized outcome measures", "FHIR-based outcome reporting"),
        ("Mortality & Morbidity Analytics", "G2.1", ["Condition","Encounter","Patient"], ["SA-03","SA-01"], "NIH", "WHO Pakistan", "Under-reporting of deaths", "Verbal autopsy integration"),
        ("Complication Rate Analysis", "G2.1", ["AdverseEvent","Procedure","Condition"], ["SA-10","SA-03"], "Hospitals", "NHSR&C", "Limited surgical outcome data", "Post-operative surveillance"),
        ("Clinical Pathway Adherence", "G2.1", ["CarePlan","Procedure","MeasureReport"], ["SA-03","SA-09"], "Clinical departments", "NHSR&C", "Variation in care protocols", "Evidence-based pathway templates"),
        ("Chronic Disease Management Analytics", "G2.1", ["Condition","CarePlan","Observation"], ["SA-03"], "NCD Program", "NHSR&C", "Rising NCD burden", "Longitudinal chronic disease tracking"),
        ("Maternal Health Outcome Analysis", "G2.1", ["Condition","Procedure","Encounter"], ["SA-03"], "MNCH Program", "NHSR&C", "High maternal mortality ratio (186/100K)", "MNCH outcome dashboards"),
        ("Child Health & Nutrition Analytics", "G2.1", ["Observation","NutritionIntake","Immunization"], ["SA-11","SA-06"], "EPI Program", "UNICEF Pakistan", "Stunting rate 40%+ in children under 5", "Growth monitoring integration"),

        # T2 G2.2 (8)
        ("Quality Indicator Dashboard", "G2.2", ["MeasureReport","Measure","Organization"], ["SA-09","SA-08"], "PHCIP", "NHSR&C", "No national quality framework", "WHO quality indicator adoption"),
        ("Clinical Audit Analytics", "G2.2", ["AuditEvent","Procedure","Encounter"], ["SA-12","SA-03"], "Hospital QA", "NHSR&C", "Limited clinical audit infrastructure", "Digital audit trail implementation"),
        ("Patient Safety Incident Reporting", "G2.2", ["AdverseEvent","DetectedIssue","Flag"], ["SA-10"], "Hospital safety", "NHSR&C", "Under-reporting of safety incidents", "Anonymous reporting system"),
        ("Infection Control Analytics", "G2.2", ["Observation","Condition","Location"], ["SA-11","SA-03","SA-08"], "Hospitals", "NIH", "HAI surveillance gaps", "Automated infection detection"),
        ("Medication Error Tracking", "G2.2", ["DetectedIssue","MedicationAdministration","AdverseEvent"], ["SA-10","SA-06"], "Pharmacy departments", "DRAP", "Manual medication processes", "Barcode verification systems"),
        ("Surgical Quality Metrics", "G2.2", ["Procedure","AdverseEvent","MeasureReport"], ["SA-03","SA-10","SA-09"], "Surgical departments", "NHSR&C", "No surgical safety checklist data", "WHO Surgical Safety Checklist integration"),
        ("Emergency Department Quality", "G2.2", ["Encounter","Observation","Condition"], ["SA-03","SA-11"], "Emergency departments", "NHSR&C", "Overcrowded emergency rooms", "Triage quality and wait time metrics"),
        ("Laboratory Quality Assurance", "G2.2", ["DiagnosticReport","Observation","Specimen"], ["SA-11"], "Lab departments", "NIH", "Variable lab quality across facilities", "External quality assessment integration"),

        # T2 G2.3 (6)
        ("Drug Interaction Alerting", "G2.3", ["DetectedIssue","MedicationRequest","Medication"], ["SA-10","SA-06"], "Pharmacy", "DRAP", "Manual interaction checking", "Automated CDS alerts"),
        ("Clinical Guideline Integration", "G2.3", ["PlanDefinition","Library","ActivityDefinition"], ["SA-09"], "Medical boards", "PMC", "Outdated clinical guidelines", "Digital guideline implementation"),
        ("Diagnostic Decision Support", "G2.3", ["DiagnosticReport","Observation","Condition"], ["SA-11","SA-03"], "Diagnostic departments", "NHSR&C", "Delayed diagnosis in primary care", "AI-assisted diagnostic suggestions"),
        ("Allergy & Contraindication Checking", "G2.3", ["AllergyIntolerance","MedicationRequest","DetectedIssue"], ["SA-03","SA-06","SA-10"], "Clinical systems", "DRAP", "Incomplete allergy records", "Structured allergy documentation"),
        ("Preventive Care Reminders", "G2.3", ["ImmunizationRecommendation","CarePlan","CommunicationRequest"], ["SA-06","SA-03"], "Primary care", "EPI Program", "Missed preventive interventions", "Automated reminder generation"),
        ("Antimicrobial Stewardship", "G2.3", ["MedicationRequest","Observation","DetectedIssue"], ["SA-06","SA-11","SA-10"], "Infectious disease", "NIH", "Antibiotic resistance crisis in Pakistan", "ASP program analytics"),

        # T3 G3.1 (8)
        ("Revenue Cycle Performance Dashboard", "G3.1", ["Claim","ClaimResponse","Account"], ["SA-04","SA-05"], "Finance departments", "SECP", "Manual revenue tracking", "Automated revenue cycle monitoring"),
        ("Billing Accuracy Analytics", "G3.1", ["Claim","ChargeItem","Invoice"], ["SA-04"], "Billing departments", "NHSR&C", "Revenue leakage from coding errors", "Charge capture optimization"),
        ("Collection Rate Analysis", "G3.1", ["PaymentReconciliation","Account","Invoice"], ["SA-05","SA-04"], "Finance", "SECP", "Low collection rates", "Predictive collection analytics"),
        ("Denial Management Analytics", "G3.1", ["ClaimResponse","Claim","ExplanationOfBenefit"], ["SA-04","SA-05"], "Claims departments", "Sehat Sahulat", "High claims denial rates", "Root cause denial analysis"),
        ("Charge Capture Optimization", "G3.1", ["ChargeItem","Encounter","Procedure"], ["SA-04","SA-03"], "Revenue cycle", "Hospital admin", "Under-coding of services", "Automated charge suggestions"),
        ("Accounts Receivable Aging", "G3.1", ["Account","PaymentNotice","Invoice"], ["SA-05","SA-04"], "Finance", "SECP", "Long payment cycles", "AR aging dashboard"),
        ("Payer Mix Analysis", "G3.1", ["Coverage","Claim","ExplanationOfBenefit"], ["SA-05","SA-04","SA-07"], "Finance", "NHSR&C", "Over-dependence on OOP payments", "Payer diversification analytics"),
        ("Service Line Revenue Analysis", "G3.1", ["Encounter","Claim","ChargeItem"], ["SA-03","SA-04"], "Hospital admin", "NHSR&C", "No service-line profitability view", "Department-level revenue tracking"),

        # T3 G3.2 (6)
        ("Claims Submission Analytics", "G3.2", ["Claim","Coverage","Patient"], ["SA-04","SA-07","SA-01"], "Claims dept", "Sehat Sahulat", "Delayed claims submission", "Electronic claims submission"),
        ("Claims Adjudication Tracking", "G3.2", ["ClaimResponse","Claim","ExplanationOfBenefit"], ["SA-04","SA-05"], "Claims dept", "Sehat Sahulat", "Opaque adjudication process", "Real-time adjudication tracking"),
        ("Reimbursement Rate Analysis", "G3.2", ["ExplanationOfBenefit","Claim","InsurancePlan"], ["SA-05","SA-04","SA-07"], "Finance", "Sehat Sahulat", "Below-cost reimbursement rates", "Rate negotiation analytics"),
        ("Fraud Detection Analytics", "G3.2", ["Claim","Encounter","Procedure"], ["SA-04","SA-03"], "Compliance", "Sehat Sahulat/NAB", "Healthcare fraud risk", "Anomaly detection models"),
        ("Prior Authorization Analytics", "G3.2", ["CoverageEligibilityRequest","CoverageEligibilityResponse","Claim"], ["SA-07","SA-04"], "Utilization review", "Sehat Sahulat", "Slow authorization process", "Automated prior auth"),
        ("Coding Compliance Analytics", "G3.2", ["Claim","Condition","Procedure"], ["SA-04","SA-03"], "HIM department", "NHSR&C", "ICD-10 coding inconsistencies", "Coding audit and education"),

        # T3 G3.3 (4)
        ("Cost Per Patient Analysis", "G3.3", ["Account","Encounter","Patient"], ["SA-05","SA-03","SA-01"], "Finance", "NHSR&C", "Unknown true cost per patient", "Activity-based costing"),
        ("Procedure Cost Analysis", "G3.3", ["Procedure","ChargeItem","Account"], ["SA-03","SA-04","SA-05"], "Finance", "Hospital admin", "No procedure-level costing", "Micro-costing analysis"),
        ("Department Profitability", "G3.3", ["Organization","Account","Encounter"], ["SA-08","SA-05","SA-03"], "Finance", "Hospital admin", "Cross-subsidization between departments", "Contribution margin analysis"),
        ("Budget Variance Analysis", "G3.3", ["Account","MeasureReport","Organization"], ["SA-05","SA-09","SA-08"], "Finance", "Planning Commission", "Budget overruns in health facilities", "Variance tracking and forecasting"),

        # T4 G4.1 (8)
        ("Bed Occupancy & Management", "G4.1", ["Location","Encounter","Organization"], ["SA-08","SA-03"], "Hospital admin", "HMIS", "Overcrowded wards", "Real-time bed management"),
        ("Operating Room Utilization", "G4.1", ["Location","Procedure","Schedule"], ["SA-08","SA-03","SA-02"], "Surgical dept", "Hospital admin", "Low OR utilization rates", "Scheduling optimization"),
        ("Equipment Utilization Analytics", "G4.1", ["Device","DeviceUsage","Location"], ["SA-08"], "Biomedical dept", "Hospital admin", "Underutilized medical equipment", "Usage tracking and optimization"),
        ("Outpatient Clinic Efficiency", "G4.1", ["Encounter","Appointment","Location"], ["SA-03","SA-02","SA-08"], "OPD management", "HMIS", "Long OPD wait times", "Patient flow optimization"),
        ("Emergency Department Flow", "G4.1", ["Encounter","Location","Condition"], ["SA-03","SA-08"], "Emergency dept", "NHSR&C", "ED overcrowding", "Predictive demand modeling"),
        ("Facility Capacity Planning", "G4.1", ["Location","Organization","Encounter"], ["SA-08","SA-03"], "Planning depts", "Planning Commission", "Facility capacity shortages", "Demand forecasting models"),
        ("Diagnostic Lab Throughput", "G4.1", ["DiagnosticReport","Specimen","Location"], ["SA-11","SA-08"], "Lab management", "NHSR&C", "Long turnaround times", "Lab workflow optimization"),
        ("Pharmacy Operations Analytics", "G4.1", ["MedicationDispense","Medication","Location"], ["SA-06","SA-08"], "Pharmacy management", "DRAP", "Stockouts and wastage", "Inventory optimization"),

        # T4 G4.2 (6)
        ("Provider Productivity Analysis", "G4.2", ["Practitioner","Encounter","Procedure"], ["SA-01","SA-03"], "HR department", "PMC", "Provider workload imbalance", "Workload distribution analytics"),
        ("Staff Scheduling Optimization", "G4.2", ["PractitionerRole","Schedule","Location"], ["SA-01","SA-02","SA-08"], "HR department", "Hospital admin", "Shift scheduling inefficiency", "Demand-based scheduling"),
        ("Provider Competency Tracking", "G4.2", ["Practitioner","PractitionerRole","Procedure"], ["SA-01"], "HR/CME dept", "PMC", "CME tracking challenges", "Digital CME portfolio"),
        ("Nursing Workload Analytics", "G4.2", ["Practitioner","Encounter","CarePlan"], ["SA-01","SA-03"], "Nursing admin", "PNC", "Nurse-to-patient ratios", "Acuity-based staffing"),
        ("Healthcare Worker Safety", "G4.2", ["Practitioner","AdverseEvent","Observation"], ["SA-01","SA-10","SA-11"], "Occupational health", "NHSR&C", "Healthcare worker injuries", "Incident tracking and prevention"),
        ("Training Needs Assessment", "G4.2", ["Practitioner","PractitionerRole","QuestionnaireResponse"], ["SA-01"], "Training dept", "NHSR&C", "Skill gaps in rural facilities", "Competency gap analysis"),

        # T4 G4.3 (6)
        ("Medical Supply Chain Analytics", "G4.3", ["SupplyRequest","SupplyDelivery","Organization"], ["SA-02","SA-08"], "Supply chain", "DRAP", "Supply chain disruptions", "Demand forecasting"),
        ("Pharmaceutical Inventory Management", "G4.3", ["Medication","MedicationDispense","SupplyDelivery"], ["SA-06","SA-02"], "Pharmacy", "DRAP", "Drug expiry and wastage", "Just-in-time inventory"),
        ("Blood Bank Management", "G4.3", ["BiologicallyDerivedProduct","Specimen","SupplyRequest"], ["SA-11","SA-02"], "Blood bank", "NIH/Safe Blood", "Blood supply shortages", "Donor management analytics"),
        ("Equipment Maintenance Analytics", "G4.3", ["Device","DeviceRequest","Task"], ["SA-08","SA-02"], "Biomedical dept", "Hospital admin", "Equipment downtime", "Predictive maintenance"),
        ("Vaccine Cold Chain Monitoring", "G4.3", ["Immunization","Device","Observation"], ["SA-06","SA-08","SA-11"], "EPI Program", "WHO Pakistan", "Cold chain breaks", "IoT-enabled temperature monitoring"),
        ("Waste Management Analytics", "G4.3", ["Observation","Location","Organization"], ["SA-11","SA-08"], "Infection control", "EPA Pakistan", "Biomedical waste management", "Waste tracking and compliance"),

        # T5 G5.1 (8)
        ("Population Health Dashboard", "G5.1", ["Group","Patient","Condition"], ["SA-01","SA-03","SA-09"], "Public health", "NHSR&C", "No population health view", "Integrated population dashboard"),
        ("Social Determinants of Health", "G5.1", ["Patient","Observation","QuestionnaireResponse"], ["SA-01","SA-11"], "Community health", "BISP/Ehsaas", "SDOH data gaps", "Multi-sector data integration"),
        ("Maternal & Child Health Tracking", "G5.1", ["Patient","Condition","Immunization"], ["SA-01","SA-03","SA-06"], "MNCH Program", "NHSR&C", "High maternal/infant mortality", "LHW-powered MNCH tracking"),
        ("Nutrition Surveillance", "G5.1", ["NutritionIntake","Observation","Patient"], ["SA-03","SA-11","SA-01"], "Nutrition programs", "UNICEF/WFP", "Malnutrition prevalence 40%+", "Community-based nutrition monitoring"),
        ("Reproductive Health Analytics", "G5.1", ["Condition","Procedure","Patient"], ["SA-03","SA-01"], "RH programs", "UNFPA Pakistan", "Low contraceptive prevalence rate", "Family planning service analytics"),
        ("Mental Health Analytics", "G5.1", ["Condition","Encounter","CarePlan"], ["SA-03"], "Mental health", "NHSR&C", "Mental health stigma; 1 psychiatrist per 500K", "Community mental health tracking"),
        ("Non-Communicable Disease Registry", "G5.1", ["Condition","Observation","Patient"], ["SA-03","SA-11","SA-01"], "NCD Program", "WHO Pakistan", "Rising diabetes/CVD burden", "NCD risk factor surveillance"),
        ("Environmental Health Monitoring", "G5.1", ["Observation","Location","Group"], ["SA-11","SA-08","SA-01"], "Environmental health", "EPA Pakistan", "Air/water pollution impact on health", "Environmental-health correlation"),

        # T5 G5.2 (8)
        ("Disease Outbreak Detection", "G5.2", ["Condition","Observation","Location"], ["SA-03","SA-11","SA-08"], "NIH", "WHO Pakistan", "Delayed outbreak detection", "Syndromic surveillance"),
        ("Notifiable Disease Reporting", "G5.2", ["Condition","Encounter","Organization"], ["SA-03","SA-08"], "NIH", "NHSR&C", "Under-reporting of notifiable diseases", "Automated IDSR reporting"),
        ("Immunization Coverage Analytics", "G5.2", ["Immunization","Patient","Group"], ["SA-06","SA-01"], "EPI Program", "WHO/UNICEF", "Missed children in EPI", "Real-time coverage mapping"),
        ("TB Surveillance & DOTS Tracking", "G5.2", ["Condition","MedicationStatement","EpisodeOfCare"], ["SA-03","SA-06"], "TB Control Program", "WHO Pakistan", "TB case detection gap", "Digital DOTS monitoring"),
        ("Dengue/Vector-Borne Disease Surveillance", "G5.2", ["Condition","Observation","Location"], ["SA-03","SA-11","SA-08"], "Provincial dengue cells", "NIH", "Seasonal dengue outbreaks", "Predictive outbreak modeling"),
        ("Polio Eradication Analytics", "G5.2", ["Immunization","Patient","Location"], ["SA-06","SA-01","SA-08"], "Polio Program", "WHO/GPEI", "Last remaining endemic country", "Micro-plan tracking and lot quality assurance"),
        ("Antimicrobial Resistance Surveillance", "G5.2", ["Observation","Specimen","Medication"], ["SA-11","SA-06"], "NIH AMR Lab", "WHO GLASS", "High AMR rates in Pakistan", "Lab-based AMR surveillance"),
        ("Hepatitis Screening & Treatment Tracking", "G5.2", ["Condition","Observation","MedicationStatement"], ["SA-03","SA-11","SA-06"], "Hepatitis Program", "NHSR&C", "High HCV prevalence (5-8%)", "Screening cascade analytics"),

        # T6 G6.1 (6)
        ("FHIR Interoperability Analytics", "G6.1", ["CapabilityStatement","OperationOutcome","Bundle"], ["SA-12"], "Health IT", "NHSR&C", "No national HIE", "FHIR R5 adoption roadmap"),
        ("Health Information Exchange Monitoring", "G6.1", ["Bundle","MessageHeader","AuditEvent"], ["SA-12"], "Health IT", "NHSR&C", "Siloed health systems", "Provincial HIE platforms"),
        ("DHIS2 Integration Analytics", "G6.1", ["MeasureReport","Organization","Observation"], ["SA-09","SA-08","SA-11"], "HMIS", "WHO/HISP", "Data quality in DHIS2", "FHIR-DHIS2 interoperability"),
        ("Telemedicine Platform Analytics", "G6.1", ["Encounter","Communication","Practitioner"], ["SA-03","SA-01"], "Telemedicine programs", "Ministry of IT", "Limited specialist access in rural areas", "Telemedicine utilization analytics"),
        ("Mobile Health (mHealth) Analytics", "G6.1", ["Observation","Patient","Device"], ["SA-11","SA-01","SA-08"], "mHealth programs", "PTA", "Last-mile health access", "mHealth program effectiveness"),
        ("Cross-Provincial Data Sharing", "G6.1", ["Bundle","Consent","AuditEvent"], ["SA-12","SA-10"], "Provincial health depts", "NHSR&C", "Provincial data silos", "Federated data sharing framework"),

        # T6 G6.2 (6)
        ("Data Quality Monitoring", "G6.2", ["AuditEvent","OperationOutcome","Observation"], ["SA-12","SA-11"], "Health IT", "NHSR&C", "Poor data quality in HMIS", "Automated data quality rules"),
        ("Master Data Management", "G6.2", ["Organization","Location","Practitioner"], ["SA-08","SA-01"], "Health IT", "NHSR&C", "Inconsistent master data", "Master data governance framework"),
        ("Privacy & Access Control Analytics", "G6.2", ["AuditEvent","Consent","Permission"], ["SA-12","SA-10"], "Compliance", "Ministry of IT", "No health data privacy law", "HIPAA-equivalent framework development"),
        ("Data Lineage & Provenance Tracking", "G6.2", ["Provenance","AuditEvent","Bundle"], ["SA-12"], "Health IT", "NHSR&C", "No data lineage tracking", "Automated provenance capture"),
        ("Terminology Standardization", "G6.2", ["CodeSystem","ValueSet","ConceptMap"], ["SA-12"], "Health IT", "NHSR&C", "No national health terminology", "Pakistan health terminology service"),
        ("Analytics Maturity Assessment", "G6.2", ["MeasureReport","Questionnaire","QuestionnaireResponse"], ["SA-09","SA-12"], "Health IT leadership", "NHSR&C", "No analytics maturity baseline", "HACR assessment framework"),
    ]

    capabilities = []
    cap_idx = 0
    bq_templates = [
        "What is the current state of {} across facilities?",
        "How does {} performance compare between urban and rural settings?",
        "What improvements in {} can be achieved in the next 12 months?"
    ]

    for theme_id, theme_name, theme_color, groups in themes:
        for group_id, group_name, count in groups:
            group_caps = [c for c in cap_defs if c[1] == group_id]
            for (cap_name, gid, fhir_res, hcdm_sas, institution, system, challenge, opportunity) in group_caps:
                cap_idx += 1
                cap_id = f"HCF-{cap_idx:03d}"
                capabilities.append({
                    "id": cap_id,
                    "name": cap_name,
                    "theme": theme_name,
                    "themeId": theme_id,
                    "themeColor": theme_color,
                    "group": group_name,
                    "groupId": gid,
                    "description": f"Analytics capability for {cap_name.lower()} within the {group_name} domain",
                    "fhirResources": fhir_res,
                    "hcdmSubjectAreas": hcdm_sas,
                    "maturityLevelRequired": min(3, 1 + (cap_idx % 4)),
                    "pakistanEnrichment": {
                        "institution": institution,
                        "system": system,
                        "challenge": challenge,
                        "opportunity": opportunity
                    },
                    "relatedCapabilities": [f"HCF-{max(1,cap_idx-1):03d}", f"HCF-{min(108,cap_idx+1):03d}"],
                    "businessQuestions": [t.format(cap_name.lower()) for t in bq_templates]
                })

    return capabilities


# ---------------------------------------------------------------------------
# 5. HACR Questions (720+)
# ---------------------------------------------------------------------------
def generate_hacr_questions():
    categories = [
        ("CAT-SL", "Strategy & Leadership", [
            "Health Analytics Vision & Strategy", "Executive Sponsorship & Governance",
            "Analytics Roadmap & Investment", "Change Management & Adoption",
            "Regulatory Alignment", "Strategic Partnerships",
            "Innovation Culture", "Performance Accountability",
            "Data-Driven Decision Making", "National Health Strategy Alignment"
        ]),
        ("CAT-WS", "Workforce & Skills", [
            "Data Science & Analytics Talent", "Clinical Informatics Skills",
            "Health IT Competencies", "Training & Development Programs",
            "Workforce Planning", "Knowledge Management",
            "Interdisciplinary Collaboration", "Digital Literacy",
            "Continuous Learning Culture", "Recruitment & Retention"
        ]),
        ("CAT-DG", "Data Governance & Standards", [
            "Data Governance Framework", "Data Quality Management",
            "Master Data Management", "Metadata Management",
            "Data Privacy & Security", "Data Standards Adoption",
            "Data Stewardship", "Data Lifecycle Management",
            "Regulatory Compliance", "Data Ethics"
        ]),
        ("CAT-IS", "Infrastructure & Systems", [
            "Health Information Systems", "Data Warehouse & Analytics Platform",
            "Cloud Infrastructure", "Integration Architecture",
            "Business Intelligence Tools", "Real-time Processing",
            "Disaster Recovery", "Scalability & Performance",
            "Mobile & Edge Computing", "Cybersecurity"
        ]),
        ("CAT-AI", "Analytics & Intelligence", [
            "Descriptive Analytics", "Diagnostic Analytics",
            "Predictive Analytics", "Prescriptive Analytics",
            "Clinical Analytics", "Operational Analytics",
            "Financial Analytics", "Population Health Analytics",
            "AI & Machine Learning", "Natural Language Processing"
        ]),
        ("CAT-II", "Integration & Interoperability", [
            "FHIR Adoption", "HL7 Messaging",
            "API Management", "Health Information Exchange",
            "Cross-System Integration", "Data Federation",
            "Terminology Services", "Document Exchange",
            "Real-time Event Streaming", "Legacy System Integration"
        ]),
        ("CAT-PC", "Patient & Community Engagement", [
            "Patient Portal Capabilities", "Mobile Health Applications",
            "Patient Data Access", "Health Education & Literacy",
            "Community Health Programs", "Telehealth Analytics",
            "Patient Feedback Systems", "Shared Decision Making",
            "Social Determinants Integration", "Digital Health Equity"
        ]),
        ("CAT-OI", "Outcomes & Impact", [
            "Clinical Outcome Measurement", "Patient Experience Metrics",
            "Financial Impact Assessment", "Operational Efficiency Gains",
            "Population Health Outcomes", "Quality Improvement",
            "Research & Innovation", "Health Equity Metrics",
            "Sustainability & Scalability", "Benchmarking & Comparison"
        ]),
    ]

    level_templates = {
        1: "No formal processes exist for {}. Activities are ad-hoc, undocumented, and dependent on individual effort. No designated roles or accountability.",
        2: "Basic processes for {} are emerging. Some documentation exists but is inconsistent. Initial awareness among leadership with limited resource allocation.",
        3: "Defined processes for {} are in place. Standardized procedures are documented and followed. Dedicated roles exist with regular monitoring and reporting.",
        4: "Advanced processes for {} are systematically managed. Quantitative metrics drive improvement. Integration across departments with automated monitoring.",
        5: "{} is fully optimized and continuously improving. Industry-leading practices are in place. Real-time analytics drive proactive decision-making with measurable outcomes."
    }

    questions = []
    q_idx = 0

    for cat_id, cat_name, subcategories in categories:
        for subcat in subcategories:
            # Generate 9 questions per subcategory (9 * 10 subcats * 8 cats = 720)
            q_aspects = [
                f"strategic planning for {subcat.lower()}",
                f"resource allocation for {subcat.lower()}",
                f"implementation maturity of {subcat.lower()}",
                f"staff competency in {subcat.lower()}",
                f"technology support for {subcat.lower()}",
                f"process documentation for {subcat.lower()}",
                f"performance measurement of {subcat.lower()}",
                f"continuous improvement in {subcat.lower()}",
                f"stakeholder engagement for {subcat.lower()}"
            ]
            for aspect in q_aspects:
                q_idx += 1
                q_id = f"HACR-{cat_id.split('-')[1]}-{q_idx:03d}"
                linked_caps = [f"HCF-{(q_idx % 108) + 1:03d}"]
                questions.append({
                    "id": q_id,
                    "category": cat_name,
                    "categoryId": cat_id,
                    "subcategory": subcat,
                    "question": f"How would you rate your organization's {aspect}?",
                    "levelDescriptions": {
                        "1": level_templates[1].format(aspect),
                        "2": level_templates[2].format(aspect),
                        "3": level_templates[3].format(aspect),
                        "4": level_templates[4].format(aspect),
                        "5": level_templates[5].format(aspect)
                    },
                    "weight": round(0.8 + (q_idx % 5) * 0.1, 1),
                    "capabilityLinks": linked_caps,
                    "pakistanContext": f"In Pakistan's healthcare context, {aspect} is influenced by infrastructure constraints, workforce availability, and regulatory frameworks set by NHSR&C and provincial health departments."
                })

    return questions


# ---------------------------------------------------------------------------
# 6. Star Schema
# ---------------------------------------------------------------------------
def generate_star_schema():
    return {
        "factTable": {
            "name": "FACT_PATIENT_ENCOUNTER",
            "description": "Central fact table capturing all patient encounters with measures",
            "measures": [
                {"name": "encounter_count", "type": "INTEGER", "aggregation": "COUNT", "description": "Number of encounters"},
                {"name": "length_of_stay_hours", "type": "DECIMAL(10,2)", "aggregation": "AVG", "description": "Duration of encounter in hours"},
                {"name": "total_charges", "type": "DECIMAL(15,2)", "aggregation": "SUM", "description": "Total charges for the encounter"},
                {"name": "total_payments", "type": "DECIMAL(15,2)", "aggregation": "SUM", "description": "Total payments received"},
                {"name": "procedure_count", "type": "INTEGER", "aggregation": "SUM", "description": "Number of procedures performed"},
                {"name": "medication_count", "type": "INTEGER", "aggregation": "SUM", "description": "Number of medications administered"},
                {"name": "lab_test_count", "type": "INTEGER", "aggregation": "SUM", "description": "Number of lab tests ordered"},
                {"name": "imaging_count", "type": "INTEGER", "aggregation": "SUM", "description": "Number of imaging studies"},
                {"name": "readmission_flag", "type": "BOOLEAN", "aggregation": "SUM", "description": "Whether patient was readmitted within 30 days"},
                {"name": "mortality_flag", "type": "BOOLEAN", "aggregation": "SUM", "description": "Whether patient expired during encounter"},
                {"name": "patient_satisfaction_score", "type": "DECIMAL(3,1)", "aggregation": "AVG", "description": "Patient satisfaction rating (1-5)"},
                {"name": "wait_time_minutes", "type": "INTEGER", "aggregation": "AVG", "description": "Time from arrival to first clinical contact"}
            ],
            "foreignKeys": [
                "dim_patient_key", "dim_provider_key", "dim_facility_key", "dim_date_key",
                "dim_time_key", "dim_diagnosis_key", "dim_procedure_key", "dim_payer_key",
                "dim_medication_key", "dim_department_key", "dim_geography_key", "dim_age_group_key"
            ]
        },
        "dimensions": [
            {"name": "DIM_PATIENT", "description": "Patient demographics and identifiers", "columns": [
                {"name": "patient_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "patient_id", "type": "VARCHAR(50)", "description": "FHIR Patient.id"},
                {"name": "cnic", "type": "VARCHAR(15)", "description": "NADRA CNIC number"},
                {"name": "gender", "type": "VARCHAR(10)", "description": "Patient gender"},
                {"name": "birth_date", "type": "DATE", "description": "Date of birth"},
                {"name": "age_years", "type": "INTEGER", "description": "Current age"},
                {"name": "marital_status", "type": "VARCHAR(20)", "description": "Marital status"},
                {"name": "province", "type": "VARCHAR(50)", "description": "Province of residence"},
                {"name": "district", "type": "VARCHAR(50)", "description": "District of residence"},
                {"name": "urban_rural", "type": "VARCHAR(10)", "description": "Urban or rural classification"},
                {"name": "sehat_sahulat_enrolled", "type": "BOOLEAN", "description": "Enrolled in Sehat Sahulat"}
            ]},
            {"name": "DIM_PROVIDER", "description": "Healthcare provider details", "columns": [
                {"name": "provider_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "practitioner_id", "type": "VARCHAR(50)", "description": "FHIR Practitioner.id"},
                {"name": "pmc_number", "type": "VARCHAR(20)", "description": "PMC registration number"},
                {"name": "name", "type": "VARCHAR(100)", "description": "Provider name"},
                {"name": "specialty", "type": "VARCHAR(50)", "description": "Medical specialty"},
                {"name": "qualification", "type": "VARCHAR(50)", "description": "Highest qualification"},
                {"name": "provider_type", "type": "VARCHAR(30)", "description": "Doctor, nurse, LHW, etc."},
                {"name": "experience_years", "type": "INTEGER", "description": "Years of experience"}
            ]},
            {"name": "DIM_FACILITY", "description": "Healthcare facility details", "columns": [
                {"name": "facility_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "organization_id", "type": "VARCHAR(50)", "description": "FHIR Organization.id"},
                {"name": "facility_name", "type": "VARCHAR(100)", "description": "Facility name"},
                {"name": "facility_type", "type": "VARCHAR(30)", "description": "BHU, RHC, THQ, DHQ, Tertiary"},
                {"name": "ownership", "type": "VARCHAR(20)", "description": "Public, private, military"},
                {"name": "bed_count", "type": "INTEGER", "description": "Number of beds"},
                {"name": "province", "type": "VARCHAR(50)", "description": "Province"},
                {"name": "district", "type": "VARCHAR(50)", "description": "District"},
                {"name": "latitude", "type": "DECIMAL(10,7)", "description": "GPS latitude"},
                {"name": "longitude", "type": "DECIMAL(10,7)", "description": "GPS longitude"}
            ]},
            {"name": "DIM_DATE", "description": "Calendar date dimension", "columns": [
                {"name": "date_key", "type": "INTEGER", "description": "Surrogate key (YYYYMMDD)"},
                {"name": "full_date", "type": "DATE", "description": "Full date"},
                {"name": "day_of_week", "type": "VARCHAR(10)", "description": "Day of week"},
                {"name": "month", "type": "INTEGER", "description": "Month number"},
                {"name": "quarter", "type": "INTEGER", "description": "Quarter number"},
                {"name": "year", "type": "INTEGER", "description": "Year"},
                {"name": "fiscal_year", "type": "VARCHAR(10)", "description": "Pakistan fiscal year (Jul-Jun)"},
                {"name": "is_public_holiday", "type": "BOOLEAN", "description": "Pakistan public holiday flag"},
                {"name": "islamic_month", "type": "VARCHAR(20)", "description": "Islamic calendar month"},
                {"name": "is_ramadan", "type": "BOOLEAN", "description": "Ramadan flag"}
            ]},
            {"name": "DIM_TIME", "description": "Time of day dimension", "columns": [
                {"name": "time_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "hour", "type": "INTEGER", "description": "Hour (0-23)"},
                {"name": "minute", "type": "INTEGER", "description": "Minute (0-59)"},
                {"name": "shift", "type": "VARCHAR(20)", "description": "Morning/Afternoon/Night shift"},
                {"name": "is_peak_hour", "type": "BOOLEAN", "description": "Peak OPD hours flag"}
            ]},
            {"name": "DIM_DIAGNOSIS", "description": "Diagnosis and condition dimension", "columns": [
                {"name": "diagnosis_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "icd10_code", "type": "VARCHAR(10)", "description": "ICD-10 code"},
                {"name": "icd10_description", "type": "VARCHAR(200)", "description": "ICD-10 description"},
                {"name": "icd10_chapter", "type": "VARCHAR(100)", "description": "ICD-10 chapter"},
                {"name": "disease_category", "type": "VARCHAR(50)", "description": "Communicable, NCD, injury, etc."},
                {"name": "is_notifiable", "type": "BOOLEAN", "description": "Notifiable disease flag"},
                {"name": "is_priority_disease", "type": "BOOLEAN", "description": "Pakistan priority disease"}
            ]},
            {"name": "DIM_PROCEDURE", "description": "Clinical procedure dimension", "columns": [
                {"name": "procedure_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "procedure_code", "type": "VARCHAR(10)", "description": "Procedure code"},
                {"name": "procedure_name", "type": "VARCHAR(200)", "description": "Procedure description"},
                {"name": "procedure_category", "type": "VARCHAR(50)", "description": "Surgical, diagnostic, therapeutic"},
                {"name": "body_system", "type": "VARCHAR(50)", "description": "Body system"},
                {"name": "complexity", "type": "VARCHAR(20)", "description": "Minor, moderate, major, complex"}
            ]},
            {"name": "DIM_PAYER", "description": "Insurance and payer dimension", "columns": [
                {"name": "payer_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "payer_name", "type": "VARCHAR(100)", "description": "Payer organization name"},
                {"name": "payer_type", "type": "VARCHAR(30)", "description": "Sehat Sahulat, private insurance, self-pay, military"},
                {"name": "plan_name", "type": "VARCHAR(100)", "description": "Insurance plan name"},
                {"name": "coverage_type", "type": "VARCHAR(30)", "description": "Inpatient, outpatient, both"}
            ]},
            {"name": "DIM_MEDICATION", "description": "Medication and drug dimension", "columns": [
                {"name": "medication_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "drug_code", "type": "VARCHAR(20)", "description": "Drug code"},
                {"name": "drug_name", "type": "VARCHAR(200)", "description": "Drug generic name"},
                {"name": "brand_name", "type": "VARCHAR(200)", "description": "Brand name"},
                {"name": "therapeutic_class", "type": "VARCHAR(50)", "description": "Therapeutic classification"},
                {"name": "route", "type": "VARCHAR(20)", "description": "Route of administration"},
                {"name": "is_essential_medicine", "type": "BOOLEAN", "description": "On Pakistan essential medicines list"},
                {"name": "drap_registered", "type": "BOOLEAN", "description": "DRAP registration status"}
            ]},
            {"name": "DIM_DEPARTMENT", "description": "Hospital department dimension", "columns": [
                {"name": "department_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "department_name", "type": "VARCHAR(100)", "description": "Department name"},
                {"name": "department_type", "type": "VARCHAR(30)", "description": "Clinical, support, administrative"},
                {"name": "service_line", "type": "VARCHAR(50)", "description": "Service line grouping"}
            ]},
            {"name": "DIM_GEOGRAPHY", "description": "Geographic hierarchy dimension", "columns": [
                {"name": "geography_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "country", "type": "VARCHAR(50)", "description": "Country (Pakistan)"},
                {"name": "province", "type": "VARCHAR(50)", "description": "Province/territory"},
                {"name": "division", "type": "VARCHAR(50)", "description": "Administrative division"},
                {"name": "district", "type": "VARCHAR(50)", "description": "District"},
                {"name": "tehsil", "type": "VARCHAR(50)", "description": "Tehsil/sub-district"},
                {"name": "union_council", "type": "VARCHAR(50)", "description": "Union council"},
                {"name": "population", "type": "INTEGER", "description": "Area population estimate"}
            ]},
            {"name": "DIM_AGE_GROUP", "description": "Age group dimension for population analytics", "columns": [
                {"name": "age_group_key", "type": "INTEGER", "description": "Surrogate key"},
                {"name": "age_group", "type": "VARCHAR(20)", "description": "Age group label"},
                {"name": "age_min", "type": "INTEGER", "description": "Minimum age"},
                {"name": "age_max", "type": "INTEGER", "description": "Maximum age"},
                {"name": "life_stage", "type": "VARCHAR(20)", "description": "Neonate, infant, child, adolescent, adult, elderly"},
                {"name": "epi_eligible", "type": "BOOLEAN", "description": "EPI target age group"}
            ]}
        ],
        "aggregates": [
            {"name": "AGG_DAILY_FACILITY_ENCOUNTERS", "description": "Daily encounter counts and metrics by facility", "grainKeys": ["dim_facility_key", "dim_date_key"], "measures": ["encounter_count", "total_charges", "avg_wait_time", "avg_los"]},
            {"name": "AGG_MONTHLY_DIAGNOSIS", "description": "Monthly diagnosis counts by facility and geography", "grainKeys": ["dim_facility_key", "dim_diagnosis_key", "month", "year"], "measures": ["encounter_count", "mortality_count", "readmission_count"]},
            {"name": "AGG_PROVIDER_PRODUCTIVITY", "description": "Provider-level monthly productivity metrics", "grainKeys": ["dim_provider_key", "month", "year"], "measures": ["encounter_count", "procedure_count", "avg_satisfaction_score"]},
            {"name": "AGG_PAYER_CLAIMS", "description": "Payer-level claims summary", "grainKeys": ["dim_payer_key", "dim_facility_key", "month", "year"], "measures": ["claim_count", "total_billed", "total_paid", "denial_count"]},
            {"name": "AGG_POPULATION_HEALTH", "description": "Population health indicators by geography", "grainKeys": ["dim_geography_key", "dim_age_group_key", "year"], "measures": ["population", "disease_prevalence", "immunization_coverage", "maternal_mortality_ratio"]}
        ],
        "views": [
            {"name": "VW_ENCOUNTER_SUMMARY", "description": "Encounter summary view joining fact with key dimensions", "joins": ["DIM_PATIENT", "DIM_PROVIDER", "DIM_FACILITY", "DIM_DATE", "DIM_DIAGNOSIS"]},
            {"name": "VW_REVENUE_CYCLE", "description": "Revenue cycle analytics view", "joins": ["DIM_FACILITY", "DIM_PAYER", "DIM_DATE", "DIM_DEPARTMENT"]},
            {"name": "VW_CLINICAL_QUALITY", "description": "Clinical quality indicators view", "joins": ["DIM_FACILITY", "DIM_DIAGNOSIS", "DIM_PROCEDURE", "DIM_PROVIDER"]},
            {"name": "VW_POPULATION_HEALTH", "description": "Population health dashboard view", "joins": ["DIM_GEOGRAPHY", "DIM_AGE_GROUP", "DIM_DIAGNOSIS", "DIM_DATE"]},
            {"name": "VW_IMMUNIZATION_COVERAGE", "description": "Immunization coverage tracking view", "joins": ["DIM_PATIENT", "DIM_FACILITY", "DIM_GEOGRAPHY", "DIM_DATE"]},
            {"name": "VW_MEDICATION_UTILIZATION", "description": "Medication utilization analytics view", "joins": ["DIM_MEDICATION", "DIM_FACILITY", "DIM_PROVIDER", "DIM_DATE"]}
        ]
    }


# ---------------------------------------------------------------------------
# 7. Gap Extensions
# ---------------------------------------------------------------------------
def generate_gap_extensions():
    modules = [
        {
            "module": "Population Health",
            "description": "Extensions for population health management and social determinants",
            "tables": [
                {"name": "EXT_POPULATION_COHORT", "description": "Defines population cohorts for analytics", "columns": [
                    {"name": "cohort_id", "type": "VARCHAR(50)", "pk": True}, {"name": "cohort_name", "type": "VARCHAR(200)"}, {"name": "definition_criteria", "type": "JSON"}, {"name": "member_count", "type": "INTEGER"}, {"name": "province", "type": "VARCHAR(50)"}, {"name": "district", "type": "VARCHAR(50)"}, {"name": "created_date", "type": "TIMESTAMP"}, {"name": "refresh_frequency", "type": "VARCHAR(20)"}
                ], "pakistanContext": "Cohorts defined by LHW catchment areas, UC boundaries, and Ehsaas poverty data"},
                {"name": "EXT_SOCIAL_DETERMINANT", "description": "Social determinants of health data", "columns": [
                    {"name": "sdoh_id", "type": "VARCHAR(50)", "pk": True}, {"name": "patient_id", "type": "VARCHAR(50)"}, {"name": "education_level", "type": "VARCHAR(30)"}, {"name": "employment_status", "type": "VARCHAR(30)"}, {"name": "household_income_bracket", "type": "VARCHAR(30)"}, {"name": "housing_type", "type": "VARCHAR(30)"}, {"name": "water_source", "type": "VARCHAR(30)"}, {"name": "sanitation_type", "type": "VARCHAR(30)"}, {"name": "food_security_status", "type": "VARCHAR(30)"}, {"name": "assessment_date", "type": "DATE"}
                ], "pakistanContext": "Integrates with BISP/Ehsaas poverty scorecard and Pakistan Living Standards Survey"},
                {"name": "EXT_COMMUNITY_HEALTH_WORKER", "description": "Lady Health Worker program data", "columns": [
                    {"name": "lhw_id", "type": "VARCHAR(50)", "pk": True}, {"name": "name", "type": "VARCHAR(100)"}, {"name": "cnic", "type": "VARCHAR(15)"}, {"name": "catchment_population", "type": "INTEGER"}, {"name": "households_covered", "type": "INTEGER"}, {"name": "union_council", "type": "VARCHAR(50)"}, {"name": "district", "type": "VARCHAR(50)"}, {"name": "active_since", "type": "DATE"}, {"name": "supervisor_id", "type": "VARCHAR(50)"}, {"name": "monthly_visits_target", "type": "INTEGER"}
                ], "pakistanContext": "100,000+ Lady Health Workers serving rural Pakistan; key primary care delivery channel"},
                {"name": "EXT_ENVIRONMENTAL_HEALTH", "description": "Environmental health indicators", "columns": [
                    {"name": "record_id", "type": "VARCHAR(50)", "pk": True}, {"name": "location_id", "type": "VARCHAR(50)"}, {"name": "aqi_value", "type": "DECIMAL(5,1)"}, {"name": "water_quality_index", "type": "DECIMAL(5,1)"}, {"name": "temperature_celsius", "type": "DECIMAL(4,1)"}, {"name": "rainfall_mm", "type": "DECIMAL(6,1)"}, {"name": "dengue_risk_score", "type": "DECIMAL(3,1)"}, {"name": "measurement_date", "type": "DATE"}
                ], "pakistanContext": "Lahore/Karachi air quality crisis; dengue correlation with rainfall patterns"},
                {"name": "EXT_HEALTH_FACILITY_ASSESSMENT", "description": "Facility readiness assessments", "columns": [
                    {"name": "assessment_id", "type": "VARCHAR(50)", "pk": True}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "assessment_date", "type": "DATE"}, {"name": "service_readiness_score", "type": "DECIMAL(5,2)"}, {"name": "staff_availability_score", "type": "DECIMAL(5,2)"}, {"name": "equipment_score", "type": "DECIMAL(5,2)"}, {"name": "medicine_availability_score", "type": "DECIMAL(5,2)"}, {"name": "infrastructure_score", "type": "DECIMAL(5,2)"}, {"name": "overall_score", "type": "DECIMAL(5,2)"}, {"name": "assessor_id", "type": "VARCHAR(50)"}
                ], "pakistanContext": "WHO SARA (Service Availability and Readiness Assessment) adapted for Pakistan"}
            ]
        },
        {
            "module": "Claims Intelligence",
            "description": "Extended claims and reimbursement analytics beyond core FHIR",
            "tables": [
                {"name": "EXT_CLAIM_ANALYTICS", "description": "Extended claims analytics data", "columns": [
                    {"name": "claim_analytics_id", "type": "VARCHAR(50)", "pk": True}, {"name": "claim_id", "type": "VARCHAR(50)"}, {"name": "submission_to_adjudication_days", "type": "INTEGER"}, {"name": "denial_reason_code", "type": "VARCHAR(20)"}, {"name": "appeal_count", "type": "INTEGER"}, {"name": "rework_count", "type": "INTEGER"}, {"name": "first_pass_rate", "type": "BOOLEAN"}, {"name": "net_collection_rate", "type": "DECIMAL(5,2)"}, {"name": "cost_to_collect", "type": "DECIMAL(10,2)"}
                ], "pakistanContext": "Sehat Sahulat claims processing analytics; average 45-day payment cycle"},
                {"name": "EXT_DRG_GROUPING", "description": "Diagnosis-Related Group assignments", "columns": [
                    {"name": "drg_id", "type": "VARCHAR(50)", "pk": True}, {"name": "encounter_id", "type": "VARCHAR(50)"}, {"name": "drg_code", "type": "VARCHAR(10)"}, {"name": "drg_description", "type": "VARCHAR(200)"}, {"name": "relative_weight", "type": "DECIMAL(6,4)"}, {"name": "geometric_mean_los", "type": "DECIMAL(5,2)"}, {"name": "arithmetic_mean_los", "type": "DECIMAL(5,2)"}, {"name": "expected_payment", "type": "DECIMAL(12,2)"}
                ], "pakistanContext": "DRG adoption being considered for Sehat Sahulat case-based payment reform"},
                {"name": "EXT_FRAUD_INDICATOR", "description": "Claims fraud detection indicators", "columns": [
                    {"name": "indicator_id", "type": "VARCHAR(50)", "pk": True}, {"name": "claim_id", "type": "VARCHAR(50)"}, {"name": "risk_score", "type": "DECIMAL(5,2)"}, {"name": "anomaly_type", "type": "VARCHAR(50)"}, {"name": "detection_method", "type": "VARCHAR(50)"}, {"name": "investigation_status", "type": "VARCHAR(20)"}, {"name": "estimated_loss", "type": "DECIMAL(12,2)"}, {"name": "detection_date", "type": "DATE"}
                ], "pakistanContext": "Fraud detection in Sehat Sahulat; phantom claims and upcoding risks"},
                {"name": "EXT_REIMBURSEMENT_SCHEDULE", "description": "Payer reimbursement rate schedules", "columns": [
                    {"name": "schedule_id", "type": "VARCHAR(50)", "pk": True}, {"name": "payer_id", "type": "VARCHAR(50)"}, {"name": "procedure_code", "type": "VARCHAR(10)"}, {"name": "reimbursement_rate_pkr", "type": "DECIMAL(12,2)"}, {"name": "effective_date", "type": "DATE"}, {"name": "expiry_date", "type": "DATE"}, {"name": "rate_type", "type": "VARCHAR(20)"}, {"name": "negotiated_discount_pct", "type": "DECIMAL(5,2)"}
                ], "pakistanContext": "Sehat Sahulat package rates; procedure-based reimbursement schedules"},
                {"name": "EXT_UTILIZATION_REVIEW", "description": "Utilization management and review data", "columns": [
                    {"name": "review_id", "type": "VARCHAR(50)", "pk": True}, {"name": "encounter_id", "type": "VARCHAR(50)"}, {"name": "review_type", "type": "VARCHAR(30)"}, {"name": "clinical_appropriateness", "type": "VARCHAR(20)"}, {"name": "length_of_stay_appropriateness", "type": "VARCHAR(20)"}, {"name": "reviewer_id", "type": "VARCHAR(50)"}, {"name": "review_date", "type": "DATE"}, {"name": "recommendation", "type": "VARCHAR(200)"}
                ], "pakistanContext": "Utilization review for Sehat Sahulat to prevent overutilization"}
            ]
        },
        {
            "module": "Quality & Outcomes",
            "description": "Quality measurement and clinical outcome extensions",
            "tables": [
                {"name": "EXT_QUALITY_INDICATOR", "description": "Quality indicator results", "columns": [
                    {"name": "indicator_id", "type": "VARCHAR(50)", "pk": True}, {"name": "measure_id", "type": "VARCHAR(50)"}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "reporting_period", "type": "VARCHAR(20)"}, {"name": "numerator", "type": "INTEGER"}, {"name": "denominator", "type": "INTEGER"}, {"name": "rate", "type": "DECIMAL(7,4)"}, {"name": "target_rate", "type": "DECIMAL(7,4)"}, {"name": "benchmark_rate", "type": "DECIMAL(7,4)"}, {"name": "performance_band", "type": "VARCHAR(20)"}
                ], "pakistanContext": "PHCIP quality indicators; WHO core health indicators for Pakistan"},
                {"name": "EXT_PATIENT_SAFETY_EVENT", "description": "Patient safety event tracking", "columns": [
                    {"name": "event_id", "type": "VARCHAR(50)", "pk": True}, {"name": "event_type", "type": "VARCHAR(50)"}, {"name": "severity", "type": "VARCHAR(20)"}, {"name": "harm_level", "type": "VARCHAR(20)"}, {"name": "contributing_factors", "type": "JSON"}, {"name": "root_cause", "type": "VARCHAR(200)"}, {"name": "corrective_action", "type": "VARCHAR(200)"}, {"name": "reported_date", "type": "DATE"}, {"name": "facility_id", "type": "VARCHAR(50)"}
                ], "pakistanContext": "Patient safety culture development in Pakistani hospitals"},
                {"name": "EXT_CLINICAL_REGISTRY", "description": "Disease-specific clinical registries", "columns": [
                    {"name": "registry_entry_id", "type": "VARCHAR(50)", "pk": True}, {"name": "registry_name", "type": "VARCHAR(50)"}, {"name": "patient_id", "type": "VARCHAR(50)"}, {"name": "diagnosis_date", "type": "DATE"}, {"name": "stage_at_diagnosis", "type": "VARCHAR(20)"}, {"name": "treatment_protocol", "type": "VARCHAR(50)"}, {"name": "outcome_status", "type": "VARCHAR(20)"}, {"name": "follow_up_date", "type": "DATE"}, {"name": "data_completeness_score", "type": "DECIMAL(5,2)"}
                ], "pakistanContext": "Cancer registry, TB register, diabetes registry for Pakistan"},
                {"name": "EXT_ANTIMICROBIAL_RESISTANCE", "description": "AMR surveillance data", "columns": [
                    {"name": "amr_id", "type": "VARCHAR(50)", "pk": True}, {"name": "specimen_id", "type": "VARCHAR(50)"}, {"name": "organism", "type": "VARCHAR(100)"}, {"name": "antibiotic", "type": "VARCHAR(100)"}, {"name": "susceptibility", "type": "VARCHAR(20)"}, {"name": "mic_value", "type": "DECIMAL(8,3)"}, {"name": "breakpoint", "type": "VARCHAR(20)"}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "collection_date", "type": "DATE"}
                ], "pakistanContext": "WHO GLASS reporting; NIH AMR surveillance network in Pakistan"},
                {"name": "EXT_MATERNAL_DEATH_REVIEW", "description": "Maternal death surveillance and response", "columns": [
                    {"name": "review_id", "type": "VARCHAR(50)", "pk": True}, {"name": "patient_id", "type": "VARCHAR(50)"}, {"name": "death_date", "type": "DATE"}, {"name": "cause_of_death", "type": "VARCHAR(200)"}, {"name": "delay_type", "type": "VARCHAR(30)"}, {"name": "preventability_assessment", "type": "VARCHAR(30)"}, {"name": "facility_level", "type": "VARCHAR(20)"}, {"name": "recommendations", "type": "JSON"}, {"name": "review_date", "type": "DATE"}, {"name": "review_committee", "type": "VARCHAR(100)"}
                ], "pakistanContext": "MDSR (Maternal Death Surveillance and Response) system for Pakistan; MMR 186/100K"}
            ]
        },
        {
            "module": "Pharmacy Analytics",
            "description": "Extended pharmacy and medication analytics",
            "tables": [
                {"name": "EXT_DRUG_UTILIZATION", "description": "Drug utilization review data", "columns": [
                    {"name": "dur_id", "type": "VARCHAR(50)", "pk": True}, {"name": "medication_id", "type": "VARCHAR(50)"}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "period", "type": "VARCHAR(20)"}, {"name": "quantity_dispensed", "type": "INTEGER"}, {"name": "ddd_per_1000", "type": "DECIMAL(8,2)"}, {"name": "cost_pkr", "type": "DECIMAL(12,2)"}, {"name": "therapeutic_class", "type": "VARCHAR(50)"}, {"name": "generic_substitution_rate", "type": "DECIMAL(5,2)"}
                ], "pakistanContext": "Essential medicines monitoring; WHO DDD methodology adapted for Pakistan"},
                {"name": "EXT_FORMULARY_COMPLIANCE", "description": "Formulary adherence tracking", "columns": [
                    {"name": "compliance_id", "type": "VARCHAR(50)", "pk": True}, {"name": "prescription_id", "type": "VARCHAR(50)"}, {"name": "prescribed_drug", "type": "VARCHAR(200)"}, {"name": "formulary_status", "type": "VARCHAR(20)"}, {"name": "alternative_available", "type": "BOOLEAN"}, {"name": "prescriber_id", "type": "VARCHAR(50)"}, {"name": "override_reason", "type": "VARCHAR(200)"}, {"name": "cost_impact_pkr", "type": "DECIMAL(10,2)"}
                ], "pakistanContext": "Hospital formulary compliance; Essential Drug List adherence monitoring"},
                {"name": "EXT_VACCINE_INVENTORY", "description": "Vaccine inventory and cold chain tracking", "columns": [
                    {"name": "inventory_id", "type": "VARCHAR(50)", "pk": True}, {"name": "vaccine_type", "type": "VARCHAR(50)"}, {"name": "batch_number", "type": "VARCHAR(50)"}, {"name": "quantity", "type": "INTEGER"}, {"name": "expiry_date", "type": "DATE"}, {"name": "storage_temperature", "type": "DECIMAL(4,1)"}, {"name": "cold_chain_break", "type": "BOOLEAN"}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "last_updated", "type": "TIMESTAMP"}
                ], "pakistanContext": "EPI vaccine inventory; cold chain management critical for polio eradication"},
                {"name": "EXT_ANTIBIOTIC_STEWARDSHIP", "description": "Antimicrobial stewardship program data", "columns": [
                    {"name": "asp_id", "type": "VARCHAR(50)", "pk": True}, {"name": "prescription_id", "type": "VARCHAR(50)"}, {"name": "antibiotic_name", "type": "VARCHAR(100)"}, {"name": "indication", "type": "VARCHAR(100)"}, {"name": "guideline_compliant", "type": "BOOLEAN"}, {"name": "duration_days", "type": "INTEGER"}, {"name": "deescalation_done", "type": "BOOLEAN"}, {"name": "culture_obtained_before", "type": "BOOLEAN"}, {"name": "review_status", "type": "VARCHAR(20)"}
                ], "pakistanContext": "AMR crisis in Pakistan; antibiotic overuse in primary care and hospital settings"},
                {"name": "EXT_MEDICATION_ADHERENCE", "description": "Patient medication adherence tracking", "columns": [
                    {"name": "adherence_id", "type": "VARCHAR(50)", "pk": True}, {"name": "patient_id", "type": "VARCHAR(50)"}, {"name": "medication_id", "type": "VARCHAR(50)"}, {"name": "adherence_rate", "type": "DECIMAL(5,2)"}, {"name": "measurement_method", "type": "VARCHAR(30)"}, {"name": "barriers", "type": "JSON"}, {"name": "assessment_date", "type": "DATE"}, {"name": "intervention_recommended", "type": "VARCHAR(200)"}
                ], "pakistanContext": "TB DOTS adherence; chronic disease medication compliance in Pakistan"}
            ]
        },
        {
            "module": "Maternal & Child Health",
            "description": "MNCH program-specific extensions for Pakistan",
            "tables": [
                {"name": "EXT_ANTENATAL_CARE", "description": "Antenatal care visit tracking", "columns": [
                    {"name": "anc_id", "type": "VARCHAR(50)", "pk": True}, {"name": "patient_id", "type": "VARCHAR(50)"}, {"name": "visit_number", "type": "INTEGER"}, {"name": "gestational_age_weeks", "type": "INTEGER"}, {"name": "blood_pressure_systolic", "type": "INTEGER"}, {"name": "blood_pressure_diastolic", "type": "INTEGER"}, {"name": "weight_kg", "type": "DECIMAL(5,1)"}, {"name": "hemoglobin", "type": "DECIMAL(4,1)"}, {"name": "risk_classification", "type": "VARCHAR(20)"}, {"name": "facility_id", "type": "VARCHAR(50)"}, {"name": "provider_id", "type": "VARCHAR(50)"}, {"name": "visit_date", "type": "DATE"}
                ], "pakistanContext": "WHO 8-contact ANC model; only 69% of women receive at least 1 ANC visit in Pakistan"},
                {"name": "EXT_DELIVERY_OUTCOME", "description": "Delivery and birth outcome data", "columns": [
                    {"name": "delivery_id", "type": "VARCHAR(50)", "pk": True}, {"name": "mother_id", "type": "VARCHAR(50)"}, {"name": "delivery_date", "type": "DATE"}, {"name": "delivery_type", "type": "VARCHAR(30)"}, {"name": "delivery_location", "type": "VARCHAR(30)"}, {"name": "birth_weight_grams", "type": "INTEGER"}, {"name": "apgar_1min", "type": "INTEGER"}, {"name": "apgar_5min", "type": "INTEGER"}, {"name": "complications", "type": "JSON"}, {"name": "attendant_type", "type": "VARCHAR(30)"}, {"name": "facility_id", "type": "VARCHAR(50)"}
                ], "pakistanContext": "48% institutional delivery rate; skilled birth attendant coverage tracking"},
                {"name": "EXT_CHILD_GROWTH", "description": "Child growth monitoring data", "columns": [
                    {"name": "growth_id", "type": "VARCHAR(50)", "pk": True}, {"name": "child_id", "type": "VARCHAR(50)"}, {"name": "measurement_date", "type": "DATE"}, {"name": "age_months", "type": "INTEGER"}, {"name": "weight_kg", "type": "DECIMAL(5,2)"}, {"name": "height_cm", "type": "DECIMAL(5,1)"}, {"name": "muac_cm", "type": "DECIMAL(4,1)"}, {"name": "weight_for_age_z", "type": "DECIMAL(4,2)"}, {"name": "height_for_age_z", "type": "DECIMAL(4,2)"}, {"name": "weight_for_height_z", "type": "DECIMAL(4,2)"}, {"name": "nutritional_status", "type": "VARCHAR(20)"}
                ], "pakistanContext": "40% stunting, 29% underweight, 18% wasting rates in children under 5"},
                {"name": "EXT_IMMUNIZATION_COVERAGE", "description": "EPI immunization coverage tracking", "columns": [
                    {"name": "coverage_id", "type": "VARCHAR(50)", "pk": True}, {"name": "district", "type": "VARCHAR(50)"}, {"name": "vaccine_type", "type": "VARCHAR(30)"}, {"name": "target_population", "type": "INTEGER"}, {"name": "vaccinated_count", "type": "INTEGER"}, {"name": "coverage_rate", "type": "DECIMAL(5,2)"}, {"name": "dropout_rate", "type": "DECIMAL(5,2)"}, {"name": "reporting_month", "type": "VARCHAR(7)"}, {"name": "data_source", "type": "VARCHAR(30)"}
                ], "pakistanContext": "EPI coverage gaps; fully immunized child rate 66%; Penta3 coverage tracking"},
                {"name": "EXT_POSTNATAL_CARE", "description": "Postnatal care tracking for mother and newborn", "columns": [
                    {"name": "pnc_id", "type": "VARCHAR(50)", "pk": True}, {"name": "mother_id", "type": "VARCHAR(50)"}, {"name": "newborn_id", "type": "VARCHAR(50)"}, {"name": "visit_number", "type": "INTEGER"}, {"name": "visit_timing", "type": "VARCHAR(30)"}, {"name": "mother_complications", "type": "JSON"}, {"name": "newborn_complications", "type": "JSON"}, {"name": "breastfeeding_status", "type": "VARCHAR(20)"}, {"name": "family_planning_counseling", "type": "BOOLEAN"}, {"name": "visit_date", "type": "DATE"}, {"name": "provider_type", "type": "VARCHAR(30)"}
                ], "pakistanContext": "Only 60% of mothers receive PNC within 48 hours; critical for neonatal survival"}
            ]
        }
    ]
    return modules


# ---------------------------------------------------------------------------
# 8. Enrichment (108 entries)
# ---------------------------------------------------------------------------
def generate_enrichment():
    caps = generate_capabilities()
    enrichment = {}
    institutions = ["NHSR&C", "NADRA", "DRAP", "PMC", "NIH", "PHCIP", "Sehat Sahulat", "EPI Program", "MNCH Program", "WHO Pakistan"]
    regulatory_bodies = ["NHSR&C", "DRAP", "PMC", "PNC", "Ministry of NHSR&C", "Provincial Health Departments"]
    programs = ["Sehat Sahulat Program", "Lady Health Worker Program", "EPI", "TB DOTS", "Polio Eradication", "MNCH Program", "Hepatitis Control Program", "NCD Prevention", "Ehsaas/BISP", "Prime Minister Health Initiative"]

    for i, cap in enumerate(caps):
        enrichment[cap["id"]] = {
            "institution": cap["pakistanEnrichment"]["institution"],
            "regulatoryBody": regulatory_bodies[i % len(regulatory_bodies)],
            "relevantProgram": programs[i % len(programs)],
            "challenge": cap["pakistanEnrichment"]["challenge"],
            "opportunity": cap["pakistanEnrichment"]["opportunity"],
            "keyStatistics": f"Relevant to healthcare analytics serving 240M+ population across 4 provinces and 160+ districts"
        }
    return enrichment


# ---------------------------------------------------------------------------
# 9. Pakistan Context
# ---------------------------------------------------------------------------
def generate_pakistan_context():
    return {
        "institutions": [
            {"name": "NHSR&C", "fullName": "National Health Services, Regulations & Coordination", "role": "Federal health policy, regulation, and coordination", "relevance": "Primary regulatory body for health IT standards and FHIR adoption"},
            {"name": "NADRA", "fullName": "National Database & Registration Authority", "role": "National identity management and CNIC issuance", "relevance": "CNIC as universal patient identifier for health systems"},
            {"name": "DRAP", "fullName": "Drug Regulatory Authority of Pakistan", "role": "Drug registration, regulation, and pharmacovigilance", "relevance": "Medication coding standards and adverse event reporting"},
            {"name": "PMC", "fullName": "Pakistan Medical Commission", "role": "Medical education regulation and practitioner registration", "relevance": "Provider registry and credentialing data source"},
            {"name": "NIH", "fullName": "National Institute of Health", "role": "Public health surveillance and disease control", "relevance": "Disease surveillance data, AMR monitoring, outbreak detection"},
            {"name": "PHCIP", "fullName": "Primary & Secondary Healthcare Department (Punjab)", "role": "Primary healthcare delivery and facility management", "relevance": "Largest provincial health system; model for analytics deployment"},
            {"name": "Sehat Sahulat", "fullName": "Sehat Sahulat Programme", "role": "National health insurance program", "relevance": "Claims processing, coverage eligibility, provider network management"}
        ],
        "statistics": {
            "population": 240000000,
            "healthExpenditureGDP": 3.2,
            "outOfPocketPercent": 56,
            "lifeExpectancy": 66.5,
            "infantMortalityPer1000": 52,
            "maternalMortalityPer100K": 186,
            "neonatalMortalityPer1000": 42,
            "under5MortalityPer1000": 65,
            "hospitals": 1282,
            "bhus": 5527,
            "rhcs": 686,
            "thqs": 380,
            "dhqs": 131,
            "teachingHospitals": 65,
            "hospitalBeds": 132227,
            "bedsPerThousand": 0.6,
            "doctors": 245987,
            "doctorsPerThousand": 1.0,
            "nurses": 120000,
            "ladyHealthWorkers": 100000,
            "dentists": 28000,
            "sehatSahulatCoveragePercent": 65,
            "sehatSahulatBeneficiaries": 90000000,
            "fullyImmunizedChildPercent": 66,
            "stuntingRatePercent": 40,
            "tbIncidencePer100K": 259,
            "hepatitisCPrevalencePercent": 5.5,
            "totalFertilityRate": 3.5,
            "contraceptivePrevalenceRate": 34,
            "skilledBirthAttendancePercent": 69,
            "institutionalDeliveryPercent": 48
        },
        "facilityHierarchy": [
            {"level": 1, "name": "Basic Health Unit (BHU)", "description": "Primary healthcare for catchment of 10,000-25,000 population", "count": 5527, "services": "Preventive care, basic curative, MCH, EPI, family planning"},
            {"level": 2, "name": "Rural Health Centre (RHC)", "description": "Enhanced primary care with 10-20 beds for 25,000-100,000 population", "count": 686, "services": "BHU services plus minor surgeries, lab, dental, X-ray"},
            {"level": 3, "name": "Tehsil Headquarters Hospital (THQ)", "description": "First referral hospital at tehsil/sub-district level with 40-60 beds", "count": 380, "services": "Medicine, surgery, OB/GYN, pediatrics, emergency"},
            {"level": 4, "name": "District Headquarters Hospital (DHQ)", "description": "Secondary care hospital at district level with 100-250 beds", "count": 131, "services": "All THQ services plus specialty clinics, diagnostic services"},
            {"level": 5, "name": "Teaching/Tertiary Hospital", "description": "Tertiary care and medical education with 500-2000+ beds", "count": 65, "services": "Super-specialty care, medical education, research"}
        ],
        "priorityPrograms": [
            {"name": "Expanded Programme on Immunization (EPI)", "coverage": "All provinces", "target": "Children under 5 and pregnant women", "challenges": "Refusal, hard-to-reach populations, cold chain gaps"},
            {"name": "Lady Health Worker Programme", "coverage": "Nationwide (primarily rural)", "target": "Rural communities", "challenges": "Urbanization, workforce retention, digital capacity"},
            {"name": "TB DOTS Programme", "coverage": "All provinces", "target": "TB patients and contacts", "challenges": "Case detection gap (37%), MDR-TB, treatment adherence"},
            {"name": "Polio Eradication Initiative", "coverage": "Endemic districts", "target": "Children under 5", "challenges": "Refusal, insecurity, cross-border transmission"},
            {"name": "Hepatitis Control Programme", "coverage": "All provinces", "target": "Hepatitis B and C patients", "challenges": "High prevalence (HCV 5-8%), screening coverage, treatment access"},
            {"name": "Sehat Sahulat Programme", "coverage": "All provinces except Sindh (separate scheme)", "target": "Families below poverty line", "challenges": "Provider fraud, claims processing, benefit awareness"}
        ],
        "codingStandards": [
            {"standard": "ICD-10", "status": "Partially adopted", "usage": "Major hospitals and Sehat Sahulat claims", "challenge": "Limited coding workforce, no Pakistan adaptation"},
            {"standard": "SNOMED CT", "status": "Not adopted", "usage": "Under consideration for clinical data", "challenge": "Licensing, training, and implementation complexity"},
            {"standard": "LOINC", "status": "Not adopted", "usage": "Under discussion for lab standardization", "challenge": "No national lab test catalog"},
            {"standard": "RxNorm/ATC", "status": "ATC partially used", "usage": "DRAP uses ATC for drug classification", "challenge": "No mapping to local drug codes"},
            {"standard": "HL7 FHIR", "status": "Early exploration", "usage": "Pilot projects at AKUH and select hospitals", "challenge": "No national FHIR implementation guide"}
        ],
        "challenges": [
            {"area": "Infrastructure", "description": "Limited health IT infrastructure, especially in rural facilities; frequent power outages; low internet connectivity in remote areas"},
            {"area": "Workforce", "description": "Severe shortage of health informatics professionals; 1 doctor per 1,000 population; health worker distribution skewed toward urban areas"},
            {"area": "Data Quality", "description": "Inconsistent data collection; paper-based records in majority of BHUs; duplicate patient records across facilities"},
            {"area": "Governance", "description": "Post-18th Amendment devolution; fragmented health governance across provinces; no unified health information architecture"},
            {"area": "Interoperability", "description": "Siloed health systems; no national health information exchange; multiple incompatible HMIS implementations"},
            {"area": "Funding", "description": "Health expenditure only 3.2% of GDP; high out-of-pocket spending (56%); limited analytics budget allocation"},
            {"area": "Privacy & Security", "description": "No comprehensive health data privacy legislation; limited cybersecurity capacity in health facilities"},
            {"area": "Cultural", "description": "Gender barriers to healthcare access; low health literacy; resistance to data sharing across institutional boundaries"}
        ]
    }


# ---------------------------------------------------------------------------
# 10. Dependencies
# ---------------------------------------------------------------------------
def generate_dependencies():
    caps = generate_capabilities()
    deps = {}
    strength_cycle = ["critical", "important", "optional"]

    for cap in caps:
        dep_list = []
        for i, res_name in enumerate(cap["fhirResources"]):
            dep_list.append({
                "resourceId": f"FHIR-{hash(res_name) % 157 + 1:03d}",
                "resourceName": res_name,
                "strength": strength_cycle[i % 3]
            })
        deps[cap["id"]] = {
            "capabilityId": cap["id"],
            "capabilityName": cap["name"],
            "dependencies": dep_list
        }
    return deps


# ---------------------------------------------------------------------------
# 11. Index
# ---------------------------------------------------------------------------
def generate_index():
    return {
        "module": "HAIW",
        "fullName": "Healthcare Analytics Intelligence Workbench",
        "version": "1.0.0",
        "dataModel": "HL7 FHIR R5",
        "dataModelVersion": "5.0.0",
        "analyticalOverlay": "Healthcare Clinical Data Model (HCDM)",
        "capabilityFramework": "Healthcare Capability Framework (HCF)",
        "maturityAssessment": "Healthcare Analytics Capability & Readiness (HACR)",
        "resourceCount": 157,
        "hcdmSubjectAreaCount": 12,
        "capabilityCount": 108,
        "maturityQuestionCount": 720,
        "starSchemaTableCount": 24,
        "gapExtensionTableCount": 25,
        "countryContext": "Pakistan",
        "themeColor": "emerald",
        "generatedAt": datetime.now().isoformat()
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("HAIW Data Repository Generator")
    print("Healthcare Analytics Intelligence Workbench")
    print("=" * 70)

    ensure_output_dir()
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}\n")
    print("Generating JSON data files...\n")

    resources = generate_fhir_resources()
    write_json("fhirResources.json", resources)
    print(f"    -> {len(resources)} FHIR R5 resources generated")

    categories = generate_resource_categories()
    write_json("resourceCategories.json", categories)

    subject_areas = generate_hcdm_subject_areas()
    write_json("hcdmSubjectAreas.json", subject_areas)

    capabilities = generate_capabilities()
    write_json("capabilities.json", capabilities)
    print(f"    -> {len(capabilities)} HCF capabilities generated")

    questions = generate_hacr_questions()
    write_json("hacrQuestions.json", questions)
    print(f"    -> {len(questions)} HACR maturity questions generated")

    star_schema = generate_star_schema()
    write_json("starSchema.json", star_schema)
    dim_count = len(star_schema["dimensions"])
    agg_count = len(star_schema["aggregates"])
    view_count = len(star_schema["views"])
    print(f"    -> 1 fact + {dim_count} dimensions + {agg_count} aggregates + {view_count} views")

    gap_ext = generate_gap_extensions()
    write_json("gapExtensions.json", gap_ext)
    table_count = sum(len(m["tables"]) for m in gap_ext)
    print(f"    -> {len(gap_ext)} modules, {table_count} gap extension tables")

    enrichment = generate_enrichment()
    write_json("enrichment.json", enrichment)

    pk_context = generate_pakistan_context()
    write_json("pakistanContext.json", pk_context)

    dependencies = generate_dependencies()
    write_json("dependencies.json", dependencies)

    index = generate_index()
    write_json("index.json", index)

    # Summary
    total_size = 0
    for fname in os.listdir(OUTPUT_DIR):
        if fname.endswith(".json"):
            total_size += os.path.getsize(os.path.join(OUTPUT_DIR, fname))

    print(f"\n{'=' * 70}")
    print(f"All 11 HAIW data files generated successfully!")
    print(f"  Location: {os.path.abspath(OUTPUT_DIR)}")
    print(f"  Total size: {total_size:,} bytes ({total_size / 1024:.1f} KB)")
    print(f"  FHIR Resources: {len(resources)}")
    print(f"  HCF Capabilities: {len(capabilities)}")
    print(f"  HACR Questions: {len(questions)}")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
