import { db, deadzonesTable } from "@workspace/db";

type SeedRow = {
  title: string;
  description: string;
  type: "cellular" | "wifi" | "gps" | "satellite";
  severity: "low" | "medium" | "high" | "total";
  signalStrength: number;
  latitude: number;
  longitude: number;
  carrier: string;
  reporter: string;
  address?: string;
  confirmations: number;
  ageHours: number;
};

// Realistic India-focused dataset.
// dBm guidelines used here:
//   strong   : -65 .. -85
//   moderate : -90 .. -100
//   high     : -101 .. -110
//   total    : -111 .. -127
// Most rows are <12h old so the 24h weighted snapshot has live data.
const rows: SeedRow[] = [
  // ============================================================
  // MUMBAI METRO REGION
  // ============================================================
  { title: "No bars in Bandra-Worli Sea Link tunnel", description: "Total blackout for the entire 5km tunnel stretch. Calls drop and 4G never reconnects until exit.", type: "cellular", severity: "total", signalStrength: -120, latitude: 19.0359, longitude: 72.8202, carrier: "Jio", reporter: "Rohan", address: "Bandra-Worli Sea Link, Mumbai", confirmations: 47, ageHours: 4 },
  { title: "Crawl speeds at Dadar station underground platform", description: "5G drops to E. Couldn't load UPI app for 6 minutes during peak hour rush.", type: "cellular", severity: "high", signalStrength: -108, latitude: 19.0186, longitude: 72.8420, carrier: "Airtel", reporter: "Priya", address: "Dadar Western Railway Station", confirmations: 31, ageHours: 9 },
  { title: "Dharavi WiFi hotspot dead", description: "Free public WiFi consistently fails near 90 Feet Road. Connects but no internet.", type: "wifi", severity: "total", signalStrength: -110, latitude: 19.0383, longitude: 72.8538, carrier: "MTNL Free WiFi", reporter: "Anonymous", address: "90 Feet Road, Dharavi", confirmations: 22, ageHours: 18 },
  { title: "Patchy reception inside BKC underground parking", description: "Signal drops to 1 bar, calls cut off after 30 seconds.", type: "cellular", severity: "high", signalStrength: -105, latitude: 19.0654, longitude: 72.8678, carrier: "Vi", reporter: "Karan", address: "Bandra Kurla Complex Basement", confirmations: 18, ageHours: 32 },
  { title: "Powai IIT campus signal weak in hostels", description: "Hostel 12 rooms get 1-2 bars. WiFi calling works but Jio cellular fails.", type: "cellular", severity: "medium", signalStrength: -97, latitude: 19.1334, longitude: 72.9133, carrier: "Jio", reporter: "Student", address: "IIT Bombay Powai", confirmations: 24, ageHours: 3 },
  { title: "Mumbai Domestic Terminal 1B aerobridge", description: "Stepping into the aerobridge = signal vanishes. Only WiFi works.", type: "cellular", severity: "high", signalStrength: -106, latitude: 19.0896, longitude: 72.8656, carrier: "Airtel", reporter: "Frequent flyer", address: "CSMIA T1B", confirmations: 19, ageHours: 6 },
  { title: "Andheri Metro yellow line tunnel", description: "Long underground stretch between WEH and Andheri kills signal.", type: "cellular", severity: "total", signalStrength: -116, latitude: 19.1197, longitude: 72.8464, carrier: "Vi", reporter: "Daily commuter", address: "Andheri Metro Line 7", confirmations: 33, ageHours: 2 },
  { title: "Worli sea face evening congestion", description: "Joggers and tourists swarm in evening. 4G unusable 6-9 PM.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 19.0093, longitude: 72.8155, carrier: "Jio", reporter: "Runner", address: "Worli Sea Face", confirmations: 14, ageHours: 5 },
  { title: "Lower Parel Phoenix Mall basement food court", description: "Crowded weekends + basement = no signal. Card machines also fail intermittently.", type: "cellular", severity: "high", signalStrength: -104, latitude: 18.9956, longitude: 72.8253, carrier: "Airtel", reporter: "Shopper", address: "High Street Phoenix", confirmations: 28, ageHours: 7 },
  { title: "Marine Drive promenade GPS jitter", description: "Skyscraper canyon causes GPS to drift 50-100m. Cab pickup nightmare.", type: "gps", severity: "medium", signalStrength: -95, latitude: 18.9434, longitude: 72.8234, carrier: "N/A", reporter: "Anonymous", address: "Marine Drive, Mumbai", confirmations: 16, ageHours: 11 },
  { title: "Thane Ghodbunder Road tunnel zone", description: "Multiple short tunnels on the bypass cause repeated signal drops.", type: "cellular", severity: "high", signalStrength: -107, latitude: 19.2547, longitude: 72.9716, carrier: "Vi", reporter: "Commuter", address: "Ghodbunder Road, Thane", confirmations: 21, ageHours: 8 },
  { title: "Vashi creek bridge cellular dropoff", description: "Signal disappears for ~1km mid-bridge. Calls drop daily.", type: "cellular", severity: "high", signalStrength: -109, latitude: 19.0588, longitude: 72.9986, carrier: "Jio", reporter: "Driver", address: "Vashi Creek Bridge", confirmations: 26, ageHours: 1 },
  { title: "Navi Mumbai Belapur Sec-15 tower issue", description: "Whole sector lost Airtel coverage for 2 hours yesterday. Repaired but still patchy.", type: "cellular", severity: "high", signalStrength: -103, latitude: 19.0205, longitude: 73.0429, carrier: "Airtel", reporter: "Resident", address: "CBD Belapur Sector 15", confirmations: 11, ageHours: 14 },
  { title: "Chembur Eastern Freeway tunnel midpoint", description: "Tunnel is long enough to drop calls. Bring offline music.", type: "cellular", severity: "total", signalStrength: -118, latitude: 19.0444, longitude: 72.9050, carrier: "Vi", reporter: "Cabbie", address: "Eastern Freeway Tunnel", confirmations: 36, ageHours: 4 },

  // ============================================================
  // DELHI NCR
  // ============================================================
  { title: "Lutyens zone signal hole near India Gate", description: "Spotty 4G across the entire lawn area. UPI payments fail at food trucks.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 28.6129, longitude: 77.2295, carrier: "Jio", reporter: "Aarav", address: "Rajpath, New Delhi", confirmations: 56, ageHours: 2 },
  { title: "Yellow Line metro tunnel between Hauz Khas and Malviya Nagar", description: "Signal dies for ~90 seconds, comes back briefly then dies again.", type: "cellular", severity: "total", signalStrength: -118, latitude: 28.5440, longitude: 77.2066, carrier: "Airtel", reporter: "Meera", address: "DMRC Yellow Line", confirmations: 73, ageHours: 6 },
  { title: "Signal dead in Old Delhi Chandni Chowk lanes", description: "Heavy network congestion every evening. 5G unusable for 30+ minutes.", type: "cellular", severity: "high", signalStrength: -106, latitude: 28.6562, longitude: 77.2306, carrier: "Vi", reporter: "Imran", address: "Chandni Chowk Main Road", confirmations: 41, ageHours: 12 },
  { title: "GPS bounces around Connaught Place inner circle", description: "Map shows me 200m off. Cabs can't find me. Likely tall building reflections.", type: "gps", severity: "high", signalStrength: -102, latitude: 28.6304, longitude: 77.2177, carrier: "N/A", reporter: "Sneha", address: "Connaught Place, New Delhi", confirmations: 24, ageHours: 22 },
  { title: "BSNL fibre router shows no upstream", description: "Entire Lajpat Nagar block lost broadband for 4 hours yesterday.", type: "wifi", severity: "total", signalStrength: -115, latitude: 28.5677, longitude: 77.2436, carrier: "BSNL", reporter: "Vikram", address: "Lajpat Nagar II", confirmations: 33, ageHours: 28 },
  { title: "T3 IGI Airport security hold area", description: "5G drops as soon as you cross security. WiFi only.", type: "cellular", severity: "high", signalStrength: -105, latitude: 28.5562, longitude: 77.0886, carrier: "Jio", reporter: "Traveler", address: "IGI Airport Terminal 3", confirmations: 47, ageHours: 5 },
  { title: "Saket Select Citywalk basement 2 parking", description: "Two levels below grade = nothing. Couldn't pay parking via app.", type: "cellular", severity: "total", signalStrength: -114, latitude: 28.5283, longitude: 77.2197, carrier: "Airtel", reporter: "Shopper", address: "Select Citywalk Mall", confirmations: 19, ageHours: 9 },
  { title: "Gurgaon Cyber City underpass dead", description: "Tunnel between Tower B and DLF Phase 2 is a known black spot.", type: "cellular", severity: "high", signalStrength: -107, latitude: 28.4954, longitude: 77.0890, carrier: "Vi", reporter: "Tech worker", address: "Cyber City Gurgaon", confirmations: 38, ageHours: 3 },
  { title: "MG Road metro to Sikanderpur tunnel", description: "Rapid Metro short tunnel still drops calls each ride.", type: "cellular", severity: "high", signalStrength: -108, latitude: 28.4795, longitude: 77.0805, carrier: "Jio", reporter: "Commuter", address: "Rapid Metro Gurgaon", confirmations: 22, ageHours: 7 },
  { title: "Noida Sector 18 weekend crowd", description: "DLF Mall + Atta Market combine = total congestion every Saturday.", type: "cellular", severity: "high", signalStrength: -103, latitude: 28.5707, longitude: 77.3260, carrier: "Airtel", reporter: "Anonymous", address: "Noida Sector 18", confirmations: 31, ageHours: 4 },
  { title: "Dwarka Sector 21 metro junction", description: "Inside the interchange building cellular goes near zero.", type: "cellular", severity: "total", signalStrength: -117, latitude: 28.5520, longitude: 77.0584, carrier: "Vi", reporter: "Daily rider", address: "Dwarka Sector 21 Metro", confirmations: 26, ageHours: 8 },
  { title: "Faridabad NH-19 elevated stretch", description: "Service road gets full bars but elevated highway shows 1 bar at best.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 28.4089, longitude: 77.3178, carrier: "Jio", reporter: "Trucker", address: "NH-19 Faridabad", confirmations: 13, ageHours: 10 },
  { title: "Greater Noida West tower outage", description: "Sectors 1-4 of GN West lost Vi for half a day.", type: "cellular", severity: "total", signalStrength: -119, latitude: 28.6122, longitude: 77.4317, carrier: "Vi", reporter: "Resident", address: "Noida Extension", confirmations: 42, ageHours: 11 },
  { title: "Pragati Maidan tunnel midpoint", description: "Long new road tunnel = predictable signal loss for 90s.", type: "cellular", severity: "total", signalStrength: -116, latitude: 28.6127, longitude: 77.2438, carrier: "Airtel", reporter: "Driver", address: "Pragati Maidan Tunnel", confirmations: 29, ageHours: 2 },

  // ============================================================
  // BANGALORE
  // ============================================================
  { title: "Outer Ring Road traffic stuck and no signal", description: "Marathahalli to Sarjapur stretch has perpetual congestion AND total signal failure.", type: "cellular", severity: "total", signalStrength: -116, latitude: 12.9569, longitude: 77.7011, carrier: "Jio", reporter: "Pranav", address: "ORR Marathahalli", confirmations: 89, ageHours: 1 },
  { title: "Electronic City Phase 1 patchy 5G", description: "Inside tech parks signal vanishes. Need WiFi calling enabled to take meetings.", type: "cellular", severity: "high", signalStrength: -104, latitude: 12.8452, longitude: 77.6602, carrier: "Airtel", reporter: "Lakshmi", address: "Electronic City Phase 1", confirmations: 52, ageHours: 5 },
  { title: "Indiranagar Metro Pillar 95 dead spot", description: "Standing right under it = no calls. Walk 50m and full bars return.", type: "cellular", severity: "high", signalStrength: -107, latitude: 12.9784, longitude: 77.6408, carrier: "Vi", reporter: "Nikhil", address: "100 Feet Road, Indiranagar", confirmations: 19, ageHours: 14 },
  { title: "Cubbon Park GPS jitter", description: "Position locks then jumps 100m. Hard to navigate the park trails.", type: "gps", severity: "medium", signalStrength: -95, latitude: 12.9763, longitude: 77.5929, carrier: "N/A", reporter: "Tara", address: "Cubbon Park", confirmations: 11, ageHours: 36 },
  { title: "Whitefield ITPL underground food court", description: "Lunch time = no signal. Cards swiped instead of UPI.", type: "cellular", severity: "high", signalStrength: -108, latitude: 12.9849, longitude: 77.7367, carrier: "Jio", reporter: "Engineer", address: "ITPL Whitefield", confirmations: 35, ageHours: 4 },
  { title: "Bellary Road flyover near Hebbal", description: "Top deck of Hebbal flyover has weird Vi coverage. Calls dropping.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 13.0359, longitude: 77.5970, carrier: "Vi", reporter: "Cab driver", address: "Hebbal Flyover", confirmations: 17, ageHours: 9 },
  { title: "Koramangala 5th block cafe row", description: "Saturday afternoon cafes packed = network melts down.", type: "cellular", severity: "medium", signalStrength: -97, latitude: 12.9352, longitude: 77.6245, carrier: "Airtel", reporter: "Anonymous", address: "5th Block Koramangala", confirmations: 23, ageHours: 6 },
  { title: "Jayanagar 4th block underground parking", description: "Mall parking has no signal at all. Need to come up to call cab.", type: "cellular", severity: "total", signalStrength: -115, latitude: 12.9250, longitude: 77.5938, carrier: "Vi", reporter: "Shopper", address: "Jayanagar 4th Block", confirmations: 14, ageHours: 13 },
  { title: "Manyata Tech Park underpass", description: "Multiple buildings = signal interference + tunnel = call drop guarantee.", type: "cellular", severity: "high", signalStrength: -106, latitude: 13.0446, longitude: 77.6210, carrier: "Jio", reporter: "Techie", address: "Manyata Embassy Business Park", confirmations: 41, ageHours: 3 },
  { title: "Silk Board junction signal congestion", description: "Stuck in traffic + everyone on phone = no carrier works.", type: "cellular", severity: "high", signalStrength: -105, latitude: 12.9176, longitude: 77.6233, carrier: "Airtel", reporter: "Anonymous", address: "Silk Board Junction", confirmations: 67, ageHours: 2 },
  { title: "Banashankari BSNL tower dead", description: "Whole 2nd stage lost BSNL for half the day.", type: "cellular", severity: "total", signalStrength: -120, latitude: 12.9243, longitude: 77.5499, carrier: "BSNL", reporter: "Resident", address: "Banashankari 2nd Stage", confirmations: 18, ageHours: 8 },
  { title: "Kempegowda T2 satellite gates", description: "Bus gates 60+ have weakest reception in the airport. WiFi only.", type: "cellular", severity: "high", signalStrength: -107, latitude: 13.1979, longitude: 77.7076, carrier: "Vi", reporter: "Flyer", address: "BLR Airport Terminal 2", confirmations: 12, ageHours: 5 },

  // ============================================================
  // CHENNAI
  // ============================================================
  { title: "T Nagar shopping complex no 5G", description: "Pothys to Saravana Stores entire stretch barely 1 bar 4G.", type: "cellular", severity: "high", signalStrength: -103, latitude: 13.0418, longitude: 80.2341, carrier: "Jio", reporter: "Karthik", address: "Ranganathan Street, T Nagar", confirmations: 38, ageHours: 7 },
  { title: "Marina Beach south end signal weak", description: "From Lighthouse to Foreshore Estate signal degrades severely.", type: "cellular", severity: "medium", signalStrength: -96, latitude: 13.0418, longitude: 80.2823, carrier: "Airtel", reporter: "Divya", address: "Marina Beach, Chennai", confirmations: 14, ageHours: 19 },
  { title: "Velachery MRTS station dead", description: "Inside the station no carrier works. Even satellite GPS struggles.", type: "cellular", severity: "total", signalStrength: -114, latitude: 12.9775, longitude: 80.2207, carrier: "Vi", reporter: "Hari", address: "Velachery MRTS", confirmations: 27, ageHours: 11 },
  { title: "Anna Nagar Tower Park shadow", description: "Tall buildings around the park create a dead patch on the western edge.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 13.0876, longitude: 80.2148, carrier: "Jio", reporter: "Walker", address: "Anna Nagar Tower Park", confirmations: 9, ageHours: 5 },
  { title: "Chennai Central station platform 1", description: "Platform end signal is fine, middle is dead. Weird.", type: "cellular", severity: "high", signalStrength: -106, latitude: 13.0832, longitude: 80.2755, carrier: "Airtel", reporter: "Traveler", address: "MGR Chennai Central", confirmations: 22, ageHours: 4 },
  { title: "OMR Sholinganallur stretch evening", description: "IT crowds heading home - 4G crawls.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 12.9007, longitude: 80.2278, carrier: "Vi", reporter: "Engineer", address: "OMR Sholinganallur", confirmations: 31, ageHours: 2 },
  { title: "Chennai airport T2 walkalator zone", description: "Long underground tube to the gates kills signal.", type: "cellular", severity: "high", signalStrength: -109, latitude: 12.9941, longitude: 80.1709, carrier: "Jio", reporter: "Flyer", address: "MAA Airport T2", confirmations: 16, ageHours: 6 },
  { title: "Mylapore Kapaleeshwarar temple lanes", description: "Narrow lanes + iron grills = signal blocked. Festival days unusable.", type: "cellular", severity: "high", signalStrength: -104, latitude: 13.0337, longitude: 80.2697, carrier: "Airtel", reporter: "Pilgrim", address: "Mylapore", confirmations: 11, ageHours: 12 },

  // ============================================================
  // KOLKATA
  // ============================================================
  { title: "Howrah Bridge midspan signal drop", description: "Signal flatlines exactly mid-bridge. Both directions affected.", type: "cellular", severity: "total", signalStrength: -119, latitude: 22.5851, longitude: 88.3468, carrier: "Jio", reporter: "Soumya", address: "Howrah Bridge", confirmations: 64, ageHours: 3 },
  { title: "Park Street weekend congestion", description: "Saturday evening crowds = network meltdown. Taxis can't be booked.", type: "cellular", severity: "high", signalStrength: -101, latitude: 22.5544, longitude: 88.3525, carrier: "Airtel", reporter: "Anonymous", address: "Park Street, Kolkata", confirmations: 29, ageHours: 16 },
  { title: "Salt Lake Sector V tower outage", description: "BSNL tower offline for 8 hours. Whole sector affected.", type: "cellular", severity: "total", signalStrength: -113, latitude: 22.5762, longitude: 88.4332, carrier: "BSNL", reporter: "Rajat", address: "Salt Lake Sector V", confirmations: 45, ageHours: 26 },
  { title: "Esplanade metro interchange tunnel", description: "Switching lines underground = no signal for the entire walk.", type: "cellular", severity: "total", signalStrength: -117, latitude: 22.5648, longitude: 88.3517, carrier: "Vi", reporter: "Commuter", address: "Esplanade Metro", confirmations: 33, ageHours: 5 },
  { title: "Garia Metro depot end of line", description: "End of South line has notoriously weak Jio coverage on platform.", type: "cellular", severity: "high", signalStrength: -107, latitude: 22.4720, longitude: 88.3950, carrier: "Jio", reporter: "Daily rider", address: "Kavi Subhash Metro", confirmations: 18, ageHours: 7 },
  { title: "Vidyasagar Setu midway", description: "Same issue as Howrah Bridge. Mid-cable suspended bridge = signal void.", type: "cellular", severity: "total", signalStrength: -118, latitude: 22.5577, longitude: 88.3220, carrier: "Airtel", reporter: "Driver", address: "Vidyasagar Setu", confirmations: 27, ageHours: 4 },
  { title: "New Town Action Area III patchy", description: "Newer areas still have weak coverage in evening.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 22.5800, longitude: 88.4779, carrier: "Vi", reporter: "Resident", address: "New Town Kolkata", confirmations: 19, ageHours: 9 },

  // ============================================================
  // HYDERABAD
  // ============================================================
  { title: "HITEC City underground food court no signal", description: "Lunch hour and zero connectivity. Cashier asked us to come back later for UPI.", type: "cellular", severity: "high", signalStrength: -106, latitude: 17.4486, longitude: 78.3908, carrier: "Jio", reporter: "Sai", address: "HITEC City, Hyderabad", confirmations: 35, ageHours: 8 },
  { title: "Charminar zone signal fluctuates", description: "Old city has narrow lanes. Signal flips between 5G and no service every 10 seconds.", type: "cellular", severity: "medium", signalStrength: -97, latitude: 17.3616, longitude: 78.4747, carrier: "Vi", reporter: "Fatima", address: "Charminar, Hyderabad", confirmations: 17, ageHours: 21 },
  { title: "Gachibowli stadium parking GPS off", description: "GPS shows me inside the stadium when I'm in the parking lot.", type: "gps", severity: "high", signalStrength: -100, latitude: 17.4239, longitude: 78.3499, carrier: "N/A", reporter: "Anonymous", address: "GMC Balayogi Stadium", confirmations: 9, ageHours: 40 },
  { title: "Banjara Hills Road No 12 dead patch", description: "Signal fades on the slope between Care Hospital and KBR Park.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 17.4156, longitude: 78.4367, carrier: "Airtel", reporter: "Walker", address: "Banjara Hills Road 12", confirmations: 12, ageHours: 6 },
  { title: "Secunderabad railway platform 10", description: "Far end platforms get weak signal. Worse during rush.", type: "cellular", severity: "high", signalStrength: -106, latitude: 17.4339, longitude: 78.5006, carrier: "Jio", reporter: "Traveler", address: "Secunderabad Junction", confirmations: 23, ageHours: 5 },
  { title: "Hyderabad airport baggage claim 5", description: "Far carousel has weakest coverage in the arrival hall.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 17.2403, longitude: 78.4294, carrier: "Vi", reporter: "Flyer", address: "RGIA Hyderabad", confirmations: 14, ageHours: 4 },
  { title: "Outer Ring Road exit 11 underpass", description: "Short tunnel but enough to drop active calls.", type: "cellular", severity: "high", signalStrength: -107, latitude: 17.5103, longitude: 78.5044, carrier: "Airtel", reporter: "Driver", address: "ORR Hyderabad Exit 11", confirmations: 21, ageHours: 3 },

  // ============================================================
  // PUNE
  // ============================================================
  { title: "Pune-Mumbai expressway tunnel kilometre 7", description: "Long tunnel = no signal. Common knowledge but still annoying.", type: "cellular", severity: "total", signalStrength: -120, latitude: 18.7741, longitude: 73.4815, carrier: "Airtel", reporter: "Ajay", address: "Pune-Mumbai Expressway", confirmations: 91, ageHours: 5 },
  { title: "Koregaon Park cafe row WiFi dead", description: "Restaurant WiFi works, but 4G fails simultaneously across all carriers.", type: "wifi", severity: "high", signalStrength: -108, latitude: 18.5362, longitude: 73.8939, carrier: "Cafe WiFi", reporter: "Sara", address: "North Main Road, Koregaon Park", confirmations: 12, ageHours: 30 },
  { title: "Hinjewadi Phase 2 underpass", description: "Short tunnel between Phase 1 and 2 - signal drop predictable.", type: "cellular", severity: "high", signalStrength: -107, latitude: 18.5912, longitude: 73.7387, carrier: "Jio", reporter: "Techie", address: "Hinjewadi Phase 2", confirmations: 38, ageHours: 2 },
  { title: "Shivajinagar bus stand signal noise", description: "Lots of cellular interference, calls drop frequently.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 18.5320, longitude: 73.8543, carrier: "Vi", reporter: "Anonymous", address: "Shivajinagar PMPML Stand", confirmations: 15, ageHours: 7 },
  { title: "Magarpatta city central area weak", description: "Inner courtyards of office towers get 1 bar at best.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 18.5170, longitude: 73.9281, carrier: "Airtel", reporter: "Office worker", address: "Magarpatta City", confirmations: 22, ageHours: 4 },
  { title: "Lonavla railway tunnel approach", description: "Signal weak even before the tunnel begins. Western Ghats issue.", type: "cellular", severity: "high", signalStrength: -109, latitude: 18.7497, longitude: 73.4053, carrier: "BSNL", reporter: "Train rider", address: "Lonavla Khopoli Section", confirmations: 17, ageHours: 12 },
  { title: "Aundh DP Road weekend evening", description: "Restaurant district packed. Network unusable Friday-Sunday evenings.", type: "cellular", severity: "medium", signalStrength: -97, latitude: 18.5602, longitude: 73.8089, carrier: "Jio", reporter: "Anonymous", address: "Aundh DP Road", confirmations: 28, ageHours: 6 },

  // ============================================================
  // AHMEDABAD / SURAT / VADODARA
  // ============================================================
  { title: "Ahmedabad SG Highway underpass dead", description: "Vastrapur to Bodakdev underpass is short but kills active calls.", type: "cellular", severity: "high", signalStrength: -106, latitude: 23.0354, longitude: 72.5253, carrier: "Jio", reporter: "Driver", address: "SG Highway Vastrapur", confirmations: 24, ageHours: 5 },
  { title: "Manek Chowk evening market signal dead", description: "Old city night market crowd kills the cell coverage.", type: "cellular", severity: "high", signalStrength: -105, latitude: 23.0226, longitude: 72.5906, carrier: "Airtel", reporter: "Foodie", address: "Manek Chowk Ahmedabad", confirmations: 19, ageHours: 3 },
  { title: "Sabarmati riverfront west promenade", description: "Vi coverage drops walking south of Ellis Bridge. Weird shadow zone.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 23.0233, longitude: 72.5665, carrier: "Vi", reporter: "Walker", address: "Sabarmati Riverfront", confirmations: 11, ageHours: 8 },
  { title: "Surat Adajan diamond market lanes", description: "Crowded, multi-storey, very narrow - signal completely dies inside the buildings.", type: "cellular", severity: "high", signalStrength: -108, latitude: 21.1953, longitude: 72.7951, carrier: "Jio", reporter: "Trader", address: "Adajan Surat", confirmations: 26, ageHours: 4 },
  { title: "Vadodara Akota bridge midspan", description: "Vishwamitri river bridge has classic mid-span signal void.", type: "cellular", severity: "high", signalStrength: -109, latitude: 22.2933, longitude: 73.1730, carrier: "Airtel", reporter: "Commuter", address: "Akota Bridge Vadodara", confirmations: 14, ageHours: 9 },

  // ============================================================
  // RAJASTHAN
  // ============================================================
  { title: "Jaipur Hawa Mahal lane signal drop", description: "Tourists stuck unable to book Uber. Ancient stone walls block signals.", type: "cellular", severity: "high", signalStrength: -106, latitude: 26.9239, longitude: 75.8267, carrier: "Vi", reporter: "Tourist", address: "Hawa Mahal Bazaar", confirmations: 21, ageHours: 6 },
  { title: "Amer Fort top approach road", description: "Climb up the hill = signal degrades to nothing midway.", type: "cellular", severity: "high", signalStrength: -108, latitude: 26.9855, longitude: 75.8513, carrier: "Jio", reporter: "Trekker", address: "Amer Fort Jaipur", confirmations: 15, ageHours: 11 },
  { title: "Udaipur Lake Pichola boat ride dead", description: "On the water, surrounded by hills - signal drops to zero.", type: "cellular", severity: "total", signalStrength: -116, latitude: 24.5714, longitude: 73.6800, carrier: "Airtel", reporter: "Tourist", address: "Lake Pichola Udaipur", confirmations: 9, ageHours: 14 },
  { title: "Jodhpur Mehrangarh fort interior", description: "Inside the fort museums there's effectively no carrier signal.", type: "cellular", severity: "total", signalStrength: -117, latitude: 26.2978, longitude: 73.0188, carrier: "Vi", reporter: "Visitor", address: "Mehrangarh Jodhpur", confirmations: 12, ageHours: 9 },
  { title: "Jaisalmer desert camp area", description: "30km outside Jaisalmer - only BSNL works, and barely.", type: "cellular", severity: "total", signalStrength: -122, latitude: 26.7574, longitude: 70.6457, carrier: "BSNL", reporter: "Camper", address: "Sam Sand Dunes", confirmations: 18, ageHours: 36 },

  // ============================================================
  // UTTAR PRADESH / BIHAR
  // ============================================================
  { title: "Lucknow Hazratganj Sahara Ganj basement", description: "Mall basement parking has zero signal. Common complaint.", type: "cellular", severity: "total", signalStrength: -114, latitude: 26.8467, longitude: 80.9462, carrier: "Jio", reporter: "Shopper", address: "Sahara Ganj Lucknow", confirmations: 20, ageHours: 7 },
  { title: "Varanasi Dashashwamedh Ghat aarti time", description: "Evening crowds = phones useless. Plan to meet at landmarks beforehand.", type: "cellular", severity: "high", signalStrength: -107, latitude: 25.3076, longitude: 83.0103, carrier: "Airtel", reporter: "Pilgrim", address: "Dashashwamedh Ghat Varanasi", confirmations: 47, ageHours: 4 },
  { title: "Kanpur Cantonment area BSNL down", description: "BSNL coverage in cantt area unstable for 2 days.", type: "cellular", severity: "total", signalStrength: -119, latitude: 26.4499, longitude: 80.3319, carrier: "BSNL", reporter: "Soldier", address: "Kanpur Cantt", confirmations: 14, ageHours: 18 },
  { title: "Allahabad Sangam Kumbh ground signal melts", description: "During mela network completely overwhelmed. Use radios instead.", type: "cellular", severity: "total", signalStrength: -118, latitude: 25.4221, longitude: 81.8881, carrier: "Vi", reporter: "Volunteer", address: "Sangam Prayagraj", confirmations: 38, ageHours: 5 },
  { title: "Patna Gandhi Maidan Dak Bungalow Chowk", description: "Junction always congested - cellular coverage cracks under load.", type: "cellular", severity: "high", signalStrength: -105, latitude: 25.6093, longitude: 85.1376, carrier: "Jio", reporter: "Local", address: "Gandhi Maidan Patna", confirmations: 22, ageHours: 6 },
  { title: "Bodh Gaya Mahabodhi temple area", description: "Heritage zone restrictions limit tower density. Patchy in peak season.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 24.6957, longitude: 84.9912, carrier: "Airtel", reporter: "Pilgrim", address: "Bodh Gaya", confirmations: 11, ageHours: 13 },

  // ============================================================
  // CENTRAL / WEST INDIA
  // ============================================================
  { title: "Bhopal Upper Lake side road dead", description: "Stretch alongside the lake has weak Vi coverage all day.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 23.2417, longitude: 77.3717, carrier: "Vi", reporter: "Resident", address: "Upper Lake VIP Road", confirmations: 13, ageHours: 8 },
  { title: "Indore Rajwada chowk signal jam", description: "Heritage market lanes - coverage breaks completely on weekends.", type: "cellular", severity: "high", signalStrength: -106, latitude: 22.7196, longitude: 75.8577, carrier: "Jio", reporter: "Foodie", address: "Rajwada Indore", confirmations: 25, ageHours: 5 },
  { title: "Nagpur Sitabuldi market", description: "Old market - tightly packed lanes - signal always weak.", type: "cellular", severity: "medium", signalStrength: -101, latitude: 21.1466, longitude: 79.0892, carrier: "Airtel", reporter: "Shopper", address: "Sitabuldi Nagpur", confirmations: 18, ageHours: 7 },
  { title: "Raipur railway station underpass", description: "Subway between platforms has dead spot lasting ~30s walk.", type: "cellular", severity: "high", signalStrength: -107, latitude: 21.2511, longitude: 81.6296, carrier: "Vi", reporter: "Traveler", address: "Raipur Junction", confirmations: 9, ageHours: 10 },

  // ============================================================
  // EAST INDIA / NE
  // ============================================================
  { title: "Bhubaneswar Lingaraj temple lanes", description: "Temple complex lanes too narrow + concrete = dead spot.", type: "cellular", severity: "high", signalStrength: -106, latitude: 20.2382, longitude: 85.8336, carrier: "Jio", reporter: "Pilgrim", address: "Lingaraj Temple Bhubaneswar", confirmations: 17, ageHours: 6 },
  { title: "Cuttack Mahanadi bridge midspan", description: "Long bridge - mid-span signal drops every time.", type: "cellular", severity: "high", signalStrength: -109, latitude: 20.4636, longitude: 85.8779, carrier: "Airtel", reporter: "Commuter", address: "Mahanadi Bridge Cuttack", confirmations: 14, ageHours: 4 },
  { title: "Guwahati Fancy Bazaar signal weak", description: "Old markets near the river get patchy 4G.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 26.1808, longitude: 91.7459, carrier: "Vi", reporter: "Local", address: "Fancy Bazaar Guwahati", confirmations: 11, ageHours: 9 },
  { title: "Shillong Police Bazaar weekend", description: "Tourist hub - weekends saturate the network.", type: "cellular", severity: "high", signalStrength: -104, latitude: 25.5788, longitude: 91.8933, carrier: "Jio", reporter: "Tourist", address: "Police Bazaar Shillong", confirmations: 23, ageHours: 5 },
  { title: "Tawang Sela Pass dead zone", description: "13700ft pass - only military comms work. Tourists stranded.", type: "satellite", severity: "total", signalStrength: -126, latitude: 27.5036, longitude: 92.0923, carrier: "BSNL", reporter: "Trekker", address: "Sela Pass Arunachal", confirmations: 32, ageHours: 50 },
  { title: "Gangtok MG Marg tourist crowd", description: "Pedestrian-only main street - weekend crowds melt the cell sites.", type: "cellular", severity: "high", signalStrength: -105, latitude: 27.3389, longitude: 88.6065, carrier: "Airtel", reporter: "Tourist", address: "MG Marg Gangtok", confirmations: 19, ageHours: 8 },
  { title: "Darjeeling toy train Batasia loop", description: "Mountain bend in the railway - signal drops at the loop.", type: "cellular", severity: "high", signalStrength: -107, latitude: 27.0144, longitude: 88.2581, carrier: "Vi", reporter: "Tourist", address: "Batasia Loop Darjeeling", confirmations: 12, ageHours: 11 },

  // ============================================================
  // SOUTH INDIA EXTRAS
  // ============================================================
  { title: "Coimbatore Brookefields mall basement", description: "Underground food court loses signal completely.", type: "cellular", severity: "high", signalStrength: -107, latitude: 11.0042, longitude: 76.9612, carrier: "Jio", reporter: "Shopper", address: "Brookefields Mall Coimbatore", confirmations: 15, ageHours: 5 },
  { title: "Madurai Meenakshi temple east tower", description: "Temple structure blocks signal - calls dropped for many visitors.", type: "cellular", severity: "high", signalStrength: -106, latitude: 9.9195, longitude: 78.1196, carrier: "Airtel", reporter: "Pilgrim", address: "Meenakshi Temple Madurai", confirmations: 18, ageHours: 6 },
  { title: "Trivandrum Padmanabhaswamy temple area", description: "Strict heritage zone limits towers. Signal weak around all sides.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 8.4827, longitude: 76.9434, carrier: "Vi", reporter: "Visitor", address: "Padmanabhaswamy Trivandrum", confirmations: 13, ageHours: 8 },
  { title: "Kochi Lulu Mall basement parking", description: "Two basements down - cellular fully dead. Use mall WiFi.", type: "cellular", severity: "total", signalStrength: -113, latitude: 10.0276, longitude: 76.3081, carrier: "Jio", reporter: "Shopper", address: "Lulu Mall Kochi", confirmations: 27, ageHours: 4 },
  { title: "Kochi Marine Drive walkway", description: "Backwater side of the walkway has weird Airtel coverage gaps.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 9.9776, longitude: 76.2772, carrier: "Airtel", reporter: "Walker", address: "Marine Drive Kochi", confirmations: 9, ageHours: 7 },
  { title: "Mangalore Pilikula Nisarga Dhama", description: "Forested park - many spots have no signal at all.", type: "cellular", severity: "high", signalStrength: -108, latitude: 12.9217, longitude: 74.9072, carrier: "BSNL", reporter: "Visitor", address: "Pilikula Mangalore", confirmations: 11, ageHours: 12 },
  { title: "Mysore Chamundi Hills approach", description: "Driving up the hill - signal degrades till there's none at the top.", type: "cellular", severity: "high", signalStrength: -109, latitude: 12.2724, longitude: 76.6722, carrier: "Vi", reporter: "Driver", address: "Chamundi Hills Mysore", confirmations: 16, ageHours: 5 },

  // ============================================================
  // HILL STATIONS / TOURIST
  // ============================================================
  { title: "Shimla mall road weekend crowd", description: "Tourist season brings everything to a halt. Even SMS fails.", type: "cellular", severity: "high", signalStrength: -104, latitude: 31.1042, longitude: 77.1734, carrier: "Jio", reporter: "Anonymous", address: "Mall Road, Shimla", confirmations: 26, ageHours: 13 },
  { title: "Manali to Rohtang Pass total dead", description: "Beyond Solang valley nothing works. Bring satellite phone if going further.", type: "satellite", severity: "total", signalStrength: -125, latitude: 32.3653, longitude: 77.2467, carrier: "BSNL", reporter: "Trekker", address: "Rohtang Pass approach", confirmations: 38, ageHours: 48 },
  { title: "Leh Ladakh Khardung La pass", description: "World's highest motorable road, world's worst connectivity. No carrier works.", type: "cellular", severity: "total", signalStrength: -127, latitude: 34.2778, longitude: 77.6041, carrier: "BSNL", reporter: "Bike rider", address: "Khardung La, Ladakh", confirmations: 52, ageHours: 72 },
  { title: "Goa Anjuna beach evening signal weak", description: "Tourist season brings huge crowds. Network struggles every Friday-Sunday.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 15.5740, longitude: 73.7400, carrier: "Vi", reporter: "Anonymous", address: "Anjuna Beach, Goa", confirmations: 15, ageHours: 24 },
  { title: "Mussoorie mall road Picture Palace", description: "Tourist hill town - peak season totally saturates the network.", type: "cellular", severity: "high", signalStrength: -106, latitude: 30.4598, longitude: 78.0664, carrier: "Jio", reporter: "Tourist", address: "Mall Road Mussoorie", confirmations: 14, ageHours: 8 },
  { title: "Nainital lake boat club", description: "On the water + hills around - cellular gives up entirely.", type: "cellular", severity: "total", signalStrength: -115, latitude: 29.3915, longitude: 79.4596, carrier: "Airtel", reporter: "Tourist", address: "Naini Lake", confirmations: 11, ageHours: 16 },
  { title: "Ooty botanical garden eastern slope", description: "Hilly garden with thick canopy = signal poor everywhere.", type: "cellular", severity: "high", signalStrength: -107, latitude: 11.4154, longitude: 76.7053, carrier: "Vi", reporter: "Tourist", address: "Ooty Botanical Garden", confirmations: 9, ageHours: 11 },
  { title: "Kodaikanal Coaker's Walk", description: "Cliff edge promenade has unpredictable signal. Better hold off on calls.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 10.2381, longitude: 77.4892, carrier: "BSNL", reporter: "Walker", address: "Coaker's Walk Kodaikanal", confirmations: 8, ageHours: 19 },
  { title: "Auli ski slope mid-mountain", description: "Halfway up the cable car - signal disappears. Don't try video calls.", type: "cellular", severity: "total", signalStrength: -118, latitude: 30.5294, longitude: 79.5644, carrier: "Jio", reporter: "Skier", address: "Auli Uttarakhand", confirmations: 14, ageHours: 22 },
  { title: "Spiti valley Kaza market", description: "Only Jio post-paid works in Kaza, and only patchy.", type: "cellular", severity: "high", signalStrength: -109, latitude: 32.2242, longitude: 78.0716, carrier: "Jio", reporter: "Backpacker", address: "Kaza Spiti", confirmations: 17, ageHours: 28 },
  { title: "Coorg Madikeri fort hilltop", description: "Vi coverage drops on the southern slope of the fort.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 12.4244, longitude: 75.7382, carrier: "Vi", reporter: "Traveler", address: "Madikeri Fort Coorg", confirmations: 10, ageHours: 7 },

  // ============================================================
  // COASTAL / KERALA / ANDAMAN
  // ============================================================
  { title: "Munnar tea estates signal void", description: "Drove through 20km of dead zone in the hills.", type: "cellular", severity: "total", signalStrength: -118, latitude: 10.0889, longitude: 77.0595, carrier: "Airtel", reporter: "Tourist", address: "Munnar tea gardens", confirmations: 21, ageHours: 60 },
  { title: "Andaman Havelock island patchy 4G", description: "Only one carrier works near the resorts. Beach areas are fully dark.", type: "cellular", severity: "high", signalStrength: -109, latitude: 11.9714, longitude: 92.9870, carrier: "BSNL", reporter: "Diver", address: "Havelock Island, Andaman", confirmations: 7, ageHours: 84 },
  { title: "Alleppey backwaters houseboat zone", description: "On the water in Vembanad lake - cellular cuts in and out.", type: "cellular", severity: "high", signalStrength: -110, latitude: 9.4981, longitude: 76.3388, carrier: "Jio", reporter: "Honeymooner", address: "Vembanad Backwaters", confirmations: 13, ageHours: 14 },
  { title: "Lakshadweep Agatti island", description: "Outside the resort + main settlement = no usable cellular.", type: "satellite", severity: "total", signalStrength: -123, latitude: 10.8580, longitude: 72.1944, carrier: "BSNL", reporter: "Diver", address: "Agatti Lakshadweep", confirmations: 9, ageHours: 96 },
  { title: "Gokarna Om Beach trek", description: "Coastal trek between beaches has long dead stretches.", type: "cellular", severity: "high", signalStrength: -111, latitude: 14.5470, longitude: 74.3151, carrier: "Vi", reporter: "Backpacker", address: "Om Beach Gokarna", confirmations: 8, ageHours: 30 },
  { title: "Pondicherry promenade north end", description: "Far end of Rock Beach has unpredictable Airtel coverage.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 11.9420, longitude: 79.8348, carrier: "Airtel", reporter: "Walker", address: "Rock Beach Pondicherry", confirmations: 12, ageHours: 9 },

  // ============================================================
  // HIGHWAYS / EXPRESSWAYS
  // ============================================================
  { title: "NH-44 Kashmir tunnel Banihal-Qazigund", description: "9km tunnel - no service from entry to exit.", type: "cellular", severity: "total", signalStrength: -120, latitude: 33.5089, longitude: 75.1850, carrier: "BSNL", reporter: "Trucker", address: "Banihal Tunnel J&K", confirmations: 41, ageHours: 14 },
  { title: "Yamuna Expressway km 80", description: "Open fields stretch but tower spacing leaves a gap here.", type: "cellular", severity: "medium", signalStrength: -101, latitude: 27.7619, longitude: 78.0083, carrier: "Vi", reporter: "Driver", address: "Yamuna Expressway", confirmations: 10, ageHours: 6 },
  { title: "Mumbai-Pune expressway Khandala drop", description: "Steep ghat section - signal flickers all the way down.", type: "cellular", severity: "high", signalStrength: -108, latitude: 18.7607, longitude: 73.3776, carrier: "Jio", reporter: "Driver", address: "Khandala Ghat MPEW", confirmations: 35, ageHours: 3 },
  { title: "Agra-Lucknow Expressway km 120", description: "Long stretch with sparse towers - signal drops for ~3km.", type: "cellular", severity: "medium", signalStrength: -100, latitude: 26.8500, longitude: 80.0167, carrier: "Airtel", reporter: "Trucker", address: "Agra-Lucknow Expy", confirmations: 14, ageHours: 7 },
  { title: "Eastern Peripheral Expressway Sonipat exit", description: "Junction area has weird signal void - Vi specifically affected.", type: "cellular", severity: "medium", signalStrength: -101, latitude: 28.9931, longitude: 77.0151, carrier: "Vi", reporter: "Driver", address: "EPE Sonipat", confirmations: 11, ageHours: 8 },
  { title: "Atal Tunnel Rohtang exit", description: "Coming out of the 9km tunnel - signal takes 2 minutes to recover.", type: "cellular", severity: "total", signalStrength: -119, latitude: 32.3597, longitude: 77.2444, carrier: "BSNL", reporter: "Tourist", address: "Atal Tunnel North Portal", confirmations: 28, ageHours: 18 },
  { title: "Mumbai Coastal Road tunnel section", description: "Newly opened tunnel - cell coverage not yet installed inside.", type: "cellular", severity: "total", signalStrength: -117, latitude: 18.9601, longitude: 72.8083, carrier: "Jio", reporter: "Driver", address: "Mumbai Coastal Road", confirmations: 32, ageHours: 4 },
  { title: "Bangalore-Mysore Expressway Maddur stretch", description: "Open stretch but signal patchy on Vi/Idea network.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 12.5828, longitude: 77.0481, carrier: "Vi", reporter: "Driver", address: "Bangalore-Mysore Expressway", confirmations: 17, ageHours: 5 },

  // ============================================================
  // STADIUMS / LARGE EVENTS / METROS
  // ============================================================
  { title: "Eden Gardens IPL match cellular jam", description: "60k people on phones = network completely overloaded by 1st innings.", type: "cellular", severity: "high", signalStrength: -106, latitude: 22.5645, longitude: 88.3433, carrier: "Jio", reporter: "Fan", address: "Eden Gardens Kolkata", confirmations: 53, ageHours: 5 },
  { title: "Wankhede Stadium upper tier", description: "Match days - upper tier signal drops hard. UPI for snacks impossible.", type: "cellular", severity: "high", signalStrength: -107, latitude: 18.9389, longitude: 72.8258, carrier: "Airtel", reporter: "Fan", address: "Wankhede Stadium Mumbai", confirmations: 41, ageHours: 6 },
  { title: "Chinnaswamy Stadium long queue", description: "Queue outside the stadium gets no signal. Pre-buy tickets!", type: "cellular", severity: "medium", signalStrength: -100, latitude: 12.9789, longitude: 77.5993, carrier: "Vi", reporter: "Fan", address: "Chinnaswamy Stadium Bangalore", confirmations: 22, ageHours: 8 },
  { title: "Narendra Modi Stadium parking", description: "Massive stadium parking has dead pockets where cars never get signal.", type: "cellular", severity: "high", signalStrength: -109, latitude: 23.0922, longitude: 72.5973, carrier: "Jio", reporter: "Driver", address: "Motera Stadium Ahmedabad", confirmations: 18, ageHours: 12 },
  { title: "Delhi Metro Pink Line Mayur Vihar tunnel", description: "Signal dies twice on this stretch - both directions.", type: "cellular", severity: "total", signalStrength: -116, latitude: 28.6075, longitude: 77.2939, carrier: "Airtel", reporter: "Commuter", address: "Mayur Vihar Pink Line", confirmations: 19, ageHours: 4 },
  { title: "Mumbai Metro Aqua Line BKC tunnel", description: "Underground stretch BKC to Vidyanagari kills signal completely.", type: "cellular", severity: "total", signalStrength: -118, latitude: 19.0596, longitude: 72.8636, carrier: "Vi", reporter: "Commuter", address: "BKC Metro Station", confirmations: 24, ageHours: 3 },
  { title: "Namma Metro Purple Line Trinity tunnel", description: "Trinity to MG Road tunnel - 60s no signal.", type: "cellular", severity: "total", signalStrength: -117, latitude: 12.9722, longitude: 77.6181, carrier: "Jio", reporter: "Commuter", address: "Trinity Metro Bangalore", confirmations: 21, ageHours: 5 },

  // ============================================================
  // RANDOM URBAN GPS / SAT
  // ============================================================
  { title: "GPS multipath in Mumbai Lower Parel skyscrapers", description: "Tall glass towers reflect signal. GPS shows me 3 buildings over.", type: "gps", severity: "high", signalStrength: -101, latitude: 19.0073, longitude: 72.8302, carrier: "N/A", reporter: "Anonymous", address: "Lower Parel Mumbai", confirmations: 13, ageHours: 6 },
  { title: "Delhi Aerocity GPS confused", description: "Hotel cluster gives Uber drivers wrong pickup point every time.", type: "gps", severity: "medium", signalStrength: -97, latitude: 28.5478, longitude: 77.1188, carrier: "N/A", reporter: "Hotel guest", address: "Aerocity Delhi", confirmations: 15, ageHours: 10 },
  { title: "Bangalore UB City basement GPS lost", description: "GPS ceases entirely once you go down to basement levels.", type: "gps", severity: "total", signalStrength: -112, latitude: 12.9719, longitude: 77.5946, carrier: "N/A", reporter: "Driver", address: "UB City Bangalore", confirmations: 11, ageHours: 8 },
];

async function main() {
  console.log("Clearing deadzones table...");
  await db.delete(deadzonesTable);

  console.log(`Inserting ${rows.length} India-focused seed rows...`);
  const now = Date.now();
  for (const r of rows) {
    await db.insert(deadzonesTable).values({
      title: r.title,
      description: r.description,
      type: r.type,
      severity: r.severity,
      signalStrength: r.signalStrength,
      latitude: r.latitude,
      longitude: r.longitude,
      carrier: r.carrier,
      reporter: r.reporter,
      address: r.address ?? null,
      confirmations: r.confirmations,
      createdAt: new Date(now - r.ageHours * 60 * 60 * 1000),
    });
  }
  console.log(`Seed complete — ${rows.length} reports inserted.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
