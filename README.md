# D&D Character Sheet Tool

A modern, interactive digital character sheet for Dungeons & Dragons 5th Edition. Manage your characters, track stats, roll dice, and access spells all in one beautiful web application.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![D&D 5e](https://img.shields.io/badge/D%26D-5e-red)

## What is this?

The D&D Character Sheet Tool is a web-based application that replaces traditional paper character sheets with a dynamic, cloud-synced digital experience. Create, manage, and play your D&D characters with ease, whether you're at the table or playing online.

## Features

### 📊 Complete Character Management

**Character Information**
- Create and customize your character with all standard D&D 5e details
- Track player name, character name, race, class, subclass, background, and alignment
- Store character backstory, personality traits, ideals, bonds, and flaws
- Add physical descriptions (age, height, weight, eyes, skin, hair)
- Upload custom character portrait images

**Core Stats & Combat**
- Real-time ability score tracking (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)
- Automatic modifier calculations
- Armor Class (AC), Initiative, Proficiency Bonus tracking
- Movement speed monitoring
- Passive Perception calculation
- Inspiration status tracking

**Health & Survival**
- Current/Max/Temporary HP tracking with visual health bar
- Death saving throws counter (successes and failures)
- Hit dice management by character level
- Long rest recovery

### 🎲 Integrated Dice Roller

- Beautiful 3D dice rolling physics
- Roll ability checks, saving throws, and attack rolls with one click
- Automatic modifier application
- Visual dice animations

### ⚔️ Combat & Skills

**Proficiencies**
- Track saving throw proficiencies
- Manage skill proficiencies across all 18 D&D skills
- Expertise tracking for double proficiency bonus
- Automatic bonus calculations based on ability scores and proficiencies

**Inventory Management**
- Weapon tracking with attack bonus, damage, and damage type
- Equipment and item management with quantity, weight, and value
- Organized categories: weapons, armor, consumables, tools, treasure, misc
- Coin tracking (copper, silver, gold, platinum)
- Equipment notes section

### 📖 Spellcasting System

**Spell Management**
- Browse complete D&D 5e spell database (500+ spells)
- Search spells by name, description, or school
- Filter by class and spell level
- Separate "Spellbook" and "All Spells" views
- Learn and prepare spells
- Cast spells directly from your prepared list

**Spell Slots**
- Automatic spell slot calculation based on class and level
- Visual spell slot tracker with click-to-use interface
- Supports all caster types: full, half, and third casters
- Long rest to restore all slots
- Manual slot adjustment in edit mode

**Smart Class Integration**
- Automatic spell slot updates when leveling up
- Class change detection with options to reset or keep spells
- Support for Eldritch Knight and Arcane Trickster subclasses

### 📝 Additional Features

**Languages & Feats**
- Track known languages
- Add and manage character feats with detailed descriptions
- Multi-line feat descriptions

**Notes**
- Free-form notes section for character details
- Perfect for tracking quest information, NPC relationships, or house rules

### ☁️ Cloud Sync & Offline Support

- **Automatic cloud saving** via Appwrite backend
- **Offline mode** with localStorage fallback
- **Auto-save** after 2 seconds of inactivity
- Seamless sync between devices
- Character data persists across sessions

### 🎨 Modern Interface

- Clean, intuitive design
- Responsive layout works on desktop, tablet, and mobile
- Dark/light theme support
- Smooth animations and transitions
- Edit mode toggle for quick updates vs. safe viewing

## Getting Started

### 1. Create an Account

Visit the application and sign up with your email. Your characters will be securely stored and synced across all your devices.

### 2. Create Your First Character

1. Click **"New Character"** or navigate to the character page
2. Fill in your character's basic information (name, race, class, level)
3. Set your ability scores
4. Choose proficiencies and skills
5. Add equipment and spells

### 3. Play Your Character

- **View Mode** (default): Safe viewing with quick actions like rolling dice and casting spells
- **Edit Mode**: Make changes to your character stats, equipment, and details
- All changes are automatically saved to the cloud

## How to Use

### Managing Stats

**Ability Scores**
- Click on any ability score in edit mode to change it
- Modifiers are calculated automatically
- Use the dice icon to roll ability checks

**HP Tracking**
- Click the HP numbers to adjust current/max/temp HP
- Visual health bar shows your current status at a glance
- Temporary HP is tracked separately

**Proficiencies**
- Toggle proficiency checkboxes for saving throws and skills
- Mark expertise for skills where you have double proficiency
- Proficiency bonus updates automatically based on level

### Using Spells

1. **Navigate to Spells Section**: Scroll down to the spells area
2. **Browse All Spells**: Click "All Spells" tab to view the complete spell database
3. **Search & Filter**: Use the search bar and filters to find spells by name, class, or level
4. **Learn Spells**: Click the book icon on any spell to add it to your spellbook
5. **Prepare Spells**: In your spellbook, mark spells as prepared (checkmark icon)
6. **Cast Spells**: Click the lightning bolt icon on prepared spells to use spell slots
7. **Manage Slots**: Visual slots show available uses; click to spend/restore slots
8. **Long Rest**: Click "Long Rest" button to restore all spell slots

### Managing Inventory

**Adding Items**
1. Switch to edit mode
2. Click "Add Item" or "Add Weapon"
3. Fill in item details (name, quantity, weight, value, description)
4. For weapons, add attack bonus, damage, and damage type

**Managing Coins**
- Click on any coin value to adjust your wealth
- Supports copper (cp), silver (sp), gold (gp), and platinum (pp)

### Rolling Dice

Click the dice icon next to any:
- Ability score (for ability checks)
- Skill (for skill checks)
- Saving throw (for saves)
- Weapon (for attack rolls)

Beautiful 3D dice will roll with automatic modifier calculations!

## Character Advancement

### Leveling Up

1. Enter **Edit Mode**
2. Click on your **Level** to increase it
3. Update your **Max HP** based on your class hit die
4. Adjust **Hit Dice** total
5. Check if **Proficiency Bonus** increased (automatic based on level)
6. **Spell slots** update automatically for casters
7. Add any new **Feats** or **Class Features**

### Changing Classes

When you change your character's class:
- The app detects different caster types
- You'll be prompted to either:
  - **Reset spells**: Clear your spellbook and slots (recommended for multiclassing)
  - **Keep spells**: Maintain current spells (use for same caster type)

## Tips & Best Practices

**Save Your Progress**
- Characters auto-save after 2 seconds of inactivity
- Wait for the save indicator before closing the tab
- Works offline and syncs when reconnected

**Edit Mode Safety**
- Use View Mode during gameplay to prevent accidental changes
- Switch to Edit Mode only when updating your character
- Edit mode shows modified spell slots to prevent accidental overrides

**Spell Management**
- Cantrips don't use spell slots - cast freely!
- Prepare spells based on your class rules (clerics can change daily, wizards need their spellbook)
- Use filters to quickly find spells for your class

**Organization**
- Use the Notes section for session summaries and important details
- Track quest items separately in your inventory notes
- Add feat descriptions for quick reference during gameplay

**Backup**
- Your character is stored in the cloud via Appwrite
- Local backup is automatically maintained in your browser
- Export/download features coming soon!

## Frequently Asked Questions

**Q: Is my character data safe?**
A: Yes! Your character is stored securely in the cloud with Appwrite and backed up locally in your browser. Your data is private and only accessible to you.

**Q: Can I use this offline?**
A: Yes! The app works offline using your browser's local storage. Changes will sync to the cloud when you reconnect.

**Q: Does this support multiclassing?**
A: Partial support. You can enter multiclass information, but spell slot calculations assume single class. Manual slot adjustment is available in edit mode.

**Q: Can I share characters with my party?**
A: Team sharing is planned for a future update! Currently, characters are private to your account.

**Q: What spells are included?**
A: The complete D&D 5e spell list including all official sources (500+ spells). Search and filter to find exactly what you need.

**Q: Can I print my character sheet?**
A: Print functionality is planned for a future update.

**Q: Does this work on mobile?**
A: Yes! The interface is fully responsive and works on phones and tablets.

## Support & Feedback

Found a bug or have a feature request? Please reach out or submit an issue on the project repository.

## Version History

**v0.1.0** - Initial Release
- Complete D&D 5e character sheet
- Cloud sync with Appwrite
- Full spell database and management
- Integrated 3D dice roller
- Inventory and equipment tracking
- HP, ability scores, and proficiencies
- Automatic calculations and level progression

---

**Ready to start your adventure?** Create your character and roll for initiative! 🎲
