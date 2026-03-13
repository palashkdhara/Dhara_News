// Use your actual GNews API key here (https://gnews.io/)
const API_KEY = '4ad670dd5acaa356d9edf86896543ce6'; 
const BASE_URL = 'https://gnews.io/api/v4/top-headlines';

// Default placeholder if image is missing from the API response
const DEFAULT_IMAGE = 'https://picsum.photos/id/20/600/300'; 

// Track the currently selected category (defaulting to the home view 'প্রচ্ছদ')
let currentCategory = 'প্রচ্ছদ';

// Session flag: ensures API is called at most ONCE per app load
let hasRefreshedThisSession = false;

// Generate a random timestamp within the last 1-24 hours for realistic seed news
function randomRecentTime() {
    const now = Date.now();
    const hoursAgo = 1 + Math.random() * 23; // 1 to 24 hours ago
    return new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
}

// Map our Bengali UI categories to GNews API standard categories
const categoryMap = {
    'প্রচ্ছদ': 'general',
    'রাজ্য': 'nation',
    'দেশ': 'nation',
    'বিনোদন': 'entertainment',
    'খেলা': 'sports',
    'বাণিজ্য': 'business',
    'প্রযুক্তি': 'technology'
};

// --- SEED NEWS (Offline fallback with full article content) ---
const SEED_NEWS = {
    'general': [
        {
            title: "রাজ্যে নতুন শিল্প প্রকল্পের শিলান্যাস, কর্মসংস্থানের নতুন দিশা",
            description: "মুখ্যমন্ত্রী আজ নতুন শিল্প তালুকের উদ্বোধন করলেন। এর ফলে কয়েক হাজার যুবকের কর্মসংস্থান হবে বলে আশা করা হচ্ছে।",
            content: "মুখ্যমন্ত্রী আজ নতুন শিল্প তালুকের উদ্বোধন করলেন। এর ফলে কয়েক হাজার যুবকের কর্মসংস্থান হবে বলে আশা করা হচ্ছে। রাজ্য সরকারের পক্ষ থেকে জানানো হয়েছে যে এই প্রকল্পে প্রায় ৫০০ কোটি টাকা বিনিয়োগ করা হবে। নতুন এই শিল্প এলাকায় ইলেকট্রনিক্স, টেক্সটাইল এবং খাদ্য প্রক্রিয়াকরণ শিল্পের জন্য আলাদা আলাদা জোন তৈরি করা হবে।\n\nশিল্পমন্ত্রী জানিয়েছেন, এই প্রকল্প সম্পূর্ণ চালু হলে প্রায় ১৫,০০০ প্রত্যক্ষ এবং ৩০,০০০ পরোক্ষ কর্মসংস্থান সৃষ্টি হবে। স্থানীয় যুবকদের দক্ষতা বৃদ্ধির জন্য বিশেষ প্রশিক্ষণ কেন্দ্রও স্থাপন করা হবে। পরিবেশবিদরা অবশ্য এই প্রকল্পের পরিবেশগত প্রভাব নিয়ে উদ্বেগ প্রকাশ করেছেন এবং সবুজ প্রযুক্তি ব্যবহারের দাবি জানিয়েছেন।",
            image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "আনন্দবাজার" },
            url: "https://www.anandabazar.com/"
        },
        {
            title: "বর্ষার আগমনে স্বস্তি, তবে উত্তরবঙ্গে প্লাবনের আশঙ্কা",
            description: "দক্ষিণবঙ্গে বৃষ্টির পূর্বাভাস থাকলেও উত্তরবঙ্গের জেলাগুলোতে ভারী বৃষ্টির সতর্কতা জারি করেছে আবহাওয়া দপ্তর।",
            content: "দক্ষিণবঙ্গে বৃষ্টির পূর্বাভাস থাকলেও উত্তরবঙ্গের জেলাগুলোতে ভারী বৃষ্টির সতর্কতা জারি করেছে আবহাওয়া দপ্তর। আলিপুরদুয়ার, কোচবিহার, জলপাইগুড়ি এবং দার্জিলিং জেলায় পরবর্তী ৪৮ ঘণ্টায় অত্যন্ত ভারী বৃষ্টিপাতের সম্ভাবনা রয়েছে।\n\nতিস্তা ও তোর্সা নদীর জলস্তর বিপদসীমার কাছাকাছি পৌঁছেছে। জেলা প্রশাসন নদী তীরবর্তী এলাকার বাসিন্দাদের সতর্ক থাকার নির্দেশ দিয়েছে। এনডিআরএফ-এর দলগুলো প্রস্তুত রয়েছে। দক্ষিণবঙ্গে অবশ্য হালকা থেকে মাঝারি বৃষ্টিতে তাপপ্রবাহ থেকে স্বস্তি মিলবে বলে জানিয়েছেন আবহাওয়া বিজ্ঞানীরা। কৃষকরা এই বৃষ্টিকে স্বাগত জানিয়েছেন কারণ এটি আমন ধান রোপণের জন্য অত্যন্ত জরুরি ছিল।",
            image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "এই সময়" },
            url: "https://eisamay.com/"
        },
        {
            title: "কলকাতায় নতুন মেট্রো লাইন চালু, যাত্রীদের মুখে হাসি",
            description: "দীর্ঘ প্রতীক্ষার পর অবশেষে নতুন মেট্রো রুট চালু হয়েছে। প্রতিদিন লক্ষাধিক যাত্রী উপকৃত হবেন বলে আশা করা হচ্ছে।",
            content: "দীর্ঘ প্রতীক্ষার পর অবশেষে নতুন মেট্রো রুট চালু হয়েছে। প্রতিদিন লক্ষাধিক যাত্রী উপকৃত হবেন বলে আশা করা হচ্ছে। রেলমন্ত্রী আজ সকালে নতুন এই রুটের আনুষ্ঠানিক উদ্বোধন করেন।\n\nনতুন এই লাইনে মোট ১২টি স্টেশন রয়েছে এবং সম্পূর্ণ যাত্রা সময় প্রায় ৩৫ মিনিট। শীতাতপ নিয়ন্ত্রিত কোচ, প্ল্যাটফর্ম স্ক্রিন ডোর এবং অত্যাধুনিক সিগন্যালিং সিস্টেম রয়েছে এই নতুন মেট্রোতে। প্রতিটি ট্রেনে ৩০০ জনেরও বেশি যাত্রী বহন করা সম্ভব। শহরের যানজট কমাতে এই নতুন মেট্রো লাইন গুরুত্বপূর্ণ ভূমিকা রাখবে বলে পরিবহন বিশেষজ্ঞরা মনে করছেন।",
            image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e13?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "সংবাদ প্রতিদিন" },
            url: "https://www.sangbadpratidin.in/"
        }
    ],
    'nation': [
        {
            title: "ডিজিটাল ইন্ডিয়া মিশনে বড় সাফল্য, গ্রামে গ্রামে পৌঁছাচ্ছে ব্রডব্যান্ড",
            description: "কেন্দ্রীয় সরকারের পক্ষ থেকে জানানো হয়েছে যে আগামী বছরের মধ্যে সমস্ত গ্রাম পঞ্চায়েত হাই-স্পিড ইন্টারনেটে যুক্ত হবে।",
            content: "কেন্দ্রীয় সরকারের পক্ষ থেকে জানানো হয়েছে যে আগামী বছরের মধ্যে সমস্ত গ্রাম পঞ্চায়েত হাই-স্পিড ইন্টারনেটে যুক্ত হবে। ভারতনেট প্রকল্পের অধীনে ইতিমধ্যে দেশের ৮০ শতাংশ গ্রাম পঞ্চায়েতে অপটিক্যাল ফাইবার পৌঁছে গেছে।\n\nটেলিকম মন্ত্রী জানিয়েছেন যে এই প্রকল্পের ফলে গ্রামীণ ভারতে ডিজিটাল শিক্ষা, টেলিমেডিসিন এবং ই-কমার্সের ব্যাপক প্রসার ঘটবে। ৫জি নেটওয়ার্ক সম্প্রসারণের পাশাপাশি গ্রামীণ এলাকায় ওয়াই-ফাই হটস্পটও স্থাপন করা হচ্ছে। প্রায় ২.৫ লক্ষ গ্রাম পঞ্চায়েতে ইতিমধ্যে সক্রিয় ইন্টারনেট সংযোগ রয়েছে এবং বাকি অংশে কাজ দ্রুত গতিতে এগিয়ে চলেছে।",
            image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "এনডিটিভি বাংলা" },
            url: "https://ndtv.in/"
        },
        {
            title: "সংসদে নতুন শিক্ষানীতি বিল পাশ, দেশজুড়ে বিতর্ক",
            description: "নতুন শিক্ষানীতিতে মাতৃভাষায় শিক্ষাদানের ওপর জোর দেওয়া হয়েছে। বিভিন্ন রাজ্য থেকে মিশ্র প্রতিক্রিয়া পাওয়া যাচ্ছে।",
            content: "নতুন শিক্ষানীতিতে মাতৃভাষায় শিক্ষাদানের ওপর জোর দেওয়া হয়েছে। বিভিন্ন রাজ্য থেকে মিশ্র প্রতিক্রিয়া পাওয়া যাচ্ছে। সংসদে উভয় কক্ষে এই বিল পাশ হয়ে গেছে।\n\nনতুন নীতি অনুযায়ী, পঞ্চম শ্রেণি পর্যন্ত মাতৃভাষা বা স্থানীয় ভাষায় শিক্ষাদান বাধ্যতামূলক করা হবে। কোডিং এবং কৃত্রিম বুদ্ধিমত্তা ষষ্ঠ শ্রেণি থেকে পাঠ্যক্রমে অন্তর্ভুক্ত করা হবে। শিক্ষাবিদরা এই পরিবর্তনকে স্বাগত জানালেও বাস্তবায়নের চ্যালেঞ্জ নিয়ে প্রশ্ন তুলেছেন। বিরোধী দলগুলো এই নীতিকে কেন্দ্রীভবনের প্রচেষ্টা বলে সমালোচনা করেছে।",
            image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "আজতক বাংলা" },
            url: "https://bangla.aajtak.in/"
        }
    ],
    'entertainment': [
        {
            title: "নতুন সিনেমায় জুটি বাঁধছেন টলিউডের জনপ্রিয় দুই তারকা",
            description: "আসন্ন পুজোয় মুক্তি পেতে চলেছে বড় বাজেটের এক অ্যাকশন মুভি, যেখানে প্রথমবার দেখা যাবে এই নতুন জুটিকে।",
            content: "আসন্ন পুজোয় মুক্তি পেতে চলেছে বড় বাজেটের এক অ্যাকশন মুভি, যেখানে প্রথমবার দেখা যাবে এই নতুন জুটিকে। পরিচালক জানিয়েছেন যে এই ছবির শুটিং থাইল্যান্ড, দুবাই এবং কলকাতায় হয়েছে।\n\nছবিটির বাজেট প্রায় ৩০ কোটি টাকা, যা টলিউডের ইতিহাসে অন্যতম ব্যয়বহুল প্রযোজনা। অত্যাধুনিক ভিএফএক্স এবং হলিউড স্টান্ট টিম এই ছবিতে কাজ করেছে। সংগীত পরিচালনায় রয়েছেন একজন জাতীয় পুরস্কারপ্রাপ্ত শিল্পী। ইতিমধ্যে ছবির ট্রেলার সোশ্যাল মিডিয়ায় ভাইরাল হয়েছে এবং ২৪ ঘণ্টায় ১ কোটিরও বেশি ভিউ পেয়েছে।",
            image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "টাইমস অফ ইন্ডিয়া" },
            url: "https://eisamay.com/entertainment"
        },
        {
            title: "ওটিটি প্ল্যাটফর্মে নতুন বাংলা ওয়েব সিরিজের ধুম",
            description: "চলতি মাসে একাধিক জনপ্রিয় ওটিটি প্ল্যাটফর্মে মুক্তি পাচ্ছে বেশ কিছু আকর্ষণীয় বাংলা ওয়েব সিরিজ।",
            content: "চলতি মাসে একাধিক জনপ্রিয় ওটিটি প্ল্যাটফর্মে মুক্তি পাচ্ছে বেশ কিছু আকর্ষণীয় বাংলা ওয়েব সিরিজ। এর মধ্যে একটি রহস্য-রোমাঞ্চ সিরিজ ইতিমধ্যে দর্শকদের মধ্যে ব্যাপক আগ্রহ তৈরি করেছে।\n\nবাংলা ওয়েব কন্টেন্টের বাজার গত দুই বছরে প্রায় তিনগুণ বেড়েছে। নির্মাতারা জানাচ্ছেন যে দর্শকরা এখন মানসম্পন্ন গল্প ও চরিত্রায়ণের প্রতি বেশি আগ্রহী। ক্রাইম থ্রিলার, ঐতিহাসিক নাটক এবং রোমান্টিক কমেডি — এই তিন ধারায় সবচেয়ে বেশি সিরিজ তৈরি হচ্ছে। একজন প্রখ্যাত পরিচালক জানিয়েছেন, টেলিভিশনের তুলনায় ওটিটি-তে সৃজনশীল স্বাধীনতা অনেক বেশি।",
            image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "জি বাংলা" },
            url: "https://www.zeebangla.com/"
        }
    ],
    'sports': [
        {
            title: "রুদ্ধশ্বাস ম্যাচে জয়লাভ ভারতের, সিরিজের হাতছানি",
            description: "শেষ ওভারের লড়াইয়ে প্রতিপক্ষকে হারিয়ে সিরিজে দারুণ জায়গায় পৌঁছে গেল মেন ইন ব্লু।",
            content: "শেষ ওভারের লড়াইয়ে প্রতিপক্ষকে হারিয়ে সিরিজে দারুণ জায়গায় পৌঁছে গেল মেন ইন ব্লু। ম্যাচের শেষ ওভারে ৮ রান দরকার ছিল ভারতের। চাপের মুহূর্তে দুর্দান্ত ব্যাটিং করে দলকে জয় এনে দেন তরুণ ব্যাটার।\n\nপ্রথমে ব্যাট করে প্রতিপক্ষ দল ৩১২ রান করেছিল। জবাবে ভারত ৪৯.৪ ওভারে ৬ উইকেট হারিয়ে লক্ষ্য ছুঁয়ে ফেলে। অধিনায়ক ম্যাচ শেষে জানান, তরুণ খেলোয়াড়দের আত্মবিশ্বাস দলের জন্য বড় সম্পদ। এই জয়ের ফলে ভারত ৫ ম্যাচের সিরিজে ২-১ এগিয়ে গেল। পরবর্তী ম্যাচ আগামী শুক্রবার।",
            image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "ক্রীড়া জগৎ" },
            url: "https://eisamay.com/sports"
        },
        {
            title: "আইএসএলে মোহনবাগানের দুর্দান্ত জয়, শিরোপার দৌড়ে এগিয়ে",
            description: "ঘরের মাঠে দুর্দান্ত ফুটবল খেলে প্রতিপক্ষকে হারিয়ে পয়েন্ট তালিকার শীর্ষে উঠে এসেছে সবুজ-মেরুন ব্রিগেড।",
            content: "ঘরের মাঠে দুর্দান্ত ফুটবল খেলে প্রতিপক্ষকে হারিয়ে পয়েন্ট তালিকার শীর্ষে উঠে এসেছে সবুজ-মেরুন ব্রিগেড। সল্টলেকের ভিভেকানন্দ যুবভারতী ক্রীড়াঙ্গনে ৬০ হাজার দর্শকের সামনে মোহনবাগান ৩-১ গোলে জয় পায়।\n\nপ্রথমার্ধে দুটি গোল করে এগিয়ে যায় মোহনবাগান। দ্বিতীয়ার্ধে প্রতিপক্ষ একটি গোল ফেরৎ দিলেও শেষ মুহূর্তে তৃতীয় গোলটি নিশ্চিত করে জয়। কোচ জানিয়েছেন যে দলের রক্ষণভাগ এবং মিডফিল্ড চমৎকার পারফর্ম করেছে। এই জয়ের ফলে মোহনবাগান ৪২ পয়েন্ট নিয়ে শীর্ষে রয়েছে, দ্বিতীয় স্থানে থাকা দলের থেকে ৪ পয়েন্ট এগিয়ে।",
            image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "স্পোর্টস স্টার" },
            url: "https://www.anandabazar.com/sport"
        }
    ],
    'business': [
        {
            title: "শেয়ার বাজারে রেকর্ড উত্থান, খুশি লগ্নিকারীরা",
            description: "সেনসেক্স এবং নিফটি আজ সর্বকালের উচ্চতা স্পর্শ করেছে। টেক এবং ব্যাঙ্কিং সেক্টরে ব্যাপক কেনাকাটা লক্ষ করা গেছে।",
            content: "সেনসেক্স এবং নিফটি আজ সর্বকালের উচ্চতা স্পর্শ করেছে। টেক এবং ব্যাঙ্কিং সেক্টরে ব্যাপক কেনাকাটা লক্ষ করা গেছে। সেনসেক্স ৮০,০০০-এর উপরে বন্ধ হয়েছে, যা ভারতীয় শেয়ার বাজারের ইতিহাসে একটি মাইলফলক।\n\nবিশ্লেষকরা জানাচ্ছেন যে বিদেশি বিনিয়োগকারীদের (FII) ক্রমাগত কেনাকাটা এবং দেশীয় মিউচুয়াল ফান্ডের শক্তিশালী প্রবাহ এই উত্থানের মূল কারণ। আইটি, ব্যাঙ্কিং এবং অটো সেক্টর সবচেয়ে ভালো পারফর্ম করেছে। রিলায়েন্স, টিসিএস এবং এইচডিএফসি ব্যাঙ্ক ছিল শীর্ষ গেইনার। তবে বিশেষজ্ঞরা সতর্ক করেছেন যে বাজারে অতিমূল্যায়নের লক্ষণ দেখা যাচ্ছে।",
            image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "ইকোনমিক টাইমস" },
            url: "https://eisamay.com/business"
        },
        {
            title: "রিজার্ভ ব্যাঙ্কের নতুন সুদের হার ঘোষণা, EMI-তে প্রভাব পড়বে",
            description: "আরবিআই রেপো রেট অপরিবর্তিত রেখেছে। তবে বিশেষজ্ঞরা বলছেন আগামী ত্রৈমাসিকে হার কমানোর সম্ভাবনা রয়েছে।",
            content: "আরবিআই রেপো রেট অপরিবর্তিত রেখেছে ৬.৫ শতাংশে। তবে বিশেষজ্ঞরা বলছেন আগামী ত্রৈমাসিকে হার কমানোর সম্ভাবনা রয়েছে। আরবিআই গভর্নর জানিয়েছেন যে মুদ্রাস্ফীতি নিয়ন্ত্রণে রাখা এই মুহূর্তে সর্বোচ্চ অগ্রাধিকার।\n\nহোম লোন ও কার লোনের ইএমআইতে এই সিদ্ধান্তের তাৎক্ষণিক কোনো প্রভাব পড়বে না। তবে ব্যাঙ্কাররা আশাবাদী যে আগামী নীতি সভায় ২৫ বেসিস পয়েন্ট হার কমানো হতে পারে। এফডি বিনিয়োগকারীদের জন্য এটি সুখবর কারণ বর্তমান উচ্চ সুদের হার আরও কিছু সময় বজায় থাকবে।",
            image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "বাণিজ্য বার্তা" },
            url: "https://www.anandabazar.com/business"
        }
    ],
    'technology': [
        {
            title: "ভারতে আসছে নতুন প্রযুক্তির স্মার্টফোন, শুরু হচ্ছে প্রি-অর্ডার",
            description: "অত্যাধুনিক ক্যামেরা এবং ফাস্ট চার্জিং সুবিধা সহ নতুন এই ফোনটি যুব প্রজন্মের নজর কাড়বে।",
            content: "অত্যাধুনিক ক্যামেরা এবং ফাস্ট চার্জিং সুবিধা সহ নতুন এই ফোনটি যুব প্রজন্মের নজর কাড়বে। ফোনটিতে রয়েছে ২০০ মেগাপিক্সেল প্রধান ক্যামেরা, ১২০ হার্টজ এমোলেড ডিসপ্লে এবং ৫০০০ এমএএইচ ব্যাটারি।\n\nমাত্র ১৫ মিনিটে ০ থেকে ৭০ শতাংশ চার্জ হয়ে যাবে এই ফোনটি। এতে থাকছে অন-ডিভাইস এআই ফিচার যা ফটো এডিটিং, ভাষা অনুবাদ এবং স্মার্ট অ্যাসিস্ট্যান্ট হিসেবে কাজ করবে। দাম ধরা হয়েছে ২৪,৯৯৯ টাকা থেকে শুরু। প্রথম ১০,০০০ প্রি-অর্ডারে থাকছে বিশেষ ছাড় এবং ফ্রি ওয়্যারলেস ইয়ারবাড। ফোনটি আগামী মাসে বাজারে আসবে।",
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "টেক কথন" },
            url: "https://eisamay.com/technology"
        },
        {
            title: "কৃত্রিম বুদ্ধিমত্তায় ভারতীয় স্টার্টআপের বিশ্বজয়",
            description: "এআই প্রযুক্তিতে কাজ করা একটি বেঙ্গালুরু-ভিত্তিক স্টার্টআপ আন্তর্জাতিক বিনিয়োগকারীদের কাছ থেকে বিপুল অর্থায়ন পেয়েছে।",
            content: "এআই প্রযুক্তিতে কাজ করা একটি বেঙ্গালুরু-ভিত্তিক স্টার্টআপ আন্তর্জাতিক বিনিয়োগকারীদের কাছ থেকে বিপুল অর্থায়ন পেয়েছে। সিরিজ-সি ফান্ডিং রাউন্ডে কোম্পানিটি ১৫০ মিলিয়ন ডলার সংগ্রহ করেছে।\n\nকোম্পানিটি মূলত স্বাস্থ্যসেবা এবং কৃষি ক্ষেত্রে এআই সমাধান তৈরি করে। তাদের তৈরি একটি ডায়াগনস্টিক টুল ইতিমধ্যে ১৫টি দেশে ব্যবহৃত হচ্ছে। প্রতিষ্ঠাতা জানিয়েছেন যে এই অর্থায়ন দক্ষিণ-পূর্ব এশিয়া এবং আফ্রিকায় ব্যবসা সম্প্রসারণে ব্যবহার করা হবে। বর্তমানে কোম্পানিতে ৫০০ জনেরও বেশি কর্মী কাজ করছেন, যার মধ্যে ৬০ শতাংশই গবেষণা ও উন্নয়ন বিভাগে।",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop",
            publishedAt: randomRecentTime(),
            source: { name: "ডিজিটাল বাংলা" },
            url: "https://bangla.aajtak.in/technology"
        }
    ]
};

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

