import React from 'react';
import { ThreatSceneModel } from '../../types';
import { Activity, Shield, MapPin, Radio, Clock, Navigation } from 'lucide-react';

interface FloatingCardsProps {
  threatModel: ThreatSceneModel;
  partnerMode?: boolean;
  isPaused?: boolean;
}

interface FloatingCardItem {
  id: string;
  label: string;
  value: string;
  icon: any;
  positionClass: string;
  color: 'cyan' | 'rose' | 'amber' | 'emerald' | 'purple';
  delay: string;
}

export const FloatingCards: React.FC<FloatingCardsProps> = ({
  threatModel,
  partnerMode = false,
  isPaused = false,
}) => {
  const cards: FloatingCardItem[] = partnerMode
    ? [
        {
          id: 'card-p1',
          label: 'L1 REVENUE',
          value: '25% TIER',
          icon: Activity,
          positionClass: 'top-[14%] left-[18%]',
          color: 'purple',
          delay: '0s',
        },
        {
          id: 'card-p2',
          label: 'NODES',
          value: '42 ACTIVE',
          icon: Radio,
          positionClass: 'top-[22%] right-[16%]',
          color: 'cyan',
          delay: '1.2s',
        },
        {
          id: 'card-p3',
          label: 'PAYOUTS',
          value: 'INSTANT UAH',
          icon: Shield,
          positionClass: 'bottom-[20%] left-[15%]',
          color: 'emerald',
          delay: '2.5s',
        },
        {
          id: 'card-p4',
          label: 'SYNC',
          value: 'L1/L2 MESH',
          icon: Navigation,
          positionClass: 'bottom-[18%] right-[19%]',
          color: 'purple',
          delay: '3.7s',
        },
      ]
    : [
        {
          id: 'card-1',
          label: 'LIVE STREAM',
          value: '24ms BROADCAST',
          icon: Radio,
          positionClass: 'top-[12%] left-[16%] sm:left-[22%]',
          color: 'cyan',
          delay: '0s',
        },
        {
          id: 'card-2',
          label: 'РИЗИК',
          value: threatModel.activeAlarmsCount > 0 ? 'ПІДВИЩЕНИЙ' : 'НОРМА',
          icon: Shield,
          positionClass: 'top-[16%] right-[15%] sm:right-[20%]',
          color: threatModel.activeAlarmsCount > 0 ? 'rose' : 'emerald',
          delay: '1.5s',
        },
        {
          id: 'card-3',
          label: 'ETA МІЙ РАЙОН',
          value: `${threatModel.myRegionStatus.etaMinutes || 18} ХВ`,
          icon: Clock,
          positionClass: 'bottom-[16%] right-[14%] sm:right-[22%]',
          color: 'amber',
          delay: '2.8s',
        },
        {
          id: 'card-4',
          label: 'УКРИТТЯ ПОБЛИЗУ',
          value: '340М · 4 ХВ',
          icon: MapPin,
          positionClass: 'bottom-[18%] left-[14%] sm:left-[20%]',
          color: 'emerald',
          delay: '4.1s',
        },
        {
          id: 'card-5',
          label: 'TRAJECTORY VECTORS',
          value: threatModel.primaryThreat ? `${threatModel.primaryThreat.speedKmh} км/год` : 'AZIMUTH 315°',
          icon: Navigation,
          positionClass: 'top-[44%] left-[4%]',
          color: 'cyan',
          delay: '0.8s',
        },
        {
          id: 'card-6',
          label: 'FRESHNESS',
          value: '100% REALTIME',
          icon: Activity,
          positionClass: 'top-[46%] right-[4%]',
          color: 'purple',
          delay: '3.2s',
        },
      ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorClasses = {
          cyan: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-cyan-950/50',
          rose: 'border-rose-500/30 bg-rose-950/40 text-rose-300 shadow-rose-950/50',
          amber: 'border-amber-500/30 bg-amber-950/40 text-amber-300 shadow-amber-950/50',
          emerald: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-emerald-950/50',
          purple: 'border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-purple-950/50',
        }[card.color];

        return (
          <div
            key={card.id}
            className={`absolute ${card.positionClass} hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-[10px] font-mono shadow-lg transition-all duration-700 opacity-80 hover:opacity-100 ${colorClasses} ${
              isPaused ? '' : 'animate-bounce'
            }`}
            style={{
              animationDuration: '6s',
              animationDelay: card.delay,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(-30px)',
            }}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 leading-none">{card.label}</span>
              <span className="font-bold text-slate-100 leading-tight">{card.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
