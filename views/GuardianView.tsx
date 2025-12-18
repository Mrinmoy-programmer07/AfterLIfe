import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '../components/ui/Primitives';
import { ProtocolContextType, ProtocolState } from '../types';
import { Eye, CheckCircle2, Lock } from 'lucide-react';

const GuardianView: React.FC<{ context: ProtocolContextType }> = ({ context }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const canConfirm = context.state === ProtocolState.WARNING || context.state === ProtocolState.PENDING;

    const handleConfirm = () => {
        setIsConfirming(true);
        setTimeout(() => {
            context.confirmInactivity();
            setIsConfirming(false);
        }, 2000);
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <header className="absolute top-8 left-8 flex items-center gap-3">
                <Badge variant="neutral">Guardian Node</Badge>
                <span className="text-sm text-secondary font-mono tracking-wider">OBSERVER MODE</span>
            </header>

            <main className="w-full max-w-xl space-y-6">
                <div className="text-center mb-8">
                    <Eye className="w-12 h-12 text-stone-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-light text-white mb-2">Protocol Observation</h1>
                    <p className="text-secondary">Verify owner inactivity. Your confirmation is irreversible.</p>
                </div>

                <Card className={`p-6 border-l-4 ${canConfirm ? 'border-l-amber-500' : 'border-l-stone-700'}`}>
                    <h3 className="text-lg text-white font-medium mb-4">Current Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-secondary">Protocol State</span>
                            <Badge variant={canConfirm ? 'warning' : 'success'}>{context.state}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-secondary">Owner Activity</span>
                            <span className="text-white font-mono">
                                {canConfirm ? 'SILENT' : 'DETECTED'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-secondary">Last Heartbeat</span>
                            <span className="text-stone-400 font-mono text-sm">
                                {new Date(context.lastHeartbeat).toLocaleString()}
                            </span>
                        </div>
                        {!canConfirm && (
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-secondary">Inactivity Timer</span>
                                <div className="text-right">
                                    <span className="text-emerald-400 font-mono font-bold">
                                        {((context.inactivityThreshold - (Date.now() - context.lastHeartbeat)) / 1000).toFixed(1)}s
                                    </span>
                                    <span className="text-xs text-stone-600 block">REMAINING</span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-secondary">Consensus</span>
                            <span className="text-white font-mono">1/3 Signatures</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 flex flex-col items-center text-center space-y-4">
                    <Lock className="w-8 h-8 text-stone-600" />
                    <p className="text-sm text-stone-400 max-w-xs">
                        {canConfirm
                            ? "Inactivity threshold reached. Confirm to initiate vesting protocol."
                            : "Owner is active. No action required."}
                    </p>
                    <Button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        isLoading={isConfirming}
                        variant={canConfirm ? "primary" : "outline"}
                        className={`w-full h-12 ${canConfirm ? 'hover:bg-amber-500/20 border-amber-500/40' : ''}`}
                    >
                        {canConfirm ? "Confirm Inactivity" : "System Normal"}
                    </Button>
                </Card>
            </main>
        </motion.div>
    );
};

export default GuardianView;
