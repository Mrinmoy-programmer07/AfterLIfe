import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Progress, Badge, Dialog } from '../components/ui/Primitives';
import { ProtocolState, ProtocolContextType } from '../types';
import { Heart, Activity, UserPlus, Trash2 } from 'lucide-react';
import { formatDuration } from '../services/mockService';
import gsap from 'gsap';
import GuardianList from '../components/GuardianList';
import BeneficiaryList from '../components/BeneficiaryList';
import { useAfterLifeContract } from '../hooks/useAfterLifeContract';
import { useAccount } from 'wagmi';

const OwnerView: React.FC<{ context: ProtocolContextType }> = ({ context }) => {
  const { address } = useAccount();
  const [pulse, setPulse] = useState(false);
  const remainingTime = context.inactivityThreshold - (Date.now() - context.lastHeartbeat);
  const remainingPct = Math.max(0, (remainingTime / context.inactivityThreshold) * 100);

  // Contract Integration
  const {
    addGuardian: contractAddGuardian,
    removeGuardian: contractRemoveGuardian,
    addBeneficiary: contractAddBeneficiary,
    removeBeneficiary: contractRemoveBeneficiary,
    proveLife: contractProveLife,
    isLoading,
    error: contractError
  } = useAfterLifeContract();

  const handleRemoveGuardian = async (address: string) => {
    if (!confirm("Are you sure you want to remove this Guardian? This action is irreversible.")) return;
    try {
      await contractRemoveGuardian(address);
      alert("Removal transaction sent. The list will update shortly.");
    } catch (e) {
      console.error("Removal failed:", e);
      alert("Failed to remove guardian.");
    }
  };

  const handleRemoveBeneficiary = async (address: string) => {
    if (!confirm("Are you sure you want to remove this Beneficiary? This action is irreversible.")) return;
    try {
      await contractRemoveBeneficiary(address);
      alert("Removal transaction sent. The list will update shortly.");
    } catch (e) {
      console.error("Removal failed:", e);
      alert("Failed to remove beneficiary.");
    }
  };

  // Modal State
  const [isAddGuardianOpen, setIsAddGuardianOpen] = useState(false);
  const [isAddBeneficiaryOpen, setIsAddBeneficiaryOpen] = useState(false);

  // Form State
  const [newGuardian, setNewGuardian] = useState({ name: '', address: '' });
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    address: '',
    allocation: 0,
    vestingType: 'LINEAR',
    vestingDuration: 12 // Default 1 year
  });

  const handleProveLife = async () => {
    setPulse(true);
    const tl = gsap.timeline({ onComplete: () => setPulse(false) });
    tl.to(".temporal-ripple", { scale: 1.5, opacity: 0, duration: 0.8, ease: "power2.out" })
      .set(".temporal-ripple", { scale: 1, opacity: 1 });

    try {
      // Call actual contract
      await contractProveLife();
      // Also update local state for UI responsiveness
      context.proveLife();
    } catch (error) {
      console.error("Failed to prove life:", error);
      alert("Transaction failed. See console for details.");
    }
  };

  const submitGuardian = async () => {
    if (newGuardian.name && newGuardian.address) {
      try {
        // Call actual contract
        await contractAddGuardian(newGuardian.name, newGuardian.address);

        // Update local state for UI
        context.addGuardian({
          name: newGuardian.name,
          address: newGuardian.address,
          isConfirmed: false,
          lastActive: Date.now()
        });

        setNewGuardian({ name: '', address: '' });
        setIsAddGuardianOpen(false);
      } catch (error) {
        console.error("Failed to add guardian:", error);
        alert("Transaction failed. See console for details.");
      }
    }
  };

  const submitBeneficiary = async () => {
    if (newBeneficiary.name && newBeneficiary.address) {
      const currentTotal = context.beneficiaries.reduce((sum, b) => sum + b.allocation, 0);
      const available = 100 - currentTotal;

      // Clamp initial allocation to available budget
      const finalAllocation = Math.min(Number(newBeneficiary.allocation), available);

      try {
        // Convert allocation to basis points (100% = 10000)
        const allocationBps = Math.floor(finalAllocation * 100);

        // Convert vesting type to enum (0 = LINEAR, 1 = CLIFF)
        const vestingTypeEnum = newBeneficiary.vestingType === 'LINEAR' ? 0 : 1;

        // Convert duration from months to seconds
        const durationSeconds = newBeneficiary.vestingDuration * 30 * 24 * 60 * 60;

        // Call actual contract
        await contractAddBeneficiary(
          newBeneficiary.name,
          newBeneficiary.address,
          allocationBps,
          vestingTypeEnum,
          durationSeconds
        );

        // Update local state for UI
        context.addBeneficiary({
          name: newBeneficiary.name,
          address: newBeneficiary.address,
          allocation: finalAllocation,
          amountClaimed: '0 ETH',
          vestingType: newBeneficiary.vestingType as any,
          vestingDuration: durationSeconds
        });

        setNewBeneficiary({ name: '', address: '', allocation: 0, vestingType: 'LINEAR', vestingDuration: 12 });
        setIsAddBeneficiaryOpen(false);
      } catch (error) {
        console.error("Failed to add beneficiary:", error);
        alert("Transaction failed. See console for details.");
      }
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen p-6 pt-24 pb-12 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Visual Ripple Element */}
        {pulse && (
          <div className="temporal-ripple w-[300px] h-[300px] rounded-full border border-emerald-500/50 absolute" />
        )}
      </div>

      <header className="absolute top-8 left-8 flex items-center gap-3">
        <Badge variant="success">Active</Badge>
        <span className="text-sm text-secondary font-mono tracking-wider">
          OWNER: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "CONNECTING..."}
          <span className="ml-2 opacity-50">{useAfterLifeContract().publicClient?.chain?.name}</span>
        </span>
      </header>

      {/* Action Buttons Header */}


      <main className="w-full max-w-5xl space-y-8">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 w-full">
          <Button variant="outline" onClick={() => setIsAddGuardianOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Guardian
          </Button>
          <Button variant="outline" onClick={() => setIsAddBeneficiaryOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Beneficiary
          </Button>
        </div>

        {/* Central Monitor */}
        <Card className="p-8 border-stone-800 bg-stone-950/80 backdrop-blur-xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-light text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Vitality Monitor
              </h2>
              <p className="text-secondary text-sm mt-1">
                Continuous proof-of-life required to prevent state transition.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono text-white font-light tracking-tight">
                {formatDuration(remainingTime)}
              </div>
              <div className="text-xs text-stone-500 uppercase mt-1">Time to Inactivity</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-xs text-stone-400">
              <span>Vitality Strength</span>
              <span>{Math.floor(remainingPct)}%</span>
            </div>
            <Progress
              value={remainingPct}
              indicatorColor={remainingPct < 20 ? 'bg-amber-500' : 'bg-emerald-500'}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleProveLife}
              className="w-full py-6 text-lg tracking-widest uppercase border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-500"
              variant="outline"
            >
              <Heart className={`w-5 h-5 mr-2 ${pulse ? 'animate-ping' : ''}`} />
              Prove Life
            </Button>
          </div>
        </Card>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg text-white font-medium mb-4">Guardians</h3>
            <div className="space-y-3">
              {context.guardians.map(g => (
                <div key={g.id} className="bg-stone-800/40 p-3 rounded-lg flex items-center justify-between border border-stone-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${Date.now() - (g.lastActive || 0) < 60000 ? 'bg-emerald-500' : 'bg-stone-600'}`} />
                    <div>
                      <div className="text-white font-medium text-sm">{g.name}</div>
                      <div className="text-xs text-stone-500 font-mono">{g.address.slice(0, 6)}...{g.address.slice(-4)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Active</Badge>
                    <button onClick={() => handleRemoveGuardian(g.address)} className="text-stone-600 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg text-white font-medium mb-4">Beneficiaries</h3>
            <div className="space-y-3">
              {context.beneficiaries.map(b => (
                <div key={b.id} className="bg-stone-800/40 p-3 rounded-lg border border-stone-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium text-sm">{b.name}</div>
                      <div className="text-xs text-stone-500 font-mono">{b.address.slice(0, 6)}...{b.address.slice(-4)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{b.allocation}%</Badge>
                      <button onClick={() => handleRemoveBeneficiary(b.address)} className="text-stone-600 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full opacity-50"
                      style={{ width: `${b.allocation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Add Guardian Modal */}
      <Dialog isOpen={isAddGuardianOpen} onClose={() => setIsAddGuardianOpen(false)} title="Add Guardian">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-secondary uppercase">Guardian Name / Alias</label>
            <input
              type="text"
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-indigo-500 outline-none"
              value={newGuardian.name}
              onChange={e => setNewGuardian({ ...newGuardian, name: e.target.value })}
              placeholder="e.g. Alice"
            />
          </div>
          <div>
            <label className="text-xs text-secondary uppercase">Wallet Address</label>
            <input
              type="text"
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-indigo-500 outline-none font-mono text-sm"
              value={newGuardian.address}
              onChange={e => setNewGuardian({ ...newGuardian, address: e.target.value })}
              placeholder="0x..."
            />
          </div>
          <Button className="w-full mt-4" onClick={submitGuardian}>Confirm Entity</Button>
        </div>
      </Dialog>

      {/* Add Beneficiary Modal */}
      <Dialog isOpen={isAddBeneficiaryOpen} onClose={() => setIsAddBeneficiaryOpen(false)} title="Add Beneficiary">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-secondary uppercase">Beneficiary Name</label>
            <input
              type="text"
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-emerald-500 outline-none"
              value={newBeneficiary.name}
              onChange={e => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
              placeholder="e.g. Trust Fund"
            />
          </div>
          <div>
            <label className="text-xs text-secondary uppercase">Wallet Address</label>
            <input
              type="text"
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-emerald-500 outline-none font-mono text-sm"
              value={newBeneficiary.address}
              onChange={e => setNewBeneficiary({ ...newBeneficiary, address: e.target.value })}
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="text-xs text-secondary uppercase flex justify-between">
              <span>Initial Allocation (%)</span>
              <span className="text-stone-500">
                Available: {100 - context.beneficiaries.reduce((sum, b) => sum + b.allocation, 0)}%
              </span>
            </label>
            <input
              type="number"
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-emerald-500 outline-none"
              value={newBeneficiary.allocation}
              onChange={e => setNewBeneficiary({ ...newBeneficiary, allocation: Number(e.target.value) })}
              placeholder={`Max: ${100 - context.beneficiaries.reduce((sum, b) => sum + b.allocation, 0)}`}
              max={100 - context.beneficiaries.reduce((sum, b) => sum + b.allocation, 0)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary uppercase">Vesting Schedule</label>
              <select
                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-emerald-500 outline-none text-sm"
                value={newBeneficiary.vestingType}
                onChange={e => setNewBeneficiary({ ...newBeneficiary, vestingType: e.target.value as any })}
              >
                <option value="LINEAR">Linear Stream</option>
                <option value="CLIFF">Cliff Release</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary uppercase">Duration (Months)</label>
              <input
                type="number"
                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white mt-1 focus:border-emerald-500 outline-none"
                value={newBeneficiary.vestingDuration}
                onChange={e => setNewBeneficiary({ ...newBeneficiary, vestingDuration: Number(e.target.value) })}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <Button className="w-full mt-4 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10" onClick={submitBeneficiary}>Add Beneficiary</Button>
        </div>
      </Dialog>

    </motion.div>
  );
};

export default OwnerView;
