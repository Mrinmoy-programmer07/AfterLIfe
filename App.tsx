import React, { useState, useEffect, useRef } from 'react';
import { ProtocolState, UserRole, ProtocolContextType, AssetState, ProtocolEvent, Guardian, Beneficiary } from './types';
import { INITIAL_ASSETS, INITIAL_GUARDIANS, INITIAL_BENEFICIARIES } from './services/mockService';
import TemporalScene from './components/TemporalScene';
import EntryView from './views/EntryView';
import RoleSelectionView from './views/RoleSelectionView';
import OwnerView from './views/OwnerView';
import GuardianView from './views/GuardianView';
import BeneficiaryView from './views/BeneficiaryView';
import { Button, Badge } from './components/ui/Primitives';
import { EventLog } from './components/ui/EventLog';
import { LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount, useDisconnect } from 'wagmi';
import { useAfterLifeContract } from './hooks/useAfterLifeContract';

const INACTIVITY_THRESHOLD_MS = 30000; // Fast for demo purposes (30s)

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [state, setState] = useState<ProtocolState>(ProtocolState.ACTIVE);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [vestingProgress, setVestingProgress] = useState(0);
  const [assets, setAssets] = useState<AssetState[]>(INITIAL_ASSETS);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Entity State
  const [guardians, setGuardians] = useState<Guardian[]>(INITIAL_GUARDIANS);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(INITIAL_BENEFICIARIES);

  // Event Log State
  const [events, setEvents] = useState<ProtocolEvent[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const previousState = useRef<ProtocolState>(ProtocolState.ACTIVE);

  const addEvent = (message: string, type: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    const newEvent: ProtocolEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    };
    setEvents(prev => [...prev, newEvent]);
  };

  // Initial Event
  useEffect(() => {
    addEvent('Protocol interface initialized. Monitoring started.', 'INFO');
  }, []);

  // Time Loop Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceHeartbeat = now - lastHeartbeat;

      setElapsedTime(now);

      // State Machine Logic
      if (state === ProtocolState.ACTIVE && timeSinceHeartbeat > INACTIVITY_THRESHOLD_MS * 0.7) {
        setState(ProtocolState.WARNING);
      }
      else if (state === ProtocolState.WARNING && timeSinceHeartbeat > INACTIVITY_THRESHOLD_MS) {
        setState(ProtocolState.PENDING);
      }
      else if (state === ProtocolState.ACTIVE && timeSinceHeartbeat <= INACTIVITY_THRESHOLD_MS * 0.7) {
        // Recover logic handles in proveLife
      }

      // Vesting Logic Simulation
      if (state === ProtocolState.EXECUTING) {
        setVestingProgress(prev => Math.min(prev + 0.5, 100));
        // Unlock assets for demo
        setAssets(prev => prev.map(a => {
          if (a.unlockDate > now && Math.random() > 0.95) {
            // Accelerate unlock for demo visual
            return { ...a, unlockDate: now - 1000 };
          }
          return a;
        }));
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [lastHeartbeat, state]);

  // Log State Changes
  useEffect(() => {
    if (previousState.current !== state) {
      let type: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
      if (state === 'WARNING') type = 'WARNING';
      if (state === 'PENDING') type = 'CRITICAL';
      if (state === 'EXECUTING') type = 'CRITICAL';

      addEvent(`Protocol state transition: ${previousState.current} -> ${state}`, type);
      previousState.current = state;
    }
  }, [state]);

  const proveLife = () => {
    setLastHeartbeat(Date.now());
    addEvent('Proof of life signal received. Clock reset.', 'INFO');
    if (state === ProtocolState.WARNING || state === ProtocolState.PENDING) {
      setState(ProtocolState.ACTIVE);
    }
  };

  const [vestingStartTime, setVestingStartTime] = useState<number | null>(null);

  // ... (previous state useEffects)

  // Vesting Logic Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedTime(now);

      // ... (StateMachine Logic)

      if (state === ProtocolState.EXECUTING && vestingStartTime) {
        // Demo Vesting: Use a fake "Total Duration" of 60 seconds for demo
        // In real app, this would use beneficiary.vestingDuration
        const demoVestingDuration = 60000;
        const elapsed = now - vestingStartTime;
        const progress = Math.min((elapsed / demoVestingDuration) * 100, 100);

        setVestingProgress(progress);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastHeartbeat, state, vestingStartTime]);

  const confirmInactivity = () => {
    addEvent('Guardian consensus reached. Inactivity confirmed.', 'CRITICAL');
    setState(ProtocolState.EXECUTING);
    setVestingStartTime(Date.now()); // Start the Vesting Clock
  };

  const addGuardian = (guardian: Guardian) => {
    setGuardians(prev => [...prev, guardian]);
    addEvent(`New guardian added: ${guardian.name}`, 'INFO');
  };

  const addBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaries(prev => [...prev, beneficiary]);
    addEvent(`New beneficiary added: ${beneficiary.name}`, 'INFO');
  };

  const updateBeneficiaryAllocation = (address: string, newAllocation: number) => {
    setBeneficiaries(prev => {
      const currentTotal = prev.reduce((sum, b) => sum + (b.address === address ? 0 : b.allocation), 0);
      const available = 100 - currentTotal;
      const clampedAllocation = Math.min(Math.max(0, newAllocation), available);

      return prev.map(b =>
        b.address === address ? { ...b, allocation: clampedAllocation } : b
      );
    });
  };

  const claimBeneficiaryShare = (address: string) => {
    if (state !== ProtocolState.EXECUTING) return;

    setBeneficiaries(prev => prev.map(b => {
      if (b.address.toLowerCase() !== address.toLowerCase()) return b;

      // Simple Demo Logic:
      // Total Share = b.allocation % of Total Pot (e.g. 100 ETH)
      // Vested % = vestingProgress
      // Claimable = (Total Share * Vested%) - Already Claimed
      // For MVP visual, we just set "Claimed" to the current Vested Amount string

      const totalShareEth = (100 * b.allocation) / 100; // Assuming 100 ETH Pot
      const vestedEth = (totalShareEth * vestingProgress) / 100;

      addEvent(`Beneficiary ${b.name} claimed ${vestedEth.toFixed(4)} ETH`, 'INFO');

      return {
        ...b,
        amountClaimed: `${vestedEth.toFixed(4)} ETH`
      };
    }));
  };

  const context: ProtocolContextType = {
    role,
    setRole,
    state,
    setState,
    lastHeartbeat,
    inactivityThreshold: INACTIVITY_THRESHOLD_MS,
    proveLife,
    confirmInactivity,
    assets,
    guardians,
    beneficiaries,
    addGuardian,
    addBeneficiary,
    updateBeneficiaryAllocation,
    claimBeneficiaryShare,
    vestingProgress,
    elapsedTime,
    events,
    addEvent
  };

  // Wallet & Routing
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  // Using the updated hook to read data
  const { getGuardians, getBeneficiaries, getProtocolState } = useAfterLifeContract();

  const [hasRegisteredOwner, setHasRegisteredOwner] = useState(false); // To bootstrap the first user as owner

  // Fetch Data from Blockchain on Connect
  useEffect(() => {
    if (isConnected) {
      const syncData = async () => {
        try {
          // 1. Fetch Entities
          const _guardians = await getGuardians();
          // Always update state (even if empty) to clear mock data on connection
          setGuardians(_guardians.map(g => ({
            name: g.name,
            address: g.address,
            isConfirmed: true, // If they are in the list, they are confirmed
            lastActive: Date.now() // Approximation
          })));

          const _beneficiaries = await getBeneficiaries();
          setBeneficiaries(_beneficiaries.map(b => ({
            name: b.name,
            address: b.address,
            allocation: b.allocation / 100, // Convert BPS to %
            amountClaimed: b.amountClaimed.toString(),
            vestingType: b.vestingType.toUpperCase() as any,
            vestingDuration: b.vestingDuration
          })));

          // 2. Fetch Protocol State (Heartbeat, etc)
          const protocolState = await getProtocolState();
          if (protocolState) {
            setLastHeartbeat(protocolState.lastHeartbeat);
            // Check if dead
            if (protocolState.isDead) {
              setState(ProtocolState.EXECUTING);
            } else {
              // Calculate local state based on heartbeat
              const now = Date.now();
              const elapsed = now - protocolState.lastHeartbeat;
              const threshold = protocolState.inactivityThreshold;

              if (elapsed > threshold) {
                setState(ProtocolState.PENDING);
              } else if (elapsed > threshold * 0.7) {
                setState(ProtocolState.WARNING);
              } else {
                setState(ProtocolState.ACTIVE);
              }
            }
            addEvent(`Synced Status. Heartbeat: ${new Date(protocolState.lastHeartbeat).toLocaleTimeString()}`, 'INFO');
          }
        } catch (err) {
          console.error("Sync Failed:", err);
        }
      };
      syncData();

      // Poll for updates every 15s to keep UI fresh
      const poll = setInterval(syncData, 15000);
      return () => clearInterval(poll);
    }
  }, [isConnected, address]);

  // Auto-Route removed. We now wait for user selection.

  const verifyAndSetRole = (selectedRole: UserRole) => {
    if (!address) return;
    const currentAddr = address.toLowerCase();

    if (selectedRole === UserRole.GUARDIAN) {
      const isAuthorized = guardians.some(g => g.address.toLowerCase() === currentAddr);
      if (isAuthorized) {
        setRole(UserRole.GUARDIAN);
        addEvent(`Guardian ${currentAddr.slice(0, 6)}... authenticated`, 'INFO');
      } else {
        addEvent(`Access Denied: ${currentAddr.slice(0, 6)}... is not a Guardian`, 'WARNING');
        alert("Access Denied: Your wallet address is not listed as a Guardian.");
      }
    }
    else if (selectedRole === UserRole.BENEFICIARY) {
      const isAuthorized = beneficiaries.some(b => b.address.toLowerCase() === currentAddr);
      if (isAuthorized) {
        setRole(UserRole.BENEFICIARY);
        addEvent(`Beneficiary ${currentAddr.slice(0, 6)}... authenticated`, 'INFO');
      } else {
        addEvent(`Access Denied: ${currentAddr.slice(0, 6)}... is not a Beneficiary`, 'WARNING');
        alert("Access Denied: Your wallet address is not listed as a Beneficiary.");
      }
    }
    else if (selectedRole === UserRole.OWNER) {
      // Multi-tenant: Check if this wallet is registered as an owner
      checkOwnerRegistration(currentAddr);
    }
  };

  // Multi-tenant owner registration check
  const { isOwner, register } = useAfterLifeContract();

  const checkOwnerRegistration = async (walletAddress: string) => {
    const registered = await isOwner(walletAddress);
    if (registered) {
      setRole(UserRole.OWNER);
      addEvent(`Owner Dashboard accessed by ${walletAddress.slice(0, 6)}...`, 'INFO');
    } else {
      // Prompt to register
      const shouldRegister = window.confirm(
        "You are not registered as a protocol owner yet. Would you like to register now?\n\n" +
        "This will create your own AfterLife protocol instance with a 30-day inactivity threshold."
      );
      if (shouldRegister) {
        try {
          addEvent('Registering new protocol owner...', 'INFO');
          await register(30 * 24 * 60 * 60); // 30 days in seconds
          setRole(UserRole.OWNER);
          addEvent(`Successfully registered! Welcome, ${walletAddress.slice(0, 6)}...`, 'INFO');
        } catch (err: any) {
          addEvent(`Registration failed: ${err.message}`, 'WARNING');
          alert("Registration failed. Please try again.");
        }
      }
    }
  };

  const renderView = () => {
    if (!isConnected) {
      return <EntryView />;
    }

    // If connected but no role selected/detected, show Selection View
    if (role === UserRole.NONE) {
      return <RoleSelectionView onSelectRole={verifyAndSetRole} connectedAddress={address} onDisconnect={disconnect} />;
    }

    switch (role) {
      case UserRole.OWNER:
        return <OwnerView context={context} />;
      case UserRole.GUARDIAN:
        return <GuardianView context={context} />;
      case UserRole.BENEFICIARY:
        return <BeneficiaryView context={context} />;
      default:
        return <div className="text-white text-center mt-20">Error: Unknown State</div>;
    }
  };

  // Determine Banner Style
  const getBannerVariant = () => {
    switch (state) {
      case 'WARNING': return 'warning';
      case 'PENDING': return 'critical';
      case 'EXECUTING': return 'info'; // Use info/indigo for execution
      default: return 'success';
    }
  };

  return (
    <>
      {/* 3D Background Layer */}
      <TemporalScene state={state} />

      {/* Global Message Banner */}
      <div className="absolute top-0 left-0 w-full flex justify-center pt-4 z-50 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <Badge variant={getBannerVariant()} className="shadow-2xl border-opacity-50 text-sm py-1 px-4 backdrop-blur-md">
              PROTOCOL STATE: {state}
            </Badge>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* UI Overlay Layer */}
      <div className="ui-layer">
        {/* Global Nav / Reset for Demo */}
        {role !== UserRole.NONE && (
          <div className="fixed top-6 right-6 z-40">
            <Button variant="ghost" onClick={() => setRole(UserRole.NONE)}>
              <LogOut className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          </div>
        )}

        {renderView()}
      </div>

      {/* Event Log & History Component */}
      <EventLog
        events={events}
        isOpen={isLogOpen}
        onToggle={() => setIsLogOpen(!isLogOpen)}
        currentState={state}
      />
    </>
  );
};

export default App;
