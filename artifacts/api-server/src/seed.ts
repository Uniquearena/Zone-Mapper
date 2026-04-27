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

const rows: SeedRow[] = [
  // Mumbai
  { title: "No bars in Bandra-Worli Sea Link tunnel", description: "Total blackout for the entire 5km tunnel stretch. Calls drop and 4G never reconnects until exit.", type: "cellular", severity: "total", signalStrength: -120, latitude: 19.0359, longitude: 72.8202, carrier: "Jio", reporter: "Rohan", address: "Bandra-Worli Sea Link, Mumbai", confirmations: 47, ageHours: 4 },
  { title: "Crawl speeds at Dadar station underground platform", description: "5G drops to E. Couldn't load UPI app for 6 minutes during peak hour rush.", type: "cellular", severity: "high", signalStrength: -108, latitude: 19.0186, longitude: 72.8420, carrier: "Airtel", reporter: "Priya", address: "Dadar Western Railway Station", confirmations: 31, ageHours: 9 },
  { title: "Dharavi WiFi hotspot dead", description: "Free public WiFi consistently fails near 90 Feet Road. Connects but no internet.", type: "wifi", severity: "total", signalStrength: -110, latitude: 19.0383, longitude: 72.8538, carrier: "MTNL Free WiFi", reporter: "Anonymous", address: "90 Feet Road, Dharavi", confirmations: 22, ageHours: 18 },
  { title: "Patchy reception inside BKC underground parking", description: "Signal drops to 1 bar, calls cut off after 30 seconds.", type: "cellular", severity: "high", signalStrength: -105, latitude: 19.0654, longitude: 72.8678, carrier: "Vi", reporter: "Karan", address: "Bandra Kurla Complex Basement", confirmations: 18, ageHours: 32 },

  // Delhi NCR
  { title: "Lutyens zone signal hole near India Gate", description: "Spotty 4G across the entire lawn area. UPI payments fail at food trucks.", type: "cellular", severity: "medium", signalStrength: -98, latitude: 28.6129, longitude: 77.2295, carrier: "Jio", reporter: "Aarav", address: "Rajpath, New Delhi", confirmations: 56, ageHours: 2 },
  { title: "Yellow Line metro tunnel between Hauz Khas and Malviya Nagar", description: "Signal dies for ~90 seconds, comes back briefly then dies again.", type: "cellular", severity: "total", signalStrength: -118, latitude: 28.5440, longitude: 77.2066, carrier: "Airtel", reporter: "Meera", address: "DMRC Yellow Line", confirmations: 73, ageHours: 6 },
  { title: "Signal dead in Old Delhi Chandni Chowk lanes", description: "Heavy network congestion every evening. 5G unusable for 30+ minutes.", type: "cellular", severity: "high", signalStrength: -106, latitude: 28.6562, longitude: 77.2306, carrier: "Vi", reporter: "Imran", address: "Chandni Chowk Main Road", confirmations: 41, ageHours: 12 },
  { title: "GPS bounces around Connaught Place inner circle", description: "Map shows me 200m off. Cabs can't find me. Likely tall building reflections.", type: "gps", severity: "high", signalStrength: -102, latitude: 28.6304, longitude: 77.2177, carrier: "N/A", reporter: "Sneha", address: "Connaught Place, New Delhi", confirmations: 24, ageHours: 22 },
  { title: "BSNL fibre router shows no upstream", description: "Entire Lajpat Nagar block lost broadband for 4 hours yesterday.", type: "wifi", severity: "total", signalStrength: -115, latitude: 28.5677, longitude: 77.2436, carrier: "BSNL", reporter: "Vikram", address: "Lajpat Nagar II", confirmations: 33, ageHours: 28 },

  // Bangalore
  { title: "Outer Ring Road traffic stuck and no signal", description: "Marathahalli to Sarjapur stretch has perpetual congestion AND total signal failure.", type: "cellular", severity: "total", signalStrength: -116, latitude: 12.9569, longitude: 77.7011, carrier: "Jio", reporter: "Pranav", address: "ORR Marathahalli", confirmations: 89, ageHours: 1 },
  { title: "Electronic City Phase 1 patchy 5G", description: "Inside tech parks signal vanishes. Need WiFi calling enabled to take meetings.", type: "cellular", severity: "high", signalStrength: -104, latitude: 12.8452, longitude: 77.6602, carrier: "Airtel", reporter: "Lakshmi", address: "Electronic City Phase 1", confirmations: 52, ageHours: 5 },
  { title: "Indiranagar Metro Pillar 95 dead spot", description: "Standing right under it = no calls. Walk 50m and full bars return.", type: "cellular", severity: "high", signalStrength: -107, latitude: 12.9784, longitude: 77.6408, carrier: "Vi", reporter: "Nikhil", address: "100 Feet Road, Indiranagar", confirmations: 19, ageHours: 14 },
  { title: "Cubbon Park GPS jitter", description: "Position locks then jumps 100m. Hard to navigate the park trails.", type: "gps", severity: "medium", signalStrength: -95, latitude: 12.9763, longitude: 77.5929, carrier: "N/A", reporter: "Tara", address: "Cubbon Park", confirmations: 11, ageHours: 36 },

  // Chennai
  { title: "T Nagar shopping complex no 5G", description: "Pothys to Saravana Stores entire stretch barely 1 bar 4G.", type: "cellular", severity: "high", signalStrength: -103, latitude: 13.0418, longitude: 80.2341, carrier: "Jio", reporter: "Karthik", address: "Ranganathan Street, T Nagar", confirmations: 38, ageHours: 7 },
  { title: "Marina Beach south end signal weak", description: "From Lighthouse to Foreshore Estate signal degrades severely.", type: "cellular", severity: "medium", signalStrength: -96, latitude: 13.0418, longitude: 80.2823, carrier: "Airtel", reporter: "Divya", address: "Marina Beach, Chennai", confirmations: 14, ageHours: 19 },
  { title: "Velachery MRTS station dead", description: "Inside the station no carrier works. Even satellite GPS struggles.", type: "cellular", severity: "total", signalStrength: -114, latitude: 12.9775, longitude: 80.2207, carrier: "Vi", reporter: "Hari", address: "Velachery MRTS", confirmations: 27, ageHours: 11 },

  // Kolkata
  { title: "Howrah Bridge midspan signal drop", description: "Signal flatlines exactly mid-bridge. Both directions affected.", type: "cellular", severity: "total", signalStrength: -119, latitude: 22.5851, longitude: 88.3468, carrier: "Jio", reporter: "Soumya", address: "Howrah Bridge", confirmations: 64, ageHours: 3 },
  { title: "Park Street weekend congestion", description: "Saturday evening crowds = network meltdown. Taxis can't be booked.", type: "cellular", severity: "high", signalStrength: -101, latitude: 22.5544, longitude: 88.3525, carrier: "Airtel", reporter: "Anonymous", address: "Park Street, Kolkata", confirmations: 29, ageHours: 16 },
  { title: "Salt Lake Sector V tower outage", description: "BSNL tower offline for 8 hours. Whole sector affected.", type: "cellular", severity: "total", signalStrength: -113, latitude: 22.5762, longitude: 88.4332, carrier: "BSNL", reporter: "Rajat", address: "Salt Lake Sector V", confirmations: 45, ageHours: 26 },

  // Hyderabad
  { title: "HITEC City underground food court no signal", description: "Lunch hour and zero connectivity. Cashier asked us to come back later for UPI.", type: "cellular", severity: "high", signalStrength: -106, latitude: 17.4486, longitude: 78.3908, carrier: "Jio", reporter: "Sai", address: "HITEC City, Hyderabad", confirmations: 35, ageHours: 8 },
  { title: "Charminar zone signal fluctuates", description: "Old city has narrow lanes. Signal flips between 5G and no service every 10 seconds.", type: "cellular", severity: "medium", signalStrength: -97, latitude: 17.3616, longitude: 78.4747, carrier: "Vi", reporter: "Fatima", address: "Charminar, Hyderabad", confirmations: 17, ageHours: 21 },
  { title: "Gachibowli stadium parking GPS off", description: "GPS shows me inside the stadium when I'm in the parking lot.", type: "gps", severity: "high", signalStrength: -100, latitude: 17.4239, longitude: 78.3499, carrier: "N/A", reporter: "Anonymous", address: "GMC Balayogi Stadium", confirmations: 9, ageHours: 40 },

  // Pune
  { title: "Pune-Mumbai expressway tunnel kilometre 7", description: "Long tunnel = no signal. Common knowledge but still annoying.", type: "cellular", severity: "total", signalStrength: -120, latitude: 18.7741, longitude: 73.4815, carrier: "Airtel", reporter: "Ajay", address: "Pune-Mumbai Expressway", confirmations: 91, ageHours: 5 },
  { title: "Koregaon Park cafe row WiFi dead", description: "Restaurant WiFi works, but 4G fails simultaneously across all carriers.", type: "wifi", severity: "high", signalStrength: -108, latitude: 18.5362, longitude: 73.8939, carrier: "Cafe WiFi", reporter: "Sara", address: "North Main Road, Koregaon Park", confirmations: 12, ageHours: 30 },

  // Tier 2 / hill stations
  { title: "Shimla mall road weekend crowd", description: "Tourist season brings everything to a halt. Even SMS fails.", type: "cellular", severity: "high", signalStrength: -104, latitude: 31.1042, longitude: 77.1734, carrier: "Jio", reporter: "Anonymous", address: "Mall Road, Shimla", confirmations: 26, ageHours: 13 },
  { title: "Manali to Rohtang Pass total dead", description: "Beyond Solang valley nothing works. Bring satellite phone if going further.", type: "satellite", severity: "total", signalStrength: -125, latitude: 32.3653, longitude: 77.2467, carrier: "BSNL", reporter: "Trekker", address: "Rohtang Pass approach", confirmations: 38, ageHours: 48 },
  { title: "Leh Ladakh Khardung La pass", description: "World's highest motorable road, world's worst connectivity. No carrier works.", type: "cellular", severity: "total", signalStrength: -127, latitude: 34.2778, longitude: 77.6041, carrier: "BSNL", reporter: "Bike rider", address: "Khardung La, Ladakh", confirmations: 52, ageHours: 72 },
  { title: "Goa Anjuna beach evening signal weak", description: "Tourist season brings huge crowds. Network struggles every Friday-Sunday.", type: "cellular", severity: "medium", signalStrength: -99, latitude: 15.5740, longitude: 73.7400, carrier: "Vi", reporter: "Anonymous", address: "Anjuna Beach, Goa", confirmations: 15, ageHours: 24 },

  // Kerala / Andaman
  { title: "Munnar tea estates signal void", description: "Drove through 20km of dead zone in the hills.", type: "cellular", severity: "total", signalStrength: -118, latitude: 10.0889, longitude: 77.0595, carrier: "Airtel", reporter: "Tourist", address: "Munnar tea gardens", confirmations: 21, ageHours: 60 },
  { title: "Andaman Havelock island patchy 4G", description: "Only one carrier works near the resorts. Beach areas are fully dark.", type: "cellular", severity: "high", signalStrength: -109, latitude: 11.9714, longitude: 92.9870, carrier: "BSNL", reporter: "Diver", address: "Havelock Island, Andaman", confirmations: 7, ageHours: 84 },
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
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