// Calculate relative time like "2 hours ago"
function timeSince(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " বছর আগে";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " মাস আগে";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " দিন আগে";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ঘণ্টা আগে";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " মিনিট আগে";
    
    return "এইমাত্র";
}

// Constant for 1 hour in milliseconds
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchBengaliNews(forceRefresh = false) {
    const newsContainer = document.getElementById('news-container');
    const lastUpdatedElement = document.getElementById('last-updated');
    const loaderElement = document.getElementById('loader');
    const errorElement = document.getElementById('error-message');
    
    // Determine API parameter mapped to our UI selection FIRST
    const apiCategory = categoryMap[currentCategory] || 'general';
    
    // Determine the specific cache key for the backend category (Reduces duplicate calls)
    const cacheKey = `news_cache_${apiCategory}`;
    
    // --- SESSION LOCK: Only allow one API call per session ---
    // After first load, all navigation uses cache/seed only
    if (hasRefreshedThisSession && !forceRefresh) {
        // Try cache first (any age)
        const cachedDataStr = localStorage.getItem(cacheKey);
        if (cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                const cacheTime = new Date(cachedData.timestamp);
                lastUpdatedElement.textContent = `আপডেট: ${formatTime(cacheTime)}`;
                updateUI(cachedData.articles);
                return;
            } catch (e) {}
        }
        // No cache for this category — use seed news
        const seedArticles = SEED_NEWS[apiCategory] || SEED_NEWS['general'];
        lastUpdatedElement.textContent = 'অফলাইন ডিফল্ট খবর';
        updateUI(seedArticles);
        return;
    }

    // Check LocalStorage cache (fresh check for first load)
    const cachedDataStr = localStorage.getItem(cacheKey);
    if (cachedDataStr) {
        try {
            const cachedData = JSON.parse(cachedDataStr);
            const now = new Date().getTime();
            
            if (now - cachedData.timestamp < CACHE_DURATION) {
                console.log(`Using cached data for ${currentCategory}`);
                const cacheTime = new Date(cachedData.timestamp);
                lastUpdatedElement.textContent = `আপডেট: ${formatTime(cacheTime)}`;
                updateUI(cachedData.articles);
                hasRefreshedThisSession = true;
                return;
            } else {
                console.log(`Cache expired for ${currentCategory}. Fetching new data.`);
            }
        } catch (e) {
            console.error("Error parsing cached news data", e);
        }
    }

    // --- Proceed with Network Request ---
    newsContainer.innerHTML = '';
    errorElement.style.display = 'none';
    loaderElement.style.display = 'flex';
    
    if(loaderElement.querySelector('p')) loaderElement.querySelector('p').textContent = 'খবর লোড হচ্ছে...';
    
    const url = `${BASE_URL}?category=${apiCategory}&lang=bn&country=in&max=10&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        loaderElement.style.display = 'none';
        
        const fetchTime = new Date();
        lastUpdatedElement.textContent = `আপডেট: ${formatTime(fetchTime)}`;
        
        if (!data.articles || data.articles.length === 0) {
            showEmptyState();
        } else {
            const cacheObject = {
                timestamp: fetchTime.getTime(),
                articles: data.articles
            };
            try {
                localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
            } catch (e) {
                console.warn("Could not save to localStorage (quota full?).", e);
            }
            
            updateUI(data.articles);
        }
        
        // Mark session as refreshed after successful API call
        hasRefreshedThisSession = true;
        
    } catch (error) {
        console.error("Failed to fetch news:", error);
        loaderElement.style.display = 'none';
        
        // Mark session as refreshed even on failure (don't retry API endlessly)
        hasRefreshedThisSession = true;
        
        // --- FALLBACK LOGIC ---
        let fallbackArticles = null;
        let isFallback = false;
        let fallbackType = "";

        // Priority 1: Expired Cache
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            try {
                const expiredData = JSON.parse(cachedStr);
                fallbackArticles = expiredData.articles;
                fallbackType = `সংরক্ষিত পুরনো খবর (${formatTime(new Date(expiredData.timestamp))})`;
                isFallback = true;
            } catch(e) {}
        }

        // Priority 2: Seed News (Static Fallback)
        if (!fallbackArticles) {
            fallbackArticles = SEED_NEWS[apiCategory] || SEED_NEWS['general'];
            fallbackType = "অফলাইন ডিফল্ট খবর";
            isFallback = true;
        }

        if (isFallback && fallbackArticles) {
            errorElement.style.display = 'block';
            errorElement.innerHTML = `
                <div style="background-color: #fff3cd; color: #856404; padding: 10px 14px; border-radius: 8px; border: 1px solid #ffeeba; margin: 8px 12px 0; text-align: center; font-size: 13px; line-height: 1.4;">
                    ⚠️ লাইভ খবর লোড হয়নি। ${fallbackType} দেখানো হচ্ছে।
                </div>
            `;
            lastUpdatedElement.textContent = fallbackType;
            updateUI(fallbackArticles);
            return; 
        }
        
        // Final Error State
        errorElement.style.display = 'block';
        if (!navigator.onLine) {
            errorElement.innerHTML = `
                <div class="error-icon">🌐</div>
                <h3 class="error-title">ইন্টারনেট সংযোগ নেই</h3>
                <p>দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।</p>
                <button onclick="location.reload()" style="margin-top:15px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; font-family: inherit; cursor: pointer;">আবার চেষ্টা করুন</button>
            `;
        } else if (API_KEY === 'YOUR_API_KEY_HERE' || API_KEY.length < 10) {
            errorElement.innerHTML = `
                <div class="error-icon">🔑</div>
                <h3 class="error-title">API Key সংক্রান্ত সমস্যা</h3>
                <p style="color: #D32F2F; font-size: 14px;">আপনার API Key টি সঠিক নয় বা সেট করা নেই। দয়া করে <b>app.js</b> চেক করুন।</p>
            `;
        } else {
            errorElement.innerHTML = `
                <div class="error-icon">⚠️</div>
                <h3 class="error-title">ত্রুটি ঘটেছে</h3>
                <p>খবর লোড করতে সমস্যা হয়েছে। আপনার AdBlocker বন্ধ করে দেখুন অথবা কিছু সময় পর চেষ্টা করুন।</p>
                <button onclick="location.reload()" style="margin-top:15px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; font-family: inherit; cursor: pointer;">পুনরায় লোড করুন</button>
            `;
        }
    }
}

function updateUI(articles) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';

    articles.forEach(article => {
        const title = article.title || "শিরোনাম উপলব্ধ নেই";
        let description = article.description || "বিস্তারিত খবর পড়তে ক্লিক করুন।";
        
        const imageUrl = article.image || DEFAULT_IMAGE;
        const publishedAt = article.publishedAt;
        const timeAgo = publishedAt ? timeSince(publishedAt) : "সম্প্রতি";
        const sourceName = (article.source && article.source.name) ? article.source.name : '';

        const articleEl = document.createElement('article');
        articleEl.className = 'news-card';
        articleEl.style.cursor = 'pointer';
        articleEl.onclick = () => openArticleOverlay(article);
        
        const metaText = sourceName ? `${sourceName} • ${timeAgo}` : timeAgo;
        
        articleEl.innerHTML = `
            <div class="img-wrapper">
                <img src="${imageUrl}" alt="${title}" class="card-img" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'" loading="lazy">
            </div>
            <div class="card-content">
                <h2 class="card-title">${title}</h2>
                <p class="card-snippet">${description}</p>
                <div class="card-footer">
                    <span class="time-ago">${metaText}</span>
                </div>
            </div>
        `;
        
        newsContainer.appendChild(articleEl);
    });

    // Update the scrolling ticker with headlines from current articles
    updateTicker(articles);
}

// Dynamically update the breaking news ticker from loaded articles
function updateTicker(articles) {
    const tickerEl = document.getElementById('ticker-text');
    if (!tickerEl || !articles || articles.length === 0) return;
    
    // Pick up to 5 headlines for the ticker
    const headlines = articles
        .slice(0, 5)
        .map(a => a.title)
        .filter(t => t && t.trim() !== '');
    
    if (headlines.length === 0) return;
    
    // Join with a diamond separator and restart the CSS animation
    tickerEl.textContent = headlines.join('  ◆  ');
    
    // Restart the scroll animation so it recalculates width
    tickerEl.style.animation = 'none';
    tickerEl.offsetHeight; // force reflow
    tickerEl.style.animation = '';
}

// --- Article Detail Overlay ---
function openArticleOverlay(article) {
    const overlay = document.getElementById('article-overlay');
    const overlayImg = document.getElementById('overlay-img');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMeta = document.getElementById('overlay-meta');
    const overlayDescription = document.getElementById('overlay-description');
    const overlayLink = document.getElementById('overlay-link');
    const overlaySource = document.getElementById('overlay-source');

    // Set image
    overlayImg.src = article.image || DEFAULT_IMAGE;
    overlayImg.alt = article.title || 'News Image';
    
    // Set title
    overlayTitle.textContent = article.title || 'শিরোনাম উপলব্ধ নেই';
    
    // Set meta (source + time)
    const sourceName = (article.source && article.source.name) ? article.source.name : '';
    const publishedAt = article.publishedAt;
    const timeAgo = publishedAt ? timeSince(publishedAt) : 'সম্প্রতি';
    overlayMeta.textContent = sourceName ? `${sourceName} • ${timeAgo}` : timeAgo;
    overlaySource.textContent = sourceName;

    // Set full article body — use 'content' if available, else fall back to 'description'
    const fullText = article.content || article.description || 'এই খবরের বিস্তারিত বিবরণ পাওয়া যায়নি।';
    
    // Convert \n to paragraphs for better readability
    const paragraphs = fullText.split('\n').filter(p => p.trim() !== '');
    overlayDescription.innerHTML = paragraphs.map(p => `<p style="margin-bottom: 16px;">${p}</p>`).join('');

    // External link
    if (article.url && article.url !== '#') {
        overlayLink.href = article.url;
        overlayLink.style.display = 'inline-block';
    } else {
        overlayLink.style.display = 'none';
    }

    // Show overlay with slide-in animation
    overlay.classList.add('active');
    overlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Push a history state so Android back button works
    history.pushState({ overlay: true }, '');
}

function closeArticleOverlay() {
    const overlay = document.getElementById('article-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function showEmptyState() {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: #757575;">
            <h3>এই বিভাগে বর্তমানে কোনো খবর পাওয়া যাচ্ছে না।</h3>
            <p style="margin-top: 8px; font-size: 14px;">অনুগ্রহ করে পরে আবার চেক করুন।</p>
        </div>
    `;
}

