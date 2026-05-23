import { db, communityMessagesTable } from "@workspace/db";
import { logger } from "./logger";

// ─── Fake user name pools ─────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Raj","Priya","Amit","Sunita","Rahul","Deepa","Vikram","Anita","Suresh","Pooja",
  "Kiran","Arjun","Neha","Ravi","Meena","Ajay","Lakshmi","Sanjay","Kavya","Rohit",
  "Divya","Manoj","Usha","Gopal","Rekha","Anil","Shilpa","Vinod","Asha","Tarun",
  "Nisha","Rajesh","Priyanka","Vishal","Kavita","Sunil","Geeta","Ramesh","Mohan",
  "Preeti","Girish","Smita","Harish","Jyoti","Prakash","Swati","Dinesh","Radha",
  "Vijay","Meenakshi","Bharat","Chitra","Ashok","Poonam","Abhishek","Sneha","Nilesh",
  "Pallavi","Yash","Ritu","Nikhil","Tanvi","Kunal","Gaurav","Siddharth","Ankita",
  "Aakash","Simran","Aman","Nidhi","Vivek","Varun","Richa","Kartik","Sonia","Sachin",
  "Rohini","Naveen","Smriti","Ajit","Ruchika","Pavan","Harsha","Prasad","Leela","Karan",
  "Shreya","Tushar","Madhuri","Parth","Heena","Manish","Poornima","Sandeep","Lata","Rohan",
];
const SURNAMES = [
  "Sharma","Patel","Gupta","Singh","Mehta","Joshi","Kumar","Verma","Rao","Iyer",
  "Reddy","Nair","Malhotra","Kapoor","Agarwal","Shah","Pillai","Bose","Menon","Tiwari",
  "Banerjee","Desai","Saxena","Pandey","Roy","Shetty","Dubey","Murthy","Choudhary",
  "Bhatt","Jain","Mishra","Chopra","Bhatia","Khanna","Arora","Mittal","Goel","Trivedi",
  "Chauhan","Sinha","Das","Yadav","Bajaj","Doshi","Parikh","Vora","Gandhi","Thakur",
];

