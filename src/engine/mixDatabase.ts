/**
 * A database (Map) of known MIX files and their contents (list of filenames).
 * This is used by the Engine to determine which resources might be in specific MIX archives,
 * for example, when unloading side-specific data.
 */
export const mixDatabase = new Map<string, string[]>()
.set("cameo.mix", [
  "adogicon.shp", "adoguico.shp", "aengicon.shp", "aenguico.shp", "agapgen.shp",
  "agisicon.shp", "ahrvicon.shp", "ahrvuico.shp", "aparicon.shp", "apchicon.shp",
  "apcicon.shp", "artyicon.shp", "asaticon.shp", "ayaricon.shp", "batricon.shp",
  "beagicon.shp", "bggyicon.shp", "bolticon.shp", "brrkicon.shp", "carricon.shp",
  "ccomicon.shp", "ccomuico.shp", "chemicon.shp", "chroicon.shp", "clckicon.shp",
  "clegicon.shp", "cleguico.shp", "clonicon.shp", "cnsticon.shp", "crryicon.shp",
  "csphicon.shp", "darken.shp", "desoicon.shp", "desouico.shp", "desticon.shp",
  "detnicon.shp", "dlphicon.shp", "dlphuico.shp", "dogicon.shp", "doguico.shp",
  "dredicon.shp", "dronicon.shp", "e1icon.shp", "e1uico.shp", "e2icon.shp",
  "e2uico.shp", "e4icon.shp", "empicon.shp", "engnicon.shp", "facticon.shp",
  "falcicon.shp", "fixicon.shp", "flakicon.shp", "flkticon.shp", "flktuico.shp",
  "forticon.shp", "fsdicon.shp", "fspicon.shp", "fstdicon.shp", "fvicon.shp",
  "fvuico.shp", "gapicon.shp", "gat2icon.shp", "gateicon.shp", "gbayicon.shp",
  "gcanicon.shp", "giicon.shp", "giuico.shp", "gorep.shp", "gtnkicon.shp",
  "gtnkuico.shp", "gwepicon.shp", "handicon.shp", "harvicon.shp", "harvuico.shp",
  "heliicon.shp", "hindicon.shp", "hmecicon.shp", "hovricon.shp", "htkicon.shp",
  "htkuico.shp", "htnkicon.shp", "htnkuico.shp", "ioncicon.shp", "ircricon.shp",
  "ironicon.shp", "ivanicon.shp", "ivanuico.shp", "ivncicon.shp", "ivncuico.shp",
  "jjeticon.shp", "jjetuico.shp", "landicon.shp", "lasricon.shp", "liteicon.shp",
  "lpsticon.shp", "mcvicon.shp", "mcvuico.shp", "metricon.shp", "mltiicon.shp",
  "mmchicon.shp", "msslicon.shp", "mtnkicon.shp", "mtnkuico.shp", "mutcicon.shp",
  "nga2icon.shp", "ngaticon.shp", "nhpdicon.shp", "npsiicon.shp", "npwricon.shp",
  "nradicon.shp", "nrcticon.shp", "nreficon.shp", "ntchicon.shp", "nukeicon.shp",
  "nwalicon.shp", "nwepicon.shp", "obliicon.shp", "obmbicon.shp", "orcaicon.shp",
  "otrnicon.shp", "paraicon.shp", "pillicon.shp", "plticon.shp", "plugicon.shp",
  "podsicon.shp", "powricon.shp", "prisicon.shp", "proicon.shp", "psicicon.shp",
  "psicuico.shp", "psisicon.shp", "psiticon.shp", "psituico.shp", "rad1icon.shp",
  "rad2icon.shp", "rad3icon.shp", "radricon.shp", "rboticon.shp", "reficon.shp",
  "rfixicon.shp", "rtnkicon.shp", "rtnkuico.shp", "samicon.shp", "sapcicon.shp",
  "sapicon.shp", "sbagicon.shp", "sealicon.shp", "sealuico.shp", "seekicon.shp",
  "shadicon.shp", "shaduico.shp", "shkicon.shp", "shkuico.shp", "smchicon.shp",
  "smcvicon.shp", "smcvuico.shp", "snipicon.shp", "snipuico.shp", "soniicon.shp",
  "spoticon.shp", "spyicon.shp", "spyuico.shp", "sqdicon.shp", "sreficon.shp",
  "srefuico.shp", "stnkicon.shp", "subicon.shp", "subticon.shp", "tanyicon.shp",
  "tanyuico.shp", "techicon.shp", "tempicon.shp", "teslaicon.shp", "tickicon.shp",
  "tnkdicon.shp", "tnkduico.shp", "towricon.shp", "trkaicon.shp", "trsticon.shp",
  "trstuico.shp", "tslaicon.shp", "ttnkicon.shp", "ttnkuico.shp", "turbicon.shp",
  "twr1icon.shp", "twr2icon.shp", "twr3icon.shp", "v3icon.shp", "v3uico.shp",
  "wallicon.shp", "weapicon.shp", "weaticon.shp", "weedicon.shp", "wethicon.shp",
  "xxicon.shp", "yardicon.shp", "yuriicon.shp", "yuriuico.shp", "yurpicon.shp",
  "yurpuico.shp", "zepicon.shp", "zepuico.shp",
])
.set("theme.mix", [
  "200meter.wav", "blowitup.wav", "burn.wav", "destroy.wav", "eaglehun.wav",
  "fortific.wav", "grinder.wav", "hm2.wav", "indeep.wav", "industro.wav",
  "jank.wav", "motorize.wav", "power.wav", "ra2-opt.wav", "ra2-sco.wav",
  "tension.wav",
]);

const sideBarFiles = [
"addon.shp", "bkgdlg.shp", "bkgdmd.shp", "bkgdsm.shp", "bttnbkgd.shp",
"button00.shp", "button01.shp", "button02.shp", "button03.shp", "button04.shp",
"button05.shp", "button06.shp", "button07.shp", "button08.shp", "button09.shp",
"button10.shp", "button11.shp", "credits.shp", "diplobtn.shp", "gclock2.shp",
"key.ini", "lendcap.shp", "lspacer.shp", "optbtn.shp", "pbeacon.shp",
"power.shp", "powerp.shp", "pwrlvl.shp", "radar.shp", "radar01.shp",
"radar02.shp", "r-dn.shp", "rdrbeacn.shp", "rendcap.shp", "repair.shp",
"r-up.shp", "sell.shp", "side1.shp", "side2.shp", "side2b.shp",
"side3.shp", "sidebar.pal", "sidebttn.shp", "tab00.shp", "tab01.shp",
"tab02.shp", "tab03.shp", "tabs.shp", "top.shp", "uibkgd.pal",
"wayp.shp",
];
mixDatabase.set("sidec01.mix", sideBarFiles);
mixDatabase.set("sidec02.mix", sideBarFiles);

const sideBarCdFiles = ["reportbug.shp"];
mixDatabase.set("sidec01cd.mix", sideBarCdFiles);
mixDatabase.set("sidec02cd.mix", sideBarCdFiles);
