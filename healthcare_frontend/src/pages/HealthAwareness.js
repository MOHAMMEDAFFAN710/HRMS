import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CarelinePageHeader from "../components/CarelinePageHeader";
import "../styles/HealthAwareness.css";

const COPY = {
  en: {
    eyebrow: "CARELINE COMMUNITY HEALTH",
    title: "Small steps. Healthier lives.",
    intro: "Simple, practical health information to help you make informed decisions for yourself and your family.",
    language: "Choose your language",
    search: "Search health topics",
    all: "All topics",
    prevention: "Prevention",
    family: "Family health",
    wellbeing: "Wellbeing",
    everyday: "Everyday health",
    read: "Read tip",
    consult: "Need personal medical advice?",
    consultText: "Connect with a healthcare professional through Careline.",
    book: "Find a clinician",
    note: "Health education only. This content does not replace advice from a qualified healthcare professional. Seek urgent medical care for emergencies.",
    items: [
      ["Handwashing matters", "Everyday health", "Wash your hands with soap and clean water before preparing food and eating, and after using the toilet. Clean hands help reduce the spread of many infections.", "Make handwashing part of the whole family's routine."],
      ["Drink safe water", "Prevention", "Use water from a safe source. If you are unsure whether water is safe, follow local public-health guidance on boiling or treating it, and store it in a clean covered container.", "Keep drinking-water containers clean and covered."],
      ["Know your blood pressure", "Prevention", "High blood pressure may not cause noticeable symptoms. Regular checks can help identify it early. Ask a qualified health worker how often you should be checked.", "Do not start or stop prescribed medicine without medical advice."],
      ["Care during pregnancy", "Family health", "Antenatal check-ups help monitor the health of the pregnant person and baby. Contact a qualified health worker early to plan visits, nutrition advice and recommended tests.", "Seek urgent care for severe bleeding, seizures or other emergency symptoms."],
      ["Support mental wellbeing", "Wellbeing", "Make time for rest, connection and activities that help you cope. If sadness, anxiety or stress is persistent or affects daily life, consider speaking with a qualified health professional.", "If someone is in immediate danger, seek local emergency help."],
      ["Use medicines safely", "Everyday health", "Follow the instructions given by your doctor or pharmacist. Check the dose and timing, and never share prescription medicines with others.", "Ask a health professional if you are unsure about a medicine."]
    ]
  },
  kn: {
    eyebrow: "ಕೇರ್‌ಲೈನ್ ಸಮುದಾಯ ಆರೋಗ್ಯ", title: "ಸಣ್ಣ ಹೆಜ್ಜೆಗಳು. ಆರೋಗ್ಯಕರ ಜೀವನ.", intro: "ನಿಮ್ಮ ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬದ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ತಿಳಿದ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಸರಳ ಆರೋಗ್ಯ ಮಾಹಿತಿ.", language: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", search: "ಆರೋಗ್ಯ ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ", all: "ಎಲ್ಲಾ ವಿಷಯಗಳು", prevention: "ತಡೆಗಟ್ಟುವಿಕೆ", family: "ಕುಟುಂಬ ಆರೋಗ್ಯ", wellbeing: "ಮಾನಸಿಕ ಕ್ಷೇಮ", everyday: "ದೈನಂದಿನ ಆರೋಗ್ಯ", read: "ಮಾಹಿತಿ ಓದಿ", consult: "ವೈಯಕ್ತಿಕ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಬೇಕೇ?", consultText: "ಕೇರ್‌ಲೈನ್ ಮೂಲಕ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.", book: "ವೈದ್ಯರನ್ನು ಹುಡುಕಿ", note: "ಇದು ಆರೋಗ್ಯ ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಮಾತ್ರ. ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರ ಸಲಹೆಗೆ ಇದು ಪರ್ಯಾಯವಲ್ಲ. ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ.",
    items: [["ಕೈ ತೊಳೆಯುವುದು ಮುಖ್ಯ", "ದೈನಂದಿನ ಆರೋಗ್ಯ", "ಆಹಾರ ತಯಾರಿಸುವ ಮೊದಲು, ಊಟ ಮಾಡುವ ಮೊದಲು ಮತ್ತು ಶೌಚಾಲಯ ಬಳಸಿದ ನಂತರ ಸಾಬೂನು ಹಾಗೂ ಸ್ವಚ್ಛ ನೀರಿನಿಂದ ಕೈ ತೊಳೆಯಿರಿ.", "ಇಡೀ ಕುಟುಂಬದ ದಿನಚರಿಯಲ್ಲಿ ಕೈ ತೊಳೆಯುವುದನ್ನು ಸೇರಿಸಿ."], ["ಸುರಕ್ಷಿತ ಕುಡಿಯುವ ನೀರು", "ತಡೆಗಟ್ಟುವಿಕೆ", "ಸುರಕ್ಷಿತ ಮೂಲದ ನೀರನ್ನು ಬಳಸಿ. ನೀರಿನ ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ಅನುಮಾನವಿದ್ದರೆ ಸ್ಥಳೀಯ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶನ ಅನುಸರಿಸಿ.", "ನೀರಿನ ಪಾತ್ರೆಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಮುಚ್ಚಿಡಿ."], ["ರಕ್ತದೊತ್ತಡ ಪರಿಶೀಲಿಸಿ", "ತಡೆಗಟ್ಟುವಿಕೆ", "ಅಧಿಕ ರಕ್ತದೊತ್ತಡಕ್ಕೆ ಸ್ಪಷ್ಟ ಲಕ್ಷಣಗಳಿರದೇ ಇರಬಹುದು. ನಿಯಮಿತ ಪರೀಕ್ಷೆ ಆರಂಭದಲ್ಲೇ ಪತ್ತೆಹಚ್ಚಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.", "ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಔಷಧಿಯನ್ನು ಬದಲಾಯಿಸಬೇಡಿ."], ["ಗರ್ಭಾವಸ್ಥೆಯ ಆರೈಕೆ", "ಕುಟುಂಬ ಆರೋಗ್ಯ", "ಗರ್ಭಾವಸ್ಥೆಯ ತಪಾಸಣೆಗಳು ತಾಯಿ ಮತ್ತು ಮಗುವಿನ ಆರೋಗ್ಯವನ್ನು ಗಮನಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ. ಅರ್ಹ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ.", "ತುರ್ತು ಲಕ್ಷಣಗಳಿದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ."], ["ಮಾನಸಿಕ ಕ್ಷೇಮಕ್ಕೆ ಬೆಂಬಲ", "ಮಾನಸಿಕ ಕ್ಷೇಮ", "ವಿಶ್ರಾಂತಿ, ಆತ್ಮೀಯರ ಸಂಪರ್ಕ ಮತ್ತು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುವ ಚಟುವಟಿಕೆಗಳಿಗೆ ಸಮಯ ನೀಡಿ. ತೊಂದರೆ ಮುಂದುವರಿದರೆ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.", "ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ."], ["ಔಷಧಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಿ", "ದೈನಂದಿನ ಆರೋಗ್ಯ", "ವೈದ್ಯರು ಅಥವಾ ಔಷಧ ತಜ್ಞರು ನೀಡಿದ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ. ನಿಮ್ಮ ಔಷಧಿಯನ್ನು ಇತರರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.", "ಔಷಧಿಯ ಬಗ್ಗೆ ಅನುಮಾನವಿದ್ದರೆ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಕೇಳಿ."]]
  },
  hi: {
    eyebrow: "केयरलाइन सामुदायिक स्वास्थ्य", title: "छोटे कदम। बेहतर स्वास्थ्य।", intro: "आप और आपके परिवार के लिए सोच-समझकर स्वास्थ्य संबंधी निर्णय लेने में मदद करने वाली सरल जानकारी।", language: "अपनी भाषा चुनें", search: "स्वास्थ्य विषय खोजें", all: "सभी विषय", prevention: "रोकथाम", family: "परिवार का स्वास्थ्य", wellbeing: "मानसिक स्वास्थ्य", everyday: "रोज़मर्रा का स्वास्थ्य", read: "जानकारी पढ़ें", consult: "व्यक्तिगत चिकित्सकीय सलाह चाहिए?", consultText: "केयरलाइन के माध्यम से स्वास्थ्य पेशेवर से जुड़ें।", book: "डॉक्टर खोजें", note: "यह केवल स्वास्थ्य शिक्षा है, योग्य स्वास्थ्य पेशेवर की सलाह का विकल्प नहीं। आपात स्थिति में तुरंत चिकित्सा सहायता लें।",
    items: [["हाथ धोना ज़रूरी है", "रोज़मर्रा का स्वास्थ्य", "खाना बनाने और खाने से पहले तथा शौचालय के बाद साबुन और साफ पानी से हाथ धोएँ।", "पूरे परिवार की दिनचर्या में हाथ धोना शामिल करें।"], ["सुरक्षित पानी पिएँ", "रोकथाम", "सुरक्षित स्रोत का पानी इस्तेमाल करें। पानी की सुरक्षा को लेकर संदेह हो तो स्थानीय स्वास्थ्य निर्देशों का पालन करें।", "पीने के पानी के बर्तन साफ और ढके रखें।"], ["रक्तचाप की जाँच करें", "रोकथाम", "उच्च रक्तचाप के स्पष्ट लक्षण नहीं हो सकते। नियमित जाँच से इसका जल्दी पता लगाने में मदद मिलती है।", "डॉक्टर की सलाह के बिना दवा बंद या बदलें नहीं।"], ["गर्भावस्था में देखभाल", "परिवार का स्वास्थ्य", "गर्भावस्था की नियमित जाँच गर्भवती व्यक्ति और बच्चे के स्वास्थ्य की निगरानी में मदद करती है।", "आपात लक्षण होने पर तुरंत चिकित्सा सहायता लें।"], ["मानसिक स्वास्थ्य का ध्यान रखें", "मानसिक स्वास्थ्य", "आराम, अपनों से जुड़ाव और सहायक गतिविधियों के लिए समय निकालें। परेशानी बनी रहे तो स्वास्थ्य पेशेवर से बात करें।", "तत्काल खतरे में स्थानीय आपात सहायता लें।"], ["दवाओं का सुरक्षित उपयोग", "रोज़मर्रा का स्वास्थ्य", "डॉक्टर या फार्मासिस्ट के निर्देशों का पालन करें और अपनी पर्चे वाली दवाएँ दूसरों से साझा न करें।", "दवा को लेकर संदेह हो तो स्वास्थ्य पेशेवर से पूछें।"]]
  },
  te: {
    eyebrow: "కేర్‌లైన్ కమ్యూనిటీ ఆరోగ్యం", title: "చిన్న అడుగులు. ఆరోగ్యకరమైన జీవితం.", intro: "మీకు, మీ కుటుంబానికి ఆరోగ్య నిర్ణయాలు తీసుకోవడంలో సహాయపడే సరళమైన సమాచారం.", language: "మీ భాషను ఎంచుకోండి", search: "ఆరోగ్య అంశాలను వెతకండి", all: "అన్ని అంశాలు", prevention: "నివారణ", family: "కుటుంబ ఆరోగ్యం", wellbeing: "మానసిక శ్రేయస్సు", everyday: "రోజువారీ ఆరోగ్యం", read: "చిట్కా చదవండి", consult: "వ్యక్తిగత వైద్య సలహా కావాలా?", consultText: "కేర్‌లైన్ ద్వారా ఆరోగ్య నిపుణుడిని సంప్రదించండి.", book: "వైద్యుడిని కనుగొనండి", note: "ఇది ఆరోగ్య అవగాహన కోసం మాత్రమే; అర్హత కలిగిన వైద్యుని సలహాకు ప్రత్యామ్నాయం కాదు. అత్యవసర పరిస్థితుల్లో వెంటనే వైద్య సహాయం పొందండి.",
    items: [["చేతులు కడుక్కోవడం ముఖ్యం", "రోజువారీ ఆరోగ్యం", "ఆహారం తయారు చేసే ముందు, తినే ముందు మరియు మరుగుదొడ్డి ఉపయోగించిన తర్వాత సబ్బుతో చేతులు కడుక్కోండి.", "కుటుంబం రోజువారీ అలవాట్లలో చేతులు కడుక్కోవడాన్ని చేర్చండి."], ["సురక్షితమైన నీరు తాగండి", "నివారణ", "సురక్షితమైన నీటి వనరును ఉపయోగించండి. నీటి భద్రతపై సందేహం ఉంటే స్థానిక ఆరోగ్య సూచనలను పాటించండి.", "తాగునీటి పాత్రలను శుభ్రంగా, మూతపెట్టి ఉంచండి."], ["రక్తపోటును తనిఖీ చేయండి", "నివారణ", "అధిక రక్తపోటుకు స్పష్టమైన లక్షణాలు ఉండకపోవచ్చు. క్రమం తప్పని పరీక్షలు ముందుగానే గుర్తించడంలో సహాయపడతాయి.", "వైద్యుని సలహా లేకుండా మందులను మార్చవద్దు."], ["గర్భధారణ సమయంలో సంరక్షణ", "కుటుంబ ఆరోగ్యం", "గర్భధారణ పరీక్షలు తల్లి, శిశువు ఆరోగ్యాన్ని పర్యవేక్షించడంలో సహాయపడతాయి.", "అత్యవసర లక్షణాలు ఉంటే వెంటనే వైద్య సహాయం పొందండి."], ["మానసిక శ్రేయస్సుకు తోడ్పాటు", "మానసిక శ్రేయస్సు", "విశ్రాంతి, కుటుంబ సభ్యులతో అనుబంధం, సహాయపడే కార్యకలాపాలకు సమయం కేటాయించండి.", "తక్షణ ప్రమాదంలో అత్యవసర సహాయం పొందండి."], ["మందులను సురక్షితంగా వాడండి", "రోజువారీ ఆరోగ్యం", "వైద్యుడు లేదా ఫార్మసిస్ట్ ఇచ్చిన సూచనలను పాటించండి. ప్రిస్క్రిప్షన్ మందులను ఇతరులతో పంచుకోవద్దు.", "సందేహాలుంటే ఆరోగ్య నిపుణుడిని అడగండి."]]
  },
  ta: {
    eyebrow: "கேர்லைன் சமூக நலம்", title: "சிறிய படிகள். ஆரோக்கியமான வாழ்க்கை.", intro: "உங்களுக்கும் உங்கள் குடும்பத்திற்கும் உதவும் எளிய சுகாதாரத் தகவல்கள்.", language: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", search: "சுகாதார தலைப்புகளைத் தேடுங்கள்", all: "அனைத்து தலைப்புகள்", prevention: "தடுப்பு", family: "குடும்ப நலம்", wellbeing: "மனநலம்", everyday: "அன்றாட நலம்", read: "குறிப்பைப் படிக்கவும்", consult: "தனிப்பட்ட மருத்துவ ஆலோசனை வேண்டுமா?", consultText: "கேர்லைன் மூலம் சுகாதார நிபுணரை அணுகுங்கள்.", book: "மருத்துவரைக் கண்டறியுங்கள்", note: "இது சுகாதார விழிப்புணர்வுக்காக மட்டுமே; தகுதியான மருத்துவ நிபுணரின் ஆலோசனைக்கு மாற்றாகாது. அவசரநிலையில் உடனடி மருத்துவ உதவி பெறுங்கள்.",
    items: [["கைகளை கழுவுவது முக்கியம்", "அன்றாட நலம்", "உணவு தயாரிக்கும் முன், சாப்பிடும் முன் மற்றும் கழிப்பறையைப் பயன்படுத்திய பின் சோப்பால் கைகளை கழுவுங்கள்.", "குடும்பத்தின் அன்றாட வழக்கத்தில் கை கழுவுதலைச் சேர்க்கவும்."], ["பாதுகாப்பான தண்ணீர் குடிக்கவும்", "தடுப்பு", "பாதுகாப்பான நீர் மூலத்தைப் பயன்படுத்தவும். சந்தேகம் இருந்தால் உள்ளூர் சுகாதார வழிகாட்டுதலைப் பின்பற்றவும்.", "குடிநீர் பாத்திரங்களைச் சுத்தமாகவும் மூடியும் வைக்கவும்."], ["இரத்த அழுத்தத்தைச் சரிபார்க்கவும்", "தடுப்பு", "உயர் இரத்த அழுத்தத்திற்கு வெளிப்படையான அறிகுறிகள் இல்லாமல் இருக்கலாம். வழக்கமான பரிசோதனை உதவும்.", "மருத்துவரின் ஆலோசனையின்றி மருந்தை மாற்ற வேண்டாம்."], ["கர்ப்பகால பராமரிப்பு", "குடும்ப நலம்", "கர்ப்பகால பரிசோதனைகள் கர்ப்பிணி நபரின் மற்றும் குழந்தையின் நலனை கண்காணிக்க உதவும்.", "அவசர அறிகுறிகள் இருந்தால் உடனடியாக மருத்துவ உதவி பெறவும்."], ["மனநலத்தை ஆதரிக்கவும்", "மனநலம்", "ஓய்வு, உறவுகள் மற்றும் உங்களுக்கு உதவும் செயல்களுக்கு நேரம் ஒதுக்குங்கள். சிரமம் தொடர்ந்தால் நிபுணரிடம் பேசுங்கள்.", "உடனடி ஆபத்தில் அவசர உதவியை நாடுங்கள்."], ["மருந்துகளைப் பாதுகாப்பாகப் பயன்படுத்தவும்", "அன்றாட நலம்", "மருத்துவர் அல்லது மருந்தாளரின் வழிமுறைகளைப் பின்பற்றுங்கள். பரிந்துரைக்கப்பட்ட மருந்துகளைப் பகிர வேண்டாம்.", "சந்தேகம் இருந்தால் சுகாதார நிபுணரிடம் கேளுங்கள்."]]
  }
};

