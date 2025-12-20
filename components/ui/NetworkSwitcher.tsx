import React from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { arbitrumSepolia, mantleSepoliaTestnet } from 'wagmi/chains';

const NetworkSwitcher: React.FC = () => {
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [isOpen, setIsOpen] = React.useState(false);

    const chains = [
        { id: arbitrumSepolia.id, name: 'Arbitrum Sepolia', color: 'bg-blue-500' },
        { id: mantleSepoliaTestnet.id, name: 'Mantle Sepolia', color: 'bg-teal-500' },
    ];

    const activeChain = chains.find(c => c.id === chainId) || { name: 'Unknown Network', color: 'bg-stone-500' };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-xs text-stone-300"
            >
                <div className={`w-2 h-2 rounded-full ${activeChain.color}`} />
                <span>{activeChain.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-stone-900 border border-white/10 rounded-lg overflow-hidden shadow-xl"
                    >
                        {chains.map((chain) => (
                            <button
                                key={chain.id}
                                onClick={() => {
                                    switchChain({ chainId: chain.id as any });
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm text-stone-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${chain.color}`} />
                                    {chain.name}
                                </div>
                                {chainId === chain.id && <Check className="w-3 h-3 text-emerald-500" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NetworkSwitcher;
