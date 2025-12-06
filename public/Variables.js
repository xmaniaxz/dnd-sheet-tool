let playerInfo = {
  PlayerName: "",
  CharacterName: "",
  Race: "",
  Class: "",
  SubClass: "",
  Background: "",
  Alignment: "",
  Experience: "",
  PlayerLevel: 1,
  Notes: "",
};
let playerStats = {
  Health: 0,
  MaxHealth: 0,
  Proficiency: 0,
  Strength: 10,
  Constitution: 10,
  Dexterity: 10,
  Intelligence: 10,
  Wisdom: 10,
  Charisma: 10,
  Proficiencies: {
    StrengthSavingthrow: false,
    StrengthAthletics: false,
    ConstitutionSavingthrow: false,
    DexteritySavingthrow: false,
    DexterityAcrobatics: false,
    DexteritySleightOfHand: false,
    DexterityStealth: false,
    IntelligenceSavingthrow: false,
    IntelligenceArcana: false,
    IntelligenceHistory: false,
    IntelligenceInvestigation: false,
    IntelligenceNature: false,
    IntelligenceReligion: false,
    WisdomSavingthrow: false,
    WisdomAnimalhandling: false,
    WisdomInsight: false,
    WisdomMedicince: false,
    WisdomPerception: false,
    WisdomSurvival: false,
    CharismaSavingthrow: false,
    CharismaDeception: false,  
    CharismaIntimidation: false,  
    CharismaPerformance: false,  
    CharismaPersuasion: false,  
  },
  PlayerFeats: [],
  Languages:"",
  ArmorClass:"",
  PassivePerception:""
};

let playerInventory = {
  Weapons: [],
  Coins: {
    Copper: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
  },
  Inventory: "",
};

let playerSpells = {
}

export let CharacterInfo = {
  SheetID: null,
  profilePicture: null,
  playerInfo,
  playerStats,
  playerSpells,
  playerInventory,
};