const LANGUAGES = [
  ["en", "English"], ["kn", "ಕನ್ನಡ"], ["hi", "हिन्दी"], ["te", "తెలుగు"], ["ta", "தமிழ்"]
];

export default function HealthAwareness() {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("careline-awareness-language") || "en"; }
    catch { return "en"; }
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const copy = COPY[language] || COPY.en;
  const categories = [
    ["all", copy.all], ["Prevention", copy.prevention], ["Family health", copy.family],
    ["Wellbeing", copy.wellbeing], ["Everyday health", copy.everyday]
  ];
  const categoryFor = (itemCategory) => {
    if (itemCategory === "Prevention") return copy.prevention;
    if (itemCategory === "Family health") return copy.family;
    if (itemCategory === "Wellbeing") return copy.wellbeing;
    return copy.everyday;
  };
  const items = useMemo(() => copy.items.map((item, index) => ({
    id: index, title: item[0], category: item[1], body: item[2], takeaway: item[3]
  })).filter((item) => {
    const matchesCategory = category === "all" || item.category === categoryFor(category);
    const searchText = `${item.title} ${item.category} ${item.body}`.toLowerCase();
    return matchesCategory && searchText.includes(query.toLowerCase());
  }), [copy, category, query]);
  const changeLanguage = (value) => {
    setLanguage(value);
    try { localStorage.setItem("careline-awareness-language", value); } catch {}
    setExpanded(null);
  };

  return (
    <div className="health-awareness-page">
      <CarelinePageHeader />
      <main className="ha-main">
        <section className="ha-hero">
          <p className="ha-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="ha-intro">{copy.intro}</p>
          <div className="ha-language">
            <label htmlFor="ha-language-select">{copy.language}</label>
            <select id="ha-language-select" value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {LANGUAGES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
        </section>
        <section className="ha-content" aria-label={copy.eyebrow}>
          <div className="ha-tools">
            <label className="ha-search">
              <span className="ha-sr-only">{copy.search}</span>
              <span aria-hidden="true">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
            </label>
            <div className="ha-filters" aria-label={copy.all}>
              {categories.map(([value, label]) => (
                <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="ha-grid">
            {items.map((item) => (
              <article className="ha-card" key={`${language}-${item.id}`}>
                <div className="ha-card-top"><span className="ha-card-icon" aria-hidden="true">{["✳", "◉", "♡", "⌂", "☼", "＋"][item.id]}</span><span className="ha-tag">{item.category}</span></div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <button type="button" className="ha-read" aria-expanded={expanded === item.id} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>{expanded === item.id ? "−" : "+"} {copy.read}</button>
                {expanded === item.id && <div className="ha-takeaway">{item.takeaway}</div>}
              </article>
            ))}
            {!items.length && <p className="ha-empty">{copy.search}: “{query}”</p>}
          </div>
        </section>
        <section className="ha-consult">
          <div><p className="ha-eyebrow">CARELINE</p><h2>{copy.consult}</h2><p>{copy.consultText}</p></div>
          <Link to="/telemedicine" className="ha-book">{copy.book} <span aria-hidden="true">↗</span></Link>
        </section>
        <p className="ha-disclaimer">{copy.note}</p>
      </main>
    </div>
  );
}
