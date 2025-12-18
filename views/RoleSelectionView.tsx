import React from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';
import { Card } from '../components/ui/Primitives';
import { Shield, Key, Clock, ArrowRight } from 'lucide-react';

interface RoleSelectionViewProps {
    onSelectRole: (role: UserRole) => void;
    connectedAddress?: string | null;
}

const RoleCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    role: UserRole;
    onClick: () => void;
}> = ({ title, description, icon, role, onClick }) => (
    <Card
        className="group cursor-pointer relative overflow-hidden border-white/5 hover:border-white/20"
        hoverEffect={true}
        onClick={onClick}
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <div className="flex flex-col h-full justify-between relative z-10">
            <div className="mb-4">
                <div className="p-3 bg-white/5 w-fit rounded-lg mb-4 text-primary group-hover:text-white group-hover:bg-white/10 transition-colors">
                    {icon}
                </div>
                <h3 className="text-xl font-light text-white mb-2">{title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{description}</p>
            </div>
            <div className="flex items-center text-xs text-secondary/50 group-hover:text-primary transition-colors">
                <span>Enter Dashboard</span> <ArrowRight className="w-3 h-3 ml-2" />
            </div>
        </div>
    </Card>
);

const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole, connectedAddress }) => {
    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen p-6 pt-24 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className={`w-2 h-2 rounded-full ${connectedAddress ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-mono text-stone-400">
                    {connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 'Connecting...'}
                </span>
            </div>

            <div className="text-center mb-12 space-y-4">
                <h2 className="text-3xl font-light text-white">Select Identity</h2>
                <p className="text-stone-400">Choose a dashboard to access with your connected wallet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <RoleCard
                        role={UserRole.OWNER}
                        title="Owner"
                        description="Configure protocol parameters, monitor liveliness, and prove life."
                        icon={<Key className="w-6 h-6" />}
                        onClick={() => onSelectRole(UserRole.OWNER)}
                    />
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <RoleCard
                        role={UserRole.GUARDIAN}
                        title="Guardian"
                        description="Monitor inactivity thresholds and verify protocol triggers."
                        icon={<Shield className="w-6 h-6" />}
                        onClick={() => onSelectRole(UserRole.GUARDIAN)}
                    />
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                    <RoleCard
                        role={UserRole.BENEFICIARY}
                        title="Beneficiary"
                        description="Monitor vesting schedules and claim assets."
                        icon={<Clock className="w-6 h-6" />}
                        onClick={() => onSelectRole(UserRole.BENEFICIARY)}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default RoleSelectionView;
