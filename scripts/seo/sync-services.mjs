// Build service landing pages from the NorthStar Supabase SEO matrix.
// Reads with the project's publishable key; RLS grants anon SELECT on this public SEO-only table.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const ORIGIN='https://northstardeliveryservice.com';
const QUOTE='https://freightsidekick.com/freight-quote?ref=northstardeliverysolutions';
const DETAILS={
'Refrigerated Freight':['Temperature-controlled freight needs a shipper-defined set point, suitable reefer equipment, a loading plan and appointment coordination.',['Commodity and handling restrictions','Required temperature range and any temperature-recording requirements','Pallet count, dimensions, weight and stackability','Pickup and delivery appointments','Washout, food-grade, seal or pre-cooling requirements'], 'Confirm product compatibility, temperature settings and any food or pharmaceutical handling requirements before dispatch.'],
'Dry Van Freight':['Dry van trailers carry palletized, boxed and other general freight that does not require active temperature control. Dimensions, weight, loading method and appointments help match the shipment to capacity.',['Commodity and exclusions','Pallet count, dimensions, total weight and stackability','Live load, drop trailer or driver-assist needs','Pickup and delivery dates and appointment windows','Dock, trailer length and seal requirements'],'Equipment availability, transit time and service commitments are confirmed for the specific lane and carrier.'],
'Power Only':['Power-only moves pair a tractor and qualified driver with a shipper- or receiver-provided trailer. Trailer condition, coupling compatibility, interchange rules and equipment responsibility must be clear.',['Trailer type, length, condition and identification','Kingpin, fifth-wheel and air/electrical compatibility','Trailer location and release authorization','Loaded or empty status, weight and commodity','Interchange, insurance and responsibility requirements'],'Confirm trailer ownership, roadworthiness, release authority and interchange requirements before dispatch.'],
'Bulk Freight':['Bulk shipments require equipment matched to the commodity and the loading and unloading sites. Material type, contamination controls, access and carrier qualifications determine suitability.',['Exact commodity and handling restrictions','Trailer or tank specification and prior-load restrictions','Estimated weight, volume and loading method','Site access and discharge method','Cleaning, washout, food-grade or hazmat requirements'],'Commodity acceptance, equipment, cleaning and regulatory requirements must be reviewed before dispatch.'],
'Flatbed Freight':['Open-deck freight requires a plan for deck space, dimensions, weight distribution, loading access and securement. Trailer configuration depends on cargo and facility conditions.',['Cargo dimensions, weight and center of gravity','Crane, forklift, side-load or top-load method','Trailer type, deck length, side kit or tarp needs','Securement and weather-protection requirements','Oversize dimensions, permits and escort needs'],'Securement, legal dimensions, permits and route feasibility must be verified for the actual shipment.'],
'Heavy Haul Freight':['Heavy and over-dimensional freight needs a review of loaded dimensions, axle weights, trailer configuration, permits and route constraints. Trailer type alone does not establish legal feasibility.',['Verified cargo dimensions and weight','Deck height, well length, axle configuration and capacity','Origin, destination and route constraints','Permit jurisdiction, bridge restrictions and escort needs','Loading equipment and site access'],'Carrier and permitting specialists must validate the loaded configuration and route; this page is not a permit determination.'],
'Specialized Freight':['Specialized shipments may need equipment or handling beyond a standard dry van. Cargo measurements, loading requirements, site conditions and carrier qualifications determine suitable capacity.',['Cargo description, dimensions, weight and sensitivity','Required trailer or vehicle configuration','Loading and unloading equipment','Tie-down, protection or special handling needs','Site access, delivery schedule and regulatory requirements'],'Equipment availability and acceptance depend on shipment details and carrier confirmation.'],
'Specialized Flatbed':['Conestoga trailers combine an open-deck platform with a rolling tarp system that can protect suitable freight while preserving side-loading access. Confirm the actual trailer system and usable dimensions for each move.',['Cargo dimensions, weight and loading orientation','Required covered dimensions and tarp clearance','Forklift, crane or side-loading access','Securement, edge protection and weather exposure','Pickup and delivery facility restrictions'],'Conestoga equipment and interior clearance vary by trailer. Confirm measurements, tarp operation and carrier availability before booking.'],
'Intermodal Freight':['Intermodal and drayage shipments connect containers with rail terminals, ports, warehouses and distribution facilities. Appointments, container details, chassis arrangements and free-time deadlines matter.',['Container size/type and loaded or empty status','Terminal, ramp or port location and appointments','Chassis source, split requirements and interchange rules','Last free day, demurrage, per-diem and storage terms','Weight, seal and receiving-facility requirements'],'Terminal availability, free time, chassis supply and port or rail charges must be confirmed for the shipment.'],
'Freight Brokerage':['A freight brokerage coordinates transportation between a shipper and an authorized motor carrier. A clear shipment profile and verification of service requirements support a workable move.',['Origin, destination and pickup/delivery dates','Commodity, dimensions, weight and pallet count','Equipment and special handling requirements','Loading/unloading conditions and accessorials','Facility contacts and shipping documents'],'Quotes and capacity depend on lane, dates, cargo details, carrier availability and final confirmation.']
};
const PAGE_GUIDES = {
  "reefer-freight-brokerage-services": {
    "lead": "A refrigerated trailer is a temperature-management system, not simply an insulated van. The shipment plan needs to protect the product from loading through delivery, with the shipper's written handling instructions controlling the move.",
    "fit": "Produce, dairy, frozen foods and other commodities whose approved shipping instructions require a controlled trailer environment. Product compatibility and carrier acceptance must be checked before a rate is finalized.",
    "check": [
      "Exact commodity, packaging and whether the product is chilled, frozen or otherwise temperature-sensitive",
      "Written set point and permitted range; whether continuous or start/stop operation is specified",
      "Whether the unit must be pre-cooled, and who verifies pulp or product temperature at loading",
      "Airflow needs, pallet pattern, blocked return-air channels and load-bar requirements",
      "Washout, sanitation, odor, seal, temperature-recording requirements and receiver-report documentation"
    ],
    "steps": [
      "Agree on the set point and operating mode in writing before dispatch; never infer a temperature from the commodity name alone",
      "Confirm trailer cleanliness, pre-trip inspection, fuel level and reefer operating status before loading",
      "Record product condition and any shipper-supplied temperature reading at handoff",
      "Confirm monitoring, breakdown escalation, appointment windows and temperature-record delivery"
    ],
    "risk": "A reefer set point is not proof that the product itself was loaded at that temperature. Clarify who measures product temperature, what records travel with the load, and who must be called if the unit alarms or the reading moves outside the agreed range.",
    "faqs": [
      [
        "Does every refrigerated load use the same temperature?",
        "No. The shipper's commodity-specific written instructions determine the set point and acceptable range."
      ],
      [
        "Should a reefer trailer be pre-cooled?",
        "Only as specified by the shipper and product protocol. Confirm whether pre-cooling is required and how it will be verified."
      ],
      [
        "What should be documented?",
        "At minimum, the agreed settings, product and trailer condition at handoff, seal details where applicable, and any required temperature records."
      ]
    ]
  },
  "team-reefer-freight-capacity": {
    "lead": "Team service changes the driving schedule; it does not replace the temperature-control plan. A team reefer move still needs an agreed set point, continuous reefer operation, product-handling instructions and a clear exception process.",
    "fit": "Time-sensitive refrigerated shipments where the shipper's delivery window and route justify team-driver capacity, subject to actual lane coverage and driver availability.",
    "check": [
      "All reefer details: commodity, written set point, acceptable range and operating mode",
      "Hard delivery appointment, earliest pickup, transit deadline and realistic route distance",
      "Whether team drivers can access both facilities and meet appointment/security rules",
      "Reefer fuel, pre-cooling, monitoring and breakdown escalation responsibilities",
      "Required temperature reports, seals, washout and receiver paperwork"
    ],
    "steps": [
      "Validate the appointment and route before describing the shipment as expedited",
      "Confirm team-driver capacity and hours-of-service feasibility for the actual lane",
      "Keep reefer settings and monitoring requirements in the dispatch instructions",
      "Agree on who notifies the shipper if weather, traffic, equipment or appointment changes threaten delivery"
    ],
    "risk": "A team does not guarantee a delivery time. Do not promise a transit window until route, appointment, driver availability, hours-of-service and reefer requirements have been confirmed.",
    "faqs": [
      [
        "Does team service guarantee same-day or nonstop delivery?",
        "No. It may reduce planned driving pauses, but actual transit depends on the lane, appointments, legal driving limits, weather and capacity."
      ],
      [
        "Does team service change temperature requirements?",
        "No. The commodity's written reefer instructions still govern."
      ],
      [
        "What makes a team reefer quote different?",
        "It must account for team capacity and schedule feasibility as well as reefer equipment, settings and product-handling requirements."
      ]
    ]
  },
  "dry-van-freight-brokerage": {
    "lead": "Dry vans protect freight from ordinary road weather and provide an enclosed space for general commodities. Trailer length alone is not enough to confirm fit: usable dimensions, door opening, payload, pallet pattern and loading method all matter.",
    "fit": "Palletized or boxed non-temperature-controlled freight that fits the confirmed trailer and does not require open-deck, bulk, tank or specialized handling.",
    "check": [
      "Commodity, packaging, pallet count, dimensions, gross weight and stackability",
      "Pallet footprint and loading pattern; confirm whether freight is floor-loaded or palletized",
      "Dock height, door clearance, forklift access and live-load or drop-trailer plan",
      "Appointment windows, driver assist, inside delivery, liftgate or other accessorials",
      "Seal, load bars, blocking/bracing, fragile or crush-sensitive handling instructions"
    ],
    "steps": [
      "Send dimensions and weights by handling unit, not only a shipment total",
      "Check pallet pattern and usable trailer space before assuming the load fits",
      "Confirm loading/unloading method, facility hours and detention terms",
      "List all accessorials and special handling in the quote and rate confirmation"
    ],
    "risk": "A shipment can be under a trailer's weight limit and still fail to fit because of pallet orientation, door clearance, height, uneven weight distribution or loading access.",
    "faqs": [
      [
        "How many pallets fit in a dry van?",
        "It depends on trailer dimensions, pallet footprint, orientation, weight, stackability and loading rules. Provide the actual pallet dimensions for a fit check."
      ],
      [
        "Can dry vans haul temperature-sensitive freight?",
        "A standard dry van does not actively control temperature. Use the shipper's product requirements to determine whether reefer equipment is necessary."
      ],
      [
        "What causes extra charges?",
        "Unreported driver assist, detention, re-delivery, limited access, special appointment or other accessorial requirements can change the final cost."
      ]
    ]
  },
  "team-dry-van-freight": {
    "lead": "Team dry-van capacity is intended for shipments with a demanding transit schedule, while the enclosed trailer continues to serve as general freight equipment. The schedule must be checked against the actual lane and receiving appointment.",
    "fit": "Non-temperature-controlled freight with a time-sensitive pickup-to-delivery plan where team-driver capacity is available and the route is feasible.",
    "check": [
      "Origin, destination, ready time and firm delivery appointment",
      "Commodity, pallet pattern, total dimensions, weight and trailer fit",
      "Facility loading speed, appointment rules and after-hours receiving",
      "Team-driver availability and legal hours-of-service feasibility",
      "Seal, tracking, cargo-security and proof-of-delivery requirements"
    ],
    "steps": [
      "Confirm the receiver can accept the planned arrival, including after-hours rules",
      "Build the schedule around loading and unloading time, not mileage alone",
      "Verify team capacity before committing to an expedited transit estimate",
      "Set a clear update and exception-notification process"
    ],
    "risk": "Team drivers do not eliminate dock delays, appointment restrictions, traffic or legal rest requirements. Quote only a schedule that the lane and facilities can support.",
    "faqs": [
      [
        "Is team dry van always faster?",
        "Not automatically. It can reduce some driving pauses, but loading delays, route conditions and appointment windows still control delivery."
      ],
      [
        "Does team service increase trailer capacity?",
        "No. The trailer's dimensions, payload and loading constraints remain the same."
      ],
      [
        "What details are needed to quote it?",
        "The shipment profile plus ready time, delivery deadline, appointments and facility operating hours."
      ]
    ]
  },
  "power-only-freight-services": {
    "lead": "Power-only transportation supplies the tractor and qualified driver while the customer or another party supplies the trailer. The move depends on a safe, compatible trailer and documented authority to pick it up and interchange it.",
    "fit": "Moves where a shipper, receiver or fleet controls the trailer and needs a tractor/driver to reposition or haul it, including approved drop-and-hook arrangements.",
    "check": [
      "Trailer owner, authorized release contact, trailer number and exact location",
      "Trailer type, length, loaded/empty status, gross weight and cargo description",
      "Tire, brake, lights, coupling, kingpin, landing gear and air/electrical condition",
      "Fifth-wheel height/compatibility and tractor connection requirements",
      "Interchange agreement, insurance allocation, inspection photos and responsibility for damage"
    ],
    "steps": [
      "Obtain written release authority and confirm the trailer is where the driver will collect it",
      "Inspect and document trailer condition before coupling; report defects rather than move unsafe equipment",
      "Confirm who supplies and pays for chassis, permits, tolls or special equipment if relevant",
      "Record interchange time, trailer number, condition and delivery handoff"
    ],
    "risk": "Do not assume a trailer is roadworthy, insured or authorized for interchange because it is sitting at a yard. Confirm ownership, release authority, condition and responsibility in writing.",
    "faqs": [
      [
        "Does power-only include the trailer?",
        "No. The customer or another party supplies the trailer; the power-only carrier supplies the tractor and driver."
      ],
      [
        "Who is responsible for trailer condition?",
        "Responsibility depends on the contract and interchange terms. Inspect and document condition at pickup and delivery."
      ],
      [
        "Can any tractor pull any trailer?",
        "No. Coupling geometry, fifth-wheel height, air/electrical connections, weight and regulatory requirements must be compatible."
      ]
    ]
  },
  "tanker-freight-brokerage": {
    "lead": "Liquid bulk transportation requires a tank matched to the product, the loading system and the receiving facility. Product compatibility, previous cargo, cleaning, temperature, pressure and unloading connections can determine whether a tanker is acceptable.",
    "fit": "Approved liquid or other bulk commodities for which the shipper's specification and carrier authority permit the selected tank and handling method.",
    "check": [
      "Exact product name, safety data and any hazardous-material classification",
      "Food-grade, chemical-grade, dedicated or product-specific tank requirements",
      "Tank material, lining, compartments, capacity and operating limits",
      "Prior cargo, wash certificate, inspection and cleanliness documentation",
      "Loading/unloading temperature, pressure, hose, fitting, pump and vapor-recovery needs"
    ],
    "steps": [
      "Obtain the product specification and safety data before requesting capacity",
      "Match tank construction, lining and prior-load restrictions to the product",
      "Confirm loading and unloading connections, site procedures and cleaning documentation",
      "Verify carrier authority, driver qualifications, insurance and applicable regulatory requirements"
    ],
    "risk": "A tanker's nominal capacity does not establish product compatibility. Never infer hazmat status, food-grade suitability, tank pressure rating or cleaning acceptance; obtain shipper and carrier confirmation.",
    "faqs": [
      [
        "Can one tanker haul every liquid?",
        "No. Tank material, lining, prior cargo, product compatibility and operating requirements vary."
      ],
      [
        "Is a wash ticket always enough?",
        "Not necessarily. The shipper may require a particular wash facility, certificate, inspection or dedicated equipment."
      ],
      [
        "What is needed before a quote?",
        "Product identity, safety information, volume/weight, tank specification, temperature or pressure needs, and loading/unloading details."
      ]
    ]
  },
  "hopper-bottom-freight": {
    "lead": "Hopper-bottom trailers discharge dry bulk through bottom gates into a receiving pit or compatible unloading system. The site must be able to accept the trailer and the commodity must flow safely through the equipment.",
    "fit": "Eligible dry bulk such as grain, feed ingredients, fertilizer or other shipper-approved materials, subject to trailer, contamination and facility requirements.",
    "check": [
      "Exact commodity, grade, moisture sensitivity and contamination restrictions",
      "Required trailer volume and payload, with legal weight and axle distribution",
      "Gate configuration, discharge opening and receiving pit compatibility",
      "Tarp, weather protection, food/feed-grade cleaning and prior-load restrictions",
      "Loadout method, unload time, site access, overhead clearance and pit operating hours"
    ],
    "steps": [
      "Confirm the receiver has a compatible pit and can unload the trailer configuration",
      "Check commodity-specific cleanliness and prior-load requirements before loading",
      "Verify weight distribution and legal axle weights at the shipper's scale",
      "Agree on tarp, seal, sampling, scale tickets and unloading documentation"
    ],
    "risk": "A hopper trailer cannot discharge into every facility. Verify pit dimensions, gate arrangement, overhead clearance and site procedures before dispatch.",
    "faqs": [
      [
        "What does a hopper-bottom trailer need at delivery?",
        "A compatible receiving pit or unloading system, adequate site access and a clear procedure for opening and securing gates."
      ],
      [
        "Can hopper trailers carry any dry bulk?",
        "No. Commodity compatibility, cleanliness, moisture protection and prior-load restrictions must be checked."
      ],
      [
        "How is load weight confirmed?",
        "Use the shipper/receiver scale process and confirm gross, tare and axle weights against applicable limits."
      ]
    ]
  },
  "bottom-dump-freight-hauling": {
    "lead": "Bottom-dump trailers release material through bottom gates while moving or positioned over a suitable receiving area. The work is highly site-dependent: ground conditions, overhead clearance, discharge method and traffic control affect whether the trailer can operate safely.",
    "fit": "Approved aggregate, sand, gravel, asphalt-related or construction materials where the job site or plant is designed for bottom-dump delivery.",
    "check": [
      "Material type, gradation, moisture and required quantity",
      "Trailer configuration, gate controls and discharge pattern",
      "Site surface, slope, turning radius, overhead obstructions and access route",
      "Whether material is spread while moving or discharged at a stationary point",
      "Traffic control, spotter, PPE, washout and job-site operating rules"
    ],
    "steps": [
      "Confirm the site accepts bottom-dump equipment and identify the unloading location",
      "Review access route, grade, overhead lines, turning space and ground stability",
      "Agree on discharge sequence, spotter/traffic control and communication signals",
      "Confirm scale tickets, delivery quantity and proof-of-delivery process"
    ],
    "risk": "Never assume a construction site can safely accept a bottom-dump trailer. A poor grade, soft shoulder, overhead obstruction or incompatible receiving area can create serious tip-over and contact hazards.",
    "faqs": [
      [
        "Is bottom dump the same as end dump?",
        "No. Bottom-dump trailers discharge through gates underneath; end dumps raise the trailer body to unload and have different site and stability requirements."
      ],
      [
        "Can a bottom dump unload anywhere?",
        "No. Site geometry, ground conditions, clearance and discharge method must be suitable."
      ],
      [
        "What information should the shipper provide?",
        "Material, quantity, site address, access route, unloading surface, discharge method and job-site safety rules."
      ]
    ]
  },
  "dump-truck-freight-services": {
    "lead": "Dump-truck work is often tied to a specific job site, material and delivery sequence rather than a simple point-to-point trailer move. Matching body type, payload, access and cycle time is essential.",
    "fit": "Local or regional movement of approved construction, aggregate, soil or similar bulk materials where the site can accept the selected dump-truck configuration.",
    "check": [
      "Material type, volume or tons per load and any contamination limits",
      "Truck/body configuration and legal payload for the route",
      "Loading equipment, queue time, site entrance and turning space",
      "Dump location, grade, ground bearing conditions and overhead clearance",
      "Required PPE, site induction, spotter, traffic control and delivery tickets"
    ],
    "steps": [
      "Confirm the job-site entrance and dump location are accessible to the actual truck size",
      "Agree on whether the work is one-way delivery, repeated cycles or time-based service",
      "Define loading and unloading windows, standby/detention and scale-ticket handling",
      "Set the process for weather shutdowns, site closures and rejected material"
    ],
    "risk": "A truck that can reach the site may still be unable to dump safely. Confirm ground stability, slope, overhead clearance and site supervision before work begins.",
    "faqs": [
      [
        "What determines dump-truck capacity?",
        "Body configuration, material density, legal axle weights and route limits. Volume alone does not determine legal payload."
      ],
      [
        "Can a dump truck work on any construction site?",
        "No. Access, turning space, overhead clearance, ground conditions and unloading procedure must be checked."
      ],
      [
        "How are repeated trips priced?",
        "The quote should define the expected cycle, loading/unloading time, standby terms, quantity and any site-related delays."
      ]
    ]
  },
  "auto-transport-trailer-freight": {
    "lead": "Vehicle transport requires a loading plan for each vehicle, including dimensions, running condition, ground clearance and securement points. The trailer's number of positions is not a guarantee that every vehicle combination will fit.",
    "fit": "Cars, pickups, SUVs, vans or other approved vehicles that fit the selected carrier's deck, ramp, clearance and weight limits.",
    "check": [
      "Year, make, model, dimensions, approximate weight and modifications",
      "Operable, inoperable, non-running, damaged or salvage status",
      "Ground clearance, tire condition, steering/braking and loading access",
      "Pickup/delivery access for a multi-car transporter and any height restrictions",
      "Keys, personal-property policy, condition photos, inspection and bill of lading"
    ],
    "steps": [
      "Disclose modifications, oversized tires, lift kits, low clearance and non-running condition before booking",
      "Confirm the pickup and delivery locations can accommodate the transporter",
      "Photograph and document pre-existing damage and vehicle condition at handoff",
      "Agree on keys, loading method, delivery inspection and claim-notification procedure"
    ],
    "risk": "Vehicle condition and dimensions affect loading order and equipment suitability. Never assume a vehicle is accepted based only on its make/model or that personal belongings are covered.",
    "faqs": [
      [
        "Can an inoperable vehicle be transported?",
        "Sometimes, if the carrier has suitable winch or loading capability and the vehicle's condition is disclosed and accepted."
      ],
      [
        "Can I leave personal items in the vehicle?",
        "Policies vary and personal items may be excluded or uninsured. Confirm the carrier's written policy before pickup."
      ],
      [
        "What is the condition report for?",
        "It records vehicle condition at pickup and delivery and helps distinguish pre-existing damage from damage reported after transport."
      ]
    ]
  },
  "rail-intermodal-drayage-freight": {
    "lead": "Drayage connects a port or rail ramp with a warehouse, distribution center or another transfer point. Terminal availability, appointment slots, container status, chassis supply and free-time deadlines can matter as much as road distance.",
    "fit": "Container moves that begin or end at a port, rail ramp or intermodal facility and require local or regional drayage.",
    "check": [
      "Container size/type, number, loaded or empty status and verified gross weight",
      "Terminal/ramp, release status, booking or pickup number and last free day",
      "Chassis source, size, availability, split, tri-axle or special chassis need",
      "Appointment availability, gate hours, pre-pull and return location",
      "Demurrage, per diem, storage, bobtail, chassis split and waiting-time terms"
    ],
    "steps": [
      "Confirm the container is released and eligible for pickup before dispatch",
      "Check terminal appointment, chassis plan and empty-return location",
      "Record last free day and identify who is responsible for charges if a delay occurs",
      "Capture interchange condition, seal, container number and delivery receipt"
    ],
    "risk": "A truck appointment is not proof that the container is released or that a chassis is available. Verify both and put free-time responsibility and accessorial terms in writing.",
    "faqs": [
      [
        "What is the difference between demurrage and per diem?",
        "Demurrage is generally a terminal/port charge for cargo or a container remaining beyond free time; per diem is commonly a charge for use of carrier equipment beyond the allowed period. Contract and facility terms control."
      ],
      [
        "What is a chassis split?",
        "A separate movement may be needed to obtain or return a chassis at a different location. Confirm the applicable fee and who pays it."
      ],
      [
        "What is needed for a drayage quote?",
        "Container details, terminal, release and appointment status, chassis requirements, delivery site, free-time dates and empty-return instructions."
      ]
    ]
  },
  "flatbed-freight-brokerage": {
    "lead": "Flatbed freight is exposed to weather and requires a cargo-specific securement plan. Deck length and payload are only part of the fit check; loading access, center of gravity, tie-down points and route restrictions matter.",
    "fit": "Machinery, building materials, steel, lumber and other freight that can be safely loaded, protected and secured on an open deck.",
    "check": [
      "Piece-by-piece dimensions, weight, shape and center of gravity",
      "Deck length/width, axle configuration and usable deck space",
      "Top-load, side-load, crane/forklift access and facility restrictions",
      "Chains, straps, edge protection, blocking, bracing and tarp requirements",
      "Oversize dimensions, permits, escorts, route restrictions and weather exposure"
    ],
    "steps": [
      "Provide a load diagram or photos for unusual shapes and concentrated weights",
      "Confirm securement method and who supplies chains, straps, tarps and edge protection",
      "Check loaded dimensions and axle weights before the truck leaves",
      "Document loading, securement, tarping and delivery condition"
    ],
    "risk": "Cargo securement must match the cargo and applicable rules; a generic strap count is not a safe plan. Oversize status depends on loaded dimensions and jurisdiction-specific limits.",
    "faqs": [
      [
        "Does every flatbed load need a tarp?",
        "No. Tarping depends on cargo, shipper instructions, weather exposure and contract. Specify tarp type and dimensions if required."
      ],
      [
        "What information helps confirm flatbed fit?",
        "Piece dimensions, weight, center of gravity, loading orientation, securement points and facility loading method."
      ],
      [
        "Who handles permits for oversize freight?",
        "The shipment plan must identify who obtains permits and coordinates escorts; responsibilities and timing should be agreed before dispatch."
      ]
    ]
  },
  "flatbed-with-sides-freight": {
    "lead": "A flatbed with removable or fixed sides can help contain certain cargo, but side height and construction do not replace proper blocking, bracing and tie-downs. Confirm the exact trailer configuration rather than relying on a generic equipment label.",
    "fit": "Freight that benefits from side containment or needs an open-deck loading method while remaining within the trailer's verified dimensions and capacity.",
    "check": [
      "Exact side height, length, gate arrangement and usable deck dimensions",
      "Cargo dimensions, weight, stackability and lateral movement risk",
      "Whether side panels are rated/approved for the intended containment role",
      "Loading method, forklift access, crane access and unload sequence",
      "Independent securement, tarp, weather and facility restrictions"
    ],
    "steps": [
      "Request trailer photos or specifications where side configuration affects loading",
      "Confirm cargo cannot shift, climb or overload side panels",
      "Specify independent tie-down and blocking requirements",
      "Inspect side gates, latches and deck before loading and document condition"
    ],
    "risk": "Side panels are not automatically load-bearing securement devices. Confirm their intended function and use an appropriate independent securement plan.",
    "faqs": [
      [
        "Do trailer sides secure the freight by themselves?",
        "No. Do not treat side panels as a substitute for rated tie-downs, blocking or bracing."
      ],
      [
        "Can all flatbed freight use a side-kit trailer?",
        "No. Cargo dimensions, loading method, side configuration and securement requirements must be compatible."
      ],
      [
        "What should be checked before dispatch?",
        "Actual side height and condition, deck dimensions, cargo measurements, load method and securement plan."
      ]
    ]
  },
  "team-flatbed-freight": {
    "lead": "Team flatbed service combines open-deck securement requirements with a schedule that may use two drivers. Time-sensitive routing does not reduce the need for safe loading, inspections, permits or securement checks.",
    "fit": "Open-deck freight with a firm delivery requirement where the loaded dimensions, route and carrier capacity support team operation.",
    "check": [
      "Cargo dimensions, weight, center of gravity and securement plan",
      "Deck type and length, loading access and tarp/cover requirements",
      "Ready time, delivery appointment and route feasibility",
      "Oversize permits, escort requirements and restrictions for the complete route",
      "Team-driver availability, legal hours-of-service and securement recheck plan"
    ],
    "steps": [
      "Confirm the shipment can be loaded and secured before the team schedule begins",
      "Validate permits and route restrictions for the actual loaded configuration",
      "Set realistic appointment and transit milestones with contingency time",
      "Plan safe stops for inspection and securement checks"
    ],
    "risk": "A team arrangement cannot bypass permit restrictions, securement inspections, facility hours or hours-of-service rules. Do not promise a delivery deadline before those checks.",
    "faqs": [
      [
        "Does a team flatbed move eliminate securement stops?",
        "No. Cargo securement must be checked as required and whenever conditions warrant."
      ],
      [
        "Can team service move oversize freight faster?",
        "The team may affect driving time, but permits, escorts, route windows and site appointments still govern."
      ],
      [
        "What makes the quote complete?",
        "Cargo measurements, loading plan, securement/tarp needs, permits, route, appointments and team availability."
      ]
    ]
  },
  "step-deck-freight-brokerage": {
    "lead": "A step-deck trailer has an upper deck and a lower main deck, allowing some taller cargo to ride lower than it would on a standard flatbed. The lower deck can improve vertical clearance, but usable dimensions and axle configuration must be confirmed.",
    "fit": "Tall machinery, industrial equipment and other open-deck freight that benefits from a lower deck height and fits the specific trailer configuration.",
    "check": [
      "Cargo length, width, height and weight, including protrusions and accessories",
      "Lower-deck length, height, ramps and upper-deck interference",
      "Loaded overall height and applicable route clearance limits",
      "Axle weights, load placement, tie-down points and center of gravity",
      "Loading method, permits, escorts and origin/destination access"
    ],
    "steps": [
      "Compare cargo height with the actual lower-deck height and available length",
      "Calculate loaded overall height before route planning",
      "Check bridge, utility, rail and construction clearance along the route",
      "Confirm ramps, loading equipment and securement plan with the carrier"
    ],
    "risk": "A step deck does not automatically make a load legal. Loaded height, width, length, axle weights and route-specific restrictions must all be reviewed.",
    "faqs": [
      [
        "When is a step deck preferable to a flatbed?",
        "When the cargo benefits from the lower main deck or a two-level deck layout, subject to actual measurements."
      ],
      [
        "Does a step deck eliminate oversize permits?",
        "No. Permit needs depend on loaded dimensions, weights and jurisdiction-specific rules."
      ],
      [
        "What is the key measurement?",
        "The loaded overall height from road surface to the highest point, calculated using the actual trailer and load position."
      ]
    ]
  },
  "rgn-heavy-equipment-freight": {
    "lead": "A removable gooseneck (RGN) trailer can lower its front deck to create a ramp for loading certain heavy equipment. Trailer configuration, deck well, axle capacity, ground clearance and loading surface determine whether the equipment can be moved safely.",
    "fit": "Heavy machinery and equipment that can be loaded onto the selected RGN configuration and whose loaded dimensions and weights can be permitted and routed.",
    "check": [
      "Machine make/model, operating weight and transport dimensions",
      "Attachments, buckets, booms, counterweights and whether components can be removed",
      "RGN deck/well length, width, height, axle group and ramp/loading limits",
      "Ground clearance, track/wheel condition and whether machine can self-load",
      "Loaded axle weights, permits, escorts, route and bridge/overhead restrictions"
    ],
    "steps": [
      "Collect manufacturer specifications and verify actual configuration and attachments",
      "Confirm the machine can travel onto the deck safely and identify who operates it",
      "Develop a loading, blocking, chaining and securement plan with the carrier",
      "Check loaded dimensions, axle weights, permits, route and site access before dispatch"
    ],
    "risk": "Operating weight from a brochure may exclude attachments, fuel or installed options. Use actual transport configuration and carrier measurements; never assume the RGN makes an oversized load permit-free.",
    "faqs": [
      [
        "What equipment is commonly moved on an RGN?",
        "Suitable excavators, loaders, dozers and other machinery, depending on dimensions, weight and loading method."
      ],
      [
        "Can every machine drive onto an RGN?",
        "No. Ground clearance, track/wheel condition, ramp angle and machine operation must be checked."
      ],
      [
        "Are permits always required?",
        "Not always, but loaded dimensions and axle weights must be checked against each jurisdiction's limits."
      ]
    ]
  },
  "double-drop-trailer-freight": {
    "lead": "A double-drop trailer has a lowered center well between raised deck sections. That well can accommodate tall cargo, but its length, width, deck height and transition geometry are critical to fit.",
    "fit": "Tall industrial equipment, machinery and other cargo whose height or loading shape suits the specific double-drop configuration.",
    "check": [
      "Cargo length, width, height, weight and center of gravity",
      "Well length, width and height; front/rear deck dimensions",
      "Clearance at gooseneck and rear transition points",
      "Loading method, ramp needs, ground clearance and tie-down points",
      "Loaded overall height, axle weights, permits, escorts and route restrictions"
    ],
    "steps": [
      "Compare the full cargo footprint to the well and transition geometry",
      "Check whether the cargo can be loaded without contacting raised deck sections",
      "Confirm axle placement and securement with the carrier",
      "Verify loaded dimensions and route clearances before pickup"
    ],
    "risk": "A cargo item may fit inside the well but still interfere with the raised decks or exceed legal loaded height. Review a dimensioned drawing or photos before dispatch.",
    "faqs": [
      [
        "How is a double drop different from an RGN?",
        "Both provide a low deck area, but trailer structure, loading method and deck geometry differ. Select by cargo fit and carrier specification."
      ],
      [
        "Does a double drop always carry taller freight?",
        "It can lower the cargo position, but usable well dimensions and loaded height determine suitability."
      ],
      [
        "What measurements are essential?",
        "Cargo footprint and height, well dimensions, transition clearance, loaded height and axle weights."
      ]
    ]
  },
  "conestoga-freight-services": {
    "lead": "A Conestoga uses a rolling tarp system over an open-deck-style trailer. It can combine weather protection with access that may be easier than conventional tarping, but the system's interior clearance and operating condition must match the freight.",
    "fit": "Freight that needs protection from weather or road debris while requiring open-deck loading characteristics, provided the cargo fits beneath the specific tarp system.",
    "check": [
      "Cargo dimensions and weight, including top projections and loading orientation",
      "Usable interior height, width and length with the tarp system closed",
      "Side/top loading method and clearance for forklifts or cranes",
      "Tarp travel, bows, rails, seals and condition of the cover system",
      "Securement, edge protection, weather exposure and facility restrictions"
    ],
    "steps": [
      "Obtain actual interior dimensions; do not assume all Conestoga trailers are identical",
      "Confirm whether cargo can be loaded with the system open and closed safely",
      "Verify tarp operation and inspect for tears, damaged bows or obstructions",
      "Complete independent securement before closing and document cargo protection"
    ],
    "risk": "A rolling tarp is weather protection, not cargo securement. Check the trailer's actual clearance and condition and secure the freight independently.",
    "faqs": [
      [
        "Is a Conestoga the same as a standard flatbed with a tarp?",
        "No. It uses a rolling cover system integrated with the trailer, with different clearance and operating constraints."
      ],
      [
        "Can a Conestoga carry any flatbed load?",
        "No. Cargo must fit within the system's interior clearance and loading configuration."
      ],
      [
        "Does the cover replace straps or chains?",
        "No. Cargo still needs an appropriate independent securement plan."
      ]
    ]
  },
  "container-chassis-freight-services": {
    "lead": "A container chassis is a specialized frame designed to carry a shipping container between a terminal, rail ramp, warehouse or other approved location. Container size, chassis configuration, gross weight and interchange rules must align.",
    "fit": "Container moves where the correct chassis is available and the route, terminal and receiving facility can accept the equipment.",
    "check": [
      "Container length/type, loaded status, verified gross weight and seal",
      "Chassis size, capacity, axle configuration and any tri-axle requirement",
      "Terminal or ramp pickup/return location and interchange rules",
      "Chassis provider, split, rental period, inspection and damage documentation",
      "Appointment, free-time deadline, overweight routing and empty-return instructions"
    ],
    "steps": [
      "Confirm the container size and chassis compatibility before dispatch",
      "Verify release status, terminal appointment and pickup reference",
      "Inspect chassis, tires, lights, brakes, twist locks and visible frame condition",
      "Record interchange condition, container number, seal and empty-return receipt"
    ],
    "risk": "A chassis shortage, wrong size or incompatible axle configuration can stop a move even when a tractor is available. Confirm the chassis plan and all interchange locations in advance.",
    "faqs": [
      [
        "Does every container fit every chassis?",
        "No. Chassis length, container type, weight and securement points must match."
      ],
      [
        "What is a tri-axle chassis for?",
        "It may be required for heavier container loads or specific weight distribution; route and jurisdiction limits still apply."
      ],
      [
        "What should be recorded at interchange?",
        "Chassis and container identifiers, condition, seal, time, terminal receipt and any damage noted."
      ]
    ]
  },
  "nationwide-freight-brokerage-equipment-types": {
    "lead": "Equipment selection should begin with the freight, not a generic list of trailer names. Dimensions, weight, commodity, loading method, delivery deadline and facility capability determine which transportation option is appropriate.",
    "fit": "Shippers comparing common truckload and specialized equipment options or preparing a shipment profile before requesting capacity.",
    "check": [
      "Commodity, packaging, handling restrictions and declared value",
      "Piece-level dimensions, total weight, pallet count and stackability",
      "Temperature, tank, bulk, open-deck, vehicle or container requirements",
      "Pickup/delivery site access, docks, cranes, ramps, pits and appointment windows",
      "Route, deadline, permits, accessorials and required documentation"
    ],
    "steps": [
      "Start with cargo measurements and handling requirements",
      "Shortlist only equipment that physically and operationally fits",
      "Confirm carrier qualifications, equipment condition, insurance and route feasibility",
      "Put pricing assumptions, accessorials, appointments and service commitments in writing"
    ],
    "risk": "Equipment categories are not interchangeable. A lower quote is not comparable if it assumes a different trailer, loading method, service level or accessorial package.",
    "faqs": [
      [
        "How do I choose between dry van, reefer and flatbed?",
        "Use the product's temperature needs, packaging, loading access and exposure requirements—not price alone."
      ],
      [
        "When is specialized equipment necessary?",
        "When cargo dimensions, weight, shape, handling, bulk discharge or terminal requirements cannot be met by standard equipment."
      ],
      [
        "What should I send for an accurate quote?",
        "Origin/destination, dates, commodity, dimensions, weights, photos or drawings, loading method, appointments and any special requirements."
      ]
    ]
  }
};
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const valid=s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s||''));
const url=s=>ORIGIN+'/freight-services/'+s+'/';
export function renderPage(r,related){
 if(!valid(r.slug)) throw Error('Invalid slug '+r.slug);
 const d=DETAILS[r.service_category]; if(!d) throw Error('Unsupported category '+r.service_category);
 const g=PAGE_GUIDES[r.slug];
 const title=esc(r.meta_title||r.target_keyword+' | NorthStar Delivery');
 const desc=esc(r.meta_description||'Discuss '+r.target_keyword+' with NorthStar Delivery.');
 const same=related.filter(x=>x.slug!==r.slug);
 const links=[...same.filter(x=>x.service_category===r.service_category),...same.filter(x=>x.service_category!==r.service_category)].slice(0,5);
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'Service',name:r.target_keyword,serviceType:r.service_category,description:r.meta_description,provider:{'@type':'Organization',name:'NorthStar Delivery Solutions LLC',url:ORIGIN},areaServed:{'@type':'Country',name:'United States'},url:url(r.slug)}).replaceAll('<','\\\\u003c');
 const list=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 const section=(heading,body)=>'<section><h2>'+heading+'</h2>'+body+'</section>';
 const faq=(items)=>items.map(([q,a])=>'<h3>'+esc(q)+'</h3><p>'+esc(a)+'</p>').join('');
 const lead=g?.lead||d[0],fit=g?.fit||d[2],check=g?.check||d[1],steps=g?.steps||['Confirm shipment details and equipment requirements before dispatch','Verify loading, unloading, appointment and documentation requirements','Agree on service expectations and exception contacts'],risk=g?.risk||d[2],faqs=g?.faqs||[['What information is needed for a freight quote?','Provide origin, destination, dates, commodity, dimensions, total weight, equipment type and loading or appointment requirements.'],['Is capacity guaranteed?','No. Availability, carrier qualifications, pricing and transit details are confirmed for the specific shipment before booking.'],['How do I request a quote?','Use the quote link or contact NorthStar with the shipment details above.']];
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><meta name="description" content="'+desc+'"><link rel="canonical" href="'+url(r.slug)+'"><meta name="robots" content="index,follow"><meta property="og:title" content="'+title+'"><meta property="og:description" content="'+desc+'"><meta property="og:url" content="'+url(r.slug)+'"><script type="application/ld+json">'+schema+'</script><style>body{margin:0;background:#0e151c;color:#f4f1e9;font:16px/1.7 system-ui,sans-serif}.wrap{max-width:900px;margin:auto;padding:24px}a{color:#f2a93b}h1{font-size:clamp(32px,5vw,48px);line-height:1.15}h2{margin-top:32px}.muted{color:#c9c7be}.panel{background:#16212b;border:1px solid #2c4257;padding:22px;margin:26px 0}.cta{display:inline-block;background:#f2a93b;color:#0e151c;padding:12px 20px;text-decoration:none;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.grid a{padding:14px;background:#16212b;text-decoration:none;color:#f4f1e9;border:1px solid #2c4257}li{margin:8px 0}@media(max-width:620px){.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><p><a href="'+ORIGIN+'/">NorthStar</a> / <a href="'+ORIGIN+'/ship/">Ship Freight</a> / <a href="'+ORIGIN+'/freight-services/">Freight Services</a> / '+esc(r.target_keyword)+'</p><p class="muted">'+esc(r.service_category)+' · Shipper services</p><h1>'+esc(r.target_keyword)+'</h1><p class="muted">'+desc+'</p><p>'+esc(lead)+'</p>'+section('Who this equipment is suited for','<p>'+esc(fit)+'</p>')+'<div class="panel"><h2>Discuss your shipment</h2><p>Share the lane, dates, cargo profile and equipment needs. NorthStar can review the request and confirm whether suitable capacity is available.</p><a class="cta" href="'+QUOTE+'" target="_blank" rel="noopener sponsored">Request a freight quote</a><p class="muted">Quotes are provided by our partner, Freight Sidekick. NorthStar may earn a commission when you book.</p></div>'+section('Shipment details to confirm',list(check))+section('Equipment and dispatch planning',list(steps))+'<div class="panel"><strong>Important equipment and safety note</strong><p>'+esc(risk)+'</p></div>'+section('Frequently asked questions',faq(faqs))+section('Related equipment and services','<div class="grid">'+links.map(x=>'<a href="'+url(x.slug)+'"><strong>'+esc(x.target_keyword)+'</strong><br><span class="muted">'+esc(x.service_category)+'</span></a>').join('')+'</div>')+'<p class="muted">NorthStar Delivery Solutions LLC · MC 1819020 · USDOT 4572562. Equipment, pricing, carrier qualifications and transit commitments are confirmed individually. Informational content, not a binding offer of transportation.</p></main></body></html>';
}
export function renderHub(rows){
 const groups={}; rows.forEach(r=>(groups[r.service_category]??=[]).push(r));
 const sections=Object.entries(groups).map(([k,items])=>'<section><h2>'+esc(k)+'</h2><div class="grid">'+items.map(r=>'<a href="'+url(r.slug)+'"><strong>'+esc(r.target_keyword)+'</strong><br><span>'+esc(r.meta_description)+'</span></a>').join('')+'</div></section>').join('');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Freight Services & Equipment | NorthStar</title><meta name="description" content="Explore NorthStar freight brokerage services by equipment and shipment type. Review requirements and request a quote."><link rel="canonical" href="'+ORIGIN+'/freight-services/"><meta name="robots" content="index,follow"><style>body{margin:0;background:#0e151c;color:#f4f1e9;font:16px/1.6 system-ui,sans-serif}.wrap{max-width:1040px;margin:auto;padding:32px 24px}a{color:#f2a93b}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid a{background:#16212b;border:1px solid #2c4257;padding:16px;text-decoration:none;color:#f4f1e9}.grid span{font-size:13px;color:#c9c7be}section{margin:30px 0}@media(max-width:620px){.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><p><a href="'+ORIGIN+'/">NorthStar Delivery Solutions</a> / Freight Services</p><h1>Freight services by equipment and shipment type</h1><p>Review shipment-specific planning requirements, then send details for a lane and capacity review. Equipment availability and service commitments are confirmed individually.</p>'+sections+'<p><a href="'+QUOTE+'" rel="noopener sponsored">Request a freight quote</a></p></main></body></html>';
}
export function mergeSitemap(xml,rows,date=new Date().toISOString().slice(0,10)){
 const have=new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]));
 const additions=[ORIGIN+'/freight-services/',...rows.map(r=>url(r.slug))].filter(x=>!have.has(x));
 if(!additions.length)return xml;
 return xml.replace('</urlset>',additions.map(x=>'  <url><loc>'+x+'</loc><lastmod>'+date+'</lastmod></url>').join('\n')+'\n</urlset>');
}
async function main(){
 const base=process.env.SUPABASE_URL?.replace(/\/+$/,''); const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!base||!key)throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured as Actions secrets.');
 const res=await fetch(base+'/rest/v1/northstar_seo_matrix?select=slug,target_keyword,service_category,meta_title,meta_description&order=created_at.asc',{headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'}});
 if(!res.ok)throw Error('Supabase read failed '+res.status+': '+await res.text());
 const all=await res.json(); const rows=all.filter(r=>valid(r.slug)&&r.target_keyword&&DETAILS[r.service_category]);
 if(!rows.length)throw Error('No eligible service rows; refusing empty publish.');
 const dir=join(ROOT,'freight-services'); await mkdir(dir,{recursive:true});
 for(const r of rows){const p=join(dir,r.slug);await mkdir(p,{recursive:true});await writeFile(join(p,'index.html'),renderPage(r,rows));}
 await writeFile(join(dir,'index.html'),renderHub(rows));
 const smp=join(ROOT,'sitemap.xml');await writeFile(smp,mergeSitemap(await readFile(smp,'utf8'),rows));
 const ship=join(ROOT,'ship','index.html');let html=await readFile(ship,'utf8');
 const marker='<!-- NORTHSTAR_FREIGHT_SERVICES_LINK -->';
 if(!html.includes(marker)){html=html.replace('<footer>',marker+'\n<section><div class="wrap article" style="max-width:1180px;"><h2>Freight services by equipment</h2><p>Review equipment-specific requirements before requesting capacity.</p><p><a href="../freight-services/">Explore all freight services and equipment options →</a></p></div></section>\n<footer>');await writeFile(ship,html);}
 console.log('Generated '+rows.length+' Supabase-backed freight service pages, hub, shipper link and sitemap entries.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1;});
