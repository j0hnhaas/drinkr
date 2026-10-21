export interface Preset { id:string; label:string; volumeCl:number; abvPercent:number; emoji:string; }
export const PRESETS:Preset[] = [
  {id:"kruegerl",label:"Krügerl Bier",volumeCl:50,abvPercent:5,emoji:"🍺"},
  {id:"seidl",label:"Seidl Bier",volumeCl:30,abvPercent:5,emoji:"🍺"},
  {id:"weisswein",label:"Achterl Weißwein",volumeCl:12.5,abvPercent:12.5,emoji:"🍷"},
  {id:"spritzer",label:"Weißer Spritzer",volumeCl:25,abvPercent:6.25,emoji:"🥂"},
  {id:"rotwein",label:"Achterl Rotwein",volumeCl:12.5,abvPercent:13,emoji:"🍷"},
  {id:"radler",label:"Krügerl Radler",volumeCl:50,abvPercent:2,emoji:"🍋"},
  {id:"schnaps",label:"Schnaps (4 cl)",volumeCl:4,abvPercent:40,emoji:"🥃"},
  {id:"whisky",label:"Whisky (4 cl)",volumeCl:4,abvPercent:40,emoji:"🥃"},
  {id:"gin",label:"Gin (4 cl)",volumeCl:4,abvPercent:40,emoji:"🥃"},
  {id:"wodka",label:"Wodka (4 cl)",volumeCl:4,abvPercent:40,emoji:"🥃"},
  {id:"sekt",label:"Sekt (0,1 l)",volumeCl:10,abvPercent:11,emoji:"🥂"},
  {id:"aperol",label:"Aperol Spritz (Richtwert)",volumeCl:25,abvPercent:9,emoji:"🍹"},
  {id:"hugo",label:"Hugo (Richtwert)",volumeCl:25,abvPercent:6,emoji:"🍸"},
  {id:"longdrink",label:"Longdrink (Richtwert)",volumeCl:25,abvPercent:10,emoji:"🍹"},
  {id:"weizen",label:"Weizenbier (0,5 l)",volumeCl:50,abvPercent:5.2,emoji:"🍺"},
  {id:"alkoholfrei",label:"Alkoholfrei (0,5 l)",volumeCl:50,abvPercent:0,emoji:"🥤"}
];
export const QUICK_IDS=["kruegerl","seidl","weisswein","spritzer","rotwein","radler"];
export const CATEGORIES:Record<string,string[]>={
  "Spirituosen":["schnaps","whisky","gin","wodka"],
  "Aperitifs & Cocktails":["aperol","hugo","longdrink"],
  "Sekt & anderes":["sekt","weizen","alkoholfrei"]
};