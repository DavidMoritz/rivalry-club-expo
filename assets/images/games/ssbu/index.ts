import { ImageSourcePropType } from 'react-native';
import { characterImageMap } from './character_image_map';

// Import all fighter images
const banjo_kazooie = require('./professor_fandango/banjo_kazooie.jpg');
const bayonetta = require('./professor_fandango/bayonetta.jpg');
const bowser = require('./professor_fandango/bowser.jpg');
const bowser_jr = require('./professor_fandango/bowser_jr.jpg');
const byleth = require('./professor_fandango/byleth.jpg');
const captain_falcon = require('./professor_fandango/captain_falcon.jpg');
const chrom = require('./professor_fandango/chrom.jpg');
const cloud = require('./professor_fandango/cloud.jpg');
const corrin = require('./professor_fandango/corrin.jpg');
const daisy = require('./professor_fandango/daisy.jpg');
const dark_pit = require('./professor_fandango/dark_pit.jpg');
const dark_samus = require('./professor_fandango/dark_samus.jpg');
const diddy_kong = require('./professor_fandango/diddy_kong.jpg');
const donkey_kong = require('./professor_fandango/donkey_kong.jpg');
const dr_mario = require('./professor_fandango/dr_mario.jpg');
const duck_hunt = require('./professor_fandango/duck_hunt.jpg');
const falco = require('./professor_fandango/falco.jpg');
const fox = require('./professor_fandango/fox.jpg');
const ganondorf = require('./professor_fandango/ganondorf.jpg');
const greninja = require('./professor_fandango/greninja.jpg');
const hero = require('./professor_fandango/hero.jpg');
const ice_climbers = require('./professor_fandango/ice_climbers.jpg');
const ike = require('./professor_fandango/ike.jpg');
const incineroar = require('./professor_fandango/incineroar.jpg');
const inkling = require('./professor_fandango/inkling.jpg');
const isabelle = require('./professor_fandango/isabelle.jpg');
const jigglypuff = require('./professor_fandango/jigglypuff.jpg');
const joker = require('./professor_fandango/joker.jpg');
const kazuya = require('./professor_fandango/kazuya.jpg');
const ken = require('./professor_fandango/ken.jpg');
const king_dedede = require('./professor_fandango/king_dedede.jpg');
const king_k_rool = require('./professor_fandango/king_k_rool.jpg');
const kirby = require('./professor_fandango/kirby.jpg');
const link = require('./professor_fandango/link.jpg');
const little_mac = require('./professor_fandango/little_mac.jpg');
const lucario = require('./professor_fandango/lucario.jpg');
const lucas = require('./professor_fandango/lucas.jpg');
const lucina = require('./professor_fandango/lucina.jpg');
const luigi = require('./professor_fandango/luigi.jpg');
const mario = require('./professor_fandango/mario.jpg');
const marth = require('./professor_fandango/marth.jpg');
const mega_man = require('./professor_fandango/mega_man.jpg');
const meta_knight = require('./professor_fandango/meta_knight.jpg');
const mewtwo = require('./professor_fandango/mewtwo.jpg');
const mii_brawler = require('./professor_fandango/mii_brawler.jpg');
const mii_gunner = require('./professor_fandango/mii_gunner.jpg');
const mii_swordfighter = require('./professor_fandango/mii_swordfighter.jpg');
const min_min = require('./professor_fandango/min_min.jpg');
const mr_game_watch = require('./professor_fandango/mr_game_watch.jpg');
const ness = require('./professor_fandango/ness.jpg');
const olimar = require('./professor_fandango/olimar.jpg');
const pac_man = require('./professor_fandango/pac_man.jpg');
const palutena = require('./professor_fandango/palutena.jpg');
const peach = require('./professor_fandango/peach.jpg');
const pichu = require('./professor_fandango/pichu.jpg');
const pikachu = require('./professor_fandango/pikachu.jpg');
const piranha_plant = require('./professor_fandango/piranha_plant.jpg');
const pit = require('./professor_fandango/pit.jpg');
const pokemon_trainer = require('./professor_fandango/pokemon_trainer.jpg');
const pyra_mythra = require('./professor_fandango/pyra_mythra.jpg');
const r_o_b = require('./professor_fandango/r_o_b.jpg');
const richter = require('./professor_fandango/richter.jpg');
const ridley = require('./professor_fandango/ridley.jpg');
const robin = require('./professor_fandango/robin.jpg');
const rosalina_luma = require('./professor_fandango/rosalina_luma.jpg');
const roy = require('./professor_fandango/roy.jpg');
const ryu = require('./professor_fandango/ryu.jpg');
const samus = require('./professor_fandango/samus.jpg');
const sephiroth = require('./professor_fandango/sephiroth.jpg');
const sheik = require('./professor_fandango/sheik.jpg');
const shulk = require('./professor_fandango/shulk.jpg');
const simon = require('./professor_fandango/simon.jpg');
const snake = require('./professor_fandango/snake.jpg');
const sonic = require('./professor_fandango/sonic.jpg');
const sora = require('./professor_fandango/sora.jpg');
const steve = require('./professor_fandango/steve.jpg');
const terry = require('./professor_fandango/terry.jpg');
const toon_link = require('./professor_fandango/toon_link.jpg');
const villager = require('./professor_fandango/villager.jpg');
const wario = require('./professor_fandango/wario.jpg');
const wii_fit_trainer = require('./professor_fandango/wii_fit_trainer.jpg');
const wolf = require('./professor_fandango/wolf.jpg');
const yoshi = require('./professor_fandango/yoshi.jpg');
const young_link = require('./professor_fandango/young_link.jpg');
const zelda = require('./professor_fandango/zelda.jpg');
const zero_suit_samus = require('./professor_fandango/zero_suit_samus.jpg');

