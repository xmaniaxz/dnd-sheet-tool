"use client";
import { useState } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import { motion } from "framer-motion";
import type { Weapon, Item } from "@/context/CharacterSaveFileContext";

export default function InventoryPanel() {
  const { data, setData, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const removeWeapon = (idx: number) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.inventory.weapons.splice(idx, 1);
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.inventory.items.splice(idx, 1);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold">Inventory</h2>

      <div className="rounded-2xl panel border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Weapons</h3>
          {editMode && (
            <button
              onClick={() => setShowWeaponModal(true)}
              className="text-xs rounded-md border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 px-2 py-1 hover:bg-emerald-500/20"
            >
              + Add Weapon
            </button>
          )}
        </div>
        
        {data.inventory.weapons.length === 0 ? (
          <p className="text-sm opacity-60">No weapons</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.weapons.map((w, i) => (
              <WeaponCard key={i} weapon={w} index={i} onRemove={removeWeapon} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl panel border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Items</h3>
          {editMode && (
            <button
              onClick={() => setShowItemModal(true)}
              className="text-xs rounded-md border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 px-2 py-1 hover:bg-emerald-500/20"
            >
              + Add Item
            </button>
          )}
        </div>
        
        {(data.inventory.items?.length ?? 0) === 0 ? (
          <p className="text-sm opacity-60">No items</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.items?.map((item, i) => (
              <ItemCard key={i} item={item} index={i} onRemove={removeItem} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl panel-subtle border p-3">
        <h3 className="text-sm font-medium mb-1">Inventory Notes</h3>
        {editMode ? (
          <textarea
            value={data.inventory.inventoryText}
            onChange={(e) =>
              setByPath("inventory.inventoryText", e.target.value)
            }
            rows={4}
            placeholder="Backpack contents, tools, potions, etc."
        className="w-full rounded-md  border border-zinc-700 px-3 py-2 text-sm  focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        ) : (
          <p className="text-sm  whitespace-pre-wrap">
            {data.inventory.inventoryText}
          </p>
        )}
      </div>

      {showWeaponModal && (
        <WeaponModal onClose={() => setShowWeaponModal(false)} />
      )}
      {showItemModal && (
        <ItemModal onClose={() => setShowItemModal(false)} />
      )}
    </div>
  );
}

function WeaponCard({ weapon, index, onRemove }: { weapon: Weapon; index: number; onRemove: (idx: number) => void }) {
  const { editMode } = useEditMode();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-xl border border-zinc-700/90 p-3 space-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{weapon.name}</h4>
            {weapon.equipped && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Equipped
              </span>
            )}
          </div>
          <div className="text-sm space-y-0.5 mt-1">
            <div className="flex gap-4 flex-wrap">
              <span>Damage: <span className="font-mono">{weapon.damage}</span></span>
              {weapon.damageType && <span>Type: {weapon.damageType}</span>}
              {weapon.attackBonus !== undefined && <span>Attack: +{weapon.attackBonus}</span>}
            </div>
            {weapon.properties && weapon.properties.length > 0 && (
              <div className="text-xs opacity-70">Properties: {weapon.properties.join(", ")}</div>
            )}
            {weapon.range && (
              <div className="text-xs opacity-70">Range: {weapon.range.normal}/{weapon.range.long || weapon.range.normal}</div>
            )}
          </div>
        </div>
        {editMode && (
          <button
            onClick={() => onRemove(index)}
            className="text-xs rounded-md border border-zinc-600 px-2 py-0.5 hover:border-red-500 hover:text-red-400 cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ItemCard({ item, index, onRemove }: { item: Item; index: number; onRemove: (idx: number) => void }) {
  const { editMode } = useEditMode();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between text-sm rounded-lg border border-zinc-700/90 p-2"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {item.quantity > 1 && <span className="text-xs opacity-60">×{item.quantity}</span>}
          {item.equipped && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Equipped
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs opacity-70 mt-0.5">{item.description}</p>
        )}
      </div>
      {editMode && (
        <button
          onClick={() => onRemove(index)}
          className="text-xs rounded-md border border-zinc-600 px-2 py-0.5 hover:border-red-500 hover:text-red-400 cursor-pointer ml-2"
        >
          Remove
        </button>
      )}
    </motion.div>
  );
}

function WeaponModal({ onClose }: { onClose: () => void }) {
  const { setData } = useCharacter();
  const [formData, setFormData] = useState({
    name: "",
    numDice: 1,
    diceType: 8,
    damageType: "slashing" as Weapon['damageType'],
    attackBonus: 0,
    magicalBonus: 0,
    properties: "",
    rangeNormal: 5,
    rangeLong: 5,
    equipped: false,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    const weapon: Weapon = {
      id: crypto.randomUUID(),
      name: formData.name,
      quantity: 1,
      category: 'weapon',
      damage: `${formData.numDice}d${formData.diceType}`,
      damageType: formData.damageType,
      attackBonus: formData.attackBonus + formData.magicalBonus,
      properties: formData.properties ? formData.properties.split(',').map(p => p.trim()) : undefined,
      range: formData.rangeNormal > 0 ? { normal: formData.rangeNormal, long: formData.rangeLong } : undefined,
      equipped: formData.equipped,
    };

    setData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        weapons: [...prev.inventory.weapons, weapon],
      },
    }));
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onMouseDown={handleBackdropClick}
    >
      <div className="card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Weapon</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs opacity-60 mb-1 block">Weapon Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              placeholder="Longsword"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-60 mb-1 block">Number of Dice</label>
              <select
                value={formData.numDice}
                onChange={(e) => setFormData({ ...formData, numDice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs opacity-60 mb-1 block">Die Type</label>
              <select
                value={formData.diceType}
                onChange={(e) => setFormData({ ...formData, diceType: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              >
                {[4, 6, 8, 10, 12, 20, 100].map(d => (
                  <option key={d} value={d}>d{d}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs opacity-60 mb-1 block">Damage Type</label>
            <select
              value={formData.damageType}
              onChange={(e) => setFormData({ ...formData, damageType: e.target.value as Weapon['damageType'] })}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
            >
              <option value="slashing">Slashing</option>
              <option value="piercing">Piercing</option>
              <option value="bludgeoning">Bludgeoning</option>
              <option value="fire">Fire</option>
              <option value="cold">Cold</option>
              <option value="lightning">Lightning</option>
              <option value="acid">Acid</option>
              <option value="poison">Poison</option>
              <option value="necrotic">Necrotic</option>
              <option value="radiant">Radiant</option>
              <option value="psychic">Psychic</option>
              <option value="thunder">Thunder</option>
              <option value="force">Force</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-60 mb-1 block">Attack Bonus</label>
              <input
                type="number"
                value={formData.attackBonus}
                onChange={(e) => setFormData({ ...formData, attackBonus: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs opacity-60 mb-1 block">Magical Bonus (+1 to +3)</label>
              <select
                value={formData.magicalBonus}
                onChange={(e) => setFormData({ ...formData, magicalBonus: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              >
                <option value={0}>None</option>
                <option value={1}>+1</option>
                <option value={2}>+2</option>
                <option value={3}>+3</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs opacity-60 mb-1 block">Properties (comma-separated)</label>
            <input
              type="text"
              value={formData.properties}
              onChange={(e) => setFormData({ ...formData, properties: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              placeholder="finesse, versatile, light"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-60 mb-1 block">Range (normal)</label>
              <input
                type="number"
                value={formData.rangeNormal}
                onChange={(e) => setFormData({ ...formData, rangeNormal: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              />
            </div>
            <div>
              <label className="text-xs opacity-60 mb-1 block">Range (long)</label>
              <input
                type="number"
                value={formData.rangeLong}
                onChange={(e) => setFormData({ ...formData, rangeLong: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.equipped}
              onChange={(e) => setFormData({ ...formData, equipped: e.target.checked })}
              className="h-4 w-4"
            />
            Equipped
          </label>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="btn-primary flex-1">Add</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ onClose }: { onClose: () => void }) {
  const { setData } = useCharacter();
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    description: "",
    category: 'misc' as Item['category'],
    equipped: false,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    const item: Item = {
      id: crypto.randomUUID(),
      name: formData.name,
      quantity: formData.quantity,
      description: formData.description || undefined,
      category: formData.category,
      equipped: formData.equipped,
    };

    setData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        items: [...(prev.inventory.items || []), item],
      },
    }));
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onMouseDown={handleBackdropClick}
    >
      <div className="card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Item</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs opacity-60 mb-1 block">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              placeholder="Rope (50ft)"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-60 mb-1 block">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs opacity-60 mb-1 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Item['category'] })}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              >
                <option value="misc">Misc</option>
                <option value="armor">Armor</option>
                <option value="consumable">Consumable</option>
                <option value="tool">Tool</option>
                <option value="treasure">Treasure</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs opacity-60 mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
              rows={3}
              placeholder="Optional description..."
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.equipped}
              onChange={(e) => setFormData({ ...formData, equipped: e.target.checked })}
              className="h-4 w-4"
            />
            Equipped
          </label>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="btn-primary flex-1">Add</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}


