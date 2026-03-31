import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { Language } from '@/lib/data-access';

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
    const lang = (['sk', 'en', 'cz'].includes(params.lang) ? params.lang : 'sk') as Language;
    const title = lang === 'sk' ? 'Zásady cookies' : lang === 'cz' ? 'Zásady cookies' : 'Cookie Policy';
    return {
        title: `${title} | Relax Properties`,
        description: title,
    };
}

const contentData = {
    sk: {
        title: "Zásady cookies",
        intro: "Tieto Zásady používania súborov cookie boli naposledy aktualizované 2. máj 2024 a vzťahujú sa na občanov a legálne osoby s trvalým pobytom v Európskom hospodárskom priestore a Švajčiarsku.",
        sections: [
            {
                heading: "1. Úvod",
                paragraphs: [
                    "Naša webová stránka, https://relaxproperties.sk (ďalej len „webová stránka“) používa súbory cookie a ďalšie súvisiace technológie (všetky technológie sa kvôli pohodliu označujú ako „súbory cookie“). Súbory cookie umiestňujú aj tretie strany, ktoré sme zapojili. V nižšie uvedenom dokumente vás informujeme o používaní súborov cookie na našich webových stránkach."
                ]
            },
            {
                heading: "2. Čo sú cookies?",
                paragraphs: [
                    "Cookie je malý jednoduchý súbor, ktorý je odoslaný spolu so stránkami tohto webu a uložený vašim prehliadačom na pevnom disku vášho počítača alebo iného zariadenia. Informácie v nich uložené môžu byť vrátené na naše servery alebo na servery príslušných tretích strán počas nasledujúcej návštevy."
                ]
            },
            {
                heading: "3. Čo sú skripty?",
                paragraphs: [
                    "Skript je časť programového kódu, ktorý sa používa na správnu a interaktívnu funkciu našich webových stránok. Tento kód sa spustí na našom serveri alebo na vašom zariadení."
                ]
            },
            {
                heading: "4. Čo je to webový maják?",
                paragraphs: [
                    "Webový maják (alebo pixelová značka) je malý neviditeľný text alebo obrázok na webovej stránke, ktorý sa používa na monitorovanie návštevnosti webových stránok. Za týmto účelom sa pomocou webových majákov ukladajú rôzne údaje o vás."
                ]
            },
            {
                heading: "5. Cookies",
                paragraphs: [
                    "**5.1 Technické alebo funkčné cookies:** Niektoré súbory cookie zaisťujú, že určité časti webových stránok fungujú správne a že vaše preferencie používateľov zostanú známe. Umiestnením funkčných súborov cookie vám uľahčujeme návštevu našich webových stránok. Takto nemusíte pri návšteve našich webových stránok opakovane zadávať rovnaké informácie a napríklad položky zostanú vo vašom nákupnom košíku, kým nezaplatíte. Tieto súbory cookie môžeme umiestňovať bez vášho súhlasu.",
                    "**5.2 Štatistické cookies:** Štatistické súbory cookie používame na optimalizáciu zážitku z webových stránok pre našich používateľov. Vďaka týmto štatistickým súborom cookie získavame prehľad o používaní našich webových stránok. Žiadame vás o povolenie umiestňovať štatistické súbory cookie.",
                    "**5.3 Reklamné cookies:** Na tomto webe používame reklamné cookies, ktoré nám umožňujú získať prehľad o výsledkoch kampane. To sa deje na základe profilu, ktorý vytvoríme na základe vášho správania v https://relaxproperties.sk. Vďaka týmto súborom cookie ste ako návštevník webových stránok prepojení s jedinečným identifikátorom, ale tieto súbory cookie nebudú profilovať vaše správanie a záujmy pri zobrazovaní prispôsobených reklám.",
                    "**5.4 Marketingové/sledovacie cookies:** Marketingové/sledovacie súbory cookie sú súbory cookie alebo akákoľvek iná forma miestneho úložiska, ktoré sa používajú na vytváranie profilov používateľov na zobrazenie reklamy alebo na sledovanie používateľa na tomto webe alebo na niekoľkých webových stránkach na podobné marketingové účely. Pretože sú tieto súbory cookie označené ako sledovacie súbory cookie, žiadame vás o povolenie ich umiestnenia.",
                    "**5.5 Sociálne médiá:** Na našu webovú stránku sme zahrnuli obsah od Facebook a Instagram na propagáciu webových stránok (napr. „páči sa mi to“, „pripnutie“) alebo zdieľanie (napr. „tweetovanie“) na sociálnych sieťach. Tento obsah je vložený s kódom odvodeným z Facebook a Instagram a umiestňuje súbory cookie. Váš obsah môže uchovávať a spracovávať určité informácie na účely prispôsobenej reklamy."
                ]
            },
            {
                heading: "6. Umiestnené cookies",
                paragraphs: [
                    "Google Analytics (Statistics), WordPress (Functional), WPML (Functional), Google Fonts (Marketing/Tracking), Facebook (Marketing/Tracking, Functional), Instagram (Marketing/Tracking)."
                ]
            },
            {
                heading: "7. Súhlas",
                paragraphs: [
                    "Keď navštívite náš web prvýkrát, ukážeme vám kontextové okno s vysvetlením o súboroch cookie. Akonáhle kliknete na „Uložiť predvoľby“, súhlasíte s tým, že použijeme kategórie súborov cookie a doplnkov, ktoré ste vybrali v kontextovom okne. Používanie súborov cookie môžete zakázať prostredníctvom svojho prehliadača, ale upozorňujeme, že náš web už nemusí správne fungovať."
                ]
            },
            {
                heading: "8. Povolenie/zakázanie a odstraňovanie súborov cookie",
                paragraphs: [
                    "Váš internetový prehliadač môžete použiť na automatické alebo manuálne mazanie cookies. Môžete tiež špecifikovať, že niektoré súbory cookie nemusia byť umiestnené. Ďalšou možnosťou je zmeniť nastavenia svojho internetového prehliadača tak, aby ste dostali správu vždy, keď sa umiestni súbor cookie. Ak sú všetky súbory cookie zakázané, náš web nemusí fungovať správne."
                ]
            },
            {
                heading: "9. Vaše práva v súvislosti s osobnými údajmi",
                paragraphs: [
                    "Máte právo vedieť, prečo sú vaše osobné údaje potrebné, čo sa s nimi stane a ako dlho budú uchovávané.",
                    "Právo na prístup: Máte právo na prístup k svojim osobným údajom, ktoré sú nám známe.",
                    "Právo na opravu: máte právo kedykoľvek doplniť, opraviť, vymazať alebo zablokovať vaše osobné údaje.",
                    "Ak nám udelíte súhlas so spracovaním vašich údajov, máte právo tento súhlas odvolať a vymazať vaše osobné údaje.",
                    "Právo na prenos vašich údajov: máte právo požadovať od správcu všetky svoje osobné údaje a preniesť ich k ďalšiemu prevádzkovateľovi.",
                    "Ak chcete uplatniť tieto práva, kontaktujte nás."
                ]
            },
            {
                heading: "10. Kontaktné údaje",
                paragraphs: [
                    "Relax Properties s. r. o., Na vyhliadke 2916/5, 900 31 Stupava, Slovensko.",
                    "Webová stránka: https://relaxproperties.sk",
                    "E-mail: info@relaxproperties.sk",
                    "Telefón: +421 911 819 152"
                ]
            }
        ]
    },
    en: {
        title: "Cookie Policy",
        intro: "This Cookie Policy was last updated on May 2, 2024, and applies to citizens and legal permanent residents of the European Economic Area and Switzerland.",
        sections: [
            {
                heading: "1. Introduction",
                paragraphs: [
                    "Our website, https://relaxproperties.sk (hereinafter referred to as the \"website\") uses cookies and other related technologies (all technologies are referred to as \"cookies\" for convenience). Cookies are also placed by third parties we have engaged. In the document below we inform you about the use of cookies on our website."
                ]
            },
            {
                heading: "2. What are cookies?",
                paragraphs: [
                    "A cookie is a small simple file that is sent along with pages of this website and stored by your browser on the hard drive of your computer or another device. The information stored therein may be returned to our servers or to the servers of the relevant third parties during a subsequent visit."
                ]
            },
            {
                heading: "3. What are scripts?",
                paragraphs: [
                    "A script is a piece of program code that is used to make our website function properly and interactively. This code is executed on our server or on your device."
                ]
            },
            {
                heading: "4. What is a web beacon?",
                paragraphs: [
                    "A web beacon (or a pixel tag) is a small, invisible piece of text or image on a website that is used to monitor traffic on a website. In order to do this, various data about you is stored using web beacons."
                ]
            },
            {
                heading: "5. Cookies",
                paragraphs: [
                    "**5.1 Technical or functional cookies:** Certain cookies ensure that specific parts of the website work properly and that your user preferences remain known. By placing functional cookies, we make it easier for you to visit our website. This way, you do not need to repeatedly enter the same information when visiting our website, and, for example, the items remain in your shopping cart until you have paid. We may place these cookies without your consent.",
                    "**5.2 Statistical cookies:** We use statistical cookies to optimize the website experience for our users. With these statistical cookies, we get insights into the usage of our website. We ask your permission to place statistical cookies.",
                    "**5.3 Advertising cookies:** On this website we use advertising cookies, enabling us to gain insights into the campaign results. This happens based on a profile we create based on your behavior on https://relaxproperties.sk. With these cookies, you, as a website visitor, are linked to a unique ID, but these cookies will not profile your behavior and interests to serve personalized ads.",
                    "**5.4 Marketing/Tracking cookies:** Marketing/Tracking cookies are cookies or any other form of local storage, used to create user profiles to display advertising or to track the user on this website or across several websites for similar marketing purposes.",
                    "**5.5 Social media:** On our website, we have included content from Facebook and Instagram to promote webpages (e.g. “like”, “pin”) or share (e.g. “tweet”) on social networks. This content is embedded with code derived from Facebook and Instagram and places cookies. This content might store and process certain information for personalized advertising."
                ]
            },
            {
                heading: "6. Placed cookies",
                paragraphs: [
                    "Google Analytics (Statistics), WordPress (Functional), WPML (Functional), Google Fonts (Marketing/Tracking), Facebook (Marketing/Tracking, Functional), Instagram (Marketing/Tracking)."
                ]
            },
            {
                heading: "7. Consent",
                paragraphs: [
                    "When you visit our website for the first time, we will show you a pop-up with an explanation about cookies. As soon as you click on \"Save preferences\", you consent to us using the categories of cookies and plug-ins you selected in the pop-up, as described in this Cookie Policy. You can disable the use of cookies via your browser, but please note that our website may no longer work properly."
                ]
            },
            {
                heading: "8. Enabling/disabling and deleting cookies",
                paragraphs: [
                    "You can use your internet browser to automatically or manually delete cookies. You can also specify that certain cookies may not be placed. Another option is to change the settings of your internet browser so that you receive a message each time a cookie is placed. If all cookies are disabled, our website may not function correctly."
                ]
            },
            {
                heading: "9. Your rights with respect to personal data",
                paragraphs: [
                    "You have the following rights regarding your personal data:",
                    "The right to know why your personal data is needed, what will happen to it, and how long it will be retained.",
                    "Right of access: You have the right to access your personal data that is known to us.",
                    "Right to rectification: you have the right to supplement, correct, delete, or block your personal data whenever you wish.",
                    "If you give us your consent to process your data, you have the right to revoke that consent and to have your personal data deleted.",
                    "Right to object: you may object to the processing of your data."
                ]
            },
            {
                heading: "10. Contact details",
                paragraphs: [
                    "Relax Properties s. r. o., Na vyhliadke 2916/5, 900 31 Stupava, Slovakia.",
                    "Website: https://relaxproperties.sk",
                    "E-mail: info@relaxproperties.sk",
                    "Phone: +421 911 819 152"
                ]
            }
        ]
    },
    cz: {
        title: "Zásady cookies",
        intro: "Tyto Zásady používání souborů cookie byly naposledy aktualizovány 2. května 2024 a vztahují se na občany a osoby s trvalým pobytem v Evropském hospodářském prostoru a Švýcarsku.",
        sections: [
            {
                heading: "1. Úvod",
                paragraphs: [
                    "Naše webová stránka, https://relaxproperties.sk (dále jen „webová stránka“) používá soubory cookie a další související technologie (všechny technologie se pro zjednodušení označují jako „soubory cookie“). Soubory cookie umisťují i třetí strany. Níže vás informujeme o používání souborů cookie na našem webu."
                ]
            },
            {
                heading: "2. Co jsou cookies?",
                paragraphs: [
                    "Cookie je malý jednoduchý soubor, který je odeslán spolu se stránkami tohoto webu a uložen vaším prohlížečem na pevný disk vašeho zařízení. Informace v nich uložené mohou být vráceny na naše servery nebo na servery příslušných třetích stran během následující návštěvy."
                ]
            },
            {
                heading: "3. Co jsou skripty?",
                paragraphs: [
                    "Skript je část programového kódu, který se používá ke správné a interaktivní funkci našich webových stránek. Tento kód se spustí na našem serveru nebo na vašem zařízení."
                ]
            },
            {
                heading: "4. Co je to webový maják?",
                paragraphs: [
                    "Webový maják (nebo pixelová značka) je malý neviditelný text nebo obrázek na webové stránce, který se používá k monitorování návštěvnosti. Za tímto účelem se získávají různé údaje o vás."
                ]
            },
            {
                heading: "5. Cookies",
                paragraphs: [
                    "**5.1 Technické nebo funkční cookies:** Některé soubory cookie zajišťují, že určité části webových stránek fungují správně. Tyto soubory cookie můžeme umisťovat bez vašeho souhlasu.",
                    "**5.2 Statistické cookies:** Statistické soubory cookie používáme k optimalizaci zážitku z webových stránek. Díky těmto souborům získáváme přehled o používání našich webových stránek. Žádáme vás o povolení umisťovat statistické soubory cookie.",
                    "**5.3 Reklamní cookies:** Na tomto webu používáme reklamní cookies, které nám umožňují získat přehled o výsledcích kampaně. Tyto soubory cookie nebudou profilovat vaše chování a zájmy při zobrazování přizpůsobených reklam.",
                    "**5.4 Marketingové/sledovací cookies:** Marketingové/sledovací soubory cookie se používají k vytváření profilů uživatelů pro reklamní účely.",
                    "**5.5 Sociální média:** Na naši webovou stránku jsme zahrnuli obsah z Facebooku a Instagramu. Tento obsah ukládá určité informace pro účely přizpůsobené reklamy."
                ]
            },
            {
                heading: "6. Umístěné cookies",
                paragraphs: [
                    "Google Analytics (Statistics), WordPress (Functional), WPML (Functional), Google Fonts (Marketing/Tracking), Facebook (Marketing/Tracking, Functional), Instagram (Marketing/Tracking)."
                ]
            },
            {
                heading: "7. Souhlas",
                paragraphs: [
                    "Když navštívíte náš web poprvé, ukážeme vám kontextové okno s vysvětlením o souborech cookie. Používání souborů cookie můžete zakázat prostřednictvím svého prohlížeče, ale upozorňujeme, že náš web již nemusí správně fungovat."
                ]
            },
            {
                heading: "8. Povolení/zakázání a odstraňování souborů cookie",
                paragraphs: [
                    "Váš internetový prohlížeč můžete použít k automatickému nebo manuálnímu mazání cookies. Pokud jsou všechny soubory cookie zakázány, náš web nemusí fungovat správně."
                ]
            },
            {
                heading: "9. Vaše práva v souvislosti s osobními údaji",
                paragraphs: [
                    "Máte právo na přístup, opravu, nebo výmaz vašich osobních údajů. Můžete vznést námitku proti zpracování."
                ]
            },
            {
                heading: "10. Kontaktní údaje",
                paragraphs: [
                    "Relax Properties s. r. o., Na vyhliadke 2916/5, 900 31 Stupava, Slovensko.",
                    "Webová stránka: https://relaxproperties.sk",
                    "E-mail: info@relaxproperties.sk",
                    "Telefon: +421 911 819 152"
                ]
            }
        ]
    }
};

