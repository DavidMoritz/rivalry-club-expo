import { ImageSourcePropType } from 'react-native';

// Import all fighter images
const banjo_kazooie = require('./fighters/banjo_kazooie.png');
const bayonetta = require('./fighters/bayonetta.png');
const bowser = require('./fighters/bowser.png');
const bowser_jr = require('./fighters/bowser_jr.png');
const byleth = require('./fighters/byleth.png');
const captain_falcon = require('./fighters/captain_falcon.png');
const chrom = require('./fighters/chrom.png');
const cloud = require('./fighters/cloud.png');
const corrin = require('./fighters/corrin.png');
const daisy = require('./fighters/daisy.png');
const dark_pit = require('./fighters/dark_pit.png');
const dark_samus = require('./fighters/dark_samus.png');
const diddy_kong = require('./fighters/diddy_kong.png');
const donkey_kong = require('./fighters/donkey_kong.png');
const dr_mario = require('./fighters/dr_mario.png');
const duck_hunt = require('./fighters/duck_hunt.png');
const falco = require('./fighters/falco.png');
const fox = require('./fighters/fox.png');
const ganondorf = require('./fighters/ganondorf.png');
const greninja = require('./fighters/greninja.png');
const hero = require('./fighters/hero.png');
const ice_climbers = require('./fighters/ice_climbers.png');
const ike = require('./fighters/ike.png');
const incineroar = require('./fighters/incineroar.png');
const inkling = require('./fighters/inkling.png');
const isabelle = require('./fighters/isabelle.png');
const jigglypuff = require('./fighters/jigglypuff.png');
const joker = require('./fighters/joker.png');
const kazuya = require('./fighters/kazuya.png');
const ken = require('./fighters/ken.png');
const king_dedede = require('./fighters/king_dedede.png');
const king_k_rool = require('./fighters/king_k_rool.png');
const kirby = require('./fighters/kirby.png');
const link = require('./fighters/link.png');
const little_mac = require('./fighters/little_mac.png');
const lucario = require('./fighters/lucario.png');
const lucas = require('./fighters/lucas.png');
const lucina = require('./fighters/lucina.png');
const luigi = require('./fighters/luigi.png');
const mario = require('./fighters/mario.png');
const marth = require('./fighters/marth.png');
const mega_man = require('./fighters/mega_man.png');
const meta_knight = require('./fighters/meta_knight.png');
const mewtwo = require('./fighters/mewtwo.png');
const mii_brawler = require('./fighters/mii_brawler.png');
const mii_gunner = require('./fighters/mii_gunner.png');
const mii_swordfighter = require('./fighters/mii_swordfighter.png');
const min_min = require('./fighters/min_min.png');
const mr_game_watch = require('./fighters/mr_game_watch.png');
const ness = require('./fighters/ness.png');
const olimar = require('./fighters/olimar.png');
const pac_man = require('./fighters/pac_man.png');
const palutena = require('./fighters/palutena.png');
const peach = require('./fighters/peach.png');
const pichu = require('./fighters/pichu.png');
const pikachu = require('./fighters/pikachu.png');
const piranha_plant = require('./fighters/piranha_plant.png');
const pit = require('./fighters/pit.png');
const pokemon_trainer = require('./fighters/pokemon_trainer.png');
const pyra_mythra = require('./fighters/pyra_mythra.png');
const r_o_b = require('./fighters/r_o_b.png');
const richter = require('./fighters/richter.png');
const ridley = require('./fighters/ridley.png');
const robin = require('./fighters/robin.png');
const rosalina_luma = require('./fighters/rosalina_luma.png');
const roy = require('./fighters/roy.png');
const ryu = require('./fighters/ryu.png');
const samus = require('./fighters/samus.png');
const sephiroth = require('./fighters/sephiroth.png');
const sheik = require('./fighters/sheik.png');
const shulk = require('./fighters/shulk.png');
const simon = require('./fighters/simon.png');
const snake = require('./fighters/snake.png');
const sonic = require('./fighters/sonic.png');
const sora = require('./fighters/sora.png');
const steve = require('./fighters/steve.png');
const terry = require('./fighters/terry.png');
const toon_link = require('./fighters/toon_link.png');
const villager = require('./fighters/villager.png');
const wario = require('./fighters/wario.png');
const wii_fit_trainer = require('./fighters/wii_fit_trainer.png');
const wolf = require('./fighters/wolf.png');
const yoshi = require('./fighters/yoshi.png');
const young_link = require('./fighters/young_link.png');
const zelda = require('./fighters/zelda.png');
const zero_suit_samus = require('./fighters/zero_suit_samus.png');

const logo = require('./logo.png');

interface DynamicImages {
  [key: string]: ImageSourcePropType;
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
