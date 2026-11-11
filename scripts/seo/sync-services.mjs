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
'Freight Brokerage':['A freight brokerage coordinates transportation between a shipper and an authorized motor carrier. A clear shipment profile and verification of service requirements support a workable move.',['Origin, destination and pickup/delivery dates','Commodity, dimensions, weight and pallet count','Equipment and special handling requirements','Loading/unloading conditions and accessorials','Facility contacts and shipping documents'],'Quotes and capacity depend on lane, dates, cargo details, carrier availability and final confirmation.'],
"B2B Freight Solutions":["Commercial freight for business distribution depends on a clear cargo profile, lane, receiving plan and written service scope. Review the shipment details before comparing capacity.",["Commodity and packaging","Pallet count, dimensions, total weight and stackability","Origin and destination access, docks and appointment windows","Pickup frequency, ready time and delivery schedule","Unloading method, proof of delivery and exception contacts"],"Use the actual shipment profile and facility requirements to determine whether the requested equipment and lane are suitable."],
"Box Truck Logistics":["Box-truck freight planning starts with usable cargo dimensions, payload, door clearance and the loading method. A 26-foot truck label alone does not establish that a shipment will fit.",["Piece and pallet dimensions, count and total weight","Interior length, width, height and rear-door clearance","Dock-high, liftgate, ramp or forklift loading requirements","Origin and destination access and parking constraints","Securement, delivery appointment and proof-of-delivery needs"],"Confirm actual vehicle specifications, cargo fit, payload and route access before dispatch; availability is not guaranteed by the equipment description."],
"Last-Mile Logistics":["Commercial final-mile freight adds site-level constraints to the linehaul plan. Receiving hours, parking, unloading equipment and delivery documentation should be agreed before the shipment moves.",["Pallet or piece dimensions and total weight","Delivery address, site access and vehicle restrictions","Receiving hours, appointment and contact person","Dock, liftgate, curbside or other unloading method","Condition photos, signed receipt and exception process"],"Do not assume inside delivery, installation, liftgate service or a guaranteed appointment unless it is confirmed in writing for the specific shipment."],
"Supply Chain Solutions":["Regional supply-chain freight planning connects recurring inventory movement with realistic lane schedules and facility capacity. Forecasts help organize the request but do not guarantee a carrier or delivery slot.",["Origin/destination pairs and lane frequency","Typical and peak shipment volume","Commodity, pallet count, dimensions and weight","Warehouse dock schedules and receiving limits","Service windows, exception contacts and documentation"],"Confirm each lane, equipment type, capacity window and operating responsibility before treating a recurring plan as committed."]
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
,
"dedicated-26ft-box-truck-freight-hauling":{"lead":"A dedicated 26-foot box-truck request should be evaluated against the actual interior dimensions, payload, door clearance and loading access—not the vehicle label alone.","fit":"Business freight that fits the confirmed box-truck configuration and can be loaded and unloaded at both locations.","check":["Pallet count and piece-level dimensions","Total shipment weight and distribution","Dock height, liftgate or forklift needs","Route access, parking and appointment windows"],"steps":["Compare cargo measurements with the actual truck specification.","Confirm loading and unloading equipment at both ends.","Agree on delivery window, securement and proof of delivery."],"risk":"Payload, interior dimensions and availability vary by vehicle. Confirm the exact truck and shipment before dispatch.","faqs":[["Will every pallet fit in a 26-foot box truck?","No. Pallet dimensions, stacking, door clearance and payload must be checked against the actual vehicle."],["Is a liftgate included?","Only when confirmed for the specific vehicle and shipment."]]},
"commercial-cargo-transportation-logistics":{"lead":"Commercial cargo transportation begins with a shipment profile that a carrier can evaluate: commodity, packaging, dimensions, weight, equipment, lane and receiving requirements.","fit":"Palletized or packaged business freight with documented pickup and delivery requirements.","check":["Commodity and handling restrictions","Pallet count, dimensions and total weight","Origin/destination and facility access","Pickup readiness and receiving appointment","Unloading, documentation and exception contacts"],"steps":["Prepare a shipment profile before requesting capacity.","Confirm equipment and facility compatibility.","Record the agreed rate, accessorials and delivery requirements."],"risk":"A quote is only comparable when equipment, scope, accessorials and timing assumptions match.","faqs":[["What information is needed for a commercial freight quote?","Provide lane, dates, commodity, dimensions, weight, pallet count and loading/unloading requirements."],["Is capacity guaranteed by a service page?","No. Carrier availability and shipment acceptance are confirmed individually."]]},
"mid-scale-business-inventory-distribution":{"lead":"Growing businesses often need inventory moved between suppliers, warehouses and selling locations without treating every move as a one-off emergency.","fit":"Businesses coordinating repeat or seasonal inventory transfers between commercial locations.","check":["Locations and lane frequency","Typical pallet count and shipment dimensions","Inventory readiness and dock schedules","Delivery appointment and receiving constraints","Exception handling and proof-of-delivery process"],"steps":["Map recurring lanes and typical shipment sizes.","Identify peak periods and receiving constraints.","Confirm each move and service window before release."],"risk":"A distribution plan should distinguish forecast volume from confirmed capacity and should document who handles delays or re-delivery.","faqs":[["Can one route serve multiple business locations?","Possibly, if the sequence, equipment, time windows and site access are feasible."],["What should a business forecast?","Typical volume, peak volume, shipment readiness and receiving hours."]]},
"last-mile-commercial-freight-delivery":{"lead":"Commercial last-mile delivery is determined by the final site's access and receiving process as much as by the linehaul distance.","fit":"Palletized or packaged freight going to a business, retail or receiving location with defined site requirements.","check":["Delivery address and vehicle access restrictions","Pallet dimensions, weight and count","Receiving hours and appointment rules","Dock, liftgate or other unloading method","Signed receipt and damage documentation"],"steps":["Confirm the delivery site can accept the proposed vehicle.","Agree on unloading responsibility and appointment details.","Document delivery condition and exceptions."],"risk":"Inside delivery, installation, liftgate service and exact delivery windows must not be assumed unless written into the shipment agreement.","faqs":[["What causes a commercial final-mile delay?","Restricted access, missed appointments, unavailable unloading equipment or incomplete receiving instructions."],["What proves delivery?","The agreed proof-of-delivery record, such as a signed receipt or approved electronic confirmation."]]},
"on-demand-warehouse-freight-hauling":{"lead":"Warehouse overflow moves need a fast but complete shipment review: ready time, cargo measurements, dock availability and receiving capacity all affect whether a move can be accepted.","fit":"Short-notice warehouse transfers or overflow freight requests where timing and facility details are available.","check":["Ready time and latest acceptable delivery","Commodity, pallet count, dimensions and weight","Dock hours, trailer access and loading method","Destination receiving window and unload plan","Contact for exceptions and proof of delivery"],"steps":["Confirm the freight is physically ready and documented.","Check origin and destination dock availability.","Request capacity only after the full lane and timing are known."],"risk":"Urgency does not create available capacity. Do not promise same-day or emergency service before a carrier confirms.","faqs":[["What should be included in an urgent warehouse freight request?","Ready time, lane, cargo profile, dock access, receiving hours and the deadline."],["Can an overflow move be booked without dimensions?","A preliminary discussion is possible, but equipment fit and price require accurate shipment details."]]},
"regional-distribution-box-truck-logistics":{"lead":"Regional box-truck distribution is suited to business freight that fits the confirmed vehicle and can be delivered within realistic route and receiving windows.","fit":"Regional palletized inventory or packaged cargo requiring box-truck equipment, subject to payload and dimension checks.","check":["Pallet count, dimensions and total weight","Truck interior dimensions and payload","Origin/destination access and route restrictions","Delivery sequence and receiving windows","Loading equipment and proof-of-delivery requirements"],"steps":["Provide the complete route and shipment profile.","Confirm vehicle fit and site access at every stop.","Set a realistic delivery schedule with exception contacts."],"risk":"Multi-stop routing changes time, loading order and capacity; each stop must be included in the quote and operating plan.","faqs":[["Can a box truck make multiple commercial stops?","It may be feasible when the route, load sequence, hours and receiving windows support it."],["Does regional service mean a fixed delivery time?","No. Timing is confirmed for the specific route and shipment."]]},
"contract-commercial-fleet-dispatch":{"lead":"A recurring commercial fleet arrangement should define the lane, forecast volume, equipment profile and operating responsibilities before either side treats it as committed capacity.","fit":"Businesses evaluating a recurring dispatch or dedicated-lane arrangement for predictable freight.","check":["Lane pairs and shipment frequency","Typical and peak weekly volume","Equipment and cargo specifications","Pickup and receiving windows","Tender lead time, cancellation and exception rules"],"steps":["Document the forecast and actual shipment history separately.","Define how loads are tendered and confirmed.","Agree on service scope, accessorials and escalation contacts."],"risk":"A forecast or service discussion is not a capacity guarantee. Contract terms and each shipment confirmation control.","faqs":[["What belongs in a recurring freight agreement?","Lane, volume assumptions, equipment, service windows, pricing basis, accessorials and exception procedures."],["Can a recurring lane change?","Changes should be reviewed and confirmed in writing before the affected shipment."]]},
"heavy-retail-cargo-transport-lanes":{"lead":"Retail cargo can include bulky fixtures, appliances, hardware and palletized inventory. Handling, dimensions and store receiving conditions should be reviewed before the lane is priced.","fit":"Commercial retail freight with known dimensions, packaging, unloading method and receiving schedule.","check":["Item and pallet dimensions, weight and packaging","Fragile, high-value or special handling requirements","Origin dock and destination store access","Delivery appointment and unloading equipment","Condition photos and signed delivery documentation"],"steps":["Collect piece-level dimensions and packaging details.","Confirm store access, receiving hours and unloading responsibility.","Document condition and any delivery exception."],"risk":"Do not assume inside placement, installation or specialized handling is included unless it is expressly confirmed.","faqs":[["What delays retail freight delivery?","Store receiving windows, restricted access, missing appointments and unloading constraints."],["Should fixtures be measured individually?","Yes. Long or irregular items can affect vehicle fit and loading sequence."]]},
"manufacturing-inventory-hauling-services":{"lead":"Manufacturing freight moves should be coordinated with production readiness, dock schedules and the physical requirements of raw materials or finished goods.","fit":"Regional movement of packaged materials, components or finished products between manufacturing and distribution locations.","check":["Material description and handling restrictions","Pallets, dimensions, total weight and loading method","Production-ready time and pickup window","Receiving dock schedule and unloading plan","Shipment documents and exception contacts"],"steps":["Confirm material is ready and properly packaged.","Align pickup with production and dock schedules.","Verify equipment, lane and delivery requirements before dispatch."],"risk":"Do not treat a production target as a confirmed pickup appointment; actual readiness and capacity must be checked.","faqs":[["What details help plan a plant-to-warehouse move?","Commodity, dimensions, weight, packaging, ready time, dock access and destination schedule."],["Can a shipment be scheduled before production is complete?","It can be forecast, but dispatch should wait for a confirmed ready time and capacity."]]},
"dedicated-commercial-freight-lanes":{"lead":"A dedicated commercial lane is a repeat movement pattern, not an automatic promise of exclusive equipment. Define volume, frequency, pickup windows and operating terms before launch.","fit":"Businesses with recurring origin/destination pairs and enough shipment history to describe normal and peak demand.","check":["Origin and destination pairs","Frequency and shipment profile by lane","Equipment type and loading requirements","Pickup/delivery windows and facility constraints","Pricing assumptions, accessorials and exception rules"],"steps":["Build a lane profile from actual shipment history.","Separate forecast demand from confirmed tenders.","Document how changes, cancellations and delays are handled."],"risk":"A dedicated-lane proposal must state whether equipment is exclusive, scheduled or simply planned capacity; do not imply exclusivity unless contracted.","faqs":[["What makes a freight lane suitable for a recurring arrangement?","Consistent origin/destination, shipment profile, volume and receiving schedule."],["Does dedicated mean one truck is reserved?","Not necessarily. The written agreement must define what dedicated capacity means."]]},
"commercial-freight-lanes-for-manufacturers":{"lead":"Manufacturer lanes should be described by plant, destination, cargo profile and shipment rhythm so the carrier can evaluate equipment and timing.","fit":"Manufacturers moving packaged components, raw materials or finished goods on recurring regional lanes.","check":["Plant and delivery locations","Shipment frequency and peak volume","Cargo dimensions, weight and packaging","Dock and receiving windows"],"steps":["Map the repeat lanes.","Separate forecast volume from confirmed tenders.","Confirm equipment and each pickup window."],"risk":"A lane plan is not a guarantee of capacity; actual shipment details and carrier acceptance control.","faqs":[["What makes a manufacturing lane repeatable?","Stable locations, documented shipment profiles and workable dock windows."],["Should peak volume be included?","Yes. Identify normal and peak demand separately."]]},
"warehouse-overflow-freight-hauling":{"lead":"Warehouse overflow freight needs a clear ready time, cargo profile and receiving plan before an urgent move can be evaluated.","fit":"Businesses shifting overflow pallets or packaged inventory between commercial facilities.","check":["Ready time and required delivery window","Pallet count, dimensions and weight","Dock hours and loading method","Destination receiving capacity"],"steps":["Confirm freight readiness.","Check both facilities' dock windows.","Request capacity with full shipment details."],"risk":"Urgency alone does not establish same-day availability or a confirmed delivery time.","faqs":[["What details are essential for overflow freight?","Lane, ready time, pallet profile, dock access and receiving window."],["Can the move be split?","Possibly, if the shipper confirms priorities and the carrier accepts the plan."]]},
"regional-box-truck-distribution-services":{"lead":"Regional box-truck distribution requires a measured cargo profile and route plan that fits the actual vehicle's payload and interior dimensions.","fit":"Regional business inventory that fits a verified box-truck configuration.","check":["Pallet and piece dimensions","Total weight and payload","Stops, route and site access","Loading and unloading equipment"],"steps":["Measure the complete shipment.","Confirm truck fit and access at each stop.","Set the route and receiving windows."],"risk":"A nominal truck length does not guarantee cargo fit or payload capacity.","faqs":[["Can regional box-truck freight include multiple stops?","Yes, when load sequence, route time and receiving windows make it feasible."],["What should be checked before booking?","Interior dimensions, payload, access and unloading method."]]},
"retail-store-replenishment-freight":{"lead":"Store replenishment freight depends on store receiving hours, shipment size and the unloading process—not only the distance from the distribution center.","fit":"Retailers and distributors planning palletized inventory replenishment.","check":["Store receiving schedule","Pallet dimensions and count","Dock or curb access","Delivery receipt and exception process"],"steps":["Confirm the store can receive the shipment.","Match cargo and unloading method to equipment.","Document appointment and delivery proof."],"risk":"Do not assume a store has a dock, liftgate access or inside-delivery capability.","faqs":[["What information helps plan store replenishment?","Store address, receiving hours, pallet count, dimensions and unloading details."],["Can replenishment run on a recurring schedule?","It can be discussed when lane volume and receiving windows are consistent."]]},
"commercial-final-mile-freight-delivery":{"lead":"Commercial final-mile freight should be planned around the actual receiving site, including access, appointment and unloading responsibility.","fit":"Business deliveries to retail, warehouse or commercial receiving locations.","check":["Delivery-site access and restrictions","Pallet size and total weight","Receiving hours and appointment","Unloading method and proof of delivery"],"steps":["Verify the receiving address and site contact.","Confirm unloading equipment and responsibilities.","Record condition and delivery confirmation."],"risk":"Inside delivery, installation and liftgate service are not included unless confirmed in writing.","faqs":[["What should a final-mile delivery request include?","Address, cargo profile, receiving window, access and unloading method."],["Why are site photos useful?","They can clarify access constraints and help avoid mismatched equipment."]]},
"recurring-warehouse-transfer-routes":{"lead":"Recurring warehouse transfers work best when lane frequency, cargo profile and receiving windows are documented from actual shipment history.","fit":"Businesses moving inventory between warehouses on repeat routes.","check":["Origin/destination pairs","Weekly frequency and typical volume","Pallet profile and equipment fit","Dock schedules and exceptions"],"steps":["List the repeat lanes.","Record normal and peak shipment sizes.","Confirm the next move and capacity separately."],"risk":"Historical volume is useful for planning but does not guarantee future capacity.","faqs":[["What should a recurring transfer plan include?","Lane, frequency, shipment size, dock windows and escalation contacts."],["Should every shipment still be confirmed?","Yes. Confirm ready time, quantity and carrier acceptance for each move."]]},
"contract-box-truck-capacity-for-businesses":{"lead":"A box-truck capacity discussion should start with actual cargo dimensions, weekly volume and receiving constraints before any recurring arrangement is described.","fit":"Businesses evaluating repeat box-truck moves for packaged or palletized freight.","check":["Cargo dimensions and total payload","Weekly and seasonal shipment volume","Pickup and delivery schedule","Vehicle access and unloading method"],"steps":["Build a representative shipment profile.","Compare peak demand with normal demand.","Confirm terms and availability for each lane."],"risk":"Do not treat a forecast or discussion as a reserved truck or guaranteed capacity.","faqs":[["What information is needed for a box-truck capacity review?","Lane, cargo dimensions, weight, frequency and site access."],["Can the truck type be specified in a contract?","Yes, if the actual equipment specification and substitution terms are clearly written."]]},
"multi-location-business-inventory-transfers":{"lead":"Inventory transfers between multiple business locations require a stop sequence, load plan and receiving window for each address.","fit":"Businesses moving stock between stores, warehouses or operating locations.","check":["All origin and destination addresses","Pallet count and stop-level quantities","Delivery sequence and time windows","Access, unloading and receipt requirements"],"steps":["List every stop and shipment quantity.","Set the loading sequence and route constraints.","Confirm each site's receiving contact."],"risk":"Additional stops can change time and usable capacity; include them in the written scope.","faqs":[["Can one shipment serve several locations?","Possibly, if load sequence, route and receiving windows support the plan."],["What is often missed?","Stop-level quantities, site access and the time needed to unload each location."]]},
"urgent-commercial-freight-overflow":{"lead":"Short-notice commercial overflow freight should be evaluated with an exact ready time, lane and shipment profile so the capacity request is realistic.","fit":"Shippers with an unexpected pallet or packaged-freight move that is ready or nearly ready.","check":["Freight ready time","Origin/destination and distance","Dimensions, weight and handling","Receiving deadline and dock access"],"steps":["Confirm the freight is ready.","Provide measurements and site details.","Wait for explicit capacity and appointment confirmation."],"risk":"No same-day or emergency service is promised by this page; availability must be confirmed.","faqs":[["What is the first question for urgent freight?","When the shipment will actually be ready for pickup."],["Can a carrier quote without cargo dimensions?","A preliminary review may be possible, but fit and pricing need accurate details."]]},
"palletized-retail-inventory-delivery":{"lead":"Palletized retail inventory delivery needs a verified pallet profile and a receiving plan for the store or commercial site.","fit":"Retail and wholesale freight shipped on standard or non-standard pallets.","check":["Pallet count and footprint","Stack height and total weight","Dock, liftgate or ground-level access","Appointment and proof-of-delivery rules"],"steps":["Measure each pallet type.","Confirm the delivery site's unloading method.","Document appointment and receipt requirements."],"risk":"Pallet count alone does not establish trailer fit or payload; dimensions and weight matter.","faqs":[["What pallet details should a shipper provide?","Footprint, height, weight, count and whether pallets can be stacked."],["Does every store have a loading dock?","No. Verify access and unloading requirements for each address."]]},
"regional-manufacturing-materials-hauling":{"lead":"Regional manufacturing materials moves should be coordinated with material readiness, packaging and the receiving plant's dock schedule.","fit":"Manufacturers moving packaged materials, components or finished products within regional lanes.","check":["Material and handling restrictions","Dimensions, weight and packaging","Ready time and pickup access","Receiving dock schedule"],"steps":["Confirm the material is packaged and ready.","Match equipment to the cargo profile.","Align pickup and delivery windows with plant operations."],"risk":"Production schedules can change; re-confirm readiness before dispatch.","faqs":[["What is needed to plan a plant transfer?","Material description, dimensions, weight, ready time and both dock schedules."],["Can the shipment be planned before it is ready?","Yes as a forecast, but dispatch requires a confirmed ready time."]]},
"distribution-center-to-store-freight":{"lead":"Distribution-center-to-store freight connects a central facility with a retail receiving location and needs clear appointment and unloading details.","fit":"Retailers and distributors moving packaged or palletized stock from a DC to a store.","check":["DC pickup window and release process","Store receiving hours and appointment","Pallet count, dimensions and weight","Unloading and delivery documentation"],"steps":["Confirm the freight release and pickup appointment.","Verify store receiving requirements.","Capture the signed receipt and exceptions."],"risk":"A DC release does not guarantee the store can receive the shipment at the same time; both ends must be coordinated.","faqs":[["What delays DC-to-store freight?","Release issues, appointment mismatch, access restrictions and unloading constraints."],["What should the shipper confirm first?","Freight readiness and the store's receiving window."]]},
"dedicated-box-truck-freight-lanes":{"lead":"A repeat box-truck lane needs a documented shipment profile, frequency and service window before the parties can define a workable operating plan.","fit":"Businesses with recurring cargo that fits a verified box-truck configuration.","check":["Lane and weekly frequency","Pallet dimensions and payload","Pickup/delivery windows","Access and unloading method"],"steps":["Document normal and peak volume.","Confirm truck fit and route access.","Define how each shipment is tendered and accepted."],"risk":"Dedicated capacity must be defined in writing; a recurring request is not automatically exclusive capacity.","faqs":[["Does a dedicated box-truck lane reserve one vehicle?","Only if the written agreement specifically says so."],["What should a lane profile include?","Origin, destination, frequency, cargo dimensions, weight and site access."]]},
"commercial-freight-for-seasonal-inventory":{"lead":"Seasonal commercial freight planning compares forecast volume with real pickup and receiving capacity so inventory can move without assuming every forecast is booked.","fit":"Retailers, distributors and manufacturers preparing seasonal inventory moves.","check":["Seasonal forecast and peak dates","Origin/destination and shipment frequency","Pallet profile and equipment needs","Warehouse and store receiving capacity"],"steps":["Separate forecast demand from confirmed shipments.","Identify peak-week constraints early.","Confirm each tender, appointment and carrier."],"risk":"Forecasts help planning but do not guarantee capacity, rates or delivery slots.","faqs":[["When should seasonal freight be reviewed?","Before the expected peak, with updates as inventory and dates firm up."],["What should be forecast?","Volume, lane, ready dates, equipment and receiving capacity."]]},
"warehouse-to-warehouse-pallet-freight":{"lead":"Warehouse-to-warehouse pallet freight requires matching pallet dimensions and weight to the equipment and both facilities' dock procedures.","fit":"Businesses transferring palletized stock between distribution or storage locations.","check":["Pallet footprint, height and weight","Total pallet count and stackability","Dock hours and trailer access","Pickup release and receiving appointment"],"steps":["Verify pallet dimensions and quantities.","Confirm loading and unloading capability at both sites.","Record the shipment and delivery receipt."],"risk":"Non-standard pallets and restricted docks can affect fit, loading time and price.","faqs":[["What details affect a pallet freight quote?","Pallet size, count, total weight, lane and dock/appointment requirements."],["Can pallets be double-stacked?","Only when cargo, packaging, shipper instructions and equipment safely permit it."]]},
"retail-fixture-and-display-transport":{"lead":"Retail fixtures and displays can be oversized, fragile or irregularly shaped, so dimensions and packaging should be checked piece by piece.","fit":"Retailers and suppliers moving store fixtures, displays or packaged merchandising equipment.","check":["Piece dimensions and total weight","Fragility, packaging and protection","Loading equipment and access","Store delivery window and placement scope"],"steps":["Collect measurements and photos of unusual pieces.","Confirm loading and unloading equipment.","Agree on whether delivery is curbside, dock or another scope."],"risk":"Do not assume assembly, installation or inside placement is included in transportation.","faqs":[["Should fixtures be measured individually?","Yes. Irregular shapes can determine equipment fit and handling."],["Is installation part of delivery?","Only if a separate written service scope confirms it."]]},
"scheduled-business-freight-delivery":{"lead":"Scheduled business freight delivery depends on a ready shipment, a workable route and a receiving appointment that has been confirmed by the destination.","fit":"Businesses coordinating planned freight arrivals at warehouses, retail sites or commercial facilities.","check":["Ready time and pickup appointment","Cargo dimensions, weight and equipment","Destination receiving window","Site contact and exception procedure"],"steps":["Confirm freight readiness and pickup details.","Verify the destination appointment.","Share an exception contact and delivery documentation plan."],"risk":"A requested appointment is not a confirmed appointment until the receiving site and carrier accept it.","faqs":[["What makes a freight delivery schedule reliable?","Confirmed readiness, realistic transit assumptions and accepted receiving windows."],["What if the receiving site changes the appointment?","Notify dispatch promptly and re-confirm the revised plan."]]},
"regional-commercial-route-distribution":{"lead":"Regional commercial route distribution should account for lane distance, shipment frequency, stop sequence and site-level restrictions before a schedule is proposed.","fit":"Businesses moving inventory or packaged freight across regional commercial routes.","check":["Origin/destination and stop sequence","Shipment frequency and load size","Vehicle fit and route restrictions","Receiving windows and unloading time"],"steps":["Map the route and stops.","Check cargo and equipment compatibility.","Confirm timing and each shipment separately."],"risk":"Route feasibility depends on actual locations, traffic, hours and receiving constraints; no fixed transit time is implied.","faqs":[["Can a route include several commercial stops?","Possibly, when the sequence and receiving windows are workable."],["What information is needed?","Addresses, shipment sizes, frequency, time windows and unloading details."]]},
"box-truck-freight-for-store-restocking":{"lead":"Store restocking by box truck requires pallet measurements, vehicle access and a receiving plan that matches the store's loading setup.","fit":"Retailers and distributors restocking stores with packaged or palletized inventory.","check":["Pallet size and total weight","Rear-door and interior clearance","Store access and receiving hours","Dock, liftgate or ground unloading"],"steps":["Confirm the store's delivery instructions.","Check the load against the actual truck specification.","Agree on unloading and proof of delivery."],"risk":"A store's curb or parking layout may restrict vehicle access; verify before dispatch.","faqs":[["Can a box truck deliver to a store without a dock?","Only if the vehicle, unloading method and site access are suitable and confirmed."],["What should be measured?","Pallets, door clearance, cargo height and total weight."]]},
"commercial-pallet-final-mile-delivery":{"lead":"Commercial pallet final-mile delivery should define how the pallet reaches the receiving point and who is responsible for unloading and signing.","fit":"Businesses receiving palletized freight at stores, offices, warehouses or job sites.","check":["Pallet dimensions and total weight","Site access and vehicle restrictions","Dock, liftgate or ground-level unloading","Appointment and signed receipt"],"steps":["Verify the final address and site contact.","Confirm unloading equipment and responsibility.","Record delivery condition and receipt."],"risk":"Do not promise inside placement, liftgate or job-site handling unless it is confirmed for the specific shipment.","faqs":[["What is needed for a pallet final-mile quote?","Pallet count, dimensions, weight, address, access and unloading method."],["Why confirm unloading in advance?","The wrong unloading assumption can make an otherwise suitable delivery impossible."]]},
{
  "steel-coil-flatbed-freight-shipping": {
    "lead": "Steel-coil freight requires the coil's actual weight, eye orientation, loading method and securement plan to be known before a flatbed carrier is selected.",
    "fit": "Steel coils and related rolled-metal freight that fit a confirmed trailer, loading arrangement and carrier securement plan.",
    "check": [
      "Individual coil weights, outside diameters, widths and eye orientation",
      "Coil racks, cradles, dunnage and rated securement equipment required by the shipper and carrier",
      "Crane or forklift capacity, loading sequence and pickup-site access",
      "Trailer deck dimensions, axle distribution and any weather-protection requirements",
      "Destination unloading equipment, appointment window and inspection process"
    ],
    "steps": [
      "Request a coil list or load diagram showing weight, dimensions and eye orientation.",
      "Confirm the carrier's trailer configuration, coil racks and loading responsibility.",
      "Agree on securement, blocking, edge protection and condition documentation before loading.",
      "Verify route, weight and appointment requirements for the actual shipment before dispatch."
    ],
    "risk": "Do not infer coil weight, securement method or legal axle compliance from a total shipment weight. The shipper and qualified carrier must approve the actual loading and securement plan.",
    "faqs": [
      [
        "Can every flatbed carry steel coils?",
        "No. Trailer configuration, coil weight, loading method, securement equipment and carrier acceptance must match the shipment."
      ],
      [
        "What should be included in a coil freight quote?",
        "Coil count, individual weights and dimensions, eye orientation, origin/destination, loading method and unloading requirements."
      ],
      [
        "Are coil racks always supplied?",
        "No. Confirm whether the shipper, receiver or carrier supplies the required racks or cradles."
      ]
    ]
  },
  "structural-steel-beam-freight-transport": {
    "lead": "Structural-steel freight is shaped by beam length, bundle weight, lifting points and the way the material will be unloaded at the destination.",
    "fit": "Bundled beams, channels, columns and other fabricated steel pieces that can be supported and secured on the selected open-deck equipment.",
    "check": [
      "Piece and bundle lengths, width, height and verified weight",
      "Bundle configuration, center of gravity and protection for finished surfaces",
      "Crane, forklift or side-loading access at pickup and delivery",
      "Deck length, support spacing, dunnage and securement points",
      "Job-site access, unloading sequence and receiving appointment"
    ],
    "steps": [
      "Collect a piece list or drawing with dimensions and weights.",
      "Confirm the loading equipment and the order in which bundles will be placed.",
      "Review supports, blocking, edge protection and securement with the carrier.",
      "Confirm delivery access, lift capacity and the unloading sequence before dispatch."
    ],
    "risk": "Long steel pieces can shift or overhang if the loading plan is incomplete. Confirm dimensions, support points and route requirements with the carrier; this page is not a securement or permit determination.",
    "faqs": [
      [
        "What dimensions matter for steel beams?",
        "Length, bundle width and height, individual and total weight, plus any projections or irregular shapes."
      ],
      [
        "Can beams be unloaded by forklift?",
        "Only when the bundle weight, fork spacing, lifting points and site equipment are suitable."
      ],
      [
        "Should the shipper send a load drawing?",
        "Yes. A dimensioned drawing or clear photos can help the carrier assess fit and loading sequence."
      ]
    ]
  },
  "lumber-engineered-wood-freight-shipping": {
    "lead": "Lumber and engineered-wood freight needs a bundle-level plan for length, weight, moisture protection and the equipment available at both ends.",
    "fit": "Packaged lumber, trusses, engineered wood and similar building products that fit the confirmed trailer and loading arrangement.",
    "check": [
      "Bundle lengths, widths, heights, count and total weight",
      "Packaging condition, banding and protection from weather or road spray",
      "Forklift or crane access and the bundle loading sequence",
      "Trailer deck length, dunnage, overhang and securement requirements",
      "Mill, yard or job-site receiving hours and unloading capability"
    ],
    "steps": [
      "Prepare a bundle list with dimensions, weight and packaging details.",
      "Confirm whether tarping or other weather protection is required.",
      "Match the trailer and loading method to the longest and heaviest bundle.",
      "Agree on the delivery location, unloading equipment and proof-of-delivery process."
    ],
    "risk": "Do not assume a job site can unload long bundles or that a tarp is included. Confirm site access, weather protection and the actual equipment before accepting the move.",
    "faqs": [
      [
        "Can lumber move on a standard flatbed?",
        "Sometimes. Bundle length, weight, loading method, weather protection and securement determine the suitable trailer."
      ],
      [
        "What information helps price a lumber load?",
        "Bundle dimensions and weights, count, origin/destination, tarp needs and loading/unloading equipment."
      ],
      [
        "Can trusses be handled like dimensional lumber?",
        "Not automatically. Shape, packaging, length and lifting points can require a different loading plan."
      ]
    ]
  },
  "roofing-materials-flatbed-freight": {
    "lead": "Roofing-material freight often combines long bundles, palletized supplies and job-site deliveries where unloading access matters as much as the linehaul.",
    "fit": "Packaged roofing materials and related building products for distributors, warehouses and construction sites, subject to equipment and site confirmation.",
    "check": [
      "Product type, pallet or bundle count, dimensions and total weight",
      "Packaging protection for shingles, membranes, panels or accessories",
      "Tarping or weather-protection requirements from the shipper",
      "Forklift, crane or ground-level unloading capability",
      "Job-site entrance, turning space, surface conditions and delivery window"
    ],
    "steps": [
      "Separate the shipment by product and bundle dimensions.",
      "Confirm whether the destination is a warehouse dock or active job site.",
      "Agree on tarping, unloading responsibility and any site restrictions.",
      "Document the delivery appointment and proof-of-delivery requirements."
    ],
    "risk": "A job-site address does not prove that a tractor-trailer can reach the unloading point. Confirm road surface, overhead clearance, turning room and equipment before dispatch.",
    "faqs": [
      [
        "Can roofing materials be delivered directly to a job site?",
        "Only when the actual vehicle, access route, unloading method and site schedule are suitable."
      ],
      [
        "Should roofing loads be tarped?",
        "Follow the shipper's packaging and weather-protection instructions and confirm the required cover with the carrier."
      ],
      [
        "What is needed for a quote?",
        "Product and pallet details, dimensions, weight, lane, ready date and job-site unloading information."
      ]
    ]
  },
  "pipe-tubing-flatbed-freight-shipping": {
    "lead": "Pipe and tubing freight is sensitive to length, bundle support, diameter and how the load will be restrained without damaging the product.",
    "fit": "Bundled metal or industrial pipe and tubing that fits the selected open-deck equipment and an approved support and securement plan.",
    "check": [
      "Pipe material, outside diameter, wall or bundle dimensions and total weight",
      "Individual lengths, bundle count, end protection and packaging",
      "Dunnage, support spacing, blocking and securement points",
      "Crane, forklift or side-loading access at both facilities",
      "Destination unloading equipment, storage area and appointment window"
    ],
    "steps": [
      "Request a bundle list showing lengths, diameters, weights and packaging.",
      "Confirm whether the shipper requires specific dunnage or end protection.",
      "Review loading sequence and securement with the carrier before pickup.",
      "Confirm the receiver can unload and stage the full length of the material."
    ],
    "risk": "Long or round freight can roll, flex or shift if supports and securement are unsuitable. The carrier must approve the actual loading plan and applicable securement requirements.",
    "faqs": [
      [
        "Can pipe be loaded on any flatbed?",
        "No. Length, diameter, weight, support spacing, loading access and securement determine trailer suitability."
      ],
      [
        "What photos are useful?",
        "Bundle ends, labels, dimensions, support points and the loading area."
      ],
      [
        "Does pipe freight always need tarping?",
        "Not always. Follow the product and shipper's protection instructions and confirm them before dispatch."
      ]
    ]
  },
  "solar-panel-racking-freight-shipping": {
    "lead": "Solar-project freight can include fragile palletized panels, long racking bundles and electrical components that need different equipment and handling plans.",
    "fit": "Packaged solar panels, mounting rails and project materials moving between manufacturers, distribution yards and installation sites.",
    "check": [
      "Separate panel pallets, racking bundles and electrical components by dimensions and weight",
      "Packaging, corner protection, stack limits and handling labels",
      "Dry-van or open-deck suitability for each product group",
      "Project-site access, laydown area, forklift capacity and delivery sequencing",
      "Installation deadline, receiving contact and condition-inspection process"
    ],
    "steps": [
      "Obtain a shipment breakdown by product type and packaging.",
      "Confirm which items require enclosed protection and which can move on open deck.",
      "Coordinate delivery sequence with the site and its unloading equipment.",
      "Record packaging condition and any visible damage at handoff."
    ],
    "risk": "Do not assume all solar cargo can share one trailer or be unloaded at an active site. Confirm packaging, handling limits and the installation site's access before dispatch.",
    "faqs": [
      [
        "Can solar panels and racking move together?",
        "They may, if packaging, dimensions, weight, trailer fit and unloading sequence are compatible."
      ],
      [
        "What should be protected most carefully?",
        "Follow manufacturer packaging and handling instructions, especially for glass panels and sensitive electrical components."
      ],
      [
        "Can a truck deliver directly to a solar project site?",
        "Only after site access, receiving hours, unloading equipment and the exact delivery point are confirmed."
      ]
    ]
  },
  "hvac-equipment-freight-delivery": {
    "lead": "HVAC freight ranges from boxed parts to large rooftop units, so equipment dimensions and the receiving site's lifting plan should be confirmed before a vehicle is assigned.",
    "fit": "Packaged HVAC units, condensers, air handlers, ductwork and related commercial mechanical equipment, subject to the shipment's size and handling requirements.",
    "check": [
      "Model or item list, crate dimensions, weight and number of pieces",
      "Fragile panels, coils, protrusions and manufacturer handling labels",
      "Forklift, dock, liftgate or crane requirements at each end",
      "Vehicle clearance, parking and access to the delivery point",
      "Appointment, site contact and whether delivery is curbside or dock-only"
    ],
    "steps": [
      "Collect dimensions and weights for the largest and heaviest pieces.",
      "Confirm packaging and any keep-upright or no-stack instructions.",
      "Match the equipment to site access and unloading capability.",
      "Document the agreed delivery scope and proof-of-delivery process."
    ],
    "risk": "Transportation does not automatically include rooftop placement, rigging, installation or inside delivery. Those services must be separately confirmed in writing.",
    "faqs": [
      [
        "Can rooftop units be delivered by box truck?",
        "It depends on crate size, payload, unloading method and the actual vehicle's interior dimensions."
      ],
      [
        "Is crane service included?",
        "Not unless a separate scope and qualified provider are confirmed."
      ],
      [
        "What information helps quote HVAC freight?",
        "Piece dimensions and weights, pickup/delivery access, unloading method and required delivery window."
      ]
    ]
  },
  "industrial-machinery-freight-brokerage": {
    "lead": "Industrial machinery moves require more than a machine's catalog weight: attachments, skids, center of gravity and lifting points affect trailer selection and handling.",
    "fit": "Factory equipment, presses, machine tools, compressors and other industrial units that can be safely loaded and transported on confirmed equipment.",
    "check": [
      "Actual transport weight and dimensions including skids, guards and attachments",
      "Center of gravity, lifting points and manufacturer handling instructions",
      "Rigging, forklift or crane capacity and loading-surface conditions",
      "Trailer deck, axle configuration, blocking and securement plan",
      "Route constraints, delivery access and unloading appointment"
    ],
    "steps": [
      "Request manufacturer specifications and photos of the actual shipping configuration.",
      "Confirm who supplies rigging, loading equipment and qualified operators.",
      "Have the carrier review deck fit, weight distribution and securement.",
      "Verify route and site access before confirming the shipment."
    ],
    "risk": "A brochure weight may exclude tooling, fluids, attachments or packaging. Use the actual shipping configuration and qualified carrier review; do not treat this page as a lift plan or permit determination.",
    "faqs": [
      [
        "Can industrial machinery move on a flatbed?",
        "Some units can, but dimensions, weight, lifting method, protection and route determine the correct equipment."
      ],
      [
        "Should a machine be drained before shipping?",
        "Follow the manufacturer's and shipper's preparation instructions and disclose any fluids or special handling requirements."
      ],
      [
        "What should be included in the quote request?",
        "Machine model, actual dimensions and weight, photos, lifting points, origin/destination and loading/unloading plan."
      ]
    ]
  },
  "lowboy-construction-equipment-freight": {
    "lead": "Construction-equipment freight may require a lowboy, RGN or another specialized trailer depending on machine height, weight, ground clearance and loading method.",
    "fit": "Excavators, loaders, dozers and other construction machines that can be loaded onto a suitable heavy-haul configuration and routed after review.",
    "check": [
      "Machine make/model, transport weight and dimensions with attachments",
      "Track or tire condition, ground clearance and whether the machine can self-load",
      "Deck height, well dimensions, ramps, axle groups and carrier capacity",
      "Loading surface, access, permits and route-specific restrictions",
      "Origin and destination site access, escorts and unloading responsibilities"
    ],
    "steps": [
      "Obtain the machine's actual transport configuration and attachment list.",
      "Confirm the selected trailer's deck, ramp and capacity specifications.",
      "Have the carrier evaluate loaded dimensions, weight distribution and route.",
      "Agree on who operates, loads, blocks and secures the machine."
    ],
    "risk": "A lowboy label does not establish that a load is legal or suitable. Permits, axle weights, clearances and escorts vary by route and must be verified by the carrier and permitting specialists.",
    "faqs": [
      [
        "Is a lowboy the same as an RGN?",
        "No. Trailer design, deck configuration and loading method differ; select by machine fit and carrier specification."
      ],
      [
        "Can construction equipment drive onto the trailer?",
        "Only when the machine, ramps, ground clearance, operator and loading surface make that method suitable."
      ],
      [
        "Are permits included automatically?",
        "No. Requirements and responsibility must be confirmed for the actual loaded dimensions, weights and route."
      ]
    ]
  },
  "agricultural-equipment-freight-transport": {
    "lead": "Agricultural-equipment freight needs a transport profile that includes attachments, tire or track dimensions and the route between the farm, dealer and receiving site.",
    "fit": "Tractors, combines, implements and other farm equipment that fit a confirmed trailer and carrier operating plan.",
    "check": [
      "Make/model, actual transport weight and overall dimensions",
      "Headers, booms, dual tires, mirrors and other removable attachments",
      "Loading method, ramps, ground clearance and lifting points",
      "Loaded height, width, axle weights and route restrictions",
      "Pickup access, seasonal timing and destination unloading capability"
    ],
    "steps": [
      "Collect manufacturer specifications and verify the machine's current configuration.",
      "List attachments that will travel with the machine or separately.",
      "Confirm trailer, loading method and carrier acceptance.",
      "Review route, permits and site access before setting the delivery window."
    ],
    "risk": "Published equipment dimensions may differ from the machine as configured. Verify attachments and transport measurements; any permit or route determination must be made for the actual load and jurisdictions.",
    "faqs": [
      [
        "Can farm equipment move on a step deck?",
        "Sometimes. Machine height, width, weight, loading method and trailer dimensions determine the fit."
      ],
      [
        "Should attachments ship separately?",
        "That depends on dimensions, securement, protection and the carrier's loading plan."
      ],
      [
        "What is important during harvest season?",
        "Ready dates, dealer/farm access, loading equipment and receiving windows should be confirmed early."
      ]
    ]
  },
  "automotive-parts-truckload-freight": {
    "lead": "Automotive-parts freight often depends on packaging consistency, plant receiving windows and the timing of shipments between suppliers, warehouses and assembly locations.",
    "fit": "Palletized or packaged automotive components moving between manufacturers, suppliers, distribution centers and commercial facilities.",
    "check": [
      "Part description, packaging type, pallet count, dimensions and total weight",
      "Stackability, protection against moisture or movement and any handling labels",
      "Pickup release time, shipping documents and plant receiving appointment",
      "Dock access, trailer requirements and unload responsibility",
      "Delivery sequence, shortage/exception contact and proof-of-delivery requirements"
    ],
    "steps": [
      "Prepare a shipment profile with pallet dimensions and packaging details.",
      "Confirm release and receiving appointments at both facilities.",
      "Match the freight to dry-van or other suitable equipment.",
      "Agree on exception communication and delivery documentation."
    ],
    "risk": "A requested just-in-time window is not a guaranteed appointment. Confirm freight readiness, facility acceptance and carrier capacity before communicating a committed delivery time.",
    "faqs": [
      [
        "What information helps quote automotive parts freight?",
        "Lane, ready date, pallet count, dimensions, weight, packaging and plant receiving hours."
      ],
      [
        "Can mixed part numbers travel together?",
        "Only when packaging, labeling, loading sequence and receiver instructions allow it."
      ],
      [
        "Does a truckload quote include line-side delivery?",
        "No. Delivery scope is limited to the agreed receiving point unless additional handling is confirmed."
      ]
    ]
  },
  "warehouse-racking-freight-transport": {
    "lead": "Warehouse-racking freight can contain long uprights, beams, braces and irregular bundles, making piece length and unloading sequence central to equipment selection.",
    "fit": "Palletized or bundled storage-rack components moving from manufacturers or distribution yards to warehouses and installation sites.",
    "check": [
      "Upright and beam lengths, bundle count, dimensions and total weight",
      "Packaging, banding, protrusions and protection for finished surfaces",
      "Trailer deck length, support spacing and securement points",
      "Forklift or crane capacity and unloading sequence at destination",
      "Site access, staging area, receiving window and delivery contact"
    ],
    "steps": [
      "Request a bundle list with the longest pieces identified.",
      "Confirm whether the destination can unload and stage long components.",
      "Review dunnage, support and securement with the carrier.",
      "Document delivery scope and condition at handoff."
    ],
    "risk": "Long rack components may not fit through a facility entrance or staging aisle even when the truck can reach the property. Confirm the unloading point and handling plan before dispatch.",
    "faqs": [
      [
        "Can warehouse racking move in a dry van?",
        "Some packaged components can; length, packaging, loading access and protection determine whether enclosed equipment fits."
      ],
      [
        "What should be measured?",
        "The longest upright or beam, bundle dimensions, weight and any protruding parts."
      ],
      [
        "Is installation included?",
        "No. Installation and rack assembly are outside a freight quote unless separately agreed."
      ]
    ]
  },
  "trade-show-exhibit-freight-shipping": {
    "lead": "Trade-show exhibit freight is deadline-driven: crates, cases and pallets must reach the correct venue or advance warehouse within the event's published receiving window.",
    "fit": "Packaged exhibit materials, displays, cases, crates and event supplies moving between offices, exhibit houses, warehouses and venues.",
    "check": [
      "Crate, case and pallet count with dimensions and weights",
      "Event name, venue address, receiving window and material-handling instructions",
      "Advance warehouse versus direct-to-show-site delivery requirements",
      "Dock access, appointment, unloading equipment and on-site contact",
      "Move-out, return-shipping scope and any separate decorator or drayage charges"
    ],
    "steps": [
      "Obtain the exhibitor kit and confirm the official freight address and deadline.",
      "Prepare piece-level dimensions, weights, labels and shipping documents.",
      "Confirm who handles dock appointments, on-site material handling and move-out.",
      "Arrange return instructions before the event closes if return freight is required."
    ],
    "risk": "Venue drayage, dock-to-booth handling, storage, labor and exhibit setup are not automatically included in transportation. Confirm each service and charge with the show contractor and carrier.",
    "faqs": [
      [
        "Should exhibits go to an advance warehouse or the venue?",
        "Follow the event's exhibitor manual and compare its deadlines, handling rules and charges before choosing."
      ],
      [
        "Does freight delivery include booth setup?",
        "No. Booth setup and decorator services are separate unless expressly contracted."
      ],
      [
        "What happens after the show?",
        "Move-out and return freight need their own deadlines, labels, pickup arrangements and receiving address."
      ]
    ]
  },
  "paper-roll-freight-transport": {
    "lead": "Paper-roll freight needs the roll diameter, width, weight and core protection documented so the carrier can evaluate support, loading orientation and trailer fit.",
    "fit": "Paper, packaging and related rolled products that can be carried on confirmed equipment with suitable roll handling and protection.",
    "check": [
      "Roll count, diameter, width, individual weight and core size",
      "Roll orientation, chocks, cradles, blocking and edge protection requirements",
      "Moisture protection and packaging condition",
      "Forklift, clamp or other loading equipment and operator responsibility",
      "Trailer dimensions, load sequence, delivery access and receiving appointment"
    ],
    "steps": [
      "Request a roll list with dimensions, weights and orientation instructions.",
      "Confirm the shipper's required loading equipment and support method.",
      "Review moisture protection, blocking and securement with the carrier.",
      "Verify the receiver can unload the rolls using the agreed method."
    ],
    "risk": "Paper rolls can be damaged by improper clamp pressure, moisture or movement. Follow the manufacturer's and shipper's handling instructions and confirm the receiver's unloading equipment.",
    "faqs": [
      [
        "Can paper rolls be shipped in a dry van?",
        "Often, if the roll dimensions, weight, loading method and protection requirements fit the trailer."
      ],
      [
        "Why does roll orientation matter?",
        "It affects support, stability, loading sequence and the risk of damage."
      ],
      [
        "What should be included in a quote?",
        "Roll count, diameter, width, weight, packaging, lane and loading/unloading equipment."
      ]
    ]
  },
  "palletized-beverage-freight-shipping": {
    "lead": "Palletized beverage freight is influenced by pallet weight, liquid packaging, stackability and the receiving facility's dock and appointment rules.",
    "fit": "Packaged beverages and related palletized products moving between manufacturers, distributors, warehouses and retail receiving facilities.",
    "check": [
      "Pallet count, footprint, height, gross weight and stackability",
      "Packaging type, wrap condition, slip sheets and damage-prevention needs",
      "Temperature or light-protection instructions if specified by the shipper",
      "Dock access, loading method, receiving hours and appointment",
      "Pallet exchange, delivery receipt and shortage/damage reporting process"
    ],
    "steps": [
      "Confirm the pallet profile and whether loads may be stacked.",
      "Check the total weight and trailer capacity with the carrier.",
      "Agree on pallet exchange, unloading and condition documentation.",
      "Confirm the receiving appointment and exception contact before pickup."
    ],
    "risk": "Do not assume pallets can be double-stacked or that a retailer will accept an unplanned arrival. Packaging, weight, stackability and receiving rules must be confirmed.",
    "faqs": [
      [
        "What affects a beverage freight quote?",
        "Pallet count, dimensions, total weight, lane, stackability and appointment requirements."
      ],
      [
        "Is temperature control always required?",
        "No. Follow the product's written shipping instructions; do not assume a temperature requirement."
      ],
      [
        "Are pallet exchanges included?",
        "Only when the shipper, receiver and carrier agree on the pallet type and exchange process."
      ]
    ]
  },
  "produce-reefer-freight-shipping": {
    "lead": "Produce reefer freight depends on the commodity-specific instructions supplied by the shipper, including setpoint, product condition, airflow and receiving requirements.",
    "fit": "Fresh produce and other temperature-sensitive agricultural products that are accepted by a qualified refrigerated carrier and compatible trailer.",
    "check": [
      "Exact commodity, packaging, maturity/condition and any handling restrictions",
      "Written setpoint, tolerance and continuous or cycle-mode instructions",
      "Pre-cooling, product temperature and airflow or pallet-loading requirements",
      "Trailer cleanliness, previous-load restrictions, seals and temperature records",
      "Pickup and receiver appointments, inspection process and rejection protocol"
    ],
    "steps": [
      "Obtain written temperature and handling instructions from the shipper.",
      "Confirm trailer readiness, cleanliness and any pre-cooling requirement.",
      "Review pallet pattern and airflow with the carrier before loading.",
      "Agree on temperature documentation and the process for reporting exceptions."
    ],
    "risk": "There is no universal produce temperature. Requirements vary by commodity and shipper; never substitute a generic chart for the written shipping instructions or promise a temperature outcome.",
    "faqs": [
      [
        "What temperature should produce travel at?",
        "Use the shipper's commodity-specific written setpoint and tolerance; different produce items have different requirements."
      ],
      [
        "Does the reefer cool warm product quickly?",
        "A refrigeration unit maintains its operating environment; the shipper and carrier must agree on product condition and pre-cooling before loading."
      ],
      [
        "What records should be requested?",
        "The agreed temperature records, loading details, seal information and signed delivery documentation."
      ]
    ]
  },
  "frozen-food-reefer-freight-shipping": {
    "lead": "Frozen-food freight requires a refrigerated trailer and written handling instructions that match the product, packaging and receiving facility.",
    "fit": "Packaged frozen food and other shipper-approved frozen products accepted by a qualified reefer carrier.",
    "check": [
      "Product description, packaging, pallet count and total weight",
      "Written setpoint, tolerance and required operating mode",
      "Trailer cleanliness, previous cargo, pre-cooling and inspection requirements",
      "Loading sequence, door-open time, seals and temperature-recording needs",
      "Receiver appointment, temperature-check process and exception contacts"
    ],
    "steps": [
      "Obtain the product's written temperature and handling specification.",
      "Confirm trailer condition and pre-cooling responsibility before loading.",
      "Agree on the operating mode and temperature documentation with the carrier.",
      "Set the receiver's appointment and the process for documenting any exception."
    ],
    "risk": "Do not assume a generic frozen-food temperature or operating mode. The shipper's product specification and carrier acceptance govern the shipment.",
    "faqs": [
      [
        "What setpoint should frozen food use?",
        "The shipper must specify the setpoint and tolerance for the actual product and packaging."
      ],
      [
        "Should a reefer be pre-cooled?",
        "Follow the shipper's written instructions and confirm responsibility with the carrier before loading."
      ],
      [
        "What if a temperature exception occurs?",
        "Use the agreed notification, documentation and disposition process; do not improvise a product-safety decision."
      ]
    ]
  },
  "dairy-reefer-freight-shipping": {
    "lead": "Dairy reefer freight requires clear product-specific temperature instructions, sanitation expectations and a receiving process that can handle the shipment on arrival.",
    "fit": "Packaged dairy products and other shipper-approved chilled goods suitable for the selected refrigerated trailer and carrier.",
    "check": [
      "Product type, packaging, pallet profile and total weight",
      "Written temperature setpoint, tolerance and operating instructions",
      "Trailer sanitation, previous-load and wash documentation requirements",
      "Pre-cooling, loading sequence, seal and temperature-record needs",
      "Pickup/delivery appointments and receiver inspection process"
    ],
    "steps": [
      "Collect the product specification and any food-safety handling instructions.",
      "Confirm trailer cleanliness, prior-load acceptance and required documentation.",
      "Agree on temperature instructions, loading time and seal process.",
      "Coordinate the receiver's appointment and exception-reporting contact."
    ],
    "risk": "Dairy products do not all share one shipping specification. Do not infer temperatures, sanitation standards or previous-load acceptance; obtain written requirements from the shipper and receiver.",
    "faqs": [
      [
        "Can all dairy products use the same reefer setting?",
        "No. Product type, packaging and shipper requirements determine the written setpoint and tolerance."
      ],
      [
        "What sanitation records may be required?",
        "The shipper or receiver may specify wash, inspection or previous-load documentation; confirm before dispatch."
      ],
      [
        "Who confirms the receiving temperature process?",
        "The shipper and receiver should define the inspection and documentation requirements before pickup."
      ]
    ]
  },
  "electrical-transformer-freight-transport": {
    "lead": "Transformer freight can involve concentrated weight, delicate components and lifting points that require a shipment-specific heavy-haul review.",
    "fit": "Electrical transformers and related power equipment that can be transported on a suitable trailer with an approved loading and route plan.",
    "check": [
      "Actual transport dimensions, weight, center of gravity and shipping configuration",
      "Manufacturer lifting points, skid/base design and protection requirements",
      "Crane capacity, loading surface, rigging responsibility and securement plan",
      "Trailer deck, axle configuration, loaded dimensions and route constraints",
      "Utility/site access, delivery window, unloading equipment and receiving contact"
    ],
    "steps": [
      "Obtain the manufacturer's transport drawing and actual shipping weight.",
      "Confirm lifting, blocking and securement requirements with qualified specialists.",
      "Have the carrier review trailer fit, weight distribution and route constraints.",
      "Confirm site access, unloading plan and delivery documentation before dispatch."
    ],
    "risk": "Transformer weights and lifting requirements vary widely. Do not infer capacity, lifting points, permits or route feasibility; qualified carrier and engineering review are required for the actual unit.",
    "faqs": [
      [
        "Can a transformer move on a standard flatbed?",
        "Some smaller units may, but weight, dimensions, center of gravity and loading requirements determine the equipment."
      ],
      [
        "Why is a transport drawing important?",
        "It identifies dimensions, weight distribution, lifting points and handling limits that a carrier needs to review."
      ],
      [
        "Does the freight quote include crane service?",
        "Not unless a separate crane and rigging scope is confirmed in writing."
      ]
    ]
  },
  "industrial-generator-freight-transport": {
    "lead": "Industrial-generator freight should be planned around the unit's shipping weight, dimensions, lifting points and preparation instructions rather than its electrical output rating.",
    "fit": "Packaged or skid-mounted industrial generators and related power equipment that fit a confirmed trailer and carrier handling plan.",
    "check": [
      "Manufacturer model, actual shipping weight and transport dimensions",
      "Skid, enclosure, exhaust, radiator and protruding-component protection",
      "Fuel or fluid status and shipper preparation instructions",
      "Lifting points, crane/forklift capacity and securement requirements",
      "Route, site access, unloading plan and receiving appointment"
    ],
    "steps": [
      "Request the generator's transport drawing and shipping configuration.",
      "Confirm any draining, isolation or preparation instructions with the shipper.",
      "Review loading points, trailer fit and securement with the carrier.",
      "Agree on the delivery point, unloading equipment and proof of delivery."
    ],
    "risk": "Do not assume a generator is empty, non-regulated or ready to load. Follow the manufacturer's and shipper's preparation instructions and have the carrier review the actual shipment.",
    "faqs": [
      [
        "What determines the trailer for a generator?",
        "Shipping dimensions, weight, skid configuration, loading method and route determine the suitable equipment."
      ],
      [
        "Should fuel or fluids be removed?",
        "Follow the manufacturer's, shipper's and applicable carrier instructions; disclose the actual condition before dispatch."
      ],
      [
        "Is installation part of transportation?",
        "No. Commissioning, electrical connection and installation are separate services unless expressly contracted."
      ]
    ]
  }
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