export default async function CookiePolicyPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const content = contentData[validLang];

    return (
        <div className="bg-[var(--color-surface)] min-h-screen pt-[clamp(6rem,10vw,8rem)] pb-[clamp(4rem,8vw,6rem)]">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                    <h1 className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-[var(--color-secondary)] mb-[clamp(1rem,2vw,1.5rem)] tracking-tight">
                        {content.title}
                    </h1>
                    
                    <p className="text-[var(--color-muted)] text-base md:text-lg leading-relaxed mb-10 pb-8 border-b border-[var(--color-border)]">
                        {content.intro}
                    </p>

                    <div className="space-y-12">
                        {content.sections.map((section, index) => (
                            <section key={index}>
                                <h2 className="font-serif text-xl md:text-2xl text-[var(--color-secondary)] mb-4">
                                    {section.heading}
                                </h2>
                                <div className="space-y-4">
                                    {section.paragraphs.map((paragraph, pIdx) => {
                                        const isBold = paragraph.startsWith('**') && paragraph.includes('**', 2);
                                        
                                        if (isBold) {
                                            const parts = paragraph.split('**');
                                            return (
                                                <p key={pIdx} className="text-[var(--color-muted)] text-sm md:text-base leading-relaxed">
                                                    <strong className="text-[var(--color-secondary)] font-medium">{parts[1]}</strong>
                                                    {parts[2]}
                                                </p>
                                            );
                                        }

                                        return (
                                            <p 
                                                key={pIdx} 
                                                className="text-[var(--color-muted)] text-sm md:text-base leading-relaxed"
                                            >
                                                {paragraph}
                                            </p>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
