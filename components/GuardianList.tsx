import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import { Guardian } from '../types';
import { Card, Badge } from './ui/Primitives';

interface GuardianListProps {
    guardians: Guardian[];
}

const GuardianList: React.FC<GuardianListProps> = ({ guardians }) => {
    return (
        <Card className="bg-stone-900/40 p-6 h-full backdrop-blur-md border border-stone-800/50">
            <div className="flex items-center gap-2 mb-6 border-b border-stone-800 pb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-light text-white tracking-wide">Guardian Council</h3>
                <Badge variant={guardians.filter(g => g.isConfirmed).length >= 3 ? 'warning' : 'info'} className="ml-auto">
                    {guardians.filter(g => g.isConfirmed).length} / {guardians.length} Active
                </Badge>
            </div>

            <div className="space-y-4">
                {guardians.map((guardian, idx) => (
                    <motion.div
                        key={guardian.address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group flex items-center justify-between p-3 rounded-xl bg-stone-950/50 hover:bg-stone-900/80 transition-all border border-transparent hover:border-stone-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${guardian.isConfirmed ? 'bg-indigo-500/20 text-indigo-400' : 'bg-stone-800 text-stone-500'}`}>
                                <Shield className="w-5 h-5" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-stone-200">{guardian.name}</p>
                                <p className="text-xs text-stone-500 font-mono">{guardian.address}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            {guardian.isConfirmed ? (
                                <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3" />
                                    Confirmed Inactivity
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <CheckCircle className="w-3 h-3" />
                                    Monitoring
                                </span>
                            )}
                            <div className="text-[10px] text-stone-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last active: {guardian.lastActive ? new Date(guardian.lastActive).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

export default GuardianList;
