import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { Language } from '@/lib/data-access';

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
    const lang = (['sk', 'en', 'cz'].includes(params.lang) ? params.lang : 'sk') as Language;
    const title = lang === 'sk' ? 'Zásady ochrany osobných údajov' : lang === 'cz' ? 'Zásady ochrany osobních údajů' : 'Privacy Policy';
    return {
        title: `${title} | Relax Properties`,
        description: title,
    };
}

const contentData = {
    sk: {
        title: "Zásady ochrany osobných údajov",
        intro: "V zmysle nariadenia EP a Rady EÚ 2016/679 General Data Protection Regulation (ďalej len „GDPR“) a zákona č. 18/2018 Z.z. o ochrane osobných údajov (ďalej len „Zákon“).",
        sections: [
            {
                heading: "Prevádzkovateľ",
                paragraphs: [
                    "Prevádzkovateľom je: RELAX PROPERTIES, s.r.o. , IČO: 53784961, DIČ: 2121506464, so sídlom: Na vyhliadke 5, 900 31 Stupava, zapísaná v obchodnom registri vedenom Okresným súdom Bratislava I., oddiel Sro, vložka: 152886/B.",
                    "Kontaktné údaje prevádzkovateľa sú: Relax Properties, s.r.o., adresa: Na vyhliadke 5, 900 31 Stupava, e-mail: info@relaxproperties.sk, telefónne číslo: +421 911 819 152.",
                    "Prevádzkovateľ nemenoval poverenca pre ochranu osobných údajov."
                ]
            },
            {
                heading: "Rozsah a účel spracovania osobných údajov dotknutej osoby prevádzkovateľom",
                paragraphs: [
                    "• uzatvorenie Kúpnej zmluvy, Nájomnej zmluvy, Zmluva o zastupovaní, Zmluva o rezervácii nehnuteľnosti, Zmluva o poskytnutí súčinnosti pri kúpe nehnuteľnosti (Sprostredkovateľská zmluva), Splnomocnenie, Dohody o zložení zálohy, vypracovanie Odovzdávacieho protokolu, Návrhu na vklad, Informácie, poučenia a súhlasu spotrebiteľa pri zmluvách uzatváraných na diaľku alebo zmluve uzavretej mimo prevádzkových priestorov, najmä príprava uzatvorenia príslušnej zmluvy alebo iného z uvedených dokumentov, evidencia zmluvy a súvisiacich dokumentov vrátane všetkých ich zmien v internom systéme prevádzkovateľa, plnenie predmetu zmluvy a kontrola jej plnenia zo strany dotknutej osoby, vybavovanie reklamácií a sťažností, vymáhanie pohľadávok vzniknutých v súvislosti s neplnením zmluvy – právnym základom na spracúvanie osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. b) nariadenia, t.j. plnenie príslušnej zmluvy.",
                    "• vypracovanie Záznamu o obhliadke – právnym základom pre spracúvanie Vašich osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. f) nariadenia, t. j. náš oprávnený záujem. Naším oprávneným záujmom v tomto prípade je riadny a nerušený výkon našej podnikateľskej činnosti, ktorú by sme nemohli vykonávať v prípade, ak by ste ohľadom predaja, resp. nájmu nehnuteľnosti komunikovali so záujemcom bez našej účasti napriek tomu, že záujemca Vám bol predstavený našou spoločnosťou.",
                    "• spracúvanie osobných údajov za účelom realizácie inzercie cez internetové realitné portály v realitných CRM softvéroch, t.j. ponuka nehnuteľností za účelom ich predaja, resp. prenájmu tretej osobe, pričom v príslušných realitných CRM softvéroch sú k jednotlivým nehnuteľnostiam z dôvodu jednoduchšej identifikácie pre prevádzkovateľa uvádzané aj osobné údaje dotknutej osoby ako vlastníka nehnuteľnosti, ktoré však nie sú viditeľné tretím osobám – právnym základom na spracúvanie osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. b) nariadenia, t.j. plnenie príslušnej zmluvy.",
                    "• vedenie účtovníctva a vyhotovovanie účtovných dokladov, najmä správa a fakturácia služieb poskytnutých na základe zmlúv, spracúvanie účtovných, daňových dokladov a faktúr – právnym základom na spracúvanie osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. c) nariadenia, t.j. plnenie povinností podľa osobitných predpisov, najmä zákona č. 431/2002 Z.z. o účtovníctve v znení neskorších predpisov, zákona č. 222/2004 Z.z. o dani z pridanej hodnoty v znení neskorších predpisov.",
                    "• evidencia pošty a správa registratúry, t.j. evidencia a správa poštových zásielok, pošty doručovanej a odosielanej z a do elektronickej schránky a evidencia a archivácia zmlúv, účtovných, daňových a súvisiacich dokladov v interných systémoch prevádzkovateľa – právnym základom na spracúvanie Vašich osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. c) nariadenia, t. j. splnenie našej zákonnej povinnosti podľa osobitných predpisov, a to najmä podľa zákona o účtovníctve a zákona č. 395/2002 Z. z. o archívoch a registratúrach a o zmene a doplnení niektorých zákonov.",
                    "• reklama a marketing služieb a produktov prevádzkovateľa, najmä zasielanie informačných newsletterov o našich ponukách, produktoch a službách a aktuálnej ponuke nehnuteľností a pod. – právnym základom na spracúvanie osobných údajov na tento účel je ustanovenie čl. 6 ods. 1 písm. a) nariadenia, t.j. súhlas dotknutej osoby. Ďalej zasielanie noviniek, informačných článkov z realitného prostredia.",
                    "Ďalej zbieranie dát a spracovanie údajov pre účely marketingu a marketingovej kampane z: Google Analytics, Google Search Console, YouTube, Facebook, Instagram a Facebook Pixels. Dáta budú využité len pre naše marketingové účely."
                ]
            },
            {
                heading: "Ako dlho uchovávame vaše údaje",
                paragraphs: [
                    "Vaše osobné údaje budeme uchovávať po dobu nevyhnutnú na splnenie vymedzených účelov spracovania osobných údajov, najviac však po dobu trvania 10 rokov od ich poskytnutia. Faktúry, ako aj ďalšie daňové a účtovné doklady uchovávame v súlade s príslušnými právnymi predpismi po dobu 10 rokov od roku, ktorého sa týkajú. Osobné údaje spracúvané na účely reklamy a marketingu uchovávame po dobu 10 rokov od ich poskytnutia. Po uplynutí tejto doby budú Vaše osobné údaje vymazané.",
                    "V prípade, že namietnete na spracovanie Vašich osobných údajov na priamy marketing našich služieb a produktov, prestaneme Vaše osobné údaje na tento účel ďalej uchovávať a spracovávať. V takomto prípade nám to prosím oznámte na e-mail: info@relaxproperties.sk"
                ]
            },
            {
                heading: "S kým zdieľame vaše údaje",
                paragraphs: [
                    "Všetky Vaše osobné údaje budú ukladané v našich interných systémoch a budú nami poskytované len potrebným spolupracujúcim subjektom (sprostredkovateľom), ktorými sú najmä záujemcovia o predaj/kúpu/nájom nehnuteľností, audítori, právni poradcovia, notári, znalci a odhadcovia hodnoty nehnuteľností, daňoví, účtovní a finanční sprostredkovatelia, realitní makléri, banky, poisťovne, osoby vykonávajúce reklamnú a marketingovú činnosť pre prevádzkovateľa, za účelom inzercie a tiež prevádzkovatelia internetových realitných portálov v realitných CRM softvéroch, a to v rozsahu, ktorý je nevyhnutne potrebný pre výkon ich práce alebo práv, a ktoré zároveň vo vzťahu k poskytnutým alebo sprístupneným informáciám budú mať v rozsahu a za podmienok dojednaných v písomnej zmluve, ktorú s nimi uzatvárame alebo ustanovenej všeobecne záväznými právnymi predpismi povinnosť zachovávať o takýchto informáciách mlčanlivosť."
                ]
            },
            {
                heading: "Aké práva máte nad svojimi údajmi",
                paragraphs: [
                    "Ako subjekt údajov máte podľa obecného nariadenia o ochrane osobných údajov (GDPR) právo požadovať prístup k svojím osobným údajom (za podmienok čl. 15 GDPR); právo na opravu nebo výmaz osobných údajov (za podmienok čl. 16 alebo čl. 17 GDPR); právo na obmedzenie spracovania osobných údajov (za podmienok čl. 18 GDPR); právo vzniesť námietku proti spracovaniu (za podmienok čl. 21 GDPR), hlavne proti spracovaniu osobných údajov na základe nášho oprávneného záujmu; právo na prenesiteľnosť údajov (za podmienok čl. 20 GDPR); právo kedykoľvek odvolať súhlas so spracovaním osobných údajov.",
                    "Ďalej máte právo podať sťažnosť na Úrade pre ochranu osobných údajov v prípade, že sa domnievate, že bolo porušené Vaše právo na ochranu osobných údajov."
                ]
            }
        ]
    },
    en: {
        title: "Privacy Policy",
        intro: "In accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council, the General Data Protection Regulation (hereinafter referred to as the \"GDPR\"), and Act No. 18/2018 Coll. on Personal Data Protection (hereinafter referred to as the \"Act\").",
        sections: [
            {
                heading: "Data Controller",
                paragraphs: [
                    "The Data Controller is: RELAX PROPERTIES, s.r.o. , ID No.: 53784961, Tax ID: 2121506464, with its registered office at: Na vyhliadke 5, 900 31 Stupava, registered in the Commercial Register kept by the District Court Bratislava I., Section Sro, File No.: 152886/B.",
                    "Contact details of the Data Controller are: Relax Properties, s.r.o., address: Na vyhliadke 5, 900 31 Stupava, e-mail: info@relaxproperties.sk, phone number: +421 911 819 152.",
                    "The Data Controller has not appointed a Data Protection Officer."
                ]
            },
            {
                heading: "Scope and Purpose of Processing Personal Data",
                paragraphs: [
                    "• Concluding a Purchase Agreement, Lease Agreement, Representation Agreement, Property Reservation Agreement, Agreement on Assistance in Purchasing Property (Intermediation Agreement), Power of Attorney, Deposit Agreements, drafting Handover Protocols, Proposals for Deposit, Information, instructions and consumer consent for distance contracts or contracts concluded outside of business premises, primarily for the preparation of concluding the relevant contract or other mentioned documents, maintaining records of the contract and related documents in the Controller’s internal system, fulfilling the object of the contract and controlling its fulfillment, handling complaints, recovery of receivables arising in connection with the non-fulfillment of the contract – the legal basis for processing personal data for this purpose is Article 6 (1) (b) of the Regulation (fulfillment of a contract).",
                    "• Drafting a Viewing Record – the legal basis for processing your personal data for this purpose is Article 6 (1) (f) of the Regulation, i.e., our legitimate interest. Our legitimate interest in this case is the proper and undisturbed performance of our business activities, which we could not carry out if you communicated with the interested party without our participation despite the fact that the interested party was introduced to you by our company.",
                    "• Processing personal data for the purpose of advertising through internet real estate portals in real estate CRM software, i.e., offering properties for sale or lease to a third party, while the respective real estate CRM software also includes the personal data of the data subject as the owner of the property for easier identification by the Controller, but which are not visible to third parties – the legal basis for processing personal data for this purpose is Article 6 (1) (b) of the Regulation (fulfillment of a contract).",
                    "• Bookkeeping and issuing accounting documents, mainly managing and invoicing services provided on the basis of contracts, processing accounting, tax documents and invoices – the legal basis for processing personal data for this purpose is Article 6 (1) (c) of the Regulation, i.e., fulfilling obligations according to special regulations, mainly Act No. 431/2002 Coll. on Accounting, Act No. 222/2004 Coll. on Value Added Tax.",
                    "• Mail registration and registry management, i.e., recording and managing postal items, mail delivered and sent from and to the electronic mailbox, and recording and archiving contracts, accounting, tax, and related documents in the internal systems of the Controller – the legal basis for processing your personal data for this purpose is Article 6 (1) (c) of the Regulation, i.e., fulfilling our legal obligation according to special regulations, primarily the Accounting Act and Act No. 395/2002 Coll. on Archives and Registries.",
                    "• Advertising and marketing the Controller's products and services, mainly sending informative newsletters about our offers, properties, etc. – the legal basis for processing personal data for this purpose is Article 6 (1) (a) of the Regulation, i.e., the consent of the data subject. Furthermore, sending news and informative articles from the real estate environment.",
                    "Additionally, collecting data and processing data for marketing purposes and marketing campaigns from: Google Analytics, Google Search Console, YouTube, Facebook, Instagram, and Facebook Pixels. Data will be used solely for our marketing purposes."
                ]
            },
            {
                heading: "How Long We Retain Your Data",
                paragraphs: [
                    "We will retain your personal data for the period necessary to fulfill the defined purposes of personal data processing, but no longer than 10 years from their provision. Invoices, as well as other tax and accounting documents, are kept in accordance with relevant legal regulations for a period of 10 years from the year to which they relate. Personal data processed for the purposes of advertising and marketing are maintained for a period of 10 years from their provision. After this period, your personal data will be deleted.",
                    "If you object to the processing of your personal data for direct marketing of our services and products, we will cease to further retain and process your personal data for this purpose. In such a case, please notify us by e-mail: info@relaxproperties.sk."
                ]
            },
            {
                heading: "Who We Share Your Data With",
                paragraphs: [
                    "All your personal data will be stored in our internal systems and will be provided by us only to necessary cooperating subjects (processors), such as parties interested in buying/selling/renting properties, auditors, legal advisors, notaries, experts and property appraisers, tax, accounting and financial intermediaries, real estate brokers, banks, insurance companies, persons carrying out advertising and marketing activities for the controller, for the purpose of advertising and also operators of internet real estate portals in real estate CRM software, to the extent absolutely necessary for the performance of their work or rights, and who will at the same time, in relation to the provided or made available information, have an obligation of confidentiality under the conditions agreed in a written contract or established by generally binding legal regulations."
                ]
            },
            {
                heading: "What Rights You Have Over Your Data",
                paragraphs: [
                    "As a data subject, under the General Data Protection Regulation (GDPR), you have the right to request access to your personal data (Article 15 GDPR); the right to rectification or erasure of personal data (Article 16 or Article 17 GDPR); the right to restriction of processing of personal data (Article 18 GDPR); the right to object to processing (Article 21 GDPR), mainly against processing of personal data based on our legitimate interest; the right to data portability (Article 20 GDPR); the right to withdraw consent to the processing of personal data at any time.",
                    "Furthermore, you have the right to file a complaint with the Office for Personal Data Protection if you believe that your right to personal data protection has been violated."
                ]
            }
        ]
    },
    cz: {
        title: "Zásady ochrany osobních údajů",
        intro: "Ve smyslu nařízení EP a Rady EU 2016/679 o ochraně fyzických osob v souvislosti se zpracováním osobních údajů (dále jen „GDPR“) a zákona č. 18/2018 Z.z. o ochraně osobních údajů (dále jen „Zákon“).",
        sections: [
            {
                heading: "Správce osobních údajů",
                paragraphs: [
                    "Správcem je: RELAX PROPERTIES, s.r.o. , IČO: 53784961, DIČ: 2121506464, se sídlem: Na vyhliadke 5, 900 31 Stupava, zapsaná v obchodním rejstříku vedeném Okresním soudem Bratislava I., oddíl Sro, vložka: 152886/B.",
                    "Kontaktní údaje správce jsou: Relax Properties, s.r.o., adresa: Na vyhliadke 5, 900 31 Stupava, e-mail: info@relaxproperties.cz, telefonní číslo: +420 739 049 593.",
                    "Správce nejmenoval pověřence pro ochranu osobních údajů."
                ]
            },
            {
                heading: "Rozsah a účel zpracování osobních údajů",
                paragraphs: [
                    "• uzavření Kupní smlouvy, Nájemní smlouvy, Smlouvy o zastupování, Rezervační smlouvy, Smlouvy o součinnosti při koupi nemovitosti (Zprostředkovatelské smlouvy), Plné moci, Dohody o složení zálohy, vypracování Předávacího protokolu, Návrhu na vklad, Informace, poučení a souhlasu spotřebitele při smlouvách uzavíraných na dálku nebo smlouvě uzavřené mimo provozní prostory, zejména příprava uzavření příslušné smlouvy nebo jiného z uvedených dokumentů, evidence smlouvy a souvisejících dokumentů včetně jejich změn ve vnitřním systému správce, plnění předmětu smlouvy a kontrola jejího plnění ze strany subjektu údajů, vyřizování reklamací a stížností, vymáhání pohledávek vzniklých v souvislosti s neplněním smlouvy – právním základem pro zpracování osobních údajů pro tento účel je čl. 6 odst. 1 písm. b) nařízení, tj. plnění příslušné smlouvy.",
                    "• vypracování Záznamu o prohlídce – právním základem pro zpracování vašich osobních údajů pro tento účel je čl. 6 odst. 1 písm. f) nařízení, tj. náš oprávněný zájem. Naším oprávněným zájmem v tomto případě je řádný a nerušený výkon naší podnikatelské činnosti, kterou bychom nemohli vykonávat, pokud byste ohledně prodeje či nájmu nemovitosti komunikovali se zájemcem bez naší účasti přesto, že zájemce vám byl představen naší společností.",
                    "• zpracování osobních údajů za účelem realizace inzerce přes internetové realitní portály v realitních CRM softwarech, tj. nabídka nemovitostí za účelem jejich prodeje nebo pronájmu třetí osobě, přičemž v příslušných realitních CRM softwarech jsou k jednotlivým nemovitostem z důvodu jednodušší identifikace pro správce uváděny i osobní údaje subjektu údajů jako vlastníka nemovitosti, které však nejsou viditelné třetím osobám – právním základem na zpracování osobních údajů pro tento účel je čl. 6 odst. 1 písm. b) nařízení, tj. plnění příslušné smlouvy.",
                    "• vedení účetnictví a vyhotovování účetních dokladů, zejména správa a fakturace služeb poskytnutých na základě smluv, zpracování účetních, daňových dokladů a faktur – právním základem na zpracování osobních údajů pro tento účel je čl. 6 odst. 1 písm. c) nařízení, tj. plnění povinností podle zvláštních předpisů, zejména zákona o účetnictví a zákona o dani z přidané hodnoty.",
                    "• evidence pošty a správa registratury, tj. evidence a správa poštovních zásilek, pošty doručované a odesílané z a do elektronické schránky a evidence a archivace smluv, účetních, daňových a souvisejících dokladů ve vnitřních systémech správce – právním základem na zpracování vašich osobních údajů pro tento účel je čl. 6 odst. 1 písm. c) nařízení, tj. splnění naší zákonné povinnosti podle zvláštních předpisů.",
                    "• reklama a marketing služeb a produktů správce, zejména zasílání informačních newsletterů o našich nabídkách, produktech a službách a aktuální nabídce nemovitostí apod. – právním základem na zpracování osobních údajů pro tento účel je čl. 6 odst. 1 písm. a) nařízení, tj. souhlas subjektu údajů. Dále zasílání novinek, informačních článků z realitního prostředí.",
                    "Dále sběr dat a zpracování údajů pro účely marketingu a marketingové kampaně z: Google Analytics, Google Search Console, YouTube, Facebook, Instagram a Facebook Pixels. Data budou využita pouze pro naše marketingové účely."
                ]
            },
            {
                heading: "Jak dlouho uchováváme vaše údaje",
                paragraphs: [
                    "Vaše osobní údaje budeme uchovávat po dobu nezbytnou ke splnění vymezených účelů zpracování osobních údajů, nejdéle však po dobu 10 let od jejich poskytnutí. Faktury a další daňové a účetní doklady uchováváme v souladu s příslušnými právními předpisy po dobu 10 let od roku, kterého se týkají. Osobní údaje zpracovávané pro účely reklamy a marketingu uchováváme po dobu 10 let od jejich poskytnutí. Po uplynutí této doby budou vaše osobní údaje vymazány.",
                    "V případě, že vznesete námitku proti zpracování vašich osobních údajů pro přímý marketing našich služeb a produktů, přestaneme vaše osobní údaje pro tento účel dále uchovávat a zpracovávat. V takovém případě nám to prosím oznamte na e-mail: info@relaxproperties.cz."
                ]
            },
            {
                heading: "S kým sdílíme vaše údaje",
                paragraphs: [
                    "Všechny vaše osobní údaje budou uloženy v našich interních systémech a budou námi poskytovány pouze potřebným spolupracujícím subjektům (zpracovatelům), kterými jsou zejména zájemci o prodej/koupi/nájem nemovitostí, auditoři, právní poradci, notáři, znalci a odhadci hodnoty nemovitostí, daňoví, účetní a finanční zprostředkovatelé, realitní makléři, banky, pojišťovny, osoby vykonávající reklamní a marketingovou činnost pro správce, za účelem inzerce a také provozovatelé internetových realitních portálů v realitních CRM softwarech, a to v rozsahu, který je nezbytně nutný pro výkon jejich práce nebo práv, a kteří zároveň budou mít ve vztahu k poskytnutým nebo zpřístupněným informacím povinnost zachovávat o takových informacích mlčenlivost, jak je dojednáno v písemné smlouvě nebo stanoveno obecně závaznými právními předpisy."
                ]
            },
            {
                heading: "Jaká práva máte ohledně svých údajů",
                paragraphs: [
                    "Jako subjekt údajů máte podle obecného nařízení o ochraně osobních údajů (GDPR) právo požadovat přístup k svým osobním údajům (za podmínek čl. 15 GDPR); právo na opravu nebo výmaz osobních údajů (za podmínek čl. 16 nebo čl. 17 GDPR); právo na omezení zpracování (za podmínek čl. 18 GDPR); právo vznést námitku proti zpracování (za podmínek čl. 21 GDPR), hlavně proti zpracování osobních údajů na základě našeho oprávněného zájmu; právo na přenositelnost údajů (za podmínek čl. 20 GDPR); právo kdykoliv odvolat souhlas se zpracováním osobních údajů.",
                    "Dále máte právo podat stížnost u Úřadu pro ochranu osobních údajů v případě, že se domníváte, že bylo porušeno vaše právo na ochranu osobních údajů."
                ]
            }
        ]
    }
};

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
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
                                    {section.paragraphs.map((paragraph, pIdx) => (
                                        <p 
                                            key={pIdx} 
                                            className="text-[var(--color-muted)] text-sm md:text-base leading-relaxed"
                                        >
                                            {paragraph.startsWith('•') 
                                                ? <span className="block pl-4 -indent-4">{paragraph}</span> 
                                                : paragraph}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