// ─── 100 unique celebration message templates ─────────────────────────────────
// {S} = stock symbol, {P} = pnl like "+2.00%"
const TEMPLATES = [
  "{S} target touch kar gaya. Alladin bhai ka kaam tha, ho gaya",
  "Bhai {S} ne {P} diya aaj. Bilkul bola tha",
  "{S} hit the mark. Entry se exit seedha",
  "Paise banta hai yaar jab Alladin ka call follow karo. {S} proof hai",
  "{S} target touched. Mera order fill tha, profit book kar liya",
  "Ek call, ek target, {P}. That's why I pay ₹2000 every month",
  "Ghar ka loan thoda aur jaldi bharega ab. {S} ne help kar di aaj",
  "Target hit on {S}. Seedha account mein gaya",
  "Alladin bhai ko toh shayad future dikhta hai. {S} ekdum sahi nikla",
  "Ek cup chai peete peete {S} ne {P} de diya",
  "{S} 2% done. Meri wife ko nahi bataunga warna shopping hogi",
  "Market khula aur {S} seedha upar. Algorithm kaam kar raha hai",
  "{S} target hit ho gaya. Abhi book karo baad mein rone ki zaroorat nahi",
  "Roz subah Alladin ka call dekhna sab se accha morning routine hai. {S} aaj bhi sahi nikla 🌅",
  "{S} ne {P} diya. Smooth tha",
  "Kisi ne kaha trading mein paise nahi hote. {S} ne jawab de diya",
  "Alladin bhai ka analysis {S} pe ekdum sahi tha",
  "{S} target. Chai wala bhi trading karta hai ab iss app se",
  "2 minutes mein {S} target touch ho gaya. Call itna fast tha mera order bhi late tha, phir bhi {P}",
  "Meri beti ki fees iss {S} call ne nikaal di aaj. Shukriya Alladin 🙏",
  "{S} ho gaya. Screenshot rakh liya proof ke liye",
  "Alladin app se consistent results aa rahe hain. {S} {P} aaj",
  "Mere office mein sab poochh rahe the kya kar raha hoon phone pe. {S} target tha",
  "Jo Alladin pe trust karte hain unka hi profit hota hai. {S} = exhibit A",
  "{S} touched target. Lunch thoda fancy hoga aaj",
  "Ek aur winning day. {S} se {P}. Consistency is everything",
  "Subah 9:16 baje hi {S} ne target hit kar liya",
  "Pehle trust karne mein der lagti thi. Ab {S} jaisi calls dekh ke conviction hai 💎",
  "Trading mein dar lagta tha pehle. Alladin ke baad {S} jaisi wins normal ho gayi",
  "{S} target done. Jab Alladin bolte hain BUY toh BUY karo bas",
  "Mera broker bhi confused hai itna fast {P} kaise aya {S} mein",
  "Alladin ki analysis aur {S} ka performance match kiya aaj",
  "Target hit on {S}. Evening snacks sponsored by market",
  "{S} {P} in the bag. Family ko bata nahi sakta warna trading band karwa denge",
  "Alladin said {S} will move and it moved",
  "Paper trading se real trading aaya toh {S} ne confidence diya. {P} booked",
  "{S} target. Alladin bhai ka algorithm mere 10 saal ke experience se better hai",
  "Log bol rahe the market risky hai. Alladin ke saath {S} ne theek kar diya",
  "Naya phone le loon kya. {S} ka {P} toh aa gaya",
  "Sabse pehle {S} target hit ki news yahan share kar raha hoon. Book kar lena",
  "Trading mein ye feeling alag hoti hai. {S} done",
  "{S} completed the mission",
  "{S} se {P} mila. Shaam ko chai pe discuss karenge",
  "Market open bhi nahi hua theek se aur {S} already on way to target tha",
  "Ek din mein {P} matlab ek mahine ki EMI cover. {S} kaam aayi",
  "Jo log Alladin ko ignore karte hain unke liye {S} ka result dekh lein",
  "{S} hit ho gaya. Alladin bhai seedha account mein daalta hai jaise",
  "Full trust tha {S} pe. {P} mila",
  "Market ne aaj nahi haraaya thanks to {S} call",
  "Friends poochh rahe hain mera secret. Alladin plus {S} type calls",
  "{S} target done. Next call ka wait kar raha hoon",
  "Signal itna pakka tha jaise {S} pe GPS lagaya ho",
  "Bhai {S} ne {P} diya. Paisa vasool subscription hai ye",
  "{S} ho gaya yaar",
  "Market analysts saal bhar bolte hain, Alladin ek din mein prove karta hai. {S}",
  "Mere saath {S} mein tha koi. Comment karo",
  "{S} target. Alladin premium seriously worth every rupee hai",
  "Is call ke baad samajh aa gaya Alladin alag level pe hai. {S} {P}",
  "Subah {S} entry, profit booked. That's the routine now",
  "{S} done. Next call please 🙏",
  "Jab bhi doubt aaya {S} jaisi call ne yaad dila diya. Trust the process",
  "{S} ne {P} diya aur main screen dekh ke smile kar raha hoon",
  "Alladin = stock market ka GPS. {S} reached destination",
  "{S} target. Kal agli call",
  "Mere dost ne bola trading faltu hai. Maine {S} ka {P} dikhaya. Ab woh bhi join kar raha hai",
  "Market ne aaj phir gift diya {S} ke through",
  "{S} ka target hit hua. Neend acchi ayegi aaj",
  "Alladin bhai ka ek statue banana chahiye NSE ke bahar. {S} nailed it",
  "Subah uthke {S} target hit notification dekhi. Din ban gaya ☀️",
  "{S} flew past target. Ye app daily income source ban gaya hai",
  "Pehle {S} mein lagate waqt dar lagta tha. Ab full yaqeen hai",
  "Target hit on {S}. Alladin bhai chess khelte hain jab sab ludo mein hain",
  "{S} {P} booked. Ye toh warm-up tha",
  "Ek aur day, ek aur target hit. {S} ne phir kiya",
  "Trader banna tha kabhi. Alladin ke saath {S} jaisi calls se lagta hai ho bhi gaya",
  "{S} target 2 minute mein. Record hoga shayad",
  "Alladin ka call on {S}, another one in the bag. {P}",
  "{S} call ne dimag blow kar diya. Itna accurate",
  "{S} reached. Bhai ka analysis ekdum point pe tha",
  "Seedha point pe aaya {S}. Charts jhooth nahi bolte",
  "Koi bolo unhe jo bolte the market unpredictable hai. {S} ne predict ho ke dikhaya",
  "Aaj ka din, {S} target hit, {P} profit, mood top",
  "Jab baaki log confused hote hain Alladin ke followers {S} se profit kama rahe hote hain 😎",
  "{S} ho gaya. Genuinely thank you Alladin for changing my trading",
  "Ye call pakka tha. {S} {P} like clockwork",
  "Alladin premium best ₹2000 hai jo main mahine mein spend karta hoon. {S} ne prove kar diya",
  "{S} target hit. Chai pi ke agli call ka wait",
  "{S} ne woh kiya jo meri 5 saal ki equity holding ne nahi kiya. {P} in one day",
  "Alladin bhai time machine se aate hain kya. {S} call 100% sahi nikla",
  "{S} done",
  "Itna confident tha is call pe ki double quantity li thi. {S} double {P}",
  "Community mein sab khush hain aaj. {S} ho gaya",
  "{S} ne {P} ek hi session mein",
  "Portfolio dekh ke bank manager bhi poochhta hai ye {S} wala kya tha",
  "Simple formula, Alladin call aaye, entry lo, {S} jaisa result dekho",
  "{S} target done. Agli call ka notification on rakho",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fakeName(): string {
  return `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`;
}

// Fake user IDs 50000–52000 so they never clash with real user IDs
function fakeUserId(): number {
  return 50000 + Math.floor(Math.random() * 2000);
}

function buildMessage(symbol: string, pnl: string): string {
  const template = pick(TEMPLATES);
  return template
    .replace(/\{S\}/g, symbol)
    .replace(/\{P\}/g, pnl);
}

export async function postCelebrationMessages(
  symbol: string,
  pnlPercent: number
): Promise<void> {
  const pnlStr = `+${pnlPercent.toFixed(2)}%`;
  const count = 20 + Math.floor(Math.random() * 16); // 20–35 messages
  const now = Date.now();

  // Spread messages over 0–8 minutes in the past/future (makes feed look organic)
  const rows = Array.from({ length: count }, (_, i) => {
    const offsetMs = Math.floor(Math.random() * 8 * 60 * 1000); // up to 8 min
    return {
      userId: fakeUserId(),
      message: buildMessage(symbol, pnlStr),
      createdAt: new Date(now - offsetMs + i * 3000), // slight stagger
    };
  });

  try {
    await db.insert(communityMessagesTable).values(rows);
    logger.info({ symbol, count }, "Celebration messages posted to community");
  } catch (err) {
    logger.error({ err }, "Failed to post celebration messages");
  }
}