const logo = require('./logo.png');

interface DynamicImages {
  [key: string]: ImageSourcePropType;
}

export interface CharacterZoomData {
  faceCenter: { x: number; y: number };
  scale: number;
  numCharacters: number;
}

export interface CharacterImageMap {
  [key: string]: CharacterZoomData;
}

export const logoImage: ImageSourcePropType = logo;

export const fighterImages: DynamicImages = {
  banjo_kazooie,
  bayonetta,
  bowser,
  bowser_jr,
  byleth,
  captain_falcon,
  chrom,
  cloud,
  corrin,
  daisy,
  dark_pit,
  dark_samus,
  diddy_kong,
  donkey_kong,
  dr_mario,
  duck_hunt,
  falco,
  fox,
  ganondorf,
  greninja,
  hero,
  ice_climbers,
  ike,
  incineroar,
  inkling,
  isabelle,
  jigglypuff,
  joker,
  kazuya,
  ken,
  king_dedede,
  king_k_rool,
  kirby,
  link,
  little_mac,
  lucario,
  lucas,
  lucina,
  luigi,
  mario,
  marth,
  mega_man,
  meta_knight,
  mewtwo,
  mii_brawler,
  mii_gunner,
  mii_swordfighter,
  min_min,
  mr_game_watch,
  ness,
  olimar,
  pac_man,
  palutena,
  peach,
  pichu,
  pikachu,
  piranha_plant,
  pit,
  pokemon_trainer,
  pyra_mythra,
  r_o_b,
  richter,
  ridley,
  robin,
  rosalina_luma,
  roy,
  ryu,
  samus,
  sephiroth,
  sheik,
  shulk,
  simon,
  snake,
  sonic,
  sora,
  steve,
  terry,
  toon_link,
  villager,
  wario,
  wii_fit_trainer,
  wolf,
  yoshi,
  young_link,
  zelda,
  zero_suit_samus
};

// Export the character zoom data for face close-ups
export const characterZoomMap: CharacterImageMap = characterImageMap as CharacterImageMap;