function setupEventListeners() {
    // Back button for article overlay
    document.getElementById('overlay-back-btn').addEventListener('click', () => {
        closeArticleOverlay();
        if (history.state && history.state.overlay) {
            history.back();
        }
    });

    // Handle Android hardware back button / browser back
    window.addEventListener('popstate', (e) => {
        const overlay = document.getElementById('article-overlay');
        if (overlay.classList.contains('active')) {
            closeArticleOverlay();
        }
    });

    // Nav Categories
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-list li').forEach(li => li.classList.remove('active'));
            e.target.parentElement.classList.add('active');
            
            currentCategory = e.target.getAttribute('data-category');
            
            if (currentCategory === 'যোগাযোগ') {
                const newsContainer = document.getElementById('news-container');
                const lastUpdatedElement = document.getElementById('last-updated');
                lastUpdatedElement.textContent = "যোগাযোগ";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <h3 style="color:var(--text-main); margin-bottom: 20px; font-size: 20px;">যোগাযোগের ঠিকানা</h3>
                        <p style="font-size: 16px; margin-bottom: 10px;"><strong>Developed by:</strong> Palash Kumar Dhara</p>
                        <p style="font-size: 16px; margin-bottom: 10px;"><strong>Email:</strong> <a href="mailto:pkd2k5@gmail.com" style="color: #D32F2F; text-decoration: none;">pkd2k5@gmail.com</a></p>
                        <p style="font-size: 16px;"><strong>Mob:</strong> <a href="tel:8420710800" style="color: #D32F2F; text-decoration: none;">8420710800</a></p>
                    </div>
                `;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            fetchBengaliNews();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Bottom Navigation Logic
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            bottomNavItems.forEach(n => n.classList.remove('active'));
            const clickedBtn = e.currentTarget;
            clickedBtn.classList.add('active');

            const newsContainer = document.getElementById('news-container');
            const lastUpdatedElement = document.getElementById('last-updated');
            const btnText = clickedBtn.querySelector('span').textContent;

            if (btnText === 'ভিডিও') {
                lastUpdatedElement.textContent = "ভিডিও";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style="margin-bottom:16px; color:rgba(211,47,47,0.5)">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        <h3 style="color:var(--text-main);">ভিডিও ফিচার শীঘ্রই আসছে</h3>
                        <p style="margin-top: 8px; font-size: 14px;">আমরা এই বিভাগে কাজ করছি। পরবর্তী আপডেটের জন্য অপেক্ষা করুন।</p>
                    </div>
                `;
            } else if (btnText === 'সংরক্ষিত') {
                lastUpdatedElement.textContent = "সংরক্ষিত খবর";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style="margin-bottom:16px; color:rgba(211,47,47,0.5)">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <h3 style="color:var(--text-main);">কোনো খবর সংরক্ষিত নেই</h3>
                        <p style="margin-top: 8px; font-size: 14px;">আপনার পছন্দের খবর সেভ করতে বুকমার্ক আইকনে ক্লিক করুন।</p>
                    </div>
                `;
            } else {
                fetchBengaliNews();
            }
        });
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Allow ONE API call on startup, then session-lock kicks in
    fetchBengaliNews(true); 
});
