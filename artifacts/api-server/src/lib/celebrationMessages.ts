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
  "BOOM! {S} target hit! Alladin bhai tu toh legend hai 🔥",
  "Bhai {S} ne kar diya kamaal! {P} profit book kar liya 💰",
  "LFG {S}!!! Bilkul bola tha Alladin ne, exactly wahi hua 🚀",
  "Paise banta hai yaar jab Alladin ka call follow karo 😎 {S} done!",
  "{S} target touched! Mere haath kaanp rahe the but stayed in 🙌",
  "Ek call, ek target, {P}. That's why I pay ₹2000/month no questions asked 💯",
  "YESSS {S}!! Ghar ka loan thoda aur jaldi bharega ab 😂🎯",
  "Target hit on {S}. Seedha bank account mein gaya profit 🏦",
  "Alladin bhai ko toh shayad future dikhta hai literally 🔮 {S} smashed it!",
  "Ek cup chai peete peete {S} ne {P} de diya. Life is good 🍵",
  "{S} 2% done! Meri wife ko nahi bataunga warna shopping ho jayegi 😅",
  "Market khula aur {S} seedha upar. Alladin algorithm toh dosto se behtar hai 📈",
  "Bhai logo, {S} target hit. Abhi book karo baad mein rone ki zaroorat nahi 🎯",
  "Roz subah uthkar Alladin ka call dekhna = sab se accha morning routine 🌅 {S} 🔥",
  "{S} ne aaj bhi nahi rulaya! {P} smooth as butter 🧈",
  "Kisi ne kaha trading mein paise nahi hote? {S} target just hit 😂",
  "Alladin bhai aap toh GOAT ho! {S} exactly predicted 🐐",
  "{S} boom! Chai wala bhi trading karta hai ab iss app se 😄☕",
  "2 minutes mein {S} target! Ye call itna fast tha mera order bhi late tha 😭 but still {P}!",
  "Meri beti ki fees iss {S} call ne nikaal di aaj. Dil se shukriya Alladin 🙏",
  "{S} nailed it! Screenshot leke rakh raha hoon proof ke liye 📸",
  "Alladin app > sab kuch. Proof: {S} {P} aaj 💪",
  "Bhai mere office mein sab poochh rahe the kya kar raha hai phone pe. {S} target hit tha 😂",
  "Jo Alladin pe trust karte hain, unka hi profit hota hai. {S} = exhibit A ✅",
  "{S} touched target! Ab lunch thoda fancy hoga aaj 🍽️",
  "Ek aur winning day! {S} se {P}. Consistency is the key and Alladin is the lock 🔑",
  "Subah 9:16 baje hi {S} ne target hit kiya. Bhai ye toh rocket tha 🚀",
  "Pehle der lagti thi trust karne mein. Ab {S} jaisi calls dekh ke full conviction hai 💎",
  "Trading karte karte dar lagta tha pehle. Alladin ke baad {S} jaisi wins normal ho gayi 😌",
  "{S} target done! Jab Alladin bolte hain BUY toh BUY karo, bas 🤝",
  "Bhai mera broker bhi confused hai itna fast {P} kaise aya {S} mein 😂",
  "Alladin ki analysis aur {S} ka performance = match made in heaven 💫",
  "Target hit on {S}. Iska matlab aaj evening snacks sponsored by the market 🍿",
  "{S} +{P} in the bag! Apni family ko bata nahi sakta warna trading band karwa denge 🤫",
  "Dekh liya na? Alladin said {S} will fly and it FLEW ✈️",
  "Paper trading se real trading mein aaya toh {S} ne hi confidence diya. {P} booked 🎉",
  "{S} smashed target! Alladin bhai ka algorithm > mere 10 saal ka experience 😂",
  "Bhai log galat bol rahe the ke market risky hai. Alladin ke saath {S} ne prove kar diya 💪",
  "Naya phone le loon kya? {S} ka {P} toh aya 😅",
  "Sabse pehle {S} target hit ki news yahan di! Bhai log book kar lena 🔔",
  "Trading mein ye feeling kuch aur hi hoti hai jab target hit hota hai! {S} done 🙌",
  "{S} completed the mission. Alladin never misses bhai 🎯",
  "2% mila {S} se, chai pe discuss karenge shaam ko 😄",
  "Market open hua nahi tha theek se aur {S} already on its way to target tha. Kya call tha!",
  "Ek din mein {P} means ek mahine ki EMI covered. {S} = life saver 🏠",
  "Jo log Alladin ko ignore karte hain unke liye {S} ka result 👀",
  "{S} hit! Alladin bhai seedha mere portfolio mein paisa daal deta hai jaise 😂💸",
  "Bhai full trust with eyes closed on {S}. And it paid {P} 🤑",
  "Market ne aaj bhi nahi haraaya thanks to {S} call. Alladin rocks! 🎸",
  "Friends poochh rahe hain mera secret. Secret = Alladin + {S} type calls 😎",
  "{S} target done ✅ Next call ka wait kar raha hoon already!",
  "Ye signal itna pakka tha jaise {S} pe GPS lagaya ho Alladin ne 📍",
  "Bhai {S} ne ghante mein {P} diya. Full paisa vasool subscription 🔥",
  "Alladin ek din bata do kaunsa sauda karte ho aap 😂 {S} too good!",
  "{S} boom! Dil gardden gardden ho gaya aaj 🌸",
  "Market analysts saal bhar bolte hain, Alladin ek din mein prove karta hai. {S} FTW! 🏆",
  "Bhai mere saath {S} mein tha? Comment karo celebrate karte hain 🎊",
  "{S} target smashed! Alladin premium le lo log seriously, worth every rupee 💎",
  "Iss call ke baad mujhe pata chal gaya Alladin alag hi level pe hai. {S} {P} 🚀",
  "Early morning {S} entry, evening profit booking. That's the Alladin lifestyle 😎",
  "{S} done and dusted! Alladin bhai next call toh do please 🙏",
  "Jab bhi doubt aaya tune {S} se phir yaad dila diya. Trust the process! ✊",
  "Bhai {S} ne {P} diya aur main yahan screen dekh ke smile kar raha hoon 😄",
  "Alladin = stock market ka GPS. {S} reached destination with {P} profit! 🗺️",
  "{S} target achieved! Abhi celebrate, kal next call 🎉",
  "Mere dost ne aaj bola trading faltu hai. Maine {S} ka {P} dikhaya. Ab woh bhi join kar raha hai 😂",
  "Bhai market ne aaj phir gift diya {S} ke through! Alladin zindabad 🙌",
  "{S} ka target hit sunke neend bhi acchi ayegi aaj 😴💰",
  "Alladin bhai seriously aapka ek statue banana chahiye NSE ke bahar 😂 {S} nailed!",
  "Subah uthke {S} target hit notification dekha. Din ban gaya! ☀️",
  "{S} flew past target! Bhai ye app toh daily income source ban gaya hai 💯",
  "Pehle {S} mein paise lagate waqt dar tha. Ab full yaqeen hai Alladin pe 🤲",
  "Target hit on {S}! Alladin bhai toh chess khelte hain jab sab ludo khel rahe hain ♟️",
  "{S} done! {P} booked. Ye toh sirf warm-up tha 😤",
  "Bhai ek aur day, ek aur target hit. {S} ne phir kiya kamaal 🔥",
  "Trader banna tha mujhe bhi kabhi. Alladin ke saath {S} jaisi calls se lagta hai ho bhi gaya 😌",
  "NSE mein {S} aur Alladin = guaranteed entertainment + profit combo 📺💰",
  "{S} target 2 minute mein? Bhai ye toh record hai! Screenshot bhejo sabko 📲",
  "Alladin's call on {S} — another one in the bag 💼 {P}",
  "Yaar ye {S} call ne toh dimag hi blown kar diya! Itna accurate! 🤯",
  "{S} reached! Ek dum sahi tha bhai ka analysis 🎯 {P} profit locked!",
  "Bhai seedha point pe aaya {S}. Alladin ke charts jhooth nahi bolte 📊",
  "Koi bolo unhe jo bolte the market unpredictable hai. {S} ne aaj predict ho ke dikhaya 😂",
  "Aaj ka din: {S} target hit, {P} profit, mood ekdum top! 🥳",
  "Jab baaki log confused hote hain, Alladin ke followers {S} se {P} kama rahe hote hain 😎",
  "{S} smashed it! Genuinely thank you Alladin for changing my trading game 🙏",
  "Ye call toh pakka tha yaar 😤 {S} {P} like clockwork!",
  "Alladin premium = best ₹2000 I spend every month. {S} just proved it again 💸",
  "{S} target hit! Abhi chai pi ke agli call ka wait karte hain ☕📱",
  "Bhai {S} ne woh kiya jo meri 5 saal ki equity holding ne nahi kiya 😭 {P} in a day!",
  "Alladin bhai toh time machine se aate hain kya? {S} call 100% sahi nikla 🕰️",
  "{S} done! Ek aur feather in the Alladin cap 🎩",
  "Itna confident tha is call pe ki double quantity li thi. {S} = double {P} 🤑",
  "Target hit on {S}! Community mein sab khush hain aaj 🎊",
  "{S} ne {P} ek hi session mein. Alladin bhai ye toh magic hai 🪄",
  "Mera portfolio dekh ke bank manager bhi poochhta hai ye {S} wala kya tha 😂",
  "Simple formula: Alladin call aaye → entry lo → {S} jaisa result dekho 🔁",
  "{S} target done! Agli call ka notification ON rakho bhai log 🔔",
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
