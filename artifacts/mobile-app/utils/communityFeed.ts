export interface FakeMessage {
  id: string;
  fakeUserId: number;
  userName: string;
  avatarColor: string;
  message: string;
  timestampMs: number;
  isFake: true;
}

const FIRST_NAMES = [
  "Raj","Priya","Amit","Sunita","Rahul","Deepa","Vikram","Anita","Suresh","Pooja",
  "Kiran","Arjun","Neha","Ravi","Meena","Ajay","Lakshmi","Sanjay","Kavya","Rohit",
  "Divya","Manoj","Usha","Gopal","Rekha","Anil","Shilpa","Vinod","Asha","Tarun",
  "Nisha","Rajesh","Priyanka","Vishal","Kavita","Sunil","Geeta","Ramesh","Mohan",
  "Preeti","Girish","Smita","Harish","Jyoti","Prakash","Swati","Dinesh","Radha",
  "Vijay","Meenakshi","Bharat","Chitra","Ashok","Poonam","Abhishek","Sneha","Nilesh",
  "Pallavi","Yash","Ritu","Nikhil","Tanvi","Kunal","Gaurav","Siddharth","Ankita",
  "Aakash","Simran","Aman","Nidhi","Vivek","Varun","Richa","Kartik","Sonia","Rahul",
  "Sachin","Rohini","Naveen","Smriti","Ajit","Ruchika","Pavan","Harsha","Prasad","Leela",
];

const SURNAMES = [
  "Sharma","Patel","Gupta","Singh","Mehta","Joshi","Kumar","Verma","Rao","Iyer",
  "Reddy","Nair","Malhotra","Kapoor","Agarwal","Shah","Pillai","Bose","Menon","Tiwari",
  "Banerjee","Desai","Saxena","Pandey","Roy","Shetty","Dubey","Murthy","Choudhary",
  "Bhatt","Jain","Mishra","Chopra","Bhatia","Khanna","Arora","Mittal","Goel","Trivedi",
  "Chauhan","Sinha","Das","Yadav","Bajaj","Doshi","Parikh","Vora","Gandhi","Thakur",
];

const AVATAR_COLORS = [
  "#10B981","#6366F1","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#3B82F6","#84CC16",
];

const STOCK_TEMPLATES = [
  "Just entered {S} at opening price! Let's go 🚀",
  "{S} looking very strong today! Target should hit easily 📈",
  "Holding {S} as per Alladin's call. Already up! 🎯",
  "{S} crossing resistance right now! 💪",
  "Added {S} at dip. Alladin's analysis spot on as usual!",
  "Target 1 hit on {S}! Waiting for target 2 now 🔥",
  "{S} volume surge happening. Big move incoming! 📊",
  "Booked 1.8% profit on {S} already 🙌",
  "{S} chart looking exactly like Alladin described",
  "Anyone else holding {S}? Up 2% from entry!",
  "{S} is on fire today! Alladin you genius 🏆",
  "Stop loss on {S} perfectly placed. Full faith in the call!",
  "{S} breaking out! This is why I trust Alladin 💯",
  "Adding more {S} on this dip. Conviction call!",
  "{S} momentum is strong, target incoming 🎯",
  "What a pick {S} is turning out to be today 🔥",
  "{S} bid side very strong. Institutions accumulating!",
  "Scaled out 50% of {S} at +2.1%. Trailing rest 📊",
];

const ALLADIN_TEMPLATES = [
  "3 targets hit this week alone! Alladin is unmatched 🙏",
  "My portfolio is up 31% this month purely on Alladin calls! 🎯",
  "Never seen such accuracy in 10 years of trading. Alladin FTW! 🔥",
  "Recommended Alladin to my whole family. Best decision ever 👨‍👩‍👧‍👦",
  "₹47,000 profit this week following Alladin signals 💰",
  "Been with Alladin for 3 months. Not a single bad week 🏆",
  "Cancelled all other advisory services. Alladin is all I need!",
  "8 out of 10 picks hit target this month! Incredible 📈",
  "Alladin + discipline = financial freedom 💪",
  "Started with ₹2L capital, now at ₹2.8L in 6 weeks. Thanks Alladin! 🎊",
  "My friends don't believe my returns until I show them Alladin 😂",
  "Best ₹2000 I spend every month. 10x returns on subscription cost 💯",
  "Alladin's risk management is what sets it apart. Legends! 🌟",
  "Just renewed for 6 months. So much confidence in this service 🙏",
  "Morning 9:15 AM = Alladin signals = profits. Simple formula! 📊",
  "Paid for itself in the first week. Unbelievable service! 🤩",
  "Showing my friends the P&L every day. They're all joining Alladin 😁",
  "This platform changed how I trade. Genuinely grateful 🙏",
  "20 winning trades in a row? Only with Alladin! 🎯",
  "₹1.2 lakh profit this month. Alladin made this possible! 💰",
];

const MARKET_TEMPLATES = [
  "Markets opening gap up today! 🐂",
  "Nifty looking very bullish at this level. Good day for intraday!",
  "FIIs are buying! Strong market breadth today 💚",
  "Volatility is perfect for intraday today 📊",
  "Bank Nifty leading the rally 💪",
  "Good volume in mid-caps today. Exciting session!",
  "Market holding above 200 DMA. Bulls in control! 🚀",
  "Strong global cues. Should be a good day for longs!",
  "P&L looking green today! Love intraday 💰",
  "Market sentiment very positive. Perfect day for the picks!",
  "Volume is massive today. Big institutions buying 📈",
  "5% up on capital today! What a session 🎉",
  "This is why I wake up at 9 AM every day 😎",
  "Bears getting crushed today. Intraday traders winning big! 🏆",
  "Market rally on track! Every pick is working 🎯",
  "Open interest data very bullish. Strong up move likely!",
  "RSI, MACD all aligned bullishly today. Great day!",
  "Gap up with volume = strong conviction move. Holding all positions!",
  "Nifty 50 support holding perfectly. Classic Alladin pick setup 📊",
  "Mid-cap rally + Alladin picks = absolute money day! 💸",
];

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

function dateSeed(dateStr: string): number {
  let h = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    h = Math.imul(h, 33) ^ dateStr.charCodeAt(i);
  }
  return h >>> 0;
}

export function generateFakeMessages(
  dateStr: string,
  stockSymbols: string[],
  count = 160,
): FakeMessage[] {
  const rng = seededRng(dateSeed(dateStr));

  const stocks =
    stockSymbols.length > 0
      ? stockSymbols
      : ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "WIPRO", "AXISBANK"];

  const marketOpenMs = (() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const utcMs = Date.UTC(y, m - 1, d, 3, 30, 0); // 9:00 AM IST = 03:30 UTC
    return utcMs;
  })();
  const marketCloseMs = marketOpenMs + 6.5 * 60 * 60 * 1000; // 3:30 PM IST

  const messages: FakeMessage[] = [];
  const usedUserIds = new Set<number>();

  for (let i = 0; i < count; i++) {
    const userId = Math.floor(rng() * 4800) + 1;
    usedUserIds.add(userId);

    const firstIdx = Math.floor(rng() * FIRST_NAMES.length);
    const lastIdx = Math.floor(rng() * SURNAMES.length);
    const userName = `${FIRST_NAMES[firstIdx]} ${SURNAMES[lastIdx]}`;
    const avatarColor = AVATAR_COLORS[Math.floor(rng() * AVATAR_COLORS.length)];

    const templateType = rng();
    let message: string;
    if (templateType < 0.40) {
      const tpl = STOCK_TEMPLATES[Math.floor(rng() * STOCK_TEMPLATES.length)];
      const stock = stocks[Math.floor(rng() * stocks.length)];
      message = tpl.replace("{S}", stock);
    } else if (templateType < 0.70) {
      message = ALLADIN_TEMPLATES[Math.floor(rng() * ALLADIN_TEMPLATES.length)];
    } else {
      message = MARKET_TEMPLATES[Math.floor(rng() * MARKET_TEMPLATES.length)];
    }

    const progress = rng();
    const tsMs = marketOpenMs + progress * (marketCloseMs - marketOpenMs);

    messages.push({
      id: `fake-${dateStr}-${i}`,
      fakeUserId: userId,
      userName,
      avatarColor,
      message,
      timestampMs: tsMs,
      isFake: true,
    });
  }

  return messages.sort((a, b) => a.timestampMs - b.timestampMs);
}

export function visibleFakeMessages(
  messages: FakeMessage[],
  nowMs: number,
): FakeMessage[] {
  return messages.filter((m) => m.timestampMs <= nowMs);
}
